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

var flows = [
    { key: "solar_to_load",    str: "&#9728; Solar &rarr; Load",         rate: "tariff",   label: "saved"  },
    { key: "solar_to_battery", str: "&#9728; Solar &rarr; Battery",      rate: "tariff",   label: "saved"  },
    { key: "solar_to_grid",    str: "&#9728; Solar &rarr; Grid",         rate: "outgoing", label: "gained" },
    { key: "battery_to_load",  str: "&#128267; Battery &rarr; Load",     rate: "tariff",   label: "saved"  },
    { key: "battery_to_grid",  str: "&#128267; Battery &rarr; Grid",     rate: "outgoing", label: "gained" },
    { key: "grid_to_load",     str: "&#9889; Grid &rarr; Load",          rate: "tariff",   label: "cost"   },
    { key: "grid_to_battery",  str: "&#9889; Grid &rarr; Battery",       rate: "tariff",   label: "cost"   }
];

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
// - draw_graph
// - resize

function graph_load(load_flows = true, load_tariffs = true) {
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

    // Clear baseline summary if data has changed (as this may affect the selected baseline period)
    if (load_flows) {
        baseline_monthly_summary = {};
    }

    if (load_flows) {
        load_kwh_flow_data(interval, load_tariffs);
    } else if (load_tariffs) {
        load_tariff_data(interval);
    } else {
        process_data(interval);
    }
}

function load_kwh_flow_data(interval, load_tariffs = true) {
    // Load energy flow feeds (cumulative kWh, delta=1 returns half-hourly differences directly)
    let keys_to_load = [];
    let feedids = [];
    flows.forEach(function(f) {
        data[f.key] = false;
        if (feeds[f.key + "_kwh"] != undefined) {
            feedids.push(feeds[f.key + "_kwh"].id);
            keys_to_load.push(f.key);
        }
    });

    feed.getdata(feedids, view.start, view.end, interval, 0, 1, 0, 0, function (all_data) {
        if (all_data.success === false) {
            // Error loading flow data.. 
        } else {
            keys_to_load.forEach(function(key, index) {
                data[key] = all_data[index].data;
            });
        }
        // If we need to load tariffs, load tariffs will call process_data
        if (load_tariffs) {
            load_tariff_data(interval);
        } else {
            process_data(interval);
        }
    }, false, "notime");
}

function load_tariff_data(interval) {

    // ---------------------------------------
    // Remote feeds (tariff, carbon intensity)
    // ---------------------------------------

    let remote_feeds = {
        "import_tariff": { id: false },
        "export_tariff": { id: false }
    };

    if (show_carbonintensity) {
        remote_feeds["carbonintensity"] = { id: 428391 };
    }

    if (config.app.region != undefined) {
        // Import tariff
        if (octopus_feed_list[config.app.tariff.value] != undefined && octopus_feed_list[config.app.tariff.value][config.app.region.value] != undefined) {
            remote_feeds["import_tariff"].id = octopus_feed_list[config.app.tariff.value][config.app.region.value];
        }
        // Export tariff
        if (regions_outgoing[config.app.region.value] != undefined) {
            remote_feeds["export_tariff"].id = regions_outgoing[config.app.region.value];
        }
    }

    let feedids = [];
    let keys_to_load = [];
    for (var key in remote_feeds) {
        let id = remote_feeds[key].id;
        if (id) {
            feedids.push(id);
            keys_to_load.push(key);
        } else {
            data[key] = [];
        }
    }

    feed.getdata(feedids, view.start, view.end, interval, 0, 0, 0, 0, function (all_data) {
        if (all_data.success === false) {
            // Error loading flow data.. 
        } else {
            keys_to_load.forEach(function(key, index) {
                data[key] = all_data[index].data;
            });
        }

        // Invert export tariff.
        for (var z in data["export_tariff"]) {
            data["export_tariff"][z][1] *= -1;
        }

        // If we've loaded tariff data, the next step is always to process.
        process_data();

    }, false, "notime", "app/dataremote.json");
}

