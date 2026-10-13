// My Solar PV Battery
// Power graph from solar, use and battery power feeds, or from the kWh feeds for windows over 7 days.
// Daily bar graph from the kWh feeds.

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    // Power feeds
    "use":{"type":"feed", "autoname":"use", "description":"Building consumption in watts (not including battery charging)"},
    "solar":{"type":"feed", "autoname":"solar", "description":"Solar pv generation in watts"},
    "battery_charge":{"type":"feed", "autoname":"battery_charge", "description":"Battery charge power in watts"},
    "battery_discharge":{"type":"feed", "autoname":"battery_discharge", "description":"Battery discharge power in watts"},
    "battery_soc":{"optional":true, "type":"feed", "autoname":"battery_soc", "description":"Battery state of charge %"},

    // kWh feeds
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "description":"Building consumption in kWh (not including battery charging)"},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "description":"Cumulative solar generation in kWh"},
    "solar_direct_kwh":{"optional":true, "type":"feed", "autoname":"solar_direct_kwh", "description":"Cumulative solar generation used directly in kWh"},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "description":"Cumulative grid import in kWh"},
    "battery_charge_kwh":{"optional":true, "type":"feed", "autoname":"battery_charge_kwh", "description":"Battery charge energy in kWh"},
    "battery_discharge_kwh":{"optional":true, "type":"feed", "autoname":"battery_discharge_kwh", "description":"Battery discharge energy in kWh"},

    // Options
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description": "Display power as kW"},
    "battery_capacity_kwh":{"type":"value", "default":0, "name":"Battery Capacity", "description":"Battery capacity in kWh"},
    "is_dc_battery":{"type":"checkbox", "name": "DC Battery", "default": 0, "optional":true, "description":"Is the Battery on the DC side?"},
    "live_size":{"type":"select", "default":"Small", "options":["Small", "Large"], "name":"Live value size", "description":"Text size of the live values at the top of the app"}
};

config.app_name = "My Solar PV Battery";
config.app_name_color = "#dccc1f";

config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// State
// ----------------------------------------------------------------------
var HOUR_MS = 3600000;
var DAY_MS = 24*HOUR_MS;
var GAP_MS = 600000;                // power data held for up to 10 min, then a gap
var MIN_POWER = 10;                 // solar and battery power below this in W shown as 0

// Power series, and energy totals with a kWh feed of the same name + "_kwh"
var POWER_KEYS = ["solar", "use", "battery_charge", "battery_discharge"];
var SERIES_KEYS = POWER_KEYS.concat("battery_soc");
var ENERGY_KEYS = ["solar", "use", "solar_direct", "import", "battery_charge", "battery_discharge"];

// Theme energy colours, from Lib/vis.helper.js. Export and discharge have no token.
var COLORS = {
    solar: energy_color("solar"),
    solar_export: "#b7aa1f",        // darker solar, as mysolarpv
    use: energy_color("use"),
    house: energy_color("use-light"),
    charge: energy_color("battery"),
    discharge: "#fbb450",
    soc: "#888"
};

var live_timer = false;
var lastupdate = 0;
var viewmode = "powergraph";        // or "bargraph"

// Power graph
var data_mode = "power";            // or "kwh" for windows over 7 days when the kWh feeds are set
var loaded_mode = false;
var reload = true;
var autoupdate = true;
var live_timerange = 0;
var power_graph_end_time = 0;
var kwh_window = {};
var powerseries = [];

// Bar graph: one entry per day, {time} and ENERGY_KEYS in kWh
var daily = [];
var history_soc = [];               // first and last SOC of the window
var bargraph_initialized = false;
var bargraph_all = false;
var latest_start_time = 0;
var panning = false;

// Window of the mode not shown
var power_start = 0, power_end = 0;
var history_start = 0, history_end = 0;

config.init();

