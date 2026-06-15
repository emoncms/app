// ----------------------------------------------------------------------
// Time of Use - flexible
// ----------------------------------------------------------------------
// The PHP-injected bootstrap (apikey, user_timezone, sessionwrite and the
// config.id/name/public/db values) is set inline in timeofuse2.php before
// this file is loaded.
// ----------------------------------------------------------------------
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','WhiteSmoke');

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"use", "description":"Time Of Use total feed (W)"},
    "use_kwh":{"type":"feed", "autoname":"use_kwh", "description":"Time Of Use accumulated kWh"},
    "currency":{"type":"value", "default":"£", "name": "Currency", "description":"Currency symbol (£,$..)"},
    // The schedule (tariffs, prices, start times and public holidays) is edited
    // with the Schedule builder below the chart, so these raw fields are hidden
    // from the configuration panel. They remain here for storage and defaults.
    "tier_cost":{"type":"value", "hidden":true, "default":"OffPeak:0.165,Shoulder:0.253,Peak:0.594",
        "name":"Tier Names and Costs, currency/kWh",
        "description":"List of tier costs and names."},
    "wd_times":{"type":"value", "hidden":true, "default":"0:0,7:1,14:2,20:1,22:0",
        "name":"Weekday schedule",
        "description":"Weekday schedule (managed by the Schedule builder)."},
    "we_times":{"type":"value", "hidden":true, "default":"0:0,7:1,22:0",
        "name":"Weekend schedule",
        "description":"Weekend schedule (managed by the Schedule builder)."},
    "ph_days":{"type":"value", "hidden":true, "default":"2017:2,104,107,115,163,275,359,360;2018:1",
        "name":"Public Holiday days",
        "description":"List of public holidays (managed by the Schedule builder)."},
    "supply":{"type":"value", "default":"0", "name":"Supply Charge",
        "description":"Daily supply charge in the specified currency (set to 0 to disable)."},
    "enable_cl":{"type":"checkbox", "default":false, "name":"Controlled load",
        "description":"Enable a separately-monitored controlled load (e.g. off-peak hot water)."},
    "cl_use":{"type":"feed", "autoname":"cl_use", "optional":true, "description":"Controlled Load power feed (W)"},
    "cl_kwh":{"type":"feed", "autoname":"cl_kwh", "optional":true, "description":"Controlled Load accumulated kWh"},
    "cl_cost":{"type":"value", "default":"0.17", "name":"Controlled Load Cost",
        "description":"Cost of the controlled load, currency/kWh."}
};

config.app_name = "Time of Use - flexible";
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
var series_tier_colours = ["#44b3e2", "#4473e2", "#4433e2", "#44b3b2", "#44b372", "#44b332"];
var previousPoint = false;
var viewmode = "bargraph";
var viewcostenergy = "energy";
var panning = false;
var flot_font_size = 12;
var start_time = 0;
var updaterinst = false;
var use_start = 0;

// Distinct tariff names, in display order (union of weekday + weekend blocks).
var tier_names = [];

// Optional controlled load + supply charge
var cl_enabled = false;
var cl_rate = 0;
var supply = 0;
var cl_idx = 0; // The data index of the controlled load "tier"

// Half-hourly resolution: each day is split into 48 slots (0 = 00:00, 1 = 00:30 ...).
// For each slot we store the tariff index (into tier_names) and its price (currency/kWh).
var weekday_tiers = []; var weekday_rates = [];
var weekend_tiers = []; var weekend_rates = [];

// Tariff definitions: ordered list of { name, price } (currency/kWh). Defines the
// tariff names, prices and colours; the schedule blocks reference these by name.
var tariffs = [];
// Schedule builder state: ordered blocks { start:"HH:MM", name } per profile.
var schedule = { weekday: [], weekend: [] };
var sched_tab = "weekday";
var sched_editing = false;        // read-only by default; toggled by the configure icon
var schedule_totals = null;       // per-tariff totals/averages for the current window

// public holidays use the weekend rates.
// map of "YYYY-MM-DD" day keys (in the configured timezone) for defined public holidays
var public_holidays = {};

// Show/hide the controlled load config fields based on the checkbox
config.ui_before_render = function(){
    var on = !!(config.db["enable_cl"]);
    config.app["cl_use"].hidden  = !on;
    config.app["cl_kwh"].hidden  = !on;
    config.app["cl_cost"].hidden = !on;
};
config.ui_after_value_change = function(key){
    if (key === "enable_cl") vue_config.renderUI();
};

config.init();

