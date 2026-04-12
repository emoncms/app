// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});
if (!sessionwrite) $(".openconfig").hide();

var flow_colors_old = {
    "solar_to_load":    "#abddff", 
    "solar_to_battery": "#fba050", 
    "solar_to_grid":    "#dccc1f",
    "battery_to_load":  "#ffd08e",
    "battery_to_grid":  "#fabb68",
    "grid_to_load":     "#82cbfc",
    "grid_to_battery":  "#fb7b50"
};

var flow_colors_tariff_app = {
    "solar_to_load":    "#bec745", 
    "solar_to_battery": "#a3d977", 
    "solar_to_grid":    "#dccc1f",
    "battery_to_load":  "#fbb450",
    "battery_to_grid":  "#f0913a",
    "grid_to_load":     "#44b3e2",
    "grid_to_battery":  "#82cbfc"
};

var flow_colors_contrast = {
    "solar_to_load":    "#F5C518", // bright amber   – direct solar use
    "solar_to_battery": "#C8A000", // darker gold    – solar into storage
    "solar_to_grid":    "#FFE066", // light yellow   – solar export
    "battery_to_load":  "#4ADE80", // bright green   – battery discharge
    "battery_to_grid":  "#86EFAC", // soft green     – battery export
    "grid_to_load":     "#38BDF8", // sky blue       – grid import
    "grid_to_battery":  "#7DD3FC"  // light blue     – grid charging battery
};

// flow_colors_blend: each flow is 66% source + 33% destination, blended from 4 base colors:
//   Solar=#FFD700 (yellow), Battery=#FF7700 (orange), Grid=#E03030 (red), Home=#3399DD (blue)
var flow_colors_blend = {
    "solar_to_load":    "#B9C049", // 66% yellow + 33% blue
    "solar_to_battery": "#FFB500", // 66% yellow + 33% orange
    "solar_to_grid":    "#F29E10", // 66% yellow + 33% red
    "battery_to_load":  "#B98149", // 66% orange + 33% blue
    "battery_to_grid":  "#F25E10", // 66% orange + 33% red
    "grid_to_load":     "#A55269", // 66% red    + 33% blue
    "grid_to_battery":  "#E84720"  // 66% red    + 33% orange
};

var flow_colors = flow_colors_tariff_app;

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
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
    "use":{"optional":true, "type":"feed", "derivable":true, "autoname":"use", "description":"House or building use in watts"},
    "solar":{"optional":true, "type":"feed", "derivable":true, "autoname":"solar", "description":"Solar generation in watts"},
    "battery":{"optional":true, "type":"feed", "derivable":true, "autoname":"battery_power", "description":"Battery power in watts, positive for discharge, negative for charge (only shown when has_battery is enabled)"},
    "grid":{"optional":true, "type":"feed", "derivable":true, "autoname":"grid", "description":"Grid power in watts (positive for import, negative for export)"},

    // Battery state of charge feed (optional)
    "battery_soc":{"optional":true, "type":"feed", "autoname":"battery_soc", "description":"Battery state of charge in % (only shown when has_battery is enabled)"},

    // History feeds (energy flow breakdown from solarbatterykwh post-processor)

    // Node name for auto-generated feeds, common with mysolarpvbattery app.
    "autogenerate_nodename": {
        "hidden": true,
        "type": "value",
        "default": "solar_battery_kwh_flows",
        "name": "Auto-generate feed node name",
        "description": ""
    },

    // Auto-generated cumulative kWh feeds 
    "solar_to_load_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"solar_to_load_kwh", "description":"Cumulative solar to load energy in kWh"},
    "solar_to_grid_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"solar_to_grid_kwh", "description":"Cumulative solar to grid (export) energy in kWh"},
    "solar_to_battery_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"solar_to_battery_kwh", "description":"Cumulative solar to battery energy in kWh"},
    "battery_to_load_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"battery_to_load_kwh", "description":"Cumulative battery to load energy in kWh"},
    "battery_to_grid_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"battery_to_grid_kwh", "description":"Cumulative battery to grid energy in kWh"},
    "grid_to_load_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"grid_to_load_kwh", "description":"Cumulative grid to load energy in kWh"},
    "grid_to_battery_kwh":{"autogenerate":true, "optional":true, "type":"feed", "autoname":"grid_to_battery_kwh", "description":"Cumulative grid to battery energy in kWh"},

    // Other options
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description": "Display power as kW"},
    "battery_capacity_kwh":{"type":"value", "default":0, "name":"Battery Capacity", "description":"Battery capacity in kWh (used for time-remaining estimate; only used when has_battery is enabled)"}
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

