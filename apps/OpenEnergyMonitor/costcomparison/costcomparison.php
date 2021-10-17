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
<!--<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.symbol.min.js?v=<?php echo $v; ?>"></script>-->
<!--<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.axislabels.min.js?v=<?php echo $v; ?>"></script>-->
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; echo $appdir; ?>rates.js?v=<?php echo $v; ?>"></script>

<style>
.block-bound {
background-color:#394d74;
}

div.font {
font-family: Montserrat, Veranda, sans-serif;
}

div.graph {
background-color:#dbdee5;
padding:10px;
}
.selected { font-size:20pt; }
</style>

<section class="font">
    <div id="app-block" style="display:none">
        <div class="col1">
            <div class="col1-inner">
                <div class="block-bound">
                    <div class="bluenav config-open">
                        <i class="icon-wrench icon-white"></i>
                    </div>
                    <div class="block-title">
                        Energy Cost Comparison
                    </div>
                </div>
                <div class="graph">
                    <label for="tariff">Tariff</label> <select id="tariff" name="tariff">
                    </select>
                </div>
            </div>
        </div>
        <div class="col1">
            <div class="col1-inner">
                <div class="block-bound">
                    <div class="bargraph-navigation">
                        <div class="bluenav bargraph-alltime">
                            ALL TIME
                        </div>
                        <div class="bluenav bargraph-year">
                            YEAR
                        </div>
                        <div class="bluenav bargraph-month">
                            MONTH
                        </div>
                        <div class="bluenav bargraph-week">
                            WEEK
                        </div>
                        <div class="bluenav bargraph-day">
                            DAY
                        </div>
                    </div>
                    <div class="block-title">
                        HISTORY
                    </div>
                </div>
                <div class="graph">
                    <div id="placeholder_bound" style="width:100%; height:500px;">
                        <div id="placeholder_legend"></div>
                        <div id="placeholder" style="width:100%; height:100%;"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col1">
            <div class="col1-inner">
                <div class="block-bound">
                    <div class="block-title">
                        Energy used by half-hour of day (over whole period)
                    </div>
                </div>
                <div class="graph">
                    <div id="halfhour_placeholder_bound" style="width:100%; height:250px;">
                        <div id="halfhour_legend"></div>
                        <div id="halfhour_placeholder" style="height:250px"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<div class="ajax-loader"></div>

<section id="app-setup" class="hide pb-3 px-3">
    <!-- instructions and settings -->
    <div class="row-fluid">
        <div class="span9 app-config-description">
            <div class="app-config-description-inner text-light">
                <h2 class="app-config-title text-primary"><?php echo _('Cost Comparison'); ?></h2>
                <p class="lead">The Cost Comparison app allows you to compare your energy usage against energy suppliers tariffs including new time of use tariffs.</p>
                <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                <p><strong>Note:</strong> If you have solar or renewable energy generation then use the import_kwh feed to view the actual cost based on energy brought from the grid</p>
                <p><strong class="text-white">Cumulative kWh</strong> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
                <img src="<?php echo $path; echo $appdir; ?>preview.png" class="d-none d-sm-inline-block">
            </div>
        </div>
        <div class="span3 app-config pt-3"></div>
    </div>
</section>

<script type="text/javascript">
// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;

apikeystr = "";
if (apikey != "") {apikeystr = "&apikey=" + apikey;}

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use_kwh": {
        "type": "feed",
        "autoname": "use_kwh",
        "engine": 5, 
        "description": "Use import_kwh if you have solar or renewable energy, otherwise use_kwh."        
    },
    "currency": {
        "type": "value",
        "default": "£",
        "name": "Currency",
        "description": "Currency symbol (£,$..)"
    },
    "maximum_currency_amount": {
    "type": "value",
    "default": "10.00",
    "name": "Max currency value",
    "description": "Maximum daily amount to show on currency axis (default of 10.00)"
    }
};
config.name = "<?php echo $name; ?>";
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

config.initapp = function() {
    init()
};
config.showapp = function() {
    show()
};
config.hideapp = function() {
    hide()
};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};
var meta = {};
var rate = [];

var bargraph_series = [];
var halfhour_usage_series = [];

var previousPoint = false;
var previousPointHalfHour = false;

var flot_font_size = 12;

//Time of first data reading
var start_time = 0;
//Currently selected tariff
var selected_energy_rate = null;

//These should be in a resource file for regionalization
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var selected_start, selected_end;
var updaterinst = false;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$(window).ready(function() {
    
});


$( "#tariff" ).change(function() {
  var newTariff=$( "select#tariff option:checked" ).val();

  for (var t in energy_rates) {
    if (newTariff===energy_rates[t].identifier) {
        selected_energy_rate = energy_rates[t];
        reloadExistingRange();
        break;
    }
  }
});