function process_data() {

    // Detect current half-hour index for live stats (use grid_to_load feed or meter as reference)
    this_halfhour_index = -1;
    var ref_data = data["grid_to_load"];
    var this_halfhour = Math.floor((new Date()).getTime() / 1800000) * 1800000;
    for (var z = 0; z < ref_data.length; z++) {
        if (ref_data[z][0] == this_halfhour) {
            this_halfhour_index = z;
            break;
        }
    }

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

    var total_template = {};
    flows.forEach(function(f) {
        total_template[f.key] = {
            kwh: 0,
            cost: 0
        }
    });

    // assign global
    total = JSON.parse(JSON.stringify(total_template)); // deep copy
    total.co2 = 0;
    monthly_data = {};

    for (var z = 0; z < data["grid_to_load"].length; z++) {
        let time = data["grid_to_load"][z][0];

        d.setTime(time)
        let hh = d.getHours() * 2 + d.getMinutes() / 30

        // get start of month timestamp to calculate monthly data
        let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

        // Prepare monthly data bucket if it doesn't exist yet.
        if (monthly_data[startOfMonth] == undefined) {
            monthly_data[startOfMonth] = JSON.parse(JSON.stringify(total_template)); // deep copy
        }

        // Read unit rates for this half-hour from tariff feeds
        let import_unit_rate = get_value_at_index(data["import_tariff"], z, null);
        let export_unit_rate = get_value_at_index(data["export_tariff"], z, null);

        // Populate values, calculate totals
        let values = {};
        flows.forEach(function(f) {
            // Populate values for this half-hour.
            values[f.key] = Math.max(0, get_value_at_index(data[f.key], z, 0));

            let unit_rate = (f.rate === "outgoing") ? export_unit_rate*-1 : import_unit_rate;
            if (unit_rate !== null) {
                // Monthly totals
                monthly_data[startOfMonth][f.key].cost += values[f.key] * unit_rate * 0.01;
                monthly_data[startOfMonth][f.key].kwh  += values[f.key];
                // Overall totals
                total[f.key].cost += values[f.key] * unit_rate * 0.01;
                total[f.key].kwh  += values[f.key];
            }
        });

        // ----------------------------------
        // Extras:

        // Derive aggregate values from flows
        let kwh_import = values.grid_to_load + values.grid_to_battery;

        // Generate profile
        if (import_unit_rate !== null) {
            profile_kwh[hh][1] += kwh_import
            profile_cost[hh][1] += kwh_import * import_unit_rate * 0.01;
        }

        // Carbon Intensity
        if (show_carbonintensity) {
            let carbon_intensity = get_value_at_index(data["carbon_intensity"], z, null);
            if (carbon_intensity !== null) {
                let co2_hh = kwh_import * (co2intensity * 0.001)
                total.co2 += co2_hh
            }
        }
    }

    // Create time to index map using grid_to_load feed as reference (should be present in all modes)
    time_to_index_map = {};
    for (var z = 0; z < data["grid_to_load"].length; z++) {
        time_to_index_map[data["grid_to_load"][z][0]] = z;
    }

    draw_tables();
    draw_graph();
}

function get_value_at_index(data_array, index, default_value = null) {
    if (data_array[index] != undefined && data_array[index][1] != null) {
        return data_array[index][1];
    }
    return default_value;
}

// -------------------------------------------------------------------------------
// CALCULATIONS
// -------------------------------------------------------------------------------

function calc_net_cost(bucket) {
    return ((bucket.grid_to_load.cost + bucket.grid_to_battery.cost) - (bucket.solar_to_grid.cost + bucket.battery_to_grid.cost)) * 1.05;
}

function calc_total_consumption(bucket) {
    return bucket.solar_to_load.kwh + bucket.battery_to_load.kwh + bucket.grid_to_load.kwh;
}