function init()
{
    // Quick translation of feed ids
    feeds = {};
    feeds["use"] = config.feedsbyid[config.app["use"].value];
    feeds["use_kwh"] = config.feedsbyid[config.app["use_kwh"].value];

    // Daily supply charge (applies in cost mode whenever > 0, independent of controlled load)
    supply = parseFloat(config.app["supply"].value) || 0;

    // Optional separately-monitored controlled load
    cl_enabled = !!config.app["enable_cl"].value;
    if (cl_enabled) {
        feeds["cl_use"] = config.feedsbyid[config.app["cl_use"].value];
        feeds["cl_kwh"] = config.feedsbyid[config.app["cl_kwh"].value];
        cl_rate = parseFloat(config.app["cl_cost"].value) || 0;
        // Only treat the controlled load as enabled if both feeds resolve, so a
        // half-configured (or unshared, in a public view) load degrades gracefully.
        if (!feeds["cl_use"] || !feeds["cl_kwh"]) cl_enabled = false;
    }

    // Stage 1: tariff definitions (name + price) from tier_cost
    var tc = parse_tier_cost(config.app["tier_cost"].value);
    var names = [];
    var price_by_name = {};
    for (var i = 0; i < tc.names.length; i++) {
        var n = tc.names[i];
        if (n === undefined || n === "") continue;
        if (price_by_name[n] === undefined) names.push(n);
        price_by_name[n] = tc.rates[i];
    }

    // Stage 2: schedule blocks referencing tariffs by name (legacy format migrated)
    var wd = parse_blocks(config.app["wd_times"].value, tc);
    var we = parse_blocks(config.app["we_times"].value, tc);

    // Adopt any tariff names used by the schedule but not defined above, taking an
    // explicit block price where present (legacy and older per-block-price saves).
    var merge = function(blocks) {
        for (var i = 0; i < blocks.length; i++) {
            var n = blocks[i].name;
            if (price_by_name[n] === undefined) {
                names.push(n);
                price_by_name[n] = (blocks[i].price !== undefined) ? blocks[i].price : 0;
            }
        }
    };
    merge(wd); merge(we);
    if (names.length === 0) { names.push("Tariff"); price_by_name["Tariff"] = 0; }

    tariffs = names.map(function(n){ return { name: n, price: price_by_name[n] }; });
    schedule.weekday = wd.map(function(b){ return { start: b.start, name: b.name }; });
    schedule.weekend = we.map(function(b){ return { start: b.start, name: b.name }; });

    // Tariff identity (index/colour) + half-hourly profiles
    tier_names = [];
    var tier_index = {};
    for (var i = 0; i < tariffs.length; i++) { tier_index[tariffs[i].name] = i; tier_names.push(tariffs[i].name); }
    cl_idx = tier_names.length; // controlled load occupies the slot after the last tariff

    var wdp = build_profile(schedule.weekday, tier_index, price_by_name);
    weekday_tiers = wdp.tiers; weekday_rates = wdp.rates;
    var wep = build_profile(schedule.weekend, tier_index, price_by_name);
    weekend_tiers = wep.tiers; weekend_rates = wep.rates;

    // Public holidays (legacy day-of-year format) -> set of "YYYY-MM-DD" day keys
    public_holidays = {};
    var ph = ("" + (config.app["ph_days"].value || "")).trim();
    if (ph != "") {
        var ph_yrs = ph.split(";");
        for (var yr in ph_yrs) {
            var dates = ph_yrs[yr].split(":");
            if (dates[1] != undefined) {
                var days = dates[1].split(",");
                for (var i in days) {
                    // day-of-year -> calendar date, stored as a "YYYY-MM-DD" key
                    var d = (new Date(parseInt(dates[0]), 0, 0));
                    d.setDate(d.getDate() + parseInt(days[i]));
                    public_holidays[d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())] = true;
                }
            }
        }
    }
}

// ----------------------------------------------------------------------
// Schedule parsing / half-hourly profile construction
// ----------------------------------------------------------------------
// Half-hour slot helpers: slot 0 = 00:00, 1 = 00:30 ... 47 = 23:30
function time_to_slot(t) {
    var p = ("" + t).split(":");
    var h = parseInt(p[0],10); if (isNaN(h)) h = 0;
    var m = parseInt(p[1],10); if (isNaN(m)) m = 0;
    if (h < 0) h = 0; if (h > 23) h = 23;
    return h*2 + (m >= 30 ? 1 : 0);
}
function slot_to_time(slot) {
    slot = ((slot % 48) + 48) % 48;
    return pad2(Math.floor(slot/2)) + ":" + (slot % 2 ? "30" : "00");
}
function norm_time(t) { return slot_to_time(time_to_slot(t)); }

// Half-hour slot (0..47) for a timestamp's wall-clock parts.
function parts_to_slot(parts) { return parts.hour*2 + (parts.minute >= 30 ? 1 : 0); }

// Active tariff index + price (currency/kWh) for a timestamp's parts, picking the
// weekend/public-holiday profile where that applies.
function tier_for(parts) {
    var slot = parts_to_slot(parts);
    var we = we_ph(parts);
    return {
        tier: (we ? weekend_tiers : weekday_tiers)[slot],
        rate: (we ? weekend_rates : weekday_rates)[slot]
    };
}

// Legacy "Name:rate,Name:rate" tariff list -> { names:[], rates:[] }
function parse_tier_cost(value) {
    var names = [], rates = [];
    var tiers = ("" + (value || "")).split(",");
    for (var a = 0; a < tiers.length; a++) {
        var p = tiers[a].split(":");
        names[a] = p[0];
        rates[a] = parseFloat(p[1]) || 0;
    }
    return { names: names, rates: rates };
}

// Parse a schedule profile into ordered blocks { start:"HH:MM", name[, price] }.
// Stored format is comma separated "HH:MM=tariff name" pairs. Two older formats
// are also migrated on read: a JSON array of blocks, and the legacy
// "startHour:tierIndex,..." form (price taken from the tier_cost definitions).
// A quote-free stored format is used deliberately so the config survives the
// server's stripslashes()/json_decode round-trip.
function parse_blocks(value, legacy) {
    value = ("" + (value || "")).trim();
    var blocks = [];
    if (value.charAt(0) == "[") {
        try {
            var arr = JSON.parse(value);
            for (var i = 0; i < arr.length; i++) {
                var pr = arr[i].price;
                blocks.push({
                    start: norm_time(arr[i].start),
                    name: ("" + (arr[i].name || "")).trim(),
                    price: (pr !== undefined && pr !== null && pr !== "") ? (parseFloat(pr) || 0) : undefined
                });
            }
        } catch (e) { blocks = []; }
    } else if (value != "") {
        var parts = value.split(",");
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            var eq = part.indexOf("=");
            if (eq >= 0) {
                // Current format: "HH:MM=tariff name"
                blocks.push({ start: norm_time(part.substr(0, eq)), name: part.substr(eq + 1).trim() });
            } else {
                // Legacy format: "startHour:tierIndex"
                var p = part.split(":");
                if (p.length < 2) continue;
                var idx = parseInt(p[1], 10);
                blocks.push({
                    start: pad2(parseInt(p[0], 10) || 0) + ":00",
                    name: (legacy.names[idx] !== undefined && legacy.names[idx] !== "") ? legacy.names[idx] : ("Tier " + idx),
                    price: legacy.rates[idx] !== undefined ? legacy.rates[idx] : 0
                });
            }
        }
    }
    if (blocks.length == 0) blocks.push({ start: "00:00", name: "Tariff" });
    return blocks;
}