config.autogen_node_prefix = "solar_battery_kwh_flows";
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
    config.app.battery_soc.hidden   = !mode.has_battery;
    config.app.battery_capacity_kwh.hidden = !mode.has_battery;
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
    if (key === 'has_solar' || key === 'has_battery' || key === 'use' || key === 'solar' || key === 'battery' || key === 'grid') {
        config.UI();
    }
    render_autogen_feed_list();
};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

var live = false;
var autoupdate = true;
var lastupdate = +new Date;
var viewmode = "powergraph";
var historyseries = [];
var powerseries = [];
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;
var bargraph_loaded = false;
var kwhd_data = {};


// == Flow decomposition control variables ==

// Which feeds are actually available
var available = {
    use: false,
    solar: false,
    battery: false,
    grid: false
};
var battery_soc_available = false;

// which feed to derive (if any) based on the config; false = no derivation needed
var derive = false; 

// which feeds to assume zero
var assume_zero_solar = false;
var assume_zero_battery = false;

// == End of flow decomposition control variables ==

// ----------------------------------------------------------------------
// check_history_feeds: return true if the right kWh flow feeds are available
// for the current mode (needed to enable the History bargraph view).
// ----------------------------------------------------------------------
function check_history_feeds(mode) {
    // Core grid-load feed is always needed
    if (!config.app.grid_to_load_kwh.value) return false;
    if (!config.app.solar_to_grid_kwh.value && mode.has_solar) return false;
    if (!config.app.solar_to_load_kwh.value && mode.has_solar) return false;

    if (mode.has_battery) {
        if (!config.app.solar_to_battery_kwh.value && mode.has_solar) return false;
        if (!config.app.battery_to_load_kwh.value)  return false;
        if (!config.app.battery_to_grid_kwh.value)  return false;
        if (!config.app.grid_to_battery_kwh.value)  return false;
    }
    return true;
}



var timeWindow = (3600000*24.0*30);
var history_end = +new Date;
var history_start = history_end - timeWindow;

timeWindow = (3600000*6.0*1);
var power_end = +new Date;
var power_start = power_end - timeWindow;

var live_timerange = timeWindow;

var meta = {};
var power_graph_end_time = 0;

config.init();

// App start function
function init()
{        
    app_log("INFO","solar & battery init");

    var mode = get_mode();

    // Apply hidden flags (also used by autogen feed list and config UI)
    config.ui_before_render();

    render_autogen_feed_list();

    view.end = power_end;
    view.start = power_start;

    // Load metadata from whatever feeds are actually configured to find data end time
    var feeds_to_check = ["use", "solar", "battery", "grid"];
    for (var i = 0; i < feeds_to_check.length; i++) {
        var key = feeds_to_check[i];
        if (config.app[key].value) {
            meta[key] = feed.getmeta(config.app[key].value);
            if (meta[key].end_time > power_graph_end_time) power_graph_end_time = meta[key].end_time;
        }
    }

    // If the feed is more than 1 hour behind then start the view at the end of the feed
    if ((view.end*0.001-power_graph_end_time)>3600) {
        view.end = power_graph_end_time*1000;
        autoupdate = false;
    }
    view.start = view.end - timeWindow;
    live_timerange = timeWindow;

    // Show history bargraph button only when all required kWh flow feeds are available for the current mode
    var has_history = check_history_feeds(mode);
    if (has_history) init_bargraph();
    $(".viewhistory").toggle(has_history);
    
    // The buttons for these powergraph events are hidden when in historic mode 
    // The events are loaded at the start here and dont need to be unbinded and binded again.
    $("#zoomout").click(function () {view.zoomout(); autoupdate = false; draw(true);});
    $("#zoomin").click(function () {view.zoomin(); autoupdate = false; draw(true);});
    $('#right').click(function () {view.panright(); autoupdate = false; draw(true);});
    $('#left').click(function () {view.panleft(); autoupdate = false; draw(true);});
    
    $('.time').click(function () {
        view.timewindow($(this).attr("time")/24.0);
        autoupdate = true;
        live_timerange = view.end - view.start;
        draw(true);
    });
    
    $(".viewhistory").click(function () {
        $btn = $(this);
        $btn.toggleClass('active');
        
        $('.balanceline').attr('disabled', $btn.is('.active'));
        viewmode = $btn.is('.active') ? 'bargraph' : 'powergraph';
        
        if (viewmode=="bargraph") {
            power_start = view.start
            power_end = view.end
            view.start = history_start
            view.end = history_end
            if (bargraph_loaded) {
                draw(false); 
            } else {
                bargraph_loaded = true;
                draw(true);
            }
            bargraph_events();
        } else {
            history_start = view.start
            history_end = view.end
            view.start = power_start
            view.end = power_end
            draw(false);
            powergraph_events();
        }
    });
}

