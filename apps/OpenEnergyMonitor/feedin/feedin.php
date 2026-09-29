<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/feedin/feedin.css"); ?>

<?php load_js("Modules/app/Lib/data.js"); ?>
<?php load_js("Modules/app/Lib/graph.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>

<?php load_js("Lib/js/DateTimePicker.js"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>
<div class="app-page" data-bs-theme="light">
<section id="app-block" class="app" style="display:none">

    <div class="app-card">
        <nav class="app-card-head">
            <div class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-home"></i><span id="app-title">Household</span></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link app-unit">View cost</button>
                    <button class="nav-link config-open" title="Configure app"><i class="svg-icon-wrench"></i></button>
                </div>
            </div>
        </nav>
        <div class="app-live feedin-values">
            <div class="power consumption hide">
                <div class="app-live-label">Now</div>
                <div class="app-live-value" id="cons-power">---</div>
            </div>
            <div class="power generation hide">
                <div class="app-live-label">Generation</div>
                <div class="app-live-value" id="gen-power">---</div>
            </div>
            <div class="energy selfcons hide">
                <div class="app-live-label">Self-consumption</div>
                <div class="app-live-value" id="selfcons-energy">---</div>
            </div>
            <div class="energy generation hide">
                <div class="app-live-label">Generation today</div>
                <div class="app-live-value" id="gen-energy">---</div>
            </div>
            <div class="energy consumption">
                <div class="app-live-label">Today</div>
                <div class="app-live-value" id="cons-energy">---</div>
            </div>
        </div>
    </div>

    <!-- Chart card. Markup read by Lib/graph.js -->
    <div id="graph" class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php
            // Power view up to a month, daily bars from a week to all time
            $timebar_ranges = array(24 => tr('24 hours'), 168 => tr('1 week'), 720 => tr('1 month'), 'all' => tr('All time'));
            include "Modules/app/Lib/timebar.php";
            ?>
            <div class="btn-group app-segmented ms-auto">
                <button class="btn viewpower active" title="Power graph">Power</button>
                <button class="btn viewhistory" title="Daily summary">Daily</button>
            </div>
        </div>
        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div class="graph-body position-relative">
            <div class="graph"></div>
            <div class="graph-loader ajax-loader" style="display:none"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>

        <div class="app-card-caption graph-footer graph-info app-chart-foot">
            <span class="app-section-label window energy">Average in window</span>
            <span class="app-section-label window power hide">Energy in window</span>
            <span class="app-caption-note window info"><b id="window-cons"></b> consumed</span>
            <span class="app-caption-note window generation hide"><b id="window-gen"></b> generated</span>
            <span class="app-caption-note window self hide"><b id="window-selfcons"></b> self-consumed</span>
            <span class="app-caption-note window self hide"><b id="window-selfsuff"></b> self-sufficient</span>
            <div class="nav ms-auto"><button class="nav-link window power details" style="display:none">Show detail</button></div>
        </div>

        <div class="graph-stats" style="display:none">
            <table class="table table-sm mb-0">
                <tr>
                    <th></th>
                    <th class="text-center">Min</th>
                    <th class="text-center">Max</th>
                    <th class="text-center">Diff</th>
                    <th class="text-center">Mean</th>
                    <th class="text-center">StDev</th>
                </tr>
                <tbody id="graph-stats"></tbody>
            </table>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">The feed-in tariff app is a simple home energy monitoring app to explore onsite energy generation, feed-in and self-consumption, as well as the buildings overall consumption and cost.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
const INTERVAL_RELOAD = 300000;
const INTERVAL_UPDATE = 5000;

var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
if (!sessionwrite) $(".app-setup").hide();

var data = new Data(apikey);
var graph = new GraphView(path, $('#graph'));

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "title": {
        "type": "value",
        "default": "Household",
        "name": "Title",
        "description": "Optional title for app"
    },
    "solar_power": {
        "type": "feed",
        "autoname": "solar_power",
        "optional": true
    },
    "solar_energy": {
        "type": "feed",
        "autoname": "solar_energy",
        "optional": true
    },
    "import_power": {
        "type": "feed",
        "autoname": "import_power",
        "optional": false
    },
    "import_energy": {
        "type": "feed",
        "autoname": "import_energy",
        "optional": false
    },
    "export_power": {
        "type": "feed",
        "autoname": "export_power",
        "optional": true
    },
    "export_energy": {
        "type": "feed",
        "autoname": "export_energy",
        "optional": true
    },
    "import_cost": {
        "type": "value",
        "default": 0.29,
        "name": "Grid import cost",
        "description": "Unit cost of imported electricity in &euro;/kWh"
    },
    "export_cost": {
        "type": "value",
        "default": 0.12,
        "name": "Feed-in tariff payments",
        "description": "Unit cost of exported electricity in &euro;/kWh"
    },
    "currency": {
        "type": "value",
        "default": "&euro;",
        "name": "Currency",
        "description": "Currency symbol (&euro;,&dollar;,&pound;,...)"
    }
};

config.app_name = "Feed-in";
config.id = <?php echo $id; ?>;
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;

config.initapp = function() {
    init();
};
config.showapp = function() {
    show();
};
config.hideapp = function() {
    hide();
};

// ----------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------
var updateTimer = false;
var idle = Date.now();

var times = {}
var values = {};

data.loadFeeds().then(function(feeds) {
	config.feeds = feeds;
	config.init();
});
function init() {
    // Saved configs may hold the old upper case default
    $("#app-title").text(config.app.title.value == "HOUSEHOLD" ? "Household" : config.app.title.value);
    
    events();
}

function show() {
    setup();
    reset();
}

function hide() {
    clearInterval(updateTimer);
}

function reset() {
    graph.mode = "power";
    graph.unit = "energy";
    if (graph.ready) {
        graph.reset();
    }
    resize();
}

function setup() {
    // -------------------------------------------------------------------------
    // Set power and energy data
    // -------------------------------------------------------------------------
    data.setup(Graph.POWER, [Graph.SOLAR, Graph.IMPORT, Graph.EXPORT], config);
    data.setup(Graph.ENERGY, [Graph.SOLAR, Graph.IMPORT, Graph.EXPORT], config);
    data.register([Graph.SOLAR, Graph.IMPORT, Graph.EXPORT, 
        "solar_power", "import_power", "export_power"], config);
    
    return graph.setup(data, config).then(function(result) {
        // Midnight meter reading for Today, as the power view loads no daily data
        var today = new Date();
        today.setHours(0,0,0,0);
        return data.getGroup(Graph.ENERGY).loadDailyData(today.getTime(), today.getTime());
    }).then(function(result) {
        update();
        updateTimer = setInterval(update, INTERVAL_UPDATE);
        
        $('.ajax-loader').hide();
        
    }).catch(function(error) {
        graphError(error);
        
        return setup();
        
    }).then(function() {
        return load();
    });
}

function update() {
    var time = Date.now();
    if (time - idle >= INTERVAL_RELOAD) {
        appLog('INFO', "Window idle for "+INTERVAL_RELOAD/60000+" minutes and will be reset")
        reset();
        
        idle = time;
    }
    return data.update().then(function(result) {
        draw(result);
    });
}

function load() {
    return graph.load().then(function(result) {
        resize();
        
    }).catch(function(error) {
        graphError(error);
        
        return load();
    });
}

function draw(values) {
    if (typeof values === 'undefined') {
    	values = data.latest();
    }
    drawPowerValues(values);
    drawEnergyValues();
    graph.draw();
}

function drawPowerValues(values) {
	var getPowerValue = function(key, values) {
		if (values[key] == undefined) {
			return null;
		}
		return parseFloat(values[key][1]);
	};
    var imp = getPowerValue("import_power", values);
    if (imp == null) {
    	return;
    }
    live_status_update(values["import_power"][0]*0.001);
    var cons = imp;
    var solar = getPowerValue("solar_power", values);
    if (solar == null) {
        solar = 0;
    }
    else {
        var exp = getPowerValue("export_power", values);
        if (exp != null) {
            var selfCons = Math.max(0, solar - exp);
            if (selfCons != null) {
                cons += selfCons;
            }
        }
    }
    
    // set the power now value
    if (graph.unit == "energy") {
        var unit;
        var fixed = 0;
        if (cons > 2000 || solar > 2000) {
            unit = "kW";
            cons = cons*0.001;
            solar = solar*0.001;
            fixed = 1;
        }
        else {
            unit = "W";
        }
        
        $("#cons-power").html(cons.toFixed(fixed)+"<span class='power-unit-static'>"+unit+"</span>");
        $(".consumption.power").removeClass('cost').show();
        
        if (values["solar_power"] != undefined && solar != null) {
            $("#gen-power").html(solar.toFixed(fixed)+"<span class='power-unit-static'>"+unit+"</span>");
            $(".generation.power").removeClass('cost').show();
        }
        else {
            $(".generation.power").hide();
        }
    }
    else {
        var costNow = imp*config.app.import_cost.value*0.001;
        var fixed;
        if (costNow < 0.001) {
            fixed = 0;
        }
        else if (costNow >= 0.1) {
            fixed = 2;
        }
        else {
            fixed = 3;
        }
        $("#cons-power").html(config.app.currency.value+costNow.toFixed(fixed)+"<span class='power-unit-static'>/hr</span>");
        $(".consumption.power").addClass('cost').show();
        
        if (values["solar_power"] != undefined && solar != null && 
                config.app.export_cost.value > 0) {
            
            var fitNow = solar*config.app.export_cost.value*0.001;
            var fixed;
            if (fitNow < 0.001) {
                fixed = 0;
            }
            else if (fitNow >= 0.1) {
                fixed = 2;
            }
            else {
                fixed = 3;
            }
            $("#gen-power").html(config.app.currency.value+fitNow.toFixed(fixed)+"<span class='power-unit-static'>/hr</span>");
            $(".generation.power").addClass('cost').show();
        }
        else {
            $(".generation.power").hide();
        }
    }
}

function drawEnergyValues() {
    var now = new Date();
    now.setHours(0,0,0,0);
    var time = now.getTime();

    var energy = data.getGroup(Graph.ENERGY);
    var cons = energy.getDailyValue(Graph.IMPORT, time);
    var solar = energy.getDailyValue(Graph.SOLAR, time);
    
    if (graph.unit == Graph.ENERGY) {
        if (energy.has(Graph.SOLAR)) {
            $("#gen-energy").html(solar.toFixed(1)+"<span class='power-unit-static'>kWh</span>");
            $(".generation.energy").removeClass('cost').show();
            
            var selfCons = 0;
            if (energy.has(Graph.EXPORT)) {
                selfCons = Math.max(0, solar - energy.getDailyValue(Graph.EXPORT, time));
            }
            cons = Math.max(0, cons+selfCons);
            
            var selfConsShare = 0;
            if (solar > 0) {
                selfConsShare = Math.min(100, selfCons/solar*100);
            }
            $("#selfcons-energy").html(selfConsShare.toFixed(0)+"<span class='power-unit-static'>%</span>");
            $(".selfcons.energy").show();
        }
        else {
            $(".generation.energy").hide();
            $(".selfcons.energy").hide();
        }
        $("#cons-energy").html(cons.toFixed(1)+"<span class='power-unit-static'>kWh</span>");
        $(".consumption.energy").removeClass('cost');
    }
    else {
        if (energy.has(Graph.SOLAR) && config.app.export_cost.value > 0) {
            $("#gen-energy").html(config.app.currency.value+(solar*config.app.export_cost.value).toFixed(2));
            $(".generation.energy").addClass('cost').show();
        }
        else {
            $(".generation.energy").hide();
        }
        $(".selfcons.energy").hide();
        
        $("#cons-energy").html(config.app.currency.value+(cons*config.app.import_cost.value).toFixed(2));
        $(".consumption.energy").addClass('cost');
    }
}

function events() {
    $(".app").on('click touchstart', function() { idle = Date.now(); });

    // Power and Daily views
    $(".viewpower").click(function() {
        if (!graph.ready || graph.mode == Graph.POWER) return;
        graph.mode = Graph.POWER;
        graph.load();
    });
    $(".viewhistory").click(function() {
        if (!graph.ready || graph.mode == Graph.ENERGY) return;
        $(".graph-stats", graph.container).hide();
        $("#graph-stats").empty();
        graph.mode = Graph.ENERGY;
        graph.load();
    });

    // Range select: hours of power data, or days of bars
    $("#time-select").change(function() {
        var value = $(this).val();
        if (!value || !graph.ready) return;
        range_all = value == "all";
        var now = Date.now();
        if (graph.mode == Graph.ENERGY) {
            if (range_all) graph.energy.setTimeWindow(graph.energy.earliest, now);
            else graph.energy.setTimeWindowDays(value/24);
        } else {
            graph.power.setTimeWindow(now - value*3600000, now);
        }
        graph.load();
    });

    $("#zoomin").click(function() { feedin_navigate("zoomIn", "zoomin"); });
    $("#zoomout").click(function() { feedin_navigate("zoomOut", "zoomout"); });
    $("#left").click(function() { feedin_navigate("panLeft", "panleft"); });
    $("#right").click(function() { feedin_navigate("panRight", "panright"); });

    // Start and End fields, and Now for the power view, from Lib/vis.helper.js
    timebar_manual(feedin_set_window);
    timebar_now(feedin_set_window);

    $(".app-unit").on('click', function() {
        var view = $(this).html();
        if (view == "View cost") {
            $(this).html("View energy");
            graph.unit = "cost";
        } else {
            $(this).html("View cost");
            graph.unit = "energy";
        }
        graph.draw();
        draw();
    });
}

function resize() {
    var height = $(window).height();
    
    // Subtract the live values card and the rows around the chart
    height -= $('#app-block > .app-card').first().outerHeight(true);
    $('#graph-nav, #chart-legend, .graph-footer').each(function() {
        height -= $(this).outerHeight(true);
    });
    // Subtract the padding of the chart card
    var card = $('#graph');
    height -= (card.outerHeight(true) - card.height());
    // Subtract the emoncms navbar and footer
    var container = $('.content-container');
    height -= (container.outerHeight(true) - container.height());
    height -= 70;

    $('.graph').height(height);
}

function graphError(error) {
    var message = "Failed to configure graph";
    if (typeof error !== 'undefined') {
        message += ": ";
        
        if (typeof error.message !== 'undefined') {
            message += error.message;
        }
        else  if (typeof error.responseText !== 'undefined') {
            message += error.responseText;
        }
        else if (typeof error !== 'string') {
            message += JSON.stringify(error);
        }
        else {
            message += error;
        }
    }
    appLog('WARN', message);
}

// ----------------------------------------------------------------------
// Time bar
// ----------------------------------------------------------------------
var range_all = false;

// Time bar, toggle and legend from the window of the graph drawn
function feedin_timebar_sync() {
    var current = graph.graph();
    if (!current) return;
    var daily = graph.mode == Graph.ENERGY;
    view.start = current.start;
    // Daily window ends at midnight, the last bar covers the day after it
    view.end = daily ? current.end + 86400000 : current.end;
    $("#time-select").find("option[value=all]").prop("hidden", !daily);
    timebar_update(daily);
    if (daily && range_all) $("#time-select").val("all");
    $(".viewhistory").toggleClass("active", daily);
    $(".viewpower").toggleClass("active", !daily);
    if (current.plot) chart_legend(current.plot.getData());
}
[PowerGraph, EnergyGraph].forEach(function(type) {
    var draw = type.prototype.draw;
    type.prototype.draw = function() {
        draw.apply(this, arguments);
        feedin_timebar_sync();
    };
});

// Zoom and pan: methods of the power graph, or the view for daily bars
function feedin_navigate(power_move, view_move) {
    if (!graph.ready) return;
    range_all = false;
    if (graph.mode == Graph.POWER) {
        graph.power[power_move]();
        return;
    }
    // Daily window ends after today, so nothing later to pan to
    if (view_move == "panright" && view.end > view.now()) return;
    view.first_data = graph.energy.earliest;
    view[view_move]();
    feedin_set_window();
}

// Apply the Start and End fields or a view change to the graph shown
function feedin_set_window() {
    if (!graph.ready) return;
    range_all = false;
    if (graph.mode == Graph.ENERGY) {
        graph.energy.setTimeWindow(view.start, view.end - 1);
    } else {
        graph.power.setTimeWindow(view.start, view.end);
    }
    graph.load();
}

// on finish sidebar hide/show
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', resize)
})

$(function(){
    // listen to the config.closed event before resizing the graph
    $('body').on('config.closed', function() {
        $('#app-block').removeClass('hide');
        $('#app-setup').addClass('hide');
        resize();
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function appLog(level, message) {
    var time = new Date().toString();
    if (level.toUpperCase() == 'ERROR') {
        alert(time+" "+level+": "+message);
        console.error(time, level, message);
    }
    else if (level.toUpperCase() == 'WARN') {
        console.warn(time, level, message);
    }
    else if (level.toUpperCase() == 'INFO') {
        console.info(time, level, message);
    }
    else {
        console.log(time, level, message);
    }
}

</script>
