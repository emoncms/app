<?php

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function app_controller()
{
    global $path,$session,$route,$mysqli,$user;

    $result = false;
    
    include "Modules/app/available_apps.php";
    include "Modules/app/AppConfig_model.php";
    $appconfig = new AppConfig($mysqli,$available_apps);
    
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
    }
    else if ($route->action == "ukgridremote") {
        $route->format = "json";
        $start = (float) get("start");
        $end = (float) get("end");
        $interval = (int) get("interval");
        $result = json_decode(file_get_contents("https://openenergymonitor.org/ukgrid/api.php?q=data&id=1&start=$start&end=$end&interval=$interval"));
    }
    else if ($route->action == "new" && $session['write']) {
        $applist = $appconfig->applist($session['userid']);
        $route->format = "html";
        $result = "<link href='".$path."Modules/app/css/pagenav.css?v=1' rel='stylesheet'>";
        $result .= "<div id='wrapper'>";
        $result .= view("Modules/app/sidebar.php",array("applist"=>$applist));
        $result .= view("Modules/app/list_view.php",array("available_apps"=>$available_apps));
        $result .= "</div>";
    }
    // ------------------------------------------------------------------------------------
    // APP LOAD
    // ------------------------------------------------------------------------------------
    
    else if ($route->action == "view") {
    
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
            $applist = $appconfig->applist($userid);
            $userappname = get("name");
            
            if (!isset($applist->$userappname)) {
                foreach ($applist as $key=>$val) { $userappname = $key; break; }
            }
            
            $route->format = "html";
            if ($userappname!=false) {
                $app = $applist->$userappname->app;
                $config = $applist->$userappname->config;
            }
            
            $result = "<link href='".$path."Modules/app/css/pagenav.css?v=1' rel='stylesheet'>";
            $result .= "<div id='wrapper'>";
            if ($session['write']) $result .= view("Modules/app/sidebar.php",array("applist"=>$applist));
            if ($userappname!=false) {
                if (!file_exists("Modules/app/apps/$app.php")) $app = "blank";
                $result .= view("Modules/app/apps/$app.php",array("name"=>$userappname, "config"=>$config, "apikey"=>$apikey));
            } else {
                $result .= view("Modules/app/list_view.php",array("available_apps"=>$available_apps));
            }
            $result .= "</div>";
        }
    }

    global $fullwidth;
    $fullwidth = true;
    return array('content'=>$result, 'fullwidth'=>true);
}

