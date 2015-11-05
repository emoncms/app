var datastore = {};

var timeseries = {

    // -------------------------------------------------------------------------------------------------------
    // IN BROWSER TIMESERIES DATA STORE
    // with features for appending a new datapoint and triming the old data in order to create a moving view
    // -------------------------------------------------------------------------------------------------------
    
    load: function (name,start,end,interval)
    {
        start *= 0.001; end *= 0.001;
        interval = Math.round(interval);
        start = Math.floor(start/interval)*interval;
        end = Math.ceil(end/interval)*interval;
        start *= 1000; end *= 1000;
        
        var apikeystr = "";
        if (apikey!="") apikeystr = "&apikey="+apikey;
        
        $.ajax({                                      
            url: path+"feed/data.json",                         
            data: "id="+name+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing=0&limitinterval=0"+apikeystr,
            dataType: 'json',
            async: false,                      
            success: function(data_in) { data = data_in; } 
        });
        
        datastore[name] = {};
        datastore[name].data = data;
        
        datastore[name].start = 0;
        datastore[name].interval = 0;
        if (datastore[name].data[0]!=undefined) {
            datastore[name].start = datastore[name].data[0][0] * 0.001;
            datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
        }
    },
    
    append: function (name,time,value)
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
    
    trim_start: function (name,newstart)
    {
        if (datastore[name]==undefined) return false;
        
        var interval = datastore[name].interval;
        var start = datastore[name].start;
        
        newstart = Math.floor(newstart/interval)*interval;
        var pos = (newstart - start) / interval;
        var tmpdata = [];
        
        if (pos>=0) {
            for (var p=pos; p<datastore[name].data.length; p++) {
                if (datastore[name].data[p]==undefined) {
                    console.log("undefined: "+p);
                    console.log(interval)
                    console.log(start)
                }
                var t = datastore[name].data[p][0];
                var v = datastore[name].data[p][1];
                tmpdata.push([t,v]);
            }
            datastore[name].data = tmpdata;
            datastore[name].start = datastore[name].data[0][0] * 0.001;
            datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
        }
    }  
}