config.init();

function init() {    
    // Quick translation of feed ids
    feeds = {};
    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];
    }

    for (var t in energy_rates) {
        $('#tariff')
              .append($('<option>', { value : energy_rates[t].identifier })
              .text(energy_rates[t].supplier + " " + energy_rates[t].label + " ["+energy_rates[t].region+"]")); 
    }

    selected_energy_rate = energy_rates[0];
}

function show() {
    $("body").css('background-color', 'WhiteSmoke');
    
    console.log(feeds);
    
    meta["use_kwh"] = feed.getmeta(feeds.use_kwh.id);

    if (meta.use_kwh.start_time > start_time) {
        //Wind back start time to midnight on first reading day
        var d=new Date(meta.use_kwh.start_time * 1000);    
        d.setHours(0,0,0,0);
        start_time = d.getTime() / 1000;
        //console.log("kwh first reading",d);
    }

    resize();
    
    updater();
    
    //Update every 45 seconds
    updaterinst = setInterval(updater,45000);
}

function updater() {
    if (selected_start==null) {    oneweek(); $(".bargraph-week").addClass("selected");} else { reloadExistingRange(); }
}

function clearHighlight() {
    $(".bargraph-navigation .bluenav").removeClass("selected");
}


function loadAndDisplay(number_of_days_offset) {
    var d=new Date();    
    //Clear minutes and hours
    d.setHours(23,59,59,999);

    var timeWindow = (3600000 * 24.0 * number_of_days_offset);
    
    selected_end = d.getTime();
    selected_start = selected_end - timeWindow;

    //ensure we only request after the logging began
    selected_start=Math.max(selected_start, (start_time * 1000));
    
    reloadExistingRange();
}

