<?php
    
    global $mysqli,$path,$session,$route,$user,$app_settings;

    require_once "Modules/app/app_model.php";
    $appconfig = new AppConfig($mysqli, $app_settings);

    if ($route->action == "view") {
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
                      
            foreach ($applist as $name=>$appitem) {
                $menu['app'][] = array(
                    'title' => $name,
                    'text' => $name,
                    'path' => "app/view?name=".$name.$apikey
                );
            }
        }
    }

    $menu['category'][] = array(
        'li_class'=>'btn-li',
        'icon'=>'apps',
        'title'=> _("Apps"),
        'path'=> 'app/view',
        'active'=> 'app',
        'sort'=> 2
    );
