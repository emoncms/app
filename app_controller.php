<?php

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $session,$route,$mysqli;

    $result = false;
    
    include "Modules/app/AppConfig_model.php";
    $appconfig = new AppConfig($mysqli);

    if ($route->action == "") {
        $route->format = "html";
        $result = view("Modules/app/client.php",array());
    } else {
        $route->format = "json";
        
        if ($route->action == "setconfig" && $session['write']) 
            $result = $appconfig->set($session['userid'],get('data'));
            
        if ($route->action == "getconfig" && $session['read']) 
            $result = $appconfig->get($session['userid']);
        
        if ($route->action == "dataremote")
        {
            $id = (int) get("id");
            $start = (float) get("start");
            $end = (float) get("end");
            $interval = (int) get("interval");
            
            $result = json_decode(file_get_contents("http://emoncms.org/feed/data.json?id=$id&start=$start&end=$end&interval=$interval&skipmissing=0&limitinterval=0"));
        }
        
        if ($route->action == "valueremote")
        {
            $id = (int) get("id");
            $result = (float) json_decode(file_get_contents("http://emoncms.org/feed/value.json?id=$id"));
            $route->format = "text/plain";
        }
        
        if ($route->action == "ukgridremote")
        {
            $start = (float) get("start");
            $end = (float) get("end");
            $interval = (int) get("interval");
            $result = json_decode(file_get_contents("https://openenergymonitor.org/ukgrid/api.php?q=data&id=1&start=$start&end=$end&interval=$interval"));
        }
    }

    return array('content'=>$result, 'fullwidth'=>false);
}

