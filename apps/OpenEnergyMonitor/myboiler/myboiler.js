feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------

$(window).ready(function () {

});

if (!session_write) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "app_name": { "type": "value", "name": "App name", "default": "MY BOILER", "optional": true, "description": "Enter custom name for app" },
    "public": { "type": "checkbox", "name": "Public", "default": 0, "optional": true, "description": "Make app public" },
    "boiler_fuel_kwh": { "type": "feed", "autoname": "boiler_fuel_kwh", "description": "Cumulative fuel use kWh" },    
    "boiler_elec": { "type": "feed", "autoname": "boiler_elec", "optional": true, "description": "Electric use in watts" },
    "boiler_elec_kwh": { "type": "feed", "autoname": "boiler_elec_kwh", "description": "Cumulative electric use kWh" },
    "boiler_heat": { "type": "feed", "autoname": "boiler_heat", "optional": true, "description": "Heat output in watts" },
    "boiler_heat_kwh": { "type": "feed", "autoname": "boiler_heat_kwh", "optional": true, "description": "Cumulative heat output in kWh" },
    "boiler_flowT": { "type": "feed", "autoname": "boiler_flowT", "optional": true, "description": "Flow temperature" },
    "boiler_returnT": { "type": "feed", "autoname": "boiler_returnT", "optional": true, "description": "Return temperature" },
    "boiler_outsideT": { "type": "feed", "autoname": "boiler_outsideT", "optional": true, "description": "Outside temperature" },
    "boiler_roomT": { "type": "feed", "autoname": "boiler_roomT", "optional": true, "description": "Room temperature" },
    "boiler_targetT": { "type": "feed", "autoname": "boiler_targetT", "optional": true, "description": "Target (Room or Flow) Temperature" },
    "boiler_flowrate": { "type": "feed", "autoname": "boiler_flowrate", "optional": true, "description": "Flow rate" },
    "boiler_dhw": { "type": "feed", "autoname": "boiler_dhw", "optional": true, "description": "Status of Hot Water circuit (non-zero when running)" },
    "boiler_ch": { "type": "feed", "autoname": "boiler_ch", "optional": true, "description": "Status of Central Heating circuit (non-zero when running)" },
    "start_date": { "type": "value", "default": 0, "name": "Start date", "description": _("Start date for all time values (unix timestamp)") },
};
config.feeds = feed.list();

config.initapp = function () { init() };
config.showapp = function () { show() };
config.hideapp = function () { clear() };

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
var fuel_enabled = false;
var elec_enabled = false;
var heat_enabled = false;
var feeds = {};
var progtime = 0;
var firstrun = true;
var boiler_elec_start = 0;
var boiler_heat_start = 0;
var start_time = 0;
var end_time = 0;
var show_flow_rate = false;
var show_boiler_fuel_kwh = true;
var exclude_dhw = false;
var kw_at_50 = 0;
var kw_at_50_for_volume = 0;
var show_daily_efficiency_series = true;
var show_negative_heat = false;
var emitter_spec_enable = false;

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// duration contants (milliseonds)
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

config.init();

function init() {
    // Quick translation of feed ids
    feeds = {};
    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];

    }
}

