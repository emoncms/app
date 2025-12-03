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

var import_tariff_options = [
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

var export_tariff_options = [
    "agile_export",            //"AGILE-EXPORT-22-10-14",
    "FLUX-EXPORT-23-02-14"
];

config.app = {
    "title": {
        "type": "value",
        "default": "Tariff Explorer",
        "name": "Title",
        "description": "Optional title for app"
    },
    "import": {
        "optional": true,
        "type": "feed",
        "autoname": "import"
    },
    "import_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "import_kwh"
    },
    "use_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "use_kwh"
    },
    "solar_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "solar_kwh"
    },
    "battery_charge_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_charge_kwh"
    },
    "battery_discharge_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_discharge_kwh"
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
        "options": import_tariff_options
    },

    "tariff_B": {
        "type": "select",
        "name": "Select tariff B:",
        "default": "INTELLI-VAR-22-10-14",
        "options": import_tariff_options
    },

    "export_tariff": {
        "type": "select",
        "name": "Select export tariff:",
        "default": "agile_export",
        "options": export_tariff_options
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

var solarpv_mode = false;
var battery_mode = false;

var smart_meter_data = false;
var use_meter_kwh_hh = false;

var profile_kwh = {};
var profile_cost = {};

// Vue.js app for totals display
var app = new Vue({
    el: '#vue-app',
    data: {
        total: {},
        days: 0
    },
    filters: {
        toFixed: function (value, decimals) {
            if (!value) return "";
            return value.toFixed(decimals);
        }
    }
});

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

    // Import tariff select
    var import_tariff_select = "";
    for (var z in import_tariff_options) {
        import_tariff_select += "<option value='" + import_tariff_options[z] + "'>" + import_tariff_options[z] + "</option>";
    }
    $("#import-tariff-select").html(import_tariff_select);

    // Export tariff select
    var export_tariff_select = "";
    for (var z in export_tariff_options) {
        let key = export_tariff_options[z];
        let name = key;
        if (key == "agile_export") name = "AGILE-EXPORT-22-10-14"; // temporary hardcode mapping
        export_tariff_select += "<option value='" + key + "'>" + name + "</option>";
    }
    $("#export-tariff-select").html(export_tariff_select);
}

