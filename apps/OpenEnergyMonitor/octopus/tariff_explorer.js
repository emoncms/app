
// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------

feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

var profile_mode = false;

var show_carbonintensity = $("#show_carbonintensity")[0].checked;

// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color', 'WhiteSmoke');
$(window).ready(function() {
    //$("#footer").css('background-color','#181818');
    //$("#footer").css('color','#999');
});

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------

var tariff_options = [
    "AGILE-18-02-21",
    "AGILE-22-07-22",
    "AGILE-22-08-31",
    "AGILE-23-12-06",
    "AGILE-24-10-01",
    //"AGILE-VAR-22-10-19",
    //"AGILE-FLEX-22-11-25",
    "GO-VAR-22-10-14",
    "INTELLI-FLUX-IMPORT-23-07-14",
    "INTELLI-VAR-22-10-14",
    "INTELLI-VAR-24-10-29",
    "INTELLI-VAR-OEV-24-07-17",
    "SNUG-24-11-07",
    "COSY-22-12-08",
    "FLUX-IMPORT-23-02-14"
    // Custom opens tariff builder
    // "CUSTOM"
];

config.app = {
    "title": {
        "type": "value",
        "default": "Tariff Explorer",
        "name": "Title",
        "description": "Optional title for app"
    },
    "import": {
        "optional": true,
        "type": "feed",
        "autoname": "import"
    },
    "import_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "import_kwh"
    },
    "use_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "use_kwh"
    },
    "solar_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "solar_kwh"
    },
    "battery_charge_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_charge_kwh"
    },
    "battery_discharge_kwh": {
        "optional": true,
        "type": "feed",
        "autoname": "battery_discharge_kwh"
    },
    "meter_kwh_hh": {
        "optional": true,
        "type": "feed",
        "autoname": "meter_kwh_hh"
    },

    "region": {
        "type": "select",
        "name": "Select region:",
        "default": "D_Merseyside_and_Northern_Wales",
        "options": ["A_Eastern_England", "B_East_Midlands", "C_London", "E_West_Midlands", "D_Merseyside_and_Northern_Wales", "F_North_Eastern_England", "G_North_Western_England", "H_Southern_England", "J_South_Eastern_England", "K_Southern_Wales", "L_South_Western_England", "M_Yorkshire", "N_Southern_Scotland", "P_Northern_Scotland"]
    },

    "tariff_A": {
        "type": "select",
        "name": "Select tariff A:",
        "default": "AGILE-23-12-06",
        "options": tariff_options
    },

    "tariff_B": {
        "type": "select",
        "name": "Select tariff B:",
        "default": "INTELLI-VAR-22-10-14",
        "options": tariff_options
    },

    "public": {
        "type": "checkbox",
        "name": "Public",
        "default": 0,
        "optional": true,
        "description": "Make app public"
    }

};


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

var octopus_feed_list = {};

var regions_outgoing = {
    "A_Eastern_England": 399374,
    "B_East_Midlands": 399361,
    "C_London": 399362,
    "D_Merseyside_and_Northern_Wales": 399363,
    "E_West_Midlands": 399364,
    "F_North_Eastern_England": 399365,
    "G_North_Western_England": 399366,
    "H_Southern_England": 399367,
    "J_South_Eastern_England": 399368,
    "K_Southern_Wales": 399369,
    "L_South_Western_England": 399370,
    "M_Yorkshire": 399371,
    "N_Southern_Scotland": 399372,
    "P_Northern_Scotland": 399373
}

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};
var data = {};
var graph_series = [];
var previousPoint = false;
var panning = false;
var flot_font_size = 12;
var updaterinst = false;
var this_halfhour_index = -1;
// disable x axis limit
view.limit_x = false;
var cumulative_import_data = false;
var solarpv_mode = false;
var battery_mode = false;
var smart_meter_data = false;
var use_meter_kwh_hh = false;

var profile_kwh = {};
var profile_cost = {};

config.init();

function init() {
    $("#datetimepicker1").datetimepicker({
        language: 'en-EN'
    });

    $("#datetimepicker2").datetimepicker({
        language: 'en-EN'
    });

    datetimepicker1 = $('#datetimepicker1').data('datetimepicker');
    datetimepicker2 = $('#datetimepicker2').data('datetimepicker');
}

function show() {
    $("body").css('background-color', 'WhiteSmoke');
    $("#app-title").html(config.app.title.value);

    // Quick translation of feed ids
    feeds = {};

    for (var key in config.app) {
        if (config.app[key].value) feeds[key] = config.feedsbyid[config.app[key].value];
    }

    solarpv_mode = false;
    battery_mode = false;

    resize();

    $.ajax({
        url: path + "app/octopus-feed-list",
        dataType: 'json',
        async: false,
        success: function(result) {
            for (var z in result) {
                var tag = result[z].tag;
                if (octopus_feed_list[tag] == undefined) octopus_feed_list[tag] = {};
                octopus_feed_list[tag][result[z].name] = parseInt(result[z].id);
            }
        }
    });

    setPeriod('T');
    graph_load();
    graph_draw();

    updater();
    updaterinst = setInterval(updater, 5000);
    $(".ajax-loader").hide();
}

