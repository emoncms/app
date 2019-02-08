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
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 

<div id="app-container" style="display:none" class="block">
  <div class="col1"><div class="col1-inner">
  
    <div style="height:20px; border-bottom:1px solid #333; padding-bottom:8px;">
        <div style="float:right;">
            <!--<span style="color:#fff; margin-right:10px" >Settings</span>-->
            <i class="config icon-wrench icon-white" style="cursor:pointer; padding-right:5px;"></i>
        </div>
    </div>

    <table style="width:100%">
    <tr>
        <td style="border:0; width:30%; vertical-align:top">
            <div class="electric-title">USE NOW</div>
            <div class="power-value"><span class="usenow">0</span>W</div>
        </td>
        <td style="text-align:left; border:0; width:40%; vertical-align:top">
            <div class="electric-title"><span class="balance-label"></span></div>
            <div class="power-value"><span class="balance"></span></div>
        </td>
        <td style="text-align:right; border:0; width:30%">
            <div class="electric-title">RENEWABLE GEN</div>
            <div class="power-value"><span class="gennow">0</span>W</div>
            <div class="electric-title"><span style="color:#dccc1f">SOLAR: <span class="solarnow">0</span>W</span> | <span style="color:#2ed52e">WIND: <span class="windnow">0</span>W</span></div>
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

        <span class="visnav balanceline" style="float:right; font-size:14px">SHOW BALANCE</span>
    </div>

    <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
    </div>
    
    <br>
    
    <table style="width:100%">
    <tr>
        <td class="appbox">
            <div class="appbox-title">USE</div>
            <div><span class="appbox-value total_use_kwh" style="color:#0699fa">0</span> <span class="appbox-units" style="color:#0699fa">kWh</span></div>
        </td>

        <td class="appbox">
            <div class="appbox-title">WIND</div>
            <div><span class="appbox-value total_wind_kwh" style="color:#2ed52e">0</span> <span class="appbox-units" style="color:#2ed52e">kWh</span></div>
        </td>
        
        <td class="appbox">
            <div class="appbox-title">SOLAR</div>
            <div><span class="appbox-value total_solar_kwh" style="color:#dccc1f">0</span> <span class="appbox-units" style="color:#dccc1f">kWh</span></div>
        </td>
        
        <td class="appbox">
            <div class="appbox-title">DIRECT</div>
            <div style="padding-bottom:5px"><span class="appbox-value total_use_direct_prc" style="color:#89ae65">0</span></div>
            <div><span class="appbox-units total_use_direct_kwh" style="color:#89ae65">0</span> <span class="appbox-units" style="color:#89ae65">kWh</span></div>
        </td>
        
        <td class="appbox">
            <div class="appbox-title">GRID</div>
            <div style="padding-bottom:5px"><span class="appbox-value total_use_via_store_prc" style="color:#d52e2e">0</span></div>
            <div><span class="appbox-units total_use_via_store_kwh" style="color:#d52e2e">0</span> <span class="appbox-units" style="color:#d52e2e">kWh</span></div>
        </td>
    </tr>
    </table>
  </div></div>
</div>

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title" style="color:#dccc1f">My Solar <span style="color:#2ed52e">& Wind</span></h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        This app extends the My Solar app by adding in a 'share of UK wind' estimate.
        <br><br>
        The share of wind estimate is calculated by using real-time electricity data from wind power in the uk and then scaling it so that the annual wind generation matches a percentage of annual household consumption. The default estimate assumes 60% or near 2000 kWh annually. This is close to the fuel mix quoted by two of the UK's leading green electricity suppliers.
        <br><br>
        <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
        <br><br>
        <img src="../Modules/app/images/myenergy_app.png" style="width:600px" class="img-rounded">
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
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "engine":"5", "description":"Solar pv generation in watts"},
    "windkwh":{"type":"value", "default":2000, "name": "kWh Wind", "description":"kWh of wind energy bought annually"}
};
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
var reload = true;
var autoupdate = true;
var lastupdate = 0;
var historyseries = [];
var latest_start_time = 0;
var panning = false;

var average_wind_power = 2630; // MW - this is the average UK wind power output in MW between March 2015 and March 2016, it is used to scale the share of UK Wind power

var annual_wind_gen = 3300;
var capacity_factor = 0.4;
var my_wind_cap = 0;

config.init();

// App start function
function init()
{        
    appLog("INFO", "mysolarpv init");
    
    my_wind_cap = ((annual_wind_gen / 365) / 0.024) / capacity_factor;

    var timeWindow = (3600000*6.0*1);
    view.end = +new Date;
    view.start = view.end - timeWindow;
    
    // The first view is the powergraph, we load the events for the power graph here.
    powergraph_events();
    
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
}

function show() 
{
    appLog("INFO", "mysolarpv show");
    resize();
    update();
    updateTimer = setInterval(update, 5000);
}

