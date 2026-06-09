// -------------------------------------------------------------------------------------------------------
// MySolarPVBattery Tariff cost breakdown
// -------------------------------------------------------------------------------------------------------
// Self-contained cost analysis adapted from the Tariff Explorer (octopus) app. It runs its own
// dedicated half-hourly (1800s) data load over the current view window, completely independent of the
// power/bar chart's variable interval, so tariff costs are always computed on half-hourly buckets.
//
// Relies on globals defined elsewhere in the app: feed, config, view, path, flow_colors.
// -------------------------------------------------------------------------------------------------------

// Per-flow rate metadata: which tariff feed (import vs export) prices each energy flow.
const tariff_flows = [
    { key: "solar_to_load",    rate: "tariff"   },
    { key: "solar_to_battery", rate: "tariff"   },
    { key: "solar_to_grid",    rate: "outgoing" },
    { key: "battery_to_load",  rate: "tariff"   },
    { key: "battery_to_grid",  rate: "outgoing" },
    { key: "grid_to_load",     rate: "tariff"   },
    { key: "grid_to_battery",  rate: "tariff"   }
];

// Export (outgoing) tariff feed ids on emoncms.org, keyed by region.
const regions_outgoing = {
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
};

// Tariff name + region -> import tariff feed id, fetched from emoncms.org via app/octopus-feed-list.
let octopus_feed_list = {};

// Loaded half-hourly data arrays (flow kWh + tariff rates) and accumulated totals.
let tariff_data = {};
let total_tariff = {};

// ----------------------------------------------------------------------
// Fetch the list of remote Octopus tariff feeds (import tariffs by region).
// Called once from show().
// ----------------------------------------------------------------------
function fetch_octopus_feed_list() {
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
}

// ----------------------------------------------------------------------
// load_tariff_analysis: dedicated 1800s load for the cost breakdown.
// Reads the current view window, aligns to half-hour boundaries locally
// (without mutating view, so the chart is undisturbed), loads the kWh flow
// feeds (delta=1) and the remote tariff feeds, then processes and renders.
// ----------------------------------------------------------------------
function load_tariff_analysis() {
    const interval = 1800;
    const intervalms = interval * 1000;
    const ts = Math.ceil(view.start / intervalms) * intervalms;
    const te = Math.ceil(view.end / intervalms) * intervalms;

    // 1) Load the seven cumulative kWh flow feeds (delta=1 -> per half-hour energy)
    let keys_to_load = [];
    let feedids = [];
    tariff_flows.forEach(function(f) {
        tariff_data[f.key] = false;
        if (config.app[f.key + "_kwh"] && config.app[f.key + "_kwh"].value) {
            feedids.push(config.app[f.key + "_kwh"].value);
            keys_to_load.push(f.key);
        }
    });

    feed.getdata(feedids, ts, te, interval, 0, 1, 0, 0, function (all_data) {
        if (all_data.success === false) {
            keys_to_load.forEach(function(key) { tariff_data[key] = []; });
        } else {
            keys_to_load.forEach(function(key, index) {
                tariff_data[key] = all_data[index].data;
            });
        }
        load_tariff_rates(ts, te, interval);
    }, false, "notime");
}

// ----------------------------------------------------------------------
// Load the remote import/export tariff rate feeds for the selected
// region/tariff (via app/dataremote.json), then process.
// ----------------------------------------------------------------------
function load_tariff_rates(ts, te, interval) {
    const region = config.app.region ? config.app.region.value : false;
    const tariff = config.app.tariff ? config.app.tariff.value : false;

    const remote_feeds = {
        import_tariff: (region && tariff && octopus_feed_list[tariff]) ? octopus_feed_list[tariff][region] : false,
        export_tariff: region ? (regions_outgoing[region] || false) : false
    };

    let feedids = [];
    let keys_to_load = [];
    for (const key in remote_feeds) {
        if (remote_feeds[key]) { feedids.push(remote_feeds[key]); keys_to_load.push(key); }
        else tariff_data[key] = [];
    }

    feed.getdata(feedids, ts, te, interval, 0, 0, 0, 0, function (all_data) {
        if (all_data.success === false) {
            keys_to_load.forEach(function(key) { tariff_data[key] = []; });
        } else {
            keys_to_load.forEach(function(key, index) {
                tariff_data[key] = all_data[index].data;
            });
        }

        // Invert export tariff (stored as a positive rate, applied as a credit).
        for (var z in tariff_data["export_tariff"]) {
            tariff_data["export_tariff"][z][1] *= -1;
        }

        process_tariff_data();
        render_cost_breakdown();
    }, false, "notime", "app/dataremote.json");
}

