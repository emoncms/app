<?php
    global $path, $session;
    $v = 5;
?>
<link href="<?php echo $path; ?>Modules/app/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">
<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/config.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/lib/feed.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/vis.helper.js?v=<?php echo $v; ?>"></script>
<style>
.block-bound {
  background-color:#394d74;
}

div.font {
font-family: Montserrat, Veranda, sans-serif;
}

div.style1 {
background-color:#dbdee5;
color:#333;
padding:10px;
}

div.graph {
background-color:#dbdee5;
padding:10px;
}
</style>

<div class="font">
<div id="app-block" style="display:none">
  <div class="col1">
    <div class="col1-inner">
    <div class="block-bound">
      <div class="bluenav openconfig"><i class="icon-wrench icon-white"></i></div>
      <div class="block-title">Energy Cost Comparison</div>
    </div>

<div class="graph">
<label for="tariff">Tariff</label>
<select id="tariff" name="tariff"></select>
</div>
    </div>
</div>

  <div class="col1"><div class="col1-inner">
    <div class="block-bound">
      <div class="bargraph-navigation">
        <!--<div class="bluenav bargraph-other">OTHER</div>-->
        <div class="bluenav bargraph-alltime">ALL TIME</div>
        <div class="bluenav bargraph-month">MONTH</div>
        <div class="bluenav bargraph-week">WEEK</div>
      </div>
      <div class="block-title">HISTORY</div>
    </div>
    <div class="graph">
      <div id="placeholder_bound" style="width:100%; height:500px;">
	<div id="placeholder_legend"></div>
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>

    <div id="power-graph-footer" style="background-color:#eee; color:#333; display:none">
      <div id='advanced-toggle' class='bluenav' >SHOW DETAIL</div>
       <div style="padding:10px;">kWh in window: <b id="window-kwh"></b> <b>kWh</b></div>
      <div style="clear:both"></div>
    </div>

    <div id="advanced-block" style="background-color:#eee; padding:10px; display:none">
      <div style="color:#000">
        <table class="table">
          <tr>
          <th></th>
          <th style="text-align:center">Min</th>
          <th style="text-align:center">Max</th>
          <th style="text-align:center">Diff</th>
          <th style="text-align:center">Mean</th>
          <th style="text-align:center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
      </div>
    </div>
  </div></div>

<div class="col1"><div class="col1-inner">

<div class="block-bound">
<div class="block-title">Energy used by half-hour of day (over whole period)</div>
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
</div>

<div id="app-setup" class="block">
    <h2 class="appconfig-title">Cost Comparison</h2>
    <div class="appconfig-description">
      <div class="appconfig-description-inner">
        The Cost Comparison app allows you to compare your energy usage against energy suppliers tariffs including new time of use tariffs.
        <br><br>
        <b>Auto configure:</b> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.
	<br><br>
	<b>Note:</b> If you have solar or renewable energy generation then use the import_kwh feed to view the actual cost based on energy brought from the grid
	<br><br>
        <b>Cumulative kWh</b> feeds can be generated from power feeds with the power_to_kwh input processor.
        <br><br>
        <img src="../Modules/app/images/costcomparison_app.png" style="width:600px" class="img-rounded">
      </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"><img src="<?php echo $path; ?>Modules/app/images/ajax-loader.gif"/></div>

<script>
// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var path = "<?php print $path; ?>";
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;

apikeystr = "";
if (apikey != "") {apikeystr = "&apikey=" + apikey;}

