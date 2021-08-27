<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />    
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>
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
      
      <div class="block-title">MY HEATPUMP</div>
    </div>

    <div style="background-color:#fff; color:#333">
      <br>
      <table style="width:100%; color:#333">
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
        
        <b>Simulate heat output using carnot COP equation</b><input id="carnot_enable" type="checkbox" style="margin-top:-4px; margin-left:7px">
        <br>
        <div class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Condensing offset (K)</span>
          <input type="text" style="width:50px" id="condensing_offset" value="4">
          <span class="add-on">Evaporator offset (K)</span>
          <input type="text" style="width:50px" id="evaporator_offset" value="-6">
        </div>
        <div class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Heatpump factor</span>
          <input type="text" style="width:50px" id="heatpump_factor" value="0.49">
          <span class="add-on">Starting power (W)</span>
          <input type="text" style="width:50px" id="starting_power" value="100">
        </div>
        <div class="input-prepend input-append" style="margin-top:5px">
          <span class="add-on">Fixed outside temperature (C)</span>
          <input type="text" style="width:50px" id="fixed_outside_temperature" value="6.0">
        </div>        
      </div>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">
         
    <div class="block-bound">
        <div class="block-title">ALL TIME HISTORY</div>
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
          <div class="title1">All-time COP</div>
          <div class="value1"><span id="total_cop"></span></div>
        </td>
      </tr>
      </table>
    </div>

  </div></div>

</div>  
</div>    
  
<div id="app-setup" class="block py-2 px-5 hide">
    <h2 class="app-config-title">My Heatpump</h2>

    <div class="app-config-description">
      <div class="app-config-description-inner">
        The My Heatpump app can be used to explore the performance of a heatpump including, electricity consumption, heat output, COP and system temperatures.
        <br><br>
        <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
        <br><br>
        <b>Cumulative kWh</b> feeds can be generated from power feeds with the power_to_kwh input processor.
        <br><br>
        <img src="../Modules/app/images/myelectric_app.png" style="width:600px" class="img-rounded">
      </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
</script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump.js?v=<?php echo $v; ?>"></script>