function resize() 
{
    appLog("INFO", "mysolarpv resize");
    
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
        $(".balanceline").hide();
        $(".vistimeW").hide();
        $(".vistimeM").hide();
        $(".vistimeY").hide();
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","52px");
        $(".balanceline").show();
        $(".vistimeW").show();
        $(".vistimeM").show();
        $(".vistimeY").show();
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","85px");
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
    var solar_now = 0;
    if (config.app.solar.value)
        solar_now = parseInt(feeds[config.app.solar.value].value);
        
    var use_now = parseInt(feeds[config.app.use.value].value);
    
    var gridwind = feed.getRemoteValue(67088);
    var average_power = ((config.app.windkwh.value/365.0)/0.024);
    var wind_now = Math.round((average_power / average_wind_power) * gridwind);

    if (autoupdate) {
        var updatetime = feeds[config.app.use.value].time;
        
        if (config.app.solar.value) {
            timeseries.append("solar",updatetime,solar_now);
            timeseries.trim_start("solar",view.start*0.001);
        }
        
        timeseries.append("use",updatetime,use_now);
        timeseries.trim_start("use",view.start*0.001);
        timeseries.append("remotewind",updatetime,gridwind);
        timeseries.trim_start("remotewind",view.start*0.001);
        // Advance view
        var timerange = view.end - view.start;
        view.end = now;
        view.start = view.end - timerange;
    }
    // Lower limit for solar
    if (solar_now<10) solar_now = 0;
    var gen_now = solar_now + wind_now;
    var balance = gen_now - use_now;
    
    if (balance==0) {
        $(".balance-label").html("PERFECT BALANCE");
        $(".balance").html("");
    }
    
    if (balance>0) {
        $(".balance-label").html("EXCESS");
        $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
    }
    
    if (balance<0) {
        $(".balance-label").html("BACKUP");
        $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
    }
    
    $(".gennow").html(Math.round(gen_now));
    $(".solarnow").html(solar_now);
    $(".windnow").html(Math.round(wind_now));
    $(".usenow").html(use_now);
    
    // Only redraw the graph if its the power graph and auto update is turned on
    if (autoupdate) draw();
}

function draw()
{
    draw_powergraph();
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
        grid: {hoverable: true, clickable: true},
        selection: { mode: "x" }
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

        var feedid = config.app.solar.value;
        if (feedid!=false) {
            timeseries.load("solar", feed.getData(feedid, view.start, view.end, interval, 0, 0));
        }
        var feedid = config.app.use.value;
        timeseries.load("use", feed.getData(config.app.use.value, view.start, view.end, interval, 0, 0));
        
        timeseries.load("remotewind", feed.getRemoteData(67088, view.start, view.end, interval));    
    }
    // -------------------------------------------------------------------------------------------------------
    
    var use_data = [];
    var solar_data = [];
    var wind_data = [];
    var gen_data = [];
    var bal_data = [];
    var store_data = [];
    
    var t = 0;
    var store = 0;
    var use_now = 0;
    var solar_now = 0;
    var wind_now = 0;
    
    var total_solar_kwh = 0;
    var total_wind_kwh = 0;
    var total_use_kwh = 0;
    var total_use_direct_kwh = 0;
    
    var datastart = timeseries.start_time("use");
    
    for (var z=0; z<timeseries.length("use"); z++) {

        // -------------------------------------------------------------------------------------------------------
        // Get solar or use values
        // -------------------------------------------------------------------------------------------------------
        if (config.app.solar.value && timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
        if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);

        if (timeseries.value("remotewind",z)!=null) {
            var gridwind = timeseries.value("remotewind",z);
            var average_power = ((config.app.windkwh.value/365.0)/0.024);
            wind_now = Math.round((average_power / average_wind_power) * gridwind);
        }        
        // -------------------------------------------------------------------------------------------------------
        // Supply / demand balance calculation
        // -------------------------------------------------------------------------------------------------------
        if (solar_now<10) solar_now = 0;
        
        var gen_now = solar_now + wind_now;
        var balance = gen_now - use_now;
        
        if (balance>=0) total_use_direct_kwh += (use_now*interval)/(1000*3600);
        if (balance<0) total_use_direct_kwh += (gen_now*interval)/(1000*3600);
        
        var store_change = (balance * interval) / (1000*3600);
        store += store_change;
        
        total_wind_kwh += (wind_now*interval)/(1000*3600);
        total_solar_kwh += (solar_now*interval)/(1000*3600);
        total_use_kwh += (use_now*interval)/(1000*3600);
        
        var time = datastart + (1000 * interval * z);
        use_data.push([time,use_now]);
        solar_data.push([time,wind_now+solar_now]);
        wind_data.push([time,wind_now]);
        bal_data.push([time,balance]);
        store_data.push([time,store]);
        
        t += interval;
    }
    $(".total_wind_kwh").html(total_wind_kwh.toFixed(1));
    $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
    $(".total_use_kwh").html((total_use_kwh).toFixed(1));
    
    $(".total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
    $(".total_use_via_store_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");

    $(".total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));
    $(".total_use_via_store_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    
    var series = [
        {data:solar_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
        {data:wind_data,color: "#2ed52e", lines:{lineWidth:0, fill:1.0}},
        {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
    ];

    if (show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
    
    $.plot($('#placeholder'),series,options);
    $(".ajax-loader").hide();
}

// ------------------------------------------------------------------------------------------
// POWER GRAPH EVENTS
// ------------------------------------------------------------------------------------------
function powergraph_events() {

    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");

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
