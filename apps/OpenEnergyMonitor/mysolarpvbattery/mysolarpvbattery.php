<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 

<!-- load mysolarpvbattery.css -->
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.css?v=4" rel="stylesheet">



<section id="app-block" style="display:none" class="block">

    <nav id="buttons" class="d-flex justify-content-between">
        <ul id="tabs" class="nav nav-pills mb-0">
            <li><button class="viewhistory btn btn-large btn-link btn-inverse" title="<?php echo tr('View History') ?>">
                <span class="d-xs-none"><?php echo tr("Hist") ?></span>
                <span class="d-none d-xs-inline"><?php echo tr("History") ?></span>
            </button></li>
        </ul>
        <?php include(dirname(__DIR__).'/config-nav.php'); ?>
    </nav>


    <div class="stats-grid">
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo tr('USE') ?></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-primary"><span class="usenow"></span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="balance-label">-</span></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-success"><span class="balance"></span></h2>
        </div>
        <div class="text-xs-center solar-section">
            <h5 id="live-solar-title" class="electric-title mb-0 text-md-larger text-light"><?php echo tr('SOLAR') ?></h5>
            <h2 id="live-solar-value" class="power-value display-md-3 display-lg-2 my-0 text-warning"><span class="solarnow"></span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center battery-section">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="battery_now_title"><?php echo tr('BATTERY POWER') ?></span></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-quaternary"><span class="battery_now">-</span><span class="power-unit"></span></h2>
        </div>
        <div class="text-xs-center battery-section">
            <h5 class="electric-title mb-0 text-md-larger text-light"><span class="battery_time_left_title"><?php echo tr('BATTERY TIME LEFT') ?></span></h5>
            <h2 class="power-value display-md-3 display-lg-2 my-0 text-quaternary"><span class="battery_time_left">-</span></h2>
        </div>
        <div class="text-xs-center battery-section">
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
            <td id="solar-box" class="statsbox solar-section" colspan="3" style="background: #dccc1f">
                <div class="statsbox-inner-unit">
                    <div id="statsbox-generation" class="statsbox-padded" style="position: relative;">
                        <div class="statsbox-title"><span class="generationtitle">SOLAR</span></div>
                        <div><span class="statsbox-value total_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div style="position: absolute; width: 50%; left: 0%; bottom: 0%">
                            <span class="statsbox-prc solar_to_battery_prc prc-solar-battery">0</span>
                        </div>
                        <div style="position: absolute; width: 50%; left: 50%; bottom: 0%">
                            <span class="statsbox-prc solar_direct_prc prc-solar">0</span>
                        </div>
                        <div style="position: absolute; height: 100%; right: 0%; top: 0%">
                            <div style="display: table; height: 100%; border-spacing: 0px;">
                            <div style="display: table-cell; vertical-align: middle;">
                            <span class="statsbox-prc solar_export_prc prc-solar">0</span>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            
            <td id="solar-to-grid-box" class="statsbox solar-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_solar_export_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="grid-box" class="statsbox" style="background: #d52e2e">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">GRID</div>
                    <div><span class="statsbox-value total_grid_balance_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td id="charge-from-solar-box" class="statsbox battery-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_battery_charge_from_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="grid-charge-box" class="statsbox battery-section" style="text-align:left">
                <div id="battery_import" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-left" style="padding:10px 0px 0px 10px"><div class="statsbox-flow-title">GRID CHARGE</div><span class="statsbox-value total_import_for_battery_kwh" style="font-size:22px">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td id="solar-to-load-box" class="statsbox solar-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_solar_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="battery-to-grid-box" class="statsbox battery-section" style="text-align:right">
                <div id="battery_export" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right" style="padding:10px 10px 0px 0px"><div class="statsbox-flow-title">BATTERY TO GRID</div><span class="statsbox-value total_battery_to_grid_kwh" style="font-size:22px">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td id="grid-to-load-box" class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_import_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td id="battery-box" class="statsbox battery-section" style="background: #fb7b50">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">BATTERY</div>
                    <div><span class="statsbox-value battery_soc_change">0</span> <span class="statsbox-units">%</span></div>
                </div>
            </td>

            <td id="discharge-box" class="statsbox battery-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_battery_discharge_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="house-box" class="statsbox" colspan="3" style="background: #82cbfc">
                <div class="statsbox-inner-unit">
                    <div class="statsbox-padded" style="position: relative;">
                        <div class="statsbox-title">HOUSE</div>
                        <div><span class="statsbox-value total_use_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div style="position: absolute; width: 0%; left: 3px; top: 40%">
                            <div><span class="statsbox-prc use_from_battery_prc prc-battery">0</span></div>
                        </div>
                        <div style="position: absolute; width: 33.33333%; left: 0%; top: 0%">
                            <div><span class="statsbox-prc use_from_solar_prc prc-solar">0</span></div>
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

<div id="appconf-description" style="display:none">
    <p class="lead">This app can be used to explore onsite solar generation, self consumption, battery integration, export and building consumption.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>

<script src="<?php echo $path; ?>Lib/misc/gettext.js?v=<?php echo $v; ?>"></script> 
<script>
// Function to get translations for JavaScript
function getTranslations(){
    return {
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
    }
}


// Set up config object - used by mysolarpvbattery.js
var apikey = "<?php echo isset($apikey) ? $apikey : ''; ?>";
var sessionwrite = <?php echo isset($session['write']) ? intval($session['write']) : 0; ?>;

config.app_name = "My Solar PV Battery";
config.app_name_color = "#dccc1f";
config.id = <?php echo isset($id) ? intval($id) : 0; ?>;
config.name = "<?php echo isset($name) ? addslashes($name) : ''; ?>";
config.public = <?php echo isset($public) ? intval($public) : 0; ?>;
config.db = <?php echo isset($config) ? json_encode($config) : 'null'; ?>;

</script>

<!-- load mysolarpvbattery.js -->
<script src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.js?v=12"></script>
