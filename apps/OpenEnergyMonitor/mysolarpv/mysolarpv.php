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
    load_css("Modules/app/apps/OpenEnergyMonitor/mysolarpv/mysolarpv.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none" class="block">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-sun"></i><?php echo tr('Solar PV') ?></button>
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
                <div class="app-live-value text-use"><span class="usenow">0</span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?> &middot; <span class="balance-label">-</span></div>
                <div class="app-live-value"><span class="balance"></span><span class="power-unit"></span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('SOLAR PV') ?></div>
                <div class="app-live-value text-solar"><span class="solarnow"></span><span class="power-unit"></span></div>
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
            <div class="nav ms-auto">
                <button class="nav-link balanceline" title="<?php echo tr('Show Balance') ?>"><i class="svg-icon-show_chart"></i><?php echo tr('Balance') ?></button>
            </div>
            <div class="btn-group app-segmented viewmode-toggle">
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

    <div id="breakdown" class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-section-label"><?php echo tr('Energy') ?> &middot; <?php echo tr('this window') ?></span>
        </div>
        <div class="app-live is-row is-center">
            <div>
                <div class="app-live-label"><?php echo tr('USE') ?></div>
                <div class="app-live-value text-use"><span class="total_use_kwh">--</span><span class="power-unit-static">kWh</span></div>
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
                <div class="app-live-label"><?php echo tr('EXPORT') ?></div>
                <div class="app-live-value text-solar-export"><span class="total_export_prc">--</span><span class="power-unit-static"><span id="total_export_kwh"></span> kWh</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('GRID') ?></div>
                <div class="app-live-value text-import"><span class="total_import_prc">--</span><span class="power-unit-static"><span id="total_import_kwh"></span> kWh</span></div>
            </div>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">The My Solar app can be used to explore onsite solar generation, self consumption, export and building consumption both in realtime with a moving power graph view and historically with a daily and monthly bargraph.</p>
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
        'Cumulative use in kWh': "<?php echo tr('Cumulative use in kWh') ?>",
        'Cumulative solar generation in kWh': "<?php echo tr('Cumulative solar generation in kWh') ?>",
        'Cumulative grid import in kWh': "<?php echo tr('Cumulative grid import in kWh') ?>",
        'Display power as kW': "<?php echo tr('Display power as kW') ?>",
        'Display solar power as 0 below this threshold in w': "<?php echo tr('Display solar power as 0 below this threshold in w') ?>",
        'PERFECT BALANCE': "<?php echo tr('PERFECT BALANCE') ?>",
        'EXPORTING': "<?php echo tr('EXPORTING') ?>",
        'IMPORTING': "<?php echo tr('IMPORTING') ?>",
    }
}
</script>
<script>
// Server values, used by mysolarpv.js
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
config.id = "<?php echo $id; ?>";
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/mysolarpv/mysolarpv.js"); ?>
