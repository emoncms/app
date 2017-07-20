<?php
    global $path, $session;
    $v = 5;
?>
<link href="<?php echo $path; ?>Modules/app/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/vis.helper.js?v=<?php echo $v; ?>"></script>

<style>

.electric-title {
    font-weight:bold;
    font-size:22px;
    color:#44b3e2;
}

.power-value {
    font-weight:bold; 
    font-size:52px; 
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
      <div class="bluenav openconfig"><i class="icon-wrench icon-white"></i></div>
      <div class="bluenav viewcostenergy">ENERGY MODE</div>
      <!--<div class="bluenav cost">Cost</div>
      <div class="bluenav energy">Energy</div>-->
      <div class="block-title">MY ELECTRIC</div>
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
        <span class="bluenav" id="right" >></span>
        <span class="bluenav" id="left" ><</span>
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
          <div class="electric-title">DAY TIME TOTAL</div>
          <div class="power-value"><span id="peak_total_kwh">0</span></div><br>
          <div class="electric-title">DAY TIME DAILY AVERAGE</div>
          <div class="power-value"><span id="peak_average_kwhd">0</span></div><br>
          <div class="electric-title">NIGHT TIME TOTAL</div>
          <div class="power-value"><span id="offpeak_total_kwh">0</span></div><br>
          <div class="electric-title">NIGHT TIME DAILY AVERAGE</div>
          <div class="power-value"><span id="offpeak_average_kwhd">0</span></div><br>
      </div>
    </div>
  </div>
  
</div>    
</div>

<div id="app-setup" class="block">
    <h2 class="appconfig-title">My Electric 2</h2>

    <div class="appconfig-description">
      <div class="appconfig-description-inner">
        The My Electric app is a simple home energy monitoring app for exploring home or building electricity consumption over time.
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

if (!sessionwrite) $(".openconfig").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "engine":"5"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5},
    "economy7_start":{"type":"value", "default":1, "name": "Economy 7 start", "description":"Start time in hours (e.g 1.5 for 1:30am)"},
    "economy7_end":{"type":"value", "default":7, "name": "Economy 7 end", "description":"End time in hours (e.g 7.0 for 7:00am)"},
    "unitcost_day":{"type":"value", "default":0.15, "name": "Day time unit cost", "description":"Day time unit cost of electricity £/kWh"},
    "unitcost_night":{"type":"value", "default":0.07, "name": "Night time unit cost", "description":"Night time unit cost of electricity £/kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$..)"}
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

// cents/kWh rates, one for each tier in "splits" below.
var tier_rates = [16.5,25.3,59.4];

// Split is [[start hour, tier],[...]]
var weekday_split = [[0,0],[7,1],[14,2],[20,1],[22,0]]; 
var weekend_split = [[0,0],[7,1],[22,0]];
var special_split = [[0,0],[7,1],[22,0]];
// special_days is days of year where the special_split applies
// January 1st is day 1.
var special_days = [];

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
    $("body").css('background-color','WhiteSmoke');
    
    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
    use_start = feed.getvalue(feeds["use_kwh"].id, start_time*1000)[1];

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    timeofuse_load();

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
        
        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        
        $("#power_now").html(Math.round(feeds["use"].value)+"W");
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
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var offpeak_kwh = bargraph_series[0].data[z][1];
            var shoulder_kwh = bargraph_series[1].data[z][1];
            var peak_kwh = bargraph_series[2].data[z][1];
            
            var d = new Date(itemTime);
            var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
           
            var text = "";
            if (viewcostenergy=="energy") {
                text = date+"<br>Peak:"+(peak_kwh).toFixed(1)+" kWh<br>Shoulder:"+(shoulder_kwh).toFixed(1)+" kWh<br>Off Peak:"+(offpeak_kwh).toFixed(1)+" kWh<br>Total:"+(offpeak_kwh+shoulder_kwh+peak_kwh).toFixed(1)+" kWh";
            } else {
                var offpeakcost = config.app.currency.value+(offpeak_kwh*config.app.unitcost_day.value).toFixed(2);
                var peakcost = config.app.currency.value+(peak_kwh*config.app.unitcost_night.value).toFixed(2);
                var totalcost = config.app.currency.value+((peak_kwh*config.app.unitcost_day.value)+(offpeak_kwh*config.app.unitcost_night.value)).toFixed(2);
                            
                text = date+"<br>Peak:"+(peak_kwh).toFixed(1)+" kWh<br>Shoulder:"+(shoulder_kwh).toFixed(1)+" kWh<br>Off Peak:"+(offpeak_kwh).toFixed(1)+" kWh<br>Total:"+(offpeak_kwh+shoulder_kwh+peak_kwh).toFixed(1)+" kWh";
            }
            
            tooltip(item.pageX, item.pageY, text, "#fff");
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
    timeofuse_load();
    energystacks_draw();
});

