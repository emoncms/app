<?php
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
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path;?>Lib/misc/clipboard.js?v=<?php echo $v; ?>"></script>

<style>
.color-box {
  height:15px;
  width:15px;
}
textarea {
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: scroll;
}
</style>

<div id="app-block" style="display:none">
  <div class="col1">
    <div class="col1-inner">
      <div style="float:right;">
        <select id="resolution" class="btn" style="width:100px; margin-top:10px; text-align:left">
          <option value="600">10 mins</option>
          <option value="900">15 mins</option>
          <option value="1800">30 mins</option>
          <option value="3600">60 mins</option>
        </select>
        <button class="btn config-open" style="margin-top:10px">
          <i class=" icon-wrench"></i>
        </button>
      </div>
      <h3>Profile Explorer</h3>
    </div>
  </div>

  <div id="graph" style="height:500px; width:100%;"></div>

  <br>
  <table class="table table-striped">
    <tbody id="table"></table>
  </table>
  
  <button class="btn" id="copy_to_clipboard" title="Copy CSV data to clipboard">Copy <i class="icon-share-alt"></i></button><br><br>
 
</div>    

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Profile explorer</h2>
    <div class="app-config-description">
        <div class="app-config-description-inner">
            Explore average daily profiles for different months of the year.
        </div>
    </div>
    <div class="app-config"></div>
</div>

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

var interval = 900;
$("#resolution").val(interval);

var previousPoint = false;

var month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Graph variables
var data = [];
var csv = "";
var options = {}
var visible = [];
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#fff');
$(window).ready(function(){

});
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"heatpump_elec_kwh"},
    "feed_type":{"type":"select", "options": ['Cumulative kWh','Power (W)','Other'], "name": "Feed type", "default": 'Cumulative kWh'},
    "public":{"type":"checkbox", "name": "Public", "default": 0, "optional":true, "description":"Make app public"}
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function(){init()};
config.showapp = function(){show()};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

config.init();

function process_profile(d) {
    var start = d.getTime();
    d.setMonth(d.getMonth()+1);
    var end = d.getTime();
     
    var average = 0;
    var delta = 1;
    var scale = 1;
    
    if (config.app.feed_type.value=='Power (W)') {
        average = 1;
        delta = 0;
        scale = interval / 3600000;
    } else if (config.app.feed_type.value=='Other') {
        average = 1;
        delta = 0;
        scale = interval / 3600;
    }
     
    var feed_data = feed.getdata(config.app.use.value,start,end-(interval*1000),interval,average,delta,0,0,false,false,'notime');
    
    var d = new Date();
    var kwh_at_interval = {};
    var time_at_interval = {}
    var kwh = 0;
    var total_time = 0;
    
    for (var z in feed_data) {
        let time = feed_data[z][0];
        d.setTime(time);
        d.setHours(0,0,0,0);
        let time_day_ms = time - d.getTime();
        
        //Fix overrun with dst change
        if (time_day_ms<86400*1000) {
            if (kwh_at_interval[time_day_ms]==undefined) {
                kwh_at_interval[time_day_ms] = 0;
                time_at_interval[time_day_ms] = 0;
            }
            if (feed_data[z][1]!=null) {
                kwh_at_interval[time_day_ms] += feed_data[z][1]*scale;
                time_at_interval[time_day_ms] += interval;
                kwh += feed_data[z][1]*scale;
                total_time += interval;
            }
        }
    }
    
    d = new Date();
    d.setHours(0,0,0,0);
    midnight = d.getTime();
    
    var processed_data = [];
    for (var z in kwh_at_interval) {
        let time = midnight+1*z
        processed_data.push([time,kwh_at_interval[z]*3600/time_at_interval[z]]);
    }
    return {profile:processed_data, kwh:kwh, days: total_time/86400};
}

function init()
{   

}
    
