var app_mysolarpvdivert = {

    config: {
        "use":{"type":"feed", "autoname":"use", "engine":"5", "description":"House or building use in watts"},
        "solar":{"type":"feed", "autoname":"solar", "engine":"5", "description":"Solar pv generation in watts"},
        "wind":{"optional":true, "type":"feed", "autoname":"wind", "engine":"5", "description":"Wind generation in watts"},
        "divert":{"type":"feed", "autoname":"divert", "engine":"5", "description":"Immersion usage in watts"},
        //"export":{"type":"feed", "autoname":"export", "engine":5, "description":"Exported solar in watts"},
        "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
        "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "engine":5, "description":"Cumulative solar generation in kWh"},
        "wind_kwh":{"optional":true, "type":"feed", "autoname":"wind_kwh", "engine":5, "description":"Cumulative wind generation in kWh"},
        "divert_kwh":{"optional":true, "type":"feed", "autoname":"divert_kwh", "engine":5, "description":"Cumulative divert usage in kWh"},
        "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "engine":5, "description":"Cumulative grid import in kWh"},
        //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
    },
    
    live: false,
    show_balance_line: 0,
    has_wind: false,
      
    reload: true,
    autoupdate: true,
    
    lastupdate: 0,
    
    view: "powergraph",
    historyseries: [],
    powerseries: [],
    latest_start_time: 0,
    panning: false,
    
    bargraph_initialized: false,

    // Include required javascript libraries
    include: [
        "Lib/flot/jquery.flot.min.js",
        "Lib/flot/jquery.flot.time.min.js",
        "Lib/flot/jquery.flot.selection.min.js",
        "Lib/flot/jquery.flot.stack.min.js",
        "Modules/app/lib/timeseries.js",
        "Modules/app/vis.helper.js",
        "Lib/flot/date.format.js"
    ],

    // App start function
    init: function()
    {        
        app.log("INFO","mysolarpvdivert init");
    
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
        if (app_mysolarpvdivert.config.wind.value) {
            app_mysolarpvdivert.has_wind = true;
            $(".generationtitle").html("GENERATION");
        } else {
            $(".generationtitle").html("SOLAR");
        }
        
        if (app_mysolarpvdivert.config.solar_kwh.value && 
            app_mysolarpvdivert.config.use_kwh.value && 
            app_mysolarpvdivert.config.import_kwh.value &&
            (!app_mysolarpvdivert.has_wind || app_mysolarpvdivert.config.wind_kwh.value))
        {
            app_mysolarpvdivert.init_bargraph();
            $(".viewhistory").show();
        } else {
            $(".viewhistory").hide();
        }
        
        // The first view is the powergraph, we load the events for the power graph here.
        if (app_mysolarpvdivert.view=="powergraph") app_mysolarpvdivert.powergraph_events();
        
        // The buttons for these powergraph events are hidden when in historic mode 
        // The events are loaded at the start here and dont need to be unbinded and binded again.
        $("#mysolarpvdivert_zoomout").click(function () {view.zoomout(); app_mysolarpvdivert.reload = true; app_mysolarpvdivert.autoupdate = false; app_mysolarpvdivert.draw();});
        $("#mysolarpvdivert_zoomin").click(function () {view.zoomin(); app_mysolarpvdivert.reload = true; app_mysolarpvdivert.autoupdate = false; app_mysolarpvdivert.draw();});
        $('#mysolarpvdivert_right').click(function () {view.panright(); app_mysolarpvdivert.reload = true; app_mysolarpvdivert.autoupdate = false; app_mysolarpvdivert.draw();});
        $('#mysolarpvdivert_left').click(function () {view.panleft(); app_mysolarpvdivert.reload = true; app_mysolarpvdivert.autoupdate = false; app_mysolarpvdivert.draw();});
        
        $('.time').click(function () {
            view.timewindow($(this).attr("time")/24.0); 
            app_mysolarpvdivert.reload = true; 
            app_mysolarpvdivert.autoupdate = true;
            app_mysolarpvdivert.draw();
        });
        
        $(".balanceline").click(function () { 
            if ($(this).html()=="SHOW BALANCE") {
                app_mysolarpvdivert.show_balance_line = 1;
                app_mysolarpvdivert.draw();
                $(this).html("HIDE BALANCE");
            } else {
                app_mysolarpvdivert.show_balance_line = 0;
                app_mysolarpvdivert.draw();
                $(this).html("SHOW BALANCE");
            }
        });
        
        $(".viewhistory").click(function () { 
            if ($(this).html()=="VIEW HISTORY") {
                app_mysolarpvdivert.view = "bargraph";
                $(".balanceline").hide();
                $(".powergraph-navigation").hide();
                $(".bargraph-navigation").show();
                
                app_mysolarpvdivert.draw();
                setTimeout(function() { $(".viewhistory").html("POWER VIEW"); },80);
            } else {
                
                app_mysolarpvdivert.view = "powergraph";
                $(".balanceline").show();
                $(".bargraph-navigation").hide();
                $(".powergraph-navigation").show();
                
                app_mysolarpvdivert.draw();
                app_mysolarpvdivert.powergraph_events();
                setTimeout(function() { $(".viewhistory").html("VIEW HISTORY"); },80);
            }
        });        
    },

    show: function() 
    {
        app.log("INFO","mysolarpvdivert show");
        
        if (app_mysolarpvdivert.config.solar_kwh.value && app_mysolarpvdivert.config.use_kwh.value && app_mysolarpvdivert.config.import_kwh.value) {
            if (!app_mysolarpvdivert.bargraph_initialized) app_mysolarpvdivert.init_bargraph();
            $(".viewhistory").show();
        } else {
            $(".viewhistory").hide();
        }
        
        app_mysolarpvdivert.resize();
        
        // this.reload = true;
        app_mysolarpvdivert.livefn();
        app_mysolarpvdivert.live = setInterval(app_mysolarpvdivert.livefn,5000);

    },
    
    resize: function() 
    {
        app.log("INFO","mysolarpvdivert resize");
        
        var top_offset = 0;
        var placeholder_bound = $('#mysolarpvdivert_placeholder_bound');
        var placeholder = $('#mysolarpvdivert_placeholder');

        var width = placeholder_bound.width();
        var height = $(window).height()*0.55;

        if (height>width) height = width;

        placeholder.width(width);
        placeholder_bound.height(height);
        placeholder.height(height-top_offset);
        
        if (width<=500) {
            $(".electric-title").css("font-size","16px");
            $(".power-value").css("font-size","32px");
            $(".power-value").css("padding-top","12px");
            $(".power-value").css("padding-bottom","8px");
            $(".statsbox-title").css("font-size","14px");
            $(".statsbox-value").css("font-size","20px");
            $(".statsbox-units").css("font-size","12px");
            $(".statsbox-prc").css("font-size","12px");
            $(".midtext").css("font-size","14px");
            $(".balanceline").hide();
            $(".vistimeW").hide();
            $(".vistimeM").hide();
            $(".vistimeY").hide();
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".power-value").css("padding-top","22px");
            $(".power-value").css("padding-bottom","12px");
            $(".statsbox-title").css("font-size","16px");
            $(".statsbox-value").css("font-size","22px");
            $(".statsbox-units").css("font-size","14px");
            $(".statsbox-prc").css("font-size","14px");
            $(".midtext").css("font-size","18px");
            $(".balanceline").show();
            $(".vistimeW").show();
            $(".vistimeM").show();
            $(".vistimeY").show();
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".power-value").css("padding-top","40px");
            $(".power-value").css("padding-bottom","20px");
            $(".statsbox-title").css("font-size","20px");
            $(".statsbox-value").css("font-size","36px");
            $(".statsbox-units").css("font-size","16px");
            $(".statsbox-prc").css("font-size","16px");
            $(".midtext").css("font-size","20px");
            $(".balanceline").show();
            $(".vistimeW").show();
            $(".vistimeM").show();
            $(".vistimeY").show();
        }
        app_mysolarpvdivert.draw();
    },
    
    hide: function() 
    {
        clearInterval(this.live);
    },
    
    livefn: function()
    {
        // Check if the updater ran in the last 60s if it did not the app was sleeping
        // and so the data needs a full reload.
        var now = +new Date();
        if ((now-app_mysolarpvdivert.lastupdate)>60000) app_mysolarpvdivert.reload = true;
        app_mysolarpvdivert.lastupdate = now;
        
        var feeds = feed.listbyid();
        var solar_now = parseInt(feeds[app_mysolarpvdivert.config.solar.value].value);
        var use_now = parseInt(feeds[app_mysolarpvdivert.config.use.value].value);
        var divert_now = parseInt(feeds[app_mysolarpvdivert.config.divert.value].value);
        
        var wind_now = 0;
        if (app_mysolarpvdivert.has_wind) {
          wind_now = parseInt(feeds[app_mysolarpvdivert.config.wind.value].value);
        }

        if (app_mysolarpvdivert.autoupdate) {
            var updatetime = feeds[app_mysolarpvdivert.config.solar.value].time;
            timeseries.append("solar",updatetime,solar_now);
            timeseries.trim_start("solar",view.start*0.001);
            timeseries.append("use",updatetime,use_now);
            timeseries.trim_start("use",view.start*0.001);
            timeseries.append("divert",updatetime,divert_now);
            timeseries.trim_start("divert",view.start*0.001);
            
            if (app_mysolarpvdivert.has_wind) {
              timeseries.append("wind",updatetime,wind_now);
              timeseries.trim_start("wind",view.start*0.001);
            }

            // Advance view
            var timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }
        // Lower limit for solar & divert
        if (solar_now<10) solar_now = 0;
        if (wind_now<10) wind_now = 0;
        if (divert_now<10) divert_now = 0;
        
        var balance = (solar_now + wind_now) - use_now;

        var house_now = use_now - divert_now;
        
        if (balance==0) {
            $(".balance-label").html("PERFECT BALANCE");
            $(".balance").html("");
        }
        
        if (balance>0) {
            $(".balance-label").html("EXPORTING");
            $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        if (balance<0) {
            $(".balance-label").html("IMPORTING");
            $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        $(".generationnow").html(solar_now + wind_now);
        $(".housenow").html(house_now);
        $(".divertnow").html(divert_now);
        $(".usenow").html(use_now);
        
        // Only redraw the graph if its the power graph and auto update is turned on
        if (app_mysolarpvdivert.view=="powergraph" && app_mysolarpvdivert.autoupdate) app_mysolarpvdivert.draw();
    },
    
    draw: function ()
    {
        if (app_mysolarpvdivert.view=="powergraph") app_mysolarpvdivert.draw_powergraph();
        if (app_mysolarpvdivert.view=="bargraph") app_mysolarpvdivert.draw_bargraph();
    },
    
    draw_powergraph: function() {
        var dp = 1;
        var units = "C";
        var fill = false;
        var plotColour = 0;
        
        var options = {
            lines: { fill: fill },
            xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end},
            yaxes: [{ min: 0 }],
            grid: { hoverable: true, clickable: true },
            selection: { mode: "x" },
            legend: { show: false }
        }
        
        var npoints = 1500;
        interval = Math.round(((view.end - view.start)/npoints)/1000);
        interval = view.round_interval(interval);
        if (interval<10) interval = 10;
        var intervalms = interval * 1000;

        view.start = Math.ceil(view.start/intervalms)*intervalms;
        view.end = Math.ceil(view.end/intervalms)*intervalms;

        var npoints = parseInt((view.end-view.start)/(interval*1000));
        
        // -------------------------------------------------------------------------------------------------------
        // LOAD DATA ON INIT OR RELOAD
        // -------------------------------------------------------------------------------------------------------
        if (app_mysolarpvdivert.reload) {
            app_mysolarpvdivert.reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            timeseries.load("solar",feed.getdata(app_mysolarpvdivert.config.solar.value,view.start,view.end,interval,0,0));
            timeseries.load("use",feed.getdata(app_mysolarpvdivert.config.use.value,view.start,view.end,interval,0,0));
            timeseries.load("divert",feed.getdata(app_mysolarpvdivert.config.divert.value,view.start,view.end,interval,0,0));
            if (app_mysolarpvdivert.has_wind) {
              timeseries.load("wind",feed.getdata(app_mysolarpvdivert.config.wind.value,view.start,view.end,interval,0,0));
            }
        }
        // -------------------------------------------------------------------------------------------------------
        
        var use_data = [];
        var solar_data = [];
        var wind_data = [];
        var bal_data = [];
        var store_data = [];
        var divert_data = [];
        var house_data = [];
        
        var t = 0;
        var store = 0;
        var use_now = 0;
        var solar_now = 0;
        var wind_now = 0;
        var divert_now = 0;
        var house_now = 0;
        
        var total_solar_kwh = 0;
        var total_wind_kwh = 0;
        var total_use_kwh = 0;
        var total_use_generated_kwh = 0;
        var total_house_generated_kwh = 0;
        var total_divert_kwh = 0;
        
        var datastart = timeseries.start_time("solar");
        
        for (var z=0; z<timeseries.length("solar"); z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
            if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
            if (timeseries.value("divert",z)!=null) divert_now = timeseries.value("divert",z);
            if (app_mysolarpvdivert.has_wind) {
                if (timeseries.value("wind",z)!=null) wind_now = timeseries.value("wind",z);
            } else {
                wind_now = 0;
            }

            house_now = use_now - divert_now;
            
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (solar_now<10) solar_now = 0;
            if (wind_now<10) wind_now = 0;
            if (divert_now<10) divert_now = 0;

            var generated_now = solar_now + wind_now;

            var balance_use = generated_now - use_now;
            if (balance_use>=0) {
                total_use_generated_kwh += (use_now*interval)/(1000*3600);
            }
            if (balance_use<0) {
                total_use_generated_kwh += (generated_now*interval)/(1000*3600);
            }
            
            var balance_house = generated_now - house_now;
            if (balance_house>=0) {
                total_house_generated_kwh += (house_now*interval)/(1000*3600);
            }
            if (balance_house<0) {
                total_house_generated_kwh += (generated_now*interval)/(1000*3600);
            }
            
            var store_change = (balance_use * interval) / (1000*3600);
            store += store_change;
            
            total_solar_kwh += (solar_now*interval)/(1000*3600);
            total_wind_kwh += (wind_now*interval)/(1000*3600);
            total_use_kwh += (use_now*interval)/(1000*3600);
            total_divert_kwh += (divert_now*interval)/(1000*3600);
            
            var time = datastart + (1000 * interval * z);
            use_data.push([time,use_now]);
            solar_data.push([time,solar_now]);
            wind_data.push([time,wind_now]);
            bal_data.push([time,balance_use]);
            store_data.push([time,store]);
            divert_data.push([time,divert_now]);
            house_data.push([time,house_now]);
            
            t += interval;
        }

        var total_generated_kwh = total_solar_kwh + total_wind_kwh;
        var total_house_kwh = total_use_kwh - total_divert_kwh;
        var total_export_kwh = total_generated_kwh - total_use_generated_kwh;
        var total_import_kwh = total_use_kwh - total_use_generated_kwh;
        var total_grid_balance_kwh = total_export_kwh - total_import_kwh;

        $(".total_house_kwh").html(total_house_kwh.toFixed(1));
        $(".total_divert_kwh").html((total_divert_kwh).toFixed(1));
        $(".total_use_kwh").html((total_use_kwh).toFixed(1));
        $(".total_generated_kwh").html(total_generated_kwh.toFixed(1));

        $(".total_house_generated_kwh").html((total_house_generated_kwh).toFixed(1));
        $(".total_export_kwh").html(total_export_kwh.toFixed(1));
        $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
        
        if (total_generated_kwh > 0) {
            $(".house_generated_total_generated_prc").html(((total_house_generated_kwh/total_generated_kwh)*100).toFixed(0)+"%");
            $(".house_generated_house_use_prc").html(((total_house_generated_kwh/total_house_kwh)*100).toFixed(0)+"%");
            $(".divert_total_generated_prc").html(((total_divert_kwh/total_generated_kwh)*100).toFixed(0)+"%");
            $(".total_export_prc").html(((total_export_kwh/total_generated_kwh)*100).toFixed(0)+"%");
        } else {
            $(".house_generated_total_generated_prc").html("-- %");
            $(".house_generated_house_use_prc").html("-- %%");
            $(".divert_total_generated_prc").html("-- %");
            $(".total_export_prc").html("-- %");
        }
                
        $(".total_import_prc").html(((total_import_kwh/total_house_kwh)*100).toFixed(0)+"%");
        $(".total_import_kwh").html(total_import_kwh.toFixed(1));        

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [];
        
        series.push({data:solar_data, label: "Solar", color: "#dccc1f", stack:1, lines:{lineWidth:0, fill:1.0}});
        if (app_mysolarpvdivert.has_wind) series.push({data:wind_data, label: "Wind", color: "#1fdc6e", stack:1, lines:{lineWidth:0, fill:1.0}});
        
        series.push({data:house_data, label: "House", color: "#82cbfc", stack:2, lines:{lineWidth:0, fill:0.8}});
        series.push({data:divert_data, label: "Divert", color: "#fb7b50", stack:2, lines:{lineWidth:0, fill:0.8}});
        
        if (app_mysolarpvdivert.show_balance_line) series.push({data:store_data, label: "Balance", yaxis:2, color: "#888"});

        app_mysolarpvdivert.powerseries = series;
        
        $.plot($('#mysolarpvdivert_placeholder'),app_mysolarpvdivert.powerseries,options);
        $(".ajax-loader").hide();
    },

    // ------------------------------------------------------------------------------------------
    // POWER GRAPH EVENTS
    // ------------------------------------------------------------------------------------------
    powergraph_events: function() {
    
        $('#mysolarpvdivert_placeholder').unbind("plotclick");
        $('#mysolarpvdivert_placeholder').unbind("plothover");
        $('#mysolarpvdivert_placeholder').unbind("plotselected");

        $('#mysolarpvdivert_placeholder').bind("plothover", function (event, pos, item)
        {
            if (item) {
                // Show tooltip
                var tooltip_items = [];

                var date = new Date(item.datapoint[0]);
                tooltip_items.push(["TIME", dateFormat(date, 'HH:MM'), ""]);

                for (i = 0; i < app_mysolarpvdivert.powerseries.length; i++) {
                    var series = app_mysolarpvdivert.powerseries[i];
                    tooltip_items.push([series.label.toUpperCase(), series.data[item.dataIndex][1].toFixed(1), "W"]);
                }
                app_mysolarpvdivert.show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
            } else {
                // Hide tooltip
                app_mysolarpvdivert.hide_tooltip();
            }
        });
    
        $('#mysolarpvdivert_placeholder').bind("plotselected", function (event, ranges) {
            view.start = ranges.xaxis.from;
            view.end = ranges.xaxis.to;

            app_mysolarpvdivert.autoupdate = false;
            app_mysolarpvdivert.reload = true; 
            
            var now = +new Date();
            if (Math.abs(view.end-now)<30000) {
                app_mysolarpvdivert.autoupdate = true;
            }

            app_mysolarpvdivert.draw();
        });
    },
    
    // ======================================================================================
    // PART 2: BAR GRAPH PAGE
    // ======================================================================================

    // --------------------------------------------------------------------------------------
    // INIT BAR GRAPH
    // - load cumulative kWh feeds
    // - calculate used solar, solar, used and exported kwh/d
    // --------------------------------------------------------------------------------------
    init_bargraph: function() {
        app_mysolarpvdivert.bargraph_initialized = true;
        // Fetch the start_time covering all kwh feeds - this is used for the 'all time' button
        var latest_start_time = 0;
        var solar_meta = feed.getmeta(app_mysolarpvdivert.config.solar_kwh.value);
        var use_meta = feed.getmeta(app_mysolarpvdivert.config.use_kwh.value);
        var divert_meta = feed.getmeta(app_mysolarpvdivert.config.divert_kwh.value);
        var import_meta = feed.getmeta(app_mysolarpvdivert.config.import_kwh.value);
        if (solar_meta.start_time > latest_start_time) latest_start_time = solar_meta.start_time;
        if (use_meta.start_time > latest_start_time) latest_start_time = use_meta.start_time;
        if (divert_meta.start_time > latest_start_time) latest_start_time = divert_meta.start_time;
        if (import_meta.start_time > latest_start_time) latest_start_time = import_meta.start_time;
        app_mysolarpvdivert.latest_start_time = latest_start_time;

        var earliest_start_time = solar_meta.start_time;
        earliest_start_time = Math.min(earliest_start_time, use_meta.start_time);
        earliest_start_time = Math.min(earliest_start_time, divert_meta.start_time);
        earliest_start_time = Math.min(earliest_start_time, import_meta.start_time);
        view.first_data = latest_start_time * 1000;

        var timeWindow = (3600000*24.0*40);
        var end = +new Date;
        var start = end - timeWindow;
        app_mysolarpvdivert.load_bargraph(start,end);
    },
    
    load_bargraph: function(start,end) {

        var interval = 3600*24;
        var intervalms = interval * 1000;
        end = Math.ceil(end/intervalms)*intervalms;
        start = Math.floor(start/intervalms)*intervalms;
        
        // Load kWh data
        var solar_kwh_data = feed.getdataDMY(app_mysolarpvdivert.config.solar_kwh.value,start,end,"daily");
        var use_kwh_data = feed.getdataDMY(app_mysolarpvdivert.config.use_kwh.value,start,end,"daily");
        var divert_kwh_data = feed.getdataDMY(app_mysolarpvdivert.config.divert_kwh.value,start,end,"daily");
        var import_kwh_data = feed.getdataDMY(app_mysolarpvdivert.config.import_kwh.value,start,end,"daily");
        var wind_kwh_data = [];
        if (app_mysolarpvdivert.has_wind) {
            wind_kwh_data = feed.getdataDMY(app_mysolarpvdivert.config.wind_kwh.value,start,end,"daily");
        }
        
        app_mysolarpvdivert.house_generated_kwhd_data = [];
        app_mysolarpvdivert.solar_kwhd_data = [];
        app_mysolarpvdivert.wind_kwhd_data = [];
        app_mysolarpvdivert.use_kwhd_data = [];
        app_mysolarpvdivert.house_kwhd_data = [];
        app_mysolarpvdivert.divert_kwhd_data = [];
        app_mysolarpvdivert.export_kwhd_data = [];
        
        if (solar_kwh_data.length>1) {
        
        for (var day=1; day<solar_kwh_data.length; day++)
        {
            var solar_kwh = solar_kwh_data[day][1] - solar_kwh_data[day-1][1];
            if (solar_kwh_data[day][1]==null || solar_kwh_data[day-1][1]==null) solar_kwh = null;
            
            var wind_kwh = null;
            if (app_mysolarpvdivert.has_wind) {
                var wind_kwh = wind_kwh_data[day][1] - wind_kwh_data[day-1][1];
                if (wind_kwh_data[day][1]==null || wind_kwh_data[day-1][1]==null) wind_kwh = null;
            }
            
            var use_kwh = use_kwh_data[day][1] - use_kwh_data[day-1][1];
            if (use_kwh_data[day][1]==null || use_kwh_data[day-1][1]==null) use_kwh = null;
            
            var divert_kwh = divert_kwh_data[day][1] - divert_kwh_data[day-1][1];
            if (divert_kwh_data[day][1]==null || divert_kwh_data[day-1][1]==null) divert_kwh = null;
            
            var import_kwh = import_kwh_data[day][1] - import_kwh_data[day-1][1];
            if (import_kwh_data[day][1]==null || import_kwh_data[day-1][1]==null) import_kwh = null;
            
            var generated_kwh = solar_kwh + wind_kwh;
            var export_kwh = generated_kwh - (use_kwh - import_kwh);
            var house_kwh = use_kwh - divert_kwh;
            var house_solar_kwh = house_kwh - import_kwh;
            
            if (solar_kwh!=null && use_kwh!=null && export_kwh!=null && divert_kwh!=null && house_kwh!=null &&
                (!app_mysolarpvdivert.has_wind || wind_kwh!=null)
               )
            {
                app_mysolarpvdivert.house_generated_kwhd_data.push([solar_kwh_data[day-1][0],house_solar_kwh]);
                app_mysolarpvdivert.solar_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh]);
                if (wind_kwh!=null) app_mysolarpvdivert.wind_kwhd_data.push([wind_kwh_data[day-1][0],wind_kwh]);
                app_mysolarpvdivert.use_kwhd_data.push([use_kwh_data[day-1][0],use_kwh*-1]);
                app_mysolarpvdivert.house_kwhd_data.push([use_kwh_data[day-1][0],house_kwh]);
                app_mysolarpvdivert.divert_kwhd_data.push([divert_kwh_data[day-1][0],divert_kwh]);
                app_mysolarpvdivert.export_kwhd_data.push([import_kwh_data[day-1][0],export_kwh]);
            }
        }
        
        }
        
        var series = [];
        
        series.push({
            data: app_mysolarpvdivert.house_generated_kwhd_data,
            label: "House",
            color: "#82cbfc",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
            stack: 1
        });
        
        series.push({
            data: app_mysolarpvdivert.divert_kwhd_data,
            label: "Divert",
            color: "#fb7b50",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
            stack: 1
        });
        
        series.push({
            data: app_mysolarpvdivert.export_kwhd_data,
            label: "Export",
            color: "#2ed52e",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 },
            stack: 1
        });
        
        series.push({
            data: app_mysolarpvdivert.use_kwhd_data,
            label: "Use",
            color: "#0598fa",
            bars: { show: true, align: "center", barWidth: 0.8*3600*24*1000, fill: 1.0, lineWidth: 0 }
        });
        
        app_mysolarpvdivert.historyseries = series;
    },

    // ------------------------------------------------------------------------------------------
    // DRAW BAR GRAPH
    // Because the data for the bargraph only needs to be loaded once at the start we seperate out
    // the data loading part to init and the draw part here just draws the bargraph to the flot
    // placeholder overwritting the power graph as the view is changed.
    // ------------------------------------------------------------------------------------------    
    draw_bargraph: function() 
    {
        var markings = [];
        markings.push({ color: "#ccc", lineWidth: 1, yaxis: { from: 0, to: 0 } });
        
        var options = {
            xaxis: { mode: "time", timezone: "browser", minTickSize: [1, "day"] },
            grid: { hoverable: true, clickable: true, markings: markings },
            selection: { mode: "x" },
            legend: { show: false }
        };
        
        var plot = $.plot($('#mysolarpvdivert_placeholder'),app_mysolarpvdivert.historyseries,options);
        
        $('#mysolarpvdivert_placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Solar usage (house, diverted & exported)</div>");
        $('#mysolarpvdivert_placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Total usage</div>");

        // Because the bargraph is only drawn once when the view is changed we attach the events at this point
        app_mysolarpvdivert.bargraph_events();
    },

    // ------------------------------------------------------------------------------------------
    // BAR GRAPH EVENTS
    // - show bar values on hover
    // - click through to power graph
    // ------------------------------------------------------------------------------------------
    bargraph_events: function(){
    
        $('#mysolarpvdivert_placeholder').unbind("plotclick");
        $('#mysolarpvdivert_placeholder').unbind("plothover");
        $('#mysolarpvdivert_placeholder').unbind("plotselected");
        $('.bargraph-viewall').unbind("click");
        
        // Show day's figures on the bottom of the page
        $('#mysolarpvdivert_placeholder').bind("plothover", function (event, pos, item)
        {
            if (item) {
                var z = item.dataIndex;
                
                var solar_kwh = app_mysolarpvdivert.solar_kwhd_data[z][1];
                var wind_kwh = (app_mysolarpvdivert.has_wind) ? app_mysolarpvdivert.wind_kwhd_data[z][1] : 0;
                var house_generated_kwh = app_mysolarpvdivert.house_generated_kwhd_data[z][1];
                var use_kwh = app_mysolarpvdivert.use_kwhd_data[z][1]*-1;
                var house_kwh = app_mysolarpvdivert.house_kwhd_data[z][1];
                var divert_kwh = app_mysolarpvdivert.divert_kwhd_data[z][1];
                var export_kwh = app_mysolarpvdivert.export_kwhd_data[z][1];
                
                var generated_kwh = solar_kwh + wind_kwh;
                var import_kwh = use_kwh - house_generated_kwh - divert_kwh;
                var total_grid_balance_kwh = export_kwh - import_kwh;
                
                $(".total_house_kwh").html(house_kwh.toFixed(1));
                $(".total_divert_kwh").html((divert_kwh).toFixed(1));
                $(".total_use_kwh").html((use_kwh).toFixed(1));
                $(".total_generated_kwh").html(generated_kwh.toFixed(1));
                $(".total_house_generated_kwh").html((house_generated_kwh).toFixed(1));
                $(".total_export_kwh").html(export_kwh.toFixed(1));
                $(".total_import_kwh").html(import_kwh.toFixed(1));
                $(".total_grid_balance_kwh").html(total_grid_balance_kwh.toFixed(1));
                
                $(".house_generated_total_generated_prc").html(((house_generated_kwh/generated_kwh)*100).toFixed(0)+"%");
                $(".house_generated_house_use_prc").html(((house_generated_kwh/house_kwh)*100).toFixed(0)+"%");
                $(".divert_total_generated_prc").html(((divert_kwh/generated_kwh)*100).toFixed(0)+"%");
                $(".total_export_prc").html(((export_kwh/solar_kwh)*100).toFixed(0)+"%");
                $(".total_import_prc").html(((import_kwh/house_kwh)*100).toFixed(0)+"%");

                // Show tooltip
                var tooltip_items = [];

                var date = new Date(item.datapoint[0]);
                tooltip_items.push(["DATE", dateFormat(date, 'dd/mm/yy'), ""]);

                for (i = 0; i < app_mysolarpvdivert.historyseries.length; i++) {
                    var series = app_mysolarpvdivert.historyseries[i];
                    tooltip_items.push([series.label.toUpperCase(), Math.abs(series.data[item.dataIndex][1]).toFixed(1), "kWh"]);
                }
                app_mysolarpvdivert.show_tooltip(pos.pageX+10, pos.pageY+5, tooltip_items);
            } else {
                // Hide tooltip
                app_mysolarpvdivert.hide_tooltip();
            }
        });

        // Auto click through to power graph
        $('#mysolarpvdivert_placeholder').bind("plotclick", function (event, pos, item)
        {
            if (item && !app_mysolarpvdivert.panning) {
                var z = item.dataIndex;
                
                view.start = app_mysolarpvdivert.solar_kwhd_data[z][0];
                view.end = view.start + 86400*1000;

                $(".balanceline").show();
                $(".bargraph-navigation").hide();
                $(".powergraph-navigation").show();
                $(".viewhistory").html("VIEW HISTORY");
                $('#mysolarpvdivert_placeholder').unbind("plotclick");
                $('#mysolarpvdivert_placeholder').unbind("plothover");
                $('#mysolarpvdivert_placeholder').unbind("plotselected");
                
                app_mysolarpvdivert.reload = true; 
                app_mysolarpvdivert.autoupdate = false;
                app_mysolarpvdivert.view = "powergraph";
                
                app_mysolarpvdivert.draw();
                app_mysolarpvdivert.powergraph_events();
            }
        });
        
        $('#mysolarpvdivert_placeholder').bind("plotselected", function (event, ranges) {
            var start = ranges.xaxis.from;
            var end = ranges.xaxis.to;
            app_mysolarpvdivert.load_bargraph(start,end);
            app_mysolarpvdivert.draw();
            app_mysolarpvdivert.panning = true; setTimeout(function() {app_mysolarpvdivert.panning = false; }, 100);
        });
        
        $('.bargraph-viewall').click(function () {
            var start = app_mysolarpvdivert.latest_start_time * 1000;
            var end = +new Date;
            app_mysolarpvdivert.load_bargraph(start,end);
            app_mysolarpvdivert.draw();
        });
    },

    // ------------------------------------------------------------------------------------------
    // TOOLTIP HANDLING
    // Show & hide the tooltip
    // ------------------------------------------------------------------------------------------
    show_tooltip: function(x, y, values) {
        var tooltip = $('#mysolarpvdivert_tooltip');
        if (!tooltip[0]) {
            tooltip = $('<div id="mysolarpvdivert_tooltip"></div>')
                .css({
                    position: "absolute",
                    display: "none",
                    border: "1px solid #545454",
                    padding: "8px",
                    "background-color": "#333",
                })
                .appendTo("body");
        }

        tooltip.html('');
        var table = $('<table/>').appendTo(tooltip);

        for (i = 0; i < values.length; i++) {
            var value = values[i];
            var row = $('<tr class="tooltip-item"/>').appendTo(table);
            $('<td style="padding-right: 8px"><span class="tooltip-title">'+value[0]+'</span></td>').appendTo(row);
            $('<td><span class="tooltip-value">'+value[1]+'</span> <span class="tooltip-units">'+value[2]+'</span></td>').appendTo(row);
        }

        tooltip
            .css({
                left: x,
                top: y
            })
            .show();
    },

    hide_tooltip: function() {
        $('#mysolarpvdivert_tooltip').hide();
    },
}
