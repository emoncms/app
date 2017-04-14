<?php
global $path;
?>

<style>
/* ---------------------------------------------------------
 SIDEBAR
----------------------------------------------------------*/
 /* The side navigation menu */
.sidenav {

  width: 250px; /* 0 width - change this with JavaScript */
  height: 100%; /* 100% Full-height */
	overflow-x: hidden;
	overflow-y: auto;
  display: block;
  
  position: fixed; /* Stay in place */
  top: 40px;
  left: 0;
  z-index: 2; /* Stay on top */
  
  background-color: #333; /*#5abce5;*/
  color:#fff;
  text-align:left;
  
  transition: 0.5s; /* 0.5 second transition effect to slide in the sidenav */
  border-top:1px solid #219dd1;  
}

.sidenav_inner {
  /*box-sizing: border-box;*/

  width: 250px;
  padding-top:20px;
}

/* The navigation menu links */
.sidenav a {
  text-decoration: none;
  color: #fff;
  display: block;
  padding:15px;
  transition: 0.3s
  
}

/* When you mouse over the navigation links, change their color */
.sidenav a:hover, .offcanvas a:focus{
  color: #f1f1f1;
}

.appmenu {
  list-style: none;
  margin:0px;
  padding:0px;
}

.appmenu li {
}

.appmenu li:hover {
  background-color: #444;
}

</style>

<!-- Side-bar navigation ----------------------------------------------------------------->
<div class="sidenav">
  <div class="sidenav_inner">
    <!--<img src="<?php echo $path; ?>files/emoncms_logo.png" style="width:200px;">-->

    <ul class="appmenu">
    <?php
    foreach ($applist as $name=>$appitem) {
        echo "<li><a href='".$path."app/$name'>".$name."</a></li>";
    }
    ?>
    </ul>
    
  </div>
</div>
