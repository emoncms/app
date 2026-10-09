<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Modules/app/Lib/timeseries.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/myelectricflow/myelectricflow.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none" class="block">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link view-toggle-btn active" data-view="flows"><i class="svg-icon-shuffle"></i><?php echo tr('Electric flow') ?></button>
                <button class="nav-link view-toggle-btn d-none" data-view="costs"><i class="svg-icon-schedule"></i><?php echo tr('Tariff explorer') ?></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>

        <div id="live-power-view" class="app-live">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="use-now"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="grid-now">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div id="live-solar-title" class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div id="live-solar-value" class="app-live-value text-solar"><span class="solar-now"></span><span class="power-unit"></span></div>
            </div>
            <div class="battery-section">
                <div class="app-live-label"><?php echo tr('BATTERY') ?> &middot; <span class="battery_now_title"><?php echo tr('POWER') ?></span></div>
                <div class="app-live-value text-battery"><span class="battery-now">--</span><span class="power-unit"></span></div>
            </div>
            <div class="battery-section">
                <div class="app-live-label"><?php echo tr('TIME LEFT') ?></div>
                <div class="app-live-value text-battery"><span class="battery_time_left">--</span></div>
            </div>
            <div class="battery-section">
                <div class="app-live-label"><span class="d-inline d-sm-none"><?php echo tr('SOC') ?></span><span class="d-none d-sm-inline"><?php echo tr('STATE OF CHARGE') ?></span></div>
                <div class="app-live-value text-battery"><span class="battery_soc">-</span><span class="power-unit-static">%</span></div>
            </div>
        </div>

        <div id="live-cost-view" class="app-live d-none">
            <div>
                <div class="app-live-label"><span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="grid-now">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="live-cost-tariff-label"><?php echo tr('IMPORT PRICE') ?></span></div>
                <div class="app-live-value"><span class="live-cost-tariff-now">--</span><span class="live-cost-tariff-unit power-unit-static">p/kWh</span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php include "Modules/app/Lib/timebar.php"; ?>
            <div class="btn-group app-segmented viewmode-toggle ms-auto">
                <button class="btn viewpower active"><?php echo tr('Power') ?></button>
                <button class="btn viewhistory"><?php echo tr('Daily') ?><span class="d-none d-sm-inline"> kWh</span></button>
            </div>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="placeholder_bound">
            <div id="placeholder"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

    <div class="app-card app-card-body">

    <div id="cost-view" class="d-none">
        <table class="table">
            <tr>
                <th><?php echo tr('Energy flow') ?></th>
                <th><?php echo tr('Energy') ?></th>
                <th><?php echo tr('Value / Cost') ?></th>
                <th><?php echo tr('Unit price') ?></th>
                <th></th>
            </tr>
            <tbody id="cost_breakdown_body"></tbody>
        </table>

        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <div class="input-group w-auto">
                <span class="input-group-text"><?php echo tr('Tariff') ?></span>
                <select id="tariff" class="form-select"></select>
            </div>
            <button id="show_profile" class="btn btn-outline-primary"><?php echo tr('Profile') ?></button>
            <button id="download-csv" class="btn btn-outline-primary"><?php echo tr('Download CSV') ?></button>
        </div>

        <div class="form-check small">
            <input id="show_carbonintensity" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="show_carbonintensity"><?php echo tr('Show grid carbon intensity') ?></label>
        </div>
        <div id="carbonintensity_result" class="small text-body-secondary"></div>

        <div id="monthly-data" class="d-none mt-3">
            <table class="table mb-3">
                <thead><tr></tr></thead>
                <tbody id="monthly-data-body"></tbody>
            </table>
            <button id="save-baseline" class="btn btn-outline-primary"><?php echo tr('Save baseline') ?></button>
        </div>
    </div>

    <div id="flow-section">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy flow') ?> &middot; <?php echo tr('this window') ?></span>
        </div>

        <div id="flow-block-view" class="app-flow">
            <div id="solar-box" class="app-flow-node app-flow-wide statsbox-solar">
                <span class="app-flow-name"><?php echo tr('SOLAR') ?></span><span class="app-flow-value solar_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc prc-bottom-left solar_to_battery_prc prc-solar-battery" title="<?php echo tr('Share of solar') ?>"></span>
                <span class="app-flow-prc prc-bottom-right solar_to_load_prc prc-solar" title="<?php echo tr('Share of solar') ?>"></span>
                <span class="app-flow-prc prc-right solar_export_prc prc-solar" title="<?php echo tr('Share of solar') ?>"></span>
            </div>
            <div id="solar-to-grid-box" class="app-flow-link">
                <span class="app-flow-value solar_to_grid">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9654;</span>
            </div>
            <div id="grid-box" class="app-flow-node statsbox-import">
                <span class="app-flow-name"><?php echo tr('GRID') ?></span><span class="app-flow-value grid_balance_kwh">0</span><span class="app-flow-unit">kWh</span>
            </div>

            <div id="solar-to-battery-box" class="app-flow-link">
                <span class="app-flow-value solar_to_battery">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div id="grid-to-battery-box" class="app-flow-link">
                <span id="battery_import"><span class="app-flow-arrow">&#9664;</span><span class="app-flow-title"><span class="app-flow-long"><?php echo tr('Grid charge') ?></span><span class="app-flow-short"><?php echo tr('Charge') ?></span></span><span class="app-flow-value grid_to_battery">0</span></span>
            </div>
            <div id="solar-to-load-box" class="app-flow-link">
                <span class="app-flow-value solar_to_load">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>
            <div id="battery-to-grid-box" class="app-flow-link">
                <span id="battery_export"><span class="app-flow-title"><span class="app-flow-long"><?php echo tr('Battery to grid') ?></span><span class="app-flow-short"><?php echo tr('To grid') ?></span></span><span class="app-flow-value battery_to_grid">0</span><span class="app-flow-arrow">&#9654;</span></span>
            </div>
            <div id="grid-to-load-box" class="app-flow-link">
                <span class="app-flow-value grid_to_load">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9660;</span>
            </div>

            <div id="battery-box" class="app-flow-node statsbox-battery">
                <span class="app-flow-name"><?php echo tr('BATTERY') ?></span><span class="app-flow-value battery_soc_change">0</span><span class="app-flow-unit">%</span>
            </div>
            <div id="battery-to-load-box" class="app-flow-link">
                <span class="app-flow-value battery_to_load">0</span><span class="app-flow-unit">kWh</span><span class="app-flow-arrow">&#9654;</span>
            </div>
            <div id="house-box" class="app-flow-node app-flow-wide statsbox-house">
                <span class="app-flow-name"><?php echo tr('HOUSE') ?></span><span class="app-flow-value use_kwh">0</span><span class="app-flow-unit">kWh</span>
                <span class="app-flow-prc prc-left use_from_battery_prc prc-battery" title="<?php echo tr('Share of use') ?>"></span>
                <span class="app-flow-prc prc-top-left use_from_solar_prc prc-solar" title="<?php echo tr('Share of use') ?>"></span>
                <span class="app-flow-prc prc-top-right use_from_import_prc" title="<?php echo tr('Share of use') ?>"></span>
            </div>
        </div>
    </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Visualise the flow of electricity through your home - solar generation, self-consumption, battery charge and discharge, grid import and export, and household consumption - and explore time-of-use tariff costs over time.</p>
    <p><b>Fixed interval feeds:</b> This app only supports the fixed interval PHPFina feed engine for post processing efficiency.</p>
    <p><b>No solar or battery:</b> Only a single use or grid import feed is needed.</p>
    <p><b>Derive missing feed:</b> If you do not have one out of the selectable power feeds, this app can derive this data from the others using conservation of energy.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<?php load_js("Lib/js/gettext.js"); ?> 
<script>
// Function to get translations for JavaScript
function getTranslations(){
    return {
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
    }
}


// Set up config object - used by myelectricflow.js
var apikey = "<?php echo isset($apikey) ? $apikey : ''; ?>";
var sessionwrite = <?php echo isset($session['write']) ? intval($session['write']) : 0; ?>;

config.app_name = "My Electric Flow";
config.app_name_color = "#44b3e2";
config.id = <?php echo isset($id) ? intval($id) : 0; ?>;
config.name = "<?php echo isset($name) ? addslashes($name) : ''; ?>";
config.public = <?php echo isset($public) ? intval($public) : 0; ?>;
config.db = <?php echo isset($config) ? json_encode($config) : 'null'; ?>;

</script>

<?php

// Load app specific JS with auto versioning based on file modification time to prevent caching issues after updates
load_js("Modules/app/apps/OpenEnergyMonitor/myelectricflow/myelectricflow_graph.js");
load_js("Modules/app/apps/OpenEnergyMonitor/myelectricflow/myelectricflow_tariff.js");
load_js("Modules/app/apps/OpenEnergyMonitor/myelectricflow/myelectricflow.js");

?>