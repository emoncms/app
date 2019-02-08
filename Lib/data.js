const DATAPOINTS_LIMIT = 800;

class DataCache {

    constructor(feed) {
        this.feed = feed;
        this.cache = null;
    }

    static get DATAPOINTS_LIMIT() {
        return DATAPOINTS_LIMIT;
    }

    setup(keys, config) {
        var data = {};
        for (var key in config.app) {
            if (config.app[key]['value'] && keys.indexOf(key) > -1) {
                var f = config.feedsbyid[config.app[key]['value']];
                var c = config.app[key]['class'];
                if (f.engine == 5 || f.engine == 6) {
                    data[key] = new FixedIntervalSeries(key, f.id, c, f.engine, feed);
                }
                else {
                    data[key] = new Series(key, f.id, c, f.engine, feed);
                }
            }
        }
        this.cache = new DataCollection(data);
        
        return this.cache;
    }

    has(key) {
        return this.cache.has(key);
    }

    get(key) {
        return this.cache.get(key);
    }

    getLatestTime(key) {
        return this.cache.getLatestTime(key);
    }

    getLatestValue(key) {
        return this.cache.getLatestValue(key);
    }

    getEarliestTime(key) {
        return this.cache.getEarliestTime(key);
    }

    getEarliestValue(key) {
        return this.cache.getEarliestValue(key);
    }

    getDailyEnergy(key, time) {
        return this.cache.getDailyEnergy(key, time);
    }

    hasDailyEnergy(start, end) {
        return this.cache.hasDailyEnergy(start, end);
    }

    hasPower(start, end, interval) {
        return this.cache.hasPower(start, end, interval);
    }

    loadMeta() {
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache.series) {
            var series = this.cache.get(key);

            // Initialize the feeds earliest data, to enable verifications for consumption intervals
            // Fixed interval feeds will initialize meta data as well, to enable all load requests
            // to be aligned with the interval
            requests.push(series.loadEarliest());
        }
        return Promise.all(requests).then(function() {
            return this.cache;
        }.bind(this));
    }

    loadDailyEnergy(start, end) {
        var now = new Date();
        now.setHours(0,0,0,0);
        var today = now.getTime()
        
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache.series) {
            var series = this.cache.get(key);
            if (series.type == 'energy') {
                series.setToday(today);
                requests.push(series.loadDailyEnergy(start, end));
            }
        }
        return Promise.all(requests).then(function() {
            return this.cache;
        }.bind(this));
    }

    loadPower(start, end, interval) {
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache.series) {
            var series = this.cache.get(key);
            if (series.type == 'power') {
                requests.push(series.load(start, end, interval));
            }
        }
        return Promise.all(requests).then(function() {
            return this.cache;
        }.bind(this));
    }

    update() {
        return this.feed.getListById(true).then(function(result) {
        	if (result === null) return;
            for (var key in this.cache.series) {
                var series = this.cache.get(key);
                var feed = result[series.id];
                
                if (feed.value != null) {
                    // Update the latest cached time value
                    // and append latest power values to the series data cache, if the passed flag indicates it
                    series.latest = [feed.time*1000, feed.value];
                    
                    if (series.type == 'power' && series.live) {
                        series.append();
                        
                        // If the cache exceeds the specified datapoint limit, trim the first value
                        if (series.getLength() > DataCache.DATAPOINTS_LIMIT) {
                            series.trim();
                        }
                    }
                }
            }
        }.bind(this));
    }

    iteratePower(start, end, interval) {
        return this.cache.iteratePower(start, end, interval);
    }

    iterateDailyEnergy(start, end) {
        return this.cache.iterateDailyEnergy(start, end);
    }
}

class DataCollection {
    
    constructor(series) {
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

    getEarliestEnergyTime() {
        var earliestTime = null;
        for (var key in this.series) {
            var series = this.get(key);
            if (series.type == 'energy') {
                var time = series.getEarliestTime();
                if (time != null && (earliestTime == null || time < earliestTime)) {
                    earliestTime = time;
                }
            }
        }
        return earliestTime;
    }

    getEarliestPowerTime() {
        var earliestTime = null;
        for (var key in this.series) {
            var series = this.get(key);
            if (series.type == 'power') {
                var time = series.getEarliestTime();
                if (time != null && (earliestTime == null || time < earliestTime)) {
                    earliestTime = time;
                }
            }
        }
        return earliestTime;
    }

    getDailyEnergy(key, time) {
        if (this.get(key) != null) {
            return this.get(key).getDailyEnergy(time);
        }
        return null;
    }

    hasDailyEnergy(start, end) {
        for (var key in this.series) {
            var series = this.get(key);
            if (series.type == 'energy' && !series.hasInterval(start, end, 86400000)) {
                return false;
            }
        }
        return true;
    }

    hasPower(start, end, interval) {
        for (var key in this.series) {
            var series = this.get(key);
            if (series.type == 'power' && !series.hasInterval(start, end, interval)) {
                return false;
            }
        }
        return true;
    }

    iterateDailyEnergy(start, end) {
        // Each iteration will return the energy value of all configured feeds for a specific day
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
                
                // Iterate all configured energy data series and treat missing days as zero energy
                for (var key in this.series) {
                    var series = this.get(key);
                    if (series.type == 'energy') {
                        if (indices[key] == undefined) indices[key] = 0;
                        
                        var {index, result} = series.iterateDay(time, indices[key]);
                        
                        indices[key] = index;
                        day[key] = result;
                    }
                }
                yield day;
                
                // Add a day to the date object, to avoid DST problems
                date.setDate(date.getDate()+1);
                time = date.getTime();
            }
        }.bind(this);
        return iterator;
    }

    iteratePower(start, end, interval) {
        // Each iteration will return the power value of all configured feeds for a specific time
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

                // Iterate all configured energy data series and treat missing days as zero energy
                for (var key in this.series) {
                    var series = this.get(key);
                    if (series.type == 'power') {
                        if (indices[key] == undefined) indices[key] = 0;
                        
                        var {index, result} = series.iterateTimevalue(time, intervalMillis, indices[key]);
                        
                        indices[key] = index;
                        timevalue[key] = result;
                    }
                }
                yield timevalue;

                time += intervalMillis;
            }
        }.bind(this)
        
        return iterator;
    }
}

