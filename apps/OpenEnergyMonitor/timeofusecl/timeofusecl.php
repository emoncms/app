<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>

<style>

.electric-title {
    font-weight:bold;
    font-size:18px;
    color:#44b3e2;
}

.power-value {
    font-weight:bold; 
    font-size:28px; 
    color:#44b3e2;
    line-height: 1.1;
}

.block-bound {
  background-color:rgb(68,179,226);
}

</style>

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-block" style="display:none">
    
  <div class="col1"><div class="col1-inner">
  
    <div class="block-bound">
      <div class="bluenav config-open"><i class="icon-wrench icon-white"></i></div>
      <div class="bluenav viewcostenergy">ENERGY MODE</div>
      <!--<div class="bluenav cost">Cost</div>
      <div class="bluenav energy">Energy</div>-->
      <div class="block-title">TIME OF USE</div>
    </div>

    <div style="background-color:#fff; color:#333; padding:10px;">
      <table style="width:100%">
        <tr>
          <td style="width:40%">
              <div class="electric-title">POWER NOW</div>
              <div class="power-value"><span id="power_now">0</span></div>
          </td>
          <td style="text-align:right">
              <div class="electric-title">USE TODAY</div>
              <div class="power-value"><span id="kwh_today">0</span></div>
          </td>
        </tr>
      </table>
    </div>
    
  </div></div>
  <div class="col1"><div class="col1-inner">

    <div class="block-bound">
    
      <div class="bargraph-navigation">
        <!--<div class="bluenav bargraph-other">OTHER</div>-->
        <div class="bluenav bargraph-alltime">ALL TIME</div>
        <div class="bluenav bargraph-month">MONTH</div>
        <div class="bluenav bargraph-week">WEEK</div>
      </div>
      
      <div class="powergraph-navigation" style="display:none">
        <div class="bluenav viewhistory">VIEW HISTORY</div>
        <span class="bluenav" id="right" >&gt;</span>
        <span class="bluenav" id="left" >&lt;</span>
        <span class="bluenav" id="zoomout" >-</span>
        <span class="bluenav" id="zoomin" >+</span>
        <span class="bluenav time" time='720'>M</span>
        <span class="bluenav time" time='168'>W</span>
        <span class="bluenav time" time='24'>D</span>
      </div>
        
      <div class="block-title">HISTORY</div>
         
    </div>
    
    <div style="background-color:rgba(68,179,226,0.1); padding:10px;">
      <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>
          
    <div id="power-graph-footer" style="background-color:#eee; color:#333; display:none">
      <div id='advanced-toggle' class='bluenav' >SHOW DETAIL</div>
 
       <div style="padding:10px;">
        kWh in window: <b id="window-kwh"></b> <b>kWh</b>
      <//div>
      
      <div style="clear:both"></div>
    </div>
          
    <div id="advanced-block" style="background-color:#eee; padding:10px; display:none">
      <div style="color:#000">
        <table class="table">
          <tr>
          <th></th>
          <th style="text-align:center">Min</th>
          <th style="text-align:center">Max</th>
          <th style="text-align:center">Diff</th>
          <th style="text-align:center">Mean</th>
          <th style="text-align:center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
      </div>
    </div>
    
  </div></div>
    
  <div class="col2">
    <div class="col2-inner">
      <div class="block-bound">
          <div class="block-title">TOTALS</div>
      </div>
      
      <div style="background-color:rgba(68,179,226,0.1); padding:20px; color:#333;">
          <span id="totals">
          <div class="electric-title">TIER 0 TOTAL</div>
          <div class="power-value">0</div><br>
          </span>
      </div>
    </div>
  </div>

  <div class="col2">
    <div class="col2-inner">
      <div class="block-bound">
          <div class="block-title">AVERAGES</div>
      </div>
      
      <div style="background-color:rgba(68,179,226,0.1); padding:20px; color:#333;">
          <span id="averages">
          <div class="electric-title">TIER 0 DAILY AVERAGE</div>
          <div class="power-value">0</div><br>
          </span>
      </div>
    </div>
  </div>
  
</div>    
</div>



