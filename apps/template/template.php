<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>

<style>
.title {
   margin-top:40px;
   color:#aaa;
   font-weight:bold;
   font-size:32px;
   line-height:32px;
}
.value {
   color:#888;
   font-weight:bold;
   font-size:64px;
   line-height:64px;
}
</style>

<div id="app-block" style="display:none">
  <div class="col1"><div class="col1-inner">
  
    <div style="height:20px; border-bottom:1px solid #333; padding-bottom:8px;">
      <div style="float:right;">
        <i class="config-open icon-wrench icon-white" style="cursor:pointer; padding-right:5px;"></i>
      </div>
    </div>
    <div style="text-align:center">
      <div class="title">POWER NOW</div>
      <div class="value"><span id="powernow">0</span></div>
    </div>
  
  </div></div>
  
  <div id="graph" style="height:500px; width:100%;"></div>
 
  
</div>    

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Template</h2>
    <div class="app-config-description">
        <div class="app-config-description-inner">
            A basic app example useful for developing new apps
            
            <img src="<?php echo $path; ?><?php echo $appdir; ?>preview.png" style="width:600px" class="img-rounded">
        </div>
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
feed.apikey = apikey;

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
config.app = {
    "use":{"type":"feed", "autoname":"use", "engine":"5", "description":"House or building use in watts"}
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

config.init();

function init()
{   

}
    
function show()
{   
    $(".ajax-loader").hide();
    resize();
    updaterinst = setInterval(updater,5000);
    
    // Basic graph code
    
    // Time window
    view.end = +new Date;
    view.start = view.end - (3600000*24.0*7);
    // Calc interval
    view.calc_interval(800);
    // Fetch data
    data = feed.getdata(config.app.use.value,view.start,view.end,view.interval,1,0,0,0);
    // Graph options
    var options = {
        canvas: true,
        lines: { fill: true },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end }
    }
    // Draw graph
    $.plot($('#graph'), [{data:data}], options);
}
   
function updater()
{
    var use = config.app.use.value;
    feeds = feed.listbyid();
    $("#powernow").html((feeds[use].value*1).toFixed(1)+"W");
}

function resize() 
{
    updater();
}

function clear()
{
    clearInterval(updaterinst);
}

$(window).resize(function(){
    resize();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
