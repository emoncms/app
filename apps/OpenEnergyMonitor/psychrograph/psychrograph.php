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

    <div class="app-panel psy-panel">
        <nav class="app-top-bar">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link view-toggle-btn active" data-view="classic"><i class="svg-icon-show_chart"></i><?php echo tr('Psychrometric') ?></button>
                <button class="nav-link view-toggle-btn givoni-tab d-none" data-view="givoni"><i class="svg-icon-leaf"></i><?php echo tr('Givoni') ?></button>
            </div>
            <div class="nav">
                <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
            </div>
        </nav>

        <p class="psy-axis-note text-body-secondary mb-0">
            <?php echo tr('Y-axis: absolute humidity (g water / kg dry air) &nbsp;&middot;&nbsp; X-axis: temperature (&deg;C)') ?>
        </p>
    </div>

    <div class="app-panel psy-panel">
        <div id="graph-nav" class="app-navbar">
            <div class="btn-group app-timebar">
                <button class='btn time' time='24'><?php echo tr('D') ?></button>
                <button class='btn time' time='168'><?php echo tr('W') ?></button>
                <button class='btn time' time='720'><?php echo tr('M') ?></button>
                <button class='btn time' time='8760'><?php echo tr('Y') ?></button>
                <button id='zoomin' class='btn'>+</button>
                <button id='zoomout' class='btn'>-</button>
                <button id='left' class='btn'>&lt;</button>
                <button id='right' class='btn'>&gt;</button>
                <button id='time-manual-open' class='btn' title="<?php echo tr('Select time window') ?>"><i class="svg-icon-calendar"></i></button>
            </div>
        </div>

        <div id="graph-nav-manual" class="d-flex flex-wrap align-items-center gap-2 mb-2 d-none">
            <div class="input-group w-auto">
                <span class="input-group-text"><?php echo tr('Start') ?></span>
                <input id="request-start" class="form-control" type="text" placeholder="YYYY-MM-DD HH:MM:SS" />
            </div>
            <div class="input-group w-auto">
                <span class="input-group-text"><?php echo tr('End') ?></span>
                <input id="request-end" class="form-control" type="text" placeholder="YYYY-MM-DD HH:MM:SS" />
            </div>
            <div class="btn-group app-timebar flex-grow-0">
                <button id='time-manual-close' class='btn' title="<?php echo tr('Done') ?>"><i class="svg-icon-check"></i></button>
            </div>
        </div>

        <div class="psy-context-label text-body-secondary"><?php echo tr('Drag to select a time window') ?></div>
        <div id="contextgraph_bound"><div id="contextgraph"></div></div>
    </div>

    <div class="app-panel psy-panel">
        <div id="classic-view">
            <div id="psychrograph_bound"><div id="psychrograph"></div></div>
        </div>
        <div id="givoni-view" class="d-none">
            <div id="givonigraph_bound"><div id="givonigraph"></div></div>
        </div>
    </div>

    <div class="app-panel psy-panel">
        <div class="psy-stats-controls d-flex flex-wrap justify-content-between align-items-center mb-2">
            <h5 class="power-title mb-0"><?php echo tr('COMFORT ZONE ANALYSIS') ?></h5>
            <div class="d-flex gap-2">
                <button id="calc" class="btn btn-outline-primary"><?php echo tr('Calculate %') ?></button>
                <button id="clear" class="btn btn-outline-primary"><?php echo tr('Clear') ?></button>
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
