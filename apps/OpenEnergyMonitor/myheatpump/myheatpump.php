<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=102"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/lib/jquery.flot.axislabels.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/lib/jquery.flot.tooltip.min.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/misc/clipboard.js?v=<?php echo $v; ?>"></script>
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/style.css?v=49>" rel="stylesheet">

<div style="font-family: Montserrat, Veranda, sans-serif;">
  <div id="app-block" style="display:none">

    <div class="col1">
      <div class="col1-inner">
        <div class="block-bound">
          <div style="float:right">
            <a id="permalink" href="" title="Share this view" class="myheatpump-top-buttons"><i class="icon-share icon-white"></i></a>
            <div class="myheatpump-top-buttons config-open">
              <i class="icon-wrench icon-white" title="Configure app"></i>
            </div>
          </div>

          <div class="block-title" id="app_name">MY HEATPUMP</div>
        </div>

        <div style="background-color:#fff; color:#333">
          <br>
          <div id="last_updated" class="title1" style="text-align:center; height:40px; display:none">Last updated 3rd of June 2022</div>

          <table id="live_table" style="width:100%; color:#333">
            <tr>

              <td style="width:25%; text-align:center; cursor:pointer" valign="top" id="realtime_cop_div">
                <div class="title1" id="realtime_cop_title">COP 30 mins</div>
                <div class="value1" id="realtime_cop_value">---</div>
              </td>

              <td style="width:25%; text-align:center" valign="top">
                <div class="title1">Electric</div>
                <div class="value1"><span id="heatpump_elec">---</span>
                  <div class="units1">W</div>
                </div>
              </td>

              <td style="width:25%; text-align:center" valign="top">
                <div class="title1">Heat Output</div>
                <div class="value1"><span id="heatpump_heat">---</span>
                  <div class="units1">W</div>
                </div>
              </td>

              <td style="width:25%; text-align:center" valign="top">
                <div class="title1">Flow</div>
                <div class="value1"><span id="heatpump_flowT">---</span>
                  <div class="units1">&deg;C</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

      </div>
    </div>
    <div class="col1">
      <div class="col1-inner">

        <div class="block-bound">

          <div class="bargraph-navigation">
            <div class="bluenav bargraph_mode" mode="combined" title="Combined" style="float:left">ALL</div>
            <div class="bluenav bargraph_mode" mode="running" title="When running" style="float:left;padding: 12px 8px 0px 7px; height: 30px; font-size:20px"><svg class="icon"><use xlink:href="#icon-play"></use></svg></div>
            <div class="bluenav bargraph_mode" mode="space" title="Space heating" style="float:left;padding: 8px 8px 0px 7px;height: 35px; font-size:28px"><svg class="icon"><use xlink:href="#icon-radiator"></use></svg></div>
            <div class="bluenav bargraph_mode" mode="water" title="Water heating" style="float:left;padding: 12px 8px 0px 7px;height: 30px; font-size:20px"><svg class="icon"><use xlink:href="#icon-shower"></use></svg></div>
            <div class="bluenav bargraph_mode" mode="cooling" title="Cooling" style="float:left;padding: 12px 8px 0px 7px;height: 30px; font-size:20px"><svg class="icon"><use xlink:href="#icon-snowflake"></use></svg></div>

            <div class="bluenav bargraph-alltime">ALL</div>
            <div class="bluenav bargraph-period" days=365>YEAR</div>
            <div class="bluenav bargraph-period wide" days=90>3 MONTHS</div>
            <div class="bluenav bargraph-period" days=30>MONTH</div>
            <div class="bluenav bargraph-period wide" days=7>WEEK</div>
            <div class="bluenav bargraph-day">DAY</div>
          </div>

          <div class="powergraph-navigation" style="display:none">
            <div class="bluenav viewhistory" title="Back to daily summary">BACK</div>
            <span class="bluenav" id="live" title="Live scroll" style="display:none; color: yellow; cursor: default">&gt;&gt;</span>
            <span class="bluenav" id="right" title="Scroll right">&gt;</span>
            <span class="bluenav" id="left" title="Scroll left">&lt;</span>
            <span class="bluenav" id="zoomout" title="Zoom out">-</span>
            <span class="bluenav" id="zoomin" title="Zoom in">+</span>
            <span class="bluenav time dmy" time='720' title="Last 30 days">M</span>
            <span class="bluenav time dmy" time='168' title="Last 7 days">W</span>
            <span class="bluenav time" time='24' title="Last 24 hours">D</span>
            <span class="bluenav time" time='6' title="Last 6 hours">6</span>
            <span class="bluenav time" time='1' title="Last hour">H</span>
          </div>
        </div>

        <div style="background-color:#fff; padding:10px;">
            <div id="placeholder_bound" style="width:100%; height:500px;overflow:hidden; position:relative;">
                <div id="placeholder" style="height:500px"></div>
                <div id="overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); color:#333; display:flex; align-items:center; justify-content:center; font-size:20px;">
                    <div id="overlay_text"></div>
                </div>
            </div>
        </div>

        <div style="background-color:#eee; color:#333">
          <div id='advanced-toggle' class='bluenav' style="display:none">SHOW DETAIL</div>

          <div id='data-error' style="display:none">DATA ERROR</div>

          <div id="emitter-spec-volume" style="display:none"></div>

          <div style="padding:10px">
            COP in window: <b id="window-cop" style="cursor:pointer"></b> <span id="window-carnot-cop"></span>
          </div>
        </div>

        <div id="advanced-block" style="background-color:#fff; padding:10px; display:none">
          <div style="color:#000">

            <div id="error-message" style="display:none" class="alert alert-error"></div>

            <table style="width:100%; color:#333;">
              <tr>
                <td valign="top" class="show_stats_category" key="combined" style="border-bottom:1px solid #000">
                  <div class="cop-title">Full window</div>
                  <div class="cop-value"><span class="cop_combined">---</span></div>
                </td>

                <td valign="top" class="show_stats_category" key="when_running" style="color:#698d5d">
                  <div class="cop-title">When running</div>
                  <div class="cop-value"><span class="cop_when_running">---</span></div>
                </td>

                <td valign="top" class="show_stats_category" key="space_heating" style="color:#f6a801">
                  <div class="cop-title">Space heating</div>
                  <div class="cop-value"><span class="cop_space_heating">---</span></div>
                </td>

                <td valign="top" class="show_stats_category" key="water_heating" style="color:#014656">
                  <div class="cop-title">Water heating</div>
                  <div class="cop-value"><span class="cop_water_heating">---</span></div>
                </td>

                <td valign="top" class="show_stats_category" key="cooling" style="color:#014656; display:none">
                  <div class="cop-title">Cooling</div>
                  <div class="cop-value"><span class="cop_cooling">---</span></div>
                </td>
              </tr>
            </table>


            <table class="table">
              <tr>
                <th></th>
                <th style="text-align:center; width:150px; color:#777">Min</th>
                <th style="text-align:center; width:150px; color:#777">Max</th>
                <th style="text-align:center; width:150px; color:#777">Diff</th>
                <th style="text-align:center; width:150px">Mean</th>
                <th style="text-align:center; width:150px">kWh</th>
              </tr>
              <tbody class="stats_category" key="combined"></tbody>
              <tbody class="stats_category" key="when_running" style="display:none"></tbody>
              <tbody class="stats_category" key="water_heating" style="display:none"></tbody>
              <tbody class="stats_category" key="space_heating" style="display:none"></tbody>
              <tbody class="stats_category" key="cooling" style="display:none"></tbody>
            </table>

            <div id="show_immersion_bound" style="display:none" class="advanced-options">
              <div style="float:right"><span id="immersion_kwh"></span> kWh</div>
              <input id="show_immersion" type="checkbox" class="advanced-options-checkbox">
              <b>Show immersion</b>
            </div>

            <div id="show_flow_rate_bound" style="display:none" class="advanced-options">
              <input id="show_flow_rate" type="checkbox" class="advanced-options-checkbox">
              <b>Show flow rate</b>
            </div>
            <div id="show_dhw_temp_bound" style="display:none" class="advanced-options">
              <input id="show_dhw_temp" type="checkbox" class="advanced-options-checkbox">
              <b>Show DHW temperature/charge</b>
            </div>
            <div id="show_cooling_bound" class="advanced-options">
              <div style="float:right"><span id="total_defrost_and_loss_kwh"></span> kWh (<span id="prc_defrost_and_loss"></span>%)</div>
              <input id="show_defrost_and_loss" type="checkbox" class="advanced-options-checkbox">
              <b>Show defrosts and other heat lost</b>
            </div>

            <div id="show_inst_cop_bound" class="advanced-options">

              <input id="show_instant_cop" type="checkbox" class="advanced-options-checkbox">
              <b>Show instantaneous COP</b>

              <div id="inst_cop_options" style="display:none">
                <div class="input-prepend input-append" style="margin-top:10px; margin-bottom:0px">
                  <span class="add-on">Valid COP</span>
                  <span class="add-on">Min</span>
                  <input type="text" style="width:50px" id="inst_cop_min" value="1.0">
                  <span class="add-on">Max</span>
                  <input type="text" style="width:50px" id="inst_cop_max" value="8.0">
                </div>

                <div class="input-prepend input-append" style="margin-top:10px; margin-bottom:0px">
                  <span class="add-on">Moving average</span>
                  <select id="inst_cop_mv_av_dp" style="width:100px">
                    <option value="0" selected>Disabled</option>
                    <option value="3">3 points</option>
                    <option value="5">5 points</option>
                  </select>
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="advanced-options">
              <input id="carnot_enable" type="checkbox" class="advanced-options-checkbox">
              <b>Show simulated carnot heat output</b>

              <div id="carnot_sim_options" style="display:none">
                <div class="input-prepend" style="margin-top:5px; margin-bottom:0px">
                  <span class="add-on">Condensing offset (K)</span>
                  <input type="text" style="width:50px" id="condensing_offset" value="2">
                </div>
                <div class="input-prepend" style="margin-top:5px; margin-bottom:0px">
                  <span class="add-on">Evaporator offset (K)</span>
                  <input type="text" style="width:50px" id="evaporator_offset" value="-6">
                </div>
                <div id="heatpump_factor_bound" class="input-prepend" style="margin-top:5px; margin-bottom:0px">
                  <span class="add-on">Heatpump factor</span>
                  <input type="text" style="width:50px" id="heatpump_factor" value="0.47">
                </div>
                <div id="fixed_outside_temperature_bound" class="input-prepend input-append" style="margin-top:5px; margin-bottom:0px">
                  <span class="add-on">Fixed outside temperature (C)</span>
                  <input type="text" style="width:50px" id="fixed_outside_temperature" value="6.0">
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="advanced-options">
              <input id="carnot_enable_prc" type="checkbox" class="advanced-options-checkbox">
              <b>Show as % of carnot COP</b>

              <div id="carnot_prc_options" style="display:none">
                <p>Measured COP vs Carnot COP distribution:</p>
                <div id="histogram_bound" style="width:100%; height:400px;overflow:hidden">
                  <div id="histogram" style="height:400px"></div>
                </div>
              </div>

            </div>

            <div id="show_inst_cop_bound" class="advanced-options">
              <input id="emitter_spec_enable" type="checkbox" class="advanced-options-checkbox">
              <b>Calculate emitter spec and system volume</b>
              <div id="emitter_spec_options" style="margin-top:10px; display:none">
                <p>Make sure there is at least a short period of steady state running in the window.<br>Heat output spikes after hot water cycles can skew results.</p>
                <div class="input-append" style="margin-top:5px">
                  <input type="text" style="width:50px" id="kW_at_50" disabled>
                  <span class="add-on">kW @ DT50</span>
                  <span class="add-on">Fix <input type="checkbox" id="fix_kW_at_50"></span>
                </div>
                <div class="input-append" style="margin-top:5px">
                  <input type="text" style="width:50px" id="system_volume" disabled>
                  <span class="add-on">Litres</span>
                </div>
                <br>
                <div class="input-prepend input-append" style="margin-top:5px">
                  <span class="add-on">Room temperature</span>

                  <input type="text" style="width:50px" id="room_temperature" disabled>
                  <span class="add-on">&deg;C</span>
                  <span class="add-on">Manual <input type="checkbox" id="manual_roomT_enable"></span>
                </div>
              </div>
            </div>
            <!-- DHW Standby Heat Loss Calculation Option -->
            <div class="advanced-options" style="border-bottom:1px solid #ccc">
              <input id="standby_dhw_hl_enable" type="checkbox" class="advanced-options-checkbox">
              <b>Calculate DHW Standby Heat Loss Coefficient</b>
              <div id="standby_dhw_hl_options" style="margin-top:10px; display:none;">
                  <p style="font-size:0.9em; color:#555;"><i>Ensure the selected window only shows natural DHW temperature decay (no heating cycles, no DHW use such as showering). Cylinder volume and environmental temperature are required to compute standby heat loss coefficient, which only works if DHW temperature is measured in °C and not % Charge. </i></p>
                  <div class="input-prepend input-append" style="margin-top:5px; margin-bottom:5px;">
                    <span class="add-on">Cylinder Volume (V<sub>cyl</sub>)</span>
                    <input type="text" style="width:60px" id="cylinder_volume" value="200">
                    <span class="add-on">L</span>
                  </div>
                  <div class="input-prepend input-append" style="margin-top:5px; margin-bottom:5px;">
                    <span class="add-on">Environment Temp (T<sub>env</sub>)</span>
                    <input type="text" style="width:50px" id="env_temperature" value="15">
                    <span class="add-on">°C</span>
                  </div>
                  <div style="margin-top:10px;">
                      DHW Heat Loss Coefficient (U): <b id="standby_dhw_hl_result">---</b> W/K |  DHW charge half-life (T<sub>1/2</sub>): <b id="standby_dhw_t_half_result">---</b> days
                  </div>
              </div>
            </div>
            <!-- End DHWStandby Heat Loss -->
            <div class="advanced-options" style="border-bottom:1px solid #ccc">
              <div style="float:right"><span id="standby_kwh"></span> kWh</span></div>
              <input id="configure_standby" type="checkbox" class="advanced-options-checkbox">
              <b>Configure standby</b>
              <div id="configure_standby_options" style="display:none">
                <div class="input-prepend input-append" style="margin-top:10px; margin-bottom:0px;">
                  <span class="add-on">Starting power</span>
                  <input type="text" style="width:50px" id="starting_power" value="150">
                  <span class="add-on">W</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
    <div class="col1">
      <div class="col1-inner">

        <div class="block-bound">
          <div class="block-title" id="all_time_history_title">ALL TIME HISTORY</div>
        </div>

        <div style="background-color:#fff; padding:10px;">
          <table style="width:100%; color:#333;">
            <tr>
              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Total Electricity input</div>
                <div class="value1"><span id="total_elec"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Total Heat output</div>
                <div class="value1"><span id="total_heat"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">SCOP</div>
                <div class="value1"><span id="total_cop"></span></div>
              </td>
            </tr>

            <!-- 
            <tr>
              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">When running electric</div>
                <div class="value1"><span id="running_elec"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">When running heat</div>
                <div class="value1"><span id="running_heat"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">When running SCOP</div>
                <div class="value1"><span id="running_cop"></span></div>
              </td>
            </tr>

            <tr>
              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Space heating electric</div>
                <div class="value1"><span id="space_elec"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Space heating heat</div>
                <div class="value1"><span id="space_heat"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Space heating SCOP</div>
                <div class="value1"><span id="space_cop"></span></div>
              </td>
            </tr>
            <tr>
              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Water heating electric</div>
                <div class="value1"><span id="water_elec"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Water heating heat</div>
                <div class="value1"><span id="water_heat"></span>
                  <div class="units1">kWh</div>
                </div>
              </td>

              <td style="width:33.3%; text-align:center" valign="top">
                <div class="title1">Water heating SCOP</div>
                <div class="value1"><span id="water_cop"></span></div>
              </td>
            </tr>
            -->
          </table>
        </div>

      </div>
    </div>
      
