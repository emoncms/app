const DATAPOINTS_LIMIT = 800;

class Data {

    constructor(apikey) {
        if (typeof apikey !== 'undefined' || this.apikey != "") {
            this.auth = "?apikey=" + apikey;
        }
        else {
            this.auth = "";
        }
        this.cache = {};
        this.groups = {};
        this.updates = {};
    }

    static get DATAPOINTS_LIMIT() {
        return DATAPOINTS_LIMIT;
    }

    hasGroup(group) {
        return this.groups[group] != undefined;
    }

    getGroup(group) {
        return this.groups[group];
    }

    register(keys, config) {
        for (var i in keys) {
        	var key = keys[i];
        	
            if (this.cache[key] == undefined && config.app[key] != undefined && config.app[key]['value']) {
                this.setupFeed(key, config);
            }
        }
        this.updates = keys;
    }

    setup(name, keys, config) {
    	if (this.hasGroup(name)) return this.getGroup(name);
    	
        var data = {};
        for (var key in config.app) {
            if (keys.indexOf(key) < 0 || !config.app[key]['value']) {
            	continue;
            }
            var feed = this.setupFeed(key, config);
            data[key] = new DataSeries(key, feed);
        }
        var group = new DataCollection(name, data);
        this.groups[name] = group;
        
        return group;
    }

    setupFeed(key, config) {
        var feed = this.cache[key];
        if (feed == undefined) {
            var f = config.feedsbyid[config.app[key]['value']];
            if (f.engine == 5 || f.engine == 6) {
                feed = new FixedIntervalFeed(f.id, f.engine, this.auth);
            }
            else {
                feed = new DataFeed(f.id, f.engine, this.auth);
            }
            this.cache[key] = feed;
        }
        return feed;
    }

    loadFeeds() {
        return $.ajax({
            url: path+"feed/list.json"+this.auth,
            dataType: 'json',
            cache: false,
            async: true,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                	var error = "data.loadFeeds() received invalid result: " + result.message;
                    console.log("ERROR", error);
                    throw error;
                }
                return result;
            }
        });
    }

    loadMeta() {
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache) {
            var feed = this.cache[key];
            
            // Initialize the feeds earliest data, to enable verifications for consumption intervals
            // Fixed interval feeds will initialize meta data as well, to enable all load requests
            // to be aligned with the interval
            requests.push(feed.loadEarliest());
        }
        return Promise.all(requests).then(function() {
            return this;
        }.bind(this));
    }

    loadData(group, start, end, interval) {
        return getGroup(group).loadData(start, end, interval);
    }

    loadDailyData(group, start, end) {
        return getGroup(group).loadDailyData(start, end);
    }

    latest() {
    	var values = {};
    	for (let i in this.updates) {
    		var key = this.updates[i];
    		var feed = this.cache[key];
        	if (feed != undefined) {
            	values[key] = feed.latest;
        	}
    	}
    	return values;
    }

    update() {
        return this.loadFeeds().then(function(result) {
            var feeds = {};
        	var values = {};
        	if (result === null) return values;
            for (var i in result) {
            	feeds[result[i].id] = result[i];
            }
        	for (let i in this.updates) {
        		var key = this.updates[i];
        		var feed = this.cache[key];
                var data = feeds[feed.id];
                if (data.value == null) {
                	continue;
                }
            	var value = [data.time*1000, data.value];
            	values[key] = value;
                
                // Update the latest cached time value
            	feed.latest = value;
                
                // Append latest cached values to the cached series, if the passed flag indicates it
            	for (var name in this.groups) {
            		var group = this.groups[name];
            		if (!group.has(key)) continue;
            		
                	var series = group.get(key);
                    if (series.live) {
                        series.append();
                        
                        // If the cache exceeds the specified datapoint limit, trim the first value
                        if (series.getLength() > Data.DATAPOINTS_LIMIT) {
                            series.trim();
                        }
                    }
            	}
        	}
        	return values;
        	
        }.bind(this));
    }
}

class DataCollection {

    constructor(name, series) {
    	this.name = name;
        this.series = series;
    }

    has(key) {
        if (this.series[key] != undefined) {
            return true;
        }
        return false;
    }

    get(key) {
        if (this.series[key] != undefined) {
            return this.series[key];
        }
        else console.warn(new Date()+": Unknown key \""+key+"\" to get data series");
    }

    getName() {
    	return this.name;
    }

    getData(key) {
        if (this.get(key) != null) {
            return this.get(key).data;
        }
        return [];
    }

    getLength(key) {
        if (this.get(key) != null) {
            return this.get(key).data.length;
        }
        return null;
    }

