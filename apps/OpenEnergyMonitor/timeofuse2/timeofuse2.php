<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v, $user;
// The user's configured timezone (e.g. "Europe/London") is used to allocate
// energy to days and tiers, so the split is correct regardless of the browser.
$timezone = $user->get_timezone($session['userid']);
if (!$timezone || is_numeric($timezone)) $timezone = 'UTC';
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.min.js?v=<?php echo $v; ?>"></script> 
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
      </div>
      
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

<div id="appconf-description" style="display:none">
<p class="lead">The "Time of Use - flexible" app is a simple home energy monitoring app for exploring home or building electricity consumption and cost over time. It allows you to track multiple electricity tariffs as used in Australia, an optional daily supply charge, and an optional separately-monitored controlled load.</p>
<h3 class="text-white">Cumulative kWh</h3>
<p> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
<p><img src="<?php echo $path; ?>Modules/app/images/timeofuse_app.png" style="width:600px" class="img-rounded"></p>
<p>As the number of configuration options for this are quite large, a shorthand has been used to specify
the tiers, days and times they apply and the respective costs.</p>

<h3 class="text-white">Assumptions</h3>
<ul>
    <li>Any number of tariffs can be defined, but they must be consistent across weekdays or weekends.</li>
    <li>One cost must be defined per tariff tier.</li>
    <li>Each weekday (Monday to Friday) has the same tiers and times for each tier.</li>
    <li>Each weekend day (Saturday and Sunday) has the same tiers and times for each tier.</li>
    <li>Public Holidays are treated the same as a weekend day.</li>
</ul>

<h3 class="text-white">Shorthand</h3>
<p>Tier names and tariffs are specified as a comma separated, colon separated list. If there are three
tariffs, <strong class="text-white">Off Peak</strong>, <strong class="text-white">Shoulder</strong> and <strong class="text-white">Peak</strong>, costing <strong class="text-white">16.5c/kWh</strong>, <strong class="text-white">25.3c/kWh</strong> and <strong class="text-white">59.4c/kWh</strong> respectively, they
are specified as:</p>
<p><code>OffPeak:0.165,Shoulder:0.253,Peak:0.594</code></p>
<p>Tier start times are split into two definitions, weekday and weekend. They both use the same format,
<code>&lt;start hour&gt;:&lt;tier&gt;,&lt;start hour&gt;:&lt;tier&gt;,...
&lt;tier&gt;</code>
is the tier number defined above, numbered from 0</p>

<hr>
<h4 class="text-white">Example:</h4> 
<p>A weekday with the following tariff times:</p>
<blockquote><em>
OffPeak: 00:00 - 06:59, 
Shoulder: 07:00 - 13:59,
Peak: 14:00 - 19:59, 
Shoulder: 20:00 - 21:59, 
OffPeak: 22:00 - 23:59
</em></blockquote>
<p>would be defined as:
<code>0:0,7:1,14:2,20:1,22:0</code></p>

<p>To specify the public holidays that should be treated the same as weekends, specify a comma separated
list of days of the year (from 1-365/366) per year.

<hr>
<h4 class="text-white">Example:</h4>
<p>for public holiays 2017: Jan 2, Apr 14, Apr 17, Apr 25, Jun 12, Oct 2, Dec 25, Dec 26; and 2018: Jan 1 you would specify:</p>
<code>
2017:2,104,107,115,163,275,359,360;2018:1
</code>
<p><a href="https://www.epochconverter.com/days" class="text-light">https://www.epochconverter.com/days</a> provides an easy reference.</p>

<hr>
<h3 class="text-white">Supply charge</h3>
<p>Set a fixed <strong class="text-white">daily supply charge</strong> in your chosen currency in the configuration on the right. It is added to each day in cost mode and is only shown when greater than zero.</p>

