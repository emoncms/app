<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_css("Modules/app/Views/css/app-kit.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">
    <div class="app-card">
        <nav class="app-card-head">
            <div class="app-card-tools">
                <div class="nav">
                    <button class="nav-link config-open" title="Configure app"><i class="svg-icon-wrench"></i></button>
                    <button class="nav-link config-close d-none" title="Close"><i class="svg-icon-close"></i></button>
                </div>
            </div>
        </nav>
        <div class="app-card-body">
            <p class="text-center text-body-secondary my-3">Oops something went wrong, this app does not exist!</p>
        </div>
    </div>
</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Oops something went wrong, this app does not exist! You can delete this entry on the right.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {};
config.app_name = "Blank";
config.id = <?php echo $id; ?>;
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
config.init();

function init()
{   

}
    
function show()
{   
    $(".ajax-loader").hide();
}
   
function updater()
{

}

function resize() 
{

}

function clear()
{

}

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