function show() {
    $("body").css('background-color', 'WhiteSmoke');
    $("#app-title").html(config.app.title.value);

    // Quick translation of feed ids
    feeds = {};

    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];
    }

    solarpv_mode = false;
    battery_mode = false;

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

        if (feeds["import"] != undefined) {
            if (feeds["import"].value < 10000) {
                $("#power_now").html(Math.round(feeds["import"].value) + "<span class='units'>W</span>");
            } else {
                $("#power_now").html((feeds["import"].value * 0.001).toFixed(1) + "<span class='units'>kW</span>");
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

function graph_load() {
    $(".power-graph-footer").show();
    $("#import-tariff-select").val(config.app.tariff_A.value);
    $("#export-tariff-select").val(config.app.export_tariff.value);

    var interval = 1800;
    var intervalms = interval * 1000;
    view.start = Math.ceil(view.start / intervalms) * intervalms;
    view.end = Math.ceil(view.end / intervalms) * intervalms;
    view.npoints = Math.ceil((view.end - view.start) / intervalms);


    if (datetimepicker1) {
        datetimepicker1.setLocalDate(new Date(view.start));
        datetimepicker1.setEndDate(new Date(view.end));
    }
    if (datetimepicker2) {
        datetimepicker2.setLocalDate(new Date(view.end));
        datetimepicker2.setStartDate(new Date(view.start));
    }

    // -----------------------------------------------------------------------
    // 1. Data requirements checks
    // -----------------------------------------------------------------------
    
    // Uncomment to test missing data and handling of different modes
    // delete feeds["battery_charge_kwh"];
    // delete feeds["battery_discharge_kwh"];
    // delete feeds["solar_kwh"];
    // delete feeds["import_kwh"];
    // delete feeds["use_kwh"];

    // We need either total consumption, import data or smart meter data for the standard import mode
    // - if import_kwh is available we use that as default
    // - if not we use use_kwh data as this will be the same as import if no solar or battery
    // - if neither is available we can use smart meter data if available
    if (feeds["import_kwh"] == undefined && feeds["use_kwh"] == undefined && feeds["meter_kwh_hh"] == undefined) {
        alert("You need to select at least one of consumption (use_kwh), import (import_kwh) or smart meter (meter_kwh_hh) feeds to use this app.");
        return;
    }

    // We need both total consumption data and solar generation data for solar PV mode
    // - when in solar PV mode we calculate import from consumption minus solar generation
    if (feeds["use_kwh"] != undefined && feeds["solar_kwh"] != undefined) {
        solarpv_mode = true;
    }

    // We need total consumption, battery charge and battery discharge data for battery mode
    // - when in battery mode we calculate import from consumption minus battery discharge plus battery charge
    if (feeds["battery_charge_kwh"] != undefined && feeds["battery_discharge_kwh"] != undefined) {
        battery_mode = true;
    }

    // -----------------------------------------------------------------------
    // 2. User account data download
    // -----------------------------------------------------------------------

    // Clear all data  - we will re-download all
    data = {};

    // Prepare list of feeds to download
    var feeds_to_download = {};

    if (feeds["import_kwh"] != undefined) {
        feeds_to_download["import_kwh"] = feeds["import_kwh"].id;
        import_kwh_available = true;
    }

    if (feeds["use_kwh"] != undefined) {
        feeds_to_download["use_kwh"] = feeds["use_kwh"].id;
        use_kwh_available = true;
    }

    if (solarpv_mode) {
        feeds_to_download["solar_kwh"] = feeds["solar_kwh"].id;
    }

    if (battery_mode) {
        feeds_to_download["battery_charge_kwh"] = feeds["battery_charge_kwh"].id;
        feeds_to_download["battery_discharge_kwh"] = feeds["battery_discharge_kwh"].id;
    }

    var feed_ids = Object.values(feeds_to_download);
    var feed_keys = Object.keys(feeds_to_download);
    var deltas = [];
    for (var z = 0; z < feed_ids.length; z++) {
        deltas.push(1);
    }
    deltas = deltas.join(',');

    var result = feed.getdata(feed_ids,view.start,view.end,interval,0,deltas,0,0,false,false,'notime');
    for (var z in result) {
        data[feed_keys[z]] = result[z].data;
    }

    // Smart meter data
    if (feeds["meter_kwh_hh"] != undefined) {
        data['meter_kwh'] = feed.getdata(feeds["meter_kwh_hh"].id, view.start, view.end, interval,0,0,0,0,false,false,'notime');
        smart_meter_data_available = true;
        $("#use_meter_kwh_hh_bound").show();
    }

    // Derive missing import or use data if possible
    if (!solarpv_mode && !battery_mode) {

        // No consumption data: Use is the same as import if no solar or battery
        if (data["import_kwh"] != undefined) {
            data["use_kwh"] = data["import_kwh"];

        // No import data: Import is the same as use if no solar or battery
        } else if (data["use_kwh"] != undefined) {
            data["import_kwh"] = data["use_kwh"];

        // If neither import nor use is available, but smart meter data is, use that for both
        } else if (data['meter_kwh'] != undefined) {
            data["import_kwh"] = data["meter_kwh"];
            data["use_kwh"] = data["meter_kwh"];
        }
    }

    // Derive use_kwh if import_kwh is available and battery data is present
    if (battery_mode && !solarpv_mode && data["use_kwh"] == undefined && data["import_kwh"] != undefined) {
        data["use_kwh"] = [];
        for (var z = 0; z < view.npoints; z++) {
            let time = view.start + (z * intervalms);
            let import_kwh = data["import_kwh"][z][1];
            let battery_charge_kwh = data["battery_charge_kwh"][z][1];
            let battery_discharge_kwh = data["battery_discharge_kwh"][z][1];
            let use_kwh = import_kwh + battery_discharge_kwh - battery_charge_kwh;
            data["use_kwh"].push([time, use_kwh]);
        }
    }

    // -----------------------------------------------------------------------
    // 3. Tariff and carbon data download
    // -----------------------------------------------------------------------

    data["import_tariff"] = []
    data["export_tariff"] = []
    data["carbonintensity"] = []

    // Tariff A
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff_A.value] != undefined && octopus_feed_list[config.app.tariff_A.value][config.app.region.value] != undefined) {
        data["import_tariff"] = getdataremote(octopus_feed_list[config.app.tariff_A.value][config.app.region.value], view.start, view.end, interval);
    }

    // Export tariff
    if (config.app.region != undefined && (solarpv_mode || battery_mode)) {
        data["export_tariff"] = getdataremote(octopus_feed_list[config.app.export_tariff.value][config.app.region.value], view.start, view.end, interval);
        // Invert export tariff
        for (var z in data["export_tariff"]) data["export_tariff"][z][1] *= -1;
    }

    // Carbon Intensity
    if (show_carbonintensity) {
        data["carbonintensity"] = getdataremote(428391, view.start, view.end, interval);
    }

    // -----------------------------------------------------------------------

    let calculated = process_energy_data(data, solarpv_mode, battery_mode);
    for (var key in calculated) {
        data[key] = calculated[key];
    }

    let costs = process_costs(data,"import_tariff","export_tariff");
    app.total = costs;

    app.days = (view.end - view.start) / (1000 * 3600 * 24);

    // if (show_carbonintensity) {
    //     let co2 = process_carbon_intensity(data);
    // }

    // if (smart_meter_data) {
    //     calibration_line_of_best_fit(import_kwh_hh, meter_kwh_hh);
    // }

    // var monthly_data = process_monthly_data(data);
    // draw_tables(total, monthly_data);
}