function reloadExistingRange() {
    bargraph_load(selected_start, selected_end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();    
}

function oneweek() {
    loadAndDisplay(7);
}

$('#placeholder').bind("plotselected", function(event, ranges) {
    selected_start = ranges.xaxis.from;
    selected_end = ranges.xaxis.to;   
    reloadExistingRange();    
});

$('.bargraph-alltime').click(function() {
    //From start of data capture to today
    selected_start = start_time * 1000;
    var d=new Date();    
    d.setHours(23,59,59,0);
    selected_end = d.getTime();
    reloadExistingRange();
    clearHighlight();
    $(this).addClass("selected");
});



$('.bargraph-week').click(function() {
    oneweek();
    clearHighlight();
    $(this).addClass("selected");
});

$('.bargraph-month').click(function() {
    //TODO: We really should work out number of days in the month and not assume 30 days
    loadAndDisplay(30);
    clearHighlight();
    $(this).addClass("selected");
});

$('.bargraph-year').click(function() {
    //Go back to 1st Jan in current year
    var d=new Date((new Date).getFullYear(), 0, 1, 0, 0, 0, 0)
    selected_start = d.getTime();    
    
    selected_start = Math.max(selected_start, (start_time * 1000));
    
    d=new Date();
    d.setHours(23,59,59,0);
    selected_end = d.getTime();
    
    reloadExistingRange();
    
    clearHighlight();
    $(this).addClass("selected");
});

$('.bargraph-day').click(function() {
    loadAndDisplay(2);    
    clearHighlight();
    $(this).addClass("selected");
});

function timeFormatter(ms) {
    var date = new Date(ms);
    var hh = date.getHours();
    var mm = date.getMinutes();
    if (hh < 10) {
        hh = '0' + hh;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return hh + ':' + mm;
};


function hide() {
    //We should stop any timers we have started here
    clearInterval(updaterinst);
}

$("#halfhour_placeholder").bind("plothover", function(event, pos, item) {
    if (item) {
        var z = item.dataIndex;
        var seriesIndex = item.seriesIndex;

        if (previousPointHalfHour != item.datapoint) {
            previousPointHalfHour = item.datapoint;
            $("#tooltip").remove();

            var text = timeFormatter(item.datapoint[0]) +
                "<br>" +
                halfhour_usage_series[seriesIndex].data[z][1].toFixed(4) +
                " kWh @ " + config.app.currency.value + selected_energy_rate.rates[seriesIndex].cost.toFixed(4) + "/kWh <br>";
            tooltip(item.pageX, item.pageY, text, "#eee","#000");
        }

    } else $("#tooltip").remove();
});



$("#placeholder").bind("plothover", function(event, pos, item) {
    if (item) {
        var z = item.dataIndex;
        var seriesIndex = item.seriesIndex;

        if (seriesIndex == 0) {} else {


            if (previousPoint != item.datapoint) {
                previousPoint = item.datapoint;

                $("#tooltip").remove();

                var itemTime = item.datapoint[0];

                var d = new Date(itemTime);
                //This is UK formatted date - should be regional
                var date = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();
                var text = "";

                text = date + "<br>";
                var totalcost = 0;
                var totalkwh = 0;
                for (var series in bargraph_series) {
                    if (series > 0) {

                        var cost = selected_energy_rate.rates[series - 1].cost * bargraph_series[series].data[z][1];
                        totalkwh += bargraph_series[series].data[z][1];

                        text += "Rate " + series + ":" + bargraph_series[series].data[z][1].toFixed(3) + " kWh @ " + selected_energy_rate.rates[series - 1].cost.toFixed(4) + " = " + config.app.currency.value + cost.toFixed(2) + "<br>";
                        totalcost += cost;
                    } //end if
                } //end for

                text += "Total: " + config.app.currency.value + totalcost.toFixed(2) + " / " + totalkwh.toFixed(3) + "kWh";

                tooltip(item.pageX, item.pageY, text, "#eee", "#000");
            }
        }
    } else $("#tooltip").remove();

});


// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - bargraph_load
// - bargraph_draw
// - resize

function newFilledArray(len, val) {
    var rv = new Array(len);
    while (--len >= 0) {
        rv[len] = val;
    }
    return rv;
}

function bargraph_load(start, end) {
    
    $(".ajax-loader").show();
          
    var halfhour =  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5];
    
    var elec_data = feed.getdataDMY_time_of_use(feeds.use_kwh.id, start, end, "daily", JSON.stringify(halfhour));

    //console.log(elec_data);
    
    if (elec_data.length > 0) {
        //Replace the null values in last reading with the highest kWh reading so far today....
        var lastIndex = elec_data.length - 1;
        var maxReading = 0;
        var elecResult = elec_data[lastIndex][1];
        for (var z in elecResult) {
            if (elecResult.hasOwnProperty(z)) {
                if (elecResult[z] > maxReading) {
                    maxReading = elecResult[z];
                }
                if (elecResult[z] === null) {
                    elecResult[z] = maxReading;
                }
            }
        } //end for

        // Now work out the kWh difference between each reading, using closing reading from yesterday as starting position for today
        kwh = [];
        for (var day in elec_data) {
            if (day > 0) {
                var readings = [];

                for (var reading in elec_data[day][1]) {
                    var value = 0;
                    if (reading == 0) {
                        //First reading of the day, so subtract the previous days final reading
                        value = elec_data[day][1][0] - elec_data[day - 1][1][elec_data[day - 1][1].length - 1];
                    } else {
                        //Take this reading away from previous
                        value = elec_data[day][1][reading] - elec_data[day][1][reading - 1];
                    }

                    if (value < 0) value = 0;
                    readings.push(value);
                } //end for

                kwh.push([elec_data[day][0], readings]);

                //console.log(readings);

            } //end if
        } //end for
    } //end if


    //At this point kwh object contains a breakdown of the energy usage in 30 minute segments
    //create a total summary for these 30 minute segments over the time period
    //and split into colour coded series to show on graph

    var breakdown = [];

    for (var loop in selected_energy_rate.rates) {
        breakdown[loop] = [];
    }

    for (var time in halfhour) {
        var total = 0.0;
        for (var day in kwh) {
            total += kwh[day][1][time];
        } //end for
        //Avoid negative numbers
        if (total < 0) {
            total = 0.0;
        }

        //Create a fake date so the graph shows the time correctly
        var seconds = 1483228800000 + ((halfhour[time] * 3600000));
        breakdown[selected_energy_rate.rate_bucket[time]].push([seconds, total]);
    }

    //Calculate the total used for the period on an half hourly basis to allow user to visualise peak times over a longer period of time.
    //Colour code bars as per rate level
    halfhour_usage_series = [];

    for (var x in breakdown) {
        halfhour_usage_series.push({
            stack: false,
            data: breakdown[x],
            color: selected_energy_rate.rates[x].colour,
            label: "Rate " + (parseInt(x) + 1) + " " + config.app.currency.value + selected_energy_rate.rates[x].cost.toFixed(4),
            bars: {
                show: true,
                align: "center",
                barWidth: 0.45 * 3600000,
                fill: 1.0,
                lineWidth: 0
            },
            clickable: false
        });
    }

    //    console.log(halfhour_usage_series);

    // Init rate variable
    rate = [];
    for (var loop in selected_energy_rate.rates) {
        rate[loop] = [];
    }

    //Init variable to hold breakdown of total daily cost
    var thisdaycost = [];

    for (var day in kwh) {

        //Create array to hold todays totals, and zero it
        var thisdaytotal = newFilledArray(rate.length, 0);

        //For each time segment sum up the kWh used for this day and split into
        //the different rate "buckets"
        for (var time in halfhour) {
            thisdaytotal[selected_energy_rate.rate_bucket[time]] += kwh[day][1][time];
        }

        var todaycost = 0;

        for (var loop in thisdaytotal) {
            //Cost for today
            todaycost += thisdaytotal[loop] * selected_energy_rate.rates[loop].cost;
            //kWh breakdown for each rate for the whole day
            rate[loop].push([kwh[day][0], thisdaytotal[loop]]);
        }

        thisdaycost.push([kwh[day][0], todaycost]);
    }

    //This holds the data for the main graph on top of the page
    bargraph_series = [];

    bargraph_series.push({
        stack: false,
        data: thisdaycost,
        color: '#000000',
        label: "Cost",
        yaxis: 2,
        clickable: false,
        hoverable: false,
        //points: { symbol: "square"}
        lines : { show : true, lineWidth : 3}
    });

    for (var r in selected_energy_rate.rates) {

        bargraph_series.push({
            stack: true,
            data: rate[r],
            color: selected_energy_rate.rates[r].colour,
            label: "Rate " + (parseInt(r) + 1) + " " + config.app.currency.value + selected_energy_rate.rates[r].cost.toFixed(4),
            yaxis: 1,
            bars: {
                show: true,
                align: "center",
                barWidth: 0.75 * 3600 * 24 * 1000,
                fill: 0.75,
                lineWidth: 0
            },
            clickable: false
        });
    } //end for
    
    $(".ajax-loader").hide();
} //end function

function halfhour_usage_bargraph_draw() {
    var halfhour_options = {
        xaxis: {
            mode: "time",
            font: {
                size: flot_font_size,
                color: "#666"
            },
            minTickSize: [30, "minute"]
        },
        yaxes: [{
            min: 0,
            tickFormatter: kWhFormatter,
            position: 'left',
            alignTicksWithAxis: null,
            font: {
                size: flot_font_size,
                color: "#666"
            }
        }, ],

        selection: {
            mode: "x"
        },
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: false
            //, backgroundColor: { colors: ["#dbdee5", "#999"] }
        },
        legend: {
            show: true,
            container: $('#halfhour_legend'),
            margin: 15,
            position: "nw",
            noColumns: 8,
            placement: 'outsideGrid'
        }
    };

    var halfhour_plot = $.plot($('#halfhour_placeholder'), halfhour_usage_series, halfhour_options);
}


