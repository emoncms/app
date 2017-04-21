<?php

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $path,$session,$route,$mysqli;

    $result = false;
    
    include "Modules/app/AppConfig_model.php";
    $appconfig = new AppConfig($mysqli);
    
    $available_apps = array (
        "myelectric"=>array(
            "title"=>"My Electric", 
            "description"=>"A simple electricity consumption app showing real-time power in Watts and daily consumption in kWh. Switch between energy and cost modes."
        ),
        "myelectric2"=>array(
            "title"=>"My Electric 2", 
            "description"=>"A slightly more in-depth version of the standard My Electric app with a daily kWh consumption graph which allows drilling down to see the power data for any selected day.<br>Household consumption can also be compared with the average UK household and ZeroCarbonBritain targets."
        ),
        "myheatpump"=>array(
            "title"=>"My Heatpump", 
            "description"=>"Explore heatpump performance: daily electricity consumption, heat output and COP. Zoom in for detailed temperature, power, heat graphs."
        ),
        "mysolarpv"=>array(
              "title"=>"My Solar", 
              "description"=>"Explore solar generation compared to household consumption"
        ),
        "mysolarpvdivert"=>array(
            "title"=>"My Solar Divert", 
            "description"=>"Explore solar generation compared to household consumption"
        ),
        "template"=>array(
            "title"=>"Template", 
            "description"=>"A basic app example useful for developing new apps"
        )       
    );
    
    // ------------------------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------------------------
    if ($route->action == "list" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->applist($session['userid']);
    }
    else if ($route->action == "add" && $session['write']) {
        $route->format = "json";
        $appname = get("app");
        if (isset($available_apps[$appname])) {
            $result = $appconfig->add($session['userid'],$appname,get("name"));
        } else {
            $result = "Invalid app";
        }
    }
    else if ($route->action == "remove" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->remove($session['userid'],get("name"));
    }
    else if ($route->action == "setconfig" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->setconfig($session['userid'],get('name'),get('config'));    
    } 
    else if ($route->action == "getconfig" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->getconfig($session['userid'],get('name'));
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
    else if ($route->action == "new") {
        $applist = $appconfig->applist($session['userid']);
        $route->format = "html";
        $result = "<link href='".$path."Modules/app/app.css' rel='stylesheet'>";
        $result .= "<div id='wrapper'>";
        $result .= view("Modules/app/sidebar.php",array("applist"=>$applist));
        $result .= view("Modules/app/list_view.php",array("available_apps"=>$available_apps));
        $result .= "</div>";
    }
    // ------------------------------------------------------------------------------------
    // APP LOAD
    // ------------------------------------------------------------------------------------
    else if ($session['read']) {
        $applist = $appconfig->applist($session['userid']);
        $userappname = $route->action;
        
        if (!isset($applist->$userappname)) {
            $userappname = key($applist);
        }
        
        $route->format = "html";
        if ($userappname!=false) {
            $app = $applist->$userappname->app;
            $config = $applist->$userappname->config;
        }
        $result = "<link href='".$path."Modules/app/app.css' rel='stylesheet'>";
        $result .= "<div id='wrapper'>";
        $result .= view("Modules/app/sidebar.php",array("applist"=>$applist));
        if ($userappname!=false) {
            $result .= view("Modules/app/apps/$app.php",array("config"=>$config));
        } else {
            $result .= view("Modules/app/list_view.php",array("available_apps"=>$available_apps));
        }
        $result .= "</div>";
    }

    global $fullwidth;
    $fullwidth = true;
    return array('content'=>$result, 'fullwidth'=>true);
}

