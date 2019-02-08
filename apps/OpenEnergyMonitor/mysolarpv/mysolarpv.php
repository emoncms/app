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
            <i class="config icon-wrench icon-white" style="cursor:pointer; padding-right:5px"></i>
        </div>
    </div>

    <table style="width:100%">
    <tr>
        <td style="border:0; width:33%">
            <div class="electric-title">USE NOW</div>
            <div class="power-value"><span class="usenow">0</span>W</div>
        </td>
        <td style="text-align:center; border:0; width:33%">
            <div class="electric-title"><span class="balance-label"></span></div>
            <div class="power-value"><span class="balance"></span></div>
        </td>
        <td style="text-align:right; border:0; width:33%">
            <div class="electric-title">SOLAR PV</div>
            <div class="power-value" style="color:#dccc1f"><span class="solarnow">0</span>W</div>
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
    
    <table style="width:100%">
    <tr>
        <td class="appbox">
            <div class="appbox-title">USE</div>
            <div><span class="appbox-value total_use_kwh" style="color:#0699fa">0</span> <span class="appbox-units" style="color:#0699fa">kWh</span></div>
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
            <div class="appbox-title">EXPORT</div>
            <div style="padding-bottom:5px"><span class="appbox-value total_export_prc" style="color:#b7aa1f">0</span></div>
            <div><span class="appbox-units total_export_kwh" style="color:#b7aa1f">0</span> <span class="appbox-units" style="color:#b7aa1f">kWh</span></div>
        </td>
        
        <td class="appbox">
            <div class="appbox-title">GRID</div>
            <div style="padding-bottom:5px"><span class="appbox-value total_import_prc" style="color:#d52e2e">0</span></div>
            <div><span class="appbox-units total_import_kwh" style="color:#d52e2e">0</span> <span class="appbox-units" style="color:#d52e2e">kWh</span></div>
        </td>
    </tr>
    </table>

  </div></div>

</div>

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title" style="color:#dccc1f">My Solar</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        The My Solar app can be used to explore onsite solar generation, self consumption, export and building consumption both in realtime with a moving power graph view and historically with a daily and monthly bargraph.
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
    //"export":{"type":"feed", "autoname":"export", "engine":5, "description":"Exported solar in watts"},
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "engine":5, "description":"Cumulative solar generation in kWh"},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "engine":5, "description":"Cumulative grid import in kWh"}
    //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
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
var viewmode = "powergraph";
var historyseries = [];
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;

config.init();