// ----------------------------------------------------------------------
// process_tariff_data: accumulate per-flow kWh and cost over the window.
// Cost = sum over half-hours of (flow kWh * unit rate in p/kWh * 0.01).
// ----------------------------------------------------------------------
function process_tariff_data() {
    total_tariff = {};
    tariff_flows.forEach(function(f) {
        total_tariff[f.key] = { kwh: 0, cost: 0 };
    });

    const ref_data = tariff_data["grid_to_load"];
    if (!ref_data || !ref_data.length) return;

    for (var z = 0; z < ref_data.length; z++) {
        let import_unit_rate = get_value_at_index(tariff_data["import_tariff"], z, null);
        let export_unit_rate = get_value_at_index(tariff_data["export_tariff"], z, null);

        tariff_flows.forEach(function(f) {
            let kwh = Math.max(0, get_value_at_index(tariff_data[f.key], z, 0));
            let unit_rate = (f.rate === "outgoing") ? (export_unit_rate === null ? null : export_unit_rate * -1) : import_unit_rate;
            if (unit_rate !== null) {
                total_tariff[f.key].cost += kwh * unit_rate * 0.01;
                total_tariff[f.key].kwh  += kwh;
            }
        });
    }
}

function get_value_at_index(data_array, index, default_value = null) {
    if (data_array == undefined) return default_value;
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

// -------------------------------------------------------------------------------
// RENDERING
// -------------------------------------------------------------------------------

// Renders a single energy-flow row for the cost breakdown table.
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
            + (value_gbp !== null ? (value_gbp >= 0 ? "£" : "-£") + Math.abs(value_gbp).toFixed(2) : "&mdash;")
            + "</td>"
        + unit_price_cell
        + "<td style='color:#aaa;font-size:12px'>" + value_label + "</td>"
        + "</tr>";
}

// Builds the HTML for the flow totals table body.
function render_flow_table() {
    var vat = 1.05;
    var net_cost_gbp          = calc_net_cost(total_tariff);
    var total_consumption_kwh = calc_total_consumption(total_tariff);

    var rows = "";
    rows += render_flow_row("&#9728; Solar &rarr; Load",              total_tariff.solar_to_load.kwh,    total_tariff.solar_to_load.cost    * vat, "avoided import cost",          flow_colors.solar_to_load);
    rows += render_flow_row("&#9728; Solar &rarr; Grid (export)",     total_tariff.solar_to_grid.kwh,    total_tariff.solar_to_grid.cost    * vat, "earned at export tariff",      flow_colors.solar_to_grid);
    rows += render_flow_row("&#9728; Solar &rarr; Battery",           total_tariff.solar_to_battery.kwh, total_tariff.solar_to_battery.cost * vat, "avoided import cost",          flow_colors.solar_to_battery);
    rows += render_flow_row("&#x1F50B; Battery &rarr; Load",          total_tariff.battery_to_load.kwh,  total_tariff.battery_to_load.cost  * vat, "avoided import cost",          flow_colors.battery_to_load);
    rows += render_flow_row("&#x1F50B; Battery &rarr; Grid (export)", total_tariff.battery_to_grid.kwh,  total_tariff.battery_to_grid.cost  * vat, "earned at export tariff",      flow_colors.battery_to_grid);
    rows += render_flow_row("&#x1F4A1; Grid &rarr; Battery",          total_tariff.grid_to_battery.kwh,  total_tariff.grid_to_battery.cost  * vat, "import cost",                  flow_colors.grid_to_battery);
    rows += render_flow_row("&#x1F4A1; Grid &rarr; Load",             total_tariff.grid_to_load.kwh,     total_tariff.grid_to_load.cost     * vat, "import cost",                  flow_colors.grid_to_load);
    rows += render_flow_row("Net result", total_consumption_kwh, net_cost_gbp, "grid costs minus export earnings", "#444", "font-weight:bold;background-color:#333");

    return rows;
}

// Injects the cost breakdown table into the cost view.
function render_cost_breakdown() {
    $("#cost_breakdown_body").html(render_flow_table());
}