<h3 class="text-white">Controlled load (optional)</h3>
<p>Tick <strong class="text-white">"Controlled load"</strong> in the configuration on the right to monitor a separate load on its own tariff, such as off-peak hot water. Enabling it reveals the <code>cl_use</code> power feed, the <code>cl_kwh</code> accumulated kWh feed, and the controlled load cost (currency/kWh). The controlled load is shown as an additional stacked series on the graphs and as its own line in the totals and averages.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var user_timezone = "<?php echo $timezone; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
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
    "use":{"type":"feed", "autoname":"use", "description":"Time Of Use total feed (W)"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "description":"Time Of Use accumulated kWh"},
    "currency":{"type":"value", "default":"$", "name": "Currency", "description":"Currency symbol (£,$..)"},
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
        "description":"Daily supply charge in the specified currency (set to 0 to disable)."},
    "enable_cl":{"type":"checkbox", "default":false, "name":"Controlled load",
        "description":"Enable a separately-monitored controlled load (e.g. off-peak hot water)."},
    "cl_use":{"type":"feed", "autoname":"cl_use", "optional":true, "description":"Controlled Load power feed (W)"},
    "cl_kwh":{"type":"feed", "autoname":"cl_kwh", "optional":true, "description":"Controlled Load accumulated kWh"},
    "cl_cost":{"type":"value", "default":"0.17", "name":"Controlled Load Cost",
        "description":"Cost of the controlled load, currency/kWh."}
};

config.app_name = "Time of Use - flexible";
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
var comparison_heating = false;
var comparison_transport = false;
var flot_font_size = 12;
var start_time = 0;
var updaterinst = false;
var use_start = 0;

// cents/kWh rates, one for each tier.
var tier_names = [];
var tier_rates = [];

// Optional controlled load + supply charge
var cl_enabled = false;
var cl_rate = 0;
var supply = 0;
var cl_idx = 0; // The data index of the controlled load "tier"

// Array of hours that will contain the tier for each hour
var weekday_tiers = [,,,,,,,,,,,,,,,,,,,,,,,]; 
var weekend_tiers = [,,,,,,,,,,,,,,,,,,,,,,,];

// public holidays use the weekend rates.
// map of "YYYY-MM-DD" day keys (in the configured timezone) for defined public holidays
var public_holidays = {};