function show() {
    $("#app_name").html(config.app['app_name'].value);

    $("body").css('background-color', 'WhiteSmoke');
    // -------------------------------------------------------------------------------
    // Configurations
    // -------------------------------------------------------------------------------
    if (feeds["boiler_fuel_kwh"] != undefined) fuel_enabled = true;   
    if (feeds["boiler_elec_kwh"] != undefined) elec_enabled = true;
    if (feeds["boiler_heat"] != undefined && feeds["boiler_heat_kwh"] != undefined) heat_enabled = true;
    if (feeds["boiler_flowrate"] != undefined) {
        $("#show_flow_rate_bound").show();
    }

    if (feeds["boiler_dhw"] == undefined) {
        $(".show_stats_category[key='water_heating']").hide();
        $(".show_stats_category[key='space_heating']").hide();
    } else {
        $(".show_stats_category[key='water_heating']").show();
        $(".show_stats_category[key='space_heating']").show();
    }

    // -------------------------------------------------------------------------------

    if (fuel_enabled) {
        meta["boiler_fuel_kwh"] = feed.getmeta(feeds["boiler_fuel_kwh"].id);
        if (meta["boiler_fuel_kwh"].start_time > start_time) start_time = meta["boiler_fuel_kwh"].start_time;
        if (meta["boiler_fuel_kwh"].end_time > end_time) end_time = meta["boiler_fuel_kwh"].end_time;
    }

    if (elec_enabled) {
        meta["boiler_elec_kwh"] = feed.getmeta(feeds["boiler_elec_kwh"].id);
        if (feeds["boiler_elec"] != undefined) meta["boiler_elec"] = feed.getmeta(feeds["boiler_elec"].id);
        if (meta["boiler_elec_kwh"].start_time > start_time) start_time = meta["boiler_elec_kwh"].start_time;
        if (meta["boiler_elec_kwh"].end_time > end_time) end_time = meta["boiler_elec_kwh"].end_time;
    }

    if (heat_enabled) {
        meta["boiler_heat_kwh"] = feed.getmeta(feeds["boiler_heat_kwh"].id);
        meta["boiler_heat"] = feed.getmeta(feeds["boiler_heat"].id);
        if (meta["boiler_heat_kwh"].start_time > start_time) start_time = meta["boiler_heat_kwh"].start_time;
        if (meta["boiler_heat_kwh"].end_time > end_time) end_time = meta["boiler_heat_kwh"].end_time;

        $("#show_negative_heat_bound").show();
    }

    var alltime_start_time = start_time;
    var config_start_date = config.app.start_date.value * 1;
    if (config_start_date > alltime_start_time) {
        alltime_start_time = config_start_date;
        var d = new Date(alltime_start_time * 1000);
        $("#all_time_history_title").html("TOTAL SINCE: " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear());
    } else {
        var d = new Date(start_time * 1000);
        $("#all_time_history_title").html("TOTAL SINCE: " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear());
    }

    // Load elec start here after start_time may have been modified by heat start time
    
    if (fuel_enabled) {
        boiler_fuel_start = feed.getvalue(feeds["boiler_fuel_kwh"].id, alltime_start_time);
    }
    
    if (elec_enabled) {
        boiler_elec_start = feed.getvalue(feeds["boiler_elec_kwh"].id, alltime_start_time);
    }

    if (heat_enabled) {
        boiler_heat_start = feed.getvalue(feeds["boiler_heat_kwh"].id, alltime_start_time);
    }

    resize();

    var date = new Date();
    var now = date.getTime();

    end = end_time * 1000;

    if (now - end > HOUR) {
        $("#last_updated").show();
        $("#live_table").hide();
        date.setTime(end);
        let h = date.getHours();
        let m = date.getMinutes();
        if (h < 10) h = "0" + h;
        if (m < 10) m = "0" + m;
        $("#last_updated").html("Last updated: " + date.toDateString() + " " + h + ":" + m)
    } else {
        $("#last_updated").hide();
        $("#live_table").show();
    }

    if (urlParams.mode != undefined) {
        if (urlParams.mode == "power") {
            viewmode = "powergraph"
            $("#advanced-block").show();
            $("#advanced-toggle").html("HIDE DETAIL");
        }
        if (urlParams.flow) {
            $("#show_flow_rate").click();
            show_flow_rate = true;
        }
    }

    // If this is a new dashboard there will be less than a days data 
    // show power graph directly in this case
    var timeWindow = (end - start_time * 1000);
    if (timeWindow < 3 * DAY || viewmode == "powergraph") {
        if (timeWindow > 3 * DAY) timeWindow = DAY;
        var start = end - timeWindow;

        if (urlParams.start != undefined) start = urlParams.start * 1000;
        if (urlParams.end != undefined) end = urlParams.end * 1000;
        if (urlParams.hours != undefined) start = end - urlParams.hours * HOUR;

        view.start = start;
        view.end = end;
        viewmode = "powergraph";
        $(".bargraph-navigation").hide();
        powergraph_load();
        $(".powergraph-navigation").show();
        $("#advanced-toggle").show();
    } else {
        var timeWindow = 30 * DAY;
        var start = end - timeWindow;
        if (start < (start_time * 1000)) start = start_time * 1000;

        if (urlParams.start != undefined) start = urlParams.start * 1000;
        if (urlParams.end != undefined) end = urlParams.end * 1000;

        bargraph_load(start, end);
        bargraph_draw();
        $("#advanced-toggle").hide();
    }

    // LOOP
    progtime = now;
    updater();
    updaterinst = setInterval(updater, 10000);
    $(".ajax-loader").hide();
}

function clear() {
    clearInterval(updaterinst);
}

function updater() {
    feed.listbyidasync(function (result) {
        if (result === null) { return; }

        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }

        if (feeds["boiler_elec"] != undefined) $("#boiler_elec").html(Math.round(feeds["boiler_elec"].value));
        if (feeds["boiler_heat"] != undefined) $("#boiler_heat").html(Math.round(feeds["boiler_heat"].value));
        if (feeds["boiler_flowT"] != undefined) $("#boiler_flowT").html((1 * feeds["boiler_flowT"].value).toFixed(1));
        if (feeds["boiler_roomT"] != undefined) $("#boiler_roomT").html((1 * feeds["boiler_roomT"].value).toFixed(1));

        // Update all-time values
        var total_fuel = 0;
        var total_elec = 0;
        var total_heat = 0;
        if (fuel_enabled) total_fuel = feeds["boiler_fuel_kwh"].value - boiler_fuel_start;      
        if (elec_enabled) total_elec = feeds["boiler_elec_kwh"].value - boiler_elec_start;
        if (heat_enabled) total_heat = feeds["boiler_heat_kwh"].value - boiler_heat_start;

        var total_efficiency = 0;
        if (total_elec > 0) total_efficiency = total_heat / (total_elec + total_fuel);
        if (total_efficiency < 0) total_efficiency = 0;

        if (total_fuel < 20) {
            total_fuel = total_fuel.toFixed(1);
        } else {
            total_fuel = total_fuel.toFixed(0);
        }

        if (total_elec < 20) {
            total_elec = total_elec.toFixed(1);
        } else {
            total_elec = total_elec.toFixed(0);
        }

        if (total_heat < 20) {
            total_heat = total_heat.toFixed(1);
        } else {
            total_heat = total_heat.toFixed(0);
        }

        $("#total_fuel").html(total_fuel);
        $("#total_elec").html(total_elec);
        $("#total_heat").html(total_heat);
        $("#total_efficiency").html((total_efficiency*100).toFixed(1));

        // Updates every 60 seconds
        var now = new Date().getTime();
        if ((progtime < (now - MINUTE)) || firstrun) {
            firstrun = false;
            
            var elec = 0; var heat = 0;
            if (elec_enabled) elec = get_average("boiler_elec", 1800);
            if (heat_enabled) heat = get_average("boiler_heat", 1800);

            if (feeds["boiler_elec"] == undefined) $("#boiler_elec").html(Math.round(elec * HOUR / (60 * 30)));
            if (feeds["boiler_heat"] == undefined) $("#boiler_heat").html(Math.round(heat * HOUR / (60 * 30)));

            // update power chart if showing up to last 5 minutes, and less than 48 hours
            if (viewmode == "powergraph") {
                var timeWindow = (view.end - view.start);
                if (view.end > progtime - 5 * MINUTE && timeWindow <= 2 * DAY) {
                    if (view.end < now) {
                        // automatically scroll power chart if at the end
                        view.end = now;
                        view.start = view.end - timeWindow;
                    }

                    powergraph_load();
                }
            }
            progtime = now;
        }
    });
}

