<?php
// UK Grid Fuel Mix Visualisation
// By Trystan Lea, OpenEnergyMonitor.org
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/clipboard.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/ukgrid/ukgrid.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-panel">
        <nav class="app-top-bar d-flex justify-content-between mb-0 border-0">
            <ul id="tabs" class="btn-list app-tabs">
                <li><button class="app-btn fuelmix" title="<?php echo tr('Fuel mix history') ?>"><i class="svg-icon-earth"></i><span><?php echo tr('UK fuel mix') ?></span></button></li>
                <li><button class="app-btn forecast active" title="<?php echo tr('Wind and solar forecast') ?>"><i class="svg-icon-sun"></i><span><?php echo tr('Forecast') ?></span></button></li>
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
            <button class='visnav time app-btn' time='8760'><?php echo tr('Y') ?></button>
            <button id='zoomin' class='visnav app-btn'>+</button>
            <button id='zoomout' class='visnav app-btn'>-</button>
            <button id='left' class='visnav app-btn'>&lt;</button>
            <button id='right' class='visnav app-btn'>&gt;</button>
        </div>
        <div id="visible-checkboxes" class="uk-series-list"></div>
        <div id="placeholder_bound"><div id="placeholder"></div></div>
    </div>

    <div class="app-panel uk-info">
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