function setPeriod(period) {
    switch (period) {
        case 'T':
            //Today
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            view.start = d.getTime();
            d.setHours(24, 0, 0, 0);
            view.end = d.getTime();
            //view.timewindow(3600000);
            break;
        case 'Y':
            //Yesterday
            var d = new Date();
            d.setHours(0, 0, 0, 0);
            view.end = d.getTime();
            d.setHours(-24);
            view.start = d.getTime();
            //view.timewindow(3600000);
            break;
        case 'W':
            //Week
            var d = new Date();
            view.end = d.getTime();
            d.setHours(0, 0, 0, 0);
            d.setHours(-24 * d.getDay());
            view.start = d.getTime();
            // view.timewindow(3600000);
            break;
        case 'M':
            // Month
            var d = new Date();
            view.end = d.getTime();
            d.setHours(0, 0, 0, 0);
            d.setHours(-24 * (d.getDate() - 1));
            view.start = d.getTime();
            // view.timewindow(3600000);
            break;
        case '12':
        case '24':
        case '168':
        case '720':
        case '1440':
        case '8760':
            var timeWindow = (3600000 * period);
            view.end = (new Date()).getTime();
            view.start = view.end - timeWindow;

            if (period <= 24) {
                view.end += 3600 * 4 * 1000; // show 4h of forecast for short time ranges
            }
            // view.timewindow(timeWindow);
            break;
        default:
            alert('Invalid time period');
            break;
    }
}

function hide() {
    clearInterval(updaterinst);
}

function updater() {
    feed.listbyidasync(function(result) {
        if (result === null) {
            return;
        }

        for (var key in config.app) {
            if (config.app[key].value) feeds[key] = result[config.app[key].value];
        }

        if (feeds["import"] != undefined) {
            if (feeds["import"].value < 10000) {
                $("#power_now").html(Math.round(feeds["import"].value) + "<span class='units'>W</span>");
            } else {
                $("#power_now").html((feeds["import"].value * 0.001).toFixed(1) + "<span class='units'>kW</span>");
            }
        }
    });
}

// -------------------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------------------
// The buttons for these graph events are hidden when in historic mode 
// The events are loaded at the start here and dont need to be unbinded and binded again.
$("#zoomout").click(function() {
    view.zoomout();
    graph_load();
    graph_draw();
});
$("#zoomin").click(function() {
    view.zoomin();
    graph_load();
    graph_draw();
});
$('#right').click(function() {
    view.pan_speed = 0.5;
    view.panright();
    graph_load();
    graph_draw();
});
$('#left').click(function() {
    view.pan_speed = 0.5;
    view.panleft();
    graph_load();
    graph_draw();
});
$('#fastright').click(function() {
    view.pan_speed = 1.0;
    view.panright();
    graph_load();
    graph_draw();
});
$('#fastleft').click(function() {
    view.pan_speed = 1.0;
    view.panleft();
    graph_load();
    graph_draw();
});


$('.time').click(function() {
    setPeriod($(this).attr("time"));
    // view.timewindow(period);
    graph_load();
    graph_draw();
});

$('.time-select').change(function() {
    var val = $(this).val();

    if (val == "C") {

    } else {
        setPeriod(val);
        // view.timewindow(period);
        graph_load();
        graph_draw();
    }
});