// Returns an array of per-month summary objects.
// Also populates the global monthly_summary for use by the baseline save feature.
function calc_monthly_summaries() {
    monthly_summary = {};
    var summaries = [];

    for (var month in monthly_data) {
        var md = monthly_data[month];
        var net_cost   = calc_net_cost(md);
        var consumption = calc_total_consumption(md);
        var unit_rate  = consumption > 0 ? (net_cost / consumption) * 100 : NaN;

        summaries.push({
            timestamp:  month,
            date:       new Date(parseInt(month)),
            consumption: consumption,
            net_cost:   net_cost,
            unit_rate:  unit_rate,
            baseline:   baseline_monthly_summary[month] || null
        });

        monthly_summary[month] = {
            consumption_kwh:  consumption,
            net_cost_tariff:  net_cost,
            unit_rate_tariff: unit_rate
        };
    }

    return summaries;
}

// -------------------------------------------------------------------------------
// RENDERING HELPERS
// -------------------------------------------------------------------------------

// Renders a GBP cost + optional unit-rate into a single <td>.
function render_cost_cell(net_cost, unit_rate) {
    var text = (net_cost >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(net_cost).toFixed(2);
    if (!isNaN(unit_rate)) {
        text += " <span style='font-size:12px;color:#888'>" + unit_rate.toFixed(1) + " p/kWh</span>";
    }
    return "<td>" + text + "</td>";
}

// Renders a single energy-flow row for the totals table.
function render_flow_row(label, kwh, value_gbp, value_label, color, rowStyle) {
    if (kwh === 0) return "";

    var value_color;
    if (value_label.indexOf("avoided") !== -1) {
        value_color = "#aaa";
    } else if (value_label.indexOf("earned") !== -1) {
        value_color = "#29af29";
    } else {
        value_color = "#d6311e";
    }

    var unit_price_cell = (value_gbp !== null && kwh > 0)
        ? "<td style='color:" + value_color + "'>" + ((value_gbp / kwh) * 100).toFixed(1) + " p/kWh</td>"
        : "<td>&mdash;</td>";

    return "<tr style='border-left:4px solid " + color + (rowStyle ? ";" + rowStyle : "") + "'>"
        + "<td>" + label + "</td>"
        + "<td>" + kwh.toFixed(2) + " kWh</td>"
        + "<td style='color:" + value_color + "'>"
            + (value_gbp !== null ? (value_gbp >= 0 ? "\u00a3" : "-\u00a3") + Math.abs(value_gbp).toFixed(2) : "&mdash;")
            + "</td>"
        + unit_price_cell
        + "<td style='color:#aaa;font-size:12px'>" + value_label + "</td>"
        + "</tr>";
}

// Builds the HTML for the flow totals table body.
function render_flow_table() {
    var vat = 1.05;
    var net_cost_gbp          = calc_net_cost(total);
    var total_consumption_kwh = calc_total_consumption(total);

    var rows = "";
    rows += render_flow_row("&#9728; Solar &rarr; Load",              total.solar_to_load.kwh,    total.solar_to_load.cost    * vat, "avoided import cost",          flow_colors.solar_to_load);
    rows += render_flow_row("&#9728; Solar &rarr; Grid (export)",     total.solar_to_grid.kwh,    total.solar_to_grid.cost    * vat, "earned at export tariff",      flow_colors.solar_to_grid);
    rows += render_flow_row("&#9728; Solar &rarr; Battery",           total.solar_to_battery.kwh, total.solar_to_battery.cost * vat, "avoided import cost",          flow_colors.solar_to_battery);
    rows += render_flow_row("&#x1F50B; Battery &rarr; Load",          total.battery_to_load.kwh,  total.battery_to_load.cost  * vat, "avoided import cost",          flow_colors.battery_to_load);
    rows += render_flow_row("&#x1F50B; Battery &rarr; Grid (export)", total.battery_to_grid.kwh,  total.battery_to_grid.cost  * vat, "earned at export tariff",      flow_colors.battery_to_grid);
    rows += render_flow_row("&#x1F4A1; Grid &rarr; Battery",          total.grid_to_battery.kwh,  total.grid_to_battery.cost  * vat, "import cost",                  flow_colors.grid_to_battery);
    rows += render_flow_row("&#x1F4A1; Grid &rarr; Load",             total.grid_to_load.kwh,     total.grid_to_load.cost     * vat, "import cost",                  flow_colors.grid_to_load);
    rows += render_flow_row("Net result", total_consumption_kwh, net_cost_gbp, "grid costs minus export earnings", "#444", "font-weight:bold;background-color:#333");

    return rows;
}

// Builds the HTML for one monthly data row.
function render_monthly_row(summary, has_baseline, month_names) {
    var row = "<tr>";
    row += "<td>" + summary.date.getFullYear() + " " + month_names[summary.date.getMonth()] + "</td>";
    row += "<td>" + summary.consumption.toFixed(1) + " kWh</td>";
    row += render_cost_cell(summary.net_cost, summary.unit_rate);

    if (has_baseline && summary.baseline) {
        row += render_cost_cell(summary.baseline.net_cost_tariff, summary.baseline.unit_rate_tariff);

        if (!isNaN(summary.unit_rate) && !isNaN(summary.baseline.unit_rate_tariff)) {
            if (summary.unit_rate < summary.baseline.unit_rate_tariff) {
                row += "<td style='color:#1a6abf;font-weight:bold'>A</td>";
            } else if (summary.baseline.unit_rate_tariff < summary.unit_rate) {
                row += "<td style='color:#7c1a80;font-weight:bold'>B</td>";
            } else {
                row += "<td>=</td>";
            }
        } else {
            row += "<td>&mdash;</td>";
        }
    }

    row += "<td><i class='icon-eye-open icon-white zoom-to-month' timestamp='" + summary.timestamp + "' style='cursor:pointer'></i></td>";
    row += "</tr>";
    return row;
}

// Builds and injects the full monthly breakdown table.
function render_monthly_table(summaries) {
    var month_names  = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var has_baseline = baseline_monthly_summary != undefined && Object.keys(baseline_monthly_summary).length > 0;
    var tariff_label = config.app.tariff.value + (has_baseline ? " (A)" : "");

    var heading = "<th>Month</th><th>Consumption (kWh)</th><th>" + tariff_label + "</th>";
    if (has_baseline) {
        heading += "<th>" + (baseline_tariff_name || "Baseline") + " (B)</th><th>Cheaper tariff</th>";
    }
    heading += "<th></th>";
    $("#monthly-data thead tr").html(heading);

    var sum_consumption_kwh  = 0;
    var sum_net_cost_tariff  = 0;
    var sum_net_cost_baseline = 0;
    var rows = "";

    for (var i = 0; i < summaries.length; i++) {
        var s = summaries[i];
        rows += render_monthly_row(s, has_baseline, month_names);
        sum_consumption_kwh   += s.consumption;
        sum_net_cost_tariff   += s.net_cost;
        if (has_baseline && s.baseline) {
            sum_net_cost_baseline += s.baseline.net_cost_tariff;
        }
    }

    var total_unit_rate = sum_consumption_kwh > 0 ? (sum_net_cost_tariff / sum_consumption_kwh) * 100 : NaN;
    var totals_row = "<tr style='font-weight:bold;background-color:#333'>"
        + "<td>Total</td>"
        + "<td>" + sum_consumption_kwh.toFixed(1) + " kWh</td>"
        + render_cost_cell(sum_net_cost_tariff, total_unit_rate);

    if (has_baseline) {
        var baseline_total_unit_rate = sum_consumption_kwh > 0 ? (sum_net_cost_baseline / sum_consumption_kwh) * 100 : NaN;
        totals_row += render_cost_cell(sum_net_cost_baseline, baseline_total_unit_rate);
    }

    totals_row += "<td></td></tr>";

    $("#monthly-data-body").html(rows + totals_row);
    $("#monthly-data").show();
}

// -------------------------------------------------------------------------------
// draw_tables: orchestrates calculation then rendering
// -------------------------------------------------------------------------------
function draw_tables() {

    // Populate tariff selector once, then sync its value
    var sel = $("#tariff");
    if (sel.find("option").length === 0) {
        for (var key in tariff_options) {
            sel.append("<option>" + tariff_options[key] + "</option>");
        }
    }
    sel.val(config.app.tariff.value);

    // CO2 summary
    if (show_carbonintensity) {
        var total_import_kwh      = total.grid_to_load.kwh + total.grid_to_battery.kwh;
        var window_co2_intensity  = total_import_kwh > 0 ? 1000 * total.co2 / total_import_kwh : 0;
        $("#carbonintensity_result").html(
            "Total CO2: " + total.co2.toFixed(1) + "kgCO2, Consumption intensity: " + window_co2_intensity.toFixed(0) + " gCO2/kWh"
        );
    }

    // Flow totals table
    $("#show_profile").show();
    $("#octopus_totals").html(render_flow_table());

    // Monthly breakdown table
    if (Object.keys(monthly_data).length > 1) {
        render_monthly_table(calc_monthly_summaries());
    } else {
        $("#monthly-data").hide();
    }
}

function draw_graph() {
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
        data: data["import_tariff"],
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
        data: data["export_tariff"],
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
            data: data["carbon_intensity"],
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

        draw_graph();
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

            flows.forEach(function(f) {
                let kwh = get_data_value_at_index(f.key, z);
                if (kwh != null && kwh > 0) {
                    text += f.str + ": " + kwh.toFixed(3) + " kWh";
                    var rate_val = f.rate === "tariff" ? tariff : outgoing;
                    if (rate_val != null) text += " (" + (kwh * rate_val).toFixed(2) + "p " + f.label + ")<br>";
                    else text += "<br>";
                }
            });

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
});
$("#zoomin").click(function() {
    view.zoomin();
    graph_load();
});
$('#right').click(function() {
    view.pan_speed = 0.5;
    view.panright();
    graph_load();
});
$('#left').click(function() {
    view.pan_speed = 0.5;
    view.panleft();
    graph_load();
});
$('#fastright').click(function() {
    view.pan_speed = 1.0;
    view.panright();
    graph_load();
});
$('#fastleft').click(function() {
    view.pan_speed = 1.0;
    view.panleft();
    graph_load();
});

$('.time').click(function() {
    setPeriod($(this).attr("time"));
    // view.timewindow(period);
    graph_load();
});

$('.time-select').change(function() {
    var val = $(this).val();

    if (val == "C") {

    } else {
        setPeriod(val);
        // view.timewindow(period);
        graph_load();
    }
});

$('#placeholder').bind("plotselected", function(event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true;

    view.start = start;
    view.end = end;
    graph_load();

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

    // set period to custom
    $(".time-select").val("C");

    return false;
});

$("#tariff").on("change", function() {
    config.app.tariff.value = $("#tariff").val();
    config.db.tariff = config.app.tariff.value;
    config.set();
    graph_load(false, true);
});

$("#show_carbonintensity").click(function() {
    show_carbonintensity = $(this)[0].checked;
    graph_load(false, true);
    if (!show_carbonintensity) $("#carbonintensity_result").html("");
});

$("#download-csv").click(function() {

    var csv = [];

    keys = ["tariff", "outgoing", "solar_to_load", "solar_to_battery", "solar_to_grid", "battery_to_load", "battery_to_grid", "grid_to_load", "grid_to_battery", "import", "import_cost_tariff", "export", "export_cost", "solar_used", "solar_used_cost"]

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