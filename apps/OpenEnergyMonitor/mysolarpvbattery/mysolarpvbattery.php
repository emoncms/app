<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Modules/app/Lib/timeseries.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-sun"></i><?php echo tr('Solar PV battery') ?></button>
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
                <div class="app-live-value text-use"><span class="usenow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="balance">--</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span class="generationnow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('BATTERY') ?> &middot; <span class="battery_charge_discharge_title"><?php echo tr('POWER') ?></span></div>
                <div class="app-live-value text-battery"><span class="battery_charge_discharge">-</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="discharge_time_left_title"><?php echo tr('TIME LEFT') ?></span></div>
                <div class="app-live-value text-battery"><span class="discharge_time_left">-</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="d-inline d-sm-none"><?php echo tr('SOC') ?></span><span class="d-none d-sm-inline"><?php echo tr('STATE OF CHARGE') ?></span></div>
                <div class="app-live-value text-battery"><span class="battery_soc">-</span><span class="power-unit-static">%</span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php
            // All: daily view only
            $timebar_ranges = array(
                1 => tr('1 hour'),
                3 => tr('3 hours'),
                6 => tr('6 hours'),
                24 => tr('24 hours'),
                168 => tr('1 week'),
                720 => tr('1 month'),
                8760 => tr('1 year'),
                'all' => tr('All')
            );
            include "Modules/app/Lib/timebar.php";
            ?>
            <div class="btn-group app-segmented viewmode-toggle ms-auto">
                <button class="btn viewpower active" title="<?php echo tr('Power View') ?>"><?php echo tr('Power') ?></button>
                <button class="btn viewhistory" title="<?php echo tr('View History') ?>"><?php echo tr('Daily') ?><span class="d-none d-sm-inline"> kWh</span></button>
            </div>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="placeholder_bound">
            <div id="placeholder"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

    <div class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy flow') ?> &middot; <?php echo tr('this window') ?></span>
            <span id="battery-export-warning" class="app-caption-note text-warning-emphasis" style="display:none"><?php echo tr('Battery export to grid detected. This app assumes the battery only supplies the house, flows shown are not accurate. Use MyElectricFlow for systems with battery export.') ?></span>
        </div>

        <div class="app-flow">
            <div id="solar-box" class="app-flow-node app-flow-wide statsbox-solar">
                <span class="app-flow-name generationtitle"><?php echo tr('SOLAR') ?></span><span class="app-flow-value total_solar_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc app-flow-prc-bottom-left solar_to_battery_prc" title="<?php echo tr('Share of solar') ?>"></span>
                <span class="app-flow-prc app-flow-prc-bottom-right solar_direct_prc" title="<?php echo tr('Share of solar') ?>"></span>
                <span class="app-flow-prc app-flow-prc-right solar_export_prc" title="<?php echo tr('Share of solar') ?>"></span>
            </div>
            <div id="solar-to-grid-box" class="app-flow-link">
                <span class="app-flow-value total_solar_export_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9654;</span>
            </div>
            <div id="grid-box" class="app-flow-node statsbox-import">
                <span class="app-flow-name"><?php echo tr('GRID') ?></span><span class="app-flow-value total_grid_balance_kwh">0</span><span class="app-flow-unit">kWh</span>
            </div>

            <div id="solar-to-battery-box" class="app-flow-link">
                <span class="app-flow-value total_battery_charge_from_solar_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div id="grid-to-battery-box" class="app-flow-link">
                <span id="battery_import"><span class="app-flow-arrow">&#9664;</span><span class="app-flow-title"><span class="app-flow-long"><?php echo tr('Grid charge') ?></span><span class="app-flow-short"><?php echo tr('Charge') ?></span></span><span class="app-flow-value total_import_for_battery_kwh">0</span></span>
            </div>
            <div id="solar-to-load-box" class="app-flow-link">
                <span class="app-flow-value total_solar_direct_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div class="app-flow-link"></div>
            <div id="grid-to-load-box" class="app-flow-link">
                <span class="app-flow-value total_import_direct_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>

            <div id="battery-box" class="app-flow-node statsbox-battery">
                <span class="app-flow-name"><?php echo tr('BATTERY') ?></span><span class="app-flow-value battery_soc_change">0</span><span class="app-flow-unit">%</span>
            </div>
            <div id="battery-to-load-box" class="app-flow-link discharge-box">
                <span class="app-flow-value total_battery_discharge_kwh">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9654;</span>
            </div>
            <div id="house-box" class="app-flow-node app-flow-wide statsbox-house">
                <span class="app-flow-name"><?php echo tr('HOUSE') ?></span><span class="app-flow-value total_use_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc app-flow-prc-left use_from_battery_prc" title="<?php echo tr('Share of use') ?>"></span>
                <span class="app-flow-prc app-flow-prc-top-left use_from_solar_prc" title="<?php echo tr('Share of use') ?>"></span>
                <span class="app-flow-prc app-flow-prc-top-right use_from_import_prc" title="<?php echo tr('Share of use') ?>"></span>
            </div>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">
    This app can be used to explore onsite solar generation, self consumption, battery integration, export and building consumption.</p>
    <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<?php load_js("Lib/js/gettext.js"); ?>
<script>
function getTranslations(){
    return {
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
        'EXPORTING': "<?php echo tr('EXPORTING') ?>",
        'IMPORTING': "<?php echo tr('IMPORTING') ?>",
        'BALANCED': "<?php echo tr('BALANCED') ?>",
        'CHARGING': "<?php echo tr('CHARGING') ?>",
        'DISCHARGING': "<?php echo tr('DISCHARGING') ?>",
        'POWER': "<?php echo tr('POWER') ?>",
    }
}
</script>
<script>
// Server values, used by mysolarpvbattery.js
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
config.id = "<?php echo $id; ?>";
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/mysolarpvbattery/mysolarpvbattery.js"); ?>