// ----------------------------------------------------------------------
// App lifecycle
// ----------------------------------------------------------------------
function init()
{
    var window_ms = 6*HOUR_MS;
    view.end = +new Date;

    ["use", "solar"].forEach(function (key) {
        if (config.app[key].value) {
            power_graph_end_time = Math.max(power_graph_end_time, feed.getmeta(config.app[key].value).end_time);
        }
    });

    // Feed more than 1 hour behind: start the view at the end of the feed
    if ((view.end*0.001 - power_graph_end_time) > 3600) {
        view.end = power_graph_end_time*1000;
        autoupdate = false;
    }
    view.start = view.end - window_ms;
    live_timerange = window_ms;

    if (has_kwh_feeds()) init_bargraph();

    $("#zoomout").click(function () {view.zoomout(); nav_update(false);});
    $("#zoomin").click(function () {view.zoomin(); nav_update(false);});
    $('#right').click(function () {view.panright(); nav_update(false);});
    $('#left').click(function () {view.panleft(); nav_update(false);});

    $('#time-select').change(function () {
        if ($(this).val() == "all") {
            bargraph_all = true;
            load_bargraph(latest_start_time*1000, +new Date);
            draw();
            return;
        }
        var hours = parseFloat($(this).val());
        if (!hours) return;
        view.timewindow(hours/24.0);
        nav_update(true);
    });

    // Start and End fields, and the Now button, from Lib/vis.helper.js
    timebar_manual(function () { nav_update(false); });
    timebar_now(function () { nav_update(true); });

    $(".viewhistory, .viewpower").click(function () {
        var bargraph = $(this).is(".viewhistory");
        if (bargraph === (viewmode == "bargraph")) return;
        if (bargraph) {
            power_start = view.start;
            power_end = view.end;
            view.start = history_start;
            view.end = history_end;
        } else {
            view.start = power_start;
            view.end = power_end;
            reload = true;
        }
        set_viewmode(bargraph ? "bargraph" : "powergraph");
        draw();
    });

    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize);
}

function show()
{
    $(".app-live").toggleClass("is-large", config.app.live_size.value == "Large");

    if (has_kwh_feeds()) {
        if (!bargraph_initialized) init_bargraph();
        $(".viewmode-toggle").show();
    } else {
        $(".viewmode-toggle").hide();
    }

    resize();
    livefn();
    live_timer = setInterval(livefn, 5000);
}

// Chart from its top to the bottom of the viewport, with room for the legend and the flow card
function resize()
{
    if (!$('#app-block').is(":visible")) return;
    var bound = $('#placeholder_bound');
    var bottom_margin = $('#chart-legend').outerHeight(true) + $('.app-flow').closest('.app-card').outerHeight(true) + 40;
    var offset_top = bound.offset().top - $(window).scrollTop();
    var height = Math.max(200, $(window).height() - offset_top - bottom_margin);

    $('#placeholder').width(bound.width()).height(height);
    bound.height(height);
    draw();
}

function hide()
{
    clearInterval(live_timer);
}

// All kWh feeds set
function has_kwh_feeds() {
    return ENERGY_KEYS.every(function (key) { return !!config.app[key+"_kwh"].value; });
}

// ----------------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------------

// Window changed by the time bar. Live applies to the power graph only.
function nav_update(live) {
    bargraph_all = false;
    if (viewmode == "bargraph") {
        load_bargraph(view.start, view.end);
    } else {
        reload = true;
        autoupdate = live && (view.end - view.start) < 25*HOUR_MS;
        if (autoupdate) live_timerange = view.end - view.start;
    }
    draw();
}

// Mode buttons and the controls of each mode
function set_viewmode(mode) {
    viewmode = mode;
    var bargraph = viewmode == "bargraph";
    $(".viewhistory").toggleClass("active", bargraph);
    $(".viewpower").toggleClass("active", !bargraph);
}

