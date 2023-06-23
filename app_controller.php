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
    $v = 28;

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
    $appavail = $appconfig->get_available();

    if ($route->action == "view" || $route->action == "") {
        // enable apikey read access
        $userid = false;
        $public = false;
        $apikey = "";
        
        if (isset($session['read']) && $session['read']) {
            $userid = $session['userid'];
            if (isset($_GET['apikey'])) {
                $apikey = $user->get_apikey_read($session['userid']);
            }
        } else if (isset($_GET['readkey'])) {
            if ($userid = $user->get_id_from_apikey($_GET['readkey'])) {
                $apikey = $user->get_apikey_read($userid);      
            }
        } else if ($session['public_userid']) {
            $userid = (int) $session['public_userid'];
            $public = true;
        }
        
        if ($userid)
        {            
            if ($route->subaction) {
                $app_name = $route->subaction;
            } else {
                $app_name = urldecode(get("name",false,false));
            }
            $app = $appconfig->get_app_or_default($userid,$app_name,$public);
            
            $route->format = "html";
            $result = "\n<!-- global app css and js -->";
            $result .= "\n" . '<link href="' . $path . 'Modules/app/Views/css/app.css?v=' . $v . '" rel="stylesheet">';
            $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
            $result .= "\n\n <!-- app specific view -->\n";

            if ($app!=false) {
                $dir = $appconfig->get_app_dir($app->app);
                $result .= view($dir.$app->app.".php",array("name"=>$app_name, "appdir"=>$dir, "config"=>$app->config, "apikey"=>$apikey));
            } else if (!$public) {
                $result .= view("Modules/app/Views/app_view.php",array("apps"=>$appavail));
            } else {
                return ""; // redirects to login
            }
            return $result;
        } else {
            return ""; // redirects to login
        }
    }
    else if ($route->action == "getconfig") {

        // enable apikey read access
        $userid = false;
        $public = false;
        $apikey = "";
        
        if (isset($session['read']) && $session['read']) {
            $userid = $session['userid'];
        } else if (isset($_GET['readkey'])) {
            $userid = $user->get_id_from_apikey($_GET['readkey']);
        } else if ($session['public_userid']) {
            $userid = (int) $session['public_userid'];
            $public = true;
        }
    
        $route->format = "json";
        $app_name = urldecode(get("name",false,false));
        $app = $appconfig->get_app_or_default($userid,$app_name,$public);
        if ($app!=false) {
            return $app;
        } else {
            return array("success"=>false, "message"=>"invalid app or permissions");
        }
    }
    else if ($route->action == "getstats") {

        // enable apikey read access
        $userid = false;
        $public = false;
        $apikey = "";
        
        if (isset($session['read']) && $session['read']) {
            $userid = $session['userid'];
        } else if (isset($_GET['readkey'])) {
            $userid = $user->get_id_from_apikey($_GET['readkey']);
        } else if ($session['public_userid']) {
            $userid = (int) $session['public_userid'];
            $public = true;
        }
    
        $route->format = "json";
        $app_name = urldecode(get("name",false,false));
        $app = $appconfig->get_app_or_default($userid,$app_name,$public);
        
        if ($app!=false) {
        
            if ($app->app=="myheatpump") {
                $start = get('start',false);
                $end = get('end',false);
                $startingpower = get('startingpower',false,100);
                
                require_once "Modules/feed/feed_model.php";
                $settings['feed']['max_datapoints'] = 100000;
                $feed = new Feed($mysqli,$redis,$settings['feed']);
                require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_api.php";
                return get_heatpump_stats($feed,$app,$start,$end,$startingpower*1);
            }
        
            return $app;
        } else {
            return array("success"=>false, "message"=>"invalid app or permissions");
        }
    }
    else if ($route->action == "list" && $session['read']) {
        $route->format = "json";
        return $appconfig->get_list($session['userid']);
    }
    else if ($route->action == "available" && $session['read']) {
        $route->format = "json";
        return $appavail;
    }
    else if ($route->action == "add" && $session['write']) {
        $route->format = "json";
        $appname = get("app");
        if (isset($appavail[$appname])) {
            return $appconfig->add($session['userid'],$appname,get("name"));
        } else {
            return "Invalid app";
        }
    }
    else if ($route->action == "new" && $session['write']) {
        $applist = $appconfig->get_list($session['userid']);
        $route->format = "html";
        $result .= "<link href='".$path."Modules/app/Views/css/app.css?v=".$v."' rel='stylesheet'>";
        $result .= view("Modules/app/Views/app_view.php", array("apps"=>$appavail));
        return $result;
    }
    else if ($route->action == "remove" && $session['write']) {
        $route->format = "json";
        return $appconfig->remove($session['userid'],get("name"));
    }
    else if ($route->action == "setconfig" && $session['write']) {
        $route->format = "json";
        return $appconfig->set_config($session['userid'],get('name'),get('config'));    
    }
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

    return array('content'=>EMPTY_ROUTE);
}
