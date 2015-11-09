
var app_myelectric = {

    powerfeed: false,
    dailyfeed: false,
    dailytype: false,

    daily_data: [],
    daily: [],
    
    raw_kwh_data: [],
    
    fastupdateinst: false,
    slowupdateinst: false,
    
    viewmode: "energy",
    unitcost: 0.17,
    currency: "pound",
    
    escale: 1,
    
    startofweek: [0,0],
    startofmonth: [0,0],
    startofyear: [0,0],
    startofday: 0,
    startalltime: 0,
    
    last_daytime:0,                 // used for reload kwhd daily graph
    last_startofweektime: 0,        // used for reloading statistics
    last_startofmonthtime: 0,
    last_startofyeartime: 0,
    
    lastupdate: 0, 
    autoupdate: true,
    reload: true,
    feeds: {},
    
    kwhdtmp: [],
    
    // Include required javascript libraries
    include: [
        "Modules/app/lib/graph_bars.js",
        "Modules/app/lib/graph_lines.js",
        "Modules/app/lib/timeseries.js",
        "Modules/app/vis.helper.js"
    ],

    init: function()
    {        
        var timewindow = (3600000*3.0*1);
        view.end = +new Date;
        view.start = view.end - timewindow;

        // -------------------------------------------------------------------------
        // Load settings
        // -------------------------------------------------------------------------
        
        // If settings exist for myelectric then we load them in here:
        if (app.config["myelectric"]!=undefined) {
            app_myelectric.powerfeed = app.config.myelectric.powerfeed;
            app_myelectric.dailyfeed = app.config.myelectric.dailyfeed;
            app_myelectric.dailytype = app.config.myelectric.dailytype;
            app_myelectric.currency = app.config.myelectric.currency;
            app_myelectric.unitcost = app.config.myelectric.unitcost;
        } else {
            app.config.myelectric = {};
        // if no settings then try auto scanning for feeds with suitable names:
            var feeds = app_myelectric.getfeedsbyid();
            for (z in feeds)
            {
                var name = feeds[z].name.toLowerCase();
                
                if (name.indexOf("house_power")!=-1) {
                    app_myelectric.powerfeed = z;
                }
                
                if (name.indexOf("house_wh")!=-1) {
                    app_myelectric.dailyfeed = z;
                    app_myelectric.dailytype = 0;
                }
            }
        }
        
        if (app_myelectric.dailytype>1) {
            app_myelectric.dailytype = 0;
            app_myelectric.dailyfeed = 0;
        }
        
        app_myelectric.escale = 1.0;
        if (app_myelectric.dailytype==0) app_myelectric.escale = 0.001;
        if (app_myelectric.dailytype==1) app_myelectric.escale = 1.0;
        if (app_myelectric.currency==undefined) app_myelectric.currency = "";
        if (app_myelectric.unitcost==undefined) app_myelectric.unitcost = 0;
        // -------------------------------------------------------------------------
        // Decleration of myelectric events
        // -------------------------------------------------------------------------
        
        $(window).resize(function(){
            app_myelectric.resize();
        });
        
        // When the config icon is pressed, populate dropdown feed selector menu's.
        // and set values if already selected
        
        $("#myelectric_openconfig").click(function(){
        
            // Load feed list, populate feed selectors and select the selected feed
            var feeds = app_myelectric.getfeedsbyid();
            
            var out = ""; 
            for (z in feeds) {
                out +="<option value="+feeds[z].id+">"+feeds[z].name+"</option>";
            }
            $("#myelectric_powerfeed").html(out);
            $("#myelectric_powerfeed").val(app_myelectric.powerfeed);
            
            $("#myelectric_dailyfeed").html(out);
            $("#myelectric_dailyfeed").val(app_myelectric.dailyfeed);
            
            $("#myelectric_dailytype").val(app_myelectric.dailytype);
            
            $("#myelectric_currency").val(app_myelectric.currency);
            $("#myelectric_unitcost").val(app_myelectric.unitcost);
            // Switch to the config interface
            $("#myelectric_config").show();
            $("#myelectric_body").hide();
            
            // Stop updaters
            if (app_myelectric.fastupdateinst) clearInterval(app_myelectric.fastupdateinst);
            if (app_myelectric.slowupdateinst) clearInterval(app_myelectric.slowupdateinst);
        });

        // Save configuration, values are simply placed in the config.
        // then updates are resumed
        
        $("#myelectric_configsave").click(function(){
            app_myelectric.powerfeed = $("#myelectric_powerfeed").val();
            app_myelectric.dailyfeed = $("#myelectric_dailyfeed").val();
            app_myelectric.dailytype = $("#myelectric_dailytype").val();
            app_myelectric.unitcost = $("#myelectric_unitcost").val();
            app_myelectric.currency = $("#myelectric_currency").val();
            
            // Save config to db
            var config = app.config;
            if (config==false) config = {};
            config["myelectric"] = {
                "powerfeed": app_myelectric.powerfeed,
                "dailyfeed": app_myelectric.dailyfeed,
                "dailytype": app_myelectric.dailytype,
                "unitcost": app_myelectric.unitcost,
                "currency": app_myelectric.currency
            };
            
            if (app_myelectric.dailytype==0) app_myelectric.escale = 0.001;
            if (app_myelectric.dailytype==1) app_myelectric.escale = 1.0;
            
            app_myelectric.last_daytime = 0;
            app_myelectric.last_startofweektime = 0;
            app_myelectric.last_startofmonthtime = 0;
            app_myelectric.last_startofyeartime = 0;
            
            app.setconfig(config);
            app_myelectric.reload = true;
            app_myelectric.reloadkwhd = true;
            
            app_myelectric.fastupdateinst = setInterval(app_myelectric.fastupdate,5000);
            app_myelectric.slowupdateinst = setInterval(app_myelectric.slowupdate,60000);
            app_myelectric.fastupdate();
            app_myelectric.slowupdate();
            
            // Switch to main view 
            $("#myelectric_config").hide();
            $("#myelectric_body").show();
        });  
        
        $("#myelectric_zoomout").click(function () {view.zoomout(); app_myelectric.reload = true; app_myelectric.autoupdate = false; app_myelectric.fastupdate();});
        $("#myelectric_zoomin").click(function () {view.zoomin(); app_myelectric.reload = true; app_myelectric.autoupdate = false; app_myelectric.fastupdate();});
        $('#myelectric_right').click(function () {view.panright(); app_myelectric.reload = true; app_myelectric.autoupdate = false; app_myelectric.fastupdate();});
        $('#myelectric_left').click(function () {view.panleft(); app_myelectric.reload = true; app_myelectric.autoupdate = false; app_myelectric.fastupdate();});
        
        $('.myelectric-time').click(function () {
            view.timewindow($(this).attr("time")/24.0); 
            app_myelectric.reload = true; 
            app_myelectric.autoupdate = true;
            app_myelectric.fastupdate();
        });
        
        $(".myelectric-view-cost").click(function(){
            app_myelectric.viewmode = "cost";
            console.log(app_myelectric.viewmode);
            app_myelectric.fastupdate();
            app_myelectric.slowupdate();
        });
        
        $(".myelectric-view-kwh").click(function(){
            app_myelectric.viewmode = "energy";
            console.log(app_myelectric.viewmode);
            app_myelectric.fastupdate();
            app_myelectric.slowupdate();
        });
    },
    
    show: function()
    {
        $("body").css('background-color','#222');
        $(window).ready(function(){
            $("#footer").css('background-color','#181818');
            $("#footer").css('color','#999');
        });
        
        if (app_myelectric.powerfeed>0 && app_myelectric.dailyfeed>0) {
        
            // start of all time
            var meta = {};
            $.ajax({                                      
                url: path+"feed/getmeta.json",                         
                data: "id="+app_myelectric.dailyfeed+apikeystr,
                dataType: 'json',
                async: false,                      
                success: function(data_in) { meta = data_in; } 
            });
            app_myelectric.startalltime = meta.start_time;
            
            app_myelectric.reloadkwhd = true;
            
            // resize and start updaters
            app_myelectric.resize();
            
        
            app_myelectric.fastupdateinst = setInterval(app_myelectric.fastupdate,5000);
            app_myelectric.fastupdate();
            app_myelectric.slowupdateinst = setInterval(app_myelectric.slowupdate,60000);
            app_myelectric.slowupdate();
        }
    },
    
    resize: function() 
    {
        var windowheight = $(window).height();
        
        bound = {};
        
        var width = $("#myelectric_placeholder_bound_kwhd").width();
        $("#myelectric_placeholder_kwhd").attr('width',width);
        graph_bars.width = width;
        
        var height = $("#myelectric_placeholder_bound_kwhd").height();
        $("#myelectric_placeholder_kwhd").attr('height',height); 
        graph_bars.height = height;
        
        var width = $("#myelectric_placeholder_bound_power").width();
        $("#myelectric_placeholder_power").attr('width',width);
        graph_lines.width = width;
        
        var height = $("#myelectric_placeholder_bound_power").height();
        $("#myelectric_placeholder_power").attr('height',height); 
        graph_lines.height = height;
        
        
        if (width<=500) {
            $(".electric-title").css("font-size","16px");
            $(".power-value").css("font-size","38px");
            $(".power-value").css("padding-top","12px");
            $(".power-value").css("padding-bottom","8px");
            $(".midtext").css("font-size","14px");
            $(".units").hide();
            $(".visnav").css("padding-left","5px");
            $(".visnav").css("padding-right","5px");
        } else if (width<=724) {
            $(".electric-title").css("font-size","18px");
            $(".power-value").css("font-size","52px");
            $(".power-value").css("padding-top","22px");
            $(".power-value").css("padding-bottom","12px");
            $(".midtext").css("font-size","18px");
            $(".units").show();
            $(".visnav").css("padding-left","8px");
            $(".visnav").css("padding-right","8px");
        } else {
            $(".electric-title").css("font-size","22px");
            $(".power-value").css("font-size","85px");
            $(".power-value").css("padding-top","40px");
            $(".power-value").css("padding-bottom","20px");
            $(".midtext").css("font-size","20px");
            $(".units").show();
            $(".visnav").css("padding-left","8px");
            $(".visnav").css("padding-right","8px");
        }
        
        app_myelectric.reloadkwhd = true;
        if (app_myelectric.powerfeed && app_myelectric.dailyfeed) {
            app_myelectric.fastupdate();
            app_myelectric.slowupdate();
        }
    },
    
    hide: function()
    {
        clearInterval(this.fastupdateinst);
        clearInterval(this.slowupdateinst);
    },
    
    fastupdate: function()
    {
        if (app_myelectric.viewmode=="energy") {
            scale = 1;
            $("#myelectric_usetoday_units_a").html("");
            $("#myelectric_usetoday_units_b").html(" kWh");
            $(".u1a").html(""); $(".u1b").html("kWh");
            $(".u2a").html(""); $(".u2b").html(" kWh/d");
        } else {
            scale = app_myelectric.unitcost;
            $("#myelectric_usetoday_units_a").html("&"+app_myelectric.currency+";");
            $("#myelectric_usetoday_units_b").html("");
            $(".u1a").html("&"+app_myelectric.currency+";"); $(".u1b").html("");
            $(".u2a").html("&"+app_myelectric.currency+";"); $(".u2b").html("/day");
        }
        
        var now = new Date();
        var timenow = now.getTime();
        
        // --------------------------------------------------------------------------------------------------------
        // REALTIME POWER GRAPH
        // -------------------------------------------------------------------------------------------------------- 
        // Check if the updater ran in the last 60s if it did not the app was sleeping
        // and so the data needs a full reload.
        
        if ((timenow-app_myelectric.lastupdate)>60000) app_myelectric.reload = true;
        app_myelectric.lastupdate = timenow;
        
        // reload power data
        if (app_myelectric.reload) {
            app_myelectric.reload = false;
            
            var timewindow = view.end - view.start;
            view.end = timenow;
            view.start = view.end - timewindow;
            
            var npoints = 1500;
            interval = Math.round(((view.end - view.start)/npoints)/1000);
            if (interval<1) interval = 1;
            
            view.start = 1000*Math.floor((view.start/1000)/interval)*interval;
            view.end = 1000*Math.ceil((view.end/1000)/interval)*interval;
            
            timeseries.load(app_myelectric.powerfeed, view.start, view.end, interval);
        }
        
        // --------------------------------------------------------------------
        // 1) Get last value of feeds
        // --------------------------------------------------------------------
        var feeds = app_myelectric.getfeedsbyid();
        app_myelectric.feeds = feeds;
        
        // set the power now value
        if (app_myelectric.viewmode=="energy") {
            $("#myelectric_powernow").html((feeds[app_myelectric.powerfeed].value*1).toFixed(0)+"W");
        } else {
            $("#myelectric_powernow").html("&"+app_myelectric.currency+";"+(feeds[app_myelectric.powerfeed].value*1*app_myelectric.unitcost*0.001).toFixed(2)+"/hr");
        }
        // Advance view
        if (app_myelectric.autoupdate) {

            // move the view along
            var timerange = view.end - view.start;
            view.end = timenow;
            view.start = view.end - timerange;
            
            timeseries.append(
                app_myelectric.powerfeed, 
                feeds[app_myelectric.powerfeed].time, 
                feeds[app_myelectric.powerfeed].value
            );
            
            // delete data that is now beyond the start of our view
            timeseries.trim_start(app_myelectric.powerfeed,view.start*0.001);
        }
        
        // draw power graph
        var options = {
            axes: {
                color: "rgba(6,153,250,1.0)",
                font: "12px arial"
            },
            
            xaxis: {
                minor_tick: 60000*10,
                major_tick: 60000*60
            },
            
            yaxis: {
                title: "Power (Watts)",
                units: "W",
                minor_tick: 250,
                major_tick: 1000
            }
        };
        
        var timewindowhours = Math.round((view.end-view.start)/3600000);
        options.xaxis.major_tick = 30*24*3600*1000;
        if (timewindowhours<=24*7) options.xaxis.major_tick = 24*3600*1000;
        if (timewindowhours<=24) options.xaxis.major_tick = 2*3600*1000;
        if (timewindowhours<=12) options.xaxis.major_tick = 1*3600*1000;
        options.xaxis.minor_tick = options.xaxis.major_tick / 4;
        
        
        var series = {
            "solar": {
                color: "rgba(255,255,255,1.0)",
                data: []
            },
            "use": {
                color: "rgba(6,153,250,0.5)",
                data: datastore[app_myelectric.powerfeed].data
            }
        };
        
        graph_lines.draw("myelectric_placeholder_power",series,options);

        // --------------------------------------------------------------------------------------------------------
        // THIS WEEK, MONTH, YEAR TOTALS
        // --------------------------------------------------------------------------------------------------------
        // All time total
        var alltime_kwh = feeds[app_myelectric.dailyfeed].value*app_myelectric.escale;
        // -------------------------------------------------------------------------------------------------------- 
        // WEEK: Get the time of the start of the week, if we have rolled over to a new week, load the watt hour
        // value in the watt accumulator feed recorded for the start of this week.
        var dayofweek = now.getDay();
        if (dayofweek>0) dayofweek -= 1; else dayofweek = 6;

        var time = new Date(now.getFullYear(),now.getMonth(),now.getDate()-dayofweek).getTime();
        if (time!=app_myelectric.last_startofweektime) {
            app_myelectric.startofweek = app_myelectric.getvalue(app_myelectric.dailyfeed,time);
            app_myelectric.last_startofweektime = time;
        }
        if (app_myelectric.startofweek===false) app_myelectric.startofweek = [app_myelectric.startalltime*1000,0];
        
        // Week total
        var week_kwh = alltime_kwh - (app_myelectric.startofweek[1]*app_myelectric.escale);
        $("#myelectric_week_kwh").html((scale*week_kwh).toFixed(1));
        var days = ((feeds[app_myelectric.dailyfeed].time - (app_myelectric.startofweek[0]*0.001))/86400);
        $("#myelectric_week_kwhd").html((scale*week_kwh/days).toFixed(1));
        // --------------------------------------------------------------------------------------------------------       
        // MONTH: repeat same process as above
        var time = new Date(now.getFullYear(),now.getMonth(),1).getTime();
        if (time!=app_myelectric.last_startofmonthtime) {
            app_myelectric.startofmonth = app_myelectric.getvalue(app_myelectric.dailyfeed,time);
            app_myelectric.last_startofmonthtime = time;
        }
        if (app_myelectric.startofmonth===false) app_myelectric.startofmonth = [app_myelectric.startalltime*1000,0];
        
        // Monthly total
        var month_kwh = alltime_kwh - (app_myelectric.startofmonth[1]*app_myelectric.escale);
        $("#myelectric_month_kwh").html(Math.round(scale*month_kwh));
        var days = ((feeds[app_myelectric.dailyfeed].time - (app_myelectric.startofmonth[0]*0.001))/86400);
        $("#myelectric_month_kwhd").html((scale*month_kwh/days).toFixed(1));
        // -------------------------------------------------------------------------------------------------------- 
        // YEAR: repeat same process as above
        var time = new Date(now.getFullYear(),0,1).getTime();
        if (time!=app_myelectric.last_startofyeartime) {
            app_myelectric.startofyear = app_myelectric.getvalue(app_myelectric.dailyfeed,time);
            app_myelectric.last_startofyeartime = time;
        }
        if (app_myelectric.startofyear===false) app_myelectric.startofyear = [app_myelectric.startalltime*1000,0];     
        
        // Year total
        var year_kwh = alltime_kwh - (app_myelectric.startofyear[1]*app_myelectric.escale);
        $("#myelectric_year_kwh").html(Math.round(scale*year_kwh));
        var days = ((feeds[app_myelectric.dailyfeed].time - (app_myelectric.startofyear[0]*0.001))/86400);
        $("#myelectric_year_kwhd").html((scale*year_kwh/days).toFixed(1));
        // -------------------------------------------------------------------------------------------------------- 
        // ALL TIME
        $("#myelectric_alltime_kwh").html(Math.round(scale*alltime_kwh));
        var days = ((feeds[app_myelectric.dailyfeed].time - app_myelectric.startalltime)/86400);
        $("#myelectric_alltime_kwhd").html((scale*alltime_kwh/days).toFixed(1));
        // --------------------------------------------------------------------------------------------------------        
    },
    
    slowupdate: function()
    {
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
        
        var interval = 86400;
        var now = new Date();
        var timezone = (now.getTimezoneOffset()/-60)*3600;
        var timenow = Math.floor(now.getTime() * 0.001);
        var end = (Math.floor((timenow+timezone)/interval)*interval)-timezone;
        var start = end - interval * Math.round(graph_bars.width/30);
        
        var valid = [];
        
        var data = app_myelectric.getdata({
          "id":app_myelectric.dailyfeed,
          "start":start*1000,"end":end*1000,"interval":interval,
          "skipmissing":0,"limitinterval":0
        });

        // remove nan values from the end.
        for (z in data) {
          if (data[z][1]!=null) {
            valid.push(data[z]);
          }
        }
        
        var next = valid[valid.length-1][0] + (interval*1000);
        
        if (app_myelectric.feeds[app_myelectric.dailyfeed]!=undefined) {
            valid.push([next,app_myelectric.feeds[app_myelectric.dailyfeed].value*1.0]);
        }
        
        // Calculate the daily totals by subtracting each day from the day before
        app_myelectric.daily = [];
        for (var z=1; z<valid.length; z++)
        {
          var time = valid[z-1][0];
          var diff = (valid[z][1]-valid[z-1][1])*app_myelectric.escale;
          app_myelectric.daily.push([time,diff*scale]);
        }
        
        var usetoday_kwh = 0;
        if (app_myelectric.daily.length>0) {
            usetoday_kwh = app_myelectric.daily[app_myelectric.daily.length-1][1];
        }
        $("#myelectric_usetoday").html((usetoday_kwh).toFixed(1));

        graph_bars.draw('myelectric_placeholder_kwhd',[app_myelectric.daily]);
    },
    
    getfeedsbyid: function()
    {
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
    
    getvalue: function(feedid,time) 
    {
        var result = app_myelectric.getdata({
          "id":feedid,
          "start":time,
          "end":time+1000,
          "interval":1
        });
        if (result.length==2) return result[0];
        return false;
    },
    
    getdata: function(args) 
    {
        var reqstr = "";
        for (z in args) reqstr += "&"+z+"="+args[z];
        reqstr += apikeystr;
        console.log(reqstr);
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json", data: reqstr,
            dataType: 'json', async: false,             
            success: function(data_in) { data = data_in; } 
        });
        return data;
    }
};
