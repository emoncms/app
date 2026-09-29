<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;

    load_js("Modules/feed/feed.js");
    load_js("Lib/js/flot-5.1.0.mod.min.js");
    load_js("Modules/app/Lib/vis.helper.js");
    load_js("Modules/app/Lib/timeseries.js");
    load_js("Lib/js/DateTimePicker.js");
    load_css("Theme/css/datetimepicker.css");
    load_css("Modules/app/Views/css/app-kit.css");
    load_css("Modules/app/apps/OpenEnergyMonitor/mysolarpv/mysolarpv.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none" class="block">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-sun"></i><?php echo tr('Solar PV') ?></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>

        <div class="app-live">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="usenow">0</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="balance"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR PV') ?></div>
                <div class="app-live-value text-solar"><span class="solarnow"></span><span class="power-unit"></span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php include "Modules/app/Lib/timebar.php"; ?>
            <div class="nav ms-auto">
                <button class="nav-link balanceline" title="<?php echo tr('Show Balance') ?>"><i class="svg-icon-show_chart"></i><?php echo tr('Balance') ?></button>
                <button id="show-all" class="nav-link bargraph-viewall d-none" title="<?php echo tr('Show All') ?>"><i class="svg-icon-expand"></i><?php echo tr('Show All') ?></button>
            </div>
            <div class="btn-group app-segmented viewmode-toggle">
                <button class="btn viewpower active" title="<?php echo tr('Power View') ?>"><?php echo tr('Power') ?></button>
                <button class="btn viewhistory" title="<?php echo tr('View History') ?>"><?php echo tr('Daily') ?><span class="d-none d-sm-inline"> kWh</span></button>
            </div>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="placeholder_bound">
            <div id="placeholder"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

    <div id="breakdown" class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy') ?> &middot; <?php echo tr('this window') ?></span>
        </div>
        <div class="app-live">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="total_use_kwh">--</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span class="total_solar_kwh">--</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('DIRECT') ?></div>
                <div class="app-live-value text-direct"><span class="total_use_direct_prc">--</span><span class="power-unit-static"><span id="total_use_direct_kwh"></span> kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('EXPORT') ?></div>
                <div class="app-live-value text-export"><span class="total_export_prc">--</span><span class="power-unit-static"><span id="total_export_kwh"></span> kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?></div>
                <div class="app-live-value text-import"><span class="total_import_prc">--</span><span class="power-unit-static"><span id="total_import_kwh"></span> kWh</span></div>
            </div>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">The My Solar app can be used to explore onsite solar generation, self consumption, export and building consumption both in realtime with a moving power graph view and historically with a daily and monthly bargraph.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>
<?php load_js("Lib/js/gettext.js"); ?> 
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

if (!sessionwrite) $(".config-open").hide();

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

config.app_name = "My Solar PV";
config.app_name_color = "#dccc1f";

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
    
    $('#time-select').change(function () {
        var hours = parseFloat($(this).val());
        if (!hours) return;
        view.timewindow(hours/24.0);
        live_timerange = view.end - view.start;
        reload = true; 
        autoupdate = true;
        draw();
    });

    // Start and End fields, and the Now button, from Lib/vis.helper.js
    timebar_manual(function () {
        reload = true;
        autoupdate = false;
        draw();
    });
    timebar_now(function (length) {
        live_timerange = length;
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
        var bargraph = $(this).is(".viewhistory");
        if (bargraph === (viewmode == "bargraph")) return;
        viewmode = bargraph ? "bargraph" : "powergraph";
        update_viewmode_buttons();
        if (bargraph) {
            bargraph_events();
        } else {
            powergraph_events();
        }
        draw();
    });

}

