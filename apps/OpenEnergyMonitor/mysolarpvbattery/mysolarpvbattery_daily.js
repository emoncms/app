
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
    // Fetch the earliest start_time from grid_to_load
    var m = feed.getmeta(config.app.grid_to_load_kwh.value);
    var earliest_start_time = m.start_time;
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

    // Feed definitions: key -> { guard, feedkey }
    // guard: condition under which this flow feed is applicable to the current mode
    var flow_defs = [
        { key: 'grid_to_load',     guard: true,                              },
        { key: 'solar_to_load',    guard: mode.has_solar,                    },
        { key: 'solar_to_grid',    guard: mode.has_solar,                    },
        { key: 'solar_to_battery', guard: mode.has_solar && mode.has_battery },
        { key: 'battery_to_load',  guard: mode.has_battery,                  },
        { key: 'battery_to_grid',  guard: mode.has_battery,                  },
        { key: 'grid_to_battery',  guard: mode.has_battery,                  }
    ];

    var keys_to_load = [];
    var feedids = [];
    flow_defs.forEach(function(d) {
        if (d.guard && config.app[d.key + "_kwh"] && config.app[d.key + "_kwh"].value) {
            keys_to_load.push(d.key);
            feedids.push(config.app[d.key + "_kwh"].value);
        }
    });
    
    // Load raw daily delta data for each applicable flow
    feed.getdata(feedids, start, end, "daily", 0, 1, 0, 0, function (all_data) {

        // if success false
        if (all_data.success === false) {
            historyseries = [];
            draw_bargraph();
            return;
        }

        var raw = {};
        var idx = 0;
        keys_to_load.forEach(function(key) {
            raw[key] = all_data[idx].data;
            idx++;
        });

        // Per-day arrays for graph and hover access (global so bargraph_events can read them)
        kwhd_data = {};
        flow_defs.forEach(function(d) { kwhd_data[d.key] = []; });

        for (var day = 0; day < raw['grid_to_load'].length; day++) {
            var time = raw['grid_to_load'][day][0];

            // Only skip days where both reference feeds are null
            // var required_ok = (raw['grid_to_load'][day]  && raw['grid_to_load'][day][1]  !== null) ||
            //                   (raw['solar_to_load'][day] && raw['solar_to_load'][day][1] !== null);
            // if (!required_ok) continue;

            flow_defs.forEach(function(d) {
                kwhd_data[d.key].push([time, kwhd_val(raw[d.key], day)]);
            });
        }

        // Series definitions: label, color, stack (1=positive/load, 0=negative/export)
        var series_defs = [
            // Stack 1: onsite use breakdown (positive bars above zero)
            { key: 'solar_to_load',    label: "Solar to Load",    color: flow_colors["solar_to_load"],    stack: 1, invert: false },
            { key: 'battery_to_load',  label: "Battery to Load",  color: flow_colors["battery_to_load"],  stack: 1, invert: false },
            { key: 'grid_to_load',     label: "Grid to Load",     color: flow_colors["grid_to_load"],     stack: 1, invert: false },
            // Stack 0: exports (negative bars below zero)
            { key: 'solar_to_grid',    label: "Solar to Grid",    color: flow_colors["solar_to_grid"],    stack: 0, invert: true  },
            { key: 'battery_to_grid',  label: "Battery to Grid",  color: flow_colors["battery_to_grid"],  stack: 0, invert: true  }
        ];

        historyseries = [];
        
        series_defs.forEach(function(def) {
            var data = kwhd_data[def.key];
            if (!data.length) return;
            historyseries.push({
                data:  def.invert ? invert_kwhd_data(data) : data,
                label: def.label,
                color: def.color,
                bars:  { show: true, align: "center", barWidth: 0.8 * 3600 * 24 * 1000, fill: 0.9, lineWidth: 0 },
                stack: def.stack
            });
        });

        draw_bargraph();

    }, false);
}

// Invert kWh/d data for export flows so they appear as negative bars on the graph
function invert_kwhd_data(data) {
    var neg_data = [];
    for (var i = 0; i < data.length; i++) {
        neg_data.push([data[i][0], -1 * data[i][1]]);
    }
    return neg_data;
}

// kwhd_val: safely read a daily kWh value from a feed data array.
// Returns 0 when the entry or its value is null/undefined.
function kwhd_val(arr, idx) {
    if (arr === null || arr === undefined) return 0;
    if (arr[idx] === undefined) return 0;

    return (arr[idx] && arr[idx][1] !== null) ? arr[idx][1] : 0;
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
        grid: { hoverable: true, clickable: true, markings: markings, borderWidth: 0 },
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
    $(".visnav[time=1], .visnav[time=3], .visnav[time=6], .visnav[time=24]").hide();
            
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
            updateStats({
                solar_to_load:    kwhd_val(kwhd_data['solar_to_load'], z),
                solar_to_grid:    kwhd_val(kwhd_data['solar_to_grid'], z),
                solar_to_battery: kwhd_val(kwhd_data['solar_to_battery'], z),
                battery_to_load:  kwhd_val(kwhd_data['battery_to_load'], z),
                battery_to_grid:  kwhd_val(kwhd_data['battery_to_grid'], z),
                grid_to_load:     kwhd_val(kwhd_data['grid_to_load'], z),
                grid_to_battery:  kwhd_val(kwhd_data['grid_to_battery'], z)
            });
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
            var ref_day_data = kwhd_data['grid_to_load'].length ? kwhd_data['grid_to_load'] : kwhd_data['solar_to_load'];
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