<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Lib/fonts/montserrat/montserrat.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/myheatpump/style.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>

<div class="app-page" data-bs-theme="light">
  <section id="app-block" style="display:none">

    <div class="app-block">
      <div class="app-bar">
        <div class="app-bar-title" id="app_name">MY BOILER</div>
        <a id="permalink" href="" title="Share this view" class="app-bar-btn"><span class="svg-icon-link"></span></a>
        <button class="app-bar-btn config-open" title="Configure app"><span class="svg-icon-wrench"></span></button>
      </div>

      <div class="app-block-body">
        <div id="last_updated" class="app-stat-title text-center py-2" style="display:none">Last updated 3rd of June 2022</div>

        <div id="live_table" class="app-stats">
          <div>
            <div class="app-stat-title">Boiler Heat</div>
            <div class="app-stat-value"><span id="boiler_heat">---</span><span class="app-stat-unit">W</span></div>
          </div>
          <div>
            <div class="app-stat-title">Boiler Electric</div>
            <div class="app-stat-value"><span id="boiler_elec">---</span><span class="app-stat-unit">W</span></div>
          </div>
          <div>
            <div class="app-stat-title">Flow temp</div>
            <div class="app-stat-value"><span id="boiler_flowT">---</span><span class="app-stat-unit">&deg;C</span></div>
          </div>
          <div>
            <div class="app-stat-title">Room temp</div>
            <div class="app-stat-value"><span id="boiler_roomT">---</span><span class="app-stat-unit">&deg;C</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-block">
      <div class="app-bar bargraph-navigation">
        <div class="app-bar-spacer"></div>
        <button class="app-bar-btn bargraph-day">DAY</button>
        <button class="app-bar-btn bargraph-week">WEEK</button>
        <button class="app-bar-btn bargraph-month">MONTH</button>
        <button class="app-bar-btn bargraph-quarter">3 MONTHS</button>
        <button class="app-bar-btn bargraph-year">YEAR</button>
        <button class="app-bar-btn bargraph-alltime">ALL</button>
      </div>

      <div class="app-bar powergraph-navigation" style="display:none">
        <div class="app-bar-spacer"></div>
        <button class="app-bar-btn time d-none d-sm-block" time='1' title="Last hour">H</button>
        <button class="app-bar-btn time" time='6' title="Last 6 hours">6</button>
        <button class="app-bar-btn time" time='24' title="Last 24 hours">D</button>
        <button class="app-bar-btn time d-none d-sm-block" time='168' title="Last 7 days">W</button>
        <button class="app-bar-btn time d-none d-sm-block" time='720' title="Last 30 days">M</button>
        <button class="app-bar-btn" id="zoomin" title="Zoom in">+</button>
        <button class="app-bar-btn" id="zoomout" title="Zoom out">-</button>
        <button class="app-bar-btn" id="left" title="Scroll left">&lt;</button>
        <button class="app-bar-btn" id="right" title="Scroll right">&gt;</button>
        <button class="app-bar-btn" id="live" title="Live scroll" style="display:none; color:yellow; cursor:default">&gt;&gt;</button>
        <button class="app-bar-btn viewhistory" title="Back to daily summary">BACK</button>
      </div>

      <div class="app-block-body">
        <div id="placeholder_bound" style="width:100%; height:500px; overflow:hidden">
          <div id="placeholder" style="height:500px"></div>
        </div>
      </div>

      <div class="app-block-foot d-flex flex-wrap align-items-center gap-3">
        <div class="me-auto">
          <span id="window-efficiency-bound" style="display:none">Efficiency in window: <b id="window-efficiency" style="cursor:pointer"></b> <span class="svg-icon-info" title="Make sure to select period that includes all boiler fuel steps"></span></span>
        </div>
        <button id="advanced-toggle" class="app-btn" style="display:none">SHOW DETAIL</button>
      </div>

        <div id="advanced-block" class="app-block-body" style="display:none">
          <div>



            <div class="app-stats">
                <div class="show_stats_category active" key="combined">
                  <div class="cop-title">Full window</div>
                  <div class="cop-value"><span class="cop_combined">---</span> <span class="small">kWh heat</span></div>
                </div>

                <div class="show_stats_category" key="when_running" style="color:#698d5d">
                  <div class="cop-title">When running</div>
                  <div class="cop-value"><span class="cop_when_running">---</span> <span class="small">kWh heat</span></div>
                </div>

                <div class="show_stats_category" key="space_heating" style="color:#f6a801">
                  <div class="cop-title">Space heating</div>
                  <div class="cop-value"><span class="cop_space_heating">---</span> <span class="small">kWh heat</span></div>
                </div>

                <div class="show_stats_category" key="water_heating" style="color:#014656">
                  <div class="cop-title">Water heating</div>
                  <div class="cop-value"><span class="cop_water_heating">---</span> <span class="small">kWh heat</span></div>
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
                  <button class="btn btn-default" id="use_for_volume_calc">Use for volume calc</button>
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
    </div>

    <div class="app-block">
      <div class="app-bar">
        <div class="app-bar-title" id="all_time_history_title">ALL TIME HISTORY</div>
      </div>

      <div class="app-block-body app-stats">
        <div>
          <div class="app-stat-title">Total fuel input</div>
          <div class="app-stat-value"><span id="total_fuel"></span><span class="app-stat-unit">kWh</span></div>
        </div>
        <div>
          <div class="app-stat-title">Total Electricity input</div>
          <div class="app-stat-value"><span id="total_elec"></span><span class="app-stat-unit">kWh</span></div>
        </div>
        <div>
          <div class="app-stat-title">Total Heat output</div>
          <div class="app-stat-value"><span id="total_heat"></span><span class="app-stat-unit">kWh</span></div>
        </div>
        <div>
          <div class="app-stat-title">Efficiency</div>
          <div class="app-stat-value"><span id="total_efficiency"></span><span class="app-stat-unit">%</span></div>
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
