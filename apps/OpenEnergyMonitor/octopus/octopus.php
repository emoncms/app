<?php
    global $path, $session;
    $v = 8;
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

.units {
    font-size:75%;
}

.block-bound {
  background-color:rgb(68,179,226);
}

</style>

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-block" style="display:none">

  <div id="octopus-realtime" class="col1"><div class="col1-inner">

    <div class="block-bound">
      <div class="appnav config-open"><i class="icon-wrench icon-white"></i></div>
      <!--<div class="appnav viewcostenergy">VIEW COST</div>-->
      <!--<div class="appnav cost">Cost</div>-->
      <!--<div class="appnav energy">Energy</div>-->
      <div id="app-title" class="block-title">MY ELECTRIC</div>
    </div>

    <div style="background-color:#fff; color:#333; padding:10px;">
      <table style="width:100%">
        <tr>
          <td style="width:40%">
              <div class="electric-title">NOW</div>
              <div class="power-value"><span id="power_now">0</span></div>
          </td>
          <!--
          <td style="text-align:right">
              <div class="electric-title">TODAY</div>
              <div class="power-value"><span id="kwh_today">0</span></div>
          </td>
          -->
        </tr>
      </table>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">

    <div class="block-bound">

      <div class="graph-navigation">
        <span class="appnav" id="fastright" >>></span>
        <span class="appnav" id="fastleft" ><<</span>
        <span class="appnav" id="right" >></span>
        <span class="appnav" id="left" ><</span>
        <!--<span class="appnav" id="zoomout" >-</span>-->
        <!--<span class="appnav" id="zoomin" >+</span>-->
        <span class="appnav time" time='1440'>2M</span>
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

      <div style="padding:10px;">
      <table style="width:100%">
      <tr>
      <td style="width:32%; text-align:center">Energy<div id="window-energy"></div></td>
      <td style="width:32%; text-align:center">Cost<div id="window-cost"></div></td>
      <td style="width:32%; text-align:center">Unit Cost<div id="window-unitcost"></div></td>
      </tr>
      </table>

      </div>

      <div style="clear:both"></div>
    </div>
  </div></div>
</div>    
</div>

<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span9 app-config-description">
                <div class="app-config-description-inner text-dark">
                    <h2 class="app-config-title text-primary"><?php echo _('Octopus Agile'); ?></h2>
                    <p class="lead">Explore Octopus Agile tariff costs over time.</p>
                    <p><strong class="text-black">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                    <p><strong class="text-black">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                    <img src="../Modules/app/images/myelectric_app.png" class="d-none d-sm-inline-block">
                </div>
            </div>
            <div class="span3 app-config pt-3"></div>
        </div>
    </div>
</section>

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
// Display
// ----------------------------------------------------------------------
//$("body").css('background-color','WhiteSmoke');
$(window).ready(function(){
    //$("#footer").css('background-color','#181818');
    //$("#footer").css('color','#999');
});

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "title":{"type":"value", "default":"OCTOPUS AGILE", "name": "Title", "description":"Optional title for app"},
    "use":{"type":"feed", "autoname":"use", "engine":"5"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "engine":5},
    "region":{"type":"select", "name":"Select region:", "default":"D_Merseyside_and_Northern_Wales", "options":["A_Eastern_England","B_East_Midlands","C_London","E_West_Midlands","D_Merseyside_and_Northern_Wales","F_North_Eastern_England","G_North_Western_England","H_Southern_England","J_South_Eastern_England","K_Southern_Wales","L_South_Western_England","M_Yorkshire","N_Southern_Scotland","P_Northern_Scotland"]}
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.getList();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

var regions = {
  "A_Eastern_England":396124,
  "B_East_Midlands":396125,
  "C_London":396126,
  "E_West_Midlands":396127,
  "D_Merseyside_and_Northern_Wales":396105,
  "F_North_Eastern_England":396128,
  "G_North_Western_England":396129,
  "H_Southern_England":396138,
  "J_South_Eastern_England":396139,
  "K_Southern_Wales":396140,
  "L_South_Western_England":396141,
  "M_Yorkshire":396142,
  "N_Southern_Scotland":396143,
  "P_Northern_Scotland":396144
}

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};
var meta = {};
var data = {};
var graph_series = [];
var previousPoint = false;
var viewmode = "graph";
var viewcostenergy = "energy";
var panning = false;
var period_text = "month";
var period_average = 0;
var comparison_heating = false;
var comparison_transport = false;
var flot_font_size = 12;
var updateTimer = false;

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
    
    $("#app-title").html(config.app.title.value);
    
    resize();

    var timeWindow = (3600000*24.0*1);
    view.end = (new Date()).getTime();
    view.start = view.end - timeWindow;
    graph_load();
    graph_draw();

    updater();
    updateTimer = setInterval(updater,5000);
    $(".ajax-loader").hide();
}

function hide() {
    clearInterval(updateTimer);
}

