feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------

$(window).ready(function(){

});

if (!session_write) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "app_name":{"type":"value", "name": "App name", "default": "MY HEATPUMP", "optional":true, "description":"Enter custom name for app"},
    "public":{"type":"checkbox", "name": "Public", "default": 0, "optional":true, "description":"Make app public"},
    "heatpump_elec":{"type":"feed", "autoname":"heatpump_elec", "engine":5, "optional":true, "description":"Electric use in watts"},
    "heatpump_elec_kwh":{"type":"feed", "autoname":"heatpump_elec_kwh", "engine":5, "description":"Cumulative electric use kWh"},
    "heatpump_heat":{"type":"feed", "autoname":"heatpump_heat", "engine":"5", "optional":true, "description":"Heat output in watts"},
    "heatpump_heat_kwh":{"type":"feed", "autoname":"heatpump_heat_kwh", "engine":5, "optional":true, "description":"Cumulative heat output in kWh"},
    "heatpump_flowT":{"type":"feed", "autoname":"heatpump_flowT", "engine":5, "optional":true, "description":"Flow temperature"},
    "heatpump_returnT":{"type":"feed", "autoname":"heatpump_returnT", "engine":5, "optional":true, "description":"Return temperature"},
    "heatpump_outsideT":{"type":"feed", "autoname":"heatpump_outsideT", "engine":5, "optional":true, "description":"Outside temperature"},
    "heatpump_roomT":{"type":"feed", "autoname":"heatpump_roomT", "engine":5, "optional":true, "description":"Room temperature"}
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
var end_time = 0;
 
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
    $("#app_name").html(config.app['app_name'].value);

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
        if (meta["heatpump_elec_kwh"].end_time>end_time) end_time = meta["heatpump_elec_kwh"].end_time;
    }

    if (heat_enabled) {
        meta["heatpump_heat_kwh"] = feed.getmeta(feeds["heatpump_heat_kwh"].id);
        meta["heatpump_heat"] = feed.getmeta(feeds["heatpump_heat"].id);
        if (meta["heatpump_heat_kwh"].start_time>start_time) start_time = meta["heatpump_heat_kwh"].start_time;
        if (meta["heatpump_heat_kwh"].end_time>end_time) end_time = meta["heatpump_heat_kwh"].end_time;
        heatpump_heat_start = feed.getvalue(feeds["heatpump_heat_kwh"].id, start_time);
    }
    
    // Load elec start here after start_time may have been modified by heat start time
    if (elec_enabled) {
        heatpump_elec_start = feed.getvalue(feeds["heatpump_elec_kwh"].id, start_time);
    }
    
    resize();
    
    var date = new Date();

    var now = date.getTime();
    
    end = end_time*1000;
    
    date.setTime(end);
    
    if ((now-end)>3600*1000) {
        $("#last_updated").show();
        $("#live_table").hide();
        let h = date.getHours();
        if (h<10) h = "0"+h;
        let m = date.getMinutes();
        if (m<10) m = "0"+m;
        $("#last_updated").html("Last updated: "+date.toDateString()+" "+h+":"+m)
    } else {
        $("#last_updated").hide();
        $("#live_table").show();  
    }
    
    if (urlParams.mode!=undefined) {
        if (urlParams.mode=="realtime") viewmode = "powergraph"
    }
    

    // If this is a new dashboard there will be less than a days data 
    // show power graph directly in this case
    if (((end*0.001)-start_time)<86400*3 || viewmode=="powergraph") {
        var timeWindow = (end - start_time*1000);
        if (timeWindow>(86400*3*1000)) timeWindow = 86400*1*1000;
        var start = end - timeWindow;
        
        if (urlParams.start!=undefined) start = urlParams.start*1000;
        if (urlParams.end!=undefined) end = urlParams.end*1000;
        
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
        
        if (urlParams.start!=undefined) start = urlParams.start*1000;
        if (urlParams.end!=undefined) end = urlParams.end*1000; 
        
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
            if (elec_enabled) elec = feeds["heatpump_elec_kwh"].value - feed.getvalue(feeds["heatpump_elec_kwh"].id, min30);
            if (heat_enabled) heat = feeds["heatpump_heat_kwh"].value - feed.getvalue(feeds["heatpump_heat_kwh"].id, min30);
            
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
    // var end = (new Date()).getTime();
    var end = end_time*1000;
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
                var elec_kwh = null; 
                var heat_kwh = null;
                if (elec_enabled && data["heatpump_elec_kwhd"].length && data["heatpump_elec_kwhd"][z]!=undefined) elec_kwh = data["heatpump_elec_kwhd"][z][1];
                if (heat_enabled && data["heatpump_heat_kwhd"].length && data["heatpump_heat_kwhd"][z]!=undefined) heat_kwh = data["heatpump_heat_kwhd"][z][1];
                var COP = null; 
                if (heat_kwh!==null && elec_kwh!==null) COP = heat_kwh / elec_kwh;

                var d = new Date(itemTime);
                var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
                
                if (elec_kwh!==null) elec_kwh = (elec_kwh).toFixed(1); else elec_kwh = "---";
                if (heat_kwh!==null) heat_kwh = (heat_kwh).toFixed(1); else heat_kwh = "---";
                if (COP!==null) COP = (COP).toFixed(1); else COP = "---";
                                
                tooltip(item.pageX, item.pageY, date+"<br>Electric: "+elec_kwh+" kWh<br>Heat: "+heat_kwh+" kWh<br>COP: "+COP, "#fff", "#000");
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
                
                if (item.series.label=="FlowT") { name = "FlowT"; unit = "C"; dp = 1; }
                else if (item.series.label=="ReturnT") { name = "ReturnT"; unit = "C"; dp = 1; }
                else if (item.series.label=="OutsideT") { name = "Outside"; unit = "C"; dp = 1; }
                else if (item.series.label=="RoomT") { name = "Room"; unit = "C"; dp = 1; }
                else if (item.series.label=="Electric") { name = "Elec"; unit = "W"; }
                else if (item.series.label=="Heat") { name = "Heat"; unit = "W"; }
                else if (item.series.label=="Carnot Heat") { name = "Carnot Heat"; unit = "W"; }
                
                tooltip(item.pageX, item.pageY, time+": "+name+" "+itemValue.toFixed(dp)+unit, "#fff", "#000");
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

$("#carnot_enable").click(function(){
    powergraph_load();
    powergraph_draw();
});

$("#condensing_offset").change(function(){
    powergraph_load();
    powergraph_draw();
});

$("#evaporator_offset").change(function(){
    powergraph_load();
    powergraph_draw();
});

$("#heatpump_factor").change(function(){
    powergraph_load();
    powergraph_draw();
});

$("#starting_power").change(function(){
    powergraph_load();
    powergraph_draw();
});

$("#fixed_outside_temperature").change(function(){
    powergraph_load();
    powergraph_draw();
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
    var simulate_heat_output = $("#carnot_enable")[0].checked;
    
    var skipmissing = 1;
    var limitinterval = 1;
    
    if (simulate_heat_output) {
        skipmissing = 0;
        limitinterval = 0;
    }
    
    //if (elec_enabled && meta["heatpump_elec"]!=undefined) interval = Math.round(interval/meta["heatpump_elec"].interval)*meta["heatpump_elec"].interval
    //if (heat_enabled) interval = Math.round(interval/meta["heatpump_heat"].interval)*meta["heatpump_heat"].interval
    view.calc_interval(1200);
      
    powergraph_series = [];

    if (feeds["heatpump_flowT"]!=undefined) { 
        data["heatpump_flowT"] = feed.getdata(feeds["heatpump_flowT"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
        
        if (simulate_heat_output) {
            powergraph_series.push({label:"FlowT", data:remove_null_values(data["heatpump_flowT"]), yaxis:2, color:2});
        } else {
            powergraph_series.push({label:"FlowT", data:data["heatpump_flowT"], yaxis:2, color:2});
        }
    }
    if (feeds["heatpump_returnT"]!=undefined) {
        data["heatpump_returnT"] = feed.getdata(feeds["heatpump_returnT"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
        
        if (simulate_heat_output) { 
            powergraph_series.push({label:"ReturnT", data:remove_null_values(data["heatpump_returnT"]), yaxis:2, color:3});
        } else {
            powergraph_series.push({label:"ReturnT", data:data["heatpump_returnT"], yaxis:2, color:3});
        }
    }
    if (feeds["heatpump_outsideT"]!=undefined) {
        data["heatpump_outsideT"] = feed.getdata(feeds["heatpump_outsideT"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
        
        if (simulate_heat_output) { 
            powergraph_series.push({label:"OutsideT", data:remove_null_values(data["heatpump_outsideT"]), yaxis:2, color:4});
        } else {
            powergraph_series.push({label:"OutsideT", data:data["heatpump_outsideT"], yaxis:2, color:4});
        }
    }
    if (feeds["heatpump_roomT"]!=undefined) {
        data["heatpump_roomT"] = feed.getdata(feeds["heatpump_roomT"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
        
        if (simulate_heat_output) { 
            powergraph_series.push({label:"RoomT", data:remove_null_values(data["heatpump_roomT"]), yaxis:2, color:"#000"});
        } else {
            powergraph_series.push({label:"RoomT", data:data["heatpump_roomT"], yaxis:2, color:"#000"});
        }
    }
    if (feeds["DHW_cylinderT"]!=undefined) {
        data["DHW_cylinderT"] = feed.getdata(feeds["DHW_cylinderT"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
        powergraph_series.push({label:"DHW", data:data["DHW_cylinderT"], yaxis:2, color:5});
    }

    if (feeds["heatpump_elec"]!=undefined) {
        // Where power feed is available
        if (heat_enabled) {
            if (view.interval==meta["heatpump_heat"].interval) {
                data["heatpump_heat"] = feed.getdata(feeds["heatpump_heat"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
            } else {
                data["heatpump_heat"] = feed.getdata(feeds["heatpump_heat"].id,view.start,view.end,view.interval,1,0,skipmissing,limitinterval);
            }
            
            if (simulate_heat_output) { 
                powergraph_series.push({label:"Heat", data:remove_null_values(data["heatpump_heat"]), yaxis:1, color:0, lines:{show:true, fill:0.2, lineWidth:0.5}});
            } else {
                powergraph_series.push({label:"Heat", data:data["heatpump_heat"], yaxis:1, color:0, lines:{show:true, fill:0.2, lineWidth:0.5}});
            }
        }
        if (elec_enabled && meta["heatpump_elec"]!=undefined) {
            if (view.interval==meta["heatpump_elec"].interval) {
                data["heatpump_elec"] = feed.getdata(feeds["heatpump_elec"].id,view.start,view.end,view.interval,0,0,skipmissing,limitinterval);
            } else {
                data["heatpump_elec"] = feed.getdata(feeds["heatpump_elec"].id,view.start,view.end,view.interval,1,0,skipmissing,limitinterval);
            }
            powergraph_series.push({label:"Electric", data:data["heatpump_elec"], yaxis:1, color:1, lines:{show:true, fill:0.3, lineWidth:0.5}});
        }
    } else {
        // Where no power feed available
        // need a check here to limit interval to no lower than 120s     
        view.calc_interval(50,120);
        
        if (heat_enabled) {
            var tmp = feed.getdata(feeds["heatpump_heat_kwh"].id,view.start,view.end,view.interval);
            data["heatpump_heat"] = [];
            for (var z=1; z<tmp.length; z++) {
                var time = tmp[z-1][0];
                var diff = tmp[z][1] - tmp[z-1][1];
                var power = (diff * 3600000) / view.interval;
                if (power<0) power = 0;
                data["heatpump_heat"].push([time,power]);
            }
            powergraph_series.push({label:"Heat", data:data["heatpump_heat"], yaxis:1, color:0, bars:{show:true, barWidth: view.interval * 1000 * 0.8, fill:0.2}});
        }
        
        if (elec_enabled) {
            var tmp = feed.getdata(feeds["heatpump_elec_kwh"].id,view.start,view.end,view.interval);
            data["heatpump_elec"] = [];
            for (var z=1; z<tmp.length; z++) {
                var time = tmp[z-1][0];
                var diff = tmp[z][1] - tmp[z-1][1];  // diff in kWh
                var power = (diff * 3600000) / view.interval;
                if (power<0) power = 0;
                data["heatpump_elec"].push([time,power]);
            }
            powergraph_series.push({label:"Electric", data:data["heatpump_elec"], yaxis:1, color:1, bars:{show:true, barWidth: view.interval * 1000 * 0.8, fill:0.3}});
        }
    }
    
    
    if (simulate_heat_output) {
        if (data["heatpump_elec"]!=undefined && data["heatpump_flowT"]!=undefined) {
            data["heatpump_heat_carnot"] = [];
            
            var condensing_offset = parseFloat($("#condensing_offset").val());
            var evaporator_offset = parseFloat($("#evaporator_offset").val());
            var heatpump_factor = parseFloat($("#heatpump_factor").val());
            var starting_power = parseFloat($("#starting_power").val());
            var fixed_outside_temperature = parseFloat($("#fixed_outside_temperature").val());
            
            var heatpump_outsideT_available = false;
            if (data["heatpump_outsideT"]!=undefined) heatpump_outsideT_available = true;
                        
            // Carnot COP simulator
            var carnot_heat_sum = 0;
            var carnot_heat_n = 0;
            var carnot_heat_kwh = 0;
            
            var flowT = 0;
            var returnT = 0;
            var ambientT = 0;
            var power = 0;
            
            for (var z in data["heatpump_elec"]) {
                let time = data["heatpump_elec"][z][0];
                if (data["heatpump_elec"][z][1]!=null) power = data["heatpump_elec"][z][1];
                if (data["heatpump_flowT"][z][1]!=null) flowT = data["heatpump_flowT"][z][1];
                if (data["heatpump_returnT"][z][1]!=null) returnT = data["heatpump_returnT"][z][1];
                ambientT = fixed_outside_temperature;
                
                if (heatpump_outsideT_available && data["heatpump_outsideT"][z][1]!=null) {
                    ambientT = data["heatpump_outsideT"][z][1];
                }
                
                let COP = heatpump_factor * ((flowT+condensing_offset+273) / ((flowT+condensing_offset+273) - (ambientT+evaporator_offset+273)));
                let carnot_heat = null;
                
                if (power!=null) {
                    carnot_heat = power * COP;

                    if (power<starting_power) carnot_heat = 0;
                    
                    if (returnT>flowT) carnot_heat *= -1;
                    
                    carnot_heat_sum += carnot_heat;
                    carnot_heat_n++;
                    
                    carnot_heat_kwh += carnot_heat * view.interval / 3600000;
                }
            
                data["heatpump_heat_carnot"][z] = [time,carnot_heat]
            }
            var carnot_heat_mean = carnot_heat_sum / carnot_heat_n;
            powergraph_series.push({label:"Carnot Heat", data:data["heatpump_heat_carnot"], yaxis:1, color:0, lines:{show:true, fill:0.2, lineWidth:0.5}});
        } else {
            simulate_heat_output = false;
        }
    }

    var starting_power = parseFloat($("#starting_power").val());
    var standby_kwh = 0;
    if (data["heatpump_elec"]!=undefined) {
        for (var z in data["heatpump_elec"]) {
            if (data["heatpump_elec"][z][1]!=null) power = data["heatpump_elec"][z][1];
            if (power<starting_power) {
                standby_kwh += power * view.interval / 3600000;
            }
        }
    }
    $("#standby_kwh").html(standby_kwh.toFixed(3));
        
    var feedstats = {};
    if (elec_enabled) feedstats["heatpump_elec"] = stats(data["heatpump_elec"]);
    if (heat_enabled) feedstats["heatpump_heat"] = stats(data["heatpump_heat"]);
    feedstats["heatpump_flowT"] = stats(data["heatpump_flowT"]);
    feedstats["heatpump_returnT"] = stats(data["heatpump_returnT"]);
    if (data["heatpump_outsideT"]!=undefined) feedstats["heatpump_outsideT"] = stats(data["heatpump_outsideT"]);
    if (data["heatpump_roomT"]!=undefined) feedstats["heatpump_roomT"] = stats(data["heatpump_roomT"]);
    
    if (feedstats["heatpump_elec"].mean>0) {
        var elec_mean = 0; var heat_mean = 0;
        if (elec_enabled) elec_mean = feedstats["heatpump_elec"].mean;
        if (heat_enabled) heat_mean = feedstats["heatpump_heat"].mean;
        if (elec_mean>0) {
            $("#window-cop").html((heat_mean / elec_mean).toFixed(2));
            if (feedstats["heatpump_heat"]!=undefined) {
                $("#standby_cop").html((feedstats["heatpump_heat"].kwh / (feedstats["heatpump_elec"].kwh-standby_kwh)).toFixed(2));
            } else {
                $("#standby_cop").html("");
            }
            if (simulate_heat_output) {
                $("#window-carnot-cop").html("(Simulated: <b>"+(carnot_heat_mean / elec_mean).toFixed(2)+"</b>)");
                $("#standby_cop_simulated").html(" (Simulated: "+(carnot_heat_kwh / (feedstats["heatpump_elec"].kwh-standby_kwh)).toFixed(2)+")");
           } else {
                $("#window-carnot-cop").html("");
            }
        }
    }
    
    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
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
    set_url_view_params("realtime",view.start,view.end);
    
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
        legend:{position:"NW", noColumns:6}
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
        data["heatpump_heat_kwhd"] = feed.getdata(feeds["heatpump_heat_kwh"].id,start,end,"daily",0,1)
        bargraph_series.push({
            data: data["heatpump_heat_kwhd"], color: 0,
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
        });
        
        for (var z in data["heatpump_heat_kwhd"]) {
            heat_kwh_in_window += data["heatpump_heat_kwhd"][z][1];
        }
    }
    
    if (elec_enabled) {
        data["heatpump_elec_kwhd"] = feed.getdata(feeds["heatpump_elec_kwh"].id,start,end,"daily",0,1);
        bargraph_series.push({
            data: data["heatpump_elec_kwhd"], color: 1,
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
        });

        for (var z in data["heatpump_elec_kwhd"]) {
            elec_kwh_in_window += data["heatpump_elec_kwhd"][z][1];
        }
    }
    
    var cop_in_window =  heat_kwh_in_window/elec_kwh_in_window;
    if (cop_in_window<0) cop_in_window = 0;
    $("#window-cop").html((cop_in_window).toFixed(2));
    $("#window-carnot-cop").html("");
    
    set_url_view_params('daily',start,end);
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

// Remove null values from feed data
function remove_null_values(data_in) {
    var tmp = []
    for (var z in data_in) {
        if (data_in[z][1]!=null) {
            tmp.push(data_in[z]);
        }
    }
    return tmp;
}

function set_url_view_params(mode,start,end) {
    const url = new URL(window.location);
    url.searchParams.set('mode', mode); 
    url.searchParams.set('start', Math.round(start*0.001));
    url.searchParams.set('end', Math.round(end*0.001));
    window.history.pushState(null, '', url.toString());
}
