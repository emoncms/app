// ----------------------------------------------------------------------
// Psychrometric Chart app
//
// Rebuild of the vis module psychrograph visualisation as an apps-module
// app with the dark theme styling shared with My Electric Flow.
//
// Plots temperature (x, degC) against absolute humidity (y, g/kg) as a
// scatter cloud, overlaid on indoor-air comfort zones and iso-relative-
// humidity curves. Optionally shows the Givoni building bioclimatic chart.
//
// Original psychrometric implementation: Alexandre CUER, 31/10/2018
// ----------------------------------------------------------------------

feed.apikey = apikey;

// Hide the config button if in public view
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// App configuration (built into the appconf form)
// ----------------------------------------------------------------------
config.app = {
    "temperature1": { "type": "feed", "autoname": "temperature", "description": "Zone 1 temperature (&deg;C)" },
    "humidity1":    { "type": "feed", "autoname": "humidity",    "description": "Zone 1 humidity" },

    "temperature2": { "type": "feed", "autoname": "temperature2", "description": "Zone 2 temperature (&deg;C)", "optional": true },
    "humidity2":    { "type": "feed", "autoname": "humidity2",    "description": "Zone 2 humidity", "optional": true },

    "temperature3": { "type": "feed", "autoname": "temperature3", "description": "Zone 3 temperature (&deg;C)", "optional": true },
    "humidity3":    { "type": "feed", "autoname": "humidity3",    "description": "Zone 3 humidity", "optional": true },

    "temperature4": { "type": "feed", "autoname": "temperature4", "description": "Zone 4 temperature (&deg;C)", "optional": true },
    "humidity4":    { "type": "feed", "autoname": "humidity4",    "description": "Zone 4 humidity", "optional": true },

    "relative_humidity": { "type": "checkbox", "name": "Relative humidity feeds", "description": "Humidity feeds are relative humidity (%) and will be converted to absolute humidity. Disable if feeds are already absolute humidity in g/kg.", "default": true },
    "givoni":            { "type": "checkbox", "name": "Show Givoni chart",       "description": "Show the Givoni building bioclimatic chart as a second tab.", "default": false },

    "Tmin":     { "type": "value", "name": "Temperature axis min (&deg;C)",  "default": 15 },
    "Tmax":     { "type": "value", "name": "Temperature axis max (&deg;C)",  "default": 35 },
    "habs_min": { "type": "value", "name": "Humidity axis min (g/kg)",       "default": 0 },
    "habs_max": { "type": "value", "name": "Humidity axis max (g/kg)",       "default": 40 }
};

// Fetch user feed list
config.feeds = feed.list();

config.initapp = function () { init(); };
config.showapp = function () { show(); };
config.hideapp = function () { clear(); };

// ----------------------------------------------------------------------
// Psychrometric maths (from the original psychrograph visualisation)
// ----------------------------------------------------------------------

// Absolute humidity (g/kg) from temperature (degC) and relative humidity (%)
function habs(temp, humidity) {
    return (0.622 * humidity * 10 * Math.pow(10, 2.7877 + (7.625 * temp) / (241.6 + temp))) / 101325;
}

// Linear interpolation of y at x on the line through (xmin,ymin)-(xmax,ymax)
function line(xmin, xmax, ymin, ymax, x) {
    return ymin + (x - xmin) * (ymax - ymin) / (xmax - xmin);
}

// A comfort zone bounded by xmin..xmax and the curves ymin(x)..ymax(x)
function Zone(xmin, xmax, ymin, ymax) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
}
// Build a closed polygon outline [[x,y],...] for filling
Zone.prototype.outline = function () {
    var XY = [];
    var step = 0.5;
    var x = this.xmin, i = 0;
    while (x < this.xmax) { XY[i] = [x, this.ymin(x)]; x += step; i += 1; }
    XY[i] = [this.xmax, this.ymin(this.xmax)]; i += 1;
    while (x >= this.xmin) { XY[i] = [x, this.ymax(x)]; x -= step; i += 1; }
    XY[i] = [this.xmin, this.ymin(this.xmin)];
    return XY;
};
// Test whether a point falls inside the zone
Zone.prototype.includes = function (x, y) {
    if (x < this.xmin || x > this.xmax) return false;
    if (y < this.ymin(x) || y > this.ymax(x)) return false;
    return true;
};

