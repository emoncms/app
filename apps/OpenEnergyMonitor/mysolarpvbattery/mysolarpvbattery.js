
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

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    // == System configuration ==
    // Select which metering points are present on the system.
    // When has_solar=false, the solar feed is hidden and solar power is treated as 0.
    // When has_battery=false, the battery_power feed is hidden and battery power is treated as 0.
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
    "solar":{"optional":true, "type":"feed", "autoname":"solar", "description":"Solar generation in watts (only shown when has_solar is enabled)"},
    "battery_power":{"optional":true, "type":"feed", "autoname":"battery_power", "description":"Battery power in watts, positive for discharge, negative for charge (only shown when has_battery is enabled)"},
    "grid":{"optional":true, "type":"feed", "autoname":"grid", "description":"Grid power in watts (positive for import, negative for export)"},

    // Battery state of charge feed (optional)
    "battery_soc":{"optional":true, "type":"feed", "autoname":"battery_soc", "description":"Battery state of charge in % (only shown when has_battery is enabled)"},

    // History feeds (energy flow breakdown from solarbatterykwh post-processor)
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
//   has_solar + has_battery: at least 3 of (use, solar, battery_power, grid) must be configured
//   has_solar only:          at least 2 of (use, solar, grid) must be configured
//   has_battery only:        at least 2 of (use, battery_power, grid) must be configured
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
    var bat_ok   = feed_resolved("battery_power");
    var grid_ok  = feed_resolved("grid");

    if (has_solar && has_battery) {
        // Need at least 3 of the 4 feeds
        return ((use_ok?1:0) + (solar_ok?1:0) + (bat_ok?1:0) + (grid_ok?1:0)) >= 3;
    } else if (has_solar && !has_battery) {
        // Need at least 2 of (use, solar, grid)
        return ((use_ok?1:0) + (solar_ok?1:0) + (grid_ok?1:0)) >= 2;
    } else if (!has_solar && has_battery) {
        // Need at least 2 of (use, battery_power, grid)
        return ((use_ok?1:0) + (bat_ok?1:0) + (grid_ok?1:0)) >= 2;
    } else {
        // Consumption only: need at least 1 of (use, grid)
        return use_ok || grid_ok;
    }
};

config.feeds = feed.list();

var feeds_by_tag_name = feed.by_tag_and_name(config.feeds);

config.autogen_node_prefix = "app_mysolarpvbattery";
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
    config.app.battery_power.hidden = !mode.has_battery;
    config.app.battery_soc.hidden   = !mode.has_battery;
    config.app.battery_capacity_kwh.hidden = !mode.has_battery;
    // autogenerate feeds: hide battery-specific ones if no battery, solar-specific if no solar
    config.app.solar_to_load_kwh.hidden    = false; // always potentially present
    config.app.solar_to_grid_kwh.hidden    = false;
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
};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

var live = false;
var show_battery_soc = 1;
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

// ----------------------------------------------------------------------
// update_mode_ui: show/hide app-block sections based on the current mode
// ----------------------------------------------------------------------
function update_mode_ui(mode) {
    if (mode.has_solar) {
        $(".solar-section").show();
    } else {
        $(".solar-section").hide();
    }

    if (mode.has_battery) {
        $(".battery-section").show();
    } else {
        $(".battery-section").hide();
    }

    // The stats table rows for solar export and battery flows
    if (mode.has_solar) {
        $("#statsbox-generation").show();
    } else {
        $("#statsbox-generation").hide();
    }
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

    // Show/hide UI sections based on mode
    update_mode_ui(mode);

    render_autogen_feed_list();

    view.end = power_end;
    view.start = power_start;

    // Load metadata from whatever feeds are actually configured to find data end time
    var feeds_to_check = ["use", "solar", "battery_power", "grid"];
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
    if (has_history) {
        init_bargraph();
        $(".viewhistory").show();
    } else {
        $(".viewhistory").hide();
    }
    
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
    if (check_history_feeds(mode)) {
        if (!bargraph_initialized) init_bargraph();
    }
    
    load_powergraph();
    resize();
    powergraph_events();
    
    livefn();
    live = setInterval(livefn,5000);

    // Trigger post processor for kWh data
    let process_timeout = 60; // seconds
    /*
    $.ajax({
        url: path + "app/process",
        data: { id: config.id, apikey: apikey, timeout: process_timeout },
        async: true,
        success: function (result) {
            console.log("Post processor triggered successfully");
            console.log(result);
        }
    });
    */
}

