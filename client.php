<?php
    global $path; 
    $apikey = $_GET['apikey'];
?>

<script>
    var path = "<?php print $path; ?>";
    var apikey = "<?php print $apikey; ?>";
    
    apikeystr = ""; 
    if (apikey!="") apikeystr = "&apikey="+apikey;
</script>

<link href="<?php echo $path; ?>Modules/app/style.css" rel="stylesheet">
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/app.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/config.js"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/feed.js"></script>        
<div id="content"></div>

<script>

$("body").css('background-color','#222');
$(window).ready(function(){
    $("#footer").css('background-color','#181818');
    $("#footer").css('color','#999');
});

console.log(path);

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
    app.load(appname);
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
    console.log("launching "+appname);
    $("#"+appname+"-setup").hide();
    $("#"+appname+"-block").show();
    
    if (app.initialized[appname]==undefined) {
        console.log("init "+appname);
        app.initialized[appname] = true;
        window["app_"+appname].init();
    }
    
    console.log("show "+appname);
    window["app_"+appname].show();
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
