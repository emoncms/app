var powergraph_series = [];

var inst_cop_min = 2;
var inst_cop_max = 6;
var inst_cop_mv_av_dp = 0;

var kw_at_50 = 0;
var kw_at_50_for_volume = 0;


function powergraph_load() {
    var skipmissing = 0;
    var limitinterval = 0;

    view.calc_interval(1200);

    powergraph_series = {};

    // Index order is important here!
    var feeds_to_load = {
        "heatpump_dhw": { label: "DHW", yaxis: 4, color: "#88F", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "heatpump_ch": { label: "CH", yaxis: 4, color: "#FB6", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "heatpump_cooling": { label: "Cooling", yaxis: 4, color: "#66b0ff", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "heatpump_error": { label: "Error", yaxis: 4, color: "#F00", lines: { lineWidth: 0, show: true, fill: 0.15 } },
        "heatpump_targetT": { label: "TargetT", yaxis: 2, color: "#ccc" },
        "heatpump_flowT": { label: "FlowT", yaxis: 2, color: 2 },
        "heatpump_returnT": { label: "ReturnT", yaxis: 2, color: 3 },
        "heatpump_outsideT": { label: "OutsideT", yaxis: 2, color: "#c880ff" },
        "heatpump_roomT": { label: "RoomT", yaxis: 2, color: "#000" },
        "heatpump_flowrate": { label: "Flow rate", yaxis: 3, color: 6 },
        "heatpump_heat": { label: "Heat", yaxis: 1, color: 0, lines: { show: true, fill: 0.2, lineWidth: 0.5 } },
        "heatpump_elec": { label: "Electric", yaxis: 1, color: 1, lines: { show: true, fill: 0.3, lineWidth: 0.5 } },
        "immersion_elec": { label: "Immersion", yaxis: 1, color: 4, lines: { show: true, fill: 0.3, lineWidth: 0.5 } }
    }

    // Compile list of feedids
    var feedids = [];
    for (var key in feeds_to_load) {
        if (feeds[key] != undefined) feedids.push(feeds[key].id);
    }

    // If heatpump_cooling present 
    if (feeds["heatpump_cooling"] != undefined) {
        show_cooling = true;
        $(".show_stats_category[key='cooling']").show();
    }

    var average = 1;
    if (view.interval < 20) average = 0;

    // Fetch the data
    feed.getdata(feedids, view.start, view.end, view.interval, average, 0, skipmissing, limitinterval, function (all_data) {
        // Transfer from data to all_data by key
        var feed_index = 0;
        for (var key in feeds_to_load) {
            if (feeds[key] != undefined && all_data[feed_index] != undefined) {
                // Data object used for calculations
                data[key] = remove_null_values(all_data[feed_index].data, view.interval);
                feed_index++;

                // Load to powergraph_series (used for drawing the graph)
                let series = feeds_to_load[key];
                series.data = data[key];
                powergraph_series[key] = series;
            }
        }

        if (feeds["heatpump_outsideT"] != undefined) {
            $("#fixed_outside_temperature_bound").hide();
        } else {
            $("#fixed_outside_temperature_bound").show();
        }

        // Process heatpump_targetT data
        // replace null values with the last known value
        var targetT = null;
        for (var z in data["heatpump_targetT"]) {
            if (data["heatpump_targetT"][z][1] != null) {
                targetT = data["heatpump_targetT"][z][1];
            } else {
                data["heatpump_targetT"][z][1] = targetT;
            }
        }

        // Process axioma heat meter error data
        process_error_data();

        if (feeds["heatpump_cooling"] == undefined && config.app.auto_detect_cooling.value) {
            auto_detect_cooling();
        }

        powergraph_process();
    }, false, "notime");
}

// Called from powergraph_load and when changing settings
// This function processes the data and loads it into powergraph_series
function powergraph_process() {
    // process_stats: calculates min, max, mean, total, etc
    process_stats();
    // process immersion
    process_aux();
    // Different approach for cop calculations
    calculate_window_cops();
    // carnor_simulator: calculates carnot heat output
    carnot_simulator();
    // process_inst_cop: calculates instantaneous COP
    process_inst_cop();
    // process_defrosts: calculates defrost energy
    process_defrosts();
    // calculates emitter and volume
    emitter_and_volume_calculator();
    // calculate starts
    compressor_starts();

    // Load powergraph_series into flot
    powergraph_draw();
}

function process_inst_cop() {

    var inst_cop_min = parseFloat($("#inst_cop_min").val());
    var inst_cop_max = parseFloat($("#inst_cop_max").val());

    powergraph_series['inst_cop'] = [];
    data["inst_COP"] = [];

    if (show_instant_cop) {
        if (data["heatpump_elec"] != undefined && data["heatpump_heat"] != undefined) {

            // foreach elec_without_null & heat_without_null find the COP 3 point average

            var np = inst_cop_mv_av_dp;

            for (var z = np; z < data["heatpump_elec"].length - np; z++) {
                var time = data["heatpump_elec"][z][0];

                // Extract values only once
                var elec_values = data["heatpump_elec"].slice(z - np, z + np + 1).map(entry => entry[1]);
                var heat_values = data["heatpump_heat"].slice(z - np, z + np + 1).map(entry => entry[1]);

                // Check for null values
                if (!elec_values.includes(null) && !heat_values.includes(null)) {
                    // Calculate sum directly
                    var elec_sum_inst = elec_values.reduce((sum, value) => sum + value, 0);
                    var heat_sum_inst = heat_values.reduce((sum, value) => sum + value, 0);

                    // Avoid division by zero
                    var cop = elec_sum_inst !== 0 ? heat_sum_inst / elec_sum_inst : null;
                    data["inst_COP"][z] = [time, cop];
                }
            }

            // filter out inst_COP values outside of range
            for (var z in data["inst_COP"]) {
                let inst_COP = data["inst_COP"][z][1];
                if (inst_COP > inst_cop_max) inst_COP = null;
                else if (inst_COP < inst_cop_min) inst_COP = null;
                data["inst_COP"][z][1] = inst_COP;
            }

            powergraph_series['inst_cop'] = { label: "Inst COP", data: data["inst_COP"], yaxis: 3, color: "#44b3e2", lines: { show: true, lineWidth: 2 } };
        }
    }
}

function emitter_and_volume_calculator() {
    $("#system_volume").html("?");
    $("#kW_at_50").html("?");

    if (stats['combined']["heatpump_heat"].mean == null) return false;

    if (!emitter_spec_enable) return false;

    if (stats['combined']["heatpump_flowT"] != undefined && stats['combined']["heatpump_returnT"] != undefined && stats['combined']["heatpump_roomT"] != undefined && stats['combined']['heatpump_heat'] != undefined) {

        if (stats['combined']["heatpump_flowT"].diff > 0.15 || stats['combined']["heatpump_returnT"].diff > 0.15) {
            $("#kW_at_50").html("?");

            if (kw_at_50_for_volume) {
                console.log("System volume calculation:");
                let MWT = (stats['combined']["heatpump_flowT"].mean + stats['combined']["heatpump_returnT"].mean) * 0.5;
                let MWT_minus_room = MWT - stats['combined']["heatpump_roomT"].mean;

                let heat_based_on_emitter_spec = kw_at_50_for_volume * 1000 * Math.pow(MWT_minus_room / 50, 1.3)
                let heat_to_system_volume = stats['combined']["heatpump_heat"].mean - heat_based_on_emitter_spec;

                let MWT_start = (stats['combined']["heatpump_flowT"].minval + stats['combined']["heatpump_returnT"].minval) * 0.5;
                let MWT_end = (stats['combined']["heatpump_flowT"].maxval + stats['combined']["heatpump_returnT"].maxval) * 0.5;
                let DT = MWT_end - MWT_start;
                if (DT > 0) {

                    let time_elapsed = (view.end - view.start) * 0.001
                    if (time_elapsed > 0) {
                        let DS_second = DT / time_elapsed;
                        let system_volume = heat_to_system_volume / (4200 * DS_second)

                        console.log("- heat output based on recorded emitter spec: " + heat_based_on_emitter_spec.toFixed(0) + "W");
                        console.log("- heat to system volume: " + heat_to_system_volume.toFixed(0) + "W");
                        console.log("- increase in temperature: " + DT.toFixed(1) + "K");
                        console.log("- increase in temperature per second: " + DS_second.toFixed(6) + "K/s");
                        console.log("- system volume: " + system_volume.toFixed(0) + " litres");
                        $("#system_volume").val(system_volume.toFixed(0));
                    }
                }
            }

        } else {
            let MWT = (stats['combined']["heatpump_flowT"].mean + stats['combined']["heatpump_returnT"].mean) * 0.5;
            let MWT_minus_room = MWT - stats['combined']["heatpump_roomT"].mean;
            kw_at_50 = 0.001 * stats['combined']["heatpump_heat"].mean / Math.pow(MWT_minus_room / 50, 1.3);

            console.log("Radiator spec calculation:");
            console.log("- mean water temperature: " + MWT.toFixed(1) + "C");
            console.log("- MWT - room: " + MWT_minus_room.toFixed(1) + "K");
            console.log("- heat output: " + stats['combined']["heatpump_heat"].mean.toFixed(0) + "W");
            console.log("- kw_at_50: " + kw_at_50.toFixed(1) + " kW");
            $("#kW_at_50").val(kw_at_50.toFixed(1));
        }
    } else {
        $("#kW_at_50").html("?");
    }
}

// -------------------------------------------------------------------------------
// POWER GRAPH
// -------------------------------------------------------------------------------
function powergraph_draw() {
    $("#overlay_text").html("");
    $("#overlay").hide();  
    
    set_url_view_params("power", view.start, view.end);

    var style = { size: flot_font_size, color: "#666" }
    var options = {
        lines: { fill: false },
        xaxis: {
            mode: "time", timezone: "browser",
            min: view.start, max: view.end,
            font: style,
            reserveSpace: false
        },
        yaxes: [
            { min: 0, font: style, reserveSpace: false },
            { font: style, reserveSpace: false },
            { min: 0, font: { size: flot_font_size, color: "#44b3e2" }, reserveSpace: false },
            { min: 0, max: 1, show: false, reserveSpace: false }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: { top: 30 }
        },
        selection: { mode: "x" },
        legend: { position: "NW", noColumns: 13 }
    }

    if (show_defrost_and_loss || show_cooling) {
        options.yaxes[0].min = undefined;
    }

    if ($('#placeholder').width()) {
        // Remove keys
        var powergraph_series_without_key = [];
        for (var key in powergraph_series) {
            let show = true;
            if (key == 'heatpump_flowrate' && !show_flow_rate) show = false;
            if (key == 'immersion_elec' && !show_immersion) show = false;

            if (show) powergraph_series_without_key.push(powergraph_series[key]);
        }
        $.plot($('#placeholder'), powergraph_series_without_key, options);
    }

    // show symbol when live scrolling is active
    var now = new Date().getTime();
    if (view.end > now - 5 * MINUTE && view.end <= now + 5 * MINUTE && view.end - view.start <= 2 * DAY) {
        $('#right').hide();
        $('#live').show();
    }
    else {
        $('#live').hide();
        $('#right').show();
    }
}


function draw_histogram(histogram) {

    var keys = [];
    for (k in histogram) {
        if (histogram.hasOwnProperty(k)) {
            keys.push(k * 1);
        }
    }
    keys.sort();

    var sorted_histogram = []
    for (var z in keys) {
        sorted_histogram.push([keys[z], histogram[keys[z]]])
    }

    var options = {
        // lines: { fill: true },
        bars: { show: true, align: "center", barWidth: (1 / 200) * 0.8, fill: 1.0, lineWidth: 0 },
        xaxis: {
            // mode: "time", timezone: "browser", 
            min: 0.2, max: 0.8,
            font: { size: flot_font_size, color: "#666" },
            reserveSpace: false
        },
        yaxes: [
            //{ min: 0,font: {size:flot_font_size, color:"#666"},reserveSpace:false},
            { font: { size: flot_font_size, color: "#666" }, reserveSpace: false }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: { top: 30 }
        },
        //selection: { mode: "x" },
        legend: { position: "NW", noColumns: 6 }
    }
    if ($('#histogram').width() > 0) {
        $.plot($('#histogram'), [{ data: sorted_histogram }], options);
    }
}

function powergraph_tooltip(item) {

    var itemTime = item.datapoint[0];
    var itemValue = item.datapoint[1];
    var z = item.dataIndex;

    var d = new Date(itemTime);
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var date = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();

    var h = d.getHours();
    if (h < 10) h = "0" + h;
    var m = d.getMinutes();
    if (m < 10) m = "0" + m;
    var time = h + ":" + m;

    var name = "";
    var unit = "";
    var dp = 0;

    if (item.series.label == "FlowT") { name = "FlowT"; unit = "°C"; dp = 1; }
    else if (item.series.label == "ReturnT") { name = "ReturnT"; unit = "°C"; dp = 1; }
    else if (item.series.label == "OutsideT") { name = "Outside"; unit = "°C"; dp = 1; }
    else if (item.series.label == "RoomT") { name = "Room"; unit = "°C"; dp = 1; }
    else if (item.series.label == "TargetT") { name = "Target"; unit = "°C"; dp = 1; }
    else if (item.series.label == "DHW") { name = "Hot Water"; unit = ""; dp = 0; }
    else if (item.series.label == "CH") { name = "Central Heating"; unit = ""; dp = 0; }
    else if (item.series.label == "Cooling") { name = "Cooling"; unit = ""; dp = 0; }
    else if (item.series.label == "Error") { name = "Error"; unit = ""; dp = 0; }
    else if (item.series.label == "Electric") { name = "Elec"; unit = "W"; }
    else if (item.series.label == "Heat") { name = "Heat"; unit = "W"; }
    else if (item.series.label == "Carnot Heat") { name = "Carnot Heat"; unit = "W"; }
    else if (item.series.label == "Simulated flow rate") { name = "Simulated flow rate"; unit = ""; dp = 3; }
    else if (item.series.label == "Inst COP") { name = "Inst COP"; unit = ""; dp = 1; }
    else if (item.series.label == "Flow rate") {
        name = "Flow rate";
        unit = " " + feeds["heatpump_flowrate"].unit;
        dp = 3;
    }
    else if (item.series.label == "Immersion") { name = "Immersion"; unit = "W"; }

    tooltip(item.pageX, item.pageY, name + " " + itemValue.toFixed(dp) + unit + "<br>" + date + ", " + time, "#fff", "#000");
}


// Powergraph events (advanced section)

// Power graph navigation
$("#zoomout").click(function () { view.zoomout(); powergraph_load(); });
$("#zoomin").click(function () { view.zoomin(); powergraph_load(); });
$('#right').click(function () { view.panright(); powergraph_load(); });
$('#left').click(function () { view.panleft(); powergraph_load(); });

$('.time').click(function () {
    view.timewindow($(this).attr("time") / 24.0);
    powergraph_load();
});

// Detail section events

$(".show_stats_category").click(function () {
    var key = $(this).attr("key");
    var color = $(this).css("color");
    $(".stats_category").hide();
    $(".stats_category[key='" + key + "'").show();
    $(".show_stats_category").css("border-bottom", "none");
    $(this).css("border-bottom", "1px solid " + color);
});


$("#carnot_enable").click(function () {

    if ($("#carnot_enable_prc")[0].checked && !$("#carnot_enable")[0].checked) {
        $("#carnot_enable_prc")[0].checked = 0;
    }

    if ($("#carnot_enable")[0].checked) {
        $("#carnot_sim_options").show();
    } else {
        $("#carnot_sim_options").hide();
        $("#carnot_prc_options").hide();
    }

    powergraph_process();
});

$("#carnot_enable_prc").click(function () {

    if ($("#carnot_enable_prc")[0].checked) {
        $("#carnot_enable")[0].checked = 1;
        $("#heatpump_factor")[0].disabled = 1;
        $("#carnot_prc_options").show();
        $("#carnot_sim_options").show();
    } else {
        $("#heatpump_factor")[0].disabled = 0;
        $("#carnot_prc_options").hide();
    }

    powergraph_process();
});

$("#condensing_offset").change(function () {
    powergraph_process();
});

$("#evaporator_offset").change(function () {
    powergraph_process();
});

$("#heatpump_factor").change(function () {
    powergraph_process();
});

$("#starting_power").change(function () {
    powergraph_process();
});

$("#fixed_outside_temperature").change(function () {
    powergraph_process();
});

$("#show_flow_rate").click(function () {
    if ($("#show_flow_rate")[0].checked) {
        show_flow_rate = true;
    } else {
        show_flow_rate = false;
    }
    powergraph_draw();
});

$("#show_immersion").click(function () {
    if ($("#show_immersion")[0].checked) {
        show_immersion = true;
    } else {
        show_immersion = false;
    }
    powergraph_draw();
});

$("#show_defrost_and_loss").click(function () {
    if ($("#show_defrost_and_loss")[0].checked) {
        show_defrost_and_loss = true;
    } else {
        show_defrost_and_loss = false;
    }
    powergraph_draw();
});

$("#show_instant_cop").click(function () {

    if ($("#show_instant_cop")[0].checked) {
        show_instant_cop = true;
        $("#inst_cop_options").show();
    } else {
        show_instant_cop = false;
        $("#inst_cop_options").hide();
    }

    powergraph_process();
});

$("#inst_cop_min").change(function () {
    inst_cop_min = parseInt($("#inst_cop_min").val());
    powergraph_process();
});

$("#inst_cop_max").change(function () {
    inst_cop_max = parseInt($("#inst_cop_max").val());
    powergraph_process();
});

$("#inst_cop_mv_av_dp").change(function () {
    inst_cop_mv_av_dp = parseInt($("#inst_cop_mv_av_dp").val());
    powergraph_process();
});

$("#realtime_cop_div").click(function () {
    if (realtime_cop_div_mode == "30min") {
        realtime_cop_div_mode = "inst";
        $("#realtime_cop_title").html("COP Now");
        $("#realtime_cop_value").html("---");
    } else {
        realtime_cop_div_mode = "30min";
        $("#realtime_cop_title").html("COP 30mins");
        $("#realtime_cop_value").html("---");
        progtime = 0;
    }
    updater();
});

$("#emitter_spec_enable").click(function () {
    if ($("#emitter_spec_enable")[0].checked) {
        emitter_spec_enable = true;
        $("#emitter_spec_options").show();
    } else {
        emitter_spec_enable = false;
        $("#emitter_spec_options").hide();
    }
    powergraph_process();
});

$("#use_for_volume_calc").click(function () {
    kw_at_50_for_volume = kw_at_50;
});

$("#configure_standby").click(function () {
    if ($("#configure_standby")[0].checked) {
        $("#configure_standby_options").show();
    } else {
        $("#configure_standby_options").hide();
    }
});

$('#histogram').bind("plothover", function (event, pos, item) {
    if (item) {
        var z = item.dataIndex;
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();
            tooltip(item.pageX, item.pageY, item.datapoint[0] + ": " + (item.datapoint[1]).toFixed(3) + " kWh", "#fff", "#000");

        }
    } else $("#tooltip").remove();
});

// Show advanced section on powergraph
$("#advanced-toggle").click(function () {
    var state = $(this).html();

    if (state == "SHOW DETAIL") {
        $("#advanced-block").show();
        $("#advanced-toggle").html("HIDE DETAIL");

    } else {
        $("#advanced-block").hide();
        $("#advanced-toggle").html("SHOW DETAIL");
    }
});
