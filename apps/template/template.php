<?php
    global $path, $session;
    $v = 7;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/data.js?v=<?php echo $v; ?>"></script>

<div id="app-container" style="display:none">
  <div class="col1"><div class="col1-inner">
  
    <div style="height:20px; border-bottom:1px solid #333; padding-bottom:8px;">
      <div style="float:right;">
        <i class="config icon-wrench icon-white" style="cursor:pointer; padding-right:5px;"></i>
      </div>
    </div>
    <div style="text-align:center">
      <div class="electric-title">POWER NOW</div>
      <div class="power-value"><span id="powernow">0</span></div>
    </div>
  
  </div></div>
</div>    

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Template</h2>
    <div class="app-config-description">
        <div class="app-config-description-inner">
            A basic app example useful for developing new apps
            
            <img src="<?php echo $path; echo $appdir; ?>preview.png" style="width:600px" class="img-rounded">
        </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var path = "<?php print $path; ?>";
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
if (!sessionwrite) $(".app-setup").hide();

var feed = new Feed(apikey);

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use": {
        "type": "feed", 
        "class": "power",
        "autoname": "use", 
        "engine": "2,5,6", 
        "description": "House or building use in watts"
    }
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.getList();

config.initapp = function() {
    init();
};
config.showapp = function() {
    show();
};
config.hideapp = function() {
    clear();
};

// ----------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------
config.init();

function init() {
    // Initialize the data cache
    data.init(feed, config);
}

function show() {
    $(".ajax-loader").hide();
    
    resize();
    updateTimer = setInterval(update, 5000);
}

function update() {
    // Asynchronously update all configured "power" and "energy" feeds
    data.update(function(result) {

        $("#powernow").html(result.getLatestValue("use").toFixed(1)+"W");
    });
}

function resize() {
    update();
}

function clear() {
    clearInterval(updateTimer);
}

$(window).resize(function() {
    resize();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function appLog(level, message) {
    if (level == "ERROR") {
        alert(level + ": " + message);
    }
    console.log(level + ": " + message);
}

</script>
