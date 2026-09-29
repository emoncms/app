<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/timeofuse/timeofuse.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>
<?php load_js("Lib/js/DateTimePicker.js"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>

<div class="app-page" data-bs-theme="light">
  <section id="app-block" style="display:none">

    <div class="app-card">
      <nav class="app-card-head">
        <div class="nav nav-underline">
          <button class="nav-link active"><i class="svg-icon-schedule"></i>Time of Use</button>
        </div>
        <div class="app-card-tools">
          <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
          <div class="nav">
            <button class="nav-link config-open" title="Configure app"><i class="svg-icon-wrench"></i></button>
          </div>
        </div>
      </nav>
      <div class="app-live">
        <div>
          <div class="app-live-label">Power now</div>
          <div class="app-live-value text-tou-day" id="power_now">---</div>
        </div>
        <div>
          <div class="app-live-label">Use today</div>
          <div class="app-live-value text-tou-day" id="kwh_today">---</div>
        </div>
      </div>
    </div>

    <div class="app-card app-card-body">
      <div id="graph-nav" class="app-navbar">
        <?php
        // Power view up to a month, daily bars from a week to all time
        $timebar_ranges = array(24 => tr('24 hours'), 168 => tr('1 week'), 720 => tr('1 month'), 'all' => tr('All time'));
        include "Modules/app/Lib/timebar.php";
        ?>
        <div class="d-flex flex-wrap gap-2 ms-auto">
          <div class="btn-group app-segmented">
            <button class="btn viewcostenergy active" data-mode="energy" title="Show energy">Energy</button>
            <button class="btn viewcostenergy" data-mode="cost" title="Show cost">Cost</button>
          </div>
          <div class="btn-group app-segmented">
            <button class="btn viewpower" title="Power in the window">Power</button>
            <button class="btn viewhistory active" title="Daily history">Daily</button>
          </div>
        </div>
      </div>
      <?php include "Modules/app/Lib/timebar_manual.php"; ?>

      <div id="placeholder_bound" style="width:100%; height:500px">
        <div id="placeholder" style="height:500px"></div>
      </div>
      <div id="chart-legend" class="app-legend"></div>

      <div id="power-graph-footer" style="display:none">
        <div class="app-card-caption app-chart-foot">
          <span class="app-section-label">Energy in window</span>
          <span class="app-caption-note">Total <b><span id="window-kwh"></span> kWh</b></span>
          <span class="app-caption-note">Off-peak <b><span id="window-offpeak"></span> kWh</b></span>
          <span class="app-caption-note">Peak <b><span id="window-peak"></span> kWh</b></span>
          <div class="nav ms-auto"><button id="advanced-toggle" class="nav-link">SHOW DETAIL</button></div>
        </div>
      </div>

      <div id="advanced-block" style="display:none">
        <table class="table">
          <tr>
            <th></th>
            <th class="text-center">Min</th>
            <th class="text-center">Max</th>
            <th class="text-center">Diff</th>
            <th class="text-center">Mean</th>
            <th class="text-center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-6 d-flex">
        <div class="app-card app-card-body flex-fill mt-0">
          <div class="app-card-caption"><span class="app-section-label">Totals</span></div>
          <div class="app-live">
            <div>
              <div class="app-live-label">Day time total</div>
              <div class="app-live-value text-tou-day" id="daytime_total_kwh">---</div>
            </div>
            <div>
              <div class="app-live-label">Day time daily average</div>
              <div class="app-live-value text-tou-day" id="daytime_average_kwhd">---</div>
            </div>
          </div>
          <div class="app-live">
            <div>
              <div class="app-live-label">Night time total</div>
              <div class="app-live-value text-tou-night" id="nighttime_total_kwh">---</div>
            </div>
            <div>
              <div class="app-live-label">Night time daily average</div>
              <div class="app-live-value text-tou-night" id="nighttime_average_kwhd">---</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 d-flex">
        <div class="app-card app-card-body flex-fill mt-0">
          <div class="app-card-caption"><span class="app-section-label">Comparison</span></div>
          <div class="text-center">
            <p id="comparison_summary"></p>
            <canvas id="energystack" width="270" height="360"></canvas>
          </div>
          <p>The ZeroCarbonBritain target is based on a household using all low energy appliances and LED lighting.</p>
          <p class="fw-bold mb-2">My Electric includes:</p>
          <div class="app-options">
            <div class="app-option"><input id="heating" type="checkbox"> Heatpump or electric heating</div>
            <div class="app-option"><input id="transport" type="checkbox"> Electric Vehicle</div>
          </div>
        </div>
      </div>
    </div>

  </section>

<div id="appconf-description" style="display:none">
    <p class="lead">The My Electric app is a simple home energy monitoring app for exploring home or building electricity consumption over time.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
if (!sessionwrite) $(".openconfig").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh"},
    "economy7_start":{"type":"value", "default":1, "name": "Economy 7 start", "description":"Start time in hours (e.g 1.5 for 1:30am)"},
    "economy7_end":{"type":"value", "default":7, "name": "Economy 7 end", "description":"End time in hours (e.g 7.0 for 7:00am)"},
    
    "unitcost_day":{"type":"value", "default":0.15, "name": "Day time unit cost", "description":"Day time unit cost of electricity £/kWh"},
    "unitcost_night":{"type":"value", "default":0.07, "name": "Night time unit cost", "description":"Night time unit cost of electricity £/kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$..)"}
};

