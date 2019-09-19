<?php
global $path, $session;
$v = 7;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/config.js?v=<?php echo $v; ?>"></script>

<div id="app-block" style="display:none">
  <div style="height:25px; border-bottom:1px solid #e8e8e8; padding:8px;">
    <div style="float:right;">
      <i class="config-open icon-wrench" style="cursor:pointer"></i>
    </div>
  </div>
  <div style="text-align:center; padding-top:20px">
    <div class="app-title">Oops something went wrong, this app does not exist!</div>
  </div>
</div>

<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span9 app-config-description">
                <div class="app-config-description-inner text-light">
                    <h2 class="app-config-title text-primary"><?php echo _('Oops something went wrong!'); ?></h2>
                    <p class="lead">This app does not exist.<br> You can delete this entry on the right.</p>
                </div>
            </div>
            <div class="span3 pt-3 app-config"></div>
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
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;

config.initapp = function() {
    init();
};
config.showapp = function() {
    show();
};
config.hideapp = function() {
    clear();
};

// ----------------------------------------------------------------------
// Application
// ----------------------------------------------------------------------
config.init();

function init() {
}

function show() {
    $(".ajax-loader").hide();
}

function updater() {

}

function resize() {

}

function clear() {

}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function appLog(level, message) {
    if (level == "ERROR") {
        alert(level + ": " + message);
    }
    console.log(level + ": " + message);
}

</script>
