<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<div id="app-block" style="display:none">
  <div style="height:20px; border-bottom:1px solid #333; padding:8px;">
    <div style="float:right;">
      <i class="config-open icon-wrench icon-white" style="cursor:pointer"></i>
    </div>
  </div>
  <div style="text-align:center">
    <div class="electric-title">Oops something went wrong, this app does not exist!</div>
  </div>
</div>

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Oops something went wrong, this app does not exist!</h2>
    <div class="app-config-description">
    <div class="app-config-description-inner">You can delete this entry on the right</div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;

apikeystr = ""; 
if (apikey!="") apikeystr = "&apikey="+apikey;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
config.init();

function init()
{   

}
    
function show()
{   
    $(".ajax-loader").hide();
}
   
function updater()
{

}

function resize() 
{

}

function clear()
{

}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
