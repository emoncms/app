var datastore = {};

var app_myenergy = {

    solarpower: false,
    housepower: false,
    
    live: false,
    show_balance_line: 1,
    
    house_data: [],
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
        "Modules/app/vis.helper.js",
        "Lib/flot/date.format.js"
    ],

    // App start function
    init: function()
    {
        app_myenergy.my_wind_cap = ((app_myenergy.annual_wind_gen / 365) / 0.024) / app_myenergy.capacity_factor;
        
        if (app.config["myenergy"]!=undefined) {
            this.annual_wind_gen = 1*app.config["myenergy"].annualwindgen;
            this.solarpower = app.config["myenergy"].solarpower;
            this.housepower = app.config["myenergy"].housepower;
        } else {
            // Auto scan by feed names
            var feeds = app_myenergy.getfeedsbyid();
            for (z in feeds)
            {
                var name = feeds[z].name.toLowerCase();
                
                if (name.indexOf("house_power")!=-1) {
                    app_myenergy.housepower = [z];
                }
                
                if (name.indexOf("solar_power")!=-1) {
                    app_myenergy.solarpower = [z];
                }
            }
        }
        
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

        $("#myenergy-openconfig").click(function(){
            $("#myenergy-solarpower").val(app_myenergy.solarpower);
            $("#myenergy-housepower").val(app_myenergy.housepower);
            
            $("#myenergy-annualwind").val(app_myenergy.annual_wind_gen);
            $("#myenergy-windcap").html(Math.round(app_myenergy.my_wind_cap)+"W");
            $("#myenergy-prc3mw").html((100*app_myenergy.my_wind_cap / 5000000).toFixed(3));
            
            $("#myenergy-config").show();
            
        });
        
        $("#myenergy-configsave").click(function() {
            $("#myenergy-config").hide();
            app_myenergy.annual_wind_gen = $("#myenergy-annualwind").val();
            var solarfeedids = $("#myenergy-solarpower").val().split(",");
            var housefeedids = $("#myenergy-housepower").val().split(",");
            app_myenergy.solarpower = solarfeedids;
            app_myenergy.housepower = housefeedids;
            app_myenergy.my_wind_cap = ((app_myenergy.annual_wind_gen / 365) / 0.024) / app_myenergy.capacity_factor;
            
            // Save config to db
            var config = app.config;
            if (config==false) config = {};
            config["myenergy"] = {
                "annualwindgen": app_myenergy.annual_wind_gen,
                "solarpower": app_myenergy.solarpower,
                "housepower": app_myenergy.housepower
            };
            app.setconfig(config);
            app_myenergy.reload = true;
        });
 
        $(window).resize(function(){
            app_myenergy.resize();
            app_myenergy.draw();
        });
        
        /*
        $(document).on("socketio_msg",function( event, msg ) {
            var use_now = 1*nodes['6'].values[1] + 1*nodes['6'].values[2];
            var solar_now = 1*nodes['10'].values[2];
            if (solar_now<10) solar_now = 0;
            var totalgen = app_myenergy.windnow+solar_now;
            
            var balance = totalgen - use_now;
            
            $("#usenow").html(use_now);
            $("#solarnow").html(solar_now);
            $("#gridwindnow").html(Math.round(app_myenergy.windnow));
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

        app_myenergy.resize();
        app_myenergy.draw();
        app_myenergy.draw_bargraph();
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
        
        // Fetch latest feed data
        var feeds = app_myenergy.getfeedsbyid();
        
        // Consumption feeds
        var use_now = 0;
        for (var i in app_myenergy.housepower) {
            var feedid = app_myenergy.housepower[i];
            if (feeds[feedid]!=undefined) {
                use_now += parseInt(feeds[feedid].value);
                if (app_myenergy.autoupdate) {
                    app_myenergy.timeseries_append("f"+feedid,feeds[feedid].time,parseInt(feeds[feedid].value));
                    app_myenergy.timeseries_trim_start("f"+feedid,view.start*0.001);
                }
            }
        }
        
        // Solar feeds
        var solar_now = 0;
        for (var i in app_myenergy.solarpower) {
            var feedid = app_myenergy.solarpower[i];
            if (feeds[feedid]!=undefined) {
                solar_now += parseInt(feeds[feedid].value);
                if (app_myenergy.autoupdate) {
                    console.log(feeds[feedid].time+" "+feeds[feedid].value);
                    app_myenergy.timeseries_append("f"+feedid,feeds[feedid].time,parseInt(feeds[feedid].value));
                    app_myenergy.timeseries_trim_start("f"+feedid,view.start*0.001);
                }
            }
        }
        
        var national_wind = app_myenergy.getvalueremote(67088);
        var prc_of_capacity = national_wind / 8000;
        app_myenergy.wind_now = app_myenergy.my_wind_cap * prc_of_capacity;
        var wind_now = app_myenergy.wind_now;
        
        if (app_myenergy.autoupdate) {
            app_myenergy.timeseries_append("remotewind",now,national_wind);
            app_myenergy.timeseries_trim_start("remotewind",view.start*0.001);
        }
        
        
        // Advance view
        if (app_myenergy.autoupdate) {
            var timerange = view.end - view.start;
            view.end = now;
            view.start = view.end - timerange;
        }
        
        console.log("vs-ve: "+view.start+" "+view.end);
        
        // Lower limit for solar
        if (solar_now<10) solar_now = 0;
        var gen_now = solar_now + wind_now;
        var balance = gen_now - use_now;
        
        if (balance==0) {
            $("#balance-label").html("");
            $("#balance").html("");
        }
        
        if (balance>0) {
            $("#balance-label").html("CHARGE RATE:");
            $("#balance").html("<span style='color:#2ed52e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        if (balance<0) {
            $("#balance-label").html("DISCHARGE RATE:");
            $("#balance").html("<span style='color:#d52e2e'><b>"+Math.round(Math.abs(balance))+"W</b></span>");
        }
        
        $("#gennow").html(Math.round(gen_now));
        $("#solarnow").html(Math.round(solar_now));
        $("#windnow").html(Math.round(wind_now));
        
        $("#usenow").html(use_now);
        
        app_myenergy.draw();
        
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
        if (app_myenergy.reload) {
            app_myenergy.reload = false;
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            
            for (var i in app_myenergy.solarpower) {
                var feedid = app_myenergy.solarpower[i];
                app_myenergy.timeseries_load("f"+feedid,this.getdata(feedid,view.start,view.end,interval));
            }
            
            for (var i in app_myenergy.housepower) {
                var feedid = app_myenergy.housepower[i];
                app_myenergy.timeseries_load("f"+feedid,this.getdata(feedid,view.start,view.end,interval));
            }      
            
            app_myenergy.timeseries_load("remotewind",this.getdataremote(67088,view.start,view.end,interval));          
        }
        // -------------------------------------------------------------------------------------------------------
        
        var use_data = [];
        var solar_data = [];
        var wind_data = [];
        var bal_data = [];
        var store_data = [];
        
        var t = 0;
        var store = 0;
        var use = 0;
        var mysolar = 0;
        var mywind = 0;
        
        var total_solar_kwh = 0;
        var total_wind_kwh = 0;
        var total_use_kwh = 0;
        var total_use_direct_kwh = 0;
        
        var datastart = view.start;
        for (var z in datastore) {
            npoints = datastore[z].data.length;
            if (npoints>0)
                datastart = datastore[z].data[0][0];
        }
        
        for (var z=0; z<npoints; z++) {

            // -------------------------------------------------------------------------------------------------------
            // Get solar or use values
            // -------------------------------------------------------------------------------------------------------
            var tmpsolar = null;
            for (var i in app_myenergy.solarpower) {
                var feedid = app_myenergy.solarpower[i];
                if (datastore["f"+feedid].data[z]!=undefined && datastore["f"+feedid].data[z][1]!=null) {
                    if (tmpsolar==null) tmpsolar = 0;
                    tmpsolar += datastore["f"+feedid].data[z][1];   
                }
            }
            if (tmpsolar!=null) mysolar = tmpsolar;
            
            var tmpuse = null;
            for (var i in app_myenergy.housepower) {
                var feedid = app_myenergy.housepower[i];
                if (datastore["f"+feedid].data[z]!=undefined && datastore["f"+feedid].data[z][1]!=null) {
                    if (tmpuse==null) tmpuse = 0;
                    tmpuse += datastore["f"+feedid].data[z][1];   
                }
            }
            if (tmpuse!=null) use = tmpuse;
            
            if (datastore["remotewind"].data[z]!=undefined && datastore["remotewind"].data[z][1]!=null) {
                var wind = datastore["remotewind"].data[z][1]*1;
                var prc_of_capacity = wind / 8000;
                app_myenergy.my_wind_cap = ((app_myenergy.annual_wind_gen / 365) / 0.024) / app_myenergy.capacity_factor;
                mywind = app_myenergy.my_wind_cap * prc_of_capacity;
            }
            
            // -------------------------------------------------------------------------------------------------------
            // Supply / demand balance calculation
            // -------------------------------------------------------------------------------------------------------
            if (mysolar<10) mysolar = 0;
            
            var gen = mysolar + mywind;
            
            var balance = gen - use;
            
            if (balance>=0) total_use_direct_kwh += (use*interval)/(1000*3600);
            if (balance<0) total_use_direct_kwh += (gen*interval)/(1000*3600);
            
            var store_change = (balance * interval) / (1000*3600);
            store += store_change;
            
            total_wind_kwh += (mywind*interval)/(1000*3600);
            total_solar_kwh += (mysolar*interval)/(1000*3600);
            total_use_kwh += (use*interval)/(1000*3600);
            
            var time = datastart + (1000 * interval * z);
            use_data.push([time,use]);
            solar_data.push([time,mywind+mysolar]);
            wind_data.push([time,mywind]);
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
        
        $.plot($('#myenergy_bargraph'),series,options);
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
        datastore[name].start = 0;
        if (datastore[name].data.length>1)
        {
            datastore[name].start = datastore[name].data[0][0] * 0.001;
            datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
        }
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
