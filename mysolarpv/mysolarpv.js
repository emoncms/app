var datastore = {};

var app_mysolarpv = {

    solarW: false,
    useW: false,
    exportW: false,
    solar_kwh:false,
    use_kwh:false,
    export_kwh:false,
    
    live: false,
    show_balance_line: 0,
      
    reload: true,
    autoupdate: true,
    
    lastupdate: 0,
    
    view: "powergraph",
    historyseries: [],

    // Include required javascript libraries
    include: [
        "Modules/app/lib/feed.js",
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
        var feeds = feed.listbyname();
        
        // AUTOMATIC FEED SELECTION BY NAMING CONVENTION
        
        // Power feeds
        if (feeds['use']!=undefined)
            app_mysolarpv.useW = feeds['use'].id;
        if (feeds['solar']!=undefined)
            app_mysolarpv.solarW = feeds['solar'].id;        
        if (feeds['export']!=undefined)
            app_mysolarpv.exportW = feeds['export'].id;
            
        // Cumulative kWh feeds
        if (feeds['use_kwh']!=undefined)
            app_mysolarpv.use_kwh = feeds['use_kwh'].id;
        if (feeds['solar_kwh']!=undefined)
            app_mysolarpv.solar_kwh = feeds['solar_kwh'].id;        
        if (feeds['export_kwh']!=undefined)
            app_mysolarpv.export_kwh = feeds['export_kwh'].id;
        
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
        app_mysolarpv.init_bargraph();
        
        var placeholder = $('#mysolarpv_placeholder');
        
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
        
        $("#balanceline").click(function () { 
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
        
        $("#viewhistory").click(function () { 
            if ($(this).html()=="VIEW HISTORY") {
                app_mysolarpv.view = "bargraph";
                app_mysolarpv.draw();
                $(this).html("POWER VIEW");
            } else {
                
                app_mysolarpv.view = "powergraph";
                app_mysolarpv.draw();
                $(this).html("VIEW HISTORY");
            }
        });
        
        placeholder.bind("plotselected", function (event, ranges) {
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

        $(window).resize(function(){
            app_mysolarpv.resize();
            app_mysolarpv.draw();
        });
    },

    show: function() 
    {
        // this.reload = true;
        this.livefn();
        this.live = setInterval(this.livefn,5000);
        
        $("body").css("background-color","#222");
        
        $(window).ready(function(){
            $("#footer").css('background-color','#181818');
            $("#footer").css('color','#999');
        });

        app_mysolarpv.resize();
        app_mysolarpv.draw();
        // app_mysolarpv.draw_bargraph();
    },
    
    resize: function() 
    {
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
            $(".power-value").css("padding-top","12px");
            $(".power-value").css("padding-bottom","8px");
            $(".midtext").css("font-size","14px");
            $("#balanceline").hide();
            $("#vistimeW").hide();
            $("#vistimeM").hide();
            $("#vistimeY").hide();
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".power-value").css("padding-top","22px");
            $(".power-value").css("padding-bottom","12px");
            $(".midtext").css("font-size","18px");
            $("#balanceline").show();
            $("#vistimeW").show();
            $("#vistimeM").show();
            $("#vistimeY").show();
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".power-value").css("padding-top","40px");
            $(".power-value").css("padding-bottom","20px");
            $(".midtext").css("font-size","20px");
            $("#balanceline").show();
            $("#vistimeW").show();
            $("#vistimeM").show();
            $("#vistimeY").show();
        }
        
        var bargraph_bound = $('#mysolarpv_bargraph_bound');
        var bargraph = $('#mysolarpv_bargraph');

        var width = bargraph_bound.width();
        var height = $(window).height()*0.55;

        if (height>width) height = width;

        bargraph.width(width);
        bargraph_bound.height(height);
        bargraph.height(height-top_offset);
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
        var solar_now = parseInt(feeds[app_mysolarpv.solarW].value);
        var use_now = parseInt(feeds[app_mysolarpv.useW].value);
        
        if (app_mysolarpv.autoupdate) {
            timeseries.append("solar",feeds[app_mysolarpv.solarW].time,solar_now);
            timeseries.trim_start("solar",view.start*0.001);
            timeseries.append("use",feeds[app_mysolarpv.useW].time,use_now);
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
            $("#balance-label").html("PERFECT BALANCE");
            $("#balance").html("");
        }
        
        if (balance>0) {
            $("#balance-label").html("EXPORTING");
            $("#balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        if (balance<0) {
            $("#balance-label").html("IMPORTING");
            $("#balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        $("#solarnow").html(solar_now);
        $("#usenow").html(use_now);
        
        app_mysolarpv.draw();
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
        if (interval<1) interval = 1;

        var npoints = parseInt((view.end-view.start)/(interval*1000));
        
        // -------------------------------------------------------------------------------------------------------
        // LOAD DATA ON INIT OR RELOAD
        // -------------------------------------------------------------------------------------------------------
        if (app_mysolarpv.reload) {
            app_mysolarpv.reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            timeseries.load("solar",feed.getdata(app_mysolarpv.solarW,view.start,view.end,interval,0,0));
            timeseries.load("use",feed.getdata(app_mysolarpv.useW,view.start,view.end,interval,0,0));
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
        
        var datastart = view.start;
        for (var z in datastore) {
            datastart = datastore[z].data[0][0];
            npoints = datastore[z].data.length;
        }
        
        for (var z=0; z<npoints; z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            if (datastore["solar"].data[z][1]!=null) solar_now = datastore["solar"].data[z][1];   
            if (datastore["use"].data[z][1]!=null) use_now = datastore["use"].data[z][1];  
            
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
        $("#total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $("#total_use_kwh").html((total_use_kwh).toFixed(1));
        
        $("#total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
        $("#total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));
        
        $("#total_import_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");
        $("#total_import_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [
            {data:gen_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
            {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
        ];
        
        if (app_mysolarpv.show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
        
        $.plot($('#mysolarpv_placeholder'),series,options);
    },
    
    init_bargraph: function() {

        var timeWindow = (3600000*24.0*30);
        var end = +new Date;
        var start = end - timeWindow;
        var interval = 3600*24;
        var intervalms = interval * 1000;
        end = Math.ceil(end/intervalms)*intervalms;
        start = Math.floor(start/intervalms)*intervalms;
        
        var solar_kwh_data = feed.getdata(app_mysolarpv.solar_kwh,start,end,interval,0,0);
        var use_kwh_data = feed.getdata(app_mysolarpv.use_kwh,start,end,interval,0,0);
        var export_kwh_data = feed.getdata(app_mysolarpv.export_kwh,start,end,interval,0,0);
        
        app_mysolarpv.solarused_kwhd_data = [];
        app_mysolarpv.solar_kwhd_data = [];
        app_mysolarpv.use_kwhd_data = [];
        app_mysolarpv.export_kwhd_data = [];
        
        for (var day=1; day<solar_kwh_data.length; day++)
        {
            var solar_kwh = solar_kwh_data[day][1] - solar_kwh_data[day-1][1];
            if (solar_kwh_data[day][1]==null || solar_kwh_data[day-1][1]==null) solar_kwh = null;
            
            var use_kwh = use_kwh_data[day][1] - use_kwh_data[day-1][1];
            if (use_kwh_data[day][1]==null || use_kwh_data[day-1][1]==null) use_kwh = null;
            
            var export_kwh = export_kwh_data[day][1] - export_kwh_data[day-1][1];
            if (export_kwh_data[day][1]==null || export_kwh_data[day-1][1]==null) export_kwh = null;
            
            if (solar_kwh!=null && use_kwh!=null & export_kwh!=null) {
                app_mysolarpv.solarused_kwhd_data.push([solar_kwh_data[day][0],solar_kwh - export_kwh]);
                app_mysolarpv.solar_kwhd_data.push([solar_kwh_data[day][0],solar_kwh]);
                app_mysolarpv.use_kwhd_data.push([use_kwh_data[day][0],use_kwh]);
                app_mysolarpv.export_kwhd_data.push([export_kwh_data[day][0],export_kwh*-1]);
            }
        }
        
        var series = [];
        
        series.push({
            data: app_mysolarpv.solarused_kwhd_data,
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth:0}
        });

        series.push({
            data: app_mysolarpv.use_kwhd_data,
            color: "#0699fa",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
        });
        
        series.push({
            data: app_mysolarpv.export_kwhd_data,
            color: "#dccc1f",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 0.8, lineWidth:0}
        });
        
        app_mysolarpv.historyseries = series;
    },
    
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
        
		    $('#mysolarpv_placeholder').append("<div style='position:absolute;left:50px;top:30px;color:#666;font-size:12px'><b>Above:</b> Self-consumption & Consumption</div>");
		    $('#mysolarpv_placeholder').append("<div style='position:absolute;left:50px;bottom:50px;color:#666;font-size:12px'><b>Below:</b> Exported solar</div>");

		    $('#mysolarpv_placeholder').bind("plothover", function (event, pos, item)
        {
            if (item) {
                console.log(item.datapoint[0]+" "+item.dataIndex); 
                
                var z = item.dataIndex;
                
                var solar_kwhd = app_mysolarpv.solar_kwhd_data[z][1];
                var solarused_kwhd = app_mysolarpv.solarused_kwhd_data[z][1];
                var use_kwhd = app_mysolarpv.use_kwhd_data[z][1];
                var export_kwhd = app_mysolarpv.export_kwhd_data[z][1];
                var imported_kwhd = use_kwhd-solarused_kwhd;
                
                $("#total_solar_kwh").html((solar_kwhd).toFixed(1));
                $("#total_use_kwh").html((use_kwhd).toFixed(1));
                
                $("#total_use_direct_prc").html(((solarused_kwhd/use_kwhd)*100).toFixed(0)+"%");
                $("#total_use_direct_kwh").html((solarused_kwhd).toFixed(1));
                
                $("#total_export_kwh").html((export_kwhd*-1).toFixed(1));
                $("#total_export_prc").html(((export_kwhd/solar_kwhd)*100*-1).toFixed(0)+"%");
                
                $("#total_import_prc").html(((imported_kwhd/use_kwhd)*100).toFixed(0)+"%");
                $("#total_import_kwh").html((imported_kwhd).toFixed(1));
                
            }
        });
    }
    
}
