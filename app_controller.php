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
    $v = 30;

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
    else if ($route->action == "available" && $session['read']) {
        $route->format = "json";
        return $appconfig->get_available();
    }
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
    else if ($route->action == "new" && $session['write']) {
        $applist = $appconfig->get_list($session['userid']);
        $route->format = "html";
        $result .= "<link href='".$path."Modules/app/Views/css/app.css?v=".$v."' rel='stylesheet'>";
        $appavail = $appconfig->get_available();
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

    if (!$app) {
        if ($route->action == "view" || $route->action == "") {
            return ""; // redirects to login
        } else {
            return array("success"=>false, "message"=>"invalid app or permissions");
        }
    }

    if ($route->action == "view" || $route->action == "") {
        $route->format = "html";
        $result = "\n<!-- global app css and js -->";
        $result .= "\n" . '<link href="' . $path . 'Modules/app/Views/css/app.css?v=' . $v . '" rel="stylesheet">';
        $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
        $result .= "\n\n <!-- app specific view -->\n";

        $dir = $appconfig->get_app_dir($app->app);
        $result .= view($dir.$app->app.".php",array("name"=>$app_name, "appdir"=>$dir, "config"=>$app->config, "apikey"=>$apikey));
        return $result;
    }
    else if ($route->action == "getconfig") {
        $route->format = "json";
        return $app;
    }
    else if ($route->action == "getconfigmeta") {
        
        $result = array();
        $result["feeds"] = array();
        
        $result["start_date"] = 0;
        
        if (isset($app->config)) {
        
            if (isset($app->config->start_date)) {
                $result["start_date"] = (int) $app->config->start_date;
            }
        
            $feeds = array(
                "heatpump_elec",
                "heatpump_elec_kwh",
                "heatpump_heat", 
                "heatpump_heat_kwh", 
                "heatpump_flowT",
                "heatpump_returnT",
                "heatpump_flowrate",
                "heatpump_roomT",
                "heatpump_outsideT",
                "heatpump_dhw",
                "heatpump_ch",
                "heatpump_targetT"
            );

            require_once "Modules/feed/feed_model.php";
            $feed = new Feed($mysqli,$redis,$settings['feed']);

            foreach ($feeds as $feed_name) {
                if (isset($app->config->$feed_name)) {
                    $feedid = (int) $app->config->$feed_name;
                    
                    if (!$feedid) continue;
                    
                    $feed_meta = array();
                    $meta = $feed->get_meta($feedid);
                    
                    $feed_meta['feedid'] = $feedid;
                    
                    if (isset($meta->start_time)) {
                        $feed_meta['start_time'] = $meta->start_time;
                    }
                    
                    if (isset($meta->end_time)) {
                        $feed_meta['end_time'] = $meta->end_time;
                    }

                    if (isset($meta->interval)) {
                        $feed_meta['interval'] = $meta->interval;
                    }

                    if (isset($meta->npoints)) {
                        $feed_meta['npoints'] = $meta->npoints;
                    }
                    
                    $result["feeds"][$feed_name] = $feed_meta;
                }
            }
        }
        return $result;
    }
    else if ($route->action == "getstats" || $route->action == "getstats2" || $route->action == "getdaily" || $route->action == "datastart") {

        $route->format = "json";
    
        if ($app->app=="myheatpump") {
            
            if (isset($_GET['start']) && isset($_GET['end'])) {
                $start = (int) $_GET['start'];
                $end = (int) $_GET['end'];
            } else if (isset($_GET['day'])) {
                $date = new DateTime($_GET['day']);
                $date->setTimezone(new DateTimeZone("Europe/London"));
                $date->modify("midnight");
                $start = $date->getTimestamp();
                $date->modify("+1 day");
                $end = $date->getTimestamp();
            } else if (isset($_GET['month'])) {
                $date = new DateTime($_GET['month']);
                $date->setTimezone(new DateTimeZone("Europe/London"));
                $date->modify("midnight");
                $start = $date->getTimestamp();
                $date->modify("+1 month");
                $end = $date->getTimestamp();
            } else {
                $start = null;
                $end = null;
            }
                                
            $startingpower = get('startingpower',false,100);
            
            require_once "Modules/feed/feed_model.php";
            $settings['feed']['max_datapoints'] = 100000;
            $feed = new Feed($mysqli,$redis,$settings['feed']);
            
            if ($route->action == "getstats2" || $route->action == "getdaily" || $route->action == "datastart") {
                require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_api2.php";
            } else {
                require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_api.php";   
            }
            
            if ($route->action == "datastart") {
                $route->format = "json";
                $result = array("start"=>0, "end"=>0);
                if (isset($app->config->heatpump_elec)) {
                    $meta = $feed->get_meta($app->config->heatpump_elec);
                    $result['start'] = $meta->start_time;
                    $result['end'] = $meta->end_time;
                }
                if (isset($app->config->heatpump_heat)) {
                    $meta = $feed->get_meta($app->config->heatpump_heat);
                    if ($meta->start_time>$result['start']) $result['start'] = $meta->start_time;
                    if ($meta->end_time<$result['end']) $result['end'] = $meta->end_time;
                }
                if (isset($app->config->start_date) && $app->config->start_date>$result['start']) {
                    $result['start'] = $app->config->start_date*1;
                }
                if ($result['start']==0) $result['start'] = false;
                if ($result['end']==0) $result['end'] = false;
                return $result;
            }
            
            if ($route->action == "getdaily") {
                $route->format = "text";
                return get_daily_stats($feed,$app,$start,$end,$startingpower*1);
            }
            
            return get_heatpump_stats($feed,$app,$start,$end,$startingpower*1);
        }
    
        return $app;
    }

    return array('content'=>EMPTY_ROUTE);
}