function resize() 
{
    app_log("INFO","solar & battery resize");
    
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var is_landscape = $(window).height() < $(window).width();
    var width = placeholder_bound.width();
    var height = $(window).height()*(is_landscape ? 0.3: 0.3);

    if (height>width) height = width;

    // min size to avoid flot errors
    if (height<180) height = 180;
    if (width<200) width = 200;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
    
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

    var mode = get_mode();

    var feeds = feed.listbyid();
    if (feeds === null) { return; }

    // Read whichever feeds are configured; treat missing/mode-disabled ones as 0
    var solar_now        = (mode.has_solar   && config.app.solar.value        && feeds[config.app.solar.value])        ? parseInt(feeds[config.app.solar.value].value)        : 0;
    var use_now          = (config.app.use.value                               && feeds[config.app.use.value])          ? parseInt(feeds[config.app.use.value].value)          : null;
    var battery_power_now= (mode.has_battery  && config.app.battery_power.value && feeds[config.app.battery_power.value]) ? parseInt(feeds[config.app.battery_power.value].value) : 0;
    var grid_now         = (config.app.grid.value                              && feeds[config.app.grid.value])         ? parseInt(feeds[config.app.grid.value].value)         : null;

    // Derive the missing feed from conservation of energy:
    //   use = solar + battery_power + grid  →  any one can be derived from the other three
    if (use_now === null && grid_now !== null) {
        use_now = grid_now + battery_power_now + solar_now;
    } else if (grid_now === null && use_now !== null) {
        grid_now = use_now - battery_power_now - solar_now;
    } else if (use_now === null && grid_now === null) {
        // Both missing – nothing we can do; bail out silently
        return;
    }

    // In battery-only mode, battery_power may be the derived quantity
    if (!mode.has_battery) {
        battery_power_now = 0; // no battery on this system
    } else if (mode.has_battery && !config.app.battery_power.value) {
        // battery is present but no feed configured → derive it
        battery_power_now = use_now - grid_now - solar_now;
    }

    // In solar-only mode, solar may be the derived quantity
    if (!mode.has_solar) {
        solar_now = 0;
    } else if (mode.has_solar && !config.app.solar.value) {
        solar_now = use_now - grid_now - battery_power_now;
    }

    var battery_soc_now = "---";
    if (mode.has_battery && config.app.battery_soc.value && feeds[config.app.battery_soc.value] != undefined) {
        battery_soc_now = parseInt(feeds[config.app.battery_soc.value].value);
    }

    // Determine the reference time for autoupdate (use whichever feed we have)
    var ref_feed_key = config.app.solar.value ? "solar" : (config.app.use.value ? "use" : "grid");
    var ref_feed_id  = config.app[ref_feed_key].value;

    if (autoupdate) {
        var updatetime = feeds[ref_feed_id] ? feeds[ref_feed_id].time : now * 0.001;

        if (mode.has_solar && config.app.solar.value) {
            timeseries.append("solar", updatetime, solar_now);
            timeseries.trim_start("solar", view.start*0.001);
        }
        timeseries.append("use", updatetime, use_now);
        timeseries.trim_start("use", view.start*0.001);

        if (mode.has_battery && config.app.battery_power.value) {
            timeseries.append("battery_power", updatetime, battery_power_now);
            timeseries.trim_start("battery_power", view.start*0.001);
        }
        timeseries.append("grid", updatetime, grid_now);
        timeseries.trim_start("grid", view.start*0.001);
        
        if (mode.has_battery && config.app.battery_soc.value) {
            timeseries.append("battery_soc", updatetime, battery_soc_now);
            timeseries.trim_start("battery_soc", view.start*0.001);
        }
       
        // Advance view
        view.end = now;
        view.start = now - live_timerange;
    }

    // balance = grid export (positive) or import (negative), shown from grid perspective
    // negative grid_now = export = positive balance
    var balance = -grid_now;

    var battery_charge_now = 0;
    var battery_discharge_now = 0;
    if (mode.has_battery) {
        if (battery_power_now > 0) {
            battery_discharge_now = battery_power_now;
        } else {
            battery_charge_now = -battery_power_now;
        }
    }

    // convert W to kW
    var gen_now;
    if(powerUnit === 'kW') {
        gen_now = as_kw(solar_now)
        solar_now = as_kw(solar_now)
        use_now = as_kw(use_now)
        balance = as_kw(balance)
        battery_charge_now = as_kw(battery_charge_now)
        battery_discharge_now = as_kw(battery_discharge_now)
        $('.power-unit').text('kW')
        $('#app-block').addClass('in_kw');
    } else {
        solar_now = Math.round(solar_now)
        gen_now = solar_now
        balance = Math.round(balance)
        $('.power-unit').text('W')
        $('#app-block').removeClass('in_kw');
    }

    if (balance==0) {
        $(".balance-label").html("PERFECT BALANCE");
        $(".balance").html("--");
    }
    
    if (balance>0) {
        $(".balance-label").html("EXPORTING");
        $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }
    
    if (balance<0) {
        $(".balance-label").html("IMPORTING");
        $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }
    
    $(".generationnow").html(gen_now);
    $(".usenow").html(use_now);
    $(".battery_soc").html(battery_soc_now);

    const net_battery_charge = battery_charge_now - battery_discharge_now;
    if (net_battery_charge>0) {
        $(".battery_charge_discharge_title").html("BATTERY CHARGING");
        $(".battery_charge_discharge").html(net_battery_charge);
        $(".discharge_time_left").html("--");
    } else if (net_battery_charge<0) {
        if (config.app.battery_capacity_kwh.value > 0 && battery_soc_now >= 0 && powerUnit === 'kW') {
            const total_capacity = config.app.battery_capacity_kwh.value;
            const energy_remaining = total_capacity * battery_soc_now / 100;
            const total_time_left_mins = (energy_remaining / -(net_battery_charge)) * 60;

            const hours_left = Math.floor(total_time_left_mins / 60);
            const mins_left = Math.floor(total_time_left_mins % 60);
            const battery_time_left_text = `${hours_left}h ${mins_left}m`
            $(".discharge_time_left").html(battery_time_left_text);
        } else {
            $(".discharge_time_left").html("--");
        }

        $(".battery_charge_discharge_title").html("BATTERY DISCHARGING");
        $(".battery_charge_discharge").html(-net_battery_charge);
    } else {
        $(".battery_charge_discharge_title").html("BATTERY POWER");
        $(".battery_charge_discharge").html(0);
        $(".discharge_time_left").html("--");
    }
    
    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && autoupdate) draw(true);
}