function show() 
{
    app_log("INFO","solar & battery show");
    
    var mode = get_mode();


    flow_available();
    solar_battery_visibility();

    if (check_history_feeds(mode)) {
        if (!bargraph_initialized) init_bargraph();
    }
    
    draw(true);
    powergraph_events();
    
    livefn();
    live = setInterval(livefn,5000);

    // Trigger process here
    setTimeout(function() {
        start_post_processor();
    }, 1000);

    // resize after a delay to ensure the DOM is fully rendered and dimensions are correct
    setTimeout(resize, 100);
}

// -------------------------------------------------------------------------------------------------------
// Flow decomposition
// Conservation of energy: use = solar + battery + grid
// battery: positive = discharge, negative = charge
// grid: positive = import, negative = export
// -------------------------------------------------------------------------------------------------------

function flow_available() {

    // 4 feeds: solar, use, battery, grid
    // 3 feeds
    // 2 feeds (need at least use or grid, second can be solar or battery)
    // 1 feed (use or grid)


    // Availability
    let feedids = {};
    let feeds_to_check = ["use", "solar", "battery", "grid"];
    for (let i = 0; i < feeds_to_check.length; i++) {
        let key = feeds_to_check[i];
        if (config.app[key].value != "disable" && config.app[key].value != "derive") {
            feedids[key] = config.app[key].value*1;
        } else {
            feedids[key] = false;
        }
    }

    available = {
        use: false,
        solar: false,
        battery: false,
        grid: false
    };

    derive = false;

    // Availability
    if (config.app.has_solar.value && feedids['solar']) available.solar = true;
    if (feedids['use']) available.use = true;
    if (config.app.has_battery.value && feedids['battery']) available.battery = true;
    if (feedids['grid']) available.grid = true;

    var number_of_feeds = 0;
    if (available.solar) number_of_feeds++;
    if (available.use) number_of_feeds++;
    if (available.battery) number_of_feeds++;
    if (available.grid) number_of_feeds++;

    // 3 Feeds: Just find the one that is missing
    if (number_of_feeds === 3) {
        if (!available.grid) derive = "grid";
        else if (!available.use) derive = "use";
        else if (!available.solar) derive = "solar";
        else if (!available.battery) {
            if (config.app.has_battery.value) {
                derive = "battery";
            } else {
                // If all feeds are preset but battery is disabled by config, assume battery=0 and recalculate grid from use and solar
                derive = "grid";
            }
        }
    }

    // 2 Feeds: Specific logic based on your priority rules
    else if (number_of_feeds === 2) {

        if (available.solar && available.battery) {
            // We cant derive in this scenario
        }
        
        if (available.solar) {
            if (available.use) derive = "grid";
            else if (available.grid) derive = "use";
            assume_zero_battery = true; // if battery feed is missing, assume no battery power (solar-only mode)
        }

        if (available.battery) {
            if (available.use) derive = "grid";
            else if (available.grid) derive = "use";
            assume_zero_solar = true; // if solar feed is missing, assume no solar generation (battery-only mode)
        }
    }

    // 1 Feed (dervice use from grid or vice versa, assume zero solar and battery)
    else if (number_of_feeds === 1) {
        if (available.use) derive = "grid";
        else if (available.grid) derive = "use";
        assume_zero_solar = true;
        assume_zero_battery = true;
    }

    // Battery state of charge feed availability
    if ((available.battery || derive == "battery") && config.app.battery_soc.value) {
        battery_soc_available = true;
    }

    return {
        has_solar: config.app.has_solar.value,
        has_battery: config.app.has_battery.value,
        number_of_feeds: number_of_feeds,
        available: available,
        derive: derive,
        assume_zero_solar: assume_zero_solar,
        assume_zero_battery: assume_zero_battery
    }
}

