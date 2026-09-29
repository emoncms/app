<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/psychrograph/psychrograph.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none" class="block">

    <div class="app-card">
        <nav class="app-card-head">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link view-toggle-btn active" data-view="classic"><i class="svg-icon-show_chart"></i><?php echo tr('Psychrometric') ?></button>
                <button class="nav-link view-toggle-btn givoni-tab d-none" data-view="givoni"><i class="svg-icon-leaf"></i><?php echo tr('Givoni') ?></button>
            </div>
            <div class="app-card-tools">
                <div class="nav">
                    <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>

        <div class="app-card-body">
            <div id="graph-nav" class="app-navbar">
                <?php
                $timebar_ranges = array(24 => tr('1 day'), 168 => tr('1 week'), 720 => tr('1 month'), 8760 => tr('1 year'));
                include "Modules/app/Lib/timebar.php";
                ?>
                <span class="app-caption-note ms-auto d-none d-md-inline"><?php echo tr('Drag on the chart to select a time window') ?></span>
            </div>
            <?php include "Modules/app/Lib/timebar_manual.php"; ?>
            <div id="contextgraph_bound"><div id="contextgraph"></div></div>
            <div id="chart-legend" class="app-legend"></div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div class="app-card-caption">
            <span class="app-caption-note"><?php echo tr('Y-axis: absolute humidity (g water / kg dry air) &nbsp;&middot;&nbsp; X-axis: temperature (&deg;C)') ?></span>
        </div>
        <div id="classic-view">
            <div id="psychrograph_bound"><div id="psychrograph"></div></div>
        </div>
        <div id="givoni-view" class="d-none">
            <div id="givonigraph_bound"><div id="givonigraph"></div></div>
        </div>
    </div>

    <div class="app-card app-card-body">
        <div class="app-card-caption justify-content-between align-items-center">
            <span class="app-section-label"><?php echo tr('Comfort zone analysis') ?></span>
            <div class="d-flex gap-2">
                <button id="calc" class="btn btn-sm btn-outline-primary"><?php echo tr('Calculate %') ?></button>
                <button id="clear" class="btn btn-sm btn-outline-primary"><?php echo tr('Clear') ?></button>
            </div>
        </div>
        <div id="psychrotext"><p class="small text-body-secondary"><?php echo tr('Click "Calculate %" to show the proportion of data points falling in each comfort zone.') ?></p></div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead"><?php echo tr('Plot indoor temperature and humidity on a psychrometric diagram with comfort zones and iso-relative-humidity curves.') ?></p>
    <p><b style="color:#fff"><?php echo tr('Feed pairs:') ?></b> <?php echo tr('Configure one or more temperature + humidity feed pairs (one per room or zone). Only the first pair is required.') ?></p>
    <p><b style="color:#fff"><?php echo tr('Relative humidity:') ?></b> <?php echo tr('By default humidity feeds are treated as relative humidity (%) and converted to absolute humidity. Disable this if your feeds already report absolute humidity in g/kg.') ?></p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php echo isset($apikey) ? $apikey : ''; ?>";
    var sessionwrite = <?php echo isset($session['write']) ? intval($session['write']) : 0; ?>;

    config.app_name = "Psychrometric Chart";
    config.app_name_color = "#44b3e2";
    config.id = <?php echo isset($id) ? intval($id) : 0; ?>;
    config.name = "<?php echo isset($name) ? addslashes($name) : ''; ?>";
    config.public = <?php echo isset($public) ? intval($public) : 0; ?>;
    config.db = <?php echo isset($config) ? json_encode($config) : 'null'; ?>;
</script>

<?php
load_js("Modules/app/apps/OpenEnergyMonitor/psychrograph/psychrograph.js");
?>
