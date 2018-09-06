<?php
    global $path;
?>

<!-- Side-bar navigation -->
<div class="sidenav notransition">
  <div class="sidenav-inner">
    <ul class="appmenu">
      <?php
      foreach ($apps as $name=>$app) {
          echo "<li class='appitem'><a href='".$path."app/view?name=".$name."'>".$name."</a></li>";
      }
      ?>
      <li><a href="<?php echo $path; ?>app/new"><i class="icon-plus icon-app-new"></i> Add new app</a></li>
    </ul>
  </div>
</div>

<script>

var max_wrapper_width = 1150;

var sidebar_enabled = "<?php echo $show; ?>";

sidebar_resize();

$("#app_menu").parent().attr("href","#");
$("#app_menu").find("i").removeClass("icon-leaf").addClass("icon-th-list");

function sidebar_resize() {
    var width = $(window).width();
    var height = $(window).height();
    var height_nav = $(".navbar").height();
    $(".sidenav").addClass('notransition').height(height-height_nav);
    
    if (width < max_wrapper_width) {
        sidebar_hide();
    } else if (sidebar_enabled) {
        sidebar_show();
    }
    // Disable transitions for 350ms, which is the defined slide-in period
    setTimeout(function() {
    	$(".sidenav").removeClass('notransition');
	}, 350);
}

$(window).resize(function(){
    sidebar_resize();
});

$("#app_menu").parent().click(function(){
    if (sidebar_enabled) {
        sidebar_hide();
    } else {
        sidebar_show();
    }
});

$(".appmenu .appitem").click(function(){
    sidebar_hide();
});

function sidebar_show() {
    var width = $(window).width();
    $(".sidenav").css("left","250px");
    $("#wrapper").css("margin","0");
    if (width>=max_wrapper_width) {
        $("#wrapper").css("padding-left","250px");
    }
    $("#sidenav-open").hide();
    $("#sidenav-close").hide();

    sidebar_enabled = true;
}

function sidebar_hide() {
    $(".sidenav").css("left","0");
    $("#wrapper").css("margin","0 auto");
    $("#wrapper").css("padding-left","0");
    $("#sidenav-open").show();

    sidebar_enabled = false;
}

</script>