function flow_derive_missing(input) {
    var solar = input.solar;
    var use = input.use;
    var battery = input.battery;
    var grid = input.grid;

    if (solar<0) solar = 0;
    if (use<0) use = 0;

    if (assume_zero_solar) solar = 0;
    if (assume_zero_battery) battery = 0;

    if (derive === "grid") {
        grid = use - solar - battery;
    } else if (derive === "use") {
        use = solar + battery + grid;
    } else if (derive === "solar") {
        solar = use - battery - grid;
    } else if (derive === "battery") {
        battery = use - solar - grid;
    }

    return {
        solar: solar,
        use: use,
        battery: battery,
        grid: grid
    }
}

function flow_calculation(input) {

    var solar = input.solar;
    var use = input.use;
    var battery = input.battery;
    var grid = input.grid;

    // Import/export split: positive grid = import, negative grid = export
    var import_power = grid > 0 ? grid : 0;

    // SOLAR flows
    var solar_to_load = Math.min(solar, use);
    var solar_to_battery = 0;
    if (battery < 0) {
        // Battery is charging: solar to battery is the lesser of available solar and battery charge power
        solar_to_battery = Math.min(solar - solar_to_load, -battery);
    }
    var solar_to_grid = solar - solar_to_load - solar_to_battery;

    // BATTERY flows
    var battery_to_load = 0;
    var battery_to_grid = 0;
    if (battery > 0) {
        // Battery is discharging
        battery_to_load = Math.min(battery, use - solar_to_load);
        battery_to_grid = battery - battery_to_load;
    }

    // GRID flows
    var grid_to_load = 0;
    var grid_to_battery = 0;
    if (import_power > 0) {
        grid_to_load = Math.min(import_power, use - solar_to_load - battery_to_load);
        grid_to_battery = Math.min(import_power - grid_to_load, battery < 0 ? -battery - solar_to_battery : 0);
    }

    return {
        solar_to_load: solar_to_load,
        solar_to_battery: solar_to_battery,
        solar_to_grid: solar_to_grid,
        battery_to_load: battery_to_load,
        battery_to_grid: battery_to_grid,
        grid_to_load: grid_to_load,
        grid_to_battery: grid_to_battery
    }
}


function resize() 
{
    app_log("INFO","solar & battery resize");
    
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var width = placeholder_bound.width();

    // Calculate height from the top of the chart to the bottom of the viewport,
    // leaving enough room for the stats table below to remain visible.
    var bottom_margin = $('.statstable').outerHeight(true) + 64;
    var offset_top = placeholder_bound.offset().top - $(window).scrollTop();
    var height = $(window).height() - offset_top - bottom_margin;

    // In landscape cap at 60% of window width to avoid an overly tall chart
    //var is_landscape = $(window).height() < $(window).width();
    //if (is_landscape) height = Math.min(height, width * 0.6);

    // min size to avoid flot errors
    if (height < 200) height = 200;
    if (width  < 200) width  = 200;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height);
    
    draw(false)
}

function hide() 
{
    clearInterval(live);
}

