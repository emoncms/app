// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

var profile_mode = false;

var show_carbonintensity = $("#show_carbonintensity")[0].checked;

var flow_colors_original = {
    "solar_to_load":    "#bec745",
    "solar_to_battery": "#a3d977",
    "solar_to_grid":    "#dccc1f",
    "battery_to_load":  "#fbb450",
    "battery_to_grid":  "#f0913a",
    "grid_to_load":     "#44b3e2",
    "grid_to_battery":  "#82cbfc"
};

const flow_colors = {
    "solar_to_load":    "#a4c341", // changed from #abddff
    "solar_to_battery": "#fba050", 
    "solar_to_grid":    "#dccc1f",
    "battery_to_load":  "#ffd08e",
    "battery_to_grid":  "#fabb68",
    "grid_to_load":     "#82cbfc",
    "grid_to_battery":  "#fb7b50"
};

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$(window).ready(function() {
    //$("#footer").css('background-color','#181818');
    //$("#footer").css('color','#999');
});

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------

var tariff_options = [
    "AGILE-18-02-21",
    "AGILE-22-07-22",
    "AGILE-22-08-31",
    "AGILE-23-12-06",
    "AGILE-24-10-01",
    //"AGILE-VAR-22-10-19",
    //"AGILE-FLEX-22-11-25",
    "GO-VAR-22-10-14",
    "INTELLI-FLUX-IMPORT-23-07-14",
    "INTELLI-VAR-22-10-14",
    "INTELLI-VAR-24-10-29",
    "INTELLI-VAR-OEV-24-07-17",
    "SNUG-24-11-07",
    "COSY-22-12-08",
    "FLUX-IMPORT-23-02-14"
    // Custom opens tariff builder
    // "CUSTOM"
];

config.app = {
    "title": {
        "type": "value",
        "default": "Tariff Explorer",
        "name": "Title",
        "description": "Optional title for app"
    },

    // == System configuration ==
    // Select which metering points are present on the system.
    // When has_solar=false, the solar feed is hidden and solar power is treated as 0.
    // When has_battery=false, the battery feed is hidden and battery power is treated as 0.
    // In each mode, conservation of energy allows one feed to be derived from the others:
    //   Full (solar+battery): GRID=USE-SOLAR-BATTERY, USE=GRID+SOLAR+BATTERY, SOLAR=USE-GRID-BATTERY, BATTERY=USE-GRID-SOLAR
    //   Solar only:           GRID=USE-SOLAR,         USE=GRID+SOLAR,         SOLAR=USE-GRID
    //   Battery only:         GRID=USE-BATTERY,       USE=GRID+BATTERY,       BATTERY=USE-GRID
    //   Consumption only:     no derivation; only USE (or GRID) feed needed
    "has_solar":{"type":"checkbox", "default":1, "name":"Has solar PV", "description":"Does the system have solar PV generation?"},
    "has_battery":{"type":"checkbox", "default":1, "name":"Has battery", "description":"Does the system have a battery?"},

    // == Key power feeds ==
    // All four feeds are optional at the config level; the custom check() below enforces the
    // correct minimum set depending on the has_solar / has_battery mode.
    // Any single missing feed will be derived from the other three (or two in solar/battery-only modes).
    // These power feeds are used to auto-generate the cumulative kWh feeds below.
    "use":{"optional":true, "type":"feed", "autoname":"use", "description":"House or building use in watts"},
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "description":"Solar generation in watts (only shown when has_solar is enabled)"},
    "battery":{"optional":true, "type":"feed", "autoname":"battery_power", "description":"Battery power in watts, positive for discharge, negative for charge (only shown when has_battery is enabled)"},
    "grid":{"optional":true, "type":"feed", "autoname":"grid", "description":"Grid power in watts (positive for import, negative for export)"},

    // We actually use this cumulative kWh feeds to generate the half hourly data
    // the power feeds above are used to auto-generate these feeds.

    // Node name for auto-generated feeds, common with mysolarpvbattery app.
    "autogenerate_nodename": {
        "hidden": true,
        "type": "value",
        "default": "solar_battery_kwh_flows",
        "name": "Auto-generate feed node name",
        "description": ""
    },

    // Auto-generated cumulative kWh feeds 
    "solar_to_load_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_load_kwh",
        "description": "Cumulative solar to load energy in kWh"
    },
    "solar_to_grid_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_grid_kwh",
        "description": "Cumulative solar to grid (export) energy in kWh"
    },
    "solar_to_battery_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_battery_kwh",
        "description": "Cumulative solar to battery energy in kWh"
    },
    "battery_to_load_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "battery_to_load_kwh",
        "description": "Cumulative battery to load energy in kWh"
    },
    "battery_to_grid_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "battery_to_grid_kwh",
        "description": "Cumulative battery to grid energy in kWh"
    },
    "grid_to_load_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "grid_to_load_kwh",
        "description": "Cumulative grid to load energy in kWh"
    },
    "grid_to_battery_kwh": {
        "autogenerate":true,
        "optional": true,
        "type": "feed",
        "autoname": "grid_to_battery_kwh",
        "description": "Cumulative grid to battery energy in kWh"
    },
    
    "meter_kwh_hh": {
        "optional": true,
        "type": "feed",
        "autoname": "meter_kwh_hh"
    },

    "region": {
        "type": "select",
        "name": "Select region:",
        "default": "D_Merseyside_and_Northern_Wales",
        "options": ["A_Eastern_England", "B_East_Midlands", "C_London", "E_West_Midlands", "D_Merseyside_and_Northern_Wales", "F_North_Eastern_England", "G_North_Western_England", "H_Southern_England", "J_South_Eastern_England", "K_Southern_Wales", "L_South_Western_England", "M_Yorkshire", "N_Southern_Scotland", "P_Northern_Scotland"]
    },

    "tariff": {
        "type": "select",
        "name": "Select tariff:",
        "default": "AGILE-23-12-06",
        "options": tariff_options
    }
};


