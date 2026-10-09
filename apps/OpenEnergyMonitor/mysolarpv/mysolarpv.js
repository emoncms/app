// My Solar PV
// Power graph from use and solar power feeds, or from the kWh feeds for windows over 7 days.
// Daily bar graph from the use, solar and import kWh feeds.

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "description":tr("House or building use in watts")},
    "solar":{"type":"feed", "autoname":"solar", "description":tr("Solar pv generation in watts")},
    "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "description":tr("Cumulative use in kWh")},
    "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "description":tr("Cumulative solar generation in kWh")},
    "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "description":tr("Cumulative grid import in kWh")},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":tr("Display power as kW")},
    "solar_disp_min":{"type":"value", "default":10, "name": "Solar Threshold", "description":tr("Display solar power as 0 below this threshold in w")}
};

config.app_name = "My Solar PV";
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
var KWH_KEYS = ["use_kwh", "solar_kwh", "import_kwh"];

var live_timer = false;
var lastupdate = 0;
var viewmode = "powergraph";        // or "bargraph"
var show_balance_line = false;

// Power graph
var data_mode = "power";            // or "kwh" for windows over 7 days when the kWh feeds are set
var loaded_mode = false;
var reload = true;
var autoupdate = true;
var live_timerange = 0;
var power_graph_end_time = 0;
var kwh_window = {};
var powerseries = null;

// Bar graph: one entry per day, {time, use, solar, direct} in kWh
var daily = [];
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

    if (config.app.use.value) {
        power_graph_end_time = Math.max(power_graph_end_time, feed.getmeta(config.app.use.value).end_time);
    }
    if (config.app.solar.value) {
        power_graph_end_time = Math.max(power_graph_end_time, feed.getmeta(config.app.solar.value).end_time);
    }

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

    // Balance toggle at the end of the legend, rebuilt on each draw
    $("#chart-legend").on("click", ".balanceline", function () {
        show_balance_line = !show_balance_line;
        draw();
    });

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

function resize()
{
    if ($('#app-block').is(":visible")) draw();
}

function hide()
{
    clearInterval(live_timer);
}

// Use, solar and import kWh feeds all set
function has_kwh_feeds() {
    return KWH_KEYS.every(function (key) { return !!config.app[key].value; });
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
    var solar = feeds[config.app.solar.value];
    var use = feeds[config.app.use.value];
    var solar_now = parseInt(solar.value);
    var use_now = parseInt(use.value);
    var updatetime = Math.max(solar.time, use.time);
    live_status_update(updatetime);

    if (autoupdate && viewmode == "powergraph") {
        power_graph_end_time = updatetime;
        timeseries.append("solar", updatetime, solar_now);
        timeseries.trim_start("solar", view.start*0.001);
        timeseries.append("use", updatetime, use_now);
        timeseries.trim_start("use", view.start*0.001);

        // Advance view
        view.end = now;
        view.start = view.end - live_timerange;
    }

    if (solar_now < config.app.solar_disp_min.value) solar_now = 0;

    var balance = solar_now - use_now;
    if (balance > 0) {
        $(".balance-label").text(tr("EXPORTING"));
        $(".balance").parent().css("color", "var(--ec-energy-export)");
    } else {
        $(".balance-label").text(tr("IMPORTING"));
        $(".balance").parent().css("color", "var(--ec-energy-import)");
    }
    balance = Math.round(Math.abs(balance));

    var kw = config.app.kw.value === true;
    if (kw) {
        solar_now = as_kw(solar_now);
        use_now = as_kw(use_now);
        balance = as_kw(balance);
    }
    $('.power-unit').text(kw ? 'kW' : 'W');
    $(".solarnow").html(solar_now);
    $(".usenow").html(use_now);
    $(".balance").text(balance);

    if (viewmode == "powergraph" && autoupdate && $('#placeholder_bound').width() > 0) draw();
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
    show_totals(flows.use_kwh, flows.solar_kwh, flows.direct_kwh);

    var series = [
        {data:flows.solar, name:'solar', label:'Solar', color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
        {data:flows.use, name:'use', label:'Use', color: "#0699fa", lines:{lineWidth:0, fill:0.8}}
    ];
    var balance = {data:flows.balance, yaxis:2, name:'balance', label:'Balance', color: 'green'};
    if (show_balance_line) series.push(balance);

    var options = {
        series: { lines: { fill: false, lineWidth: 2 } },
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none", min: view.start, max: view.end },
        yaxes: [{ min: 0, autoScale: "none" }, { position: "right" }],   // balance line on axis 2
        grid: { hoverable: true, clickable: true, color: "#aaa", borderWidth: 0 },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };

    powerseries = series;
    // Bind before plotting: Flot fires plothover from the last mouse position while drawing
    powergraph_events();
    Flot.plot(document.getElementById('placeholder'), series, options);
    chart_legend(series.filter(function (s) { return s !== balance; }));
    $("#chart-legend").append('<button class="app-legend-item app-legend-toggle balanceline' + (show_balance_line ? ' active' : '') + '" title="Show or hide the balance line">'
        + '<span class="app-legend-line" style="background:' + balance.color + '"></span>' + balance.label + '</button>');
    timebar_update(false);
    $("#time-select option[value=all]").prop("hidden", true);
    $(".ajax-loader").hide();
}

function load_powergraph() {
    if (data_mode == "kwh") {
        kwh_window = {};
        KWH_KEYS.forEach(function (key) {
            kwh_window[key] = feed.getdata(config.app[key].value, view.start, view.end, view.interval, 0, 1) || [];
        });
    } else {
        timeseries.load("solar", feed.getdata(config.app.solar.value, view.start, view.end, view.interval, 1));
        timeseries.load("use", feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1));
    }
}

