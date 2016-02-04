<?php
    global $path, $user;
    $apikey = $_GET['apikey'];
    $lang = (isset($_GET["lang"])) ? strtolower(substr($_GET['lang'], 0, 2)) : 'en';
    $modpath = $path."Modules/app"
?>

<script>
    var path = "<?php print $path; ?>";
    var modpath = "<?php print $modpath; ?>";
    var apikey = "<?php print $apikey; ?>";
    var lang = "<?php print $lang; ?>";
    apikeystr = (apikey !== "") ? "&apikey="+apikey : "";
</script>

<link href="<?php echo $modpath; ?>/style.css" rel="stylesheet">
<script type="text/javascript" src="<?php echo $modpath; ?>/app.js"></script>

<div id="content"></div>

<script>

console.log(path);

var config = app.getconfig();
var nodes = {};

var appname = "myelectric";
req = parse_location_hash(window.location.hash)

appname = req[0];
if (appname === "") appname = "myelectric";

app.show(appname);

$(window).on('hashchange', function() {
    app.hide(appname);
    req = parse_location_hash(window.location.hash)
    appname = req[0];
    app.load(appname);
    app.show(appname);
});

$(document).ready(function () {

});

function parse_location_hash (hash) {
    hash = hash.substring(1);
    hash = hash.replace("?", "/");
    hash = hash.replace("&", "/");
    hash = hash.split("/");
    return hash;
}

</script>
