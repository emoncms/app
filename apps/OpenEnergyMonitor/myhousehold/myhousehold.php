<?php
    global $path, $session;
    $v = 5;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/app.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/feed.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/data.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/graph.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script> 

<div id="app-container" class="app">
    <div class="app-block info">
        <div class="app-header">
            <div id="app-title" class="title grow"><?php echo "MY HOUSEHOLD"; ?></div>
            <div class="action app-unit"><?php echo "VIEW COST"; ?></div>
            <div class="action app-setup"><span class="icon-wrench icon-white"></span></div>
        </div>
        <div class="app-body">
            <div class="energy">
                <div class="title"><?php echo "NOW"; ?></div>
                <div class="value"><span id="power-now">0</span></div>
            </div>
            <div class="power">
                <div class="title"><?php echo "TODAY"; ?></div>
                <div class="value"><span id="energy-today">0</span></div>
            </div>
        </div>
    </div>
    
    <div id="graph" class="app-block"></div>
</div>

<div id="app-setup">
    <h2 class="app-config-title"><?php echo "My Household"; ?></h2>
    
    <div class="app-config-description">
        <div class="app-config-description-inner">
            The Household app is a simple home energy monitoring app to explore onsite energy generation, self consumption and building consumption over time.
            <br><br>
            <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
            <br><br>
            <b>Cumulative kWh</b> feeds can be generated from power feeds with the power_to_kwh input processor.
            <br><br>
            <img src="../Modules/app/images/myelectric_app.png" style="width:600px" class="img-rounded">
        </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var path = "<?php print $path; ?>";
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
if (!sessionwrite) $(".app-setup").hide();

var feed = new Feed(apikey);
var data = new DataCache(feed);
var graph = new GraphView(path, $('#graph'));

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "title": {
        "type": "value",
        "default": "MY HOUSEHOLD",
        "name": "Title",
        "description": "Optional title for app"
    },
    "use": {
        "type": "feed",
        "class": "power",
        "autoname": "use",
        "engine": "2,5,6"
    },
    "use_kwh": {
        "type": "feed",
        "class": "energy",
        "autoname": "use_kwh",
        "engine": "2,5,6"
    },
    "unitcost": {
        "type": "value",
        "default": 0.29,
        "name": "Unit cost",
        "description": "Unit cost of electricity &euro;/kWh"
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
config.feeds = feed.getList();

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
var comparisonHeating = false;
var comparisonTransport = false;

var updateTimer = false;

config.init();

function init() {
    // -------------------------------------------------------------------------
    // Initialize power and energy data
    // -------------------------------------------------------------------------
    data.init(['use', 'use_kwh'], config);
    graph.init(data, config);
    
    update();
    updateTimer = setInterval(update, 5000);
    
    $(".app-unit").click(function() {
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
        
        $(".graph-power-navigation").hide();
        $(".graph-energy-navigation").show();
    });
    
    $(window).resize(function() {
        var widthWindow = $(this).width();
        
        var flotFontSize = 12;
        if (widthWindow < 450) flotFontSize = 10;
        
        resize();
        graph.draw(flotFontSize);
    });
}

function show() {
    $("#app-title").html(config.app.title.value);

    wait(function() {
        if (!graph.ready) {
            return false;
        }
        
        resize();
        console.log("Graph ready");
        graph.load(function() {
            console.log("Graph load");
            $(".ajax-loader").hide();
        });
        return true;
    });
}

function hide() {
    clearInterval(updateTimer);
}

function resize() {
    var height = $(window).height();
    
    // Subtract the height of all relevant elements
    $('.graph-header, .app-header, .app-body').each(function() {
        height -= $(this).outerHeight();
    });
    // Subtract the padding height of all blocks
    $('.app-block').each(function() {
        var block = $(this);
        height -= (block.innerHeight() - block.height());
    });
    // Subtract the heigt of the graph and emoncms footer and navbar
    height -= 162;
    
    $('.graph').height(height);
}

function update() {
    data.update(function(result) {
        draw();
    });
}

function draw() {
    drawPowerValues();
    drawEnergyValues();
}

function drawPowerValues() {
    var consPower = data.get("use");
    var value = consPower.getLatestValue();
    
    // set the power now value
    if (graph.unit == "energy") {
        if (value < 10000) {
            $("#power-now").html(Math.round(value)+"<span class='unit'>W</span>");
        }
        else {
            $("#power-now").html((value*0.001).toFixed(1)+"<span class='unit'>kW</span>");
        }
    } else {
        // 1000W for an hour (x3600) = 3600000 Joules / 3600,000 = 1.0 kWh x 0.15p = 0.15p/kWh (scaling factor is x3600 / 3600,000 = 0.001)
        var costNow = value*1*config.app.unitcost.value*0.001;
        
        if (costNow < 1.0) {
            $("#power-now").html(config.app.currency.value+costNow.toFixed(3)+"<span class='unit'>/hr</span>");
        }
        else {
            $("#power-now").html(config.app.currency.value+costNow.toFixed(2)+"<span class='unit'>/hr</span>");
        }
    }
}

function drawEnergyValues() {
    var consEnergy = data.get("use_kwh");
    var latestValue = consEnergy.getLatestValue();
    
    var now = new Date();
    now.setHours(0,0,0,0);
    var todayTime = now.getTime();

    var todayEnergy = consEnergy.getDailyEnergy(todayTime);
    if (todayEnergy == null) {
        var latestValue = consEnergy.getLatestValue();
        var todayValue = consEnergy.getTimevalue(todayTime);
        
        if (todayValue == null || todayValue[1] == null) {
            todayValue = [
                consEnergy.getEarliestTime(),
                consEnergy.getEarliestValue()
            ];
        }
        todayEnergy = latestValue - todayValue[1];
    }
    
    if (graph.unit == "energy") {
        $("#energy-today").html(todayEnergy.toFixed(1)+"<span class='unit'>kWh</span>");
    }
    else {
        $("#energy-today").html(config.app.currency.value+(todayEnergy*config.app.unitcost.value).toFixed(2));
    }
}

function wait(condition) {
	if (!condition()) {
	    setTimeout(function() {
		    wait(condition);
		    
		}, 100);
	}
}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function appLog(level, message) {
    if (level == "ERROR") {
        alert(level + ": " + message);
    }
    console.log(level + ": " + message);
}

</script>