function livefn()
{
    // Check if the updater ran in the last 60s if it did not the app was sleeping
    // and so the data needs a full reload.
    var reload = false;
    var now = +new Date();
    if ((now-lastupdate)>60000) reload = true;
    lastupdate = now;
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    var feeds = feed.listbyid();
    if (feeds === null) { return; }

    var input = {};
    for (const key in available) {
        // if feed is available use its value, otherwise null
        input[key] = available[key] && feeds[config.app[key].value]!=undefined ? parseFloat(feeds[config.app[key].value].value) : null;
    }

    input = flow_derive_missing(input);

    var battery_soc_now = "---";
    if (battery_soc_available && feeds[config.app.battery_soc.value] != undefined) {
        battery_soc_now = parseInt(feeds[config.app.battery_soc.value].value);
    }

    if (autoupdate) {

        var updatetime = false;

        // Find and update time based on the first available.
        for (const key in available) {
            if (available[key] && feeds[config.app[key].value]!=undefined) {
                updatetime = feeds[config.app[key].value].time;
                break;
            }
        }

        if (updatetime) {
            // Append new data to timeseries for each available feed, and trim old data outside of view
            for (const key in available) {
                if (available[key]) {
                    timeseries.append(key, updatetime, input[key], true);
                    timeseries.trim_start(key, view.start * 0.001);
                }
            }

            // add soc if available
            if (battery_soc_now !== "---") {
                timeseries.append("battery_soc", updatetime, battery_soc_now);
                timeseries.trim_start("battery_soc", view.start * 0.001);
            }
        
            // Advance view
            view.end = now;
            view.start = now - live_timerange;
        }
    }

    // Calculate time left
    $(".battery_time_left").html(battery_time_left({
        capacity: config.app.battery_capacity_kwh.value,
        soc: battery_soc_now,
        battery_power: input.battery
    }));

    $('.power-unit').text(powerUnit);

    let scale = powerUnit === 'kW' ? 0.001 : 1;
    let dp = powerUnit === 'kW' ? 1 : 0;

    $(".solar-now").html(toFixed(input.solar * scale, dp));
    $(".use-now").html(toFixed(input.use * scale, dp));
    $(".battery_soc").html(battery_soc_now);
    
    // Grid import/export status
    let grid = toFixed(Math.abs(input.grid) * scale, dp);

    if (input.grid > 0) {
        $(".balance-label").html("IMPORTING");
        $(".grid-now").parent().css("color","#d52e2e");
    } else if (input.grid < 0) {
        $(".balance-label").html("EXPORTING");
        $(".grid-now").parent().css("color","#2ed52e");
    } else {
        $(".balance-label").html("BALANCED");
        $(".grid-now").parent().css("color", "#89ae65");
        $(".grid-now").siblings('.power-unit').text("");
        grid = "--";
    }
    $(".grid-now").html(grid);
    
    // Battery charge/discharge status
    let battery = toFixed(Math.abs(input.battery) * scale, dp);

    if (input.battery > 0) {
        $(".battery_now_title").html("DISCHARGING");
    } else if (input.battery < 0) {
        $(".battery_now_title").html("CHARGING");
    } else {
        $(".battery_now_title").html("POWER");
    }
    $(".battery-now").html(battery);

    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && (autoupdate || reload)) process_and_draw_power_graph();
}

function solar_battery_visibility() {
    var s = available.solar;
    var b = available.battery;

    $("#live-solar-title").toggleClass("text-light", s);
    $("#live-solar-value").toggleClass("text-warning", s);

    var boxColors = {
        "#solar-box":   s ? "#dccc1f" : "#282828",
        "#battery-box": b ? "#fb7b50" : "#282828"
    };
    for (var id in boxColors) $(id).css("background-color", boxColors[id]);

    var arrowColors = {
        "#solar-to-grid-box":    s         ? flow_colors["solar_to_grid"]    : "#333",
        "#solar-to-load-box":    s         ? flow_colors["solar_to_load"]    : "#333",
        "#solar-to-battery-box": s && b    ? flow_colors["solar_to_battery"] : "#333",
        "#battery-to-load-box":  b         ? flow_colors["battery_to_load"]  : "#333",
        "#battery-to-grid-box":  b         ? flow_colors["battery_to_grid"]  : "#333",
        "#grid-to-battery-box":  b         ? flow_colors["grid_to_battery"]  : "#333",
        "#grid-to-load-box":               flow_colors["grid_to_load"]
    };
    for (var id in arrowColors) $(id).css("--statsbox-color", arrowColors[id]);

    $(".prc-solar").toggle(s);
    $(".prc-battery").toggle(b);
    $(".prc-solar-battery").toggle(s && b);

    $(".battery-section").toggle(b);
}

function toFixed(num, dp) {
    if (num === null || num === undefined || isNaN(num)) return "--";
    return parseFloat(num).toFixed(dp);
}

// Capacity in kWh, power in W, returns time left as string "Xh Ym"
function battery_time_left({ capacity, soc, battery_power }) {
    if (capacity <= 0 || soc < 0 || soc>100 || soc=="---" || battery_power === 0 || battery_power === null) return "--";

    // if discharging, soc_part is soc; if charging, soc_part is 100-soc (time to full charge)
    let soc_part = battery_power>0 ? soc : (100 - soc);
    let energy_remaining_kwh = (capacity * soc_part) / 100;

    let battery_power_kw = Math.abs(battery_power * 0.001); // convert W to kW
    let time_left_hours = energy_remaining_kwh / battery_power_kw;

    const hours_left = Math.floor(time_left_hours);
    const mins_left = Math.floor((time_left_hours*60) % 60);

    let time_left_str = "";
    if (hours_left > 0) time_left_str += `${hours_left}h `;
    if (hours_left < 10) time_left_str += `${mins_left}m`; // show minutes only if less than 10h left

    return time_left_str.trim();
}