<section id="app-setup" class="hide pb-3 px-3">
    <!-- instructions and settings -->
    <div class="row-fluid">
        <div class="span9 app-config-description">
            <div class="app-config-description-inner text-light">
                <h2 class="app-config-title text-primary"><?php echo _('Time of Use - flexible + CL'); ?></h2>
                <p class="lead">The "Time of Use - flexible + CL" app is a simple home energy monitoring app for exploring home or building electricity consumption and cost over time.</p>
                <p>It allows you to track multiple electricity tariffs as used in Australia. This version adds a daily supply charge and a separately monitored controlled load (such as off-peak hot water).</p>
                <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                <p><img src="<?php echo $path; ?>Modules/app/images/timeofuse_app.png" style="width:600px" class="img-rounded"></p>
                <p>As the number of configuration options for this are quite large, a shorthand has been used to specify
                the tiers, days and times they apply and the respective costs.</p>
                <p><b>Assumptions</b>:
                <ul>
                <li>Any number of tariffs can be defined, but they must be consistent across weekdays or weekends.</li>
                <li>One cost must be defined per tariff tier.</li>
                <li>Each weekday (Monday to Friday) has the same tiers and times for each tier.</li>
                <li>Each weekend day (Saturday and Sunday) has the same tiers and times for each tier.</li>
                <li>Public Holidays are treated the same as a weekend day.</li>
                </ul>
                <h4>Shorthand</h4>
                <p>Tier names and tariffs are specified as a comma separated, colon separated list. If there are three
                tariffs, Off Peak, Shoulder and Peak, costing 16.5c/kWh, 25.3c/kWh and 59.4c/kWh respectively, they
                are specified as <b>OffPeak:0.165,Shoulder:0.253,Peak:0.594</b></p>
                <p>Tier start times are split into two definitions, weekday and weekend. They both use the same format,
                &lt;start hour&gt;:&lt;tier&gt;,&lt;start hour&gt;:&lt;tier&gt;,... <br>
                &lt;tier&gt; is the tier number defined above, numbered from 0<br>
                <b>Example:</b> A weekday with the following tariff times: OffPeak: 00:00 - 06:59, Shoulder: 07:00
                - 13:59, Peak: 14:00 - 19:59, Shoulder: 20:00 - 21:59, OffPeak: 22:00 - 23:59 would be defined as
                <b>0:0,7:1,14:2,20:1,22:0</b></p>
                <p>To specify the public holidays that should be treated the same as weekends, specify a comma separated
                list of days of the year (from 1-365/366) per year. <b>Example:</b> for public holiays 2017: Jan 2, Apr 14,
                Apr 17, Apr 25, Jun 12, Oct 2, Dec 25, Dec 26; and 2018: Jan 1 you would specify
                <b>2017:2,104,107,115,163,275,359,360;2018:1</b><br><a href="https://www.epochconverter.com/days">
                https://www.epochconverter.com/days</a> provides an easy reference.</p>
            </div>
        </div>
        <div class="span3 app-config pt-3"></div>
    </div>
</section>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php echo $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;

