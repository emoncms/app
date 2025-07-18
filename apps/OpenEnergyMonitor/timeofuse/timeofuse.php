<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
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
      <div class="bluenav config-open"><i class="icon-wrench icon-white"></i></div>
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
        kWh in window: <b id="window-kwh"></b> <b>kWh</b>, Off-peak: <b id="window-offpeak"></b> <b>kWh</b>, Peak: <b id="window-peak"></b> <b>kWh</b>
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
          <div class="power-value"><span id="daytime_total_kwh">0</span></div><br>
          <div class="electric-title">DAY TIME DAILY AVERAGE</div>
          <div class="power-value"><span id="daytime_average_kwhd">0</span></div><br>
          <div class="electric-title">NIGHT TIME TOTAL</div>
          <div class="power-value"><span id="nighttime_total_kwh">0</span></div><br>
          <div class="electric-title">NIGHT TIME DAILY AVERAGE</div>
          <div class="power-value"><span id="nighttime_average_kwhd">0</span></div><br>
      </div>
    </div>
  </div>
  
  <div class="col2">
    <div class="col2-inner">
      <div class="block-bound">
          <div class="block-title">COMPARISON</div>
      </div>
      
      <div style="background-color:rgba(68,179,226,0.1); padding:20px; color:#333; text-align:center">
        <div id="comparison_summary" style=""></div><br>
        <canvas id="energystack" width="270px" height="360px"></canvas>
        <div style="text-align:left">
        The ZeroCarbonBritain target is based on a household using all low energy appliances and LED lighting.
        <br><br>
        
        <b>My Electric includes:</b><br>
        <input id="heating" type="checkbox"> Heatpump or electric heating<br><input id="transport" type="checkbox"> Electric Vehicle
        </div>
        <div style="clear:both"></div>
      </div>
    </div>
  </div>
    
</div>    
</div>



<section id="app-setup" class="hide pb-3 px-3">
    <!-- instructions and settings -->
    <div class="row-fluid">
        <div class="span7 app-config-description">
            <div class="app-config-description-inner text-light">
                <h2 class="app-config-title text-primary"><?php echo tr('Time of Use'); ?></h2>
                <p class="lead">The My Electric app is a simple home energy monitoring app for exploring home or building electricity consumption over time.</p>
                <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
            </div>
        </div>
        <div class="span5 app-config pt-3"></div>
    </div>
</section>



<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
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
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$..)"},
    
    "public":{"type":"checkbox", "name": "Public", "default": 0, "optional":true, "description":"Make app public"}
};

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
    use_start = feed.getvalue(feeds["use_kwh"].id, start_time);

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    energystacks_draw();

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
    energystacks_draw();
});

$('.bargraph-week').click(function () {
    var timeWindow = (3600000*24.0*7);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "week";
    energystacks_draw();
});

$('.bargraph-month').click(function () {
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    period_text = "month";
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
    powergraph_series.push({data:data["use_standard"], yaxis:1, color:"#44b3e2", lines:{show:true, fill:0.8, lineWidth:0}});
    powergraph_series.push({data:data["use_economy7"], yaxis:1, color:"#1d8dbc", lines:{show:true, fill:0.8, lineWidth:0}});
    
    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    
    var time_elapsed = (data["use"][data["use"].length-1][0] - data["use"][0][0])*0.001;
        
    $("#window-kwh").html((kwh_offpeak+kwh_onpeak).toFixed(1));
    $("#window-offpeak").html(kwh_offpeak.toFixed(1));
    $("#window-peak").html(kwh_onpeak.toFixed(1));
    
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
        stack: true,
        data: data["economy7"], color: "#1d8dbc",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    bargraph_series.push({
        stack: true,
        data: data["standard"], color: "#44b3e2",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    if (viewcostenergy=="energy") {
        if (typeof daytime_total_kwh === 'undefined') daytime_total_kwh = 0;
        if (typeof nighttime_total_kwh === 'undefined') nighttime_total_kwh = 0;

        $("#daytime_total_kwh").html(daytime_total_kwh.toFixed(1)+" kWh");
        $("#daytime_average_kwhd").html((daytime_total_kwh/n).toFixed(1)+" kWh/d");
        
        $("#nighttime_total_kwh").html(nighttime_total_kwh.toFixed(1)+" kWh");
        $("#nighttime_average_kwhd").html((nighttime_total_kwh/n).toFixed(1)+" kWh/d");
    } else {
        $("#daytime_total_kwh").html(config.app.currency.value+(daytime_total_kwh*config.app.unitcost_day.value).toFixed(2));
        $("#daytime_average_kwhd").html(config.app.currency.value+(daytime_total_kwh*config.app.unitcost_day.value/n).toFixed(2)+"/day");
        
        $("#nighttime_total_kwh").html(config.app.currency.value+(nighttime_total_kwh*config.app.unitcost_night.value).toFixed(2));
        $("#nighttime_average_kwhd").html(config.app.currency.value+(nighttime_total_kwh*config.app.unitcost_night.value/n).toFixed(2)+"/day");
    }

    if (typeof data["economy7"][data["economy7"].length-1] !== 'undefined') {
        var kwh_today = data["economy7"][data["economy7"].length-1][1] + data["standard"][data["standard"].length-1][1];
    } else {
        var kwh_today = 0;
    }

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