function show()
{   
    $(".ajax-loader").hide();
    $("body").css('background-color','#fff');
    
    var d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(1);
    d.setMonth(d.getMonth()-12);
    
    csv = "";
        
    data = [];
    for (var i=0; i<12; i++) {
        var monthstr = month[d.getMonth()];
        var result = process_profile(d);
        if (result.kwh>0) {
            data.push({label:monthstr, data: result.profile, kwh: result.kwh, days: result.days});
        
            csv += monthstr+", ";
            for (var m in result.profile) {
                csv += result.profile[m][1].toFixed(3)+", ";
            }
            csv += "\n";
        }
    }
    
    // Calculate mean, min and max so that we can apply automatic colour scale           
    var max = 0;  
    var min = null;
    for (let z in data) {
        let sum = 0;
        let n = 0;
        for (let x in data[z].data) {
            sum += data[z].data[x][1];
            n++;
        }
        let mean = sum / n;
        
        data[z].mean = mean;
        if (mean>max) max = mean;
        if (min===null) min = mean;
        if (mean<min) min = mean;
    }
    
    // Apply auto colour scale
    for (let z in data) {
        let n = parseInt(240 * (1-((data[z].mean-min) / (max-min))));
        if (isNaN(n)) n = 240;
        data[z].color = 'hsl(' + n + ',100%,50%)';
    }   
            
    // Graph options
    options = {
        canvas: true,
        lines: { fill: false },
        //bars: { show: true, align: "center", barWidth: 0.75*interval*1000, fill: false},
        xaxis: { mode: "time", timezone: "browser" },
        grid: {
            show:true, 
            hoverable: true, 
            clickable: true
        }
    }
    
    // Visibility
    visible = JSON.parse(JSON.stringify(data));
    
    // Draw graph
    $.plot($('#graph'),visible, options);
    
    // Table
    var out = "";
    
    out += '<tr>';
    out += '<th style="width:50px">Enable</th>';
    out += '<th style="width:50px">Key</th>';
    out += '<th>Month</th>';
    if (config.app.feed_type.value=='Other') {
        out += '<th>Average</th>';
    } else {
        out += '<th>Average Power</th>';
        out += '<th>kWh/day</th>';
        out += '<th>kWh/month</th>';
    }
    out += '</tr>';
    
    for (var z in data) {
        out += "<tr>";
        out += "<td style='text-align:center'><input type='checkbox' style='margin-top:-3px' class='showhidemonth' z='"+z+"' checked /></td>";
        out += "<td><div class='color-box' style='background-color:"+data[z].color+"'></div></td>";
        out += "<td>"+data[z].label+"</td>"
        if (config.app.feed_type.value=='Other') {
            out += "<td>"+(data[z].mean).toFixed(2)+"</td>";    
        } else {
            out += "<td>"+(data[z].mean*1000).toFixed(0)+"W</td>";
            out += "<td>"+(data[z].kwh/data[z].days).toFixed(2)+" kWh/d</td>";
            out += "<td>"+(data[z].kwh).toFixed(1)+" kWh</td>";
        }
        out +="</tr>";
    }
    $("#table").html(out);
}
   
function updater()
{

}

function resize() 
{
    updater();
    // Resize graph
    $("#graph").width($('#app-block').width());
    $.plot($('#graph'),visible, options);
}

function clear()
{
    clearInterval(updaterinst);
}

$(window).resize(function(){
    resize();
});

$("#table").on("click",".showhidemonth",function() {
  visible = []
  $(".showhidemonth").each(function() {
      if ($(this)[0].checked) {
          visible.push(data[$(this).attr('z')]);
      }
  });
  $.plot($('#graph'),visible, options);
});

$("#resolution").change(function(){
    interval = 1*$(this).val();
    show();
});

$('#graph').bind("plothover", function (event, pos, item) {
    if (item) {
        var z = item.dataIndex;
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            
            let d = new Date();
            d.setTime(item.datapoint[0]);
            
            let h = d.getHours();
            if (h<10) h = '0'+h;

            let m = d.getMinutes();
            if (m<10) m = '0'+m;
            
            let text = item.series.label+" "+h+":"+m+": "+item.datapoint[1].toFixed(3)+" kW";
            
            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

$("#copy_to_clipboard").click(function(){ 
    copy_text_to_clipboard(csv,"CSV copied to clipboard");
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}
</script>
