<?php
    global $path, $session;
    $v = 5;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/vis.helper.js?v=<?php echo $v; ?>"></script>

<style>

.title1 {
  font-weight:bold;
}

.value1 {
  font-weight:bold;
  font-size:32px;
  padding-top:10px;
  padding-bottom:10px;
}

.units1 {
  font-weight:normal;
  padding-left:4px;
  display: inline-block;
  font-size:18px;
}

@media (max-width: 450px) {  
  .title1 { font-size:12px }
  .value1 { font-size:18px }
}

</style>

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-container" style="display:none">

  <div class="col1"><div class="col1-inner">
    <div class="block-bound">
      <div style="float:right">
          <div class="config" style="padding-top:10px; padding-right:10px; cursor:pointer">
              <i class="icon-wrench icon-white"></i>
          </div>
      </div>
      
      <div class="block-title">MY HEATPUMP</div>
    </div>

    <div style="background-color:#fff; color:#333">
      <br>
      <table style="width:100%; color:#333">
        <tr>
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">COP 30 mins</div>
            <div class="value1" id="COP_30m">---</div>
          </td>
          
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Electric</div>
            <div class="value1"><span id="heatpump_elec">---</span><div class="units1">W</div></div>
          </td>
          
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Heat Output</div>
            <div class="value1"><span id="heatpump_heat">---</span><div class="units1">W</div></div>
          </td>

          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Flow</div>
            <div class="value1"><span id="heatpump_flowT">---</span><div class="units1">&deg;C</div></div>
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
        <div class="bluenav viewhistory">BACK</div>
        <span class="bluenav" id="right" >></span>
        <span class="bluenav" id="left" ><</span>
        <span class="bluenav" id="zoomout" >-</span>
        <span class="bluenav" id="zoomin" >+</span>
        <span class="bluenav time dmy" time='720'>M</span>
        <span class="bluenav time dmy" time='168'>W</span>
        <span class="bluenav time" time='24'>D</span>
      </div>
        
      <div class="block-title">HISTORY</div>       
    </div>
    
    <div style="background-color:#fff; padding:10px;">
      <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>
          
    <div style="background-color:#eee; color:#333">
      <div id='advanced-toggle' class='bluenav' style="display:none" >SHOW DETAIL</div>
      
      <div style="padding:10px;">
        COP in window: <b id="window-cop"></b>
      </div>
    </div>
          
    <div id="advanced-block" style="background-color:#fff; padding:10px; display:none">
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
  <div class="col1"><div class="col1-inner">
         
    <div class="block-bound">
        <div class="block-title">ALL TIME HISTORY</div>
    </div>
          
    <div style="background-color:#fff; padding:10px;">
      <table style="width:100%; color:#333;">
      <tr>
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">Total Electricity input</div>
          <div class="value1"><span id="total_elec"></span><div class="units1">kWh</div></div>
        </td>
        
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">Total Heat output</div>
          <div class="value1"><span id="total_heat"></span><div class="units1">kWh</div></div>
        </td>
        
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">All-time COP</div>
          <div class="value1"><span id="total_cop"></span></div>
        </td>
      </tr>
      </table>
    </div>

  </div></div>

</div>  
</div>    
  
<div id="app-setup" class="block">
    <h2 class="app-config-title">My Heatpump</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        The My Heatpump app can be used to explore the performance of a heatpump including, electricity consumption, heat output, COP and system temperatures.
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

