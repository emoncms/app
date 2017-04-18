<?php

    global $session, $user;
    
    
    $apikey = "";
    if ($session['write']) $apikey = "?readkey=".$user->get_apikey_read($session['userid']);
    
    $menu_left[] = array(
        'name'=>"Apps", 
        'path'=>"app#" , 
        'session'=>"write", 
        'order' => 5,
        'icon'=>'icon-leaf icon-white'
    );
    
    

