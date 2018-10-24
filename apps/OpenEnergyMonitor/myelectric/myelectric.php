<?php
    global $path, $session;
    $v = 5;
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; echo $appdir; ?>graph_energy.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; echo $appdir; ?>graph_power.js?v=<?php echo $v; ?>"></script> 

<div id="app-container" style="display:none">

  <div class="col1"><div class="col1-inner">

    <div style="height:20px; border-bottom:1px solid #333; padding-bottom:8px;">
    
        <div style="float:left; color:#aaa">
        <span class="myelectric-view-cost" >Cost</span> | 
        <span class="myelectric-view-kwh" >kWh</span>
        </div>
    
        <div style="float:right;">
            <i class="config icon-wrench icon-white" style="cursor:pointer; padding-right:5px"></i>
        </div>
    </div>
    
    <table style="width:100%">
        <tr>
            <td style="border:0; width:50%">
                <div class="electric-title">POWER NOW</div>
                <div class="power-value"><span id="powernow">0</span></div>
            </td>
            <td style="text-align:right; border:0;">
                <div class="electric-title">TODAY</div>
                <div class="power-value"><span id="usetoday_units_a"></span><span id="usetoday">0</span><span id="usetoday_units_b" style="font-size:16px"> kWh</span></div>
            </td>
        </tr>
    </table>

    <br>

    <div class="visnavblock" style="height:28px; padding-bottom:5px;">
        <span class='visnav myelectric-time' time='3'>3h</span>
        <span class='visnav myelectric-time' time='6'>6h</span>
        <span class='visnav myelectric-time' time='24'>D</span>
        <span class='visnav myelectric-time' time='168'>W</span>
        <span class='visnav myelectric-time' time='720'>M</span>
        <span id='zoomin' class='visnav' >+</span>
        <span id='zoomout' class='visnav' >-</span>
        <span id='left' class='visnav' ><</span>
        <span id='right' class='visnav' >></span>
    </div>
    <br>
    
    <div id="placeholder_bound_power" style="width:100%; height:220px;">
        <canvas id="placeholder_power"></canvas>
    </div>
    <br>
    
    <div id="placeholder_bound_kwhd" style="width:100%; height:250px;">
        <canvas id="placeholder_kwhd"></canvas>
    </div>
    <br>
        
    <table style="width:100%">
        <tr>
            <td class="appbox">
                <div class="appbox-title">WEEK</div>
                <div><span class="appbox-value u1a" style="color:#0699fa">£</span><span class="appbox-value" id="week_kwh" style="color:#0699fa">---</span> <span class="units appbox-units u1b" style="color:#0779c1">kWh</span></div>
                
                <div style="padding-top:5px; color:#0779c1" class="appbox-units" ><span class="units u2a"></span><span id="week_kwhd">---</span><span class="units u2b"> kWh/d</span></div>
            </td>
            
            <td class="appbox">
                <div class="appbox-title">MONTH</div>
                <div><span class="appbox-value u1a" style="color:#0699fa">£</span><span class="appbox-value" id="month_kwh" style="color:#0699fa">---</span> <span class="units appbox-units u1b" style="color:#0779c1">kWh</span></div>
                
                <div style="padding-top:5px; color:#0779c1" class="appbox-units" ><span class="units u2a"></span><span id="month_kwhd">---</span><span class="units u2b"> kWh/d</span></div>
            </td>
            
            <td class="appbox">
                <div class="appbox-title">YEAR</div>
                <div><span class="appbox-value u1a" style="color:#0699fa">£</span><span class="appbox-value" id="year_kwh" style="color:#0699fa">---</span> <span class="units appbox-units u1b" style="color:#0779c1">kWh</span></div>
                
                <div style="padding-top:5px; color:#0779c1" class="appbox-units" ><span class="units u2a"></span><span id="year_kwhd">---</span><span class="units u2b"> kWh/d</span></div>
            </td>
            
            <td class="appbox">
                <div class="appbox-title">ALL</div>
                <div><span class="appbox-value u1a" style="color:#0699fa">£</span><span class="appbox-value" id="alltime_kwh" style="color:#0699fa">---</span> <span class="units appbox-units u1b" style="color:#0779c1">kWh</span></div>
                
                <div style="padding-top:5px; color:#0779c1" class="appbox-units" ><span class="units u2a"></span><span id="alltime_kwhd">---</span><span class="units u2b"> kWh/d</span></div>
            </td>
        </tr>
    </table>
    
  </div></div>
  