<div class="ajax-loader"></div>

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
    "heatpump_elec":{"type":"feed", "autoname":"heatpump_elec", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_elec_kwh":{"type":"feed", "autoname":"heatpump_elec_kwh", "engine":5, "description":"House or building use in watts"},
    "heatpump_heat":{"type":"feed", "autoname":"heatpump_heat", "engine":"5", "optional":true, "description":"House or building use in watts"},
    "heatpump_heat_kwh":{"type":"feed", "autoname":"heatpump_heat_kwh", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_flowT":{"type":"feed", "autoname":"heatpump_flowT", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_returnT":{"type":"feed", "autoname":"heatpump_returnT", "engine":5, "optional":true, "description":"House or building use in watts"}
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.getList();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------
var meta = {};
var data = {};
var bargraph_series = [];
var powergraph_series = [];
var previousPoint = false;
var viewmode = "bargraph";
var panning = false;
var flot_font_size = 12;
var updateTimer = false;
var elec_enabled = false;
var heat_enabled = false;
var feeds = {};
var progtime = 0;
var heatpump_elec_start = 0;
var heatpump_heat_start = 0;
var start_time = 0;
 
config.init();

function init()
{
    // Quick translation of feed ids
    feeds = {};
    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];

    }
}

function show() 
{
    // -------------------------------------------------------------------------------
    // Configurations
    // -------------------------------------------------------------------------------
    if (feeds["heatpump_elec_kwh"]!=undefined) elec_enabled = true;
    if (feeds["heatpump_heat"]!=undefined && feeds["heatpump_heat_kwh"]!=undefined) heat_enabled = true;
    // -------------------------------------------------------------------------------

    if (elec_enabled) {
        meta["heatpump_elec_kwh"] = feed.getMeta(feeds["heatpump_elec_kwh"].id);
        if (meta["heatpump_elec_kwh"].start_time>start_time) start_time = meta["heatpump_elec_kwh"].start_time;
        heatpump_elec_start = feed.getValue(feeds["heatpump_elec_kwh"].id, start_time*1000)[1];
    }

    if (heat_enabled) {
        meta["heatpump_heat_kwh"] = feed.getMeta(feeds["heatpump_heat_kwh"].id);
        if (meta["heatpump_heat_kwh"].start_time>start_time) start_time = meta["heatpump_heat_kwh"].start_time;
        heatpump_heat_start = feed.getValue(feeds["heatpump_heat_kwh"].id, start_time*1000)[1];
    }
    
    resize();

    var end = (new Date()).getTime();

    // If this is a new dashboard there will be less than a days data 
    // show power graph directly in this case
    if (((end*0.001)-start_time)<86400*1) {
        var timeWindow = (end - start_time*1000);
        var start = end - timeWindow;
        view.start = start;
        view.end = end;
        viewmode = "powergraph";
        $(".bargraph-navigation").hide();
        powergraph_load();
        $(".powergraph-navigation").show();
        powergraph_draw();
        $("#advanced-toggle").show();
    } else {
        var timeWindow = (3600000*24.0*30);
        var start = end - timeWindow;
        bargraph_load(start,end);
        bargraph_draw();
        $("#advanced-toggle").hide();
    }
    
    // LOOP
    progtime = 0;
    update();
    updateTimer = setInterval(update, 10000);
    $(".ajax-loader").hide();
}

function clear()
{
    clearInterval(updateTimer);
}