// ----------------------------------------------------------------------
// Custom check: enforce the correct minimum set of feeds based on mode.
// This overrides the appconf.js default check() which just tests optional flags.
// Rules:
//   has_solar + has_battery: at least 3 of (use, solar, battery, grid) must be configured
//   has_solar only:          at least 2 of (use, solar, grid) must be configured
//   has_battery only:        at least 2 of (use, battery, grid) must be configured
//   consumption only:        at least 1 of (use, grid) must be configured
// ----------------------------------------------------------------------
config.check = function() {
    // Read mode from db (persisted) or app default
    var has_solar   = (config.db.has_solar   !== undefined) ? (config.db.has_solar   != 0) : (config.app.has_solar.default   != 0);
    var has_battery = (config.db.has_battery !== undefined) ? (config.db.has_battery != 0) : (config.app.has_battery.default != 0);

    // Helper: is a feed key resolved (either auto-matched by name or explicitly set in db)?
    function feed_resolved(key) {
        if (config.db[key] == "disable") return false; // explicitly disabled
        if (config.db[key] != undefined) {
            // user-set: check the feed id still exists
            return config.feedsbyid[config.db[key]] !== undefined;
        }
        // auto-match by name
        var autoname = config.app[key] && config.app[key].autoname;
        return autoname && config.feedsbyname[autoname] !== undefined;
    }

    var use_ok   = feed_resolved("use");
    var solar_ok = feed_resolved("solar");
    var bat_ok   = feed_resolved("battery");
    var grid_ok  = feed_resolved("grid");

    if (has_solar && has_battery) {
        // Need at least 3 of the 4 feeds
        return [use_ok, solar_ok, bat_ok, grid_ok].filter(Boolean).length >= 3;
    } else if (has_solar && !has_battery) {
        // Need at least 2 of (use, solar, grid)
        return [use_ok, solar_ok, grid_ok].filter(Boolean).length >= 2;
    } else if (!has_solar && has_battery) {
        // Need at least 2 of (use, battery, grid)
        return [use_ok, bat_ok, grid_ok].filter(Boolean).length >= 2;
    } else {
        // Consumption only: need at least 1 of (use, grid)
        return use_ok || grid_ok;
    }
};


config.feeds = feed.list();

var feeds_by_tag_name = feed.by_tag_and_name(config.feeds);

config.autogen_feed_defaults = { datatype: 1, engine: 5, options: { interval: 1800 } };
config.autogen_feeds_by_tag_name = feeds_by_tag_name;


config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// Config UI helpers: hide/show feeds based on the current mode
// ----------------------------------------------------------------------
function get_mode() {
    var has_solar   = (config.db.has_solar   !== undefined) ? (config.db.has_solar   != 0) : (config.app.has_solar.default   != 0);
    var has_battery = (config.db.has_battery !== undefined) ? (config.db.has_battery != 0) : (config.app.has_battery.default != 0);
    return { has_solar: has_solar, has_battery: has_battery };
}

// Called by appconf.js before rendering the config UI
config.ui_before_render = function() {
    var mode = get_mode();

    // solar feed: only relevant if has_solar is on
    config.app.solar.hidden         = !mode.has_solar;
    // battery feeds: only relevant if has_battery is on
    config.app.battery.hidden = !mode.has_battery;
    // autogenerate feeds: hide battery-specific ones if no battery, solar-specific if no solar
    config.app.solar_to_load_kwh.hidden    = !mode.has_solar;
    config.app.solar_to_grid_kwh.hidden    = !mode.has_solar;
    config.app.solar_to_battery_kwh.hidden = !mode.has_battery || !mode.has_solar;
    config.app.battery_to_load_kwh.hidden  = !mode.has_battery;
    config.app.battery_to_grid_kwh.hidden  = !mode.has_battery;
    config.app.grid_to_battery_kwh.hidden  = !mode.has_battery;
};

// Called by appconf.js after any config value is changed; re-renders UI when a mode checkbox changes
config.ui_after_value_change = function(key) {
    if (key === 'has_solar' || key === 'has_battery') {
        config.UI();
    }
    render_autogen_feed_list();
};

var octopus_feed_list = {};

var regions_outgoing = {
    "A_Eastern_England": 399374,
    "B_East_Midlands": 399361,
    "C_London": 399362,
    "D_Merseyside_and_Northern_Wales": 399363,
    "E_West_Midlands": 399364,
    "F_North_Eastern_England": 399365,
    "G_North_Western_England": 399366,
    "H_Southern_England": 399367,
    "J_South_Eastern_England": 399368,
    "K_Southern_Wales": 399369,
    "L_South_Western_England": 399370,
    "M_Yorkshire": 399371,
    "N_Southern_Scotland": 399372,
    "P_Northern_Scotland": 399373
}

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};
var data = {};
var time_to_index_map = {};
var graph_series = [];
var previousPoint = false;
var panning = false;
var flot_font_size = 12;
var updaterinst = false;
var this_halfhour_index = -1;
// disable x axis limit
view.limit_x = false;
var smart_meter_data = false;
var use_meter_kwh_hh = false;

var profile_kwh = {};
var profile_cost = {};

var monthly_summary = {};
var baseline_monthly_summary = {};
var baseline_tariff_name = "";

config.init();

function init() {

    // Display setup
    $("body").css('background-color','#222');
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');

    var mode = get_mode();

    // Apply hidden flags (also used by autogen feed list and config UI)
    config.ui_before_render();

    render_autogen_feed_list();

    $("#datetimepicker1").datetimepicker({
        language: 'en-EN'
    });

    $("#datetimepicker2").datetimepicker({
        language: 'en-EN'
    });

    datetimepicker1 = $('#datetimepicker1').data('datetimepicker');
    datetimepicker2 = $('#datetimepicker2').data('datetimepicker');
}

function show() {
    $("#app-title").html(config.app.title.value);

    // Quick translation of feed ids
    feeds = {};

    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];
    }

    resize();

    $.ajax({
        url: path + "app/octopus-feed-list",
        dataType: 'json',
        async: false,
        success: function(result) {
            for (var z in result) {
                var tag = result[z].tag;
                if (octopus_feed_list[tag] == undefined) octopus_feed_list[tag] = {};
                octopus_feed_list[tag][result[z].name] = parseInt(result[z].id);
            }
        }
    });

    setPeriod('168');
    $(".time-select").val('168');
    graph_load();
    graph_draw();

    updater();
    updaterinst = setInterval(updater, 5000);
    $(".ajax-loader").hide();

    // Trigger process here
    setTimeout(function() {
        start_post_processor();
    }, 1000);
}

function setPeriod(period) {
    switch (period) {
        case 'T':
            //Today
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            view.start = d.getTime();
            d.setHours(24, 0, 0, 0);
            view.end = d.getTime();
            //view.timewindow(3600000);
            break;
        case 'Y':
            //Yesterday
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            view.end = d.getTime();
            d.setHours(-24);
            view.start = d.getTime();
            //view.timewindow(3600000);
            break;
        case 'W':
            //Week
            var d = new Date();
            view.end = d.getTime();
            d.setHours(0, 0, 0, 0);
            d.setHours(-24 * d.getDay());
            view.start = d.getTime();
            // view.timewindow(3600000);
            break;
        case 'M':
            // Month
            var d = new Date();
            view.end = d.getTime();
            d.setHours(0, 0, 0, 0);
            d.setHours(-24 * (d.getDate() - 1));
            view.start = d.getTime();
            // view.timewindow(3600000);
            break;
        case '12':
        case '24':
        case '168':
        case '720':
        case '1440':
        case '8760':
            var timeWindow = (3600000 * period);
            view.end = (new Date()).getTime();
            view.start = view.end - timeWindow;

            if (period <= 24) {
                view.end += 3600 * 4 * 1000; // show 4h of forecast for short time ranges
            }
            // view.timewindow(timeWindow);
            break;
        default:
            alert('Invalid time period');
            break;
    }
}

