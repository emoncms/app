// -------------------------------------------------------------------------------------------------------
// MySolarPVBattery Power Graph: load, process, and draw the power flow graph
// -------------------------------------------------------------------------------------------------------

// Fetch raw feed data for the current view window. Only requests feeds that are
// actually configured; any missing feeds will be derived later in processing.
// On success, loads each feed into the timeseries store     then triggers processing.
function load_process_draw_power_graph() {
    view.calc_interval(1500); // npoints = 1500;

    var feeds = [
        { key: "solar",       cond: available.solar,       avg: 1 },
        { key: "use",         cond: available.use,         avg: 1 },
        { key: "battery",     cond: available.battery,     avg: 1 },
        { key: "grid",        cond: available.grid,        avg: 1 },
        { key: "battery_soc", cond: battery_soc_available, avg: 0 },
    ].filter(f => f.cond);

    var feedids  = feeds.map(f => config.app[f.key].value);
    var averages = feeds.map(f => f.avg);
    var deltas   = feeds.map(() => 0);

    feed.getdata(feedids, view.start, view.end, view.interval, averages.join(","), deltas.join(","), 0, 0, function (all_data) {
        if (all_data.success === false) {
            feeds.forEach(f => timeseries.load(f.key, []));
        } else {
            feeds.forEach((f, idx) => timeseries.load(f.key, remove_null_values(all_data[idx].data, view.interval)));
            console.log("Data loaded for feeds: " + feeds.map(f => f.key).join(", "));
        }
        process_and_draw_power_graph();
    }, false, "notime");
}

