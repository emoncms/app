// -------------------------------------------------------------------------------------------------------
// MySolarPVBattery Tariff cost breakdown
// -------------------------------------------------------------------------------------------------------
// Self-contained cost analysis adapted from the Tariff Explorer (octopus) app. It runs its own
// dedicated half-hourly (1800s) data load over the current view window, completely independent of the
// power/bar chart's variable interval, so tariff costs are always computed on half-hourly buckets.
//
// Relies on globals defined elsewhere in the app: feed, config, view, path, flow_colors,
// tariff_options, load_process_draw_graph().
// -------------------------------------------------------------------------------------------------------

// Per-flow rate metadata: which tariff feed (import vs export) prices each energy flow,
// a display label for tooltips, and the value verb shown alongside the priced amount.
const tariff_flows = [
    { key: "solar_to_load",    rate: "tariff",   str: "&#9728; Solar &rarr; Load",     label: "saved"  },
    { key: "solar_to_battery", rate: "tariff",   str: "&#9728; Solar &rarr; Battery",  label: "saved"  },
    { key: "solar_to_grid",    rate: "outgoing", str: "&#9728; Solar &rarr; Grid",     label: "gained" },
    { key: "battery_to_load",  rate: "tariff",   str: "&#128267; Battery &rarr; Load",  label: "saved"  },
    { key: "battery_to_grid",  rate: "outgoing", str: "&#128267; Battery &rarr; Grid",  label: "gained" },
    { key: "grid_to_load",     rate: "tariff",   str: "&#9889; Grid &rarr; Load",       label: "cost"   },
    { key: "grid_to_battery",  rate: "tariff",   str: "&#9889; Grid &rarr; Battery",    label: "cost"   }
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

// Maps a half-hour timestamp -> its index in the data arrays (used by the chart hover).
let time_to_index_map = {};

// Last hovered datapoint, so the tariff tooltip is only rebuilt when it changes.
let tariff_tooltip_prev = false;

// Per-month buckets + summaries, and the saved baseline for tariff comparison.
let monthly_data = {};
let monthly_summary = {};
let baseline_monthly_summary = {};
let baseline_tariff_name = "";

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
// load_tariff_analysis: dedicated 1800s analysis for the cost breakdown.
// Mirrors the Tariff Explorer graph_load(): reads the current view window,
// aligns to half-hour boundaries locally (without mutating view, so the
// chart is undisturbed), and supports partial reloads:
//   load_flows + load_tariffs : reload flow feeds, then rate feeds, process
//   load_tariffs only         : reload rate feeds only (quick tariff switch)
//   neither                   : reprocess existing data
// ----------------------------------------------------------------------
function load_tariff_analysis(load_flows = true, load_tariffs = true) {
    const interval = 1800;
    const intervalms = interval * 1000;
    const ts = Math.ceil(view.start / intervalms) * intervalms;
    const te = Math.ceil(view.end / intervalms) * intervalms;

    // A changed window / reloaded flows invalidates the saved baseline period.
    if (load_flows) baseline_monthly_summary = {};

    if (load_flows) {
        load_flow_data(ts, te, interval, load_tariffs);
    } else if (load_tariffs) {
        load_tariff_rates(ts, te, interval);
    } else {
        process_tariff_data();
        render_cost_breakdown();
    }
}

// Load the seven cumulative kWh flow feeds (delta=1 -> per half-hour energy).
function load_flow_data(ts, te, interval, load_tariffs) {
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
        if (load_tariffs) {
            load_tariff_rates(ts, te, interval);
        } else {
            process_tariff_data();
            render_cost_breakdown();
        }
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
// process_tariff_data: accumulate per-flow kWh and cost over the window,
// plus per-month buckets. Cost = sum over half-hours of
// (flow kWh * unit rate in p/kWh * 0.01).
// ----------------------------------------------------------------------
function process_tariff_data() {
    var total_template = {};
    tariff_flows.forEach(function(f) {
        total_template[f.key] = { kwh: 0, cost: 0 };
    });

    total_tariff = JSON.parse(JSON.stringify(total_template));
    monthly_data = {};
    time_to_index_map = {};

    const ref_data = tariff_data["grid_to_load"];
    if (!ref_data || !ref_data.length) return;

    var d = new Date();
    for (var z = 0; z < ref_data.length; z++) {
        let time = ref_data[z][0];
        time_to_index_map[time] = z;
        d.setTime(time);
        let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();

        if (monthly_data[startOfMonth] == undefined) {
            monthly_data[startOfMonth] = JSON.parse(JSON.stringify(total_template));
        }

        let import_unit_rate = get_value_at_index(tariff_data["import_tariff"], z, null);
        let export_unit_rate = get_value_at_index(tariff_data["export_tariff"], z, null);

        tariff_flows.forEach(function(f) {
            let kwh = Math.max(0, get_value_at_index(tariff_data[f.key], z, 0));
            let unit_rate = (f.rate === "outgoing") ? (export_unit_rate === null ? null : export_unit_rate * -1) : import_unit_rate;
            if (unit_rate !== null) {
                monthly_data[startOfMonth][f.key].cost += kwh * unit_rate * 0.01;
                monthly_data[startOfMonth][f.key].kwh  += kwh;
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

// Returns an array of per-month summary objects, and populates the global
// monthly_summary for use by the baseline save feature.
function calc_monthly_summaries() {
    monthly_summary = {};
    var summaries = [];

    for (var month in monthly_data) {
        var md = monthly_data[month];
        var net_cost    = calc_net_cost(md);
        var consumption = calc_total_consumption(md);
        var unit_rate   = consumption > 0 ? (net_cost / consumption) * 100 : NaN;

        summaries.push({
            timestamp:   month,
            date:        new Date(parseInt(month)),
            consumption: consumption,
            net_cost:    net_cost,
            unit_rate:   unit_rate,
            baseline:    baseline_monthly_summary[month] || null
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
// RENDERING
// -------------------------------------------------------------------------------

// Renders a GBP cost + optional unit-rate into a single <td>.
function render_cost_cell(net_cost, unit_rate) {
    var text = (net_cost >= 0 ? "£" : "-£") + Math.abs(net_cost).toFixed(2);
    if (!isNaN(unit_rate)) {
        text += " <span style='font-size:12px;color:#888'>" + unit_rate.toFixed(1) + " p/kWh</span>";
    }
    return "<td>" + text + "</td>";
}

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

    var sum_consumption_kwh   = 0;
    var sum_net_cost_tariff   = 0;
    var sum_net_cost_baseline = 0;
    var rows = "";

    for (var i = 0; i < summaries.length; i++) {
        var s = summaries[i];
        rows += render_monthly_row(s, has_baseline, month_names);
        sum_consumption_kwh += s.consumption;
        sum_net_cost_tariff += s.net_cost;
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
        totals_row += "<td></td>";
    }

    totals_row += "<td></td></tr>";

    $("#monthly-data-body").html(rows + totals_row);
    $("#monthly-data").removeClass("d-none");
}

// Populate the quick tariff selector once, then sync its value.
function populate_quick_tariff() {
    var sel = $("#tariff");
    if (sel.find("option").length === 0) {
        for (var i = 0; i < tariff_options.length; i++) {
            sel.append("<option>" + tariff_options[i] + "</option>");
        }
    }
    sel.val(config.app.tariff.value);
}

// Injects the cost breakdown table + monthly table into the cost view, and
// (re)draws the half-hourly kWh + tariff chart on the shared placeholder.
function render_cost_breakdown() {
    populate_quick_tariff();

    $("#cost_breakdown_body").html(render_flow_table());

    if (Object.keys(monthly_data).length > 1) {
        render_monthly_table(calc_monthly_summaries());
    } else {
        $("#monthly-data").addClass("d-none");
    }

    draw_tariff_graph();
}

// -------------------------------------------------------------------------------
// CHART (Costs mode): half-hourly stacked kWh bars + import/export tariff lines
// -------------------------------------------------------------------------------
function draw_tariff_graph() {
    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    var graph_series = [];

    // The seven disaggregated flows, stacked as positive half-hourly bars.
    tariff_flows.forEach(function(f) {
        if (tariff_data[f.key] && tariff_data[f.key].length) {
            graph_series.push({
                label: f.key, data: tariff_data[f.key], yaxis: 1,
                color: flow_colors[f.key], stack: true, bars: bars
            });
        }
    });

    // Import / export tariff price signals on the right-hand axis.
    if (tariff_data["import_tariff"] && tariff_data["import_tariff"].length) {
        graph_series.push({
            label: config.app.tariff.value, data: tariff_data["import_tariff"], yaxis: 2,
            color: "#fb1a80", lines: { show: true, steps: true, align: "left", lineWidth: 1 }
        });
    }
    if (tariff_data["export_tariff"] && tariff_data["export_tariff"].length) {
        graph_series.push({
            label: "Export", data: tariff_data["export_tariff"], yaxis: 2,
            color: "#941afb", lines: { show: true, steps: true, align: "center", lineWidth: 1 }
        });
    }

    var font_color = "#888";
    var options = {
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end,
                 font: { color: font_color }, reserveSpace: false },
        yaxes: [
            { position: 'left',  font: { color: font_color }, reserveSpace: false },
            { position: 'right', alignTicksWithAxis: 1, font: { color: font_color }, reserveSpace: false }
        ],
        grid: { show: true, color: "#aaa", borderWidth: 0, hoverable: true, clickable: true },
        selection: { mode: "x" },
        legend: { show: false }
    };

    $.plot($('#placeholder'), graph_series, options);
    $(".ajax-loader").hide();
}

// Hover tooltip for the Costs-mode chart: per-flow kWh + priced value, and the
// import/export p/kWh for the hovered half-hour. Uses tooltip() from vis.helper.js.
function tariff_tooltip(item) {
    var itemTime = item.datapoint[0];
    var z = time_to_index_map[itemTime];

    var d = new Date(itemTime);
    var days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var hours = d.getHours();   if (hours < 10) hours = "0" + hours;
    var minutes = d.getMinutes(); if (minutes < 10) minutes = "0" + minutes;

    var text = hours + ":" + minutes + ", " + days[d.getDay()] + " " + months[d.getMonth()] + " " + d.getDate() + "<br>";

    var import_tariff = get_value_at_index(tariff_data["import_tariff"], z);
    var export_tariff = get_value_at_index(tariff_data["export_tariff"], z);

    tariff_flows.forEach(function(f) {
        var kwh = get_value_at_index(tariff_data[f.key], z);
        if (kwh != null && kwh > 0) {
            text += f.str + ": " + kwh.toFixed(3) + " kWh";
            // export_tariff is stored inverted; negate so "gained" reads positive.
            var rate_val = f.rate === "tariff" ? import_tariff : (export_tariff == null ? null : export_tariff * -1);
            if (rate_val != null) text += " (" + (kwh * rate_val).toFixed(2) + "p " + f.label + ")<br>";
            else text += "<br>";
        }
    });

    text += "<br>";
    if (import_tariff != null) {
        text += "<span style='color:#fb1a80'>&#x25CF;</span> Import: " + import_tariff.toFixed(2) + " p/kWh (inc VAT)<br>";
    }
    if (export_tariff != null) {
        // export_tariff is stored inverted; present a positive rate.
        text += "<span style='color:#941afb'>&#x25CF;</span> Export: " + (export_tariff * -1).toFixed(2) + " p/kWh (inc VAT)<br>";
    }

    tooltip(item.pageX, item.pageY, text, "#fff", "#000");
}

// -------------------------------------------------------------------------------
// CSV EXPORT
// -------------------------------------------------------------------------------
function datetime_string(time) {
    var t = new Date(time);
    var year = t.getFullYear();
    var month = t.getMonth() + 1; if (month < 10) month = "0" + month;
    var day = t.getDate();        if (day < 10)   day = "0" + day;
    var hours = t.getHours();     if (hours < 10) hours = "0" + hours;
    var minutes = t.getMinutes(); if (minutes < 10) minutes = "0" + minutes;
    var seconds = t.getSeconds(); if (seconds < 10) seconds = "0" + seconds;
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

function download_data(filename, data) {
    var blob = new Blob([data], { type: 'text/csv' });
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

// Export the half-hourly window: time + 7 flow kWh + import/export tariff rates (p/kWh inc VAT).
function download_tariff_csv() {
    var ref_data = tariff_data["grid_to_load"];
    if (!ref_data || !ref_data.length) { alert("No data to export."); return; }

    var flow_keys = tariff_flows.map(function(f) { return f.key; });
    var header = ["time"].concat(flow_keys, ["import_tariff_p_kwh", "export_tariff_p_kwh"]);

    var csv = [header.join(",")];

    for (var z = 0; z < ref_data.length; z++) {
        var line = [datetime_string(ref_data[z][0])];

        flow_keys.forEach(function(key) {
            var v = get_value_at_index(tariff_data[key], z, null);
            line.push(v === null ? "" : v.toFixed(3));
        });

        var import_rate = get_value_at_index(tariff_data["import_tariff"], z, null);
        var export_rate = get_value_at_index(tariff_data["export_tariff"], z, null);
        line.push(import_rate === null ? "" : import_rate.toFixed(3));
        // export_tariff is stored inverted; re-negate to present a positive p/kWh rate.
        line.push(export_rate === null ? "" : (export_rate * -1).toFixed(3));

        csv.push(line.join(","));
    }

    download_data("mysolarpvbattery-tariff-data.csv", csv.join("\n"));
}

// -------------------------------------------------------------------------------
// EVENTS (cost-view controls)
// -------------------------------------------------------------------------------

// Quick tariff selector: persist the choice to config and reload rates only.
$("#tariff").on("change", function() {
    config.app.tariff.value = $("#tariff").val();
    config.db.tariff = config.app.tariff.value;
    config.set();
    load_tariff_analysis(false, true);
});

// Save the current month-by-month costs as a baseline for tariff comparison.
$("#save-baseline").on("click", function() {
    baseline_monthly_summary = JSON.parse(JSON.stringify(monthly_summary));
    baseline_tariff_name = config.app.tariff.value;
    render_cost_breakdown();
});

// Download half-hourly data as CSV.
$("#download-csv").on("click", function() {
    download_tariff_csv();
});

// Zoom the whole view (chart + cost table) to a single month.
$("#monthly-data").on("click", ".zoom-to-month", function() {
    var timestamp = parseInt($(this).attr("timestamp"));
    view.start = timestamp;

    var d = new Date(timestamp);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 0);
    view.end = d.getTime();

    autoupdate = false;
    load_process_draw_graph();
    return false;
});