apikeystr = ""; 
if (apikey!="") apikeystr = "&apikey="+apikey;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','WhiteSmoke');
$(window).ready(function(){
    //$("#footer").css('background-color','#181818');
    //$("#footer").css('color','#999');
});

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "engine":5, "description":"Time Of Use total feed (W)"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5, "description":"Time Of Use accumulated kWh"},
    "currency":{"type":"value", "default":"$", "name":"Currency", "description":"Currency symbol (£,$..)"},
    "tier_cost":{"type":"value", "default":"OffPeak:0.165,Shoulder:0.253,Peak:0.594",
        "name":"Tier Names and Costs, currency/kWh",
        "description":"List of tier costs and names. See description on the left for details."},
    "wd_times":{"type":"value", "default":"0:0,7:1,14:2,20:1,22:0",
        "name":"Weekday Tier Start Times",
        "description":"List of weekday tier start times. See description on the left for details"},
    "we_times":{"type":"value", "default":"0:0,7:1,22:0",
        "name":"Weekend Tier Start Times",
        "description":"List of weekend tier start times. See description on the left for details"},
    "ph_days":{"type":"value", "default":"2017:2,104,107,115,163,275,359,360;2018:1",
        "name":"Public Holiday days",
        "description":"List of public holidays. See description on the left for details"},
    "supply":{"type":"value", "default":"0", "name":"Supply Charge",
        "description":"Daily Supply Charge in specified currency"},
    "cl_use":{"type":"feed", "autoname":"cl_use", "engine":5, "description":"Controlled Load power feed (W)"},
    "cl_kwh":{"type":"feed", "autoname":"cl_kwh", "engine":5, "description":"Controlled Load accumulated kWh"},
    "cl_cost":{"type":"value", "default":"0.17", "name":"Controlled Load Cost",
        "description":"Cost of the controlled Load accumulated kWh, currency/kWh."}
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
var meta = {};
var data = {};
var bargraph_series = [];
var powergraph_series = [];
var series_tier_colours = ["#44b3e2", "#4473e2", "#4433e2", "#44b3b2", "#44b372", "#44b332"];
var previousPoint = false;
var viewmode = "bargraph";
var viewcostenergy = "energy";
var panning = false;
var period_text = "month";
var period_average = 0;
var comparison_heating = false;
var comparison_transport = false;
var flot_font_size = 12;
var start_time = 0;
var updaterinst = false;
var use_start = 0;

// cents/kWh rates, one for each tier.
var tier_names = [];
var tier_rates = [];
var num_tiers = 0;
var cl_rate = 0;
var cl_idx = 0; // The data index of the controlled load "tier"

var supply = 0;

// Array of hours that will contain the tier for each hour
var weekday_tiers = [,,,,,,,,,,,,,,,,,,,,,,,]; 
var weekend_tiers = [,,,,,,,,,,,,,,,,,,,,,,,];

// public holidays use the weekend rates.
// list of javascript timestamps indicating the start of day for any defined public holidays
var public_holidays = [];

config.init();

function init()
{
    var tiers = [];
    var props = [];
    var wd_times = [];
    var we_times = [];
    var ph_yrs = [];
    var hour = 23;

    // Quick translation of feed ids
    //console.log(config.app);
    feeds = {};
    feeds["use"] = config.feedsbyid[config.app["use"].value];
    feeds["use_kwh"] = config.feedsbyid[config.app["use_kwh"].value];
    feeds["cl_use"] = config.feedsbyid[config.app["cl_use"].value];
    feeds["cl_kwh"] = config.feedsbyid[config.app["cl_kwh"].value];
    tiers = config.app["tier_cost"].value.split(",");
    num_tiers = tiers.length
    cl_idx = num_tiers;
    cl_rate = parseFloat(config.app["cl_cost"].value);
    supply = parseFloat(config.app["supply"].value);
    for (var a = 0; a < tiers.length; a++) {
        props = tiers[a].split(":");
        tier_names[a] = props[0];
        tier_rates[a] = parseFloat(props[1]);
    }
    wd_times = config.app["wd_times"].value.split(",");
    hour = 23;
    for (var a = wd_times.length - 1; a >= 0; a--) {
        props = wd_times[a].split(":");
        var start = parseInt(props[0]);
        var tier = parseInt(props[1]);
        do {
            weekday_tiers[hour] = tier;
            hour--;
        } while (hour >= start);
    }
    we_times = config.app["we_times"].value.split(",");
    hour = 23;
    for (var a = we_times.length - 1; a >= 0; a--) {
        props = we_times[a].split(":");
        var start = parseInt(props[0]);
        var tier = parseInt(props[1]);
        do {
            weekend_tiers[hour] = tier;
            hour--;
        } while (hour >= start);
    }
    if (config.app["ph_days"].value != "") {
        ph_yrs = config.app["ph_days"].value.split(";");
        for (var yr in ph_yrs) {
            var dates = ph_yrs[yr].split(":");
            if (dates[1]!=undefined) {
                var days = dates[1].split(",");
                for (var i in days) {
                    var d = (new Date(parseInt(dates[0]), 0, 0));
                    d.setDate(d.getDate() + parseInt(days[i]));
                    public_holidays.push(d);
                }
            }
        }
    }
}

