// These are used by the feed api to handle user auth requirements
feed.apikey = apikey;

// Hide the config button if in public view
if (!sessionwrite) $(".config-open").hide();

// Used by the apps module configuration library to build the app configuration form
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
        "description": "Battery power in watts (positive for discharge, negative for charge)"
    },
    "grid": {
        "type": "feed",
        "autoname": "grid",
        "engine": "5",
        "description": "Grid power in watts (positive for import, negative for export)"
    },
    "battery_soc": {
        "type": "feed",
        "autoname": "battery_soc",
        "engine": "5",
        "description": "Battery state of charge in kWh"
    }
};

// Fetch user feed list
config.feeds = feed.list();

config.initapp = function () {
    init()
};
config.showapp = function () {
    show()
};
config.hideapp = function () {
    clear()
};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------

// Feeds to load and their graph options
var feeds_to_load = {
    "use": { label: "Use", yaxis: 1, color: "#0699fa", lines: { show: true, fill: 0.75, lineWidth: 0 } },
    "solar": { label: "Solar", yaxis: 1, color: "#f4c009", lines: { show: true, fill: 0.75, lineWidth: 0 } },
    "battery_power": { label: "Battery", yaxis: 1, color: "#888", lines: { show: true, fill: 0.75, lineWidth: 0 } },
    "grid": { label: "Grid", yaxis: 1, color: "#f00", lines: { show: true, fill: 0.75, lineWidth: 0 } },
    "battery_soc": { label: "Battery SOC", yaxis: 2, color: "#ccc", lines: { show: true, fill: false, lineWidth: 2 } }
};

// Graph variables
var data = {};
var powergraph_series = {};

