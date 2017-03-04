var app_mysolarpv = {

    config: {
        "use":{"type":"feed", "autoname":"use", "engine":"5", "description":"House or building use in watts"},
        "solar":{"type":"feed", "autoname":"solar", "engine":"5", "description":"Solar pv generation in watts"},
        //"export":{"type":"feed", "autoname":"export", "engine":5, "description":"Exported solar in watts"},
        "use_kwh":{"optional":true, "type":"feed", "autoname":"use_kwh", "engine":5, "description":"Cumulative use in kWh"},
        "solar_kwh":{"optional":true, "type":"feed", "autoname":"solar_kwh", "engine":5, "description":"Cumulative solar generation in kWh"},
        "import_kwh":{"optional":true, "type":"feed", "autoname":"import_kwh", "engine":5, "description":"Cumulative grid import in kWh"},
        //"import_unitcost":{"type":"value", "default":0.1508, "name": "Import unit cost", "description":"Unit cost of imported grid electricity"}
    },
    
    live: false,
    show_balance_line: 0,
      
    reload: true,
    autoupdate: true,
    
    lastupdate: 0,
    
    view: "powergraph",
    historyseries: [],
    latest_start_time: 0,
    panning: false,
    
    bargraph_initialized: false,

    // Include required javascript libraries
    include: [
        "Lib/flot/jquery.flot.min.js",
        "Lib/flot/jquery.flot.time.min.js",
        "Lib/flot/jquery.flot.selection.min.js",
        "Modules/app/lib/timeseries.js",
        "Modules/app/vis.helper.js",
        "Lib/flot/date.format.js"
    ],

    // App start function
    init: function()
    {        
        app.log("INFO","mysolarpv init");
    
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
        if (app_mysolarpv.config.solar_kwh.value && app_mysolarpv.config.use_kwh.value && app_mysolarpv.config.import_kwh.value) {
            app_mysolarpv.init_bargraph();
            $(".viewhistory").show();
        } else {
            $(".viewhistory").hide();
        }
        
        // The first view is the powergraph, we load the events for the power graph here.
        if (app_mysolarpv.view=="powergraph") app_mysolarpv.powergraph_events();
        
        // The buttons for these powergraph events are hidden when in historic mode 
        // The events are loaded at the start here and dont need to be unbinded and binded again.
        $("#mysolarpv_zoomout").click(function () {view.zoomout(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw();});
        $("#mysolarpv_zoomin").click(function () {view.zoomin(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw();});
        $('#mysolarpv_right').click(function () {view.panright(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw();});
        $('#mysolarpv_left').click(function () {view.panleft(); app_mysolarpv.reload = true; app_mysolarpv.autoupdate = false; app_mysolarpv.draw();});
        
        $('.time').click(function () {
            view.timewindow($(this).attr("time")/24.0); 
            app_mysolarpv.reload = true; 
            app_mysolarpv.autoupdate = true;
            app_mysolarpv.draw();
        });
        
        $(".balanceline").click(function () { 
            if ($(this).html()=="SHOW BALANCE") {
                app_mysolarpv.show_balance_line = 1;
                app_mysolarpv.draw();
                $(this).html("HIDE BALANCE");
            } else {
                app_mysolarpv.show_balance_line = 0;
                app_mysolarpv.draw();
                $(this).html("SHOW BALANCE");
            }
        });
        
        $(".viewhistory").click(function () { 
            if ($(this).html()=="VIEW HISTORY") {
                app_mysolarpv.view = "bargraph";
                $(".balanceline").hide();
                $(".powergraph-navigation").hide();
                $(".bargraph-navigation").show();
                
                app_mysolarpv.draw();
                setTimeout(function() { $(".viewhistory").html("POWER VIEW"); },80);
            } else {
                
                app_mysolarpv.view = "powergraph";
                $(".balanceline").show();
                $(".bargraph-navigation").hide();
                $(".powergraph-navigation").show();
                
                app_mysolarpv.draw();
                app_mysolarpv.powergraph_events();
                setTimeout(function() { $(".viewhistory").html("VIEW HISTORY"); },80);
            }
        });        
    },

    show: function() 
    {
        app.log("INFO","mysolarpv show");
        
        if (app_mysolarpv.config.solar_kwh.value && app_mysolarpv.config.use_kwh.value && app_mysolarpv.config.import_kwh.value) {
            if (!app_mysolarpv.bargraph_initialized) app_mysolarpv.init_bargraph();
            $(".viewhistory").show();
        } else {
            $(".viewhistory").hide();
        }
        
        app_mysolarpv.resize();
        
        // this.reload = true;
        app_mysolarpv.livefn();
        app_mysolarpv.live = setInterval(app_mysolarpv.livefn,5000);

    },
    
    resize: function() 
    {
        app.log("INFO","mysolarpv resize");
        
        var top_offset = 0;
        var placeholder_bound = $('#mysolarpv_placeholder_bound');
        var placeholder = $('#mysolarpv_placeholder');

        var width = placeholder_bound.width();
        var height = $(window).height()*0.55;

        if (height>width) height = width;

        placeholder.width(width);
        placeholder_bound.height(height);
        placeholder.height(height-top_offset);
        
        if (width<=500) {
            $(".electric-title").css("font-size","16px");
            $(".power-value").css("font-size","32px");
            $(".midtext").css("font-size","14px");
            $(".balanceline").hide();
            $(".vistimeW").hide();
            $(".vistimeM").hide();
            $(".vistimeY").hide();
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".midtext").css("font-size","18px");
            $(".balanceline").show();
            $(".vistimeW").show();
            $(".vistimeM").show();
            $(".vistimeY").show();
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".midtext").css("font-size","20px");
            $(".balanceline").show();
            $(".vistimeW").show();
            $(".vistimeM").show();
            $(".vistimeY").show();
        }
        app_mysolarpv.draw();
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
        if ((now-app_mysolarpv.lastupdate)>60000) app_mysolarpv.reload = true;
        app_mysolarpv.lastupdate = now;
        
        var feeds = feed.listbyid();
        var solar_now = parseInt(feeds[app_mysolarpv.config.solar.value].value);
        var use_now = parseInt(feeds[app_mysolarpv.config.use.value].value);

        if (app_mysolarpv.autoupdate) {
            var updatetime = feeds[app_mysolarpv.config.solar.value].time;
            timeseries.append("solar",updatetime,solar_now);
            timeseries.trim_start("solar",view.start*0.001);
            timeseries.append("use",updatetime,use_now);
            timeseries.trim_start("use",view.start*0.001);

            // Advance view
            var timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }
        // Lower limit for solar
        if (solar_now<10) solar_now = 0;
        
        var balance = solar_now - use_now;
        
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
        
        $(".solarnow").html(solar_now);
        $(".usenow").html(use_now);
        
        // Only redraw the graph if its the power graph and auto update is turned on
        if (app_mysolarpv.view=="powergraph" && app_mysolarpv.autoupdate) app_mysolarpv.draw();
    },
    
    draw: function ()
    {
        if (app_mysolarpv.view=="powergraph") app_mysolarpv.draw_powergraph();
        if (app_mysolarpv.view=="bargraph") app_mysolarpv.draw_bargraph();
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
            grid: {hoverable: true, clickable: true},
            selection: { mode: "x" }
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
        if (app_mysolarpv.reload) {
            app_mysolarpv.reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            timeseries.load("solar",feed.getdata(app_mysolarpv.config.solar.value,view.start,view.end,interval,0,0));
            timeseries.load("use",feed.getdata(app_mysolarpv.config.use.value,view.start,view.end,interval,0,0));
        }
        // -------------------------------------------------------------------------------------------------------
        
        var use_data = [];
        var gen_data = [];
        var bal_data = [];
        var store_data = [];
        
        var t = 0;
        var store = 0;
        var use_now = 0;
        var solar_now = 0;
        
        var total_solar_kwh = 0;
        var total_use_kwh = 0;
        var total_use_direct_kwh = 0;
        
        var datastart = timeseries.start_time("solar");
        
        console.log(timeseries.length("solar"));
        console.log(timeseries.length("use"));
        
        for (var z=0; z<timeseries.length("solar"); z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
            if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
            
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (solar_now<10) solar_now = 0;
            var balance = solar_now - use_now;
            
            if (balance>=0) total_use_direct_kwh += (use_now*interval)/(1000*3600);
            if (balance<0) total_use_direct_kwh += (solar_now*interval)/(1000*3600);
            
            var store_change = (balance * interval) / (1000*3600);
            store += store_change;
            
            total_solar_kwh += (solar_now*interval)/(1000*3600);
            total_use_kwh += (use_now*interval)/(1000*3600);
            
            var time = datastart + (1000 * interval * z);
            use_data.push([time,use_now]);
            gen_data.push([time,solar_now]);
            bal_data.push([time,balance]);
            store_data.push([time,store]);
            
            t += interval;
        }
        $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $(".total_use_kwh").html((total_use_kwh).toFixed(1));
        
        $(".total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));

        $(".total_export_kwh").html((total_solar_kwh-total_use_direct_kwh).toFixed(1));
                
        $(".total_import_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");
        $(".total_import_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        
        
        if (total_solar_kwh > 0) {
            $(".total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
            $(".total_export_prc").html((((total_solar_kwh-total_use_direct_kwh)/total_solar_kwh)*100).toFixed(0)+"%");
        } else {
            $(".total_use_direct_prc").html("-- %");
            $(".total_export_prc").html("-- %");
        }

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [
            {data:gen_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
            {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
        ];
        
        if (app_mysolarpv.show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
        
        $.plot($('#mysolarpv_placeholder'),series,options);
        $(".ajax-loader").hide();
    },

    // ------------------------------------------------------------------------------------------
    // POWER GRAPH EVENTS
    // ------------------------------------------------------------------------------------------
    powergraph_events: function() {
    
        $('#mysolarpv_placeholder').unbind("plotclick");
        $('#mysolarpv_placeholder').unbind("plothover");
        $('#mysolarpv_placeholder').unbind("plotselected");
    
        $('#mysolarpv_placeholder').bind("plotselected", function (event, ranges) {
            view.start = ranges.xaxis.from;
            view.end = ranges.xaxis.to;

            app_mysolarpv.autoupdate = false;
            app_mysolarpv.reload = true; 
            
            var now = +new Date();
            if (Math.abs(view.end-now)<30000) {
                app_mysolarpv.autoupdate = true;
            }

            app_mysolarpv.draw();
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
        app_mysolarpv.bargraph_initialized = true;
        // Fetch the start_time covering all kwh feeds - this is used for the 'all time' button
        var latest_start_time = 0;
        var solar_meta = feed.getmeta(app_mysolarpv.config.solar_kwh.value);
        var use_meta = feed.getmeta(app_mysolarpv.config.use_kwh.value);
        var import_meta = feed.getmeta(app_mysolarpv.config.import_kwh.value);
        if (solar_meta.start_time > latest_start_time) latest_start_time = solar_meta.start_time;
        if (use_meta.start_time > latest_start_time) latest_start_time = use_meta.start_time;
        if (import_meta.start_time > latest_start_time) latest_start_time = import_meta.start_time;
        app_mysolarpv.latest_start_time = latest_start_time;

        var earliest_start_time = solar_meta.start_time;
        earliest_start_time = Math.min(use_meta.start_time, earliest_start_time);
        earliest_start_time = Math.min(import_meta.start_time, earliest_start_time);
        view.first_data = earliest_start_time * 1000;

        var timeWindow = (3600000*24.0*40);
        var end = +new Date;
        var start = end - timeWindow;
        app_mysolarpv.load_bargraph(start,end);
    },
    
    load_bargraph: function(start,end) {

        var interval = 3600*24;
        var intervalms = interval * 1000;
        end = Math.ceil(end/intervalms)*intervalms;
        start = Math.floor(start/intervalms)*intervalms;
        
        // Load kWh data
        var solar_kwh_data = feed.getdataDMY(app_mysolarpv.config.solar_kwh.value,start,end,"daily");
        var use_kwh_data = feed.getdataDMY(app_mysolarpv.config.use_kwh.value,start,end,"daily");
        var import_kwh_data = feed.getdataDMY(app_mysolarpv.config.import_kwh.value,start,end,"daily");
        
        console.log(solar_kwh_data);
        console.log(use_kwh_data);
        
        app_mysolarpv.solarused_kwhd_data = [];
        app_mysolarpv.solar_kwhd_data = [];
        app_mysolarpv.use_kwhd_data = [];
        app_mysolarpv.export_kwhd_data = [];
        
        if (solar_kwh_data.length>1) {
        
        for (var day=1; day<solar_kwh_data.length; day++)
        {
            var solar_kwh = solar_kwh_data[day][1] - solar_kwh_data[day-1][1];
            if (solar_kwh_data[day][1]==null || solar_kwh_data[day-1][1]==null) solar_kwh = null;
            
            var use_kwh = use_kwh_data[day][1] - use_kwh_data[day-1][1];
            if (use_kwh_data[day][1]==null || use_kwh_data[day-1][1]==null) use_kwh = null;
            
            var import_kwh = import_kwh_data[day][1] - import_kwh_data[day-1][1];
            if (import_kwh_data[day][1]==null || import_kwh_data[day-1][1]==null) import_kwh = null;
            
            var export_kwh = solar_kwh - (use_kwh - import_kwh);
            
            if (solar_kwh!=null && use_kwh!=null & export_kwh!=null) {
                app_mysolarpv.solarused_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh - export_kwh]);
                app_mysolarpv.solar_kwhd_data.push([solar_kwh_data[day-1][0],solar_kwh]);
                app_mysolarpv.use_kwhd_data.push([use_kwh_data[day-1][0],use_kwh]);
                app_mysolarpv.export_kwhd_data.push([import_kwh_data[day-1][0],export_kwh*-1]);
            }
        }
        
        }
        
        var series = [];
        
        series.push({
            data: app_mysolarpv.use_kwhd_data,
            color: "#0699fa",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
        });
        
        series.push({
            data: app_mysolarpv.solarused_kwhd_data,
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.6, lineWidth:0}
        });
        
        series.push({
            data: app_mysolarpv.export_kwhd_data,
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
        });
        
        app_mysolarpv.historyseries = series;
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
            xaxis: { mode: "time", timezone: "browser"},
            grid: {hoverable: true, clickable: true, markings:markings},
            selection: { mode: "x" }
        }
        
        var plot = $.plot($('#mysolarpv_placeholder'),app_mysolarpv.historyseries,options);
        
		    $('#mysolarpv_placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Onsite Use & Total Use</div>");
		    $('#mysolarpv_placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Exported solar</div>");

        // Because the bargraph is only drawn once when the view is changed we attach the events at this point
        app_mysolarpv.bargraph_events();
    },

    // ------------------------------------------------------------------------------------------
    // BAR GRAPH EVENTS
    // - show bar values on hover
    // - click through to power graph
    // ------------------------------------------------------------------------------------------
    bargraph_events: function(){
    
        $('#mysolarpv_placeholder').unbind("plotclick");
        $('#mysolarpv_placeholder').unbind("plothover");
        $('#mysolarpv_placeholder').unbind("plotselected");
        $('.bargraph-viewall').unbind("click");
        
        // Show day's figures on the bottom of the page
		    $('#mysolarpv_placeholder').bind("plothover", function (event, pos, item)
        {
            if (item) {
                // console.log(item.datapoint[0]+" "+item.dataIndex);
                var z = item.dataIndex;
                
                var solar_kwhd = app_mysolarpv.solar_kwhd_data[z][1];
                var solarused_kwhd = app_mysolarpv.solarused_kwhd_data[z][1];
                var use_kwhd = app_mysolarpv.use_kwhd_data[z][1];
                var export_kwhd = app_mysolarpv.export_kwhd_data[z][1];
                var imported_kwhd = use_kwhd-solarused_kwhd;
                
                $(".total_solar_kwh").html((solar_kwhd).toFixed(1));
                $(".total_use_kwh").html((use_kwhd).toFixed(1));
                
                $(".total_use_direct_kwh").html((solarused_kwhd).toFixed(1));
                
                $(".total_export_kwh").html((export_kwhd*-1).toFixed(1));
                
                $(".total_import_prc").html(((imported_kwhd/use_kwhd)*100).toFixed(0)+"%");
                $(".total_import_kwh").html((imported_kwhd).toFixed(1));
        
                if (solar_kwhd > 0) {
                    $(".total_use_direct_prc").html(((solarused_kwhd/use_kwhd)*100).toFixed(0)+"%");
                    $(".total_export_prc").html(((export_kwhd/solar_kwhd)*100*-1).toFixed(0)+"%");
                } else {
                    $(".total_use_direct_prc").html("-- %");
                    $(".total_export_prc").html("-- %");
                }
                
            }
        });

        // Auto click through to power graph
		    $('#mysolarpv_placeholder').bind("plotclick", function (event, pos, item)
        {
            if (item && !app_mysolarpv.panning) {
                // console.log(item.datapoint[0]+" "+item.dataIndex);
                var z = item.dataIndex;
                
                view.start = app_mysolarpv.solar_kwhd_data[z][0];
                view.end = view.start + 86400*1000;

                $(".balanceline").show();
                $(".bargraph-navigation").hide();
                $(".powergraph-navigation").show();
                $(".viewhistory").html("VIEW HISTORY");
                $('#mysolarpv_placeholder').unbind("plotclick");
                $('#mysolarpv_placeholder').unbind("plothover");
                $('#mysolarpv_placeholder').unbind("plotselected");
                
                app_mysolarpv.reload = true; 
                app_mysolarpv.autoupdate = false;
                app_mysolarpv.view = "powergraph";
                
                app_mysolarpv.draw();
                app_mysolarpv.powergraph_events();
            }
        });
        
        $('#mysolarpv_placeholder').bind("plotselected", function (event, ranges) {
            var start = ranges.xaxis.from;
            var end = ranges.xaxis.to;
            app_mysolarpv.load_bargraph(start,end);
            app_mysolarpv.draw();
            app_mysolarpv.panning = true; setTimeout(function() {app_mysolarpv.panning = false; }, 100);
        });
        
        $('.bargraph-viewall').click(function () {
            var start = app_mysolarpv.latest_start_time * 1000;
            var end = +new Date;
            app_mysolarpv.load_bargraph(start,end);
            app_mysolarpv.draw();
        });
    }
}
