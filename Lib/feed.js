class Feed {

    constructor(apikey) {
        if (typeof apikey !== 'undefined' || this.apikey != "") {
            this.apikey = "?apikey=" + apikey;
        }
        else {
            this.apikey = "";
        }
    }

    getList(async) {
        if (typeof async === 'undefined') async = false;
        
        var feeds = null;
        var promise = $.ajax({                                      
            url: path+"feed/list.json"+this.apikey,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.list received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) feeds = result;
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return feeds;
    }

    getListById(async) {
        if (typeof async === 'undefined') async = false;
        
        var feedsById = function(feeds) {
            if (feeds === null) return null;
            var result = {};
            for (var i in feeds) result[feeds[i].id] = feeds[i];
            
            return result;
        }
        if (async) {
            return this.getList(true).then(function(feeds) {
            	var result = feedsById(feeds);
            	if (typeof async === 'function') {
            		async(feeds);
            	}
            	return result;
            });
        }
        else {
            return feedsById(this.getList());
        }
    }

    getListByName(async) {
        if (typeof async === 'undefined') async = false;
        
        var feedsByName = function(feeds) {
            if (feeds === null) return null;
            var result = {};
            for (var i in feeds) result[feeds[i].name] = feeds[i];
            
            return result;
        }
        if (async) {
            return this.getList(true).then(function(feeds) {
            	var result = feedsByName(feeds);
            	if (typeof async === 'function') {
            		async(result);
            	}
            	return result;
            });
        }
        else {
            return feedsByName(this.getList());
        }
    }

    getMeta(id, async) {
        if (typeof async === 'undefined') async = false;
        
        var meta = {};
        var promise = $.ajax({                                      
            url: path+"feed/getmeta.json"+this.apikey,
            data: "id="+id,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Object) {
                    console.log("ERROR", "feed.getMeta received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) meta = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return meta;
    }

    getData(id, start, end, interval, skipMissing, limitInterval, async) {
        if (typeof async === 'undefined') async = false;
        
        if (typeof skipMissing == 'boolean') {
            skipMissing = skipMissing ? 1 : 0;
        }
        if (typeof limitInterval == 'boolean') {
            limitInterval = limitInterval ? 1 : 0;
        }
        
        var data = [];
        var promise = $.ajax({
            url: path+"feed/data.json"+this.apikey,
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing="+skipMissing+"&limitinterval="+limitInterval,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.getData received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) data = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return data;
    }

    getDailyData(id, start, end, async) {
        return this.getDMYData(id, start, end, "daily", async);
    }

    getDMYData(id, start, end, mode, async) {
        if (typeof async === 'undefined') async = false;
        
        var data = [];
        var promise = $.ajax({
            url: path+"feed/data.json"+this.apikey,
            data: "id="+id+"&start="+start+"&end="+end+"&mode="+mode,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.getDMY received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) data = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return data;
    }

    getDailyTimeOfUse(id, start, end, split, async) {
        return this.getDMYTimeOfUse(id, start, end, "daily", split, async);
    }

    getDMYTimeOfUse(id, start, end, mode, split, async) {
        if (typeof async === 'undefined') async = false;
        
        var data = [];
        var promise = $.ajax({
            url: path+"feed/data.json"+this.apikey,
            data: "id="+id+"&start="+start+"&end="+end+"&mode="+mode+"&split="+split,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.getDataDMY received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) data = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return data;
    }

    getAverage(id, start, end, interval, async) {
        if (typeof async === 'undefined') async = false;
        
        var data = [];
        var promise = $.ajax({                                      
            url: path+"feed/average.json"+this.apikey,
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval,
            dataType: 'json',
            async: async,
            success: function(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.getAverage received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) data = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return data;
    }

    getValue(id, time, interval, async)  {
        if (typeof async === 'undefined') async = false;
        if (typeof interval === 'undefined' || interval < 1000) {
            interval = 1000;
        }
        if (async) {
            return this.getData(id, time, time+interval, interval/1000, false, false, true).then(function(data) {
                return data.length > 0 ? data[0] : null;
            });
        }
        else {
            var data = this.getData(id, time, time+interval, interval/1000, false, false);
            return data.length > 0 ? data[0] : null;
        }
    }

    getRemoteData(id, start, end, interval, skipMissing, limitInterval, async) {
        if (typeof async === 'undefined') async = false;
        
        if (typeof skipMissing == 'boolean') {
            skipMissing = skipMissing ? 1 : 0;
        }
        if (typeof limitInterval == 'boolean') {
            limitInterval = limitInterval ? 1 : 0;
        }
        
        var data = [];
        var promise = $.ajax({                                      
            url: path+"app/dataremote",
            data: "id="+id+"&start="+start+"&end="+end+"&interval="+interval+"&skipmissing="+skipMissing+"&limitinterval="+limitInterval,
            dataType: 'json',
            async: async,
            success(result) {
                if (!result || result === null || result === "" || result.constructor != Array) {
                    console.log("ERROR", "feed.getDataRemote received invalid result: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) data = result;
                else if(typeof async === 'function') {
            		async(result);
                }
                return data;
            }
        });
        if (async) {
            return promise;
        }
        return data;
    }

    getRemoteValue(id, async) {
        if (typeof async === 'undefined') async = false;
        
        var value = 0;
        var promise = $.ajax({                                      
            url: path+"app/valueremote",
            data: "id="+id,
            dataType: 'json',
            async: async,
            success(result) {
                if (isNaN(result)) {
                    console.log("ERROR", "feed.getValueRemote received value that is not a number: " + result.message);
                    // TODO: throw Exception
                }
                else if(!async) value = parseFloat(result);
                else if(typeof async === 'function') {
            		async(result);
                }
                return result;
            }
        });
        if (async) {
            return promise;
        }
        return value;
    }
}
