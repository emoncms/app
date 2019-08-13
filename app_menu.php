<?php
    
global $mysqli,$path,$session,$route,$user,$app_settings;

if ($session["write"]) {

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
            $menu['sidebar']['apps'][] = array(
                'title' => $name,
                'text' => $name,
                'order'=> $_i,
                'path' => "app/view?name=".$name.'&apikey='.$apikey
            );
            $_i++;
        }
    }

    $menu['tabs'][] = array(
        'icon'=>'apps',
        'title'=> _("Apps"),
        'path'=> 'app/view',
        'order'=> 2,
        'data'=> array('sidebar' => '#sidebar_apps')
    );


    $menu['sidebar']['apps'][] = array(
        'text' => _('New'),
        'icon' => 'plus',
        'path' => 'app/new',
        'order'=> 99
    );

    // allow default app to show at `/app/view` - hidden menu item using css li_class
    $menu['sidebar']['apps'][] = array(
        'text' => _('View'),
        'path' => 'app/view',
        'li_class'=>'d-none',
        'order'=> 99
    );
    
}
