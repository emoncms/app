<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/graph.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/data.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/graph.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>

<section id="app-block" class="app hide">
    <div class="app-block info">
        <div class="app-header">
            <div id="app-title" class="title grow"><?php echo "HOUSEHOLD"; ?></div>
            <div class="action app-unit"><?php echo "VIEW COST"; ?></div>
            <div class="action config-open"><span class="icon-wrench icon-white"></span></div>
        </div>
        <div class="app-body">
            <div class="title">
                <div><span class="power consumption hide"><?php echo "NOW"; ?></span></div>
                <div><span class="power generation hide"><?php echo "GENERATION"; ?></span></div>
                <div class="grow"></div>
                <div><span class="energy selfcons hide"><?php echo "SELF-CONSUMPTION"; ?></span></div>
                <div><span class="energy generation hide"><?php echo "GENERATION"; ?></span></div>
                <div><span class="energy consumption"><?php echo "TODAY"; ?></span></div>
            </div>
            <div class="value">
                <div><span class="power consumption" id="cons-power"></span></div>
                <div><span class="power generation hide" id="gen-power"></span></div>
                <div class="grow"></div>
                <div class="right"><span class="energy selfcons hide" id="selfcons-energy"></span></div>
                <div class="right"><span class="energy generation hide" id="gen-energy"></span></div>
                <div class="right"><span class="energy consumption" id="cons-energy"></span></div>
            </div>
        </div>
    </div>
    
    <div id="graph" class="app-block"></div>
</section>

<section id="app-setup" class="hide pb-3 px-3">
    <!-- instructions and settings -->
    <div class="row-fluid">
        <div class="span9 app-config-description">
            <div class="app-config-description-inner text-light">
                <h2 class="app-config-title text-primary"><?php echo _('Feed-in tariff'); ?></h2>
                <p class="lead">The feed-in tariff app is a simple home energy monitoring app to explore onsite energy generation, feed-in and self-consumption, as well as the buildings overall consumption and cost.</p>
                <p><strong class="text-black">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                <p><strong class="text-light">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
            </div>
        </div>
        <div class="span3 app-config pt-3"></div>
    </div>
</section>

<div class="ajax-loader"></div>

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
        "default": "HOUSEHOLD",
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
config.name = "<?php echo $name; ?>";
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
    $("#app-title").html(config.app.title.value.toUpperCase());
    
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
        
        $("#cons-power").html(cons.toFixed(fixed)+"<span class='unit'>"+unit+"</span>");
        $(".consumption.power").removeClass('cost').show();
        
        if (values["solar_power"] != undefined && solar != null) {
            $("#gen-power").html(solar.toFixed(fixed)+"<span class='unit'>"+unit+"</span>");
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
        $("#cons-power").html(config.app.currency.value+costNow.toFixed(fixed)+"<span class='unit'>/hr</span>");
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
            $("#gen-power").html(config.app.currency.value+fitNow.toFixed(fixed)+"<span class='unit'>/hr</span>");
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
            $("#gen-energy").html(solar.toFixed(1)+"<span class='unit'>kWh</span>");
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
            $("#selfcons-energy").html(selfConsShare.toFixed(0)+"<span class='unit'>%</span>");
            $(".selfcons.energy").show();
        }
        else {
            $(".generation.energy").hide();
            $(".selfcons.energy").hide();
        }
        $("#cons-energy").html(cons.toFixed(1)+"<span class='unit'>kWh</span>");
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

    $(".app-unit").on('click', function() {
        var view = $(this).html();
        if (view == "VIEW COST") {
            $(this).html("VIEW ENERGY");
            graph.unit = "cost";
        } else {
            $(this).html("VIEW COST");
            graph.unit = "energy";
        }
        graph.draw();
        draw();
    });
}

function resize() {
    var height = $(window).height();
    
    // Subtract the height of all relevant elements
    $('.graph-info .graph-header, .app-header, .app-body').each(function() {
        height -= $(this).outerHeight();
    });
    // Subtract the padding height of all blocks
    $('.app-block').each(function() {
        var block = $(this);
        height -= (block.outerHeight(true) - block.height());
    });
    // Subtract the heigt of the graph and emoncms footer and navbar
    var container = $('.content-container');
    height -= (container.outerHeight(true) - container.height());
    height -= 146;

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
