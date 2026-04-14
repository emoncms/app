// -------------------------------------------------------------------------------------------------------
// MySolarPVBattery Power Graph: load, process, and draw the power flow graph
// -------------------------------------------------------------------------------------------------------
let data_mode = "power"; // or "kwh" when processing pre-aggregated kWh data for the bar graph

// Fetch raw feed data for the current view window. Only requests feeds that are
// actually configured; any missing feeds will be derived later in processing.
// On success, loads each feed into the timeseries store     then triggers processing.
function load_process_draw_graph() {
    view.calc_interval(1500); // npoints = 1500;

    // If timewindow is more than 7 days switch to kWh mode which uses pre-aggregated data to improve accuracy.
    data_mode = ((view.end - view.start) > 3600000*24*7 && check_history_feeds(get_mode())) ? "kwh" : "power";
    if (viewmode == "bargraph") data_mode = "kwh"; // bar graph only works with pre-aggregated kWh data

    let battery_soc_enabled = (battery_soc_available && viewmode !== "bargraph");

    let feeds;
    if (data_mode == "power") {
        feeds = [
            { key: "solar",            kwh: false, cond: available.solar,                      avg: 1, delta: 0 },
            { key: "use",              kwh: false, cond: available.use,                        avg: 1, delta: 0 },
            { key: "battery",          kwh: false, cond: available.battery,                    avg: 1, delta: 0 },
            { key: "grid",             kwh: false, cond: available.grid,                       avg: 1, delta: 0 },
            { key: "battery_soc",      kwh: false, cond: battery_soc_enabled,                avg: 0, delta: 0 },
        ].filter(f => f.cond);

    } else {
        // Snap interval up to nearest 15-minute boundary (min 900s) to avoid excessive nulls
        view.interval = Math.ceil(Math.max(view.interval, 900) / 900) * 900;

        if (viewmode == "bargraph") {
            view.interval = 3600*24; // override to daily for bar graph
        }

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
            { key: "battery_soc",      kwh: false, cond: battery_soc_enabled,                avg: 0, delta: 0 }
        ].filter(f => f.cond);

        kwh_data = {};
    }

    // Build parallel arrays of feed request parameters from the filtered feed list
    const loaded = feeds.filter(function(d) {
        const cfgKey = d.kwh ? d.key + "_kwh" : d.key;
        return config.app[cfgKey] && config.app[cfgKey].value;
    });
    const keys_to_load = loaded.map(d => d.key);
    const feedids      = loaded.map(d => config.app[d.kwh ? d.key + "_kwh" : d.key].value);
    const averages     = loaded.map(d => d.avg);
    const deltas       = loaded.map(d => d.delta);

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
        process_and_draw_graph();

    }, false, "notime");
}

