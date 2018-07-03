<?php
    global $path, $session, $user;
    $apikey = "";
    if ($session['write']) $apikey = "&readkey=".$user->get_apikey_read($session['userid']);
?>

<!-- Side-bar navigation -->
<div class="sidenav">
  <div class="sidenav_inner">
    
    <ul class="appmenu">
    <?php
    foreach ($applist as $name=>$appitem) {
        echo "<li><a href='".$path."app/view?name=".$name.$apikey."'>".$name."</a></li>";
    }
    ?>
    
    <li><a href="<?php echo $path; ?>app/new"><i class="icon-plus icon-white"></i> Add new app</a></li>
    </ul>
    
  </div>
</div>

<script>

var max_wrapper_width = 1150;

$("#app_menu").parent().attr("href","#");
$("#app_menu").find("i").removeClass("icon-leaf");
$("#app_menu").find("i").addClass("icon-list");

var sidebar_enabled = true;
var sidebar_visible = true;

sidebar_resize();

function sidebar_resize() {
    var width = $(window).width();
    var height = $(window).height();
    var nav = $(".navbar").height();
    $(".sidenav").height(height-nav);
    
    if (width<max_wrapper_width) {
        hide_sidebar()
    } else {
        if (sidebar_enabled) show_sidebar()
    }
}

$(window).resize(function(){
    sidebar_resize();
});

$("#app_menu").parent().click(function(){
    if (sidebar_visible) {
        sidebar_enabled = false;
        hide_sidebar();
    } else {
        sidebar_enabled = true;
        show_sidebar();
    }
});

function show_sidebar() {
    var width = $(window).width();
    sidebar_visible = true;
    $(".sidenav").css("left","250px");
    if (width>=max_wrapper_width) $("#wrapper").css("padding-left","250px");
    $("#wrapper").css("margin","0");
    $("#sidenav-open").hide();
    $("#sidenav-close").hide();
}

function hide_sidebar() {
    sidebar_visible = false;
    $(".sidenav").css("left","0");
    $("#wrapper").css("padding-left","0");
    $("#wrapper").css("margin","0 auto");
    $("#sidenav-open").show();
}

</script>
