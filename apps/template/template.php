<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/template/template.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <!-- Header and live values -->
    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link active" title="<?php echo tr('Power view') ?>"><i class="svg-icon-show_chart"></i><?php echo tr('Power') ?></button>
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
                <div class="app-live-label"><?php echo tr('POWER') ?></div>
                <div class="app-live-value text-use"><span id="powernow">0</span><span class="power-unit">W</span></div>
            </div>
            <div>
                <div class="app-live-label"><?php echo tr('ENERGY') ?></div>
                <div class="app-live-value text-use"><span id="kwhwindow">---</span><span class="power-unit-static">kWh</span></div>
            </div>
        </div>
    </div>

    <!-- Time bar, chart and legend -->
    <div class="app-card app-card-body">
        <div id="graph-nav" class="app-navbar">
            <?php
            $timebar_ranges = array(1 => tr('1 hour'), 24 => tr('24 hours'), 168 => tr('1 week'), 720 => tr('1 month'));
            include "Modules/app/Lib/timebar.php";
            ?>
        </div>
        <?php include "Modules/app/Lib/timebar_manual.php"; ?>
        <div id="graph"></div>
        <div id="chart-legend" class="app-legend"></div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">A basic app example useful for developing new apps.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    config.app_name = "Template App";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
</script>
<?php load_js("Modules/app/apps/template/template.js"); ?>
