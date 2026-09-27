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
<?php load_js("Lib/js/clipboard.js"); ?>

<div class="app-page" data-bs-theme="light">
  <section id="app-block" style="display:none">

    <div class="app-block">
      <div class="app-bar">
        <div class="app-bar-title" id="app_name">MY HEATPUMP</div>
        <a id="permalink" href="" title="Share this view" class="app-bar-btn"><span class="svg-icon-link"></span></a>
        <button class="app-bar-btn config-open" title="Configure app"><span class="svg-icon-wrench"></span></button>
      </div>

      <div class="app-block-body">
        <div id="last_updated" class="app-stat-title text-center py-2" style="display:none">Last updated 3rd of June 2022</div>

        <div id="live_table" class="app-stats">
          <div id="realtime_cop_div" style="cursor:pointer">
            <div class="app-stat-title" id="realtime_cop_title">COP 30 mins</div>
            <div class="app-stat-value" id="realtime_cop_value">---</div>
          </div>
          <div>
            <div class="app-stat-title">Electric</div>
            <div class="app-stat-value"><span id="heatpump_elec">---</span><span class="app-stat-unit">W</span></div>
          </div>
          <div>
            <div class="app-stat-title">Heat Output</div>
            <div class="app-stat-value"><span id="heatpump_heat">---</span><span class="app-stat-unit">W</span></div>
          </div>
          <div>
            <div class="app-stat-title">Flow</div>
            <div class="app-stat-value"><span id="heatpump_flowT">---</span><span class="app-stat-unit">&deg;C</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-block">
      <div class="app-bar bargraph-navigation">
        <button class="app-bar-btn bargraph_mode active" mode="combined" title="Combined">ALL</button>
        <button class="app-bar-btn bargraph_mode" mode="running" title="When running"><span class="svg-icon-play"></span></button>
        <button class="app-bar-btn bargraph_mode" mode="space" title="Space heating"><span class="svg-icon-radiator"></span></button>
        <button class="app-bar-btn bargraph_mode" mode="water" title="Water heating"><span class="svg-icon-shower"></span></button>
        <button class="app-bar-btn bargraph_mode" mode="cooling" title="Cooling"><span class="svg-icon-snowflake"></span></button>
        <div class="app-bar-spacer"></div>
        <button class="app-bar-btn bargraph-day">DAY</button>
        <button class="app-bar-btn bargraph-period wide" days=7>WEEK</button>
        <button class="app-bar-btn bargraph-period" days=30>MONTH</button>
        <button class="app-bar-btn bargraph-period wide" days=90>3 MONTHS</button>
        <button class="app-bar-btn bargraph-period" days=365>YEAR</button>
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
        <div id="placeholder_bound" style="width:100%; height:500px; overflow:hidden; position:relative">
          <div id="placeholder" style="height:500px"></div>
          <div id="overlay" style="display:none">
            <div id="overlay_text"></div>
          </div>
        </div>
      </div>

      <div class="app-block-foot d-flex flex-wrap align-items-center gap-3">
        <div class="me-auto">COP in window: <b id="window-cop" style="cursor:pointer"></b> <span id="window-carnot-cop"></span></div>
        <div id="emitter-spec-volume" style="display:none"></div>
        <div id="data-error" style="display:none">DATA ERROR</div>
        <button id="advanced-toggle" class="nav-link" style="display:none">SHOW DETAIL</button>
      </div>

        <div id="advanced-block" class="app-block-body" style="display:none">
          <div>

            <div id="error-message" style="display:none" class="alert alert-danger"></div>

            <div class="app-stats">
              <div class="show_stats_category active" key="combined">
                <div class="cop-title">Full window</div>
                <div class="cop-value"><span class="cop_combined">---</span></div>
              </div>

              <div class="show_stats_category" key="when_running" style="color:#698d5d">
                <div class="cop-title">When running</div>
                <div class="cop-value"><span class="cop_when_running">---</span></div>
              </div>

              <div class="show_stats_category" key="space_heating" style="color:#f6a801">
                <div class="cop-title">Space heating</div>
                <div class="cop-value"><span class="cop_space_heating">---</span></div>
              </div>

              <div class="show_stats_category" key="water_heating" style="color:#014656">
                <div class="cop-title">Water heating</div>
                <div class="cop-value"><span class="cop_water_heating">---</span></div>
              </div>

              <div class="show_stats_category" key="cooling" style="color:#014656; display:none">
                <div class="cop-title">Cooling</div>
                <div class="cop-value"><span class="cop_cooling">---</span></div>
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

    <div class="app-block">
      <div class="app-bar">
        <div class="app-bar-title" id="all_time_history_title">ALL TIME HISTORY</div>
      </div>

      <div class="app-block-body app-stats">
        <div>
          <div class="app-stat-title">Total Electricity input</div>
          <div class="app-stat-value"><span id="total_elec"></span><span class="app-stat-unit">kWh</span></div>
        </div>
        <div>
          <div class="app-stat-title">Total Heat output</div>
          <div class="app-stat-value"><span id="total_heat"></span><span class="app-stat-unit">kWh</span></div>
        </div>
        <div>
          <div class="app-stat-title">SCOP</div>
          <div class="app-stat-value"><span id="total_cop"></span></div>
        </div>
        <div id="boiler_total_bound" style="display:none">
          <div class="app-stat-title">Boiler Heat</div>
          <div class="app-stat-value"><span id="total_boiler"></span><span class="app-stat-unit">kWh</span></div>
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
