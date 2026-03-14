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

function mysolarpvbattery_app_controller($route,$app,$appconfig,$apikey)
{

    global $path, $session, $settings, $mysqli, $redis, $user, $linked_modules_dir;
    $v = 2;

    // ----------------------------------------------------
    // Main app view route
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // Trigger post-processor route
    // ----------------------------------------------------
    else if ($route->action == "process" && $session['write']) {
        $route->format = "json";
        $userid = $session['userid'];

        require_once "Modules/feed/feed_model.php";
        $feed = new Feed($mysqli,$redis,$settings['feed']);

        include "Modules/postprocess/postprocess_model.php";
        $postprocess = new PostProcess($mysqli, $redis, $feed);
        $processes = $postprocess->get_processes("$linked_modules_dir/postprocess");
        $process_classes = $postprocess->get_process_classes();

        $clear_solarbatterykwh = false;
        $solarbatterykwh_config = (object) array(
            // Input feeds
            "solar" => $feed->get_id($userid, "solar"),
            "use" => $feed->get_id($userid, "use"),
            "grid" => $feed->get_id($userid, "grid"),
            "battery_power" => $feed->get_id($userid, "battery_power"),

            // Output kWh flow feeds
            "solar_to_load_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "solar_to_load_kwh", 10, $clear_solarbatterykwh),
            "solar_to_grid_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "solar_to_grid_kwh", 10, $clear_solarbatterykwh),
            "solar_to_battery_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "solar_to_battery_kwh", 10, $clear_solarbatterykwh),
            "battery_to_load_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "battery_to_load_kwh", 10, $clear_solarbatterykwh),
            "battery_to_grid_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "battery_to_grid_kwh", 10, $clear_solarbatterykwh),
            "grid_to_load_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "grid_to_load_kwh", 10, $clear_solarbatterykwh),
            "grid_to_battery_kwh" => get_or_create_feed($feed, $userid, "solarbatterykwh", "grid_to_battery_kwh", 10, $clear_solarbatterykwh),

            // Control params
            "process_mode" => "all",
            "process_start" => 0,
            "process" => "solarbatterykwh"
        );

        return $process_classes[$solarbatterykwh_config->process]->process($solarbatterykwh_config);
    }
}

function get_or_create_feed($feed, $userid, $node, $feedname, $interval, $clear = false) {

    $feedid = $feed->exists_tag_name($userid, $node, $feedname);
    if (!$feedid) {
        $meta = new stdClass();
        $meta->interval = $interval;
        $result = $feed->create($userid, $node, $feedname, 5, $meta);
        if ($result['success']) {
            $feedid = $result['feedid'];
        }
    }
    
    if ($clear) {
    	$feed->clear($feedid);
    }
    
    return $feedid;
}