<?php
    global $path, $session;
    $v = 5;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 
    
<div id="app-container" style="display:none" class="block">

  <div class="col1"><div class="col1-inner">

    <div style="height:20px; border-bottom:1px solid #333; padding-bottom:8px;">
        <div style="float:right;">
            <!--<span style="color:#fff; margin-right:10px" >Settings</span>-->
            <i class="config icon-wrench icon-white" style="cursor:pointer; padding-right:5px"></i>
        </div>
    </div>

    <table style="width:100%">
    <tr>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title">HOUSE</div>
            <div class="power-value" style="color:#82cbfc"><span class="housenow">0</span>W</div>
        </td>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title">DIVERT</div>
            <div class="power-value" style="color:#fb7b50"><span class="divertnow">0</span>W</div>
        </td>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title">TOTAL USE</div>
            <div class="power-value" style="color:#0598fa"><span class="usenow">0</span>W</div>
        </td>
    </tr>
    <tr>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title"><span class="balance-label"></span></div>
            <div class="power-value"><span class="balance"></span></div>
        </td>
        <td style="border:0; width:33%">
        </td>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title"><span class="generationtitle">SOLAR</span></div>
            <div class="power-value" style="color:#dccc1f"><span class="generationnow">0</span>W</div>
        </td>
    </tr>
    </table>

    <br>
    
    <div class="visnavblock" style="height:28px; padding-bottom:5px;">
        <div class="powergraph-navigation">
            <span class="visnav time" time='1'>1h</span>
            <span class="visnav time" time='8'>8h</span>
            <span class="visnav time" time='24'>D</span>
            <span class="vistimeW visnav time" time='168'>W</span>
            <span class="vistimeM visnav time" time='720'>M</span>
            <span class="vistimeY visnav time" time='8760'>Y</span>
            <span id='zoomin' class='visnav' >+</span>
            <span id='zoomout' class='visnav' >-</span>
            <span id='left' class='visnav' ><</span>
            <span id='right' class='visnav' >></span>
        </div>
        
        <div class="bargraph-navigation" style="display:none">
            <span class="bargraph-viewall visnav" style="font-size:14px">VIEW ALL</span>
            <!--
            <span class="bargraph-viewdaily visnav" style="font-size:14px">DAILY</span>
            <span class="bargraph-viewmonthly visnav" style="font-size:14px">MONTHLY</span>
            <span class="bargraph-viewannually visnav" style="font-size:14px">ANNUALLY</span>
            -->
        </div>
        
        <span class="visnav viewhistory" style="float:right; font-size:14px">VIEW HISTORY</span>
        <span class="visnav balanceline" style="float:right; font-size:14px">SHOW BALANCE</span>
    </div>

    <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
    </div>
    
    <br>
    
<style type="text/css">
.statstable {
    width: 100%;
    border-spacing: 10px;
    border-collapse: separate;
}

.statsbox {
    width: 25%;
    text-align: center;
    vertical-align: middle;
}

.statsbox-inner-unit {
    color: #333;
}

.statsbox-padded {
    padding: 10px;
}

.statsbox-inner-arrow {
    color: #999;
}

.statsbox-title {
    font-weight: bold;
    font-size: 20px;
    padding-bottom: 15px;
}

.statsbox-value {
    font-weight: bold;
    font-size: 36px;
}

.statsbox-units {
    font-weight: bold;
    font-size: 16px;
}

.statsbox-prc {
    font-weight: normal;
    font-size: 16px;
}

.statsbox-arrow-down {
    position: relative;
    margin-bottom: 16px;
}

.statsbox-arrow-down:after {
    top: 100%;
    left: 50%;
    border: solid transparent;
    content: " ";
    width: 0; 
    height: 0; 
    position: absolute;
    pointer-events: none;
    border-top-color: #999;
    border-width: 16px;
    margin-left: -16px;
}

.statsbox-arrow-right {
    position: relative;
    margin-right: 16px;
}

.statsbox-arrow-right:after {
  left: 100%;
  top: 50%;
  border: solid transparent;
  content: " ";
  width: 0; 
  height: 0; 
  position: absolute;
  pointer-events: none;
  border-left-color: #999;
  border-width: 16px;
  margin-top: -16px;
}

.tooltip-item {
}

.tooltip-title {
  color: #aaa;
  font-weight:bold;
  font-size:12px;
}

