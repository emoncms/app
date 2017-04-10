<?php

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $session,$route,$mysqli;

    $result = false;
    
    include "Modules/app/AppConfig_model.php";
    $appconfig = new AppConfig($mysqli);

    $tmpdb = array(
      "house2"=>array("name"=>"Main House", "app"=>"myelectric2", "config"=>array()), 
      "house"=>array("name"=>"House", "app"=>"myelectric", "config"=>array()), 
      "solar"=>array("name"=>"My Solar", "app"=>"mysolarpv", "config"=>array()),
      "solardivert"=>array("name"=>"My Solar divert", "app"=>"mysolarpvdivert", "config"=>array("use"=>"142685","use_kwh"=>"142693","solar"=>"142685","solar_kwh"=>"142693","divert"=>"142685","divert_kwh"=>"142693","import_kwh"=>"142693")),
      "car"=>array("name"=>"Nissan Leaf", "app"=>"myelectric", "config"=>array("use"=>"142685","use_kwh"=>"142693","unitcost"=>"0.12")),
      "airsource"=>array("name"=>"Air-source Heatpump", "app"=>"myheatpump", "config"=>array("heatpump_elec"=>142685,"heatpump_elec_kwh"=>142693)),
      "template"=>array("name"=>"Template", "app"=>"template", "config"=>array())
    );

    // ------------------------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------------------------
    if ($route->action == "setconfig" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->set($session['userid'],get('data'));    
    } 
    else if ($route->action == "getconfig" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->get($session['userid']);
    }
    else if ($route->action == "dataremote") {
        $route->format = "json";
        $id = (int) get("id");
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $result = json_decode(file_get_contents("http://emoncms.org/feed/data.json?id=$id&start=$start&end=$end&interval=$interval&skipmissing=0&limitinterval=0"));
    }
    else if ($route->action == "valueremote") {
        $route->format = "json";
        $id = (int) get("id");
        $result = (float) json_decode(file_get_contents("http://emoncms.org/feed/value.json?id=$id"));
        $route->format = "text/plain";
    }
    else if ($route->action == "ukgridremote") {
        $route->format = "json";
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $result = json_decode(file_get_contents("https://openenergymonitor.org/ukgrid/api.php?q=data&id=1&start=$start&end=$end&interval=$interval"));
    }
    // ------------------------------------------------------------------------------------
    // APP LOAD
    // ------------------------------------------------------------------------------------
    else if ($route->action!="") {
        $userappname = $route->action;
        if (isset($tmpdb[$userappname])) {
            $route->format = "html";
            $app = $tmpdb[$userappname]["app"];
            $config = $tmpdb[$userappname]["config"];
            
            $result = view("Modules/app/sidebar.php",array("menu"=>$tmpdb));
            $result .= view("Modules/app/apps/$app.php",array("config"=>$config));
        }
    }

    return array('content'=>$result, 'fullwidth'=>true);
}