function draw(load) {
    if (viewmode=="powergraph") {
        if (load) load_powergraph();
        draw_powergraph();
    }
    if (viewmode=="bargraph") {
        if (load) load_bargraph();
        draw_bargraph();
    }
}

function load_powergraph() {
    view.calc_interval(1500); // npoints = 1500;

    var mode = get_mode();

    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // Only load feeds that are actually configured; missing ones will be derived.
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        // getdata params: feedid,start,end,interval,average=0,delta=0,skipmissing=0,limitinterval=0,callback=false,context=false,timeformat='unixms'
        if (mode.has_solar && config.app.solar.value) {
            timeseries.load("solar", feed.getdata(config.app.solar.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'));
        }
        if (config.app.use.value) {
            timeseries.load("use", feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'));
        }
        if (mode.has_battery && config.app.battery_power.value) {
            timeseries.load("battery_power", feed.getdata(config.app.battery_power.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'));
        }
        if (config.app.grid.value) {
            timeseries.load("grid", feed.getdata(config.app.grid.value, view.start, view.end, view.interval, 1, 0, 0, 0, false, false, 'notime'));
        }
        if (mode.has_battery && config.app.battery_soc.value) {
            timeseries.load("battery_soc", feed.getdata(config.app.battery_soc.value, view.start, view.end, view.interval, 0, 0, 0, 0, false, false, 'notime'));
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
    
    var use_now = 0;
    var solar_now = 0;
    var battery_power_now = 0;
    var grid_now = 0;
    var battery_soc_now = 0;
    
    var total_solar_kwh = 0;
    var total_use_kwh = 0;
    var total_import_kwh = 0;
    var total_export_kwh = 0;
    var total_solar_to_load_kwh = 0;
    var total_solar_to_grid_kwh = 0;
    var total_solar_to_battery_kwh = 0;
    var total_battery_to_load_kwh = 0;
    var total_battery_to_grid_kwh = 0;
    var total_grid_to_load_kwh = 0;
    var total_grid_to_battery_kwh = 0;

    // Track which feeds were actually loaded (null = derived)
    var has_solar_ts   = mode.has_solar   && !!config.app.solar.value;
    var has_use_ts     = !!config.app.use.value;
    var has_battery_ts = mode.has_battery && !!config.app.battery_power.value;
    var has_grid_ts    = !!config.app.grid.value;

    var datastart = timeseries.start_time(ts_ref);
    
    var last_solar = 0;
    var last_use = 0;
    var last_battery_power = 0;
    var last_grid = 0;
    var last_soc = 0;

    // When only 3 feeds are present, the timeout check only applies to those 3
    // Build the list of feeds to include in the timeout guard
    var timeout_keys = [];
    if (has_solar_ts)   timeout_keys.push("solar");
    if (has_use_ts)     timeout_keys.push("use");
    if (has_battery_ts) timeout_keys.push("battery_power");
    if (has_grid_ts)    timeout_keys.push("grid");

    var timeout = 600*1000;
    
    var interval = view.interval;
    var power_to_kwh = interval / 3600000.0;

    for (var z=0; z<timeseries.length(ts_ref); z++) {
        var time = datastart + (1000 * interval * z);
        
        if (has_solar_ts && timeseries.value("solar",z)!=null) {
            solar_now = timeseries.value("solar",z);
            last_solar = time;
        }
        if (has_use_ts && timeseries.value("use",z)!=null) {
            use_now = timeseries.value("use",z);
            last_use = time;
        }
        if (has_battery_ts && timeseries.value("battery_power",z)!=null) {
            battery_power_now = timeseries.value("battery_power",z);
            last_battery_power = time;
        }
        if (has_grid_ts && timeseries.value("grid",z)!=null) {
            grid_now = timeseries.value("grid",z);
            last_grid = time;
        }
        if (mode.has_battery && config.app.battery_soc.value && timeseries.value("battery_soc",z)!=null) {
            battery_soc_now = timeseries.value("battery_soc",z);
            last_soc = time;
        }

        // Check that all loaded feeds have recent data (within timeout)
        var data_ok = true;
        if (has_solar_ts   && (time - last_solar)        >= timeout) data_ok = false;
        if (has_use_ts     && (time - last_use)           >= timeout) data_ok = false;
        if (has_battery_ts && (time - last_battery_power) >= timeout) data_ok = false;
        if (has_grid_ts    && (time - last_grid)          >= timeout) data_ok = false;

        if (data_ok) {
            
            // -------------------------------------------------------------------------------------------------------
            // Derive the missing feed from conservation of energy:
            //   use = solar + battery_power + grid
            // In no-solar mode solar is always 0; in no-battery mode battery_power is always 0.
            // -------------------------------------------------------------------------------------------------------
            var solar        = has_solar_ts   ? solar_now        : (!mode.has_solar   ? 0 : (use_now - grid_now - battery_power_now));
            var battery_power= has_battery_ts ? battery_power_now: (!mode.has_battery ? 0 : (use_now - grid_now - solar_now));
            var grid         = has_grid_ts    ? grid_now         : (use_now - solar - battery_power);
            var use          = has_use_ts     ? use_now          : (solar + battery_power + grid);

            // -------------------------------------------------------------------------------------------------------
            // Flow decomposition
            // Conservation of energy: use = solar + battery_power + grid
            // battery_power: positive = discharge, negative = charge
            // grid: positive = import, negative = export
            // -------------------------------------------------------------------------------------------------------
            var import_power = 0;
            var export_power = 0;
            if (grid > 0) {
                import_power = grid;
            } else {
                export_power = -grid;
            }

            // SOLAR flows
            var solar_to_load = Math.min(solar, use);
            var solar_to_battery = 0;
            if (battery_power < 0) {
                // Battery is charging: solar to battery is the lesser of available solar and battery charge power
                solar_to_battery = Math.min(solar - solar_to_load, -battery_power);
            }
            var solar_to_grid = solar - solar_to_load - solar_to_battery;

            // BATTERY flows
            var battery_to_load = 0;
            var battery_to_grid = 0;
            if (battery_power > 0) {
                // Battery is discharging
                battery_to_load = Math.min(battery_power, use - solar_to_load);
                battery_to_grid = battery_power - battery_to_load;
            }

            // GRID flows
            var grid_to_load = 0;
            var grid_to_battery = 0;
            if (import_power > 0) {
                grid_to_load = Math.min(import_power, use - solar_to_load - battery_to_load);
                grid_to_battery = Math.min(import_power - grid_to_load, battery_power < 0 ? -battery_power - solar_to_battery : 0);
            }

            // Accumulate kWh totals
            total_solar_kwh += solar * power_to_kwh;
            total_use_kwh += use * power_to_kwh;
            total_import_kwh += import_power * power_to_kwh;
            total_export_kwh += export_power * power_to_kwh;
            total_solar_to_load_kwh += solar_to_load * power_to_kwh;
            total_solar_to_grid_kwh += solar_to_grid * power_to_kwh;
            total_solar_to_battery_kwh += solar_to_battery * power_to_kwh;
            total_battery_to_load_kwh += battery_to_load * power_to_kwh;
            total_battery_to_grid_kwh += battery_to_grid * power_to_kwh;
            total_grid_to_load_kwh += grid_to_load * power_to_kwh;
            total_grid_to_battery_kwh += grid_to_battery * power_to_kwh;

            solar_to_load_data.push([time, solar_to_load]);
            solar_to_grid_data.push([time, solar_to_grid]);
            solar_to_battery_data.push([time, solar_to_battery]);
            battery_to_load_data.push([time, battery_to_load]);
            battery_to_grid_data.push([time, battery_to_grid]);
            grid_to_load_data.push([time, grid_to_load]);
            grid_to_battery_data.push([time, grid_to_battery]);
            battery_soc_data.push([time, battery_soc_now]);
        } else {
            solar_to_load_data.push([time, null]);
            solar_to_grid_data.push([time, null]);
            solar_to_battery_data.push([time, null]);
            battery_to_load_data.push([time, null]);
            battery_to_grid_data.push([time, null]);
            grid_to_load_data.push([time, null]);
            grid_to_battery_data.push([time, null]);
            battery_soc_data.push([time, null]);
        }
    }
    
    // Derived totals for display
    var total_solar_direct_kwh = total_solar_to_load_kwh;
    var total_solar_export_kwh = total_solar_to_grid_kwh;           // solar→grid only
    var total_all_export_kwh = total_solar_to_grid_kwh + total_battery_to_grid_kwh; // total export for grid balance
    var total_battery_charge_from_solar_kwh = total_solar_to_battery_kwh;
    var total_import_direct_kwh = total_grid_to_load_kwh;
    var total_import_for_battery_kwh = total_grid_to_battery_kwh;
    var total_battery_discharge_kwh = total_battery_to_load_kwh;   // battery→load only
    var total_grid_balance_kwh = total_import_kwh - total_all_export_kwh;
    
    $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
    $(".total_use_kwh").html(total_use_kwh.toFixed(1));
    $(".total_import_direct_kwh").html(total_import_direct_kwh.toFixed(1));
    $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
    if (total_solar_kwh) {
        $(".total_solar_direct_kwh").html(total_solar_direct_kwh.toFixed(1));
        $(".total_solar_export_kwh").html(total_solar_export_kwh.toFixed(1));
        $(".solar_export_prc").html((100*total_solar_export_kwh/total_solar_kwh).toFixed(0)+"%");
        $(".solar_direct_prc").html((100*total_solar_direct_kwh/total_solar_kwh).toFixed(0)+"%");
        $(".solar_to_battery_prc").html((100*total_battery_charge_from_solar_kwh/total_solar_kwh).toFixed(0)+"%");
        
        $(".use_from_solar_prc").html((100*total_solar_direct_kwh/total_use_kwh).toFixed(0)+"%");
    }
    $(".use_from_import_prc").html((100*total_import_direct_kwh/total_use_kwh).toFixed(0)+"%");
    $(".total_battery_charge_from_solar_kwh").html(total_battery_charge_from_solar_kwh.toFixed(1));
    $(".total_import_for_battery_kwh").html(total_import_for_battery_kwh.toFixed(1));
    $(".total_battery_discharge_kwh").html(total_battery_discharge_kwh.toFixed(1));
    $(".total_battery_to_grid_kwh").html(total_battery_to_grid_kwh.toFixed(1));
    $(".use_from_battery_prc").html((100*total_battery_to_load_kwh/total_use_kwh).toFixed(0)+"%");
    
    if (total_import_for_battery_kwh>=0.1) {
        $("#battery_import").show();
    } else {
        $("#battery_import").hide();
    }
    
    if (total_battery_to_grid_kwh>=0.1) {
        $("#battery_export").show();
    } else {
        $("#battery_export").hide();
    }
    
    
    var soc_change = 0; 
    if (mode.has_battery && config.app.battery_soc.value) {
        soc_change = battery_soc_now-timeseries.value("battery_soc",0);
    }
    var sign = ""; if (soc_change>0) sign = "+";
    $(".battery_soc_change").html(sign+soc_change.toFixed(1));
    
    powerseries = [];

    // Only include solar series when has_solar is on
    if (mode.has_solar) {
        powerseries.push({data: solar_to_load_data,    label: "Solar to Load",    color: "#abddff", stack: 1, lines: {lineWidth: 0, fill: 0.75}});
        powerseries.push({data: solar_to_grid_data,    label: "Solar to Grid",    color: "#dccc1f", stack: 1, lines: {lineWidth: 0, fill: 1.0}});
    }
    // Only include battery series when has_battery is on
    if (mode.has_battery) {
        powerseries.push({data: solar_to_battery_data, label: "Solar to Battery", color: "#fba050", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
        powerseries.push({data: battery_to_load_data,  label: "Battery to Load",  color: "#ffd08e", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
        powerseries.push({data: battery_to_grid_data,  label: "Battery to Grid",  color: "#fabb68", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    }
    if (!mode.has_solar && !mode.has_battery) {
        // Consumption only: show use (grid_to_load is all of use)
        powerseries.push({data: grid_to_load_data, label: "Use", color: "#82cbfc", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    } else {
        powerseries.push({data: grid_to_load_data,     label: "Grid to Load",     color: "#82cbfc", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
        if (mode.has_battery) {
            powerseries.push({data: grid_to_battery_data,  label: "Grid to Battery",  color: "#fb7b50", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
        }
    }
    
    if (show_battery_soc && mode.has_battery && config.app.battery_soc.value) powerseries.push({data:battery_soc_data, label: "SOC", yaxis:2, color: "#888"});
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
    $(".visnav[time=1]").show();
    $(".visnav[time=3]").show();
    $(".visnav[time=6]").show();
    $(".visnav[time=24]").show();
            
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
                        tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "%"]);
                    } else {
                        if ( series.data[item.dataIndex][1] >= 1000) {
                            tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0)/1000 , "kW"]);
                        } else {
                            tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0), "W"]);
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
    var mode = get_mode();
    // Fetch the earliest start_time across all available flow kWh feeds
    var earliest_start_time = Infinity;
    var flow_feeds = [config.app.grid_to_load_kwh.value];
    if (mode.has_solar) {
        flow_feeds.push(config.app.solar_to_load_kwh.value);
        flow_feeds.push(config.app.solar_to_grid_kwh.value);
    }
    if (mode.has_battery) {
        if (mode.has_solar) flow_feeds.push(config.app.solar_to_battery_kwh.value);
        flow_feeds.push(config.app.battery_to_load_kwh.value);
        flow_feeds.push(config.app.battery_to_grid_kwh.value);
        flow_feeds.push(config.app.grid_to_battery_kwh.value);
    }
    for (var i = 0; i < flow_feeds.length; i++) {
        if (!flow_feeds[i]) continue;
        var m = feed.getmeta(flow_feeds[i]);
        if (m.start_time < earliest_start_time) earliest_start_time = m.start_time;
    }
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
    
    // Load energy flow kWh data directly from post-processor feeds (only those relevant to the mode)
    var grid_to_load_kwh_data     = config.app.grid_to_load_kwh.value     ? feed.getdata(config.app.grid_to_load_kwh.value,    start,end,"daily",0,1) : [];
    var solar_to_load_kwh_data    = (mode.has_solar && config.app.solar_to_load_kwh.value)    ? feed.getdata(config.app.solar_to_load_kwh.value,   start,end,"daily",0,1) : [];
    var solar_to_grid_kwh_data    = (mode.has_solar && config.app.solar_to_grid_kwh.value)    ? feed.getdata(config.app.solar_to_grid_kwh.value,   start,end,"daily",0,1) : [];
    var solar_to_battery_kwh_data = (mode.has_solar && mode.has_battery && config.app.solar_to_battery_kwh.value) ? feed.getdata(config.app.solar_to_battery_kwh.value,start,end,"daily",0,1) : [];
    var battery_to_load_kwh_data  = (mode.has_battery && config.app.battery_to_load_kwh.value) ? feed.getdata(config.app.battery_to_load_kwh.value, start,end,"daily",0,1) : [];
    var battery_to_grid_kwh_data  = (mode.has_battery && config.app.battery_to_grid_kwh.value) ? feed.getdata(config.app.battery_to_grid_kwh.value, start,end,"daily",0,1) : [];
    var grid_to_battery_kwh_data  = (mode.has_battery && config.app.grid_to_battery_kwh.value) ? feed.getdata(config.app.grid_to_battery_kwh.value, start,end,"daily",0,1) : [];
    
    // Per-day arrays for graph and hover access
    solar_to_load_kwhd_data    = [];
    solar_to_grid_kwhd_data    = [];
    solar_to_battery_kwhd_data = [];
    battery_to_load_kwhd_data  = [];
    battery_to_grid_kwhd_data  = [];
    grid_to_load_kwhd_data     = [];
    grid_to_battery_kwhd_data  = [];
    
    // Use grid_to_load as the reference dataset length
    var ref_data = grid_to_load_kwh_data.length ? grid_to_load_kwh_data : solar_to_load_kwh_data;
    
    if (ref_data.length) {
        for (var day=0; day<ref_data.length; day++)
        {
            var time = ref_data[day][0];
            
            var solar_to_load    = (solar_to_load_kwh_data[day]    && solar_to_load_kwh_data[day][1]    !== null) ? solar_to_load_kwh_data[day][1]    : 0;
            var solar_to_grid    = (solar_to_grid_kwh_data[day]    && solar_to_grid_kwh_data[day][1]    !== null) ? solar_to_grid_kwh_data[day][1]    : 0;
            var solar_to_battery = (solar_to_battery_kwh_data[day] && solar_to_battery_kwh_data[day][1] !== null) ? solar_to_battery_kwh_data[day][1] : 0;
            var battery_to_load  = (battery_to_load_kwh_data[day]  && battery_to_load_kwh_data[day][1]  !== null) ? battery_to_load_kwh_data[day][1]  : 0;
            var battery_to_grid  = (battery_to_grid_kwh_data[day]  && battery_to_grid_kwh_data[day][1]  !== null) ? battery_to_grid_kwh_data[day][1]  : 0;
            var grid_to_load     = (grid_to_load_kwh_data[day]     && grid_to_load_kwh_data[day][1]     !== null) ? grid_to_load_kwh_data[day][1]     : 0;
            var grid_to_battery  = (grid_to_battery_kwh_data[day]  && grid_to_battery_kwh_data[day][1]  !== null) ? grid_to_battery_kwh_data[day][1]  : 0;

            // Only skip if the required feeds for this mode are null
            var required_ok = (grid_to_load_kwh_data[day] && grid_to_load_kwh_data[day][1] !== null) ||
                              (solar_to_load_kwh_data[day] && solar_to_load_kwh_data[day][1] !== null);
            if (!required_ok) continue;

            solar_to_load_kwhd_data.push([time, solar_to_load]);
            solar_to_grid_kwhd_data.push([time, solar_to_grid]);
            solar_to_battery_kwhd_data.push([time, solar_to_battery]);
            battery_to_load_kwhd_data.push([time, battery_to_load]);
            battery_to_grid_kwhd_data.push([time, battery_to_grid]);
            grid_to_load_kwhd_data.push([time, grid_to_load]);
            grid_to_battery_kwhd_data.push([time, grid_to_battery]);
        }
    }
    
    var series = [];

    // Stack 1: onsite use breakdown (positive bars)
    if (mode.has_solar) {
        series.push({
            data: solar_to_load_kwhd_data,
            label: "Solar to Load",
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
            stack: 1
        });
    }
    if (mode.has_battery) {
        series.push({
            data: battery_to_load_kwhd_data,
            label: "Battery to Load",
            color: "#fbb450",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
            stack: 1
        });
    }
    series.push({
        data: grid_to_load_kwhd_data,
        label: "Grid to Load",
        color: "#82cbfc",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
        stack: 1
    });

    // Stack 0: exports (shown as negative bars below zero)
    var export_kwhd_data = [];
    for (var i = 0; i < solar_to_grid_kwhd_data.length; i++) {
        var export_val = 0;
        if (mode.has_solar)   export_val += solar_to_grid_kwhd_data[i][1];
        if (mode.has_battery) export_val += battery_to_grid_kwhd_data[i][1];
        export_kwhd_data.push([solar_to_grid_kwhd_data[i][0], -1 * export_val]);
    }
    if (export_kwhd_data.length > 0) {
        series.push({
            data: export_kwhd_data,
            label: "Total Export",
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
            stack: 0
        });
    }
    
    historyseries = series;
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
    $(".visnav[time=1]").hide();
    $(".visnav[time=3]").hide();
    $(".visnav[time=6]").hide();
    $(".visnav[time=24]").hide();
            
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
            var total_solar_to_load    = (solar_to_load_kwhd_data[z]    && solar_to_load_kwhd_data[z][1]    !== null) ? solar_to_load_kwhd_data[z][1]    : 0;
            var total_solar_to_grid    = (solar_to_grid_kwhd_data[z]    && solar_to_grid_kwhd_data[z][1]    !== null) ? solar_to_grid_kwhd_data[z][1]    : 0;
            var total_solar_to_battery = (solar_to_battery_kwhd_data[z] && solar_to_battery_kwhd_data[z][1] !== null) ? solar_to_battery_kwhd_data[z][1] : 0;
            var total_battery_to_load  = (battery_to_load_kwhd_data[z]  && battery_to_load_kwhd_data[z][1]  !== null) ? battery_to_load_kwhd_data[z][1]  : 0;
            var total_battery_to_grid  = (battery_to_grid_kwhd_data[z]  && battery_to_grid_kwhd_data[z][1]  !== null) ? battery_to_grid_kwhd_data[z][1]  : 0;
            var total_grid_to_load     = (grid_to_load_kwhd_data[z]     && grid_to_load_kwhd_data[z][1]     !== null) ? grid_to_load_kwhd_data[z][1]     : 0;
            var total_grid_to_battery  = (grid_to_battery_kwhd_data[z]  && grid_to_battery_kwhd_data[z][1]  !== null) ? grid_to_battery_kwhd_data[z][1]  : 0;

            // Reconstruct aggregate totals
            var total_solar_kwh  = total_solar_to_load + total_solar_to_grid + total_solar_to_battery;
            var total_use_kwh    = total_solar_to_load + total_battery_to_load + total_grid_to_load;
            var total_import_kwh = total_grid_to_load + total_grid_to_battery;
            var total_export_kwh = total_solar_to_grid + total_battery_to_grid;
            var total_grid_balance_kwh = total_import_kwh - total_export_kwh;

            $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
            $(".total_use_kwh").html(total_use_kwh.toFixed(1));
            $(".total_import_direct_kwh").html(total_grid_to_load.toFixed(1));
            $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
            if (mode.has_solar && total_solar_kwh) {
                $(".total_solar_direct_kwh").html(total_solar_to_load.toFixed(1));
                $(".total_solar_export_kwh").html(total_solar_to_grid.toFixed(1));
                $(".solar_export_prc").html((100*total_solar_to_grid/total_solar_kwh).toFixed(0)+"%");
                $(".solar_direct_prc").html((100*total_solar_to_load/total_solar_kwh).toFixed(0)+"%");
                $(".solar_to_battery_prc").html((100*total_solar_to_battery/total_solar_kwh).toFixed(0)+"%");
                $(".use_from_solar_prc").html((100*total_solar_to_load/total_use_kwh).toFixed(0)+"%");
            }
            $(".use_from_import_prc").html((100*total_grid_to_load/total_use_kwh).toFixed(0)+"%");
            if (mode.has_battery) {
                $(".total_battery_charge_from_solar_kwh").html(total_solar_to_battery.toFixed(1));
                $(".total_import_for_battery_kwh").html(total_grid_to_battery.toFixed(1));
                $(".total_battery_discharge_kwh").html(total_battery_to_load.toFixed(1));
                $(".total_battery_to_grid_kwh").html(total_battery_to_grid.toFixed(1));
                $(".use_from_battery_prc").html((100*total_battery_to_load/total_use_kwh).toFixed(0)+"%");
            
                if (total_grid_to_battery>=0.1) {
                    $("#battery_import").show();
                } else {
                    $("#battery_import").hide();
                }
            
                if (total_battery_to_grid>=0.1) {
                    $("#battery_export").show();
                } else {
                    $("#battery_export").hide();
                }
            }
            
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
            var ref_day_data = grid_to_load_kwhd_data.length ? grid_to_load_kwhd_data : solar_to_load_kwhd_data;
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
        $('<td style="padding-right: 8px"><span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
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
function run_post_processor()    { config.autogen.run_post_processor(); }
function reset_feeds()           { config.autogen.reset_feeds(); }