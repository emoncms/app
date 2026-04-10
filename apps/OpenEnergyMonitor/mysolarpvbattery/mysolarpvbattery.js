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

var flow_colors = {
    "solar_to_load":    "#bec745", 
    "solar_to_battery": "#a3d977", 
    "solar_to_grid":    "#dccc1f",
    "battery_to_load":  "#fbb450",
    "battery_to_grid":  "#f0913a",
    "grid_to_load":     "#44b3e2",
    "grid_to_battery":  "#82cbfc"
};

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
    "use":{"optional":true, "type":"feed", "autoname":"use", "description":"House or building use in watts"},
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "description":"Solar generation in watts"},
    "battery":{"optional":true, "type":"feed", "autoname":"battery_power", "description":"Battery power in watts, positive for discharge, negative for charge (only shown when has_battery is enabled)"},
    "grid":{"optional":true, "type":"feed", "autoname":"grid", "description":"Grid power in watts (positive for import, negative for export)"},

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
    if (key === 'has_solar' || key === 'has_battery') {
        config.UI();
    }
    render_autogen_feed_list();
};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

var live = false;
var reload = true;
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
    $("#zoomout").click(function () {view.zoomout(); reload = true; autoupdate = false; draw(true);});
    $("#zoomin").click(function () {view.zoomin(); reload = true; autoupdate = false; draw(true);});
    $('#right').click(function () {view.panright(); reload = true; autoupdate = false; draw(true);});
    $('#left').click(function () {view.panleft(); reload = true; autoupdate = false; draw(true);});
    
    $('.time').click(function () {
        view.timewindow($(this).attr("time")/24.0); 
        reload = true; 
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
    
    load_powergraph();
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
    if (config.app.has_solar.value && config.app.solar.value) available.solar = true;
    if (config.app.use.value) available.use = true;
    if (config.app.has_battery.value && config.app.battery.value) available.battery = true;
    if (config.app.grid.value) available.grid = true;

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

    console.log("Number of feeds configured: " + number_of_feeds);
    console.log("Deriving feed: " + derive);
    console.log("Assume zero solar: " + assume_zero_solar);
    console.log("Assume zero battery: " + assume_zero_battery);
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
    var is_landscape = $(window).height() < $(window).width();
    if (is_landscape) height = Math.min(height, width * 0.6);

    // min size to avoid flot errors
    if (height < 180) height = 180;
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
                updatetime = feeds[config.app[key].value].time * 0.001;
                break;
            }
        }

        if (updatetime) {
            // Append new data to timeseries for each available feed, and trim old data outside of view
            for (const key in available) {
                if (available[key]) {
                    timeseries.append(key, updatetime, input[key]);
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

    // convert W to kW
    if(powerUnit === 'kW') {
        input.solar = as_kw(input.solar)
        input.use = as_kw(input.use)
        input.battery = as_kw(input.battery)
        input.grid = as_kw(input.grid)
        
        $('.power-unit').text('kW')
        $('#app-block').addClass('in_kw');
    } else {
        $('.power-unit').text('W')
        $('#app-block').removeClass('in_kw');
    }

    $(".solarnow").html(input.solar);
    $(".usenow").html(input.use);
    $(".battery_soc").html(battery_soc_now);
    
    // Grid import/export status
    if (input.grid > 0) {
        $(".balance-label").html("IMPORTING");
        $(".balance").html(`<span style='color:#d52e2e'><span class="grid_now">${Math.round(input.grid)}</span><span class="power-unit">${powerUnit}</span></span>`);
    } else if (input.grid < 0) {
        $(".balance-label").html("EXPORTING");
        $(".balance").html(`<span style='color:#2ed52e'><span class="grid_now">${Math.round(-input.grid)}</span><span class="power-unit">${powerUnit}</span></span>`);
    } else {
        $(".balance-label").html("BALANCED");
        $(".balance").html("--");
    }
    
    // Battery charge/discharge status
    if (input.battery<0) {
        $(".battery_now_title").html("BATTERY CHARGING");
    } else if (input.battery>0) {
        $(".battery_now_title").html("BATTERY DISCHARGING");
    } else {
        $(".battery_now_title").html("BATTERY POWER");
    }
    $(".battery_now").html(Math.abs(input.battery));

    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && autoupdate) draw(true);
    // If 

}

function solar_battery_visibility() {
    var s = available.solar;
    var b = available.battery;

    $("#live-solar-title").toggleClass("text-light", s);
    $("#live-solar-value").toggleClass("text-warning", s);

    var boxColors = {
        "#solar-box":   s ? "#dccc1f" : "#262626",
        "#battery-box": b ? "#fb7b50" : "#262626"
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
    return `${hours_left}h ${mins_left}m`;
}

function draw(load) {
    if (viewmode=="powergraph") {
        if (load) load_powergraph();
        draw_powergraph();
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

function load_powergraph() {
    view.calc_interval(1500); // npoints = 1500;

    var mode = get_mode();

    // if we have all 4 feeds then we can just load them directly with no derivation needed

    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // Only load feeds that are actually configured; missing ones will be derived.
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        
        // getdata params: feedid,start,end,interval,average=0,delta=0,skipmissing=0,limitinterval=0,callback=false,context=false,timeformat='unixms'
        if (available.solar) {
            timeseries.load("solar", remove_null_values(feed.getdata(config.app.solar.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'), view.interval));
        }
        if (available.use) {
            timeseries.load("use", remove_null_values(feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'), view.interval));
        }
        if (available.battery) {
            timeseries.load("battery", remove_null_values(feed.getdata(config.app.battery.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'), view.interval));
        }
        if (available.grid) {
            timeseries.load("grid", remove_null_values(feed.getdata(config.app.grid.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'), view.interval));
        }
        if (battery_soc_available) {
            timeseries.load("battery_soc", remove_null_values(feed.getdata(config.app.battery_soc.value, view.start, view.end, view.interval, 0, 0, 0, 0, false, false, 'notime'), view.interval));
        }
    }
    // -------------------------------------------------------------------------------------------------------

    // Determine which feed we use as the time axis reference (any loaded feed will do)
    var ts_ref = config.app.use.value ? "use" : (config.app.grid.value ? "grid" : "solar");
    
    var solar_to_load_data = [];
    var solar_to_grid_data = [];
    var solar_to_battery_data = [];
    var battery_to_load_data = [];
    var battery_to_grid_data = [];
    var grid_to_load_data = [];
    var grid_to_battery_data = [];
    var battery_soc_data = [];
    
    var total_solar_to_load_kwh = 0;
    var total_solar_to_grid_kwh = 0;
    var total_solar_to_battery_kwh = 0;
    var total_battery_to_load_kwh = 0;
    var total_battery_to_grid_kwh = 0;
    var total_grid_to_load_kwh = 0;
    var total_grid_to_battery_kwh = 0;

    let battery_soc_now = null;

    var datastart = timeseries.start_time(ts_ref);
    var interval = view.interval;
    var power_to_kwh = interval / 3600000.0;

    var battery_soc_start = null;
    var battery_soc_end = null;

    for (var z=0; z<timeseries.length(ts_ref); z++) {
        var time = datastart + (1000 * interval * z);
        
        var input = {
            solar: available.solar ? timeseries.value("solar",z) : null,
            use: available.use ? timeseries.value("use",z) : null,
            battery: available.battery ? timeseries.value("battery",z) : null,
            grid: available.grid ? timeseries.value("grid",z) : null
        }

        input = flow_derive_missing(input);

        if (input.solar !== null || input.use !== null || input.battery !== null || input.grid !== null) {

            var flow = flow_calculation(input);

            // Accumulate kWh totals
            total_solar_to_load_kwh += flow.solar_to_load * power_to_kwh;
            total_solar_to_grid_kwh += flow.solar_to_grid * power_to_kwh;
            total_solar_to_battery_kwh += flow.solar_to_battery * power_to_kwh;
            total_battery_to_load_kwh += flow.battery_to_load * power_to_kwh;
            total_battery_to_grid_kwh += flow.battery_to_grid * power_to_kwh;
            total_grid_to_load_kwh += flow.grid_to_load * power_to_kwh;
            total_grid_to_battery_kwh += flow.grid_to_battery * power_to_kwh;

            solar_to_load_data.push([time, flow.solar_to_load]);
            solar_to_grid_data.push([time, flow.solar_to_grid]);
            solar_to_battery_data.push([time, flow.solar_to_battery]);
            battery_to_load_data.push([time, flow.battery_to_load]);
            battery_to_grid_data.push([time, flow.battery_to_grid]);
            grid_to_load_data.push([time, flow.grid_to_load]);
            grid_to_battery_data.push([time, flow.grid_to_battery]);

        }

        // SOC
        if (battery_soc_available) {
            battery_soc_now = timeseries.value("battery_soc",z);

            if (battery_soc_start === null && battery_soc_now !== null) {
                battery_soc_start = battery_soc_now;
            }

            if (battery_soc_now !== null) {
                battery_soc_end = battery_soc_now;
            }
        }
        battery_soc_data.push([time, battery_soc_now]);
    }

    // Update stats boxes with totals and ratios derived from the flow decomposition
    updateStats({
        solar_to_load:    total_solar_to_load_kwh,
        solar_to_grid:    total_solar_to_grid_kwh,
        solar_to_battery: total_solar_to_battery_kwh,
        battery_to_load:  total_battery_to_load_kwh,
        battery_to_grid:  total_battery_to_grid_kwh,
        grid_to_load:     total_grid_to_load_kwh,
        grid_to_battery:  total_grid_to_battery_kwh
    });
    
    var soc_change = 0; 
    if (battery_soc_available) {
        soc_change = battery_soc_end-battery_soc_start;
    }
    var sign = ""; if (soc_change>=0) sign = "+";
    $(".battery_soc_change").html(sign+soc_change.toFixed(1));
    
    powerseries = [];
    powerseries.push({data: solar_to_load_data,    label: "Solar to Load",    color: flow_colors["solar_to_load"],    stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: solar_to_battery_data, label: "Solar to Battery", color: flow_colors["solar_to_battery"], stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: solar_to_grid_data,    label: "Solar to Grid",    color: flow_colors["solar_to_grid"],    stack: 1, lines: {lineWidth: 0, fill: 1.0}});
    powerseries.push({data: battery_to_load_data,  label: "Battery to Load",  color: flow_colors["battery_to_load"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: battery_to_grid_data,  label: "Battery to Grid",  color: flow_colors["battery_to_grid"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_load_data,     label: "Grid to Load",     color: flow_colors["grid_to_load"],     stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_battery_data,  label: "Grid to Battery",  color: flow_colors["grid_to_battery"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});

    if (battery_soc_available) {
        // only add if time period is less or equall to 1 month
        if ((view.end - view.start) <= 3600000*24*32) {
            powerseries.push({data:battery_soc_data, label: "SOC", yaxis:2, color: "#888"});
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

// ----------------------------------------------------------------------
// kwhd_val: safely read a daily kWh value from a feed data array.
// Returns 0 when the entry or its value is null/undefined.
// ----------------------------------------------------------------------
function kwhd_val(arr, idx) {
    if (arr === null || arr === undefined) return 0;
    if (arr[idx] === undefined) return 0;

    return (arr[idx] && arr[idx][1] !== null) ? arr[idx][1] : 0;
}

function draw_powergraph() {

    var options = {
        lines: { fill: false },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
        yaxes: [{ min: 0 },{ min: 0, max: 100 }],
        grid: { hoverable: true, clickable: true },
        selection: { mode: "x" },
        legend: { show: false }
    }
    
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    $.plot($('#placeholder'),powerseries,options);
    $(".ajax-loader").hide();
}

// ------------------------------------------------------------------------------------------
// POWER GRAPH EVENTS
// ------------------------------------------------------------------------------------------
function powergraph_events() {
    $(".visnav[time=1], .visnav[time=3], .visnav[time=6], .visnav[time=24]").show();
            
    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");

    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            // Show tooltip
            var tooltip_items = [];

            var date = new Date(item.datapoint[0]);
            tooltip_items.push(["TIME", dateFormat(date, 'HH:MM'), ""]);

            for (i = 0; i < powerseries.length; i++) {
                var series = powerseries[i];
                if (series.data[item.dataIndex]!=undefined && series.data[item.dataIndex][1]!=null) {
                    if (series.label.toUpperCase()=="SOC") {
                        tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "%", series.color]);
                    } else {
                        if (series.data[item.dataIndex][1] != 0) {
                            if ( series.data[item.dataIndex][1] >= 1000) {
                                tooltip_items.push([series.label.toUpperCase(), (series.data[item.dataIndex][1]/1000.0).toFixed(1) , "kW", series.color]);
                            } else {
                                tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0), "W", series.color]);
                            }
                        }
                    }
                }
            }
            show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

    $('#placeholder').bind("plotselected", function (event, ranges) {
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;

        autoupdate = false;
        reload = true; 
        
        var now = +new Date();
        if (Math.abs(view.end-now)<30000) {
            autoupdate = true;
            live_timerange = view.end - view.start;
        }

        draw(true);
    });
}

// ======================================================================================
// PART 2: BAR GRAPH PAGE
// ======================================================================================

// --------------------------------------------------------------------------------------
// INIT BAR GRAPH
// - load cumulative kWh feeds
// - calculate used solar, solar, used and exported kwh/d
// --------------------------------------------------------------------------------------
function init_bargraph() {
    bargraph_initialized = true;
    // Fetch the earliest start_time from grid_to_load
    var m = feed.getmeta(config.app.grid_to_load_kwh.value);
    var earliest_start_time = m.start_time;
    latest_start_time = earliest_start_time;
    view.first_data = latest_start_time * 1000;
}

function load_bargraph() {
    var interval = 3600*24;
    var intervalms = interval * 1000;
    var mode = get_mode();
    
    var end = view.end;
    var start = view.start;
    
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;

    // Feed definitions: key -> { guard, feedkey }
    // guard: condition under which this flow feed is applicable to the current mode
    var flow_defs = [
        { key: 'grid_to_load',     guard: true,                              },
        { key: 'solar_to_load',    guard: mode.has_solar,                    },
        { key: 'solar_to_grid',    guard: mode.has_solar,                    },
        { key: 'solar_to_battery', guard: mode.has_solar && mode.has_battery },
        { key: 'battery_to_load',  guard: mode.has_battery,                  },
        { key: 'battery_to_grid',  guard: mode.has_battery,                  },
        { key: 'grid_to_battery',  guard: mode.has_battery,                  }
    ];

    var keys_to_load = [];
    var feedids = [];
    flow_defs.forEach(function(d) {
        if (d.guard && config.app[d.key + "_kwh"] && config.app[d.key + "_kwh"].value) {
            keys_to_load.push(d.key);
            feedids.push(config.app[d.key + "_kwh"].value);
        }
    });
    
    // Load raw daily delta data for each applicable flow
    feed.getdata(feedids, start, end, "daily", 0, 1, 0, 0, function (all_data) {

        // if success false
        if (all_data.success === false) {
            historyseries = [];
            draw_bargraph();
            return;
        }

        var raw = {};
        var idx = 0;
        keys_to_load.forEach(function(key) {
            raw[key] = all_data[idx].data;
            idx++;
        });

        // Per-day arrays for graph and hover access (global so bargraph_events can read them)
        kwhd_data = {};
        flow_defs.forEach(function(d) { kwhd_data[d.key] = []; });

        for (var day = 0; day < raw['grid_to_load'].length; day++) {
            var time = raw['grid_to_load'][day][0];

            // Only skip days where both reference feeds are null
            // var required_ok = (raw['grid_to_load'][day]  && raw['grid_to_load'][day][1]  !== null) ||
            //                   (raw['solar_to_load'][day] && raw['solar_to_load'][day][1] !== null);
            // if (!required_ok) continue;

            flow_defs.forEach(function(d) {
                kwhd_data[d.key].push([time, kwhd_val(raw[d.key], day)]);
            });
        }

        // Series definitions: label, color, stack (1=positive/load, 0=negative/export)
        var series_defs = [
            // Stack 1: onsite use breakdown (positive bars above zero)
            { key: 'solar_to_load',    label: "Solar to Load",    color: flow_colors["solar_to_load"],    stack: 1, invert: false },
            { key: 'battery_to_load',  label: "Battery to Load",  color: flow_colors["battery_to_load"],  stack: 1, invert: false },
            { key: 'grid_to_load',     label: "Grid to Load",     color: flow_colors["grid_to_load"],     stack: 1, invert: false },
            // Stack 0: exports (negative bars below zero)
            { key: 'solar_to_grid',    label: "Solar to Grid",    color: flow_colors["solar_to_grid"],    stack: 0, invert: true  },
            { key: 'battery_to_grid',  label: "Battery to Grid",  color: flow_colors["battery_to_grid"],  stack: 0, invert: true  }
        ];

        historyseries = [];
        
        series_defs.forEach(function(def) {
            var data = kwhd_data[def.key];
            if (!data.length) return;
            historyseries.push({
                data:  def.invert ? invert_kwhd_data(data) : data,
                label: def.label,
                color: def.color,
                bars:  { show: true, align: "center", barWidth: 0.8 * 3600 * 24 * 1000, fill: 0.9, lineWidth: 0 },
                stack: def.stack
            });
        });

        draw_bargraph();

    }, false);
}

function invert_kwhd_data(data) {
    var neg_data = [];
    for (var i = 0; i < data.length; i++) {
        neg_data.push([data[i][0], -1 * data[i][1]]);
    }
    return neg_data;
}

// ------------------------------------------------------------------------------------------
// DRAW BAR GRAPH
// Because the data for the bargraph only needs to be loaded once at the start we seperate out
// the data loading part to init and the draw part here just draws the bargraph to the flot
// placeholder overwritting the power graph as the view is changed.
// ------------------------------------------------------------------------------------------    
function draw_bargraph()
{
    var markings = [];
    markings.push({ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } });
    
    var options = {
        xaxis: { mode: "time", timezone: "browser", minTickSize: [1, "day"] },
        grid: { hoverable: true, clickable: true, markings: markings },
        selection: { mode: "x" },
        legend: { show: false }
    };
    
    var plot = $.plot($('#placeholder'),historyseries,options);
    
    $('#placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Onsite Use &amp; Total Use</div>");
    $('#placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Total export (solar + battery to grid)</div>");
}

// ------------------------------------------------------------------------------------------
// BAR GRAPH EVENTS
// - show bar values on hover
// - click through to power graph
// ------------------------------------------------------------------------------------------
function bargraph_events() {
    $(".visnav[time=1], .visnav[time=3], .visnav[time=6], .visnav[time=24]").hide();
            
    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    
    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            var z = item.dataIndex;
            var mode = get_mode();
            
            // Read directly from the fine-grained flow feed data arrays (0 when not applicable in mode)
            updateStats({
                solar_to_load:    kwhd_val(kwhd_data['solar_to_load'], z),
                solar_to_grid:    kwhd_val(kwhd_data['solar_to_grid'], z),
                solar_to_battery: kwhd_val(kwhd_data['solar_to_battery'], z),
                battery_to_load:  kwhd_val(kwhd_data['battery_to_load'], z),
                battery_to_grid:  kwhd_val(kwhd_data['battery_to_grid'], z),
                grid_to_load:     kwhd_val(kwhd_data['grid_to_load'], z),
                grid_to_battery:  kwhd_val(kwhd_data['grid_to_battery'], z)
            });
            $(".battery_soc_change").html("---");

        } else {
            // Hide tooltip
            hide_tooltip();
        }
    });

    // Auto click through to power graph
    $('#placeholder').bind("plotclick", function (event, pos, item)
    {
        if (item && !panning) {
            var z = item.dataIndex;
            
            history_start = view.start;
            history_end = view.end;
            // Use whichever per-day data array has data
            var ref_day_data = kwhd_data['grid_to_load'].length ? kwhd_data['grid_to_load'] : kwhd_data['solar_to_load'];
            view.start = ref_day_data[z][0];
            view.end = view.start + 86400*1000;

            $(".balanceline").attr('disabled',false);
            $(".viewhistory").toggleClass('active');
            
            reload = true; 
            autoupdate = false;
            viewmode = "powergraph";
            
            draw(true);
            powergraph_events();
        }
    });
    
    
    $('#placeholder').bind("plotselected", function (event, ranges) {
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;
        draw(true);
        panning = true; setTimeout(function() {panning = false; }, 100);
    });
    
    $('.bargraph-viewall').click(function () {
        view.start = latest_start_time * 1000;
        view.end = +new Date;
        draw(true);
    });
}

// ------------------------------------------------------------------------------------------
// TOOLTIP HANDLING
// Show & hide the tooltip
// ------------------------------------------------------------------------------------------
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

    for (i = 0; i < values.length; i++) {
        var value = values[i];
        var row = $('<tr class="tooltip-item"/>').appendTo(table);
        var swatch = value[3] ? '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+value[3]+';margin-right:6px"></span>' : '';
        $('<td style="padding-right: 8px">'+swatch+'<span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    }

    tooltip
        .css({
            left: x,
            top: y
        })
        .show();
}

function hide_tooltip() {
    $('#tooltip').hide();
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        resize()
    })
})

// Remove null gaps shorter than 15 minutes by forward-filling from the last
// known good value. Longer gaps are left as null so the graph shows a break.
function remove_null_values(data, interval) {
    let last_valid_pos = 0;
    for (let pos = 0; pos < data.length; pos++) {
        if (data[pos][1] != null) {
            let null_duration_s = (pos - last_valid_pos) * interval;
            if (null_duration_s < 900) {   // 900 seconds = 15 minutes
                for (let x = last_valid_pos + 1; x < pos; x++) {
                    data[x][1] = data[last_valid_pos][1];
                }
            }
            last_valid_pos = pos;
        }
    }
    return data;
}

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
}

// ----------------------------------------------------------------------
// Auto-generate feed actions
// (delegate to config.autogen.* in appconf.js)
// ----------------------------------------------------------------------
function create_missing_feeds()  { config.autogen.create_missing_feeds(); }
function start_post_processor()    { config.autogen.start_post_processor(); }
function reset_feeds()           { config.autogen.reset_feeds(); }