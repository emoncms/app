<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/template/template.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <!-- Top bar and live values -->
    <div class="app-panel">
        <nav class="app-top-bar">
            <ul id="tabs" class="btn-list app-tabs">
                <li><button class="app-btn active" title="<?php echo tr('Power view') ?>"><i class="svg-icon-show_chart"></i><span><?php echo tr('Power') ?></span></button></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><i class="svg-icon-wrench"></i></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button></li>
            </ul>
        </nav>
        <div class="stats-grid stats-grid-2">
            <div>
                <h5 class="power-title"><?php echo tr('POWER') ?></h5>
                <h2 class="power-value text-use"><span id="powernow">0</span><span class="power-unit">W</span></h2>
            </div>
            <div>
                <h5 class="power-title"><?php echo tr('ENERGY') ?></h5>
                <h2 class="power-value text-use"><span id="kwhwindow">---</span><span class="power-unit">kWh</span></h2>
            </div>
        </div>
    </div>

    <!-- Time bar and chart -->
    <div class="app-panel">
        <div class="visnavblock mb-2 d-flex justify-content-start">
            <button class="visnav time app-btn" time="1">1<?php echo tr('h') ?></button>
            <button class="visnav time app-btn" time="24"><?php echo tr('D') ?></button>
            <button class="visnav time app-btn" time="168"><?php echo tr('W') ?></button>
            <button class="visnav time app-btn" time="720"><?php echo tr('M') ?></button>
            <button id="zoomin" class="visnav app-btn">+</button>
            <button id="zoomout" class="visnav app-btn">-</button>
            <button id="left" class="visnav app-btn">&lt;</button>
            <button id="right" class="visnav app-btn">&gt;</button>
        </div>
        <div id="graph"></div>
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