function updater()
{
    feed.getListById(function(result){
        if (result === null) { return; }
        
        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        
        if (viewcostenergy=="energy") {
            if (feeds["use"].value<10000) {
                $("#power_now").html(Math.round(feeds["use"].value)+"<span class='units'>W</span>");
            } else {
                $("#power_now").html((feeds["use"].value*0.001).toFixed(1)+"<span class='units'>kW</span>");
            }
        } else {
            $("#power_now").html(config.app.currency.value+(feeds["use"].value*1*config.app.unitcost.value*0.001).toFixed(3)+"<span class='units'>/hr</span>");
        }
    });
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
// The buttons for these graph events are hidden when in historic mode 
// The events are loaded at the start here and dont need to be unbinded and binded again.
$("#zoomout").click(function () {view.zoomout(); graph_load(); graph_draw(); });
$("#zoomin").click(function () {view.zoomin(); graph_load(); graph_draw(); });
$('#right').click(function () {view.pan_speed = 0.5; view.panright(); graph_load(); graph_draw(); });
$('#left').click(function () {view.pan_speed = 0.5; view.panleft(); graph_load(); graph_draw(); });
$('#fastright').click(function () {view.pan_speed = 1.0; view.panright(); graph_load(); graph_draw(); });
$('#fastleft').click(function () {view.pan_speed = 1.0; view.panleft(); graph_load(); graph_draw(); });


$('.time').click(function () {
    view.timewindow($(this).attr("time")/24.0);
    graph_load(); graph_draw(); 
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
            var itemValue = item.datapoint[1];
            
            var d = new Date(itemTime);
            var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var hours = d.getHours();
            if (hours<10) hours = "0"+hours;
            var minutes = d.getMinutes();
            if (minutes<10) minutes = "0"+minutes;
            var date = hours+":"+minutes+", "+days[d.getDay()]+" "+months[d.getMonth()]+" "+d.getDate();
            
            var text = "";
            if (item.seriesIndex==0) text = date+"<br>"+(itemValue).toFixed(3)+" kWh";
            if (item.seriesIndex==1) text = date+"<br>"+(itemValue*1.05).toFixed(1)+" p/kWh (inc VAT)";
            tooltip(item.pageX, item.pageY, text, "#fff");
        }
    } else $("#tooltip").remove();
});

$('#placeholder').bind("plotselected", function (event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true; 

    view.start = start; view.end = end;
    graph_load();
    graph_draw();
    
    setTimeout(function() { panning = false; }, 100);
});

$(".viewcostenergy").click(function(){
    var view = $(this).html();
    if (view=="VIEW COST") {
        $(this).html("VIEW ENERGY");
        viewcostenergy = "cost";
    } else {
        $(this).html("VIEW COST");
        viewcostenergy = "energy";
    }
    
    //$(".graph-navigation").hide();
    //viewmode = "bargraph";
    //$(".bargraph-navigation").show();
    //show();
});

// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - graph_load
// - graph_draw
// - resize

function graph_load() 
{
    $("#power-graph-footer").show();
    var start = view.start; var end = view.end;
    var interval = 1800;
    var intervalms = interval * 1000;
    start = Math.ceil(start/intervalms)*intervalms;
    end = Math.ceil(end/intervalms)*intervalms;

    var use_tmp = feed.getData(feeds["use_kwh"].id,start,end,interval,0,0);
    
    data = [];
    
    data["agile"] = []
    if (config.app.region!=undefined && regions[config.app.region.value]!=undefined) {
        data["agile"] = feed.getRemoteData(regions[config.app.region.value],start,end,interval);
    }
    
    // remove nan values from the end.
    var use = [];
    for (var z in use_tmp) {
        if (use_tmp[z][1]!=null) {
            use.push(use_tmp[z]);
        }
    }
    
    data["use"] = [];
    
    var total_cost = 0
    var total_kwh = 0

    if (use.length>1) {
        for (var z=1; z<use.length; z++) {
            var time = use[z-1][0];
            var kwh = (use[z][1]-use[z-1][1]);
            if (kwh<0.0) kwh = 0.0;
            var cost = data.agile[z-1][1]*0.01;
            data["use"].push([time,kwh]);
            total_kwh += kwh
            total_cost += kwh*cost
        }
    }
    
    var unit_cost = (total_cost/total_kwh);

    $("#window-energy").html(total_kwh.toFixed(1)+" kWh");
    $("#window-cost").html("£"+total_cost.toFixed(2));
    $("#window-unitcost").html((unit_cost*100*1.05).toFixed(1)+"p/kWh (inc VAT)");
    
    graph_series = [];
    graph_series.push({data:data["use"], yaxis:1, color:"#44b3e2", bars: { show: true, align: "center", barWidth: 0.75*1800*1000, fill: 1.0, lineWidth:0}});
    graph_series.push({data:data["agile"], yaxis:2, color:"#000", lines: { show: true, align: "center", lineWidth:1}});
}

function graph_draw() 
{
    var options = {
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
    $.plot($('#placeholder'),graph_series,options);
}

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------
function resize() {
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var window_height = $(window).height();
    var topblock = $("#octopus-realtime").height();
    
    var width = placeholder_bound.width();
    var height = width*0.6;
    if (height>500) height = 500;
    if (height>width) height = width;
    
    height = window_height - topblock - 200;

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
   
    graph_draw();
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
