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

function myelectricflow_app_controller($route,$app,$appconfig,$apikey)
{

    global $path, $session, $settings, $mysqli, $redis, $user, $linked_modules_dir;
    $v = 21; // version number for cache busting of js and css

    // ----------------------------------------------------
    // Main app view route
    // ----------------------------------------------------
    if ($route->action == "view" || $route->action == "") {
        $route->format = "html";
        $result = "\n<!-- global app js -->";
        $result .= "\n" . '<script src="' . $path . 'Modules/app/Views/js/app.js?v=' . filemtime("Modules/app/Views/js/app.js") . '"></script>';
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
    else if ($route->action == "process" && $session['read']) {
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

        // Feed id for an input, 0 if not set, disabled or derived
        $input = function($key) use ($app) {
            $value = isset($app->config->$key) ? $app->config->$key : 0;
            return is_numeric($value) ? (int) $value : 0;
        };
        // Solar and battery default to on when not set, as in the app
        $has_solar = !isset($app->config->has_solar) || $app->config->has_solar;
        $has_battery = !isset($app->config->has_battery) || $app->config->has_battery;

        $solar = $has_solar ? $input("solar") : 0;
        $battery = $has_battery ? $input("battery") : 0;
        $use = $input("use");
        $grid = $input("grid");
        // Consumption only: use and grid are the same, send use only
        if (!$has_solar && !$has_battery && $use) $grid = 0;

        // Output feed id, false when not used in this mode
        $output = function($name, $used) use ($feed, $userid, $tag) {
            return $used ? $feed->exists_tag_name($userid, $tag, $name) : false;
        };

        $process_conf = (object) array(
            "solar"               => $solar,
            "use"                 => $use,
            "grid"                => $grid,
            "battery"             => $battery,

            "strategy"            => isset($app->config->strategy) ? $app->config->strategy : "Solar first",

            "solar_to_load_kwh"    => $output("solar_to_load_kwh", $has_solar),
            "solar_to_grid_kwh"    => $output("solar_to_grid_kwh", $has_solar),
            "solar_to_battery_kwh" => $output("solar_to_battery_kwh", $has_solar && $has_battery),
            "battery_to_load_kwh"  => $output("battery_to_load_kwh", $has_battery),
            "battery_to_grid_kwh"  => $output("battery_to_grid_kwh", $has_battery),
            "grid_to_load_kwh"     => $output("grid_to_load_kwh", true),
            "grid_to_battery_kwh"  => $output("grid_to_battery_kwh", $has_battery),

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
