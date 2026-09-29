<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/octopus/octopus.css"); ?>

<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>
<?php load_js("Lib/js/DateTimePicker.js"); ?>


<?php $v += 8; ?>

<div class="app-page" data-bs-theme="light">
    <section id="app-block" style="display:none">

        <div id="octopus-realtime" class="app-card">
            <nav class="app-card-head">
                <div class="nav nav-underline">
                    <button class="nav-link active"><i class="svg-icon-smartmeter"></i><span id="app-title">Time of use tariff explorer</span></button>
                </div>
                <div class="app-card-tools">
                    <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
                    <div class="nav">
                        <button class="nav-link config-open" title="Configure app"><i class="svg-icon-wrench"></i></button>
                    </div>
                </div>
            </nav>
            <div class="app-live">
                <div>
                    <div class="app-live-label">Import now</div>
                    <div class="app-live-value text-te-import" id="power_now">---</div>
                </div>
                <div class="last_halfhour_stats">
                    <div class="app-live-label">Current price</div>
                    <div class="app-live-value text-te-price" id="unit_price"></div>
                </div>
                <div class="last_halfhour_stats">
                    <div class="app-live-label">Current half hour</div>
                    <div class="app-live-value text-te-import"><span id="kwh_halfhour"></span><span id="cost_halfhour" class="power-unit-static"></span></div>
                </div>
            </div>
        </div>

        <div class="app-card app-card-body">
            <div id="graph-nav" class="app-navbar">
                <?php
                // Named periods first, then windows ending now
                $timebar_ranges = array(
                    'T' => tr('Today'),
                    'Y' => tr('Yesterday'),
                    'W' => tr('Since Sunday'),
                    'M' => tr('This month'),
                    12 => tr('12 hours'),
                    24 => tr('24 hours'),
                    168 => tr('1 week'),
                    720 => tr('1 month'),
                    1440 => tr('2 months'),
                    8760 => tr('1 year')
                );
                include "Modules/app/Lib/timebar.php";
                ?>
                <div class="btn-group app-timebar">
                    <button id="fastleft" class="btn" title="Scroll left fast">&laquo;</button>
                    <button id="fastright" class="btn" title="Scroll right fast">&raquo;</button>
                </div>
                <div class="nav ms-auto align-items-center">
                    <span id="history-title" class="app-section-label me-2 d-none d-sm-inline">HISTORY</span>
                    <button class="nav-link hide" id="show_profile" title="Average day in the window">Show profile</button>
                    <button class="nav-link" id="download-csv" title="Download half hourly data"><i class="svg-icon-download"></i> CSV</button>
                </div>
            </div>
            <?php include "Modules/app/Lib/timebar_manual.php"; ?>

            <div id="placeholder_bound" style="width:100%; height:400px">
                <div id="placeholder" style="height:400px"></div>
            </div>
            <div id="chart-legend" class="app-legend"></div>
        </div>

        <div class="app-card app-card-body power-graph-footer" style="display:none">
            <div class="app-card-caption"><span class="app-section-label">Tariff comparison</span><span class="app-caption-note">Totals in the window</span></div>
            <div class="table-responsive">
                <table class="table">
                    <tr>
                        <th></th>
                        <th>Energy</th>
                        <th>Cost / Value</th>
                        <th>Unit price</th>
                    </tr>
                    <tbody id="octopus_totals"></tbody>
                </table>
            </div>

            <div class="app-options">
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
                <div class="app-card-caption"><span class="app-section-label">Monthly</span></div>
                <div class="table-responsive">
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