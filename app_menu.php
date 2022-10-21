<?php
    
global $mysqli,$session,$user,$app_settings;

if ($session["read"] || $session["public_userid"]) {

    require_once "Modules/app/app_model.php";
    $appconfig = new AppConfig($mysqli, $app_settings);

    // enable apikey read access
    $userid = false;
    if ($session['read']) {
        $userid = $session['userid'];
        $apikey = $user->get_apikey_read($session['userid']);
    } else if ($session["public_userid"]) {
        $userid = $session["public_userid"];
        $apikey = "";
    }
    
    //} else if (isset($_GET['readkey'])) {
    //    $apikey = $_GET['readkey'];
    //    $userid = $user->get_id_from_apikey($apikey);
    
    $l2 = array();
    
    if ($userid)
    {
        $apikey_str = "";
        if ($apikey) $apikey_str = '&readkey='.$apikey;
    
        $applist = $appconfig->get_list($userid);
        
        $_i = 0;
        foreach ($applist as $name=>$appitem) {
            $item = array(
                "name"=>$name,
                "href"=>"app/view?name=".urlencode($name).$apikey_str,
                "icon"=>"star_border", 
                "order"=>$_i
            );
            if ($session['public_userid']) {
                $item['href'] = $session['public_username']."/".$item["href"];   
                // Only show app if public       
                if (isset($appitem->config->public) && $appitem->config->public) {
                    $l2["$_i"] = $item;
                    $_i++;
                }
            } else {
                $l2["$_i"] = $item;
                $_i++;
            }
        }
    }
    
    if ($session["write"]) {
        $l2['new'] = array(
            "name"=>_('New'),
            "href"=>"app/new", 
            "icon"=>"plus", 
            "order"=>$_i
        );
    }
    
    // Level 1 top bar
    if (count($l2)) {
        $menu["app"] = array("name"=>"Apps", "order"=>2, "icon"=>"apps", "default"=>"app/view", "l2"=>$l2);
    }
}
