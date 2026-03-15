// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

var profile_mode = false;

var show_carbonintensity = $("#show_carbonintensity")[0].checked;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color', 'WhiteSmoke');
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
    "solar_to_load_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_load_kwh",
        "description": "Cumulative solar to load energy in kWh"
    },
    "solar_to_grid_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_grid_kwh",
        "description": "Cumulative solar to grid (export) energy in kWh"
    },
    "solar_to_battery_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "solar_to_battery_kwh",
        "description": "Cumulative solar to battery energy in kWh"
    },
    "battery_to_load_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_to_load_kwh",
        "description": "Cumulative battery to load energy in kWh"
    },
    "battery_to_grid_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_to_grid_kwh",
        "description": "Cumulative battery to grid energy in kWh"
    },
    "grid_to_load_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "grid_to_load_kwh",
        "description": "Cumulative grid to load energy in kWh"
    },
    "grid_to_battery_kwh": {
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

    "tariff_A": {
        "type": "select",
        "name": "Select tariff A:",
        "default": "AGILE-23-12-06",
        "options": tariff_options
    },

    "tariff_B": {
        "type": "select",
        "name": "Select tariff B:",
        "default": "INTELLI-VAR-22-10-14",
        "options": tariff_options
    },

    "public": {
        "type": "checkbox",
        "name": "Public",
        "default": 0,
        "optional": true,
        "description": "Make app public"
    }

};


config.feeds = feed.list();

