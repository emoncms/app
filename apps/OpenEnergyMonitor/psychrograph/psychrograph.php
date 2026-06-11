<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/flot/jquery.flot.min.js");
load_js("Lib/flot/jquery.flot.time.min.js");
load_js("Lib/flot/jquery.flot.selection.min.js");
load_js("Lib/flot/jquery.flot.touch.min.js");
load_js("Lib/flot/jquery.flot.togglelegend.min.js");
load_js("Lib/vis.helper.js");
load_js("Lib/bootstrap-datetimepicker-0.0.11/js/bootstrap-datetimepicker.min.js");
load_css("Lib/bootstrap-datetimepicker-0.0.11/css/bootstrap-datetimepicker.min.css");
load_css("Modules/app/apps/OpenEnergyMonitor/myelectricflow/myelectricflow.css");
load_css("Modules/app/apps/OpenEnergyMonitor/psychrograph/psychrograph.css");
?>

<section id="app-block" style="display:none" class="block">

    <div class="psy-panel">
        <nav class="app-top-bar d-flex justify-content-between">
            <ul id="tabs" class="btn-list">
                <li><button class="app-btn view-toggle-btn active" data-view="classic"><i class="svg-icon-show_chart"></i><span><?php echo tr('Psychrometric') ?></span></button></li>
                <li><button class="app-btn view-toggle-btn givoni-tab d-none" data-view="givoni"><i class="svg-icon-leaf"></i><span><?php echo tr('Givoni') ?></span></button></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><i class="icon-wrench icon-white" title="Configure app"></i></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close icon-white"></i></button></li>
            </ul>
        </nav>

        <p class="psy-axis-note text-light mb-0">
            <?php echo tr('Y-axis: absolute humidity (g water / kg dry air) &nbsp;&middot;&nbsp; X-axis: temperature (&deg;C)') ?>
        </p>
    </div>

    <div class="psy-panel">
        <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start">
            <button class='visnav time app-btn' time='24'><?php echo tr('D') ?></button>
            <button class='visnav time app-btn' time='168'><?php echo tr('W') ?></button>
            <button class='visnav time app-btn' time='720'><?php echo tr('M') ?></button>
            <button class='visnav time app-btn' time='8760'><?php echo tr('Y') ?></button>
            <button id='zoomin' class='visnav app-btn'>+</button>
            <button id='zoomout' class='visnav app-btn'>-</button>
            <button id='left' class='visnav app-btn'>&lt;</button>
            <button id='right' class='visnav app-btn'>&gt;</button>
            <button id='time-manual-open' class='visnav app-btn' title="<?php echo tr('Select time window') ?>"><i class="icon-calendar icon-white"></i></button>
        </div>

        <div id="graph-nav-manual" class="visnavblock mb-2 d-flex justify-content-start align-items-center d-none">
            <span class="ctrl-group">
                <span class="ctrl-label"><?php echo tr('Start') ?></span>
                <span id="datetimepicker1">
                    <input id="request-start" data-format="dd/MM/yyyy hh:mm:ss" type="text" />
                    <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                </span>
            </span>
            <span class="ctrl-group">
                <span class="ctrl-label"><?php echo tr('End') ?></span>
                <span id="datetimepicker2">
                    <input id="request-end" data-format="dd/MM/yyyy hh:mm:ss" type="text" />
                    <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                </span>
            </span>
            <button id='time-manual-close' class='visnav app-btn' title="<?php echo tr('Done') ?>"><i class="icon-ok icon-white"></i></button>
        </div>

        <div class="psy-context-label text-light"><?php echo tr('Drag to select a time window') ?></div>
        <div id="contextgraph_bound"><div id="contextgraph"></div></div>
    </div>

    <div class="psy-panel">
        <div id="classic-view">
            <div id="psychrograph_bound"><div id="psychrograph"></div></div>
        </div>
        <div id="givoni-view" class="d-none">
            <div id="givonigraph_bound"><div id="givonigraph"></div></div>
        </div>
    </div>

    <div class="psy-panel">
        <div class="psy-stats-controls d-flex justify-content-between align-items-center mb-2">
            <h5 class="power-title text-light mb-0"><?php echo tr('COMFORT ZONE ANALYSIS') ?></h5>
            <div>
                <button id="calc" class="cost-btn"><?php echo tr('Calculate %') ?></button>
                <button id="clear" class="cost-btn"><?php echo tr('Clear') ?></button>
            </div>
        </div>
        <div id="psychrotext"><p class="ctrl-note"><?php echo tr('Click "Calculate %" to show the proportion of data points falling in each comfort zone.') ?></p></div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead"><?php echo tr('Plot indoor temperature and humidity on a psychrometric diagram with comfort zones and iso-relative-humidity curves.') ?></p>
    <p><b style="color:#fff"><?php echo tr('Feed pairs:') ?></b> <?php echo tr('Configure one or more temperature + humidity feed pairs (one per room or zone). Only the first pair is required.') ?></p>
    <p><b style="color:#fff"><?php echo tr('Relative humidity:') ?></b> <?php echo tr('By default humidity feeds are treated as relative humidity (%) and converted to absolute humidity. Disable this if your feeds already report absolute humidity in g/kg.') ?></p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

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