    getLatestTime(key) {
        if (this.get(key) != null) {
            return this.get(key).getLatestTime();
        }
        return null;
    }

    getLatestValue(key) {
        if (this.get(key) != null) {
            return this.get(key).getLatestValue();
        }
        return null;
    }

    getEarliestTime(key) {
        if (this.get(key) != null) {
            return this.get(key).getEarliestTime();
        }
        return null;
    }

    getEarliestValue(key) {
        if (this.get(key) != null) {
            return this.get(key).getEarliestValue();
        }
        return null;
    }

    getEarliestTime() {
        var earliestTime = null;
        for (var key in this.series) {
            var series = this.get(key);
            var time = series.getEarliestTime();
            if (time != null && (earliestTime == null || time < earliestTime)) {
                earliestTime = time;
            }
        }
        return earliestTime;
    }

    getDailyValue(key, time) {
        if (this.get(key) != null) {
            return this.get(key).getDailyValue(time);
        }
        return null;
    }

    hasDailyData(start, end) {
        for (var key in this.series) {
            var series = this.get(key);
            if (!series.hasInterval(start, end, 86400)) {
                return false;
            }
        }
        return true;
    }

    hasData(start, end, interval) {
        for (var key in this.series) {
            var series = this.get(key);
            if (!series.hasInterval(start, end, interval)) {
                return false;
            }
        }
        return true;
    }

    iterateDailyData(start, end) {
        // Each iteration will return the cached value of all configured feeds for a specific day
        // for the passed time interval
        var iterator = {};
        iterator[Symbol.iterator] = function *() {
            // The indices object is used to remember the position of the last correctly aligned
            // time value. As the time values will never decrease with increasing index, this 
            // enables to only loop each feeds data array once in total, while aligning the data
            // of all available feeds
            var indices = {};
            
            var date = new Date(start);
            var time = date.getTime();
            while (time <= end) {
                var day = {};
                day['time'] = time;
                
                // Iterate all configured daily data series and treat missing days as zero value
                for (var key in this.series) {
                    var series = this.get(key);
                    if (indices[key] == undefined) indices[key] = 0;
                    
                    var {index, result} = series.iterateDay(time, indices[key]);
                    
                    indices[key] = index;
                    day[key] = result;
                }
                yield day;
                
                // Add a day to the date object, to avoid DST problems
                date.setDate(date.getDate()+1);
                time = date.getTime();
            }
        }.bind(this);
        return iterator;
    }

    iterateData(start, end, interval) {
        // Each iteration will return the cached value of all configured feeds for a specific time
        // for the passed time interval
        var intervalMillis = null;
        if (interval == undefined) {
            intervalMillis = 1000;
            for (var key in this.series) {
                var series = this.get(key);
                intervalMillis = Math.max(interval, series.interval);
            }
        }
        else intervalMillis = interval*1000;
        
        var iterator = {};
        iterator[Symbol.iterator] = function *() {
            // The indices object is used to remember the position of the last correctly aligned
            // time value. As the time values will never decrease with increasing index, this 
            // enables to only loop each feeds data array once in total, while aligning the data
            // of all available feeds
            var indices = {};
            
            var time = start;
            while (time <= end) {
                var timevalue = {};
                timevalue['time'] = time;
                
                // Iterate all configured daily data series and treat missing days as zero value
                for (var key in this.series) {
                    var series = this.get(key);
                    if (indices[key] == undefined) indices[key] = 0;
                    
                    var {index, result} = series.iterate(time, intervalMillis, indices[key]);
                    
                    indices[key] = index;
                    timevalue[key] = result;
                }
                yield timevalue;

                time += intervalMillis;
            }
        }.bind(this)
        
        return iterator;
    }

    loadData(start, end, interval) {
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.series) {
            var series = this.get(key);
            
            requests.push(series.loadData(start, end, interval));
        }
        return Promise.all(requests).then(function() {
            return this;
        }.bind(this));
    }

    loadDailyData(start, end) {
        var now = new Date();
        now.setHours(0,0,0,0);
        var today = now.getTime()
        
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.series) {
            var series = this.get(key);
            
            series.setToday(today);
            requests.push(series.loadDailyData(start, end));
        }
        return Promise.all(requests).then(function() {
            return this;
        }.bind(this));
    }
}

class DataSeries {

    constructor(key, feed) {
        this.feed = feed;
        this.key = key;
        
        this.live = false;
        this.today = null;
        this.interval = 0;
        
        this.data = [];
    }

    setToday(today) {
        this.today = today;
    }

    getToday() {
        if (this.today == null) {
            var now = new Date();
            now.setHours(0,0,0,0);
            
            this.today = now.getTime()
        }
        return this.today;
    }

    getLength() {
        return this.data.length;
    }