.tooltip-value {
  color: #fff;
  font-weight:bold;
  font-size:14px;
}

.tooltip-units {
  color: #fff;
  font-weight:bold;
  font-size:10px;
}
</style>
    
    <table class="statstable">
    
    <tr>
        <td class="statsbox" colspan="2">
            <div class="statsbox-inner-unit" style="background: #dccc1f">
                <div class="statsbox-padded" style="position: relative;">
                    <div class="statsbox-title"><span class="generationtitle">SOLAR</span></div>
                    <div><span class="statsbox-value total_generated_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                    <div style="position: absolute; width: 50%; left: 0%; bottom: 0%">
                        <span class="statsbox-prc divert_total_generated_prc">0</span>
                    </div>
                    <div style="position: absolute; width: 50%; left: 50%; bottom: 0%">
                        <span class="statsbox-prc house_generated_total_generated_prc">0</span>
                    </div>
                    <div style="position: absolute; height: 100%; right: 0%; top: 0%">
                        <div style="display: table; height: 100%; border-spacing: 0px;">
                        <div style="display: table-cell; vertical-align: middle;">
                        <span class="statsbox-prc total_export_prc">0</span>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </td>
        
        <td class="statsbox">
            <div class="statsbox-inner-arrow">
                <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_export_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>

        <td class="statsbox">
            <div class="statsbox-padded statsbox-inner-unit" style="background: #d52e2e">
                <div class="statsbox-title">GRID</div>
                <div><span class="statsbox-value total_grid_balance_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>
    </tr>
    
    <tr>
        <td class="statsbox">
            <div class="statsbox-inner-arrow">
                <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_divert_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>
        
        <td class="statsbox">
            <div class="statsbox-inner-arrow">
                <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_house_generated_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>

        <td class="statsbox">
        </td>
        
        <td class="statsbox">
            <div class="statsbox-inner-arrow">
                <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_import_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>
    </tr>
    
    <tr>
        <td class="statsbox">
            <div class="statsbox-padded statsbox-inner-unit" style="background: #fb7b50">
                <div class="statsbox-title">DIVERT</div>
                <div><span class="statsbox-value total_divert_kwh">0</span> <span class="statsbox-units">kWh</span></div>
            </div>
        </td>
        
        <td class="statsbox" colspan="3">
            <div class="statsbox-inner-unit" style="background: #82cbfc">
                <div class="statsbox-padded" style="position: relative;">
                    <div class="statsbox-title">HOUSE</div>
                    <div><span class="statsbox-value total_house_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                    <div style="position: absolute; width: 33.33333%; left: 0%; top: 0%">
                        <div><span class="statsbox-prc house_generated_house_use_prc">0</span></div>
                    </div>
                    <div style="position: absolute; width: 33.33333%; left: 66.66667%; top: 0%">
                        <div><span class="statsbox-prc total_import_prc">0</span></div>
                    </div>
                </div>
            </div>
        </td>
    </tr>
    
    </table>
  </div></div>
  
</div>

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title" style="color:#dccc1f">My Solar Divert</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        The My Solar with Divert app can be used to explore onsite solar (and optionally wind) generation, self consumption, export and building consumption. It is designed for users who divert some or all of their excess generated power to something. For example an immersion heater or electric car. It shows all of this both in realtime with a moving power graph view and historically with a daily and monthly bargraph.
        <br><br>
        <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
        <br><br>
        <b>Cumulative kWh</b> feeds can be generated from power feeds with the power_to_kwh input processor.
        <br><br>
        <img src="../Modules/app/images/mysolar_app.png" style="width:600px" class="img-rounded">
      </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>

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
    "use":{"type":"feed", "autoname":"use", "engine":"5", "description":"House or building use in watts"},
    "solar":{"type":"feed", "autoname":"solar", "engine":"5", "description":"Solar pv generation in watts"},
    "wind":{"optional":true, "type":"feed", "autoname":"wind", "engine":"5", "description":"Wind generation in watts"},
    "divert":{"type":"feed", "autoname":"divert", "engine":"5", "description":"Immersion usage in watts"},
    //"export":{"type":"feed", "autoname":"export", "engine":5, "description":"Exported solar in watts"},
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "engine":5, "description":"Cumulative solar generation in kWh"},
    "wind_kwh":{"optional":true, "type":"feed", "autoname":"wind_kwh", "engine":5, "description":"Cumulative wind generation in kWh"},
    "divert_kwh":{"optional":true, "type":"feed", "autoname":"divert_kwh", "engine":5, "description":"Cumulative divert usage in kWh"},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "engine":5, "description":"Cumulative grid import in kWh"},
    //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
}
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.getList();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------
var feeds = {};

