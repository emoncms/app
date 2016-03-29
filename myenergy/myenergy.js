var datastore = {};

var app_myenergy = {

    average_wind_power: 2630, // MW - this is the average UK wind power output in MW between March 2015 and March 2016
                             // it is used to scale the share of UK Wind power

    config: {
        "use":{"type":"feed", "autoname":"use", "engine":5, "description":"House or building use in watts"},
        "solar":{"type":"feed", "autoname":"solar", "engine":5, "description":"Solar pv generation in watts"},
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
        app_myenergy.my_wind_cap = ((app_myenergy.annual_wind_gen / 365) / 0.024) / app_myenergy.capacity_factor;
                
        this.my_wind_cap = ((this.annual_wind_gen / 365) / 0.024) / this.capacity_factor;
        
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
        var placeholder = $('#myenergy_placeholder');
        
        $("#myenergy_zoomout").click(function () {view.zoomout(); app_myenergy.reload = true; app_myenergy.autoupdate = false; app_myenergy.draw();});
        $("#myenergy_zoomin").click(function () {view.zoomin(); app_myenergy.reload = true; app_myenergy.autoupdate = false; app_myenergy.draw();});
        $('#myenergy_right').click(function () {view.panright(); app_myenergy.reload = true; app_myenergy.autoupdate = false; app_myenergy.draw();});
        $('#myenergy_left').click(function () {view.panleft(); app_myenergy.reload = true; app_myenergy.autoupdate = false; app_myenergy.draw();});
        $('.time').click(function () {
            view.timewindow($(this).attr("time")/24.0); 
            app_myenergy.reload = true; 
            app_myenergy.autoupdate = true;
            app_myenergy.draw();
        });
        
        $("#balanceline").click(function () { 
            if ($(this).html()=="Show balance") {
                app_myenergy.show_balance_line = 1;
                app_myenergy.draw();
                $(this).html("Hide balance");
            } else {
                app_myenergy.show_balance_line = 0;
                app_myenergy.draw();
                $(this).html("Show balance");
            }
        });
        
        placeholder.bind("plotselected", function (event, ranges) {
            view.start = ranges.xaxis.from;
            view.end = ranges.xaxis.to;

            app_myenergy.autoupdate = false;
            app_myenergy.reload = true; 
            
            var now = +new Date();
            if (Math.abs(view.end-now)<30000) {
                app_myenergy.autoupdate = true;
            }

            app_myenergy.draw();
        });
 
        $(window).resize(function(){
            app_myenergy.resize();
            app_myenergy.draw();
        });
    },

    show: function() 
    {
        // this.reload = true;
        this.livefn();
        this.live = setInterval(this.livefn,5000);

        app_myenergy.resize();
        app_myenergy.draw();
    },
    
    resize: function() 
    {
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
            $(".power-value").css("padding-top","12px");
            $(".power-value").css("padding-bottom","8px");
            $(".midtext").css("font-size","14px");
            $("#balanceline").hide();
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".power-value").css("padding-top","22px");
            $(".power-value").css("padding-bottom","12px");
            $(".midtext").css("font-size","18px");
            $("#balanceline").show();
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".power-value").css("padding-top","40px");
            $(".power-value").css("padding-bottom","20px");
            $(".midtext").css("font-size","20px");
            $("#balanceline").show();
        }
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
        if ((now-app_myenergy.lastupdate)>60000) app_myenergy.reload = true;
        app_myenergy.lastupdate = now;
        
        var feeds = feed.listbyid();
        var solar_now = parseInt(feeds[app_myenergy.config.solar.value].value);
        var use_now = parseInt(feeds[app_myenergy.config.use.value].value);

        var gridwind = app_myenergy.getvalueremote(67088);
        var average_power = ((app_myenergy.config.windkwh.value/365.0)/0.024);
        var wind_now = Math.round((average_power / app_myenergy.average_wind_power) * gridwind);
        
        if (app_myenergy.autoupdate) {
            timeseries.append("solar",feeds[app_myenergy.config.solar.value].time,solar_now);
            timeseries.trim_start("solar",view.start*0.001);
            timeseries.append("use",feeds[app_myenergy.config.use.value].time,use_now);
            timeseries.trim_start("use",view.start*0.001);

            timeseries.append("remotewind",now,gridwind);
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
            $("#balance-label").html("");
            $("#balance").html("");
        }
        
        if (balance>0) {
            $("#balance-label").html("EXESS:");
            $("#balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        if (balance<0) {
            $("#balance-label").html("BACKUP:");
            $("#balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        $("#gennow").html(Math.round(gen_now));
        $("#solarnow").html(Math.round(solar_now));
        $("#windnow").html(Math.round(wind_now));
        
        $("#usenow").html(use_now);
        
        if (app_myenergy.autoupdate) app_myenergy.draw();
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
        if (interval<10) interval = 10;

        var npoints = parseInt((view.end-view.start)/(interval*1000));
        
        // -------------------------------------------------------------------------------------------------------
        // LOAD DATA ON INIT OR RELOAD
        // -------------------------------------------------------------------------------------------------------
        if (app_myenergy.reload) {
            app_myenergy.reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            
            var feedid = app_myenergy.config.solar.value;
            timeseries.load("solar",feed.getdata(feedid,view.start,view.end,interval,0,0));
        
            var feedid = app_myenergy.config.use.value;
            timeseries.load("use",feed.getdata(feedid,view.start,view.end,interval,0,0));
            
            timeseries.load("remotewind",this.getdataremote(67088,view.start,view.end,interval));          
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
        
        var datastart = view.start;
        // for (var z in datastore) {
        //   npoints = datastore[z].data.length;
        //   if (npoints>0)
        //       datastart = datastore[z].data[0][0];
        //}
        
        for (var z=0; z<npoints; z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            if (timeseries.value("solar",z)!=null) solar_now = timeseries.value("solar",z);  
            if (timeseries.value("use",z)!=null) use_now = timeseries.value("use",z);
            
            if (timeseries.value("remotewind",z)!=null) {
                var gridwind = timeseries.value("remotewind",z);
                var average_power = ((app_myenergy.config.windkwh.value/365.0)/0.024);
                wind_now = Math.round((average_power / app_myenergy.average_wind_power) * gridwind);
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
        $("#total_wind_kwh").html(total_wind_kwh.toFixed(1));
        $("#total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $("#total_use_kwh").html((total_use_kwh).toFixed(1));
        
        $("#total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
        $("#total_use_via_store_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");

        $("#total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));
        $("#total_use_via_store_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [
            {data:solar_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
            {data:wind_data,color: "#2ed52e", lines:{lineWidth:0, fill:1.0}},
            {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
        ];
        
        if (app_myenergy.show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
        
        $.plot($('#myenergy_placeholder'),series,options);
    },
    
    getdataremote: function(id,start,end,interval)
    {   
        var data = [];
        $.ajax({                                      
            url: path+"app/dataremote.json",
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing=0&limitinterval=0",
            dataType: 'json',
            async: false,                      
            success: function(data_in) { data = data_in; } 
        });
        return data;
    },
    
    getvalueremote: function(id)
    {   
        var value = 0;
        $.ajax({                                      
            url: path+"app/valueremote.json",                       
            data: "id="+id, dataType: 'text', async: false,                      
            success: function(data_in) {
                value = data_in;
            } 
        });
        return value;
    }
}
