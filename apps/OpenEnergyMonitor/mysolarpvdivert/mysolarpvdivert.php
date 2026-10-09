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
                <button class="nav-link active"><i class="svg-icon-sun"></i><?php echo tr('Solar PV divert') ?></button>
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
                <div class="app-live-label"><?php echo tr('TOTAL USE') ?></div>
                <div class="app-live-value text-use"><span class="usenow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="balance">--</span><span class="balance-unit power-unit-static"></span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="generationtitle"><?php echo tr('SOLAR') ?></span></div>
                <div class="app-live-value text-solar"><span class="generationnow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('HOUSE') ?></div>
                <div class="app-live-value text-house"><span class="housenow">0</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('DIVERT') ?></div>
                <div class="app-live-value text-battery"><span class="divertnow">-</span><span class="power-unit"></span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php include "Modules/app/Lib/timebar.php"; ?>
            <div class="btn-group app-segmented viewmode-toggle ms-auto">
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

    <div class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy flow') ?> &middot; <?php echo tr('this window') ?></span>
        </div>

        <div class="app-flow">
            <div id="solar-box" class="app-flow-node app-flow-wide statsbox-solar">
                <span class="app-flow-name generationtitle"><?php echo tr('SOLAR') ?></span><span class="app-flow-value total_generated_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc app-flow-prc-bottom-left solar_to_divert_prc" title="<?php echo tr('Share of generation') ?>"></span>
                <span class="app-flow-prc app-flow-prc-bottom-right solar_to_house_prc" title="<?php echo tr('Share of generation') ?>"></span>
                <span class="app-flow-prc app-flow-prc-right solar_to_grid_prc" title="<?php echo tr('Share of generation') ?>"></span>
            </div>
            <div id="solar-to-grid-box" class="app-flow-link" title="<?php echo tr('Export') ?>">
                <span class="app-flow-title"><?php echo tr('Export') ?></span><span class="app-flow-value total_export_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9654;</span>
            </div>
            <div id="grid-box" class="app-flow-node statsbox-import" title="<?php echo tr('Grid balance') ?>">
                <span class="app-flow-name"><?php echo tr('GRID') ?></span><span class="app-flow-value total_grid_balance_kwh">0</span><span class="app-flow-unit">kWh</span>
            </div>

            <div id="solar-to-divert-box" class="app-flow-link">
                <span class="app-flow-value solar_to_divert_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div id="grid-to-divert-box" class="app-flow-link">
                <span id="grid_boost"><span class="app-flow-arrow">&#9664;</span><span class="app-flow-title"><span class="app-flow-long"><?php echo tr('Grid boost') ?></span><span class="app-flow-short"><?php echo tr('Boost') ?></span></span><span class="app-flow-value grid_to_divert_kwh">0</span></span>
            </div>
            <div id="solar-to-house-box" class="app-flow-link">
                <span class="app-flow-value solar_to_house_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div class="app-flow-link"></div>
            <div id="grid-to-house-box" class="app-flow-link">
                <span class="app-flow-value grid_to_house_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>

            <div id="divert-box" class="app-flow-node statsbox-battery">
                <span class="app-flow-name"><?php echo tr('DIVERT') ?></span><span class="app-flow-value total_divert_kwh">0</span><span class="app-flow-unit">kWh</span>
            </div>
            <div class="app-flow-link"></div>
            <div id="house-box" class="app-flow-node app-flow-wide statsbox-house">
                <span class="app-flow-name"><?php echo tr('HOUSE') ?></span><span class="app-flow-value total_house_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc app-flow-prc-top-left house_from_solar_prc" title="<?php echo tr('Share of house') ?>"></span>
                <span class="app-flow-prc app-flow-prc-top-right house_from_grid_prc" title="<?php echo tr('Share of house') ?>"></span>
            </div>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
