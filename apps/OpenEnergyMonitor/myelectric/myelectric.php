<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/graph_bars.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/graph_lines.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script> 

<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="btn btn-large btn-link btn-inverse myelectric-view-cost" ><?php echo _("Cost") ?></button></li>
        <li><button class="btn btn-large btn-link btn-inverse myelectric-view-kwh active" ><?php echo _("kWh") ?></button></li>
    </ul>
    <?php include(dirname(__DIR__).'/config-nav.php'); ?>
</nav>

<section id="app-block" style="display:none">
    <div class="d-flex justify-content-between">
        <div>
            <h5 class="electric-title mb-0 text-sm-larger text-light"><?php echo _('POWER NOW') ?></h5>
            <h2 class="power-value display-sm-4 display-sm-3 display-lg-2 mt-0 mb-lg-3 text-primary">
                <span id="powernow">0</span>
            </h2>
        </div>
        <div class="text-xs-right">
            <h5 class="electric-title mb-0 text-sm-larger text-light"><?php echo _('TODAY') ?></h5>
            <h2 class="power-value display-sm-4 display-sm-3 display-lg-2 mt-0 mb-lg-3 text-primary">
                <span id="usetoday_units_a"></span>
                <span id="usetoday"></span>
                <small id="usetoday_units_b" class="usetoday"></small>
            </h2>
        </div>
    </div>

    <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

    <div class="d-flex justify-content-between">
        <div class="chart-placeholder double" id="placeholder_bound_power">
            <canvas id="placeholder_power"></canvas>
        </div>
        <div class="chart-placeholder double" id="placeholder_bound_kwhd">
            <canvas id="placeholder_kwhd"></canvas>
        </div>
    </div>


    <div id="breakdown" class="d-flex justify-content-between py-lg-2 text-light">
        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title my-0 text-light text-sm-larger"><?php echo _('WEEK') ?></h5>
            <h3 class="appbox-value mb-0 text-sm-larger">
                <span class="u1a"></span>
                <span id="week_kwh"></span>
                <small class="u1b"></small>
            </h3>
            <h5 class="appbox-units my-0">
                <span class="u2a"></span>
                <span id="week_kwhd"></span>
                <span class="u2b">/day</span>
            </h5>
        </div>

        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title my-0 text-light text-sm-larger"><?php echo _('MONTH') ?></h5>
            <h3 class="appbox-value mb-0 text-sm-larger">
                <span class="u1a"></span>
                <span id="month_kwh"></span>
                <small class="u1b"></small>
            </h3>
            <h5 class="appbox-units my-0">
                <span class="u2a"></span>
                <span id="month_kwhd"></span>
                <span class="u2b">/day</span>
            </h5>
        </div>

        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title my-0 text-light text-sm-larger"><?php echo _('YEAR') ?></h5>
            <h3 class="appbox-value mb-0 text-sm-larger">
                <span class="u1a"></span>
                <span id="year_kwh"></span>
                <small class="u1b"></small>
            </h3>
            <h5 class="appbox-units my-0">
                <span class="u2a"></span>
                <span id="year_kwhd"></span>
                <span class="u2b">/day</span>
            </h5>
        </div>

        <div class="appbox mb-3 text-primary">
            <h5 class="appbox-title my-0 text-light text-sm-larger"><?php echo _('ALL') ?></h5>
            <h3 class="appbox-value mb-0 text-sm-larger">
                <span class="u1a"></span>
                <span id="alltime_kwh"></span>
                <small class="u1b"></small>
            </h3>
            <h5 class="appbox-units my-0">
                <span class="u2a"></span>
                <span id="alltime_kwhd"></span>
                <span class="u2b">/day</span>
            </h5>
        </div>
    </div>
</section>


