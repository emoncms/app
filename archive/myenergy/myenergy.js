var datastore = {};

var app_myenergy = {

    average_wind_power: 2630, // MW - this is the average UK wind power output in MW between March 2015 and March 2016
                             // it is used to scale the share of UK Wind power

    config: {
        "use":{"type":"feed", "autoname":"use", "engine":"5,6", "description":"House or building use in watts"},
        "solar":{"optional":true, "type":"feed", "autoname":"solar", "engine":"5,6", "description":"Solar pv generation in watts"},
        "windkwh":{"type":"value", "default":2000, "name": "kWh Wind", "description":"kWh of wind energy bought annually"}
    },
    
    live: false,
    show_balance_line: 1,
    
    use_data: [],
    solar_data: [],
    wind_data: [],
      
    reload: true,
    autoupdate: true,
    
    lastupdate: 0,
    
    annual_wind_gen: 3300,
    capacity_factor: 0.4,

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
        app.log("INFO","myenergy init");
        
        my_wind_cap = ((annual_wind_gen / 365) / 0.024) / capacity_factor;
        this.my_wind_cap = ((this.annual_wind_gen / 365) / 0.024) / this.capacity_factor;
        
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
        var placeholder = $('#myenergy_placeholder');
        
        $("#myenergy_zoomout").click(function () {view.zoomout(); reload = true; autoupdate = false; draw();});
        $("#myenergy_zoomin").click(function () {view.zoomin(); reload = true; autoupdate = false; draw();});
        $('#myenergy_right').click(function () {view.panright(); reload = true; autoupdate = false; draw();});
        $('#myenergy_left').click(function () {view.panleft(); reload = true; autoupdate = false; draw();});
        $('.time').click(function () {
            view.timewindow($(this).attr("time")/24.0); 
            reload = true; 
            autoupdate = true;
            draw();
        });
        
        $(".balanceline").click(function () { 
            if ($(this).html()=="Show balance") {
                show_balance_line = 1;
                draw();
                $(this).html("Hide balance");
            } else {
                show_balance_line = 0;
                draw();
                $(this).html("Show balance");
            }
        });
        
        placeholder.bind("plotselected", function (event, ranges) {
            view.start = ranges.xaxis.from;
            view.end = ranges.xaxis.to;

            autoupdate = false;
            reload = true; 
            
            var now = +new Date();
            if (Math.abs(view.end-now)<30000) {
                autoupdate = true;
            }

            draw();
        });
    },

    show: function() 
    {
        app.log("INFO","myenergy show");
        // this.reload = true;
        resize();
        draw();
        
        this.livefn();
        this.live = setInterval(this.livefn,5000);
    },
    
    resize: function() 
    {
        app.log("INFO","myenergy resize");
        
        var top_offset = 0;
        var placeholder_bound = $('#myenergy_placeholder_bound');
        var placeholder = $('#myenergy_placeholder');

        var width = placeholder_bound.width();
        var height = $(window).height()*0.55;

        if (height>width) height = width;

        placeholder.width(width);
        placeholder_bound.height(height);
        placeholder.height(height-top_offset);
        
        if (width<=500) {
            $(".electric-title").css("font-size","16px");
            $(".power-value").css("font-size","38px");
            $(".midtext").css("font-size","14px");
            $(".balanceline").hide();
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".midtext").css("font-size","18px");
            $(".balanceline").show();
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".midtext").css("font-size","20px");
            $(".balanceline").show();
        }
        
        draw();
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
        if ((now-lastupdate)>60000) reload = true;
        lastupdate = now;
        
        var feeds = feed.listbyid();
        var solar_now = 0; 
        if (config.solar.value) 
            solar_now = parseInt(feeds[config.solar.value].value);
            
        var use_now = parseInt(feeds[config.use.value].value);

        var gridwind = feed.getvalueremote(67088);
        var average_power = ((config.windkwh.value/365.0)/0.024);
        var wind_now = Math.round((average_power / average_wind_power) * gridwind);
        
        if (autoupdate) {
            var updatetime = feeds[config.use.value].time;
            
            if (config.solar.value) {
                timeseries.append("solar",updatetime,solar_now);
                timeseries.trim_start("solar",view.start*0.001);
            }
                
            timeseries.append("use",updatetime,use_now);
            timeseries.trim_start("use",view.start*0.001);
            timeseries.append("remotewind",updatetime,gridwind);
            timeseries.trim_start("remotewind",view.start*0.001);
            
            var timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }
        
        // Lower limit for solar
        if (solar_now<10) solar_now = 0;
        var gen_now = solar_now + wind_now;
        var balance = gen_now - use_now;
        
        if (balance==0) {
            $(".balance-label").html("");
            $(".balance").html("");
        }
        
        if (balance>0) {
            $(".balance-label").html("EXCESS:");
            $(".balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        if (balance<0) {
            $(".balance-label").html("BACKUP:");
            $(".balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        $(".gennow").html(Math.round(gen_now));
        $(".solarnow").html(Math.round(solar_now));
        $(".windnow").html(Math.round(wind_now));
        $(".usenow").html(Math.round(use_now));
        
        if (autoupdate) draw();
    },
    
    draw: function ()
    {
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
        var intervalms = interval * 1000;

        view.start = Math.ceil(view.start/intervalms)*intervalms;
        view.end = Math.ceil(view.end/intervalms)*intervalms;

        var npoints = parseInt((view.end-view.start)/(interval*1000));
        
        // -------------------------------------------------------------------------------------------------------
        // LOAD DATA ON INIT OR RELOAD
        // -------------------------------------------------------------------------------------------------------
        if (reload) {
            reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            
            var feedid = config.solar.value;
            if (feedid!=false)
                timeseries.load("solar",feed.getdata(feedid,view.start,view.end,interval,0,0));
        
            var feedid = config.use.value;
            timeseries.load("use",feed.getdata(feedid,view.start,view.end,interval,0,0));
            
            timeseries.load("remotewind",feed.getdataremote(67088,view.start,view.end,interval));          
        }
        // -------------------------------------------------------------------------------------------------------
        
        var use_data = [];
        var solar_data = [];
        var wind_data = [];
        var bal_data = [];
        var store_data = [];
        
        var t = 0;
        var store = 0;
        var use_now = 0;
        var solar_now = 0;
        var wind_now = 0;
        
        var total_solar_kwh = 0;
        var total_wind_kwh = 0;
        var total_use_kwh = 0;
        var total_use_direct_kwh = 0;
        
        var datastart = timeseries.start_time("use");
        for (var z=0; z<timeseries.length("use"); z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            if (config.solar.value && timeseries.value("solar",z)!=null) 
                solar_now = timeseries.value("solar",z);  
            if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
            
            if (timeseries.value("remotewind",z)!=null) {
                var gridwind = timeseries.value("remotewind",z);
                var average_power = ((config.windkwh.value/365.0)/0.024);
                wind_now = Math.round((average_power / average_wind_power) * gridwind);
            }
            
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (solar_now<10) solar_now = 0;
            
            var gen_now = solar_now + wind_now;
            
            var balance = gen_now - use_now;
            
            if (balance>=0) total_use_direct_kwh += (use_now*interval)/(1000*3600);
            if (balance<0) total_use_direct_kwh += (gen_now*interval)/(1000*3600);
            
            var store_change = (balance * interval) / (1000*3600);
            store += store_change;
            
            total_wind_kwh += (wind_now*interval)/(1000*3600);
            total_solar_kwh += (solar_now*interval)/(1000*3600);
            total_use_kwh += (use_now*interval)/(1000*3600);
            
            var time = datastart + (1000 * interval * z);
            use_data.push([time,use_now]);
            solar_data.push([time,wind_now+solar_now]);
            wind_data.push([time,wind_now]);
            bal_data.push([time,balance]);
            store_data.push([time,store]);
            
            t += interval;
        }
        $(".total_wind_kwh").html(total_wind_kwh.toFixed(1));
        $(".total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $(".total_use_kwh").html((total_use_kwh).toFixed(1));
        
        $(".total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
        $(".total_use_via_store_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");

        $(".total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));
        $(".total_use_via_store_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [
            {data:solar_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
            {data:wind_data,color: "#2ed52e", lines:{lineWidth:0, fill:1.0}},
            {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
        ];
        
        if (show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
        
        $.plot($('#myenergy_placeholder'),series,options);
        $(".ajax-loader").hide();
    }
}
