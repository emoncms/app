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
    $v = 19; // version number for cache busting of js and css

    // ----------------------------------------------------
    // Main app view route
    // ----------------------------------------------------
    if ($route->action == "view" || $route->action == "") {
        $route->format = "html";
        $result = "\n<!-- global app js -->";
        $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . $v . '"></script>';
        $result .= "\n\n <!-- app specific view -->\n";

        $dir = $appconfig->get_app_dir($app->app);
        $result .= view($dir.$app->app.".php",array(
            "id"=>$app->id, 
            "name"=>$app->name, 
            "public"=>$app->public, 
            "appdir"=>$dir, 
            "config"=>$app->config, 
            "apikey"=>$apikey,
            "v"=>$v
        ));
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

        if (!isset($app->config->autogenerate_nodename)) {
            return array("success"=>false, "message"=>"Feed node name not set");
        }
        $tag = $app->config->autogenerate_nodename;
        
        $process_conf = (object) array(
            "solar"               => (int) isset($app->config->solar) ? $app->config->solar : 0,
            "use"                 => (int) isset($app->config->use) ? $app->config->use : 0,
            "grid"                => (int) isset($app->config->grid) ? $app->config->grid : 0,
            "battery"             => (int) isset($app->config->battery) ? $app->config->battery : 0,

            "solar_to_load_kwh"    => $feed->exists_tag_name($userid, $tag, "solar_to_load_kwh"),
            "solar_to_grid_kwh"    => $feed->exists_tag_name($userid, $tag, "solar_to_grid_kwh"),
            "solar_to_battery_kwh" => $feed->exists_tag_name($userid, $tag, "solar_to_battery_kwh"),
            "battery_to_load_kwh"  => $feed->exists_tag_name($userid, $tag, "battery_to_load_kwh"),
            "battery_to_grid_kwh"  => $feed->exists_tag_name($userid, $tag, "battery_to_grid_kwh"),
            "grid_to_load_kwh"     => $feed->exists_tag_name($userid, $tag, "grid_to_load_kwh"),
            "grid_to_battery_kwh"  => $feed->exists_tag_name($userid, $tag, "grid_to_battery_kwh"),

            // For testing
            // "solar_kwh"            => $feed->exists_tag_name($userid, $tag, "solar_kwh"),

            "process_mode"  => "all",
            "process_start" => 0,
            "process"       => "solarbatterykwh"
        );

        // capture and silence any internal prints
        ob_start();
        $result = $process_classes[$process_conf->process]->process($process_conf);
        ob_end_clean();
        return $result;
    }
}