config.app_name = "Time of Use";
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
var bargraph_alltime = false;

config.init();

function init()
{
    // Quick translation of feed ids
    feeds = {};
    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];
    }
}

function show() {
    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
    use_start = feed.getvalue(feeds["use_kwh"].id, start_time);

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_alltime = false;
    period_text = "month";
    bargraph_load(start,end);
    bargraph_draw();
    energystacks_draw();

    updater();
    clearInterval(updaterinst);
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
        
        $("#power_now").html(Math.round(feeds["use"].value)+"<span class='power-unit-static'>W</span>");
        live_status_update(feeds["use"].time);
    });
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
// Time bar after a redraw. Daily bars use their own window; the power view
// stops at a month and has no all time range.
function tou_timebar_sync() {
    var daily = viewmode == "bargraph";
    $("#time-select").find("option[value=all]").prop("hidden", !daily);
    timebar_update(daily);
    if (daily && bargraph_alltime) $("#time-select").val("all");
    $(".viewhistory").toggleClass("active", daily);
    $(".viewpower").toggleClass("active", !daily);
}

// Daily bars for a window, comparison for the same period
function tou_bargraph(start, end, text) {
    bargraph_load(start, end);
    bargraph_draw();
    period_text = text;
    energystacks_draw();
}

// Range select: days of bars, or hours of power data
$("#time-select").change(function () {
    var value = $(this).val();
    if (!value) return;
    if (viewmode == "bargraph") {
        var end = (new Date()).getTime();
        var start = value == "all" ? start_time * 1000 : end - value * 3600000;
        bargraph_alltime = value == "all";
        var text = "period";
        if (value == 168) text = "week";
        if (value == 720) text = "month";
        tou_bargraph(start, end, text);
    } else {
        view.timewindow(value / 24.0);
        powergraph_load(); powergraph_draw();
    }
});

// Zoom, pan and the Start and End fields act on the daily bars or the power graph
function tou_navigate(move) {
    move();
    if (viewmode == "bargraph") {
        bargraph_alltime = false;
        tou_bargraph(view.start, view.end, "period");
    } else {
        powergraph_load(); powergraph_draw();
    }
}
$("#zoomout").click(function () { tou_navigate(function () { view.zoomout(); }); });
$("#zoomin").click(function () { tou_navigate(function () { view.zoomin(); }); });
$('#right').click(function () { tou_navigate(function () { view.panright(); }); });
$('#left').click(function () { tou_navigate(function () { view.panleft(); }); });

timebar_manual(function () { tou_navigate(function () {}); });
timebar_now(function () { powergraph_load(); powergraph_draw(); });

$(".viewhistory").click(function () {
    if (viewmode == "bargraph") return;
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    viewmode = "bargraph";
    bargraph_alltime = false;
    tou_bargraph(start, end, "month");
});

