var datastore = {};

var app_mysolarpv = {

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
    init: function()
    {
        if (app.config["mysolarpv"]!=undefined) {
            this.solarpower = app.config["mysolarpv"].solarpower;
            this.housepower = app.config["mysolarpv"].housepower;
            
            if (typeof(this.solarpower)=="string") this.solarpower = this.solarpower.split(",");
            if (typeof(this.housepower)=="string") this.housepower = this.housepower.split(",");
        } else {
            // Auto scan by feed names
            var feeds = app_mysolarpv.getfeedsbyid();
            for (z in feeds)
            {
                var name = feeds[z].name.toLowerCase();
                
                if (name.indexOf("house_power")!=-1) {
                    app_mysolarpv.housepower = [z];
                }
                
                if (name.indexOf("solar_power")!=-1) {
                    app_mysolarpv.solarpower = [z];
                }
            }
        }
        
        var timeWindow = (3600000*6.0*1);
        view.end = +new Date;
        view.start = view.end - timeWindow;
        
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
            if ($(this).html()=="Show balance") {
                app_mysolarpv.show_balance_line = 1;
                app_mysolarpv.draw();
                $(this).html("Hide balance");
            } else {
                app_mysolarpv.show_balance_line = 0;
                app_mysolarpv.draw();
                $(this).html("Show balance");
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

        $("#mysolarpv-openconfig").click(function(){
            $("#mysolarpv-solarpower").val(app_mysolarpv.solarpower);
            $("#mysolarpv-housepower").val(app_mysolarpv.housepower);
            $("#mysolarpv-config").show();
        });
        
        $("#mysolarpv-configsave").click(function() {
            $("#mysolarpv-config").hide();
            
            var solarfeedids = $("#mysolarpv-solarpower").val().split(",");
            var housefeedids = $("#mysolarpv-housepower").val().split(",");
            app_mysolarpv.solarpower = solarfeedids;
            app_mysolarpv.housepower = housefeedids;
            
            // Save config to db
            var config = app.config;
            if (config==false) config = {};
            config["mysolarpv"] = {
                "solarpower": app_mysolarpv.solarpower,
                "housepower": app_mysolarpv.housepower
            };
            app.setconfig(config);
            app_mysolarpv.reload = true;
        });
 
        $(window).resize(function(){
            app_mysolarpv.resize();
            app_mysolarpv.draw();
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
        app_mysolarpv.draw_bargraph();
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
        
        // Fetch latest feed data
        var feeds = app_mysolarpv.getfeedsbyid();
        
        // Consumption feeds
        var use_now = 0;
        for (var i in app_mysolarpv.housepower) {
            var feedid = app_mysolarpv.housepower[i];
            if (feeds[feedid]!=undefined) {
                use_now += parseInt(feeds[feedid].value);
                if (app_mysolarpv.autoupdate) {
                    app_mysolarpv.timeseries_append("f"+feedid,feeds[feedid].time,parseInt(feeds[feedid].value));
                    app_mysolarpv.timeseries_trim_start("f"+feedid,view.start*0.001);
                }
            }
        }
        
        // Solar feeds
        var solar_now = 0;
        for (var i in app_mysolarpv.solarpower) {
            var feedid = app_mysolarpv.solarpower[i];
            if (feeds[feedid]!=undefined) {
                solar_now += parseInt(feeds[feedid].value);
                if (app_mysolarpv.autoupdate) {
                    console.log(feeds[feedid].time+" "+feeds[feedid].value);
                    app_mysolarpv.timeseries_append("f"+feedid,feeds[feedid].time,parseInt(feeds[feedid].value));
                    app_mysolarpv.timeseries_trim_start("f"+feedid,view.start*0.001);
                }
            }
        }
        
        // Advance view
        if (app_mysolarpv.autoupdate) {
            var timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }
        
        console.log("vs-ve: "+view.start+" "+view.end);
        
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
            
            for (var i in app_mysolarpv.solarpower) {
                var feedid = app_mysolarpv.solarpower[i];
                app_mysolarpv.timeseries_load("f"+feedid,this.getdata(feedid,view.start,view.end,interval));
            }
            
            for (var i in app_mysolarpv.housepower) {
                var feedid = app_mysolarpv.housepower[i];
                app_mysolarpv.timeseries_load("f"+feedid,this.getdata(feedid,view.start,view.end,interval));
            }                
        }
        // -------------------------------------------------------------------------------------------------------
        
        var use_data = [];
        var gen_data = [];
        var bal_data = [];
        var store_data = [];
        
        var t = 0;
        var store = 0;
        var use = 0;
        var mysolar = 0;
        
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
            var tmpsolar = null;
            for (var i in app_mysolarpv.solarpower) {
                var feedid = app_mysolarpv.solarpower[i];
                if (datastore["f"+feedid].data[z]!=undefined && datastore["f"+feedid].data[z][1]!=null) {
                    if (tmpsolar==null) tmpsolar = 0;
                    tmpsolar += datastore["f"+feedid].data[z][1];   
                }
            }
            if (tmpsolar!=null) mysolar = tmpsolar;
            
            var tmpuse = null;
            for (var i in app_mysolarpv.housepower) {
                var feedid = app_mysolarpv.housepower[i];
                if (datastore["f"+feedid].data[z]!=undefined && datastore["f"+feedid].data[z][1]!=null) {
                    if (tmpuse==null) tmpuse = 0;
                    tmpuse += datastore["f"+feedid].data[z][1];   
                }
            }
            if (tmpuse!=null) use = tmpuse;
            
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (mysolar<10) mysolar = 0;
            var balance = mysolar - use;
            
            if (balance>=0) total_use_direct_kwh += (use*interval)/(1000*3600);
            if (balance<0) total_use_direct_kwh += (mysolar*interval)/(1000*3600);
            
            var store_change = (balance * interval) / (1000*3600);
            store += store_change;
            
            total_solar_kwh += (mysolar*interval)/(1000*3600);
            total_use_kwh += (use*interval)/(1000*3600);
            
            var time = datastart + (1000 * interval * z);
            use_data.push([time,use]);
            gen_data.push([time,mysolar]);
            bal_data.push([time,balance]);
            store_data.push([time,store]);
            
            t += interval;
        }
        $("#total_solar_kwh").html(total_solar_kwh.toFixed(1));
        $("#total_use_kwh").html((total_use_kwh).toFixed(1));
        
        $("#total_use_direct_prc").html(Math.round(100*total_use_direct_kwh/total_use_kwh)+"%");
        $("#total_use_via_store_prc").html(Math.round(100*(1-(total_use_direct_kwh/total_use_kwh)))+"%");

        $("#total_use_direct_kwh").html((total_use_direct_kwh).toFixed(1));
        $("#total_use_via_store_kwh").html((total_use_kwh-total_use_direct_kwh).toFixed(1));        

        options.xaxis.min = view.start;
        options.xaxis.max = view.end;
        
        var series = [
            {data:gen_data,color: "#dccc1f", lines:{lineWidth:0, fill:1.0}},
            {data:use_data,color: "#0699fa",lines:{lineWidth:0, fill:0.8}}
        ];
        
        if (app_mysolarpv.show_balance_line) series.push({data:store_data,yaxis:2, color: "#888"});
        
        $.plot($('#mysolarpv_placeholder'),series,options);
    },
    
    draw_bargraph: function() {
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
    
    getfeedsbyid: function()
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var feeds = {};
        $.ajax({                                      
            url: path+"feed/list.json"+apikeystr,
            dataType: 'json',
            async: false,                      
            success: function(data_in) { feeds = data_in; } 
        });
        
        var byid = {};
        for (z in feeds) byid[feeds[z].id] = feeds[z];
        return byid;
    },
    
    getdata: function(id,start,end,interval)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing=0&limitinterval=0",
            dataType: 'json',
            async: false,                      
            success: function(data_in) { data = data_in; } 
        });
        return data;
    },
    
    // -------------------------------------------------------------------------------------------------------
    // IN BROWSER TIMESERIES DATA STORE
    // with features for appending a new datapoint and triming the old data in order to create a moving view
    // -------------------------------------------------------------------------------------------------------
    
    timeseries_load: function (name,data)
    {
        datastore[name] = {};
        datastore[name].data = data;
        datastore[name].start = datastore[name].data[0][0] * 0.001;
        datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
    },
    
    timeseries_append: function (name,time,value)
    {
        if (datastore[name]==undefined) return false;
        
        var interval = datastore[name].interval;
        var start = datastore[name].start;
        
        // 1. align to timeseries interval
        time = Math.floor(time/interval)*interval;
        // 2. calculate new data point position
        var pos = (time - start) / interval;
        // 3. get last position from data length
        var last_pos = datastore[name].data.length - 1;
        
        // if the datapoint is newer than the last:
        if (pos > last_pos)
        {
            var npadding = (pos - last_pos)-1;
            
            // padding
            if (npadding>0 && npadding<12) {
                for (var padd = 0; padd<npadding; padd++)
                {
                    var padd_time = start + ((last_pos+padd+1) * interval);
                    datastore[name].data.push([padd_time*1000,null]);
                }
            }
            
            // insert datapoint
            datastore[name].data.push([time*1000,value]);
        }
    },
    
    timeseries_trim_start: function (name,newstart)
    {
        if (datastore[name]==undefined) return false;
        
        var interval = datastore[name].interval;
        var start = datastore[name].start;
        
        newstart = Math.floor(newstart/interval)*interval;
        var pos = (newstart - start) / interval;
        var tmpdata = [];
        
        if (pos>=0) {
            for (var p=pos; p<datastore[name].data.length; p++) {
                var t = datastore[name].data[p][0];
                var v = datastore[name].data[p][1];
                tmpdata.push([t,v]);
            }
            datastore[name].data = tmpdata;
            datastore[name].start = datastore[name].data[0][0] * 0.001;
            datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
        }
    }
}