config.initapp = function() {
    init()
};
config.showapp = function() {
    show()
};
config.hideapp = function() {
    hide()
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

config.init();

function init() {
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
    $("body").css('background-color', 'WhiteSmoke');
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
    graph_load();
    graph_draw();

    updater();
    updaterinst = setInterval(updater, 5000);
    $(".ajax-loader").hide();
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

function graph_load() {
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

    // Load energy flow feeds (cumulative kWh, delta=1 returns half-hourly differences directly)
    var solar_to_load_kwh_data    = [];
    var solar_to_grid_kwh_data    = [];
    var solar_to_battery_kwh_data = [];
    var battery_to_load_kwh_data  = [];
    var battery_to_grid_kwh_data  = [];
    var grid_to_load_kwh_data     = [];
    var grid_to_battery_kwh_data  = [];
    var meter_kwh_hh = [];

    solar_to_load_kwh_data    = feed.getdata(feeds["solar_to_load_kwh"].id,    view.start, view.end, interval, 0, 1);
    solar_to_grid_kwh_data    = feed.getdata(feeds["solar_to_grid_kwh"].id,    view.start, view.end, interval, 0, 1);
    solar_to_battery_kwh_data = feed.getdata(feeds["solar_to_battery_kwh"].id, view.start, view.end, interval, 0, 1);
    battery_to_load_kwh_data  = feed.getdata(feeds["battery_to_load_kwh"].id,  view.start, view.end, interval, 0, 1);
    battery_to_grid_kwh_data  = feed.getdata(feeds["battery_to_grid_kwh"].id,  view.start, view.end, interval, 0, 1);
    grid_to_load_kwh_data     = feed.getdata(feeds["grid_to_load_kwh"].id,     view.start, view.end, interval, 0, 1);
    grid_to_battery_kwh_data  = feed.getdata(feeds["grid_to_battery_kwh"].id,  view.start, view.end, interval, 0, 1);

    if (smart_meter_data) meter_kwh_hh = feed.getdata(feeds["meter_kwh_hh"].id, view.start, view.end, interval);

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
    data["tariff_A"] = []
    data["tariff_B"] = []
    data["outgoing"] = []
    data["carbonintensity"] = []

    // Tariff A
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff_A.value] != undefined && octopus_feed_list[config.app.tariff_A.value][config.app.region.value] != undefined) {
        data["tariff_A"] = getdataremote(octopus_feed_list[config.app.tariff_A.value][config.app.region.value], view.start, view.end, interval);
    }

    // Tariff B
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff_B.value] != undefined && octopus_feed_list[config.app.tariff_B.value][config.app.region.value] != undefined) {
        data["tariff_B"] = getdataremote(octopus_feed_list[config.app.tariff_B.value][config.app.region.value], view.start, view.end, interval);
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

    var total = {
        import_tariff_A: { kwh: 0, cost: 0 },
        import_tariff_B: { kwh: 0, cost: 0 },

        // Per-flow kWh totals
        solar_to_load_kwh:    0,
        solar_to_grid_kwh:    0,
        solar_to_battery_kwh: 0,
        battery_to_load_kwh:  0,
        battery_to_grid_kwh:  0,
        grid_to_load_kwh:     0,
        grid_to_battery_kwh:  0,

        // Per-flow value at tariff A (avoided cost / earned)
        tariff_A: {
            solar_to_load_value:    0,
            solar_to_grid_value:    0,
            solar_to_battery_value: 0,
            battery_to_load_value:  0,
            battery_to_grid_value:  0,
            grid_to_load_cost:      0,
            grid_to_battery_cost:   0,
        },

        // Per-flow value at tariff B (avoided cost / earned)
        tariff_B: {
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

    var monthly_data = {};

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
        kwh_solar_to_load    = Math.max(0, solar_to_load_kwh_data[z][1]    != null ? solar_to_load_kwh_data[z][1]    : 0);
        kwh_solar_to_grid    = Math.max(0, solar_to_grid_kwh_data[z][1]    != null ? solar_to_grid_kwh_data[z][1]    : 0);
        kwh_solar_to_battery = Math.max(0, solar_to_battery_kwh_data[z][1] != null ? solar_to_battery_kwh_data[z][1] : 0);
        kwh_battery_to_load  = Math.max(0, battery_to_load_kwh_data[z][1]  != null ? battery_to_load_kwh_data[z][1]  : 0);
        kwh_battery_to_grid  = Math.max(0, battery_to_grid_kwh_data[z][1]  != null ? battery_to_grid_kwh_data[z][1]  : 0);
        kwh_grid_to_load     = Math.max(0, grid_to_load_kwh_data[z][1]     != null ? grid_to_load_kwh_data[z][1]     : 0);
        kwh_grid_to_battery  = Math.max(0, grid_to_battery_kwh_data[z][1]  != null ? grid_to_battery_kwh_data[z][1]  : 0);

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
        let unitcost_tariff_A = null;
        if (data.tariff_A[z] != undefined && data.tariff_A[z][1] != null) {
            unitcost_tariff_A = data.tariff_A[z][1] * 0.01;

            // Generate profile
            profile_kwh[hh][1] += kwh_import
            profile_cost[hh][1] += kwh_import * unitcost_tariff_A;
        }

        // Unit and import cost on tariff B
        let unitcost_tariff_B = null;
        if (data.tariff_B[z] != undefined && data.tariff_B[z][1] != null) {
            unitcost_tariff_B = data.tariff_B[z][1] * 0.01;
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

        // Accumulate per-flow kWh totals
        total.solar_to_load_kwh    += kwh_solar_to_load;
        total.solar_to_grid_kwh    += kwh_solar_to_grid;
        total.solar_to_battery_kwh += kwh_solar_to_battery;
        total.battery_to_load_kwh  += kwh_battery_to_load;
        total.battery_to_grid_kwh  += kwh_battery_to_grid;
        total.grid_to_load_kwh     += kwh_grid_to_load;
        total.grid_to_battery_kwh  += kwh_grid_to_battery;

        let outgoing_unit = (data.outgoing[z] != undefined && data.outgoing[z][1] != null)
            ? data.outgoing[z][1] * 0.01 * -1  // already inverted, so this is positive p/kWh
            : null;

        if (outgoing_unit != null) {
            // Per-flow export values
            total.tariff_A.solar_to_grid_value    += kwh_solar_to_grid    * outgoing_unit;
            total.tariff_A.battery_to_grid_value  += kwh_battery_to_grid  * outgoing_unit;

            total.tariff_B.solar_to_grid_value    += kwh_solar_to_grid    * outgoing_unit;
            total.tariff_B.battery_to_grid_value  += kwh_battery_to_grid  * outgoing_unit;
        }

        if (unitcost_tariff_A != null) {
            // Per-flow avoided/saved cost at tariff A rate
            total.tariff_A.solar_to_load_value    += kwh_solar_to_load    * unitcost_tariff_A;
            total.tariff_A.solar_to_battery_value += kwh_solar_to_battery * unitcost_tariff_A;
            total.tariff_A.battery_to_load_value  += kwh_battery_to_load  * unitcost_tariff_A;
            total.tariff_A.grid_to_load_cost      += kwh_grid_to_load     * unitcost_tariff_A;
            total.tariff_A.grid_to_battery_cost   += kwh_grid_to_battery  * unitcost_tariff_A;
        }

        if (unitcost_tariff_B != null) {
            // Per-flow avoided/saved cost at tariff B rate
            total.tariff_B.solar_to_load_value    += kwh_solar_to_load    * unitcost_tariff_B;
            total.tariff_B.solar_to_battery_value += kwh_solar_to_battery * unitcost_tariff_B;
            total.tariff_B.battery_to_load_value  += kwh_battery_to_load  * unitcost_tariff_B;
            total.tariff_B.grid_to_load_cost      += kwh_grid_to_load     * unitcost_tariff_B;
            total.tariff_B.grid_to_battery_cost   += kwh_grid_to_battery  * unitcost_tariff_B;
        }
    }

    // if (smart_meter_data && !flow_mode) {
    //     calibration_line_of_best_fit(data["import"], meter_kwh_hh);
    // }

    draw_tables(total, monthly_data);
}

function draw_tables(total, monthly_data) {

    // Populate standalone tariff selectors (built once, then just set value)
    ["tariff_A", "tariff_B"].forEach(function(id) {
        var sel = $("#" + id);
        if (sel.find("option").length === 0) {
            for (var key in tariff_options) {
                sel.append("<option>" + tariff_options[key] + "</option>");
            }
        }
    });
    $("#tariff_A").val(config.app.tariff_A.value);
    $("#tariff_B").val(config.app.tariff_B.value);

    var out = "";

    if (show_carbonintensity) {
        var window_co2_intensity = 1000 * total.co2 / total.import_kwh;
        $("#carbonintensity_result").html("Total CO2: " + (total.co2).toFixed(1) + "kgCO2, Consumption intensity: " + window_co2_intensity.toFixed(0) + " gCO2/kWh")
    }

    // Helper: one table row per energy flow
    function flow_row(label, kwh, value_gbp, value_label, color, rowStyle) {
        var value_color;
        if (value_label.indexOf("avoided") !== -1) {
            value_color = "#888";
        } else if (value_label.indexOf("earned") !== -1) {
            value_color = "#4a9e4a";
        } else {
            value_color = "#c0392b";
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

        r += "<td style='color:#888;font-size:12px'>" + value_label + "</td>";
        r += "</tr>";
        return r;
    }

    out += flow_row("&#9728; Solar &rarr; Load",         total.solar_to_load_kwh,    total.tariff_A.solar_to_load_value * 1.05,    "avoided import cost (tariff A)", "#bec745");
    out += flow_row("&#9728; Solar &rarr; Battery",      total.solar_to_battery_kwh, total.tariff_A.solar_to_battery_value * 1.05, "avoided import cost (tariff A)", "#a3d977");
    out += flow_row("&#9728; Solar &rarr; Grid (export)",total.solar_to_grid_kwh,    total.tariff_A.solar_to_grid_value * 1.05,    "earned at export tariff",        "#dccc1f");
    out += flow_row("&#x1F50B; Battery &rarr; Load",     total.battery_to_load_kwh,  total.tariff_A.battery_to_load_value * 1.05,  "avoided import cost (tariff A)", "#fbb450");
    out += flow_row("&#x1F50B; Battery &rarr; Grid (export)", total.battery_to_grid_kwh, total.tariff_A.battery_to_grid_value * 1.05, "earned at export tariff",   "#f0913a");
    out += flow_row("&#x1F4A1; Grid &rarr; Load",        total.grid_to_load_kwh,     (total.tariff_A.grid_to_load_cost * 1.05),   "cost at tariff A",               "#44b3e2");
    out += flow_row("&#x1F4A1; Grid &rarr; Battery",     total.grid_to_battery_kwh,  (total.tariff_A.grid_to_battery_cost * 1.05),"cost at tariff A",               "#82cbfc");

    // Summary row: net cost = grid costs - earnings, unit cost = net cost / total consumption
    var net_cost_gbp = (
        (total.tariff_A.grid_to_load_cost + total.tariff_A.grid_to_battery_cost) -
        (total.tariff_A.solar_to_grid_value + total.tariff_A.battery_to_grid_value)
    ) * 1.05;
    var total_consumption_kwh = total.solar_to_load_kwh + total.battery_to_load_kwh + total.grid_to_load_kwh;

    // spacer row
    out += flow_row("Net result", total_consumption_kwh, net_cost_gbp, "grid costs minus export earnings", "#000",
        "font-weight:bold;background-color:#e8e8e8");

    $("#show_profile").show();
    $("#octopus_totals").html(out);

    /*
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Populate monthly data if more than one month of data
    if (Object.keys(monthly_data).length > 1) {
        var monthly_out = "";

        var monthly_sum_kwh = 0;
        var monthly_sum_kwh_tariff_A = 0;
        var monthly_sum_kwh_tariff_B = 0;
        var monthly_sum_cost_import_tariff_A = 0;
        var monthly_sum_cost_import_tariff_B = 0;

        for (var month in monthly_data) {
            var d = new Date(parseInt(month));

            let vat = 1.05;

            let tariff_A_kwh = monthly_data[month]["import_tariff_A"];
            let tariff_B_kwh = monthly_data[month]["import_tariff_B"];
            let tariff_A_cost = monthly_data[month]["cost_import_tariff_A"]*vat;
            let tariff_B_cost = monthly_data[month]["cost_import_tariff_B"]*vat;
            let tariff_A_unit_cost = 100*(tariff_A_cost / tariff_A_kwh);
            let tariff_B_unit_cost = 100*(tariff_B_cost / tariff_B_kwh);

            monthly_out += "<tr>";
            monthly_out += "<td>" + d.getFullYear() + " " + months[d.getMonth()] + "</td>";
            monthly_out += "<td>" + monthly_data[month]["import"].toFixed(1) + " kWh</td>";

            monthly_out += "<td>£" + tariff_A_cost.toFixed(2) + "</td>";
            if (!isNaN(tariff_A_unit_cost)) {
                monthly_out += "<td>" + tariff_A_unit_cost.toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
            } else {
                monthly_out += "<td></td>";
            }
            
            monthly_out += "<td>£" + monthly_sum_cost_import_tariff_B.toFixed(2) + "</td>";
            if (!isNaN(tariff_B_unit_cost)) {
                monthly_out += "<td>" + tariff_B_unit_cost.toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
            } else {
                monthly_out += "<td></td>";
            }

            // A, B = 
            if (tariff_A_unit_cost < tariff_B_unit_cost) {
                monthly_out += "<td style='color:blue'>A</td>";
            } else if (tariff_A_unit_cost > tariff_B_unit_cost) {
                monthly_out += "<td style='color:purple'>B</td>";
            } else {
                monthly_out += "<td>=</td>";
            }

            // link icon that zooms to month
            monthly_out += "<td><i class='icon-eye-open zoom-to-month' timestamp='"+month+"' style='cursor:pointer'></i></td>";
            monthly_out += "</tr>";

            monthly_sum_kwh += monthly_data[month]["import"];
            monthly_sum_kwh_tariff_A += tariff_A_kwh;
            monthly_sum_kwh_tariff_B += tariff_B_kwh;
            monthly_sum_cost_import_tariff_A += tariff_A_cost;
            monthly_sum_cost_import_tariff_B += tariff_B_cost;
        }

        var tariff_A_unit_cost = 100*(monthly_sum_cost_import_tariff_A / monthly_sum_kwh_tariff_A);
        var tariff_B_unit_cost = 100*(monthly_sum_cost_import_tariff_B / monthly_sum_kwh_tariff_B);

        // add totals line in bold
        monthly_out += "<tr style='font-weight:bold'>";
        monthly_out += "<td>Total</td>";
        monthly_out += "<td>" + monthly_sum_kwh.toFixed(1) + " kWh</td>";
        monthly_out += "<td>£" + monthly_sum_cost_import_tariff_A.toFixed(2) + "</td>";
        monthly_out += "<td>" + (tariff_A_unit_cost).toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
        monthly_out += "<td>£" + monthly_sum_cost_import_tariff_B.toFixed(2) + "</td>";
        monthly_out += "<td>" + (tariff_B_unit_cost).toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
        monthly_out += "<td></td>";
        monthly_out += "</tr>";

        $("#monthly-data-body").html(monthly_out);
        $("#monthly-data").show();
    }
    */
}

function graph_draw() {
    profile_mode = false;
    $("#history-title").html("HISTORY");

    /*
    if (this_halfhour_index != -1) {

        let kwh_last_halfhour = data["import"][this_halfhour_index][1];

        if (kwh_last_halfhour != null) {
            $("#kwh_halfhour").html(kwh_last_halfhour.toFixed(2) + "<span class='units'>kWh</span>");
        } else {
            $("#kwh_halfhour").html("N/A");
        }

        let cost_last_halfhour = data["import_cost_tariff_A"][this_halfhour_index][1] * 100;
        $("#cost_halfhour").html("(" + cost_last_halfhour.toFixed(2) + "<span class='units'>p</span>)");

        let unit_price = data["tariff_A"][this_halfhour_index][1] * 1.05;
        $("#unit_price").html(unit_price.toFixed(2) + "<span class='units'>p</span>");

        $(".last_halfhour_stats").show();
    } else {
        $(".last_halfhour_stats").hide();
    }*/

    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    graph_series = [];

    // All 7 disaggregated flows stacked as positive bars
    graph_series.push({ label: "Solar to Load",    data: data["solar_to_load"],    yaxis: 1, color: "#bec745", stack: true, bars: bars });
    graph_series.push({ label: "Solar to Battery", data: data["solar_to_battery"], yaxis: 1, color: "#a3d977", stack: true, bars: bars });
    graph_series.push({ label: "Solar to Grid",    data: data["solar_to_grid"],    yaxis: 1, color: "#dccc1f", stack: true, bars: bars });
    graph_series.push({ label: "Battery to Load",  data: data["battery_to_load"],  yaxis: 1, color: "#fbb450", stack: true, bars: bars });
    graph_series.push({ label: "Battery to Grid",  data: data["battery_to_grid"],  yaxis: 1, color: "#f0913a", stack: true, bars: bars });
    graph_series.push({ label: "Grid to Load",     data: data["grid_to_load"],     yaxis: 1, color: "#44b3e2", stack: true, bars: bars });
    graph_series.push({ label: "Grid to Battery",  data: data["grid_to_battery"],  yaxis: 1, color: "#82cbfc", stack: true, bars: bars });

    // price signals
    graph_series.push({
        label: config.app.tariff_A.value,
        data: data["tariff_A"],
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

    graph_series.push({
        label: config.app.tariff_B.value,
        data: data["tariff_B"],
        yaxis: 2,
        color: "#7c1a80",
        lines: {
            show: true,
            steps: true,
            align: "left",
            lineWidth: 1
        }
    });

    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            min: view.start,
            max: view.end,
            font: {
                size: flot_font_size,
                color: "#666"
            },
            reserveSpace: false
        },
        yaxes: [{
                position: 'left',
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            },
            {
                position: 'left',
                alignTicksWithAxis: 1,
                font: {
                    size: flot_font_size,
                    color: "#666"
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
                top: 30
            }
        },
        selection: {
            mode: "x"
        },
        legend: {
            position: "NW",
            noColumns: 6
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
    if (height < 250) height = 250;
    if (height > 500) height = 500;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);

    if (width <= 500) {
        $(".electric-title").css("font-size", "14px");
        $(".power-value").css("font-size", "36px");
        $(".halfhour-value").css("font-size", "26px");
    } else if (width <= 724) {
        $(".electric-title").css("font-size", "16px");
        $(".power-value").css("font-size", "50px");
        $(".halfhour-value").css("font-size", "40px");
    } else {
        $(".electric-title").css("font-size", "20px");
        $(".power-value").css("font-size", "50px");
        $(".halfhour-value").css("font-size", "40px");
    }
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
        var z = item.dataIndex;

        var isStepped = item.series.lines && item.series.lines.steps;

        if (isStepped) {
            z = Math.floor(z / 2);
        }

        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];

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

            let tariff_A = get_data_value_at_index("tariff_A", z);
            let tariff_B = get_data_value_at_index("tariff_B", z);
            let outgoing = get_data_value_at_index("outgoing", z);
            let carbonintensity = get_data_value_at_index("carbonintensity", z);

            let solar_to_load_kwh    = get_data_value_at_index("solar_to_load", z);
            let solar_to_grid_kwh    = get_data_value_at_index("solar_to_grid", z);
            let solar_to_battery_kwh = get_data_value_at_index("solar_to_battery", z);
            let battery_to_load_kwh  = get_data_value_at_index("battery_to_load", z);
            let battery_to_grid_kwh  = get_data_value_at_index("battery_to_grid", z);
            let grid_to_load_kwh     = get_data_value_at_index("grid_to_load", z);
            let grid_to_battery_kwh  = get_data_value_at_index("grid_to_battery", z);

            if (solar_to_load_kwh != null) {
                text += "&#9728; Solar &rarr; Load: " + solar_to_load_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) text += " (" + (solar_to_load_kwh * tariff_A).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (solar_to_battery_kwh != null) {
                text += "&#9728; Solar &rarr; Battery: " + solar_to_battery_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) text += " (" + (solar_to_battery_kwh * tariff_A).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (solar_to_grid_kwh != null) {
                text += "&#9728; Solar &rarr; Grid: " + solar_to_grid_kwh.toFixed(3) + " kWh";
                if (outgoing != null) text += " (" + (solar_to_grid_kwh * outgoing).toFixed(2) + "p gained)<br>";
                else text += "<br>";
            }
            if (battery_to_load_kwh != null) {
                text += "&#x1F50B; Battery &rarr; Load: " + battery_to_load_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) text += " (" + (battery_to_load_kwh * tariff_A).toFixed(2) + "p saved)<br>";
                else text += "<br>";
            }
            if (battery_to_grid_kwh != null) {
                text += "&#x1F50B; Battery &rarr; Grid: " + battery_to_grid_kwh.toFixed(3) + " kWh";
                if (outgoing != null) text += " (" + (battery_to_grid_kwh * outgoing).toFixed(2) + "p gained)<br>";
                else text += "<br>";
            }
            if (grid_to_load_kwh != null) {
                text += "&#x1F4A1; Grid &rarr; Load: " + grid_to_load_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) text += " (" + (grid_to_load_kwh * tariff_A).toFixed(2) + "p cost)<br>";
                else text += "<br>";
            }
            if (grid_to_battery_kwh != null) {
                text += "&#x1F4A1; Grid &rarr; Battery: " + grid_to_battery_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) text += " (" + (grid_to_battery_kwh * tariff_A).toFixed(2) + "p cost)<br>";
                else text += "<br>";
            }

            text += "<br>";

            if (outgoing != null) {
                text += "Export Tariff: " + outgoing.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (show_carbonintensity && carbonintensity != null) {
                text += "Carbon Intensity: " + carbonintensity.toFixed(0) + " gCO2/kWh<br>";
            }

            if (tariff_A != null) {
                text += config.app.tariff_A.value+": " + tariff_A.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (tariff_B != null) {
                text += config.app.tariff_B.value+": " + tariff_B.toFixed(2) + " p/kWh (inc VAT)<br>";
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

$("#tariff_A, #tariff_B").on("change", function() {
    config.app.tariff_A.value = $("#tariff_A").val();
    config.app.tariff_B.value = $("#tariff_B").val();

    config.db.tariff_A = config.app.tariff_A.value;
    config.db.tariff_B = config.app.tariff_B.value;

    config.set();

    graph_load();
    graph_draw();
});

$("#use_meter_kwh_hh").click(function() {
    use_meter_kwh_hh = $(this)[0].checked;
    graph_load();
    graph_draw();
});

$("#show_carbonintensity").click(function() {
    show_carbonintensity = $(this)[0].checked;
    graph_load();
    graph_draw();
    if (!show_carbonintensity) $("#carbonintensity_result").html("");
});

$("#download-csv").click(function() {

    var csv = [];

    keys = ["tariff_A", "tariff_B", "outgoing", "solar_to_load", "solar_to_battery", "solar_to_grid", "battery_to_load", "battery_to_grid", "grid_to_load", "grid_to_battery", "import", "import_cost_tariff_A", "import_cost_tariff_B", "export", "export_cost", "solar_used", "solar_used_cost", "meter_kwh_hh"]

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