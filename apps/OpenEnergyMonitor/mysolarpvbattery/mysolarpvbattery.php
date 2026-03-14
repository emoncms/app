<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 




<style type="text/css">
.statstable {
    width: 100%;
    border-spacing: 10px;
    border-collapse: separate;
}

.statsbox {
    width: 20%;
    text-align: center;
    vertical-align: middle;
    background: #262626;
}

.statsbox-inner-unit {
    color: #333;
}

.statsbox-padded {
    padding: 10px;
}

.statsbox-inner-arrow {
    color: #999;
}

.statsbox-title {
    font-weight: bold;
    font-size: 20px;
    padding-bottom: 15px;
}

.statsbox-value {
    font-weight: bold;
    font-size: 36px;
}

.statsbox-units {
    font-weight: bold;
    font-size: 16px;
}

.statsbox-prc {
    font-weight: normal;
    font-size: 16px;
}

.statsbox-arrow-down {
    position: relative;
    margin-bottom: 16px;
}

.statsbox-arrow-down:after {
    top: 100%;
    left: 50%;
    border: solid transparent;
    content: " ";
    width: 0; 
    height: 0; 
    position: absolute;
    pointer-events: none;
    border-top-color: #999;
    border-width: 16px;
    margin-left: -16px;
}

.statsbox-arrow-right {
    position: relative;
    margin-right: 16px;
}

.statsbox-arrow-right:after {
  left: 100%;
  top: 50%;
  border: solid transparent;
  content: " ";
  width: 0; 
  height: 0; 
  position: absolute;
  pointer-events: none;
  border-left-color: #999;
  border-width: 16px;
  margin-top: -16px;
}

.statsbox-arrow-left {
    position: relative;
    margin-left: 16px;
}

.statsbox-arrow-left:before {
  right: 100%;
  top: 60%;
  border: solid transparent;
  content: " ";
  width: 0; 
  height: 0; 
  position: absolute;
  pointer-events: none;
  border-right-color: #999;
  border-width: 16px;
  margin-top: -16px;
}

.tooltip-item {
}

.tooltip-title {
  color: #aaa;
  font-weight:bold;
  font-size:12px;
}

.tooltip-value {
  color: #fff;
  font-weight:bold;
  font-size:14px;
}

.tooltip-units {
  color: #fff;
  font-weight:bold;
  font-size:10px;
}

/*Small devices (landscape phones, 576px and up)*/
@media (max-width: 576px) {
  #statsbox-generation { padding-bottom:18px; }
  .statsbox-padded { padding: 4px; }
  .statsbox-title { font-size: 14px; padding-bottom: 5px; } /* 20px */
  .statsbox-value { font-size:28px; } /* 36px */
  .statsbox-units { font-size:14px; } /* 16px */
  .statsbox-prc { font-size: 14px; } /* 16px */
  .statsbox-arrow-down:after {
    border-width: 10px;
    margin-left: -10px;
  }
  .statsbox-arrow-right:after {
    border-width: 10px;
    margin-top: -10px;
  }
}

</style>


<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="viewhistory btn btn-large btn-link btn-inverse" title="<?php echo tr('View History') ?>">
            <span class="d-xs-none"><?php echo tr("Hist") ?></span>
            <span class="d-none d-xs-inline"><?php echo tr("History") ?></span>
        </button></li>
    </ul>
    <?php include(dirname(__DIR__).'/config-nav.php'); ?>
</nav>