function hide() {
    clearInterval(updaterinst);
}

function updater() {
    feed.listbyidasync(function(result) {
        if (result === null) {
            return;
        }

        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }

        // Update live stats value for current half-hour if feeds are present
        // use grid feed for import reference.
        if (config.app.grid.value != undefined) {
            var grid_feed_id = config.app.grid.value;
            var grid_value = result[grid_feed_id] != undefined ? result[grid_feed_id].value : null;
            if (grid_value != null) {
                if (grid_value < 0) {
                    $("#import_export").html("EXPORT NOW");
                } else {
                    $("#import_export").html("IMPORT NOW");
                }
                $("#power_now").html(Math.abs(grid_value) + " W");
            }
        }

    });
}


function get_data_value_at_index(key, index) {
    if (data[key] == undefined) return null;
    if (data[key][index] == undefined) return null;
    return data[key][index][1];
}


// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - graph_load
// - graph_draw
// - resize

function graph_load(time_window_changed = true) {
    $(".power-graph-footer").show();

    var interval = 1800;
    var intervalms = interval * 1000;
    view.start = Math.ceil(view.start / intervalms) * intervalms;
    view.end = Math.ceil(view.end / intervalms) * intervalms;

    if (datetimepicker1) {
        datetimepicker1.setLocalDate(new Date(view.start));
        datetimepicker1.setEndDate(new Date(view.end));
    }
    if (datetimepicker2) {
        datetimepicker2.setLocalDate(new Date(view.end));
        datetimepicker2.setStartDate(new Date(view.start));
    }

    smart_meter_data = feeds["meter_kwh_hh"] != undefined;
    if (smart_meter_data) {
        $("#use_meter_kwh_hh_bound").show();
    }



    if (time_window_changed) {
        // Load energy flow feeds (cumulative kWh, delta=1 returns half-hourly differences directly)
        solar_to_load_kwh_data    = [];
        solar_to_grid_kwh_data    = [];
        solar_to_battery_kwh_data = [];
        battery_to_load_kwh_data  = [];
        battery_to_grid_kwh_data  = [];
        grid_to_load_kwh_data     = [];
        grid_to_battery_kwh_data  = [];
        meter_kwh_hh = [];


        if (feeds["solar_to_load_kwh"]!=undefined) {
            solar_to_load_kwh_data    = feed.getdata(feeds["solar_to_load_kwh"].id,    view.start, view.end, interval, 0, 1);
        }
        if (feeds["solar_to_grid_kwh"]!=undefined) {
            solar_to_grid_kwh_data    = feed.getdata(feeds["solar_to_grid_kwh"].id,    view.start, view.end, interval, 0, 1);
        }
        if (feeds["solar_to_battery_kwh"]!=undefined) {
            solar_to_battery_kwh_data = feed.getdata(feeds["solar_to_battery_kwh"].id, view.start, view.end, interval, 0, 1);
        }
        if (feeds["battery_to_load_kwh"]!=undefined) {
            battery_to_load_kwh_data  = feed.getdata(feeds["battery_to_load_kwh"].id,  view.start, view.end, interval, 0, 1);
        }
        if (feeds["battery_to_grid_kwh"]!=undefined) {
            battery_to_grid_kwh_data  = feed.getdata(feeds["battery_to_grid_kwh"].id,  view.start, view.end, interval, 0, 1);
        }
        if (feeds["grid_to_load_kwh"]!=undefined) {
            grid_to_load_kwh_data     = feed.getdata(feeds["grid_to_load_kwh"].id,     view.start, view.end, interval, 0, 1);
        }
        if (feeds["grid_to_battery_kwh"]!=undefined) {
            grid_to_battery_kwh_data  = feed.getdata(feeds["grid_to_battery_kwh"].id,  view.start, view.end, interval, 0, 1);
        }

        if (smart_meter_data) meter_kwh_hh = feed.getdata(feeds["meter_kwh_hh"].id, view.start, view.end, interval);
    }

    // Detect current half-hour index for live stats (use grid_to_load feed or meter as reference)
    this_halfhour_index = -1;
    var ref_data = grid_to_load_kwh_data;
    var this_halfhour = Math.floor((new Date()).getTime() / 1800000) * 1800000;
    for (var z = 0; z < ref_data.length; z++) {
        if (ref_data[z][0] == this_halfhour) {
            this_halfhour_index = z;
            break;
        }
    }

    data = {};
    data["tariff"] = []
    data["outgoing"] = []
    data["carbonintensity"] = []

    // Tariff A
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff.value] != undefined && octopus_feed_list[config.app.tariff.value][config.app.region.value] != undefined) {
        data["tariff"] = getdataremote(octopus_feed_list[config.app.tariff.value][config.app.region.value], view.start, view.end, interval);
    }

    // Outgoing (export tariff) - only needed in flow mode
    if (config.app.region != undefined) {
        data["outgoing"] = getdataremote(regions_outgoing[config.app.region.value], view.start, view.end, interval);
        // Invert export tariff so it reads as a positive earning rate
        for (var z in data["outgoing"]) data["outgoing"][z][1] *= -1;
    }

    // Carbon Intensity
    if (show_carbonintensity) {
        data["carbonintensity"] = getdataremote(428391, view.start, view.end, interval);
    }

    data["solar_to_load"] = [];
    data["solar_to_grid"] = [];
    data["solar_to_battery"] = [];
    data["battery_to_load"] = [];
    data["battery_to_grid"] = [];
    data["grid_to_load"] = [];
    data["grid_to_battery"] = [];

    data["meter_kwh_hh"] = meter_kwh_hh;
    data["meter_kwh_hh_cost"] = [];

    // Used to generate averaged profile
    profile_kwh = [];
    profile_cost = [];

    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var profile_start = d.getTime();

    for (var hh = 0; hh < 48; hh++) {
        let profile_time = profile_start + hh * 1800 * 1000;
        profile_kwh[hh] = [profile_time, 0.0]
        profile_cost[hh] = [profile_time, 0.0]
    }

    var total_template = {

        // Per-flow kWh totals
        solar_to_load_kwh:    0,
        solar_to_grid_kwh:    0,
        solar_to_battery_kwh: 0,
        battery_to_load_kwh:  0,
        battery_to_grid_kwh:  0,
        grid_to_load_kwh:     0,
        grid_to_battery_kwh:  0,

        // Per-flow value at tariff A (avoided cost / earned)
        tariff: {
            solar_to_load_value:    0,
            solar_to_grid_value:    0,
            solar_to_battery_value: 0,
            battery_to_load_value:  0,
            battery_to_grid_value:  0,
            grid_to_load_cost:      0,
            grid_to_battery_cost:   0,
        },       

        co2: 0
    }

    // assign global
    total = JSON.parse(JSON.stringify(total_template)); // deep copy
    monthly_data = {};

    // Determine data length and primary time reference
    var data_length = grid_to_load_kwh_data.length;

    for (var z = 0; z < data_length; z++) {
        let time = grid_to_load_kwh_data[z][0];

        d.setTime(time)
        let hh = d.getHours() * 2 + d.getMinutes() / 30

        // get start of month timestamp to calculate monthly data
        let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

        let kwh_import = 0;

        let kwh_solar_to_load = 0;
        let kwh_solar_to_grid = 0;
        let kwh_solar_to_battery = 0;
        let kwh_battery_to_load = 0;
        let kwh_battery_to_grid = 0;
        let kwh_grid_to_load = 0;
        let kwh_grid_to_battery = 0;

        // Read half-hourly energy flow values directly from post-processed feeds (delta=1)
        // Clamp negatives to zero for safety
        kwh_solar_to_load    = Math.max(0, get_value_at_index(solar_to_load_kwh_data, z, 0));
        kwh_solar_to_grid    = Math.max(0, get_value_at_index(solar_to_grid_kwh_data, z, 0));
        kwh_solar_to_battery = Math.max(0, get_value_at_index(solar_to_battery_kwh_data, z, 0));
        kwh_battery_to_load  = Math.max(0, get_value_at_index(battery_to_load_kwh_data, z, 0));
        kwh_battery_to_grid  = Math.max(0, get_value_at_index(battery_to_grid_kwh_data, z, 0));
        kwh_grid_to_load     = Math.max(0, get_value_at_index(grid_to_load_kwh_data, z, 0));
        kwh_grid_to_battery  = Math.max(0, get_value_at_index(grid_to_battery_kwh_data, z, 0));

        // Derive aggregate values from flows
        kwh_import = kwh_grid_to_load + kwh_grid_to_battery;
        kwh_export = kwh_solar_to_grid + kwh_battery_to_grid;
        kwh_use    = kwh_solar_to_load + kwh_battery_to_load + kwh_grid_to_load;

        // Alternatively use meter data in place of flow import data if user selected
        if (smart_meter_data && use_meter_kwh_hh) {
            kwh_import = meter_kwh_hh[z][1] != null ? meter_kwh_hh[z][1] : 0;
            kwh_grid_to_load = kwh_import;
        }

        // Unit and import cost on tariff A
        let unitcost_tariff = null;
        if (data.tariff[z] != undefined && data.tariff[z][1] != null) {
            unitcost_tariff = data.tariff[z][1] * 0.01;

            // Generate profile
            profile_kwh[hh][1] += kwh_import
            profile_cost[hh][1] += kwh_import * unitcost_tariff;
        }

        // Carbon Intensity
        if (show_carbonintensity) {
            let co2intensity = data.carbonintensity[z] != undefined ? data.carbonintensity[z][1] : null;
            if (co2intensity != null) {
                let co2_hh = kwh_import * (co2intensity * 0.001)
                total.co2 += co2_hh
            }
        }

        // All 7 disaggregated flow data arrays
        data["solar_to_load"].push([time, kwh_solar_to_load]);
        data["solar_to_grid"].push([time, kwh_solar_to_grid]);
        data["solar_to_battery"].push([time, kwh_solar_to_battery]);
        data["battery_to_load"].push([time, kwh_battery_to_load]);
        data["battery_to_grid"].push([time, kwh_battery_to_grid]);
        data["grid_to_load"].push([time, kwh_grid_to_load]);
        data["grid_to_battery"].push([time, kwh_grid_to_battery]);

        let outgoing_unit = (data.outgoing[z] != undefined && data.outgoing[z][1] != null)
            ? data.outgoing[z][1] * 0.01 * -1  // already inverted, so this is positive p/kWh
            : null;

        var flows = {
            solar_to_load:    kwh_solar_to_load,
            solar_to_grid:    kwh_solar_to_grid,
            solar_to_battery: kwh_solar_to_battery,
            battery_to_load:  kwh_battery_to_load,
            battery_to_grid:  kwh_battery_to_grid,
            grid_to_load:     kwh_grid_to_load,
            grid_to_battery:  kwh_grid_to_battery
        };

        accumulate_flows(total, flows, outgoing_unit, unitcost_tariff);

        // Accumulate monthly data
        if (monthly_data[startOfMonth] == undefined) {
            monthly_data[startOfMonth] = JSON.parse(JSON.stringify(total_template)); // deep copy
        }
        var m = monthly_data[startOfMonth];
        accumulate_flows(m, flows, outgoing_unit, unitcost_tariff);
    }

    // if (smart_meter_data && !flow_mode) {
    //     calibration_line_of_best_fit(data["import"], meter_kwh_hh);
    // }

    // Create time to index map using grid_to_load feed as reference (should be present in all modes)
    time_to_index_map = {};
    for (var z = 0; z < grid_to_load_kwh_data.length; z++) {
        time_to_index_map[grid_to_load_kwh_data[z][0]] = z;
    }

    // Clear baseline summary if time window changed (as this may affect the selected baseline period)
    if (time_window_changed) {
        baseline_monthly_summary = {};
    }

    draw_tables();
}

