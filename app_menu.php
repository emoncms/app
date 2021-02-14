<?php
    
global $mysqli,$session,$user,$app_settings;

if ($session["write"]) {

    // Level 1 top bar
    $menu["app"] = array("name"=>"Apps", "order"=>2, "icon"=>"apps", "l2"=>array());

    require_once "Modules/app/app_model.php";
    $appconfig = new AppConfig($mysqli, $app_settings);

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
        $applist = $appconfig->get_list($userid);
        $_i = 0;
        foreach ($applist as $name=>$appitem) {
            $menu["app"]['l2']["$_i"] = array(
                "name"=>$name,
                "href"=>"app/view?name=".urlencode($name).'&apikey='.$apikey, 
                "icon"=>"apps", 
                "order"=>$_i
            );
            $_i++;
        }
    }
    
    $menu["app"]['l2']['new'] = array(
        "name"=>_('New'),
        "href"=>"app/new", 
        "icon"=>"plus", 
        "order"=>$_i
    );
    
}