// 10 iso-relative-humidity curves (10% .. 100%), temp -15..55 degC
function isohr() {
    var plotiso = [];
    var hum = 10;
    for (var j = 0; j < 10; j++) {
        var pts = [];
        var T = -15;
        for (var i = 0; i < 71; i++) { pts.push([T, habs(T, hum)]); T++; }
        hum += 10;
        plotiso.push({ color: "#555", data: pts, lines: { show: true, lineWidth: 1 }, hoverable: false });
    }
    return plotiso;
}

// ----------------------------------------------------------------------
// Comfort zone definitions
// ----------------------------------------------------------------------
// Classic style
var zone4 = new Zone(17, 26,                                              // comfort polygon
    function (x) { return line(17, 26, habs(17, 40), habs(26, 30), x); },
    function (x) { return line(17, 26, habs(17, 80), habs(26, 50), x); });
var zone1 = new Zone(0, 27, function () { return 0; }, function (x) { return habs(x, 40); });   // too dry
var zone2 = new Zone(0, 24, function (x) { return habs(x, 80); }, function (x) { return habs(x, 100); });
var zone3 = new Zone(24, 27, function (x) { return habs(x, 80); }, function (x) { return habs(x, 100); });

// Givoni style (built lazily when enabled)
var givoni1, givoni2, givoni3;
function build_givoni() {
    givoni1 = new Zone(20, 27, function (x) { return habs(x, 20); },
        function (x) { if (x < 24) return habs(x, 80); if (x >= 24) return line(24, 27, habs(24, 80), habs(27, 48), x); });
    givoni2 = new Zone(20, 27,
        function (x) { if (x < 24) return habs(x, 80); if (x >= 24 && x <= 27) return line(24, 27, habs(24, 80), habs(27, 48), x); },
        function (x) { return habs(x, 95); });
    givoni3 = new Zone(27, 32.5, function (x) { return habs(x, 20); },
        function (x) { if (x < 27.5) return habs(x, 95); if (x >= 27.5) return line(27.5, 32.5, habs(27.5, 95), habs(32.5, 48), x); });
}

// Zone fill colours (dark theme) and labels
var ZONE_COLORS = {
    toodry:  "#5cb85c",  // too dry - green
    fungus:  "#f0ad4e",  // bacteria/fungus - yellow
    mites:   "#d9534f",  // bacteria/fungus/dust mites - red
    comfort: "#44b3e2"   // comfort - blue
};

// Scatter colour palette for the configured zones
var PAIR_COLORS = ["#44b3e2", "#f0ad4e", "#5cb85c", "#d9534f"];

// ----------------------------------------------------------------------
// State
// ----------------------------------------------------------------------
var pairs = [];        // configured temperature/humidity feed pairs
var feedXY = [];       // scatter data per pair: [[temp, abs_humidity],...]
var contextseries = [];// cached temperature-over-time series for redraw on resize
var current_view = "classic";
var updaterinst = false;
var previousPoint = null;

let datetimepicker1 = false;
let datetimepicker2 = false;

config.init();

// ----------------------------------------------------------------------
// Lifecycle
// ----------------------------------------------------------------------
function init() {
    if (config.app.givoni.value) build_givoni();
    $(".givoni-tab").toggleClass("d-none", !config.app.givoni.value);
}

