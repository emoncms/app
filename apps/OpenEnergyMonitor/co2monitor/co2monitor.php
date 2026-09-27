<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/co2monitor/co2monitor.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-panel">
        <nav class="app-top-bar mb-0 border-0">
            <ul id="tabs" class="btn-list app-tabs">
                <li><button class="app-btn active"><i class="svg-icon-leaf"></i><span><?php echo tr('Air change rate from CO2') ?></span></button></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><i class="svg-icon-wrench"></i></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button></li>
            </ul>
        </nav>
    </div>

    <div class="app-panel">
        <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start">
            <button class='visnav time app-btn' time='24'><?php echo tr('D') ?></button>
            <button class='visnav time app-btn' time='168'><?php echo tr('W') ?></button>
            <button class='visnav time app-btn' time='720'><?php echo tr('M') ?></button>
            <button id='zoomin' class='visnav app-btn'>+</button>
            <button id='zoomout' class='visnav app-btn'>-</button>
            <button id='left' class='visnav app-btn'>&lt;</button>
            <button id='right' class='visnav app-btn'>&gt;</button>
        </div>
        <div id="graph_bound"><div id="graph"></div></div>
    </div>

    <div class="app-panel co2-panel">
        <div class="co2-controls">
            <div>
                <button id="average_mode" class="cost-btn active"><?php echo tr('Average') ?></button>
                <button id="decay_mode" class="cost-btn"><?php echo tr('Decay') ?></button>
            </div>
            <div class="co2-totals average">
                <span><?php echo tr('Total') ?> <b><span id="total_volume">-</span> m³</b></span>
                <span><?php echo tr('Mean') ?> <b><span id="total_mean_co2">-</span> ppm</b></span>
                <span><b><span id="total_mean_air_change_rate">-</span> ACH</b></span>
                <span class="ctrl-group">
                    <span class="ctrl-label"><?php echo tr('Daily CO2 addition') ?></span>
                    <input type="text" id="daily_co2_addition" value="1050" />
                    <span class="ctrl-label ctrl-unit">L/day</span>
                </span>
            </div>
        </div>

        <table class="app-table">
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
        <p class="ctrl-note mt-2 mb-0"><?php echo tr('Click a colour square to show or hide the sensor on the chart.') ?></p>

        <label id="windspeed_option" class="ctrl-checkbox mt-2" style="display:none"><input type="checkbox" id="show_windspeed" /> <?php echo tr('Show wind speed') ?></label>
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
