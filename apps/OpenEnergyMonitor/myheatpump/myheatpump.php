<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/style.css?v=<?php echo $v; ?>" rel="stylesheet">

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-block" style="display:none">

  <div class="col1"><div class="col1-inner">
    <div class="block-bound">
      <div style="float:right">
          <div class="config-open" style="padding-top:10px; padding-right:10px; cursor:pointer">
              <i class="icon-wrench icon-white"></i>
          </div>
      </div>
      
      <div class="block-title" id="app_name">MY HEATPUMP</div>
    </div>

    <div style="background-color:#fff; color:#333">
      <br>
      <div id="last_updated" class="title1" style="text-align:center; height:40px; display:none">Last updated 3rd of June 2022</div>
      
      <table id="live_table" style="width:100%; color:#333">
        <tr>
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">COP 30 mins</div>
            <div class="value1" id="COP_30m">---</div>
          </td>
          
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Electric</div>
            <div class="value1"><span id="heatpump_elec">---</span><div class="units1">W</div></div>
          </td>
          
          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Heat Output</div>
            <div class="value1"><span id="heatpump_heat">---</span><div class="units1">W</div></div>
          </td>

          <td style="width:25%; text-align:center" valign="top">
            <div class="title1">Flow</div>
            <div class="value1"><span id="heatpump_flowT">---</span><div class="units1">&deg;C</div></div>
          </td>
        </tr>
      </table>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">

    <div class="block-bound">
    
      <div class="bargraph-navigation">
        <!--<div class="bluenav bargraph-other">OTHER</div>-->
        <div class="bluenav bargraph-alltime">ALL TIME</div>
        <div class="bluenav bargraph-month">MONTH</div>
        <div class="bluenav bargraph-week">WEEK</div>
      </div>
      
      <div class="powergraph-navigation" style="display:none">
        <div class="bluenav viewhistory">BACK</div>
        <span class="bluenav" id="right" >></span>
        <span class="bluenav" id="left" ><</span>
        <span class="bluenav" id="zoomout" >-</span>
        <span class="bluenav" id="zoomin" >+</span>
        <span class="bluenav time dmy" time='720'>M</span>
        <span class="bluenav time dmy" time='168'>W</span>
        <span class="bluenav time" time='24'>D</span>
        <span class="bluenav time" time='1'>H</span>
      </div>
        
      <div class="block-title">HISTORY</div>       
    </div>
    
    <div style="background-color:#fff; padding:10px;">
      <div id="placeholder_bound" style="width:100%; height:500px;overflow:hidden">
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>
          
    <div style="background-color:#eee; color:#333">
      <div id='advanced-toggle' class='bluenav' style="display:none" >SHOW DETAIL</div>
      
      <div style="padding:10px;">
        COP in window: <b id="window-cop"></b> <span id="window-carnot-cop"></span>
      </div>
    </div>
          
    <div id="advanced-block" style="background-color:#fff; padding:10px; display:none">
      <div style="color:#000">
        <p id="show_flow_rate_bound" style="display:none"><b>Show flow rate:</b> <input id="show_flow_rate" type="checkbox" style="margin-top:-4px; margin-left:7px"></p>
      
        <table class="table">
          <tr>
          <th></th>
          <th style="text-align:center">Min</th>
          <th style="text-align:center">Max</th>
          <th style="text-align:center">Diff</th>
          <th style="text-align:center">Mean</th>
          <th style="text-align:center">kWh</th>
          <th style="text-align:center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
        
        <hr style="margin:10px 0px 10px 0px">
        <p><b>Standby</b></p>
        <p>Electricity consumption below starting power (standby): <span id="standby_kwh"></span> kWh</p>        
        <p>COP in window not including standby: <span id="standby_cop"></span><span id="standby_cop_simulated"></span></p>   
        <div class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Starting power (W)</span>
          <input type="text" style="width:50px" id="starting_power" value="100">
        </div>     

        <hr style="margin:10px 0px 10px 0px">
        
        <p><b>Show mean values for periods when heat pump is running only:</b> <input id="stats_when_running" type="checkbox" style="margin-top:-4px; margin-left:7px"><br><span style="font-size:12px">(Based on starting power value above)</span></p>        

        <div id="mean_when_running"></div>
        
        <hr style="margin:10px 0px 10px 0px">
        
        <b>Simulate heat output using carnot COP equation</b><input id="carnot_enable" type="checkbox" style="margin-top:-4px; margin-left:7px"> &nbsp;&nbsp;
        <b>Show as % of carnot COP</b><input id="carnot_enable_prc" type="checkbox" style="margin-top:-4px; margin-left:7px">
        <br>
        <div class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Condensing offset (K)</span>
          <input type="text" style="width:50px" id="condensing_offset" value="4">
          <span class="add-on">Evaporator offset (K)</span>
          <input type="text" style="width:50px" id="evaporator_offset" value="-6">
        </div>
        <div id="heatpump_factor_bound" class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Heatpump factor</span>
          <input type="text" style="width:50px" id="heatpump_factor" value="0.49">
        </div>
        <div id="fixed_outside_temperature_bound" class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Fixed outside temperature (C)</span>
          <input type="text" style="width:50px" id="fixed_outside_temperature" value="6.0">
        </div>
        
        <p>Measured COP vs Carnot COP distribution:</p>
        <div id="histogram_bound" style="width:100%; height:400px;overflow:hidden">
          <div id="histogram" style="height:400px"></div>
        </div>
        
        
      </div>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">
         
    <div class="block-bound">
        <div class="block-title" id="all_time_history_title">ALL TIME HISTORY</div>
    </div>
          
    <div style="background-color:#fff; padding:10px;">
      <table style="width:100%; color:#333;">
      <tr>
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">Total Electricity input</div>
          <div class="value1"><span id="total_elec"></span><div class="units1">kWh</div></div>
        </td>
        
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">Total Heat output</div>
          <div class="value1"><span id="total_heat"></span><div class="units1">kWh</div></div>
        </td>
        
        <td style="width:33.3%; text-align:center" valign="top">
          <div class="title1">SCOP</div>
          <div class="value1"><span id="total_cop"></span></div>
        </td>
      </tr>
      </table>
    </div>

  </div></div>

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
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
</script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump.js?v=50"></script>