<section id="app-block" style="display:none" class="block">
    <div class="d-flex justify-content-between">
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('USE') ?></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-primary"><span class="usenow"></span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="balance-label">-</h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-success ">
                <span class="balance"></span>
            </h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('SOLAR') ?></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-warning "><span class="generationnow"></span><span class="power-unit"></span></h2>
        </div>
    </div>
    <div class="d-flex justify-content-between">
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="battery_charge_discharge_title"><?php echo tr('BATTERY POWER') ?></span></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-quaternary"><span class="battery_charge_discharge">-</span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="discharge_time_left_title"><?php echo tr('BATTERY TIME LEFT') ?></span></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-quaternary"><span class="discharge_time_left">-</span></h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('STATE OF CHARGE') ?></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-quaternary"><span class="battery_soc">-</span>%</h2>
        </div>
    </div>

    <?php include(dirname(__DIR__).'/graph-nav.php'); ?>
    
    <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
    </div>
        
    <table class="statstable">
        <tr>
            <td class="statsbox" colspan="3" style="background: #dccc1f">
                <div class="statsbox-inner-unit">
                    <div id="statsbox-generation" class="statsbox-padded" style="position: relative;">
                        <div class="statsbox-title"><span class="generationtitle">SOLAR</span></div>
                        <div><span class="statsbox-value total_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div style="position: absolute; width: 50%; left: 0%; bottom: 0%">
                            <span class="statsbox-prc solar_to_battery_prc">0</span>
                        </div>
                        <div style="position: absolute; width: 50%; left: 50%; bottom: 0%">
                            <span class="statsbox-prc solar_direct_prc">0</span>
                        </div>
                        <div style="position: absolute; height: 100%; right: 0%; top: 0%">
                            <div style="display: table; height: 100%; border-spacing: 0px;">
                            <div style="display: table-cell; vertical-align: middle;">
                            <span class="statsbox-prc solar_export_prc">0</span>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            
            <td class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_solar_export_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td class="statsbox" style="background: #d52e2e">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">GRID</div>
                    <div><span class="statsbox-value total_grid_balance_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_battery_charge_from_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td class="statsbox" style="text-align:left">
                <div id="battery_import" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-left" style="padding:10px 0px 0px 10px"><span style="">GRID CHARGE</span><br><span class="statsbox-value total_import_for_battery_kwh" style="font-size:22px">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_solar_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td class="statsbox" style="text-align:right">
                <div id="battery_export" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right" style="padding:10px 10px 0px 0px"><span style="">BATTERY TO GRID</span><br><span class="statsbox-value total_battery_to_grid_kwh" style="font-size:22px">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_import_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td class="statsbox" style="background: #fb7b50">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">BATTERY</div>
                    <div><span class="statsbox-value battery_soc_change">0</span> <span class="statsbox-units">%</span></div>
                </div>
            </td>

            <td class="statsbox discharge-box">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_battery_discharge_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td class="statsbox" colspan="3" style="background: #82cbfc">
                <div class="statsbox-inner-unit">
                    <div class="statsbox-padded" style="position: relative;">
                        <div class="statsbox-title">HOUSE</div>
                        <div><span class="statsbox-value total_use_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div style="position: absolute; width: 0%; left: 3px; top: 40%">
                            <div><span class="statsbox-prc use_from_battery_prc">0</span></div>
                        </div>
                        <div style="position: absolute; width: 33.33333%; left: 0%; top: 0%">
                            <div><span class="statsbox-prc use_from_solar_prc">0</span></div>
                        </div>
                        <div style="position: absolute; width: 33.33333%; left: 66.66667%; top: 0%">
                            <div><span class="statsbox-prc use_from_import_prc">0</span></div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</section>


<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xappconfig-description">
                <div class="xappconfig-description-inner text-light">
                    <h2 class="appconfig-title text-warning"><?php echo tr('My Solar & Battery'); ?></h2>
                    <p class="lead">
                    This app can be used to explore onsite solar generation, self consumption, battery integration, export and building consumption.</p>
                    <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                    <p><strong class="text-white">History view:</strong> Daily energy flow breakdown feeds can be generated from the power feeds using the <strong class="text-white">Solar battery kWh flows</strong> post-processor (<code>solarbatterykwh</code>).</p>
                    <img src="../Modules/app/images/mysolar_app.png" class="d-none d-sm-inline-block">
                </div>
            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>


<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>

<script src="<?php echo $path; ?>Lib/misc/gettext.js?v=<?php echo $v; ?>"></script> 
<script>
function getTranslations(){
    return {
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
    }
}
</script>
<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});
if (!sessionwrite) $(".openconfig").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    // == Key power feeds ==
    // technically we should only need 3 out of these 4 feeds as they are linked by conservation of energy
    // perhaps this could be intelligently checked in the future to simplify setup
    "use":{"type":"feed", "autoname":"use", "description":"House or building use in watts"},
    "solar":{"type":"feed", "autoname":"solar", "description":"Solar generation in watts"},
    "battery_power":{"type":"feed", "autoname":"battery_power", "description":"Battery power in watts (positive for discharge, negative for charge)"},
    "grid":{"type":"feed", "autoname":"grid", "description":"Grid power in watts (positive for import, negative for export)"},

    // Battery state of charge feed (optional)
    "battery_soc":{"optional":true, "type":"feed", "autoname":"battery_soc", "description":"Battery state of charge in kWh"},

    // History feeds (energy flow breakdown from solarbatterykwh post-processor)
    "solar_to_load_kwh":{"optional":true, "type":"feed", "autoname":"solar_to_load_kwh", "description":"Cumulative solar to load energy in kWh"},
    "solar_to_grid_kwh":{"optional":true, "type":"feed", "autoname":"solar_to_grid_kwh", "description":"Cumulative solar to grid (export) energy in kWh"},
    "solar_to_battery_kwh":{"optional":true, "type":"feed", "autoname":"solar_to_battery_kwh", "description":"Cumulative solar to battery energy in kWh"},
    "battery_to_load_kwh":{"optional":true, "type":"feed", "autoname":"battery_to_load_kwh", "description":"Cumulative battery to load energy in kWh"},
    "battery_to_grid_kwh":{"optional":true, "type":"feed", "autoname":"battery_to_grid_kwh", "description":"Cumulative battery to grid energy in kWh"},
    "grid_to_load_kwh":{"optional":true, "type":"feed", "autoname":"grid_to_load_kwh", "description":"Cumulative grid to load energy in kWh"},
    "grid_to_battery_kwh":{"optional":true, "type":"feed", "autoname":"grid_to_battery_kwh", "description":"Cumulative grid to battery energy in kWh"},

    // Other options
    "kw":{"type":"checkbox", "default":0, "name": "Show kW", "description": "Display power as kW"},
    "battery_capacity_kwh":{"type":"value", "default":0, "name":"Battery Capacity", "description":"Battery capacity in kWh"}
    }