function update()
{
    feed.getListById(function(result) {
        if (result === null) { return; }
        
        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        
        if (feeds["heatpump_elec"]!=undefined) $("#heatpump_elec").html(Math.round(feeds["heatpump_elec"].value));
        if (feeds["heatpump_heat"]!=undefined) $("#heatpump_heat").html(Math.round(feeds["heatpump_heat"].value));
        if (feeds["heatpump_flowT"]!=undefined) $("#heatpump_flowT").html((1*feeds["heatpump_flowT"].value).toFixed(1));
        
        // Update all-time values
        var total_elec = 0;
        var total_heat = 0;
        if (elec_enabled) total_elec = feeds["heatpump_elec_kwh"].value - heatpump_elec_start;
        if (heat_enabled) total_heat = feeds["heatpump_heat_kwh"].value - heatpump_heat_start;
        
        var total_cop = 0;
        if (total_elec>0) total_cop = total_heat / total_elec;
        if (total_cop<0) total_cop = 0;
        
        $("#total_elec").html(Math.round(total_elec));
        $("#total_heat").html(Math.round(total_heat));
        $("#total_cop").html(total_cop.toFixed(2));
        
        // Updates every 60 seconds
        if (progtime%60==0) {
        
            if (feeds["heatpump_elec"]!=undefined) {
                var min30 = feeds["heatpump_elec"].time - (60*30);
                var min60 = feeds["heatpump_elec"].time - (60*60);
            } else {
                var min30 = feeds["heatpump_elec_kwh"].time - (60*30);
                var min60 = feeds["heatpump_elec_kwh"].time - (60*60);
            }
            
            var elec = 0; var heat = 0;
            if (elec_enabled) elec = feeds["heatpump_elec_kwh"].value - feed.getValue(feeds["heatpump_elec_kwh"].id, min30*1000)[1];
            if (heat_enabled) heat = feeds["heatpump_heat_kwh"].value - feed.getValue(feeds["heatpump_heat_kwh"].id, min30*1000)[1];
            
            var COP = 0;
            if (elec>0) COP = heat / elec;
            if (COP<0) COP =0;
            $("#COP_30m").html(COP.toFixed(2));
            
            if (feeds["heatpump_elec"]==undefined) $("#heatpump_elec").html(Math.round(elec*3600000/(60*30)));
            if (feeds["heatpump_elec"]==undefined) $("#heatpump_heat").html(Math.round(heat*3600000/(60*30)));
        }
        progtime += 5;
        
        //$(".value1").css("color","#00cc00");
        //setTimeout(function(){ $(".value1").css("color","#333"); },400);
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
    $("#advanced-toggle").hide();
    $("#advanced-block").hide();
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
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            if (viewmode=="bargraph")
            {
                var itemTime = item.datapoint[0];
                var elec_kwh = 0; var heat_kwh = 0;
                if (elec_enabled) elec_kwh = data["heatpump_elec_kwhd"][z][1];
                if (heat_enabled) heat_kwh = data["heatpump_heat_kwhd"][z][1];
                var COP = heat_kwh / elec_kwh;

                var d = new Date(itemTime);
                var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
                tooltip(item.pageX, item.pageY, date+"<br>Electric: "+(elec_kwh).toFixed(1)+" kWh<br>Heat: "+(heat_kwh).toFixed(1)+" kWh<br>COP: "+(COP).toFixed(1), "#fff");
            }
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
$('#placeholder').bind("plotclick", function (event, pos, item)
{
    if (item && !panning && viewmode=="bargraph") {
        var z = item.dataIndex;
        view.start = data["heatpump_elec_kwhd"][z][0];
        view.end = view.start + 86400*1000;
        $(".bargraph-navigation").hide();
        viewmode = "powergraph";
        powergraph_load();
        powergraph_draw();
        $(".powergraph-navigation").show();
        $("#advanced-toggle").show();
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
});

$('.bargraph-week').click(function () {
    var timeWindow = (3600000*24.0*7);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
});

$('.bargraph-month').click(function () {
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
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
    var start = view.start; var end = view.end;
    var npoints = 800;
    var interval = ((end-start)*0.001) / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start/intervalms)*intervalms;
    end = Math.ceil(end/intervalms)*intervalms;
    
    powergraph_series = [];

    if (feeds["heatpump_flowT"]!=undefined) {
        data["heatpump_flowT"] = feed.getData(feeds["heatpump_flowT"].id, start, end, interval, 1, 1);
        powergraph_series.push({label:"Flow T", data:data["heatpump_flowT"], yaxis:2, color:2});
    }
    if (feeds["heatpump_returnT"]!=undefined) {
        data["heatpump_returnT"] = feed.getData(feeds["heatpump_returnT"].id, start, end, interval, 1, 1);
        powergraph_series.push({label:"Return T", data:data["heatpump_returnT"], yaxis:2, color:3});
    }
    if (feeds["outside_temperature"]!=undefined) {
        data["outside_temperature"] = feed.getData(feeds["outside_temperature"].id, start, end, interval, 1, 1);
        powergraph_series.push({label:"Outside T", data:data["outside_temperature"], yaxis:2, color:4});
    }
    if (feeds["DHW_cylinderT"]!=undefined) {
        data["DHW_cylinderT"] = feed.getData(feeds["DHW_cylinderT"].id, start, end, interval, 1, 1);
        powergraph_series.push({label:"DHW Cylinder T", data:data["DHW_cylinderT"], yaxis:2, color:5});
    }

    if (feeds["heatpump_elec"]!=undefined) {
        // Where power feed is available
        if (heat_enabled) data["heatpump_heat"] = feed.getData(feeds["heatpump_heat"].id, start, end, interval, 1, 1);
        if (heat_enabled) powergraph_series.push({label:"Heat Output", data:data["heatpump_heat"], yaxis:1, color:0, lines:{show:true, fill:0.2, lineWidth:0.5}});
        if (elec_enabled) data["heatpump_elec"] = feed.getData(feeds["heatpump_elec"].id, start, end, interval, 1, 1);
        if (elec_enabled) powergraph_series.push({label:"Electric Input", data:data["heatpump_elec"], yaxis:1, color:1, lines:{show:true, fill:0.3, lineWidth:0.5}});
    } else {
        // Where no power feed available
        var npoints = 50;
        var interval = ((end-start)*0.001) / npoints;
        interval = view.round_interval(interval);
        if (interval<120) interval = 120;
        var intervalms = interval * 1000;
        start = Math.ceil(start/intervalms)*intervalms;
        end = Math.ceil(end/intervalms)*intervalms;
        
        if (heat_enabled) {
            var tmp = feed.getData(feeds["heatpump_heat_kwh"].id, start, end, interval, 0, 0);
            data["heatpump_heat"] = [];
            for (var z=1; z<tmp.length; z++) {
                var time = tmp[z-1][0];
                var diff = tmp[z][1] - tmp[z-1][1];
                var power = (diff * 3600000) / interval;
                if (power<0) power = 0;
                data["heatpump_heat"].push([time,power]);
            }
            powergraph_series.push({label:"Heat Output", data:data["heatpump_heat"], yaxis:1, color:0, bars:{show:true, barWidth: intervalms * 0.8, fill:0.2}});
        }
        
        if (elec_enabled) {
            var tmp = feed.getData(feeds["heatpump_elec_kwh"].id, start, end, interval, 0, 0);
            data["heatpump_elec"] = [];
            for (var z=1; z<tmp.length; z++) {
                var time = tmp[z-1][0];
                var diff = tmp[z][1] - tmp[z-1][1];  // diff in kWh
                var power = (diff * 3600000) / interval;
                if (power<0) power = 0;
                data["heatpump_elec"].push([time,power]);
            }
            powergraph_series.push({label:"Electric Input", data:data["heatpump_elec"], yaxis:1, color:1, bars:{show:true, barWidth: intervalms * 0.8, fill:0.3}});
        }
    }
    
    var feedstats = {};
    if (elec_enabled) feedstats["heatpump_elec"] = stats(data["heatpump_elec"]);
    if (heat_enabled) feedstats["heatpump_heat"] = stats(data["heatpump_heat"]);
    feedstats["heatpump_flowT"] = stats(data["heatpump_flowT"]);
    feedstats["heatpump_returnT"] = stats(data["heatpump_returnT"]);
    
    if (feedstats["heatpump_elec"].mean>0) {
        var elec_mean = 0; var heat_mean = 0;
        if (elec_enabled) elec_mean = feedstats["heatpump_elec"].mean;
        if (heat_enabled) heat_mean = feedstats["heatpump_heat"].mean;
        if (elec_mean>0) $("#window-cop").html((heat_mean / elec_mean).toFixed(1));
    }
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        out += "<td style='text-align:left'>"+z+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].minval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].maxval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].diff.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].mean.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].stdev.toFixed(2)+"</td>";
        out += "</tr>";
    }
    $("#stats").html(out);
}

