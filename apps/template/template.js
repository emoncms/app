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
        fill: 0.75,
        lineWidth: 0
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

    // Fetch data (feedid,start,end,interval,average,delta,skipmissing,limitinterval)
    data = feed.getdata(config.app.use.value, view.start, view.end, view.interval, 1, 0, 0, 0);

    // Calculate kwh
    var kwh = 0;
    for (var z in data) {
        kwh += data[z][1] * view.interval / 3600000;
    }
    $("#kwhwindow").html(kwh.toFixed(0));

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
            tooltip(item.pageX, item.pageY, itemValue + "W<br>" + tooltip_date(itemTime), "#fff", "#000");
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

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}