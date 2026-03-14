// These are used by the feed api to handle user auth requirements
feed.apikey = apikey;

// Hide the config button if in public view
if (!sessionwrite) $(".config-open").hide();

// Used by the apps module configuration library to build the app configuration form.
// Each key maps to a feed the user selects in the configuration panel.
// - type: "feed" tells the config UI to show a feed picker
// - autoname: the default feed name to pre-select if it exists
// - engine: 5 = PHPFina (fixed-interval time series)
// - description: shown in the configuration UI
config.app = {
    "use": {
        "type": "feed",
        "autoname": "use",
        "engine": "5",
        "description": "House or building use in watts"
    },
    "solar": {
        "type": "feed",
        "autoname": "solar",
        "engine": "5",
        "description": "Solar generation in watts"
    },
    "battery_power": {
        "type": "feed",
        "autoname": "battery_power",
        "engine": "5",
        "description": "Battery power in watts (positive = discharge, negative = charge)"
    },
    "grid": {
        "type": "feed",
        "autoname": "grid",
        "engine": "5",
        "description": "Grid power in watts (positive = import, negative = export)"
    },
    "battery_soc": {
        "type": "feed",
        "autoname": "battery_soc",
        "engine": "5",
        "description": "Battery state of charge in percent (%)"
    }
};

// Fetch user feed list (used by the config UI to populate feed pickers)
config.feeds = feed.list();

// config.initapp  – called once when the app module first loads
// config.showapp  – called each time the app becomes visible
// config.hideapp  – called when the app is hidden (e.g. switching tabs)
config.initapp = function () { init(); };
config.showapp = function () { show(); };
config.hideapp = function () { clear(); };

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------

// Ordered list of feed keys fetched from the server for graph data.
// The ORDER here must be preserved — it determines the index used when
// mapping the batch response from feed.getdata() back to named keys.
// Note: graph series colours/options are defined separately in the
// add_series() calls inside load(), keeping fetch config and display
// config cleanly separated.
var feeds_to_load = [
    "use",
    "solar",
    "battery_power",
    "grid",
    "battery_soc"
];

// Graph data store — populated after each fetch
var data = {};

// Flot series store — rebuilt on each draw
var powergraph_series = {};

// Flot graph options
// yaxis 1: power (W), yaxis 2: battery SOC (%)
var options = {
    canvas: true,
    xaxis: {
        mode: "time",
        timezone: "browser"
    },
    yaxes: [
        { min: 0 },            // yaxis 1: power — never show negative
        { min: 0, max: 100, position: "right" }  // yaxis 2: SOC %
    ],
    grid: {
        show: true,
        color: "#aaa",
        borderWidth: 0,
        hoverable: true
    },
    legend: {
        show: false
    },
    selection: {
        mode: "x",
        color: "#555"
    }
};

// used for tooltip de-duplication (avoids redrawing on every mouse move)
var previousPoint = null;

config.init();

// init() is called once when the app is first loaded.
// Use this for any one-time setup that should happen before show() is called.
function init() {
    // Nothing needed for this template — extend here as required.
}

function show() {
    $(".ajax-loader").hide();
    resize();

    // Start the live updater immediately, then refresh every 10 seconds
    updater();
    let updaterinst_local = setInterval(updater, 10000);
    // Store on window so clear() can cancel it
    window.updaterinst = updaterinst_local;

    // Set the initial view window.
    // End: now (clamped to the feed's last data point so we don't load empty future time).
    // Start: 24 hours before end.
    view.end = +new Date();
    let meta = feed.getmeta(config.app.use.value);
    if (view.end * 0.001 > meta.end_time) {
        view.end = meta.end_time * 1000;
    }
    view.start = view.end - (3600000 * 24.0);

    load();
}

