var feed = {

    listbyidasync: function(f)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var feeds = null;
        $.ajax({                                      
            url: path+"feed/list.json"+apikeystr,
            dataType: 'json',
            async: true,                      
            success: function(result) {
                feeds = result; 
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.listbyidasync invalid response: "+result);
                    f(null);
                    return;
                }
                
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
        
        var feeds = null;
        $.ajax({                                      
            url: path+"feed/list.json"+apikeystr,
            dataType: 'json',
            cache: false,
            async: false,                      
            success: function(result) {
                feeds = result; 
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.list invalid response: "+result);
                    feeds = null;
                }
            } 
        });
        
        return feeds;
    },
    
    listbyid: function() {
        var feeds = feed.list();
        if (feeds === null) { return null; }
        var byid = {};
        for (z in feeds) byid[feeds[z].id] = feeds[z];
        return byid;
    },
    
    listbyname: function() {
        var feeds = feed.list();
        if (feeds === null) { return null; }
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
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.getdata invalid response: "+result);
                }
                data = result; 
            }
        });
        return data;
    },
    
    getaverage: function(id,start,end,interval,skipmissing,limitinterval)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/average.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval,
            dataType: 'json',
            async: false,                      
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.getdata invalid response: "+result);
                }
                data = result; 
            }
        });
        return data;
    },
    
    getdataDMY: function(id,start,end,mode)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&mode="+mode,
            dataType: 'json',
            async: false,                      
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.getdataDMY invalid response: "+result);
                }
                data = result; 
            }
        });
        return data;
    },
    
    getdataDMY_time_of_use: function(id,start,end,mode,timeofusesplit)
    {
        var apikeystr = "";
        if (apikey!="") apikeystr = "?apikey="+apikey;
        
        var data = [];
        $.ajax({                                      
            url: path+"feed/data.json"+apikeystr,                         
            data: "id="+id+"&start="+start+"&end="+end+"&mode="+mode+"&split="+timeofusesplit,
            dataType: 'json',
            async: false,                      
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.getdataDMY invalid response: "+result);
                }
                data = result; 
            }
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
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Object) {
                    console.log("ERROR","feed.getmeta invalid response: "+result);
                }
                meta = result; 
            } 
        });
        return meta;
    },
    
    getvalue: function(feedid,time) 
    {
        var result = feed.getdata(feedid,time,time+1000,1,0,0);
        if (result.length>0) return result[0];
        return false;
    },
    
    getdataremote: function(id,start,end,interval)
    {   
        var data = [];
        $.ajax({                                      
            url: path+"app/dataremote",
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing=0&limitinterval=0",
            dataType: 'json',
            async: false,                      
            success: function(result) {
                if (!result || result===null || result==="" || result.constructor!=Array) {
                    console.log("ERROR","feed.getdataremote invalid response: "+result);
                    result = [];
                }
                data = result;
            }
        });
        return data;
    },
    
    getvalueremote: function(id)
    {   
        var value = 0;
        $.ajax({                                      
            url: path+"app/valueremote",                       
            data: "id="+id, dataType: 'json', async: false,                      
            success: function(result) {
                if (isNaN(result)) {
                    console.log("ERROR","feed.getvalueremote value is not a number, found: "+result);
                    result = 0;
                }
                value = parseFloat(result);
            }
        });
        return value;
    }
};