// Iterates over the loaded timeseries data, derives any missing power flows using
// flow_derive_missing / flow_calculation, accumulates kWh totals for the stats
// panel, builds the flot series arrays, and then calls draw_graph().
function process_and_draw_graph() {

    const flows = [
        { key: "solar_to_load",    label: "Solar to Load",    fill: 0.8, export: false },
        { key: "solar_to_battery", label: "Solar to Battery", fill: 0.8, export: false },
        { key: "solar_to_grid",    label: "Solar to Grid",    fill: 1.0, export: true  },
        { key: "battery_to_load",  label: "Battery to Load",  fill: 0.8, export: false },
        { key: "battery_to_grid",  label: "Battery to Grid",  fill: 0.8, export: true  },
        { key: "grid_to_load",     label: "Grid to Load",     fill: 0.8, export: false },
        { key: "grid_to_battery",  label: "Grid to Battery",  fill: 0.8, export: false }
    ];

    const totals = Object.fromEntries(flows.map(f => [f.key, 0]));
    const data   = Object.fromEntries(flows.map(f => [f.key, []]));

    if (data_mode == "power") {
        // Determine which feed we use as the time axis reference (any loaded feed will do)
        const ts_ref = ["use", "grid", "solar", "battery"].find(key => available[key]) || false;
        console.log("Time reference feed: " + ts_ref);
        const datastart = timeseries.start_time(ts_ref);
        const interval = view.interval;
        const power_to_kwh = interval / 3600000.0; 

        for (let z=0; z<timeseries.length(ts_ref); z++) {
            const time = datastart + (1000 * interval * z);
            
            let input = {
                solar: available.solar ? timeseries.value("solar",z) : null,
                use: available.use ? timeseries.value("use",z) : null,
                battery: available.battery ? timeseries.value("battery",z) : null,
                grid: available.grid ? timeseries.value("grid",z) : null
            }

            input = flow_derive_missing(input);

            if (input.solar !== null || input.use !== null || input.battery !== null || input.grid !== null) {

                const flow = flow_calculation(input);

                // Accumulate kWh totals and build graph data arrays
                flows.forEach(f => {
                    totals[f.key] += flow[f.key] * power_to_kwh;
                    data[f.key].push([time, flow[f.key]]);
                });
            }
        }
    } else if (data_mode == "kwh") {
        // If we're processing pre-aggregated kWh data then we just need to sum totals and convert from kwh to power for the graph
        flows.forEach(flow => {
            if (kwh_data[flow.key] == undefined) {
                kwh_data[flow.key] = [];
            }
            totals[flow.key] = kwh_sum(kwh_data[flow.key]);
            if (viewmode == "powergraph") {
                data[flow.key]   = kwh_to_power(kwh_data[flow.key], view.interval);
            } else {
                data[flow.key]   = kwh_data[flow.key];
            }
        });
    }

    // Update stats boxes with totals.
    updateStats(totals);

    // Build graph series in correct order.
    powerseries = [];
    for (let i=0; i<flows.length; i++) {

        // skip if data is empty
        if (data[flows[i].key].length == 0) continue;

        let stack = 1;
        if (viewmode == "bargraph" && flows[i].export) {
            // invert export flows so they appear as negative bars on the graph
            data[flows[i].key] = invert_kwhd_data(data[flows[i].key]);
            stack = 0; // don't stack so they appear below the x-axis rather than offset
        }

        const series = {
            data: data[flows[i].key], label: flows[i].label, color: flow_colors[flows[i].key],
            stack: stack, lines: { lineWidth: 0, fill: flows[i].fill }, export: flows[i].export
        };
        if (viewmode == "bargraph") {
            series.lines = { show: false };
            series.bars = { show: true, align: "center", barWidth: 0.8 * 3600 * 24 * 1000, fill: flows[i].fill, lineWidth: 0 };
        }
        powerseries.push(series);
    }

    // Calculate battery SOC change over the period and display in stats box.
    // Add SOC line to graph (only if time range is <=1 month to avoid clutter).
    if (battery_soc_available && viewmode !== "bargraph") {
        const battery_soc_data = data_mode == "power" ? timeseries.data("battery_soc") : kwh_data.battery_soc;
        let battery_soc_start = null;
        let battery_soc_end = null;

        for (let z = 0; z < battery_soc_data.length; z++) {
            const v = battery_soc_data[z][1];
            if (v !== null) {
                if (battery_soc_start === null) battery_soc_start = v;
                battery_soc_end = v;
            }
        }

        const soc_change = battery_soc_end - battery_soc_start;
        $(".battery_soc_change").html((soc_change >= 0 ? "+" : "") + soc_change.toFixed(1));

        // only add if time period is less or equal to 1 month
        if ((view.end - view.start) <= 3600000*24*32) {
            powerseries.push({ data: battery_soc_data, label: "SOC", yaxis: 2, color: "#888" });
        }

    } else {
        $(".battery_soc_change").html("");
    }

    draw_graph();
}

