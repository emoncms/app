<?php
    global $path, $session, $user;
    
    if (isset($_GET['readkey'])) {
        $apikey = $_GET['readkey'];
    } elseif (isset($_GET['apikey'])) {
        $apikey = $_GET['apikey'];
    }
    
    if (isset($session['write']) && $session['write']) $apikey = $user->get_apikey_write($session['userid']);
?>

<script>
    var path = "<?php print $path; ?>";
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;
    
    apikeystr = ""; 
    if (apikey!="") apikeystr = "&apikey="+apikey;
</script>

<link href="<?php echo $path; ?>Modules/app/style.css" rel="stylesheet">
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/app2.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/config.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/feed.js"></script>        
<div id="content"></div>

<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>


<script>

$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});

if (!sessionwrite) {
    $(".openconfig").hide();
}

app.getconfig();
var nodes = {};
  
var appname = "myelectric";
req = parse_location_hash(window.location.hash)

appname = req[0];
if (appname=="") appname = "myelectric";

app.show(appname);

$(window).on('hashchange', function() {
    app.hide(appname);
    req = parse_location_hash(window.location.hash)
    appname = req[0];
    app.show(appname);
});

$(document).ready(function(){

});

$("body").on("click",".openconfig",function(){
    $("#"+appname+"-block").hide();
    $("#"+appname+"-setup").show();
    var appconfig = window["app_"+appname].config;
    window["app_"+appname].hide(); // Disables timers
    configUI(appname, appconfig, app.config[appname]);
});

$("body").on("click",".launchapp",function(){
    app.log("INFO",appname+" launch");
    $(".ajax-loader").show();
    
    $("#"+appname+"-setup").hide();
    $("#"+appname+"-block").show();
    
    if (app.initialized[appname]==undefined) {
        app.initialized[appname] = true;
        window["app_"+appname].init();
    }
    window["app_"+appname].show();
});

$(window).resize(function(){
    window["app_"+appname].resize();
});

function parse_location_hash(hash)
{
    hash = hash.substring(1);
    hash = hash.replace("?","/");
    hash = hash.replace("&","/");
    hash = hash.split("/");
    return hash;
}

</script>