// Iterates over the loaded timeseries data, derives any missing power flows using
// flow_derive_missing / flow_calculation, accumulates kWh totals for the stats
// panel, builds the flot series arrays, and then calls draw_powergraph().
function process_and_draw_power_graph() {

    // -------------------------------------------------------------------------------------------------------

    // Determine which feed we use as the time axis reference (any loaded feed will do)
    var ts_ref = ["use", "grid", "solar", "battery"].find(key => available[key]) || false;
    console.log("Time reference feed: " + ts_ref);
    
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
    
    powerseries = [];
    powerseries.push({data: solar_to_load_data,    label: "Solar to Load",    color: flow_colors["solar_to_load"],    stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: solar_to_battery_data, label: "Solar to Battery", color: flow_colors["solar_to_battery"], stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: solar_to_grid_data,    label: "Solar to Grid",    color: flow_colors["solar_to_grid"],    stack: 1, lines: {lineWidth: 0, fill: 1.0}});
    powerseries.push({data: battery_to_load_data,  label: "Battery to Load",  color: flow_colors["battery_to_load"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: battery_to_grid_data,  label: "Battery to Grid",  color: flow_colors["battery_to_grid"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_load_data,     label: "Grid to Load",     color: flow_colors["grid_to_load"],     stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_battery_data,  label: "Grid to Battery",  color: flow_colors["grid_to_battery"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});


    // Calculate battery SOC change over the period and display in stats box. 
    // Add SOC line to graph (only if time range is <=1 month to avoid clutter).
    let battery_soc_now = null;
    var battery_soc_start = null;
    var battery_soc_end = null;

    if (battery_soc_available) {
        var battery_soc_data = timeseries.data("battery_soc");
        for (var z=0; z<battery_soc_data.length; z++) {
            battery_soc_now = battery_soc_data[z][1];
            if (battery_soc_start === null && battery_soc_now !== null) {
                battery_soc_start = battery_soc_now;
            }
            if (battery_soc_now !== null) {
                battery_soc_end = battery_soc_now;
            }
        }

        var soc_change = battery_soc_end-battery_soc_start;
        var sign = ""; if (soc_change>=0) sign = "+";
        $(".battery_soc_change").html(sign+soc_change.toFixed(1));

        // only add if time period is less or equall to 1 month
        if ((view.end - view.start) <= 3600000*24*32) {
            powerseries.push({data:battery_soc_data, label: "SOC", yaxis:2, color: "#888"});
        }

    } else {
        $(".battery_soc_change").html("");
    }

    draw_powergraph();
}


function load_process_draw_power_graph_kwh_version() {
    view.calc_interval(1500); // npoints = 1500;

    // min interval of 15 minutes to avoid excessive nulls and flot performance issues
    if (view.interval < 900) view.interval = 900;
    // interval should be multiple of 900
    if (view.interval % 900 !== 0) {
        view.interval = Math.ceil(view.interval / 900) * 900;
    }
    // Align view start and end to interval boundaries
    view.start = Math.floor(view.start / (view.interval*1000)) * (view.interval*1000);
    view.end = Math.ceil(view.end / (view.interval*1000)) * (view.interval*1000);

    var feeds = [
        { key: "grid_to_load",     cond: true,                                 delta: 1 },
        { key: "solar_to_load",    cond: available.solar,                      delta: 1 },
        { key: "solar_to_grid",    cond: available.solar,                      delta: 1 },
        { key: "solar_to_battery", cond: available.solar && available.battery, delta: 1 },
        { key: "battery_to_load",  cond: available.battery,                    delta: 1 },
        { key: "battery_to_grid",  cond: available.battery,                    delta: 1 },
        { key: "grid_to_battery",  cond: available.battery,                    delta: 1 },
        { key: "battery_soc",      cond: battery_soc_available,                delta: 0 }
    ].filter(f => f.cond);

    var keys_to_load = [];
    var feedids  = [];
    var averages = [];
    var deltas   = [];
    
    feeds.forEach(function(d) {
        let key = d.key;
        if (key != "battery_soc") key += "_kwh";

        if (d.cond && config.app[key] && config.app[key].value) {
            keys_to_load.push(d.key);
            feedids.push(config.app[key].value);
            averages.push(0);
            deltas.push(d.delta);
        }
    });

    kwh_data = {};

    feed.getdata(feedids, view.start, view.end, view.interval, averages.join(","), deltas.join(","), 0, 0, function (all_data) {
        if (all_data.success === false) {
            keys_to_load.forEach(function(key) {
                kwh_data[key] = [];
            });
            
        } else {
            var idx = 0;
            keys_to_load.forEach(function(key) {
                kwh_data[key] = all_data[idx].data;
                idx++;
            });
        }
        process_and_draw_power_graph();
    }, false, "notime");
}

function process_and_draw_power_graph_kwh_version() {
    
    // Update stats boxes with totals for each flow, Sum kWh data.and ratios derived from the flow decomposition
    updateStats({
        solar_to_load:    kwh_sum(kwh_data.solar_to_load),
        solar_to_grid:    kwh_sum(kwh_data.solar_to_grid),
        solar_to_battery: kwh_sum(kwh_data.solar_to_battery),
        battery_to_load:  kwh_sum(kwh_data.battery_to_load),
        battery_to_grid:  kwh_sum(kwh_data.battery_to_grid),
        grid_to_load:     kwh_sum(kwh_data.grid_to_load),
        grid_to_battery:  kwh_sum(kwh_data.grid_to_battery)
    });
    
    powerseries = [];
    powerseries.push({data: kwh_to_power(kwh_data.solar_to_load,    view.interval), label: "Solar to Load",    color: flow_colors["solar_to_load"],    stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: kwh_to_power(kwh_data.solar_to_battery, view.interval), label: "Solar to Battery", color: flow_colors["solar_to_battery"], stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: kwh_to_power(kwh_data.solar_to_grid,    view.interval), label: "Solar to Grid",    color: flow_colors["solar_to_grid"],    stack: 1, lines: {lineWidth: 0, fill: 1.0}});
    powerseries.push({data: kwh_to_power(kwh_data.battery_to_load,  view.interval), label: "Battery to Load",  color: flow_colors["battery_to_load"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: kwh_to_power(kwh_data.battery_to_grid,  view.interval), label: "Battery to Grid",  color: flow_colors["battery_to_grid"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: kwh_to_power(kwh_data.grid_to_load,     view.interval), label: "Grid to Load",     color: flow_colors["grid_to_load"],     stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: kwh_to_power(kwh_data.grid_to_battery,  view.interval), label: "Grid to Battery",  color: flow_colors["grid_to_battery"],  stack: 1, lines: {lineWidth: 0, fill: 0.8}});


    // Calculate battery SOC change over the period and display in stats box. 
    // Add SOC line to graph (only if time range is <=1 month to avoid clutter).
    let battery_soc_now = null;
    var battery_soc_start = null;
    var battery_soc_end = null;

    if (battery_soc_available) {
        for (var z=0; z<kwh_data.battery_soc.length; z++) {
            battery_soc_now = kwh_data.battery_soc[z][1];
            if (battery_soc_start === null && battery_soc_now !== null) {
                battery_soc_start = battery_soc_now;
            }
            if (battery_soc_now !== null) {
                battery_soc_end = battery_soc_now;
            }
        }

        var soc_change = battery_soc_end-battery_soc_start;
        var sign = ""; if (soc_change>=0) sign = "+";
        $(".battery_soc_change").html(sign+soc_change.toFixed(1));

        // only add if time period is less or equall to 1 month
        if ((view.end - view.start) <= 3600000*24*32) {
            powerseries.push({data:kwh_data.battery_soc, label: "SOC", yaxis:2, color: "#888"});
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