function show() {
    $(".ajax-loader").hide();

    // Determine configured feed pairs
    pairs = get_pairs();

    // Starting view: last 7 days, clamped to the first feed's end time
    view.end = +new Date;
    if (pairs.length) {
        var meta = feed.getmeta(pairs[0].temp);
        if (meta && view.end * 0.001 > meta.end_time) view.end = meta.end_time * 1000;
    }
    view.start = view.end - (3600000 * 24.0 * 7);

    load();
}

function clear() {
    if (updaterinst) clearInterval(updaterinst);
}

// Return [{temp, hum, color, label}] for every configured + valid pair
function get_pairs() {
    var out = [];
    for (var i = 1; i <= 4; i++) {
        var t = config.app["temperature" + i].value;
        var h = config.app["humidity" + i].value;
        if (t && h && t !== "disable" && h !== "disable") {
            out.push({
                temp: t,
                hum: h,
                color: PAIR_COLORS[(i - 1) % PAIR_COLORS.length],
                label: feed_label(t)
            });
        }
    }
    return out;
}

function feed_label(feedid) {
    var f = config.feedsbyid[feedid];
    if (!f) return "Zone";
    return f.tag ? (f.tag + ": " + f.name) : f.name;
}

// ----------------------------------------------------------------------
// Load data and draw
// ----------------------------------------------------------------------
function load() {
    view.calc_interval(800);

    var relative = !!config.app.relative_humidity.value;
    contextseries = [];
    feedXY = [];

    for (var i = 0; i < pairs.length; i++) {
        // feed.getdata(id,start,end,interval,average,delta,skipmissing,limitinterval)
        // skipmissing=0 keeps both series aligned to the same timestamp grid so
        // temperature and humidity can be paired by index (nulls filtered below).
        var tempdata = feed.getdata(pairs[i].temp, view.start, view.end, view.interval, 0, 0, 0, 1);
        var humdata  = feed.getdata(pairs[i].hum,  view.start, view.end, view.interval, 0, 0, 0, 1);

        // Build temperature -> absolute humidity scatter cloud
        var xy = [];
        for (var z = 0; z < tempdata.length; z++) {
            if (humdata[z] != undefined && tempdata[z][1] != null && humdata[z][1] != null) {
                var T = tempdata[z][1];
                var H = relative ? habs(T, humdata[z][1]) : humdata[z][1];
                xy.push([T, H]);
            }
        }
        feedXY[i] = xy;

        contextseries.push({ label: pairs[i].label, data: tempdata, color: pairs[i].color, lines: { show: true } });
    }

    draw_context();
    draw_chart();
    clear_confort_stats();
}

// Compact temperature-over-time chart, used for drag-to-zoom time selection
function draw_context() {
    var options = {
        canvas: true,
        grid: { show: true, color: "#444", tickColor: "#2a2a2a", borderWidth: 0, hoverable: false },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end, font: { color: "#888" } },
        yaxis: { font: { color: "#888" } },
        legend: { show: true, position: "nw", backgroundColor: "#1c1c1c", backgroundOpacity: 0.6 },
        selection: { mode: "x", color: "#555" }
    };
    $.plot($("#contextgraph"), contextseries, options);
}