function show() {
    $("body").css('background-color','WhiteSmoke');
    
    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
    use_start = feed.getvalue(feeds["use_kwh"].id, start_time);

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();

    updater();
    updaterinst = setInterval(updater,5000);
    $(".ajax-loader").hide();
}

function hide() {
    clearInterval(updaterinst);
}

function updater()
{
    feed.listbyidasync(function(result){
        if (result === null) { return; }

        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        $("#power_now").html(Math.round(feeds["use"].value+feeds["cl_use"].value)+"W");
    });
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
// The buttons for these powergraph events are hidden when in historic mode 
// The events are loaded at the start here and dont need to be unbinded and binded again.
$("#zoomout").click(function () {view.zoomout(); powergraph_load(); powergraph_draw(); });
$("#zoomin").click(function () {view.zoomin(); powergraph_load(); powergraph_draw(); });
$('#right').click(function () {view.panright(); powergraph_load(); powergraph_draw(); });
$('#left').click(function () {view.panleft(); powergraph_load(); powergraph_draw(); });

$('.time').click(function () {
    view.timewindow($(this).attr("time")/24.0);
    powergraph_load(); powergraph_draw(); 
});

$(".viewhistory").click(function () {
    $(".powergraph-navigation").hide();
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    viewmode = "bargraph";
    bargraph_load(start,end);
    bargraph_draw();
    $(".bargraph-navigation").show();
});

$("#advanced-toggle").click(function () { 
    var mode = $(this).html();
    if (mode=="SHOW DETAIL") {
        $("#advanced-block").show();
        $(this).html("HIDE DETAIL");
        
    } else {
        $("#advanced-block").hide();
        $(this).html("SHOW DETAIL");
    }
});

$('#placeholder').bind("plothover", function (event, pos, item) {
    if (item) {
        var z = item.dataIndex;
        var seriesIndex = item.seriesIndex;
        var tier_vals = [];
        var total = 0;
        var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var text = "";
            var d = new Date(itemTime);
            if (viewmode == "bargraph") {
                var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
           
                for (var a = 0; a < tier_names.length; a++) {
                    tier_vals[a] = bargraph_series[a].data[z][1];
                    total += tier_vals[a];
                }
                tier_vals[cl_idx] = bargraph_series[cl_idx].data[z][1];
                total += tier_vals[cl_idx];
                if (viewcostenergy=="cost") {
                    tier_vals[cl_idx+1] = bargraph_series[cl_idx+1].data[z][1];
                    total += tier_vals[cl_idx+1];
                }
            
                if (viewcostenergy=="energy") {
                    text = date + "<br>Total: " + total.toFixed(1) + " kWh";
                    for (var a = tier_names.length - 1; a >= 0; a--) {
                        if (tier_vals[a] == 0) continue;
                        text += "<br>" + tier_names[a] + ": " + (tier_vals[a]).toFixed(1) + " kWh";
                    }
                    text += "<br>Controlled Load: " + (tier_vals[cl_idx]).toFixed(1) + " kWh";
                } else {
                    text = date + "<br>Total: "+ config.app["currency"].value + total.toFixed(2);
                    for (var a = tier_names.length - 1; a >= 0; a--) {
                        if (tier_vals[a+1] == 0) continue;
                        text += "<br>" + tier_names[a] + ": " + config.app["currency"].value + (tier_vals[a+1]).toFixed(2);
                    }
                    text += "<br>Controlled Load:" + config.app["currency"].value + (tier_vals[cl_idx+1]).toFixed(2);
                    text += "<br>Supply:" + config.app["currency"].value + (tier_vals[0]).toFixed(2);
                }
            } else {
                var date = days[d.getDay()]+", "+("0" + d.getHours()).slice(-2)+":"+("0" + d.getMinutes()).slice(-2);
                text = date + "<br>" + item.datapoint[1] + "W";
            }
            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
$('#placeholder').bind("plotclick", function (event, pos, item)
{
    if (item && !panning && viewmode=="bargraph") {
        var z = item.dataIndex;
        view.start = bargraph_series[0].data[z][0];
        view.end = view.start + 86400*1000;
        $(".bargraph-navigation").hide();
        viewmode = "powergraph";
        powergraph_load();
        powergraph_draw();
        $(".powergraph-navigation").show();
    }
});

$('#placeholder').bind("plotselected", function (event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true; 

    if (viewmode=="bargraph") {
        bargraph_load(start,end);
        bargraph_draw();
    } else {
        view.start = start; view.end = end;
        powergraph_load();
        powergraph_draw();
    }
    setTimeout(function() { panning = false; }, 100);
});

$('.bargraph-alltime').click(function () {
    var start = start_time * 1000;
    var end = (new Date()).getTime();
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "period";
});

$('.bargraph-week').click(function () {
    var timeWindow = (3600000*24.0*7);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "week";
});

$('.bargraph-month').click(function () {
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "month";
});

$(".viewcostenergy").click(function(){
    var view = $(this).html();
    if (view=="ENERGY MODE") {
        $(this).html("COST MODE");
        viewcostenergy = "cost";
    } else {
        $(this).html("ENERGY MODE");
        viewcostenergy = "energy";
    }
    
    $(".powergraph-navigation").hide();
    viewmode = "bargraph";
    $(".bargraph-navigation").show();
    show();
});

// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - powergraph_load
// - powergraph_draw
// - bargraph_load
// - bargraph_draw
// - resize
// - we_ph

function powergraph_load() 
{
    $("#power-graph-footer").show();
    var data_tier = [];
    var cl_tier_index = tier_names.length;
    
    view.calc_interval(1200); // npoints = 1200
    data["use"] = feed.getdata(feeds["use"].id,view.start,view.end,view.interval,0,1,1);
    data["cl_use"] = feed.getdata(feeds["cl_use"].id,view.start,view.end,view.interval,0,1,1);
    
    // Want to add one extra "tier" of data for the controlled load so use <= instead of <
    for (var b = 0; b <= tier_names.length; b++) {
        data_tier[b] = [];
    }
    console.log(data_tier);
    for (var a = 0; a < data["use"].length; a++) {
        var time = data["use"][a][0];
        var pointval = data["use"][a][1];
        var d = new Date(time);
        var hr = d.getHours();
        for (var b = 0; b < tier_names.length; b++) {
            if (we_ph(d)) {
                if (b == weekend_tiers[hr]) {
                    data_tier[b].push([time,pointval]);
                } else {
                    data_tier[b].push([time,0]);
                }
            } else {
                if (b == weekday_tiers[hr]) {
                    data_tier[b].push([time,pointval]);
                } else {
                    data_tier[b].push([time,0]);
                }
            }
        }
    }
    for (var a = 0; a < data["cl_use"].length; a++) {
        var time = data["cl_use"][a][0];
        var pointval = data["cl_use"][a][1];
        data_tier[cl_tier_index].push([time,pointval]);
    }
        
    powergraph_series = [];
    for (var a = 0; a < tier_names.length; a++) {
        powergraph_series.push({
            data:data_tier[a],
            yaxis:1,
            stack:0,
            color:series_tier_colours[a],
            lines:{show:true, fill:0.8, lineWidth:0}
        });
    }
    // Now add the controlled load power
    powergraph_series.push({
        data:data_tier[cl_tier_index],
        yaxis:1,
        stack:1,
        color:series_tier_colours[cl_tier_index],
        lines:{show:true, fill:0.8, lineWidth:0}
    });
    
    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    feedstats["cl_use"] = stats(data["cl_use"]);
    
    // Start with the controlled load total
    var time_elapsed = (data["cl_use"][data["cl_use"].length-1][0] - data["cl_use"][0][0])*0.001;
    var kwh_in_window = (feedstats["cl_use"].mean * time_elapsed) / 3600000;

    // then add each of the tiers
    for (var z=0; z<data["use"].length-1; z++) {
        var power = 0;
        if (data["use"][z][1]!=null) power = data["use"][z][1];
        var time = (data["use"][z+1][0] - data["use"][z][0]) *0.001;
        
        if (time<3600) {
            kwh_in_window += (power * time) / 3600000;
        }
    }
    
    $("#window-kwh").html(kwh_in_window.toFixed(2));
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        out += "<td style='text-align:left'>"+z+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].minval.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].maxval.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].diff.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].mean.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].stdev.toFixed(0)+"</td>";
        out += "</tr>";
    }
    $("#stats").html(out);
}