var updateTimer = false;
var show_balance_line = 0;
var has_wind = false;
var reload = true;
var autoupdate = true;
var lastupdate = 0;
var viewmode = "powergraph";
var historyseries = [];
var powerseries = [];
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;

config.init();

// App start function
function init()
{        
    appLog("INFO", "mysolarpvdivert init");

    var timeWindow = (3600000*6.0*1);
    view.end = +new Date;
    view.start = view.end - timeWindow;
    
    if (config.app.wind.value) {
        has_wind = true;
        $(".generationtitle").html("GENERATION");
    } else {
        $(".generationtitle").html("SOLAR");
    }
    
    if (config.app.divert_kwh.value && 
        config.app.solar_kwh.value && 
        config.app.use_kwh.value && 
        config.app.import_kwh.value &&
        (!has_wind || config.app.wind_kwh.value))
    {
        console.log("INIT BARGRAPH");
        init_bargraph();
        $(".viewhistory").show();
    } else {
        $(".viewhistory").hide();
    }
    
    // The first view is the powergraph, we load the events for the power graph here.
    if (viewmode=="powergraph") powergraph_events();
    
    // The buttons for these powergraph events are hidden when in historic mode 
    // The events are loaded at the start here and dont need to be unbinded and binded again.
    $("#zoomout").click(function () {view.zoomout(); reload = true; autoupdate = false; draw();});
    $("#zoomin").click(function () {view.zoomin(); reload = true; autoupdate = false; draw();});
    $('#right').click(function () {view.panright(); reload = true; autoupdate = false; draw();});
    $('#left').click(function () {view.panleft(); reload = true; autoupdate = false; draw();});
    
    $('.time').click(function () {
        view.timewindow($(this).attr("time")/24.0); 
        reload = true; 
        autoupdate = true;
        draw();
    });
    
    $(".balanceline").click(function () { 
        if ($(this).html()=="SHOW BALANCE") {
            show_balance_line = 1;
            draw();
            $(this).html("HIDE BALANCE");
        } else {
            show_balance_line = 0;
            draw();
            $(this).html("SHOW BALANCE");
        }
    });
    
    $(".viewhistory").click(function () { 
        if ($(this).html()=="VIEW HISTORY") {
            viewmode = "bargraph";
            $(".balanceline").hide();
            $(".powergraph-navigation").hide();
            $(".bargraph-navigation").show();
            
            draw();
            setTimeout(function() { $(".viewhistory").html("POWER VIEW"); },80);
        } else {
            
            viewmode = "powergraph";
            $(".balanceline").show();
            $(".bargraph-navigation").hide();
            $(".powergraph-navigation").show();
            
            draw();
            powergraph_events();
            setTimeout(function() { $(".viewhistory").html("VIEW HISTORY"); },80);
        }
    });        
}

function show() 
{
    appLog("INFO", "mysolarpvdivert show");
    
    if (config.app.solar_kwh.value && config.app.use_kwh.value && config.app.import_kwh.value && config.app.divert_kwh.value) {
        if (!bargraph_initialized) init_bargraph();
        $(".viewhistory").show();
    } else {
        $(".viewhistory").hide();
    }
    
    resize();
    
    // this.reload = true;
    update();
    updateTimer = setInterval(update, 5000);
}

