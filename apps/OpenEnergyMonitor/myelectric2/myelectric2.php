<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>

<div class="app-page" data-bs-theme="dark">
  <section id="app-block" style="display:none">

    <div id="myelectric-realtime" class="app-panel">
      <nav class="app-top-bar">
        <ul class="btn-list app-tabs">
          <li><button class="app-btn active"><i class="svg-icon-show_chart"></i><span id="app-title">MY ELECTRIC</span></button></li>
        </ul>
        <ul class="btn-list">
          <li><button class="app-btn viewcostenergy">VIEW COST</button></li>
          <li><button class="app-btn config-open" title="Configure app"><i class="svg-icon-wrench"></i></button></li>
        </ul>
      </nav>

      <div class="stats-grid stats-grid-2">
        <div>
          <h5 class="power-title">NOW</h5>
          <h2 class="power-value text-use" id="power_now">---</h2>
        </div>
        <div>
          <h5 class="power-title">TODAY</h5>
          <h2 class="power-value text-use" id="kwh_today">---</h2>
        </div>
      </div>
    </div>

    <div class="app-panel">
      <div class="visnavblock bargraph-navigation mb-2">
        <button class="visnav app-btn bargraph-week">WEEK</button>
        <button class="visnav app-btn bargraph-month active">MONTH</button>
        <button class="visnav app-btn bargraph-alltime">ALL TIME</button>
      </div>

      <div class="visnavblock powergraph-navigation mb-2" style="display:none">
        <button class="visnav app-btn time" time='24' title="Day">D</button>
        <button class="visnav app-btn time" time='168' title="Week">W</button>
        <button class="visnav app-btn time" time='720' title="Month">M</button>
        <button class="visnav app-btn" id="zoomin" title="Zoom in">+</button>
        <button class="visnav app-btn" id="zoomout" title="Zoom out">-</button>
        <button class="visnav app-btn" id="left" title="Scroll left">&lt;</button>
        <button class="visnav app-btn" id="right" title="Scroll right">&gt;</button>
        <button class="app-btn viewhistory ms-auto" title="Back to daily summary">Daily</button>
      </div>

      <div id="placeholder_bound" style="width:100%; height:500px">
        <div id="placeholder" style="height:500px"></div>
      </div>

      <div id="power-graph-footer" style="display:none">
        <div class="d-flex flex-wrap align-items-center gap-3 px-2">
          <div class="me-auto text-body-secondary">kWh in window: <b class="text-body">
            <span id="window-kwh"></span> <span id="window-cost"></span></b></div>
          <button id="advanced-toggle" class="app-btn">SHOW DETAIL</button>
        </div>
      </div>

      <div id="advanced-block" style="display:none">
        <table class="app-table">
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

    <div id="energystack-comparison" class="app-panel" style="display:none">
      <div class="app-top-bar px-2"><b>COMPARISON</b></div>
      <div class="text-center p-2">
        <div id="comparison_summary" class="mb-3"></div>
        <canvas id="energystack" width="270" height="360"></canvas>
        <div class="text-start mt-3">
          <p>The ZeroCarbonBritain target is based on a household using all low energy appliances and LED lighting.</p>
          <b>My Electric includes:</b><br>
          <label class="ctrl-checkbox"><input id="heating" type="checkbox"> Heatpump or electric heating</label><br>
          <label class="ctrl-checkbox"><input id="transport" type="checkbox"> Electric Vehicle</label>
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
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "title":{"type":"value", "default":"MY ELECTRIC", "name": "Title", "description":"Optional title for app"},
    "use":{"type":"feed", "autoname":"use"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh"},
    "unitcost":{"type":"value", "default":0.1508, "name": "Unit cost", "description":"Unit cost of electricity £/kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$..)"},
    "showcomparison":{"type":"checkbox", "default":false, "name": "Show comparison", "description":"Energy stack comparison"}
};
config.app_name = "My Electric v2";
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
var use_start_day = 0;

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
    $("#app-title").html(config.app.title.value);
    if (config.app.showcomparison.value) {
        $("#energystack-comparison").show();
    } else {
        $("#energystack-comparison").hide();
    }
    
    meta["use"] = feed.getmeta(feeds["use"].id);
    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
 
    var now = new Date();   
    var time = new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();   
    use_start_day = feed.getvalue(feeds["use_kwh"].id, time*0.001);

    resize();

    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    // Limit end time to feed end time
    if (end>meta['use'].end_time) end = meta['use'].end_time*1000;
    if (end*0.001>meta['use_kwh'].end_time) {
        end = meta['use_kwh'].end_time*1000;
    }

    var start = end - timeWindow;
    bargraph_load(start,end);
    bargraph_draw();
    set_period_active(".bargraph-month");
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
        if (result === null) { return; }
        
        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }
        
        // Show live power value
        if (viewcostenergy=="energy") {
            if (feeds["use"].value<10000) {
                $("#power_now").html(Math.round(feeds["use"].value)+"<span class='power-unit'>W</span>");
            } else {
                $("#power_now").html((feeds["use"].value*0.001).toFixed(1)+"<span class='power-unit'>kW</span>");
            }
        } else {
            $("#power_now").html(config.app.currency.value+(feeds["use"].value*1*config.app.unitcost.value*0.001).toFixed(3)+"<span class='power-unit'>/hr</span>");
        }
      
        // Show live energy value      
        var kwh_today = feeds["use_kwh"].value - use_start_day;
        
        if (kwh_today!==null) {
            if (viewcostenergy=="energy") {
                $("#kwh_today").html(kwh_today.toFixed(1)+"<span class='power-unit'>kWh</span>");
            } else {
                $("#kwh_today").html(config.app.currency.value+(kwh_today*config.app.unitcost.value).toFixed(2));
	          }
	      } else {
	          $("#kwh_today").html("---");
	      }
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
    set_period_active(".bargraph-month");
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