function load() {
    view.calc_interval(1500);

    // Build the ordered list of feed IDs to request, matching feeds_to_load order
    let feedids = feeds_to_load.map(function (key) {
        return config.app[key].value;
    });

    // Use averaging for intervals >= 15s to keep the graph smooth and reduce data volume
    let skipmissing = 0;
    let limitinterval = 0;
    let average = (view.interval >= 15) ? 1 : 0;

    // Fetch all feed data in a single batch request
    feed.getdata(feedids, view.start, view.end, view.interval, average, 0, skipmissing, limitinterval, function (all_data) {

        // Map the indexed response array back to named keys
        feeds_to_load.forEach(function (key, index) {
            if (all_data[index] != undefined) {
                data[key] = remove_null_values(all_data[index].data, view.interval);
            }
        });


        // Conversion factor: multiply instantaneous watts by this to get kWh for one interval
        let power_to_kwh = view.interval / 3600000.0;

        let use_kwh = 0;
        let solar_kwh = 0;
        let import_kwh = 0;
        let export_kwh = 0;

        let solar_to_load_kwh = 0;
        let solar_to_grid_kwh = 0;
        let solar_to_battery_kwh = 0;
        let battery_to_load_kwh = 0;
        let battery_to_grid_kwh = 0;
        let grid_to_load_kwh = 0;
        let grid_to_battery_kwh = 0;

        // Initialise derived time-series arrays (built up per data point below)
        data["solar_to_load"] = [];
        data["solar_to_grid"] = [];
        data["solar_to_battery"] = [];

        data["battery_to_load"] = [];
        data["battery_to_grid"] = [];

        data["grid_to_load"] = [];
        data["grid_to_battery"] = [];

        for (let z in data["use"]) {
            let time = data["use"][z][0];
            let use = data["use"][z][1];
            let solar = data["solar"][z][1];
            // positive battery_power = discharging, negative = charging
            let battery_power = data["battery_power"][z][1];
            // positive grid = importing, negative = exporting
            let grid = data["grid"][z][1];

            // Skip data points where any feed has a null value
            if (use == null || solar == null || battery_power == null || grid == null) {
                continue;
            }

            // ------------------------------------------------------------------------------------------------
            // CONSERVATION OF ENERGY
            // We have 4 meter points but only 3 independent variables.
            // The system must balance:  use = solar + battery_power + grid
            // We override 'use' with the calculated value from the other three feeds so that
            // all downstream flow calculations are internally consistent.
            // ------------------------------------------------------------------------------------------------
            use = solar + battery_power + grid;

            let import_power = (grid > 0) ? grid : 0;
            let export_power = (grid < 0) ? -grid : 0;

            // ------------------------------------------------------------------------------------------------
            // SOLAR FLOWS
            // Priority: solar → load first, then surplus → battery charge, then remainder → grid
            // ------------------------------------------------------------------------------------------------
            let solar_to_load = Math.min(solar, use);

            let solar_to_battery = 0;
            if (battery_power < 0) {
                // Battery is charging — solar covers as much of the charge power as available
                solar_to_battery = Math.min(solar - solar_to_load, -battery_power);
            }

            let solar_to_grid = solar - solar_to_load - solar_to_battery;

            // ------------------------------------------------------------------------------------------------
            // BATTERY FLOWS
            // Only relevant when discharging (battery_power > 0)
            // Priority: battery → load first, remainder → grid
            // ------------------------------------------------------------------------------------------------
            let battery_to_load = 0;
            let battery_to_grid = 0;
            if (battery_power > 0) {
                battery_to_load = Math.min(battery_power, use - solar_to_load);
                battery_to_grid = battery_power - battery_to_load;
            }

            // ------------------------------------------------------------------------------------------------
            // GRID FLOWS
            // Only relevant when importing (import_power > 0)
            // Priority: grid → load first (after solar + battery), remainder → battery charge
            // ------------------------------------------------------------------------------------------------
            let grid_to_load = 0;
            let grid_to_battery = 0;
            if (import_power > 0) {
                grid_to_load = Math.min(import_power, use - solar_to_load - battery_to_load);
                grid_to_battery = Math.min(import_power - grid_to_load, battery_power < 0 ? -battery_power - solar_to_battery : 0);
            }

            // ------------------------------------------------------------------------------------------------
            // ACCUMULATE kWh TOTALS
            // ------------------------------------------------------------------------------------------------
            use_kwh    += use    * power_to_kwh;
            solar_kwh  += solar  * power_to_kwh;
            import_kwh += import_power * power_to_kwh;
            export_kwh += export_power * power_to_kwh;

            solar_to_load_kwh    += solar_to_load    * power_to_kwh;
            solar_to_grid_kwh    += solar_to_grid    * power_to_kwh;
            solar_to_battery_kwh += solar_to_battery * power_to_kwh;

            battery_to_load_kwh += battery_to_load * power_to_kwh;
            battery_to_grid_kwh += battery_to_grid * power_to_kwh;

            grid_to_load_kwh    += grid_to_load    * power_to_kwh;
            grid_to_battery_kwh += grid_to_battery * power_to_kwh;

            // ------------------------------------------------------------------------------------------------
            // STORE TIME-SERIES DATA POINTS FOR GRAPH
            // ------------------------------------------------------------------------------------------------
            data["use"][z][1] = use;
            data["solar"][z][1] = solar;

            data["solar_to_load"].push([time, solar_to_load]);
            data["solar_to_grid"].push([time, solar_to_grid]);
            data["solar_to_battery"].push([time, solar_to_battery]);

            data["battery_to_load"].push([time, battery_to_load]);
            data["battery_to_grid"].push([time, battery_to_grid]);

            data["grid_to_load"].push([time, grid_to_load]);
            data["grid_to_battery"].push([time, grid_to_battery]);
        }

        // Update the kWh summary totals in the UI
        $("#use_kwh").html(use_kwh.toFixed(1));
        $("#solar_kwh").html(solar_kwh.toFixed(1));
        $("#import_kwh").html(import_kwh.toFixed(1));
        $("#export_kwh").html(export_kwh.toFixed(1));

        $("#solar_to_load_kwh").html(solar_to_load_kwh.toFixed(1));
        $("#solar_to_grid_kwh").html(solar_to_grid_kwh.toFixed(1));
        $("#solar_to_battery_kwh").html(solar_to_battery_kwh.toFixed(1));

        $("#battery_to_load_kwh").html(battery_to_load_kwh.toFixed(1));
        $("#battery_to_grid_kwh").html(battery_to_grid_kwh.toFixed(1));

        $("#grid_to_load_kwh").html(grid_to_load_kwh.toFixed(1));
        $("#grid_to_battery_kwh").html(grid_to_battery_kwh.toFixed(1));

        // ---------------------------------------------------------------------------------
        // VALIDATION — cross-check flow totals against meter totals
        // All four identities should hold; any significant error indicates a data issue.
        //   solar  = solar_to_load + solar_to_grid + solar_to_battery
        //   use    = solar_to_load + battery_to_load + grid_to_load
        //   import = grid_to_load  + grid_to_battery
        //   export = solar_to_grid + battery_to_grid
        // ---------------------------------------------------------------------------------
        let solar_kwh_check  = solar_to_load_kwh + solar_to_grid_kwh  + solar_to_battery_kwh;
        let use_kwh_check    = solar_to_load_kwh + battery_to_load_kwh + grid_to_load_kwh;
        let import_kwh_check = grid_to_load_kwh  + grid_to_battery_kwh;
        let export_kwh_check = solar_to_grid_kwh + battery_to_grid_kwh;

        if (Math.abs(solar_kwh  - solar_kwh_check)  > 0.1) console.warn("Solar kWh imbalance: "  + solar_kwh.toFixed(2)  + " vs " + solar_kwh_check.toFixed(2));
        if (Math.abs(use_kwh    - use_kwh_check)    > 0.1) console.warn("Use kWh imbalance: "    + use_kwh.toFixed(2)    + " vs " + use_kwh_check.toFixed(2));
        if (Math.abs(import_kwh - import_kwh_check) > 0.1) console.warn("Import kWh imbalance: " + import_kwh.toFixed(2) + " vs " + import_kwh_check.toFixed(2));
        if (Math.abs(export_kwh - export_kwh_check) > 0.1) console.warn("Export kWh imbalance: " + export_kwh.toFixed(2) + " vs " + export_kwh_check.toFixed(2));

        // ---------------------------------------------------------------------------------
        // BUILD GRAPH SERIES
        // Series are stacked in the order added — solar flows first, then battery, then grid.
        // Colours match the kWh summary labels below the graph.
        // Note: battery_soc uses yaxis 2 (right axis, 0–100%) and is not stacked.
        // ---------------------------------------------------------------------------------
        reset_series();

        add_series("solar_to_load",    data["solar_to_load"],    { label: "Solar to Load",    yaxis: 1, color: "#abddff", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("solar_to_grid",    data["solar_to_grid"],    { label: "Solar to Grid",    yaxis: 1, color: "#dccc1f", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("solar_to_battery", data["solar_to_battery"], { label: "Solar to Battery", yaxis: 1, color: "#fba050", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("battery_to_load",  data["battery_to_load"],  { label: "Battery to Load",  yaxis: 1, color: "#ffd08e", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("battery_to_grid",  data["battery_to_grid"],  { label: "Battery to Grid",  yaxis: 1, color: "#fabb68", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("grid_to_load",     data["grid_to_load"],     { label: "Grid to Load",     yaxis: 1, color: "#82cbfc", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("grid_to_battery",  data["grid_to_battery"],  { label: "Grid to Battery",  yaxis: 1, color: "#fb7b50", stack: true, lines: { show: true, fill: 0.8, lineWidth: 0 } });
        add_series("battery_soc",      data["battery_soc"],      { label: "Battery SOC (%)",  yaxis: 2, color: "#ccc",    lines: { show: true, fill: false, lineWidth: 2 } });

        draw();
    }, false, "notime");


}

function reset_series() {
    powergraph_series = {};
}

// Add a named series to the graph. A shallow copy of the options object is made
// so that the original options literal is not mutated by attaching .data to it.
function add_series(key, seriesData, seriesOptions) {
    powergraph_series[key] = Object.assign({}, seriesOptions, { data: seriesData });
}

function draw() {
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;

    // Flot requires a plain array (not a keyed object), so convert here
    let series_array = Object.values(powergraph_series);
    $.plot($('#graph'), series_array, options);
}

function updater() {
    var use_id     = config.app.use.value;
    var solar_id   = config.app.solar.value;
    var battery_id = config.app.battery_power.value;
    var grid_id    = config.app.grid.value;
    var soc_id     = config.app.battery_soc.value;

    var feeds = feed.listbyid();

    var use_w     = feeds[use_id]     ? feeds[use_id].value * 1     : 0;
    var solar_w   = feeds[solar_id]   ? feeds[solar_id].value * 1   : 0;
    var battery_w = feeds[battery_id] ? feeds[battery_id].value * 1 : 0;
    var grid_w    = feeds[grid_id]    ? feeds[grid_id].value * 1    : 0;
    var soc       = feeds[soc_id]     ? feeds[soc_id].value * 1     : null;

    $("#powernow").html(use_w.toFixed(0));
    $("#solarnow").html(solar_w.toFixed(0));

    // Battery: positive = discharging (orange), negative = charging (purple)
    $("#batterynow").html(Math.abs(battery_w).toFixed(0));
    if (battery_w > 10) {
        $("#battery-label").text("BAT DISCHG").css("color", "#fba050");
        $("#battery-value").css("color", "#fba050");
    } else if (battery_w < -10) {
        $("#battery-label").text("BAT CHRG").css("color", "#c084fc");
        $("#battery-value").css("color", "#c084fc");
    } else {
        $("#battery-label").text("BATTERY").css("color", "#aaa");
        $("#battery-value").css("color", "#aaa");
    }

    // Grid: positive = import (light blue), negative = export (yellow-green)
    $("#gridnow").html(Math.abs(grid_w).toFixed(0));
    if (grid_w > 10) {
        $("#grid-label").text("IMPORT").css("color", "#82cbfc");
        $("#grid-value").css("color", "#82cbfc");
    } else if (grid_w < -10) {
        $("#grid-label").text("EXPORT").css("color", "#dccc1f");
        $("#grid-value").css("color", "#dccc1f");
    } else {
        $("#grid-label").text("GRID").css("color", "#aaa");
        $("#grid-value").css("color", "#aaa");
    }

    // Battery SOC
    if (soc !== null) {
        $("#socnow").html(soc.toFixed(0));
    } else {
        $("#socnow").html("--");
    }
}

function resize() {
    if ($('#app-block').is(":visible")) {
        draw();
    }
}

function clear() {
    clearInterval(window.updaterinst);
}

// Graph navigation buttons
$("#zoomout").click(function () { view.zoomout(); load(); });
$("#zoomin").click(function () { view.zoomin(); load(); });
$('#right').click(function () { view.panright(); load(); });
$('#left').click(function () { view.panleft(); load(); });

$('.time').click(function () {
    view.timewindow($(this).attr("time") / 24.0);
    load();
});

// Tooltip: show the series label and value when hovering over the graph
$('#graph').bind("plothover", function (event, pos, item) {
    if (item) {
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();

            let itemTime  = item.datapoint[0];
            let itemValue = item.datapoint[1];
            let label     = item.series.label || "";

            let displayValue = (itemValue != null) ? itemValue.toFixed(0) + "W" : "N/A";
            tooltip(item.pageX, item.pageY, label + "<br>" + displayValue + "<br>" + tooltip_date(itemTime), "#fff", "#000");
        }
    } else {
        $("#tooltip").remove();
        previousPoint = null;
    }
});

$('#graph').bind("plotselected", function (event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    load();
});

$(window).resize(function () {
    resize();
});

// ----------------------------------------------------------------------
// App log — simple wrapper; extend for production logging if needed
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level === "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}

// Remove null gaps shorter than 15 minutes by forward-filling from the last
// known good value. Longer gaps are left as null so the graph shows a break.
function remove_null_values(data, interval) {
    let last_valid_pos = 0;
    for (let pos = 0; pos < data.length; pos++) {
        if (data[pos][1] != null) {
            let null_duration_ms = (pos - last_valid_pos) * interval;
            if (null_duration_ms < 900000) {   // 900000 ms = 15 minutes
                for (let x = last_valid_pos + 1; x < pos; x++) {
                    data[x][1] = data[last_valid_pos][1];
                }
            }
            last_valid_pos = pos;
        }
    }
    return data;
}