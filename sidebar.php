<?php
global $path;
?>

<!-- Side-bar navigation ----------------------------------------------------------------->
<div class="sidenav">
  <div class="sidenav_inner">
    <div id="sidebar-close"><i class="icon-remove icon-white"></i></div>
    <!--<img src="<?php echo $path; ?>files/emoncms_logo.png" style="width:200px;">-->
    
    <ul class="appmenu">
    <?php
    foreach ($applist as $name=>$appitem) {
        echo "<li><a href='".$path."app/".urlencode($name)."'>".$name."</a></li>";
    }
    ?>
    
    <li><a href="<?php echo $path; ?>app/new"><i class="icon-plus icon-white"></i> Add new app</a></li>
    </ul>
    
  </div>
</div>

<script>
sidebar_resize();

function sidebar_resize() {
    var width = $(window).width();
    var height = $(window).height();
    var nav = $(".navbar").height();
    $(".sidenav").height(height-nav-40);
    
    if (width<1024) {
        $(".sidenav").css("left","0");
        $("#wrapper").css("padding-left","0");
        $("#sidenav-open").show();
    } else {
        $(".sidenav").css("left","250px");
        $("#wrapper").css("padding-left","250px");
        $("#sidenav-open").hide();
        $("#sidenav-close").hide();
    }
}

$(window).resize(function(){
    sidebar_resize();
});

</script>
