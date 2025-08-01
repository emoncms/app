<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">
<style>
/* mobile version offset is default */
.chart-placeholder {
    --height-offset: 24rem;
}

/*
--------------
    adjust the full height offset for other specific devices
    based on width,height,orientation or dpi 
    @see: list of popular devices... https://css-tricks.com/snippets/css/media-queries-for-standard-devices/
-----------------
*/

/* ----------- bootstrap break points ----------- */
/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
    .chart-placeholder { --height-offset: 25rem; }
}
/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
    .chart-placeholder { --height-offset: 26rem; }
}
/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
    .chart-placeholder { --height-offset: 27rem; }
}
/* DEVICE SPECIFIC: */
/* ----------- Galaxy Tab 2 ----------- */
/* Portrait and Landscape */
@media (min-device-width: 800px) 
  and (max-device-width: 1280px) {
    .chart-placeholder {
        --height-offset: 27rem;
    }
}

/* set chart height to full screen height (100vh) minus an offset to cover the large value indicators and menus */
.chart-placeholder > * {
    height: calc(100vh - var(--height-offset))!important;
    min-height:180px;
}
</style>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 

<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="viewpower active btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo tr('Power View') ?>">
            <span class="d-xs-none"><?php echo tr("Pwr") ?></span>
            <span class="d-none d-xs-inline-block"><?php echo tr("Power") ?></span>
        </button></li>
        <li><button class="viewhistory btn btn-large btn-link btn-inverse myelectric-view-kwh" title="<?php echo tr('View History') ?>">
            <span class="d-xs-none"><?php echo tr("Hist") ?></span>
            <span class="d-none d-xs-inline-block"><?php echo tr("History") ?></span>
        </button></li>
        <li><button class="balanceline btn btn-large btn-link btn-inverse myelectric-view-kwh" title="<?php echo tr('Show Balance') ?>">
            <span class="d-xs-none"><?php echo tr("Bal") ?></span>
            <span class="d-none d-xs-inline-block"><?php echo tr("Balance") ?></span>
        </button></li>
        <li><button id='show-all' class="hide bargraph-viewall btn btn-large btn-link btn-inverse myelectric-view-kwh" title="<?php echo tr('Show All') ?>">
            <span class="d-xs-none"><?php echo tr("All") ?></span>
            <span class="d-none d-xs-inline-block"><?php echo tr("Show All") ?></span>
        </button></li>
    </ul>
    <?php include(dirname(__DIR__).'/config-nav.php'); ?>
</nav>


<section id="app-block" style="display:none" class="block">
    <div class="d-flex justify-content-between">
        <div>
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('USE NOW') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3 text-primary"><span class="usenow">0</span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light px-1"><span class="balance-label"></span></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3"><span class="balance"></span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-right">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('SOLAR PV') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3 text-warning "><span class="solarnow"></span><span class="power-unit"></span></h2>
        </div>
    </div>
    
    <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

    <div id="placeholder_bound" class="chart-placeholder">
        <div id="placeholder"></div>
    </div>
    
    <div id="breakdown" class="d-flex justify-content-between py-lg-3 text-light">
        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo tr('USE') ?></h5>
            <h2 class="appbox-value total_use_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                kWh
            </h5>
        </div>
        <div class="appbox mb-3 text-warning">
            <h5 class="appbox-title mb-1 text-light text-md-larger px-1"><?php echo tr('SOLAR') ?></h5>
            <h2 class="appbox-value total_solar_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                kWh
            </h5>
        </div>
        <div class="appbox mb-3 text-success">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo tr('DIRECT') ?></h5>
            <h2 class="appbox-value total_use_direct_prc my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_use_direct_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
        <div class="appbox mb-3 text-tertiary">
            <h5 class="appbox-title mb-1 text-light text-md-larger px-1"><?php echo tr('EXPORT') ?></h5>
            <h2 class="appbox-value total_export_prc my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_export_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
        <div class="appbox mb-3 text-danger">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo tr('GRID') ?></h5>
            <h2 class="appbox-value total_import_prc my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_import_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
    </div>
</section>



