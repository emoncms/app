<?php
// UK Grid Fuel Mix Visualisation
// By Trystan Lea, OpenEnergyMonitor.org
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path; ?>Lib/misc/clipboard.js?v=<?php echo $v; ?>"></script>

<style>
    /* Dynamic height chart placeholder */
    /* Adjust the height offset as necessary */
    .chart-placeholder {
        --height-offset: 19rem;
    }
    @media (min-width: 768px) {
        .chart-placeholder { --height-offset: 22rem; }
    }
    .chart-placeholder>* {
        height: calc(100vh - var(--height-offset)) !important;
        min-height: 180px;
    }

    /* Remove padding from container-fluid, gives a little more screen space */
    .container-fluid { padding: 0px; }
    @media (min-width: 768px) {
        .container-fluid { padding: 0px 20px 0px 20px; }
    }

    .content-container {
        max-width: 1250px;
    }

    .legendcheckbox {
        width: 15px;
        height: 12px;
        border: 1px solid #fff;
        margin-right: 5px;
    }

    .legendItem {
        width: 15px;
        height: 12px;
    }
</style>

<!-- Top navigation bar -->
<nav id="buttons" class="d-flex justify-content-between">
    <ul id="tabs" class="nav nav-pills mb-0">
        <li><button class="viewpower btn btn-large btn-link btn-inverse myelectric-view-cost" disable title="<?php echo _('Fuel mix history') ?>">
                <span class="d-xs-none"><?php echo _("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo _("UKGRID") ?></span>
            </button></li>
        <li><button class="fuelmix btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo _('Fuel mix history') ?>">
                <span class="d-xs-none"><?php echo _("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo _("FUEL MIX") ?></span>
            </button></li>
        <li><button class="forecast active btn btn-large btn-link btn-inverse myelectric-view-cost" title="<?php echo _('Wind & Solar forecast') ?>">
                <span class="d-xs-none"><?php echo _("Pwr") ?></span>
                <span class="d-none d-xs-inline-block"><?php echo _("FORECAST") ?></span>
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

<div id="app-block" style="display:none; color:#ccc">
    <div class="row">
        <!--bootstrap 2 column-->
        <div class="span10">
            <!--<div style="font-size:28px; font-weight:bold">uk<span style="color:#fff">grid</span></div>-->
            <?php include(dirname(__DIR__).'/graph-nav.php'); ?>

            <div id="placeholder_bound" class="chart-placeholder">
                <div id="placeholder"></div>
            </div>
        </div>
        <div class="span2">
            <div id="visible-checkboxes"></div>
        </div>
    </div>
    <br><br>
    <p style="font-size:14px">This app shows realtime uk electricity demand and how it is supplied from different sources of electricity generation. The data is updated every 5 minutes from elexonportal.co.uk.<br>
        Click on the key items on the right to show or hide different sources of generation and use the navigation buttons to explore historic data.</p>
</div>

<!-- App configuration -->
<section id="app-setup" class="hide pb-3">
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xapp-config-description">
                <div class="xapp-config-description-inner text-light">
                    <h2 class="app-config-title text-primary"><?php echo _('UK Grid Visualisation'); ?></h2>
                    <p class="lead">Explore the UK grid fuel mix and wind and solar forecast.</p>
                </div>
            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>

<div class="ajax-loader"></div>

<script>
    // ----------------------------------------------------------------------
    // Globals
    // ----------------------------------------------------------------------
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    feed.apikey = apikey;
    feed.public_userid = public_userid;
    feed.public_username = public_username;

    if (!sessionwrite) $(".config-open").hide();

    // ----------------------------------------------------------------------
    // Configuration
    // ----------------------------------------------------------------------
    config.app = {
        "public": {
            "type": "checkbox",
            "name": "Public",
            "default": 0,
            "optional": true,
            "description": "Make app public"
        }
    };
    config.name = "<?php echo $name; ?>";
    config.db = <?php echo json_encode($config); ?>;
    config.feeds = {};
    config.initapp = function() {};
    config.showapp = function() {
        $(".ajax-loader").hide();
    };
    config.hideapp = function() {};
    config.init();
</script>

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/ukgrid/ukgrid.js?v=3"></script>