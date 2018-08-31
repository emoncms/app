class DataCache {
    
    constructor(feed) {
        this.feed = feed;
        this.datapointsLimit = 800;
        
        this.cache = null;
    }
    
    set(keys, config) {
        var data = {};
        for (var key in config.app) {
            if (config.app[key]['value'] && keys.indexOf(key) > -1) {
                var f = config.feedsbyid[config.app[key]['value']];
                var c = config.app[key]['class'];
                if (c === 'power') {
                    if (f.engine == 5 || f.engine == 6) {
                        data[key] = new FixedIntervalPowerSeries(key, f.id, f.engine, feed);
                    }
                    else {
                        data[key] = new IntermittentPowerSeries(key, f.id, f.engine, feed);
                    }
                }
                else if (c === 'energy') {
                    if (f.engine == 5 || f.engine == 6) {
                        data[key] = new FixedIntervalEnergySeries(key, f.id, f.engine, feed);
                    }
                    else {
                        data[key] = new IntermittentEnergySeries(key, f.id, f.engine, feed);
                    }
                }
            }
        }
        this.cache = new DataCollection(data);
    }
    
    get(key) {
        return this.cache.get(key);
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
    
    loadPower(start, end, interval) {
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache.series) {
            var series = this.cache.get(key);
            
            if (series instanceof FixedIntervalPowerSeries ||
                    series instanceof IntermittentPowerSeries) {
                
                requests.push(series.load(start, end, interval));
            }
        }
        return Promise.all(requests).then(function() {
            return this.cache;
        }.bind(this));
    }
    
    loadDailyEnergy(start, end) {
        
        // Build an array of ajax promise objects and wait for them to finish
        var requests = [];
        for (var key in this.cache.series) {
            var series = this.cache.get(key);
            
            if (series instanceof FixedIntervalEnergySeries ||
                    series instanceof IntermittentEnergySeries) {
                requests.push(series.loadDaily(start, end));
            }
        }
        return Promise.all(requests).then(function() {
            return this.cache;
        }.bind(this));
    }
    
    update(updatePowerSeries) {
        return this.feed.getListById(true).then(function(result) {
            for (var key in this.cache.series) {
                var series = this.cache.get(key);
                var feed = result[series.id];
                
                if (feed.value != null) {
                    // Update the latest cached time value
                    // and append latest power values to the series data cache, if the passed flag indicates it
                    series.latest = [feed.time*1000, feed.value];
                    
                    if (updatePowerSeries != null && updatePowerSeries &&
                            (series instanceof FixedIntervalPowerSeries ||
                            series instanceof IntermittentPowerSeries)) {
                        
                        series.append();
                        
                        // If the cache exceeds the specified datapoint limit, trim the first value
                        if (series.getLength() > this.datapointsLimit) {
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
    
    get(key) {
        if (this.series[key] != undefined) {
            return this.series[key];
        }
        else console.log("ERROR", "Unknown key \""+key+"\" to get data series");
    }
    
    getData(key) {
        if (this.get(key) != null) {
            return this.get(key).data;
        }
        else return [];
    }
    
    getLength(key) {
        if (this.get(key) != null) {
            return this.get(key).data.length;
        }
        else return null;
    }
    
    getLatestTime(key) {
        if (this.get(key) != null && this.get(key).latest != null) {
            return this.get(key).latest[0];
        }
        return null;
    }
    
    getLatestValue(key) {
        if (this.get(key) != null && this.get(key).latest != null) {
            return this.get(key).latest[1];
        }
        return null;
    }
    
    getEarliestTime(key) {
        if (this.get(key) != null && this.get(key).earliest != null) {
            return this.get(key).earliest[0];
        }
        return null;
    }
    
    getEarliestValue(key) {
        if (this.get(key) != null && this.get(key).earliest != null) {
            return this.get(key).earliest[1];
        }
        return null;
    }
    
    getEarliestPowerTime() {
        var earliestTime = null;
        for (var key in this.series) {
            var series = this.get(key);
            if (series instanceof FixedIntervalPowerSeries ||
                    series instanceof IntermittentPowerSeries) {
                
                var time = series.getEarliestTime();
                if (time != null && (earliestTime == null || time < earliestTime)) {
                    earliestTime = time;
                }
            }
        }
        return earliestTime;
    }
    
    getEarliestEnergyTime() {
        var earliestTime = null;
        for (var key in this.series) {
            var series = this.get(key);
            if (series instanceof FixedIntervalEnergySeries ||
                    series instanceof IntermittentEnergySeries) {
                
                var time = series.getEarliestTime();
                if (time != null && (earliestTime == null || time < earliestTime)) {
                    earliestTime = time;
                }
            }
        }
        return earliestTime;
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
            // The index object is used to remember the position of the last correctly aligned
            // time value. As the time values will never decrease with increasing index, this 
            // enables to only loop each feeds data array once in total, while aligning the data
            // of all available feeds
            var index = {};
            var time = start;
            while (time <= end) {
                var timevalue = {};
                timevalue['time'] = time;

                // Iterate all configured energy data series and treat missing days as zero energy
                for (var key in this.series) {
                    var series = this.get(key);
                    if (series instanceof FixedIntervalPowerSeries ||
                            series instanceof IntermittentPowerSeries) {
                        
                        if (index[key] == undefined) index[key] = 0;
                        
                        timevalue[key] = series.iterateTimevalue(time, intervalMillis, index);
                    }
                }
                yield timevalue;

                time += intervalMillis;
            }
        }.bind(this)
        
        return iterator;
    }
    
    iterateDailyEnergy(start, end) {
        // Each iteration will return the energy value of all configured feeds for a specific day
        // for the passed time interval
        var today = new Date();
        today.setHours(0,0,0,0);
        var todayTime = today.getTime()
        
        var iterator = {};
        iterator[Symbol.iterator] = function *() {
            // The index object is used to remember the position of the last correctly aligned
            // time value. As the time values will never decrease with increasing index, this 
            // enables to only loop each feeds data array once in total, while aligning the data
            // of all available feeds
            var index = {};
            var date = new Date(start);
            var time = date.getTime();
            while (time <= end) {
                var day = {};
                day['time'] = time;
                
                // Iterate all configured energy data series and treat missing days as zero energy
                for (var key in this.series) {
                    var series = this.get(key);
                    if (series instanceof FixedIntervalEnergySeries ||
                            series instanceof IntermittentEnergySeries) {
                        
                        if (index[key] == undefined) index[key] = 0;
                        
                        day[key] = series.iterateDay(time, todayTime, index);
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
}

class Series {

    constructor(key, id, engine, feed) {
        this.feed = feed;
        this.key = key;
        this.id = id;
        this.engine = engine;

        this.interval = 0;
        this.earliest = null;
        this.latest = null;
        this.data = [];
    }
    
    getLength() {
        return this.data.length;
    }
    
    getLatestTime() {
        if (this.latest != null) {
            return this.latest[0];
        }
        return null;
    }
    
    getLatestValue() {
        if (this.latest != null) {
            return this.latest[1];
        }
        return null;
    }
    
    getEarliestTime() {
        if (this.earliest != null) {
            return this.earliest[0];
        }
        return null;
    }
    
    getEarliestValue() {
        if (this.earliest != null) {
            return this.earliest[1];
        }
        return null;
    }
}

class FixedIntervalSeries extends Series {

    constructor(key, id, engine, feed) {
        super(key, id, engine, feed);
        
        this.meta = null;
    }

    getTimevalue(time, async) {
        // If the meta data is already initialized, align the requested time with the feeds meta data
        if (this.meta != null) {
            var metaIntervalMillis = this.meta.interval*1000;
            var metaStartMillis = this.meta.start_time*1000;

            if (time >= metaStartMillis) {
                time = metaStartMillis + Math.round((time - metaStartMillis)/metaIntervalMillis)*metaIntervalMillis;
            }
            else if (typeof async !== 'undefined' && async) {
                return $.when(null);
            }
            else {
                return null;
            }
        }
        
        // TODO: Check if the value maybe is hold in cache
        return this.feed.getValue(this.id, time, async);
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
        var metaStartMillis = this.meta.start_time*1000;
        
        if (start >= metaStartMillis) {
            start = metaStartMillis + Math.ceil((start - metaStartMillis)/intervalMillis)*intervalMillis;
        }
        else {
            start = metaStartMillis;
        }
        
        if (end >= metaStartMillis) {
            end = metaStartMillis + Math.floor((end - metaStartMillis)/intervalMillis)*intervalMillis;
            
            // Only reload, if the requested interval is not already hold in cache
            if (this.data.length < 1 ||
                    start <= (this.data[0][0] - intervalMillis) || 
                    end >= (this.data[this.data.length-1][0] + intervalMillis) ||
                    this.interval > intervalMillis) {
                
                this.interval = intervalMillis;
                
                return this.feed.getData(this.id, start, end, interval, true, true, true).then(function(result) {
                    this.data = result;
                    this.latest = result[result.length-1];
                    
                }.bind(this));
            }
        }
        else {
            this.data = [];
            this.latest = null;
        }
        return $.when(null);
    }
}

class IntermittentSeries extends Series {

    getTimevalue(time, async) {
        // TODO: Check if the value maybe is hold in cache
        return this.feed.getValue(this.id, time, async);
    }

    loadEarliest() {
        // For intermittent feeds like for the PHPTimeseries engine, the closest value to 0
        // will be returned as the earliest time value
        return this.getTimevalue(0, true).then(function(result) {
            this.earliest = result;
            
        }.bind(this));
    }

    load(start, end, interval) {
        var intervalMillis = interval*1000;
        
        // Only reload, if the requested interval is not already hold in cache
        if (this.data.length < 1 ||
                start <= (this.data[0][0] - intervalMillis) || 
                end >= (this.latest[0] + intervalMillis) ||
                this.interval < intervalMillis) {
            
            this.interval = intervalMillis;
            
            return this.feed.getData(this.id, start, end, interval, true, true, true).then(function(result) {
                this.data = result;
                this.latest = result[result.length-1];
                
            }.bind(this));
        }
        return $.when(null);
    }
}

class FixedIntervalPowerSeries extends FixedIntervalSeries {
    
    append() {
        if (this.data.length > 0 && this.interval > 0) {
            var timeDelta = this.latest[0] - this.data[this.data.length-1][0];
            if (timeDelta == this.interval) {
                this.data.push(this.latest);
                
                console.log("Appending value to power series \""+this.key+"\": "+this.latest[1]);
            }
        }
        else {
            this.data = [];
            this.data.push(this.latest);
        }
    }
    
    trim() {
        // The shift() method removes the first item of an array, and returns that item
        this.data.shift();
    }
    
    iterateTimevalue(time, interval, indices) {
        var index = indices[this.key];
        var result = null;
        
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
        indices[this.key] = index;
        
        if (typeof this.data[index] !== 'undefined' 
                && Math.abs(time - this.data[index][0]) < interval) {
            
            result = this.data[index][1];
        }
        return result;
    }
}

class IntermittentPowerSeries extends IntermittentSeries {
    
    append() {
        if (this.data.length > 0) {
            var timeDelta = this.latest[0] - this.data[this.data.length-1][0];
            if (timeDelta >= this.interval) {
                this.data.push(this.latest);
                
                console.log("Appending value to power series \""+this.key+"\": "+this.latest[1]);
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
    
    iterateTimevalue(time, interval, indices) {
        // Use a 10% tolerance for received values to be accepted
        interval = interval + interval*0.1;
        var index = indices[this.key];
        var result = null;
        
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
        indices[this.key] = index;
        
        if (Math.abs(time - this.data[index][0]) < interval) {
            result = this.data[index][1];
        }
        return result;
    }
}

class FixedIntervalEnergySeries extends FixedIntervalSeries {
    
    loadDaily(start, end) {
        // Only reload, if the requested interval is not already hold in cache
        if (this.data.length < 1 || start < this.data[0][0] || end > this.latest[0]) {
            return this.feed.getDailyData(this.id, start, end, true).then(function(result) {
                this.data = [];
                
                // Remove NaN values
                for (var i in result) {
                    if (result[i][1] != null) this.data.push(result[i]);
                }
            }.bind(this));
        }
        return $.when(null);
    }
    
    getDailyEnergy(time) {
        if (this.data.length > 0 && 
                this.data[0][0] <= time && 
                this.data[this.data.length-1][0] >= time) {
            
            // Calculate the daily total by subtracting the day from the upcoming day
            if (this.data[this.data.length-1][0] == time) {
                return this.latest[1] - this.data[this.data.length-1][1];
            }
            else {
                var interval = 86400000;
                var index = 0;
                for (var i=0; i<this.data.length; i++) {
                    var deltaThis = Math.abs(time - this.data[i][0]);
                    var deltaLast = Math.abs(time - this.data[index][0]);
                    
                    if (deltaThis > deltaLast) {
                        break;
                    }
                    else if (deltaThis <= deltaLast) {
                        index = i;
                    }
                }
                
                if (index < this.data.length-1 && 
                        Math.abs(time - this.data[index][0]) < interval &&
                        Math.abs(this.data[index+1][0] - this.data[index][0]) <= interval) {
                    
                    return this.data[index+1][1] - this.data[index][1];
                }
            }
        }
        return null;
    }
    
    iterateDay(time, timeToday, indices) {
        var interval = 86400000;
        var index = indices[this.key];
        var result = 0;
        
        for (var i=index; i<this.data.length; i++) {
            if (this.data[i][0] == time) {
                index = i;
                break;
            }
        }
        indices[this.key] = index;

        if (typeof this.data[index] !== 'undefined') {
            // Calculate the daily totals by subtracting each day from the upcoming day
            if (index < this.data.length-1 && 
                    Math.abs(time - this.data[index][0]) < interval &&
                    Math.abs(this.data[index+1][0] - this.data[index][0]) <= interval) {
                
                result = this.data[index+1][1] - this.data[index][1];
            }
            else if (this.data[index][0] == timeToday) {
                var latest = this.getLatestValue();
                if (latest != null && 
                        Math.abs(time - this.data[index][0]) < interval &&
                        Math.abs(this.latest[0] - this.data[index][0]) <= interval) {
                
                    result = latest - this.data[index][1];
                }
            }
        }
        
        return result;
    }
}

class IntermittentEnergySeries extends IntermittentSeries {

    constructor(key, id, engine, feed) {
        super(key, id, engine, feed);

        // Use a 5 minute tolerance around midnight, for received values to be accepted
        this.tolerance = 300000;
    }
    
    loadDaily(start, end) {
        var interval = 86400000 + this.tolerance;
        
        // Only reload, if the requested interval is not already hold in cache
        if (this.data.length < 1 ||
                start <= (this.data[0][0] - interval) || 
                end >= (this.latest[0] + interval)) {
            
            return this.feed.getDailyData(this.id, start, end, true).then(function(result) {
                this.data = [];
                
                // Remove NaN values
                for (var i in result) {
                    if (result[i][1] != null) this.data.push(result[i]);
                }
            }.bind(this));
        }
        return $.when(null);
    }
    
    getDailyEnergy(time) {
        if (this.data.length > 0 && 
                this.data[0][0] <= time && 
                this.data[this.data.length-1][0] >= time) {
            
            // Calculate the daily total by subtracting the day from the upcoming day
            if (this.data[this.data.length-1][0] == time) {
                return this.latest[1] - this.data[this.data.length-1][1];
            }
            else {
                var interval = 86400000 + this.tolerance;
                var index = 0;
                for (var i=0; i<this.data.length; i++) {
                    var deltaThis = Math.abs(time - this.data[i][0]);
                    var deltaLast = Math.abs(time - this.data[index][0]);
                    
                    if (deltaThis > deltaLast) {
                        break;
                    }
                    else if (deltaThis <= deltaLast) {
                        index = i;
                    }
                }
                
                if (index < this.data.length-1 && 
                        Math.abs(time - this.data[index][0]) < interval &&
                        Math.abs(this.data[index+1][0] - this.data[index][0]) <= interval) {
                    
                    return this.data[index+1][1] - this.data[index][1];
                }
            }
        }
        return null;
    }
    
    iterateDay(time, timeToday, indices) {
        var interval = 86400000 + this.tolerance;
        var index = indices[this.key];
        var result = 0;
        
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
        indices[this.key] = index;
        
        // Calculate the daily totals by subtracting each day from the upcoming day
        if (index < this.data.length-1 && 
                Math.abs(time - this.data[index][0]) < interval &&
                Math.abs(this.data[index+1][0] - this.data[index][0]) <= interval) {
            
            result = this.data[index+1][1] - this.data[index][1];
        }
        else if (time == timeToday) {
            // last day in kwh data matches start of today from the browser's perspective
            // which means its safe to append today kwh value
            var latest = this.getLatestValue();
            if (latest != null && 
                    Math.abs(time - this.data[index][0]) < interval &&
                    Math.abs(this.latest[0] - this.data[index][0]) <= interval) {
                
                result = latest - this.data[index][1];
            }
        }
        
        return result;
    }
}
