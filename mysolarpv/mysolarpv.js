/*jslint maxerr: 1000 */

var app_mysolarpv = {
    datastore : {},

    solarpower: false,
    housepower: false,

    live: false,
    show_balance_line: 0,

    house_data: [],
    solar_data: [],
    wind_data: [],

    reload: true,
    autoupdate: true,

    lastupdate: 0,

    // Include required javascript libraries
    include: [
        "Lib/flot/jquery.flot.min.js",
        "Lib/flot/jquery.flot.time.min.js",
        "Lib/flot/jquery.flot.selection.min.js",
        "Modules/app/vis.helper.js",
        "Lib/flot/date.format.js"
    ],

    // App start function
    init: function () {
        var feeds, z, houseok, solarok, name, timeWindow, placeholder, solarfeedids, housefeedids;
        if (app.config["mysolarpv"] !== undefined) {
            this.solarpower = app.config["mysolarpv"].solarpower;
            this.housepower = app.config["mysolarpv"].housepower;

            if (typeof (this.solarpower) === "string") { this.solarpower = this.solarpower.split(","); }
            if (typeof (this.housepower) === "string") { this.housepower = this.housepower.split(","); }
        } else {
            // Auto scan by feed names
            feeds = app_mysolarpv.getfeedsbyid();
            for (z in feeds) {
                name = feeds[z].name.toLowerCase();

                if (name.indexOf("house_power") !== -1) {
                    app_mysolarpv.housepower = [z];
                    houseok = true;
                }

                if (name.indexOf("solar_power") !== -1) {
                    app_mysolarpv.solarpower = [z];
                    solarok = true;
                }
            }
        }

        timeWindow = (3600000 * 6.0);
        view.end = +new Date;
        view.start = view.end - timeWindow;

        placeholder = $('#mysolarpv_placeholder');

        $("#mysolarpv_zoomout").click(function () {view.zoomout(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw(); });
        $("#mysolarpv_zoomin").click(function () {view.zoomin(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw(); });
        $('#mysolarpv_right').click(function () {view.panright(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw(); });
        $('#mysolarpv_left').click(function () {view.panleft(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw(); });
        $('.time').click(function () {
            view.timewindow($(this).attr("time") / 24.0);
            app_mysolarpv.reload = true;
            app_mysolarpv.autoupdate = true;
            app_mysolarpv.draw();
        });

        $("#balanceline").click(function () {
            if ($("#balanceshown").css('display') !== 'none') {
                this.show_balance_line = 1;
                $("#balanceshown").hide();
                $("#balancehidden").show();
            } else {
                this.show_balance_line = 0;
                $("#balanceshown").show();
                $("#balancehidden").hide();
            }
            app_mysolarpv.draw();
        });

        placeholder.bind("plotselected", function (event, ranges) {
            view.start = ranges.xaxis.from;
            view.end = ranges.xaxis.to;

            app_mysolarpv.autoupdate = false;
            app_mysolarpv.reload = true;

            var now = +new Date();
            if (Math.abs(view.end - now) < 30000) {
                app_mysolarpv.autoupdate = true;
            }

            app_mysolarpv.draw();
        });

        $("#mysolarpv-openconfig").click(function () {
            $("#mysolarpv-solarpower").val(app_mysolarpv.solarpower);
            $("#mysolarpv-housepower").val(app_mysolarpv.housepower);
            $("#mysolarpv-config").show();
        });

        $("#mysolarpv-configsave").click(function () {
            $("#mysolarpv-config").hide();
            solarfeedids = $("#mysolarpv-solarpower").val().split(",");
            housefeedids = $("#mysolarpv-housepower").val().split(",");
            app_mysolarpv.solarpower = solarfeedids;
            app_mysolarpv.housepower = housefeedids;

            // Save config to db
            var config = (app.config === undefined) ? {} : app.config;
            config["mysolarpv"] = {
                "solarpower": app_mysolarpv.solarpower,
                "housepower": app_mysolarpv.housepower
            };
            if ((app_mysolarpv.solarpower[0] > 1) && (app_mysolarpv.housepower[0] > 1)) {
                app.setconfig(config);
            } else {
                $("#myModal").modal("show")
            }

            app_mysolarpv.reload = true;
        });

        $(window).resize(function () {
            app_mysolarpv.resize();
            if (houseok && solarok) {
                app_mysolarpv.draw();
            }
        });

        /*
        $(document).on("socketio_msg",function( event, msg ) {
            var use_now = 1*nodes['6'].values[1] + 1*nodes['6'].values[2];
            var solar_now = 1*nodes['10'].values[2];
            if (solar_now<10) solar_now = 0;
            var totalgen = app_mysolarpv.windnow+solar_now;

            var balance = totalgen - use_now;

            $("#usenow").html(use_now);
            $("#solarnow").html(solar_now);
            $("#gridwindnow").html(Math.round(app_mysolarpv.windnow));
            $("#totalgen").html(Math.round(totalgen));

            $("#chargerate").html(Math.round(balance));
        });
        */
    },

    show: function () {
        // this.reload = true;
        this.livefn();
        this.live = setInterval(this.livefn, 5000);

        $("body").css("background-color", "#222");

        $(window).ready(function () {
            $("#footer").css('background-color', '#181818');
            $("#footer").css('color', '#999');
        });

        app_mysolarpv.resize();
        app_mysolarpv.draw();
        app_mysolarpv.draw_bargraph();
    },

    resize: function () {
        var top_offset = 0,
            placeholder_bound = $('#mysolarpv_placeholder_bound'),
            placeholder = $('#mysolarpv_placeholder'),
            width = placeholder_bound.width(),
            height = $(window).height() * 0.55;

        if (height > width) {height = width; }

        placeholder.width(width);
        placeholder_bound.height(height);
        placeholder.height(height - top_offset);

        if (width <= 500) {
            $(".electric-title").css("font-size", "16px");
            $(".power-value").css("font-size", "32px");
            $(".power-value").css("padding-top", "12px");
            $(".power-value").css("padding-bottom", "8px");
            $(".midtext").css("font-size", "14px");
            $("#balanceline").hide();
            $("#vistimeW").hide();
            $("#vistimeM").hide();
            $("#vistimeY").hide();
        } else if (width <= 724) {
            $(".electric-title").css("font-size", "18px");
            $(".power-value").css("font-size", "52px");
            $(".power-value").css("padding-top", "22px");
            $(".power-value").css("padding-bottom", "12px");
            $(".midtext").css("font-size", "18px");
            $("#balanceline").show();
            $("#vistimeW").show();
            $("#vistimeM").show();
            $("#vistimeY").show();
        } else {
            $(".electric-title").css("font-size", "22px");
            $(".power-value").css("font-size", "85px");
            $(".power-value").css("padding-top", "40px");
            $(".power-value").css("padding-bottom", "20px");
            $(".midtext").css("font-size", "20px");
            $("#balanceline").show();
            $("#vistimeW").show();
            $("#vistimeM").show();
            $("#vistimeY").show();
        }
    },

    hide: function () {
        clearInterval(this.live);
    },

    livefn: function () {
        // Check if the updater ran in the last 60s if it did not the app was sleeping
        // and so the data needs a full reload.
        var now = +new Date(),
            feeds,
            use_now,
            i,
            solar_now,
            feedid,
            timerange;
        if ((now - app_mysolarpv.lastupdate) > 60000) {app_mysolarpv.reload = true; }
        app_mysolarpv.lastupdate = now;

        // Fetch latest feed data
        feeds = app_mysolarpv.getfeedsbyid();

        // Consumption feeds
        use_now = 0;
        for (i in app_mysolarpv.housepower) {
            feedid = app_mysolarpv.housepower[i];
            if (feeds[feedid] !== undefined) {
                use_now += parseInt(feeds[feedid].value);
                if (app_mysolarpv.autoupdate) {
                    app_mysolarpv.timeseries_append("f" + feedid, feeds[feedid].time, parseInt(feeds[feedid].value));
                    app_mysolarpv.timeseries_trim_start("f" + feedid, view.start * 0.001);
                }
            }
        }

        // Solar feeds
        solar_now = 0;
        for (i in app_mysolarpv.solarpower) {
            feedid = app_mysolarpv.solarpower[i];
            if (feeds[feedid] !== undefined) {
                solar_now += parseInt(feeds[feedid].value);
                if (app_mysolarpv.autoupdate) {
                    //console.log(feeds[feedid].time+" " + feeds[feedid].value);
                    app_mysolarpv.timeseries_append("f" + feedid, feeds[feedid].time, parseInt(feeds[feedid].value));
                    app_mysolarpv.timeseries_trim_start("f" + feedid,view.start * 0.001);
                }
            }
        }

        // Advance view
        if (app_mysolarpv.autoupdate) {
            timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }

        //console.log("vs-ve: " + view.start+" " + view.end);

        // Lower limit for solar
        // for presentation tests only
        //solar_now = parseInt((Math.round(Math.random(100) * 10000)) / 10)
        //use_now = parseInt((Math.round(Math.random(100) * 10000)) / 10)
        solar_now = (solar_now < 10) ? 0 : solar_now;
        var balance = Math.round(solar_now - use_now);
        //This code is made independant of presentation
        if (balance === 0) {
            $("#bal-lbl-zer").show();
            $("#bal-lbl-imp").hide();
            $("#bal-lbl-exp").hide();
            $("#balance").html("");
        }

        if (balance > 0) {
            $("#bal-lbl-zer").hide();
            $("#bal-lbl-imp").hide();
            $("#bal-lbl-exp").show();
            $("#balance").css("color", "green");
            $("#balance").html("<span><b>" + Math.abs(balance) + "&nbspW</b></span>");
            //console.log("<<<<<<<<<<<export"+" | Solar_now : "+ solar_now+" | Use_now  : "+use_now+" | balance : "+balance);
        }

        if (balance < 0) {
            $("#bal-lbl-zer").hide();
            $("#bal-lbl-imp").show();
            $("#bal-lbl-exp").hide();
            $("#balance").css("color", "red");
            $("#balance").html("<span><b>" + Math.abs(balance) + "&nbspW</b></span>");
            //console.log("<<<<<<<<<<<import"+" | Solar_now : "+ solar_now+" | Use_now  : "+use_now+" | balance : "+balance);
        }

        $("#solarnow").html(solar_now);
        $("#usenow").html(use_now);

        app_mysolarpv.draw();

    },

    draw: function () {
        var tmpsolar, balance, store_change, time, series= [],
            feedid, i, t, z, store = 0, use = 0, mysolar = 0,
            total_solar_kwh = 0, total_use_kwh = 0, total_use_direct_kwh = 0, tmpuse = null,
            datastart = view.start,
            fill = false,
            use_data = [], gen_data = [], bal_data = [], store_data = [],

            options = {
                lines: { fill: fill },
                xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
                yaxes: [{ min: 0 }],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" }
            },
            npoints = 1500,
            interval = Math.round(((view.end - view.start) / npoints) / 1000);
        interval =  (interval < 1) ? 1 : interval;

        npoints = parseInt((view.end - view.start) / (interval * 1000));

        // -------------------------------------------------------------------------------------------------------
        // LOAD DATA ON INIT OR RELOAD
        // -------------------------------------------------------------------------------------------------------
        if (app_mysolarpv.reload) {
            app_mysolarpv.reload = false;
            view.start = 1000 * Math.floor((view.start / 1000) / interval) * interval;
            view.end = 1000 * Math.ceil((view.end / 1000) / interval) * interval;

            for (i in app_mysolarpv.solarpower) {
                feedid = app_mysolarpv.solarpower[i];
                app_mysolarpv.timeseries_load("f" + feedid, this.getdata(feedid, view.start, view.end, interval));
            }

            for (i in app_mysolarpv.housepower) {
                feedid = app_mysolarpv.housepower[i];
                app_mysolarpv.timeseries_load("f" + feedid, this.getdata(feedid, view.start, view.end, interval));
            }
        }
        // -------------------------------------------------------------------------------------------------------

        for (z in app_mysolarpv.datastore) {
            //console.log(z+"    datastore:  "+app_mysolarpv.datastore)
            datastart = this.datastore[z].data[0][0];
            npoints = this.datastore[z].data.length;
        }

        for (z = 0; z < npoints; z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            tmpsolar = null;
            for (i in app_mysolarpv.solarpower) {
                feedid = app_mysolarpv.solarpower[i];
                if (this.datastore["f" + feedid].data[z] !== undefined && this.datastore["f" + feedid].data[z][1] !== null) {
                    //if (tmpsolar === null) tmpsolar = 0;
                    tmpsolar = (tmpsolar === null) ?  0 : tmpsolar;
                    tmpsolar += this.datastore["f" + feedid].data[z][1];
                }
            }
            //if (tmpsolar !== null) mysolar = tmpsolar;
            mysolar = (tmpsolar === null) ?  0 : tmpsolar;

            for (i in app_mysolarpv.housepower) {
                feedid = app_mysolarpv.housepower[i];
                if (this.datastore["f" + feedid].data[z] !== undefined && this.datastore["f" + feedid].data[z][1] !== null) {
                    //if (tmpuse === null) tmpuse = 0;
                    tmpuse = (tmpuse === null) ? 0 : tmpuse;
                    tmpuse += this.datastore["f" + feedid].data[z][1];
                }
            }
            tmpuse = (tmpuse !== null) ? tmpuse : null;

            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            //if (mysolar < 10) mysolar = 0;
            mysolar = (mysolar < 10) ? 0 : mysolar;
            balance = mysolar - use;

            if (balance >= 0) {total_use_direct_kwh += (use * interval) / (1000 * 3600); }
            if (balance < 0) {total_use_direct_kwh += (mysolar * interval) / (1000 * 3600); }

            store_change = (balance * interval) / (1000 * 3600);
            store += store_change;

            total_solar_kwh += (mysolar * interval) / (1000 * 3600);
            total_use_kwh += (use * interval) / (1000 * 3600);

            time = datastart + (1000 * interval * z);
            use_data.push([time, use]);
            gen_data.push([time, mysolar]);
            bal_data.push([time, balance]);
            store_data.push([time, store]);

            t += interval;
        }
        $("#total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $("#total_use_kwh").html(total_use_kwh.toFixed(1));

        $("#total_use_direct_prc").html(Math.round(100 * total_use_direct_kwh / total_use_kwh) + "%");
        $("#total_use_via_store_prc").html(Math.round(100 * (1 - (total_use_direct_kwh / total_use_kwh))) + "%");

        $("#total_use_direct_kwh").html(total_use_direct_kwh.toFixed(1));
        $("#total_use_via_store_kwh").html(total_use_kwh - total_use_direct_kwh.toFixed(1));

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;

        series = [
            {data: gen_data, color: "#dccc1f", lines: {lineWidth: 0, fill: 1.0}},
            {data: use_data, color: "#0699fa", lines: {lineWidth: 0, fill: 0.8}}
        ];

        if (app_mysolarpv.show_balance_line) {series.push({data: store_data, yaxis: 2, color: "#888"}); }

        $.plot($('#mysolarpv_placeholder'), series, options);
    },

    draw_bargraph: function () {
        /*
        var timeWindow = (3600000*24.0*365);
        var end = +new Date;
        var start = end - timeWindow;
        var interval = 3600*24;

        var kwh_data = this.getdata(69211,start,end,interval);
        var kwhd_data = [];

        for (var day=1; day<kwh_data.length; day++)
        {
            var kwh = kwh_data[day][1] - kwh_data[day-1][1];
            if (kwh_data[day][1]==null || kwh_data[day-1][1]==null) kwh = 0;
            kwhd_data.push([kwh_data[day][0],kwh]);
        }

        var options = {
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: true},
            xaxis: { mode: "time", timezone: "browser"},
            grid: {hoverable: true, clickable: true},
            selection: { mode: "x" }
        }

        var series = [];

        series.push({
            data: kwhd_data,
            color: "#dccc1f",
            lines: {lineWidth:0, fill:1.0}
        });

        $.plot($('#mysolarpv_bargraph'),series,options);
        */
    },

    getfeedsbyid: function () {
        var z, byid = {}, feeds = {},
            apikeystr = (apikey !== "") ? "?apikey=" + apikey : "";

        $.ajax({
            url: path + "feed/list.json" + apikeystr,
            dataType: 'json',
            async: false,
            success: function (data_in) { feeds = data_in; }
        });

        for (z in feeds) {byid[feeds[z].id] = feeds[z]; }
        return byid;
    },

    getdata: function (id, start, end, interval) {
        var apikeystr = (apikey !== "") ? "?apikey=" + apikey : "";

        var data = [];
        $.ajax({
            url: path + "feed/data.json" + apikeystr,
            data: "id=" + id + "&start=" + start + "&end=" + end + "&interval=" + interval + "&skipmissing=0&limitinterval=0",
            dataType: 'json',
            async: false,
            success: function (data_in) { data = data_in; }
        });
        return data;
    },

    // -------------------------------------------------------------------------------------------------------
    // IN BROWSER TIMESERIES DATA STORE
    // with features for appending a new datapoint and triming the old data in order to create a moving view
    // -------------------------------------------------------------------------------------------------------

    timeseries_load: function (name, data) {
        if (data === '') {return; }
        this.datastore[name] = {};
        this.datastore[name].data = data;
        console.log (this.datastore);
        /*
        if (this.datastore[name] === undefined) {return; }
        this.datastore[name].start = this.datastore[name].data[0][0] * 0.001;
        this.datastore[name].interval = (this.datastore[name].data[1][0] - this.datastore[name].data[0][0]) * 0.001;
        */
    },

    timeseries_append: function (name, time, value) {
        if (this.datastore[name] === undefined) {return false; }

        var interval = this.datastore[name].interval,
            start = this.datastore[name].start,
            pos,
            last_pos,
            npadding,
            padd,
            padd_time;

        // 1. align to timeseries interval
        time = Math.floor(time / interval) * interval;
        // 2. calculate new data point position
        pos = (time - start) / interval;
        // 3. get last position from data length
        last_pos = this.datastore[name].data.length - 1;

        // if the datapoint is newer than the last:
        if (pos > last_pos) {
            npadding = (pos - last_pos) - 1;

            // padding
            if (npadding > 0 && npadding < 12) {
                for (padd = 0; padd < npadding; padd++) {
                    padd_time = start + ((last_pos + padd + 1) * interval);
                    this.datastore[name].data.push([padd_time * 1000, null]);
                }
            }

            // insert datapoint
            this.datastore[name].data.push([time * 1000, value]);
        }
    },

    timeseries_trim_start: function (name, newstart) {
        if (this.datastore[name] === undefined) {return false; }

        var interval = this.datastore[name].interval,
            start = this.datastore[name].start,
            pos,
            tmpdata = [],
            p,
            t,
            v;

        newstart = Math.floor(newstart / interval) * interval;
        pos = (newstart - start) / interval;

        if (pos >= 0) {
            for (p = pos; p < this.datastore[name].data.length; p++) {
                t = this.datastore[name].data[p][0];
                v = this.datastore[name].data[p][1];
                tmpdata.push([t, v]);
            }
            this.datastore[name].data = tmpdata;
            this.datastore[name].start = this.datastore[name].data[0][0] * 0.001;
            this.datastore[name].interval = (this.datastore[name].data[1][0] - this.datastore[name].data[0][0]) * 0.001;
        }
    }
};
