<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/solartemplate/solartemplate.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link viewpower active" title="<?php echo tr('Power View') ?>"><i class="svg-icon-sun"></i><?php echo tr('Power') ?></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>

        <div class="app-live">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span id="powernow">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span id="grid-label"><?php echo tr('BALANCED') ?></span></div>
                <div class="app-live-value" id="grid-value"><span id="gridnow">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span id="solarnow">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('BATTERY') ?> &middot; <span id="battery-label"><?php echo tr('POWER') ?></span></div>
                <div class="app-live-value" id="battery-value"><span id="batterynow">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('BAT SOC') ?></div>
                <div class="app-live-value text-battery"><span id="socnow">--</span><span class="power-unit-static">%</span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php include "Modules/app/Lib/timebar.php"; ?>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="graph_bound">
            <div id="graph"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

    <div class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy') ?> &middot; <?php echo tr('this window') ?></span>
        </div>
        <div class="app-live">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span id="use_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span id="solar_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('IMPORT') ?></div>
                <div class="app-live-value text-import"><span id="import_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('EXPORT') ?></div>
                <div class="app-live-value text-export"><span id="export_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
        </div>

        <!-- Flow totals, swatch colours match the chart series -->
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy flow') ?></span>
        </div>
        <div class="app-live">
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#abddff"></span><?php echo tr('Sol→Load') ?></div>
                <div class="app-live-value"><span id="solar_to_load_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#dccc1f"></span><?php echo tr('Sol→Grid') ?></div>
                <div class="app-live-value"><span id="solar_to_grid_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#fba050"></span><?php echo tr('Sol→Bat') ?></div>
                <div class="app-live-value"><span id="solar_to_battery_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#ffd08e"></span><?php echo tr('Bat→Load') ?></div>
                <div class="app-live-value"><span id="battery_to_load_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#fabb68"></span><?php echo tr('Bat→Grid') ?></div>
                <div class="app-live-value"><span id="battery_to_grid_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#82cbfc"></span><?php echo tr('Grid→Load') ?></div>
                <div class="app-live-value"><span id="grid_to_load_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="app-swatch" style="background-color:#fb7b50"></span><?php echo tr('Grid→Bat') ?></div>
                <div class="app-live-value"><span id="grid_to_battery_kwh">---</span><span class="power-unit-static">kWh</span></div>
            </div>
        </div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Template solar and battery app, power view only and key calculations.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.app_name = "Solar Template App";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

    config.app_name = "<?php echo tr('Solar Template App'); ?>";
    config.app_description = "<?php echo tr('A simpler version of the My Solar Battery app, power view only and key calculations'); ?>";
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/solartemplate/solartemplate.js"); ?>
