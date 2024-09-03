<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=1" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=2"></script>

<style>
    /* Dynamic height chart placeholder */
    /* Adjust the height offset as necessary */
    .chart-placeholder {
        --height-offset: 35rem;
    }

    @media (min-width: 768px) {
        .chart-placeholder {
            --height-offset: 35rem;
        }
    }

    .chart-placeholder>* {
        height: calc(100vh - var(--height-offset)) !important;
        min-height: 180px;
    }

    /* Remove padding from container-fluid, gives a little more screen space */
    .container-fluid {
        padding: 0px;
    }

    @media (min-width: 768px) {
        .container-fluid {
            padding: 0px 20px 0px 20px;
        }
    }

    .input_ppm {
        width: 75px;
        background-color: #333 !important;
        border-color: #666 !important;
        font-size: 22px !important;
        padding: 10px !important;
        color: #aaa !important;
    }

    .co2table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;

    }

    .co2table th {
        text-align: left;
        padding: 10px;
        border-bottom: 1px solid #333;
        border-top: 1px solid #333;
    }

    .co2table td {
        padding: 10px;
        border-bottom: 1px solid #333;
    }
    
    .co2input {
        width:70px !important;
        background-color:#333 !important;
        border: 1px solid #555 !important;
        color:#fff !important;
    }
    
    .box {
        width:10px;
        height:10px;
    }

</style>

<!-- Top navigation bar -->
<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="viewpower active btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo _('Power View') ?>">
                <span class="d-xs-none"><?php echo _("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo _("Air change rate calculator from CO2 data") ?></span>
            </button></li>
    </ul>
    <ul class="text-right nav nav-pills mb-0">
        <li><button class="btn btn-large btn-link btn-inverse config-open" title="<?php echo _('Edit') ?>"><svg class="icon">
                    <use xlink:href="#icon-wrench"></use>
                </svg></button></li>
        <li><button class="btn btn-large btn-link btn-inverse config-close hide" title="<?php echo _('Close') ?>"><svg class="icon">
                    <use xlink:href="#icon-close"></use>
                </svg></button></li>
    </ul>
</nav>

<!-- App content -->
<div id="app-block" style="display:none">
    <!--
    <div class="d-flex justify-content-between">
        <h5 class="electric-title text-md-larger text-light"><?php echo _('CO2') ?>: <span id="powernow">0</span> <span class="power-unit"> ppm</span></h5>
    </div>
-->

    <div class="btn-group" style="float:right">
      <button class="btn" id="decay_mode">Decay</button>
      <button class="btn btn-primary" id="average_mode">Average</button>
    </div>

    <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start d-flex justify-content-stretch btn-group">
        <button class='visnav time btn btn-inverse btn-link btn-large py-1 px-2' time='24'><?php echo _('D') ?></button>
        <button class='visnav time btn btn-inverse btn-link btn-large py-1 px-2' time='168'><?php echo _('W') ?></button>
        <button class='visnav time btn btn-inverse btn-link btn-large py-1 px-2' time='720'><?php echo _('M') ?></button>
        <button id='zoomin' class='visnav btn btn-inverse btn-link btn-large py-1 px-2' >+</button>
        <button id='zoomout' class='visnav btn btn-inverse btn-link btn-large py-1 px-2' >-</button>
        <button id='left' class='visnav btn btn-inverse btn-link btn-large py-1 px-2' >&lt;</button>
        <button id='right' class='visnav btn btn-inverse btn-link btn-large py-1 px-2' >&gt;</button>
    </div>

    <div id="graph_bound" class="chart-placeholder">
        <div id="graph"></div>
    </div>

    <br>
    <div id="sensors">
    
        <div class="average">
            <table class="co2table" style="color:#fff; font-size:16px">
                <tr>
                <td>Total volume: <b><span id="total_volume"></span> m<sup>3</sup></b></td>
                <td>Mean CO2: <b><span id="total_mean_co2"></span> ppm</b></td>
                <td>Daily CO2 addition: <input type="text" id="daily_co2_addition" value="1050" class="co2input"> L/day</td>
                <td>Air change rate: <b><span id="total_mean_air_change_rate"></span> ACH</b></td>
                </tr>
            </table>
            
        </div>
    
        <table class="co2table" style="color:#fff">
            <tr>
                <th></th>
                <th>Name</th>
                <th scope="col" class="average"><?php echo _('Volume') ?></th>
                <th scope="col" class="average"><?php echo _('Mean CO2') ?></th>
                <th scope="col" class="decay hide"><?php echo _('Baseline CO2') ?></th>
                <th scope="col" class="decay hide"><?php echo _('Air change rate') ?></th>
                <th scope="col" class="decay hide"><?php echo _('R2') ?></th>
                <th class="decay"></th>
            </tr>
            <tbody id="sensors_list"></tbody>
        </table>
        
        <p id="windspeed_option" class="hide" style="margin-top:15px; color:#aaa"><input type="checkbox" id="show_windspeed" style="margin: -5px 10px 0px 10px" > Show wind speed</p>
        

    </div>

</div>

<!-- App configuration -->
<section id="app-setup" class="hide pb-3">
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xapp-config-description">
                <div class="xapp-config-description-inner text-light">
                    <h2 class="app-config-title text-primary"><?php echo _('CO2 Monitor'); ?></h2>
                    <p class="lead">Calculate room air change rates form CO2 decay curves.</p>
                    <img src="<?php echo $path; ?><?php echo $appdir; ?>preview.png" class="img-rounded">
                </div>
            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>

<div class="ajax-loader"></div>

<script>
    // Transfer php variables to javascript
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;

</script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/co2monitor/co2monitor.js?v=4"></script>
