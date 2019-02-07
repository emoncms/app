<ul class="sidenav-menu">
    <?php
    global $route, $path, $session, $user;
    $apikey = "";
    if ($session['write']) $apikey = "&readkey=".$user->get_apikey_read($session['userid']);
    
    foreach ($applist as $name=>$appitem) {
        echo $route->makeListLink($name,"app/view?name=".$name.$apikey);
    }
    ?>
</ul>