function get_value_at_index(data_array, index, default_value = null) {
    if (data_array[index] != undefined && data_array[index][1] != null) {
        return data_array[index][1];
    }
    return default_value;
}

function accumulate_flows(bucket, flows, outgoing_unit, unitcost_tariff) {
    bucket.solar_to_load_kwh    += flows.solar_to_load;
    bucket.solar_to_grid_kwh    += flows.solar_to_grid;
    bucket.solar_to_battery_kwh += flows.solar_to_battery;
    bucket.battery_to_load_kwh  += flows.battery_to_load;
    bucket.battery_to_grid_kwh  += flows.battery_to_grid;
    bucket.grid_to_load_kwh     += flows.grid_to_load;
    bucket.grid_to_battery_kwh  += flows.grid_to_battery;

    if (outgoing_unit != null) {
        bucket.tariff.solar_to_grid_value   += flows.solar_to_grid   * outgoing_unit;
        bucket.tariff.battery_to_grid_value += flows.battery_to_grid * outgoing_unit;
    }
    if (unitcost_tariff != null) {
        bucket.tariff.solar_to_load_value    += flows.solar_to_load    * unitcost_tariff;
        bucket.tariff.solar_to_battery_value += flows.solar_to_battery * unitcost_tariff;
        bucket.tariff.battery_to_load_value  += flows.battery_to_load  * unitcost_tariff;
        bucket.tariff.grid_to_load_cost      += flows.grid_to_load     * unitcost_tariff;
        bucket.tariff.grid_to_battery_cost   += flows.grid_to_battery  * unitcost_tariff;
    }
}