$('#placeholder').bind("plothover", function(event, pos, item) {
    if (item) {
        var z = item.dataIndex;

        var isStepped = item.series.lines && item.series.lines.steps;

        if (isStepped) {
            z = Math.floor(z / 2);
        }


        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
            var itemTime = item.datapoint[0];
            var itemValue = item.datapoint[1];

            var d = new Date(itemTime);
            var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var hours = d.getHours();
            if (hours < 10) hours = "0" + hours;
            var minutes = d.getMinutes();
            if (minutes < 10) minutes = "0" + minutes;
            var seconds = d.getSeconds();
            if (seconds < 10) seconds = "0" + seconds;

            var date = hours + ":" + minutes;
            if (!profile_mode) date += ", " + days[d.getDay()] + " " + months[d.getMonth()] + " " + d.getDate();

            var text = date + "<br>";

            if (profile_mode) {
                if (item.series.label == 'Import') {
                    text += "Cumulative ";
                } else {
                    text += "Average ";
                }
            }

            let import_kwh = get_data_value_at_index("import", z);
            let solar_used_kwh = get_data_value_at_index("solar_used", z);
            let export_kwh = get_data_value_at_index("export", z);
            let tariff_A = get_data_value_at_index("tariff_A", z);
            let tariff_B = get_data_value_at_index("tariff_B", z);
            let outgoing = get_data_value_at_index("outgoing", z);
            let carbonintensity = get_data_value_at_index("carbonintensity", z);

            if (import_kwh != null) {
                text += "Import: " + import_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) {
                    let cost = import_kwh * tariff_A;
                    text += " (" + cost.toFixed(2) + "p cost)";
                }
            }

            if (solar_used_kwh != null) {
                text += "<br>Used Solar: " + solar_used_kwh.toFixed(3) + " kWh";
                if (tariff_A != null) {
                    let cost = solar_used_kwh * tariff_A;
                    text += " (" + cost.toFixed(2) + "p saved)";
                }
            }

            if (export_kwh != null) {
                text += "<br>Export: " + (export_kwh * -1).toFixed(3) + " kWh";
                if (outgoing != null) {
                    let cost = export_kwh * outgoing;
                    text += " (" + cost.toFixed(2) + "p gained)";
                }
            }

            text += "<br>";

            if (outgoing != null) {
                text += "Export Tariff: " + outgoing.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (show_carbonintensity && carbonintensity != null) {
                text += "Carbon Intensity: " + carbonintensity.toFixed(0) + " gCO2/kWh<br>";
            }

            if (tariff_A != null) {
                text += config.app.tariff_A.value+": " + tariff_A.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            if (tariff_B != null) {
                text += config.app.tariff_B.value+": " + tariff_B.toFixed(2) + " p/kWh (inc VAT)<br>";
            }

            tooltip(item.pageX, item.pageY, text, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

function get_data_value_at_index(key, index) {
    if (data[key] == undefined) return null;
    if (data[key][index] == undefined) return null;
    return data[key][index][1];
}

$('#placeholder').bind("plotselected", function(event, ranges) {
    var start = ranges.xaxis.from;
    var end = ranges.xaxis.to;
    panning = true;

    view.start = start;
    view.end = end;
    graph_load();
    graph_draw();

    $(".time-select").val("C");

    setTimeout(function() {
        panning = false;
    }, 100);
});

$("#use_meter_kwh_hh").click(function() {
    use_meter_kwh_hh = $(this)[0].checked;
    graph_load();
    graph_draw();
});

$("#show_carbonintensity").click(function() {
    show_carbonintensity = $(this)[0].checked;
    graph_load();
    graph_draw();
    if (!show_carbonintensity) $("#carbonintensity_result").html("");
});

$("#show_profile").click(function() {
    profile_draw();
});

$("#download-csv").click(function() {

    var csv = [];

    if (solarpv_mode) {
        keys = ["tariff_A", "tariff_B", "outgoing", "use", "import", "import_cost_tariff_A", "import_cost_tariff_B", "export", "export_cost", "solar_used", "solar_used_cost", "meter_kwh_hh", "meter_kwh_hh_cost"]
    } else {
        keys = ["tariff_A", "tariff_B", "import", "import_cost_tariff_A", "import_cost_tariff_B", "meter_kwh_hh", "meter_kwh_hh_cost"]
    }

    csv.push("time," + keys.join(","))

    for (var z in data["import"]) {
        var time = data["import"][z][0]

        var line = [];
        line.push(datetime_string(time))

        for (var i in keys) {
            let key = keys[i];

            var value = null; 
            
            if (data[key][z] != undefined) value = data[key][z][1];
            if (!isNaN(value) && value != null) value = value.toFixed(3)
            line.push(value)
        }

        csv.push(line.join(","));
    }

    download_data("tariff-data.csv", csv.join("\n"));
});

$('#datetimepicker1').on("changeDate", function(e) {
    var timewindowStart = parseTimepickerTime($("#request-start").val());
    if (!timewindowStart) {
        alert("Please enter a valid start date.");
        return false;
    }
    if (timewindowStart * 1000 >= view.end) {
        alert("Start date must be further back in time than end date.");
        return false;
    }

    view.start = timewindowStart * 1000;
    graph_load();
    graph_draw();
    $(".time-select").val("C");
});

$('#datetimepicker2').on("changeDate", function(e) {
    var timewindowEnd = parseTimepickerTime($("#request-end").val());
    if (!timewindowEnd) {
        alert("Please enter a valid end date.");
        return false;
    }
    if (view.start >= timewindowEnd * 1000) {
        alert("Start date must be further back in time than end date.");
        return false;
    }

    view.end = timewindowEnd * 1000;
    graph_load();
    graph_draw();
    $(".time-select").val("C");
});

// -------------------------------------------------------------------------------
// FUNCTIONS
// -------------------------------------------------------------------------------
// - graph_load
// - graph_draw
// - resize

function graph_load() {
    $(".power-graph-footer").show();

    var interval = 1800;
    var intervalms = interval * 1000;
    view.start = Math.ceil(view.start / intervalms) * intervalms;
    view.end = Math.ceil(view.end / intervalms) * intervalms;

    if (datetimepicker1) {
        datetimepicker1.setLocalDate(new Date(view.start));
        datetimepicker1.setEndDate(new Date(view.end));
    }
    if (datetimepicker2) {
        datetimepicker2.setLocalDate(new Date(view.end));
        datetimepicker2.setStartDate(new Date(view.start));
    }

    // Determine if required solar PV feeds are available
    if (feeds["use_kwh"] != undefined && feeds["solar_kwh"] != undefined) {
        solarpv_mode = true;
    }

    // Determine if required battery feeds are available
    if (feeds["battery_charge_kwh"] != undefined && feeds["battery_discharge_kwh"] != undefined) {
        battery_mode = true;
    }

    if (feeds["meter_kwh_hh"] != undefined) {
        smart_meter_data = true;
        $("#use_meter_kwh_hh_bound").show();
    }

    if (feeds["import_kwh"] != undefined) {
        cumulative_import_data = true;
    }

    var import_kwh = [];
    var use_kwh = [];
    var solar_kwh = [];
    var battery_charge_kwh = [];
    var battery_discharge_kwh = [];
    var meter_kwh_hh = [];

    if (cumulative_import_data) {
        import_kwh = feed.getdata(feeds["import_kwh"].id, view.start, view.end, interval);
    }

    if (solarpv_mode) {
        use_kwh = feed.getdata(feeds["use_kwh"].id, view.start, view.end, interval);
        solar_kwh = feed.getdata(feeds["solar_kwh"].id, view.start, view.end, interval);
    }

    if (battery_mode) {
        battery_charge_kwh = feed.getdata(feeds["battery_charge_kwh"].id, view.start, view.end, interval);
        battery_discharge_kwh = feed.getdata(feeds["battery_discharge_kwh"].id, view.start, view.end, interval);
    }

    if (smart_meter_data) meter_kwh_hh = feed.getdata(feeds["meter_kwh_hh"].id, view.start, view.end, interval);

    data = {};
    data["tariff_A"] = []
    data["tariff_B"] = []
    data["outgoing"] = []
    data["carbonintensity"] = []

    // Tariff A
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff_A.value][config.app.region.value] != undefined) {
        data["tariff_A"] = getdataremote(octopus_feed_list[config.app.tariff_A.value][config.app.region.value], view.start, view.end, interval);
    }

    // Tariff B
    if (config.app.region != undefined && octopus_feed_list[config.app.tariff_B.value][config.app.region.value] != undefined) {
        data["tariff_B"] = getdataremote(octopus_feed_list[config.app.tariff_B.value][config.app.region.value], view.start, view.end, interval);
    }

    // Outgoing
    if (config.app.region != undefined && solarpv_mode) {
        data["outgoing"] = getdataremote(regions_outgoing[config.app.region.value], view.start, view.end, interval);
        // Invert export tariff
        for (var z in data["outgoing"]) data["outgoing"][z][1] *= -1;
    }

    // Carbon Intensity
    if (show_carbonintensity) {
        data["carbonintensity"] = getdataremote(428391, view.start, view.end, interval);
    }

    data["use"] = [];
    data["import"] = [];
    data["import_cost_tariff_A"] = [];
    data["import_cost_tariff_B"] = [];
    data["export"] = [];
    data["export_cost"] = [];
    data["solar_used"] = []
    data["solar_used_cost"] = [];
    data["meter_kwh_hh"] = meter_kwh_hh;
    data["meter_kwh_hh_cost"] = [];

    // Used to generate averaged profile
    profile_kwh = [];
    profile_cost = [];

    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var profile_start = d.getTime();

    for (var hh = 0; hh < 48; hh++) {
        let profile_time = profile_start + hh * 1800 * 1000;
        profile_kwh[hh] = [profile_time, 0.0]
        profile_cost[hh] = [profile_time, 0.0]
    }

    var total_kwh_import_tariff_A = 0
    var total_kwh_import_tariff_B = 0
    var total_cost_import_tariff_A = 0
    var total_cost_import_tariff_B = 0

    var total_cost_export = 0
    var total_kwh_import = 0
    var total_kwh_export = 0
    var total_cost_solar_used = 0
    var total_kwh_solar_used = 0

    var total_co2 = 0;
    var sum_co2 = 0;
    var sum_co2_n = 0;

    var monthly_data = {};

    this_halfhour_index = -1;
    // Add last half hour
    var this_halfhour = Math.floor((new Date()).getTime() / 1800000) * 1800000
    for (var z = 1; z < import_kwh.length; z++) {
        if (import_kwh[z][0] == this_halfhour) {
            import_kwh[z + 1] = [this_halfhour + 1800000, feeds["import_kwh"].value]
            this_halfhour_index = z

            if (solarpv_mode) {
                use_kwh[z + 1] = [this_halfhour + 1800000, feeds["use_kwh"].value]
                solar_kwh[z + 1] = [this_halfhour + 1800000, feeds["solar_kwh"].value]
            }

            if (battery_mode) {
                battery_charge_kwh[z + 1] = [this_halfhour + 1800000, feeds["battery_charge_kwh"].value]
                battery_discharge_kwh[z + 1] = [this_halfhour + 1800000, feeds["battery_discharge_kwh"].value]
            }
            break;
        }
    }

    // Convert cumulative import data to half hourly kwh
    // Core import data conversion
    var import_kwh_hh = convert_cumulative_kwh_to_kwh_hh(import_kwh, true);

    // Solar PV mode data conversions
    var use_kwh_hh = convert_cumulative_kwh_to_kwh_hh(use_kwh, true);
    var solar_kwh_hh = convert_cumulative_kwh_to_kwh_hh(solar_kwh, true);
    var battery_charge_kwh_hh = convert_cumulative_kwh_to_kwh_hh(battery_charge_kwh, true);
    var battery_discharge_kwh_hh = convert_cumulative_kwh_to_kwh_hh(battery_discharge_kwh, true);

    var data_length = 0;
    if (cumulative_import_data) data_length = import_kwh_hh.length;
    else if (smart_meter_data) data_length = meter_kwh_hh.length;

    for (var z = 0; z < data_length; z++) {
        let time = 0;
        if (cumulative_import_data) time = import_kwh[z][0];
        else if (smart_meter_data) time = meter_kwh_hh[z][0];

        d.setTime(time)
        let hh = d.getHours() * 2 + d.getMinutes() / 30

        // get start of month timestamp to calculate monthly data
        let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    
        let kwh_import = 0;
        let kwh_export = 0;
        let kwh_use = 0;
        let kwh_solar = 0;
        let kwh_battery_charge = 0;
        let kwh_battery_discharge = 0;
        let balance = 0;

        // Use cumulative import data if available by default
        if (cumulative_import_data) {
            kwh_import = import_kwh_hh[z][1];

        // If we dont have cumulative import data, but we have smart meter data, use that instead
        } else if (smart_meter_data) {
            kwh_import = meter_kwh_hh[z][1];
        }

        // If solar or battery mode fetch kwh_use
        if (solarpv_mode || battery_mode) {
            kwh_use = use_kwh_hh[z][1];
            balance += kwh_use;
        }

        // If solar mode, fetch kwh_solar
        if (solarpv_mode) {
            kwh_solar = solar_kwh_hh[z][1];
            balance -= kwh_solar;
        }

        // if battery mode, fetch battery charge and discharge
        if (battery_mode) {
            kwh_battery_charge = battery_charge_kwh_hh[z][1];
            kwh_battery_discharge = battery_discharge_kwh_hh[z][1];
            balance += kwh_battery_charge;
            balance -= kwh_battery_discharge;
        }

        // If solar mode and no battery, calculate import from use and solar
        if (solarpv_mode || battery_mode) {
            if (balance >= 0) {
                kwh_import = balance;
                kwh_export = 0;
            } else {
                kwh_import = 0;
                kwh_export = balance * -1;
            }
        }

        // Alternatively use meter data in place of cumulative import data if user selected
        if (smart_meter_data && use_meter_kwh_hh) {
            kwh_import = meter_kwh_hh[z][1];
        }

        data["import"].push([time, kwh_import]);
        total_kwh_import += kwh_import;

        // Unit and import cost on tariff A
        let unitcost_tariff_A = null;
        let hh_cost_tariff_A = null; 
        if (data.tariff_A[z][1] != null) {
            unitcost_tariff_A = data.tariff_A[z][1] * 0.01;
            hh_cost_tariff_A = kwh_import * unitcost_tariff_A;

            total_kwh_import_tariff_A += kwh_import
            total_cost_import_tariff_A += hh_cost_tariff_A

            // Generate profile
            profile_kwh[hh][1] += kwh_import
            profile_cost[hh][1] += hh_cost_tariff_A 
        }

        // Unit and import cost on tariff B
        let unitcost_tariff_B = null;
        let hh_cost_tariff_B = null;
        if (data.tariff_B[z][1] != null) {
            unitcost_tariff_B = data.tariff_B[z][1] * 0.01;
            hh_cost_tariff_B = kwh_import * unitcost_tariff_B;

            total_kwh_import_tariff_B += kwh_import
            total_cost_import_tariff_B += hh_cost_tariff_B
        }

        data["import_cost_tariff_A"].push([time, hh_cost_tariff_A]);
        data["import_cost_tariff_B"].push([time, hh_cost_tariff_B]);

        // Calculate monthly data
        if (monthly_data[startOfMonth] == undefined) {
            monthly_data[startOfMonth] = {
                "import": 0,
                "import_tariff_A": 0,
                "import_tariff_B": 0,
                "cost_import_tariff_A": 0,
                "cost_import_tariff_B": 0
            }
        }

        monthly_data[startOfMonth]["import"] += kwh_import

        if (hh_cost_tariff_A != null) {
            monthly_data[startOfMonth]["import_tariff_A"] += kwh_import
            monthly_data[startOfMonth]["cost_import_tariff_A"] += hh_cost_tariff_A 
        }

        if (hh_cost_tariff_B != null) {
            monthly_data[startOfMonth]["import_tariff_B"] += kwh_import
            monthly_data[startOfMonth]["cost_import_tariff_B"] += hh_cost_tariff_B
        }

        // Carbon Intensity
        if (show_carbonintensity) {
            let co2intensity = data.carbonintensity[z][1];
            let co2_hh = kwh_import * (co2intensity * 0.001)
            total_co2 += co2_hh
            sum_co2 += co2intensity
            sum_co2_n++;
        }

        // We may explort in battery mode
        if (solarpv_mode || battery_mode) {
            data["use"].push([time, kwh_use]);
            data["export"].push([time, kwh_export * -1]);
            total_kwh_export += kwh_export
            let cost_export = data.outgoing[z][1] * 0.01 * -1;
            data["export_cost"].push([time, kwh_export * cost_export * -1]);
            total_cost_export += kwh_export * cost_export
        }

        // Solar used calculation
        if (solarpv_mode) {
            let kwh_solar_used = kwh_solar - kwh_export;
            data["solar_used"].push([time, kwh_solar_used]);
            total_kwh_solar_used += kwh_solar_used
            data["solar_used_cost"].push([time, kwh_solar_used * unitcost_tariff_A]);
            total_cost_solar_used += kwh_solar_used * unitcost_tariff_A
        }
    }
    
    if (smart_meter_data) {
        calibration_line_of_best_fit(import_kwh_hh, meter_kwh_hh);
    }

    var unit_cost_import_tariff_A = (total_cost_import_tariff_A / total_kwh_import_tariff_A);
    var unit_cost_import_tariff_B = (total_cost_import_tariff_B / total_kwh_import_tariff_B);

    var out = "";
    out += "<tr>";
    out += "<td><select id='tariff_A'>";
    for (var key in tariff_options) {
        out += "<option>" + tariff_options[key] + "</option>";
    }
    out += "</select></td>";
    out += "<td>" + total_kwh_import_tariff_A.toFixed(1) + " kWh</td>";
    out += "<td>£" + (total_cost_import_tariff_A * 1.05).toFixed(2) + "</td>";
    out += "<td>" + (unit_cost_import_tariff_A * 100 * 1.05).toFixed(1) + "p/kWh (inc VAT)</td>";
    out += "</tr>";

    out += "<tr>";
    out += "<td><select id='tariff_B'>";
    for (var key in tariff_options) {
        out += "<option>" + tariff_options[key] + "</option>";
    }
    out += "<td>" + total_kwh_import_tariff_B.toFixed(1) + " kWh</td>";
    out += "<td>£" + (total_cost_import_tariff_B * 1.05).toFixed(2) + "</td>";
    out += "<td>" + (unit_cost_import_tariff_B * 100 * 1.05).toFixed(1) + "p/kWh (inc VAT)</td>";
    out += "</tr>";

    if (show_carbonintensity) {
        var window_co2_intensity = 1000 * total_co2 / total_kwh_import;
        $("#carbonintensity_result").html("Total CO2: " + (total_co2).toFixed(1) + "kgCO2, Consumption intensity: " + window_co2_intensity.toFixed(0) + " gCO2/kWh")
    }

    if (solarpv_mode || battery_mode) {
        var unit_cost_export = (total_cost_export / total_kwh_export);
        out += "<tr>";
        out += "<td>Export</td>";
        out += "<td>" + total_kwh_export.toFixed(1) + " kWh</td>";
        out += "<td>£" + total_cost_export.toFixed(2) + "</td>";
        out += "<td>" + (unit_cost_export * 100 * 1.05).toFixed(1) + "p/kWh (inc VAT)</td>";
        out += "</tr>";
    }

    if (solarpv_mode) {
        var unit_cost_solar_used = (total_cost_solar_used / total_kwh_solar_used);
        out += "<tr>";
        out += "<td>Solar self consumption</td>";
        out += "<td>" + total_kwh_solar_used.toFixed(1) + " kWh</td>";
        out += "<td>£" + total_cost_solar_used.toFixed(2) + "</td>";
        out += "<td>" + (unit_cost_solar_used * 100 * 1.05).toFixed(1) + "p/kWh (inc VAT)</td>";
        out += "</tr>";

        var unit_cost_solar_combined = ((total_cost_solar_used + total_cost_export) / (total_kwh_solar_used + total_kwh_export));
        out += "<tr>";
        out += "<td>Solar + Export</td>";
        out += "<td>" + (total_kwh_solar_used + total_kwh_export).toFixed(1) + " kWh</td>";
        out += "<td>£" + (total_cost_solar_used + total_cost_export).toFixed(2) + "</td>";
        out += "<td>" + (unit_cost_solar_combined * 100 * 1.05).toFixed(1) + "p/kWh (inc VAT)</td>";
        out += "</tr>";
    }

    $("#show_profile").show();
    $("#octopus_totals").html(out);
    // Set tariff_A
    $("#tariff_A").val(config.app.tariff_A.value);
    $("#tariff_B").val(config.app.tariff_B.value);

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Populate monthly data if more than one month of data
    if (Object.keys(monthly_data).length > 1) {
        var monthly_out = "";

        var monthly_sum_kwh = 0;
        var monthly_sum_kwh_tariff_A = 0;
        var monthly_sum_kwh_tariff_B = 0;
        var monthly_sum_cost_import_tariff_A = 0;
        var monthly_sum_cost_import_tariff_B = 0;

        for (var month in monthly_data) {
            var d = new Date(parseInt(month));

            let vat = 1.05;

            let tariff_A_kwh = monthly_data[month]["import_tariff_A"];
            let tariff_B_kwh = monthly_data[month]["import_tariff_B"];
            let tariff_A_cost = monthly_data[month]["cost_import_tariff_A"]*vat;
            let tariff_B_cost = monthly_data[month]["cost_import_tariff_B"]*vat;
            let tariff_A_unit_cost = 100*(tariff_A_cost / tariff_A_kwh);
            let tariff_B_unit_cost = 100*(tariff_B_cost / tariff_B_kwh);

            monthly_out += "<tr>";
            monthly_out += "<td>" + d.getFullYear() + " " + months[d.getMonth()] + "</td>";
            monthly_out += "<td>" + monthly_data[month]["import"].toFixed(1) + " kWh</td>";

            monthly_out += "<td>£" + tariff_A_cost.toFixed(2) + "</td>";
            if (!isNaN(tariff_A_unit_cost)) {
                monthly_out += "<td>" + tariff_A_unit_cost.toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
            } else {
                monthly_out += "<td></td>";
            }
            
            monthly_out += "<td>£" + tariff_B_cost.toFixed(2) + "</td>";
            if (!isNaN(tariff_B_unit_cost)) {
                monthly_out += "<td>" + tariff_B_unit_cost.toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
            } else {
                monthly_out += "<td></td>";
            }

            // A, B = 
            if (tariff_A_unit_cost < tariff_B_unit_cost) {
                monthly_out += "<td style='color:blue'>A</td>";
            } else if (tariff_A_unit_cost > tariff_B_unit_cost) {
                monthly_out += "<td style='color:purple'>B</td>";
            } else {
                monthly_out += "<td>=</td>";
            }

            // link icon that zooms to month
            monthly_out += "<td><i class='icon-eye-open zoom-to-month' timestamp='"+month+"' style='cursor:pointer'></i></td>";
            monthly_out += "</tr>";

            monthly_sum_kwh += monthly_data[month]["import"];
            monthly_sum_kwh_tariff_A += tariff_A_kwh;
            monthly_sum_kwh_tariff_B += tariff_B_kwh;
            monthly_sum_cost_import_tariff_A += tariff_A_cost;
            monthly_sum_cost_import_tariff_B += tariff_B_cost;
        }

        var tariff_A_unit_cost = 100*(monthly_sum_cost_import_tariff_A / monthly_sum_kwh_tariff_A);
        var tariff_B_unit_cost = 100*(monthly_sum_cost_import_tariff_B / monthly_sum_kwh_tariff_B);

        // add totals line in bold
        monthly_out += "<tr style='font-weight:bold'>";
        monthly_out += "<td>Total</td>";
        monthly_out += "<td>" + monthly_sum_kwh.toFixed(1) + " kWh</td>";
        monthly_out += "<td>£" + monthly_sum_cost_import_tariff_A.toFixed(2) + "</td>";
        monthly_out += "<td>" + (tariff_A_unit_cost).toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
        monthly_out += "<td>£" + monthly_sum_cost_import_tariff_B.toFixed(2) + "</td>";
        monthly_out += "<td>" + (tariff_B_unit_cost).toFixed(1) + " <span style='font-size:12px'>p/kWh</span></td>";
        monthly_out += "<td></td>";
        monthly_out += "</tr>";

        $("#monthly-data-body").html(monthly_out);
        $("#monthly-data").show();
    }
}

function convert_cumulative_kwh_to_kwh_hh(cumulative_kwh_data, limit_positive=false) {
    var kwh_hh_data = [];
    
    for (var z = 1; z < cumulative_kwh_data.length; z++) {
        let time = cumulative_kwh_data[z - 1][0];
        let kwh_hh = 0;
        if (cumulative_kwh_data[z][1] != null && cumulative_kwh_data[z - 1][1] != null) {
            kwh_hh = cumulative_kwh_data[z][1] - cumulative_kwh_data[z - 1][1];
        }
        if (limit_positive && kwh_hh < 0.0) kwh_hh = 0.0;
        kwh_hh_data.push([time, kwh_hh]);
    }

    return kwh_hh_data;
}

function calibration_line_of_best_fit(import_kwh, meter_kwh_hh) 
{
    if (import_kwh.length != meter_kwh_hh.length) {
        console.log("Calibration line of best fit: Data length mismatch");
        return;
    }

    var sumX = 0
    var sumY = 0
    var sumXY = 0
    var sumX2 = 0
    var n = 0

    for (var z = 0; z < import_kwh.length; z++) {
        if (meter_kwh_hh[z] != undefined && import_kwh[z] != undefined) {
            if (meter_kwh_hh[z][1] != null) {
                // Calculate line of best fit variables
                // Suggested calibration
                var XY = 1.0 * import_kwh[z][1] * meter_kwh_hh[z][1];
                var X2 = 1.0 * import_kwh[z][1] * import_kwh[z][1];
                sumX += 1.0 * import_kwh[z][1];
                sumY += 1.0 * meter_kwh_hh[z][1];
                sumXY += XY;
                sumX2 += X2;
                n++;
            }
        }
    }

    if (n > 1) {
        var slope = ((n * sumXY - (sumX * sumY)) / (n * sumX2 - (sumX * sumX)));
        var intercept = (sumY - slope * sumX) / n;
        console.log("Suggested calibration:\nslope:" + slope.toFixed(6) + " intercept:" + intercept.toFixed(6));
        var prc_error = (1.0 - (sumY / sumX)) * 100;

        if (prc_error > 0) {
            console.log("Realtime feed is: " + prc_error.toFixed(2) + "% above meter data");
            $("#meter_kwh_hh_comparison").html("Realtime feed is: " + prc_error.toFixed(2) + "% above meter data");
        } else {
            console.log("Realtime feed is: " + Math.abs(prc_error).toFixed(2) + "% below meter data")
            $("#meter_kwh_hh_comparison").html("Realtime feed is: " + Math.abs(prc_error).toFixed(2) + "% below meter data");
        }
    }
}

function graph_draw() {
    profile_mode = false;
    $("#history-title").html("HISTORY");

    if (this_halfhour_index != -1) {

        let kwh_last_halfhour = data["import"][this_halfhour_index][1];

        if (kwh_last_halfhour != null) {
            $("#kwh_halfhour").html(kwh_last_halfhour.toFixed(2) + "<span class='units'>kWh</span>");
        } else {
            $("#kwh_halfhour").html("N/A");
        }

        let cost_last_halfhour = data["import_cost_tariff_A"][this_halfhour_index][1] * 100;
        $("#cost_halfhour").html("(" + cost_last_halfhour.toFixed(2) + "<span class='units'>p</span>)");

        let unit_price = data["tariff_A"][this_halfhour_index][1] * 1.05;
        $("#unit_price").html(unit_price.toFixed(2) + "<span class='units'>p</span>");

        $(".last_halfhour_stats").show();
    } else {
        $(".last_halfhour_stats").hide();
    }

    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    graph_series = [];

    if (solarpv_mode) graph_series.push({
        label: "Used Solar",
        data: data["solar_used"],
        yaxis: 1,
        color: "#bec745",
        stack: true,
        bars: bars
    });
    graph_series.push({
        label: "Import",
        data: data["import"],
        yaxis: 1,
        color: "#44b3e2",
        stack: true,
        bars: bars
    });
    if (solarpv_mode) graph_series.push({
        label: "Export",
        data: data["export"],
        yaxis: 1,
        color: "#dccc1f",
        stack: false,
        bars: bars
    });
    if (smart_meter_data && !solarpv_mode) graph_series.push({
        label: "Import Actual",
        data: data["meter_kwh_hh"],
        yaxis: 1,
        color: "#1d8dbc",
        stack: false,
        bars: bars
    });

    // price signals
    graph_series.push({
        label: config.app.tariff_A.value,
        data: data["tariff_A"],
        yaxis: 2,
        color: "#fb1a80",
        lines: {
            show: true,
            steps: true,
            align: "left",
            lineWidth: 1
        }
    });
    if (solarpv_mode) graph_series.push({
        label: "Outgoing",
        data: data["outgoing"],
        yaxis: 2,
        color: "#941afb",
        lines: {
            show: true,
            steps: true,
            align: "center",
            lineWidth: 1
        }
    });
    if (show_carbonintensity) graph_series.push({
        label: "Carbon Intensity",
        data: data["carbonintensity"],
        yaxis: 2,
        color: "#888",
        lines: {
            show: true,
            steps: true,
            align: "left",
            lineWidth: 1
        }
    });

    graph_series.push({
        label: config.app.tariff_B.value,
        data: data["tariff_B"],
        yaxis: 2,
        color: "#7c1a80",
        lines: {
            show: true,
            steps: true,
            align: "left",
            lineWidth: 1
        }
    });

    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            min: view.start,
            max: view.end,
            font: {
                size: flot_font_size,
                color: "#666"
            },
            reserveSpace: false
        },
        yaxes: [{
                position: 'left',
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            },
            {
                position: 'left',
                alignTicksWithAxis: 1,
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: {
                top: 30
            }
        },
        selection: {
            mode: "x"
        },
        legend: {
            position: "NW",
            noColumns: 5
        }
    }
    $.plot($('#placeholder'), graph_series, options);
}

function profile_draw() {
    profile_mode = true;
    $("#history-title").html("PROFILE");

    var profile_unitprice = [];

    for (var z = 0; z < 48; z++) {
        let time = profile_kwh[z][0]
        let value = 100 * profile_cost[z][1] / profile_kwh[z][1]
        profile_unitprice[z * 2] = [time, value];
        profile_unitprice[z * 2 + 1] = [time + 1800000, value];
    }

    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    graph_series = [];

    graph_series.push({
        label: "Import",
        data: profile_kwh,
        yaxis: 1,
        color: "#44b3e2",
        stack: true,
        bars: bars
    });

    graph_series.push({
        label: config.app.tariff_A.value,
        data: profile_unitprice,
        yaxis: 2,
        color: "#fb1a80",
        lines: {
            show: true,
            align: "left",
            lineWidth: 1
        }
    });

    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            // min: start, max: end, 
            font: {
                size: flot_font_size,
                color: "#666"
            },
            reserveSpace: false
        },
        yaxes: [{
                position: 'left',
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            },
            {
                position: 'left',
                alignTicksWithAxis: 1,
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: {
                top: 30
            }
        },
        selection: {
            mode: "x"
        },
        legend: {
            position: "NW",
            noColumns: 5
        }
    }
    $.plot($('#placeholder'), graph_series, options);
}

// -------------------------------------------------------------------------------
// RESIZE
// -------------------------------------------------------------------------------
function resize() {
    var top_offset = 0;
    var placeholder_bound = $('#placeholder_bound');
    var placeholder = $('#placeholder');

    var window_height = $(window).height();
    var topblock = $("#octopus-realtime").height();

    var width = placeholder_bound.width();
    var height = window_height - topblock - 250;
    if (height < 250) height = 250;

    placeholder.width(width);
    placeholder_bound.height(height);
    placeholder.height(height - top_offset);

    if (width <= 500) {
        $(".electric-title").css("font-size", "14px");
        $(".power-value").css("font-size", "36px");
        $(".halfhour-value").css("font-size", "26px");
    } else if (width <= 724) {
        $(".electric-title").css("font-size", "16px");
        $(".power-value").css("font-size", "50px");
        $(".halfhour-value").css("font-size", "40px");
    } else {
        $(".electric-title").css("font-size", "20px");
        $(".power-value").css("font-size", "50px");
        $(".halfhour-value").css("font-size", "40px");
    }
}

$(function() {
    $(document).on('window.resized hidden.sidebar.collapse shown.sidebar.collapse', function() {
        var window_width = $(this).width();

        flot_font_size = 12;
        if (window_width < 450) flot_font_size = 10;

        resize();

        graph_draw();
    })
})

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log(level, message) {
    if (level == "ERROR") alert(level + ": " + message);
    console.log(level + ": " + message);
}

function datetime_string(time) {
    var t = new Date(time);
    var year = t.getFullYear();
    var month = t.getMonth() + 1;
    if (month < 10) month = "0" + month;
    var day = t.getDate();
    if (day < 10) day = "0" + day;
    var hours = t.getHours();
    if (hours < 10) hours = "0" + hours;
    var minutes = t.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    var seconds = t.getSeconds();
    if (seconds < 10) seconds = "0" + seconds;

    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

function download_data(filename, data) {
    var blob = new Blob([data], {
        type: 'text/csv'
    });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

function parseTimepickerTime(timestr) {
    var tmp = timestr.split(" ");
    if (tmp.length != 2) return false;

    var date = tmp[0].split("/");
    if (date.length != 3) return false;

    var time = tmp[1].split(":");
    if (time.length != 3) return false;

    return new Date(date[2], date[1] - 1, date[0], time[0], time[1], time[2], 0).getTime() / 1000;
}

// ----------------------------------------------------------------------
// Remote data request
// ----------------------------------------------------------------------
function getdataremote(id, start, end, interval) {
    var data = [];
    $.ajax({
        url: path + "app/dataremote",
        data: "id=" + id + "&start=" + start + "&end=" + end + "&interval=" + interval + "&skipmissing=0&limitinterval=0",
        dataType: 'json',
        async: false,
        success: function(result) {
            if (!result || result === null || result === "" || result.constructor != Array) {
                console.log("ERROR", "getdataremote invalid response: " + result);
                result = [];
            }
            data = result;
        }
    });
    return data;
}

// zoom to month by timestamp
$("#monthly-data").on("click", ".zoom-to-month", function() {
    var timestamp = $(this).attr("timestamp");
    view.start = parseInt(timestamp);
    console.log(view.start);

    // calculate end of month
    var d = new Date(parseInt(timestamp));
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 0);
    view.end = d.getTime();
    

    graph_load();
    graph_draw();

    // set period to custom
    $(".time-select").val("C");

    return false;
});

$("#octopus_totals").on("change", "select", function() {
    config.app.tariff_A.value = $("#tariff_A").val();
    config.app.tariff_B.value = $("#tariff_B").val();

    config.db.tariff_A = config.app.tariff_A.value;
    config.db.tariff_B = config.app.tariff_B.value;

    config.set();

    graph_load();
    graph_draw();
});