// ----------------------------------------------------------------------
// Live values
// ----------------------------------------------------------------------
function livefn()
{
    // Updater not run in the last 60s: app was sleeping, reload the data
    var now = +new Date();
    if ((now - lastupdate) > 60000) reload = true;
    lastupdate = now;

    var feeds = feed.listbyid();
    if (feeds === null) return;
    var live = {};
    POWER_KEYS.forEach(function (key) { live[key] = parseInt(feeds[config.app[key].value].value); });
    var soc_feed = feeds[config.app.battery_soc.value];
    var soc = soc_feed ? parseInt(soc_feed.value) : null;
    var updatetime = feeds[config.app.solar.value].time;
    live_status_update(updatetime);

    if (autoupdate && viewmode == "powergraph") {
        power_graph_end_time = updatetime;
        POWER_KEYS.forEach(function (key) { append_live(key, updatetime, live[key]); });
        if (soc !== null) append_live("battery_soc", updatetime, soc);

        // Advance view
        view.end = now;
        view.start = view.end - live_timerange;
    }

    var solar = live.solar < MIN_POWER ? 0 : live.solar;
    var charge = live.battery_charge < MIN_POWER ? 0 : live.battery_charge;
    var discharge = live.battery_discharge < MIN_POWER ? 0 : live.battery_discharge;
    var use = live.use;

    var balance = solar - use;
    if (!config.app.is_dc_battery.value) balance += discharge - charge;
    $(".balance-label").text(tr(balance > 0 ? "EXPORTING" : balance < 0 ? "IMPORTING" : "BALANCED"));
    $(".balance").parent().toggleClass("text-export", balance > 0).toggleClass("text-import", balance < 0);

    var net_charge = charge - discharge;
    $(".battery_charge_discharge_title").text(tr(net_charge > 0 ? "CHARGING" : net_charge < 0 ? "DISCHARGING" : "POWER"));
    $(".discharge_time_left").text(time_left(-net_charge, soc));

    $('.power-unit').text(config.app.kw.value === true ? 'kW' : 'W');
    $(".usenow").text(format_power(use));
    $(".generationnow").text(format_power(solar));
    $(".balance").text(format_power(Math.abs(balance)));
    $(".battery_charge_discharge").text(format_power(Math.abs(net_charge)));
    $(".battery_soc").text(soc !== null ? soc : "--");

    if (viewmode == "powergraph" && autoupdate) draw();
}

// Latest value added to a loaded power series, data before the window removed
function append_live(key, time, value) {
    if (!datastore[key]) return;
    timeseries.append(key, time, value);
    timeseries.trim_start(key, view.start*0.001);
}

// W rounded, or kW with the Show kW option
function format_power(watts) {
    return config.app.kw.value === true ? as_kw(watts) : Math.round(watts);
}

// Time to empty at the discharge rate in W, from the SOC and battery capacity
function time_left(discharge, soc) {
    var capacity_kwh = config.app.battery_capacity_kwh.value;
    if (discharge <= 0 || soc === null || !(capacity_kwh > 0)) return "--";
    var mins = 60 * (capacity_kwh * 1000 * soc / 100) / discharge;
    return Math.floor(mins / 60) + "h " + Math.floor(mins % 60) + "m";
}

function draw()
{
    if (viewmode == "powergraph") draw_powergraph();
    if (viewmode == "bargraph") draw_bargraph();
}

// ----------------------------------------------------------------------
// Power graph
// ----------------------------------------------------------------------
function draw_powergraph() {
    view.calc_interval(1500);

    // kWh data over 7 days: flows from cumulative kWh stay exact at any interval
    data_mode = ((view.end - view.start) > 7*DAY_MS && has_kwh_feeds()) ? "kwh" : "power";
    if (data_mode == "kwh") {
        // Interval in whole 15 minutes, window aligned to it
        view.interval = Math.ceil(Math.max(view.interval, 900) / 900) * 900;
        var interval_ms = view.interval*1000;
        view.start = Math.floor(view.start / interval_ms) * interval_ms;
        view.end = Math.ceil(view.end / interval_ms) * interval_ms;
    }
    $(".viewpower").attr("title", data_mode == "kwh" ? "Chart from energy data" : "Chart from power data");

    if (reload || loaded_mode != data_mode) {
        reload = false;
        loaded_mode = data_mode;
        load_powergraph();
    }

    var flows = data_mode == "kwh" ? kwh_flows() : power_flows();
    show_totals(flows.totals);
    show_soc_change(flows.battery_soc);

    var area = function (key, label, color, stack, fill) {
        return { data: flows[key], label: label, color: color, stack: stack, lines: { lineWidth: 0, fill: fill } };
    };
    var series = [area("solar", "Solar", COLORS.solar, 1, 1.0)];
    if (config.app.is_dc_battery.value) {
        series.push(
            area("battery_charge", "Charge", COLORS.charge, 2, 0.8),
            area("battery_discharge", "Discharge", COLORS.discharge, 2, 0.8),
            area("use", "House", COLORS.house, 3, 0.8));
    } else {
        series.push(
            area("use", "House", COLORS.house, 2, 0.8),
            area("battery_charge", "Charge", COLORS.charge, 2, 0.8),
            area("battery_discharge", "Discharge", COLORS.discharge, 1, 0.8));
    }
    if (config.app.battery_soc.value) series.push({ data: flows.battery_soc, label: "SOC", yaxis: 2, color: COLORS.soc });

    var options = {
        series: { lines: { fill: false, lineWidth: 2 } },
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none", min: view.start, max: view.end },
        // SOC on the right, in %
        yaxes: [{ min: 0, autoScale: "none" }, { min: 0, max: 100, autoScale: "none", position: "right", labelWidth: 40, tickFormatter: function (v) { return v + "%"; } }],
        grid: { hoverable: true, clickable: true },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };

    powerseries = series;
    // Bind before plotting: Flot fires plothover from the last mouse position while drawing
    powergraph_events();
    Flot.plot(document.getElementById('placeholder'), series, options);
    chart_legend(series);
    timebar_update(false);
    timebar_hide("option[value=all]", true);
    $(".ajax-loader").hide();
}

