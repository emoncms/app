<?php
$domain = "messages";
bindtextdomain($domain, dirname(__FILE__)."/locale");
global $session, $user;
$apikey = "";
$lang = substr($user->get_lang($session['userid']),0,2);
/*

Check  if language file exist;, otherwise force to use en

*/
if (!file_exists( dirname(__FILE__)."/locale_js/app_".$lang.'.js')) {
    $lang= 'en';
}

if ($session['write']) $apikey = "?lang=".$lang."&apikey=".$user->get_apikey_write($session['userid']);
    $menu_left[] = array(
        'name'=>dgettext($domain,"Apps"),
        'path'=>"app/mysolarpv" ,
        'session'=>"write",
        'order' => 5,
        'icon'=>'icon-leaf icon-white',
        'dropdown'=>array(

            array('name' => dgettext($domain,'My Electric'), 'icon' => '', 'path' => "app$apikey#myelectric", 'session' => 'read', 'order' => 1),
            array('name' => dgettext($domain,'My Solar'), 'icon' => '', 'path' => "app$apikey#mysolarpv", 'session' => 'read', 'order' => 2),
            array('name' => dgettext($domain,'My Heatpump'), 'icon' => '', 'path' => "app$apikey#myheatpump", 'session' => 'read', 'order' => 3),
            array('name' => dgettext($domain,'My Solar&amp;Wind'), 'icon' => '','path' => "app$apikey#myenergy", 'session' => 'read', 'order' => 4)

        )
    );