<p class="lead">
The My Solar with Divert app can be used to explore onsite solar (and optionally wind) generation, self consumption, export and building consumption.</p>
<p>It is designed for users who divert some or all of their excess generated power to something. For example an immersion heater or electric car. It shows all of this both in realtime with a moving power graph view and historically with a daily and monthly bargraph.
</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<?php load_js("Lib/js/gettext.js"); ?> 
<script>
function getTranslations(){
    return {
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
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
    "use":{"type":"feed", "autoname":"use", "description":"Total use in watts (including diversion)"},
    "solar":{"type":"feed", "autoname":"solar", "description":"Solar pv generation in watts"},
    "wind":{"optional":true, "type":"feed", "autoname":"wind", "description":"Wind generation in watts"},
    "divert":{"type":"feed", "autoname":"divert", "description":"Immersion usage in watts"},
    //"export":{"type":"feed", "autoname":"export", "description":"Exported solar in watts"},
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "description":"Cumulative total use in kWh (including diversion)"},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "description":"Cumulative solar generation in kWh"},
    "wind_kwh":{"optional":true, "type":"feed", "autoname":"wind_kwh", "description":"Cumulative wind generation in kWh"},
    "divert_kwh":{"optional":true, "type":"feed", "autoname":"divert_kwh", "description":"Cumulative divert energy in kWh"},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "description":"Cumulative grid import in kWh"},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":tr("Display power as kW")},
    "live_size":{"type":"select", "default":"Small", "options":["Small", "Large"], "name":"Live value size", "description":"Text size of the live values at the top of the app"}
    //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
}

config.app_name = "My Solar PV Divert";
config.app_name_color = "#dccc1f";

config.id = <?php echo $id; ?>;
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
var show_balance_line = false;
var has_wind = false;
var reload = true;
var autoupdate = true;
var lastupdate = 0;
var viewmode = "powergraph";
var historyseries = [];
var powerseries = [];
var balance_series = null;
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;
var live_timerange = 0;

config.init();