function draw_tables() {

    // Populate standalone tariff selectors (built once, then just set value)
    ["tariff"].forEach(function(id) {
        var sel = $("#" + id);
        if (sel.find("option").length === 0) {
            for (var key in tariff_options) {
                sel.append("<option>" + tariff_options[key] + "</option>");
            }
        }
    });
    $("#tariff").val(config.app.tariff.value);

    var out = "";

    if (show_carbonintensity) {
        var total_import_kwh = total.grid_to_load_kwh + total.grid_to_battery_kwh;
        var window_co2_intensity = total_import_kwh > 0 ? 1000 * total.co2 / total_import_kwh : 0;
        $("#carbonintensity_result").html("Total CO2: " + (total.co2).toFixed(1) + "kgCO2, Consumption intensity: " + window_co2_intensity.toFixed(0) + " gCO2/kWh")
    }

    // Helper: one table row per energy flow
    function flow_row(label, kwh, value_gbp, value_label, color, rowStyle) {
        if (kwh === 0) return ""; // skip zero rows for clarity

        var value_color;
        if (value_label.indexOf("avoided") !== -1) {
            value_color = "#aaa";
        } else if (value_label.indexOf("earned") !== -1) {
            value_color = "#29af29";
        } else {
            value_color = "#d6311e";
        }

        var r = "<tr style='border-left:4px solid " + color + (rowStyle ? ";" + rowStyle : "") + "'>";
        r += "<td>" + label + "</td>";
        r += "<td>" + kwh.toFixed(2) + " kWh</td>";
        r += "<td style='color:" + value_color + "'>" + (value_gbp !== null ? (value_gbp >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(value_gbp).toFixed(2) : "&mdash;") + "</td>";

        // unit price value_gbp / kwh, only if kwh > 0 and value_gbp is not null
        if (value_gbp !== null && kwh > 0) {
            let unit_price = value_gbp / kwh;
            r += "<td style='color:" + value_color + "'>" + (unit_price * 100).toFixed(1) + " p/kWh</td>";
        } else {
            r += "<td>&mdash;</td>";
        }

        r += "<td style='color:#aaa;font-size:12px'>" + value_label + "</td>";
        r += "</tr>";
        return r;
    }

    out += flow_row("&#9728; Solar &rarr; Load",         total.solar_to_load_kwh,    total.tariff.solar_to_load_value * 1.05,    "avoided import cost", flow_colors.solar_to_load);
    out += flow_row("&#9728; Solar &rarr; Grid (export)",total.solar_to_grid_kwh,    total.tariff.solar_to_grid_value * 1.05,    "earned at export tariff", flow_colors.solar_to_grid);
    out += flow_row("&#9728; Solar &rarr; Battery",      total.solar_to_battery_kwh, total.tariff.solar_to_battery_value * 1.05, "avoided import cost", flow_colors.solar_to_battery);
    out += flow_row("&#x1F50B; Battery &rarr; Load",     total.battery_to_load_kwh,  total.tariff.battery_to_load_value * 1.05,  "avoided import cost", flow_colors.battery_to_load);
    out += flow_row("&#x1F50B; Battery &rarr; Grid (export)", total.battery_to_grid_kwh, total.tariff.battery_to_grid_value * 1.05, "earned at export tariff", flow_colors.battery_to_grid);
    out += flow_row("&#x1F4A1; Grid &rarr; Battery",     total.grid_to_battery_kwh,  (total.tariff.grid_to_battery_cost * 1.05),"import cost", flow_colors.grid_to_battery);
    out += flow_row("&#x1F4A1; Grid &rarr; Load",        total.grid_to_load_kwh,     (total.tariff.grid_to_load_cost * 1.05),   "import cost", flow_colors.grid_to_load);

    // Summary row: net cost = grid costs - earnings, unit cost = net cost / total consumption
    var net_cost_gbp = (
        (total.tariff.grid_to_load_cost + total.tariff.grid_to_battery_cost) -
        (total.tariff.solar_to_grid_value + total.tariff.battery_to_grid_value)
    ) * 1.05;
    var total_consumption_kwh = total.solar_to_load_kwh + total.battery_to_load_kwh + total.grid_to_load_kwh;

    // spacer row
    out += flow_row("Net result", total_consumption_kwh, net_cost_gbp, "grid costs minus export earnings", "#444",
        "font-weight:bold;background-color:#333");

    $("#show_profile").show();
    $("#octopus_totals").html(out);

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Populate monthly data table if more than one month of data
    if (Object.keys(monthly_data).length > 1) {

        // Update table headers with selected tariff names
        var tariff_name = config.app.tariff.value;
        var has_baseline = baseline_monthly_summary != undefined && Object.keys(baseline_monthly_summary).length > 0;

        var tariff_label = tariff_name + (has_baseline ? " (A)" : "");
        var baseline_label = (baseline_tariff_name || "Baseline") + " (B)";

        var heading = "<th>Month</th>" +
            "<th>Consumption (kWh)</th>" +
            "<th>" + tariff_label + "</th>";

        if (has_baseline) {
            heading += "<th>" + baseline_label + "</th>" +
                "<th>Cheaper tariff</th>";
        }

        heading += "<th></th>";


        $("#monthly-data thead tr").html(heading);

        var monthly_out = "";

        var sum_consumption_kwh   = 0;
        var sum_net_cost_tariff = 0;
        var sum_net_cost_baseline = 0;

        // Saves this monthly summary for use in base-line comparison.
        monthly_summary = {};

        for (var month in monthly_data) {
            var md = monthly_data[month];
            var d = new Date(parseInt(month));
            var vat = 1.05;

            // Net cost = grid import costs - export earnings, with VAT
            var net_cost = (
                (md.tariff.grid_to_load_cost + md.tariff.grid_to_battery_cost) -
                (md.tariff.solar_to_grid_value + md.tariff.battery_to_grid_value)
            ) * vat;

            // Effective unit rate against total consumption
            var consumption = md.solar_to_load_kwh + md.battery_to_load_kwh + md.grid_to_load_kwh;
            var unit_rate = consumption > 0 ? (net_cost / consumption) * 100 : NaN;

            monthly_out += "<tr>";
            monthly_out += "<td>" + d.getFullYear() + " " + months[d.getMonth()] + "</td>";
            monthly_out += "<td>" + consumption.toFixed(1) + " kWh</td>";

            // Tariff A: cost + rate merged
            if (!isNaN(unit_rate)) {
                monthly_out += "<td>" + (net_cost >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(net_cost).toFixed(2) + " <span style='font-size:12px;color:#888'>" + unit_rate.toFixed(1) + " p/kWh</span></td>";
            } else {
                monthly_out += "<td>" + (net_cost >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(net_cost).toFixed(2) + "</td>";
            }

            // Baseline comparison if data exists
            if (baseline_monthly_summary[month] != undefined) {
                // index will match as monthly_summary is built in chronological order
                var baseline_net_cost = baseline_monthly_summary[month].net_cost_tariff;
                var baseline_unit_rate = baseline_monthly_summary[month].unit_rate_tariff;

                // Baseline: cost + rate merged
                if (!isNaN(baseline_unit_rate)) {
                    monthly_out += "<td>" + (baseline_net_cost >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(baseline_net_cost).toFixed(2) + " <span style='font-size:12px;color:#888'>" + baseline_unit_rate.toFixed(1) + " p/kWh</span></td>";
                } else {
                    monthly_out += "<td>" + (baseline_net_cost >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(baseline_net_cost).toFixed(2) + "</td>";
                }

                // Which tariff is cheaper this month
                if (!isNaN(unit_rate) && !isNaN(baseline_unit_rate)) {
                    if (unit_rate < baseline_unit_rate) {
                        monthly_out += "<td style='color:#1a6abf;font-weight:bold'>A</td>";
                    } else if (baseline_unit_rate < unit_rate) {
                        monthly_out += "<td style='color:#7c1a80;font-weight:bold'>B</td>";
                    } else {
                        monthly_out += "<td>=</td>";
                    }
                } else {
                    monthly_out += "<td>&mdash;</td>";
                }

                sum_net_cost_baseline += baseline_net_cost;
            }

            // Link icon to zoom to this month
            monthly_out += "<td><i class='icon-eye-open icon-white zoom-to-month' timestamp='" + month + "' style='cursor:pointer'></i></td>";
            monthly_out += "</tr>";

            sum_consumption_kwh   += consumption;
            sum_net_cost_tariff += net_cost;

            monthly_summary[month] = {
                consumption_kwh: consumption,
                net_cost_tariff: net_cost,
                unit_rate_tariff: unit_rate
            };
        }

        // Totals row
        var total_unit_rate = sum_consumption_kwh > 0 ? (sum_net_cost_tariff / sum_consumption_kwh) * 100 : NaN;

        monthly_out += "<tr style='font-weight:bold;background-color:#333'>";
        monthly_out += "<td>Total</td>";
        monthly_out += "<td>" + sum_consumption_kwh.toFixed(1) + " kWh</td>";
        if (!isNaN(total_unit_rate)) {
            monthly_out += "<td>" + (sum_net_cost_tariff >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(sum_net_cost_tariff).toFixed(2) + " <span style='font-size:12px;color:#888'>" + total_unit_rate.toFixed(1) + " p/kWh</span></td>";
        } else {
            monthly_out += "<td>" + (sum_net_cost_tariff >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(sum_net_cost_tariff).toFixed(2) + "</td>";
        }

        if (baseline_monthly_summary != undefined && Object.keys(baseline_monthly_summary).length > 0) {
            var baseline_total_unit_rate = sum_consumption_kwh > 0 ? (sum_net_cost_baseline / sum_consumption_kwh) * 100 : NaN;
            if (!isNaN(baseline_total_unit_rate)) {
                monthly_out += "<td>" + (sum_net_cost_baseline >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(sum_net_cost_baseline).toFixed(2) + " <span style='font-size:12px;color:#888'>" + baseline_total_unit_rate.toFixed(1) + " p/kWh</span></td>";
            } else {
                monthly_out += "<td>" + (sum_net_cost_baseline >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(sum_net_cost_baseline).toFixed(2) + "</td>";
            }
        }


            
        monthly_out += "<td></td>";
        monthly_out += "</tr>";

        $("#monthly-data-body").html(monthly_out);
        $("#monthly-data").show();
    } else {
        $("#monthly-data").hide();
    }
}

function graph_draw() {
    profile_mode = false;
    $("#history-title").html("HISTORY");

    
    if (this_halfhour_index != -1) {
        
        // let kwh_grid_to_load    = get_data_value_at_index("grid_to_load",    this_halfhour_index);
        // let kwh_grid_to_battery = get_data_value_at_index("grid_to_battery", this_halfhour_index);
        // let kwh_last_halfhour = (kwh_grid_to_load != null ? kwh_grid_to_load : 0)
        //                       + (kwh_grid_to_battery != null ? kwh_grid_to_battery : 0);

        // $("#kwh_halfhour").html(kwh_last_halfhour.toFixed(2) + "<span class='units'>kWh</span>");

        let tariff_unit = get_data_value_at_index("tariff", this_halfhour_index);
        if (tariff_unit != null) {
            // let cost_last_halfhour = kwh_last_halfhour * tariff_unit;
            // $("#cost_halfhour").html("(" + cost_last_halfhour.toFixed(2) + "<span class='units'>p</span>)");

            let unit_price = tariff_unit * 1.05;
            $("#unit_price").html(unit_price.toFixed(2) + "<span class='units'>p</span>");
        }

        $(".last_halfhour_stats").show();
    } else {
        $(".last_halfhour_stats").hide();
    }

    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    graph_series = [];

    // All 7 disaggregated flows stacked as positive bars
    graph_series.push({ label: "Solar to Load",    data: data["solar_to_load"],    yaxis: 1, color: flow_colors.solar_to_load, stack: true, bars: bars });
    graph_series.push({ label: "Solar to Battery", data: data["solar_to_battery"], yaxis: 1, color: flow_colors.solar_to_battery, stack: true, bars: bars });
    graph_series.push({ label: "Solar to Grid",    data: data["solar_to_grid"],    yaxis: 1, color: flow_colors.solar_to_grid, stack: true, bars: bars });
    graph_series.push({ label: "Battery to Load",  data: data["battery_to_load"],  yaxis: 1, color: flow_colors.battery_to_load, stack: true, bars: bars });
    graph_series.push({ label: "Battery to Grid",  data: data["battery_to_grid"],  yaxis: 1, color: flow_colors.battery_to_grid, stack: true, bars: bars });
    graph_series.push({ label: "Grid to Load",     data: data["grid_to_load"],     yaxis: 1, color: flow_colors.grid_to_load, stack: true, bars: bars });
    graph_series.push({ label: "Grid to Battery",  data: data["grid_to_battery"],  yaxis: 1, color: flow_colors.grid_to_battery, stack: true, bars: bars });

    // price signals
    graph_series.push({
        label: config.app.tariff.value,
        data: data["tariff"],
        yaxis: 2,
        color: "#fb1a80",
        lines: {
            show: true,
            steps: true,
            align: "left",
            lineWidth: 1
        }
    });

    graph_series.push({
        label: "Outgoing",
        data: data["outgoing"],
        yaxis: 2,
        color: "#941afb",
        lines: {
            show: true,
            steps: true,
            align: "center",
            lineWidth: 1
        }
    });

    if (show_carbonintensity) {
        graph_series.push({
            label: "Carbon Intensity",
            data: data["carbonintensity"],
            yaxis: 2,
            color: "#888",
            lines: {
                show: true,
                steps: true,
                align: "left",
                lineWidth: 1
            }
        });
    }

    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            min: view.start,
            max: view.end,
            font: {
                size: flot_font_size,
                color: "#888"
            },
            reserveSpace: false
        },
        yaxes: [{
                position: 'left',
                font: {
                    size: flot_font_size,
                    color: "#888"
                },
                reserveSpace: false
            },
            {
                position: 'left',
                alignTicksWithAxis: 1,
                font: {
                    size: flot_font_size,
                    color: "#888"
                },
                reserveSpace: false
            }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: {
            }
        },
        selection: {
            mode: "x"
        },
        legend: {
            show: false, // $('#placeholder').width() > 500,
            position: "NW",
            noColumns: 1
        }
    }
    $.plot($('#placeholder'), graph_series, options);
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
    var height = window_height - topblock - 250;
    if (height > 500) height = 500;


    // min size to avoid flot errors
    if (height<180) height = 180;
    if (width<200) width = 200;

    if (height > width*0.8) {
        height = width*0.8;
    }

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function() {
        var window_width = $(this).width();

        flot_font_size = 12;
        if (window_width < 450) flot_font_size = 10;

        resize();

        graph_draw();
    })
})

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}

function datetime_string(time) {
    var t = new Date(time);
    var year = t.getFullYear();
    var month = t.getMonth() + 1;
    if (month < 10) month = "0" + month;
    var day = t.getDate();
    if (day < 10) day = "0" + day;
    var hours = t.getHours();
    if (hours < 10) hours = "0" + hours;
    var minutes = t.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    var seconds = t.getSeconds();
    if (seconds < 10) seconds = "0" + seconds;

    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

function download_data(filename, data) {
    var blob = new Blob([data], {
        type: 'text/csv'
    });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

function parseTimepickerTime(timestr) {
    var tmp = timestr.split(" ");
    if (tmp.length != 2) return false;

    var date = tmp[0].split("/");
    if (date.length != 3) return false;

    var time = tmp[1].split(":");
    if (time.length != 3) return false;

    return new Date(date[2], date[1] - 1, date[0], time[0], time[1], time[2], 0).getTime() / 1000;
}

function getdataremote(id, start, end, interval) {
    var data = [];
    $.ajax({
        url: path + "app/dataremote",
        data: "id=" + id + "&start=" + start + "&end=" + end + "&interval=" + interval + "&skipmissing=0&limitinterval=0",
        dataType: 'json',
        async: false,
        success: function(result) {
            if (!result || result === null || result === "" || result.constructor != Array) {
                console.log("ERROR", "getdataremote invalid response: " + result);
                result = [];
            }
            data = result;
        }
    });
    return data;
}

function calibration_line_of_best_fit(import_kwh, meter_kwh_hh) 
{
    if (import_kwh.length != meter_kwh_hh.length) {
        console.log("Calibration line of best fit: Data length mismatch");
        return;
    }

    var sumX = 0
    var sumY = 0
    var sumXY = 0
    var sumX2 = 0
    var n = 0

    for (var z = 0; z < import_kwh.length; z++) {
        if (meter_kwh_hh[z] != undefined && import_kwh[z] != undefined) {
            if (meter_kwh_hh[z][1] != null) {
                // Calculate line of best fit variables
                // Suggested calibration
                var XY = 1.0 * import_kwh[z][1] * meter_kwh_hh[z][1];
                var X2 = 1.0 * import_kwh[z][1] * import_kwh[z][1];
                sumX += 1.0 * import_kwh[z][1];
                sumY += 1.0 * meter_kwh_hh[z][1];
                sumXY += XY;
                sumX2 += X2;
                n++;
            }
        }
    }

    if (n > 1) {
        var slope = ((n * sumXY - (sumX * sumY)) / (n * sumX2 - (sumX * sumX)));
        var intercept = (sumY - slope * sumX) / n;
        console.log("Suggested calibration:\nslope:" + slope.toFixed(6) + " intercept:" + intercept.toFixed(6));
        var prc_error = (1.0 - (sumY / sumX)) * 100;

        if (prc_error > 0) {
            console.log("Realtime feed is: " + prc_error.toFixed(2) + "% above meter data");
            $("#meter_kwh_hh_comparison").html("Realtime feed is: " + prc_error.toFixed(2) + "% above meter data");
        } else {
            console.log("Realtime feed is: " + Math.abs(prc_error).toFixed(2) + "% below meter data")
            $("#meter_kwh_hh_comparison").html("Realtime feed is: " + Math.abs(prc_error).toFixed(2) + "% below meter data");
        }
    }
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
$('#placeholder').bind("plothover", function(event, pos, item) {
    if (item) {

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];

            var z = time_to_index_map[itemTime];

            var d = new Date(itemTime);
            var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var hours = d.getHours();
            if (hours < 10) hours = "0" + hours;
            var minutes = d.getMinutes();
            if (minutes < 10) minutes = "0" + minutes;
            var seconds = d.getSeconds();
            if (seconds < 10) seconds = "0" + seconds;

            var date = hours + ":" + minutes;
            if (!profile_mode) date += ", " + days[d.getDay()] + " " + months[d.getMonth()] + " " + d.getDate();

            var text = date + "<br>";

            if (profile_mode) {
                if (item.series.label == 'Import') {
                    text += "Cumulative ";
                } else {
                    text += "Average ";
                }
            }

            let tariff = get_data_value_at_index("tariff", z);
            let outgoing = get_data_value_at_index("outgoing", z);
            let carbonintensity = get_data_value_at_index("carbonintensity", z);

            let solar_to_load_kwh    = get_data_value_at_index("solar_to_load", z);
            let solar_to_grid_kwh    = get_data_value_at_index("solar_to_grid", z);
            let solar_to_battery_kwh = get_data_value_at_index("solar_to_battery", z);
            let battery_to_load_kwh  = get_data_value_at_index("battery_to_load", z);
            let battery_to_grid_kwh  = get_data_value_at_index("battery_to_grid", z);
            let grid_to_load_kwh     = get_data_value_at_index("grid_to_load", z);
            let grid_to_battery_kwh  = get_data_value_at_index("grid_to_battery", z);

            if (solar_to_load_kwh != null && solar_to_load_kwh > 0) {
                text += "&#9728; Solar &rarr; Load: " + solar_to_load_kwh.toFixed(3) + " kWh";
                if (tariff != null) text += " (" + (solar_to_load_kwh * tariff).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (solar_to_battery_kwh != null && solar_to_battery_kwh > 0) {
                text += "&#9728; Solar &rarr; Battery: " + solar_to_battery_kwh.toFixed(3) + " kWh";
                if (tariff != null) text += " (" + (solar_to_battery_kwh * tariff).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (solar_to_grid_kwh != null && solar_to_grid_kwh > 0) {
                text += "&#9728; Solar &rarr; Grid: " + solar_to_grid_kwh.toFixed(3) + " kWh";
                if (outgoing != null) text += " (" + (solar_to_grid_kwh * outgoing).toFixed(2) + "p gained)<br>";
                else text += "<br>";
            }
            if (battery_to_load_kwh != null && battery_to_load_kwh > 0) {
                text += "&#x1F50B; Battery &rarr; Load: " + battery_to_load_kwh.toFixed(3) + " kWh";
                if (tariff != null) text += " (" + (battery_to_load_kwh * tariff).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (battery_to_grid_kwh != null && battery_to_grid_kwh > 0) {
                text += "&#x1F50B; Battery &rarr; Grid: " + battery_to_grid_kwh.toFixed(3) + " kWh";
                if (outgoing != null) text += " (" + (battery_to_grid_kwh * outgoing).toFixed(2) + "p gained)<br>";
                else text += "<br>";
            }
            if (grid_to_load_kwh != null && grid_to_load_kwh > 0) {
                text += "&#x1F4A1; Grid &rarr; Load: " + grid_to_load_kwh.toFixed(3) + " kWh";
                if (tariff != null) text += " (" + (grid_to_load_kwh * tariff).toFixed(2) + "p cost)<br>";
                else text += "<br>";
            }
            if (grid_to_battery_kwh != null && grid_to_battery_kwh > 0) {
                text += "&#x1F4A1; Grid &rarr; Battery: " + grid_to_battery_kwh.toFixed(3) + " kWh";
                if (tariff != null) text += " (" + (grid_to_battery_kwh * tariff).toFixed(2) + "p cost)<br>";
                else text += "<br>";
            }

            text += "<br>";

            if (tariff != null) {
                text += "<span style='color:#fb1a80'>&#x25CF;</span> Import Tariff: " + tariff.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (outgoing != null) {
                text += "<span style='color:#941afb'>&#x25CF;</span> Export Tariff: " + outgoing.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (show_carbonintensity && carbonintensity != null) {
                text += "&#x1F331; Carbon Intensity: " + carbonintensity.toFixed(0) + " gCO2/kWh<br>";
            }



            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});


$("#zoomout").click(function() {
    view.zoomout();
    graph_load();
    graph_draw();
});
$("#zoomin").click(function() {
    view.zoomin();
    graph_load();
    graph_draw();
});
$('#right').click(function() {
    view.pan_speed = 0.5;
    view.panright();
    graph_load();
    graph_draw();
});
$('#left').click(function() {
    view.pan_speed = 0.5;
    view.panleft();
    graph_load();
    graph_draw();
});
$('#fastright').click(function() {
    view.pan_speed = 1.0;
    view.panright();
    graph_load();
    graph_draw();
});
$('#fastleft').click(function() {
    view.pan_speed = 1.0;
    view.panleft();
    graph_load();
    graph_draw();
});

$('.time').click(function() {
    setPeriod($(this).attr("time"));
    // view.timewindow(period);
    graph_load();
    graph_draw();
});

$('.time-select').change(function() {
    var val = $(this).val();

    if (val == "C") {

    } else {
        setPeriod(val);
        // view.timewindow(period);
        graph_load();
        graph_draw();
    }
});

$('#placeholder').bind("plotselected", function(event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true;

    view.start = start;
    view.end = end;
    graph_load();
    graph_draw();

    $(".time-select").val("C");

    setTimeout(function() {
        panning = false;
    }, 100);
});

// zoom to month by timestamp
$("#monthly-data").on("click", ".zoom-to-month", function() {
    var timestamp = $(this).attr("timestamp");
    view.start = parseInt(timestamp);
    console.log(view.start);

    // calculate end of month
    var d = new Date(parseInt(timestamp));
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 0);
    view.end = d.getTime();
    

    graph_load();
    graph_draw();

    // set period to custom
    $(".time-select").val("C");

    return false;
});

$("#tariff").on("change", function() {
    config.app.tariff.value = $("#tariff").val();
    config.db.tariff = config.app.tariff.value;

    config.set();

    graph_load(false);
    graph_draw();
});

$("#use_meter_kwh_hh").click(function() {
    use_meter_kwh_hh = $(this)[0].checked;
    graph_load(false);
    graph_draw();
});

$("#show_carbonintensity").click(function() {
    show_carbonintensity = $(this)[0].checked;
    graph_load(false);
    graph_draw();
    if (!show_carbonintensity) $("#carbonintensity_result").html("");
});

$("#download-csv").click(function() {

    var csv = [];

    keys = ["tariff", "outgoing", "solar_to_load", "solar_to_battery", "solar_to_grid", "battery_to_load", "battery_to_grid", "grid_to_load", "grid_to_battery", "import", "import_cost_tariff", "export", "export_cost", "solar_used", "solar_used_cost", "meter_kwh_hh"]

    csv.push("time," + keys.join(","))

    for (var z in data["import"]) {
        var time = data["import"][z][0]

        var line = [];
        line.push(datetime_string(time))

        for (var i in keys) {
            let key = keys[i];

            var value = null; 
            
            if (data[key][z] != undefined) value = data[key][z][1];
            if (!isNaN(value) && value != null) value = value.toFixed(3)
            line.push(value)
        }

        csv.push(line.join(","));
    }

    download_data("tariff-data.csv", csv.join("\n"));
});

$('#datetimepicker1').on("changeDate", function(e) {
    var timewindowStart = parseTimepickerTime($("#request-start").val());
    if (!timewindowStart) {
        alert("Please enter a valid start date.");
        return false;
    }
    if (timewindowStart * 1000 >= view.end) {
        alert("Start date must be further back in time than end date.");
        return false;
    }

    view.start = timewindowStart * 1000;
    graph_load();
    graph_draw();
    $(".time-select").val("C");
});

$('#datetimepicker2').on("changeDate", function(e) {
    var timewindowEnd = parseTimepickerTime($("#request-end").val());
    if (!timewindowEnd) {
        alert("Please enter a valid end date.");
        return false;
    }
    if (view.start >= timewindowEnd * 1000) {
        alert("Start date must be further back in time than end date.");
        return false;
    }

    view.end = timewindowEnd * 1000;
    graph_load();
    graph_draw();
    $(".time-select").val("C");
});

// Save monthly data as baseline to be compared against tariff change
$("#save-baseline").click(function() {
    baseline_monthly_summary = JSON.parse(JSON.stringify(monthly_summary));
    baseline_tariff_name = config.app.tariff.value;
    draw_tables();
});


// ----------------------------------------------------------------------
// Helper: return array of feeds that should be auto-generated
// (delegates to config.autogen.get_feeds in appconf.js)
// ----------------------------------------------------------------------
function get_autogen_feeds() {
    return config.autogen.get_feeds();
}

// ----------------------------------------------------------------------
// Auto-generate feed list
// (delegates to config.autogen.render_feed_list in appconf.js)
// ----------------------------------------------------------------------
function render_autogen_feed_list() {
    config.autogen.render_feed_list();
}

// ----------------------------------------------------------------------
// Auto-generate feed actions
// (delegate to config.autogen.* in appconf.js)
// ----------------------------------------------------------------------
function create_missing_feeds()  { config.autogen.create_missing_feeds(); }
function start_post_processor()    { config.autogen.start_post_processor(); }
function reset_feeds()           { config.autogen.reset_feeds(); }