function load_powergraph() {
    var soc = config.app.battery_soc.value ? [{ key: "battery_soc", id: config.app.battery_soc.value, average: true }] : [];
    if (data_mode == "kwh") {
        kwh_window = getdata_multi(ENERGY_KEYS.map(kwh_feed).concat(soc), view.start, view.end, view.interval);
    } else {
        var power = POWER_KEYS.map(function (key) { return { key: key, id: config.app[key].value, average: true }; });
        var data = getdata_multi(power.concat(soc), view.start, view.end, view.interval);
        for (var key in data) timeseries.load(key, data[key]);
    }
}

// kWh feed request for an energy key, as kWh per interval
function kwh_feed(key) {
    return { key: key, id: config.app[key+"_kwh"].value, delta: true };
}

// Data for several feeds in one request, as {key: data}, [] for a feed that failed.
// Averaged feeds are requested last: the server keeps the average of the feed before
// for a feed with average 0.
function getdata_multi(feeds, start, end, interval) {
    feeds = feeds.filter(function (f) { return !f.average; }).concat(feeds.filter(function (f) { return f.average; }));
    var result = feed.getdata(
        feeds.map(function (f) { return f.id; }), start, end, interval,
        feeds.map(function (f) { return f.average ? 1 : 0; }).join(","),
        feeds.map(function (f) { return f.delta ? 1 : 0; }).join(","));

    var data = {};
    feeds.forEach(function (f, i) {
        data[f.key] = (result && result[i] && Array.isArray(result[i].data)) ? result[i].data : [];
    });
    return data;
}

// Empty series and zero totals. Battery export is AC battery discharge above the house demand left after solar.
function new_flows() {
    var flows = { totals: { battery_export: 0 } };
    SERIES_KEYS.forEach(function (key) { flows[key] = []; });
    ENERGY_KEYS.forEach(function (key) { flows.totals[key] = 0; });
    return flows;
}

// Point in W for each series, null for a gap
function push_point(flows, time, watts) {
    SERIES_KEYS.forEach(function (key) { flows[key].push([time, watts ? watts[key] : null]); });
}

// Flows from power data. A missing value holds the last value for up to GAP_MS.
function power_flows() {
    var flows = new_flows();
    if (!datastore.solar) return flows;
    var t = flows.totals;
    var interval = view.interval;
    var to_kwh = interval / 3600000;
    var dc = config.app.is_dc_battery.value;
    var start = timeseries.start_time("solar");
    var n = timeseries.length("solar");
    var value = {}, last = {};
    SERIES_KEYS.forEach(function (key) { value[key] = null; last[key] = -Infinity; });

    for (var z=0; z<n; z++) {
        var time = start + (1000 * interval * z);
        SERIES_KEYS.forEach(function (key) {
            var v = timeseries.value(key, z);
            if (typeof v == "number") {
                value[key] = v;
                last[key] = time;
            }
        });
        if (POWER_KEYS.some(function (key) { return (time - last[key]) >= GAP_MS; })) {
            push_point(flows, time, null);
            continue;
        }

        var solar = value.solar < MIN_POWER ? 0 : value.solar;
        var use = value.use;
        var charge = value.battery_charge;
        var discharge = value.battery_discharge;
        var solar_direct = Math.min(solar, use);
        var balance = dc ? solar - use : solar - use - charge + discharge;

        t.solar += solar * to_kwh;
        t.use += use * to_kwh;
        t.solar_direct += solar_direct * to_kwh;
        t.import += Math.max(0, -balance) * to_kwh;
        t.battery_charge += charge * to_kwh;
        t.battery_discharge += discharge * to_kwh;
        // 50 W allowance for control lag
        if (!dc) t.battery_export += Math.max(0, discharge - (use - solar_direct) - 50) * to_kwh;

        push_point(flows, time, { solar: solar, use: use, battery_charge: charge, battery_discharge: discharge, battery_soc: value.battery_soc });
    }
    return flows;
}