function powergraph_draw() 
{
    var options = {
        lines: { fill: false },
        xaxis: { 
            mode: "time", timezone: "browser", 
            min: view.start, max: view.end, 
            font: {size:flot_font_size, color:"#666"},
            reserveSpace:false
        },
        yaxes: [
            { min: 0,font: {size:flot_font_size, color:"#666"},reserveSpace:false},
            {font: {size:flot_font_size, color:"#666"},reserveSpace:false}
        ],
        grid: {
            show:true, 
            color:"#aaa",
            borderWidth:0,
            hoverable: true, 
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin:{top:30}
        },
        selection: { mode: "x" },
        legend:{position:"NW", noColumns:4}
    }
    $.plot($('#placeholder'),powergraph_series,options);
}

function bargraph_load(start,end) 
{   
    $("#power-graph-footer").hide();
    $("#advanced-toggle").html("SHOW DETAIL");
    $("#advanced-block").hide();
        
    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms+1)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;

    var hourly = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    
    //console.log(JSON.stringify(hourly));
    var elec_result = feed.getdataDMY_time_of_use(feeds["use_kwh"].id,start,end,"daily",JSON.stringify(hourly));
    var cl_result = feed.getdataDMY(feeds["cl_kwh"].id,start,end,"daily");

    var elec_data = [];

    var today = new Date();
    today.setHours(0,0,0,0);
        
    // strip nan values.
    for (var z in elec_result) {
        var include = false;
        if (elec_result[z][0] >= today.getTime()) {
            // this is today or tomorrow set all null values to the current feed value.
            for (var y in elec_result[z][1]) {
        if (elec_result[z][1][y] == null) {
                    elec_result[z][1][y] = feeds["use_kwh"].value;
                }
            }
            include = true;
        } else {
            for (var y in elec_result[z][1]) {
                if (elec_result[z][1][y] == null) {
                    elec_result[z][1][y] = 0;
                } else {
                    include = true;
                }
            }
        }
        if (include) elec_data.push(elec_result[z]);
    }

    for (var z in cl_result) {
        if (cl_result[z][1] == null) {
            cl_result[z][1] = feeds["cl_kwh"].value;
        }
    }

    //console.log(elec_data);
    //console.log(cl_result);
    
    for (var a = 0; a < tier_names.length; a++) {
        data[tier_names[a]] = [];
    }
    data["cl"] = [];
    if (viewcostenergy=="cost") {
        data["sc"] = [];
    }
    
    if (elec_data.length>0) {
        var tier_total_kwh = [];
        var total_kwh = 0; 
        var n = 0;
        var tier_kwh = []; 

        for (var a = 0; a < tier_names.length; a++) {
            tier_total_kwh[a] = 0;
        }
        // Add a total for the controlled load tier
        tier_total_kwh[cl_idx] = 0;
        // Add a total for Suply charge if necessary
        if (viewcostenergy=="cost") tier_total_kwh[cl_idx+1] = 0;

        // Calculate the daily totals by subtracting each day from the day before
        for (var z = 0; z < elec_data.length; z++)
        {
            var time = elec_data[z][0];
            var d = new Date(time);
            var day = d.getDay();

            // Add the extra Tier for the controlled load - use <= instead of <
            for (var a = 0; a <= tier_names.length; a++) {
                tier_kwh[a] = 0;
            }

            // tier_kwh[tier_names.length] is now the controlled load tier.

            // ignore tomorrow. We just use it to calculate the value from the last split value to now.
            if (d > today) continue;

            for (var y = 0; y < 23; y++) {
                // y should be the hourly accumulate kWh
                if (we_ph(d)) { // weekend
                    tier_kwh[weekend_tiers[y]] += (elec_data[z][1][y+1] - elec_data[z][1][y]);
                } else {
                    tier_kwh[weekday_tiers[y]] += (elec_data[z][1][y+1] - elec_data[z][1][y]);
                }
            }
        // last period ends with the next days first value
            if (we_ph(d)) { // weekend
                if ((z+1)<elec_data.length) tier_kwh[weekend_tiers[23]] += elec_data[z+1][1][0] - elec_data[z][1][23];
            } else {
                if ((z+1)<elec_data.length) tier_kwh[weekday_tiers[23]] += elec_data[z+1][1][0] - elec_data[z][1][23];
            }

            if ((z+1)<elec_data.length) tier_kwh[cl_idx] += cl_result[z+1][1] - cl_result[z][1];

            for (var a = 0; a < tier_names.length; a++) {
                if (viewcostenergy=="energy") {
                    data[tier_names[a]].push([time,tier_kwh[a]]);
                    tier_total_kwh[a] += tier_kwh[a];
                    total_kwh += tier_kwh[a];
                } else {
                    data[tier_names[a]].push([time,tier_kwh[a]*tier_rates[a]]);
                    tier_total_kwh[a] += tier_kwh[a] * tier_rates[a];
                    total_kwh += tier_kwh[a] * tier_rates[a];
                }
            }
            if (viewcostenergy=="energy") {
                data["cl"].push([time,tier_kwh[cl_idx]]);
                tier_total_kwh[cl_idx] += tier_kwh[cl_idx];
                total_kwh += tier_kwh[cl_idx];
            } else {
                data["sc"].push([time,supply]);
                data["cl"].push([time,tier_kwh[cl_idx]*cl_rate]);
                tier_total_kwh[cl_idx] += tier_kwh[cl_idx] * cl_rate;
                tier_total_kwh[cl_idx+1] += supply;
                total_kwh += tier_kwh[cl_idx] * cl_rate + supply;
            }
            n++;
        }
        period_average = total_kwh / n;
    }

    bargraph_series = [];
    
    if (viewcostenergy=="cost") {
        bargraph_series.push({
            stack: true,
            data: data["sc"], color: "#aa4466",
            bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
        });
    }
    for (var a = 0; a < tier_names.length; a++) {
        bargraph_series.push({
            stack: true,
            data: data[tier_names[a]], color: series_tier_colours[a],
            bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
        });
    }
    bargraph_series.push({
        stack: true,
        data: data["cl"], color: series_tier_colours[cl_idx],
        bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    if (viewcostenergy=="energy") {
        var totals_str = '<div class="electric-title">COMBINED</div><div class="power-value">' +
            total_kwh.toFixed(1) + ' kWh</div><br>';
        var averages_str = '<div class="electric-title">COMBINED</div><div class="power-value">' +
           (total_kwh/n).toFixed(1) + ' kWh/d</div><br>';
        for (var a = 0; a < tier_names.length; a++) {
            totals_str += '<div class="electric-title">' + tier_names[a].toUpperCase() +
               '</div><div class="power-value">' + tier_total_kwh[a].toFixed(1) + ' kWh</div><br>';
            averages_str += '<div class="electric-title">' + tier_names[a].toUpperCase() +
               '</div><div class="power-value">' + (tier_total_kwh[a]/n).toFixed(1) + ' kWh/d</div><br>';
        }
        totals_str += '<div class="electric-title">CONTROLLED LOAD' +
           '</div><div class="power-value">' + tier_total_kwh[cl_idx].toFixed(1) + ' kWh</div><br>';
        averages_str += '<div class="electric-title">CONTROLLED LOAD' + 
           '</div><div class="power-value">' + (tier_total_kwh[cl_idx]/n).toFixed(1) + ' kWh/d</div><br>';
        $("#totals").html(totals_str);
        $("#averages").html(averages_str);
    } else {
        var totals_str = '<div class="electric-title">COMBINED</div><div class="power-value">' +
            config.app["currency"].value + total_kwh.toFixed(2) + '</div><br>';
        var averages_str = '<div class="electric-title">COMBINED</div><div class="power-value">' +
           config.app["currency"].value + (total_kwh/n).toFixed(2) + '/day</div><br>';
        for (var a = 0; a < tier_names.length; a++) {
            totals_str += '<div class="electric-title">' + tier_names[a].toUpperCase() +
               '</div><div class="power-value">' + config.app["currency"].value +
               tier_total_kwh[a].toFixed(2) + '</div><br>';
            averages_str += '<div class="electric-title">' + tier_names[a].toUpperCase() +
               '</div><div class="power-value">' + config.app["currency"].value +
               (tier_total_kwh[a]/n).toFixed(2) + '/day</div><br>';
        }
        totals_str += '<div class="electric-title">CONTROLLED LOAD' +
           '</div><div class="power-value">' + config.app["currency"].value +
           tier_total_kwh[cl_idx].toFixed(2) + '</div><br>';
        averages_str += '<div class="electric-title">CONTROLLED LOAD' +
           '</div><div class="power-value">' + config.app["currency"].value +
           (tier_total_kwh[cl_idx]/n).toFixed(2) + '/day</div><br>';
        totals_str += '<div class="electric-title">SUPPLY' +
           '</div><div class="power-value">' + config.app["currency"].value +
           tier_total_kwh[cl_idx+1].toFixed(2) + '</div><br>';
        averages_str += '<div class="electric-title">SUPPLY' +
           '</div><div class="power-value">' + config.app["currency"].value +
           (tier_total_kwh[cl_idx+1]/n).toFixed(2) + '/day</div><br>';
        $("#totals").html(totals_str);
        $("#averages").html(averages_str);
    }

    var kwh_today = 0;
    for (var a = 0; a < tier_names.length; a++) kwh_today += data[tier_names[a]][data[tier_names[a]].length - 1][1];
    kwh_today += data["cl"][data["cl"].length - 1][1];
    
    if (viewcostenergy=="energy") {
        $("#kwh_today").html(kwh_today.toFixed(1)+" kWh");
    } else {
        $("#kwh_today").html(config.app["currency"].value + kwh_today.toFixed(2));
    }
}

function bargraph_draw() 
{
    var options = {
        xaxis: { 
            mode: "time", 
            timezone: "browser", 
            minTickSize: [1, "day"],
            font: {size:flot_font_size, color:"#666"}, 
            // labelHeight:-5
            reserveSpace:false
        },
        yaxis: { 
            font: {size:flot_font_size, color:"#666"}, 
            // labelWidth:-5
            reserveSpace:false,
            min:0
        },
        selection: { mode: "x" },
        grid: {
            show:true, 
            color:"#aaa",
            borderWidth:0,
            hoverable: true, 
            clickable: true
        }
    }

    var plot = $.plot($('#placeholder'),bargraph_series,options);
    $('#placeholder').append("<div id='bargraph-label' style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'></div>");
}

function stack(ctx,data,xoffset,options) {
    options.scale = options.height / options.maxval;

    var y = options.height-1;
    ctx.textAlign    = "center";
    ctx.font = "normal 12px arial"; 
    for (z in data) {
        var seg = data[z][1]*options.scale;
        y -= (seg);
        ctx.strokeStyle = options.fill;
        ctx.fillStyle = options.stroke;
        ctx.fillRect(1+xoffset,y+4,80,seg-4);
        ctx.strokeRect(1+xoffset,y+4,80,seg-4);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px arial"; 
        ctx.fillText(data[z][0],xoffset+40,y+(seg/2)+0);
        ctx.font = "normal 12px arial"; 
        ctx.fillText(data[z][1]+" kWh",xoffset+40,y+(seg/2)+12);
    }
}

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------
function resize() {
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = width*0.6;
    if (height>500) height = 500;

    if (height>width) height = width;
    
    //console.log(width+" "+height);

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
    
    if (width<=500) {
        $(".electric-title").css("font-size","16px");
        $(".power-value").css("font-size","38px");
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","42px");
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","42px");
    }
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        var window_width = $(this).width();

        flot_font_size = 12;
        if (window_width<450) flot_font_size = 10;

        resize(); 
    
        if (viewmode=="bargraph") {
            bargraph_draw();
        } else {
            powergraph_draw();
        }
    });
});

// ----------------------------------------------------------------------
// Weekend or Public Holiday
// ----------------------------------------------------------------------
function we_ph (datetocheck) {
    var dayofweek = datetocheck.getDay();
    if ((dayofweek == 0) || (dayofweek == 6)) return true;
    for (var i in public_holidays) {
        if (public_holidays[i].valueOf() == datetocheck.valueOf()) return true;
    }
    return false;
}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