// Expand ordered blocks into 48 half-hour slots of tariff index + price (looked
// up from the tariff definitions). Slots before the first block (and any gaps)
// wrap around from the last block of the day.
function build_profile(blocks, tier_index, price_by_name) {
    var tiers = new Array(48), rates = new Array(48);
    if (blocks.length == 0) { for (var s = 0; s < 48; s++) { tiers[s] = 0; rates[s] = 0; } return { tiers: tiers, rates: rates }; }
    var sorted = blocks.slice().sort(function(a,b){ return time_to_slot(a.start) - time_to_slot(b.start); });
    var last = sorted[sorted.length-1];
    for (var s = 0; s < 48; s++) { tiers[s] = tier_index[last.name] || 0; rates[s] = price_by_name[last.name] || 0; }
    for (var i = 0; i < sorted.length; i++) {
        var idx = tier_index[sorted[i].name] || 0;
        var price = price_by_name[sorted[i].name] || 0;
        for (var s = time_to_slot(sorted[i].start); s < 48; s++) { tiers[s] = idx; rates[s] = price; }
    }
    return { tiers: tiers, rates: rates };
}

// Tariff colour by index, cycling if there are more tariffs than colours.
function tier_colour(i) { return series_tier_colours[i % series_tier_colours.length]; }

function show() {
    $("body").css('background-color','WhiteSmoke');

    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);
    if (meta["use_kwh"].start_time>start_time) start_time = meta["use_kwh"].start_time;
    use_start = feed.getvalue(feeds["use_kwh"].id, start_time);

    resize();

    load_last_days(30);

    updater();
    updaterinst = setInterval(updater,5000);
    $(".ajax-loader").hide();

    schedule_show();
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
        var power_now = feeds["use"].value;
        if (cl_enabled && feeds["cl_use"]) power_now += feeds["cl_use"].value;
        $("#power_now").html(Math.round(power_now)+"W");
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
    viewmode = "bargraph";
    load_last_days(30);
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
        var total = 0;
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var text = "";
            var p = tz_parts(itemTime);
            if (viewmode == "bargraph") {
                var date = p.weekday+", "+months[parseInt(p.daykey.substr(5,2),10)-1]+" "+parseInt(p.daykey.substr(8,2),10);

                // Read each stacked segment back from its labelled series
                var segs = [];
                for (var a = 0; a < bargraph_series.length; a++) {
                    if (bargraph_series[a].data[z] == undefined) continue;
                    var val = bargraph_series[a].data[z][1];
                    segs.push({ label: bargraph_series[a].label, value: val });
                    total += val;
                }

                if (viewcostenergy=="energy") {
                    text = date + "<br>Total: " + total.toFixed(1) + " kWh";
                    for (var a = segs.length - 1; a >= 0; a--) {
                        if (segs[a].value == 0) continue;
                        text += "<br>" + segs[a].label + ": " + segs[a].value.toFixed(1) + " kWh";
                    }
                } else {
                    text = date + "<br>Total: "+ config.app["currency"].value + total.toFixed(2);
                    for (var a = segs.length - 1; a >= 0; a--) {
                        if (segs[a].value == 0) continue;
                        text += "<br>" + segs[a].label + ": " + config.app["currency"].value + segs[a].value.toFixed(2);
                    }
                }
            } else {
                var date = p.weekday+", "+pad2(p.hour)+":"+pad2(p.minute);
                text = date + "<br>" + item.datapoint[1] + "W";
            }
            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