// Renders the power-flow stacked area chart (and optional SOC line) using flot,
// fitted to the current view.start / view.end time range.
function draw_graph() {

    $(".visnav[time=1], .visnav[time=3], .visnav[time=6], .visnav[time=24]").toggle(viewmode !== "bargraph");

    const font_color = "#888";
    const options = {
        lines: { fill: false },
        xaxis: { 
            mode: "time", timezone: "browser", min: view.start, max: view.end,
            font: { color: font_color }  // tick label text color
        },
        grid: { hoverable: true, clickable: true, borderWidth: 0 },
        selection: { mode: "x" },
        legend: { show: false }
    }

    if (viewmode == "powergraph") {
        options.yaxes = [
            { min: 0, reserveSpace: false, font: { color: font_color } },
            { min: 0, max: 100, reserveSpace: false, font: { color: font_color } }
        ];
    } else {
        options.yaxis = { font: { color: font_color } };
    }

    if (viewmode == "bargraph") {
        options.xaxis.minTickSize = [1, "day"];
        options.grid.markings = [{ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } }];
    }
    
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    $.plot($('#placeholder'),powerseries,options);

    if (viewmode == "bargraph") {
        $('#placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Onsite Use &amp; Total Use</div>");
        $('#placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Total export (solar + battery to grid)</div>");
    }

    $(".ajax-loader").hide();

    const mode_label = data_mode === "kwh" ? "E" : "P";
    const auto_label = (autoupdate) ? "AUTO | " : "";
    $("#data-mode-indicator").text(auto_label + mode_label);
    // set title
    let indicator_title = (autoupdate) ? "Auto-updating " : "";
    indicator_title += (data_mode === "kwh") ? "From energy data" : "From power data";
    $("#data-mode-indicator").attr("title", indicator_title);
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
function graph_events() {
    bind_hover_tooltip();
    bind_zoom_selection();
    bind_bar_click();
}

function bind_hover_tooltip() {
    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            const tooltip_items = [];

            const date = new Date(item.datapoint[0]);
            tooltip_items.push(["TIME", dateFormat(date, 'HH:MM'), ""]);

            for (let i = 0; i < powerseries.length; i++) {
                const series = powerseries[i];
                if (series.data[item.dataIndex]!=undefined && series.data[item.dataIndex][1]!=null) {
                    let value = series.data[item.dataIndex][1];

                    if (viewmode == "bargraph" && series.export) {
                        value = -value; // invert export flows back to positive for display in tooltip
                    }

                    if (series.label.toUpperCase()=="SOC") {
                        tooltip_items.push([series.label.toUpperCase(), value.toFixed(1), "%", series.color]);
                    } else {
                        if (value != 0) {
                            if ( value >= 1000) {
                                tooltip_items.push([series.label.toUpperCase(), (value/1000.0).toFixed(1) , "kW", series.color]);
                            } else {
                                if (viewmode == "powergraph") {
                                    tooltip_items.push([series.label.toUpperCase(), value.toFixed(0), "W", series.color]);
                                } else {
                                    tooltip_items.push([series.label.toUpperCase(), value.toFixed(1), "kWh", series.color]);
                                }
                            }
                        }
                    }
                }
            }
            show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
        } else {
            hide_tooltip();
        }
    });
}

function bind_zoom_selection() {
    $('#placeholder').bind("plotselected", function (event, ranges) {
        view.start = ranges.xaxis.from;
        view.end = ranges.xaxis.to;

        autoupdate = false;
        
        const now = +new Date();
        if (viewmode == "powergraph" && Math.abs(view.end-now)<30000) {
            autoupdate = true;
            live_timerange = view.end - view.start;
        }

        load_process_draw_graph();
    });
}

function bind_bar_click() {
    // Auto click through to power graph
    $('#placeholder').bind("plotclick", function (event, pos, item)
    {
        if (viewmode == "powergraph") return; // disable click when already in powergraph mode

        if (item && !panning) {
            const z = item.dataIndex;
            
            history_start = view.start;
            history_end = view.end;

            if (kwh_data['grid_to_load'] == undefined) return;
            // Use whichever per-day data array has data
            const ref_day_data = kwh_data['grid_to_load'].length ? kwh_data['grid_to_load'] : kwh_data['solar_to_load'];
            view.start = ref_day_data[z][0];
            view.end = view.start + 86400*1000;

            $(".viewhistory").toggleClass('active');
            
            autoupdate = false;
            viewmode = "powergraph";

            // cache the daily kWh data
            kwhd_cache = JSON.parse(JSON.stringify(kwh_data));
            
            load_process_draw_graph();
        }
    });
}

// Builds and positions the hover tooltip. Each entry in `values` is
// [label, value, units, swatchColor?]. Creates the tooltip element on first call.
function show_tooltip(x, y, values) {
    let tooltip = $('#tooltip');
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
    const table = $('<table/>').appendTo(tooltip);

    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const row = $('<tr class="tooltip-item"/>').appendTo(table);
        const swatch = value[3] ? '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+value[3]+';margin-right:6px"></span>' : '';
        $('<td style="padding-right: 8px">'+swatch+'<span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    }

    tooltip.css({ left: x, top: y }).show();

    // Flip to the left of the cursor if the tooltip would overflow the chart's right edge
    const placeholder = $('#placeholder');
    const chartRight = placeholder.offset().left + placeholder.outerWidth();
    if (x + tooltip.outerWidth() > chartRight) {
        tooltip.css({ left: x - tooltip.outerWidth() - 20 });
    }
}

// Hides the hover tooltip when the cursor moves off a data point.
function hide_tooltip() {
    $('#tooltip').hide();
}

// Invert kWh/d data for export flows so they appear as negative bars on the graph
function invert_kwhd_data(data) {
    const neg_data = [];
    for (let i = 0; i < data.length; i++) {
        neg_data.push([data[i][0], -1 * data[i][1]]);
    }
    return neg_data;
}