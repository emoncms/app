var app = {
    basepath: path + "Modules/app/",
    include: {},
    loaded: {},

    load: function (appname) {
        app.loaded[appname] = true;
        // We load here the html of the app into an dedicated element for that app
        // when an app is loaded its html remains in the dom even when viewing another app
        // an app is just hidden and shown depending on the visibility settings.

        // we check here if the app has been loaded to the dom, if not we load it
        var dash = "app_" + appname,
            appdom = $("#" + dash),
            html = '',
            include='',
            file,
            i;

        if (appdom.length) {return true; }
        $.ajax({
            url: app.basepath + appname + "/" + appname + ".html",
            async: false,
            cache: false,
            success: function (data) {html = data; }
        });

        $("#content").append('<div class="apps" id="' + dash + '" style="display:none"></div>');
        $("#" + dash).html(html);

        $.ajax({
            url: app.basepath + appname + "/" + appname + ".js",
            dataType: 'script',
            async: false
        });
        // include the translation file required by asked language
        // check if answer is 200 or create a blank i18ntext variable
        $.ajax({
            url: app.basepath + "locale_js/app_" + 'en' + '.js',
            dataType: 'script',
            async: false,
            error: function () {
            }
        });
        $.ajax({
            url: app.basepath + "locale_js/app_" + lang + '.js',
            dataType: 'script',
            async: false,
            error: function () {
            }
        });
        // ----------------------------------------------------------
        // Included javascript loader
        // ----------------------------------------------------------
        include = window[dash].include;
        for (i = 0; i < include.length; i++) {
            file = include[i];
            if (app.include[file] === undefined) {
                //file = file.replace('%lang%', lang);
                app.include[file] = true;
                $.ajax({
                    url: path + file,
                    dataType: 'script',
                    async: false
                });
            }
        }
        window[dash].init();
        var result= {
        "ref":{
            "test":"test"
           }
        };
        // the DOM will be available here

        var flds = document.getElementsByClassName("i18n");
        var out = '';
        for(var i=0; i<flds.length;i++){
            var key = flds[i].innerHTML;
            result['ref'][key]=key
            if ( i18ntext[key] === undefined ){
                out +=("'" + key + "'" + " : '"+key + "',<br />");
                flds[i].innerHTML= key
            } else {
                flds[i].innerHTML= i18ntext[key]
            }
        }
        out = '<h3 class="i18n">Missing keys in i18n file</h3><div>' + out + '</div>';
        document.getElementById("obj").innerHTML= out

        return true;
    },

    show: function (appname) {
        var dash = "app_" + appname;
        if (app.loaded[appname] === undefined) {app.load(appname); }
        $(".apps").hide();
        $("#" + dash).show();
        if (window[dash] !== undefined) {window[dash].show(); }
    },

    hide: function (appname) {
        var dash = "app_" + appname;
        $("#" + dash).hide();
        if (window[dash] !== undefined) {window[dash].hide(); }
    },

    getconfig: function () {
        var config = {},
            apikeystr = (window.apikey !== undefined) ? "?apikey=" + apikey : "";

        //if (window.apikey !== undefined) {apikeystr = "?apikey=" + apikey; }
        $.ajax({
            url: path + "app/getconfig.json" + apikeystr,
            dataType: 'json',
            async: false,
            success: function (data) {config = data; }
        });
        app.config = config;
        return config;
    },

    setconfig: function (config) {
        $.ajax({
            url: path + "app/setconfig.json",
            data: "data=" + JSON.stringify(config),
            async: false,
            success: function (data) {}
        });
    }
};