<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xapp-config-description">
                <div class="xapp-config-description-inner text-light">
                    <h2 class="app-config-title text-warning"><?php echo tr('My Solar'); ?></h2>
                    <p class="lead">The My Solar app can be used to explore onsite solar generation, self consumption, export and building consumption both in realtime with a moving power graph view and historically with a daily and monthly bargraph.</p>
                    <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                    <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                    <img src="../Modules/app/images/mysolar_app.png" class="d-none d-sm-inline-block">
                </div>
            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>

<div class="ajax-loader"></div>
<script src="<?php echo $path; ?>Lib/misc/gettext.js?v=<?php echo $v; ?>"></script> 
<script>
function getTranslations(){
    return {
        'House or building use in watts': "<?php echo tr('House or building use in watts') ?>",
        'Solar pv generation in watts': "<?php echo tr('Solar pv generation in watts') ?>",
        'Cumulative use in kWh': "<?php echo tr('Cumulative use in kWh') ?>",
        'Cumulative solar generation in kWh': "<?php echo tr('Cumulative solar generation in kWh') ?>",
        'Cumulative grid import in kWh': "<?php echo tr('Cumulative grid import in kWh') ?>",
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
        'Display solar power as 0 below this threshold in w': "<?php echo tr('Display solar power as 0 below this threshold in w') ?>",
        'PERFECT BALANCE': "<?php echo tr('PERFECT BALANCE') ?>",
        'EXPORTING': "<?php echo tr('EXPORTING') ?>",
        'IMPORTING': "<?php echo tr('IMPORTING') ?>",
    }
}
</script>
<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});
if (!sessionwrite) $(".config-open").addClass('hide');

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "description":tr("House or building use in watts")},
    "solar":{"type":"feed", "autoname":"solar", "description":tr("Solar pv generation in watts")},
    //"export":{"type":"feed", "autoname":"export", "engine":5, "description":"Exported solar in watts"},
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "description":tr("Cumulative use in kWh")},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "description":tr("Cumulative solar generation in kWh")},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "description":tr("Cumulative grid import in kWh")},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":tr("Display power as kW")},
    "solar_disp_min":{"type":"value", "default":10, "name": "Solar Threshold", "description":tr("Display solar power as 0 below this threshold in w")}
    //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
};

config.id = "<?php echo $id; ?>";
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};
var live = false;
var show_balance_line = 0;
var reload = true;
var autoupdate = true;
var lastupdate = 0;
var viewmode = "powergraph";
var historyseries = [];
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;
var live_timerange = 0;
var meta = {};
var power_graph_end_time = 0;

var storage_type = "balance";            // balance or battery
var storage_capacity = 0;               // kWh
var round_trip_efficiency = 0.8;
var single_trip_efficiency = 1 - ((1 - round_trip_efficiency)/2);

var powerseries = null;

config.init();

// App start function
function init()
{        
    app_log("INFO","mysolarpv init");
    var solar_kwh = config.app.solar_kwh.value;
    var use_kwh = config.app.use_kwh.value;
    var import_kwh = config.app.import_kwh.value;

    var timeWindow = (3600000*6.0*1);
    view.end = +new Date;

    if (config.app.use.value) {
        meta['use'] = feed.getmeta(config.app.use.value);
        if (meta['use'].end_time>power_graph_end_time) power_graph_end_time = meta['use'].end_time;
    }

    if (config.app.solar.value) {
        meta['solar'] = feed.getmeta(config.app.solar.value);
        if (meta['solar'].end_time>power_graph_end_time) power_graph_end_time = meta['solar'].end_time;
    }

    // If the feed is more than 1 hour behind then start the view at the end of the feed
    if ((view.end*0.001-power_graph_end_time)>3600) {
        view.end = power_graph_end_time*1000;
        autoupdate = false;
    }
    view.start = view.end - timeWindow;
    live_timerange = timeWindow;
    
    if (solar_kwh && use_kwh && import_kwh) {
        init_bargraph();
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
        live_timerange = view.end - view.start;
        reload = true; 
        autoupdate = true;
        draw();
    });
    
    $(".balanceline").click(function () { 
        if (show_balance_line === 0) {
            show_balance_line = 1;
            $(this).toggleClass('active', true);
            draw();
        } else {
            show_balance_line = 0;
            $(this).toggleClass('active', false);
            draw();
        }
    });
    
    $(".viewhistory, .viewpower").click(function () {
        // flip modes
        if (viewmode === "powergraph") {
            // history
            viewmode = "bargraph";
            $(".balanceline").toggleClass('hide', true);
            $(".viewpower").toggleClass('active', false); 
            $(".viewhistory").toggleClass('active', true); 
            $('#graph-nav').css({opacity: 0});
            $('#show-all').toggleClass('hide', false);
            $('#history-nav').toggleClass('hide d-flex');

            bargraph_events();

        } else {
            // power
            viewmode = "powergraph";
            $(".balanceline").toggleClass('hide', false);
            $(".viewpower").toggleClass('active', true); 
            $(".viewhistory").toggleClass('active', false); 
            $('#graph-nav').css({opacity: 1});
            $('#show-all').toggleClass('hide', true);
            $('#history-nav').toggleClass('hide d-flex');

            powergraph_events();
        }
        draw();
    });

    $("<div id='tooltip'><span id='value'></span> <span id='unit'></span></div>").appendTo("body");

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


