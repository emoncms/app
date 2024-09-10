<?php
/*
 All Emoncms code is released under the GNU Affero General Public License.
 See COPYRIGHT.txt and LICENSE.txt.
 
 ---------------------------------------------------------------------
 Emoncms - open source energy visualisation
 Part of the OpenEnergyMonitor project:
 http://openenergymonitor.org
 */

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $mysqli,$redis,$path,$session,$route,$user,$settings,$v;
    // Force cache reload of css and javascript
    $v = 36;

    $result = false;

    // Apps can be hidden from the settings object e.g:
    // [app]
    // hidden = template
    
    if (isset($settings['app'])) {
        if (isset($settings['app']['hidden'])) {
            $settings['app']['hidden'] = explode(",",$settings['app']['hidden']);
        }
    } else {
        $settings['app'] = array(
        // 'hidden'=>array('template')
        );
    }

    require_once "Modules/app/app_model.php";
    $appconfig = new AppConfig($mysqli, $settings['app']);

    // --------------------------------------------------------------
    // Non app specific routes (requires read or write access)
    // --------------------------------------------------------------

    if ($route->action == "list" && $session['read']) {
        $route->format = "json";
        return $appconfig->get_list($session['userid']);
    }

    // List of available apps json
    else if ($route->action == "available" && $session['read']) {
        $route->format = "json";
        return $appconfig->get_available();
    }

    // List of available apps view
    else if ($route->action == "new" && $session['write']) {
        $applist = $appconfig->get_list($session['userid']);
        $route->format = "html";
        $result .= "<link href='".$path."Modules/app/Views/css/app.css?v=".$v."' rel='stylesheet'>";
        $appavail = $appconfig->get_available();
        $result .= view("Modules/app/Views/app_view.php", array("apps"=>$appavail));
        return $result;
    }

    // Add and remove apps
    else if ($route->action == "add" && $session['write']) {
        $route->format = "json";
        $appname = get("app");
        $appavail = $appconfig->get_available();
        if (isset($appavail[$appname])) {
            return $appconfig->add($session['userid'],$appname,get("name"));
        } else {
            return "Invalid app";
        }
    }
    else if ($route->action == "remove" && $session['write']) {
        $route->format = "json";
        return $appconfig->remove($session['userid'],get("id"));
    }

    // Update app name, public flag or config
    else if ($route->action == "setname" && $session['write']) {
        $route->format = "json";
        return $appconfig->set_name($session['userid'],get('id'),get('name'));
    }
    else if ($route->action == "setpublic" && $session['write']) {
        $route->format = "json";
        return $appconfig->set_public($session['userid'],get('id'),get('public'));
    }
    else if ($route->action == "setconfig" && $session['write']) {
        $route->format = "json";
        return $appconfig->set_config($session['userid'],get('id'),get('config'));    
    }

    // --------------------------------------------------------------

    else if ($route->action == "octopus-feed-list") {
        $route->format = "json";
        return json_decode(file_get_contents("http://emoncms.org/octopus/feed/list.json"));
    }
    else if ($route->action == "dataremote") {
        $route->format = "json";

        if (isset($_GET['id'])) {
            $id_str = "id=".intval($_GET['id']);
        } else if (isset($_GET['ids'])) {
            // validate csv of ids - must be integers
            $ids = explode(",",$_GET['ids']);
            $ids = array_map('intval', $ids);
            $id_str = "ids=".implode(",",$ids);
        } else {
            return array('success'=>false, 'message'=>'Missing id or ids');
        }
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $average = (int) get("average",false,0);
        $delta = (int) get("delta",false,0);
        $skipmissing = (int) get("skipmissing",false,0);
        $limitinterval = (int) get("limitinterval",false,0);
        $timeformat = get('timeformat',false,'unixms');
        $dp = (int) get('dp',false,-1);
        
        if (!in_array($timeformat,array("unix","unixms","excel","iso8601","notime"))) {
            return array('success'=>false, 'message'=>'Invalid time format');
        }
        
        //if ($result = $redis->get("app:cache:$id-$start-$end-$interval-$average-$delta")) {
        //    return json_decode($result);
        //} else {
        $result = file_get_contents("http://emoncms.org/feed/data.json?$id_str&start=$start&end=$end&interval=$interval&average=$average&delta=$delta&skipmissing=$skipmissing&limitinterval=$limitinterval&timeformat=$timeformat&dp=$dp");
        //$redis->set("app:cache:$id-$start-$end-$interval-$average-$delta",$result);
        return json_decode($result);
        //}

    }
    else if ($route->action == "valueremote") {
        $route->format = "json";
        $id = (int) get("id");
        return (float) json_decode(file_get_contents("https://emoncms.org/feed/value.json?id=$id"));
    }
    else if ($route->action == "ukgridremote") {
        $route->format = "json";
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        return json_decode(file_get_contents("https://openenergymonitor.org/ukgrid/api.php?q=data&id=1&start=$start&end=$end&interval=$interval"));
    }

    // --------------------------------------------------------------
    // App specific routes
    // --------------------------------------------------------------
    // Find user and app 
    // - if read access is enabled then use the session userid
    // - if readkey is provided then use the user id associated with the readkey
    // - if public_userid is set then use the public_userid
    // --------------------------------------------------------------
    $userid = false;
    $public = false;
    $apikey = "";
    $app_name = "";
    $app = false;
    
    // 1. Check if read access is enabled
    if (isset($session['read']) && $session['read']) {
        $userid = $session['userid'];
        if (isset($_GET['apikey'])) {
            // fetch the apikey from the database instead of using the one provided in the url
            $apikey = $user->get_apikey_read($session['userid']);
        }
    // 2. Check if readkey is provided
    } else if (isset($_GET['readkey'])) {
        if ($userid = $user->get_id_from_apikey($_GET['readkey'])) {
            $apikey = $user->get_apikey_read($userid);      
        }
    // 3. Check if public_userid is set
    } else if ($session['public_userid']) {
        $userid = (int) $session['public_userid'];
        $public = true;
    }

    // Apps can be accessed by name or by id
    
    // If we have a userid then we can get the app
    if ($userid)
    {            
        if ($route->subaction) {
            $app_name = $route->subaction;
        } else {
            $app_name = urldecode(get("name",false,false));
        }
        $app = $appconfig->get_app_or_default($userid,$app_name,$public);
    }

    // If we have an id then we can get the app
    if (isset($_GET['id'])) {
        $app = $appconfig->get_app_by_id($_GET['id']);

        // If public mode is enabled then check if the app is public
        if ($public) {
            if (!$app->public) {
                $app = false;
            }
        // If public mode is not enabled then check if the app belongs to the user
        // and is not listed as public
        } else {
            if ($app->userid != $userid && !$app->public) {
                $app = false;
            }
        }
    }

    if (!$app) {
        if ($route->action == "view" || $route->action == "") {
            return ""; // redirects to login
        } else {
            return array("success"=>false, "message"=>"invalid app or permissions");
        }
    }

    // Check if the app has a specific controller
    // e.g. myheatpump/myheatpump_controller.php
    $app_controller_file = "Modules/app/apps/OpenEnergyMonitor/".$app->app."/".$app->app."_controller.php";
    if (file_exists($app_controller_file)) {
        require_once $app_controller_file;
        $controller = $app->app."_app_controller";
        return $controller($route,$app,$appconfig,$apikey);
    }

    // Generic app's
    else if ($route->action == "view" || $route->action == "") {
        $route->format = "html";
        $result = "\n<!-- global app css and js -->";
        $result .= "\n" . '<link href="' . $path . 'Modules/app/Views/css/app.css?v=' . $v . '" rel="stylesheet">';
        $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
        $result .= "\n\n <!-- app specific view -->\n";

        $dir = $appconfig->get_app_dir($app->app);
        $result .= view($dir.$app->app.".php",array(
            "id"=>$app->id,
            "name"=>$app_name,
            "public"=>$app->public,
            "appdir"=>$dir, 
            "config"=>$app->config, 
            "apikey"=>$apikey
        ));
        return $result;
    }
    else if ($route->action == "getconfig") {
        $route->format = "json";
        return $app;
    }

    return array('content'=>EMPTY_ROUTE);
}