function resize() 
{
    appLog("INFO", "mysolarpvdivert resize");
    
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = $(window).height()*0.55;

    if (height>width) height = width;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
    
    if (width<=500) {
        $(".electric-title").css("font-size","16px");
        $(".power-value").css("font-size","32px");
        $(".statstable").css("border-spacing","4px");
        $(".statsbox-title").css("font-size","14px");
        $(".statsbox-title").css("padding-bottom","4px");
        $(".statsbox-value").css("font-size","20px");
        $(".statsbox-units").css("font-size","12px");
        $(".statsbox-units").hide();
        $(".statsbox-prc").css("font-size","12px");
        $(".statsbox-padded").css("padding","4px");
        $(".balanceline").hide();
        $(".vistimeW").hide();
        $(".vistimeM").hide();
        $(".vistimeY").hide();
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","52px");
        $(".statstable").css("border-spacing","8px");
        $(".statsbox-title").css("font-size","16px");
        $(".statsbox-title").css("padding-bottom","8px");
        $(".statsbox-value").css("font-size","22px");
        $(".statsbox-units").css("font-size","14px");
        $(".statsbox-units").show();
        $(".statsbox-prc").css("font-size","14px");
        $(".statsbox-padded").css("padding","8px");
        $(".balanceline").show();
        $(".vistimeW").show();
        $(".vistimeM").show();
        $(".vistimeY").show();
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","85px");
        $(".statstable").css("border-spacing","10px");
        $(".statsbox-title").css("font-size","20px");
        $(".statsbox-title").css("padding-bottom","15px");
        $(".statsbox-value").css("font-size","36px");
        $(".statsbox-units").css("font-size","16px");
        $(".statsbox-units").show();
        $(".statsbox-prc").css("font-size","16px");
        $(".statsbox-padded").css("padding","10px");
        $(".balanceline").show();
        $(".vistimeW").show();
        $(".vistimeM").show();
        $(".vistimeY").show();
    }
    draw();
}

function hide() 
{
    clearInterval(updateTimer);
}

function update()
{
    // Check if the updater ran in the last 60s if it did not the app was sleeping
    // and so the data needs a full reload.
    var now = +new Date();
    if ((now-lastupdate)>60000) reload = true;
    lastupdate = now;
    
    var feeds = feed.getListById();
    if (feeds === null) { return; }
    var solar_now = parseInt(feeds[config.app.solar.value].value);
    var use_now = parseInt(feeds[config.app.use.value].value);
    var divert_now = parseInt(feeds[config.app.divert.value].value);
    
    var wind_now = 0;
    if (has_wind) {
      wind_now = parseInt(feeds[config.app.wind.value].value);
    }

    if (autoupdate) {
        var updatetime = feeds[config.app.solar.value].time;
        timeseries.append("solar",updatetime,solar_now);
        timeseries.trim_start("solar",view.start*0.001);
        timeseries.append("use",updatetime,use_now);
        timeseries.trim_start("use",view.start*0.001);
        timeseries.append("divert",updatetime,divert_now);
        timeseries.trim_start("divert",view.start*0.001);
        
        if (has_wind) {
          timeseries.append("wind",updatetime,wind_now);
          timeseries.trim_start("wind",view.start*0.001);
        }

        // Advance view
        var timerange = view.end - view.start;
        view.end = now;
        view.start = view.end - timerange;
    }
    // Lower limit for solar & divert
    if (solar_now<10) solar_now = 0;
    if (wind_now<10) wind_now = 0;
    if (divert_now<10) divert_now = 0;
    
    var balance = (solar_now + wind_now) - use_now;

    var house_now = use_now - divert_now;
    
    if (balance==0) {
        $(".balance-label").html("PERFECT BALANCE");
        $(".balance").html("");
    }
    
    if (balance>0) {
        $(".balance-label").html("EXPORTING");
        $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
    }
    
    if (balance<0) {
        $(".balance-label").html("IMPORTING");
        $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
    }
    
    $(".generationnow").html(solar_now + wind_now);
    $(".housenow").html(house_now);
    $(".divertnow").html(divert_now);
    $(".usenow").html(use_now);
    
    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && autoupdate) draw();
}

function draw()
{
    if (viewmode=="powergraph") draw_powergraph();
    if (viewmode=="bargraph") draw_bargraph();
}