function draw(load) {
    if (viewmode=="powergraph") {
        if (load) {
            load_process_draw_power_graph();
        } else {
            draw_powergraph();
        }
    }
    if (viewmode=="bargraph") {
        if (load) {
            // draw called from load
            load_bargraph();
        } else {
            draw_bargraph();
        }
        
    }
}


// ----------------------------------------------------------------------
// updateStats: write all stats-box DOM values from a flat flow data object.
// Keys match the flow naming convention used throughout the app.
// ----------------------------------------------------------------------
function updateStats(d) {

    // Reconstruct aggregate totals
    var solar_kwh      = d.solar_to_load + d.solar_to_grid + d.solar_to_battery;
    var use_kwh        = d.solar_to_load + d.battery_to_load + d.grid_to_load;
    var import_kwh     = d.grid_to_load + d.grid_to_battery;
    var export_kwh     = d.solar_to_grid + d.battery_to_grid;
    var grid_balance_kwh   = import_kwh - export_kwh;

    var use_from_import_prc = use_kwh > 0 ? (100 * d.grid_to_load / use_kwh).toFixed(0) + "%" : "";
    var solar_export_prc = solar_kwh > 0 ? (100 * d.solar_to_grid / solar_kwh).toFixed(0) + "%" : "";
    var solar_to_load_prc = solar_kwh > 0 ? (100 * d.solar_to_load / solar_kwh).toFixed(0) + "%" : "";
    var solar_to_battery_prc = solar_kwh > 0 ? (100 * d.solar_to_battery / solar_kwh).toFixed(0) + "%" : "";
    var use_from_solar_prc = use_kwh > 0 ? (100 * d.solar_to_load / use_kwh).toFixed(0) + "%" : "";
    var use_from_battery_prc = use_kwh > 0 ? (100 * d.battery_to_load / use_kwh).toFixed(0) + "%" : "";

    $(".total_solar_kwh").html(solar_kwh.toFixed(1));
    $(".total_use_kwh").html(use_kwh.toFixed(1));
    $(".total_import_direct_kwh").html(d.grid_to_load.toFixed(1));
    $(".total_grid_balance_kwh").html(grid_balance_kwh.toFixed(1));
    $(".use_from_import_prc").html(use_from_import_prc);

    $(".total_solar_direct_kwh").html(d.solar_to_load.toFixed(1));
    $(".total_solar_export_kwh").html(d.solar_to_grid.toFixed(1));
    $(".solar_export_prc").html(solar_export_prc);
    $(".solar_direct_prc").html(solar_to_load_prc);
    $(".solar_to_battery_prc").html(solar_to_battery_prc);
    $(".use_from_solar_prc").html(use_from_solar_prc);

    $(".total_battery_charge_from_solar_kwh").html(d.solar_to_battery.toFixed(1));
    $(".total_import_for_battery_kwh").html(d.grid_to_battery.toFixed(1));
    $(".total_battery_discharge_kwh").html(d.battery_to_load.toFixed(1));
    $(".total_battery_to_grid_kwh").html(d.battery_to_grid.toFixed(1));
    $(".use_from_battery_prc").html(use_from_battery_prc);

    toggleBatteryFlowVisibility(d.grid_to_battery, d.battery_to_grid);
}

// ----------------------------------------------------------------------
// toggleBatteryFlowVisibility: show/hide the battery import/export rows
// based on whether the flow values are significant (>= 0.1 kWh).
// ----------------------------------------------------------------------
function toggleBatteryFlowVisibility(grid_to_battery, battery_to_grid) {
    $("#battery_import").toggle(grid_to_battery >= 0.1);
    $("#battery_export").toggle(battery_to_grid >= 0.1);
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        resize()
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    // if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}

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

    //let result = flow_available();
    //vue_config.app_instructions = JSON.stringify(result, null, 2);
}

// ----------------------------------------------------------------------
// Auto-generate feed actions
// (delegate to config.autogen.* in appconf.js)
// ----------------------------------------------------------------------
function create_missing_feeds()  { config.autogen.create_missing_feeds(); }
function start_post_processor()    { config.autogen.start_post_processor(); }
function reset_feeds()           { config.autogen.reset_feeds(); }
