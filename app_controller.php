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
    global $mysqli,$path,$session,$route,$user,$settings,$v;
    // Force cache reload of css and javascript
    $v = 15;

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

    if ($route->action == "view") {
        // enable apikey read access
        $userid = false;
        if (isset($session['write']) && $session['write']) {
            $userid = $session['userid'];
            $apikey = $user->get_apikey_write($session['userid']);
        } else if (isset($_GET['readkey'])) {
            $apikey = $_GET['readkey'];
            $userid = $user->get_id_from_apikey($apikey);
        } else if (isset($_GET['apikey'])) {
            $apikey = $_GET['apikey'];
            $userid = $user->get_id_from_apikey($apikey);
        }
        
        if ($userid)
        {
            $applist = $appconfig->get_list($userid);
            
            if ($route->subaction) {
                $app = $route->subaction;
            } else {
                $app = urldecode(get("name"));
            }
            if (!isset($applist->$app)) {
                foreach (array_keys((array) $applist) as $key) { $app = $key; break; }
            }
            
            $route->format = "html";
            if ($app!=false) {
                $id = $applist->$app->app;
                if (isset($appavail[$id])) {
                    $dir = $appavail[$id]['dir'];
                    $config = $applist->$app->config;
                }
                else {
                    $id = 'blank';
                    $dir = "Modules/app/apps/blank/";
                    $config = new stdClass();
                }
            }
            
            $result = "\n<!-- global app css and js -->";
            $result .= "\n" . '<link href="' . $path . 'Modules/app/Views/css/app.css?v=' . $v . '" rel="stylesheet">';
            $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
            $result .= "\n\n <!-- app specific view -->\n";

            if ($app!=false) {
                $result .= view($dir.$id.".php",array("name"=>$app, "appdir"=>$dir, "config"=>$config, "apikey"=>$apikey));
            } else {
                $result .= view("Modules/app/Views/app_view.php",array("apps"=>$appavail));
            }
        }
    }
    else if ($route->action == "list" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->get_list($session['userid']);
    }
    else if ($route->action == "available" && $session['read']) {
        $route->format = "json";
        $result = $appavail;
    }
    else if ($route->action == "add" && $session['write']) {
        $route->format = "json";
        $appname = get("app");
        if (isset($appavail[$appname])) {
            $result = $appconfig->add($session['userid'],$appname,get("name"));
        } else {
            $result = "Invalid app";
        }
    }
    else if ($route->action == "new" && $session['write']) {
        $applist = $appconfig->get_list($session['userid']);
        $route->format = "html";
        $result .= "<link href='".$path."Modules/app/Views/css/app.css?v=".$v."' rel='stylesheet'>";
        $result .= view("Modules/app/Views/app_view.php", array("apps"=>$appavail));
    }
    else if ($route->action == "remove" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->remove($session['userid'],get("name"));
    }
    else if ($route->action == "setconfig" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->set_config($session['userid'],get('name'),get('config'));    
    }
    else if ($route->action == "getconfig" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->get_config($session['userid'],get('name'));
    }
    else if ($route->action == "dataremote") {
        $route->format = "json";
        $id = (int) get("id");
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $result = json_decode(file_get_contents("https://emoncms.org/feed/data.json?id=$id&start=$start&end=$end&interval=$interval&skipmissing=0&limitinterval=0"));
    }
    else if ($route->action == "valueremote") {
        $route->format = "json";
        $id = (int) get("id");
        $result = (float) json_decode(file_get_contents("https://emoncms.org/feed/value.json?id=$id"));
    }
    else if ($route->action == "ukgridremote") {
        $route->format = "json";
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $result = json_decode(file_get_contents("https://openenergymonitor.org/ukgrid/api.php?q=data&id=1&start=$start&end=$end&interval=$interval"));
    }

    return array('content'=>$result);
}
