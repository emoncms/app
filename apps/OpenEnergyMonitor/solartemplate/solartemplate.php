<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=2"></script>

<style>
    /* Dynamic height chart placeholder */
    /* Adjust the height offset as necessary */
    .chart-placeholder {
        --height-offset: 19rem;
    }
    @media (min-width: 768px) {
        .chart-placeholder { --height-offset: 22rem; }
    }
    .chart-placeholder>* {
        height: calc(100vh - var(--height-offset)) !important;
        min-height: 180px;
        max-height: 400px;
    }

    /* Remove padding from container-fluid, gives a little more screen space */
    .container-fluid { padding: 0px; }
    @media (min-width: 768px) {
        .container-fluid { padding: 0px 20px 0px 20px; }
    }
</style>

<!-- Top navigation bar -->
<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="viewpower active btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo tr('Power View') ?>">
                <span class="d-xs-none"><?php echo tr("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo tr("Power") ?></span>
            </button></li>
    </ul>
    <ul class="text-right nav nav-pills mb-0">
        <li><button class="btn btn-large btn-link btn-inverse config-open" title="<?php echo tr('Edit') ?>"><svg class="icon">
                    <use xlink:href="#icon-wrench"></use>
                </svg></button></li>
        <li><button class="btn btn-large btn-link btn-inverse config-close hide" title="<?php echo tr('Close') ?>"><svg class="icon">
                    <use xlink:href="#icon-close"></use>
                </svg></button></li>
    </ul>
</nav>

<!-- App content -->
<div id="app-block" style="display:none">
    <div class="d-flex justify-content-around flex-wrap px-2 mb-2">
        <div class="text-center px-2">
            <h5 class="electric-title mb-0" style="font-size:0.85rem;color:#0699fa"><?php echo tr('USE') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#0699fa"><span id="powernow">0</span><small>W</small></h3>
        </div>
        <div class="text-center px-2">
            <h5 class="electric-title mb-0" style="font-size:0.85rem;color:#f4c009"><?php echo tr('SOLAR') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#f4c009"><span id="solarnow">0</span><small>W</small></h3>
        </div>
        <div class="text-center px-2">
            <h5 class="electric-title mb-0" style="font-size:0.85rem;color:#aaa" id="battery-label"><?php echo tr('BATTERY') ?></h5>
            <h3 class="mt-0 mb-1" id="battery-value" style="color:#aaa"><span id="batterynow">0</span><small>W</small></h3>
        </div>
        <div class="text-center px-2">
            <h5 class="electric-title mb-0" style="font-size:0.85rem;color:#aaa" id="grid-label"><?php echo tr('GRID') ?></h5>
            <h3 class="mt-0 mb-1" id="grid-value" style="color:#aaa"><span id="gridnow">0</span><small>W</small></h3>
        </div>
        <div class="text-center px-2">
            <h5 class="electric-title mb-0" style="font-size:0.85rem;color:#ccc"><?php echo tr('BAT SOC') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#ccc"><span id="socnow">--</span><small>%</small></h3>
        </div>
    </div>

    <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

    <div id="graph_bound" class="chart-placeholder">
        <div id="graph"></div>
    </div>

    <div class="d-flex justify-content-between mt-2 px-2">
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.9rem;color:#0699fa"><?php echo tr('USE') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#0699fa"><span id="use_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.9rem;color:#f4c009"><?php echo tr('SOLAR') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#f4c009"><span id="solar_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.9rem;color:#0699fa"><?php echo tr('IMPORT') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#0699fa"><span id="import_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.9rem;color:#dccc1f"><?php echo tr('EXPORT') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#dccc1f"><span id="export_kwh">---</span><small>kWh</small></h3>
        </div>
    </div>

    <div class="d-flex justify-content-between mt-1 px-2">
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#abddff"><?php echo tr('Sol→Load') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#abddff"><span id="solar_to_load_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#dccc1f"><?php echo tr('Sol→Grid') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#dccc1f"><span id="solar_to_grid_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#fba050"><?php echo tr('Sol→Bat') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#fba050"><span id="solar_to_battery_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#ffd08e"><?php echo tr('Bat→Load') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#ffd08e"><span id="battery_to_load_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#fabb68"><?php echo tr('Bat→Grid') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#fabb68"><span id="battery_to_grid_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#82cbfc"><?php echo tr('Grid→Load') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#82cbfc"><span id="grid_to_load_kwh">---</span><small>kWh</small></h3>
        </div>
        <div class="text-center">
            <h5 class="electric-title mb-0" style="font-size:0.75rem;color:#fb7b50"><?php echo tr('Grid→Bat') ?></h5>
            <h3 class="mt-0 mb-1" style="color:#fb7b50"><span id="grid_to_battery_kwh">---</span><small>kWh</small></h3>
        </div>
    </div>

    
</div>

<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

    config.app_name = "<?php echo tr('Solar Template App'); ?>";
    config.app_description = "<?php echo tr('A simpler version of the My Solar Battery app, power view only and key calculations'); ?>";
</script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/solartemplate/solartemplate.js?v=<?php echo time(); ?>"></script>
