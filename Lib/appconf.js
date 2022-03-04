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
            config.UI();                  // Populate setup UI options
            $(".ajax-loader").hide();     // Hide AJAX loader
        } else {
            $("#app-block").show();       // Show app block
            $(".ajax-loader").show();     // Show AJAX loader
            
            config.load();                // Merge db config into app config
            config.initapp();
            config.initialized = true;    // Init app
            config.showapp();
        }

        $("body").on("click",".config-open", function() {
            config.showConfig();
            config.UI();
        });

        // don't save and just show app
        $("body").on("click",".config-close", function(event) {
            config.closeConfig();
        });

        // save and show app
        $("body").on("click",".app-launch",function() {
            $(".ajax-loader").show();
            config.closeConfig();
            config.load();
            if (!config.initialized) {
                config.initapp();
                config.initialized = true;
            }
            config.showapp();
        });

        $("body").on("click",".app-delete",function(){
            console.log("delete: "+config.name);
            $.ajax({ 
                url: path+"app/remove", 
                data: "name="+config.name,
                dataType: 'text',
                async: false, 
                success: function(result){
                    try {
                        result = JSON.parse(result);
                        if (result.success != undefined && !result.success) appLog("ERROR", result.message);
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
        $("#app-block").show();
        $("#app-setup").hide();
        
        $('.config-open').show();
        $('.config-close').hide();
        $('#buttons #tabs .btn').attr('disabled',false).css('opacity',1);
        // allow app to react to closing config window
        $('body').trigger('config.closed')
    },

    /**
     * hide the app window and show the config window.
     * disable the buttons in the app header
     */
    showConfig: function () {
        $("#app-block").hide();
        $("#app-setup").show();
        
        $('.config-open').hide();
        $('.config-close').show();
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
            out += "<div class='app-config-box' key='"+z+"'>";
            if (config.app[z].type=="feed") {
                
                var selection_mode = "AUTO";
                if (config.db[z]=="disable") selection_mode = "DISABLED";
                
                out += "<i class='status icon-ok-sign icon-app-config'></i> <b class='feed-name' key='"+z+"'>"+config.app[z].autoname+" <span class='feed-auto'>["+selection_mode+"]</span></b><i class='app-config-edit icon-pencil icon-app-config' style='float:right; cursor:pointer'></i>";
                out += "<br><span class='app-config-info'></span>";
                out += "<div class='feed-select-div input-append'><select class='feed-select'></select><button class='btn feed-select-ok'>ok</button></div>";
            } else if (config.app[z].type=="value") {
                out += "<i class='status icon-ok-sign icon-app-config'></i> <b>"+config.app[z].name+"</b>";
                out += "<br><span class='app-config-info'></span>";
                out += "<input class='app-config-value' type='text' key='"+z+"' value='"+config.app[z].default+"' / >";
            } else if (config.app[z].type=="checkbox") {
                out += "<i class='status icon-ok-sign icon-app-config'></i> <b>"+config.app[z].name+"</b>";
                out += "<br><span class='app-config-info'></span>";
                var checked = ""; if (config.app[z].default) checked = "checked";
                out += " <input class='app-config-value' type='checkbox' key='"+z+"' "+checked+" / >";
            } else if (config.app[z].type=="select") {
                out += "<i class='status icon-ok-sign icon-white'></i> <b>"+config.app[z].name+"</b>";
                out += "<select class='app-config-value' key='"+z+"' style='margin-top:5px; width:100%'>";
                for (var o in config.app[z].options) {
                    out += "<option>"+config.app[z].options[o]+"</option>";
                }
                out += "</select>";
            }
            out += "</div>";
        }
        
        out += "<br><div style='text-align:center;'><button class='btn app-launch' style='padding:10px; display:none'>Launch App</button><button class='btn btn-danger app-delete' style='padding:10px; margin-left:20px'><i class='icon-trash icon-app-config'></i> Delete</button></div>";
        
        $(".app-config").html(out);

        for (var z in config.app) {
            var configItem = $(".app-config-box[key="+z+"]");
            
            if (config.app[z].type=="feed") {
                // Create list of feeds that satisfy engine requirement
                var out = "<option value=0>Select "+z+" feed:</option>" +
                        "<option value=auto>AUTO SELECT</option>" + 
                        "<option value=disable>DISABLE</option>"
                
                var feedsbygroup = [];
                for (var f in config.feedsbyid)  {
                    if (config.engine_check(config.feedsbyid[f], config.app[z])) {
                        var group = (config.feedsbyid[f].tag === null ? "NoGroup" : config.feedsbyid[f].tag);
                        if (group != "Deleted") {
                            if (!feedsbygroup[group]) feedsbygroup[group] = []
                            feedsbygroup[group].push(config.feedsbyid[f]);
                        }
                    }
                }
                for (group in feedsbygroup) {
                    out += "<optgroup label='"+group+"'>";
                    for (f in feedsbygroup[group]) {
                        out += "<option value="+feedsbygroup[group][f].id+">"+feedsbygroup[group][f].name+"</option>";
                    }
                    out += "</optgroup>";
                }
                configItem.find(".feed-select").html(out);
                
                var feedvalid = false;
                // Check for existing configuration
                if (config.db[z]!=undefined) {
                    var feedid = config.db[z];
                    if (config.feedsbyid[feedid]!=undefined && config.engine_check(config.feedsbyid[feedid],config.app[z])) {
                        var keyappend = ""; if (z!=config.feedsbyid[feedid].name) keyappend = z+": ";
                        configItem.find(".feed-name").html(keyappend+config.feedsbyid[feedid].name);
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
                if (config.db[z]!=undefined) configItem.find(".app-config-value").val(config.db[z]);
            }

            if (config.app[z].type=="checkbox") {
                if (config.db[z]!=undefined) configItem.find(".app-config-value")[0].checked = config.db[z];
            }

            if (config.app[z].type=="select") {
                if (config.db[z]!=undefined) configItem.find(".app-config-value").val(config.db[z]);
            }
                        
            // Set description
            configItem.find(".app-config-info").html(config.app[z].description);
        }
        
        if (config.check()) {
            $(".app-launch").show();
        }

        // Brings up the feed selector if the pencil item is clicked
        $(".app-config-edit").unbind("click");
        $(".app-config-edit").click(function(){
            var key = $(this).parent().attr("key");
            var configItem = $(".app-config-box[key="+key+"]");
            
            if (config.app[key].type=="feed") {
                configItem.find(".feed-select-div").show();
            }
        });

        $(".feed-select-ok").unbind("click");
        $(".feed-select-ok").click(function(){
            var key = $(this).parent().parent().attr("key");
            var configItem = $(".app-config-box[key="+key+"]");
            
            var feedid = $(this).parent().find(".feed-select").val();
            
            if (feedid!="auto" && feedid!=0 && feedid!="disable") {
                config.db[key] = feedid;
                var keyappend = ""; if (key!=config.feedsbyid[feedid].name) keyappend = key+": ";
                configItem.find(".feed-name").html(keyappend+config.feedsbyid[feedid].name);
                configItem.find(".status").addClass("icon-ok-sign"); 
                configItem.find(".status").removeClass("icon-remove-circle");
                // Save config
            }
            
            if (feedid=="auto") {
                delete config.db[key];
                configItem.find(".feed-name").html(config.app[key].autoname+" <span class='feed-auto'>[AUTO]</span>");
            }
            
            if (feedid=="disable") {
                config.db[key] = "disable"
                configItem.find(".feed-name").html(config.app[key].autoname+" <span class='feed-auto'>[DISABLED]</span>");
            }
            
            if (feedid!=0 ) {
                configItem.find(".feed-select-div").hide();
                config.set();
                
                if (config.check()) {
                    $(".app-launch").show();
                } else {
                    $(".app-launch").hide();
                }
            }
        });
        
        $(".app-config-value").unbind("click");
        $(".app-config-value").change(function(){
            var value = false;
            var key = $(this).parent().attr("key");
            var configItem = $(".app-config-box[key="+key+"]");
            
            if (config.app[key].type=="value") {
                value = $(this).val();
            } else if (config.app[key].type=="checkbox") {
                value = $(this)[0].checked;
            } else if (config.app[key].type=="select") {
                value = $(this).val();
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
                        for (var z in config.feedsbyid) {
                            // Check that the feed exists
                            // config will be shown if a previous valid feed has been deleted
                            var feedid = config.feedsbyid[z].id;
                            if (config.db[key] == feedid) {
                                if (config.engine_check(config.feedsbyid[z],config.app[key])) valid[key] = true;
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

            if (config.app[key].type=="select") {
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
        if (typeof conf.engine === 'undefined') {
            return true;
        }
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
                    if (result.success != undefined && !result.success) appLog("ERROR", result.message);
                } catch (e) {
                    try {
                        app.log("ERROR","Could not parse /setconfig reply, error: "+e);
                    } catch (e2) {
                        console.log(e,e2);
                    }
                }
            } 
        });
    },

    sortByLongname: function(a, b){
        var aName = a.longname.toLowerCase();
        var bName = b.longname.toLowerCase(); 
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }
}
