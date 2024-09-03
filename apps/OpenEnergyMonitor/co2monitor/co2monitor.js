// These are used by the feed api to handle user auth requirements
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

// Hide the config button if in public view
if (!sessionwrite) $(".config-open").hide();

// Used by the apps module configuration library to build the app configuration form
config.app = {
    "feedA": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 1", "optional": false },
    "feedB": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 2", "optional": true },
    "feedC": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 3", "optional": true },
    "feedD": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 4", "optional": true },
    "feedE": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 5", "optional": true },
    "feedF": { "type": "feed", "description": "CO2 concentration feed", "autotag": "CO2", "autoname": "CO2 6", "optional": true },
    "volumeA": { "type": "value", "name": "Volume A", "optional": true, default: 0 },
    "volumeB": { "type": "value", "name": "Volume B", "optional": true, default: 0 },
    "volumeC": { "type": "value", "name": "Volume C", "optional": true, default: 0 },
    "volumeD": { "type": "value", "name": "Volume D", "optional": true, default: 0 },
    "volumeE": { "type": "value", "name": "Volume E", "optional": true, default: 0 },
    "volumeF": { "type": "value", "name": "Volume F", "optional": true, default: 0 },
    "windspeed": { "type": "feed", "description": "Wind speed", "autotag": "metoffice", "autoname": "windspeed", "optional": true }

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

// Graph variables

var options = {
    canvas: true,
    lines: {
        show: true,
        lineWidth: 2
    },
    xaxis: {
        mode: "time",
        timezone: "browser"
    },
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

var feeds_to_load = [];
var windspeed_enabled = false;
var show_windspeed = false;
var windspeed_data = [];
var selected_feed = false;
var mode = "average";
$(".decay").hide();
$(".average").show();

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
    meta = feed.getmeta(config.app.feedA.value);
    // Limit end time to feed end time
    if (view.end * 0.001 > meta.end_time) {
        view.end = meta.end_time * 1000;
    }
    // Set start time to 7 days ago
    view.start = view.end - (3600000 * 24.0 * 7);


    // Prepare
    feeds_to_load = [];

    var codes = ["A", "B", "C", "D", "E", "F"];
    for (var z in codes) {
        let name = "feed" + codes[z];
        if (!isNaN(config.app[name].value) && config.app[name].value>0) {

            // check if volume field is set
            let volume_name = "volume" + codes[z];
            config.app[name].volume = 0;
            if (!isNaN(config.app[volume_name].value) && config.app[volume_name].value>0) {
                config.app[name].volume = config.app[volume_name].value*1;
            }
            config.app[name].show = true;

            feeds_to_load.push(config.app[name]);
        }
    }


    load();
}

function load() {
    // Calc interval
    view.calc_interval(1200);
    
    var feedids = [];
    for (var z in feeds_to_load) {
        feedids.push(feeds_to_load[z].value);
    }
    
    // Load wind speed data if selected
    if (!isNaN(config.app["windspeed"].value) && config.app["windspeed"].value>0) {
        windspeed_enabled = true;
        $("#windspeed_option").show();
        feedids.push(config.app["windspeed"].value);
    }

    feed.getdata(feedids, view.start, view.end, view.interval, 1, 0, 0, 0, function (all_data) {

        var data_index = 0;
        for (var z in feeds_to_load) {

            feeds_to_load[z].data = all_data[data_index].data;
            feeds_to_load[z].params = prepare(all_data[data_index].data);
            feeds_to_load[z].fit = exp_fit(all_data[data_index].data,feeds_to_load[z].params);

            data_index++;
        }
        
        if (windspeed_enabled) {
            windspeed_data = all_data[data_index].data;
        }
        
        draw();
    });

    /*
    // Calculate kwh
  
    */

}

function prepare(data) {
  
    let start_co2 = null;
    let end_co2 = null;
    let start_time = null;
    let end_time = null;
    
    let minimum_co2 = null;
    let sum_co2 = null;
    let npoints = 0;
    
    for (var z in data) {
        if (start_co2==null && data[z][1]!=null) {
            start_co2 = data[z][1];
            start_time = data[z][0]*0.001;
            
            minimum_co2 = data[z][1];
        }
        if (data[z][1]!=null) {
            end_co2 = data[z][1];
            end_time = data[z][0]*0.001;
            
            if (data[z][1]<minimum_co2) minimum_co2 = data[z][1];
            sum_co2 += data[z][1];
            npoints ++;
        }
    }
    
    let mean_co2 = sum_co2 / npoints
    let ambient_co2 = minimum_co2-10;

    return {
        start_co2: start_co2,
        end_co2: end_co2,
        start_time: start_time,
        end_time: end_time,
        mean: mean_co2,
        ambient_co2: ambient_co2,
        baseline: ambient_co2,
    }
}

function exp_fit(data,params,plot = false) {
    
    var time_change = params.end_time - params.start_time;
    var co2_start_minus_ambient = params.start_co2 - params.ambient_co2;
    var co2_end_minus_ambient = params.end_co2 - params.ambient_co2;

    var air_change_rate = ((-1*Math.log(co2_end_minus_ambient / co2_start_minus_ambient))/time_change)*3600;

    var valid = false;
    if (air_change_rate>0 && air_change_rate<100) {
        valid = true;
    }

    // Method 2 plot exp decay curve
    var SSE_sum = 0
    var SST_sum = 0;
    var diff_sum = 0;

    var exp_decay_data = [];
    if (params.start_time!=null && params.end_time!=null && valid) {
                
        for (var z in data) {
            time = data[z][0]*0.001
        
            var co2 = (params.start_co2 - params.ambient_co2)*Math.exp(-1*(air_change_rate/3600)*(time-params.start_time))+params.ambient_co2;

            if (plot) exp_decay_data.push([time*1000,co2]);
            
            SSE_sum += Math.pow(data[z][1] - co2,2)
            SST_sum += Math.pow(data[z][1] - params.mean,2)
            diff_sum += data[z][1] - co2
        }
    }

    return {
        valid: valid,
        air_change_rate: air_change_rate,
        SSE_sum: SSE_sum,
        SST_sum: SST_sum,
        diff_sum: diff_sum,
        exp_decay_data: exp_decay_data,
        R2: 1-(SSE_sum/SST_sum)
    }
}

function refine(z) {
    selected_feed = z;

    for (var i=0; i<50; i++) {
        feeds_to_load[z].params.ambient_co2 -= feeds_to_load[z].fit.diff_sum * 0.0002
        let plot = false;
        if (i==49) plot = true;
        feeds_to_load[z].fit = exp_fit(feeds_to_load[z].data,feeds_to_load[z].params, plot);
    }

    draw();
}

function calculate_volume_based_air_change_rate() {
    var total_volume = 0;
    var total_mean = 0;
    for (var z in feeds_to_load) {
        total_volume += feeds_to_load[z].volume;
        total_mean += feeds_to_load[z].params.mean * feeds_to_load[z].volume;
    }
    total_mean = total_mean / total_volume;
    $("#total_volume").html(total_volume);
    $("#total_mean_co2").html(total_mean.toFixed(0));

    var co2_litres_per_day = $("#daily_co2_addition").val();
    var mean_air_change_rate = (co2_litres_per_day / 24) / (1000 * total_volume * (0.000001 * (total_mean - 420)));
    $("#total_mean_air_change_rate").html(mean_air_change_rate.toFixed(2));
}

function draw() {
    calculate_volume_based_air_change_rate();

    var colours = ["#0699fa", "#60BDFC", "#99D5FD", "#BDE4FD", "#D5EDFD", "#FFFFFF"];
    colours = ["#ff2117","#ff8c00","#ffd93d","#fff195","#c69563","#8b4819"]

    var sensors_list = "";
    for (var z in feeds_to_load) {

        let air_change_rate = "?";
        if (isNaN(feeds_to_load[z].fit.air_change_rate)==false) {
            air_change_rate = feeds_to_load[z].fit.air_change_rate.toFixed(2) + " ACH"
        }

        let R2 = "?";
        if (isNaN(feeds_to_load[z].fit.R2)==false) {
            R2 = feeds_to_load[z].fit.R2.toFixed(5);
        }
        let highlight = "#fff";
        if (!feeds_to_load[z].show) highlight = "#666";

        sensors_list += "<tr style='color:"+highlight+"'>";
        sensors_list += "<td><div class='box' style='background-color:"+colours[z]+"; cursor:pointer' z='"+z+"'></div></td>";
        sensors_list += "<td>"+config.feedsbyid[feeds_to_load[z].value].tag + ": "+config.feedsbyid[feeds_to_load[z].value].name+"</td>";
        if (mode=="average") {
            sensors_list += "<td>"+feeds_to_load[z].volume+" m3</td>";
            sensors_list += "<td>"+feeds_to_load[z].params.mean.toFixed(0)+" ppm</td>";
        } else {
            sensors_list += "<td>"+feeds_to_load[z].params.baseline.toFixed(0)+" ppm</td>";
            sensors_list += "<td>"+air_change_rate+"</td>";
            sensors_list += "<td>"+R2+"</td>";
            // refine button
            sensors_list += "<td><button class='btn btn-primary' onclick='refine("+z+")'>Refine</button></td>";
        }

        sensors_list += "</tr>";
    }
    if (sensors_list=="") sensors_list = "<tr><td>No sensors selected</td></tr>";
    $("#sensors_list").html(sensors_list);

    // Graph options
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;

    var series = [];


    for (var z in feeds_to_load) {
        console.log(feeds_to_load[z].show)
        if (feeds_to_load[z].show) {
            series.push({
                label: config.feedsbyid[feeds_to_load[z].value].tag + ": "+config.feedsbyid[feeds_to_load[z].value].name,
                data: feeds_to_load[z].data,
                color: colours[z]
            });
        }
    }

    // Draw graph
    if (feeds_to_load[selected_feed]!=undefined && feeds_to_load[selected_feed].fit.exp_decay_data!=undefined) {
        series.push({
            label: "Exponential Decay Curve",
            data: feeds_to_load[selected_feed].fit.exp_decay_data,
            color: "#888"
        });
    }
    
    if (windspeed_enabled && show_windspeed) {
        series.push({
            label: "Wind speed",
            data: windspeed_data,
            color: "#00aa00",
            yaxis:2
        });    
    }

    $.plot($('#graph'), series, options);
}

function updater() {
    var use = config.app.feedA.value;
    var feeds = feed.listbyid();
    $("#powernow").html((feeds[use].value * 1).toFixed(0));
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
            
            let unit = "ppm";
            if (item.series.label=="Wind speed") unit = "m/s";
            
            tooltip(item.pageX, item.pageY, item.series.label + "<br>"+itemValue + " "+ unit +"<br>" + tooltip_date(itemTime), "#fff", "#000");
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

$("#daily_co2_addition").change(function () {
    calculate_volume_based_air_change_rate();
});

$("#decay_mode").click(function() {
    mode = "decay";
    $(".decay").show();
    $(".average").hide();
    $("#decay_mode").removeClass("btn-primary");
    $("#average_mode").removeClass("btn-primary");
    $("#decay_mode").addClass("btn-primary");
    draw();
});

$("#average_mode").click(function() {
    mode = "average";
    $(".decay").hide();
    $(".average").show();
    $("#decay_mode").removeClass("btn-primary");
    $("#average_mode").removeClass("btn-primary");
    $("#average_mode").addClass("btn-primary");
    draw();
});

$("#sensors_list").on("click",".box",function() {
    let z = 1 * $(this).attr("z");
    feeds_to_load[z].show = !feeds_to_load[z].show;
    draw();
});

$("#show_windspeed").click(function() {
   show_windspeed = $("#show_windspeed")[0].checked;
   draw();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}