// Auto click through to power graph
$('#placeholder').bind("plotclick", function (event, pos, item)
{
    if (item && !panning && viewmode=="bargraph") {
        var z = item.dataIndex;
        view.start = bargraph_series[0].data[z][0];
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

$('.bargraph-week').click(function () { load_last_days(7); });
$('.bargraph-month').click(function () { load_last_days(30); });
$('.bargraph-year').click(function () { load_last_days(365); });

$(".viewcostenergy").click(function(){
    var view = $(this).html();
    if (view=="ENERGY MODE") {
        $(this).html("COST MODE");
        viewcostenergy = "cost";
    } else {
        $(this).html("ENERGY MODE");
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

// Load and draw the bar graph for the most recent `days` days up to now.
function load_last_days(days) {
    var end = (new Date()).getTime();
    bargraph_load(end - 3600000*24.0*days, end);
    bargraph_draw();
}

// Total kWh from a power series (W): integrate each interval, skipping gaps of an
// hour or more, and treating a null reading as zero.
function integrate_kwh(series) {
    var kwh = 0;
    for (var i = 0; i < series.length-1; i++) {
        var dt = (series[i+1][0] - series[i][0]) * 0.001;
        if (dt < 3600) {
            var power = (series[i][1] != null) ? series[i][1] : 0;
            kwh += (power * dt) / 3600000;
        }
    }
    return kwh;
}

// Assemble schedule_totals from precomputed per-tariff / cl / supply / combined
// entries ({ total, average }) and refresh the tariff table. cl and supply may be
// null when not applicable. tiers is aligned with tier_names.
function publish_totals(cost_mode, tiers, cl, supply, combined) {
    schedule_totals = {
        mode: cost_mode ? "cost" : "energy",
        currency: config.app["currency"].value,
        tier: {},
        combined: combined,
        cl: cl,
        supply: supply
    };
    for (var b = 0; b < tier_names.length; b++) {
        schedule_totals.tier[tier_names[b]] = tiers[b];
    }
    sched_render();
}

function powergraph_load()
{
    $("#power-graph-footer").show();
    var data_tier = [];
    view.calc_interval(1200); // npoints = 1200

    data["use"] = feed.getdata(feeds["use"].id,view.start,view.end,view.interval,0,0,1,1);
    if (cl_enabled) data["cl_use"] = feed.getdata(feeds["cl_use"].id,view.start,view.end,view.interval,0,0,1,1);
    for (var b = 0; b < tier_names.length; b++) {
        data_tier[b] = [];
    }
    if (cl_enabled) data_tier[cl_idx] = [];

    // Per-tariff energy (kWh) and cost over the displayed window, so the tariff
    // table can show the totals for the power view rather than the daily view.
    // Energy is integrated from the power feed and allocated to the tariff active
    // in each interval (at that interval's price), mirroring the daily split.
    var tier_energy = []; var tier_cost = [];
    for (var b = 0; b < tier_names.length; b++) { tier_energy[b] = 0; tier_cost[b] = 0; }
    var cl_energy = 0;

    for (var a = 0; a < data["use"].length; a++) {
        var time = data["use"][a][0];
        var pointval = data["use"][a][1];
        var tf = tier_for(tz_parts(time));
        var active = tf.tier;
        for (var b = 0; b < tier_names.length; b++) {
            data_tier[b].push([time, (b == active) ? pointval : 0]);
        }
        // Integrate this interval's energy into the active tariff's totals
        if (a < data["use"].length-1 && active != undefined) {
            var dt = (data["use"][a+1][0] - time) * 0.001;
            if (dt < 3600) {
                var kwh = (((pointval != null) ? pointval : 0) * dt) / 3600000;
                tier_energy[active] += kwh;
                tier_cost[active]   += kwh * tf.rate;
            }
        }
    }
    if (cl_enabled) {
        for (var a = 0; a < data["cl_use"].length; a++) {
            data_tier[cl_idx].push([data["cl_use"][a][0], data["cl_use"][a][1]]);
        }
        cl_energy = integrate_kwh(data["cl_use"]);
    }

    powergraph_series = [];
    for (var a = 0; a < tier_names.length; a++) {
        powergraph_series.push({
            data:data_tier[a],
            yaxis:1,
            stack: cl_enabled ? 0 : false,
            color:tier_colour(a),
            lines:{show:true, fill:0.8, lineWidth:0}
        });
    }
    // Stack the controlled load power on top of the tariff tiers
    if (cl_enabled) {
        powergraph_series.push({
            data:data_tier[cl_idx],
            yaxis:1,
            stack:1,
            color:tier_colour(cl_idx),
            lines:{show:true, fill:0.8, lineWidth:0}
        });
    }

    var feedstats = {};
    feedstats["use"] = stats(data["use"]);
    if (cl_enabled) feedstats["cl_use"] = stats(data["cl_use"]);

    var kwh_in_window = 0.0;
    // Start with the controlled load total
    if (cl_enabled) {
        var cl_elapsed = (data["cl_use"][data["cl_use"].length-1][0] - data["cl_use"][0][0])*0.001;
        kwh_in_window = (feedstats["cl_use"].mean * cl_elapsed) / 3600000;
    }
    // then add each of the tiers
    kwh_in_window += integrate_kwh(data["use"]);

    $("#window-kwh").html(kwh_in_window.toFixed(1));

    // Publish per-tariff totals/averages for the displayed window so the tariff
    // table tracks the power view. Averages are per day over the window length.
    var cost_mode = (viewcostenergy == "cost");
    var show_supply = (cost_mode && supply > 0);
    var ndays = (view.end - view.start) / (3600*24*1000);
    if (ndays <= 0) ndays = 1;
    var avg = function(total){ return total / ndays; };

    var grand_total = 0;
    var tiers = [];
    for (var b = 0; b < tier_names.length; b++) {
        var val = cost_mode ? tier_cost[b] : tier_energy[b];
        grand_total += val;
        tiers[b] = { total: val, average: avg(val) };
    }
    var cl_entry = null;
    if (cl_enabled) {
        var clval = cost_mode ? cl_energy * cl_rate : cl_energy;
        grand_total += clval;
        cl_entry = { total: clval, average: avg(clval) };
    }
    var supply_entry = null;
    if (show_supply) {
        var supply_total = supply * ndays;
        grand_total += supply_total;
        supply_entry = { total: supply_total, average: avg(supply_total) };
    }
    publish_totals(cost_mode, tiers, cl_entry, supply_entry, { total: grand_total, average: avg(grand_total) });

    var out = "";
    for (var z in feedstats) {
        out += "<tr>";
        out += "<td style='text-align:left'>"+z+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].minval.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].maxval.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].diff.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].mean.toFixed(0)+"</td>";
        out += "<td style='text-align:center'>"+feedstats[z].stdev.toFixed(0)+"</td>";
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
    $("#power-graph-footer").hide();
    $("#advanced-toggle").html("SHOW DETAIL");
    $("#advanced-block").hide();

    // Align the requested window to whole local days.
    var dayms = 3600*24*1000;
    end = Math.ceil(end/dayms)*dayms;
    start = Math.floor(start/dayms)*dayms;

    // Fetch the accumulated kWh feeds as half-hourly energy deltas using the
    // standard fixed interval getdata API in delta mode. Delta mode returns the
    // kWh consumed within each half-hour interval and automatically fills the
    // current (incomplete) interval with the live feed value, so today's partial
    // usage is included without any special casing. The controlled load is
    // fetched in exactly the same way for consistency.
    // getdata(id, start, end, interval, average, delta, skipmissing, limitinterval)
    var halfhour = 1800; // seconds
    var use_data = feed.getdata(feeds["use_kwh"].id, start, end, halfhour, 0, 1, 0, 0);
    var cl_data = false;
    if (cl_enabled) cl_data = feed.getdata(feeds["cl_kwh"].id, start, end, halfhour, 0, 1, 0, 0);

    // Group the half-hourly energy into per-day, per-tier buckets. Each half hour
    // falls entirely within a single tariff tier, determined by its time of day
    // and whether the day is a weekday or a weekend/public holiday.
    // Each half hour maps to one tariff (by its half-hour slot and whether the
    // day is a weekday or weekend/public holiday) at that slot's price, so we
    // accumulate both energy (kWh) and cost (kWh x price) per day, per tariff.
    var day_list = [];    // ordered list of day-start timestamps (ms)
    var day_index = {};   // "YYYY-MM-DD" day key -> index into the arrays below
    var daily_energy = []; // daily_energy[d][tier] = kWh
    var daily_cost = [];   // daily_cost[d][tier] = currency
    var daily_cl = [];     // daily_cl[d] = kWh

    function day_bucket(ms, parts) {
        if (day_index[parts.daykey] === undefined) {
            day_index[parts.daykey] = day_list.length;
            day_list.push(tz_day_start(ms, parts));
            var e = [], c = [];
            for (var a = 0; a < tier_names.length; a++) { e[a] = 0; c[a] = 0; }
            daily_energy.push(e);
            daily_cost.push(c);
            daily_cl.push(0);
        }
        return day_index[parts.daykey];
    }

    for (var z = 0; z < use_data.length; z++) {
        var kwh = use_data[z][1];
        if (kwh == null) continue;
        var p = tz_parts(use_data[z][0]);
        var tf = tier_for(p);
        if (tf.tier == undefined) continue;
        var idx = day_bucket(use_data[z][0], p);
        daily_energy[idx][tf.tier] += kwh;
        daily_cost[idx][tf.tier] += kwh * tf.rate;
    }
    if (cl_enabled && cl_data) {
        for (var z = 0; z < cl_data.length; z++) {
            var kwh = cl_data[z][1];
            if (kwh == null) continue;
            daily_cl[day_bucket(cl_data[z][0], tz_parts(cl_data[z][0]))] += kwh;
        }
    }

    // Build the display series and running totals. Cost mode uses the accumulated
    // cost; the daily supply charge is added in cost mode when configured.
    var cost_mode = (viewcostenergy == "cost");
    var show_supply = (cost_mode && supply > 0);

    for (var a = 0; a < tier_names.length; a++) data[tier_names[a]] = [];
    if (cl_enabled) data["cl"] = [];
    if (show_supply) data["sc"] = [];

    var tier_total = [];
    for (var a = 0; a < tier_names.length; a++) tier_total[a] = 0;
    var cl_total = 0;
    var supply_total = 0;
    var grand_total = 0;

    for (var i = 0; i < day_list.length; i++) {
        var dayts = day_list[i];
        for (var a = 0; a < tier_names.length; a++) {
            var val = cost_mode ? daily_cost[i][a] : daily_energy[i][a];
            data[tier_names[a]].push([dayts, val]);
            tier_total[a] += val;
            grand_total += val;
        }
        if (cl_enabled) {
            var clval = cost_mode ? daily_cl[i] * cl_rate : daily_cl[i];
            data["cl"].push([dayts, clval]);
            cl_total += clval;
            grand_total += clval;
        }
        if (show_supply) {
            data["sc"].push([dayts, supply]);
            supply_total += supply;
            grand_total += supply;
        }
    }

    // Assemble the stacked bar series in display order, attaching a label to each
    // so the tooltip can read values back without fragile index arithmetic.
    var bar = { show: true, align: "left", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth:0 };
    bargraph_series = [];

    if (show_supply) {
        bargraph_series.push({ stack: true, label: "Supply", data: data["sc"], color: "#aa4466", bars: bar });
    }
    for (var a = 0; a < tier_names.length; a++) {
        bargraph_series.push({ stack: true, label: tier_names[a], data: data[tier_names[a]], color: tier_colour(a), bars: bar });
    }
    if (cl_enabled) {
        bargraph_series.push({ stack: true, label: "Controlled Load", data: data["cl"], color: tier_colour(cl_idx), bars: bar });
    }

    // Totals cover the whole window; averages are taken over complete days only
    // so the partial current day does not drag the daily average down.
    var today_idx = day_index[tz_parts((new Date()).getTime()).daykey];
    var today_present = (today_idx !== undefined);
    var n_complete = day_list.length - (today_present ? 1 : 0);

    var today_tier = [];
    for (var a = 0; a < tier_names.length; a++) {
        today_tier[a] = today_present ? data[tier_names[a]][today_idx][1] : 0;
    }
    var today_cl     = (cl_enabled  && today_present) ? data["cl"][today_idx][1] : 0;
    var today_supply = (show_supply && today_present) ? data["sc"][today_idx][1] : 0;
    var today_total  = today_cl + today_supply;
    for (var a = 0; a < tier_names.length; a++) today_total += today_tier[a];

    var avg = function(total, today_val) {
        if (n_complete <= 0) return 0;
        return (total - today_val) / n_complete;
    };

    // Publish per-tariff totals and averages for the schedule table to display,
    // then refresh it so the figures track the currently shown window.
    var tiers = [];
    for (var a = 0; a < tier_names.length; a++) {
        tiers[a] = { total: tier_total[a], average: avg(tier_total[a], today_tier[a]) };
    }
    publish_totals(cost_mode, tiers,
        cl_enabled  ? { total: cl_total, average: avg(cl_total, today_cl) } : null,
        show_supply ? { total: supply_total, average: avg(supply_total, today_supply) } : null,
        { total: grand_total, average: avg(grand_total, today_total) });

    // "Use today" headline: today's tariff tiers plus controlled load
    // (the daily supply charge is excluded from this figure).
    var use_today = today_cl;
    for (var a = 0; a < tier_names.length; a++) use_today += today_tier[a];

    if (cost_mode) {
        $("#kwh_today").html(config.app["currency"].value + use_today.toFixed(2));
    } else {
        $("#kwh_today").html(use_today.toFixed(1)+" kWh");
    }
}

function bargraph_draw()
{
    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            minTickSize: [1, "day"],
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
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();
    var height = width*0.6;
    if (height>500) height = 500;

    if (height>width) height = width;

    //console.log(width+" "+height);

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);

    if (width<=500) {
        $(".electric-title").css("font-size","16px");
        $(".power-value").css("font-size","38px");
    } else if (width<=724) {
        $(".electric-title").css("font-size","18px");
        $(".power-value").css("font-size","42px");
    } else {
        $(".electric-title").css("font-size","22px");
        $(".power-value").css("font-size","42px");
    }
}

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
    });
});

