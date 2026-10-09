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
load_css("Modules/app/apps/OpenEnergyMonitor/myenergy/myenergy.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-leaf"></i><?php echo tr('My Energy') ?></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>

        <div class="app-live is-center is-large">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="usenow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="balance">--</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><span class="d-inline d-sm-none"><?php echo tr('GEN') ?></span><span class="d-none d-sm-inline"><?php echo tr('RENEWABLE GEN') ?></span></div>
                <div class="app-live-value text-solar"><span class="gennow"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span class="solarnow">0</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('WIND') ?></div>
                <div class="app-live-value text-wind"><span class="windnow">0</span><span class="power-unit"></span></div>
            </div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php include "Modules/app/Lib/timebar.php"; ?>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="placeholder_bound">
            <div id="placeholder"></div>
        </div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

    <div class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy') ?> &middot; <?php echo tr('this window') ?></span>
        </div>
        <div class="app-live is-row is-center">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="total_use_kwh">--</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('WIND') ?></div>
                <div class="app-live-value text-wind"><span class="total_wind_kwh">--</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR') ?></div>
                <div class="app-live-value text-solar"><span class="total_solar_kwh">--</span><span class="power-unit-static">kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('DIRECT') ?></div>
                <div class="app-live-value text-direct"><span class="total_use_direct_prc">--</span><span class="power-unit-static"><span id="total_use_direct_kwh"></span> kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?></div>
                <div class="app-live-value text-import"><span class="total_import_prc">--</span><span class="power-unit-static"><span id="total_import_kwh"></span> kWh</span></div>
            </div>
        </div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">This app extends the My Solar app by adding in a 'share of UK wind' estimate.</p>
    <p>The share of wind estimate is calculated by using real-time electricity data from wind power in the uk and then scaling it so that the annual wind generation matches a percentage of annual household consumption. The default estimate assumes 60% or near 2000 kWh annually. This is close to the fuel mix quoted by two of the UK's leading green electricity suppliers.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<?php load_js("Lib/js/gettext.js"); ?> 
<script>
function getTranslations(){
    return {
        'House or building use in watts': "<?php echo tr('House or building use in watts') ?>",
        'Solar pv generation in watts': "<?php echo tr('Solar pv generation in watts') ?>",
        'kWh of wind energy bought annually': "<?php echo tr('kWh of wind energy bought annually') ?>",
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
        'EXCESS': "<?php echo tr('EXCESS') ?>",
        'BACKUP': "<?php echo tr('BACKUP') ?>",
    }
}
</script>
<script>
// Server values, used by myenergy.js
var apikey = "<?php echo $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
config.id = "<?php echo $id; ?>";
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/myenergy/myenergy.js"); ?>
