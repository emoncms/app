<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>

<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>
<?php load_js("Lib/js/DateTimePicker.js"); ?>


<?php $v += 8; ?>

<div class="app-page" data-bs-theme="light">
    <section id="app-block" style="display:none">

        <div id="octopus-realtime" class="app-block">
            <div class="app-bar">
                <div id="app-title" class="app-bar-title">Time of use tariff explorer</div>
                <button class="app-bar-btn config-open" title="Configure app"><span class="svg-icon-wrench"></span></button>
            </div>

            <div class="app-block-body app-stats">
                <div>
                    <div class="app-stat-title">IMPORT NOW</div>
                    <div class="app-stat-value" id="power_now">0</div>
                </div>
                <div class="last_halfhour_stats">
                    <div class="app-stat-title">CURRENT PRICE</div>
                    <div class="app-stat-value" id="unit_price"></div>
                </div>
                <div class="last_halfhour_stats">
                    <div class="app-stat-title">CURRENT HALF HOUR</div>
                    <div class="app-stat-value"><span id="kwh_halfhour"></span> <span id="cost_halfhour" class="app-stat-unit"></span></div>
                </div>
            </div>
        </div>

        <div class="app-block">
            <div class="app-bar graph-navigation">
                <div id="history-title" class="app-bar-title d-none d-sm-block">HISTORY</div>
                <select class="form-select form-select-sm w-auto align-self-center mx-2 time-select">
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
                <button class="app-bar-btn" id="left" title="Scroll left">&lt;</button>
                <button class="app-bar-btn" id="right" title="Scroll right">&gt;</button>
                <button class="app-bar-btn" id="fastleft" title="Scroll left fast">&lt;&lt;</button>
                <button class="app-bar-btn" id="fastright" title="Scroll right fast">&gt;&gt;</button>
            </div>

            <div class="app-block-body">
                <div id="placeholder_bound" style="width:100%; height:400px">
                    <div id="placeholder" style="height:400px"></div>
                </div>
            </div>

            <div class="app-block-foot power-graph-footer" style="display:none">
                <table class="table">
                    <tr>
                        <th></th>
                        <th>Energy</th>
                        <th>Cost / Value</th>
                        <th>Unit price</th>
                    </tr>
                    <tbody id="octopus_totals"></tbody>
                </table>

                <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <div class="input-group w-auto">
                        <span class="input-group-text"><?php echo tr('Start') ?></span>
                        <input id="request-start" class="form-control" type="text" style="width:190px" placeholder="YYYY-MM-DD HH:MM:SS" />
                    </div>
                    <div class="input-group w-auto">
                        <span class="input-group-text"><?php echo tr('End') ?></span>
                        <input id="request-end" class="form-control" type="text" style="width:190px" placeholder="YYYY-MM-DD HH:MM:SS" />
                    </div>
                    <div class="ms-auto">
                        <button class="btn btn-default hide" id="show_profile">Show Profile</button>
                        <button class="btn btn-default" id="download-csv">Download CSV</button>
                    </div>
                </div>

                <div>
                    <div id="use_meter_kwh_hh_bound" class="app-option hide">
                        <input id="use_meter_kwh_hh" type="checkbox" checked> <b>Show energy and costs based on Octopus smart meter data where available</b>
                        <div id="meter_kwh_hh_comparison" class="small text-body-secondary ps-4"></div>
                    </div>
                    <div id="show_carbonintensity_bound" class="app-option">
                        <input id="show_carbonintensity" type="checkbox"> <b>Show grid carbon intensity</b>
                        <div id="carbonintensity_result" class="small text-body-secondary ps-4"></div>
                    </div>
                </div>

                <!-- Monthly data table -->
                <div id="monthly-data" class="hide mt-3">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Energy (kWh)</th>
                                <th>Tariff A Cost (&pound;)</th>
                                <th></th>
                                <th>Tariff B Cost (&pound;)</th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="monthly-data-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

    </section>

<div id="appconf-description" class="hide">
<p class="lead">Explore Octopus Agile tariff costs over time.</p>
<p><strong class="text-white">Import & Import kWh</strong> The standard naming for electricity imported from the grid in a household without solar PV is 'use' and 'use_kwh', this app expects 'import' and 'import_kwh' in order to provide compatibility with the Solar PV option as well. Select relevant house consumption feeds using the dropdown feed selectors as required. Feeds 'use_kwh' and 'solar_kwh' are optional.</p>
<p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor. To create cumulative kWh feeds from historic power data try the postprocess module.</p>
<p><strong class="text-white">meter_kwh_hh</strong> If you have half hourly Octopus smart meter data available select the applicable feed.</p>
<p><strong class="text-white">Optional: Octopus Outgoing</strong> Include total house consumption (use_kwh) and solar PV (solar_kwh) feeds to explore octopus outgoing feed-in-tariff potential.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

config.app_name = "Tariff Explorer";
config.app_name_color = "#44b3e2";
</script>

<!-- include tariff_explorer.js -->
<?php load_js("Modules/app/apps/OpenEnergyMonitor/octopus/tariff_explorer.js"); ?>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/octopus/profile.js"); ?>