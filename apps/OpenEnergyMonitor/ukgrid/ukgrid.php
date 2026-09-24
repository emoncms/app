<?php
// UK Grid Fuel Mix Visualisation
// By Trystan Lea, OpenEnergyMonitor.org
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>

<?php load_css("Modules/app/Views/css/dark.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>
<?php load_js("Lib/js/clipboard.js"); ?>

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

    .content-container {
        max-width: 1250px;
    }

    .legendcheckbox {
        width: 15px;
        height: 12px;
        border: 1px solid #fff;
        margin-right: 5px;
    }

    .legendItem {
        width: 15px;
        height: 12px;
    }
</style>

<!-- Top navigation bar -->
<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="fuelmix btn btn-lg btn-link myelectric-view-cost" title="<?php echo tr('Fuel mix history') ?>">
                <span class="d-xs-none"><?php echo tr("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo tr("UK FUEL MIX") ?></span>
            </button></li>
        <li><button class="forecast active btn btn-lg btn-link myelectric-view-cost" title="<?php echo tr('Wind & Solar forecast') ?>">
                <span class="d-xs-none"><?php echo tr("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo tr("FORECAST") ?></span>
            </button></li>
        </ul>
    <ul class="text-end nav nav-pills mb-0">
        <li><button class="btn btn-lg btn-link config-open" title="<?php echo tr('Edit') ?>"><span class="svg-icon-wrench"></span></button></li>
        <li><button class="btn btn-lg btn-link config-close hide" title="<?php echo tr('Close') ?>"><span class="svg-icon-close"></span></button></li>
    </ul>
</nav>

<div id="app-block" style="display:none; color:#ccc">
    <div class="row g-0">
        <div class="col-md-10">
            <!--<div style="font-size:28px; font-weight:bold">uk<span style="color:#fff">grid</span></div>-->
            <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

            <div id="placeholder_bound" class="chart-placeholder">
                <div id="placeholder"></div>
            </div>
        </div>
        <div class="col-md-2">
            <div id="visible-checkboxes" style="margin-top:10px"></div>
        </div>
    </div>
    <br><br>
    <p style="font-size:14px" id="fuel-mix-info" class="hide">UK historic electricity demand and fuel mix obtained from <a href="https://www.elexonportal.co.uk">elexonportal.co.uk.</a>. <br>Embedded wind and solar obtained from <a href="https://data.nationalgrideso.com/data-groups/demand">data.nationalgrideso.com</a><br>Note that the demand series has been modified to include embedded wind and solar generation.</p>
    <p style="font-size:14px" id="forecast-info">14 day ahead UK wind, embedded wind, solar and demand forecast obtained from <a href="https://data.nationalgrideso.com/data-groups/demand">data.nationalgrideso.com</a>.<br>Note that the demand forecast has been modified to include embedded wind and solar generation.</p>
    
    </p>
</div>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore the UK grid fuel mix and wind and solar forecast.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

<script>
    // ----------------------------------------------------------------------
    // Globals
    // ----------------------------------------------------------------------
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    feed.apikey = apikey;
    feed.public_userid = public_userid;
    feed.public_username = public_username;

    if (!sessionwrite) $(".config-open").hide();

    // ----------------------------------------------------------------------
    // Configuration
    // ----------------------------------------------------------------------
    config.app = {};
    config.app_name = "UK Grid Visualisation";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
    config.feeds = {};
    config.initapp = function() {};
    config.showapp = function() {
        $(".ajax-loader").hide();
    };
    config.hideapp = function() {};
    config.init();
</script>

<?php load_js("Modules/app/apps/OpenEnergyMonitor/ukgrid/ukgrid.js"); ?>