// Flows from kWh per interval, drawn as average W. A gap in any feed adds nothing.
function kwh_flows() {
    var flows = new_flows();
    var t = flows.totals;
    var hours = view.interval / 3600;
    var dc = config.app.is_dc_battery.value;
    var n = Math.min.apply(null, ENERGY_KEYS.map(function (key) { return kwh_window[key].length; }));

    for (var z=0; z<n; z++) {
        var time = kwh_window.solar[z][0];
        var kwh = {};
        ENERGY_KEYS.forEach(function (key) { kwh[key] = kwh_window[key][z][1]; });
        if (ENERGY_KEYS.some(function (key) { return kwh[key] == null; })) {
            push_point(flows, time, null);
            continue;
        }
        ENERGY_KEYS.forEach(function (key) {
            kwh[key] = Math.max(0, kwh[key]);
            t[key] += kwh[key];
        });
        // 50 W allowance for control lag
        if (!dc) t.battery_export += Math.max(0, kwh.battery_discharge - (kwh.use - kwh.solar_direct) - 0.05*hours);

        var soc = kwh_window.battery_soc && kwh_window.battery_soc[z];
        push_point(flows, time, {
            solar: kwh.solar / hours * 1000,
            use: kwh.use / hours * 1000,
            battery_charge: kwh.battery_charge / hours * 1000,
            battery_discharge: kwh.battery_discharge / hours * 1000,
            battery_soc: soc ? soc[1] : null
        });
    }
    return flows;
}

function powergraph_events() {
    var placeholder = document.getElementById('placeholder');
    plot_unbind('placeholder');

    placeholder.addEventListener("plotselected", plot_handlers.plotselected = function (event) {
        var ranges = event.detail[0];
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;
        reload = true;

        // Selection up to now under 25 hours follows live data
        autoupdate = Math.abs(view.end - (+new Date)) < 30000 && (view.end - view.start) < 25*HOUR_MS;
        if (autoupdate) live_timerange = view.end - view.start;

        draw();
    });

    placeholder.addEventListener("plothover", plot_handlers.plothover = function (event) {
        var pos = event.detail[0], item = event.detail[1];
        if (!item) {
            hide_tooltip();
            return;
        }
        var items = [["TIME", tooltip_time(new Date(item.datapoint[0])), ""]];
        powerseries.forEach(function (series) {
            var point = series.data[item.dataIndex];
            if (point == undefined || point[1] == null) return;
            var name = series.label.toUpperCase();
            var value = point[1];
            if (series.yaxis == 2) items.push([name, value.toFixed(1), "%"]);
            else if (value >= 1000) items.push([name, value.toFixed(0)/1000, "kW"]);
            else items.push([name, value.toFixed(0), "W"]);
        });
        show_tooltip(pos.pageX+10, pos.pageY+5, items);
    });
}

// ----------------------------------------------------------------------
// Bar graph
// ----------------------------------------------------------------------

// Start times of the kWh feeds and the first window
function init_bargraph() {
    bargraph_initialized = true;
    var starts = ENERGY_KEYS.map(function (key) { return feed.getmeta(config.app[key+"_kwh"].value).start_time; });
    latest_start_time = Math.max.apply(null, starts);      // start of All
    view.first_data = Math.min.apply(null, starts) * 1000;

    var end = +new Date;
    load_bargraph(end - 30*DAY_MS, end);
}