function show() 
{
    app_log("INFO","mysolarpv show");
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
    livefn();
    
    // reload data at interval
    live = setInterval(livefn,5000);

}

function resize() 
{
    app_log("INFO","mysolarpv resize");

    if($('#app-block').is(":visible")) {
        draw();
    }
}

function hide() 
{
    clearInterval(live);
}

function livefn()
{
    // Check if the updater ran in the last 60s if it did not the app was sleeping
    // and so the data needs a full reload.
    var now = +new Date();
    if ((now-lastupdate)>60000) reload = true;
    lastupdate = now;
    
    var feeds = feed.listbyid();
    if (feeds === null) { return; }
    var solar_now = parseInt(feeds[config.app.solar.value].value);
    var use_now = parseInt(feeds[config.app.use.value].value);

    if (autoupdate) {
        var updatetimesolar = feeds[config.app.solar.value].time;
        var updatetimeuse = feeds[config.app.use.value].time;
        var updatetime = Math.max(updatetimesolar, updatetimeuse);
        
        power_graph_end_time = updatetime;
        timeseries.append("solar",updatetime,solar_now);
        timeseries.trim_start("solar",view.start*0.001);
        timeseries.append("use",updatetime,use_now);
        timeseries.trim_start("use",view.start*0.001);

        // Advance view
        view.end = now;
        view.start = view.end - live_timerange;
    }
    // Lower limit for solar
    if (solar_now<config.app.solar_disp_min.value) solar_now = 0;
    
    var balance = solar_now - use_now;
    if (balance==0) {
        $(".balance-label").html(tr("PERFECT BALANCE"));
        $(".balance").html("");
    }
    
    if (balance>0) {
        $(".balance-label").text(tr("EXPORTING"))
        $(".balance").parent()
        .removeClass('text-danger')
        .addClass('text-success')
    } else {
        $(".balance-label").text(tr("IMPORTING"))
        $(".balance").parent()
        .addClass('text-danger')
        .removeClass('text-success')
    }
    balance = Math.round(Math.abs(balance))
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    // convert W to kW
    if(powerUnit === 'kW') {
        solar_now = as_kw(solar_now)
        use_now = as_kw(use_now)
        balance = as_kw(balance)
        $('#app-block').addClass('in_kw')
    } else {
        $('.power-unit').text(powerUnit)
        $('#app-block').removeClass('in_kw')
    }
    $('.power-unit').text(powerUnit)
    $(".solarnow").html(solar_now)
    $(".usenow").html(use_now)
    $(".balance").text(balance)
    
    // Only redraw the graph if its the power graph and auto update is turned on
    
    if (viewmode=="powergraph" && autoupdate && $('#placeholder_bound').width() > 0) draw();
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
        grid: {
            hoverable: true, 
            clickable: true,
            color: "#aaa",
            borderWidth: 0
        },
        selection: { mode: "x" }
    }
    view.calc_interval(1500); // npoints = 1500
    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        timeseries.load("solar",feed.getdata(config.app.solar.value,view.start,view.end,view.interval,1));
        timeseries.load("use",feed.getdata(config.app.use.value,view.start,view.end,view.interval,1));
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
    
    var interval = view.interval;
    var sample_size = Math.min(timeseries.length("solar"), timeseries.length("use"));

    for (var z=0; z<sample_size; z++) {
        var time = datastart + (1000 * interval * z);

        // -------------------------------------------------------------------------------------------------------
        // Get solar or use values
        // -------------------------------------------------------------------------------------------------------
        if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);
        if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
        
        if (time*0.001<=power_graph_end_time) {
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (solar_now<config.app.solar_disp_min.value) solar_now = 0;
            var balance = solar_now - use_now;
            
            if (balance>=0) total_use_direct_kwh += (use_now*interval)/(1000*3600);
            if (balance<0) total_use_direct_kwh += (solar_now*interval)/(1000*3600);
            
            
            var store_change = (balance * interval) / (1000*3600);
            store += store_change;
            
            if (storage_capacity!=0) {
                if (store>storage_capacity) store = storage_capacity;
                if (store<0) store = 0;
            }
            
            total_solar_kwh += (solar_now*interval)/(1000*3600);
            total_use_kwh += (use_now*interval)/(1000*3600);
            
            
            use_data.push([time,use_now]);
            gen_data.push([time,solar_now]);
            bal_data.push([time,balance]);
            store_data.push([time,store]);
        }

        t += interval;
    }
    
    // Consider loading totals from kWh feeds if available
    // Need to avoid too many requests here, currently updating every 10s
    /*
    console.log("-----");
    
    skwh = get_kwh_between_two_timestamps('solar_kwh',view.start*0.001,view.end*0.001);
    console.log(skwh);
    
    ukwh = get_kwh_between_two_timestamps('use_kwh',view.start*0.001,view.end*0.001);
    console.log(ukwh);
    
    ikwh = get_kwh_between_two_timestamps('import_kwh',view.start*0.001,view.end*0.001);
    console.log(ikwh);
    
    console.log((ukwh-ikwh)/skwh)
    */
    
    if (total_solar_kwh < 1) {
    	$(".total_solar_kwh").html(total_solar_kwh.toFixed(2));
    } else {
    	$(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
    }
    if (total_use_kwh < 1) {
    	$(".total_use_kwh").html((total_use_kwh).toFixed(2));
    } else {
    	$(".total_use_kwh").html((total_use_kwh).toFixed(1));
    }
    $("#total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));

    $("#total_export_kwh").html((total_solar_kwh-total_use_direct_kwh).toFixed(1));
    var import_percent = Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)));
    if(!isNaN(import_percent)) {
        $(".total_import_prc").html(import_percent+"%");
    }
    $("#total_import_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        
    
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
        {data:gen_data, name:'solar', color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
        {data:use_data, name:'use', color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
    ];
    
    if (show_balance_line) series.push({data:store_data, yaxis:2, name:'balance', color: 'green',xcolor: "#888"});
    
    powerseries = series;
    $.plot($('#placeholder'),series,options);
    $(".ajax-loader").hide();
}

function get_kwh_between_two_timestamps(key,start,end) {
    if (meta[key]!=undefined) {
        if (start<meta[key].start_time) start = meta[key].start_time;
        if (end>meta[key].end_time) end = meta[key].end_time;
        
        var kwh_start = feed.getvalue(config.app[key].value,start);
        var kwh_end = feed.getvalue(config.app[key].value,end);
        return kwh_end - kwh_start;
    }
    return false;
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
            live_timerange = view.end - view.start;
            
        }

        draw();
    });

    // position the tooltip and insert the correct value on hover
    // hide the tooltip on mouseout  

    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            // Show tooltip
            var tooltip_items = [];
            var date = new Date(item.datapoint[0]);

            tooltip_items.push(["TIME", dateFormat(date, 'HH:MM'), ""]);
            if (powerseries) {
                for (i = 0; i < powerseries.length; i++) {
                    var series = powerseries[i];
                    if (series.data[item.dataIndex]!=undefined && series.data[item.dataIndex][1]!=null) {
                        if (series.name.toUpperCase()=="BALANCE") {
                            tooltip_items.push([series.name.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "kWh"]);
                        } else {
                            if ( series.data[item.dataIndex][1] >= 1000) {
                                tooltip_items.push([series.name.toUpperCase(), series.data[item.dataIndex][1].toFixed(0)/1000 , "kW"]);
                            } else {
                                tooltip_items.push([series.name.toUpperCase(), series.data[item.dataIndex][1].toFixed(0), "W"]);
                            }
                        }
                    }
                }
            }
            show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
        } else {
            // Hide tooltip
            hide_tooltip();
        }
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
    meta['solar_kwh'] = feed.getmeta(config.app.solar_kwh.value);
    meta['use_kwh'] = feed.getmeta(config.app.use_kwh.value);
    meta['import_kwh'] = feed.getmeta(config.app.import_kwh.value);
    if (meta['solar_kwh'].start_time > latest_start_time) latest_start_time = meta['solar_kwh'].start_time;
    if (meta['use_kwh'].start_time > latest_start_time) latest_start_time = meta['use_kwh'].start_time;
    if (meta['import_kwh'].start_time > latest_start_time) latest_start_time = meta['import_kwh'].start_time;
    latest_start_time = latest_start_time;

    var earliest_start_time = meta['solar_kwh'].start_time;
    earliest_start_time = Math.min(meta['use_kwh'].start_time, earliest_start_time);
    earliest_start_time = Math.min(meta['import_kwh'].start_time, earliest_start_time);
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
    var solar_kwh_data = feed.getdata(config.app.solar_kwh.value,start,end,"daily",0,1);
    var use_kwh_data = feed.getdata(config.app.use_kwh.value,start,end,"daily",0,1);
    var import_kwh_data = feed.getdata(config.app.import_kwh.value,start,end,"daily",0,1);
    
    
    solarused_kwhd_data = [];
    solar_kwhd_data = [];
    use_kwhd_data = [];
    export_kwhd_data = [];
    
    if (solar_kwh_data.length>0) {
    
        for (var day=0; day<solar_kwh_data.length; day++)
        {
            var solar_kwh = solar_kwh_data[day][1];
            var use_kwh = use_kwh_data[day][1];
            var import_kwh = import_kwh_data[day][1];
            
            var export_kwh = solar_kwh - (use_kwh - import_kwh);
            
            if (solar_kwh!=null && use_kwh!=null & export_kwh!=null) {
                let time = solar_kwh_data[day][0];
                solarused_kwhd_data.push([time,solar_kwh - export_kwh]);
                solar_kwhd_data.push([time,solar_kwh]);
                use_kwhd_data.push([time,use_kwh]);
                export_kwhd_data.push([time,export_kwh*-1]);
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
            
            if (solar_kwhd < 1) {
                $(".total_solar_kwh").html((solar_kwhd).toFixed(2));
            } else {
                $(".total_solar_kwh").html((solar_kwhd).toFixed(1));
            }
            if (use_kwhd < 1) {
                $(".total_use_kwh").html((use_kwhd).toFixed(2));
            } else {
                $(".total_use_kwh").html((use_kwhd).toFixed(1));
            }
            
            $("#total_use_direct_kwh").html((solarused_kwhd).toFixed(1));
            
            $("#total_export_kwh").html((export_kwhd*-1).toFixed(1));
            
            $(".total_import_prc").html(((imported_kwhd/use_kwhd)*100).toFixed(0)+"%");
            $("#total_import_kwh").html((imported_kwhd).toFixed(1));
    
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
            
            $(".balanceline").toggleClass('hide', false);
            $(".viewpower").toggleClass('active', true); 
            $(".viewhistory").toggleClass('active', false); 
            $('#graph-nav').css({opacity: 1});
            $('#show-all').toggleClass('hide', true);
            $('#history-nav').toggleClass('hide d-flex');

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
        $btn = $(this);
        $btn.toggleClass('active');
        if ($btn.is('.active')) {
            // show all
            var start = latest_start_time * 1000;
            var end = +new Date;
            load_bargraph(start,end);
        } else {
            // show 40 days
            var timeWindow = (3600000*24.0*40);
            var end = +new Date;
            var start = end - timeWindow;
            load_bargraph(start,end);
        }
        draw();
    });
}
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})


// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    // console.log(level+": "+message);
}
</script>