class Series {

    constructor(key, id, type, engine, feed) {
        this.feed = feed;
        this.key = key;
        this.id = id;
        this.type = type;
        this.engine = engine;
        
        this.today = null;
        this.live = false;
        
        this.interval = (type == 'energy') ? 86400000 : 0;
        this.earliest = null;
        this.latest = null;
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
        if (interval > 0 && this.interval < interval) {
            return false
        }
        var tolerance = this.getTolerance(interval);
        if ((start < (this.data[0][0] - tolerance) && this.getEarliestTime() < (this.data[0][0] - tolerance)) || 
                end > (this.getLatestTime() + tolerance)) {
            return false;
        }
        return true;
    }

    getTimevalue(time, async) {
        // TODO: Check if the value maybe is hold in cache
        return this.feed.getValue(this.id, time, this.interval, async);
    }

    getLatestTime() {
        if (this.latest != null) {
            var time = parseInt(this.latest[0]);
            if (!isNaN(time)) {
                return time;
            }
        }
        return null;
    }

    getLatestValue() {
        if (this.latest != null) {
            var value = parseFloat(this.latest[1]);
            if (!isNaN(value)) {
                return value;
            }
        }
        return null;
    }
    
    getEarliestTime() {
        if (this.earliest != null) {
            var time = parseInt(this.earliest[0]);
            if (!isNaN(time)) {
                return time;
            }
        }
        return null;
    }
    
    getEarliestValue() {
        if (this.earliest != null) {
            var value = parseFloat(this.earliest[1]);
            if (!isNaN(value)) {
                return value;
            }
        }
        return null;
    }

    loadEarliest() {
        // For feeds without an interval like for the PHPTimeseries engine, the closest value to 0
        // will be returned as the earliest time value
        return this.getTimevalue(0, true).then(function(result) {
            this.earliest = result;
            
        }.bind(this));
    }

    load(start, end, interval) {
        this.interval = interval*1000;
        
        // Only reload, if the requested interval is not already hold in cache
        if (this.hasInterval(start, end, this.interval)) {
            return Promise.resolve(this.data);
        }
        this.live = new Date().getTime() - end < this.interval;
        
        return this.feed.getData(this.id, start, end, interval, true, true, true).then(function(result) {
            this.data = result;
            this.latest = result[result.length-1];
            return result;
            
        }.bind(this));
    }

    loadDailyEnergy(start, end) {
        // Only reload, if the requested interval is not already hold in cache
        if (this.hasInterval(start, end)) {
            return Promise.resolve(this.data);
        }
        end += this.interval;
        
        return this.feed.getDailyData(this.id, start, end, true).then(function(result) {
            var tolerance = this.getTolerance(this.interval);
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
                // Iterate all configured energy data series and treat missing days as zero energy
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
            
        }.bind(this));
    }

    getDailyEnergy(time) {
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
                todayValue = this.getTimevalue(time);
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

    iterateTimevalue(time, interval, index) {
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
            if (this.latest[0] - this.data[this.data.length-1][0] >= this.interval) {
                this.data.push(this.latest);
                
                console.log(new Date()+": Appending value to series \""+this.key+"\": "+this.latest[1]);
            }
        }
        else {
            this.data.push(this.latest);
        }
    }

    trim() {
        // The shift() method removes the first item of an array, and returns that item
        this.data.shift();
    }
}

class FixedIntervalSeries extends Series {

    constructor(key, id, type, engine, feed) {
        super(key, id, type, engine, feed);
        
        this.meta = null;
    }

    getTimevalue(time, async) {
        // If the meta data is already initialized, align the requested time with the feeds meta data
        if (this.meta != null) {
            var interval = this.meta.interval*1000;
            var start = this.meta.start_time*1000;

            if (time > start) {
                time = start + Math.round((time - start)/interval)*interval;
            }
            return this.feed.getValue(this.id, time, interval, async);
        }
        
        if (typeof async !== 'undefined' && async) {
            return $.when(null);
        }
        else {
            return null;
        }
    }

    loadMeta() {
        return this.feed.getMeta(this.id, true).then(function(result) {
            this.meta = result;
            return result;
            
        }.bind(this));
    }

    loadEarliest() {
        // For fixed interval feeds, this information is held in its meta data
        return this.loadMeta().then(function(result) {
            var earliestTime = result.start_time*1000;
            return this.getTimevalue(earliestTime, true);
            
        }.bind(this)).then(function(result) {
            this.earliest = result;
            return result;
            
        }.bind(this));
    }

    load(start, end, interval) {
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
            
            // Only reload, if the requested interval is not already hold in cache
            return super.load(start, end, interval);
        }
        else {
            this.data = [];
            this.latest = null;
        }
        return Promise.resolve(this.data);
    }
}