// Power view of the last 24 hours
$(".viewpower").click(function () {
    if (viewmode == "powergraph") return;
    viewmode = "powergraph";
    view.timewindow(1);
    powergraph_load();
    powergraph_draw();
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

document.getElementById('placeholder').addEventListener("plothover", function (event) {
    var pos = event.detail[0], item = event.detail[1];
    if (item) {
        var z = item.dataIndex;
        var seriesIndex = item.seriesIndex;
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            
            if (viewmode=="bargraph") {
                var itemTime = item.datapoint[0];
                var standard_kwh = bargraph_series[1].data[z][1];
                var economy7_kwh = bargraph_series[0].data[z][1];
                
                var d = new Date(itemTime);
                var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
               
                var text = "";
                if (viewcostenergy=="energy") {
                    text = date+"<br>Day:"+(standard_kwh).toFixed(1)+" kWh<br>Night:"+(economy7_kwh).toFixed(1)+" kWh<br>Total:"+(economy7_kwh+standard_kwh).toFixed(1)+" kWh";
                } else {
                    var daycost = config.app.currency.value+(standard_kwh*config.app.unitcost_day.value).toFixed(2);
                    var nightcost = config.app.currency.value+(economy7_kwh*config.app.unitcost_night.value).toFixed(2);
                    var totalcost = config.app.currency.value+((standard_kwh*config.app.unitcost_day.value)+(economy7_kwh*config.app.unitcost_night.value)).toFixed(2);
                                
                    text = date+"<br>Day:"+(standard_kwh).toFixed(1)+" kWh ("+daycost+")<br>Night:"+(economy7_kwh).toFixed(1)+" kWh ("+nightcost+")<br>Total:"+(economy7_kwh+standard_kwh).toFixed(1)+" kWh ("+totalcost+")";
                }
                
                tooltip(item.pageX, item.pageY, text, "#fff", "#000");
            }
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
document.getElementById('placeholder').addEventListener("plotclick", function (event)
{
    var pos = event.detail[0], item = event.detail[1];
    if (item && !panning && viewmode=="bargraph") {
        var z = item.dataIndex;
        view.start = bargraph_series[0].data[z][0];
        view.end = view.start + 86400*1000;
        viewmode = "powergraph";
        powergraph_load();
        powergraph_draw();
    }
});

document.getElementById('placeholder').addEventListener("plotselected", function (event) {
    var ranges = event.detail[0];
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true; 

    if (viewmode=="bargraph") {
        bargraph_alltime = false;
        bargraph_load(start,end);
        bargraph_draw();
    } else {
        view.start = start; view.end = end;
        powergraph_load();
        powergraph_draw();
    }
    setTimeout(function() { panning = false; }, 100);
});

$("#heating").click(function() {
    comparison_heating = 0;
    if ($(this)[0].checked) comparison_heating = 1;
    energystacks_draw();
});

$("#transport").click(function() {
    comparison_transport = 0;
    if ($(this)[0].checked) comparison_transport = 1;
    energystacks_draw();
});

$(".viewcostenergy").click(function(){
    var mode = $(this).attr("data-mode");
    if (mode == viewcostenergy) return;
    viewcostenergy = mode;
    $(".viewcostenergy").removeClass("active");
    $(this).addClass("active");

    viewmode = "bargraph";
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

function powergraph_load() 
{
    $("#power-graph-footer").show();
    view.calc_interval(1200); // npoints = 1200
    // feedid,start,end,interval,average=0,delta=0,skipmissing=0,limitinterval=0
    data["use"] = feed.getdata(feeds["use"].id,view.start,view.end,view.interval,1,0,0,0);

    data["use_standard"] = [];
    data["use_economy7"] = [];

    var offpeak_start = config.app.economy7_start.value*1;
    var offpeak_end = config.app.economy7_end.value*1;

    var kwh_offpeak = 0;
    var kwh_onpeak = 0;
    var power_to_kwh = view.interval / 3600000.0;

    // Split into standard and economy 7
    for (var z=0; z<data["use"].length-1; z++) {
        let time = data["use"][z][0];
        let date = new Date(time);
        let hour = date.getHours() + (date.getMinutes()/60.0);

        let offpeak = false;
        if (offpeak_start<offpeak_end) {
            if (hour>=offpeak_start && hour<offpeak_end) offpeak = true;
        } else {
            if (hour>offpeak_start && hour<24) offpeak = true;
            if (hour>=0 && hour<offpeak_end) offpeak = true;
        }

        let use = data["use"][z][1];

        if (offpeak) {
            data["use_economy7"].push([time, data["use"][z][1]]);
            data["use_standard"].push([time, null]);

            kwh_offpeak += use * power_to_kwh;

        } else {
            data["use_economy7"].push([time, null]);
            data["use_standard"].push([time, data["use"][z][1]]);

            kwh_onpeak += use * power_to_kwh;
        }
    }
    
    powergraph_series = [];
    powergraph_series.push({label:"Day", data:data["use_standard"], yaxis:1, color:"#44b3e2", lines:{show:true, fill:0.8, lineWidth:0}});
    powergraph_series.push({label:"Night", data:data["use_economy7"], yaxis:1, color:"#1d8dbc", lines:{show:true, fill:0.8, lineWidth:0}});
    
    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    
    var time_elapsed = (data["use"][data["use"].length-1][0] - data["use"][0][0])*0.001;
        
    $("#window-kwh").html((kwh_offpeak+kwh_onpeak).toFixed(1));
    $("#window-offpeak").html(kwh_offpeak.toFixed(1));
    $("#window-peak").html(kwh_onpeak.toFixed(1));
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        out += "<td>"+z+"</td>";
        out += "<td class='text-center'>"+feedstats[z].minval.toFixed(0)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].maxval.toFixed(0)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].diff.toFixed(0)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].mean.toFixed(0)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].stdev.toFixed(0)+"</td>";
        out += "</tr>";
    }
    $("#stats").html(out);
}

function powergraph_draw() 
{
    var options = {
        series: { lines: { fill: false, lineWidth: 2 } },
        xaxis: { 
            mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none",
            min: view.start, max: view.end, 
            font: {size:flot_font_size, color: flot_font_color(), fill: flot_font_color()},
            reserveSpace:false
        },
        yaxes: [
            { min: 0, autoScale: "none", font: {size:flot_font_size, color: flot_font_color(), fill: flot_font_color()},reserveSpace:false},
            {font: {size:flot_font_size, color: flot_font_color(), fill: flot_font_color()},reserveSpace:false}
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
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    }
    Flot.plot(document.getElementById('placeholder'),powergraph_series,options);
    chart_legend(powergraph_series);
    tou_timebar_sync();
}

function bargraph_load(start,end) 
{   
    $("#power-graph-footer").hide();
    $("#advanced-toggle").html("SHOW DETAIL");
    $("#advanced-block").hide();
        
    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    // Daily window for the time bar, zoom and pan
    view.start = start;
    view.end = end;
    

    var offpeak_start = config.app.economy7_start.value*1;
    var offpeak_end = config.app.economy7_end.value*1;
    var split = [0,config.app.economy7_start.value,config.app.economy7_end.value];
    var elec_result = feed.getdataDMY_time_of_use(feeds["use_kwh"].id,start,end,"daily",JSON.stringify(split));
    
    var elec_data = [];
    
    // remove nan values from the end.
    for (var z in elec_result) {
      if (elec_result[z][1][0]!=null && elec_result[z][1][1]!=null && elec_result[z][1][2]!=null) elec_data.push(elec_result[z]);
    }
    
    data["economy7"] = [];
    data["standard"] = [];
    
    if (elec_data.length>0) {
        var lastday = elec_data[elec_data.length-1][0];
        
        var d = new Date();
        d.setHours(0,0,0,0);
        
        //if (lastday==d.getTime()) {
            // last day in kwh data matches start of today from the browser's perspective
            // which means its safe to append today kwh value
        //    var next = elec_data[elec_data.length-1][0] + (interval*1000);
            // elec_data.push([next,feeds["use_kwh"].value]);
        //}
 
        var daytime_total_kwh = 0;
        var nighttime_total_kwh = 0;
        var total_kwh = 0; 
        var n = 0;
        // Calculate the daily totals by subtracting each day from the day before
        for (var z=0; z<elec_data.length-1; z++)
        {
            var time = elec_data[z][0];

            if (offpeak_start<offpeak_end) {
                // start until end
                economy7 = elec_data[z][1][2]-elec_data[z][1][1]
            } else {
                // first part is midnight until end
                economy7 = elec_data[z][1][2]-elec_data[z][1][0]
                // second part is start until midnight
                economy7 += elec_data[z+1][1][0]-elec_data[z][1][1]
            }
            
            data["economy7"].push([time,economy7]);

            var total_day = elec_data[z+1][1][0] - elec_data[z][1][0];            
            var standard = total_day - economy7;
            data["standard"].push([time,standard]);
            
            console.log(economy7+" "+standard);
            total_kwh += total_day;
            
            daytime_total_kwh += standard;
            nighttime_total_kwh += economy7;
            
            n++;
        }
        period_average = total_kwh / n;
    }

    bargraph_series = [];
    
    bargraph_series.push({
        stack: true, label: "Night",
        data: data["economy7"], color: "#1d8dbc",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 1.0, lineWidth:0}
    });
    
    bargraph_series.push({
        stack: true, label: "Day",
        data: data["standard"], color: "#44b3e2",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 1.0, lineWidth:0}
    });
    
    if (viewcostenergy=="energy") {
        if (typeof daytime_total_kwh === 'undefined') daytime_total_kwh = 0;
        if (typeof nighttime_total_kwh === 'undefined') nighttime_total_kwh = 0;

        $("#daytime_total_kwh").html(daytime_total_kwh.toFixed(1)+"<span class='power-unit-static'>kWh</span>");
        $("#daytime_average_kwhd").html((daytime_total_kwh/n).toFixed(1)+"<span class='power-unit-static'>kWh/d</span>");
        
        $("#nighttime_total_kwh").html(nighttime_total_kwh.toFixed(1)+"<span class='power-unit-static'>kWh</span>");
        $("#nighttime_average_kwhd").html((nighttime_total_kwh/n).toFixed(1)+"<span class='power-unit-static'>kWh/d</span>");
    } else {
        $("#daytime_total_kwh").html(config.app.currency.value+(daytime_total_kwh*config.app.unitcost_day.value).toFixed(2));
        $("#daytime_average_kwhd").html(config.app.currency.value+(daytime_total_kwh*config.app.unitcost_day.value/n).toFixed(2)+"<span class='power-unit-static'>/day</span>");
        
        $("#nighttime_total_kwh").html(config.app.currency.value+(nighttime_total_kwh*config.app.unitcost_night.value).toFixed(2));
        $("#nighttime_average_kwhd").html(config.app.currency.value+(nighttime_total_kwh*config.app.unitcost_night.value/n).toFixed(2)+"<span class='power-unit-static'>/day</span>");
    }

    if (typeof data["economy7"][data["economy7"].length-1] !== 'undefined') {
        var kwh_today = data["economy7"][data["economy7"].length-1][1] + data["standard"][data["standard"].length-1][1];
    } else {
        var kwh_today = 0;
    }

    $("#kwh_today").html(kwh_today.toFixed(1)+"<span class='power-unit-static'>kWh</span>");
    
    //if (viewcostenergy=="energy") {
    //    $("#kwh_today").html(kwh_today.toFixed(1));
    //} else {
    //    $("#kwh_today").html(config.app.currency.value+(kwh_today*config.app.unitcost.value).toFixed(2));
    //}
}

function bargraph_draw() 
{
    var options = {
        xaxis: { 
            mode: "time", 
            timezone: "browser", 
            timeBase: "milliseconds",
            font: {size:flot_font_size, color: flot_font_color(), fill: flot_font_color()}, 
            // labelHeight:-5
            reserveSpace:false
        },
        yaxis: { 
            font: {size:flot_font_size, color: flot_font_color(), fill: flot_font_color()}, 
            // labelWidth:-5
            reserveSpace:false,
            min:0,
            autoScale: "none"
        },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false },
        grid: {
            show:true, 
            color:"#aaa",
            borderWidth:0,
            hoverable: true, 
            clickable: true
        }
    }

    var plot = Flot.plot(document.getElementById('placeholder'),bargraph_series,options);
    $('#placeholder').append("<div id='bargraph-label' style='position:absolute;left:50px;top:30px;color:var(--bs-secondary-color);font-size:12px'></div>");
    chart_legend(bargraph_series);
    tou_timebar_sync();
}