// Flows from power data. A missing value holds the last value.
// Balance is the cumulative surplus in kWh.
function power_flows() {
    var flows = { use: [], solar: [], balance: [], use_kwh: 0, solar_kwh: 0, direct_kwh: 0 };
    var interval = view.interval;
    var to_kwh = interval / 3600000;
    var start = timeseries.start_time("solar");
    var n = Math.min(timeseries.length("solar"), timeseries.length("use"));
    var solar = 0, use = 0, store = 0;

    for (var z=0; z<n; z++) {
        var time = start + (1000 * interval * z);
        if (timeseries.value("solar", z) != null) solar = timeseries.value("solar", z);
        if (timeseries.value("use", z) != null) use = timeseries.value("use", z);
        if (time*0.001 > power_graph_end_time) continue;

        if (solar < config.app.solar_disp_min.value) solar = 0;
        store += (solar - use) * to_kwh;

        flows.use_kwh += use * to_kwh;
        flows.solar_kwh += solar * to_kwh;
        flows.direct_kwh += Math.min(use, solar) * to_kwh;

        flows.use.push([time, use]);
        flows.solar.push([time, solar]);
        flows.balance.push([time, store]);
    }
    return flows;
}

// Flows from kWh per interval, drawn as average W. A gap in any feed adds nothing.
function kwh_flows() {
    var flows = { use: [], solar: [], balance: [], use_kwh: 0, solar_kwh: 0, direct_kwh: 0 };
    var to_watts = 3600000 / view.interval;
    var n = Math.min(kwh_window.use_kwh.length, kwh_window.solar_kwh.length, kwh_window.import_kwh.length);
    var store = 0;

    for (var z=0; z<n; z++) {
        var time = kwh_window.use_kwh[z][0];
        var use = kwh_window.use_kwh[z][1];
        var solar = kwh_window.solar_kwh[z][1];
        var imported = kwh_window.import_kwh[z][1];

        if (use == null || solar == null || imported == null) {
            flows.use.push([time, null]);
            flows.solar.push([time, null]);
            flows.balance.push([time, null]);
            continue;
        }
        use = Math.max(0, use);
        solar = Math.max(0, solar);
        store += solar - use;

        flows.use_kwh += use;
        flows.solar_kwh += solar;
        flows.direct_kwh += Math.min(Math.max(0, use - imported), use, solar);

        flows.use.push([time, use * to_watts]);
        flows.solar.push([time, solar * to_watts]);
        flows.balance.push([time, store]);
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
            var name = series.name.toUpperCase();
            var value = point[1];
            if (series.name == "balance") items.push([name, value.toFixed(1), "kWh"]);
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
    var starts = KWH_KEYS.map(function (key) { return feed.getmeta(config.app[key].value).start_time; });
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

    var data = {};
    for (var key of KWH_KEYS) {
        data[key] = feed.getdata(config.app[key].value, start, end, "daily", 0, 1);
        if (!data[key]) return;
    }

    daily = [];
    data.solar_kwh.forEach(function (row, z) {
        var use = data.use_kwh[z] ? data.use_kwh[z][1] : null;
        var solar = row[1];
        var imported = data.import_kwh[z] ? data.import_kwh[z][1] : null;
        if (use == null || solar == null || imported == null) return;
        daily.push({ time: row[0], use: use, solar: solar, direct: use - imported });
    });
}

function draw_bargraph()
{
    var bar = function (label, fill, values) {
        return {
            data: daily.map(function (day) { return [day.time, values(day)]; }),
            label: label,
            color: label == "Use" ? "#0699fa" : "#dccc1f",
            bars: { show: true, align: "center", barWidth: [0.75*DAY_MS, true], fill: fill, lineWidth: 0 }
        };
    };
    var series = [
        bar("Use", 0.8, function (day) { return day.use; }),
        bar("Solar used", 0.6, function (day) { return day.direct; }),
        bar("Solar export", 0.8, function (day) { return day.direct - day.solar; })
    ];

    var options = {
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds" },
        grid: { hoverable: true, clickable: true, markings: [{ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } }] },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };

    bargraph_events();
    Flot.plot(document.getElementById('placeholder'), series, options);
    chart_legend(series);
    timebar_update(true);
    $("#time-select option[value=all]").prop("hidden", false);
    if (bargraph_all) $("#time-select").val("all");

    var use = 0, solar = 0, direct = 0;
    daily.forEach(function (day) {
        use += day.use;
        solar += day.solar;
        direct += day.direct;
    });
    show_totals(use, solar, direct);

    $('#placeholder').append("<div class='chart-note' style='top:30px'><b>Above:</b> Onsite Use & Total Use</div>");
    $('#placeholder').append("<div class='chart-note' style='bottom:50px'><b>Below:</b> Exported solar</div>");
}

