<?php
// UK Grid Fuel Mix Visualisation
// By Trystan Lea, OpenEnergyMonitor.org
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/clipboard.js");
load_js("Lib/js/DateTimePicker.js");
load_css("Theme/css/datetimepicker.css");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/ukgrid/ukgrid.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-card">
        <nav class="app-card-head border-0">
            <div id="tabs" class="nav nav-underline">
                <button class="nav-link fuelmix" title="<?php echo tr('Fuel mix history') ?>"><i class="svg-icon-earth"></i><?php echo tr('UK fuel mix') ?></button>
                <button class="nav-link forecast active" title="<?php echo tr('Wind and solar forecast') ?>"><i class="svg-icon-sun"></i><?php echo tr('Forecast') ?></button>
            </div>
            <div class="app-card-tools">
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
                720 => tr('1 month'),
                8760 => tr('1 year')
            );
            include "Modules/app/Lib/timebar.php";
            ?>
        </div>

        <?php include "Modules/app/Lib/timebar_manual.php"; ?>

        <div id="placeholder_bound"><div id="placeholder"></div></div>
        <div id="visible-checkboxes" class="app-legend"></div>
    </div>

    <div class="app-card app-card-body uk-info">
        <p id="fuel-mix-info" class="hide"><?php echo tr('UK historic electricity demand and fuel mix from') ?> <a href="https://www.elexonportal.co.uk">elexonportal.co.uk</a>. <?php echo tr('Embedded wind and solar from') ?> <a href="https://data.nationalgrideso.com/data-groups/demand">data.nationalgrideso.com</a>.<br><?php echo tr('The demand series includes embedded wind and solar generation.') ?></p>
        <p id="forecast-info"><?php echo tr('14 day ahead UK wind, embedded wind, solar and demand forecast from') ?> <a href="https://data.nationalgrideso.com/data-groups/demand">data.nationalgrideso.com</a>.<br><?php echo tr('The demand forecast includes embedded wind and solar generation.') ?></p>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore the UK grid fuel mix and wind and solar forecast.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

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