function get_average(name, duration) {

    if (feeds[name] == undefined) return null;

    var dps = feed.getdata(feeds[name].id, feeds[name].time - duration, feeds[name].time, 60, 1, 0, 0, 0);
    var sum = 0;
    var n = 0;
    for (var z in dps) {
        sum += dps[z][1];
        n++;
    }
    return sum / n;
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
// The buttons for these powergraph events are hidden when in historic mode 
// The events are loaded at the start here and dont need to be unbinded and binded again.
$("#zoomout").click(function () { view.zoomout(); powergraph_load(); });
$("#zoomin").click(function () { view.zoomin(); powergraph_load(); });
$('#right').click(function () { view.panright(); powergraph_load(); });
$('#left').click(function () { view.panleft(); powergraph_load(); });

$('.time').click(function () {
    view.timewindow($(this).attr("time") / 24.0);
    powergraph_load();
});

$(".viewhistory").click(function () {
    $(".powergraph-navigation").hide();
    var timeWindow = 30 * DAY;
    // var end = (new Date()).getTime();
    var end = end_time * 1000;
    var start = end - timeWindow;
    if (start < (start_time * 1000)) start = start_time * 1000;
    viewmode = "bargraph";
    bargraph_load(start, end);
    bargraph_draw();
    $(".bargraph-navigation").show();
    $("#advanced-toggle").hide();
    $("#advanced-block").hide();
});

$("#advanced-toggle").click(function () {
    var state = $(this).html();

    if (state == "SHOW DETAIL") {
        $("#advanced-block").show();
        $("#advanced-toggle").html("HIDE DETAIL");

    } else {
        $("#advanced-block").hide();
        $("#advanced-toggle").html("SHOW DETAIL");
    }
});

$('#placeholder').bind("plothover", function (event, pos, item) {
    if (item) {
        var z = item.dataIndex;

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            if (viewmode == "bargraph") {
                var itemTime = item.datapoint[0];
                var elec_kwh = null;
                var heat_kwh = null;
                var fuel_kwh = null;
                
                if (fuel_enabled && data["boiler_fuel_kwhd"].length && data["boiler_fuel_kwhd"][z] != undefined) fuel_kwh = data["boiler_fuel_kwhd"][z][1];
                if (elec_enabled && data["boiler_elec_kwhd"].length && data["boiler_elec_kwhd"][z] != undefined) elec_kwh = data["boiler_elec_kwhd"][z][1];
                if (heat_enabled && data["boiler_heat_kwhd"].length && data["boiler_heat_kwhd"][z] != undefined) heat_kwh = data["boiler_heat_kwhd"][z][1];

                var outside_temp_str = "";
                if (feeds["boiler_outsideT"] != undefined) {
                    if (data["boiler_outsideT_daily"] != undefined && data["boiler_outsideT_daily"].length && data["boiler_outsideT_daily"][z] != undefined) {
                        let outsideT = data["boiler_outsideT_daily"][z][1];
                        if (outsideT != null) {
                            outside_temp_str = "Outside: " + outsideT.toFixed(1) + "°C<br>";
                        }
                    }
                }

                var COP = null;
                if (heat_kwh !== null && elec_kwh !== null && fuel_kwh !== null) COP = heat_kwh / (fuel_kwh + elec_kwh);

                var d = new Date(itemTime);
                var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                var date = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();

                if (fuel_kwh !== null) fuel_kwh = (fuel_kwh).toFixed(1); else fuel_kwh = "---";
                if (elec_kwh !== null) elec_kwh = (elec_kwh).toFixed(1); else elec_kwh = "---";
                if (heat_kwh !== null) heat_kwh = (heat_kwh).toFixed(1); else heat_kwh = "---";
                if (COP !== null) COP = (COP*100).toFixed(1); else COP = "---";

                tooltip(item.pageX, item.pageY, date + "<br>Fuel: " + fuel_kwh + " kWh<br>Electric: " + elec_kwh + " kWh<br>Heat: " + heat_kwh + " kWh<br>" + outside_temp_str + "Efficiency: " + COP+" %", "#fff", "#000");
            }

            if (viewmode == "powergraph") {
                var itemTime = item.datapoint[0];
                var itemValue = item.datapoint[1];

                var d = new Date(itemTime);
                var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                var date = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();

                var h = d.getHours();
                if (h < 10) h = "0" + h;
                var m = d.getMinutes();
                if (m < 10) m = "0" + m;
                var time = h + ":" + m;

                var name = "";
                var unit = "";
                var dp = 0;

                if (item.series.label == "FlowT") { name = "FlowT"; unit = "°C"; dp = 1; }
                else if (item.series.label == "ReturnT") { name = "ReturnT"; unit = "°C"; dp = 1; }
                else if (item.series.label == "OutsideT") { name = "Outside"; unit = "°C"; dp = 1; }
                else if (item.series.label == "RoomT") { name = "Room"; unit = "°C"; dp = 1; }
                else if (item.series.label == "TargetT") { name = "Target"; unit = "°C"; dp = 1; }
                else if (item.series.label == "DHW") { name = "Hot Water"; unit = ""; dp = 0; }
                else if (item.series.label == "CH") { name = "Central Heating"; unit = ""; dp = 0; }
                else if (item.series.label == "Electric") { name = "Elec"; unit = "W"; }
                else if (item.series.label == "Heat") { name = "Heat"; unit = "W"; }
                else if (item.series.label == "Fuel consumption") { name = "Fuel consumption"; unit = "kWh"; }
                else if (item.series.label == "Flow rate") {
                    name = "Flow rate";
                    unit = " " + feeds["boiler_flowrate"].unit;
                    dp = 3;
                }

                tooltip(item.pageX, item.pageY, name + " " + itemValue.toFixed(dp) + unit + "<br>" + date + ", " + time, "#fff", "#000");
            }
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
$('#placeholder').bind("plotclick", function (event, pos, item) {
    if (item && !panning && viewmode == "bargraph") {
        var z = item.dataIndex;
        view.start = data["boiler_elec_kwhd"][z][0];
        view.end = view.start + DAY;
        $(".bargraph-navigation").hide();
        viewmode = "powergraph";
        powergraph_load();
        $(".powergraph-navigation").show();
        $("#advanced-toggle").show();

        if ($("#advanced-toggle").html() == "SHOW DETAIL") {
            $("#advanced-block").hide();
        } else {
            $("#advanced-block").show();
        }

    }
});

$('#placeholder').bind("plotselected", function (event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true;

    if (viewmode == "bargraph") {
        bargraph_load(start, end);
        bargraph_draw();
    } else {
        view.start = start; view.end = end;
        powergraph_load();
    }
    setTimeout(function () { panning = false; }, 100);
});

$('.bargraph-alltime').click(function () {
    var start = start_time * 1000;
    var end = (new Date()).getTime();
    bargraph_load(start, end);
    bargraph_draw();
});

$('.bargraph-day').click(function () {
    view.timewindow(1.0);
    $(".bargraph-navigation").hide();
    viewmode = "powergraph";
    powergraph_load();
    $(".powergraph-navigation").show();

    $("#advanced-toggle").show();
    if ($("#advanced-toggle").html() == "SHOW DETAIL") {
        $("#advanced-block").hide();
    } else {
        $("#advanced-block").show();
    }
});

$('.bargraph-week').click(function () {
    var timeWindow = 7 * DAY;
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    if (start < (start_time * 1000)) start = start_time * 1000;
    bargraph_load(start, end);
    bargraph_draw();
});

$('.bargraph-month').click(function () {
    var timeWindow = 30 * DAY;
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    if (start < (start_time * 1000)) start = start_time * 1000;
    bargraph_load(start, end);
    bargraph_draw();
});

$('.bargraph-quarter').click(function () {
    var timeWindow = 91 * DAY;
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    if (start < (start_time * 1000)) start = start_time * 1000;
    bargraph_load(start, end);
    bargraph_draw();
});

$('.bargraph-year').click(function () {
    var timeWindow = 365 * DAY;
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    if (start < (start_time * 1000)) start = start_time * 1000;
    bargraph_load(start, end);
    bargraph_draw();
});

$("#stats_when_running").click(function () {
    if ($("#stats_when_running")[0].checked) {
        $("#mean_when_running").show();
        if (feeds["boiler_dhw"] != undefined) {
            $("#stats_without_dhw").show();
        }
    } else {
        $("#mean_when_running").hide();
        $("#stats_without_dhw").hide();
    }

    powergraph_process();
});

$("#exclude_dhw").click(function () {
    powergraph_process();
});

$("#starting_power").change(function () {
    powergraph_process();
});

// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - powergraph_load
// - powergraph_draw
// - bargraph_load
// - bargraph_draw
// - resize


function powergraph_load() {
    var skipmissing = 0;
    var limitinterval = 0;

    view.calc_interval(1200);

    powergraph_series = {};

    // Index order is important here!
    var feeds_to_load = {
        "boiler_fuel_kwh": { label: "Fuel", yaxis: 3, color: 6 },
        "boiler_dhw": { label: "DHW", yaxis: 4, color: "#88F", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "boiler_ch": { label: "CH", yaxis: 4, color: "#FB6", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "boiler_targetT": { label: "TargetT", yaxis: 2, color: "#ccc" },
        "boiler_flowT": { label: "FlowT", yaxis: 2, color: 2 },
        "boiler_returnT": { label: "ReturnT", yaxis: 2, color: 3 },
        "boiler_outsideT": { label: "OutsideT", yaxis: 2, color: 4 },
        "boiler_roomT": { label: "RoomT", yaxis: 2, color: "#000" },
        "boiler_flowrate": { label: "Flow rate", yaxis: 3, color: 6 },
        "boiler_heat": { label: "Heat", yaxis: 1, color: 0, lines: { show: true, fill: 0.2, lineWidth: 0.5 } },
        "boiler_elec": { label: "Electric", yaxis: 1, color: 1, lines: { show: true, fill: 0.3, lineWidth: 0.5 } }
    }

    // Compile list of feedids
    var feedids = [];
    for (var key in feeds_to_load) {
        if (feeds[key] != undefined) feedids.push(feeds[key].id);
    }

    var average = 1;
    if (view.interval < 20) average = 0;

    // Fetch the data
    feed.getdata(feedids, view.start, view.end, view.interval, average, 0, skipmissing, limitinterval, function (all_data) {
        // Transfer from data to all_data by key
        var feed_index = 0;
        for (var key in feeds_to_load) {
            if (feeds[key] != undefined && all_data[feed_index] != undefined) {
                // Data object used for calculations
                data[key] = remove_null_values(all_data[feed_index].data, view.interval);
                feed_index++;

                // Load to powergraph_series (used for drawing the graph)
                let series = feeds_to_load[key];
                series.data = data[key];
                powergraph_series[key] = series;
            }
        }

        if (feeds["boiler_outsideT"] != undefined) {
            $("#fixed_outside_temperature_bound").hide();
        } else {
            $("#fixed_outside_temperature_bound").show();
        }

        powergraph_process();
    }, false, "notime");

}

// Called from powergraph_load and when changing settings
// This function processes the data and loads it into powergraph_series
function powergraph_process() {
    // process_stats: calculates min, max, mean, total, etc
    process_stats();

    // calculates emitter and volume
    emitter_and_volume_calculator();

    // Load powergraph_series into flot
    powergraph_draw();
    
    $("#window-efficiency-bound").show();
}




function process_stats() {
    stats = {};
    stats.combined = {};
    stats.when_running = {};
    stats.space_heating = {};
    stats.water_heating = {};

    var feed_options = {
        "boiler_fuel_kwh": { name: "Fuel consumption", unit: "kWh", dp: 0 },
        "boiler_elec": { name: "Electric consumption", unit: "W", dp: 0 },
        "boiler_heat": { name: "Heat output", unit: "W", dp: 0 },
        "boiler_flowT": { name: "Flow temperature", unit: "°C", dp: 1 },
        "boiler_returnT": { name: "Return temperature", unit: "°C", dp: 1 },
        "boiler_outsideT": { name: "Outside temperature", unit: "°C", dp: 1 },
        "boiler_roomT": { name: "Room temperature", unit: "°C", dp: 1 },
        "boiler_targetT": { name: "Target temperature", unit: "°C", dp: 1 },
        "boiler_flowrate": { name: "Flow rate", unit: "", dp: 3 }
    }

    var keys = [];
    for (var key in feed_options) {
        if (data[key] != undefined) {
            keys.push(key);
        }
    }

    for (var z in keys) {
        let key = keys[z];

        for (var x in stats) {
            stats[x][key] = {};
            stats[x][key].sum = 0;
            stats[x][key].count = 0;
            stats[x][key].mean = null;
            stats[x][key].kwh = null;
            stats[x][key].minval = null;
            stats[x][key].maxval = null;
        }
    }

    var starting_power = parseFloat($("#starting_power").val());

    var dhw_enable = false;
    if (data["boiler_dhw"] != undefined) dhw_enable = true;

    for (var z in data["boiler_elec"]) {
        let power = data["boiler_elec"][z][1];

        let dhw = false;
        if (dhw_enable) dhw = data["boiler_dhw"][z][1];

        // let ch = false;
        // if (data["boiler_ch"]!=undefined) ch = data["boiler_ch"][z][1];

        for (var i in keys) {
            let key = keys[i];
            if (data[key][z] != undefined) {
                let value = data[key][z][1];
                if (value != null) {

                    stats.combined[key].sum += value;
                    stats.combined[key].count++;
                    stats_min_max('combined', key, value);

                    if (power != null && power >= starting_power) {
                        stats.when_running[key].sum += value;
                        stats.when_running[key].count++;
                        stats_min_max('when_running', key, value);

                        if (dhw_enable) {
                            if (dhw) {
                                stats.water_heating[key].sum += value;
                                stats.water_heating[key].count++;
                                stats_min_max('water_heating', key, value);
                            } else {
                                stats.space_heating[key].sum += value;
                                stats.space_heating[key].count++;
                                stats_min_max('space_heating', key, value);
                            }
                        }
                    }
                }
            }
        }
    }

    for (var x in stats) {
        let out = "";

        for (var z in keys) {
            let key = keys[z];

            stats[x][key].mean = null;
            if (stats[x][key].count > 0) {
                stats[x][key].mean = stats[x][key].sum / stats[x][key].count;
            }

            stats[x][key].diff = null;
            if (stats[x][key].minval != null && stats[x][key].maxval != null) {
                stats[x][key].diff = stats[x][key].maxval - stats[x][key].minval;
            }

            if (stats[x][key].mean != null) {
                out += "<tr>";
                out += "<td style='text-align:left;'>" + feed_options[key].name + "</td>";

                var minval_str = "";
                if (stats[x][key].minval != null) minval_str = (1*stats[x][key].minval).toFixed(feed_options[key].dp) + " " + feed_options[key].unit;
                out += "<td style='text-align:center; color:#777'>" + minval_str + "</td>";

                var maxval_str = "";
                if (stats[x][key].maxval != null) maxval_str = (1*stats[x][key].maxval).toFixed(feed_options[key].dp) + " " + feed_options[key].unit;
                out += "<td style='text-align:center; color:#777'>" + maxval_str + "</td>";

                var diff_str = "";
                if (stats[x][key].diff != null) diff_str = (1*stats[x][key].diff).toFixed(feed_options[key].dp) + " " + feed_options[key].unit;
                out += "<td style='text-align:center; color:#777'>" + diff_str + "</td>";

                out += "<td style='text-align:center'>" + (1*stats[x][key].mean).toFixed(feed_options[key].dp) + " " + feed_options[key].unit + "</td>";

                if (feed_options[key].unit == "W") {
                    stats[x][key].kwh = (stats[x][key].mean * stats[x][key].count * view.interval) / 3600000;
                    out += "<td style='text-align:center'>" + (1*stats[x][key].kwh).toFixed(3) + " kWh</td>";
                } else if (feed_options[key].unit == "kWh") {
                    stats[x][key].kwh = stats[x][key].diff;
                    out += "<td style='text-align:center'>" + (1*stats[x][key].kwh).toFixed(3) + " kWh</td>";   
                } else {
                    out += "<td></td>";
                }
                out += "</tr>";
            }
        }

        $(".stats_category[key='" + x + "']").html(out);
    }
    
    // Standby energy
    var standby_kwh = stats['combined']['boiler_elec'].kwh - stats['when_running']['boiler_elec'].kwh;
    $("#standby_kwh").html(standby_kwh.toFixed(3));

    if (stats["combined"]["boiler_heat"].kwh!=null) {
        $(".cop_combined").html(stats["combined"]["boiler_heat"].kwh.toFixed(1));
    } else {
        $(".cop_combined").html("---");
    }
    if (stats["when_running"]["boiler_heat"].kwh!=null) {
        $(".cop_when_running").html(stats["when_running"]["boiler_heat"].kwh.toFixed(1));
    } else {
        $(".cop_when_running").html("---");
    }
    if (stats["water_heating"]["boiler_heat"].kwh!=null) {
        $(".cop_water_heating").html(stats["water_heating"]["boiler_heat"].kwh.toFixed(1));
    } else {
        $(".cop_water_heating").html("---");
    }
    if (stats["space_heating"]["boiler_heat"].kwh!=null) {
        $(".cop_space_heating").html(stats["space_heating"]["boiler_heat"].kwh.toFixed(1));
    } else {
        $(".cop_space_heating").html("---");
    }
    
    let window_efficiency = "---";
    if (stats["combined"]["boiler_fuel_kwh"].diff>0) {
        window_efficiency = 100 * stats["combined"]["boiler_heat"].kwh / stats["combined"]["boiler_fuel_kwh"].diff;
        window_efficiency = window_efficiency.toFixed(1)+"%";
    }
    
    $("#window-efficiency").html(window_efficiency);
    

    return stats;
}

function stats_min_max(category, key, value) {

    if (stats[category][key].minval == null) {
        stats[category][key].minval = value;
    }
    if (value < stats[category][key].minval) {
        stats[category][key].minval = value;
    }
    if (stats[category][key].maxval == null) {
        stats[category][key].maxval = value;
    }
    if (value > stats[category][key].maxval) {
        stats[category][key].maxval = value;
    }
}

$(".show_stats_category").click(function () {
    var key = $(this).attr("key");
    var color = $(this).css("color");
    $(".stats_category").hide();
    $(".stats_category[key='" + key + "'").show();
    $(".show_stats_category").css("border-bottom", "none");
    $(this).css("border-bottom", "1px solid " + color);
});

function emitter_and_volume_calculator() {
    $("#system_volume").html("?");
    $("#kW_at_50").html("?");

    if (!emitter_spec_enable) return false;

    if (stats['combined']["boiler_flowT"] != undefined && stats['combined']["boiler_returnT"] != undefined && stats['combined']["boiler_roomT"] != undefined && stats['combined']['boiler_heat'] != undefined) {

        if (stats['combined']["boiler_flowT"].diff > 0.15 || stats['combined']["boiler_returnT"].diff > 0.15) {
            $("#kW_at_50").html("?");

            if (kw_at_50_for_volume) {
                console.log("System volume calculation:");
                let MWT = (stats['combined']["boiler_flowT"].mean + stats['combined']["boiler_returnT"].mean) * 0.5;
                let MWT_minus_room = MWT - stats['combined']["boiler_roomT"].mean;

                let heat_based_on_emitter_spec = kw_at_50_for_volume * 1000 * Math.pow(MWT_minus_room / 50, 1.3)
                let heat_to_system_volume = stats['combined']["boiler_heat"].mean - heat_based_on_emitter_spec;

                let MWT_start = (stats['combined']["boiler_flowT"].minval + stats['combined']["boiler_returnT"].minval) * 0.5;
                let MWT_end = (stats['combined']["boiler_flowT"].maxval + stats['combined']["boiler_returnT"].maxval) * 0.5;
                let DT = MWT_end - MWT_start;
                if (DT > 0) {

                    let time_elapsed = (view.end - view.start) * 0.001
                    if (time_elapsed > 0) {
                        let DS_second = DT / time_elapsed;
                        let system_volume = heat_to_system_volume / (4200 * DS_second)

                        console.log("- heat output based on recorded emitter spec: " + heat_based_on_emitter_spec.toFixed(0) + "W");
                        console.log("- heat to system volume: " + heat_to_system_volume.toFixed(0) + "W");
                        console.log("- increase in temperature: " + DT.toFixed(1) + "K");
                        console.log("- increase in temperature per second: " + DS_second.toFixed(6) + "K/s");
                        console.log("- system volume: " + system_volume.toFixed(0) + " litres");
                        $("#system_volume").val(system_volume.toFixed(0));
                    }
                }
            }

        } else {
            let MWT = (stats['combined']["boiler_flowT"].mean + stats['combined']["boiler_returnT"].mean) * 0.5;
            let MWT_minus_room = MWT - stats['combined']["boiler_roomT"].mean;
            kw_at_50 = 0.001 * stats['combined']["boiler_heat"].mean / Math.pow(MWT_minus_room / 50, 1.3);

            console.log("Radiator spec calculation:");
            console.log("- mean water temperature: " + MWT.toFixed(1) + "C");
            console.log("- MWT - room: " + MWT_minus_room.toFixed(1) + "K");
            console.log("- heat output: " + stats['combined']["boiler_heat"].mean.toFixed(0) + "W");
            console.log("- kw_at_50: " + kw_at_50.toFixed(1) + " kW");
            $("#kW_at_50").val(kw_at_50.toFixed(1));
        }
    } else {
        $("#kW_at_50").html("?");
    }
}

// -------------------------------------------------------------------------------
// POWER GRAPH
// -------------------------------------------------------------------------------
function powergraph_draw() {
    set_url_view_params("power", view.start, view.end);

    var style = { size: flot_font_size, color: "#666" }
    var options = {
        lines: { fill: false },
        xaxis: {
            mode: "time", timezone: "browser",
            min: view.start, max: view.end,
            font: style,
            reserveSpace: false
        },
        yaxes: [
            { min: 0, font: style, reserveSpace: false },
            { font: style, reserveSpace: false },
            { font: { size: flot_font_size, color: "#44b3e2" }, reserveSpace: false },
            { min: 0, max: 1, show: false, reserveSpace: false }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: { top: 30 }
        },
        selection: { mode: "x" },
        legend: { position: "NW", noColumns: 13 }
    }

    if (show_negative_heat) {
        options.yaxes[0].min = undefined;
    }

    if ($('#placeholder').width()) {
        // Remove keys
        var powergraph_series_without_key = [];
        for (var key in powergraph_series) {
            let show = true;
            if (key == 'boiler_flowrate' && !show_flow_rate) show = false;
            if (key == 'boiler_fuel_kwh' && !show_boiler_fuel_kwh) show = false;
            
            if (show) powergraph_series_without_key.push(powergraph_series[key]);
        }
        $.plot($('#placeholder'), powergraph_series_without_key, options);
    }

    // show symbol when live scrolling is active
    var now = new Date().getTime();
    if (view.end > now - 5 * MINUTE && view.end <= now + 5 * MINUTE && view.end - view.start <= 2 * DAY) {
        $('#right').hide();
        $('#live').show();
    }
    else {
        $('#live').hide();
        $('#right').show();
    }
}

// -------------------------------------------------------------------------------
// BAR GRAPH
// -------------------------------------------------------------------------------
function bargraph_load(start, end) {
    var intervalms = DAY;
    end = Math.ceil(end / intervalms) * intervalms;
    start = Math.floor(start / intervalms) * intervalms;

    bargraph_series = [];

    var fuel_kwh_in_window = 0;
    var elec_kwh_in_window = 0;
    var heat_kwh_in_window = 0;
    
    var days_fuel = 0;
    var days_elec = 0;
    var days_heat = 0;

    if (fuel_enabled) {
        data["boiler_fuel_kwhd"] = feed.getdata(feeds["boiler_fuel_kwh"].id, start, end, "daily", 0, 1)
        bargraph_series.push({
            data: data["boiler_fuel_kwhd"], color: 5,
            bars: { show: true, align: "center", barWidth: 0.75 * DAY, fill: 0.5, lineWidth: 0 }
        });

        for (var z in data["boiler_fuel_kwhd"]) {
            fuel_kwh_in_window += data["boiler_fuel_kwhd"][z][1];
            days_fuel++;
        }
    }

    if (heat_enabled) {
        data["boiler_heat_kwhd"] = feed.getdata(feeds["boiler_heat_kwh"].id, start, end, "daily", 0, 1)
        bargraph_series.push({
            data: data["boiler_heat_kwhd"], color: 0,
            bars: { show: true, align: "center", barWidth: 0.75 * DAY, fill: 1.0, lineWidth: 0 }
        });

        for (var z in data["boiler_heat_kwhd"]) {
            heat_kwh_in_window += data["boiler_heat_kwhd"][z][1];
            days_heat++;
        }
    }

    if (elec_enabled) {
        data["boiler_elec_kwhd"] = feed.getdata(feeds["boiler_elec_kwh"].id, start, end, "daily", 0, 1);
        bargraph_series.push({
            data: data["boiler_elec_kwhd"], color: 1,
            bars: { show: true, align: "center", barWidth: 0.75 * DAY, fill: 1.0, lineWidth: 0 }
        });

        for (var z in data["boiler_elec_kwhd"]) {
            elec_kwh_in_window += data["boiler_elec_kwhd"][z][1];
            days_elec++;
        }

        // add series that shows COP points for each day
        if (heat_enabled && fuel_enabled) {
            if ((end - start) < 120 * DAY) {
                cop_data = [];
                for (var z in data["boiler_elec_kwhd"]) {
                    time = data["boiler_elec_kwhd"][z][0];
                    elec = data["boiler_elec_kwhd"][z][1];
                    heat = data["boiler_heat_kwhd"][z][1];
                    fuel = data["boiler_fuel_kwhd"][z][1];
                    if (elec && heat && fuel) {
                        cop_data[z] = [time, heat / (elec+fuel)];
                    }
                }
                bargraph_series.push({
                    data: cop_data, color: "#44b3e2", yaxis: 3,
                    points: { show: true }
                });
            }
        }
    }

    if (feeds["boiler_outsideT"] != undefined) {

        if ((end - start) < 120 * DAY) {
            data["boiler_outsideT_daily"] = feed.getdata(feeds["boiler_outsideT"].id, start, end, "daily", 1, 0);
            bargraph_series.push({
                data: data["boiler_outsideT_daily"], color: 4, yaxis: 2,
                lines: { show: true, align: "center", fill: false }, points: { show: false }
            });
        }
    }

    var cop_in_window = heat_kwh_in_window / (elec_kwh_in_window + fuel_kwh_in_window);
    if (cop_in_window < 0) cop_in_window = 0;
    $("#window-cop").html((cop_in_window).toFixed(2));

    var tooltip_text = "";
    tooltip_text += "Fuel: " + fuel_kwh_in_window.toFixed(0) + " kWh (" + (fuel_kwh_in_window / days_fuel).toFixed(1) + " kWh/d)\n";    
    tooltip_text += "Electric: " + elec_kwh_in_window.toFixed(0) + " kWh (" + (elec_kwh_in_window / days_elec).toFixed(1) + " kWh/d)\n";
    tooltip_text += "Heat: " + heat_kwh_in_window.toFixed(0) + " kWh (" + (heat_kwh_in_window / days_heat).toFixed(1) + " kWh/d)\n";
    tooltip_text += "Days: " + days_elec;
    $("#window-cop").attr("title", tooltip_text);


    set_url_view_params('daily', start, end);
    
    $("#window-efficiency-bound").hide();
}

function bargraph_draw() {
    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            font: { size: flot_font_size, color: "#666" },
            // labelHeight:-5
            reserveSpace: false
        },
        yaxes: [{
            font: { size: flot_font_size, color: "#666" },
            // labelWidth:-5
            reserveSpace: false,
            min: 0
        }, {
            font: { size: flot_font_size, color: "#9440ed" },
            // labelWidth:-5
            reserveSpace: false,
            // max:40
        }, {
            font: { size: flot_font_size, color: "#44b3e2" },
            reserveSpace: false,
            min: 0
        }],
        selection: { mode: "x" },
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true
        }
    }
    if ($('#placeholder').width()) {
        var plot = $.plot($('#placeholder'), bargraph_series, options);
        $('#placeholder').append("<div id='bargraph-label' style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'></div>");
    }
}

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------

function resize() {
    var window_width = $(this).width();

    flot_font_size = 12;
    if (window_width < 450) flot_font_size = 10;

    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = width * 0.6;
    if (height < 250) height = 250;
    if (height > 480) height = 480;
    if (height > width) height = width;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);

    if (viewmode == "bargraph") {
        bargraph_draw();
    } else {
        powergraph_draw();
    }
}
// on finish sidebar hide/show
$(function () {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})
// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}

// Remove null values from feed data
function remove_null_values(data, interval) {
    var last_valid_pos = 0;
    for (var pos = 0; pos < data.length; pos++) {
        if (data[pos][1] != null) {
            let null_time = (pos - last_valid_pos) * interval;
            if (null_time < 900) {
                for (var x = last_valid_pos + 1; x < pos; x++) {
                    data[x][1] = data[last_valid_pos][1];
                }
            }
            last_valid_pos = pos;
        }
    }
    return data;
}

function set_url_view_params(mode, start, end) {
    const url = new URL(window.location);
    url.searchParams.set('mode', mode);
    url.searchParams.set('start', Math.round(start * 0.001));
    url.searchParams.set('end', Math.round(end * 0.001));
    url.searchParams.delete('hours');

    if (show_flow_rate) url.searchParams.set('flow', 1);
    else url.searchParams.delete('flow');
    
    $('#permalink')[0].href = url.toString();
}

function draw_histogram(histogram) {

    var keys = [];
    for (k in histogram) {
        if (histogram.hasOwnProperty(k)) {
            keys.push(k * 1);
        }
    }
    keys.sort();

    var sorted_histogram = []
    for (var z in keys) {
        sorted_histogram.push([keys[z], histogram[keys[z]]])
    }

    var options = {
        // lines: { fill: true },
        bars: { show: true, align: "center", barWidth: (1 / 200) * 0.8, fill: 1.0, lineWidth: 0 },
        xaxis: {
            // mode: "time", timezone: "browser", 
            min: 0.2, max: 0.8,
            font: { size: flot_font_size, color: "#666" },
            reserveSpace: false
        },
        yaxes: [
            //{ min: 0,font: {size:flot_font_size, color:"#666"},reserveSpace:false},
            { font: { size: flot_font_size, color: "#666" }, reserveSpace: false }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: { top: 30 }
        },
        //selection: { mode: "x" },
        legend: { position: "NW", noColumns: 6 }
    }
    if ($('#histogram').width() > 0) {
        $.plot($('#histogram'), [{ data: sorted_histogram }], options);
    }
}

$('#histogram').bind("plothover", function (event, pos, item) {
    if (item) {
        var z = item.dataIndex;

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();

            var itemTime = item.datapoint[0];
            var itemValue = item.datapoint[1];
            tooltip(item.pageX, item.pageY, item.datapoint[0] + ": " + (item.datapoint[1]).toFixed(3) + " kWh", "#fff", "#000");

        }
    } else $("#tooltip").remove();
});

$("#show_flow_rate").click(function () {
    if ($("#show_flow_rate")[0].checked) {
        show_flow_rate = true;
        if (show_boiler_fuel_kwh) {
            show_boiler_fuel_kwh = false;
            $("#show_boiler_fuel_kwh")[0].checked = false;
        }
    } else {
        show_flow_rate = false;
    }
    powergraph_draw();
});

$("#show_boiler_fuel_kwh").click(function () {
    if ($("#show_boiler_fuel_kwh")[0].checked) {
        show_boiler_fuel_kwh = true;
        if (show_flow_rate) {
            show_flow_rate = false;
            $("#show_flow_rate")[0].checked = false;
        }
    } else {
        show_boiler_fuel_kwh = false;
    }
    powergraph_draw();
});

$("#realtime_cop_div").click(function () {
    if (realtime_cop_div_mode == "30min") {
        realtime_cop_div_mode = "inst";
        $("#realtime_cop_title").html("COP Now");
        $("#realtime_cop_value").html("---");
    } else {
        realtime_cop_div_mode = "30min";
        $("#realtime_cop_title").html("COP 30mins");
        $("#realtime_cop_value").html("---");
        progtime = 0;
    }
    updater();
});

$("#emitter_spec_enable").click(function () {
    if ($("#emitter_spec_enable")[0].checked) {
        emitter_spec_enable = true;
        $("#emitter_spec_options").show();
    } else {
        emitter_spec_enable = false;
        $("#emitter_spec_options").hide();
    }
    powergraph_process();
});

$("#use_for_volume_calc").click(function () {
    kw_at_50_for_volume = kw_at_50;
});

$("#configure_standby").click(function () {
    if ($("#configure_standby")[0].checked) {
        $("#configure_standby_options").show();
    } else {
        $("#configure_standby_options").hide();
    }
});