// Build the flot series for the psychrometric (or Givoni) chart
function build_plotdata(givoni) {
    var plotdata = [];

    if (givoni) {
        plotdata.push({ color: ZONE_COLORS.comfort, data: givoni1.outline(), lines: { show: true, fill: 0.2 }, label: "comfort" });
        plotdata.push({ color: ZONE_COLORS.fungus,  data: givoni2.outline(), lines: { show: true, fill: 0.15 }, label: "no comfort 1" });
        plotdata.push({ color: ZONE_COLORS.mites,   data: givoni3.outline(), lines: { show: true, fill: 0.15 }, label: "no comfort 2" });
    } else {
        plotdata.push({ color: ZONE_COLORS.toodry, data: zone1.outline(), lines: { show: true, fill: 0.12 }, label: "too dry" });
        plotdata.push({ color: ZONE_COLORS.fungus, data: zone2.outline(), lines: { show: true, fill: 0.15 }, label: "bacteria/fungus" });
        plotdata.push({ color: ZONE_COLORS.mites,  data: zone3.outline(), lines: { show: true, fill: 0.15 }, label: "bacteria/fungus/dust mites" });
    }

    // Iso-relative-humidity curves (unlabelled, behind the scatter)
    var iso = isohr();
    for (var j = 0; j < iso.length; j++) plotdata.push(iso[j]);

    // Scatter clouds
    for (var i = 0; i < pairs.length; i++) {
        plotdata.push({ color: pairs[i].color, data: feedXY[i], points: { show: true, radius: 2 }, label: pairs[i].label });
    }

    // Comfort polygon drawn last (on top) for the classic chart
    if (!givoni) {
        plotdata.push({ color: ZONE_COLORS.comfort, data: zone4.outline(), lines: { show: true, fill: 0.2 }, label: "comfort" });
    }

    return plotdata;
}

function draw_chart() {
    var Tmin = parseFloat(config.app.Tmin.value);
    var Tmax = parseFloat(config.app.Tmax.value);
    var habs_min = parseFloat(config.app.habs_min.value);
    var habs_max = parseFloat(config.app.habs_max.value);

    var options = {
        canvas: true,
        grid: { show: true, color: "#444", tickColor: "#2a2a2a", borderWidth: 0, hoverable: true },
        legend: { show: true, position: "nw", backgroundColor: "#1c1c1c", backgroundOpacity: 0.7 },
        xaxis: { min: Tmin, max: Tmax, font: { color: "#888" } },
        yaxis: { min: habs_min, max: habs_max, font: { color: "#888" } }
    };

    if (current_view === "givoni" && config.app.givoni.value) {
        $.plot($("#givonigraph"), build_plotdata(true), options);
    } else {
        $.plot($("#psychrograph"), build_plotdata(false), options);
    }
}

// ----------------------------------------------------------------------
// Comfort zone analysis table
// ----------------------------------------------------------------------
function clear_confort_stats() {
    $("#psychrotext").html('<p class="ctrl-note">Click "Calculate %" to show the proportion of data points falling in each comfort zone.</p>');
}

function calc_confort_stats() {
    if (!pairs.length) { clear_confort_stats(); return; }

    function swatch(c) { return '<span class="zone-swatch" style="background:' + c + '"></span>'; }

    var html = "<table><thead><tr>";
    html += "<th>Zone</th>";
    html += "<th>" + swatch(ZONE_COLORS.comfort) + "comfort</th>";
    html += "<th>" + swatch(ZONE_COLORS.mites) + "fungus / dust mites</th>";
    html += "<th>" + swatch(ZONE_COLORS.fungus) + "bacteria / fungus</th>";
    html += "<th>" + swatch(ZONE_COLORS.toodry) + "too dry</th>";
    html += "<th>other</th>";
    html += "</tr></thead><tbody>";

    for (var i = 0; i < pairs.length; i++) {
        var c1 = 0, c2 = 0, c3 = 0, c4 = 0, out = 0;
        var data = feedXY[i];
        for (var z = 0; z < data.length; z++) {
            var x = data[z][0], y = data[z][1];
            if (zone4.includes(x, y)) c4 += 1;
            else if (zone1.includes(x, y)) c1 += 1;
            else if (zone2.includes(x, y)) c2 += 1;
            else if (zone3.includes(x, y)) c3 += 1;
            else out += 1;
        }
        var n = data.length || 1;
        var pct = function (v) { return (Math.floor(v * 1000 / n) / 10) + "%"; };
        html += "<tr><td class='zone-name'>" + pairs[i].label + "</td>";
        html += "<td>" + pct(c4) + "</td>";
        html += "<td>" + pct(c3) + "</td>";
        html += "<td>" + pct(c2) + "</td>";
        html += "<td>" + pct(c1) + "</td>";
        html += "<td>" + pct(out) + "</td></tr>";
    }
    html += "</tbody></table>";
    $("#psychrotext").html(html);
}