if (!sessionwrite) $(".openconfig").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use_kwh": {
        "type": "feed",
        "autoname": "use_kwh",
        "engine": 5
    },
    "currency": {
        "type": "value",
        "default": "£",
        "name": "Currency",
        "description": "Currency symbol (£,$..)"
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
var data = {};
var rate = [];
var bargraph_series = [];
var halfhour_usage_series = [];
var previousPoint = false;
var previousPointHalfHour = false;
var panning = false;
var period_text = "month";
var flot_font_size = 12;
var start_time = 0;
var use_start = 0;

//These should be in a resource file for globalization
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var energy_rates = []

energy_rates.push( {

 identifier : "GREENENERGYTIDE20170713",
 label : "Green Energy Tide tariff (W Mids)",
 updated_epoc : 1499978704,
//Rate zero = standard 11.99 pence
//Rate one  = premium 24.99 pence
//rate two  = low 4.99 pence
 rates : [{
        cost: 0.1199,
        colour: "#276FBF"
    },
    {
        cost: 0.2499,
        colour: "#F03A47"
    },
    {
        cost: 0.0499,
        colour: "#97CC04"
    }
 ],
//48 item array containing which half hour segment belongs to which rate
//runs from 00:00 (midnight) to 23:59 in 30 minute segments
 rate_bucket : [
    //00:00 to 01:00
    2, 2,
    //01:00 to 02:00
    2, 2,
    //02:00 to 03:00
    2, 2,
    //03:00 to 04:00
    2, 2,
    //04:00 to 05:00
    2, 2,
    //05:00 to 06:00
    2, 2,
    //06:00 to 07:00
    0, 0,
    //07
    0, 0,
    //08
    0, 0,
    //09
    0, 0,
    //10
    0, 0,
    //11
    0, 0,
    //12
    0, 0,
    //13
    0, 0,
    //14
    0, 0,
    //15
    0, 0,
    //16:00 to 17:00
    1, 1,
    //17:00 to 18:00
    1, 1,
    //18:00 to 19:00
    1, 1,
    //19:00 to 20:00
    0, 0,
    //20:00 to 21:00
    0, 0,
    //21:00 to 22:00
    0, 0,
    //22:00 to 23:00
    0, 0,
    //23:00 to 23:59
    2, 2
  ]
});




energy_rates.push( {
 identifier : "SAINSBURYENERGYFIXEDPRICEFEB2018WESTMIDS",
 label : "Sainsbury's Energy Fixed Price February 2018 (W Mids)",
 updated_epoc : 1499978704,
//Rate zero = standard 10.98 pence
 rates : [{
        cost: 0.1098,
        colour: "#276FBF"
    }
 ],
 rate_bucket : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0  ]
});




energy_rates.push( {
 identifier : "ECOTRICITYGREENELECTRICWESTMIDS",
 label : "Ecotricity Green Electricity (W Mids)",
 updated_epoc : 1499978704,
 rates : [{
        cost: 0.1820,
        colour: "#276FBF"
    }
 ],
 rate_bucket : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0  ]
});


energy_rates.push( {
 identifier : "NPOWERECONOMY7CLEANERENERGYFIXOCT2019MIDLANDS",
 label : "NPOWER Economy 7 Cleaner Energy Fix October 2019 (Midlands area)",
 updated_epoc : 1499978704,

 rates : [{cost: 0.17829, colour: "#F03A47"},{cost: 0.08463, colour: "#276FBF"}
 ],
 rate_bucket : [
//23:30 to 08:00 is enonomy 7 hours
  //00:00 to 01:00
    1, 1,
    //01:00 to 02:00
    1, 1,
    //02:00 to 03:00
    1, 1,
    //03:00 to 04:00
    1, 1,
    //04:00 to 05:00
    1, 1,
    //05:00 to 06:00
    1, 1,
    //06:00 to 07:00
    1, 1,
    1, 1,
    0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0, 0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0, 0, 0, 0, 0,
    //23:00 to 23:59
    0, 1
]
});




energy_rates.push( {
 identifier : "NPOWERECONOMY7STANDARDVARIABLEMIDLANDS",
 label : "NPOWER Economy 7 Standard Variable (Midlands area)",
 updated_epoc : 1499978704,

 rates : [{cost: 0.226065, colour: "#F03A47"},{cost: 0.08085, colour: "#276FBF"}
 ],
 rate_bucket : [
//23:30 to 08:00 is enonomy 7 hours
  //00:00 to 01:00
    1, 1,
    //01:00 to 02:00
    1, 1,
    //02:00 to 03:00
    1, 1,
    //03:00 to 04:00
    1, 1,
    //04:00 to 05:00
    1, 1,
    //05:00 to 06:00
    1, 1,
    //06:00 to 07:00
    1, 1,
    1, 1,
    0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0, 0, 0,    0, 0,    0, 0,    0, 0,    0, 0,    0, 0, 0, 0, 0, 0,
    //23:00 to 23:59
    0, 1
]
});