function currencyFormatter(v, axis) {
    return config.app.currency.value + v.toFixed(axis.tickDecimals);
}

function kWhFormatter(v, axis) {
    return v.toFixed(axis.tickDecimals) + 'kWh';
}

function bargraph_draw() {
    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            font: {
                size: flot_font_size,
                color: "#666"
            },
            reserveSpace: false,
            minTickSize: [1, "day"]
                        
            //,axisLabel: "Time"
    
        },

        yaxes: [{
                min: 0,
                tickFormatter: kWhFormatter,
                position: 'left',
                alignTicksWithAxis: null,
                font: {
                    size: flot_font_size,
                    color: "#666"
                }                
                //,axisLabel: "Energy usage (kWh)"
                //,axisLabelUseCanvas: true
            },
            {
                min: 0, max: config.app.maximum_currency_amount.value,
                alignTicksWithAxis: 1,
                position: 'right',
                tickFormatter: currencyFormatter, 
                tickDecimals:2,
                font: {
                    size: flot_font_size,
                    color: "#666"
                }
                //,axisLabel: "Total energy cost"
                //,axisLabelUseCanvas: true
            }
        ],

        selection: {
            mode: "x"
        },
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true
        },
        legend: {
            show: true,
            container: $('#placeholder_legend'),
            margin: 15,
            position: "nw",
            noColumns: 8,
            placement: 'outsideGrid'
        }
    };

    var plot = $.plot($('#placeholder'), bargraph_series, options);
}

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------
function resize() {
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');
    var width = placeholder_bound.width();
    var height = width * 0.6;
    if (height > 500) height = 500;
    if (height > width) height = width;

    //console.log(width+" "+height);

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);
}

// on finish sidebar hide/show
$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function(){
        var window_width = $(this).width();
        flot_font_size = 12;
        if (window_width < 450) flot_font_size = 10;
        resize();
        bargraph_draw();
        halfhour_usage_bargraph_draw();
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}
</script>
