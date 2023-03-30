<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=1" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=1"></script>

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
        <li><button class="viewpower active btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo _('Power View') ?>">
                <span class="d-xs-none"><?php echo _("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo _("Power") ?></span>
            </button></li>
    </ul>
    <ul class="text-right nav nav-pills mb-0">
        <li><button class="btn btn-large btn-link btn-inverse config-open" title="<?php echo _('Edit') ?>"><svg class="icon">
                    <use xlink:href="#icon-wrench"></use>
                </svg></button></li>
        <li><button class="btn btn-large btn-link btn-inverse config-close hide" title="<?php echo _('Close') ?>"><svg class="icon">
                    <use xlink:href="#icon-close"></use>
                </svg></button></li>
    </ul>
</nav>

<!-- App content -->
<div id="app-block" style="display:none">
    <div class="d-flex justify-content-between">
        <div>
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo _('POWER') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3 text-primary"><span id="powernow">0</span><span class="power-unit">W</span></h2>
        </div>
        <div class="text-xs-right">
            <h5 class="electric-title mb-0 text-md-larger text-light"><?php echo _('ENERGY') ?></h5>
            <h2 class="power-value display-sm-4 display-md-3 display-lg-2 mt-0 mb-lg-3 text-primary "><span id="kwhwindow">---</span><span class="power-unit">kWh</span></h2>
        </div>
    </div>

    <?php include(dirname(__DIR__).'/OpenEnergyMonitor/graph-nav.php'); ?>

    <div id="graph_bound" class="chart-placeholder">
        <div id="graph"></div>
    </div>
</div>

<!-- App configuration -->
<section id="app-setup" class="hide pb-3">
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xapp-config-description">
                <div class="xapp-config-description-inner text-light">
                    <h2 class="app-config-title text-primary"><?php echo _('Template'); ?></h2>
                    <p class="lead">A basic app example useful for developing new apps.</p>
                    <img src="<?php echo $path; ?><?php echo $appdir; ?>preview.png" class="img-rounded">
                </div>
            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>

<div class="ajax-loader"></div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    var app_name = "<?php echo $name; ?>";
    var app_config = <?php echo json_encode($config); ?>;
</script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/template/template.js?v=4"></script>