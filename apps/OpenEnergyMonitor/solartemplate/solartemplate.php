<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/mysolarpv/mysolarpv.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-panel">
        <nav class="app-top-bar">
            <ul id="tabs" class="btn-list app-tabs">
                <li><button class="app-btn viewpower active" title="<?php echo tr('Power View') ?>"><i class="svg-icon-sun"></i><span><?php echo tr('Power') ?></span></button></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><i class="svg-icon-wrench"></i></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button></li>
            </ul>
        </nav>

        <div class="stats-grid">
            <div>
                <h5 class="power-title"><?php echo tr('USE') ?></h5>
                <h2 class="power-value text-use"><span id="powernow">0</span><span class="power-unit">W</span></h2>
            </div>
            <div>
                <h5 class="power-title" id="grid-label"><?php echo tr('GRID') ?></h5>
                <h2 class="power-value" id="grid-value"><span id="gridnow">0</span><span class="power-unit">W</span></h2>
            </div>
            <div>
                <h5 class="power-title"><?php echo tr('SOLAR') ?></h5>
                <h2 class="power-value text-solar"><span id="solarnow">0</span><span class="power-unit">W</span></h2>
            </div>
            <div>
                <h5 class="power-title" id="battery-label"><?php echo tr('BATTERY') ?></h5>
                <h2 class="power-value" id="battery-value"><span id="batterynow">0</span><span class="power-unit">W</span></h2>
            </div>
            <div>
                <h5 class="power-title"><?php echo tr('BAT SOC') ?></h5>
                <h2 class="power-value text-battery"><span id="socnow">--</span>%</h2>
            </div>
        </div>
    </div>

    <div class="app-panel">
        <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start">
            <button class='visnav time app-btn' time='1'>1<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='3'>3<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='6'>6<?php echo tr('h') ?></button>
            <button class='visnav time app-btn' time='24'><?php echo tr('D') ?></button>
            <button class='visnav time app-btn' time='168'><?php echo tr('W') ?></button>
            <button class='visnav time app-btn' time='720'><?php echo tr('M') ?></button>
            <button class='visnav time app-btn' time='8760'><?php echo tr('Y') ?></button>
            <button id='zoomin' class='visnav app-btn'>+</button>
            <button id='zoomout' class='visnav app-btn'>-</button>
            <button id='left' class='visnav app-btn'>&lt;</button>
            <button id='right' class='visnav app-btn'>&gt;</button>
        </div>

        <div id="graph_bound">
            <div id="graph"></div>
        </div>
    </div>

    <div class="app-panel app-stats py-2">
        <div class="text-use">
            <h5 class="power-title"><?php echo tr('USE') ?></h5>
            <div class="app-stat-value" id="use_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div class="text-solar">
            <h5 class="power-title"><?php echo tr('SOLAR') ?></h5>
            <div class="app-stat-value" id="solar_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div class="text-import">
            <h5 class="power-title"><?php echo tr('IMPORT') ?></h5>
            <div class="app-stat-value" id="import_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div class="text-export">
            <h5 class="power-title"><?php echo tr('EXPORT') ?></h5>
            <div class="app-stat-value" id="export_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
    </div>

    <!-- Flow totals, swatch colours match the chart series -->
    <div class="app-panel app-stats app-stats-wrap py-2">
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#abddff"></span><?php echo tr('Sol→Load') ?></h5>
            <div class="app-stat-value" id="solar_to_load_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#dccc1f"></span><?php echo tr('Sol→Grid') ?></h5>
            <div class="app-stat-value" id="solar_to_grid_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#fba050"></span><?php echo tr('Sol→Bat') ?></h5>
            <div class="app-stat-value" id="solar_to_battery_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#ffd08e"></span><?php echo tr('Bat→Load') ?></h5>
            <div class="app-stat-value" id="battery_to_load_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#fabb68"></span><?php echo tr('Bat→Grid') ?></h5>
            <div class="app-stat-value" id="battery_to_grid_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#82cbfc"></span><?php echo tr('Grid→Load') ?></h5>
            <div class="app-stat-value" id="grid_to_load_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
        <div>
            <h5 class="power-title"><span class="app-swatch" style="background-color:#fb7b50"></span><?php echo tr('Grid→Bat') ?></h5>
            <div class="app-stat-value" id="grid_to_battery_kwh">---</div>
            <div class="app-stat-sub">kWh</div>
        </div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Template solar and battery app, power view only and key calculations.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.app_name = "Solar Template App";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

    config.app_name = "<?php echo tr('Solar Template App'); ?>";
    config.app_description = "<?php echo tr('A simpler version of the My Solar Battery app, power view only and key calculations'); ?>";
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/solartemplate/solartemplate.js"); ?>
