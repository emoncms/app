


var config = {

    initialized: false,

    id: false,
    name: "",
    db: {},
    app: {},
    feeds: {},
    feedsbyid: {},
    feedsbyname: {},
    app_name: "",
    // Common options: 
    // Blue: #44b3e2, Green: #5cb85c, Yellow: #f0ad4e, Red: #d9534f, Grey: #aaa
    app_name_color: "#44b3e2",

    init: function() {
        // console.log("CONFIG: Init");

        vue_config.app_name = config.app_name;
        vue_config.app_name_color = config.app_name_color || "#44b3e2";
        let html = $("#appconf-description").html();
        vue_config.app_description = html ? html : "";
        
        for (var z in config.feeds) config.feedsbyname[config.feeds[z].name] = config.feeds[z];
        for (var z in config.feeds) config.feedsbyid[config.feeds[z].id] = config.feeds[z];
        
        // Check that the config is complete first otherwise show config interface
        if (!config.check()) {
            if (!public_userid) {
                if (session_write == undefined) {
                    config.showConfig();          // Show setup block
                    config.UI();                  // Populate setup UI options
                    config.autogen.render_feed_list();
                } else {
                    if (session_write) {
                        config.showConfig();          // Show setup block
                        config.UI();                  // Populate setup UI options
                        config.autogen.render_feed_list();
                    } else {
                        alert("Invalid app configuration");
                    }
                }
            } else {
                $("#app-block").show();       // Show app block
            }
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
        $("body").css('background-color','#222');
        $("#footer").css('background-color','#181818');
        $("#footer").css('color','#999');
        vue_config.renderUI();
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
        var auto_conf_to_save = false;
        
        for (var key in config.app) {
            
            if (config.app[key].type=="feed") {
                config.app[key].value = false;
                

                // Overwrite with any user set feeds if applicable
                if (config.db[key]!=undefined) {
                    config.app[key].value = config.db[key];
                } else {
                    // Check if feeds match naming convention
                    var autoname = config.app[key].autoname;
                    if (config.feedsbyname[autoname]!=undefined) {
                        config.app[key].value = config.feedsbyname[autoname].id;
                        config.db[key] = config.feedsbyname[autoname].id;
                        auto_conf_to_save = true;
                    }
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
        
        if (auto_conf_to_save) {
            config.set();
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
            data: "id="+config.id+"&config="+JSON.stringify(config.db),
            dataType: 'text',
            async: false, 
            success: function(result){
                try {
                    result = JSON.parse(result);
                    if (result.success != undefined && !result.success) appLog("ERROR", result.message);

                    // If success update config.app with latest from config.db
                    for (var key in config.app) {
                        if (config.app[key].type == "feed" || config.app[key].type == "value" || config.app[key].type == "checkbox" || config.app[key].type == "select") {
                            if (config.db[key] != undefined) {
                                config.app[key].value = config.db[key];
                                // console.log("Updated config.app["+key+"].value to "+config.db[key]);
                            }
                        }
                    }

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

    set_name: function()
    {   
        $.ajax({ 
            url: path+"app/setname", 
            data: "id="+config.id+"&name="+config.name,
            dataType: 'text',
            async: false, 
            success: function(result){
                try {
                    result = JSON.parse(result);
                    if (result.success != undefined && !result.success) appLog("ERROR", result.message);
                } catch (e) {
                    try {
                        app.log("ERROR","Could not parse /setname reply, error: "+e);
                    } catch (e2) {
                        console.log(e,e2);
                    }
                }
            } 
        });
    },

    set_public: function()
    {   
        $.ajax({ 
            url: path+"app/setpublic", 
            data: "id="+config.id+"&public="+config.public,
            dataType: 'text',
            async: false, 
            success: function(result){
                try {
                    result = JSON.parse(result);
                    if (result.success != undefined && !result.success) appLog("ERROR", result.message);
                } catch (e) {
                    try {
                        app.log("ERROR","Could not parse /setpublic reply, error: "+e);
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
    },

    // -----------------------------------------------------------------------
    // autogen: helpers for apps that declare feeds with autogenerate:true
    //
    // Apps opt in by setting before calling config.init():
    //
    //   config.autogen_node_prefix = "app_myappname";
    //     The tag used for auto-generated feeds becomes
    //     config.autogen_node_prefix + "_" + config.id
    //     Defaults to "app_" + config.id when not set.
    //
    //   config.autogen_feed_defaults = { datatype: 1, engine: 5, options: { interval: 1800 } };
    //     Merged into each feed/create.json request.
    //     Defaults to { datatype: 1, engine: 5, options: { interval: 1800 } } when not set.
    //
    //   config.autogen_feeds_by_tag_name = feed.by_tag_and_name(config.feeds);
    //     Lookup used to check which feeds already exist.
    //     Must be kept up to date by the app after refreshing config.feeds.
    // -----------------------------------------------------------------------
    autogen: {

        post_process_already_running: false,
        post_process_run_count: 0,

        // Return the node tag string used for all auto-generated feeds
        node_name: function() {
            if (!config.app || !config.app.autogenerate_nodename) return "";
            var node_name = config.app.autogenerate_nodename.default;
            if (config.app.autogenerate_nodename.value != undefined) {
                node_name = config.app.autogenerate_nodename.value;
            }

            return node_name.trim();
        },

        // Set autogenerate node name when the user clicks "Set node" button
        set_node: function() {
            var node_name = vue_config.autogen_node.trim();
            if (node_name) {
                config.db['autogenerate_nodename'] = node_name;
                config.app.autogenerate_nodename.value = node_name;
                config.set();
                config.autogen.render_feed_list();
            } else {
                alert("Please enter a valid node name");
            }
        },

        // Return array of { key, name, feedid } for every feed marked autogenerate:true
        get_feeds: function() {
            var node_name = config.autogen.node_name();
            var lookup = config.autogen_feeds_by_tag_name || {};
            var feeds = [];

            for (var key in config.app) {
                if (config.app.hasOwnProperty(key) && config.app[key].autogenerate) {
                    // Skip hidden feeds (e.g. battery feeds when has_battery is off)
                    if (config.app[key].hidden === true) continue;

                    var feed_name = config.app[key].autoname || key;
                    var feedid = false;

                    if (lookup[node_name] != undefined) {
                        if (lookup[node_name][feed_name] != undefined) {
                            feedid = lookup[node_name][feed_name]['id'];
                        }
                    }

                    feeds.push({ key: key, name: feed_name, feedid: feedid });
                }
            }
            return feeds;
        },

        // Render the autogen feed list — delegates to vue_config
        render_feed_list: function() {
            config.autogen.refresh_autogen_feed_references();
            vue_config.renderAutogenFeedList();
        },

        // Create any feeds that are missing
        create_missing_feeds: function() {
            var node_name = config.autogen.node_name();
            var missing = config.autogen.get_feeds().filter(function(f) { return !f.feedid; });
            var defaults = config.autogen_feed_defaults || { datatype: 1, engine: 5, options: { interval: 1800 } };
            var created = 0, errors = 0;

            vue_config.autogen_status = "Creating feeds...";
            vue_config.autogen_status_color = "#aaa";

            missing.forEach(function(item) {
                $.ajax({
                    url: path + "feed/create.json",
                    data: $.extend({}, defaults, {
                        tag: node_name,
                        name: item.name,
                        options: JSON.stringify(defaults.options || { interval: 1800 }),
                        apikey: apikey,
                        unit: "kWh"
                    }),
                    dataType: "json",
                    async: false,
                    success: function(res) { (res && res.feedid) ? created++ : errors++; },
                    error: function() { errors++; }
                });
            });

            // Refresh feed lookups
            config.feeds = feed.list();
            config.feedsbyname = {};
            config.feedsbyid = {};
            for (var z in config.feeds) config.feedsbyname[config.feeds[z].name] = config.feeds[z];
            for (var z in config.feeds) config.feedsbyid[config.feeds[z].id]   = config.feeds[z];
            config.autogen_feeds_by_tag_name = feed.by_tag_and_name(config.feeds);

            // Populate config.app[key].value for the newly created autogen feeds
            config.autogen.refresh_autogen_feed_references();
            config.load();

            config.autogen.render_feed_list();

            var statusText = errors === 0
                ? "Created " + created + " feed(s) successfully."
                : "Created " + created + " feed(s), " + errors + " error(s).";
            vue_config.autogen_status = statusText;
            vue_config.autogen_status_color = errors === 0 ? "#5cb85c" : "#f0ad4e";
        },

        start_post_processor: function() {
            if (config.autogen.post_process_already_running) {
                vue_config.autogen_status = "Post-processor is already running, please wait...";
                vue_config.autogen_status_color = "#f0ad4e";
                return false;
            } else {
                config.autogen.post_process_already_running = true;
            }
            config.autogen.post_process_run_count = 0;
            config.autogen.run_post_processor();
        },

        // Trigger the app post-processor via app/process
        run_post_processor: function() {

            if (config.autogen.post_process_run_count == 0) {
                vue_config.autogen_status = "Starting post-processor...";
                vue_config.autogen_status_color = "#aaa";
            } else {
                vue_config.autogen_status = "Post-processor is still running, please wait...";
                vue_config.autogen_status_color = "#f0ad4e";
            }
            
            config.autogen.post_process_run_count++;

            $.ajax({
                url: path + "app/process",
                data: { id: config.id, apikey: apikey },
                dataType: "json",
                timeout: 120000,
                success: function(result) {
                    if (result && result.success) {

                        if (result.more_to_process) {
                            vue_config.autogen_status = "Post-processor is still running, please wait...";
                            vue_config.autogen_status_color = "#f0ad4e";
                            // run post processor again but only a maximum of 30 times (5 mins) to prevent infinite loops in case of an issue
                            if (config.autogen.post_process_run_count < 30) {
                                setTimeout(function() {
                                    config.autogen.run_post_processor();
                                }, 1000);
                            } else {
                                vue_config.autogen_status = "Post-processor is taking longer than expected, please check the app logs.";
                                vue_config.autogen_status_color = "#f0ad4e";
                                config.autogen.post_process_already_running = false;
                            }
                        } else {
                            vue_config.autogen_status = "Post-processor completed successfully.";
                            vue_config.autogen_status_color = "#5cb85c";
                            config.autogen.post_process_already_running = false;
                        }


                    } else {
                        var msg = (result && result.message) ? result.message : "Unknown response";
                        vue_config.autogen_status = "Post-processor: " + msg;
                        vue_config.autogen_status_color = "#f0ad4e";
                        config.autogen.post_process_already_running = false;
                    }
                },
                error: function(xhr) {
                    vue_config.autogen_status = "Post-processor failed: " + xhr.statusText;
                    vue_config.autogen_status_color = "#d9534f";
                    config.autogen.post_process_already_running = false;
                },
                complete: function() { }
            });
        },

        // Clear (reset) all auto-generated feeds after confirmation
        reset_feeds: function() {
            var autogen_feeds = config.autogen.get_feeds();
            var count = autogen_feeds.filter(function(f) { return f.feedid; }).length;

            if (!confirm("Are you sure you want to clear all " + count + " auto-generated feed(s)? This cannot be undone.")) return;

            var feed_ids = autogen_feeds.filter(function(f) { return f.feedid; }).map(function(f) { return f.feedid; });

            if (feed_ids.length === 0) {
                vue_config.autogen_status = "No matching feeds found to clear.";
                vue_config.autogen_status_color = "#f0ad4e";
                return;
            }

            vue_config.autogen_status = "Clearing feeds...";
            vue_config.autogen_status_color = "#aaa";

            var cleared = 0, errors = 0;

            feed_ids.forEach(function(id) {
                $.ajax({
                    url: path + "feed/clear.json",
                    data: { id: id, apikey: apikey },
                    dataType: "json",
                    async: false,
                    success: function(res) { (res && res.success) ? cleared++ : errors++; },
                    error: function() { errors++; }
                });
            });

            // Refresh feed list
            config.feeds = feed.list();
            config.autogen_feeds_by_tag_name = feed.by_tag_and_name(config.feeds);
            config.autogen.render_feed_list();

            var statusText = errors === 0
                ? "Cleared " + cleared + " feed(s) successfully."
                : "Cleared " + cleared + " feed(s), " + errors + " error(s).";
            vue_config.autogen_status = statusText;
            vue_config.autogen_status_color = errors === 0 ? "#5cb85c" : "#f0ad4e";
        },

        // Update config.app[key].value for each autogen feed based on current feedid lookups so that the UI shows correct feed selections
        refresh_autogen_feed_references: function() {
            var feeds = config.autogen.get_feeds();
            for (var i in feeds) {
                var f = feeds[i];
                if (f.feedid) {
                    config.app[f.key].value = f.feedid;
                    config.db[f.key] = f.feedid;
                } else {
                    delete config.db[f.key];
                    config.app[f.key].value = false;
                }
            }
        }
    },

    // Reset daily data
    reset_daily_data: function() {
        $.ajax({
            url: path + "app/cleardaily",
            data: { id: config.id, apikey: apikey },
            async: true,
            dataType: "json",
            success: function (result) {
                if (result.success) {
                    alert("Daily data cleared, please refresh the page to reload data");
                    app_log("INFO", "Daily data cleared");
                } else {
                    alert("Failed to clear daily data");
                    app_log("ERROR", "Failed to clear daily data");
                }
            }
        });
    }
}


var vue_config = new Vue({
    el: '#vue-config',
    data: {
        app_name: "App Name",
        app_name_color: "#44b3e2",
        app_description: "",
        app_instructions: "",
        config_name: "",
        config_public: false,
        config_items: [],
        config_valid: false,
        autogen_node: "",
        autogen_feeds: [],
        autogen_all_present: false,
        autogen_status: "",
        autogen_status_color: "#aaa",

        // Button only currently used by myheatpump app.
        enable_process_daily: false
    },
    methods: {

        // Build config_items from config.app and refresh all derived state.
        // Called by config.UI() every time the panel needs to (re-)render.
        renderUI: function() {
            if (typeof config.ui_before_render === 'function') config.ui_before_render();

            if (config.db.constructor === Array) config.db = {};
            for (var z in config.db) { if (config.db[z] == undefined) delete config.db[z]; }

            this.config_name   = config.name;
            this.config_public = !!config.public;

            // config.app.enable_process_daily.value
            if (config.app.enable_process_daily != undefined && config.app.enable_process_daily.value) {
                this.enable_process_daily = true;
            } else {
                this.enable_process_daily = false;
            }

            var items = [];
            for (var z in config.app) {
                if (config.app[z].autogenerate != undefined && config.app[z].autogenerate) continue;
                if (config.app[z].hidden === true) continue;

                var item = {
                    key:           z,
                    type:          config.app[z].type,
                    label:         config.app[z].name || config.app[z].autoname || z,
                    description:   config.app[z].description || "",
                    // feed-specific
                    displayName:   config.app[z].autoname || z,
                    selectionMode: "AUTO",
                    isValid:       false,
                    showSelector:  false,
                    derivable:     config.app[z].derivable || false,
                    feedGroups:    [],
                    selectedFeedId: 0,
                    // value / checkbox / select
                    inputValue:    config.app[z].default !== undefined ? config.app[z].default : "",
                    selectOptions: config.app[z].options || []
                };

                if (item.type === "feed") {
                    // Build grouped feed options
                    var byGroup = {};
                    for (var f in config.feedsbyid) {
                        if (config.engine_check(config.feedsbyid[f], config.app[z])) {
                            var grp = (config.feedsbyid[f].tag === null ? "NoGroup" : config.feedsbyid[f].tag);
                            if (grp !== "Deleted") {
                                if (!byGroup[grp]) byGroup[grp] = [];
                                byGroup[grp].push(config.feedsbyid[f]);
                            }
                        }
                    }
                    var feedGroups = [];
                    for (var g in byGroup) feedGroups.push({ name: g, feeds: byGroup[g] });
                    item.feedGroups = feedGroups;

                    // Resolve current selection
                    var feedvalid = false;
                    if (config.db[z] != undefined) {
                        if (config.db[z] === "disable") {
                            item.selectionMode  = "DISABLED";
                            item.selectedFeedId = "disable";
                        } else if (config.db[z] === "derive") {
                            item.selectionMode  = "DERIVE";
                            item.selectedFeedId = "derive";
                        } else {
                            var feedid = config.db[z];
                            if (config.feedsbyid[feedid] != undefined && config.engine_check(config.feedsbyid[feedid], config.app[z])) {
                                var keyappend = (z != config.feedsbyid[feedid].name) ? z + ": " : "";
                                item.displayName    = keyappend + config.feedsbyid[feedid].name;
                                item.selectionMode  = "";
                                item.selectedFeedId = feedid * 1;
                                feedvalid = true;
                            } else {
                                delete config.db[z];
                            }
                        }
                    }
                    // Auto-match by name if nothing is configured
                    if (config.db[z] == undefined) {
                        for (var n in config.feedsbyid) {
                            if (config.feedsbyid[n].name == config.app[z].autoname && config.engine_check(config.feedsbyid[n], config.app[z])) {
                                item.selectedFeedId = "auto";
                                item.selectionMode  = "AUTO";
                                feedvalid = true;
                            }
                        }
                    }
                    item.isValid = feedvalid;

                } else if (item.type === "value" || item.type === "checkbox" || item.type === "select") {
                    if (config.db[z] != undefined) item.inputValue = config.db[z];
                }

                items.push(item);
            }

            this.config_items = items;
            this.config_valid = config.check();
        },

        editFeed: function(key) {
            var item = this.config_items.find(function(i) { return i.key === key; });
            item.showSelector = true;
        },

        selectFeed: function(key, feedid) {
            if (feedid == 0) return;
            var item = this.config_items.find(function(i) { return i.key === key; });

            if (feedid !== "auto" && feedid !== "disable" && feedid !== "derive") {
                config.db[key] = feedid;
                var keyappend = (key != config.feedsbyid[feedid].name) ? key + ": " : "";
                item.displayName   = keyappend + config.feedsbyid[feedid].name;
                item.selectionMode = "";
                item.isValid       = true;
            }
            if (feedid === "auto") {
                delete config.db[key];
                item.displayName   = config.app[key].autoname;
                item.selectionMode = "AUTO";
                item.isValid       = true;
            }
            if (feedid === "disable") {
                config.db[key]     = "disable";
                item.displayName   = config.app[key].autoname;
                item.selectionMode = "DISABLED";
                item.isValid       = false;
            }
            if (feedid === "derive") {
                config.db[key]     = "derive";
                item.displayName   = config.app[key].autoname;
                item.selectionMode = "DERIVE";
                item.isValid       = true;
            }

            item.showSelector = false;
            config.set();
            this.config_valid = config.check();
            if (typeof config.ui_after_value_change === 'function') config.ui_after_value_change(key);
        },

        changeValue: function(key, value) {
            var item = this.config_items.find(function(i) { return i.key === key; });
            item.inputValue  = value;
            config.db[key]   = value;
            config.set();
            if (typeof config.ui_after_value_change === 'function') config.ui_after_value_change(key);
        },

        changeName: function(event) {
            var value = event.target.value;
            this.config_name = value;
            config.name = value;
            config.set_name();
        },

        changePublic: function(event) {
            var value = event.target.checked;
            this.config_public = value;
            config.public = value ? 1 : 0;
            config.set_public();
        },

        launchApp: function() {
            $(".ajax-loader").show();
            config.closeConfig();
            config.load();
            if (!config.initialized) {
                config.initapp();
                config.initialized = true;
            }
            config.showapp();
        },

        deleteApp: function() {
            console.log("delete: " + config.id);
            $.ajax({
                url: path + "app/remove",
                data: "id=" + config.id,
                dataType: 'text',
                async: false,
                success: function(result) {
                    try {
                        result = JSON.parse(result);
                        if (result.success != undefined && !result.success) appLog("ERROR", result.message);
                        window.location = path + "app/view";
                    } catch (e) {
                        console.log("Could not parse /remove reply, error: " + e);
                    }
                }
            });
        },

        setNode: function() {
            config.autogen.set_node();
        },

        // Rebuild the autogen feed list rows and button visibility from config.autogen state.
        // Replaces config.autogen.render_feed_list().
        renderAutogenFeedList: function() {
            var autogen_feeds = config.autogen.get_feeds();
            var node_name = config.autogen.node_name();

            this.autogen_node = node_name;

            var missing_count = 0;
            var rows = [];
            for (var j = 0; j < autogen_feeds.length; j++) {
                if (!autogen_feeds[j].feedid) missing_count++;
                rows.push({ name: autogen_feeds[j].name, node: node_name, feedid: autogen_feeds[j].feedid });
            }
            this.autogen_feeds = rows;
            this.autogen_all_present = (missing_count === 0);
            this.autogen_status = "";
            this.autogen_status_color = "#aaa";
        },

        createMissingFeeds: function() {
            config.autogen.create_missing_feeds();
        },

        runPostProcessor: function() {
            config.autogen.start_post_processor();
        },

        resetFeeds: function() {
            config.autogen.reset_feeds();
        },

        reloadDailyData: function() {
            config.reset_daily_data();
        }
    }
});