</div>   

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">My Electric</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        The My Electric app is a simple home energy monitoring app for exploring home or building electricity consumption over time. It includes a real-time view and a historic kWh per day bar graph.
        <br><br>
        <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
        <br><br>
        <b>Cumulative kWh</b> feeds can be generated from power feeds with the power_to_kwh input processor.
        <br><br>
        <img src="../Modules/app/images/myelectric_app.png" style="width:600px" class="img-rounded">
        
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
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
    "unitcost":{"type":"value", "default":0.1508, "name": "Unit cost", "description":"Unit cost of electricity e.g £/kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$,€...)"}
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
var daily_data = [];
var daily = [];
var raw_kwh_data = [];
var kwhdtmp = [];

var updateTimerFast = false;
var updateTimerSlow = false;

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
    appLog("INFO", "myelectric init");

    var timewindow = (3600000*3.0*1);
    view.end = +new Date;
    view.start = view.end - timewindow;

    // -------------------------------------------------------------------------
    // Decleration of myelectric events
    // -------------------------------------------------------------------------
    
    $("#zoomout").click(function () {view.zoomout(); reload = true; autoupdate = false; updateFast();});
    $("#zoomin").click(function () {view.zoomin(); reload = true; autoupdate = false; updateFast();});
    $('#right').click(function () {view.panright(); reload = true; autoupdate = false; updateFast();});
    $('#left').click(function () {view.panleft(); reload = true; autoupdate = false; updateFast();});
    
    $('.myelectric-time').click(function () {
        view.timewindow($(this).attr("time")/24.0); 
        reload = true; 
        autoupdate = true;
        updateFast();
    });
    
    $(".myelectric-view-cost").click(function(){
        viewmode = "cost";
        updateFast();
        updateSlow();
    });
    
    $(".myelectric-view-kwh").click(function(){
        viewmode = "energy";
        updateFast();
        updateSlow();
    });
}
    
function show()
{   
    /*
    $(".navbar-inner").css('background-image','none');
    $(".navbar-inner").css('background-color','#44b3e2');
    $(".nav li a").css('color','#fff');
    $(".nav li a").css('text-shadow','none');
    $(".caret").css('border-top-color','#fff');
    $(".caret").css('border-bottom-color','#fff');
    */
    
    appLog("INFO", "myelectric show");
    // start of all time
    var meta = feed.getMeta(config.app.use_kwh.value);
    startalltime = meta.start_time;
    view.first_data = meta.start_time * 1000;
    
    reloadkwhd = true;
    
    // resize and start updaters
    resize();
    // called from withing resize:
    // updateFast();
    // updateSlow();
    
    updateTimerFast = setInterval(updateFast, 5000);
    updateTimerSlow = setInterval(updateSlow, 60000);
}
    
function resize() 
{
    appLog("INFO", "myelectric resize");
    
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
    
    
    if (width<=500) {
        $(".electric-title").css("font-size","16px");
        $(".power-value").css("font-size","38px");
        $(".units").hide();
        $(".visnav").css("padding-left","5px");
        $(".visnav").css("padding-right","5px");
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","52px");
        $(".units").show();
        $(".visnav").css("padding-left","8px");
        $(".visnav").css("padding-right","8px");
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","85px");
        $(".units").show();
        $(".visnav").css("padding-left","8px");
        $(".visnav").css("padding-right","8px");
    }
    
    reloadkwhd = true;
    updateFast();
    updateSlow();
}
    
function hide()
{
    clearInterval(updateTimerFast);
    clearInterval(updateTimerSlow);
}
    
function updateFast()
{
   var use = config.app.use.value;
   var use_kwh = config.app.use_kwh.value;

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
        
        timeseries.load("use", feed.getData(use, view.start, view.end, interval, 0, 0));
    }
    
    // --------------------------------------------------------------------
    // 1) Get last value of feeds
    // --------------------------------------------------------------------
    feeds = feed.getListById();
    
    // set the power now value
    if (viewmode=="energy") {
        if (feeds[use].value<10000) {
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
        startofweek = feed.getValue(use_kwh, time);
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
        startofmonth = feed.getValue(use_kwh, time);
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
        startofyear = feed.getValue(use_kwh, time);
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
    
function updateSlow()
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
    var start = end - interval * Math.round(energyGraph.width/30);
    
    var result = feed.getDailyData(use_kwh, start*1000, end*1000);

    var data = [];
    // remove nan values from the end.
    for (z in result) {
      if (result[z][1]!=null) {
        data.push(result[z]);
      }
    }
    
    daily = [];
    
    if (data.length>0) {
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
    
        // Calculate the daily totals by subtracting each day from the day before
        
        for (var z=1; z<data.length; z++)
        {
          var time = data[z-1][0];
          var diff = (data[z][1]-data[z-1][1]);
          daily.push([time,diff*scale]);
        }
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

$(window).resize(function(){ resize(); });

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
