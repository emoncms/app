apikeystr = ""; 
if (apikey!="") apikeystr = "&apikey="+apikey;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------

$(window).ready(function(){

});

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "heatpump_elec":{"type":"feed", "autoname":"heatpump_elec", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_elec_kwh":{"type":"feed", "autoname":"heatpump_elec_kwh", "engine":5, "description":"House or building use in watts"},
    "heatpump_heat":{"type":"feed", "autoname":"heatpump_heat", "engine":"5", "optional":true, "description":"House or building use in watts"},
    "heatpump_heat_kwh":{"type":"feed", "autoname":"heatpump_heat_kwh", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_flowT":{"type":"feed", "autoname":"heatpump_flowT", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_returnT":{"type":"feed", "autoname":"heatpump_returnT", "engine":5, "optional":true, "description":"House or building use in watts"},
    "heatpump_outsideT":{"type":"feed", "autoname":"heatpump_outsideT", "engine":5, "optional":true, "description":"Outside temperature"}
};
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var meta = {};
var data = {};
var bargraph_series = [];
var powergraph_series = [];
var previousPoint = false;
var viewmode = "bargraph";
var panning = false;
var flot_font_size = 12;
var updaterinst = false;
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
    $("body").css('background-color','WhiteSmoke');
    // -------------------------------------------------------------------------------
    // Configurations
    // -------------------------------------------------------------------------------
    if (feeds["heatpump_elec_kwh"]!=undefined) elec_enabled = true;
    if (feeds["heatpump_heat"]!=undefined && feeds["heatpump_heat_kwh"]!=undefined) heat_enabled = true;
    // -------------------------------------------------------------------------------

    if (elec_enabled) {
        meta["heatpump_elec_kwh"] = feed.getmeta(feeds["heatpump_elec_kwh"].id);
        if (feeds["heatpump_elec"]!=undefined) meta["heatpump_elec"] = feed.getmeta(feeds["heatpump_elec"].id);
        if (meta["heatpump_elec_kwh"].start_time>start_time) start_time = meta["heatpump_elec_kwh"].start_time;
    }

    if (heat_enabled) {
        meta["heatpump_heat_kwh"] = feed.getmeta(feeds["heatpump_heat_kwh"].id);
        meta["heatpump_heat"] = feed.getmeta(feeds["heatpump_heat"].id);
        if (meta["heatpump_heat_kwh"].start_time>start_time) start_time = meta["heatpump_heat_kwh"].start_time;
        heatpump_heat_start = feed.getvalue(feeds["heatpump_heat_kwh"].id, start_time*1000)[1];
    }
    
    // Load elec start here after start_time may have been modified by heat start time
    if (elec_enabled) {
        heatpump_elec_start = feed.getvalue(feeds["heatpump_elec_kwh"].id, start_time*1000)[1];
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
        if (start<(start_time*1000)) start = start_time * 1000;
        bargraph_load(start,end);
        bargraph_draw();
        $("#advanced-toggle").hide();
    }
    
    // LOOP
    progtime = 0;
    updater();
    updaterinst = setInterval(updater,10000);
    $(".ajax-loader").hide();
}

function clear()
{
    clearInterval(updaterinst);
}