// App start function
function init()
{
    appLog("INFO", "mysolarpv init");
    
    var solar_kwh = config.app.solar_kwh.value;
    var use_kwh = config.app.use_kwh.value;
    var import_kwh = config.app.import_kwh.value;

    var timeWindow = (3600000*6.0*1);
    view.end = +new Date;
    view.start = view.end - timeWindow;
    
    if (solar_kwh && use_kwh && import_kwh) {
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

    $("<div id='tooltip'><span id='value'></span> <span id='unit'></span></div>").appendTo("body");

    // position the tooltip and insert the correct value on hover
    // hide the tooltip on mouseout  
    $("#placeholder").bind("plothover", function (event, pos, item) {
        if (item) {
            var value = item.datapoint[1].toFixed(2);
            $("#tooltip #value").text(value);
            $("#tooltip").css({top: item.pageY-30, left: item.pageX+5}).fadeIn(200);
        } else {
            $("#tooltip").hide();
        }
    });
}

function show() 
{
    appLog("INFO", "mysolarpv show");
    var solar_kwh = config.app.solar_kwh.value;
    var use_kwh = config.app.use_kwh.value;
    var import_kwh = config.app.import_kwh.value;
    
    if (solar_kwh && use_kwh && import_kwh) {
        if (!bargraph_initialized) init_bargraph();
        $(".viewhistory").show();
    } else {
        $(".viewhistory").hide();
    }
    
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
    
    feeds = feed.getListById();
    if (feeds === null) { return; }
    var solar_now = parseInt(feeds[config.app.solar.value].value);
    var use_now = parseInt(feeds[config.app.use.value].value);

    if (autoupdate) {
        var updatetime = feeds[config.app.solar.value].time;
        timeseries.append("solar",updatetime,solar_now);
        timeseries.trim_start("solar",view.start*0.001);
        timeseries.append("use",updatetime,use_now);
        timeseries.trim_start("use",view.start*0.001);

        // Advance view
        var timerange = view.end - view.start;
        view.end = now;
        view.start = view.end - timerange;
    }
    // Lower limit for solar
    if (solar_now<10) solar_now = 0;
    
    var balance = solar_now - use_now;
    
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
    
    $(".solarnow").html(solar_now);
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
        timeseries.load("solar", feed.getData(config.app.solar.value, view.start, view.end, interval, 0, 0));
        timeseries.load("use", feed.getData(config.app.use.value, view.start, view.end, interval, 0, 0));
    }
    // -------------------------------------------------------------------------------------------------------
    
    var use_data = [];
    var gen_data = [];
    var bal_data = [];
    var store_data = [];
    
    var t = 0;
    var store = 0;
    var use_now = 0;
    var solar_now = 0;
    
    var total_solar_kwh = 0;
    var total_use_kwh = 0;
    var total_use_direct_kwh = 0;
    
    var datastart = timeseries.start_time("solar");
    
    // console.log(timeseries.length("solar"));
    // console.log(timeseries.length("use"));
    
    for (var z=0; z<timeseries.length("solar"); z++) {

        // -------------------------------------------------------------------------------------------------------
        // Get solar or use values
        // -------------------------------------------------------------------------------------------------------
        if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
        if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
        
        // -------------------------------------------------------------------------------------------------------
        // Supply / demand balance calculation
        // -------------------------------------------------------------------------------------------------------
        if (solar_now<10) solar_now = 0;
        var balance = solar_now - use_now;
        
        if (balance>=0) total_use_direct_kwh += (use_now*interval)/(1000*3600);
        if (balance<0) total_use_direct_kwh += (solar_now*interval)/(1000*3600);
        
        var store_change = (balance * interval) / (1000*3600);
        store += store_change;
        
        total_solar_kwh += (solar_now*interval)/(1000*3600);
        total_use_kwh += (use_now*interval)/(1000*3600);
        
        var time = datastart + (1000 * interval * z);
        use_data.push([time,use_now]);
        gen_data.push([time,solar_now]);
        bal_data.push([time,balance]);
        store_data.push([time,store]);
        
        t += interval;
    }
    $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
    $(".total_use_kwh").html((total_use_kwh).toFixed(1));
    
    $(".total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));

    $(".total_export_kwh").html((total_solar_kwh-total_use_direct_kwh).toFixed(1));
            
    $(".total_import_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");
    $(".total_import_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        
    
    if (total_solar_kwh > 0) {
        $(".total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
        $(".total_export_prc").html((((total_solar_kwh-total_use_direct_kwh)/total_solar_kwh)*100).toFixed(0)+"%");
    } else {
        $(".total_use_direct_prc").html("-- %");
        $(".total_export_prc").html("-- %");
    }

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    
    var series = [
        {data:gen_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
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
    var import_meta = feed.getMeta(config.app.import_kwh.value);
    if (solar_meta.start_time > latest_start_time) latest_start_time = solar_meta.start_time;
    if (use_meta.start_time > latest_start_time) latest_start_time = use_meta.start_time;
    if (import_meta.start_time > latest_start_time) latest_start_time = import_meta.start_time;
    latest_start_time = latest_start_time;

    var earliest_start_time = solar_meta.start_time;
    earliest_start_time = Math.min(use_meta.start_time, earliest_start_time);
    earliest_start_time = Math.min(import_meta.start_time, earliest_start_time);
    view.first_data = earliest_start_time * 1000;

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
    var import_kwh_data = feed.getDailyData(config.app.import_kwh.value, start, end);
    
    // console.log(solar_kwh_data);
    // console.log(use_kwh_data);
    
    solarused_kwhd_data = [];
    solar_kwhd_data = [];
    use_kwhd_data = [];
    export_kwhd_data = [];
    
    if (solar_kwh_data.length>1) {
    
    for (var day=1; day<solar_kwh_data.length; day++)
    {
        var solar_kwh = solar_kwh_data[day][1] - solar_kwh_data[day-1][1];
        if (solar_kwh_data[day][1]==null || solar_kwh_data[day-1][1]==null) solar_kwh = null;
        
        var use_kwh = use_kwh_data[day][1] - use_kwh_data[day-1][1];
        if (use_kwh_data[day][1]==null || use_kwh_data[day-1][1]==null) use_kwh = null;
        
        var import_kwh = import_kwh_data[day][1] - import_kwh_data[day-1][1];
        if (import_kwh_data[day][1]==null || import_kwh_data[day-1][1]==null) import_kwh = null;
        
        var export_kwh = solar_kwh - (use_kwh - import_kwh);
        
        if (solar_kwh!=null && use_kwh!=null & export_kwh!=null) {
            solarused_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh - export_kwh]);
            solar_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh]);
            use_kwhd_data.push([use_kwh_data[day-1][0],use_kwh]);
            export_kwhd_data.push([import_kwh_data[day-1][0],export_kwh*-1]);
        }
    }
    
    }
    
    var series = [];
    
    series.push({
        data: use_kwhd_data,
        color: "#0699fa",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
    });
    
    series.push({
        data: solarused_kwhd_data,
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.6, lineWidth:0}
    });
    
    series.push({
        data: export_kwhd_data,
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
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
        xaxis: { mode: "time", timezone: "browser"},
        grid: {hoverable: true, clickable: true, markings:markings},
        selection: { mode: "x" }
    }

    var plot = $.plot($('#placeholder'),historyseries,options);
    
    $('#placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Onsite Use & Total Use</div>");
    $('#placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Exported solar</div>");

    // Because the bargraph is only drawn once when the view is changed we attach the events at this point
    bargraph_events();
}

// ------------------------------------------------------------------------------------------
// BAR GRAPH EVENTS
// - show bar values on hover
// - click through to power graph
// ------------------------------------------------------------------------------------------
function bargraph_events(){

    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            // console.log(item.datapoint[0]+" "+item.dataIndex);
            var z = item.dataIndex;
            
            var solar_kwhd = solar_kwhd_data[z][1];
            var solarused_kwhd = solarused_kwhd_data[z][1];
            var use_kwhd = use_kwhd_data[z][1];
            var export_kwhd = export_kwhd_data[z][1];
            var imported_kwhd = use_kwhd-solarused_kwhd;
            
            $(".total_solar_kwh").html((solar_kwhd).toFixed(1));
            $(".total_use_kwh").html((use_kwhd).toFixed(1));
            
            $(".total_use_direct_kwh").html((solarused_kwhd).toFixed(1));
            
            $(".total_export_kwh").html((export_kwhd*-1).toFixed(1));
            
            $(".total_import_prc").html(((imported_kwhd/use_kwhd)*100).toFixed(0)+"%");
            $(".total_import_kwh").html((imported_kwhd).toFixed(1));
    
            if (solar_kwhd > 0) {
                $(".total_use_direct_prc").html(((solarused_kwhd/use_kwhd)*100).toFixed(0)+"%");
                $(".total_export_prc").html(((export_kwhd/solar_kwhd)*100*-1).toFixed(0)+"%");
            } else {
                $(".total_use_direct_prc").html("-- %");
                $(".total_export_prc").html("-- %");
            }
            
        }
    });

    // Auto click through to power graph
    $('#placeholder').bind("plotclick", function (event, pos, item)
    {
        if (item && !panning) {
            // console.log(item.datapoint[0]+" "+item.dataIndex);
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
    // console.log(level + ": " + message);
}

</script>