// -----------------------------------------------------------------------
// 4. Energy data processing
// -----------------------------------------------------------------------
function process_energy_data(data, solarpv_mode, battery_mode) {

    var interval = 1800;
    var intervalms = interval * 1000;

    var calculated = {};
    calculated["import_kwh"] = [];
    calculated["export"] = [];
    calculated["solar_direct"] = [];
    calculated["solar_to_battery"] = [];
    calculated["battery_to_load"] = [];
    calculated["grid_to_battery"] = [];

    for (var z = 0; z < view.npoints; z++) {
        let time = view.start + (z * intervalms);
    
        let kwh_import = 0;
        let kwh_export = 0;
        let kwh_solar = 0;
        let kwh_battery_charge = 0;
        let kwh_battery_discharge = 0;

        // 1. Calculate import/export via balance method

        // Start with consumption (which will be same as import if no solar or battery)
        let kwh_use = data['use_kwh'][z][1];
        let balance = kwh_use;

        // If solar mode, fetch kwh_solar
        if (solarpv_mode) {
            kwh_solar = data['solar_kwh'][z][1];
            balance -= kwh_solar;
        }

        // if battery mode, fetch battery charge and discharge
        if (battery_mode) {

            let battery_balance = data['battery_charge_kwh'][z][1] - data['battery_discharge_kwh'][z][1];

            if (battery_balance > 0) {
                kwh_battery_charge = battery_balance;
            } else {
                kwh_battery_discharge = battery_balance * -1;
            }

            balance += kwh_battery_charge;
            balance -= kwh_battery_discharge;
        }

        // Calculate import/export balance
        if (balance >= 0) {
            kwh_import = balance;
            kwh_export = 0;
        } else {
            kwh_import = 0;
            kwh_export = balance * -1;
        }

        // Overwrite import kwh data
        calculated["import_kwh"].push([time, kwh_import]);

        // We may explore in battery mode
        if (solarpv_mode || battery_mode) {
            calculated["export"].push([time, kwh_export * -1]);
        }

        // Solar used calculation
        let solar_to_battery = 0;
        if (solarpv_mode) {
            let solar_direct = Math.min(kwh_solar, kwh_use);
            calculated["solar_direct"].push([time, solar_direct]);

            solar_to_battery = Math.min(Math.max(0, kwh_solar - solar_direct), kwh_battery_charge);
            calculated["solar_to_battery"].push([time, solar_to_battery]);
        }

        if (battery_mode) {
            // Battery to load
            let load = kwh_use;
            if (solarpv_mode) {
                let solar_direct = Math.min(kwh_solar, kwh_use);
                load -= solar_direct;
            }
            let battery_to_load = Math.min(kwh_battery_discharge, load);
            calculated["battery_to_load"].push([time, battery_to_load]);

            // Charge from grid
            let grid_to_battery = kwh_battery_charge;
            // If solar PV mode, subtract solar to battery
            if (solarpv_mode) {
                grid_to_battery -= solar_to_battery;
            }
            calculated["grid_to_battery"].push([time, grid_to_battery]);

        }
    }
    return calculated;
}