function updater()
{
    feed.listbyidasync(function(result){
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
            if (elec_enabled) elec = feeds["heatpump_elec_kwh"].value - feed.getvalue(feeds["heatpump_elec_kwh"].id, min30*1000)[1];
            if (heat_enabled) heat = feeds["heatpump_heat_kwh"].value - feed.getvalue(feeds["heatpump_heat_kwh"].id, min30*1000)[1];
            
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
    if (start<(start_time*1000)) start = start_time * 1000;
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
                if (elec_enabled && data["heatpump_elec_kwhd"].length) elec_kwh = data["heatpump_elec_kwhd"][z][1];
                if (heat_enabled && data["heatpump_heat_kwhd"].length) heat_kwh = data["heatpump_heat_kwhd"][z][1];
                var COP = heat_kwh / elec_kwh;

                var d = new Date(itemTime);
                var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
                tooltip(item.pageX, item.pageY, date+"<br>Electric: "+(elec_kwh).toFixed(1)+" kWh<br>Heat: "+(heat_kwh).toFixed(1)+" kWh<br>COP: "+(COP).toFixed(2), "#fff");
            }
            
            if (viewmode=="powergraph")
            {
                var itemTime = item.datapoint[0];
                var itemValue = item.datapoint[1];
                
                var d = new Date(itemTime);
                var h = d.getHours();
                if (h<10) h = "0"+h;
                var m = d.getMinutes();
                if (m<10) m = "0"+m;
                var time = h+":"+m;
                
                var name = "";
                var unit = "";
                var dp = 0;
                
                if (item.series.label=="Flow T") { name = "FlowT"; unit = "C"; dp = 1; }
                else if (item.series.label=="Return T") { name = "ReturnT"; unit = "C"; dp = 1; }
                else if (item.series.label=="Outside T") { name = "Outside"; unit = "C"; dp = 1; }
                else if (item.series.label=="Electric Input") { name = "Elec"; unit = "W"; }
                else if (item.series.label=="Heat Output") { name = "Heat"; unit = "W"; }
                
                tooltip(item.pageX, item.pageY, time+": "+name+" "+itemValue.toFixed(dp)+unit, "#fff");
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
    if (start<(start_time*1000)) start = start_time * 1000;
    bargraph_load(start,end);
    bargraph_draw();
});

$('.bargraph-month').click(function () {
    var timeWindow = (3600000*24.0*30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    if (start<(start_time*1000)) start = start_time * 1000;
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
    var npoints = 1200;
    var interval = ((end-start)*0.001) / npoints;
    interval = view.round_interval(interval);
    
    if (elec_enabled && meta["heatpump_elec"]!=undefined) interval = Math.round(interval/meta["heatpump_elec"].interval)*meta["heatpump_elec"].interval
    if (heat_enabled) interval = Math.round(interval/meta["heatpump_heat"].interval)*meta["heatpump_heat"].interval
    
    var intervalms = interval * 1000;
    start = Math.ceil(start/intervalms)*intervalms;
    end = Math.ceil(end/intervalms)*intervalms;
    
    powergraph_series = [];

    if (feeds["heatpump_flowT"]!=undefined) { 
        data["heatpump_flowT"] = feed.getdata(feeds["heatpump_flowT"].id,start,end,interval,1,1);
        powergraph_series.push({label:"Flow T", data:data["heatpump_flowT"], yaxis:2, color:2});
    }
    if (feeds["heatpump_returnT"]!=undefined) {
        data["heatpump_returnT"] = feed.getdata(feeds["heatpump_returnT"].id,start,end,interval,1,1);
        powergraph_series.push({label:"Return T", data:data["heatpump_returnT"], yaxis:2, color:3});
    }
    if (feeds["heatpump_outsideT"]!=undefined) {
        data["heatpump_outsideT"] = feed.getdata(feeds["heatpump_outsideT"].id,start,end,interval,1,1);
        powergraph_series.push({label:"Outside T", data:data["heatpump_outsideT"], yaxis:2, color:4});
    }
    if (feeds["DHW_cylinderT"]!=undefined) {
        data["DHW_cylinderT"] = feed.getdata(feeds["DHW_cylinderT"].id,start,end,interval,1,1);
        powergraph_series.push({label:"DHW Cylinder T", data:data["DHW_cylinderT"], yaxis:2, color:5});
    }

    if (feeds["heatpump_elec"]!=undefined) {
        // Where power feed is available
        if (heat_enabled) {
            if (interval==meta["heatpump_heat"].interval) {
                data["heatpump_heat"] = feed.getdata(feeds["heatpump_heat"].id,start,end,interval,1,1);
            } else {
                data["heatpump_heat"] = feed.getaverage(feeds["heatpump_heat"].id,start,end,interval,1,1);
            }
            powergraph_series.push({label:"Heat Output", data:data["heatpump_heat"], yaxis:1, color:0, lines:{show:true, fill:0.2, lineWidth:0.5}});
        }
        if (elec_enabled && meta["heatpump_elec"]!=undefined) {
            if (interval==meta["heatpump_elec"].interval) {
                data["heatpump_elec"] = feed.getdata(feeds["heatpump_elec"].id,start,end,interval,1,1);
            } else {
                data["heatpump_elec"] = feed.getaverage(feeds["heatpump_elec"].id,start,end,interval,1,1);
            }
            powergraph_series.push({label:"Electric Input", data:data["heatpump_elec"], yaxis:1, color:1, lines:{show:true, fill:0.3, lineWidth:0.5}});
        }
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
            var tmp = feed.getdata(feeds["heatpump_heat_kwh"].id,start,end,interval,0,0);
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
            var tmp = feed.getdata(feeds["heatpump_elec_kwh"].id,start,end,interval,0,0);
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
    if (data["heatpump_outsideT"]!=undefined) feedstats["heatpump_outsideT"] = stats(data["heatpump_outsideT"]);
    
    if (feedstats["heatpump_elec"].mean>0) {
        var elec_mean = 0; var heat_mean = 0;
        if (elec_enabled) elec_mean = feedstats["heatpump_elec"].mean;
        if (heat_enabled) heat_mean = feedstats["heatpump_heat"].mean;
        if (elec_mean>0) $("#window-cop").html((heat_mean / elec_mean).toFixed(2));
    }
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        // out += "<td><div class='ledgend-box'><div class='ledgend-box-in'></div></div></td>";
        out += "<td style='text-align:left'>"+z+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].minval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].maxval.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].diff.toFixed(2)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].mean.toFixed(2)+"</td>";
        var kwhstr = ""; if (z=="heatpump_elec" || z=="heatpump_heat") kwhstr = feedstats[z].kwh.toFixed(3)
        out += "<td style='text-align:center'>"+kwhstr+"</td>";
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
        legend:{position:"NW", noColumns:5}
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
        
        var heat_result = feed.getdataDMY(feeds["heatpump_heat_kwh"].id,start,end,"daily")
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
        
        var elec_result = feed.getdataDMY(feeds["heatpump_elec_kwh"].id,start,end,"daily");
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
    $("#window-cop").html((cop_in_window).toFixed(2));
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
    var window_width = $(this).width();

    flot_font_size = 12;
    if (window_width<450) flot_font_size = 10;

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

    if (viewmode=="bargraph") {
        bargraph_draw();
    } else {
        powergraph_draw();
    }
}
// on finish sidebar hide/show
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})
// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
