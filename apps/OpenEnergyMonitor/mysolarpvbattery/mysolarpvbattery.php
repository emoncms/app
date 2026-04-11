<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session;
?>

<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/timeseries.js?v=<?php echo $v; ?>"></script> 

<!-- load mysolarpvbattery.css -->
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.css?v=<?php echo $v; ?>" rel="stylesheet">



<section id="app-block" style="display:none" class="block">

    <nav class="app-top-bar d-flex justify-content-between">
        <ul id="tabs" class="btn-list">
            <li><button class="viewhistory app-btn" title="<?php echo tr('View History') ?>">
                <span><?php echo tr("Daily") ?></span>
            </button></li>
        </ul>
        <ul class="btn-list">
            <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><svg class="icon"><use xlink:href="#icon-wrench"></use></svg></button></li>
            <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><svg class="icon"><use xlink:href="#icon-close"></use></svg></button></li>
        </ul>
    </nav>

    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem;">

    <div class="stats-grid">
        <div>
            <h5 class="power-title text-light"><?php echo tr('USE') ?></h5>
            <h2 class="power-value text-primary"><span class="use-now"></span><span class="power-unit"></span></h2>
        </div>
        <div>
            <h5 class="power-title text-light"><span class="balance-label">-</span></h5>
            <h2 class="power-value"><span class="grid-now">0</span><span class="power-unit">W</span></h2>
        </div>
        <div>
            <h5 id="live-solar-title" class="power-title text-light"><?php echo tr('SOLAR') ?></h5>
            <h2 id="live-solar-value" class="power-value text-warning"><span class="solar-now"></span><span class="power-unit"></span></h2>
        </div>
        <div class="battery-section">
            <h5 class="power-title text-light"><span class="d-none d-sm-inline"><?php echo tr('BATTERY'); ?></span> <span class="battery_now_title"><?php echo tr('POWER') ?></span></h5>
            <h2 class="power-value text-quaternary"><span class="battery-now">--</span><span class="power-unit"></span></h2>
        </div>
        <div class="battery-section">
            <h5 class="power-title text-light"><span class="battery_time_left_title"><span class="d-inline d-sm-none"><?php echo tr('TIME LEFT') ?></span><span class="d-none d-sm-inline"><?php echo tr('BATTERY TIME LEFT') ?></span></span></h5>
            <h2 class="power-value text-quaternary"><span class="battery_time_left">--</span></h2>
        </div>
        <div class="battery-section">
            <h5 class="power-title text-light"><span class="d-inline d-sm-none"><?php echo tr('SOC') ?></span><span class="d-none d-sm-inline"><?php echo tr('STATE OF CHARGE') ?></span></h5>
            <h2 class="power-value text-quaternary"><span class="battery_soc">-</span>%</h2>
        </div>
    </div>
    </div>

    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem;">
        <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start">
            <button class='visnav time app-btn' time='1'>1<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='3'>3<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='6'>6<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='24'><?php echo tr('D') ?></button>
            <button class='visnav time app-btn' time='168'><?php echo tr('W') ?></button>
            <button class='visnav time app-btn' time='720'><?php echo tr('M') ?></button>
            <button class='visnav time app-btn' time='8760'><?php echo tr('Y') ?></button>
            <button id='zoomin' class='visnav app-btn' >+</button>
            <button id='zoomout' class='visnav app-btn' >-</button>
            <button id='left' class='visnav app-btn' >&lt;</button>
            <button id='right' class='visnav app-btn' >&gt;</button>
        </div>

        <div id="placeholder_bound">
            <div id="placeholder"></div>
        </div>
    </div>
        
    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem;">

    <table class="statstable">
        <tr>
            <td id="solar-box" class="statsbox solar-section" colspan="3">
                <div class="statsbox-inner-unit">
                    <div id="statsbox-generation" class="statsbox-padded">
                        <div class="statsbox-title"><span class="generationtitle">SOLAR</span></div>
                        <div><span class="statsbox-value total_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div class="prc-solar-to-battery">
                            <span class="statsbox-prc solar_to_battery_prc prc-solar-battery">0</span>
                        </div>
                        <div class="prc-solar-direct">
                            <span class="statsbox-prc solar_direct_prc prc-solar">0</span>
                        </div>
                        <div class="prc-solar-export">
                            <span class="statsbox-prc solar_export_prc prc-solar">0</span>
                        </div>
                    </div>
                </div>
            </td>
            
            <td id="solar-to-grid-box" class="statsbox solar-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_solar_export_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="grid-box" class="statsbox">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">GRID</div>
                    <div><span class="statsbox-value total_grid_balance_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td id="solar-to-battery-box" class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_battery_charge_from_solar_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="grid-to-battery-box" class="statsbox">
                <div id="battery_import" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-left"><div class="statsbox-flow-title">GRID CHARGE</div><span class="statsbox-value total_import_for_battery_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td id="solar-to-load-box" class="statsbox solar-section">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_solar_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="battery-to-grid-box" class="statsbox">
                <div id="battery_export" class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><div class="statsbox-flow-title">BATTERY TO GRID</div><span class="statsbox-value total_battery_to_grid_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
            
            <td id="grid-to-load-box" class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-down"><span class="statsbox-value total_import_direct_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>
        </tr>
        
        <tr>
            <td id="battery-box" class="statsbox">
                <div class="statsbox-padded statsbox-inner-unit">
                    <div class="statsbox-title">BATTERY</div>
                    <div><span class="statsbox-value battery_soc_change">0</span> <span class="statsbox-units">%</span></div>
                </div>
            </td>

            <td id="battery-to-load-box" class="statsbox">
                <div class="statsbox-inner-arrow">
                    <div class="statsbox-padded statsbox-arrow-right"><span class="statsbox-value total_battery_discharge_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                </div>
            </td>

            <td id="house-box" class="statsbox" colspan="3">
                <div class="statsbox-inner-unit">
                    <div class="statsbox-padded">
                        <div class="statsbox-title">HOUSE</div>
                        <div><span class="statsbox-value total_use_kwh">0</span> <span class="statsbox-units">kWh</span></div>
                        <div class="prc-battery-to-house">
                            <span class="statsbox-prc use_from_battery_prc prc-battery">0</span>
                        </div>
                        <div class="prc-solar-to-house">
                            <span class="statsbox-prc use_from_solar_prc prc-solar">0</span>
                        </div>
                        <div class="prc-grid-to-house">
                            <span class="statsbox-prc use_from_import_prc">0</span>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </table>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">This app can be used to explore onsite solar generation, self consumption, battery integration, export and building consumption.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

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
<script src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.js?v=<?php echo $v; ?>"></script>