function energystacks_draw()
{   
    var c = document.getElementById("energystack");  
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,270,360);
    
    var maxval = 9.0;
    if (period_average>maxval) maxval = period_average;
    
    var options = {
        fill: "rgba(6,153,250,1.0)",
        stroke: "rgba(6,153,250,0.5)",
        maxval: maxval,
        height: 350
    };
    
    var x = 0;
    if (!comparison_heating && !comparison_transport) {
        stack(ctx,[["UK Average",(9.0).toFixed(1)]],x,options); x+=90;
        stack(ctx,[["ZCB Target",4.5]],x,options); x+=90;
        stack(ctx,[["My Electric",period_average.toFixed(1)]],x,options); 
    } else {
        
        
        var d1 = [];
        d1.push(["Electric",(9.0).toFixed(1)]);
        if (comparison_heating) d1.push(["Heating",(41.0).toFixed(1)]);
        if (comparison_transport) d1.push(["Transport",(41.0).toFixed(1)]);
        var v=0; for (var z in d1) v += 1*d1[z][1];
        options.maxval = v;
        stack(ctx,d1,x,options); x+=90;

        var d2 = [];
        d2.push(["Electric",4.5]);
        if (comparison_heating) d2.push(["Heatpump",(7.1).toFixed(1)]);
        if (comparison_transport) d2.push(["EV",(6.1).toFixed(1)]);
        stack(ctx,d2,x,options); x+=90;
        
        var d3 = [];
        d3.push(["My Electric",period_average.toFixed(1)]);
        stack(ctx,d3,x,options); x+=90;
        

    }
    
    if (period_average<9.0) $("#comparison_summary").html("You used <b>"+Math.round((1.0-(period_average/9.0))*100)+"%</b> less than the UK average this "+period_text);
    if (period_average>9.0) $("#comparison_summary").html("You used <b>"+Math.round(((period_average/9.0)-1.0)*100)+"%</b> more than the UK average this "+period_text);
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
    
    console.log(width+" "+height);

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
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
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