//Useful NPOWER site for Economy 7 regions in UK
// https://customerservices.npower.com/app/answers/detail/a_id/179/~/what-are-the-economy-7-peak-and-off-peak-periods%3F

//console.log(energy_rates);

var selected_energy_rate = null;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$(window).ready(function() {

for (var t in energy_rates) {
	$('#tariff')
          .append($('<option>', { value : energy_rates[t].identifier })
          .text(energy_rates[t].label)); 
}

selected_energy_rate = energy_rates[0];

    initialLoad();

    $(".ajax-loader").hide();

});


$( "#tariff" ).change(function() {
  var newTariff=$( "select#tariff option:checked" ).val();

  for (var t in energy_rates) {

    if (newTariff===energy_rates[t].identifier) {

    	selected_energy_rate = energy_rates[t];
	initialLoad();
	$(".ajax-loader").hide();
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
}

function show() {
    $("body").css('background-color', 'WhiteSmoke');
    meta["use_kwh"] = feed.getmeta(feeds["use_kwh"].id);

    if (meta["use_kwh"].start_time > start_time) start_time = meta["use_kwh"].start_time;

    use_start = feed.getvalue(feeds["use_kwh"].id, start_time * 1000)[1];

    resize();
}

function initialLoad() {
    //30 days - this really should work out the number of days etc.
    var timeWindow = (3600000 * 24.0 * 30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    period_text = "month";

    bargraph_load(start, end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();
}


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
            tooltip(item.pageX, item.pageY, text, "#eee");
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

                        text += "Rate " + series + ":" + bargraph_series[series].data[z][1].toFixed(3) + " kWh = " + config.app.currency.value +
                            cost.toFixed(2) + " @ " + selected_energy_rate.rates[series - 1].cost.toFixed(4) + "<br>";
                        totalcost += cost;
                    } //end if
                } //end for

                text += "Total: " + config.app.currency.value + totalcost.toFixed(2) + " / " + totalkwh.toFixed(3) + "kWh";

                tooltip(item.pageX, item.pageY, text, "#eee");
            }
        }
    } else $("#tooltip").remove();

});

$('#placeholder').bind("plotselected", function(event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true;
    bargraph_load(start, end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();
    setTimeout(function() {
        panning = false;
    }, 100);
});

$('.bargraph-alltime').click(function() {
    var start = start_time * 1000;
    var end = (new Date()).getTime();
    bargraph_load(start, end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();
    period_text = "period";
});

$('.bargraph-week').click(function() {
    var timeWindow = (3600000 * 24.0 * 7);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start, end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();
    period_text = "week";
});

$('.bargraph-month').click(function() {
    var timeWindow = (3600000 * 24.0 * 30);
    var end = (new Date()).getTime();
    var start = end - timeWindow;
    bargraph_load(start, end);
    bargraph_draw();
    halfhour_usage_bargraph_draw();
    period_text = "month";
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
    var interval = 3600 * 24;
    var intervalms = interval * 1000;
    end = Math.ceil(end / intervalms) * intervalms;
    start = Math.floor(start / intervalms) * intervalms;

    var halfhour = [];
    for (i = 0; i < 24.0; i = i + 0.5) {
        halfhour.push(i);
    }

    var elec_data = feed.getdataDMY_time_of_use(feeds["use_kwh"].id, start, end, "daily", JSON.stringify(halfhour));

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

    //	console.log(halfhour_usage_series);

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
        color: '#16425B',
        label: "Cost",
        yaxis: 2,
        clickable: false,
        hoverable: false
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
            },
            {
                min: 0, max:10,
                alignTicksWithAxis: 1,
                position: 'right',
                tickFormatter: currencyFormatter,
                font: {
                    size: flot_font_size,
                    color: "#666"
                }
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

$(window).resize(function() {
    var window_width = $(this).width();

    flot_font_size = 12;
    if (window_width < 450) flot_font_size = 10;

    resize();

    bargraph_draw();
    halfhour_usage_bargraph_draw();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}
</script>