<!-- START: New Heat Loss Panel -->
    <div class="col1">
      <div class="col1-inner">

        <div class="block-bound">
          <!-- Updated toggle div -->
          <div id='heatloss-toggle' class='bluenav' style="text-align:left; cursor:pointer;">
              <span id="heatloss-toggle-text">SHOW HEAT DEMAND ANALYSIS</span>  <!-- Text wrapped in span -->
              <span id="heatloss-arrow">►</span> <!-- Arrow span remains -->
          </div>
        </div>

        <div id="heatloss-block" style="background-color:#fff; padding:10px; display:none;">
          <!-- Content for the Heat Loss panel goes here -->
          <!-- Placeholder for the plot -->
          <div id="heatloss-plot-bound" style="width:100%; height:600px; overflow:hidden; position:relative; border:1px dashed #ccc; margin-bottom:10px;">
              <div id="heatloss-plot" style="height:600px;"></div>
          </div>

          <!-- Placeholder for controls -->
          <div id="heatloss-controls" style="border:1px solid #eee; padding:15px; background-color: #fdfdfd;">

            <!-- Control Group 1: Min Delta T -->
            <!-- Using input-append style: input first, then addon(s) -->
            <div class="input-append" style="margin-top:5px;">
                <input type="number" id="heatloss_min_deltaT" class="heatloss-control-input" value="5" step="1" style="width:50px; text-align:center;">
                <span class="add-on">Minimum ΔT °C</span>
                <!-- Note: Combined label and unit into one add-on like 'Litres' or 'kW @ DT50' -->
            </div>

            <!-- Control Group 2: Fixed Room Temp -->
            <!-- Using input-prepend input-append style: label addon, input, unit addon, checkbox addon -->
            <div class="input-prepend input-append" style="margin-top:5px;">
                <span class="add-on">Fixed room temperature</span>
                <input type="number" id="heatloss_fixed_roomT_value" class="heatloss-control-input" value="20" step="0.1" style="width:50px; text-align:center;" disabled>
                <span class="add-on">°C</span>
                <span class="add-on">Enable <input type="checkbox" id="heatloss_fixed_roomT_check" style="margin:0;"></span>
            </div>

            <!-- Control Group 3: Split Data (Single Line - Explicit Height) -->
            <div class="input-prepend input-append" style="margin-top:5px;">
                <!-- Prepend: Main Checkbox -->
                <span class="add-on" style="height: 30px; box-sizing: border-box; vertical-align: middle;"> <!-- Set height -->
                    <input type="checkbox" id="heatloss_split_data_check" style="margin:0 5px 0 0; vertical-align: middle;">Split data by
                </span>
                <!-- Middle Area: Radio Buttons -->
                <span id="heatloss_split_options" style="display: inline-block;
                                                         height: 30px; /* Explicit height */
                                                         padding: 4px 6px; /* Adjust padding as needed for content centering */
                                                         border: 1px solid #ccc;
                                                         border-left: 0;
                                                         border-right: 0;
                                                         background-color: #eee;
                                                         line-height: 20px; /* Helps center text vertically if height > line-height+padding */
                                                         white-space: nowrap;
                                                         vertical-align: middle;
                                                         box-sizing: border-box; /* Crucial when setting explicit height */
                                                         ">
                     <label style="margin-right: 10px; cursor: pointer; display: inline;">
                         <input type="radio" name="heatloss_split_by" id="heatloss_split_by_year" value="year" disabled style="margin:0 3px 0 0; vertical-align: middle;">year
                     </label>
                     <label style="cursor: pointer; display: inline;">
                         <input type="radio" name="heatloss_split_by" id="heatloss_split_by_season" value="season" disabled style="margin:0 3px 0 0; vertical-align: middle;">season
                     </label>
                </span>
                <!-- Append: Dependent Checkbox -->
                <span class="add-on" style="height: 30px; box-sizing: border-box; vertical-align: middle;"> <!-- Set height -->
                    <input type="checkbox" id="heatloss_split_regression_check" disabled style="margin:0 5px 0 3px; vertical-align: middle;">split regression
                </span>
            </div>
            <!-- End of Control Group 3 -->
             
            <!-- START: New Control Group 4: Solar power coloring -->
            <div class="input-prepend input-append" style="margin-top:5px;">
                <span class="add-on" style="height: 30px; box-sizing: border-box; vertical-align: middle;"> <!-- Adjust height if needed -->
                    <input type="checkbox" id="heatloss_solar_gain_color" style="margin:0 5px 0 0; vertical-align: middle;">Color by solar gain
                </span>
            </div>
            <!-- END: New Control Group 4 -->    

    
          </div> <!-- End of #heatloss-controls -->

        </div> <!-- End of #heatloss-block -->

      </div> <!-- End of col1-inner for Heat Loss -->
    </div> <!-- End of col1 for Heat Loss -->
    <!-- END: New Heat Loss Panel -->

    
  </div>