config.id = <?php echo $id; ?>;
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){hide()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

var live = false;
var show_battery_soc = 1;
var reload = true;
var autoupdate = true;
var lastupdate = +new Date;
var viewmode = "powergraph";
var historyseries = [];
var powerseries = [];
var latest_start_time = 0;
var panning = false;
var bargraph_initialized = false;
var bargraph_loaded = false;

var timeWindow = (3600000*24.0*30);
var history_end = +new Date;
var history_start = history_end - timeWindow;

timeWindow = (3600000*6.0*1);
var power_end = +new Date;
var power_start = power_end - timeWindow;

var live_timerange = timeWindow;

var meta = {};
var power_graph_end_time = 0;

config.init();

// App start function
function init()
{        
    app_log("INFO","solar & battery init");

    view.end = power_end;
    view.start = power_start;

    if (config.app.use.value) {
        meta['use'] = feed.getmeta(config.app.use.value);
        if (meta['use'].end_time>power_graph_end_time) power_graph_end_time = meta['use'].end_time;
    }

    if (config.app.solar.value) {
        meta['solar'] = feed.getmeta(config.app.solar.value);
        if (meta['solar'].end_time>power_graph_end_time) power_graph_end_time = meta['solar'].end_time;
    }

    // If the feed is more than 1 hour behind then start the view at the end of the feed
    if ((view.end*0.001-power_graph_end_time)>3600) {
        view.end = power_graph_end_time*1000;
        autoupdate = false;
    }
    view.start = view.end - timeWindow;
    live_timerange = timeWindow;
  
    if (config.app.solar_to_load_kwh.value && config.app.solar_to_grid_kwh.value && config.app.solar_to_battery_kwh.value &&
        config.app.battery_to_load_kwh.value && config.app.battery_to_grid_kwh.value &&
        config.app.grid_to_load_kwh.value && config.app.grid_to_battery_kwh.value) {
        init_bargraph();
        $(".viewhistory").show();
    } else {
        $(".viewhistory").hide();
    }
    
    // The buttons for these powergraph events are hidden when in historic mode 
    // The events are loaded at the start here and dont need to be unbinded and binded again.
    $("#zoomout").click(function () {view.zoomout(); reload = true; autoupdate = false; draw(true);});
    $("#zoomin").click(function () {view.zoomin(); reload = true; autoupdate = false; draw(true);});
    $('#right').click(function () {view.panright(); reload = true; autoupdate = false; draw(true);});
    $('#left').click(function () {view.panleft(); reload = true; autoupdate = false; draw(true);});
    
    $('.time').click(function () {
        view.timewindow($(this).attr("time")/24.0); 
        reload = true; 
        autoupdate = true;
        live_timerange = view.end - view.start;
        draw(true);
    });
    
    $(".viewhistory").click(function () {
        $btn = $(this);
        $btn.toggleClass('active');
        
        $('.balanceline').attr('disabled', $btn.is('.active'));
        viewmode = $btn.is('.active') ? 'bargraph' : 'powergraph';
        
        if (viewmode=="bargraph") {
            power_start = view.start
            power_end = view.end
            view.start = history_start
            view.end = history_end
            if (bargraph_loaded) {
                draw(false); 
            } else {
                bargraph_loaded = true;
                draw(true);
            }
            bargraph_events();
        } else {
            history_start = view.start
            history_end = view.end
            view.start = power_start
            view.end = power_end
            draw(false);
            powergraph_events();
        }
    });
}

function show() 
{
    app_log("INFO","solar & battery show");
    
    if (config.app.solar_to_load_kwh.value && config.app.solar_to_grid_kwh.value && config.app.solar_to_battery_kwh.value &&
        config.app.battery_to_load_kwh.value && config.app.battery_to_grid_kwh.value &&
        config.app.grid_to_load_kwh.value && config.app.grid_to_battery_kwh.value) {
        if (!bargraph_initialized) init_bargraph();
    }
    
    load_powergraph();
    resize();
    powergraph_events();
    
    livefn();
    live = setInterval(livefn,5000);

}

function resize() 
{
    app_log("INFO","solar & battery resize");
    
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var is_landscape = $(window).height() < $(window).width();
    var width = placeholder_bound.width();
    var height = $(window).height()*(is_landscape ? 0.3: 0.3);

    if (height>width) height = width;
    if (height<180) height = 180;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height-top_offset);
    
    draw(false)
}

function hide() 
{
    clearInterval(live);
}

