var remote = {
    getdata: function(ids,start,end,interval,average=0,delta=0,skipmissing=0,limitinterval=0,timeformat='notime',callback=false,async=true){
        var remote_data = false;
        $.ajax({                                      
            url: path+"app/dataremote",
            data: {
                ids: ids.join(","),
                start: start,
                end: end,
                interval: interval,
                average: average,
                delta: delta,
                skipmissing: skipmissing,
                limitinterval: limitinterval,
                timeformat: timeformat
            },
            async: async,
            dataType: "json",
            success: function(result) {
                remote_data = result;
                // Convert data to time series
                if (timeformat=='notime' && skipmissing==0 && limitinterval==0){
                    for (var z in result) {
                        remote_data[z].data = remote.convert_to_timeseries(remote_data[z].data,start,interval*1000);
                    }
                }
                
                if (callback) {
                    callback(remote_data);
                }
            }
        });
        return remote_data;
    },
    convert_to_timeseries: function (data,start_time,intervalms) {
        var data_with_time = [];
        for (var i in data) {
            let time = start_time + (i*intervalms);
            data_with_time.push([time,data[i]]);
        } 
        return data_with_time;
    }
}