// Daily kWh for the window. Days with a missing value are left out.
function load_bargraph(start, end) {
    // Whole days, rounded so panning keeps the window length
    end = Math.round(end / DAY_MS) * DAY_MS;
    start = Math.round(start / DAY_MS) * DAY_MS;
    if (end <= start) end = start + DAY_MS;
    history_start = start;
    history_end = end;
    if (viewmode == "bargraph") {
        view.start = start;
        view.end = end;
    }

    var data = getdata_multi(ENERGY_KEYS.map(kwh_feed), start, end, "daily");
    daily = [];
    data.solar.forEach(function (row, z) {
        var day = { time: row[0] };
        for (var key of ENERGY_KEYS) {
            day[key] = data[key][z] ? data[key][z][1] : null;
            if (day[key] == null) return;
        }
        daily.push(day);
    });

    load_history_soc(start, end);
}

// SOC from the first hour of the window and the last hour up to the latest value
function load_history_soc(start, end) {
    history_soc = [];
    var soc_id = config.app.battery_soc.value;
    if (!soc_id) return;
    var meta = feed.getmeta(soc_id);
    start = Math.max(start, meta.start_time*1000);
    end = Math.min(end, meta.end_time*1000);
    if (end - start < 2*HOUR_MS) return;

    var values = function (from) {
        return (feed.getdata(soc_id, from, from + HOUR_MS, 300, 1) || []).filter(function (point) { return point[1] != null; });
    };
    var first = values(start);
    var last = values(end - HOUR_MS);
    if (first.length && last.length) history_soc = [first[0], last[last.length-1]];
}

function draw_bargraph()
{
    var bar = function (label, color, stack, values) {
        return {
            data: daily.map(function (day) { return [day.time, values(day)]; }),
            label: label,
            color: color,
            stack: stack,
            bars: { show: true, align: "center", barWidth: [0.8*DAY_MS, true], fill: 0.9, lineWidth: 0 }
        };
    };
    var series = [
        bar("Use", COLORS.use, 2, function (day) { return day.use; }),
        bar("Self-consumption", COLORS.solar, 1, function (day) { return day.solar_direct; }),
        bar("Battery discharge", COLORS.discharge, 1, function (day) { return day.battery_discharge; }),
        bar("Solar export", COLORS.solar_export, 0, function (day) { return -derive_flows(day).solar_export; })
    ];

    var options = {
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", minTickSize: [1, "day"] },
        grid: { hoverable: true, clickable: true, markings: [{ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } }] },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };

    bargraph_events();
    Flot.plot(document.getElementById('placeholder'), series, options);
    chart_legend(series);
    timebar_update(true);
    timebar_hide("option[value=all]", false);
    if (bargraph_all) $("#time-select").val("all");

    var totals = { battery_export: 0 };
    ENERGY_KEYS.forEach(function (key) {
        totals[key] = daily.reduce(function (sum, day) { return sum + day[key]; }, 0);
    });
    show_totals(totals);
    show_soc_change(history_soc);

    $('#placeholder').append("<div class='chart-note' style='top:30px'><b>Above:</b> Use, with the share from solar and battery</div>");
    $('#placeholder').append("<div class='chart-note' style='bottom:50px'><b>Below:</b> Solar export</div>");
}

