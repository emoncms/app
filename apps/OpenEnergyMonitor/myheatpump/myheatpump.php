<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/myheatpump/style.css"); ?>

<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>
<?php load_js("Lib/js/clipboard.js"); ?>

<?php load_js("Lib/js/DateTimePicker.js"); ?>
<?php load_css("Theme/css/datetimepicker.css"); ?>
<div class="app-page" data-bs-theme="light">
  <section id="app-block" style="display:none">

    <div class="app-card">
      <nav class="app-card-head">
        <div class="nav nav-underline">
          <button class="nav-link active"><i class="svg-icon-hpmon hp-title-icon"></i><span id="app_name">My Heatpump</span></button>
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
        <div id="realtime_cop_div" style="cursor:pointer" title="Switch between 30 minute and instant COP">
          <div class="app-live-label" id="realtime_cop_title">COP 30 mins</div>
          <div class="app-live-value text-hp-cop" id="realtime_cop_value">---</div>
        </div>
        <div>
          <div class="app-live-label">Electric</div>
          <div class="app-live-value text-hp-elec"><span id="heatpump_elec">---</span><span class="power-unit-static">W</span></div>
        </div>
        <div>
          <div class="app-live-label">Heat output</div>
          <div class="app-live-value text-hp-heat"><span id="heatpump_heat">---</span><span class="power-unit-static">W</span></div>
        </div>
        <div>
          <div class="app-live-label">Flow<span class="hp-return-part"> &middot; return</span></div>
          <div class="app-live-value text-hp-flow"><span id="heatpump_flowT">---</span><span class="power-unit-static">&deg;C</span><span class="hp-return-part hp-return"><span id="heatpump_returnT">---</span>&deg;</span></div>
        </div>
      </div>
    </div>

    <div class="app-card app-card-body">
      <div id="graph-nav" class="app-navbar">
        <div class="btn-group app-segmented bargraph-navigation">
          <button class="btn bargraph_mode active" mode="combined" title="Combined">All</button>
          <button class="btn bargraph_mode" mode="running" title="When running"><i class="svg-icon-play"></i> Running</button>
          <button class="btn bargraph_mode" mode="space" title="Space heating"><i class="svg-icon-radiator"></i> Space</button>
          <button class="btn bargraph_mode" mode="water" title="Water heating"><i class="svg-icon-shower"></i> Water</button>
          <button class="btn bargraph_mode" mode="cooling" title="Cooling"><i class="svg-icon-snowflake"></i> Cooling</button>
        </div>
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

      <div id="placeholder_bound" style="width:100%; height:500px; overflow:hidden; position:relative">
        <div id="placeholder" style="height:500px"></div>
        <div id="overlay" style="display:none">
          <div id="overlay_text"></div>
        </div>
      </div>
      <div id="chart-legend" class="app-legend"></div>

      <div class="app-card-caption app-chart-foot">
        <span class="app-section-label">COP in window</span>
        <b id="window-cop" class="hp-window-cop"></b>
        <span id="window-carnot-cop" class="app-caption-note"></span>
        <span id="emitter-spec-volume" class="app-caption-note" style="display:none"></span>
        <span id="data-error" style="display:none">DATA ERROR</span>
        <div class="nav ms-auto"><button id="advanced-toggle" class="nav-link" style="display:none">SHOW DETAIL</button></div>
      </div>
    </div>

    <div id="advanced-block" class="app-card app-card-body" style="display:none">
          <div>

            <div id="error-message" style="display:none" class="alert alert-danger"></div>

            <div class="app-tiles">
              <div class="show_stats_category active" key="combined">
                <div class="app-tile-title">Full window</div>
                <div class="app-tile-value"><span class="cop_combined">---</span></div>
              </div>

              <div class="show_stats_category" key="when_running" style="color:#698d5d">
                <div class="app-tile-title">When running</div>
                <div class="app-tile-value"><span class="cop_when_running">---</span></div>
              </div>

              <div class="show_stats_category" key="space_heating" style="color:#f6a801">
                <div class="app-tile-title">Space heating</div>
                <div class="app-tile-value"><span class="cop_space_heating">---</span></div>
              </div>

              <div class="show_stats_category" key="water_heating" style="color:#014656">
                <div class="app-tile-title">Water heating</div>
                <div class="app-tile-value"><span class="cop_water_heating">---</span></div>
              </div>

              <div class="show_stats_category" key="cooling" style="color:#014656; display:none">
                <div class="app-tile-title">Cooling</div>
                <div class="app-tile-value"><span class="cop_cooling">---</span></div>
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
              <tbody class="stats_category" key="cooling" style="display:none"></tbody>
            </table>

            <div class="app-section-label app-options-label">Chart options</div>
            <div class="app-options">
            <div id="show_immersion_bound" style="display:none" class="app-option">
              <div style="float:right"><span id="immersion_kwh"></span> kWh</div>
              <input id="show_immersion" type="checkbox">
              <b>Show immersion</b>
            </div>

            <div id="show_flow_rate_bound" style="display:none" class="app-option">
              <input id="show_flow_rate" type="checkbox">
              <b>Show flow rate</b>
            </div>
            <div id="show_dhw_temp_bound" style="display:none" class="app-option">
              <input id="show_dhw_temp" type="checkbox">
              <b>Show DHW temperature/charge</b>
            </div>
            <div id="show_cooling_bound" class="app-option">
              <div style="float:right"><span id="total_defrost_and_loss_kwh"></span> kWh (<span id="prc_defrost_and_loss"></span>%)</div>
              <input id="show_defrost_and_loss" type="checkbox">
              <b>Show defrosts and other heat lost</b>
            </div>

            <div id="show_inst_cop_bound" class="app-option">

              <input id="show_instant_cop" type="checkbox">
              <b>Show instantaneous COP</b>

              <div id="inst_cop_options" style="display:none">
                <div class="input-group">
                  <span class="input-group-text">Valid COP</span>
                  <span class="input-group-text">Min</span>
                  <input type="text" class="form-control" style="width:64px" id="inst_cop_min" value="1.0">
                  <span class="input-group-text">Max</span>
                  <input type="text" class="form-control" style="width:64px" id="inst_cop_max" value="8.0">
                </div>

                <div class="input-group">
                  <span class="input-group-text">Moving average</span>
                  <select id="inst_cop_mv_av_dp" class="form-select" style="width:100px">
                    <option value="0" selected>Disabled</option>
                    <option value="3">3 points</option>
                    <option value="5">5 points</option>
                  </select>
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="app-option">
              <input id="carnot_enable" type="checkbox">
              <b>Show simulated carnot heat output</b>

              <div id="carnot_sim_options" style="display:none">
                <div class="input-group">
                  <span class="input-group-text">Condensing offset (K)</span>
                  <input type="text" class="form-control" style="width:64px" id="condensing_offset" value="2">
                </div>
                <div class="input-group">
                  <span class="input-group-text">Evaporator offset (K)</span>
                  <input type="text" class="form-control" style="width:64px" id="evaporator_offset" value="-6">
                </div>
                <div id="heatpump_factor_bound" class="input-group" style="margin-top:5px; margin-bottom:0px">
                  <span class="input-group-text">Heatpump factor</span>
                  <input type="text" class="form-control" style="width:64px" id="heatpump_factor" value="0.47">
                </div>
                <div id="fixed_outside_temperature_bound" class="input-group" style="margin-top:5px; margin-bottom:0px">
                  <span class="input-group-text">Fixed outside temperature (C)</span>
                  <input type="text" class="form-control" style="width:64px" id="fixed_outside_temperature" value="6.0">
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="app-option">
              <input id="carnot_enable_prc" type="checkbox">
              <b>Show as % of carnot COP</b>

              <div id="carnot_prc_options" style="display:none">
                <p>Measured COP vs Carnot COP distribution:</p>
                <div id="histogram_bound" style="width:100%; height:400px;overflow:hidden">
                  <div id="histogram" style="height:400px"></div>
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="app-option">
              <input id="emitter_spec_enable" type="checkbox">
              <b>Calculate emitter spec and system volume</b>
              <div id="emitter_spec_options" style="margin-top:10px; display:none">
                <p>Make sure there is at least a short period of steady state running in the window.<br>Heat output spikes after hot water cycles can skew results.</p>
                <div class="input-group">
                  <input type="text" class="form-control" style="width:64px" id="kW_at_50" disabled>
                  <span class="input-group-text">kW @ DT50</span>
                  <span class="input-group-text">Fix <input type="checkbox" id="fix_kW_at_50"></span>
                </div>
                <div class="input-group">
                  <input type="text" class="form-control" style="width:64px" id="system_volume" disabled>
                  <span class="input-group-text">Litres</span>
                </div>
                <br>
                <div class="input-group">
                  <span class="input-group-text">Room temperature</span>

                  <input type="text" class="form-control" style="width:64px" id="room_temperature" disabled>
                  <span class="input-group-text">&deg;C</span>
                  <span class="input-group-text">Manual <input type="checkbox" id="manual_roomT_enable"></span>
                </div>
              </div>
            </div>
            <!-- DHW Standby Heat Loss Calculation Option -->
            <div class="app-option">
              <input id="standby_dhw_hl_enable" type="checkbox">
              <b>Calculate DHW Standby Heat Loss Coefficient</b>
              <div id="standby_dhw_hl_options" style="margin-top:10px; display:none;">
                  <p class="small text-body-secondary"><i>Ensure the selected window only shows natural DHW temperature decay (no heating cycles, no DHW use such as showering). Cylinder volume and environmental temperature are required to compute standby heat loss coefficient, which only works if DHW temperature is measured in °C and not % Charge. </i></p>
                  <div class="input-group">
                    <span class="input-group-text">Cylinder Volume (V<sub>cyl</sub>)</span>
                    <input type="text" class="form-control" style="width:74px" id="cylinder_volume" value="200">
                    <span class="input-group-text">L</span>
                  </div>
                  <div class="input-group">
                    <span class="input-group-text">Environment Temp (T<sub>env</sub>)</span>
                    <input type="text" class="form-control" style="width:64px" id="env_temperature" value="15">
                    <span class="input-group-text">°C</span>
                  </div>
                  <div style="margin-top:10px;">
                      DHW Heat Loss Coefficient (U): <b id="standby_dhw_hl_result">---</b> W/K |  DHW charge half-life (T<sub>1/2</sub>): <b id="standby_dhw_t_half_result">---</b> days
                  </div>
              </div>
            </div>
            <!-- End DHWStandby Heat Loss -->
            <div class="app-option">
              <div style="float:right"><span id="standby_kwh"></span> kWh</div>
              <input id="configure_standby" type="checkbox">
              <b>Configure standby</b>
              <div id="configure_standby_options" style="display:none">
                <div class="input-group">
                  <span class="input-group-text">Starting power</span>
                  <input type="text" class="form-control" style="width:64px" id="starting_power" value="150">
                  <span class="input-group-text">W</span>
                </div>
              </div>

            </div>

            </div>
          </div>
        </div>

    <div class="app-card app-card-body">
      <div class="app-card-caption"><span class="app-section-label" id="all_time_history_title">All time history</span></div>
      <div class="app-live">
        <div>
          <div class="app-live-label">Electricity input</div>
          <div class="app-live-value text-hp-elec"><span id="total_elec"></span><span class="power-unit-static">kWh</span></div>
        </div>
        <div>
          <div class="app-live-label">Heat output</div>
          <div class="app-live-value text-hp-heat"><span id="total_heat"></span><span class="power-unit-static">kWh</span></div>
        </div>
        <div>
          <div class="app-live-label">SCOP</div>
          <div class="app-live-value text-hp-cop"><span id="total_cop"></span></div>
        </div>
        <div id="boiler_total_bound" style="display:none">
          <div class="app-live-label">Boiler heat</div>
          <div class="app-live-value"><span id="total_boiler"></span><span class="power-unit-static">kWh</span></div>
        </div>
      </div>
    </div>

  </section>

<div id="appconf-description" style="display:none">
  <p class="lead">The My Heatpump app can be used to explore the performance of a heatpump including, electricity consumption, heat output, COP and system temperatures.</p>
  <p><strong class="text-white">Share publicly:</strong> Check the "public" check box if you want to share your dashboard publicly, and ensure that the associated feeds are also made public by adjusting their settings on the feeds page.</p>
  <p><strong class="text-white">Start date:</strong> To modify the start date for cumulative total electricity consumption, heat output and SCOP, input a unix timestamp corresponding to your desired starting date and time.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>
  var apikey = "<?php print $apikey; ?>";
  var session_write = <?php echo $session['write']; ?>;

  config.app_name = "My Heatpump";
  config.app_name_color = "#fba050";

  config.id = <?php echo $id; ?>;
  config.name = "<?php echo $name; ?>";
  config.public = <?php echo $public; ?>;
  config.db = <?php echo json_encode($config); ?>;
</script>

<?php
load_js("Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_process.js");
load_js("Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_powergraph.js");
load_js("Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_bargraph.js");
load_js("Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump.js");
?>
