<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/myboiler/style.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>

<?php load_js("Lib/js/DateTimePicker.js"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>
<div class="app-page" data-bs-theme="light">
  <section id="app-block" style="display:none">

    <div class="app-card">
      <nav class="app-card-head">
        <div class="nav nav-underline">
          <button class="nav-link active"><i class="svg-icon-radiator"></i><span id="app_name">My Boiler</span></button>
        </div>
        <div class="app-card-tools">
          <span id="live-status" class="app-status"><span class="app-status-dot"></span><span class="app-status-text"></span></span>
          <div class="nav">
            <a id="permalink" href="" title="Share this view" class="nav-link"><i class="svg-icon-link"></i></a>
            <button class="nav-link config-open" title="Configure app"><i class="svg-icon-wrench"></i></button>
          </div>
        </div>
      </nav>
      <div id="live_table" class="app-live">
        <div>
          <div class="app-live-label">Boiler heat</div>
          <div class="app-live-value text-boiler-heat"><span id="boiler_heat">---</span><span class="power-unit-static">W</span></div>
        </div>
        <div>
          <div class="app-live-label">Boiler electric</div>
          <div class="app-live-value text-boiler-elec"><span id="boiler_elec">---</span><span class="power-unit-static">W</span></div>
        </div>
        <div>
          <div class="app-live-label">Flow temp</div>
          <div class="app-live-value text-boiler-flow"><span id="boiler_flowT">---</span><span class="power-unit-static">&deg;C</span></div>
        </div>
        <div>
          <div class="app-live-label">Room temp</div>
          <div class="app-live-value"><span id="boiler_roomT">---</span><span class="power-unit-static">&deg;C</span></div>
        </div>
      </div>
    </div>

    <div class="app-card app-card-body">
      <div id="graph-nav" class="app-navbar">
        <?php
        // Power view uses up to a month, daily bars from a week to all time
        $timebar_ranges = array(1 => tr('1 hour'), 6 => tr('6 hours'), 24 => tr('24 hours'), 168 => tr('1 week'), 720 => tr('1 month'), 2160 => tr('3 months'), 8760 => tr('1 year'), 'all' => tr('All time'));
        include "Modules/app/Lib/timebar.php";
        ?>
        <div class="btn-group app-segmented viewmode-toggle ms-auto">
          <button class="btn viewpower"><?php echo tr('Power') ?></button>
          <button class="btn viewhistory active"><?php echo tr('Daily') ?></button>
        </div>
      </div>
      <?php include "Modules/app/Lib/timebar_manual.php"; ?>

      <div id="placeholder_bound" style="width:100%; height:500px; overflow:hidden">
        <div id="placeholder" style="height:500px"></div>
      </div>
      <div id="chart-legend" class="app-legend"></div>

      <div class="app-card-caption app-chart-foot">
        <span class="app-section-label">Efficiency in window</span>
        <b id="window-efficiency" class="boiler-window-value"></b>
        <span class="svg-icon-info app-caption-note" title="Make sure to select period that includes all boiler fuel steps"></span>
        <div class="nav ms-auto"><button id="advanced-toggle" class="nav-link" style="display:none">SHOW DETAIL</button></div>
      </div>
    </div>

    <div id="advanced-block" class="app-card app-card-body" style="display:none">
      <div class="app-tiles">
        <div class="show_stats_category active" key="combined">
          <div class="app-tile-title">Full window</div>
          <div class="app-tile-value"><span class="cop_combined">---</span> <span class="app-tile-unit">kWh heat</span></div>
        </div>

        <div class="show_stats_category" key="when_running" style="color:#698d5d">
          <div class="app-tile-title">When running</div>
          <div class="app-tile-value"><span class="cop_when_running">---</span> <span class="app-tile-unit">kWh heat</span></div>
        </div>

        <div class="show_stats_category" key="space_heating" style="color:#f6a801">
          <div class="app-tile-title">Space heating</div>
          <div class="app-tile-value"><span class="cop_space_heating">---</span> <span class="app-tile-unit">kWh heat</span></div>
        </div>

        <div class="show_stats_category" key="water_heating" style="color:#014656">
          <div class="app-tile-title">Water heating</div>
          <div class="app-tile-value"><span class="cop_water_heating">---</span> <span class="app-tile-unit">kWh heat</span></div>
        </div>
      </div>

      <table class="table">
        <tr>
          <th></th>
          <th class="stats-col text-body-secondary">Min</th>
          <th class="stats-col text-body-secondary">Max</th>
          <th class="stats-col text-body-secondary">Diff</th>
          <th class="stats-col">Mean</th>
          <th class="stats-col">kWh</th>
        </tr>
        <tbody class="stats_category" key="combined"></tbody>
        <tbody class="stats_category" key="when_running" style="display:none"></tbody>
        <tbody class="stats_category" key="water_heating" style="display:none"></tbody>
        <tbody class="stats_category" key="space_heating" style="display:none"></tbody>
      </table>

      <div class="app-section-label app-options-label">Chart options</div>
      <div class="app-options">
        <div id="show_boiler_fuel_kwh_bound" class="app-option">
          <input id="show_boiler_fuel_kwh" type="checkbox" checked>
          <b>Show boiler fuel kWh</b>
        </div>

        <div id="show_flow_rate_bound" style="display:none" class="app-option">
          <input id="show_flow_rate" type="checkbox">
          <b>Show flow rate</b>
        </div>

        <div id="show_inst_cop_bound" class="app-option">
          <input id="emitter_spec_enable" type="checkbox">
          <b>Calculate emitter spec and system volume</b>
          <div id="emitter_spec_options" style="margin-top:10px; display:none">
            <p>1. Select period of steady state operation where flow and return temperatures are flat</p>

            <div class="input-group">
              <input type="text" class="form-control" style="width:64px" id="kW_at_50" disabled>
              <span class="input-group-text">kW @ DT50</span>
              <button class="btn btn-outline-secondary" id="use_for_volume_calc">Use for volume calc</button>
            </div>

            <p>2. Select space heating period with increasing flow and return temperatures</p>

            <div class="input-group">
              <input type="text" class="form-control" style="width:64px" id="system_volume" disabled>
              <span class="input-group-text">Litres</span>
            </div>
          </div>
        </div>

        <div class="app-option">
          <div style="float:right"><span id="standby_kwh"></span> kWh</div>
          <input id="configure_standby" type="checkbox">
          <b>Configure standby</b>
          <div id="configure_standby_options" style="display:none">
            <div class="input-group">
              <span class="input-group-text">Starting power</span>
              <input type="text" class="form-control" style="width:64px" id="starting_heat" value="100">
              <span class="input-group-text">W</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-card app-card-body">
      <div class="app-card-caption"><span class="app-section-label" id="all_time_history_title">All time history</span></div>
      <div class="app-live">
        <div>
          <div class="app-live-label">Fuel input</div>
          <div class="app-live-value text-boiler-fuel"><span id="total_fuel"></span><span class="power-unit-static">kWh</span></div>
        </div>
        <div>
          <div class="app-live-label">Electricity input</div>
          <div class="app-live-value text-boiler-elec"><span id="total_elec"></span><span class="power-unit-static">kWh</span></div>
        </div>
        <div>
          <div class="app-live-label">Heat output</div>
          <div class="app-live-value text-boiler-heat"><span id="total_heat"></span><span class="power-unit-static">kWh</span></div>
        </div>
        <div>
          <div class="app-live-label">Efficiency</div>
          <div class="app-live-value text-boiler-eff"><span id="total_efficiency"></span><span class="power-unit-static">%</span></div>
        </div>
      </div>
    </div>

  </section>

<div id="appconf-description" style="display:none">
  <p class="lead">The My Boiler app can be used to explore the performance of a boiler including, fuel input, electricity consumption, heat output, efficiency and system temperatures.</p>
  <p><strong class="text-white">Share publicly:</strong> Check the "public" check box if you want to share your dashboard publicly, and ensure that the associated feeds are also made public by adjusting their settings on the feeds page.</p>
  <p><strong class="text-white">Start date:</strong> To modify the start date for cumulative total electricity consumption, heat output and SCOP, input a unix timestamp corresponding to your desired starting date and time.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>
  var apikey = "<?php print $apikey; ?>";
  var session_write = <?php echo $session['write']; ?>;
  
  config.app_name = "My Boiler";
  config.app_name_color = "#fb5e50";
  config.id = <?php echo $id; ?>;
  config.name = "<?php echo $name; ?>";
  config.public = <?php echo $public; ?>;
  config.db = <?php echo json_encode($config); ?>;

</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/myboiler/myboiler.js"); ?>