function draw_powergraph() {
    var dp = 1;
    var units = "C";
    var fill = false;
    var plotColour = 0;
    
    var options = {
        lines: { fill: fill },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
        yaxes: [{ min: 0 }],
        grid: { hoverable: true, clickable: true },
        selection: { mode: "x" },
        legend: { show: false }
    }
    
    var npoints = 1500;
    interval = Math.round(((view.end - view.start)/npoints)/1000);
    interval = view.round_interval(interval);
    if (interval<10) interval = 10;
    var intervalms = interval * 1000;

    view.start = Math.ceil(view.start/intervalms)*intervalms;
    view.end = Math.ceil(view.end/intervalms)*intervalms;

    var npoints = parseInt((view.end-view.start)/(interval*1000));
    
    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
        view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
        timeseries.load("solar", feed.getData(config.app.solar.value, view.start, view.end, interval, 0, 0));
        timeseries.load("use", feed.getData(config.app.use.value, view.start,view.end,interval, 0, 0));
        timeseries.load("divert", feed.getData(config.app.divert.value, view.start,view.end,interval, 0, 0));
        if (has_wind) {
          timeseries.load("wind", feed.getData(config.app.wind.value, view.start,view.end,interval, 0, 0));
        }
    }
    // -------------------------------------------------------------------------------------------------------
    
    var use_data = [];
    var solar_data = [];
    var wind_data = [];
    var bal_data = [];
    var store_data = [];
    var divert_data = [];
    var house_data = [];
    
    var t = 0;
    var store = 0;
    var use_now = 0;
    var solar_now = 0;
    var wind_now = 0;
    var divert_now = 0;
    var house_now = 0;
    
    var total_solar_kwh = 0;
    var total_wind_kwh = 0;
    var total_use_kwh = 0;
    var total_use_generated_kwh = 0;
    var total_house_generated_kwh = 0;
    var total_divert_kwh = 0;
    
    var datastart = timeseries.start_time("solar");
    
    for (var z=0; z<timeseries.length("solar"); z++) {

        // -------------------------------------------------------------------------------------------------------
        // Get solar or use values
        // -------------------------------------------------------------------------------------------------------
        if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
        if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
        if (timeseries.value("divert",z)!=null) divert_now = timeseries.value("divert",z);
        if (has_wind) {
            if (timeseries.value("wind",z)!=null) wind_now = timeseries.value("wind",z);
        } else {
            wind_now = 0;
        }

        house_now = use_now - divert_now;
        
        // -------------------------------------------------------------------------------------------------------
        // Supply / demand balance calculation
        // -------------------------------------------------------------------------------------------------------
        if (solar_now<10) solar_now = 0;
        if (wind_now<10) wind_now = 0;
        if (divert_now<10) divert_now = 0;

        var generated_now = solar_now + wind_now;

        var balance_use = generated_now - use_now;
        if (balance_use>=0) {
            total_use_generated_kwh += (use_now*interval)/(1000*3600);
        }
        if (balance_use<0) {
            total_use_generated_kwh += (generated_now*interval)/(1000*3600);
        }
        
        var balance_house = generated_now - house_now;
        if (balance_house>=0) {
            total_house_generated_kwh += (house_now*interval)/(1000*3600);
        }
        if (balance_house<0) {
            total_house_generated_kwh += (generated_now*interval)/(1000*3600);
        }
        
        var store_change = (balance_use * interval) / (1000*3600);
        store += store_change;
        
        total_solar_kwh += (solar_now*interval)/(1000*3600);
        total_wind_kwh += (wind_now*interval)/(1000*3600);
        total_use_kwh += (use_now*interval)/(1000*3600);
        total_divert_kwh += (divert_now*interval)/(1000*3600);
        
        var time = datastart + (1000 * interval * z);
        use_data.push([time,use_now]);
        solar_data.push([time,solar_now]);
        wind_data.push([time,wind_now]);
        bal_data.push([time,balance_use]);
        store_data.push([time,store]);
        divert_data.push([time,divert_now]);
        house_data.push([time,house_now]);
        
        t += interval;
    }

    var total_generated_kwh = total_solar_kwh + total_wind_kwh;
    var total_house_kwh = total_use_kwh - total_divert_kwh;
    var total_export_kwh = total_generated_kwh - total_use_generated_kwh;
    var total_import_kwh = total_use_kwh - total_use_generated_kwh;
    var total_grid_balance_kwh = total_export_kwh - total_import_kwh;

    $(".total_house_kwh").html(total_house_kwh.toFixed(1));
    $(".total_divert_kwh").html((total_divert_kwh).toFixed(1));
    $(".total_use_kwh").html((total_use_kwh).toFixed(1));
    $(".total_generated_kwh").html(total_generated_kwh.toFixed(1));

    $(".total_house_generated_kwh").html((total_house_generated_kwh).toFixed(1));
    $(".total_export_kwh").html(total_export_kwh.toFixed(1));
    $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
    
    if (total_generated_kwh > 0) {
        $(".house_generated_total_generated_prc").html(((total_house_generated_kwh/total_generated_kwh)*100).toFixed(0)+"%");
        $(".house_generated_house_use_prc").html(((total_house_generated_kwh/total_house_kwh)*100).toFixed(0)+"%");
        $(".divert_total_generated_prc").html(((total_divert_kwh/total_generated_kwh)*100).toFixed(0)+"%");
        $(".total_export_prc").html(((total_export_kwh/total_generated_kwh)*100).toFixed(0)+"%");
    } else {
        $(".house_generated_total_generated_prc").html("-- %");
        $(".house_generated_house_use_prc").html("-- %");
        $(".divert_total_generated_prc").html("-- %");
        $(".total_export_prc").html("-- %");
    }
            
    $(".total_import_prc").html(((total_import_kwh/total_house_kwh)*100).toFixed(0)+"%");
    $(".total_import_kwh").html(total_import_kwh.toFixed(1));        

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    
    var series = [];
    
    series.push({data:solar_data, label: "Solar", color: "#dccc1f", stack:1, lines:{lineWidth:0, fill:1.0}});
    if (has_wind) series.push({data:wind_data, label: "Wind", color: "#1fdc6e", stack:1, lines:{lineWidth:0, fill:1.0}});
    
    series.push({data:house_data, label: "House", color: "#82cbfc", stack:2, lines:{lineWidth:0, fill:0.8}});
    series.push({data:divert_data, label: "Divert", color: "#fb7b50", stack:2, lines:{lineWidth:0, fill:0.8}});
    
    if (show_balance_line) series.push({data:store_data, label: "Balance", yaxis:2, color: "#888"});

    powerseries = series;
    
    $.plot($('#placeholder'),powerseries,options);
    $(".ajax-loader").hide();
}

