<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session;
?>
<link href="<?php echo $path; ?>Lib/bootstrap-datetimepicker-0.0.11/css/bootstrap-datetimepicker.min.css" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path; ?>Lib/bootstrap-datetimepicker-0.0.11/js/bootstrap-datetimepicker.min.js"></script>


<?php $v += 8; ?>
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/octopus/tariff_explorer.css?v=<?php echo $v; ?>" rel="stylesheet">

<div id="app-block" style="display:none">

    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem; margin-top: 1rem;">

        <nav class="app-top-bar d-flex justify-content-between">
            <ul class="btn-list">
                <li><span class="electric-title"><svg class="icon" style="margin-right:6px; vertical-align:-0.125em;"><use xlink:href="#icon-schedule"></use></svg><span id="app-title">Time of use tariff explorer</span></span></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><svg class="icon"><use xlink:href="#icon-wrench"></use></svg></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><svg class="icon"><use xlink:href="#icon-close"></use></svg></button></li>
            </ul>
        </nav>

        <div style="padding:10px;">
            <div style="display:grid; grid-template-columns:2fr 3fr; align-items:center; text-align: center;">
                <div>
                    <div id="import_export" class="power-title">IMPORT NOW</div>
                    <div class="power-value"><span id="power_now">0</span></div>
                </div>
                <div style="text-align:center" class="last_halfhour_stats">
                    <div class="power-title">CURRENT PRICE</div>
                    <div class="power-value"><span id="unit_price"></span></div>
                </div>
            </div>
        </div>

    </div>

    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem;">
        <div id="graph-nav" class="visnavblock d-flex justify-content-start">
                <span class="visnav app-btn" id="zoomin">+</span>
                <span class="visnav app-btn" id="zoomout">-</span>
                <span class="visnav app-btn" id="left">&lt;</span>
                <span class="visnav app-btn" id="right">&gt;</span>
                <span class="visnav app-btn" id="fastleft">&lt;&lt;</span>
                <span class="visnav app-btn" id="fastright">&gt;&gt;</span>

                <select class="visnav time-select" style="height:32px">
                    <option value='8760'>Previous 365 days</option>
                    <option value='1440'>Previous 60 days</option>
                    <option value='720'>Previous 30 days</option>
                    <option value='168'>Previous 7 days</option>
                    <option value='24'>Previous 24 hours</option>
                    <option value='12'>Previous 12 hours</option>
                    <option value='M'>Since midnight 1st of month</option>
                    <option value='W'>Since midnight Sunday</option>
                    <option value='Y'>Yesterday</option>
                    <option value='T' selected>Today since midnight</option>
                    <option value='C'>Custom</option>
                </select>
        </div>

        <div style="padding:10px;">
            <div id="placeholder_bound" style="width:100%">
                <div id="placeholder" style="min-height:300px"></div>
            </div>
        </div>
    </div>

    <div style="padding:5px; background-color: #262626; border-radius: 0.375rem; margin-bottom: 1rem;">
        <div class="power-graph-footer" style="display:none">
            <div class="footer-controls">

                <table class="tariff-table">
                    <tr>
                        <th>Energy flow</th>
                        <th>Energy</th>
                        <th>Value / Cost</th>
                        <th>Unit price</th>
                        <th></th>
                    </tr>
                    <tbody id="octopus_totals"></tbody>
                </table>

                <div class="footer-inputs">
                    <div class="ctrl-group">
                        <span class="ctrl-label"><?php echo tr('Select Tariff') ?></span>
                        <select id="tariff"></select>
                    </div>

                    <div class="ctrl-group">
                        <span class="ctrl-label"><?php echo tr('Start') ?></span>
                        <span id="datetimepicker1">
                            <input id="request-start" data-format="dd/MM/yyyy hh:mm:ss" type="text" />
                            <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                        </span>
                    </div>

                    <div class="ctrl-group">
                        <span class="ctrl-label"><?php echo tr('End') ?></span>
                        <span id="datetimepicker2">
                            <input id="request-end" data-format="dd/MM/yyyy hh:mm:ss" type="text" />
                            <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                        </span>
                    </div>

                    <div class="ctrl-actions">
                        <button id="download-csv">Download CSV</button>
                        <button class="hide" id="show_profile">Show Profile</button>
                    </div>
                </div>

                <div class="footer-options">
                    <div id="use_meter_kwh_hh_bound" class="hide">
                        <label class="ctrl-checkbox"><input id="use_meter_kwh_hh" type="checkbox" checked /> <?php echo tr('Show energy and costs based on Octopus smart meter data where available') ?></label>
                        <div id="meter_kwh_hh_comparison" class="ctrl-note"></div>
                    </div>
                    <div id="show_carbonintensity_bound">
                        <label class="ctrl-checkbox"><input id="show_carbonintensity" type="checkbox" /> <?php echo tr('Show grid carbon intensity') ?></label>
                        <div id="carbonintensity_result" class="ctrl-note"></div>
                    </div>
                </div>

                <!-- Monthly data table -->
                <div id="monthly-data" class="hide mt-3">
                    <table class="tariff-table mb-3">
                        <thead><tr></tr></thead>
                        <tbody id="monthly-data-body"></tbody>
                    </table>
                    <button id="save-baseline">Save baseline</button>
                </div>

            </div>
        </div>
    </div>
</div>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore time of use tariff costs over time.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

<script>
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.app_name = "Octopus Tariff Explorer";
    config.app_name_color = "#44b3e2";
    
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
</script>
<?php

// Load app specific JS with auto versioning based on file modification time to prevent caching issues after updates
load_js_auto_version("tariff_explorer.js");
load_js_auto_version("profile.js");


function load_js_auto_version($scriptname) {
    global $path;
    $script_path = "Modules/app/apps/OpenEnergyMonitor/octopus/".$scriptname;

    $version_string = "";
    if (file_exists($script_path)) {
        $last_updated = filemtime($script_path);
        $version_string = "?v=".$last_updated;
    }
    echo '<script src="'.$path.$script_path.$version_string.'"></script>';
}
?>