// Mode buttons and the controls of each mode. Bar graph has its own window,
// so the time bar is hidden.
function update_viewmode_buttons() {
    var bargraph = viewmode == "bargraph";
    $(".viewhistory").toggleClass("active", bargraph);
    $(".viewpower").toggleClass("active", !bargraph);
    $(".balanceline").toggleClass("d-none", bargraph);
    $("#show-all").toggleClass("d-none", !bargraph);
    $("#graph-nav .app-timebar, #window-label").toggleClass("d-none", bargraph);
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
        $(".viewmode-toggle").show();
    } else {
        $(".viewmode-toggle").hide();
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
    var updatetime = Math.max(feeds[config.app.solar.value].time, feeds[config.app.use.value].time);
    live_status_update(updatetime);

    if (autoupdate) {
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
        $(".balance").parent().css("color", "var(--ec-energy-export)")
    } else {
        $(".balance-label").text(tr("IMPORTING"))
        $(".balance").parent().css("color", "var(--ec-energy-import)")
    }
    balance = Math.round(Math.abs(balance))
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    // convert W to kW
    if(powerUnit === 'kW') {
        solar_now = as_kw(solar_now)
        use_now = as_kw(use_now)
        balance = as_kw(balance)
    } else {
        $('.power-unit').text(powerUnit)
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
        series: { lines: { fill: fill, lineWidth: 2 } },
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none", min: view.start, max: view.end},
        yaxes: [{ min: 0, autoScale: "none" }, { position: "right" }],   // balance line on axis 2
        grid: {
            hoverable: true, 
            clickable: true,
            color: "#aaa",
            borderWidth: 0
        },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
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
        {data:gen_data, name:'solar', label:'Solar', color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
        {data:use_data, name:'use', label:'Use', color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
    ];
    
    if (show_balance_line) series.push({data:store_data, yaxis:2, name:'balance', label:'Balance', color: 'green',xcolor: "#888"});
    
    powerseries = series;
    Flot.plot(document.getElementById('placeholder'),series,options);
    chart_legend(series);
    timebar_update(false);
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

    plot_unbind('placeholder');

    document.getElementById('placeholder').addEventListener("plotselected", plot_handlers.plotselected = function (event) {
        var ranges = event.detail[0];
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

    document.getElementById('placeholder').addEventListener("plothover", plot_handlers.plothover = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
        if (item) {
            // Show tooltip
            var tooltip_items = [];
            var date = new Date(item.datapoint[0]);

            tooltip_items.push(["TIME", tooltip_time(date), ""]);
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
    if (!solar_kwh_data) return;
    var use_kwh_data = feed.getdata(config.app.use_kwh.value,start,end,"daily",0,1);
    if (!use_kwh_data) return;
    var import_kwh_data = feed.getdata(config.app.import_kwh.value,start,end,"daily",0,1);
    if (!import_kwh_data) return;
    
    
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
        label: "Use",
        color: "#0699fa",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 0.8, lineWidth:0}
    });
    
    series.push({
        data: solarused_kwhd_data,
        label: "Solar used",
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 0.6, lineWidth:0}
    });
    
    series.push({
        data: export_kwhd_data,
        label: "Solar export",
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 0.8, lineWidth:0}
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
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds"},
        grid: {hoverable: true, clickable: true, markings:markings},
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    }

    var plot = Flot.plot(document.getElementById('placeholder'),historyseries,options);
    chart_legend(historyseries);
    
    $('#placeholder').append("<div class='chart-note' style='top:30px'><b>Above:</b> Onsite Use & Total Use</div>");
    $('#placeholder').append("<div class='chart-note' style='bottom:50px'><b>Below:</b> Exported solar</div>");

    // Because the bargraph is only drawn once when the view is changed we attach the events at this point
    bargraph_events();
}

// ------------------------------------------------------------------------------------------
// BAR GRAPH EVENTS
// - show bar values on hover
// - click through to power graph
// ------------------------------------------------------------------------------------------
function bargraph_events(){

    plot_unbind('placeholder');
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    document.getElementById('placeholder').addEventListener("plothover", plot_handlers.plothover = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
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
    document.getElementById('placeholder').addEventListener("plotclick", plot_handlers.plotclick = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
        if (item && !panning) {
            // console.log(item.datapoint[0]+" "+item.dataIndex);
            var z = item.dataIndex;
            
            view.start = solar_kwhd_data[z][0];
            view.end = view.start + 86400*1000;
            
            reload = true; 
            autoupdate = false;
            viewmode = "powergraph";
            update_viewmode_buttons();
            
            draw();
            powergraph_events();
        }
    });
    
    document.getElementById('placeholder').addEventListener("plotselected", plot_handlers.plotselected = function (event) {
        var ranges = event.detail[0];
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