</div>

<section id="app-setup" class="hide pb-3">
  <!-- instructions and settings -->
  <div class="px-3">
    <div class="row-fluid">
      <div class="span7 xapp-config-description">
        <div class="xapp-config-description-inner text-light">
          <h2 class="app-config-title text-primary"><?php echo _('My Heatpump'); ?></h2>
          <p class="lead">The My Heatpump app can be used to explore the performance of a heatpump including, electricity consumption, heat output, COP and system temperatures.</p>
          <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
          <p><strong class="text-white">Cumulative kWh</strong> feeds can be created from power feeds using the power_to_kwh input processor, which converts power data (measured in watts) into energy consumption data (measured in kWh).</p>
          <p><strong class="text-white">Share publicly:</strong> Check the "public" check box if you want to share your dashboard publicly, and ensure that the associated feeds are also made public by adjusting their settings on the feeds page.</p>
          <p><strong class="text-white">Start date:</strong> To modify the start date for cumulative total electricity consumption, heat output and SCOP, input a unix timestamp corresponding to your desired starting date and time.</p>


          <button class="btn btn-danger mt-3" id="clear-daily-data" style="display:none">Reload daily data</button>


        </div>
      </div>
      <div class="span5 app-config pt-3"></div>
    </div>
  </div>
</section>


<div class="ajax-loader"></div>

<script>
  var apikey = "<?php print $apikey; ?>";
  var session_write = <?php echo $session['write']; ?>;
  config.id = <?php echo $id; ?>;
  config.name = "<?php echo $name; ?>";
  config.public = <?php echo $public; ?>;
  config.db = <?php echo json_encode($config); ?>;
</script>

<?php $v=197; ?>
<script src='https://cdn.plot.ly/plotly-latest.min.js'></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_regression.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_process.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_powergraph.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_bargraph.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_heatloss.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump.js?v=<?php echo $v; ?>"></script>
