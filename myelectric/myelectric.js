/*jslint maxerr: 1000 */
var app_myelectric = {

    powerfeed: false,
    dailyfeed: false,
    dailytype: false,

    daily_data: [],
    daily: [],
    currentday: 0,

    raw_kwh_data: [],

    fastupdateinst: false,
    slowupdateinst: false,

    viewmode: "energy",
    unitcost: 0.17,
    currency: "$",

    escale: 1,

    startofweek: [0, 0],
    startofmonth: [0, 0],
    startofyear: [0, 0],
    startofday: 0,
    startalltime: 0,

    last_daytime: 0,                 // used for reload kwhd daily graph
    last_startofweektime: 0,        // used for reloading statistics
    last_startofmonthtime: 0,
    last_startofyeartime: 0,

    lastupdate: 0,
    autoupdate: true,
    reload: true,
    feeds: {},

    kwhdtmp: [],
    kwhperday : "",
    perday : "",
    // Include required javascript libraries
    // in other modules libs are core libs
    include: [
        "Modules/app/lib/graph_bars.js",
        "Modules/app/lib/graph_lines.js",
        "Modules/app/lib/timeseries.js",
        "Modules/app/vis.helper.js"
    ],

    init: function () {
        'use strict';
        var timewindow = (3600000 * 3.0),
            z,
            feeds,
            name,
            m = app_myelectric;
        view.end = +new Date();
        view.start = view.end - timewindow;

        // -------------------------------------------------------------------------
        // Load settings
        // -------------------------------------------------------------------------

        // If settings exist for myelectric then we load them in here:
        if (app.config.myelectric !== undefined) {
            m.powerfeed = Number(app.config.myelectric.powerfeed);
            m.dailyfeed = Number(app.config.myelectric.dailyfeed);
            m.dailytype = Number(app.config.myelectric.dailytype);
            m.currency = '&' + app.config.myelectric.currency + ';';
            m.unitcost = Number(app.config.myelectric.unitcost);
        } else {
            app.config.myelectric = {};
        // if no settings then try auto scanning for feeds with suitable names:
            feeds = m.getfeedsbyid();
            for (z in feeds) {
                name = feeds[z].name.toLowerCase();
                if (name.indexOf("house_power") !== -1) {
                    m.powerfeed = z;
                }
                if (name.indexOf("house_wh") !== -1) {
                    m.dailyfeed = z;
                    m.dailytype = 0;
                }
            }
        }

        if (m.dailytype > 1) {
            m.dailytype = 0;
            m.dailyfeed = 0;
        }
        // m.dailytype stored in table is a string never === to 0 not 1
        // console.log ('m.dailytype : ' + m.dailytype);
        m.escale = (m.dailytype === 0) ? 0.001 : 1.0;
        m.currency = (m.currency === undefined) ? "" : m.currency;
        m.unitcost = (m.currency === undefined) ? 0 : m.unitcost;
        // -------------------------------------------------------------------------
        // Decleration of myelectric events
        // -------------------------------------------------------------------------
        //console.log(m.perday + "    -    " + m.kwhperday);
        $(window).resize(function () {
            m.resize();
        });

        // When the config icon is pressed, populate dropdown feed selector menu's.
        // and set values if already selected

        $("#ml_openconfig").click(function () {

            // Load feed list, populate feed selectors and select the selected feed
            feeds = app_myelectric.getfeedsbyid();
            var out = "", selected = "",
            m = app_myelectric;
            // there is need to flag as selected the selected feed
            for (z in feeds) {
                selected = (feeds[z].id === m.powerfeed) ? "selected" : "";
                out += "<option " + selected + " value=" + feeds[z].id + ">" + feeds[z].name + "</option>";
            }
            $("#ml_powerfeed").html(out);
            $("#ml_powerfeed").val(m.powerfeed);

            $("#ml_dailyfeed").html(out);
            $("#ml_dailyfeed").val(m.dailyfeed);

            $("#ml_dailytype").val(m.dailytype);

            $("#ml_currency").val(m.currency);
            $("#ml_unitcost").val(m.unitcost);
            // Switch to the config interface
            $("#ml_config").show();
            $("#ml_body").hide();

            // Stop updaters
            if (m.fastupdateinst) { clearInterval(m.fastupdateinst); }
            if (m.slowupdateinst) { clearInterval(m.slowupdateinst); }
        });

        // Save configuration, values are simply placed in the config.
        // then updates are resumed

        $("#ml_configsave").click(function () {
            var m = app_myelectric;
            m.unitcost = $("#ml_unitcost").val();
            m.currency = $("#ml_currency").val();
            m.powerfeed = $("#ml_powerfeed").val();
            m.dailyfeed = $("#ml_dailyfeed").val();
            m.dailytype = $("#ml_dailytype").val();

            // Save config to db
            var config = app.config;
            config =  (config !== false) ? config : {};
            config.myelectric = {
                "powerfeed": m.powerfeed,
                "dailyfeed": m.dailyfeed,
                "dailytype": m.dailytype,
                "unitcost": m.unitcost,
                "currency": m.currency
            };

            //if (m.dailytype === 0) { m.escale = 0.001; }
            //if (m.dailytype === 1) { m.escale = 1.0; }
            m.escale = (m.dailytype == 0) ? 0.001 : 1.0;
            m.last_daytime = 0;
            m.last_startofweektime = 0;
            m.last_startofmonthtime = 0;
            m.last_startofyeartime = 0;
            app.setconfig(config);
            m.reload = true;
            m.reloadkwhd = true;

            // Switch to main view
            $("#ml_config").hide();
            $("#ml_body").show();

            m.fastupdateinst = setInterval(m.fastupdate, 5000);
            m.slowupdateinst = setInterval(m.slowupdate, 60000);
            m.fastupdate();
            m.slowupdate();
        });

        $("#ml_zoomout").click(function () {view.zoomout(); m.reload = true; m.autoupdate = false; m.fastupdate(); });
        $("#ml_zoomin").click(function () {view.zoomin(); m.reload = true; m.autoupdate = false; m.fastupdate(); });
        $('#ml_right').click(function () {view.panright(); m.reload = true; m.autoupdate = false; m.fastupdate(); });
        $('#ml_left').click(function () {view.panleft(); m.reload = true; m.autoupdate = false; m.fastupdate(); });

        $('.myelectric-time').click(function () {
            var m = app_myelectric;
            view.timewindow($(this).attr("time") / 24.0);
            m.reload = true;
            m.autoupdate = true;
            m.fastupdate();
        });

        $(".myelectric-view-cost").click(function () {
            var m = app_myelectric;
            m.viewmode = "cost";
            m.fastupdate();
            m.slowupdate();
        });

        $(".myelectric-view-kwh").click(function () {
            var m = app_myelectric;
            m.viewmode = "energy";
            m.fastupdate();
            m.slowupdate();
        });
    },

    show: function () {
        'use strict';
        var m = app_myelectric;
        $("body").css('background-color', '#222');
        $(window).ready(function () {
            $("#footer").css('background-color', '#181818');
            $("#footer").css('color', '#999');
        });

        if (m.powerfeed > 0 && m.dailyfeed > 0) {

            // start of all time
            var meta = {};
            $.ajax({
                url: path + "feed/getmeta.json",
                data: "id=" + m.dailyfeed + apikeystr,
                dataType: 'json',
                async: false,
                success: function (data_in) { meta = data_in; }
            });
            //console.log('meta' + meta)
            m.startalltime = meta.start_time;

            m.reloadkwhd = true;

            // resize and start updaters
            m.resize();


            m.fastupdateinst = setInterval(m.fastupdate, 5000);
            m.fastupdate();
            m.slowupdateinst = setInterval(m.slowupdate, 60000);
            m.slowupdate();
        }
    },

    resize: function () {
        'use strict';
        var windowheight = $(window).height(),
            bound = {},
            width = $("#ml_placeholder_bound_kwhd").width(),
            height = $("#ml_placeholder_bound_kwhd").height(),
            width_pwr = $("#ml_placeholder_bound_power").width();
        $("#ml_placeholder_kwhd").attr('width', width);
        graph_bars.width = width;

        $("#ml_placeholder_kwhd").attr('height', height);
        graph_bars.height = height;

        $("#ml_placeholder_power").attr('width', width);
        graph_lines.width = width;

        var height_pwr = $("#ml_placeholder_bound_power").height();
        $("#ml_placeholder_power").attr('height', height_pwr);
        graph_lines.height = height_pwr;


        if (width <= 500) {
            $(".electric-title").css("font-size", "16px");
            $(".power-value").css("font-size", "38px");
            $(".power-value").css("padding-top", "12px");
            $(".power-value").css("padding-bottom", "8px");
            $(".midtext").css("font-size", "14px");
            $(".units").hide();
            $(".visnav").css("padding-left", "5px");
            $(".visnav").css("padding-right", "5px");
        } else if (width <= 724) {
            $(".electric-title").css("font-size", "18px");
            $(".power-value").css("font-size", "52px");
            $(".power-value").css("padding-top", "22px");
            $(".power-value").css("padding-bottom", "12px");
            $(".midtext").css("font-size", "18px");
            $(".units").show();
            $(".visnav").css("padding-left", "8px");
            $(".visnav").css("padding-right", "8px");
        } else {
            $(".electric-title").css("font-size", "22px");
            $(".power-value").css("font-size", "85px");
            $(".power-value").css("padding-top", "40px");
            $(".power-value").css("padding-bottom", "20px");
            $(".midtext").css("font-size", "20px");
            $(".units").show();
            $(".visnav").css("padding-left", "8px");
            $(".visnav").css("padding-right", "8px");
        }

        app_myelectric.reloadkwhd = true;
        if (app_myelectric.powerfeed && app_myelectric.dailyfeed) {
            app_myelectric.fastupdate();
            app_myelectric.slowupdate();
        }
    },

    hide: function () {
        'use strict';
        var m = app_myelectric;
        clearInterval(m.fastupdateinst);
        clearInterval(m.slowupdateinst);
    },

    fastupdate: function () {
        'use strict';
        var scale,
            feeds,
            timerange,
            options = {},
            series = {},
            now,
            timenow,
            npoints = 1500,
            timewindow,
            interval,
            // used m to short name and avoid confusion with e from event
            m = app_myelectric;

        if (m.viewmode === "energy") {
            scale = 1;
            $("#ml_usetoday_units_a").html("");
            $("#ml_usetoday_units_b").html("kWh");
            $(".u1a").html("");
            $(".u1b").html("kWh");
            $(".u2a").html("");
            $(".u2b").html($("#kwhperday").html());
        } else {
            scale = m.unitcost;
            $("#ml_usetoday_units_a").html(m.currency);
            $("#ml_usetoday_units_b").html("");
            $(".u1a").html(m.currency);
            $(".u1b").html("");
            $(".u2a").html(m.currency);
            // '/day is not acceptable, it should be translatablr'
            $(".u2b").html($("#perday").html());
        }

        now = new Date();
        var timenow = now.getTime();
        //now = new Date();
        //timenow = now.getTime(),

        // --------------------------------------------------------------------------------------------------------
        // REALTIME POWER GRAPH
        // --------------------------------------------------------------------------------------------------------
        // Check if the updater ran in the last 60s if it did not the app was sleeping
        // and so the data needs a full reload.

        if ((timenow - m.lastupdate) > 60000) {m.reload = true; }
        m.lastupdate = timenow;

        // reload power data
        if (m.reload) {
            m.reload = false;

            timewindow = view.end - view.start;
            view.end = timenow;
            view.start = view.end - timewindow;

            interval = Math.round(((view.end - view.start) / npoints) / 1000);
            interval = (interval < 1) ? 1 : interval;
            //if (interval < 1) interval = 1;

            view.start = 1000 * Math.floor((view.start / 1000) / interval) * interval;
            view.end = 1000 * Math.ceil((view.end / 1000) / interval) * interval;

            timeseries.load(m.powerfeed, view.start, view.end, interval);
        }

        // --------------------------------------------------------------------
        // 1) Get last value of feeds
        // this will lock the system when undreds of feeds are available
        // so just ask for values of required feedids
        // --------------------------------------------------------------------


        //feeds = m.getfeedsbyid();
        var id = m.powerfeed;
        var f1 = m.gettimevalue(id);
        var sampletime = f1.time;
        var pwr = f1.value * 1.0;

        // set the power now value
        //console.log ('m.currency : ' + m.currency)
        if (m.viewmode === "energy") {
            $("#ml_powernow").html(pwr.toFixed(0) + "W");
        } else {
            $("#ml_powernow").html(m.currency + (pwr * 1.0 * m.unitcost * 0.001).toFixed(2) + $("#perhour").html());
        }

        // try to load values to reduce volumes (time is missing)
        // Advance view
        if (m.autoupdate) {

            // move the view along
            timerange = view.end - view.start;
            view.end = timenow;
            view.start = view.end - timerange;

            timeseries.append(
                m.powerfeed,
                sampletime,
                pwr
            );

            // delete data that is now beyond the start of our view
            timeseries.trim_start(m.powerfeed, view.start * 0.001);
        }

        // draw power graph
        options = {
            axes: {
                color: "rgba(6,153,250,1.0)",
                font: "12px arial"
            },

            xaxis: {
                minor_tick: 60000 * 10,
                major_tick: 60000 * 60
            },

            yaxis: {
                title: $("#ytitle").html(),
                units:  $("#units").html(),
                minor_tick: 250,
                major_tick: 1000
            }
        };

        var timewindowhours = Math.round((view.end - view.start) / 3600000);
        options.xaxis.major_tick = 30 * 24 * 3600 * 1000;
        if (timewindowhours <= 24 * 7) {options.xaxis.major_tick = 24 * 3600 * 1000; }
        if (timewindowhours <= 24) {options.xaxis.major_tick = 2 * 3600 * 1000; }
        if (timewindowhours <= 12) {options.xaxis.major_tick = 1 * 3600 * 1000; }
        options.xaxis.minor_tick = options.xaxis.major_tick / 4;


        series = {
            "solar": {
                color: "rgba(255,255,255,1.0)",
                data: []
            },
            "use": {
                color: "rgba(6,153,250,0.5)",
                data: datastore[m.powerfeed].data
            }
        };

        graph_lines.draw("ml_placeholder_power", series, options);

        // --------------------------------------------------------------------------------------------------------
        // THIS WEEK, MONTH, YEAR TOTALS
        // --------------------------------------------------------------------------------------------------------
        var id = m.dailyfeed;
        var f1 = m.gettimevalue(id);
        var sampletime = f1.time;
        var pwr1 = f1.value * 1.0;
        // All time total
        var alltime_kwh = pwr1 * m.escale;
        m.currentday = pwr1
        // --------------------------------------------------------------------------------------------------------
        // WEEK: Get the time of the start of the week, if we have rolled over to a new week, load the watt hour
        // value in the watt accumulator feed recorded for the start of this week.
        var dayofweek = now.getDay();
        dayofweek = (dayofweek > 0) ? dayofweek -1 : 6;
        // convert last start of week time to unix seconds time
        var time = (new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayofweek).getTime()) / 1000;
        if (time !== m.last_startofweektime) {
            //db stored time is in seconds, not ms
            m.last_startofweektime = time;
            m.startofweek = m.getvalue(id, time);
        }
        // will probably never execute this?
        if (m.startofweek === false) {m.startofweek = [m.startalltime, 0]; }

        // Week total
        var week_kwh = alltime_kwh - (m.startofweek[1] * m.escale);
        $("#ml_week_kwh").html((scale * week_kwh).toFixed(1));
        //var days = ((feeds[m.dailyfeed].time - (m.startofweek[0]*0.001))/86400);
        var days = (sampletime - m.last_startofweektime) / 86400;
        $("#ml_week_kwhd").html((scale * week_kwh / days).toFixed(1));
        //console.log('days : ' + days +'  week_kWh: ' + week_kwh +'  scale: ' + scale +'  time_present ' + sampletime +'  start: ' + m.startofweek[1]);
        // --------------------------------------------------------------------------------------------------------
        // MONTH: repeat same process as above
        time = (new Date(now.getFullYear(), now.getMonth(), 1).getTime()) / 1000;
        //console.log('start of month time : ' + time)
        if (time !== m.last_startofmonthtime) {
            m.last_startofmonthtime = time;
            m.startofmonth = m.getvalue(id, time);
        }
        if (m.startofmonth === false) {m.startofmonth = [m.startalltime, 0]; }

        // Monthly total
        var month_kwh = alltime_kwh - (m.startofmonth[1] * m.escale);
        $("#ml_month_kwh").html(Math.round(scale * month_kwh));
        days = (sampletime - m.last_startofmonthtime) / 86400;
        $("#ml_month_kwhd").html((scale * month_kwh / days).toFixed(1));
        //console.log('days : ' + days +'  month_kwh: ' + month_kwh +'  scale: ' + scale +'  time_present ' + sampletime +'  start: ' + m.startofweek[1]);
        // --------------------------------------------------------------------------------------------------------
        // YEAR: repeat same process as above
        time = (new Date(now.getFullYear(), 0, 1).getTime()) / 1000;
        if (time !== m.last_startofyeartime) {
            m.last_startofyeartime = time;
            m.startofyear = m.getvalue(id, time);
        }
        if (m.startofyear === false) {m.startofyear = [m.startalltime * 1000, 0]; }

        // Year total
        var year_kwh = alltime_kwh - (m.startofyear[1] * m.escale);
        $("#ml_year_kwh").html(Math.round(scale * year_kwh));
        var days = ((sampletime - m.last_startofyeartime) / 86400);
        $("#ml_year_kwhd").html((scale * year_kwh / days).toFixed(1));
        //console.log('days : ' + days +'  year_kwh: ' + year_kwh +'  scale: ' + scale +'  time_present ' + sampletime +'  start: ' + m.startofweek[1]);
        // --------------------------------------------------------------------------------------------------------
        // ALL TIME
        $("#ml_alltime_kwh").html(Math.round(scale * alltime_kwh));
        days = ((sampletime - m.startalltime) / 86400);
        $("#ml_alltime_kwhd").html((scale * alltime_kwh / days).toFixed(1));
        //console.log('days : ' + days +'  alltime_kwh: ' + alltime_kwh +'  scale: ' + scale +'  time_present ' + sampletime +'  start: ' + m.startofweek[1]);
        // --------------------------------------------------------------------------------------------------------
    },

    slowupdate: function () {
        // When we make a request for daily data it returns the data up to the start of this day.
        // This works appart from a request made just after the start of day and before the buffered
        // data is written to disk. This produces an error as the day rolls over.

        // Most of the time the request will return data where the last datapoint is the start of the
        // current day. If the start of the current day is less than 60s (the buffer time)  from the
        // current day then the last datapoint will be the previous day start.

        // The easy solution is to request the data every 60s and then always append the last kwh value
        // from feeds to the end as a new day, with the interval one day ahead of the last day in the kwh feed.

        // This presents a minor error for 60s after midnight but should not be noticable in most cases
        // and will correct itself after the 60s is over.

        'use strict';
        // daily feed rshown with local UTC offset, not user UTC offset
        var interval = 86400,
            now = new Date(),
            timezone = (now.getTimezoneOffset() / -60) * 3600,
            timenow = Math.floor(now.getTime() / 1000),
            end = (Math.floor((timenow + timezone) / interval) * interval) - timezone,
            start = end - interval * Math.round(graph_bars.width / 30),
            valid = [],
            // used m to short name and avoid confusion with e from event
            m = app_myelectric;
;

        var data = m.getdata({
                "id": m.dailyfeed,
                "start": start * 1000,
                "end": end * 1000,
                "interval": interval,
                "skipmissing": 0,
                "limitinterval": 0
            }),

        // remove nan values from the end.
            z,
            time,
            diff,
            usetoday_kwh,
            scale,
            next,
            i18ndays;

            //console.log('data-----------------> ');
            //console.log(data);
        for (z in data) {
            if (data[z][1] !== null) {
                //console.log(z);
                valid.push(data[z]);
            }
        }
        next = (valid.length > 0) ? valid[valid.length - 1][0] + (interval * 1000) : 0;
        /*
        if (m.feeds[m.dailyfeed] !== undefined) {
            valid.push([next, m.feeds[m.dailyfeed].value * 1.0]);
        }
        */
        if (m.currentday !== undefined) {
            valid.push([next, m.currentday * 1.0]);
        }

        // Calculate the daily totals by subtracting each day from the day before
        m.daily = [];
        scale = (scale === undefined) ? 1 : scale;
        for (z = 1; z < valid.length; z++) {
            time = valid[z - 1][0];
            diff = (valid[z][1] - valid[z - 1][1]) * m.escale;
            m.daily.push([time, diff * scale]);
        }

        usetoday_kwh = 0;
        if (m.daily.length > 0) {
            usetoday_kwh = m.daily[m.daily.length - 1][1];
        }
        if (m.viewmode === "energy") {
            $("#ml_usetoday").html(usetoday_kwh.toFixed(1));
        } else {
            $("#ml_usetoday").html((usetoday_kwh * m.unitcost).toFixed(2));
        }
        i18ndays = $("#i18ndays").html().split(",");
        // give the x axis ledgend in user language
        graph_bars.draw('ml_placeholder_kwhd', [m.daily], i18ndays);
    },

    gettimevalue: function (feedid) {
        // this functioçn returns last time and value for a specfic feed id
        'use strict';
        var feeds = {};
        $.ajax({
            url: path + "feed/timevalue.json?id=" + feedid + apikeystr,
            dataType: 'json',
            async: false,
            success: function (data_in) { feeds = data_in; }
        });
        return feeds;
    },


    getfeedsbyid: function () {
        // this functioçn cannot be limited to the required feeds
        'use strict';
        var feeds = {},
            byid = {},
            z;
        $.ajax({
            url: path + "feed/list.json" + apikeystr,
            dataType: 'json',
            async: false,
            success: function (data_in) { feeds = data_in; }
        });

        for (z in feeds) {byid[feeds[z].id] = feeds[z]; }
        return byid;
    },

    getvalue: function (feedid, time) {
        'use strict';
        var result = app_myelectric.getdata({
            "id": feedid,
            "start": time,
            "end": time + 1000,
            "interval": 1
        });
        if (result.length === 2) {return result[0]; }
        return false;
    },

    getdata: function (args) {
        'use strict';
        var reqstr = "",
            z,
            data = [];
        for (z in args) {reqstr += "&" + z + "=" + args[z]; }
        reqstr += apikeystr;
        //console.log(reqstr);

        $.ajax({
            url: path + "feed/data.json",
            data: reqstr,
            dataType: 'json',
            async: false,
            success: function (data_in) { data = data_in; }
        });
        return data;
    }
};