function livefn()
{
    // Check if the updater ran in the last 60s if it did not the app was sleeping
    // and so the data needs a full reload.
    var now = +new Date();
    if ((now-lastupdate)>60000) reload = true;
    lastupdate = now;
    var powerUnit = config.app && config.app.kw && config.app.kw.value===true ? 'kW' : 'W';

    var feeds = feed.listbyid();
    if (feeds === null) { return; }
    var solar_now = parseInt(feeds[config.app.solar.value].value);
    var use_now = parseInt(feeds[config.app.use.value].value);
    // battery_power: positive = discharge, negative = charge
    var battery_power_now = parseInt(feeds[config.app.battery_power.value].value);
    // grid: positive = import, negative = export
    var grid_now = parseInt(feeds[config.app.grid.value].value);
    
    var battery_soc_now = "---";
    if (config.app.battery_soc.value && feeds[config.app.battery_soc.value] != undefined) {
        battery_soc_now = parseInt(feeds[config.app.battery_soc.value].value);
    }
    
    if (autoupdate) {
        var updatetime = feeds[config.app.solar.value].time;
        timeseries.append("solar",updatetime,solar_now);
        timeseries.trim_start("solar",view.start*0.001);
        timeseries.append("use",updatetime,use_now);
        timeseries.trim_start("use",view.start*0.001);
        
        timeseries.append("battery_power",updatetime,battery_power_now);
        timeseries.trim_start("battery_power",view.start*0.001);
        timeseries.append("grid",updatetime,grid_now);
        timeseries.trim_start("grid",view.start*0.001);
        
        if (config.app.battery_soc.value) {
            timeseries.append("battery_soc",updatetime,battery_soc_now);
            timeseries.trim_start("battery_soc",view.start*0.001);
        }
       
        // Advance view
        view.end = now;
        view.start = now - live_timerange;
    }

    // Conservation of energy: use = solar + battery_power + grid
    use_now = solar_now + battery_power_now + grid_now;

    var battery_charge_now = 0;
    var battery_discharge_now = 0;
    if (battery_power_now > 0) {
        battery_discharge_now = battery_power_now;
    } else {
        battery_charge_now = -battery_power_now;
    }

    // balance = grid export (positive) or import (negative), shown from grid perspective
    // negative grid_now = export = positive balance
    var balance = -grid_now;
    
    // convert W to kW
    if(powerUnit === 'kW') {
        gen_now = as_kw(solar_now)
        solar_now = as_kw(solar_now)
        use_now = as_kw(use_now)
        balance = as_kw(balance)
        battery_charge_now = as_kw(battery_charge_now)
        battery_discharge_now = as_kw(battery_discharge_now)
        $('.power-unit').text('kW')
        $('#app-block').addClass('in_kw');
    } else {
        solar_now = Math.round(solar_now)
        gen_now = solar_now
        balance = Math.round(balance)
        $('.power-unit').text('W')
        $('#app-block').removeClass('in_kw');
    }

    if (balance==0) {
        $(".balance-label").html("PERFECT BALANCE");
        $(".balance").html("--");
    }
    
    if (balance>0) {
        $(".balance-label").html("EXPORTING");
        $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }
    
    if (balance<0) {
        $(".balance-label").html("IMPORTING");
        $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+powerUnit+"</b></span>");
    }
    
    $(".generationnow").html(gen_now);
    $(".usenow").html(use_now);
    $(".battery_soc").html(battery_soc_now);

    const net_battery_charge = battery_charge_now - battery_discharge_now;
    if (net_battery_charge>0) {
        $(".battery_charge_discharge_title").html("BATTERY CHARGING");
        $(".battery_charge_discharge").html(net_battery_charge);
        $(".discharge_time_left").html("--");
    } else if (net_battery_charge<0) {
        if (config.app.battery_capacity_kwh.value > 0 && battery_soc_now >= 0 && powerUnit === 'kW') {
            const total_capacity = config.app.battery_capacity_kwh.value;
            const energy_remaining = total_capacity * battery_soc_now / 100;
            const total_time_left_mins = (energy_remaining / -(net_battery_charge)) * 60;

            const hours_left = Math.floor(total_time_left_mins / 60);
            const mins_left = Math.floor(total_time_left_mins % 60);
            const battery_time_left_text = `${hours_left}h ${mins_left}m`
            $(".discharge_time_left").html(battery_time_left_text);
        } else {
            $(".discharge_time_left").html("--");
        }

        $(".battery_charge_discharge_title").html("BATTERY DISCHARGING");
        $(".battery_charge_discharge").html(-net_battery_charge);
    } else {
        $(".battery_charge_discharge_title").html("BATTERY POWER");
        $(".battery_charge_discharge").html(0);
        $(".discharge_time_left").html("--");
    }
    
    // Only redraw the graph if its the power graph and auto update is turned on
    if (viewmode=="powergraph" && autoupdate) draw(true);
}

function draw(load) {
    if (viewmode=="powergraph") {
        if (load) load_powergraph();
        draw_powergraph();
    }
    if (viewmode=="bargraph") {
        if (load) load_bargraph();
        draw_bargraph();
    }
}