<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span9 appconfig-description">
                <div class="appconfig-description-inner text-light">
                    <h2 class="appconfig-title text-primary"><?php echo _('My Electric'); ?></h2>
                    <p class="lead">The My Electric app is a simple home energy monitoring app for exploring home or building electricity consumption over time. It includes a real-time view and a historic kWh per day bar graph.</p>
                    <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                    <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                    <img src="../Modules/app/images/myelectric_app.png" class="d-none d-sm-inline-block">
                </div>
            </div>
            <div class="span3 app-config pt-3"></div>
        </div>
    </div>
</section>

<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>

<script src="<?php echo $path; ?>Lib/misc/gettext.js?v=<?php echo $v; ?>"></script> 
<script>
function getTranslations(){
    return {
        'House or building use in watts': "<?php echo _('House or building use in watts') ?>",
        'Cumulative use in kWh': "<?php echo _('Cumulative use in kWh') ?>",
        'Unit cost of electricity e.g £/kWh': "<?php echo _('Unit cost of electricity e.g £/kWh') ?>",
        'Currency symbol (£,$,€...)': "<?php echo _('Currency symbol (£,$,€...)') ?>",
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
    "use":{"type":"feed", "autoname":"use", "engine":"5", "description":"House or building use in watts"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
    "unitcost":{"type":"value", "default":0.1508, "name": "Unit cost", "description":"Unit cost of electricity e.g £/kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$,€...)"},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":_("Display power as kW")}
};

config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// App variable init
// ----------------------------------------------------------------------
var daily_data = [];
var daily = [];
var raw_kwh_data = [];
var kwhdtmp = [];

var fastupdateinst = false;
var slowupdateinst = false;

var viewmode = "energy";

var startofweek = [0,0];
var startofmonth = [0,0];
var startofyear = [0,0];
var startofday = 0;
var startalltime = 0;

var last_daytime =0;                 // used for reload kwhd daily graph
var last_startofweektime = 0;        // used for reloading statistics
var last_startofmonthtime = 0;
var last_startofyeartime = 0;

var lastupdate = 0; 
var autoupdate = true;
var reload = true;
var feeds = {};

config.init();

function init()
{   
    app_log("INFO","myelectric init");

    var timewindow = (3600000*3.0*1);
    view.end = +new Date;
    view.start = view.end - timewindow;

    // -------------------------------------------------------------------------
    // Decleration of myelectric events
    // -------------------------------------------------------------------------
    
    $("#zoomout").click(function (e) {view.zoomout(); reload = true; autoupdate = false; fastupdate(e);});
    $("#zoomin").click(function (e) {view.zoomin(); reload = true; autoupdate = false; fastupdate(e);});
    $('#right').click(function (e) {view.panright(); reload = true; autoupdate = false; fastupdate(e);});
    $('#left').click(function (e) {view.panleft(); reload = true; autoupdate = false; fastupdate(e);});
    
    // zoom graph to timescale
    $('.time').click(function (event) {
        view.timewindow($(this).attr("time")/24.0); 
        reload = true; 
        autoupdate = true;
        fastupdate(event);
    });
    
    // toggle cost/kwh
    $(".myelectric-view-cost").click(function(event){
        viewmode = "cost";
        fastupdate(event);
        slowupdate();
        $('.myelectric-view-cost').toggleClass('active', true);
        $('.myelectric-view-kwh').toggleClass('active', false);
    });
    
    $(".myelectric-view-kwh").click(function(event){
        viewmode = "energy";
        fastupdate(event);
        slowupdate();
        $('.myelectric-view-cost').toggleClass('active', false);
        $('.myelectric-view-kwh').toggleClass('active', true);
    });
}
    
function show()
{      
    app_log("INFO","myelectric show");
    // start of all time
    var meta = {};
    $.ajax({                                      
        url: path+"feed/getmeta.json",                         
        data: "id="+config.app.use_kwh.value+apikeystr,
        dataType: 'json',
        async: false,                      
        success: function(data_in) { meta = data_in; }
    });
    startalltime = meta.start_time;
    view.first_data = meta.start_time * 1000;
    
    reloadkwhd = true;
    
    // resize and start updaters
    resize();
    // called from withing resize:
    fastupdate();
    slowupdate();
    
    fastupdateinst = setInterval(fastupdate,5000);
    slowupdateinst = setInterval(slowupdate,60000);
}
    
function resize() 
{
    app_log("INFO","myelectric resize");
    
    var windowheight = $(window).height();
    
    bound = {};
    
    var width = $("#placeholder_bound_kwhd").width();
    $("#placeholder_kwhd").attr('width',width);
    graph_bars.width = width;
    
    var height = $("#placeholder_bound_kwhd").height();
    $("#placeholder_kwhd").attr('height',height); 
    graph_bars.height = height;
    
    var width = $("#placeholder_bound_power").width();
    $("#placeholder_power").attr('width',width);
    graph_lines.width = width;
    
    var height = $("#placeholder_bound_power").height();
    $("#placeholder_power").attr('height',height); 
    graph_lines.height = height;
    
    if($('#app-block').is(":visible")) {
        reloadkwhd = true;
        fastupdate();
        slowupdate();
    }
}
    
function hide()
{
    clearInterval(fastupdateinst);
    clearInterval(slowupdateinst);
}
    
function fastupdate(event)
{
   var use = config.app.use.value;
   var use_kwh = config.app.use_kwh.value;
   if (event && event.target) {
       // triggered by click
       $target = $(event.target);
       $target.addClass('active').siblings().removeClass('active');
   }
    if (viewmode=="energy") {
        scale = 1;
        $("#usetoday_units_a").html("");
        $("#usetoday_units_b").html(" kWh");
        $(".u1a").html(""); $(".u1b").html("kWh");
        $(".u2a").html(""); $(".u2b").html(" kWh/d");
    } else {
        scale = config.app.unitcost.value;
        $("#usetoday_units_a").html(config.app.currency.value);
        $("#usetoday_units_b").html("");
        $(".u1a").html(config.app.currency.value); $(".u1b").html("");
        $(".u2a").html(config.app.currency.value); $(".u2b").html("/day");
    }
    
    var now = new Date();
    var timenow = now.getTime();
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    // --------------------------------------------------------------------------------------------------------
    // REALTIME POWER GRAPH
    // -------------------------------------------------------------------------------------------------------- 
    // Check if the updater ran in the last 60s if it did not the app was sleeping
    // and so the data needs a full reload.
    
    if ((timenow-lastupdate)>60000) {
        reload = true;
        var timewindow = view.end - view.start;
        view.end = timenow;
        view.start = view.end - timewindow;
    }
    
    lastupdate = timenow;
    
    // reload power data
    if (reload) {
        reload = false;
        
        var npoints = 1500;
        interval = Math.round(((view.end - view.start)/npoints)/1000);
        if (interval<1) interval = 1;
        
        view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
        view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
        
        timeseries.load("use",feed.getdata(use,view.start,view.end,interval,0,0));
    }
    
    // --------------------------------------------------------------------
    // 1) Get last value of feeds
    // --------------------------------------------------------------------
    feeds = feed.listbyid();
    if (feeds === null) { return; }
    
    // set the power now value
    if (viewmode=="energy") {
        if (powerUnit==='W') {
            $("#powernow").html((feeds[use].value*1).toFixed(0)+"W");
        } else {
            $("#powernow").html((feeds[use].value*0.001).toFixed(1)+"kW");
        }
    } else {
        // 1000W for an hour (x3600) = 3600000 Joules / 3600,000 = 1.0 kWh x 0.15p = 0.15p/kWh (scaling factor is x3600 / 3600,000 = 0.001)
        var cost_now = feeds[use].value*1*config.app.unitcost.value*0.001;
        
        if (cost_now<1.0) {
            $("#powernow").html(config.app.currency.value+(feeds[use].value*1*config.app.unitcost.value*0.001).toFixed(3)+"/hr");
        } else {
            $("#powernow").html(config.app.currency.value+(feeds[use].value*1*config.app.unitcost.value*0.001).toFixed(2)+"/hr");
        }
    }
    // Advance view
    if (autoupdate) {

        // move the view along
        var timerange = view.end - view.start;
        view.end = timenow;
        view.start = view.end - timerange;
        
        timeseries.append(
            "use", 
            feeds[use].time, 
            feeds[use].value
        );
        
        // delete data that is now beyond the start of our view
        timeseries.trim_start("use",view.start*0.001);
    }
    
    // draw power graph
    var options = {
        axes: {
            color: "rgba(6,153,250,1.0)",
            font: "12px arial"
        },
        
        xaxis: {
            minor_tick: 60000*10,
            major_tick: 60000*60
        },
        
        yaxis: {
            title: "Power (Watts)",
            units: "W",
            minor_tick: 250,
            major_tick: 1000
        }
    };
    
    var timewindowhours = Math.round((view.end-view.start)/3600000);
    options.xaxis.major_tick = 30*24*3600*1000;
    if (timewindowhours<=24*7) options.xaxis.major_tick = 24*3600*1000;
    if (timewindowhours<=24) options.xaxis.major_tick = 2*3600*1000;
    if (timewindowhours<=12) options.xaxis.major_tick = 1*3600*1000;
    options.xaxis.minor_tick = options.xaxis.major_tick / 4;
    
    
    var series = {
        "solar": {
            color: "rgba(255,255,255,1.0)",
            data: []
        },
        "use": {
            color: "rgba(6,153,250,0.5)",
            data: timeseries.data("use")
        }
    };
    
    graph_lines.draw("placeholder_power",series,options);
    $(".ajax-loader").hide();

    // --------------------------------------------------------------------------------------------------------
    // THIS WEEK, MONTH, YEAR TOTALS
    // --------------------------------------------------------------------------------------------------------
    // All time total
    var alltime_kwh = feeds[use_kwh].value;
    // -------------------------------------------------------------------------------------------------------- 
    // WEEK: Get the time of the start of the week, if we have rolled over to a new week, load the watt hour
    // value in the watt accumulator feed recorded for the start of this week. (scale is unitcost)
    var dayofweek = now.getDay();
    if (dayofweek>0) dayofweek -= 1; else dayofweek = 6;

    var time = new Date(now.getFullYear(),now.getMonth(),now.getDate()-dayofweek).getTime();
    if (time!=last_startofweektime) {
        startofweek = feed.getvalue(use_kwh,time);
        last_startofweektime = time;
    }
    if (startofweek===false) startofweek = [startalltime*1000,0];
    
    // Week total
    var week_kwh = alltime_kwh - (startofweek[1]);
    $("#week_kwh").html((scale*week_kwh).toFixed(1));
    var days = ((feeds[use_kwh].time - (startofweek[0]*0.001))/86400);
    $("#week_kwhd").html((scale*week_kwh/days).toFixed(1));
    // --------------------------------------------------------------------------------------------------------       
    // MONTH: repeat same process as above (scale is unitcost)
    var time = new Date(now.getFullYear(),now.getMonth(),1).getTime();
    if (time!=last_startofmonthtime) {
        startofmonth = feed.getvalue(use_kwh,time);
        last_startofmonthtime = time;
    }
    if (startofmonth===false) startofmonth = [startalltime*1000,0];
    
    // Monthly total
    var month_kwh = alltime_kwh - (startofmonth[1]);
    $("#month_kwh").html(Math.round(scale*month_kwh));
    var days = ((feeds[use_kwh].time - (startofmonth[0]*0.001))/86400);
    $("#month_kwhd").html((scale*month_kwh/days).toFixed(1));
    // -------------------------------------------------------------------------------------------------------- 
    // YEAR: repeat same process as above (scale is unitcost)
    var time = new Date(now.getFullYear(),0,1).getTime();
    if (time!=last_startofyeartime) {
        startofyear = feed.getvalue(use_kwh,time);
        last_startofyeartime = time;
    }
    if (startofyear===false) startofyear = [startalltime*1000,0];     
    
    // Year total
    var year_kwh = alltime_kwh - (startofyear[1]);
    $("#year_kwh").html(Math.round(scale*year_kwh));
    var days = ((feeds[use_kwh].time - (startofyear[0]*0.001))/86400);
    $("#year_kwhd").html((scale*year_kwh/days).toFixed(1));
    // -------------------------------------------------------------------------------------------------------- 
    // ALL TIME (scale is unitcost)
    $("#alltime_kwh").html(Math.round(scale*alltime_kwh));
    var days = ((feeds[use_kwh].time - startalltime)/86400);
    $("#alltime_kwhd").html((scale*alltime_kwh/days).toFixed(1));
    // --------------------------------------------------------------------------------------------------------        
}
    
function slowupdate()
{
   var use = config.app.use.value;
   var use_kwh = config.app.use_kwh.value;
   
    // When we make a request for daily data it returns the data up to the start of this day. 
    // This works appart from a request made just after the start of day and before the buffered 
    // data is written to disk. This produces an error as the day rolls over.

    // Most of the time the request will return data where the last datapoint is the start of the
    // current day. If the start of the current day is less than 60s (the buffer time)  from the 
    // current day then the last datapoint will be the previous day start.

    // The easy solution is to request the data every 60s and then always append the last kwh value 
    // from feeds to the end as a new day, with the interval one day ahead of the last day in the kwh feed.

    // This presents a minor error for 60s after midnight but should not be noticable in most cases 
    // and will correct itself after the 60s is over.
    
    var interval = 86400;
    var now = new Date();
    var end = Math.floor(now.getTime() * 0.001);
    var start = end - interval * Math.round(graph_bars.width/30);
    
    var result = feed.getdataDMY(use_kwh,start*1000,end*1000,"daily");

    var data = [];
    // remove nan values from the end.
    for (z in result) {
      if (result[z][1]!=null) {
        data.push(result[z]);
      }
    }
    
    daily = [];

    if (data.length==0) {
        // If empty, then it's a new feed and we can safely append today's value.
        // Also append a fake value for the day before so that the calculations work.
        if (feeds[use_kwh]!=undefined) {
            var d = new Date();
            d.setHours(0,0,0,0);
            data.push([d.getTime(),0]);
            data.push([d.getTime()+(interval*1000),feeds[use_kwh].value*1.0]);
        }
    } else {
        var lastday = data[data.length-1][0];
        
        var d = new Date();
        d.setHours(0,0,0,0);
        if (lastday==d.getTime()) {
            // last day in kwh data matches start of today from the browser's perspective
            // which means its safe to append today kwh value
            var next = data[data.length-1][0] + (interval*1000);
            if (feeds[use_kwh]!=undefined) {
                data.push([next,feeds[use_kwh].value*1.0]);
            }
        }
    }
    
    // Calculate the daily totals by subtracting each day from the day before
    for (var z=1; z<data.length; z++)
    {
      var time = data[z-1][0];
      var diff = (data[z][1]-data[z-1][1]);
      daily.push([time,diff*scale]);
    }
    
    var usetoday_kwh = 0;
    if (daily.length>0) {
        usetoday_kwh = daily[daily.length-1][1];
    }
    
    if (usetoday_kwh<100) {
        $("#usetoday").html((usetoday_kwh).toFixed(1));
    } else {
        $("#usetoday").html((usetoday_kwh).toFixed(0));
    }

    graph_bars.draw('placeholder_kwhd',[daily]);
    $(".ajax-loader").hide();
}
// on finish sidebar hide/show
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})

$(function(){
    // listen to the config.closed event before resizing the graph
    $('body').on('config.closed', function() {
        $('#app-block').removeClass('hide');
        $('#app-setup').addClass('hide');
        resize();
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