// ----------------------------------------------------------------------
// Timezone helpers
// ----------------------------------------------------------------------
// All day/tier allocation is done against the user's configured timezone
// (user_timezone) rather than the browser's, so the daily split is correct
// even when the two differ.
function pad2(n) { return (n<10 ? "0" : "") + n; }

// Built lazily on first use so it is always ready regardless of script
// execution order, falling back to UTC if the configured timezone is invalid.
var tz_format = null;
function get_tz_format() {
    if (!tz_format) {
        var opts = {
            timeZone: user_timezone, hourCycle: 'h23',
            weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        };
        try {
            tz_format = new Intl.DateTimeFormat('en-GB', opts);
        } catch (e) {
            opts.timeZone = 'UTC';
            tz_format = new Intl.DateTimeFormat('en-GB', opts);
        }
    }
    return tz_format;
}

// Resolve a timestamp (ms) to its wall-clock parts in the configured timezone.
function tz_parts(ms) {
    var p = {};
    var arr = get_tz_format().formatToParts(new Date(ms));
    for (var i = 0; i < arr.length; i++) p[arr[i].type] = arr[i].value;
    return {
        daykey:  p.year+"-"+p.month+"-"+p.day, // "YYYY-MM-DD"
        weekday: p.weekday,                    // "Mon".."Sun"
        hour:    parseInt(p.hour,10),
        minute:  parseInt(p.minute,10)
    };
}

