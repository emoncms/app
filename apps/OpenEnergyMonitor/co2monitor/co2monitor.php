<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/co2monitor/co2monitor.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-card">
        <nav class="app-card-head border-0">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active"><i class="svg-icon-leaf"></i><?php echo tr('Air change rate from CO2') ?></button>
            </div>
            <div class="app-card-tools">
                <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>
    </div>

    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php
            $timebar_ranges = array(
                24 => tr('24 hours'),
                168 => tr('1 week'),
                720 => tr('1 month')
            );
            include "Modules/app/Lib/timebar.php";
            ?>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="graph_bound"><div id="graph"></div></div>
    </div>

    <div class="app-card app-card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center column-gap-3 row-gap-2 mb-2">
            <div class="btn-group app-segmented">
                <button id="average_mode" class="btn active"><?php echo tr('Average') ?></button>
                <button id="decay_mode" class="btn"><?php echo tr('Decay') ?></button>
            </div>
            <div class="co2-totals average">
                <span><?php echo tr('Total') ?> <b><span id="total_volume">-</span> m³</b></span>
                <span><?php echo tr('Mean') ?> <b><span id="total_mean_co2">-</span> ppm</b></span>
                <span><b><span id="total_mean_air_change_rate">-</span> ACH</b></span>
                <div class="input-group w-auto">
                    <span class="input-group-text"><?php echo tr('Daily CO2 addition') ?></span>
                    <input type="text" id="daily_co2_addition" class="form-control input-75" value="1050" />
                    <span class="input-group-text">L/day</span>
                </div>
            </div>
        </div>

        <table class="table align-middle">
            <thead>
                <tr>
                    <th></th>
                    <th><?php echo tr('Name') ?></th>
                    <th class="average"><?php echo tr('Volume') ?></th>
                    <th class="average"><?php echo tr('Mean CO2') ?></th>
                    <th class="decay"><?php echo tr('Baseline CO2') ?></th>
                    <th class="decay"><?php echo tr('Air change rate') ?></th>
                    <th class="decay"><?php echo tr('R2') ?></th>
                    <th class="decay"></th>
                </tr>
            </thead>
            <tbody id="sensors_list"></tbody>
        </table>
        <p class="small text-body-secondary mt-2 mb-0"><?php echo tr('Click a colour square to show or hide the sensor on the chart.') ?></p>

        <div id="windspeed_option" class="form-check small mt-2" style="display:none">
            <input type="checkbox" id="show_windspeed" class="form-check-input" />
            <label class="form-check-label" for="show_windspeed"><?php echo tr('Show wind speed') ?></label>
        </div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Calculate room air change rates form CO2 decay curves.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.app_name = "CO2 Monitor";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/co2monitor/co2monitor.js"); ?>