var options = {
    canvas: true,
    xaxis: {
        mode: "time",
        timezone: "browser"
    },
    yaxes: [
        {
            min: 0
        },
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

// used for tooltip
var previousPoint = null;

config.init();

function init() {

}

function show() {
    $(".ajax-loader").hide();
    resize();
    updater();
    updaterinst = setInterval(updater, 10000);

    // Starting view
    view.end = +new Date;
    meta = feed.getmeta(config.app.use.value);
    // Limit end time to feed end time
    if (view.end * 0.001 > meta.end_time) {
        view.end = meta.end_time * 1000;
    }
    // Set start time to 7 days ago
    view.start = view.end - (3600000 * 24.0 * 1);

    load();
}

function load() {
    view.calc_interval(1500);

    // Compile list of feedids
    var feedids = [];
    for (var key in feeds_to_load) {
        feedids.push(config.app[key].value);
    }

    // Options for feed.getdata
    var skipmissing = 0;
    var limitinterval = 0;
    var average = 1;
    if (view.interval < 15) {
        average = 0;
    }


    // Fetch the data
    feed.getdata(feedids, view.start, view.end, view.interval, average, 0, skipmissing, limitinterval, function (all_data) {

        // Transfer from data to all_data by key
        var feed_index = 0;
        for (var key in feeds_to_load) {
            if (all_data[feed_index] != undefined) {
                // Data object used for calculations
                data[key] = remove_null_values(all_data[feed_index].data, view.interval);
                feed_index++;
            }
        }


        var power_to_kwh = view.interval / 3600000.0;

        var use_kwh = 0;
        var solar_kwh = 0;
        var import_kwh = 0;
        var export_kwh = 0;

        var solar_to_load_kwh = 0;
        var solar_to_grid_kwh = 0;
        var solar_to_battery_kwh = 0;
        var battery_to_load_kwh = 0;
        var battery_to_grid_kwh = 0;
        var grid_to_load_kwh = 0;
        var grid_to_battery_kwh = 0;

        data["solar_to_load"] = [];
        data["solar_to_grid"] = [];
        data["solar_to_battery"] = [];

        data["battery_to_load"] = [];
        data["battery_to_grid"] = [];

        data["grid_to_load"] = [];
        data["grid_to_battery"] = [];

        for (var z in data["use"]) {
            let time = data["use"][z][0];
            let use = data["use"][z][1];
            let solar = data["solar"][z][1];
            // positive battery power means discharge, negative means charge
            let battery_power = data["battery_power"][z][1];
            // positive grid means import, negative means export
            let grid = data["grid"][z][1];

            // skip if any of the values are null
            if (use == null || solar == null || battery_power == null || grid == null) {
                continue;
            }

            // Verify conservation of energy
            // while we will likely have 4x meter points
            // we only actually have 3x independent variables
            // If we dont have use, we can calculate it as solar + battery + grid
            // If we dont have solar, we can calculate it as use - battery - grid
            // If we dont have battery, we can calculate it as use - solar - grid
            // If we dont have grid, we can calculate it as use - solar - battery
            // If these dont balance, then we have an issue with the data

            let use_check = solar + battery_power + grid;
            let solar_check = use - battery_power - grid;
            let battery_check = use - solar - grid;
            let grid_check = use - solar - battery_power;

            // if (Math.abs(use - use_check) > 0.1) {
            //     console.error("Use does not balance! " + use + " vs " + use_check);
            // }

            // Override for conservation of energy
            use = use_check;

            let import_power = 0;
            let export_power = 0;

            if (grid > 0) {
                import_power = grid;
            } else {
                export_power = -grid;
            }

            // ------------------------------------------------------------------------------------------------
            // SOLAR
            // ------------------------------------------------------------------------------------------------

            // Calculate solar to load and solar to grid
            let solar_to_load = Math.min(solar, use);

            // Calculate solar to battery
            let solar_to_battery = 0;
            if (battery_power < 0) {
                // Battery is charging, so solar to battery is the lesser of the available solar and the battery charge power
                solar_to_battery = Math.min(solar - solar_to_load, -battery_power);
            }

            let solar_to_grid = solar - solar_to_load - solar_to_battery;

            // ------------------------------------------------------------------------------------------------
            // BATTERY
            // ------------------------------------------------------------------------------------------------

            // Calculate battery to load and battery to grid
            let battery_to_load = 0;
            let battery_to_grid = 0;
            if (battery_power > 0) {
                // Battery is discharging, so battery to load is the lesser of the available battery power and the remaining load after solar
                battery_to_load = Math.min(battery_power, use - solar_to_load);
                battery_to_grid = battery_power - battery_to_load;
            }

            // ------------------------------------------------------------------------------------------------
            // GIRD (TO LOAD, TO BATTERY)
            // ------------------------------------------------------------------------------------------------
            let grid_to_load = 0;
            let grid_to_battery = 0;
            if (import_power > 0) {
                // Grid is importing, so grid to load is the lesser of the import power and the remaining load after solar and battery
                grid_to_load = Math.min(import_power, use - solar_to_load - battery_to_load);
                grid_to_battery = Math.min(import_power - grid_to_load, battery_power < 0 ? -battery_power - solar_to_battery : 0);
            }


            // ------------------------------------------------------------------------------------------------

            // Calculate kWh for the period
            use_kwh += use * power_to_kwh;
            solar_kwh += solar * power_to_kwh;
            import_kwh += import_power * power_to_kwh;
            export_kwh += export_power * power_to_kwh;

            solar_to_load_kwh += solar_to_load * power_to_kwh;
            solar_to_grid_kwh += solar_to_grid * power_to_kwh;
            solar_to_battery_kwh += solar_to_battery * power_to_kwh;

            battery_to_load_kwh += battery_to_load * power_to_kwh;
            battery_to_grid_kwh += battery_to_grid * power_to_kwh;

            grid_to_load_kwh += grid_to_load * power_to_kwh;
            grid_to_battery_kwh += grid_to_battery * power_to_kwh;

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

            // ------------------------------------------------------------------------------------------------
        }

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
        // VALIDATION CHECKS
        // ---------------------------------------------------------------------------------

        var solar_kwh_check   = solar_to_load_kwh + solar_to_grid_kwh + solar_to_battery_kwh;
        var use_kwh_check     = solar_to_load_kwh + battery_to_load_kwh + grid_to_load_kwh;
        var import_kwh_check  = grid_to_load_kwh  + grid_to_battery_kwh;
        var export_kwh_check  = solar_to_grid_kwh + battery_to_grid_kwh;

        // Validate calculations
        // There are usually minor discrepancies in use_kwh
        if (Math.abs(solar_kwh - solar_kwh_check) > 0.1) {
            console.error("Solar kWh does not balance! " + solar_kwh + " vs " + solar_kwh_check);
        }
        if (Math.abs(use_kwh - use_kwh_check) > 0.1) {
            console.error("Use kWh does not balance! " + use_kwh + " vs " + use_kwh_check);
        }
        if (Math.abs(import_kwh - import_kwh_check) > 0.1) {
            console.error("Import kWh does not balance! " + import_kwh + " vs " + import_kwh_check);
        }
        if (Math.abs(export_kwh - export_kwh_check) > 0.1) {
            console.error("Export kWh does not balance! " + export_kwh + " vs " + export_kwh_check);
        }

        // ---------------------------------------------------------------------------------

        reset_series();

        add_series("solar_to_load", data["solar_to_load"], {
            label: "Solar to Load", 
            yaxis: 1, 
            color: "#abddffff", 
            stack: true,
            lines: { show: true, fill: 0.75, lineWidth: 0 },
        });

        add_series("solar_to_grid", data["solar_to_grid"], {
            label: "Solar to Grid", 
            yaxis: 1, 
            color: "#dccc1f",
            stack: true,
            lines: { show: true, fill: 1.0, lineWidth: 0 }
        });

        
        add_series("solar_to_battery", data["solar_to_battery"], {
            label: "Solar to Battery", 
            yaxis: 1, 
            color: "#fba050ff", 
            stack: true,
            lines: { show: true, fill: 0.8, lineWidth: 0 } 
        });

        add_series("battery_to_load", data["battery_to_load"], {
            label: "Battery to Load", 
            yaxis: 1, 
            color: "#ffd08eff",  
            stack: true,
            lines: { show: true, fill: 0.8, lineWidth: 0 } 
        });

        add_series("battery_to_grid", data["battery_to_grid"], {
            label: "Battery to Grid", 
            yaxis: 1, 
            color: "#fabb68ff",
            stack: true,
            lines: { show: true, fill: 0.8, lineWidth: 0 } 
        });

        add_series("grid_to_load", data["grid_to_load"], {
            label: "Grid to Load", 
            yaxis: 1, 
            color: "#82cbfc",
            stack: true,
            lines: { show: true, fill: 0.8, lineWidth: 0 } 
        });

        add_series("grid_to_battery", data["grid_to_battery"], {
            label: "Grid to Battery", 
            yaxis: 1, 
            color: "#fb7b50", 
            stack: true,
            lines: { show: true, fill: 0.8, lineWidth: 0 } 
        });

        // add soc
        add_series("battery_soc", data["battery_soc"], {
            label: "Battery SOC", 
            yaxis: 2, 
            color: "#ccc", 
            lines: { show: true, fill: false, lineWidth: 2 } 
        });
        

        draw();
    }, false, "notime");


}

function reset_series() {
    powergraph_series = {};
}

function add_series(key, data, options) {
    let series = options;
    series.data = data;
    powergraph_series[key] = series;
}

function draw() {

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;

    // Remove keys
    var powergraph_series_without_key = [];
    for (var key in powergraph_series) {
        powergraph_series_without_key.push(powergraph_series[key]);
    }
    $.plot($('#graph'), powergraph_series_without_key, options);

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
    clearInterval(updaterinst);
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

// Tooltip code
$('#graph').bind("plothover", function (event, pos, item) {
    if (item) {
        var i = item.dataIndex;

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();

            var itemTime = item.datapoint[0];
            var itemValue = item.datapoint[1];

            if (itemValue != null) itemValue = itemValue.toFixed(0);
            tooltip(item.pageX, item.pageY, itemValue + "W<br>" + tooltip_date(itemTime), "#fff", "#000");
        }
    } else $("#tooltip").remove();
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
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}

// Remove null values from feed data
function remove_null_values(data, interval) {
    var last_valid_pos = 0;
    for (var pos = 0; pos < data.length; pos++) {
        if (data[pos][1] != null) {
            let null_time = (pos - last_valid_pos) * interval;
            if (null_time < 900) {
                for (var x = last_valid_pos + 1; x < pos; x++) {
                    data[x][1] = data[last_valid_pos][1];
                }
            }
            last_valid_pos = pos;
        }
    }
    return data;
}