    getTolerance(interval) {
        return Math.max(0.005*interval+5000, interval*0.1) + interval;
    }

    getInterval() {
        return this.interval;
    }

    hasInterval(start, end, interval) {
        if (this.data.length == 0) {
            return false;
        }
        if (interval > 0 && this.interval > interval*1000) {
            return false
        }
        var tolerance = this.getTolerance(interval*1000);
        if (start >= this.data[0][0] - tolerance && end <= this.data[this.data.length-1][0] + tolerance) {
        	return true;
        }
        return false;
    }

    getLatestTime() {
        if (this.feed.latest != null) {
            var time = parseInt(this.feed.latest[0]);
            if (!isNaN(time)) {
                return time;
            }
        }
        return null;
    }

    getLatestValue() {
        if (this.feed.latest != null) {
            var value = parseFloat(this.feed.latest[1]);
            if (!isNaN(value)) {
                return value;
            }
        }
        return null;
    }

    getEarliestTime() {
        if (this.feed.earliest != null) {
            var time = parseInt(this.feed.earliest[0]);
            if (!isNaN(time)) {
                return time;
            }
        }
        return null;
    }

    getEarliestValue() {
        if (this.feed.earliest != null) {
            var value = parseFloat(this.feed.earliest[1]);
            if (!isNaN(value)) {
                return value;
            }
        }
        return null;
    }

    loadData(start, end, interval) {
        // Only reload, if the requested interval is not already hold in cache
        if (this.hasInterval(start, end, interval)) {
            return Promise.resolve(this.data);
        }
        this.interval = interval*1000;
        this.live = new Date().getTime() - end < this.interval;
        
        return this.feed.loadData(start, end, interval).then(function(result) {
            this.data = result;
            return result;
            
        }.bind(this));
    }

    loadDailyData(start, end) {
        // Only reload, if the requested interval is not already hold in cache
        if (this.hasInterval(start, end)) {
            return Promise.resolve(this.data);
        }
        this.live = false;
        var interval = 86400000;
        this.interval = interval;
        end += interval;
        
        return this.feed.loadDailyData(start, end).then(function(result) {
            var tolerance = this.getTolerance(interval);
            var data = [];
            
            if (result.length == 0) {
                this.data = [];
                return Promise.resolve(data);
            }
            // Remove NaN values and align values to midnight of each day
            var date = new Date(start);
            var time = date.getTime();
            
            var index = 0;
            while (time < end) {
                // Iterate all configured daily data series and treat missing days as zero value
                for (var i=index; i<result.length; i++) {
                    var deltaThis = Math.abs(time - result[i][0]);
                    var deltaLast = Math.abs(time - result[index][0]);
                    
                    if (deltaThis > deltaLast) {
                        break;
                    }
                    else if (deltaThis <= deltaLast) {
                        index = i;
                    }
                }
                if (result[index][1] != null &&
                        Math.abs(time - result[index][0]) < tolerance) {
                    
                    data.push([time, result[index][1]]);
                }
                
                // Add a day to the date object, to avoid DST problems
                date.setDate(date.getDate()+1);
                time = date.getTime();
            }
            this.data = data;
            return data;
            
        }.bind(this));
    }

    getDailyValue(time) {
        var {index, result} = this.iterateDay(time, 0);
        
        return result;
    }

    iterateDay(time, index) {
        var result = 0;

        // Calculate the daily totals by subtracting each day from the upcoming day
        if (time == this.getToday()) {
            var latestValue = this.getLatestValue();
            var todayValue = null;
            if (this.data.length > 0 && this.data[this.data.length-1][0] == time) {
                todayValue = this.data[this.data.length-1];
            }
            else {
                //todayValue = this.feed.loadTimevalue(time);
            }
            if (todayValue == null || todayValue[1] == null) {
                todayValue = [
                    this.getEarliestTime(),
                    this.getEarliestValue()
                ];
            }
            result = latestValue - todayValue[1];
        }
        else if (this.data.length > 0) {
            var tolerance = this.getTolerance(this.interval);
            
            for (var i=index; i<this.data.length; i++) {
                if (this.data[i][0] == time) {
                    index = i;
                    break;
                }
            }
            if (index < this.data.length-1 && 
                    Math.abs(time - this.data[index][0]) < tolerance &&
                    Math.abs(this.data[index+1][0] - this.data[index][0]) < tolerance) {
                
                result = this.data[index+1][1] - this.data[index][1];
            }
        }
        return {'index': index, 'result': result};
    }