function bargraph_events() {
    var placeholder = document.getElementById('placeholder');
    plot_unbind('placeholder');

    // Day's values in a tooltip
    placeholder.addEventListener("plothover", plot_handlers.plothover = function (event) {
        var pos = event.detail[0], item = event.detail[1];
        if (!item) {
            hide_tooltip();
            return;
        }
        var day = daily[item.dataIndex];
        show_tooltip(pos.pageX+10, pos.pageY+5, [
            [new Date(day.time).toLocaleDateString(undefined, {weekday: "short", day: "numeric", month: "short"}), "", ""],
            ["USE", day.use.toFixed(1), "kWh", "var(--ec-energy-use)"],
            ["SOLAR", day.solar.toFixed(1), "kWh", "var(--ec-energy-solar)"],
            ["DIRECT", day.direct.toFixed(1), "kWh", "var(--ec-energy-direct)"],
            ["EXPORT", (day.solar - day.direct).toFixed(1), "kWh", "#b7aa1f"],
            ["GRID", (day.use - day.direct).toFixed(1), "kWh", "var(--ec-energy-import)"]
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
// Totals and tooltip
// ----------------------------------------------------------------------

// Window totals below the chart. Direct is solar used on site.
function show_totals(use_kwh, solar_kwh, direct_kwh) {
    var export_kwh = solar_kwh - direct_kwh;
    var import_kwh = use_kwh - direct_kwh;

    $(".total_use_kwh").html(use_kwh.toFixed(use_kwh < 1 ? 2 : 1));
    $(".total_solar_kwh").html(solar_kwh.toFixed(solar_kwh < 1 ? 2 : 1));
    $("#total_use_direct_kwh").html(direct_kwh.toFixed(1));
    $("#total_export_kwh").html(export_kwh.toFixed(1));
    $("#total_import_kwh").html(import_kwh.toFixed(1));

    if (use_kwh > 0) {
        $(".total_use_direct_prc").html(Math.round(100*direct_kwh/use_kwh)+"%");
        $(".total_import_prc").html(Math.round(100*import_kwh/use_kwh)+"%");
    } else {
        $(".total_use_direct_prc, .total_import_prc").html("-- %");
    }
    if (solar_kwh > 0) {
        $(".total_export_prc").html(Math.round(100*export_kwh/solar_kwh)+"%");
    } else {
        $(".total_export_prc").html("-- %");
    }
}

// Tooltip rows as [label, value, units, swatch colour]
function show_tooltip(x, y, values) {
    var tooltip = $('#tooltip');
    if (!tooltip[0]) {
        tooltip = $('<div id="tooltip"></div>')
            .css({
                position: "absolute",
                display: "none",
                border: "1px solid #545454",
                padding: "8px",
                "background-color": "#333",
            })
            .appendTo("body");
    }

    tooltip.html('');
    var table = $('<table/>').appendTo(tooltip);

    values.forEach(function (value) {
        var row = $('<tr class="tooltip-item"/>').appendTo(table);
        var swatch = value[3] ? '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+value[3]+';margin-right:6px"></span>' : '';
        $('<td style="padding-right: 8px">'+swatch+'<span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    });

    tooltip.css({ left: x, top: y }).show();

    // Flip to the left of the cursor if the tooltip would overflow the chart's right edge
    var placeholder = $('#placeholder');
    var chart_right = placeholder.offset().left + placeholder.outerWidth();
    if (x + tooltip.outerWidth() > chart_right) {
        tooltip.css({ left: x - tooltip.outerWidth() - 20 });
    }
}

function hide_tooltip() {
    $('#tooltip').hide();
}