function load_powergraph() {
    view.calc_interval(1500); // npoints = 1500;
    
    // -------------------------------------------------------------------------------------------------------
    // LOAD DATA ON INIT OR RELOAD
    // -------------------------------------------------------------------------------------------------------
    if (reload) {
        reload = false;
        // getdata params: feedid,start,end,interval,average=0,delta=0,skipmissing=0,limitinterval=0,callback=false,context=false,timeformat='unixms'
        timeseries.load("solar",feed.getdata(config.app.solar.value,view.start,view.end,view.interval,1,0,0,0,false,false,'notime'));
        timeseries.load("use",feed.getdata(config.app.use.value,view.start,view.end,view.interval,1,0,0,0,false,false,'notime'));
        timeseries.load("battery_power",feed.getdata(config.app.battery_power.value,view.start,view.end,view.interval,1,0,0,0,false,false,'notime'));
        timeseries.load("grid",feed.getdata(config.app.grid.value,view.start,view.end,view.interval,1,0,0,0,false,false,'notime'));
        
        if (config.app.battery_soc.value) {
            timeseries.load("battery_soc",feed.getdata(config.app.battery_soc.value,view.start,view.end,view.interval,0,0,0,0,false,false,'notime'));
        }
    }
    // -------------------------------------------------------------------------------------------------------
    
    var solar_to_load_data = [];
    var solar_to_grid_data = [];
    var solar_to_battery_data = [];
    var battery_to_load_data = [];
    var battery_to_grid_data = [];
    var grid_to_load_data = [];
    var grid_to_battery_data = [];
    var battery_soc_data = [];
    
    var use_now = 0;
    var solar_now = 0;
    var battery_power_now = 0;
    var grid_now = 0;
    var battery_soc_now = 0;
    
    var total_solar_kwh = 0;
    var total_use_kwh = 0;
    var total_import_kwh = 0;
    var total_export_kwh = 0;
    var total_solar_to_load_kwh = 0;
    var total_solar_to_grid_kwh = 0;
    var total_solar_to_battery_kwh = 0;
    var total_battery_to_load_kwh = 0;
    var total_battery_to_grid_kwh = 0;
    var total_grid_to_load_kwh = 0;
    var total_grid_to_battery_kwh = 0;
    
    var datastart = timeseries.start_time("solar");
    
    var last_solar = 0;
    var last_use = 0;
    var last_battery_power = 0;
    var last_grid = 0;
    var last_soc = 0;
    
    var timeout = 600*1000;
    
    var interval = view.interval;
    var power_to_kwh = interval / 3600000.0;

    for (var z=0; z<timeseries.length("solar"); z++) {
        var time = datastart + (1000 * interval * z);
        
        if (timeseries.value("solar",z)!=null) {
            solar_now = timeseries.value("solar",z);
            last_solar = time;
        }
        if (timeseries.value("use",z)!=null) {
            use_now = timeseries.value("use",z);
            last_use = time;
        }
        if (timeseries.value("battery_power",z)!=null) {
            battery_power_now = timeseries.value("battery_power",z);
            last_battery_power = time;
        }
        if (timeseries.value("grid",z)!=null) {
            grid_now = timeseries.value("grid",z);
            last_grid = time;
        }
        if (config.app.battery_soc.value && timeseries.value("battery_soc",z)!=null) {
            battery_soc_now = timeseries.value("battery_soc",z);
            last_soc = time;
        }
                
        if ((time-last_solar)<timeout && (time-last_use)<timeout && (time-last_battery_power)<timeout && (time-last_grid)<timeout) {
            
            // -------------------------------------------------------------------------------------------------------
            // Flow decomposition (matching solartest.js logic)
            // Conservation of energy: use = solar + battery_power + grid
            // battery_power: positive = discharge, negative = charge
            // grid: positive = import, negative = export
            // -------------------------------------------------------------------------------------------------------
            var use = solar_now + battery_power_now + grid_now;
            var solar = solar_now;
            var battery_power = battery_power_now;
            var grid = grid_now;

            var import_power = 0;
            var export_power = 0;
            if (grid > 0) {
                import_power = grid;
            } else {
                export_power = -grid;
            }

            // SOLAR flows
            var solar_to_load = Math.min(solar, use);
            var solar_to_battery = 0;
            if (battery_power < 0) {
                // Battery is charging: solar to battery is the lesser of available solar and battery charge power
                solar_to_battery = Math.min(solar - solar_to_load, -battery_power);
            }
            var solar_to_grid = solar - solar_to_load - solar_to_battery;

            // BATTERY flows
            var battery_to_load = 0;
            var battery_to_grid = 0;
            if (battery_power > 0) {
                // Battery is discharging
                battery_to_load = Math.min(battery_power, use - solar_to_load);
                battery_to_grid = battery_power - battery_to_load;
            }

            // GRID flows
            var grid_to_load = 0;
            var grid_to_battery = 0;
            if (import_power > 0) {
                grid_to_load = Math.min(import_power, use - solar_to_load - battery_to_load);
                grid_to_battery = Math.min(import_power - grid_to_load, battery_power < 0 ? -battery_power - solar_to_battery : 0);
            }

            // Accumulate kWh totals
            total_solar_kwh += solar * power_to_kwh;
            total_use_kwh += use * power_to_kwh;
            total_import_kwh += import_power * power_to_kwh;
            total_export_kwh += export_power * power_to_kwh;
            total_solar_to_load_kwh += solar_to_load * power_to_kwh;
            total_solar_to_grid_kwh += solar_to_grid * power_to_kwh;
            total_solar_to_battery_kwh += solar_to_battery * power_to_kwh;
            total_battery_to_load_kwh += battery_to_load * power_to_kwh;
            total_battery_to_grid_kwh += battery_to_grid * power_to_kwh;
            total_grid_to_load_kwh += grid_to_load * power_to_kwh;
            total_grid_to_battery_kwh += grid_to_battery * power_to_kwh;

            solar_to_load_data.push([time, solar_to_load]);
            solar_to_grid_data.push([time, solar_to_grid]);
            solar_to_battery_data.push([time, solar_to_battery]);
            battery_to_load_data.push([time, battery_to_load]);
            battery_to_grid_data.push([time, battery_to_grid]);
            grid_to_load_data.push([time, grid_to_load]);
            grid_to_battery_data.push([time, grid_to_battery]);
            battery_soc_data.push([time, battery_soc_now]);
        } else {
            solar_to_load_data.push([time, null]);
            solar_to_grid_data.push([time, null]);
            solar_to_battery_data.push([time, null]);
            battery_to_load_data.push([time, null]);
            battery_to_grid_data.push([time, null]);
            grid_to_load_data.push([time, null]);
            grid_to_battery_data.push([time, null]);
            battery_soc_data.push([time, null]);
        }
    }
    
    // Derived totals for display
    var total_solar_direct_kwh = total_solar_to_load_kwh;
    var total_solar_export_kwh = total_solar_to_grid_kwh;           // solar→grid only
    var total_all_export_kwh = total_solar_to_grid_kwh + total_battery_to_grid_kwh; // total export for grid balance
    var total_battery_charge_from_solar_kwh = total_solar_to_battery_kwh;
    var total_import_direct_kwh = total_grid_to_load_kwh;
    var total_import_for_battery_kwh = total_grid_to_battery_kwh;
    var total_battery_discharge_kwh = total_battery_to_load_kwh;   // battery→load only
    var total_grid_balance_kwh = total_import_kwh - total_all_export_kwh;
    
    $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
    $(".total_use_kwh").html(total_use_kwh.toFixed(1));
    $(".total_import_direct_kwh").html(total_import_direct_kwh.toFixed(1));
    $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
    if (total_solar_kwh) {
        $(".total_solar_direct_kwh").html(total_solar_direct_kwh.toFixed(1));
        $(".total_solar_export_kwh").html(total_solar_export_kwh.toFixed(1));
        $(".solar_export_prc").html((100*total_solar_export_kwh/total_solar_kwh).toFixed(0)+"%");
        $(".solar_direct_prc").html((100*total_solar_direct_kwh/total_solar_kwh).toFixed(0)+"%");
        $(".solar_to_battery_prc").html((100*total_battery_charge_from_solar_kwh/total_solar_kwh).toFixed(0)+"%");
        
        $(".use_from_solar_prc").html((100*total_solar_direct_kwh/total_use_kwh).toFixed(0)+"%");
    }
    $(".use_from_import_prc").html((100*total_import_direct_kwh/total_use_kwh).toFixed(0)+"%");
    $(".total_battery_charge_from_solar_kwh").html(total_battery_charge_from_solar_kwh.toFixed(1));
    $(".total_import_for_battery_kwh").html(total_import_for_battery_kwh.toFixed(1));
    $(".total_battery_discharge_kwh").html(total_battery_discharge_kwh.toFixed(1));
    $(".total_battery_to_grid_kwh").html(total_battery_to_grid_kwh.toFixed(1));
    $(".use_from_battery_prc").html((100*total_battery_to_load_kwh/total_use_kwh).toFixed(0)+"%");
    
    if (total_import_for_battery_kwh>=0.1) {
        $("#battery_import").show();
    } else {
        $("#battery_import").hide();
    }
    
    if (total_battery_to_grid_kwh>=0.1) {
        $("#battery_export").show();
    } else {
        $("#battery_export").hide();
    }
    
    
    var soc_change = 0; 
    if (config.app.battery_soc.value) {
        soc_change = battery_soc_now-timeseries.value("battery_soc",0);
    }
    var sign = ""; if (soc_change>0) sign = "+";
    $(".battery_soc_change").html(sign+soc_change.toFixed(1));
    
    powerseries = [];

    powerseries.push({data: solar_to_load_data,    label: "Solar to Load",    color: "#abddff", stack: 1, lines: {lineWidth: 0, fill: 0.75}});
    powerseries.push({data: solar_to_grid_data,    label: "Solar to Grid",    color: "#dccc1f", stack: 1, lines: {lineWidth: 0, fill: 1.0}});
    powerseries.push({data: solar_to_battery_data, label: "Solar to Battery", color: "#fba050", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: battery_to_load_data,  label: "Battery to Load",  color: "#ffd08e", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: battery_to_grid_data,  label: "Battery to Grid",  color: "#fabb68", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_load_data,     label: "Grid to Load",     color: "#82cbfc", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    powerseries.push({data: grid_to_battery_data,  label: "Grid to Battery",  color: "#fb7b50", stack: 1, lines: {lineWidth: 0, fill: 0.8}});
    
    if (show_battery_soc && config.app.battery_soc.value) powerseries.push({data:battery_soc_data, label: "SOC", yaxis:2, color: "#888"});
}

function draw_powergraph() {

    var options = {
        lines: { fill: false },
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
        yaxes: [{ min: 0 },{ min: 0, max: 100 }],
        grid: { hoverable: true, clickable: true },
        selection: { mode: "x" },
        legend: { show: false }
    }
    
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    $.plot($('#placeholder'),powerseries,options);
    $(".ajax-loader").hide();
}

// ------------------------------------------------------------------------------------------
// POWER GRAPH EVENTS
// ------------------------------------------------------------------------------------------
function powergraph_events() {
    $(".visnav[time=1]").show();
    $(".visnav[time=3]").show();
    $(".visnav[time=6]").show();
    $(".visnav[time=24]").show();
            
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
                        tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "%"]);
                    } else {
                        if ( series.data[item.dataIndex][1] >= 1000) {
                            tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0)/1000 , "kW"]);
                        } else {
                            tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(0), "W"]);
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
    // Fetch the earliest start_time across all flow kWh feeds - this is used for the 'all time' button
    var earliest_start_time = Infinity;
    var flow_feeds = [
        config.app.solar_to_load_kwh.value,
        config.app.solar_to_grid_kwh.value,
        config.app.solar_to_battery_kwh.value,
        config.app.battery_to_load_kwh.value,
        config.app.battery_to_grid_kwh.value,
        config.app.grid_to_load_kwh.value,
        config.app.grid_to_battery_kwh.value
    ];
    for (var i = 0; i < flow_feeds.length; i++) {
        var m = feed.getmeta(flow_feeds[i]);
        if (m.start_time < earliest_start_time) earliest_start_time = m.start_time;
    }
    latest_start_time = earliest_start_time;
    view.first_data = latest_start_time * 1000;
}

