// These are used by the feed api to handle user auth requirements
feed.apikey = apikey;

// Hide the config button if in public view
if (!sessionwrite) $(".config-open").hide();

// Used by the apps module configuration library to build the app configuration form
config.app = {
    "use": {
        "type": "feed",
        "autoname": "use",
        "engine": "5",
        "description": "House or building use in watts"
    }
};
// Name of the app
config.name = app_name;
// User configuration from database
config.db = app_config;
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
var series = [];

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

var ambient_co2 = 420;
$("#ambient_co2").val(ambient_co2);

var air_change_rate_m2 = null;

var last_start = null;
var last_end = null;
var view_changed = false;

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
    meta = feed.getmeta(config.app.use.value);
    // Limit end time to feed end time
    if (view.end * 0.001 > meta.end_time) {
        view.end = meta.end_time * 1000;
    }
    // Set start time to 7 days ago
    view.start = view.end - (3600000 * 24.0 * 1);

    load();
}

function load() {
    // Calc interval
    view.calc_interval(800);

    // has the view changed
    if (last_start != view.start || last_end != view.end) {
        view_changed = true;
    }
    last_start = view.start;
    last_end = view.end;

    // Fetch data (feedid,start,end,interval,average,delta,skipmissing,limitinterval)
    data = feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1, 0, 0, 0);

    // Calculate kwh
    
    var start_co2 = null;
    var end_co2 = null;
    var start_time = null;
    var end_time = null;
    
    for (var z in data) {
        if (start_co2==null && data[z][1]!=null) {
            start_co2 = data[z][1];
            start_time = data[z][0]*0.001;
        }
        if (data[z][1]!=null) {
            end_co2 = data[z][1];
            end_time = data[z][0]*0.001;
        }
    }
    
    var time_change = end_time - start_time;
    var co2_start_minus_ambient = start_co2 - ambient_co2;
    var co2_end_minus_ambient = end_co2 - ambient_co2;

    var air_change_rate = ((-1*Math.log(co2_end_minus_ambient / co2_start_minus_ambient))/time_change)*3600;

    var valid = true;
    if (air_change_rate>0 && air_change_rate<100) {
        $("#airchange").val(air_change_rate.toFixed(2));
    } else {
        $("#airchange").val("?");
        valid = false;
    }

    // Method 2 plot exp decay curve

    var exp_decay_data = [];
    if (start_time!=null && end_time!=null && valid) {
        for (var time = start_time; time < end_time; time+=view.interval) {
            var co2 = (start_co2 - ambient_co2)*Math.exp(-1*(air_change_rate/3600)*(time-start_time))+ambient_co2;
            exp_decay_data.push([time*1000,co2]);
        }
    }
    // Graph options
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    // Draw graph
    series = [];
    series.push({
        label: config.app.use.autoname,
        data: data,
        color: "#0699fa"
    });
    series.push({
        label: "Exponential Decay Curve",
        data: exp_decay_data,
        color: "#888"
    });

    draw();
}

function draw() {
    $.plot($('#graph'), series, options);
}

function updater() {
    var use = config.app.use.value;
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
            tooltip(item.pageX, item.pageY, itemValue + " ppm<br>" + tooltip_date(itemTime), "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

$('#graph').bind("plotselected", function (event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    load();
});

$("#ambient_co2").change(function () {
    ambient_co2 = $("#ambient_co2").val()*1;
    load();
});

$(window).resize(function () {
    resize();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}