    iterate(time, interval, index) {
        var result = null;
        
        if (this.data.length > 0) {
            for (var i=index; i<this.data.length; i++) {
                var deltaThis = Math.abs(time - this.data[i][0]);
                var deltaLast = Math.abs(time - this.data[index][0]);
                
                if (deltaThis > deltaLast) {
                    break;
                }
                else if (deltaThis <= deltaLast) {
                    index = i;
                }
            }
            var tolerance = this.getTolerance(interval);
            if (Math.abs(time - this.data[index][0]) < tolerance) {
                result = this.data[index][1];
            }
        }
        return {'index': index, 'result': result};
    }

    append() {
        if (this.data.length > 0) {
            if (this.feed.latest[0] - this.data[this.data.length-1][0] >= this.interval) {
                this.data.push(this.feed.latest);
                
                console.log(new Date()+": Appending value to series \""+this.key+"\": "+this.feed.latest[1]);
            }
        }
        else {
            this.data.push(this.feed.latest);
        }
    }

    trim() {
        // The shift() method removes the first item of an array, and returns that item
        this.data.shift();
    }

}

class DataFeed {

    constructor(id, engine, auth) {
        this.auth = auth;
        this.id = id;
        
        this.engine = engine;
        this.earliest = null;
        this.latest = null;
    }

    loadTimevalue(time) {
        // TODO: Check if the value maybe is hold in cache
        return this.loadData(time, time+1000, 1).then(function(data) {
            return data.length > 0 ? data[0] : null;
        });
    }

    loadEarliest() {
        // For feeds without an interval like for the PHPTimeseries engine, the closest value to 0
        // will be returned as the earliest time value
        return this.loadTimevalue(0).then(function(result) {
            this.earliest = result;
            
        }.bind(this));
    }

    loadData(start, end, interval) {
        return $.ajax({
            url: path+"feed/data.json"+this.auth,
            data: "id="+this.id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing="+1+"&limitinterval="+1,
            dataType: 'json',
            context: this,
            cache: false,
            async: true,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                	var error = "data.loadData() received invalid result: " + result.message;
                    console.log("ERROR", error);
                    throw error;
                }
                this.latest = result[result.length-1];
                return result;
            }
        });
    }

    loadDailyData(start, end) {
        return $.ajax({
            url: path+"feed/data.json"+this.auth,
            data: "id="+this.id+"&start="+start+"&end="+end+"&mode=daily",
            dataType: 'json',
            async: true,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                	var error = "data.loadDailyData() received invalid result: " + result.message;
                    console.log("ERROR", error);
                    throw error;
                }
                return result;
            }
        });
    }
}

class FixedIntervalFeed extends DataFeed {

    constructor(key, id, engine, api) {
        super(key, id, engine, api);
        this.meta = null;
    }

    loadTimevalue(time) {
        // If the meta data is already initialized, align the requested time with the feeds meta data
        if (this.meta != null) {
            var interval = this.meta.interval*1000;
            var start = this.meta.start_time*1000;

            if (time > start) {
                time = start + Math.round((time - start)/interval)*interval;
            }
            return super.loadTimevalue(time);
        }
        return Promise.resolve(null);
    }

    loadEarliest() {
        // For fixed interval feeds, this information is held in its meta data
        return this.loadMeta().then(function(result) {
            var earliestTime = result.start_time*1000;
            return this.loadTimevalue(earliestTime);
            
        }.bind(this)).then(function(result) {
            this.earliest = result;
            return result;
            
        }.bind(this));
    }

    loadMeta() {
    	return $.ajax({                                      
            url: path+"feed/getmeta.json"+this.auth,
            data: "id="+this.id,
            dataType: 'json',
            context: this,
            cache: false,
            async: true,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Object) {
                	var error = "data.loadMeta() received invalid result: " + result.message;
                    console.log("ERROR", error);
                    throw error;
                }
                this.meta = result;
                return result;
            }
        });
    }

    loadData(start, end, interval) {
        // Align the interval, start and stop times with the feeds meta data
        if (interval > this.meta.interval) {
            interval = Math.ceil(interval/this.meta.interval)*this.meta.interval;
        }
        else {
            interval = this.meta.interval;
        }
        var intervalMillis = interval*1000;
        var startMeta = this.meta.start_time*1000;
        
        if (start >= startMeta) {
            start = startMeta + Math.ceil((start - startMeta)/intervalMillis)*intervalMillis;
        }
        else {
            start = startMeta;
        }
        
        if (end >= startMeta) {
            end = startMeta + Math.floor((end - startMeta)/intervalMillis)*intervalMillis;
            if (end == start) {
            	end += intervalMillis;
            }
            
            // Only reload, if the requested interval is not already hold in cache
            return super.loadData(start, end, interval);
        }
        this.latest = null;
        return Promise.resolve([]);
    }
}
