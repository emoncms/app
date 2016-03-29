var app = {

    basepath: path+"Modules/app/",

    include: {},
    
    loaded: {},
    initialized: {},
    
    datastore: {},
    view: {},

    load: function(appname) 
    {
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
        
        var appconfig = window["app_"+appname].config;
        var feeds = feed.listbyname();
        
        var valid = {};

        for (var key in appconfig) {
            
            if (appconfig[key].type=="feed") {
                valid[key] = false;
                
                // Check if feeds match naming convention
                var autoname = appconfig[key].autoname;
                if (feeds[autoname]!=undefined) {
                    appconfig[key].value = feeds[autoname].id;
                    valid[key] = true;
                }
                // Overwrite with any user set feeds if applicable
                if (app.config[appname][key]!=undefined) {
                    appconfig[key].value = app.config[appname][key];
                    valid[key] = true;
                }
            }
            
            if (appconfig[key].type=="value") {
                if (app.config[appname][key]!=undefined) {
                    appconfig[key].value = app.config[appname][key];
                } else {
                    appconfig[key].value = appconfig[key].default;
                }
            }
        }

        var configured = true;
        for (var key in valid) {
            if (valid[key]==false) configured = false;
        }
        
        // Show dashboard if all present, configuration page if not:
        if (configured) { 
            $("#"+appname+"-block").show(); 
        } else {
            $("#"+appname+"-setup").show();
            configUI(appname, appconfig, app.config[appname]);
        }
        
        window["app_"+appname].config = appconfig;
        
        
        if (configured && app.initialized[appname]==undefined) {
            console.log("init from load "+appname);
            app.initialized[appname] = true;
            window["app_"+appname].init();
        }
        
        return true;
    },
    
    show: function(appname)
    {
        if (app.datastore[appname]!=undefined) {
            datastore = JSON.parse(JSON.stringify(app.datastore[appname]));
        }
        
        if (app.view[appname]!=undefined) { 
            view.start = app.view[appname].start;
            view.end = app.view[appname].end;
        }
        
        if (app.loaded[appname]==undefined) app.load(appname);
        $(".apps").hide();
        $("#app_"+appname).show();
        if (window["app_"+appname]!=undefined && app.initialized[appname]!=undefined) window["app_"+appname].show();
    },
    
    hide: function(appname)
    {
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
        $.ajax({ url: path+"app/getconfig.json"+apikeystr, dataType: 'json', async: false, success: function(data) {config = data;} });
        app.config = config;
    },
    
    setconfig: function(appname, config)
    {
        app.config[appname] = config;
        $.ajax({ url: path+"app/setconfig.json", data: "data="+JSON.stringify(app.config), async: false, success: function(data){} });
    }
};