// -------------------------------------------------------------------------------
// POWER GRAPH
// -------------------------------------------------------------------------------
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

// -------------------------------------------------------------------------------
// BAR GRAPH
// -------------------------------------------------------------------------------
function bargraph_load(start,end) 
{   
    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    
    bargraph_series = [];
    
    var elec_kwh_in_window = 0;
    var heat_kwh_in_window = 0;
    
    if (heat_enabled) {
        var heat_data = [];
        data["heatpump_heat_kwhd"] = [];
        
        var heat_result = feed.getDailyData(feeds["heatpump_heat_kwh"].id, start, end);
        // remove nan values from the end.
        for (var z in heat_result) {
          if (heat_result[z][1]!=null) heat_data.push(heat_result[z]);
        }
        
        if (heat_data.length>0) {
            var lastday = heat_data[heat_data.length-1][0];
            
            var d = new Date();
            d.setHours(0,0,0,0);
            if (lastday==d.getTime()) {
                // last day in kwh data matches start of today from the browser's perspective
                // which means its safe to append today kwh value
                var next = heat_data[heat_data.length-1][0] + (interval*1000);
                heat_data.push([next,feeds["heatpump_heat_kwh"].value]);
            }
     
            // Calculate the daily totals by subtracting each day from the day before
            for (var z=1; z<heat_data.length; z++) {
                var time = heat_data[z-1][0];
                var heat_kwh = (heat_data[z][1]-heat_data[z-1][1]);
                if (heat_kwh<0) heat_kwh = 0;
                data["heatpump_heat_kwhd"].push([time,heat_kwh]);
                heat_kwh_in_window += heat_kwh;
            }
        }
        
        bargraph_series.push({
            data: data["heatpump_heat_kwhd"], color: 0,
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
        });
    }
    
    if (elec_enabled) {
        var elec_data = [];
        data["heatpump_elec_kwhd"] = [];
        
        var elec_result = feed.getDailyData(feeds["heatpump_elec_kwh"].id, start, end);
        // remove nan values from the end.
        for (var z in elec_result) {
          if (elec_result[z][1]!=null) elec_data.push(elec_result[z]);
        }
        
        if (elec_data.length>0) {
            var lastday = elec_data[elec_data.length-1][0];
            
            var d = new Date();
            d.setHours(0,0,0,0);
            if (lastday==d.getTime()) {
                // last day in kwh data matches start of today from the browser's perspective
                // which means its safe to append today kwh value
                var next = elec_data[elec_data.length-1][0] + (interval*1000);
                elec_data.push([next,feeds["heatpump_elec_kwh"].value]);
            }
     
            // Calculate the daily totals by subtracting each day from the day before
            for (var z=1; z<elec_data.length; z++) {
                var time = elec_data[z-1][0];
                var elec_kwh = (elec_data[z][1]-elec_data[z-1][1]);
                if (elec_kwh<0) elec_kwh = 0;
                data["heatpump_elec_kwhd"].push([time,elec_kwh]);
                elec_kwh_in_window += elec_kwh;
            }
        }
        
        bargraph_series.push({
            data: data["heatpump_elec_kwhd"], color: 1,
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
        });
    }
    
    var cop_in_window =  heat_kwh_in_window/elec_kwh_in_window;
    if (cop_in_window<0) cop_in_window = 0;
    $("#window-cop").html((cop_in_window).toFixed(1));
}

function bargraph_draw() 
{
    var options = {
        xaxis: { 
            mode: "time", 
            timezone: "browser", 
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

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------
function resize() {
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = width*0.6;
    if (height<250) height = 250;
    if (height>480) height = 480;
    if (height>width) height = width;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
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
function appLog(level, message) {
    if (level == "ERROR") {
        alert(level + ": " + message);
    }
    console.log(level + ": " + message);
}

</script>
