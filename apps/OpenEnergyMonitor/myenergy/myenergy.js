// My Energy
// Power graph from use and solar power feeds, with a share of UK wind generation
// scaled to the annual wind kWh set in the app config.

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "description":tr("House or building use in watts")},
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "description":tr("Solar pv generation in watts")},
    "windkwh":{"type":"value", "default":2000, "name": "kWh Wind", "description":tr("kWh of wind energy bought annually")},
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description":tr("Display power as kW")}
};

config.app_name = "My Energy";
config.app_name_color = "#5cb85c";

config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// State
// ----------------------------------------------------------------------
var HOUR_MS = 3600000;
var SOLAR_MIN = 10;                 // solar below this in W shown as 0

// UK wind power on emoncms.org: feed for the graph, value for the live reading
var UK_WIND_FEED = 97699;
var UK_WIND_VALUE = 67088;
// Average UK wind power output in MW, March 2022 to March 2023
var UK_WIND_AVERAGE_MW = 7188;

var live_timer = false;
var lastupdate = 0;
var reload = true;
var autoupdate = true;
var live_timerange = 0;
var show_balance_line = false;

config.init();

// ----------------------------------------------------------------------
// App lifecycle
// ----------------------------------------------------------------------
function init()
{
    if (config.app.solar.value == "disable") config.app.solar.value = false;

    var window_ms = 6*HOUR_MS;
    view.end = +new Date;

    // Feed more than 1 hour behind: start the view at the end of the feed
    var end_time = feed.getmeta(config.app.use.value).end_time;
    if ((view.end*0.001 - end_time) > 3600) {
        view.end = end_time*1000;
        autoupdate = false;
    }
    view.start = view.end - window_ms;
    live_timerange = window_ms;

    $("#zoomout").click(function () {view.zoomout(); nav_update(false);});
    $("#zoomin").click(function () {view.zoomin(); nav_update(false);});
    $('#right').click(function () {view.panright(); nav_update(false);});
    $('#left').click(function () {view.panleft(); nav_update(false);});

    $('#time-select').change(function () {
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

    powergraph_events();

    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize);
}

function show()
{
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

// Window changed by the time bar. Live under 25 hours only.
function nav_update(live) {
    reload = true;
    autoupdate = live && (view.end - view.start) < 25*HOUR_MS;
    if (autoupdate) live_timerange = view.end - view.start;
    draw();
}

// Household share of UK wind in W from UK wind power in MW
function wind_share(uk_wind) {
    var average_power = (config.app.windkwh.value / 365.0) / 0.024;
    return Math.round((average_power / UK_WIND_AVERAGE_MW) * uk_wind);
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
    var use = feeds[config.app.use.value];
    var use_now = parseInt(use.value);
    var solar_now = config.app.solar.value ? parseInt(feeds[config.app.solar.value].value) : 0;
    var uk_wind = getvalueremote(UK_WIND_VALUE);
    var wind_now = wind_share(uk_wind);
    live_status_update(use.time);

    if (autoupdate) {
        if (config.app.solar.value) {
            timeseries.append("solar", use.time, solar_now);
            timeseries.trim_start("solar", view.start*0.001);
        }
        timeseries.append("use", use.time, use_now);
        timeseries.trim_start("use", view.start*0.001);
        timeseries.append("remotewind", use.time, uk_wind);
        timeseries.trim_start("remotewind", view.start*0.001);

        // Advance view
        view.end = now;
        view.start = view.end - live_timerange;
    }

    if (solar_now < SOLAR_MIN) solar_now = 0;
    var gen_now = solar_now + wind_now;

    var balance = gen_now - use_now;
    if (balance > 0) {
        $(".balance-label").text(tr("EXCESS"));
        $(".balance").parent().css("color", "var(--ec-energy-export)");
    } else {
        $(".balance-label").text(tr("BACKUP"));
        $(".balance").parent().css("color", "var(--ec-energy-import)");
    }
    balance = Math.round(Math.abs(balance));

    var kw = config.app.kw.value === true;
    if (kw) {
        use_now = as_kw(use_now);
        solar_now = as_kw(solar_now);
        wind_now = as_kw(wind_now);
        gen_now = as_kw(gen_now);
        balance = as_kw(balance);
    }
    $('.power-unit').text(kw ? 'kW' : 'W');
    $(".usenow").text(use_now);
    $(".solarnow").text(solar_now);
    $(".windnow").text(wind_now);
    $(".gennow").text(gen_now);
    $(".balance").text(balance);

    if (autoupdate && $('#placeholder_bound').width() > 0) draw();
}

// ----------------------------------------------------------------------
// Power graph
// ----------------------------------------------------------------------
function draw()
{
    view.calc_interval(1500);

    if (reload) {
        reload = false;
        load_powergraph();
    }

    var flows = power_flows();
    show_totals(flows);

    // Solar stacked on wind
    var series = [
        {data:flows.gen, label:'Solar', color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
        {data:flows.wind, label:'Wind', color: "#2ed52e", lines:{lineWidth:0, fill:1.0}},
        {data:flows.use, label:'Use', color: "#0699fa", lines:{lineWidth:0, fill:0.8}}
    ];
    var balance = {data:flows.balance, yaxis:2, label:'Balance', color: 'green'};
    if (show_balance_line) series.push(balance);

    var options = {
        series: { lines: { fill: false, lineWidth: 2 } },
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none", min: view.start, max: view.end },
        yaxes: [{ min: 0, autoScale: "none" }, { position: "right" }],   // balance line on axis 2
        grid: { hoverable: true, clickable: true, color: "#aaa", borderWidth: 0 },
        selection: { mode: "x", color: "#e8cfac", visualization: "fill" },
        legend: { show: false }
    };

    Flot.plot(document.getElementById('placeholder'), series, options);
    chart_legend(series.filter(function (s) { return s !== balance; }));
    $("#chart-legend").append('<button class="app-legend-item app-legend-toggle balanceline' + (show_balance_line ? ' active' : '') + '" title="Show or hide the balance line">'
        + '<span class="app-legend-line" style="background:' + balance.color + '"></span>' + balance.label + '</button>');
    timebar_update(false);
    $(".ajax-loader").hide();
}

function load_powergraph() {
    if (config.app.solar.value) {
        timeseries.load("solar", feed.getdata(config.app.solar.value, view.start, view.end, view.interval, 1));
    }
    timeseries.load("use", feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1));
    timeseries.load("remotewind", getdataremote(UK_WIND_FEED, view.start, view.end, view.interval));
}

// Flows from power data. A missing value holds the last value.
// Balance is the cumulative surplus in kWh.
function power_flows() {
    var flows = { use: [], wind: [], gen: [], balance: [], use_kwh: 0, solar_kwh: 0, wind_kwh: 0, direct_kwh: 0 };
    var interval = view.interval;
    var to_kwh = interval / 3600000;
    var start = timeseries.start_time("use");
    var use = 0, solar = 0, wind = 0, store = 0;

    for (var z=0; z<timeseries.length("use"); z++) {
        var time = start + (1000 * interval * z);
        if (config.app.solar.value && timeseries.value("solar", z) != null) solar = timeseries.value("solar", z);
        if (timeseries.value("use", z) != null) use = timeseries.value("use", z);
        if (timeseries.value("remotewind", z) != null) wind = wind_share(timeseries.value("remotewind", z));

        if (solar < SOLAR_MIN) solar = 0;
        var gen = solar + wind;
        store += (gen - use) * to_kwh;

        flows.use_kwh += use * to_kwh;
        flows.solar_kwh += solar * to_kwh;
        flows.wind_kwh += wind * to_kwh;
        flows.direct_kwh += Math.min(use, gen) * to_kwh;

        flows.use.push([time, use]);
        flows.wind.push([time, wind]);
        flows.gen.push([time, gen]);
        flows.balance.push([time, store]);
    }
    return flows;
}

function powergraph_events() {
    document.getElementById('placeholder').addEventListener("plotselected", function (event) {
        var ranges = event.detail[0];
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;
        reload = true;

        // Selection up to now under 25 hours follows live data
        autoupdate = Math.abs(view.end - (+new Date)) < 30000 && (view.end - view.start) < 25*HOUR_MS;
        if (autoupdate) live_timerange = view.end - view.start;

        draw();
    });
}

// Window totals below the chart. Direct is generation used on site.
function show_totals(flows) {
    var import_kwh = flows.use_kwh - flows.direct_kwh;

    $(".total_use_kwh").text(flows.use_kwh.toFixed(1));
    $(".total_wind_kwh").text(flows.wind_kwh.toFixed(1));
    $(".total_solar_kwh").text(flows.solar_kwh.toFixed(1));
    $("#total_use_direct_kwh").text(flows.direct_kwh.toFixed(1));
    $("#total_import_kwh").text(import_kwh.toFixed(1));

    if (flows.use_kwh > 0) {
        $(".total_use_direct_prc").text(Math.round(100*flows.direct_kwh/flows.use_kwh)+"%");
        $(".total_import_prc").text(Math.round(100*import_kwh/flows.use_kwh)+"%");
    } else {
        $(".total_use_direct_prc, .total_import_prc").text("-- %");
    }
}

// ----------------------------------------------------------------------
// Remote data requests
// ----------------------------------------------------------------------
function getdataremote(id, start, end, interval)
{
    var data = [];
    $.ajax({
        url: path+"app/dataremote",
        data: {id:id, start:start, end:end, interval:interval, skipmissing:0, limitinterval:0},
        dataType: 'json',
        async: false,
        success: function (result) {
            if (!Array.isArray(result)) {
                console.log("ERROR", "getdataremote invalid response: "+result);
                result = [];
            }
            data = result;
        }
    });
    return data;
}

function getvalueremote(id)
{
    var value = 0;
    $.ajax({
        url: path+"app/valueremote",
        data: {id:id},
        dataType: 'json',
        async: false,
        success: function (result) {
            if (isNaN(result)) {
                console.log("ERROR", "getvalueremote value is not a number, found: "+result);
                result = 0;
            }
            value = parseFloat(result);
        }
    });
    return value;
}