document.getElementById('placeholder').addEventListener("plothover", function (event) {
    var pos = event.detail[0], item = event.detail[1];
    if (item) {
        var z = item.dataIndex;
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];

            var elec_kwh, unit;
            if (data.use_kwhd[z]) {
                unit = "kWh";
                elec_kwh = data.use_kwhd[z][1];
            } else {
                unit = "W";
                elec_kwh = data.use[z][1];
            }

            var d = new Date(itemTime);
            var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
            
            var text = "";
            if (viewcostenergy=="energy") {
                text = date+"<br>"+(elec_kwh).toFixed(1)+" " + unit;
            } else {
                text = date+"<br>"+(elec_kwh).toFixed(1)+" " + unit;
                if (unit=="kWh") text += " ("+config.app.currency.value+(elec_kwh*config.app.unitcost.value).toFixed(2)+")";
            }
            
            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
document.getElementById('placeholder').addEventListener("plotclick", function (event)
{
    var pos = event.detail[0], item = event.detail[1];
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

document.getElementById('placeholder').addEventListener("plotselected", function (event) {
    var ranges = event.detail[0];
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

// Mark the chosen period
function set_period_active(selector) {
    $(".bargraph-navigation .app-btn").removeClass("active");
    $(selector).addClass("active");
}
$(".bargraph-navigation .app-btn").click(function () { set_period_active(this); });

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
    if (view=="VIEW COST") {
        $(this).html("VIEW ENERGY").addClass("active");
        viewcostenergy = "cost";
    } else {
        $(this).html("VIEW COST").removeClass("active");
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
    
    view.calc_interval(800); // npoints = 800
    data["use"] = feed.getdata(feeds["use"].id,view.start,view.end,view.interval,0,0,1,1);
    
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

    if (viewcostenergy=="energy") {
        $("#window-kwh").html(kwh_in_window.toFixed(1)+ "kWh");
        $("#window-cost").html("");
    } else {
        $("#window-kwh").html(kwh_in_window.toFixed(1)+ "kWh");
        $("#window-cost").html("("+config.app.currency.value+(kwh_in_window*config.app.unitcost.value).toFixed(2)+")");
    }
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        out += "<td>"+z+"</td>";
        out += "<td class='text-center'>"+feedstats[z].minval.toFixed(2)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].maxval.toFixed(2)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].diff.toFixed(2)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].mean.toFixed(2)+"</td>";
        out += "<td class='text-center'>"+feedstats[z].stdev.toFixed(2)+"</td>";
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
            font: {size:flot_font_size, color:"#666", fill:"#666"},
            reserveSpace:false
        },
        yaxes: [
            { min: 0, autoScale: "none", font: {size:flot_font_size, color:"#666", fill:"#666"},reserveSpace:false},
            {font: {size:flot_font_size, color:"#666", fill:"#666"},reserveSpace:false}
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
        legend:{position:"nw", noColumns:4}
    }
    Flot.plot(document.getElementById('placeholder'),powergraph_series,options);
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
    
    data["use_kwhd"] = feed.getdata(feeds["use_kwh"].id,start,end,"daily",0,1,0,0)
    
    var days = data["use_kwhd"].length;
    
    if (days) {
        var total_kwh = 0; 
        var n = 0;
        for (var z=0; z<days; z++) {
            total_kwh += data["use_kwhd"][z][1];
            n++;
        }
        period_average = total_kwh / n;
    }
    
    bargraph_series = [];
    
    bargraph_series.push({
        data: data["use_kwhd"], color: "#44b3e2",
        bars: { show: true, align: "center", barWidth: [0.75*3600*24*1000, true], fill: 1.0, lineWidth:0}
    });
}

function bargraph_draw() 
{
    var options = {
        xaxis: { 
            mode: "time", 
            timezone: "browser", 
            timeBase: "milliseconds",
            font: {size:flot_font_size, color:"#666", fill:"#666"}, 
            // labelHeight:-5
            reserveSpace:false
        },
        yaxis: { 
            font: {size:flot_font_size, color:"#666", fill:"#666"}, 
            // labelWidth:-5
            reserveSpace:false,
            min:0,
            autoScale: "none"
        },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        grid: {
            show:true, 
            color:"#aaa",
            borderWidth:0,
            hoverable: true, 
            clickable: true
        }
    }

    var plot = Flot.plot(document.getElementById('placeholder'),bargraph_series,options);
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

    var window_height = $(window).height();
    var topblock = $("#myelectric-realtime").height();
    
    
    

    var width = placeholder_bound.width();
    var height = width*0.6;
    if (height>500) height = 500;
    if (height>width) height = width;
    
    if (!config.app.showcomparison.value) height = window_height - topblock - 200;
    
    if (height<180) height = 180;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
}

resize();
// on finish sidebar hide/show
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
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
