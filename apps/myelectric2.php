<?php
    global $path, $session, $user;
    // Authentication
    if (isset($session['write']) && $session['write']) $apikey = $user->get_apikey_write($session['userid']);
    else if (isset($_GET['readkey'])) $apikey = $_GET['readkey'];
    else if (isset($_GET['apikey'])) $apikey = $_GET['apikey'];
?>

<link href="<?php echo $path; ?>Modules/app/style.css" rel="stylesheet">
  <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/config.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/feed.js"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/vis.helper.js"></script>

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
}

.block-bound {
  background-color:rgb(68,179,226);
}

#app-block { max-width:1100px }

</style>

<br>
<div style="font-family: Montserrat, Veranda, sans-serif;">

  <div id="app-block" style="display:none">
      
    <div class="block-bound">
      <div class="bluenav cost">Cost</div>
      <div class="bluenav energy">Energy</div>
      <div class="block-title">MY ELECTRIC</div>
    </div>

    <div style="background-color:#fff; color:#333; padding:10px;">
      <table style="width:100%">
        <tr>
          <td style="width:33%">
              <div class="electric-title">POWER NOW</div>
              <div class="power-value"><span id="power_now">0</span>W</div>
          </td>
          <td style="text-align:center; width:33%"></td>
          <td style="text-align:right; width:33%">
              <div class="electric-title">USE TODAY</div>
              <div class="power-value"><span id="kwh_today">0</span> kWh</div>
          </td>
        </tr>
      </table>
    </div>
    <br>

    <div class="block-bound">
    
      <div class="bargraph-navigation">
        <div class="bluenav bargraph-other">OTHER</div>
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
          
    <div style="background-color:#eee; color:#333;">
      <div id='advanced-toggle' class='bluenav' >SHOW DETAIL</div>
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
    <br>
    <!--
    <div class="block-bound">
      <div class="block-title">TIME OF USE</div>
    </div>
    <div style="background-color:rgba(68,179,226,0.1); padding:10px; color:#333">
      <div style="width:400px; text-align:center; float:right; padding-top:100px;">
          <p><b><span id="prclocal">--</span>%</b> Off-peak power<br><span style="font-size:12px">In the last 7 days</span></p>
          <img id="star1" src="<?php echo $path; ?>files/star20.png" style="width:45px">
          <img id="star2" src="<?php echo $path; ?>files/star20.png" style="width:45px">
          <img id="star3" src="<?php echo $path; ?>files/star20.png" style="width:45px">
          <img id="star4" src="<?php echo $path; ?>files/star20.png" style="width:45px">
          <img id="star5" src="<?php echo $path; ?>files/star20.png" style="width:45px">
      </div>
      
      <canvas id="piegraph" width=420 height=400 ></canvas>
    </div>
    <br>
    -->
    <div style="width:48%">
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

  <div id="app-setup" style="display:none; padding-top:50px" class="block">
      <h2 style="color:#0699fa">My Heatpump</h2>
      <div class="row">
        <div class="span9">
          <p class="a2">This is a template app example</p>
        </div>
        <div class="span3"><div class="app-config"></div></div>
      </div>
  </div>
  
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

$(".navbar-inner").css('background-image','none');
$(".navbar-inner").css('background-color','#44b3e2');
$(".navbar-inner").css('border-color','#44b3e2');
$(".nav li a").css('color','#fff');
$(".nav li a").css('text-shadow','none');
$(".caret").css('border-top-color','#fff');
$(".caret").css('border-bottom-color','#fff');

if (!sessionwrite) $(".openconfig").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "engine":"5"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5}
};
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

    data["use"] = feed.getdata(feeds["use"].id,start,end,interval,1,1);
    
    powergraph_series = [];
    powergraph_series.push({data:data["use"], yaxis:1, color:"#44b3e2", lines:{show:true, fill:0.8, lineWidth:0}});
    
    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    
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
    var interval = 3600*24;
    var intervalms = interval * 1000;
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    
    var elec_result = feed.getdataDMY(feeds["use_kwh"].id,start,end,"daily");
    
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
    var height = width*0.5;

    if (height>width) height = width;
    
    console.log(width+" "+height);

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
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