// -----------------------------------------------------------------------
// 5. Cost calculations
// -----------------------------------------------------------------------
function process_costs(data, import_tariff_key, export_tariff_key) {

    let total = {
        import: { kwh: 0, cost: 0 },
        export: { kwh: 0, value: 0 },
        solar_direct: { kwh: 0, value: 0 },
        solar_to_battery: { kwh: 0, value: 0 },
        grid_to_battery: { kwh: 0, cost: 0 },
        battery_to_load: { kwh: 0, value: 0 },
        net : { kwh: 0, cost: 0 },
        // comparisons
        import_only: { kwh: 0, cost: 0 },
        solar_only: { kwh: 0, cost: 0 },
        // totals only
        use: { kwh: 0 },
        solar: { kwh: 0 },
        battery_charge: { kwh: 0 },
        battery_discharge: { kwh: 0 }
    };

    let import_cost_hh_data = [];

    for (var z = 0; z < view.npoints; z++) {

        let time = data["import_kwh"][z][0];
        let import_kwh_hh = data["import_kwh"][z][1];

        // Unit and import cost on tariff A
        let import_unitrate = null;
        let import_cost_hh = null;
        
        if (data[import_tariff_key][z][1] != null) {
            import_unitrate = data[import_tariff_key][z][1] * 0.01;
            import_cost_hh = import_kwh_hh * import_unitrate;

            total.import.kwh += import_kwh_hh
            total.import.cost += import_cost_hh
        }

        import_cost_hh_data.push([time, import_cost_hh]);

        // Use
        let use_kwh_hh = data["use_kwh"][z][1];
        total.use.kwh += use_kwh_hh;

        let export_unitrate = null; 
        if (solarpv_mode || battery_mode) {
            if (data[export_tariff_key][z][1] != null) {
                export_unitrate = data[export_tariff_key][z][1] * 0.01 * -1;

                let export_kwh = data["export"][z][1] * -1;
                total.export.kwh += export_kwh
                total.export.value += export_kwh * export_unitrate;

                if (solarpv_mode) {
                    let solar_kwh = data["solar_kwh"][z][1];
                    let solar_direct = data["solar_direct"][z][1];
                    let solar_to_battery = data["solar_to_battery"][z][1];

                    total.solar.kwh += solar_kwh;
                    total.solar_direct.kwh += solar_direct
                    total.solar_direct.value += solar_direct * import_unitrate

                    total.solar_to_battery.kwh += solar_to_battery
                    total.solar_to_battery.value += solar_to_battery * export_unitrate
                }

                if (battery_mode) {
                    let battery_to_load = data["battery_to_load"][z][1];
                    total.battery_to_load.kwh += battery_to_load
                    total.battery_to_load.value += battery_to_load * import_unitrate

                    let grid_to_battery = data["grid_to_battery"][z][1];
                    total.grid_to_battery.kwh += grid_to_battery
                    total.grid_to_battery.cost += grid_to_battery * import_unitrate

                    let battery_discharge = data["battery_discharge_kwh"][z][1];
                    total.battery_discharge.kwh += battery_discharge;

                    let battery_charge = data["battery_charge_kwh"][z][1];
                    total.battery_charge.kwh += battery_charge;
                }
            }
        }
    }

    // Net cost
    total.net.kwh = total.import.kwh - total.grid_to_battery.kwh + total.solar_direct.kwh + total.battery_to_load.kwh;
    total.net.cost = total.import.cost - total.export.value;

    // Cost comparisons
    total.import_only.kwh = total.import.kwh - total.grid_to_battery.kwh + total.solar_direct.kwh + total.battery_to_load.kwh;
    total.import_only.cost = total.import.cost - total.grid_to_battery.cost + total.solar_direct.value + total.battery_to_load.value;
    total.solar_only.kwh = total.import_only.kwh;
    total.solar_only.cost = total.import_only.cost - total.solar_direct.value - total.solar_to_battery.value - total.export.value;

    return total;
}

// Process carbon intensity
function process_carbon_intensity(data) {
    let total_import_kwh = 0;
    let total_import_co2_kg = 0;

    for (var z = 0; z < view.npoints; z++) {
        let import_kwh = data["import_kwh"][z][1];
        let co2intensity = data.carbonintensity[z][1];

        if (co2intensity == null) continue;
        if (kwh_import == null) continue;

        total_import_kwh += import_kwh;
        total_import_co2_kg += import_kwh * (co2intensity * 0.001);
    }
    return {
        kwh: total_import_kwh,
        co2: total_import_co2_kg
    }
}

