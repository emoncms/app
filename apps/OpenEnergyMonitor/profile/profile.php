<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/profile/profile.css?v=4" rel="stylesheet">
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path;?>Lib/js/clipboard.js?v=<?php echo $v; ?>"></script>

<div id="app-block" style="display:none">
  <div class="app-card">
    <nav class="app-top-bar d-flex justify-content-between">
      <ul class="btn-list">
        <li><h3 class="app-heading"><i class="svg-icon-show_chart"></i><span>Profile Explorer</span></h3></li>
      </ul>
      <ul class="btn-list">
        <li>
          <span class="mode-toggle">
            <button class="mode-toggle-btn active" data-mode="monthly">Monthly</button>
            <button class="mode-toggle-btn" data-mode="annual">Annual</button>
          </span>
        </li>
        <li>
          <span class="ctrl-group">
            <span class="ctrl-label">Interval</span>
            <select id="resolution">
              <option value="600">10 mins</option>
              <option value="900">15 mins</option>
              <option value="1800">30 mins</option>
              <option value="3600">60 mins</option>
            </select>
          </span>
        </li>
        <li><button class="app-btn config-open" title="Configure app"><i class="icon-wrench icon-white"></i></button></li>
      </ul>
    </nav>

    <div class="graph-wrap">
      <div id="graph" style="height:500px; width:100%;"></div>
    </div>
  </div>

  <div class="app-card">
    <table class="data-table">
      <tbody id="table"></tbody>
    </table>

    <div style="padding: 0.75rem 8px;">
      <button class="action-btn" id="copy_to_clipboard" title="Copy CSV data to clipboard">Copy CSV <i class="icon-share-alt icon-white"></i></button>
    </div>
  </div>
</div>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore average daily profiles for different months of the year.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

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

// Display mode: "monthly" (one profile per month) or "annual" (single profile averaged over the year)
var mode = "monthly";

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
config.app_name = "Profile Explorer";
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
var feeds = {};

config.init();

// Builds an average daily profile starting at date d, spanning `months` months (default 1).
// Advances d to the end of the span.
function process_profile(d, months) {
    if (months === undefined) months = 1;
    var start = d.getTime();
    d.setMonth(d.getMonth()+months);
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

    var d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(1);
    d.setMonth(d.getMonth()-12);
    
    csv = "";

    data = [];
    if (mode=="annual") {
        // Single profile averaged over the last 12 months
        var result = process_profile(d,12);
        if (result.kwh>0) {
            data.push({label:"Annual", data: result.profile, kwh: result.kwh, days: result.days});

            csv += "Annual, ";
            for (var m in result.profile) {
                csv += result.profile[m][1].toFixed(3)+", ";
            }
            csv += "\n";
        }
    } else {
        // One profile per month over the last 12 months
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
    
    if (mode=="annual") {
        // Single series: use the theme accent colour
        for (let z in data) data[z].color = "#44b3e2";
    } else {
        // Apply auto colour scale (slightly desaturated/lightened to sit well on the dark background)
        for (let z in data) {
            let n = parseInt(240 * (1-((data[z].mean-min) / (max-min))));
            if (isNaN(n)) n = 240;
            data[z].color = 'hsl(' + n + ',85%,55%)';
        }
    }

    // Graph options
    var font_color = "#888";
    options = {
        canvas: true,
        lines: { fill: false },
        //bars: { show: true, align: "center", barWidth: 0.75*interval*1000, fill: false},
        xaxis: { mode: "time", timezone: "browser", font: { color: font_color } },
        yaxis: { font: { color: font_color } },
        grid: {
            show:true,
            hoverable: true,
            clickable: true,
            borderWidth: 0
        },
        legend: {
            position: "ne",
            noColumns: 2,
            backgroundColor: "#262626",
            backgroundOpacity: 0.85,
            labelBoxBorderColor: "#262626",
            margin: [10, 10]
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
    out += '<th>'+(mode=="annual" ? "Profile" : "Month")+'</th>';
    if (config.app.feed_type.value=='Other') {
        out += '<th>Average</th>';
    } else {
        out += '<th>Average Power</th>';
        out += '<th>kWh/day</th>';
        out += '<th>'+(mode=="annual" ? "kWh/year" : "kWh/month")+'</th>';
    }
    out += '</tr>';
    
    for (var z in data) {
        out += "<tr>";
        out += "<td style='text-align:center'><input type='checkbox' class='showhidemonth' z='"+z+"' checked /></td>";
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
    // Resize graph (fit the inner width of the containing card)
    $("#graph").width($('#graph').parent().width());
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

$(".mode-toggle-btn").click(function(){
    var new_mode = $(this).data("mode");
    if (new_mode == mode) return;
    mode = new_mode;
    $(".mode-toggle-btn").removeClass("active");
    $(this).addClass("active");
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
            
            show_tooltip(item.pageX+10, item.pageY+5, [
                ["TIME", h+":"+m, ""],
                [item.series.label.toUpperCase(), item.datapoint[1].toFixed(3), "kW", item.series.color]
            ]);
        }
    } else {
        previousPoint = false;
        $("#tooltip").remove();
    }
});

// Builds and positions the hover tooltip (same component as myelectricflow).
// Each entry in `values` is [label, value, units, swatchColor?].
function show_tooltip(x, y, values) {
    $("#tooltip").remove();
    var tooltip = $('<div id="tooltip"></div>')
        .css({
            position: "absolute",
            display: "none",
            padding: "6px 8px",
            "border-radius": "0.375rem",
            "background-color": "#333",
            "z-index": 10
        })
        .appendTo("body");

    var table = $('<table/>').appendTo(tooltip);
    for (var i in values) {
        var value = values[i];
        var row = $('<tr/>').appendTo(table);
        var swatch = value[3] ? '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+value[3]+';margin-right:6px"></span>' : '';
        $('<td style="padding-right: 8px">'+swatch+'<span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
        $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
    }
    tooltip.css({ left: x, top: y }).show();
}

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
