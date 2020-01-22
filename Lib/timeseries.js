var datastore = {};

var timeseries = {

    // -------------------------------------------------------------------------------------------------------
    // IN BROWSER TIMESERIES DATA STORE
    // with features for appending a new datapoint and triming the old data in order to create a moving view
    // -------------------------------------------------------------------------------------------------------
    
    load: function (name,data)
    {
        // If data is empty, don't do anything
        if (!data || data.length === 0) {
            return
        }
        datastore[name] = {};
        datastore[name].data = data;
        datastore[name].start = datastore[name].data[0][0] * 0.001;
        datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
    },
    
    append: function (name,time,value)
    {
        if (datastore[name]==undefined) {
            app_log("ERROR","timeseries.append datastore["+name+"] is undefined");
            return false;
        }
        
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
        if (datastore[name]==undefined) {
            app_log("ERROR","timeseries.trim_start datastore["+name+"] is undefined");
            return false;
        }
        
        var interval = datastore[name].interval;
        var start = datastore[name].start;
        
        newstart = Math.floor(newstart/interval)*interval;
        var pos = (newstart - start) / interval;
        var tmpdata = [];
        
        if (pos>=0) {
            for (var p=pos; p<datastore[name].data.length; p++) {
                var t = datastore[name].data[p][0];
                var v = datastore[name].data[p][1];
                tmpdata.push([t,v]);
            }
            datastore[name].data = tmpdata;
            datastore[name].start = datastore[name].data[0][0] * 0.001;
            datastore[name].interval = (datastore[name].data[1][0] - datastore[name].data[0][0])*0.001;
        }
    },
    
    value: function (name, index)
    {
        if (datastore[name]==undefined) {
            app_log("ERROR","timeseries.value datastore["+name+"] is undefined");
            return false;
        }
        
        if (datastore[name].data[index]==undefined) {
            app_log("ERROR","timeseries.value datastore["+name+"].data["+index+"] is undefined, data length: "+datastore[name].data.length);
            return null;
        } else {
            return datastore[name].data[index][1];
        }
    },
    
    length: function(name) {
        if (datastore[name]==undefined) {
            app_log("ERROR","timeseries.value datastore["+name+"] is undefined");
            return false;
        }
        
        return datastore[name].data.length;
    },
    
    start_time: function(name) {
        if (datastore[name]==undefined) {
            app_log("ERROR","timeseries.value datastore["+name+"] is undefined");
            return false;
        }
        
        return datastore[name].data[0][0];
    },
    
    data: function(name)
    {
        if (datastore[name]==undefined) {
            //app_log("ERROR","timeseries.data datastore["+name+"] is undefined");
            return [];
        }
        
        return datastore[name].data;
    }
}
