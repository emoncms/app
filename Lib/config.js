var config = {

    initialized: false,

    name: "",
    db: {},
    app: {},
    feeds: {},
    feedsbyid: {},
    feedsbyname: {},
    
    init: function() {
        // console.log("CONFIG: Init");
        
        for (var z in config.feeds) config.feedsbyname[config.feeds[z].name] = config.feeds[z];
        for (var z in config.feeds) config.feedsbyid[config.feeds[z].id] = config.feeds[z];
        
        // Check that the config is complete first otherwise show config interface
        if (!config.check()) {
            config.showConfig();          // Show setup block
            $(".ajax-loader").hide();     // Hide AJAX loader
            config.UI();                  // Populate setup UI options
        } else {
            $("#app-block").show();       // Show app block
            $(".ajax-loader").show();     // Show AJAX loader
            
            config.load();                // Merge db config into app config
            config.initapp();
            config.initialized = true;    // Init app
            config.showapp();
        }
        
        $("body").on("click", ".openconfig", function(event){
            config.showConfig();
            config.UI();
        });

        // don't save and just show app
        $("body").on("click",".close-config", function(event){
            config.closeConfig();
        });
        
        // save and show app
        $("body").on("click", ".launchapp", function(){
            $(".ajax-loader").show();
            config.closeConfig();
            config.load();
            if (!config.initialized) { config.initapp(); config.initialized = true; }
            config.showapp();
        });
        
        $("body").on("click",".deleteapp",function(){
            console.log("delete: "+config.name);
            $.ajax({ 
                url: path+"app/remove", 
                data: "name="+config.name,
                dataType: 'text',
                async: false, 
                success: function(result){
                    try {
                        result = JSON.parse(result);
                        if (result.success!=undefined && !result.success) app_log("ERROR",result.message);
                        window.location = path+"app/view";
                    } catch (e) {
                        app.log("ERROR","Could not parse /setconfig reply, error: "+e);
                    }
                } 
            });
        });
    },
    /**
     * hide the app config window and show the app.
     * enable the buttons in the app header
     */
    closeConfig: function () {
        console.log('closeConfig()');
        $("#app-block").toggleClass('hide', false);
        $("#app-setup").toggleClass('hide', true);
        
        $('.openconfig').toggleClass('hide', false);
        $('.close-config').toggleClass('hide', true);
        $('#buttons #tabs .btn').attr('disabled',false).css('opacity',1);
        // if graph resize() function available, run it.
        if (typeof resize == 'function') resize();
    },
    /**
     * hide the app window and show the config window.
     * disable the buttons in the app header
     */
    showConfig: function () {
        console.log('showConfig()');
        $("#app-block").toggleClass('hide', true);
        $("#app-setup").toggleClass('hide', false);
        
        $('.openconfig').toggleClass('hide', true);
        $('.close-config').toggleClass('hide', false);
        $('#buttons #tabs .btn').attr('disabled',true).css('opacity',.2);
    },

    UI: function() {
        $(".app-config").html("");
        $("body").css('background-color','#222');
        $("#footer").css('background-color','#181818');
        $("#footer").css('color','#999');
     
        // Remove old config items that are no longer used/described in new config definition
        if (config.db.constructor===Array) config.db = {};
        
        for (var z in config.db) {
            if (config.db[z]==undefined) delete config.db[z];
        }

        // Draw the config interface from the config object:
        var out = "";
        for (var z in config.app) {
            out += "<div class='appconfig-box' key='"+z+"'>";
            if (config.app[z].type=="feed") {
                out += "<i class='status icon-ok-sign icon-white'></i> <b class='feedname' key='"+z+"'>"+config.app[z].autoname+" <span style='color:#ccc; font-size:12px'>[AUTO]</span></b><i class='appconfig-edit icon-pencil icon-white' style='float:right; cursor:pointer'></i>";
                out += "<br><span class='appconfig-info'></span>";
                out += "<div class='feed-select-div input-append'><select class='feed-select'></select><button class='btn feed-select-ok'>ok</button></div>";
            } else if (config.app[z].type=="value") {
                out += "<i class='status icon-ok-sign icon-white'></i> <b>"+config.app[z].name+"</b>";
                out += "<br><span class='appconfig-info'></span>";
                out += "<input class='appconfig-value' type='text' key='"+z+"' value='"+config.app[z].default+"' / >";
            } else if (config.app[z].type=="checkbox") {
                out += "<i class='status icon-ok-sign icon-white'></i> <b>"+config.app[z].name+"</b>";
                out += "<br><span class='appconfig-info'></span>";
                var checked = ""; if (config.app[z].default) checked = "checked";
                out += " <input class='appconfig-value' type='checkbox' key='"+z+"' "+checked+" / >";
            }
            out += "</div>";
        }
        
        out += "<br><div style='text-align:center;'><button class='btn launchapp' style='padding:10px; display:none'>Launch App</button><button class='btn btn-danger deleteapp' style='padding:10px; margin-left:20px'><i class='icon-trash icon-white'></i> Delete</button></div>";
        
        $(".app-config").html(out);

        for (var z in config.app) {
            var configItem = $(".appconfig-box[key="+z+"]");
            
            if (config.app[z].type=="feed") {
                // Create list of feeds that satisfy engine requirement
                var out = "<option value=0>Select "+z+" feed:</option>";
                out += "<option value=auto>AUTO SELECT</option>";
                for (var n in config.feedsbyname)  {
                    if (config.engine_check(config.feedsbyname[n],config.app[z])) {
                        out += "<option value="+config.feedsbyname[n].id+">"+config.feedsbyname[n].name+"</option>";
                    }
                }
                configItem.find(".feed-select").html(out);
                
                var feedvalid = false;
                // Check for existing configuration
                if (config.db[z]!=undefined) {
                    var feedid = config.db[z];
                    if (config.feedsbyid[feedid]!=undefined && config.engine_check(config.feedsbyid[feedid],config.app[z])) {
                        var keyappend = ""; if (z!=config.feedsbyid[feedid].name) keyappend = z+": ";
                        configItem.find(".feedname").html(keyappend+config.feedsbyid[feedid].name);
                        configItem.find(".feed-select").val(feedid);
                        configItem.find(".feed-select-div").hide();
                        feedvalid = true;
                    } else {
                        // Invalid feedid remove from configuration
                        delete config.db[z]; 
                    }
                }
                
                // Important that this is not an else here as an invalid feedid 
                // in the section above will call delete making the item undefined again
                if (config.db[z]==undefined) {
                    // Auto match feeds that follow the naming convention
                    for (var n in config.feedsbyid) {
                        if (config.feedsbyid[n].name==config.app[z].autoname && config.engine_check(config.feedsbyid[n],config.app[z])) {
                            configItem.find(".feed-select").val("auto");
                            configItem.find(".feed-select-div").hide();
                            feedvalid = true;
                        }
                    }
                }
                
                // Indicator icon to show if setup correctly or not
                if (!feedvalid) {
                    configItem.find(".status").removeClass("icon-ok-sign"); 
                    configItem.find(".status").addClass("icon-remove-circle");
                }
            }
            
            if (config.app[z].type=="value") {
                if (config.db[z]!=undefined) configItem.find(".appconfig-value").val(config.db[z]);
            }

            if (config.app[z].type=="checkbox") {
                if (config.db[z]!=undefined) configItem.find(".appconfig-value")[0].checked = config.db[z];
            }
                        
            // Set description
            configItem.find(".appconfig-info").html(config.app[z].description);
        }
        
        if (config.check()) {
            $(".launchapp").show();
        }

        // Brings up the feed selector if the pencil item is clicked
        $(".appconfig-edit").unbind("click");
        $(".appconfig-edit").click(function(){
            var key = $(this).parent().attr("key");
            var configItem = $(".appconfig-box[key="+key+"]");
            
            if (config.app[key].type=="feed") {
                configItem.find(".feed-select-div").show();
            }
        });

        $(".feed-select-ok").unbind("click");
        $(".feed-select-ok").click(function(){
            var key = $(this).parent().parent().attr("key");
            var configItem = $(".appconfig-box[key="+key+"]");
            
            var feedid = $(this).parent().find(".feed-select").val();
            
            if (feedid!="auto" && feedid!=0) {
                config.db[key] = feedid;
                var keyappend = ""; if (key!=config.feedsbyid[feedid].name) keyappend = key+": ";
                configItem.find(".feedname").html(keyappend+config.feedsbyid[feedid].name);
                configItem.find(".status").addClass("icon-ok-sign"); 
                configItem.find(".status").removeClass("icon-remove-circle");
                // Save config
            }
            
            if (feedid=="auto") {
                delete config.db[key];
                configItem.find(".feedname").html(config.app[key].autoname+" <span style='color:#ccc; font-size:12px'>[AUTO]</span>");
            }
            
            if (feedid!=0 ) {
                configItem.find(".feed-select-div").hide();
                config.set();
                
                if (config.check()) {
                    $(".launchapp").show();
                } else {
                    $(".launchapp").hide();
                }
            }
        });
        
        $(".appconfig-value").unbind("click");
        $(".appconfig-value").change(function(){
            var value = false;
            var key = $(this).parent().attr("key");
            var configItem = $(".appconfig-box[key="+key+"]");
            
            if (config.app[key].type=="value") {
                value = $(this).val();
            } else if (config.app[key].type=="checkbox") {
                value = $(this)[0].checked;
            }
            
            config.db[key] = value;
            config.set();
        });
    },

    check: function()
    {   
        var valid = {};
        for (var key in config.app) {
            if (config.app[key].type=="feed") {
                if (config.app[key].optional!=undefined && config.app[key].optional) {
                
                } else {
                    valid[key] = false;
                    
                    if (config.db[key]==undefined) {
                        // Check if feeds match naming convention and engine
                        var autoname = config.app[key].autoname;
                        if (config.feedsbyname[autoname]!=undefined) {
                            if (config.engine_check(config.feedsbyname[autoname],config.app[key])) valid[key] = true;
                        }
                    } else {
                        // Overwrite with any user set feeds if applicable
                        for (var z in config.feedsbyname) {
                            // Check that the feed exists
                            // config will be shown if a previous valid feed has been deleted
                            var feedid = config.feedsbyname[z].id;
                            if (config.db[key] == feedid) {
                                if (config.engine_check(config.feedsbyname[z],config.app[key])) valid[key] = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        for (var key in valid) {
            if (valid[key]==false) return false;
        }
        
        return true;
    },

    load: function()
    {
        for (var key in config.app) {
            
            if (config.app[key].type=="feed") {
                config.app[key].value = false;
                
                // Check if feeds match naming convention
                var autoname = config.app[key].autoname;
                if (config.feedsbyname[autoname]!=undefined) {
                    config.app[key].value = config.feedsbyname[autoname].id;
                }
                // Overwrite with any user set feeds if applicable
                if (config.db[key]!=undefined) {
                    config.app[key].value = config.db[key];
                }
            }
            
            if (config.app[key].type=="value") {
                if (config.db[key]!=undefined) {
                    config.app[key].value = config.db[key];
                } else {
                    config.app[key].value = config.app[key].default;
                }
            }
            
            if (config.app[key].type=="checkbox") {
                if (config.db[key]!=undefined) {
                    config.app[key].value = config.db[key];
                } else {
                    config.app[key].value = config.app[key].default;
                }
            }
        }
        
        return config.app;
    },

    engine_check: function(feed,conf)
    {
        if (isNaN(conf.engine)) {
            var engines = conf.engine.split(",");
            if (engines.length>0) {
                for (var z in engines) {
                    if (feed.engine==engines[z]) return true;
                }
            }
        } else {
            if (feed.engine*1==conf.engine*1) return true;
        }

        return false;
    },

    set: function()
    {   
        $.ajax({ 
            url: path+"app/setconfig", 
            data: "name="+config.name+"&config="+JSON.stringify(config.db),
            dataType: 'text',
            async: false, 
            success: function(result){
                try {
                    result = JSON.parse(result);
                    if (result.success!=undefined && !result.success) app_log("ERROR",result.message);
                } catch (e) {
                    app.log("ERROR","Could not parse /setconfig reply, error: "+e);
                }
            } 
        });
    }
}