function process_monthly_data(data) {
    var monthly_data = {};
    var d = new Date();

    for (var z = 0; z < data["import_kwh"].length; z++) {
        d.setTime(data["import_kwh"][z][0]);

        // get start of month timestamp to calculate monthly data
        let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

        if (monthly_data[startOfMonth] == undefined) {
            monthly_data[startOfMonth] = {
                "import": 0,
                "import_tariff_A": 0,
                "import_tariff_B": 0,
                "cost_import_tariff_A": 0,
                "cost_import_tariff_B": 0
            }
        }

        let kwh_import = data["import_kwh"][z][1];
        let hh_cost_tariff_A = data["import_cost_tariff_A"][z][1];
        let hh_cost_tariff_B = data["import_cost_tariff_B"][z][1];

        monthly_data[startOfMonth]["import"] += kwh_import;

        if (hh_cost_tariff_A != null) {
            monthly_data[startOfMonth]["import_tariff_A"] += kwh_import
            monthly_data[startOfMonth]["cost_import_tariff_A"] += hh_cost_tariff_A 
        }

        if (hh_cost_tariff_B != null) {
            monthly_data[startOfMonth]["import_tariff_B"] += kwh_import
            monthly_data[startOfMonth]["cost_import_tariff_B"] += hh_cost_tariff_B
        }
    }

    return monthly_data;
}

