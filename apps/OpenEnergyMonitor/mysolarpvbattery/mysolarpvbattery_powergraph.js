// -------------------------------------------------------------------------------------------------------
// MySolarPVBattery Power Graph: load, process, and draw the power flow graph
// -------------------------------------------------------------------------------------------------------
var data_mode = "power"; // or "kwh" when processing pre-aggregated kWh data for the bar graph

// Fetch raw feed data for the current view window. Only requests feeds that are
// actually configured; any missing feeds will be derived later in processing.
// On success, loads each feed into the timeseries store     then triggers processing.
function load_process_draw_power_graph() {
    view.calc_interval(1500); // npoints = 1500;

    // If timewindow is more than 7 days switch to kWh mode which uses pre-aggregated data to improve accuracy.
    data_mode = ((view.end - view.start) > 3600000*24*7 && check_history_feeds(get_mode())) ? "kwh" : "power";

    var feeds;
    if (data_mode == "power") {
        feeds = [
            { key: "solar",            kwh: false, cond: available.solar,                      avg: 1, delta: 0 },
            { key: "use",              kwh: false, cond: available.use,                        avg: 1, delta: 0 },
            { key: "battery",          kwh: false, cond: available.battery,                    avg: 1, delta: 0 },
            { key: "grid",             kwh: false, cond: available.grid,                       avg: 1, delta: 0 },
            { key: "battery_soc",      kwh: false, cond: battery_soc_available,                avg: 0, delta: 0 },
        ].filter(f => f.cond);

    } else {
        // Snap interval up to nearest 15-minute boundary (min 900s) to avoid excessive nulls
        view.interval = Math.ceil(Math.max(view.interval, 900) / 900) * 900;
        // Align view start and end to interval boundaries
        view.start = Math.floor(view.start / (view.interval*1000)) * (view.interval*1000);
        view.end   = Math.ceil(view.end   / (view.interval*1000)) * (view.interval*1000);

        feeds = [
            { key: "grid_to_load",     kwh: true,  cond: true,                                 avg: 0, delta: 1 },
            { key: "solar_to_load",    kwh: true,  cond: available.solar,                      avg: 0, delta: 1 },
            { key: "solar_to_grid",    kwh: true,  cond: available.solar,                      avg: 0, delta: 1 },
            { key: "solar_to_battery", kwh: true,  cond: available.solar && available.battery, avg: 0, delta: 1 },
            { key: "battery_to_load",  kwh: true,  cond: available.battery,                    avg: 0, delta: 1 },
            { key: "battery_to_grid",  kwh: true,  cond: available.battery,                    avg: 0, delta: 1 },
            { key: "grid_to_battery",  kwh: true,  cond: available.battery,                    avg: 0, delta: 1 },
            { key: "battery_soc",      kwh: false, cond: battery_soc_available,                avg: 0, delta: 0 }
        ].filter(f => f.cond);

        kwh_data = {};
    }

    // Build parallel arrays of feed request parameters from the filtered feed list
    var loaded = feeds.filter(function(d) {
        var cfgKey = d.kwh ? d.key + "_kwh" : d.key;
        return config.app[cfgKey] && config.app[cfgKey].value;
    });
    var keys_to_load = loaded.map(d => d.key);
    var feedids      = loaded.map(d => config.app[d.kwh ? d.key + "_kwh" : d.key].value);
    var averages     = loaded.map(d => d.avg);
    var deltas       = loaded.map(d => d.delta);

    feed.getdata(feedids, view.start, view.end, view.interval, averages.join(","), deltas.join(","), 0, 0, function (all_data) {

        if (data_mode == "power") {
            if (all_data.success === false) {
                feeds.forEach(f => timeseries.load(f.key, []));
            } else {
                feeds.forEach((f, idx) => timeseries.load(f.key, remove_null_values(all_data[idx].data, view.interval)));
            }
        } else {
            if (all_data.success === false) {
                keys_to_load.forEach(key => { kwh_data[key] = []; });
            } else {
                keys_to_load.forEach((key, idx) => { kwh_data[key] = all_data[idx].data; });
            }
        }
        process_and_draw_power_graph(data_mode);

    }, false, "notime");
}

