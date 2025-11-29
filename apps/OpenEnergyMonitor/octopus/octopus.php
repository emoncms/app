<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Lib/bootstrap-datetimepicker-0.0.11/css/bootstrap-datetimepicker.min.css" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
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

<div style="font-family: Montserrat, Veranda, sans-serif;">
    <div id="app-block" style="display:none">

        <div id="octopus-realtime" class="col1">
            <div class="col1-inner">

                <div class="block-bound">
                    <div class="bluenav config-open"><i class="icon-wrench icon-white"></i></div>
                    <div id="app-title" class="block-title">Time of use tariff explorer</div>
                </div>

                <div style="background-color:#fff; color:#333; padding:10px;">
                    <table style="width:100%">
                        <tr>
                            <td style="width:40%">
                                <div class="electric-title">IMPORT NOW</div>
                                <div class="power-value"><span id="power_now">0</span></div>
                            </td>

                            <td style="text-align:center" class="last_halfhour_stats">
                                <div class="electric-title">CURRENT PRICE</div>
                                <div class="power-value"><span id="unit_price"></span></div>
                            </td>

                            <td style="text-align:right" class="last_halfhour_stats">
                                <div class="electric-title">CURRENT HALF HOUR</div>
                                <div class="halfhour-value"><span id="kwh_halfhour"></span> <span id="cost_halfhour"></span></div>
                            </td>

                        </tr>
                    </table>
                </div>

            </div>
        </div>
        <div class="col1">
            <div class="col1-inner">

                <div class="block-bound" style="min-height:36px">

                    <div class="graph-navigation">
                        <span class="bluenav" id="fastright">&gt;&gt;</span>
                        <span class="bluenav" id="fastleft">&lt;&lt;</span>
                        <span class="bluenav" id="right">&gt;</span>
                        <span class="bluenav" id="left">&lt;</span>

                        <select class="time-select">
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

                    <div id="history-title" class="block-title">HISTORY</div>
                </div>

                <div style="background-color:rgba(68,179,226,0.1); padding:10px;">
                    <div id="placeholder_bound" style="width:100%; height:500px;">
                        <div id="placeholder" style="height:500px"></div>
                    </div>
                </div>

                <div class="power-graph-footer" style="background-color:#f0f0f0; color:#333; display:none">
                    <div style="padding:20px;">
                        <table style="width:100%" class="table">
                            <tr>
                                <th></th>
                                <th>Energy</th>
                                <th>Cost / Value</th>
                                <th>Unit price</th>
                            </tr>
                            <tbody id="octopus_totals"></tbody>
                        </table>

                        <div class="input-prepend input-append" style="padding-right:5px">
                            <span class="add-on" style="width:50px"><?php echo tr('Start') ?></span>
                            <span id="datetimepicker1">
                                <input id="request-start" data-format="dd/MM/yyyy hh:mm:ss" type="text" style="width:140px" />
                                <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                            </span>
                        </div>

                        <div class="input-prepend input-append" style="padding-right:5px">
                            <span class="add-on" style="width:50px"><?php echo tr('End') ?></span>
                            <span id="datetimepicker2">
                                <input id="request-end" data-format="dd/MM/yyyy hh:mm:ss" type="text" style="width:140px" />
                                <span class="add-on"><i data-time-icon="icon-time" data-date-icon="icon-calendar"></i></span>
                            </span>
                        </div>

                        <button class="btn" style="float:right" id="download-csv">Download CSV</button>
                        <button class="btn hide" style="float:right" id="show_profile">Show Profile</button>
                        <div id="use_meter_kwh_hh_bound" class="hide"><input id="use_meter_kwh_hh" type="checkbox" checked /> <span style="font-size:12px">Show energy and costs based on Octopus smart meter data where available</span>
                            <div id="meter_kwh_hh_comparison" style="font-size:12px; padding-left:22px"></div>
                        </div>
                        <div id="show_carbonintensity_bound"><input id="show_carbonintensity" type="checkbox" /> <span style="font-size:12px">Show grid carbon intensity</span>
                            <div id="carbonintensity_result" style="font-size:12px; padding-left:22px"></div>
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
            </div>
        </div>
    </div>

    <section id="app-setup" class="hide pb-3">
        <!-- instructions and settings -->
        <div class="px-3">
            <div class="row-fluid">
                <div class="span7 appconfig-description">
                    <div class="appconfig-description-inner text-light">
                        <h2 class="appconfig-title text-primary"><?php echo tr('Octopus Agile'); ?></h2>
                        <p class="lead">Explore Octopus Agile tariff costs over time.</p>
                        <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                        <p><strong class="text-white">Import & Import kWh</strong> The standard naming for electricity imported from the grid in a household without solar PV is 'use' and 'use_kwh', this app expects 'import' and 'import_kwh' in order to provide compatibility with the Solar PV option as well. Select relevant house consumption feeds using the dropdown feed selectors as required. Feeds 'use_kwh' and 'solar_kwh' are optional.</p>
                        <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor. To create cumulative kWh feeds from historic power data try the postprocess module.</p>
                        <p><strong class="text-white">meter_kwh_hh</strong> If you have half hourly Octopus smart meter data available select the applicable feed.</p>
                        <p><strong class="text-white">Optional: Octopus Outgoing</strong> Include total house consumption (use_kwh) and solar PV (solar_kwh) feeds to explore octopus outgoing feed-in-tariff potential.</p>
                        <img src="../Modules/app/images/agile_app.png" class="d-none d-sm-inline-block">
                    </div>
                </div>
                <div class="span5 app-config pt-3"></div>
            </div>
        </div>
    </section>
</div>

<div class="ajax-loader"></div>

<script>
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
</script>

<!-- include tariff_explorer.js -->
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/octopus/tariff_explorer.js?v=<?php echo time(); ?>"></script>