function draw_tables(total, monthly_data) {

    var unit_cost_import_tariff_A = (total.import_tariff_A.cost / total.import_tariff_A.kwh);
    var unit_cost_import_tariff_B = (total.import_tariff_B.cost / total.import_tariff_B.kwh);

    if (show_carbonintensity) {
        var window_co2_intensity = 1000 * total.co2 / total.import_kwh;
        $("#carbonintensity_result").html("Total CO2: " + (total.co2).toFixed(1) + "kgCO2, Consumption intensity: " + window_co2_intensity.toFixed(0) + " gCO2/kWh")
    }

    $("#show_profile").show();
    // Set tariff_A
    $("#tariff_A").val(config.app.tariff_A.value);
    $("#tariff_B").val(config.app.tariff_B.value);

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Populate monthly data if more than one month of data
    if (Object.keys(monthly_data).length > 1) {
        var monthly_out = "";

        var monthly_sum_kwh = 0;
        var monthly_sum_kwh_tariff_A = 0;outgoing
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
            
            monthly_out += "<td>£" + tariff_B_cost.toFixed(2) + "</td>";
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

    // Solar used data
    if (solarpv_mode) {
        graph_series.push({
            label: "Solar direct",
            data: data["solar_direct"],
            yaxis: 1,
            color: "#bec745",
            stack: true,
            bars: bars
        });
    }

    if (solarpv_mode && battery_mode) {
        graph_series.push({
            label: "Solar to Battery",
            data: data["solar_to_battery"],
            yaxis: 1,
            color: "#a3d977",
            stack: true,
            bars: bars
        });
    }

    // Import data
    graph_series.push({
        label: "Import",
        data: data["import_kwh"],
        yaxis: 1,
        color: "#44b3e2",
        stack: true,
        bars: bars
    });

    // BAttery to load
    if (battery_mode) {
        graph_series.push({
            label: "Battery to Load",
            data: data["battery_to_load"],
            yaxis: 1,
            color: "#f39c12",
            stack: true,
            bars: bars
        });

        // Charge from grid
        graph_series.push({
            label: "Grid to battery",
            data: data["grid_to_battery"],
            yaxis: 1,
            color: "#f5c469",
            stack: true,
            bars: bars
        });
    }

    // Export data
    if (solarpv_mode || battery_mode) {
        graph_series.push({
            label: "Export",
            data: data["export"],
            yaxis: 1,
            color: "#dccc1f",
            stack: false,
            bars: bars
        });
    }

    // Smart meter data
    if (smart_meter_data && !solarpv_mode) {
        graph_series.push({
            label: "Import Actual",
            data: data["meter_kwh_hh"],
            yaxis: 1,
            color: "#1d8dbc",
            stack: false,
            bars: bars
        });
    }

    // price signals
    graph_series.push({
        label: config.app.tariff_A.value,
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

    if (solarpv_mode) {
        graph_series.push({
            label: config.app.export_tariff.value,
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
    }

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


function convert_cumulative_kwh_to_kwh_hh(cumulative_kwh_data, limit_positive=false) {
    var kwh_hh_data = [];
    
    for (var z = 1; z < cumulative_kwh_data.length; z++) {
        let time = cumulative_kwh_data[z - 1][0];
        let kwh_hh = 0;
        if (cumulative_kwh_data[z][1] != null && cumulative_kwh_data[z - 1][1] != null) {
            kwh_hh = cumulative_kwh_data[z][1] - cumulative_kwh_data[z - 1][1];
        }
        if (limit_positive && kwh_hh < 0.0) kwh_hh = 0.0;
        kwh_hh_data.push([time, kwh_hh]);
    }

    return kwh_hh_data;
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
            var itemValue = item.datapoint[1];

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

            let import_kwh = get_data_value_at_index("import_kwh", z);
            let solar_direct_kwh = get_data_value_at_index("solar_direct", z);
            let solar_to_battery_kwh = get_data_value_at_index("solar_to_battery", z);
            let battery_to_load_kwh = get_data_value_at_index("battery_to_load", z);
            let export_kwh = get_data_value_at_index("export", z);
            let tariff_A = get_data_value_at_index("tariff_A", z);
            let tariff_B = get_data_value_at_index("tariff_B", z);
            let export_tariff_value = get_data_value_at_index("export_tariff", z);
            let carbonintensity = get_data_value_at_index("carbonintensity", z);

            if (import_kwh != null && import_kwh > 0.001) {
                text += "Import: " + import_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) {
                    let cost = import_kwh * tariff_A;
                    text += " (" + cost.toFixed(2) + "p cost)";
                }
            }

            if (solarpv_mode) {
                if (solar_direct_kwh != null && solar_direct_kwh > 0.001) {
                    text += "<br>Solar Direct: " + solar_direct_kwh.toFixed(3) + " kWh";
                    if (tariff_A != null) {
                        let cost = solar_direct_kwh * tariff_A;
                        text += " (£" + (cost / 100).toFixed(2) + " avoided cost)";
                    }
                }

                if (solar_to_battery_kwh != null && solar_to_battery_kwh > 0.001) {
                    text += "<br>Solar to Battery: " + solar_to_battery_kwh.toFixed(3) + " kWh";
                    if (export_tariff_value != null) {
                        let cost = solar_to_battery_kwh * export_tariff_value;
                        text += " (£" + (cost / 100).toFixed(2) + " forgone export value)";
                    }
                }
            }

            if (battery_mode) {
                if (battery_to_load_kwh != null && battery_to_load_kwh > 0.001) {
                    text += "<br>Battery to Load: " + battery_to_load_kwh.toFixed(3) + " kWh";
                    if (tariff_A != null) {
                        let cost = battery_to_load_kwh * tariff_A;
                        text += " (£" + (cost / 100).toFixed(2) + " avoided cost)";
                    }
                }
            }

            if (export_kwh != null && export_kwh < -0.001) {
                text += "<br>Export: " + (export_kwh * -1).toFixed(3) + " kWh";
                if (export_tariff_value != null) {
                    let cost = export_kwh * export_tariff_value;
                    text += " (" + cost.toFixed(2) + "p gained)";
                }
            }

            text += "<br>";

            if (export_tariff_value != null) {
                text += "Export Tariff: " + export_tariff_value.toFixed(2) + " p/kWh (inc VAT)<br>";
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

    if (solarpv_mode) {
        keys = ["tariff_A", "tariff_B", "export_tariff", "use", "import", "import_cost_tariff_A", "import_cost_tariff_B", "export", "solar_used", "solar_used_cost", "meter_kwh_hh", "meter_kwh_hh_cost"]
    } else {
        keys = ["tariff_A", "tariff_B", "import", "import_cost_tariff_A", "import_cost_tariff_B", "meter_kwh_hh", "meter_kwh_hh_cost"]
    }

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

$("#import-tariff-select").change(function() {
    config.app.tariff_A.value = $(this).val();

    config.db.tariff_A = config.app.tariff_A.value;
    config.set();

    graph_load();
    graph_draw();
});

$("#export-tariff-select").change(function() {
    config.app.export_tariff.value = $(this).val();

    config.db.export_tariff = config.app.export_tariff.value;
    config.set();

    graph_load();
    graph_draw();
});