// ------------------------------------------------------------------------------------------
// POWER GRAPH EVENTS
// ------------------------------------------------------------------------------------------
function powergraph_events() {

    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");

    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            // Show tooltip
            var tooltip_items = [];

            var date = new Date(item.datapoint[0]);
            tooltip_items.push(["TIME", dateFormat(date, 'HH:MM'), ""]);

            for (i = 0; i < powerseries.length; i++) {
                var series = powerseries[i];
                if (series.label.toUpperCase()=="BALANCE") {
                    tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "kWh"]);
                } else {
                    if ( series.data[item.dataIndex][1] >= 1000) {
                        tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0)/1000 , "kW"]);
                    } else {
                        tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0), "W"]);
                    }
                }
            }
            show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

    $('#placeholder').bind("plotselected", function (event, ranges) {
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;

        autoupdate = false;
        reload = true; 
        
        var now = +new Date();
        if (Math.abs(view.end-now)<30000) {
            autoupdate = true;
        }

        draw();
    });
}

// ======================================================================================
// PART 2: BAR GRAPH PAGE
// ======================================================================================

// --------------------------------------------------------------------------------------
// INIT BAR GRAPH
// - load cumulative kWh feeds
// - calculate used solar, solar, used and exported kwh/d
// --------------------------------------------------------------------------------------
function init_bargraph() {
    bargraph_initialized = true;
    // Fetch the start_time covering all kwh feeds - this is used for the 'all time' button
    latest_start_time = 0;
    var solar_meta = feed.getMeta(config.app.solar_kwh.value);
    var use_meta = feed.getMeta(config.app.use_kwh.value);
    var divert_meta = feed.getMeta(config.app.divert_kwh.value);
    var import_meta = feed.getMeta(config.app.import_kwh.value);
    if (solar_meta.start_time > latest_start_time) latest_start_time = solar_meta.start_time;
    if (use_meta.start_time > latest_start_time) latest_start_time = use_meta.start_time;
    if (divert_meta.start_time > latest_start_time) latest_start_time = divert_meta.start_time;
    if (import_meta.start_time > latest_start_time) latest_start_time = import_meta.start_time;
    latest_start_time = latest_start_time;

    var earliest_start_time = solar_meta.start_time;
    earliest_start_time = Math.min(earliest_start_time, use_meta.start_time);
    earliest_start_time = Math.min(earliest_start_time, divert_meta.start_time);
    earliest_start_time = Math.min(earliest_start_time, import_meta.start_time);
    view.first_data = latest_start_time * 1000;

    var timeWindow = (3600000*24.0*40);
    var end = +new Date;
    var start = end - timeWindow;
    load_bargraph(start,end);
}

