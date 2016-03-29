var feed = {

    listbyidasync: function(f)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var feeds = {};
        $.ajax({                                      
            url: path+"feed/list.json"+apikeystr,
            dataType: 'json',
            async: true,                      
            success: function(feeds) { 
                var byid = {};
                for (z in feeds) byid[feeds[z].id] = feeds[z];
                f(byid);
            } 
        });
    },

    list: function()
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
        
        return feeds;
    },
    
    listbyid: function() {
        var feeds = feed.list();
        var byid = {};
        for (z in feeds) byid[feeds[z].id] = feeds[z];
        return byid;
    },
    
    listbyname: function() {
        var feeds = feed.list();
        var byname = {};
        for (z in feeds) byname[feeds[z].name] = feeds[z];
        return byname;
    },
    
    getdata: function(id,start,end,interval,skipmissing,limitinterval)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing="+skipmissing+"&limitinterval="+limitinterval,
            dataType: 'json',
            async: false,                      
            success: function(data_in) { data = data_in; } 
        });
        return data;
    },
    
    getdataDMY: function(id,start,end,mode,timezone)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&mode="+mode+"&timezone="+timezone,
            dataType: 'json',
            async: false,                      
            success: function(data_in) { data = data_in; } 
        });
        return data;
    },
    
    getmeta: function(id)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var meta = {};
        $.ajax({                                      
            url: path+"feed/getmeta.json"+apikeystr,                         
            data: "id="+id,
            dataType: 'json',
            async: false,
            success: function(result) { meta = result; } 
        });
        return meta;
    },
    
    getvalue: function(feedid,time) 
    {
        var result = feed.getdata(feedid,time,time+1000,1,0,0);
        if (result.length>0) return result[0];
        return false;
    }
};