// ----------------------------------------------------------------------
// View toggle (Psychrometric / Givoni)
// ----------------------------------------------------------------------
$(".view-toggle-btn").click(function () {
    current_view = $(this).data("view");
    $(".view-toggle-btn").removeClass("active");
    $(this).addClass("active");
    $("#classic-view").toggleClass("d-none", current_view !== "classic");
    $("#givoni-view").toggleClass("d-none", current_view !== "givoni");
    draw_chart();
});

// ----------------------------------------------------------------------
// Stats buttons
// ----------------------------------------------------------------------
$("#calc").click(function () { calc_confort_stats(); });
$("#clear").click(function () { clear_confort_stats(); });

// ----------------------------------------------------------------------
// Time navigation
// ----------------------------------------------------------------------
$("#zoomout").click(function () { view.zoomout(); load(); });
$("#zoomin").click(function () { view.zoomin(); load(); });
$('#right').click(function () { view.panright(); load(); });
$('#left').click(function () { view.panleft(); load(); });
$('.time').click(function () { view.timewindow($(this).attr("time") / 24.0); load(); });

// Drag-to-select on the context chart sets the time window
$("#contextgraph").bind("plotselected", function (event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    load();
});

// Hover tooltip on the psychrometric chart
$("#psychrograph, #givonigraph").bind("plothover", function (event, pos, item) {
    if (item && item.series && item.series.points && item.series.points.show) {
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();
            var t = item.datapoint[0].toFixed(1);
            var h = item.datapoint[1].toFixed(1);
            tooltip(item.pageX, item.pageY, t + " &deg;C<br>" + h + " g/kg", "#fff", "#000");
        }
    } else {
        $("#tooltip").remove();
        previousPoint = null;
    }
});

// ----------------------------------------------------------------------
// Manual date-time range nav (mirrors My Electric Flow)
// ----------------------------------------------------------------------
$("#datetimepicker1").datetimepicker({ language: 'en-EN' });
$("#datetimepicker2").datetimepicker({ language: 'en-EN' });
datetimepicker1 = $('#datetimepicker1').data('datetimepicker');
datetimepicker2 = $('#datetimepicker2').data('datetimepicker');

$("#time-manual-open").click(function () {
    update_time_pickers();
    $("#graph-nav").addClass("d-none");
    $("#graph-nav-manual").removeClass("d-none");
});
$("#time-manual-close").click(function () {
    $("#graph-nav-manual").addClass("d-none");
    $("#graph-nav").removeClass("d-none");
});

$('#datetimepicker1').on("changeDate", function () {
    var t = parse_timepicker_time($("#request-start").val());
    if (!t) { alert("Please enter a valid start date."); return false; }
    if (t * 1000 >= view.end) { alert("Start date must be before the end date."); return false; }
    view.start = t * 1000;
    load();
});
$('#datetimepicker2').on("changeDate", function () {
    var t = parse_timepicker_time($("#request-end").val());
    if (!t) { alert("Please enter a valid end date."); return false; }
    if (view.start >= t * 1000) { alert("End date must be after the start date."); return false; }
    view.end = t * 1000;
    load();
});

function update_time_pickers() {
    if (datetimepicker1) {
        datetimepicker1.setLocalDate(new Date(view.start));
        datetimepicker1.setEndDate(new Date(view.end));
    }
    if (datetimepicker2) {
        datetimepicker2.setLocalDate(new Date(view.end));
        datetimepicker2.setStartDate(new Date(view.start));
    }
}

// ----------------------------------------------------------------------
// Resize
// ----------------------------------------------------------------------
$(window).resize(function () {
    if ($('#app-block').is(":visible") && $("#contextgraph").width()) {
        draw_context();
        draw_chart();
    }
});