function load_bargraph(start,end) {

    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    
    // Load kWh data
    var solar_kwh_data = feed.getDailyData(config.app.solar_kwh.value, start, end);
    var use_kwh_data = feed.getDailyData(config.app.use_kwh.value, start, end);
    var divert_kwh_data = feed.getDailyData(config.app.divert_kwh.value, start, end);
    var import_kwh_data = feed.getDailyData(config.app.import_kwh.value, start, end);
    var wind_kwh_data = [];
    if (has_wind) {
        wind_kwh_data = feed.getDailyData(config.wind_kwh.value, start, end);
    }
    
    house_generated_kwhd_data = [];
    solar_kwhd_data = [];
    wind_kwhd_data = [];
    use_kwhd_data = [];
    house_kwhd_data = [];
    divert_kwhd_data = [];
    export_kwhd_data = [];
    
    if (solar_kwh_data.length>1) {
    
    for (var day=1; day<solar_kwh_data.length; day++)
    {
        var solar_kwh = solar_kwh_data[day][1] - solar_kwh_data[day-1][1];
        if (solar_kwh_data[day][1]==null || solar_kwh_data[day-1][1]==null) solar_kwh = null;
        
        var wind_kwh = null;
        if (has_wind) {
            var wind_kwh = wind_kwh_data[day][1] - wind_kwh_data[day-1][1];
            if (wind_kwh_data[day][1]==null || wind_kwh_data[day-1][1]==null) wind_kwh = null;
        }
        
        var use_kwh = use_kwh_data[day][1] - use_kwh_data[day-1][1];
        if (use_kwh_data[day][1]==null || use_kwh_data[day-1][1]==null) use_kwh = null;
        
        var divert_kwh = divert_kwh_data[day][1] - divert_kwh_data[day-1][1];
        if (divert_kwh_data[day][1]==null || divert_kwh_data[day-1][1]==null) divert_kwh = null;
        
        var import_kwh = import_kwh_data[day][1] - import_kwh_data[day-1][1];
        if (import_kwh_data[day][1]==null || import_kwh_data[day-1][1]==null) import_kwh = null;
        
        var generated_kwh = solar_kwh + wind_kwh;
        var export_kwh = generated_kwh - (use_kwh - import_kwh);
        var house_kwh = use_kwh - divert_kwh;
        var house_generated_kwh = house_kwh - import_kwh;
        
        if (solar_kwh!=null && use_kwh!=null && export_kwh!=null && divert_kwh!=null && house_kwh!=null &&
            (!has_wind || wind_kwh!=null)
           )
        {
            house_generated_kwhd_data.push([solar_kwh_data[day-1][0],house_generated_kwh]);
            solar_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh]);
            if (wind_kwh!=null) wind_kwhd_data.push([wind_kwh_data[day-1][0],wind_kwh]);
            use_kwhd_data.push([use_kwh_data[day-1][0],use_kwh]);
            house_kwhd_data.push([use_kwh_data[day-1][0],house_kwh*-1]);
            divert_kwhd_data.push([divert_kwh_data[day-1][0],divert_kwh]);
            export_kwhd_data.push([import_kwh_data[day-1][0],export_kwh]);
        }
    }
    
    }
    
    var series = [];
    
    series.push({
        data: house_generated_kwhd_data,
        label: "House",
        color: "#82cbfc",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: divert_kwhd_data,
        label: "Divert",
        color: "#fb7b50",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: export_kwhd_data,
        label: "Export",
        color: "#2ed52e",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: house_kwhd_data,
        label: "Use",
        color: "#0598fa",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
        stack: 2
    });
    
    historyseries = series;
}