function load_bargraph() {
    var interval = 3600*24;
    var intervalms = interval * 1000;
    
    var end = view.end;
    var start = view.start;
    
    end = Math.ceil(end/intervalms)*intervalms;
    start = Math.floor(start/intervalms)*intervalms;
    
    // Load energy flow kWh data directly from post-processor feeds
    var solar_to_load_kwh_data    = feed.getdata(config.app.solar_to_load_kwh.value,   start,end,"daily",0,1);
    var solar_to_grid_kwh_data    = feed.getdata(config.app.solar_to_grid_kwh.value,   start,end,"daily",0,1);
    var solar_to_battery_kwh_data = feed.getdata(config.app.solar_to_battery_kwh.value,start,end,"daily",0,1);
    var battery_to_load_kwh_data  = feed.getdata(config.app.battery_to_load_kwh.value, start,end,"daily",0,1);
    var battery_to_grid_kwh_data  = feed.getdata(config.app.battery_to_grid_kwh.value, start,end,"daily",0,1);
    var grid_to_load_kwh_data     = feed.getdata(config.app.grid_to_load_kwh.value,    start,end,"daily",0,1);
    var grid_to_battery_kwh_data  = feed.getdata(config.app.grid_to_battery_kwh.value, start,end,"daily",0,1);
    
    // Per-day arrays for graph and hover access
    solar_to_load_kwhd_data    = [];
    solar_to_grid_kwhd_data    = [];
    solar_to_battery_kwhd_data = [];
    battery_to_load_kwhd_data  = [];
    battery_to_grid_kwhd_data  = [];
    grid_to_load_kwhd_data     = [];
    grid_to_battery_kwhd_data  = [];
    
    if (solar_to_load_kwh_data.length) {
        for (var day=0; day<solar_to_load_kwh_data.length; day++)
        {
            var time = solar_to_load_kwh_data[day][0];
            
            var solar_to_load    = solar_to_load_kwh_data[day][1];
            var solar_to_grid    = solar_to_grid_kwh_data[day][1];
            var solar_to_battery = solar_to_battery_kwh_data[day][1];
            var battery_to_load  = battery_to_load_kwh_data[day][1];
            var battery_to_grid  = battery_to_grid_kwh_data[day][1];
            var grid_to_load     = grid_to_load_kwh_data[day][1];
            var grid_to_battery  = grid_to_battery_kwh_data[day][1];
            
            if (solar_to_load!=null && solar_to_grid!=null && solar_to_battery!=null &&
                battery_to_load!=null && battery_to_grid!=null &&
                grid_to_load!=null && grid_to_battery!=null)
            {
                solar_to_load_kwhd_data.push([time, solar_to_load]);
                solar_to_grid_kwhd_data.push([time, solar_to_grid]);
                solar_to_battery_kwhd_data.push([time, solar_to_battery]);
                battery_to_load_kwhd_data.push([time, battery_to_load]);
                battery_to_grid_kwhd_data.push([time, battery_to_grid]);
                grid_to_load_kwhd_data.push([time, grid_to_load]);
                grid_to_battery_kwhd_data.push([time, grid_to_battery]);
            }
        }
    }
    
    var series = [];

    // Stack 1: onsite use breakdown (solar direct, battery to load, grid to load shown as positive bars)
    series.push({
        data: solar_to_load_kwhd_data,
        label: "Solar to Load",
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
        stack: 1
    });
    series.push({
        data: battery_to_load_kwhd_data,
        label: "Battery to Load",
        color: "#fbb450",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
        stack: 1
    });
    series.push({
        data: grid_to_load_kwhd_data,
        label: "Grid to Load",
        color: "#82cbfc",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
        stack: 1
    });
    // Stack 0: exports (shown as negative bars below zero) - build inline
    var export_kwhd_data = [];
    for (var i = 0; i < solar_to_grid_kwhd_data.length; i++) {
        export_kwhd_data.push([solar_to_grid_kwhd_data[i][0], -1 * (solar_to_grid_kwhd_data[i][1] + battery_to_grid_kwhd_data[i][1])]);
    }
    series.push({
        data: export_kwhd_data,
        label: "Total Export",
        color: "#dccc1f",
        bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 0.9, lineWidth: 0 },
        stack: 0
    });
    
    historyseries = series;
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
        grid: { hoverable: true, clickable: true, markings: markings },
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
    $(".visnav[time=1]").hide();
    $(".visnav[time=3]").hide();
    $(".visnav[time=6]").hide();
    $(".visnav[time=24]").hide();
            
    $('#placeholder').unbind("plotclick");
    $('#placeholder').unbind("plothover");
    $('#placeholder').unbind("plotselected");
    $('.bargraph-viewall').unbind("click");
    
    // Show day's figures on the bottom of the page
    
    $('#placeholder').bind("plothover", function (event, pos, item)
    {
        if (item) {
            var z = item.dataIndex;
            
            // Read directly from the fine-grained flow feed data arrays
            var total_solar_to_load    = solar_to_load_kwhd_data[z][1];
            var total_solar_to_grid    = solar_to_grid_kwhd_data[z][1];
            var total_solar_to_battery = solar_to_battery_kwhd_data[z][1];
            var total_battery_to_load  = battery_to_load_kwhd_data[z][1];
            var total_battery_to_grid  = battery_to_grid_kwhd_data[z][1];
            var total_grid_to_load     = grid_to_load_kwhd_data[z][1];
            var total_grid_to_battery  = grid_to_battery_kwhd_data[z][1];

            // Reconstruct aggregate totals
            var total_solar_kwh  = total_solar_to_load + total_solar_to_grid + total_solar_to_battery;
            var total_use_kwh    = total_solar_to_load + total_battery_to_load + total_grid_to_load;
            var total_import_kwh = total_grid_to_load + total_grid_to_battery;
            var total_export_kwh = total_solar_to_grid + total_battery_to_grid;
            var total_grid_balance_kwh = total_import_kwh - total_export_kwh;

            $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
            $(".total_use_kwh").html(total_use_kwh.toFixed(1));
            $(".total_import_direct_kwh").html(total_grid_to_load.toFixed(1));
            $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
            if (total_solar_kwh) {
                $(".total_solar_direct_kwh").html(total_solar_to_load.toFixed(1));
                $(".total_solar_export_kwh").html(total_solar_to_grid.toFixed(1));
                $(".solar_export_prc").html((100*total_solar_to_grid/total_solar_kwh).toFixed(0)+"%");
                $(".solar_direct_prc").html((100*total_solar_to_load/total_solar_kwh).toFixed(0)+"%");
                $(".solar_to_battery_prc").html((100*total_solar_to_battery/total_solar_kwh).toFixed(0)+"%");
                
                $(".use_from_solar_prc").html((100*total_solar_to_load/total_use_kwh).toFixed(0)+"%");
            }
            $(".use_from_import_prc").html((100*total_grid_to_load/total_use_kwh).toFixed(0)+"%");
            $(".total_battery_charge_from_solar_kwh").html(total_solar_to_battery.toFixed(1));
            $(".total_import_for_battery_kwh").html(total_grid_to_battery.toFixed(1));
            $(".total_battery_discharge_kwh").html(total_battery_to_load.toFixed(1));
            $(".total_battery_to_grid_kwh").html(total_battery_to_grid.toFixed(1));
            $(".use_from_battery_prc").html((100*total_battery_to_load/total_use_kwh).toFixed(0)+"%");
            
            if (total_grid_to_battery>=0.1) {
                $("#battery_import").show();
            } else {
                $("#battery_import").hide();
            }
            
            if (total_battery_to_grid>=0.1) {
                $("#battery_export").show();
            } else {
                $("#battery_export").hide();
            }
            
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
            
            history_start = view.start
            history_end = view.end
            view.start = solar_to_load_kwhd_data[z][0];
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

// ------------------------------------------------------------------------------------------
// TOOLTIP HANDLING
// Show & hide the tooltip
// ------------------------------------------------------------------------------------------
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
        $('<td style="padding-right: 8px"><span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    }

    tooltip
        .css({
            left: x,
            top: y
        })
        .show();
}

function hide_tooltip() {
    $('#tooltip').hide();
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        resize()
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    // if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
