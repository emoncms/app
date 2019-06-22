<?php
    global $path, $session;
    $v = 7;
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

.block-bound {
  background-color:rgb(68,179,226);
}

</style>

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-container" style="display:none">

  <div class="col1"><div class="col1-inner">
    <div class="block-bound">
      <div class="appnav app-setup"><i class="icon-wrench icon-white"></i></div>
      <!--<div class="appnav cost">Cost</div>
      <div class="appnav energy">Energy</div>-->
      <div class="block-title">OPENEVSE</div>
    </div>

    <div style="background-color:#fff; color:#333; padding:10px;">
      <table style="width:100%">
        <tr>
          <td style="width:40%">
              <div class="app-title">CHARGE RATE</div>
              <div class="app-title-value"><span id="power_now">0</span>W</div>
          </td>
          <td style="text-align:right">
              <div class="app-title">CHARGE TODAY</div>
              <div class="app-title-value"><span id="kwh_today">0</span> kWh</div>
          </td>
        </tr>
      </table>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">

    <div class="block-bound">
    
      <div class="bargraph-navigation">
        <!--<div class="appnav bargraph-other">OTHER</div>-->
        <div class="appnav bargraph-alltime">ALL TIME</div>
        <div class="appnav bargraph-month">MONTH</div>
        <div class="appnav bargraph-week">WEEK</div>
      </div>
      
      <div class="powergraph-navigation" style="display:none">
        <div class="appnav viewhistory">VIEW HISTORY</div>
        <span class="appnav" id="right" >></span>
        <span class="appnav" id="left" ><</span>
        <span class="appnav" id="zoomout" >-</span>
        <span class="appnav" id="zoomin" >+</span>
        <span class="appnav time" time='720'>M</span>
        <span class="appnav time" time='168'>W</span>
        <span class="appnav time" time='24'>D</span>
      </div>
        
      <div class="block-title">HISTORY</div>
         
    </div>
    
    <div style="background-color:rgba(68,179,226,0.1); padding:10px;">
      <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>
          
    <div id="power-graph-footer" style="background-color:#eee; color:#333; display:none">
      <div id='advanced-toggle' class='appnav' >SHOW DETAIL</div>
 
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
    
</div>    
</div>

<div id="app-setup" class="block">
    <h2 class="app-config-title">OpenEVSE</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        This OpenEVSE app is designed to be used in conjunction with the OpenEVSE electric vehicle charging station.
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
if (!sessionwrite) $(".config-open").hide();

var feed = new Feed(apikey);

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"OpenEVSE_POWER", "engine":"5"},
    "use_kwh":{"type":"feed", "autoname":"OpenEVSE_KWH", "engine":5}
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
var feeds = {};
var meta = {};
var data = {};
var bargraph_series = [];
var powergraph_series = [];
var previousPoint = false;
var viewmode = "bargraph";
var panning = false;
var period_text = "month";
var period_average = 0;
var flot_font_size = 12;
var start_time = 0;
var updateTimer = false;
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
    meta["use_kwh"] = feed.getMeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
    use_start = feed.getValue(feeds["use_kwh"].id, start_time*1000)[1];

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();

    update();
    updateTimer = setInterval(update, 5000);
    $(".ajax-loader").hide();
}

function hide() {
    clearInterval(updateTimer);
}

function update()
{
    feed.getListById(function(result) {
        
        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        
        $("#power_now").html(Math.round(feeds["use"].value));
        // Update all-time values
        var total_elec = feeds["use_kwh"].value - use_start;
        $("#total_elec").html(Math.round(total_elec));
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
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var elec_kwh = data["use_kwhd"][z][1];

            var d = new Date(itemTime);
            var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
            tooltip(item.pageX, item.pageY, date+"<br>"+(elec_kwh).toFixed(1)+" kWh", "#fff");
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
$('#placeholder').bind("plotclick", function (event, pos, item)
{
    if (item && !panning && viewmode=="bargraph") {
        var z = item.dataIndex;
        view.start = data["use_kwhd"][z][0];
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
    var npoints = 800;
    var interval = ((end-start)*0.001) / npoints;
    interval = view.round_interval(interval);
    var intervalms = interval * 1000;
    start = Math.ceil(start/intervalms)*intervalms;
    end = Math.ceil(end/intervalms)*intervalms;

    data["use"] = feed.getData(feeds["use"].id, start, end, interval, 1, 1);
    
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
        out += "<td style='text-align:center'>"+feedstats[z].minval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].maxval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].diff.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].mean.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].stdev.toFixed(2)+"</td>";
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
    
    var elec_result = feed.getDailyData(feeds["use_kwh"].id, start, end);
    
    var elec_data = [];
    
    // remove nan values from the end.
    for (var z in elec_result) {
      if (elec_result[z][1]!=null) elec_data.push(elec_result[z]);
    }
    
    data["use_kwhd"] = [];
    
    if (elec_data.length>0) {
        var lastday = elec_data[elec_data.length-1][0];
        
        var d = new Date();
        d.setHours(0,0,0,0);
        if (lastday==d.getTime()) {
            // last day in kwh data matches start of today from the browser's perspective
            // which means its safe to append today kwh value
            var next = elec_data[elec_data.length-1][0] + (interval*1000);
            elec_data.push([next,feeds["use_kwh"].value]);
        }
 
        var total_kwh = 0; 
        var n = 0;
        // Calculate the daily totals by subtracting each day from the day before
        for (var z=1; z<elec_data.length; z++)
        {
            var time = elec_data[z-1][0];
            var elec_kwh = (elec_data[z][1]-elec_data[z-1][1]);
            data["use_kwhd"].push([time,elec_kwh]);
            total_kwh += elec_kwh;
            n++;
        }
        period_average = total_kwh / n;
    }

    bargraph_series = [];
    
    bargraph_series.push({
        data: data["use_kwhd"], color: "#44b3e2",
        bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
    });
    
    var kwh_today = data["use_kwhd"][data["use_kwhd"].length-1][1];
    $("#kwh_today").html(kwh_today.toFixed(1));
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
    if (height>580) height = 580;

    if (height>width) height = width;
    
    console.log(width+" "+height);

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
    
    if (width<=500) {
        $(".app-title").css("font-size","16px");
        $(".app-title-value").css("font-size","38px");
        //$(".midtext").css("font-size","14px");
        //$(".units").hide();
        //$(".visnav").css("padding-left","5px");
        // $(".visnav").css("padding-right","5px");
    } else if (width<=724) {
        $(".app-title").css("font-size","18px");
        $(".app-title-value").css("font-size","52px");
        /*$(".midtext").css("font-size","18px");
        $(".units").show();
        $(".visnav").css("padding-left","8px");
        $(".visnav").css("padding-right","8px");*/
    } else {
        $(".app-title").css("font-size","22px");
        $(".app-title-value").css("font-size","52px");
        /*$(".midtext").css("font-size","20px");
        $(".units").show();
        $(".visnav").css("padding-left","8px");
        $(".visnav").css("padding-right","8px");*/
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
function appLog(level, message) {
    if (level == "ERROR") {
        alert(level + ": " + message);
    }
    console.log(level + ": " + message);
}

</script>
