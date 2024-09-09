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

function myheatpump_app_controller($route,$app,$appconfig,$apikey)
{
    global $path, $session, $settings, $mysqli, $redis;
    $v = 1;

    require_once "Modules/feed/feed_model.php";
    $settings['feed']['max_datapoints'] = 100000;
    $feed = new Feed($mysqli,$redis,$settings['feed']);
    require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_process.php";
    require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_model.php";
    $myheatpump = new MyHeatPump($mysqli,$redis,$feed,$appconfig);

    if ($route->action == "view" || $route->action == "") {
        $route->format = "html";
        $result = "\n<!-- global app css and js -->";
        $result .= "\n" . '<link href="' . $path . 'Modules/app/Views/css/app.css?v=' . $v . '" rel="stylesheet">';
        $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
        $result .= "\n\n <!-- app specific view -->\n";

        $dir = $appconfig->get_app_dir($app->app);
        $result .= view($dir.$app->app.".php",array("id"=>$app->id, "name"=>$app->name, "public"=>$app->public, "appdir"=>$dir, "config"=>$app->config, "apikey"=>$apikey));
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

    else if ($route->action == "getdailydatarange") {
        $route->format = "json";
        return $myheatpump->get_daily_range($app->id);
    }

    else if ($route->action == "getdailydata") {
        $route->format = "text";
        $start = (int) get('start',true);
        $end = (int) get('end',true);
        return $myheatpump->get_daily($app->id,$start,$end);
    }

    // Get totals
    else if ($route->action == "gettotals") {
        $route->format = "json";
        // Start and end time optional
        $start = (int) get('start',false,false);
        $end = (int) get('end',false,false);
        return $myheatpump->process_from_daily($app->id,$start,$end);
    }

    // Process daily data
    else if ($route->action == "processdaily") {
        $route->format = "json";
        $timeout = (int) get('timeout',false,1);
        return $myheatpump->process_daily($app->id,$timeout);
    }

    // Clear daily data
    else if ($route->action == "cleardaily") {
        $route->format = "json";
        $mysqli->query("DELETE FROM myheatpump_daily_stats WHERE `id`='".$app->id."'");
        return array("success"=>true);
    }

    // Clear last 60 days
    else if ($route->action == "clearlast60days") {
        $route->format = "json";
        $mysqli->query("DELETE FROM myheatpump_daily_stats WHERE `id`='".$app->id."' AND `timestamp`>='".(time()-60*24*3600)."'");
        return array("success"=>true);
    }

}