// App start function
function init()
{        
    app_log("INFO","mysolarpvdivert init");

    var timeWindow = (3600000*6.0*1);
    view.end = +new Date;
    view.start = view.end - timeWindow;
    live_timerange = timeWindow;
    
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
        // $(".viewhistory").show();
    } else {
        // $(".viewhistory").hide();
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
        reload = true; 
        autoupdate = true;
        live_timerange = view.end - view.start;
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
    
    // Balance toggle at the end of the legend, rebuilt on each draw
    $("#chart-legend").on("click", ".balanceline", function () {
        show_balance_line = !show_balance_line;
        draw();
    });
    
    $(".viewpower, .viewhistory").click(function () {
        var bargraph = $(this).is(".viewhistory");
        if (bargraph === (viewmode == "bargraph")) return;
        viewmode = bargraph ? "bargraph" : "powergraph";
        update_viewmode_buttons();
        if(viewmode==='powergraph') {
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
    $("#graph-nav .app-timebar, #window-label").toggleClass("d-none", bargraph);
}

function show() 
{
    app_log("INFO","mysolarpvdivert show");

    $(".app-live").toggleClass("is-large", config.app.live_size.value == "Large");
    
    if (config.app.solar_kwh.value && config.app.use_kwh.value && config.app.import_kwh.value && config.app.divert_kwh.value) {
        if (!bargraph_initialized) init_bargraph();
    }
    
    resize();
    
    livefn();
    live = setInterval(livefn,5000);

}

function resize() 
{
    app_log("INFO","mysolarpvdivert resize");
    
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    // Height from the top of the chart to the bottom of the viewport, with room
    // for the legend and the flow card, as MyElectricFlow
    var width = placeholder_bound.width();
    var bottom_margin = $('#chart-legend').outerHeight(true) + $('.app-flow').closest('.app-card').outerHeight(true) + 40;
    var offset_top = placeholder_bound.offset().top - $(window).scrollTop();
    var height = $(window).height() - offset_top - bottom_margin;

    if (height<200) height = 200;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height);
    
    draw();
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
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    var feeds = feed.listbyid();
    if (feeds === null) { return; }
    var solar_now = parseInt(feeds[config.app.solar.value].value);
    var use_now = parseInt(feeds[config.app.use.value].value);
    var divert_now = parseInt(feeds[config.app.divert.value].value);
    
    var wind_now = 0;
    if (has_wind) {
      wind_now = parseInt(feeds[config.app.wind.value].value);
    }

    var updatetime = feeds[config.app.solar.value].time;
    live_status_update(updatetime);

    if (autoupdate) {
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
        view.end = now;
        view.start = now - live_timerange;
    }
    // Lower limit for solar & divert
    if (solar_now<10) solar_now = 0;
    if (wind_now<10) wind_now = 0;
    if (divert_now<10) divert_now = 0;
    
    var balance = (solar_now + wind_now) - use_now;

    var house_now = use_now - divert_now;
    
    // convert W to kW
    if(powerUnit === 'kW') {
        gen_now = as_kw(solar_now + wind_now)
        solar_now = as_kw(solar_now)
        house_now = as_kw(house_now)
        divert_now = as_kw(divert_now)
        wind_now = as_kw(wind_now)
        use_now = as_kw(use_now)
        balance = as_kw(balance)
        $('.power-unit').text('kW')
    } else {
        wind_now = Math.round(wind_now)
        solar_now = Math.round(solar_now)
        gen_now = solar_now + wind_now
        balance = Math.round(balance)
        $('.power-unit').text('W')
    }

    if (balance==0) {
        $(".balance-label").html("PERFECT BALANCE");
        $(".balance").html("--").parent().css("color", "");
        $(".balance-unit").text("");
    }
    
    if (balance>0) {
        $(".balance-label").html("EXPORTING");
        $(".balance").html(Math.round(Math.abs(balance))).parent().css("color", "var(--ec-energy-export)");
        $(".balance-unit").text(powerUnit);
    }
    
    if (balance<0) {
        $(".balance-label").html("IMPORTING");
        $(".balance").html(Math.round(Math.abs(balance))).parent().css("color", "var(--ec-energy-import)");
        $(".balance-unit").text(powerUnit);
    }
    
    $(".generationnow").html(gen_now);
    $(".housenow").html(house_now);
    $(".divertnow").html(divert_now);
    $(".usenow").html(use_now);
    
    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && autoupdate) draw();
}

function draw()
{
    if (viewmode=="powergraph") {
        draw_powergraph();
        chart_legend(powerseries.filter(function (s) { return s !== balance_series; }));
        $("#chart-legend").append('<button class="app-legend-item app-legend-toggle balanceline' + (show_balance_line ? ' active' : '') + '" title="Show or hide the balance line">'
            + '<span class="app-legend-line" style="background:' + balance_series.color + '"></span>' + balance_series.label + '</button>');
        timebar_update(false);
    }
    if (viewmode=="bargraph") {
        draw_bargraph();
        chart_legend(historyseries);
    }
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
        grid: { hoverable: true, clickable: true },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    }
    
    view.calc_interval(1500); // npoints = 1500
    
    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        timeseries.load("solar",feed.getdata(config.app.solar.value,view.start,view.end,view.interval));
        timeseries.load("use",feed.getdata(config.app.use.value,view.start,view.end,view.interval));
        timeseries.load("divert",feed.getdata(config.app.divert.value,view.start,view.end,view.interval));
        if (has_wind) {
          timeseries.load("wind",feed.getdata(config.app.wind.value,view.start,view.end,view.interval));
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
    var total_house_generated_kwh = 0;
    var total_divert_kwh = 0;
    var total_solar_divert_kwh = 0;
    
    var datastart = timeseries.start_time("solar");
    
    var interval = view.interval;
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
        
        var balance_house = generated_now - house_now;
        if (balance_house>=0) {
            total_house_generated_kwh += (house_now*interval)/(1000*3600);
        }
        if (balance_house<0) {
            total_house_generated_kwh += (generated_now*interval)/(1000*3600);
        }
        
        // Surplus after the house goes to divert, any remainder of divert is grid boost
        var solar_divert_now = Math.min(divert_now, Math.max(0, generated_now - Math.max(0, house_now)));
        total_solar_divert_kwh += (solar_divert_now*interval)/(1000*3600);

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
    update_flow_stats(total_generated_kwh, total_house_kwh, total_divert_kwh, total_house_generated_kwh, total_solar_divert_kwh);

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    
    var series = [];
    
    series.push({data:solar_data, label: "Solar", color: "#dccc1f", stack:1, lines:{lineWidth:0, fill:1.0}});
    if (has_wind) series.push({data:wind_data, label: "Wind", color: "#1fdc6e", stack:1, lines:{lineWidth:0, fill:1.0}});
    
    series.push({data:house_data, label: "House", color: "#82cbfc", stack:2, lines:{lineWidth:0, fill:0.8}});
    series.push({data:divert_data, label: "Divert", color: "#fb7b50", stack:2, lines:{lineWidth:0, fill:0.8}});
    
    balance_series = {data:store_data, label: "Balance", yaxis:2, color: "#888"};
    if (show_balance_line) series.push(balance_series);

    powerseries = series;
    
    Flot.plot(document.getElementById('placeholder'),powerseries,options);
    $(".ajax-loader").hide();
}

// ------------------------------------------------------------------------------------------
// POWER GRAPH EVENTS
// ------------------------------------------------------------------------------------------

function powergraph_events() {

    plot_unbind('placeholder');

    document.getElementById('placeholder').addEventListener("plothover", plot_handlers.plothover = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
        if (item) {
            // Show tooltip
            var tooltip_items = [];

            var date = new Date(item.datapoint[0]);
            tooltip_items.push(["TIME", tooltip_time(date), ""]);

            for (i = 0; i < powerseries.length; i++) {
                var series = powerseries[i];
                if (series.data[item.dataIndex]!=undefined && series.data[item.dataIndex][1]!=null) {
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
            }
            show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

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
    var solar_meta = feed.getmeta(config.app.solar_kwh.value);
    var use_meta = feed.getmeta(config.app.use_kwh.value);
    var divert_meta = feed.getmeta(config.app.divert_kwh.value);
    var import_meta = feed.getmeta(config.app.import_kwh.value);
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
    var solar_kwh_data = feed.getdata(config.app.solar_kwh.value,start,end,"daily",0,1);
    var use_kwh_data = feed.getdata(config.app.use_kwh.value,start,end,"daily",0,1);
    var import_kwh_data = feed.getdata(config.app.import_kwh.value,start,end,"daily",0,1);
    var divert_kwh_data = feed.getdata(config.app.divert_kwh.value,start,end,"daily",0,1);
    
    var wind_kwh_data = [];
    if (has_wind && config.wind_kwh) {
        wind_kwh_data = feed.getdata(config.wind_kwh.value,start,end,"daily",0,1);
    }
    
    house_generated_kwhd_data = [];
    solar_kwhd_data = [];
    wind_kwhd_data = [];
    use_kwhd_data = [];
    house_kwhd_data = [];
    divert_kwhd_data = [];
    solar_divert_kwhd_data = [];
    export_kwhd_data = [];
    
    if (solar_kwh_data.length) {    
        for (var day=0; day<solar_kwh_data.length; day++)
        {
            var solar_kwh = solar_kwh_data[day][1];
            var use_kwh = use_kwh_data[day][1];
            var import_kwh = import_kwh_data[day][1];
            var divert_kwh = divert_kwh_data[day][1];
            
            var wind_kwh = null;
            if (has_wind && wind_kwh_data[day]) {
                wind_kwh = wind_kwh_data[day][1];
            }
            
            var generated_kwh = solar_kwh + wind_kwh;
            var export_kwh = generated_kwh - (use_kwh - import_kwh);
            var house_kwh = use_kwh - divert_kwh;
            // Generation used on site goes to the house first, then divert
            var generated_used_kwh = use_kwh - import_kwh;
            var house_generated_kwh = Math.max(0, Math.min(generated_used_kwh, house_kwh));
            var solar_divert_kwh = Math.max(0, Math.min(generated_used_kwh - house_generated_kwh, divert_kwh));
            
            if (solar_kwh!=null && use_kwh!=null && export_kwh!=null && divert_kwh!=null && house_kwh!=null && (!has_wind || wind_kwh!=null))
            {
                var time = solar_kwh_data[day][0];
                house_generated_kwhd_data.push([time,house_generated_kwh]);
                solar_kwhd_data.push([time,solar_kwh]);
                if (wind_kwh!=null) wind_kwhd_data.push([time,wind_kwh]);
                use_kwhd_data.push([time,use_kwh]);
                house_kwhd_data.push([time,house_kwh*-1]);
                divert_kwhd_data.push([time,divert_kwh]);
                solar_divert_kwhd_data.push([time,solar_divert_kwh]);
                export_kwhd_data.push([time,export_kwh]);
            }
        }
    }
    
    var series = [];
    
    series.push({
        data: house_generated_kwhd_data,
        label: "House",
        color: "#82cbfc",
        bars: { show: true, align: "center", barWidth: [0.8*3600*24*1000, true], fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: solar_divert_kwhd_data,
        label: "Divert",
        color: "#fb7b50",
        bars: { show: true, align: "center", barWidth: [0.8*3600*24*1000, true], fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: export_kwhd_data,
        label: "Export",
        color: "#2ed52e",
        bars: { show: true, align: "center", barWidth: [0.8*3600*24*1000, true], fill: 1.0, lineWidth: 0 },
        stack: 1
    });
    
    series.push({
        data: house_kwhd_data,
        label: "Use",
        color: "#0598fa",
        bars: { show: true, align: "center", barWidth: [0.8*3600*24*1000, true], fill: 1.0, lineWidth: 0 },
        stack: 2
    });
    
    historyseries = series;
}

// ------------------------------------------------------------------------------------------
// Flow block totals and percentages from generation, house and divert energy and the
// generation share of house and divert. Grid supplies the rest of house and divert.
// ------------------------------------------------------------------------------------------
function update_flow_stats(generated_kwh, house_kwh, divert_kwh, solar_to_house_kwh, solar_to_divert_kwh)
{
    var solar_to_grid_kwh = generated_kwh - solar_to_house_kwh - solar_to_divert_kwh;
    var grid_to_house_kwh = house_kwh - solar_to_house_kwh;
    var grid_to_divert_kwh = divert_kwh - solar_to_divert_kwh;
    var grid_balance_kwh = solar_to_grid_kwh - grid_to_house_kwh - grid_to_divert_kwh;

    // Blank below the 0.1 kWh shown in the boxes
    function prc(kwh, total_kwh) {
        return total_kwh >= 0.05 ? ((kwh / total_kwh) * 100).toFixed(0) + "%" : "";
    }

    $(".total_generated_kwh").html(generated_kwh.toFixed(1));
    $(".total_house_kwh").html(house_kwh.toFixed(1));
    $(".total_divert_kwh").html(divert_kwh.toFixed(1));
    $(".total_export_kwh").html(solar_to_grid_kwh.toFixed(1));
    $(".total_grid_balance_kwh").html(grid_balance_kwh.toFixed(1));
    $(".solar_to_house_kwh").html(solar_to_house_kwh.toFixed(1));
    $(".solar_to_divert_kwh").html(solar_to_divert_kwh.toFixed(1));
    $(".grid_to_house_kwh").html(grid_to_house_kwh.toFixed(1));
    $(".grid_to_divert_kwh").html(grid_to_divert_kwh.toFixed(1));

    $(".solar_to_house_prc").html(prc(solar_to_house_kwh, generated_kwh));
    $(".solar_to_divert_prc").html(prc(solar_to_divert_kwh, generated_kwh));
    $(".solar_to_grid_prc").html(prc(solar_to_grid_kwh, generated_kwh));
    $(".house_from_solar_prc").html(prc(solar_to_house_kwh, house_kwh));
    $(".house_from_grid_prc").html(prc(grid_to_house_kwh, house_kwh));

    $("#grid_boost").toggle(grid_to_divert_kwh >= 0.1);
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
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", minTickSize: [1, "day"] },
        grid: { hoverable: true, clickable: true, markings: markings },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };
    
    var plot = Flot.plot(document.getElementById('placeholder'),historyseries,options);
    
    $('#placeholder').append("<div class='chart-note' style='top:30px'><b>Above:</b> Solar usage (house, diverted & exported)</div>");
    $('#placeholder').append("<div class='chart-note' style='bottom:50px'><b>Below:</b> House usage</div>");

    // Because the bargraph is only drawn once when the view is changed we attach the events at this point
    bargraph_events();
}

// ------------------------------------------------------------------------------------------
// BAR GRAPH EVENTS
// - show bar values on hover
// - click through to power graph
// ------------------------------------------------------------------------------------------
function bargraph_events() {

    plot_unbind('placeholder');
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    document.getElementById('placeholder').addEventListener("plothover", plot_handlers.plothover = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
        if (item) {
            var z = item.dataIndex;
            
            var solar_kwh = solar_kwhd_data[z][1];
            var wind_kwh = (has_wind) ? wind_kwhd_data[z][1] : 0;
            var house_generated_kwh = house_generated_kwhd_data[z][1];
            var house_kwh = house_kwhd_data[z][1]*-1;
            var divert_kwh = divert_kwhd_data[z][1];
            
            var generated_kwh = solar_kwh + wind_kwh;
            update_flow_stats(generated_kwh, house_kwh, divert_kwh, house_generated_kwh, solar_divert_kwhd_data[z][1]);
        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

    // Auto click through to power graph
    document.getElementById('placeholder').addEventListener("plotclick", plot_handlers.plotclick = function (event)
    {
        var pos = event.detail[0], item = event.detail[1];
        if (item && !panning) {
            var z = item.dataIndex;
            
            view.start = solar_kwhd_data[z][0];
            view.end = view.start + 86400*1000;

            plot_unbind('placeholder');
            
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

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        resize()
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