$('.bargraph-week').click(function () {
    var timeWindow = (3600000*24.0*7);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "week";
    timeofuse_load();
    energystacks_draw();
});

$('.bargraph-month').click(function () {
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "month";
    timeofuse_load();
    energystacks_draw();
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

function powergraph_load() 
{
    $("#power-graph-footer").show();
    var start = view.start; var end = view.end;
    var npoints = 1200;
    var interval = ((end-start)*0.001) / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start/intervalms)*intervalms;
    end = Math.ceil(end/intervalms)*intervalms;

    data["use"] = feed.getdata(feeds["use"].id,start,end,interval,1,1);
    
    powergraph_series = [];
    powergraph_series.push({data:data["use"], yaxis:1, color:"#44b3e2", lines:{show:true, fill:0.8, lineWidth:0}});
    
    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    
    var time_elapsed = (data["use"][data["use"].length-1][0] - data["use"][0][0])*0.001;
    var kwh_in_window = 0.0; // (feedstats["use"].mean * time_elapsed) / 3600000;
    
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
        
    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    
    var elec_result = feed.getdataDMY_time_of_use(feeds["use_kwh"].id,start,end,"daily","[0,7,14,20,22]");

    var cur_use = feeds["use_kwh"].value;
    
    //console.log(start, end, cur_use);

    var elec_data = [];
    
    var today = new Date();
    today.setHours(0,0,0,0);
        
    // strip nan values.
    for (var z in elec_result) {
        if (elec_result[z][1][0]!=null && elec_result[z][1][1]!=null && elec_result[z][1][2]!=null &&
          elec_result[z][1][3]!=null && elec_result[z][1][4]!=null) {
	    elec_data.push(elec_result[z]);
        }
        if (elec_result[z][0] >= today.getTime()) {
            // this is today or tomorrow set all null values to the current feed value.
            for (var i in elec_result[z][1]) {
		if (elec_result[z][1][i] == null) {
                    elec_result[z][1][i] = feeds["use_kwh"].value;
                }
            }
	    elec_data.push(elec_result[z]);
        }

    }

    //console.log(elec_data);
    
    data["offpeak"] = [];
    data["shoulder"] = [];
    data["peak"] = [];
    
    if (elec_data.length>0) {
        var peak_total_kwh = 0;
        var shoulder_total_kwh = 0;
        var offpeak_total_kwh = 0;
        var total_kwh = 0; 
        var n = 0;
        var peak = 0;
        var shoulder = 0;
        var offpeak = 0;

        // Calculate the daily totals by subtracting each day from the day before
        for (var z=0; z<elec_data.length; z++)
        {
            var time = elec_data[z][0];
            var d = new Date(time);
            var day = d.getDay();

            // ignore tomorrow. We just use it to calculate the value from the last split value to now.
            if (d > today) continue;

	    // Two off-peak periods, first and last
	    // First period
            offpeak = (elec_data[z][1][1] - elec_data[z][1][0]);
	    // last period ends with the next days first value
            if ((z+1)<elec_data.length) offpeak += elec_data[z+1][1][0] - elec_data[z][1][4];

	    // Two shoulder periods, second and fourth
            shoulder = (elec_data[z][1][2] - elec_data[z][1][1] + elec_data[z][1][4] - elec_data[z][1][3]);
            
            if (day == 0 || day == 6) {
                shoulder += elec_data[z][1][3] - elec_data[z][1][2];
            } else {
                peak = elec_data[z][1][3] - elec_data[z][1][2];
            }

           // Add 11 hours to the time to shift the "tick" in the graph to the right place
           //time += 11*3600*1000;
            
            data["offpeak"].push([time,offpeak]);
            data["shoulder"].push([time,shoulder]);
	    data["peak"].push([time,peak]);
            //console.log(offpeak+" "+shoulder+" "+peak);
            total_kwh += offpeak + shoulder + peak;
            
            peak_total_kwh += peak;
            shoulder_total_kwh += shoulder;
            offpeak_total_kwh += offpeak;
            
            n++;
        }
        period_average = total_kwh / n;
    }

    bargraph_series = [];
    
    bargraph_series.push({
        stack: true,
        data: data["offpeak"], color: "#1d8dbc",
        bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    bargraph_series.push({
        stack: true,
        data: data["shoulder"], color: "#44b3e2",
        bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    bargraph_series.push({
        stack: true,
        data: data["peak"], color: "#88b3e2",
        bars: { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    if (viewcostenergy=="energy") {
        $("#peak_total_kwh").html(peak_total_kwh.toFixed(1)+" kWh");
        $("#peak_average_kwhd").html((peak_total_kwh/n).toFixed(1)+" kWh/d");
        
        $("#offpeak_total_kwh").html(offpeak_total_kwh.toFixed(1)+" kWh");
        $("#offpeak_average_kwhd").html((offpeak_total_kwh/n).toFixed(1)+" kWh/d");
    } else {
        $("#peak_total_kwh").html(config.app.currency.value+(peak_total_kwh*config.app.unitcost_day.value).toFixed(2));
        $("#peak_average_kwhd").html(config.app.currency.value+(peak_total_kwh*config.app.unitcost_day.value/n).toFixed(2)+"/day");
        
        $("#offpeak_total_kwh").html(config.app.currency.value+(offpeak_total_kwh*config.app.unitcost_night.value).toFixed(2));
        $("#offpeak_average_kwhd").html(config.app.currency.value+(offpeak_total_kwh*config.app.unitcost_night.value/n).toFixed(2)+"/day");
    }

    var kwh_today = data["offpeak"][data["offpeak"].length-1][1] + data["shoulder"][data["shoulder"].length-1][1] + data["peak"][data["peak"].length-1][1];
    $("#kwh_today").html(kwh_today.toFixed(1)+" kWh");
    
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

function timeofuse_load() 
{
  /*
  $.ajax({                                      
      url: path+"household/data?id="+feeds["use"].id,
      dataType: 'json',                  
      success: function(result) {
          console.log("here...");
          var prc = Math.round(100*((result.overnightkwh + result.middaykwh) / result.totalkwh));
          $("#prclocal").html(prc);
          
          if (prc>20) $("#star1").attr("src",path+"files/star.png");
          if (prc>40) setTimeout(function() { $("#star2").attr("src",path+"files/star.png"); }, 100);
          if (prc>60) setTimeout(function() { $("#star3").attr("src",path+"files/star.png"); }, 200);
          if (prc>80) setTimeout(function() { $("#star4").attr("src",path+"files/star.png"); }, 300);
          if (prc>90) setTimeout(function() { $("#star5").attr("src",path+"files/star.png"); }, 400);
          
          var data = [
            {name:"AM PEAK", value: result.morningkwh, color:"rgba(68,179,226,0.8)"},
            {name:"DAYTIME", value: result.middaykwh, color:"rgba(68,179,226,0.6)"},
            {name:"PM PEAK", value: result.eveningkwh, color:"rgba(68,179,226,0.9)"},
            {name:"NIGHT", value: result.overnightkwh, color:"rgba(68,179,226,0.4)"},
            // {name:"HYDRO", value: 2.0, color:"rgba(255,255,255,0.2)"}   
          ];
          
          var options = {
            "color": "#333",
            "centertext": "THIS "+period_text.toUpperCase()
          }; 
          
          piegraph("piegraph",data,options);
      } 
  });*/
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
    
    if (width<=500) {
        $(".electric-title").css("font-size","16px");
        $(".power-value").css("font-size","38px");
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","52px");
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","52px");
    }
}

$(window).resize(function(){
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

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
