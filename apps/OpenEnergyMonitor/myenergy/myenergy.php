<?php
    global $path, $session, $v;
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
<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="balanceline btn btn-large btn-link btn-inverse myelectric-view-kwh" title="<?php echo _('Show Balance') ?>">
            <?php echo _("Show Balance") ?>
        </li>
    </ul>
    <?php include(dirname(__DIR__).'/config-nav.php'); ?>

</nav>
    
<section id="app-block" style="display:none" class="block">
    <div id="summary" class="d-flex justify-content-between">
        <div class="text-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo _('USE NOW') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3 text-primary"><span class="usenow"></span><span class="power-unit"></span></h2>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0 text-md-larger text-light px-1"><span class="balance-label"></span></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3"><span class="balance"></span></h2>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo _('RENEWABLE GEN') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 my-0 text-warning "><span class="gennow"></span><span class="power-unit"></span></h2>

            <h5 class="electric-title mt-0 mb-lg-3 text-md-larger ">
                <span class="text-warning" title="<?php echo _('SOLAR') ?>"><span class="d-none d-sm-inline-block"><?php echo _('SOLAR') ?>: </span> <span class="solarnow">0</span><span class="power-unit"></span></span> | 
                <span class="text-success" title="<?php echo _('WIND') ?>"><span class="d-none d-sm-inline-block"><?php echo _('WIND') ?>: </span> <span class="windnow">0</span><span class="power-unit"></span></span>
            </h5>
        </div>
    </div>

    <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

    <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
    </div>
        
    <div id="breakdown" class="d-flex justify-content-between py-lg-3 text-light">
        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo _('USE') ?></h5>
            <h2 class="appbox-value total_use_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                kWh
            </h5>
        </div>
        <div class="appbox mb-3 text-tertiary">
            <h5 class="appbox-title mb-1 text-light text-md-larger px-1"><?php echo _('WIND') ?></h5>
            <h2 class="appbox-value total_wind_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_export_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
        <div class="appbox mb-3 text-warning">
            <h5 class="appbox-title mb-1 text-light text-md-larger px-1"><?php echo _('SOLAR') ?></h5>
            <h2 class="appbox-value total_solar_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                kWh
            </h5>
        </div>
        <div class="appbox mb-3 text-success">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo _('DIRECT') ?></h5>
            <h2 class="appbox-value total_use_direct_prc my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_use_direct_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
        <div class="appbox mb-3 text-danger">
            <h5 class="appbox-title mb-1 text-light text-md-larger"><?php echo _('GRID') ?></h5>
            <h2 class="appbox-value total_use_via_store_kwh my-0">--</h2>
            <h5 class="appbox-units my-0">
                <span id="total_import_kwh"></span>
                <span>kWh</span>
            </h5>
        </div>
    </div>
</section>

<section id="app-setup" class="hide pb-3 px-3">
    <!-- instructions and settings -->
    <div class="row-fluid">
        <div class="span9">
            <div class="text-light">
                <h2 class="app-config-title text-warning"><?php echo _('My Solar'); ?> & <?php echo _('Wind'); ?></h2>
                <p class="lead">This app extends the My Solar app by adding in a 'share of UK wind' estimate.</p>
                <p>The share of wind estimate is calculated by using real-time electricity data from wind power in the uk and then scaling it so that the annual wind generation matches a percentage of annual household consumption. The default estimate assumes 60% or near 2000 kWh annually. This is close to the fuel mix quoted by two of the UK's leading green electricity suppliers.</p>
                <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                <img src="../Modules/app/images/mysolar_app.png" class="d-none d-sm-inline-block">
            </div>
        </div>
        <div class="span3 app-config pt-3"></div>
    </div>
</section>

<div class="ajax-loader"></div>

<script src="<?php echo $path; ?>Lib/misc/gettext.js?v=<?php echo $v; ?>"></script> 
<script>
function getTranslations(){
    return {
        'House or building use in watts': "<?php echo _('House or building use in watts') ?>",
        'Solar pv generation in watts': "<?php echo _('Solar pv generation in watts') ?>",
        'kWh of wind energy bought annually': "<?php echo _('kWh of wind energy bought annually') ?>",
        'Display power as kW': "<?php echo _('Display power as kW') ?>",
    }
}
</script>
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
config.app = {
    "use":{"type":"feed", "autoname":"use", "engine":"5", "description":_("House or building use in watts")},
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "engine":"5", "description":_("Solar pv generation in watts")},
    "windkwh":{"type":"value", "default":2000, "name": "kWh Wind", "description":_("kWh of wind energy bought annually")},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":_("Display power as kW")}
};
config.name = "<?php echo $name; ?>";
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
    app_log("INFO","mysolarpv init");
    
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
        $link = $(this);
        $link.toggleClass('active');
        show_balance_line = $link.is('.active') ? 1: 0;
        draw();
    });     
}

function show() 
{
    app_log("INFO","mysolarpv show");
    resize();
    livefn();
    live = setInterval(livefn,5000);

}

function resize() 
{
    app_log("INFO","mysolarpv resize");
    
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = $(window).height()*0.55;

    if (height>width) height = width;
    if (height<180) height = 180;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);

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
    var powerUnit = config.app.kw.value===true ? 'kW' : 'W';
    var feeds = feed.listbyid();
    if (feeds === null) { return; }
    var solar_now = 0;
    if (config.app.solar.value)
        solar_now = parseInt(feeds[config.app.solar.value].value);
        
    var use_now = parseInt(feeds[config.app.use.value].value);
    var gridwind = feed.getvalueremote(67088);
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
        $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }
    
    if (balance<0) {
        $(".balance-label").html("BACKUP");
        $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }

    // convert W to kW
    if(powerUnit === 'kW') {
        solar_now = as_kw(solar_now)
        use_now = as_kw(use_now)
        gridwind = as_kw(gridwind)
        average_power = as_kw(average_power)
        wind_now = as_kw(wind_now)
        gen_now = as_kw(gen_now)
        balance = as_kw(balance)
        $('.power-unit').text('kW')
        $('#app-block').addClass('in_kw');
    } else {
        gen_now = Math.round(gen_now)
        wind_now = Math.round(wind_now)
        $('.power-unit').text('W')
        $('#app-block').removeClass('in_kw');
    }

    $(".gennow").html(gen_now);
    $(".solarnow").html(solar_now);
    $(".windnow").html(wind_now);
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
        if (feedid!=false)
            timeseries.load("solar",feed.getdata(feedid,view.start,view.end,interval,0,0));
        
        var feedid = config.app.use.value;
        timeseries.load("use",feed.getdata(config.app.use.value,view.start,view.end,interval,0,0));
        
        timeseries.load("remotewind",feed.getdataremote(67088,view.start,view.end,interval));    
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

// on finish sidebar hide/show
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})
// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