// Real timestamp (ms) of local midnight for the day containing ms. Half-hourly
// points sit on whole/half-hour boundaries so this is exact in practice.
function tz_day_start(ms, parts) {
    return ms - (parts.hour*60 + parts.minute)*60*1000;
}

// ----------------------------------------------------------------------
// Weekend or Public Holiday
// ----------------------------------------------------------------------
function we_ph (parts) {
    if (parts.weekday == "Sat" || parts.weekday == "Sun") return true;
    return public_holidays[parts.daykey] === true;
}

// ----------------------------------------------------------------------
// Schedule builder
// ----------------------------------------------------------------------
// Shown below the chart for users with write access; reads/writes the same
// config values the calculations use (wd_times, we_times, ph_days).

function sched_attr(s) { return ("" + s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

// Run fn against each schedule profile's block array (weekday then weekend).
function for_each_profile(fn) { fn(schedule.weekday); fn(schedule.weekend); }

// Index of a tariff by name (position in the tariffs list = colour + chart index)
function tariff_idx(name) {
    for (var i = 0; i < tariffs.length; i++) if (tariffs[i].name == name) return i;
    return 0;
}

// Make a tariff name unique against the other tariffs (ignore_index is excluded).
function unique_tariff_name(base, ignore_index) {
    var name = base, n = 2;
    var taken = function(nm){
        for (var i = 0; i < tariffs.length; i++) if (i !== ignore_index && tariffs[i].name == nm) return true;
        return false;
    };
    while (taken(name)) { name = base + " " + n; n++; }
    return name;
}

function sched_time_options(selected) {
    var html = "";
    for (var s = 0; s < 48; s++) {
        var t = slot_to_time(s);
        html += '<option value="'+t+'"'+(t==selected ? ' selected' : '')+'>'+t+'</option>';
    }
    return html;
}

// Tariff dropdown for a schedule block; includes the current value even if it is
// no longer a defined tariff so the reference isn't silently lost.
function tariff_options(selected) {
    var html = "", found = false;
    for (var i = 0; i < tariffs.length; i++) {
        var n = tariffs[i].name;
        if (n == selected) found = true;
        html += '<option value="'+sched_attr(n)+'"'+(n == selected ? ' selected' : '')+'>'+sched_attr(n)+'</option>';
    }
    if (!found && selected) html = '<option value="'+sched_attr(selected)+'" selected>'+sched_attr(selected)+'</option>' + html;
    return html;
}

// Format a totals/averages figure for the currently displayed mode.
function sched_fmt(v, perday) {
    if (!schedule_totals) return "";
    v = v || 0;
    if (schedule_totals.mode == "cost") {
        return schedule_totals.currency + v.toFixed(2) + (perday ? "/day" : "");
    }
    return v.toFixed(1) + (perday ? " kWh/d" : " kWh");
}

// Stage 1: tariff definitions, with per-tariff totals/averages against the names.
function tariffs_render() {
    var totals = schedule_totals ? schedule_totals.tier : {};
    var html = "";
    for (var i = 0; i < tariffs.length; i++) {
        var t = tariffs[i];
        var swatch = '<span class="sched-swatch" style="background:'+tier_colour(i)+'"></span>';
        var tot = "", avgv = "";
        if (totals[t.name]) { tot = sched_fmt(totals[t.name].total, false); avgv = sched_fmt(totals[t.name].average, true); }

        html += '<tr data-index="'+i+'">';
        if (sched_editing) {
            html += '<td><div style="display:flex; align-items:center;">'+swatch
                  +   '<input type="text" class="tariff-name" style="flex:1" data-oldname="'+sched_attr(t.name)+'" value="'+sched_attr(t.name)+'" placeholder="Tariff name"></div></td>'
                  + '<td><input type="number" step="0.001" min="0" class="tariff-price" value="'+t.price+'"></td>';
        } else {
            html += '<td>'+swatch+sched_attr(t.name)+'</td>'
                  + '<td class="sched-ro-price">'+t.price+'</td>';
        }
        html += '<td class="sched-total">'+tot+'</td>'
              + '<td class="sched-average">'+avgv+'</td>'
              + '<td class="sched-actions-cell"><span class="tariff-del" title="Remove tariff">&#10005;</span></td>'
              + '</tr>';
    }
    $("#tariff-rows").html(html);

    // Footer: combined total, plus controlled load / supply where applicable
    var foot = "";
    var foot_row = function(label, t) {
        var r = '<tr><td class="sched-foot-label" colspan="2">'+label+'</td>'
              + '<td class="sched-total">'+sched_fmt(t.total,false)+'</td>'
              + '<td class="sched-average">'+sched_fmt(t.average,true)+'</td>';
        if (sched_editing) r += '<td class="sched-actions-cell"></td>';
        return r + '</tr>';
    };
    if (schedule_totals) {
        foot += foot_row("Combined", schedule_totals.combined);
        if (schedule_totals.cl) foot += foot_row("Controlled load", schedule_totals.cl);
        if (schedule_totals.supply) foot += foot_row("Supply", schedule_totals.supply);
    }
    $("#tariff-foot").html(foot);
}

// Stage 2: when each tariff applies (weekday / weekend), no prices or totals here.
function schedule_render() {
    $(".sched-tab").removeClass("active");
    $('.sched-tab[data-tab="'+sched_tab+'"]').addClass("active");

    var blocks = schedule[sched_tab];
    blocks.sort(function(a,b){ return time_to_slot(a.start) - time_to_slot(b.start); });

    var html = "";
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var swatch = '<span class="sched-swatch" style="background:'+tier_colour(tariff_idx(b.name))+'"></span>';
        html += '<tr data-index="'+i+'">';
        if (sched_editing) {
            html += '<td><select class="sched-time">'+sched_time_options(b.start)+'</select></td>'
                  + '<td><div style="display:flex; align-items:center;">'+swatch
                  +   '<select class="sched-tariff">'+tariff_options(b.name)+'</select></div></td>';
        } else {
            html += '<td class="sched-ro-time">'+b.start+'</td>'
                  + '<td>'+swatch+sched_attr(b.name)+'</td>';
        }
        html += '<td class="sched-actions-cell"><span class="block-del" title="Remove this block">&#10005;</span></td>'
              + '</tr>';
    }
    $("#sched-rows").html(html);
}

function sched_render() {
    $("#schedule-builder").toggleClass("editing", sched_editing);
    tariffs_render();
    schedule_render();
}

function schedule_show() {
    $(".sched-cur").text(config.app["currency"].value || "");
    $("#sched-ph").val(config.app["ph_days"].value || "");
    $(".sched-configure").toggle(!!sessionwrite); // configure only with write access
    sched_render();
    $("#schedule-builder").show();
}

// Persist config.db to the server, properly URL-encoded, and sync config.app
// values from it. Returns { ok, message }. (config.set() in appconf.js sends the
// config unencoded and trips over the failure path, so we save directly here.)
function config_save_db() {
    var result = { ok: false, message: "" };
    try {
        $.ajax({
            url: path + "app/setconfig",
            data: { id: config.id, config: JSON.stringify(config.db) }, // object -> URL-encoded
            dataType: "text",
            async: false,
            success: function(text){
                try {
                    var r = JSON.parse(text);
                    result.ok = (r.success !== false);
                    if (!result.ok) result.message = r.message || "rejected";
                } catch (e) { result.message = "invalid server response"; }
            },
            error: function(xhr){ result.message = "request failed (" + xhr.status + ")"; }
        });
    } catch (e) { result.message = "" + e; }

    // Sync config.app[*].value from the saved config.db
    for (var key in config.app) {
        var t = config.app[key].type;
        if ((t == "value" || t == "feed" || t == "checkbox" || t == "select") && config.db[key] !== undefined) {
            config.app[key].value = config.db[key];
        }
    }
    return result;
}

function sched_save() {
    // Stage 1: normalise tariffs. Names must avoid the separators used by the
    // stored formats (":" "," "=") and quotes/backslashes, and be unique.
    var seen = {}, clean_tariffs = [];
    for (var i = 0; i < tariffs.length; i++) {
        var n = ("" + tariffs[i].name).replace(/[:,="\\]/g,"").trim() || "Tariff";
        if (seen[n]) continue; // drop duplicate names
        seen[n] = true;
        clean_tariffs.push({ name: n, price: parseFloat(tariffs[i].price) || 0 });
    }
    if (clean_tariffs.length == 0) clean_tariffs.push({ name:"Tariff", price:0 });
    tariffs = clean_tariffs;
    var valid = {};
    for (var i = 0; i < tariffs.length; i++) valid[tariffs[i].name] = true;
    var fallback = tariffs[0].name;

    // Stage 2: normalise blocks (snap to half hour, keep only valid tariff names).
    var clean = function(blocks) {
        var out = [];
        for (var i = 0; i < blocks.length; i++) {
            var nm = ("" + blocks[i].name).trim();
            out.push({ start: norm_time(blocks[i].start), name: valid[nm] ? nm : fallback });
        }
        out.sort(function(a,b){ return time_to_slot(a.start) - time_to_slot(b.start); });
        if (out.length == 0) out.push({ start:"00:00", name: fallback });
        return out;
    };
    schedule.weekday = clean(schedule.weekday);
    schedule.weekend = clean(schedule.weekend);

    // Serialise to compact, quote-free strings (see parse_blocks)
    var serialise = function(blocks){ return blocks.map(function(b){ return b.start + "=" + b.name; }).join(","); };
    config.db["tier_cost"] = tariffs.map(function(t){ return t.name + ":" + t.price; }).join(",");
    config.db["wd_times"]  = serialise(schedule.weekday);
    config.db["we_times"]  = serialise(schedule.weekend);
    config.db["ph_days"]   = $("#sched-ph").val().trim();

    var status = $("#sched-status").removeClass("ok err");
    $("#sched-save").prop("disabled", true);
    var res = config_save_db();      // persist + sync config.app values
    init();                          // rebuild tariffs + half-hourly profiles
    sched_editing = false;           // return to the read-only view
    clearInterval(updaterinst);
    show();                          // recalculate totals, redraw chart, panels and the builder
    if (res.ok) {
        status.addClass("ok").text("Saved");
    } else {
        status.addClass("err").text("Could not save: " + res.message);
        app_log("ERROR", "Schedule save failed: " + res.message);
    }
    $("#sched-save").prop("disabled", false);
    setTimeout(function(){ $("#sched-status").removeClass("ok err").text(""); }, 4000);
}

// Configure (wrench) toggles between the read-only view and edit mode. Leaving
// edit mode without saving discards unsaved changes by reloading from config.
$("#schedule-builder").on("click", ".sched-configure", function(){
    if (!sessionwrite) return;
    if (sched_editing) {
        init();
        sched_editing = false;
    } else {
        sched_editing = true;
        $(".sched-cur").text(config.app["currency"].value || "");
        $("#sched-ph").val(config.app["ph_days"].value || "");
    }
    sched_render();
});

$("#schedule-builder").on("click", ".sched-tab", function(){
    sched_tab = $(this).attr("data-tab");
    schedule_render();
});

// ---- Tariffs (stage 1) editing ----
$("#schedule-builder").on("click", ".tariff-add", function(){
    tariffs.push({ name: unique_tariff_name("New tariff", -1), price: 0 });
    sched_render();
});

$("#schedule-builder").on("click", ".tariff-del", function(){
    var i = $(this).closest("tr").attr("data-index")*1;
    var name = tariffs[i] ? tariffs[i].name : "";
    var used = false;
    for_each_profile(function(blocks){
        blocks.forEach(function(b){ if (b.name == name) used = true; });
    });
    if (used) {
        $("#sched-status").removeClass("ok").addClass("err")
            .text('"'+name+'" is used in the schedule — remove those blocks first');
        setTimeout(function(){ $("#sched-status").removeClass("err").text(""); }, 4000);
        return;
    }
    tariffs.splice(i, 1);
    if (tariffs.length == 0) tariffs.push({ name:"Tariff", price:0 });
    sched_render();
});

$("#schedule-builder").on("change", ".tariff-name", function(){
    var i = $(this).closest("tr").attr("data-index")*1;
    var oldName = $(this).attr("data-oldname");
    var newName = unique_tariff_name((($(this).val()||"").replace(/[:,]/g,"").trim()) || "Tariff", i);
    if (newName != oldName) {
        // propagate the rename to schedule blocks that reference it
        for_each_profile(function(blocks){
            blocks.forEach(function(b){ if (b.name == oldName) b.name = newName; });
        });
    }
    tariffs[i].name = newName;
    sched_render();
});

$("#schedule-builder").on("input", ".tariff-price", function(){
    var i = $(this).closest("tr").attr("data-index")*1;
    tariffs[i].price = parseFloat($(this).val()) || 0;
});

// ---- Schedule (stage 2) editing ----
$("#schedule-builder").on("click", ".block-add", function(){
    var blocks = schedule[sched_tab];
    var used = {};
    for (var i = 0; i < blocks.length; i++) used[time_to_slot(blocks[i].start)] = true;
    var slot = 0; while (slot < 48 && used[slot]) slot++;
    if (slot >= 48) slot = 47;
    var name = blocks.length ? blocks[blocks.length-1].name : (tariffs[0] ? tariffs[0].name : "Tariff");
    blocks.push({ start: slot_to_time(slot), name: name });
    schedule_render();
});

$("#schedule-builder").on("click", ".block-del", function(){
    var i = $(this).closest("tr").attr("data-index");
    schedule[sched_tab].splice(i, 1);
    if (schedule[sched_tab].length == 0) schedule[sched_tab].push({ start:"00:00", name: (tariffs[0] ? tariffs[0].name : "Tariff") });
    schedule_render();
});

$("#schedule-builder").on("change", ".sched-time", function(){
    var i = $(this).closest("tr").attr("data-index");
    schedule[sched_tab][i].start = $(this).val();
    schedule_render(); // keep rows time-ordered
});

$("#schedule-builder").on("change", ".sched-tariff", function(){
    var i = $(this).closest("tr").attr("data-index");
    schedule[sched_tab][i].name = $(this).val();
    schedule_render(); // refresh the colour swatch
});

$("#sched-save").click(function(){ sched_save(); });

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
