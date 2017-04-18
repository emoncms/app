<?php

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $path,$session,$route,$mysqli;

    $result = false;
    
    include "Modules/app/AppConfig_model.php";
    $appconfig = new AppConfig($mysqli);
    
    // ------------------------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------------------------
    if ($route->action == "list" && $session['read']) {
        $route->format = "json";
        $result = $appconfig->applist($session['userid']);
    }
    else if ($route->action == "add" && $session['write']) {
        $route->format = "json";
        $result = $appconfig->add($session['userid'],get("app"),get("name"));
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
    // ------------------------------------------------------------------------------------
    // APP LOAD
    // ------------------------------------------------------------------------------------
    else if ($route->action!="" && $session['read']) {
        $applist = $appconfig->applist($session['userid']);
        $userappname = $route->action;
        if (isset($applist->$userappname)) {
            $route->format = "html";
            $app = $applist->$userappname->app;
            $config = $applist->$userappname->config;
            
            $result = "<link href='".$path."Modules/app/app.css' rel='stylesheet'>";
            $result .= "<div id='wrapper'>";
            $result .= view("Modules/app/sidebar.php",array("applist"=>$applist));
            $result .= view("Modules/app/apps/$app.php",array("config"=>$config));
            $result .= "</div>";
        }
    }

    global $fullwidth;
    $fullwidth = true;
    return array('content'=>$result, 'fullwidth'=>true);
}