function bargraph_events() {
    var placeholder = document.getElementById('placeholder');
    plot_unbind('placeholder');

    // Day's flows in a tooltip
    placeholder.addEventListener("plothover", plot_handlers.plothover = function (event) {
        var pos = event.detail[0], item = event.detail[1];
        if (!item) {
            hide_tooltip();
            return;
        }
        var day = daily[item.dataIndex];
        var flows = derive_flows(day);
        var row = function (label, kwh, color) { return [label, kwh_text(kwh), "kWh", color]; };
        show_tooltip(pos.pageX+10, pos.pageY+5, [
            [new Date(day.time).toLocaleDateString(undefined, {weekday: "short", day: "numeric", month: "short"}), "", ""],
            row("USE", day.use, COLORS.use),
            row("SOLAR", day.solar),
            row("SOLAR TO HOUSE", day.solar_direct, COLORS.solar),
            row("SOLAR TO BATTERY", flows.solar_to_battery),
            row("SOLAR EXPORT", flows.solar_export, COLORS.solar_export),
            row("BATTERY TO HOUSE", day.battery_discharge, COLORS.discharge),
            row("GRID TO HOUSE", flows.import_direct),
            row("GRID TO BATTERY", flows.import_for_battery)
        ]);
    });

    // Click on a bar opens that day in the power graph
    placeholder.addEventListener("plotclick", plot_handlers.plotclick = function (event) {
        var item = event.detail[1];
        if (!item || panning) return;
        view.start = daily[item.dataIndex].time;
        view.end = view.start + DAY_MS;
        power_start = view.start;
        power_end = view.end;
        reload = true;
        autoupdate = false;
        set_viewmode("powergraph");
        draw();
    });

    placeholder.addEventListener("plotselected", plot_handlers.plotselected = function (event) {
        var ranges = event.detail[0];
        bargraph_all = false;
        load_bargraph(ranges.xaxis.from, ranges.xaxis.to);
        draw();
        // Selection ends with a click, not a bar click
        panning = true;
        setTimeout(function () { panning = false; }, 100);
    });
}

// ----------------------------------------------------------------------
// Totals
// ----------------------------------------------------------------------

// Flows not measured directly, from solar, use, solar used directly, import and battery kWh
function derive_flows(kwh) {
    var import_direct = kwh.use - kwh.battery_discharge - kwh.solar_direct;
    var import_for_battery = kwh.import - import_direct;
    var solar_to_battery = kwh.battery_charge - import_for_battery;
    var solar_export = kwh.solar - kwh.solar_direct - solar_to_battery;
    return {
        import_direct: import_direct,
        import_for_battery: import_for_battery,
        solar_to_battery: solar_to_battery,
        solar_export: solar_export,
        grid_balance: kwh.import - solar_export
    };
}

// Flow block totals and percentages for the window. Battery export is measured from the
// power and kWh interval data, daily totals only show it as negative flows.
function show_totals(t)
{
    var f = derive_flows(t);

    // Blank below the 0.1 kWh shown in the boxes
    var prc = function (kwh, total_kwh) {
        return total_kwh >= 0.05 ? ((kwh / total_kwh) * 100).toFixed(0) + "%" : "";
    };

    $(".total_solar_kwh").text(kwh_text(t.solar));
    $(".total_use_kwh").text(kwh_text(t.use));
    $(".total_solar_direct_kwh").text(kwh_text(t.solar_direct));
    $(".total_solar_export_kwh").text(kwh_text(f.solar_export));
    $(".total_import_direct_kwh").text(kwh_text(f.import_direct));
    $(".total_grid_balance_kwh").text(kwh_text(f.grid_balance));
    $(".total_battery_charge_from_solar_kwh").text(kwh_text(f.solar_to_battery));
    $(".total_import_for_battery_kwh").text(kwh_text(f.import_for_battery));
    $(".total_battery_discharge_kwh").text(kwh_text(t.battery_discharge));

    $(".solar_direct_prc").text(prc(t.solar_direct, t.solar));
    $(".solar_to_battery_prc").text(prc(f.solar_to_battery, t.solar));
    $(".solar_export_prc").text(prc(f.solar_export, t.solar));
    $(".use_from_solar_prc").text(prc(t.solar_direct, t.use));
    $(".use_from_battery_prc").text(prc(t.battery_discharge, t.use));
    $(".use_from_import_prc").text(prc(f.import_direct, t.use));

    $("#battery_import").toggle(f.import_for_battery >= 0.1);

    var negative_flow = Math.min(f.import_direct, f.import_for_battery, f.solar_to_battery, f.solar_export) <= -0.1;
    $("#battery-export-warning").toggle(t.battery_export >= 0.1 || negative_flow);
}

// kWh to 0.1, without -0.0
function kwh_text(kwh) {
    return (Math.round(kwh * 10) / 10 || 0).toFixed(1);
}

// SOC change across the window, from the first and last values
function show_soc_change(soc) {
    var values = soc.map(function (point) { return point[1]; }).filter(function (v) { return v != null; });
    if (values.length < 2) {
        $(".battery_soc_change").text("--");
        return;
    }
    var change = values[values.length-1] - values[0];
    $(".battery_soc_change").text((change > 0 ? "+" : "") + change.toFixed(1));
}