// Show/hide the controlled load config fields based on the checkbox
config.ui_before_render = function(){
    var on = !!(config.db["enable_cl"]);
    config.app["cl_use"].hidden  = !on;
    config.app["cl_kwh"].hidden  = !on;
    config.app["cl_cost"].hidden = !on;
};
config.ui_after_value_change = function(key){
    if (key === "enable_cl") vue_config.renderUI();
};

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
    tiers = config.app["tier_cost"].value.split(",");
    for (var a = 0; a < tiers.length; a++) {
        props = tiers[a].split(":");
        tier_names[a] = props[0];
        tier_rates[a] = parseFloat(props[1]);
    }
    // Daily supply charge (applies in cost mode whenever > 0, independent of controlled load)
    supply = parseFloat(config.app["supply"].value);
    // Optional separately-monitored controlled load
    cl_enabled = !!config.app["enable_cl"].value;
    cl_idx = tier_names.length; // The controlled load occupies the tier after the last tariff tier
    if (cl_enabled) {
        feeds["cl_use"] = config.feedsbyid[config.app["cl_use"].value];
        feeds["cl_kwh"] = config.feedsbyid[config.app["cl_kwh"].value];
        cl_rate = parseFloat(config.app["cl_cost"].value);
        // Only treat the controlled load as enabled if both feeds resolve, so a
        // half-configured (or unshared, in a public view) load degrades gracefully.
        if (!feeds["cl_use"] || !feeds["cl_kwh"]) cl_enabled = false;
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
                    // day-of-year -> calendar date, stored as a "YYYY-MM-DD" key
                    var d = (new Date(parseInt(dates[0]), 0, 0));
                    d.setDate(d.getDate() + parseInt(days[i]));
                    var key = d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
                    public_holidays[key] = true;
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
        var power_now = feeds["use"].value;
        if (cl_enabled && feeds["cl_use"]) power_now += feeds["cl_use"].value;
        $("#power_now").html(Math.round(power_now)+"W");
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
        var total = 0;
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var text = "";
            var p = tz_parts(itemTime);
            if (viewmode == "bargraph") {
                var date = p.weekday+", "+months[parseInt(p.daykey.substr(5,2),10)-1]+" "+parseInt(p.daykey.substr(8,2),10);
           
                // Read each stacked segment back from its labelled series
                var segs = [];
                for (var a = 0; a < bargraph_series.length; a++) {
                    if (bargraph_series[a].data[z] == undefined) continue;
                    var val = bargraph_series[a].data[z][1];
                    segs.push({ label: bargraph_series[a].label, value: val });
                    total += val;
                }

                if (viewcostenergy=="energy") {
                    text = date + "<br>Total: " + total.toFixed(1) + " kWh";
                    for (var a = segs.length - 1; a >= 0; a--) {
                        if (segs[a].value == 0) continue;
                        text += "<br>" + segs[a].label + ": " + segs[a].value.toFixed(1) + " kWh";
                    }
                } else {
                    text = date + "<br>Total: "+ config.app["currency"].value + total.toFixed(2);
                    for (var a = segs.length - 1; a >= 0; a--) {
                        if (segs[a].value == 0) continue;
                        text += "<br>" + segs[a].label + ": " + config.app["currency"].value + segs[a].value.toFixed(2);
                    }
                }
            } else {
                var date = p.weekday+", "+pad2(p.hour)+":"+pad2(p.minute);
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
    view.calc_interval(1200); // npoints = 1200

    data["use"] = feed.getdata(feeds["use"].id,view.start,view.end,view.interval,0,0,1,1);
    if (cl_enabled) data["cl_use"] = feed.getdata(feeds["cl_use"].id,view.start,view.end,view.interval,0,0,1,1);
    for (var b = 0; b < tier_names.length; b++) {
        data_tier[b] = [];
    }
    if (cl_enabled) data_tier[cl_idx] = [];
    for (var a = 0; a < data["use"].length; a++) {
        var time = data["use"][a][0];
        var pointval = data["use"][a][1];
        var p = tz_parts(time);
        var active = we_ph(p) ? weekend_tiers[p.hour] : weekday_tiers[p.hour];
        for (var b = 0; b < tier_names.length; b++) {
            data_tier[b].push([time, (b == active) ? pointval : 0]);
        }
    }
    if (cl_enabled) {
        for (var a = 0; a < data["cl_use"].length; a++) {
            data_tier[cl_idx].push([data["cl_use"][a][0], data["cl_use"][a][1]]);
        }
    }

    powergraph_series = [];
    for (var a = 0; a < tier_names.length; a++) {
        powergraph_series.push({
            data:data_tier[a],
            yaxis:1,
            stack: cl_enabled ? 0 : false,
            color:series_tier_colours[a],
            lines:{show:true, fill:0.8, lineWidth:0}
        });
    }
    // Stack the controlled load power on top of the tariff tiers
    if (cl_enabled) {
        powergraph_series.push({
            data:data_tier[cl_idx],
            yaxis:1,
            stack:1,
            color:series_tier_colours[cl_idx],
            lines:{show:true, fill:0.8, lineWidth:0}
        });
    }

    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    if (cl_enabled) feedstats["cl_use"] = stats(data["cl_use"]);

    var kwh_in_window = 0.0;
    // Start with the controlled load total
    if (cl_enabled) {
        var cl_elapsed = (data["cl_use"][data["cl_use"].length-1][0] - data["cl_use"][0][0])*0.001;
        kwh_in_window = (feedstats["cl_use"].mean * cl_elapsed) / 3600000;
    }

    // then add each of the tiers
    for (var z=0; z<data["use"].length-1; z++) {
        var power = 0;
        if (data["use"][z][1]!=null) power = data["use"][z][1];
        var time = (data["use"][z+1][0] - data["use"][z][0]) *0.001;
        
        if (time<3600) {
            kwh_in_window += (power * time) / 3600000;
        }
    }
    
    $("#window-kwh").html(kwh_in_window.toFixed(1));
    
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

    // Align the requested window to whole local days.
    var dayms = 3600*24*1000;
    end = Math.ceil(end/dayms)*dayms;
    start = Math.floor(start/dayms)*dayms;

    // Fetch the accumulated kWh feeds as half-hourly energy deltas using the
    // standard fixed interval getdata API in delta mode. Delta mode returns the
    // kWh consumed within each half-hour interval and automatically fills the
    // current (incomplete) interval with the live feed value, so today's partial
    // usage is included without any special casing. The controlled load is
    // fetched in exactly the same way for consistency.
    // getdata(id, start, end, interval, average, delta, skipmissing, limitinterval)
    var halfhour = 1800; // seconds
    var use_data = feed.getdata(feeds["use_kwh"].id, start, end, halfhour, 0, 1, 0, 0);
    var cl_data = false;
    if (cl_enabled) cl_data = feed.getdata(feeds["cl_kwh"].id, start, end, halfhour, 0, 1, 0, 0);

    // Group the half-hourly energy into per-day, per-tier buckets. Each half hour
    // falls entirely within a single tariff tier, determined by its time of day
    // and whether the day is a weekday or a weekend/public holiday.
    var day_list = [];    // ordered list of day-start timestamps (ms)
    var day_index = {};   // "YYYY-MM-DD" day key -> index into the arrays below
    var daily_tier = [];  // daily_tier[d][tier] = kWh
    var daily_cl = [];    // daily_cl[d] = kWh

    function day_bucket(ms, parts) {
        if (day_index[parts.daykey] === undefined) {
            day_index[parts.daykey] = day_list.length;
            day_list.push(tz_day_start(ms, parts));
            var tiers = [];
            for (var a = 0; a < tier_names.length; a++) tiers[a] = 0;
            daily_tier.push(tiers);
            daily_cl.push(0);
        }
        return day_index[parts.daykey];
    }

    for (var z = 0; z < use_data.length; z++) {
        var kwh = use_data[z][1];
        if (kwh == null) continue;
        var p = tz_parts(use_data[z][0]);
        var tier = we_ph(p) ? weekend_tiers[p.hour] : weekday_tiers[p.hour];
        if (tier == undefined) continue;
        daily_tier[day_bucket(use_data[z][0], p)][tier] += kwh;
    }
    if (cl_enabled && cl_data) {
        for (var z = 0; z < cl_data.length; z++) {
            var kwh = cl_data[z][1];
            if (kwh == null) continue;
            daily_cl[day_bucket(cl_data[z][0], tz_parts(cl_data[z][0]))] += kwh;
        }
    }

    // Build the display series and running totals. Cost mode multiplies each
    // tier's energy by its rate; the daily supply charge is added in cost mode
    // when configured.
    var cost_mode = (viewcostenergy == "cost");
    var show_supply = (cost_mode && supply > 0);

    for (var a = 0; a < tier_names.length; a++) data[tier_names[a]] = [];
    if (cl_enabled) data["cl"] = [];
    if (show_supply) data["sc"] = [];

    var tier_total = [];
    for (var a = 0; a < tier_names.length; a++) tier_total[a] = 0;
    var cl_total = 0;
    var supply_total = 0;
    var grand_total = 0;

    for (var i = 0; i < day_list.length; i++) {
        var dayts = day_list[i];
        for (var a = 0; a < tier_names.length; a++) {
            var val = cost_mode ? daily_tier[i][a] * tier_rates[a] : daily_tier[i][a];
            data[tier_names[a]].push([dayts, val]);
            tier_total[a] += val;
            grand_total += val;
        }
        if (cl_enabled) {
            var clval = cost_mode ? daily_cl[i] * cl_rate : daily_cl[i];
            data["cl"].push([dayts, clval]);
            cl_total += clval;
            grand_total += clval;
        }
        if (show_supply) {
            data["sc"].push([dayts, supply]);
            supply_total += supply;
            grand_total += supply;
        }
    }

    // Assemble the stacked bar series in display order, attaching a label to each
    // so the tooltip can read values back without fragile index arithmetic.
    var bar = { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0 };
    bargraph_series = [];

    if (show_supply) {
        bargraph_series.push({ stack: true, label: "Supply", data: data["sc"], color: "#aa4466", bars: bar });
    }
    for (var a = 0; a < tier_names.length; a++) {
        bargraph_series.push({ stack: true, label: tier_names[a], data: data[tier_names[a]], color: series_tier_colours[a], bars: bar });
    }
    if (cl_enabled) {
        bargraph_series.push({ stack: true, label: "Controlled Load", data: data["cl"], color: series_tier_colours[cl_idx], bars: bar });
    }

    // Totals cover the whole window; averages are taken over complete days only
    // so the partial current day does not drag the daily average down.
    var today_idx = day_index[tz_parts((new Date()).getTime()).daykey];
    var today_present = (today_idx !== undefined);
    var n_complete = day_list.length - (today_present ? 1 : 0);

    var today_tier = [];
    for (var a = 0; a < tier_names.length; a++) {
        today_tier[a] = today_present ? data[tier_names[a]][today_idx][1] : 0;
    }
    var today_cl     = (cl_enabled  && today_present) ? data["cl"][today_idx][1] : 0;
    var today_supply = (show_supply && today_present) ? data["sc"][today_idx][1] : 0;
    var today_total  = today_cl + today_supply;
    for (var a = 0; a < tier_names.length; a++) today_total += today_tier[a];

    var avg = function(total, today_val) {
        if (n_complete <= 0) return 0;
        return (total - today_val) / n_complete;
    };

    var cur = config.app["currency"].value;
    var fmt    = function(v){ return cost_mode ? cur + v.toFixed(2)       : v.toFixed(1)+' kWh';   };
    var fmtAvg = function(v){ return cost_mode ? cur + v.toFixed(2)+'/day' : v.toFixed(1)+' kWh/d'; };
    var row    = function(title,val){ return '<div class="electric-title">'+title+'</div><div class="power-value">'+val+'</div><br>'; };

    var totals_str   = row('COMBINED', fmt(grand_total));
    var averages_str = row('COMBINED', fmtAvg(avg(grand_total, today_total)));
    for (var a = 0; a < tier_names.length; a++) {
        totals_str   += row(tier_names[a].toUpperCase(), fmt(tier_total[a]));
        averages_str += row(tier_names[a].toUpperCase(), fmtAvg(avg(tier_total[a], today_tier[a])));
    }
    if (cl_enabled) {
        totals_str   += row('CONTROLLED LOAD', fmt(cl_total));
        averages_str += row('CONTROLLED LOAD', fmtAvg(avg(cl_total, today_cl)));
    }
    if (show_supply) {
        totals_str   += row('SUPPLY', fmt(supply_total));
        averages_str += row('SUPPLY', fmtAvg(avg(supply_total, today_supply)));
    }
    $("#totals").html(totals_str);
    $("#averages").html(averages_str);

    // "Use today" headline: today's tariff tiers plus controlled load
    // (the daily supply charge is excluded from this figure).
    var use_today = today_cl;
    for (var a = 0; a < tier_names.length; a++) use_today += today_tier[a];

    if (cost_mode) {
        $("#kwh_today").html(cur + use_today.toFixed(2));
    } else {
        $("#kwh_today").html(use_today.toFixed(1)+" kWh");
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
// Timezone helpers
// ----------------------------------------------------------------------
// All day/tier allocation is done against the user's configured timezone
// (user_timezone) rather than the browser's, so the daily split is correct
// even when the two differ.
function pad2(n) { return (n<10 ? "0" : "") + n; }

// Built lazily on first use so it is always ready regardless of script
// execution order, falling back to UTC if the configured timezone is invalid.
var tz_format = null;
function get_tz_format() {
    if (!tz_format) {
        var opts = {
            timeZone: user_timezone, hourCycle: 'h23',
            weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        };
        try {
            tz_format = new Intl.DateTimeFormat('en-GB', opts);
        } catch (e) {
            opts.timeZone = 'UTC';
            tz_format = new Intl.DateTimeFormat('en-GB', opts);
        }
    }
    return tz_format;
}

// Resolve a timestamp (ms) to its wall-clock parts in the configured timezone.
function tz_parts(ms) {
    var p = {};
    var arr = get_tz_format().formatToParts(new Date(ms));
    for (var i = 0; i < arr.length; i++) p[arr[i].type] = arr[i].value;
    return {
        daykey:  p.year+"-"+p.month+"-"+p.day, // "YYYY-MM-DD"
        weekday: p.weekday,                    // "Mon".."Sun"
        hour:    parseInt(p.hour,10),
        minute:  parseInt(p.minute,10)
    };
}

// Real timestamp (ms) of local midnight for the day containing ms. Half-hourly
// points sit on whole/half-hour boundaries so this is exact in practice.
function tz_day_start(ms, parts) {
    return ms - (parts.hour*60 + parts.minute)*60*1000;
}

// ----------------------------------------------------------------------
// Weekend or Public Holiday
// ----------------------------------------------------------------------
function we_ph (parts) {
    if (parts.weekday == "Sat" || parts.weekday == "Sun") return true;
    return public_holidays[parts.daykey] === true;
}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
