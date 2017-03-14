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
  
  background-color: #5abce5;
  color:#fff;
  text-align:left;
  
  transition: 0.5s; /* 0.5 second transition effect to slide in the sidenav */
  border-top:1px solid #219dd1;  
}

.sidenav_inner {
  /*box-sizing: border-box;*/
  padding-left: 20px;
  padding-top: 20px;
  width: 250px;
}

/* The navigation menu links */
.sidenav a {
  padding: 8px 8px 0px 10px;
  text-decoration: none;

  color: #fff;
  display: block;
  transition: 0.3s
}

/* When you mouse over the navigation links, change their color */
.sidenav a:hover, .offcanvas a:focus{
  color: #f1f1f1;
}
</style>

<!-- Side-bar navigation ----------------------------------------------------------------->
<div class="sidenav">
  <div class="sidenav_inner">
    <!--<img src="<?php echo $path; ?>files/emoncms_logo.png" style="width:200px;">-->

    <div id="appmenu"></div>
    <br><br>
    <b>My Apps</b><br>
    <a href="<?php echo $path; ?>app/house">House</a>
    <a href="<?php echo $path; ?>app/house2">House 2</a>
    <a href="<?php echo $path; ?>app/car">Car</a>
    <a href="<?php echo $path; ?>app/solar">Solar</a>
    <a href="<?php echo $path; ?>app/solardivert">Solar Divert</a>
    <a href="<?php echo $path; ?>app/airsource">Heatpump</a>
    <a href="<?php echo $path; ?>app/template">Template</a>
  </div>
</div>