// ------------------------------------------------------------------------------------------
// DRAW BAR GRAPH
// Because the data for the bargraph only needs to be loaded once at the start we seperate out
// the data loading part to init and the draw part here just draws the bargraph to the flot
// placeholder overwritting the power graph as the view is changed.
// ------------------------------------------------------------------------------------------    
function draw_bargraph() 
{
    var markings = [];
    markings.push({ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } });
    
    var options = {
        xaxis: { mode: "time", timezone: "browser", minTickSize: [1, "day"] },
        grid: { hoverable: true, clickable: true, markings: markings },
        selection: { mode: "x" },
        legend: { show: false }
    };
    
    var plot = $.plot($('#placeholder'),historyseries,options);
    
    $('#placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Solar usage (house, diverted & exported)</div>");
    $('#placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> House usage</div>");

    // Because the bargraph is only drawn once when the view is changed we attach the events at this point
    bargraph_events();
}

// ------------------------------------------------------------------------------------------
// BAR GRAPH EVENTS
// - show bar values on hover
// - click through to power graph
// ------------------------------------------------------------------------------------------
function bargraph_events() {

    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            var z = item.dataIndex;
            
            var solar_kwh = solar_kwhd_data[z][1];
            var wind_kwh = (has_wind) ? wind_kwhd_data[z][1] : 0;
            var house_generated_kwh = house_generated_kwhd_data[z][1];
            var use_kwh = use_kwhd_data[z][1];
            var house_kwh = house_kwhd_data[z][1]*-1;
            var divert_kwh = divert_kwhd_data[z][1];
            var export_kwh = export_kwhd_data[z][1];
            
            var generated_kwh = solar_kwh + wind_kwh;
            var import_kwh = use_kwh - house_generated_kwh - divert_kwh;
            var total_grid_balance_kwh = export_kwh - import_kwh;
            
            $(".total_house_kwh").html(house_kwh.toFixed(1));
            $(".total_divert_kwh").html((divert_kwh).toFixed(1));
            $(".total_use_kwh").html((use_kwh).toFixed(1));
            $(".total_generated_kwh").html(generated_kwh.toFixed(1));
            $(".total_house_generated_kwh").html((house_generated_kwh).toFixed(1));
            $(".total_export_kwh").html(export_kwh.toFixed(1));
            $(".total_import_kwh").html(import_kwh.toFixed(1));
            $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
            
            $(".total_import_prc").html(((import_kwh/house_kwh)*100).toFixed(0)+"%");
            
            if (generated_kwh > 0) {
                $(".house_generated_total_generated_prc").html(((house_generated_kwh/generated_kwh)*100).toFixed(0)+"%");
                $(".house_generated_house_use_prc").html(((house_generated_kwh/house_kwh)*100).toFixed(0)+"%");
                $(".divert_total_generated_prc").html(((divert_kwh/generated_kwh)*100).toFixed(0)+"%");
                $(".total_export_prc").html(((export_kwh/generated_kwh)*100).toFixed(0)+"%");
            } else {
                $(".house_generated_total_generated_prc").html("-- %");
                $(".house_generated_house_use_prc").html("-- %");
                $(".divert_total_generated_prc").html("-- %");
                $(".total_export_prc").html("-- %");
            }
        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

    // Auto click through to power graph
    $('#placeholder').bind("plotclick", function (event, pos, item)
    {
        if (item && !panning) {
            var z = item.dataIndex;
            
            view.start = solar_kwhd_data[z][0];
            view.end = view.start + 86400*1000;

            $(".balanceline").show();
            $(".bargraph-navigation").hide();
            $(".powergraph-navigation").show();
            $(".viewhistory").html("VIEW HISTORY");
            $('#placeholder').unbind("plotclick");
            $('#placeholder').unbind("plothover");
            $('#placeholder').unbind("plotselected");
            
            reload = true; 
            autoupdate = false;
            viewmode = "powergraph";
            
            draw();
            powergraph_events();
        }
    });
    
    $('#placeholder').bind("plotselected", function (event, ranges) {
        var start = ranges.xaxis.from;
        var end = ranges.xaxis.to;
        load_bargraph(start,end);
        draw();
        panning = true; setTimeout(function() {panning = false; }, 100);
    });
    
    $('.bargraph-viewall').click(function () {
        var start = latest_start_time * 1000;
        var end = +new Date;
        load_bargraph(start,end);
        draw();
    });
}

// ------------------------------------------------------------------------------------------
// TOOLTIP HANDLING
// Show & hide the tooltip
// ------------------------------------------------------------------------------------------
function show_tooltip(x, y, values) {
    var tooltip = $('#tooltip');
    if (!tooltip[0]) {
        tooltip = $('<div id="tooltip"></div>')
            .css({
                position: "absolute",
                display: "none",
                border: "1px solid #545454",
                padding: "8px",
                "background-color": "#333",
            })
            .appendTo("body");
    }

    tooltip.html('');
    var table = $('<table/>').appendTo(tooltip);

    for (i = 0; i < values.length; i++) {
        var value = values[i];
        var row = $('<tr class="tooltip-item"/>').appendTo(table);
        $('<td style="padding-right: 8px"><span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    }

    tooltip
        .css({
            left: x,
            top: y
        })
        .show();
}

function hide_tooltip() {
    $('#tooltip').hide();
}

$(window).resize(function(){
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