// Iterates over the loaded timeseries data, derives any missing power flows using
// flow_derive_missing / flow_calculation, accumulates kWh totals for the stats
// panel, builds the flot series arrays, and then calls draw_powergraph().
function process_and_draw_power_graph(process_mode = "power") {

    var flows = [
        { key: "solar_to_load",    label: "Solar to Load",    fill: 0.8 },
        { key: "solar_to_battery", label: "Solar to Battery", fill: 0.8 },
        { key: "solar_to_grid",    label: "Solar to Grid",    fill: 1.0 },
        { key: "battery_to_load",  label: "Battery to Load",  fill: 0.8 },
        { key: "battery_to_grid",  label: "Battery to Grid",  fill: 0.8 },
        { key: "grid_to_load",     label: "Grid to Load",     fill: 0.8 },
        { key: "grid_to_battery",  label: "Grid to Battery",  fill: 0.8 }
    ];

    var totals = Object.fromEntries(flows.map(f => [f.key, 0]));
    var data   = Object.fromEntries(flows.map(f => [f.key, []]));

    if (process_mode == "power") {
        // Determine which feed we use as the time axis reference (any loaded feed will do)
        var ts_ref = ["use", "grid", "solar", "battery"].find(key => available[key]) || false;
        console.log("Time reference feed: " + ts_ref);
        var datastart = timeseries.start_time(ts_ref);
        var interval = view.interval;
        var power_to_kwh = interval / 3600000.0; 

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

                // Accumulate kWh totals and build graph data arrays
                flows.forEach(f => {
                    totals[f.key] += flow[f.key] * power_to_kwh;
                    data[f.key].push([time, flow[f.key]]);
                });
            }
        }
    } else if (process_mode == "kwh") {
        // If we're processing pre-aggregated kWh data then we just need to sum totals and convert from kwh to power for the graph
        flows.forEach(flow => {
            totals[flow.key] = kwh_sum(kwh_data[flow.key]);
            data[flow.key]   = kwh_to_power(kwh_data[flow.key], view.interval);
        });
    }

    // Update stats boxes with totals.
    updateStats(totals);
    // Build graph series in correct order.
    powerseries = flows.map(flow => ({
        data: data[flow.key], label: flow.label, color: flow_colors[flow.key],
        stack: 1, lines: { lineWidth: 0, fill: flow.fill }
    }));

    // Calculate battery SOC change over the period and display in stats box.
    // Add SOC line to graph (only if time range is <=1 month to avoid clutter).
    if (battery_soc_available) {
        var battery_soc_data = process_mode == "power" ? timeseries.data("battery_soc") : kwh_data.battery_soc;
        var battery_soc_start = null;
        var battery_soc_end = null;

        for (var z = 0; z < battery_soc_data.length; z++) {
            var v = battery_soc_data[z][1];
            if (v !== null) {
                if (battery_soc_start === null) battery_soc_start = v;
                battery_soc_end = v;
            }
        }

        var soc_change = battery_soc_end - battery_soc_start;
        $(".battery_soc_change").html((soc_change >= 0 ? "+" : "") + soc_change.toFixed(1));

        // only add if time period is less or equal to 1 month
        if ((view.end - view.start) <= 3600000*24*32) {
            powerseries.push({ data: battery_soc_data, label: "SOC", yaxis: 2, color: "#888" });
        }

    } else {
        $(".battery_soc_change").html("");
    }

    draw_powergraph();
}

// Renders the power-flow stacked area chart (and optional SOC line) using flot,
// fitted to the current view.start / view.end time range.
function draw_powergraph() {

    var options = {
        lines: { fill: false },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
        yaxes: [{ min: 0, reserveSpace: false },{ min: 0, max: 100, reserveSpace: false }],
        grid: { hoverable: true, clickable: true, borderWidth: 0 },
        selection: { mode: "x" },
        legend: { show: false }
    }
    
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    $.plot($('#placeholder'),powerseries,options);
    $(".ajax-loader").hide();
}

// Remove null gaps shorter than 15 minutes by forward-filling from the last
// known good value. Longer gaps are left as null so the graph shows a break.
// Forward-fills null gaps that are shorter than 15 minutes so the graph
// doesn't show false breaks for brief outages. Longer gaps remain null.
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

function kwh_sum(data) {
    let sum = 0;
    for (let i=0; i<data.length; i++) {
        if (data[i][1] != null) {
            sum += data[i][1];
        }
    }
    return sum;
}

function kwh_to_power(data, interval) {
    let power_data = [];
    for (let i=0; i<data.length; i++) {
        power_data.push([data[i][0], data[i][1] * 3600000 / interval]);
    }
    return power_data;
}

// Binds flot interaction events (hover tooltip, drag-to-zoom selection) to the
// chart placeholder. Safe to call on every redraw — unbinds before rebinding.
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

// Builds and positions the hover tooltip. Each entry in `values` is
// [label, value, units, swatchColor?]. Creates the tooltip element on first call.
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

// Hides the hover tooltip when the cursor moves off a data point.
function hide_tooltip() {
    $('#tooltip').hide();
}