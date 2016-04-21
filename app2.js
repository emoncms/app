var app = {

    basepath: path+"Modules/app/",

    include: {},
    
    loaded: {},
    initialized: {},
    
    datastore: {},
    view: {},

    load: function(appname) 
    {
        app.log("INFO","app load "+appname);
        app.loaded[appname] = true;
        // We load here the html of the app into an dedicated element for that app
        // when an app is loaded its html remains in the dom even when viewing another app
        // an app is just hidden and shown depending on the visibility settings.
        
        // we check here if the app has been loaded to the dom, if not we load it
        
        var appdom = $("#app_"+appname);
        
        if (appdom.length) return true;
        
    
        var html = "";
        $.ajax({url: app.basepath+appname+"/"+appname+".html", async: false, cache: false, success: function(data) {html = data;} });
        
        $("#content").append('<div class="apps" id="app_'+appname+'" style="display:none"></div>');
        $("#app_"+appname).html(html);

        $.ajax({
            url: app.basepath+appname+"/"+appname+".js",
            dataType: 'script',
            async: false
        });
        
        // ----------------------------------------------------------
        // Included javascript loader
        // ----------------------------------------------------------
        var include = window["app_"+appname].include;
        for (i in include) {
            var file = include[i];
            if (app.include[file]==undefined)
            {
                app.include[file] = true;
                $.ajax({
                    url: path+file,
                    dataType: 'script',
                    async: false
                });
            }
        }
        
        if (app.config[appname]==undefined) app.config[appname] = {};
        
        var feeds = feed.listbyname();
        
        // Check that the config is complete first otherwise show config interface
        var configured = config_check(window["app_"+appname].config, app.config[appname], feeds);
        
        // Show dashboard if all present, configuration page if not:
        if (!configured) {
            app.log("INFO",appname+" not configured, showing setup");
            $("#"+appname+"-setup").show();
            configUI(appname, window["app_"+appname].config, app.config[appname]);
            $(".ajax-loader").hide();
        }
        
        if (configured && app.initialized[appname]==undefined) {
            app.log("INFO",appname+" configured, running init");
            $("#"+appname+"-block").show();
            window["app_"+appname].config = config_load(window["app_"+appname].config, app.config[appname], feeds);
            app.initialized[appname] = true;
            window["app_"+appname].init();
            if (!sessionwrite) $(".openconfig").hide();
        }
        
        return true;
    },
    
    show: function(appname)
    {
        app.log("INFO","app show "+appname);
        
        // Copy back into the loaded app context its datastore
        if (app.datastore[appname]!=undefined) {
            datastore = JSON.parse(JSON.stringify(app.datastore[appname]));
        }
        //  and view settings
        if (app.view[appname]!=undefined) { 
            view.start = app.view[appname].start;
            view.end = app.view[appname].end;
        }
        
        // If the app has not been loaded before: run load
        if (app.loaded[appname]==undefined) {
            app.load(appname);
        }
        
        $(".apps").hide();
        $("#app_"+appname).show();
        if (window["app_"+appname]!=undefined && app.initialized[appname]!=undefined) {
            $(".ajax-loader").show();
            window["app_"+appname].show();
        }
    },
    
    hide: function(appname)
    {
        app.log("INFO","app hide "+appname);
        app.datastore[appname] = JSON.parse(JSON.stringify(datastore));
        app.view[appname] = {start:view.start, end:view.end};
        
        $("#app_"+appname).hide();
        if (window["app_"+appname]!=undefined && app.initialized[appname]!=undefined) window["app_"+appname].hide();
    },
    
    getconfig: function()
    {
        var config = {};
        var apikeystr = "";
        if (window.apikey!=undefined) apikeystr = "?apikey="+apikey;
        $.ajax({ 
            url: path+"app/getconfig.json"+apikeystr, 
            dataType: 'json',
            async: false, 
            success: function(result) {

                if (result.success!=undefined && !result.success) 
                    app.error("ERROR",config.message);

                if (result.constructor==Array) {
                    if (result.length==0) result = {};
                }
                
                if (!result || result==null || result=="" || result.constructor!=Object) {
                    app.log("ERROR","app.getconfig invalid response: "+result);
                }
                
                config = result;
            } 
        });
        app.config = config;
    },
    
    setconfig: function(appname, appconfig)
    {
        app.config[appname] = appconfig;
        
        var feeds = feed.listbyname();
        window["app_"+appname].config = config_load(window["app_"+appname].config, app.config[appname], feeds);
        
        $.ajax({ 
            url: path+"app/setconfig.json", 
            data: "data="+JSON.stringify(app.config),
            dataType: 'text',
            async: false, 
            success: function(result){
                try {
                    result = JSON.parse(result);
                    if (result.success!=undefined && !result.success) app.error("ERROR",result.message);
                } catch (e) {
                    app.log("ERROR","Could not parse /setconfig reply, error: "+e);
                }
            } 
        });
    },
    
    log: function(level, message) {
        if (level=="ERROR") alert(level+": "+message);
        console.log(level+": "+message);
    }
};
