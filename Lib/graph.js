const POWER = "power";
const ENERGY = "energy"
const IMPORT = "import_energy";
const EXPORT = "export_energy";
const SOLAR = "solar_energy";

class GraphView {
    constructor(path, container) {
        if (!container) {
            alert('Graph has to be loaded into a valid container');
            return false;
        }
        this.container = container;
        this.container.load(path + "Modules/app/Lib/graph.php");
        
        if (!$('.graph-tooltip').length) $("<div class='graph-tooltip' style='display:none'></div>").appendTo("body");
        
        this.flotFontSize = 12;
        this.mode = Graph.ENERGY;
        this.unit = Graph.ENERGY;
        this.ready = false;
    }

    setup(data, config) {
        $(".graph-loader", this.container).hide();
        this.ready = false;
        
        this.data = data;
        this.power = new PowerGraph(this);
        this.energy = new EnergyGraph(this);
        
        this.cost = {};
        this.cost[Graph.IMPORT] = config.app.import_cost.value;
        this.cost[Graph.EXPORT] = config.app.export_cost.value;
        this.currency = config.app.currency.value;
        
        return this.data.loadMeta().then(function(result) {
            this.power.earliest = result.getGroup(Graph.POWER).getEarliestTime();
            this.energy.earliest = result.getGroup(Graph.ENERGY).getEarliestTime();
            this.ready = true;
            return result;
            
        }.bind(this));
    }

    graph() {
        if (this.mode == Graph.POWER) {
            return this.power;
        }
        else if (this.mode == Graph.ENERGY) {
            return this.energy;
        }
    }

    reset() {
        return this.graph().reset();
    }

    load() {
        return this.graph().load();
    }

    draw(flotFontSize) {
        if (typeof flotFontSize !== 'undefined') {
            this.flotFontSize = flotFontSize;
        }
        if (!this.ready) {
            return;
        }
        this.graph().draw();
    }

    getTimeWindow() {
        return this.graph().getTimeWindow();
    }

    setTimeWindow(start, stop) {
        this.graph().setTimeWindow(start, stop);
    }
}

class Graph {

    constructor(view, data) {
        this.data = data;
        this.view = view;
        this.plot = null;
        
        this.earliest = 0;
        this.start = 0;
        this.end = 0;
        
        this.freeze = false;
        this.item = null;
    }

    static get POWER() {
        return POWER;
    }

    static get ENERGY() {
        return ENERGY;
    }

    static get IMPORT() {
        return IMPORT;
    }

    static get EXPORT() {
        return EXPORT;
    }

    static get SOLAR() {
        return SOLAR;
    }

    getTimeWindow() {
        return {'start': this.start, 'end': this.end};
    }

    setTimeWindowDays(days) {
        // Set the time windows to show a specific amount of days
        var date = new Date();
        var end = date.getTime();
        
        date.setDate(date.getDate() - (days-1));
        date.setHours(0,0,0,0);
        var start = date.getTime();
        if (end - start < 21600000) {
            start = end - 21600000;
        }
        this.setTimeWindow(start, end);
    }

    setTimeWindow(start, end) {
        this.start = start;
        this.end = end;
    }

    reset() {
        $(".graph-footer .power.action.details", this.view.container).find('span').html("SHOW DETAIL");
        $(".graph-stats", this.view.container).hide();
        
        return load();
    }

    events() {
        var plot = $('.graph', this.view.container).off();
        plot.on('plothover', function(event, pos, item) {
            if (typeof item !== 'undefined' && item !== null) {
                if (this.item === null || this.item != item) {
                    this.item = item;
                    var itemTime = item.datapoint[0];
                    var date = new Date(itemTime);
                    var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

                    var label = item.series.label;
                    var value = Math.abs(item.datapoint[1]);
                    var text = "";
                    if (this.view.mode == "energy") {
                        
                        text = "<b>"+days[date.getDay()]+", "+months[date.getMonth()]+" "+date.getDate()+"</b><br>";
                        text += "<span style='color:#666'>"+label+"</span>: ";
                        if (this.view.unit == "energy") {
                            text += (value).toFixed(1)+" kWh";
                        }
                        else {
                            text += this.view.currency+(value*this.view.cost[Graph.IMPORT]).toFixed(2);
                        }
                    }
                    else {
                        var hours = date.getHours();
                        if (hours < 10) hours = "0"+hours;
                        var mins = date.getMinutes();
                        if (mins < 10) mins = "0"+mins;
                        
                        text = "<b>"+months[date.getMonth()]+" "+date.getDate()+", "+hours+":"+mins+"</b><br>";
//                        text += "<span style='color:#666'>"+label+"</span>: ";
                        if (value < 10000) {
                            text += Math.round(value)+" W";
                        }
                        else {
                            text += (value*0.001).toFixed(1)+" kW";
                        }
                    }
                    var tooltip = $('.graph-tooltip').html(text).fadeIn(200);
                    
                    var offset = 10; // use higher values for a little spacing between `x,y` and tooltip
                    var y = item.pageY - tooltip.height() - offset;
                    var x = item.pageX - tooltip.width()  - offset;
                    if (y < 0) {
                        y = 0;
                    }
                    if (x < 0) {
                        x = 0;
                    }
                    tooltip.css({top: y, left: x});
                }
            }
            else {
                this.item = null;
                $(".graph-tooltip").hide();
            }
        }.bind(this));

        // Auto click through to power graph
        plot.on('plotclick', function(event, pos, item) {
            if (item && !this.freeze && this.view.mode == "energy") {
                var start = item.datapoint[0];
                var end = start + 86400000;
                
                this.view.mode = "power";
                this.view.setTimeWindow(start, end);
                this.view.load();

                $(".graph-header .energy", this.view.container).hide();
                $(".graph-header .power", this.view.container).show();
                $(".graph-stats", this.view.container).hide();
            }
        }.bind(this));

        plot.on("plotselected", function (event, ranges) {
            $(".graph-tooltip").hide();
            this.item = null;
            
            var start = ranges.xaxis.from;
            var end = ranges.xaxis.to;
            this.freeze = true; 
            
            this.view.setTimeWindow(start, end);
            this.view.load();
            
            setTimeout(function() { this.freeze = false; }.bind(this), 250);
            
        }.bind(this));

        plot.on("mousedown touchstart", function() { this.freeze = true; }.bind(this));
        plot.on("mouseup touchend", function() { this.freeze = false; }.bind(this));
    }

    static roundInterval(interval) {
        var result = 10;
        if (interval > 10) result = 10;
        if (interval > 15) result = 15;
        if (interval > 20) result = 20;
        if (interval > 30) result = 30;
        if (interval > 60) result = 60;
        if (interval > 120) result = 120;
        if (interval > 180) result = 180;
        if (interval > 300) result = 300;
        if (interval > 600) result = 600;
        if (interval > 900) result = 900;
        if (interval > 1200) result = 1200;
        if (interval > 1800) result = 1800;
        if (interval > 3600*1) result = 3600*1;
        if (interval > 3600*2) result = 3600*2;
        if (interval > 3600*3) result = 3600*3;
        if (interval > 3600*4) result = 3600*4;
        if (interval > 3600*5) result = 3600*5;
        if (interval > 3600*6) result = 3600*6;
        if (interval > 3600*12) result = 3600*12;
        if (interval > 3600*24) result = 3600*24;
        if (interval > 3600*36) result = 3600*36;
        if (interval > 3600*48) result = 3600*48;
        if (interval > 3600*72) result = 3600*72;
        
        return result;
    }

    static stats(data) {
        var sum = 0;
        var minval = 0;
        var maxval = 0;

        var count = 0;
        for (var i in data) {
            var val = data[i][1];
            
            if (count == 0) {
                maxval = val;
                minval = val;
            }
            if (val > maxval) maxval = val;
            if (val < minval) minval = val;
            sum += val;
            count++;
        }
        var mean = (count > 0) ? sum/count : 0;
        
        var sum = 0;
        var count = 0;
        for (var i in data) {
            var val = data[i][1];
            
            sum += (val - mean)*(val - mean);
            count++;
        }
        var stdev = (count > 0) ? Math.sqrt(sum/count) : 0;
        
        return {
            "minval": minval,
            "maxval": maxval,
            "diff": maxval - minval,
            "mean": mean,
            "stdev": stdev
        }
    }
}

class PowerGraph extends Graph {
    constructor(view) {
        super(view, data.getGroup(Graph.POWER));
        this.live = null;
        
        if (this.data.has(Graph.SOLAR) && this.data.has(Graph.EXPORT)) {
            this.solar = true;
            
            // Configure external solar power to be treated as if it were selfconsumption.
            // Relevant specifically for old german feed-in tariff systems.
            this.feedin = this.data.get(Graph.SOLAR).feed.id == this.data.get(Graph.EXPORT).feed.id;
        }
        //Set the initial time window to show the last 24 hours
        this.setTimeWindowDays(1);
    }

    setTimeWindow(start, end) {
        this.interval = Graph.roundInterval((end - start)*0.001/Data.DATAPOINTS_LIMIT);
        
        var interval = this.interval*1000;
        this.start = Math.ceil(start/interval)*interval;
        this.end = Math.ceil(end/interval)*interval;
        
        this.live = new Date().getTime() - end < interval;
    }

    load() {
        // Only reload, if the requested interval is not already hold in cache
        // As the power needs to be derived from the energy, an additional step needs to be requested
        var start = this.start-this.interval*1000;
        if (this.data.hasData(start, this.end, this.interval)) {
            this.draw();
            
            return Promise.resolve(this.data);
        }
        $(".graph-loader", this.view.container).show();
        
        return this.data.loadData(start, this.end, this.interval).then(function(result) {
            this.draw();
            return result;
            
        }.bind(this)).catch(function(error) {
            this.draw();
            return error;
            
        }.bind(this));
    }

    draw() {
        if (this.freeze) {
            return;
        }
        $(".graph-header .energy", this.view.container).hide();
        $(".graph-header .power", this.view.container).show();
        
        var importSeries = [];
        var importWindow = 0;
        
        var exportSeries = [];
        var exportWindow = 0;
        
        var selfConsSeries = [];
        var selfConsWindow = 0;
        
        var solarSeries = [];
        var solarWindow = 0;
        
        if (this.live) {
            this.end = new Date().getTime();
        }
        var lastValues = {};
        var newValues = {};
        
        for (var timeValue of this.data.iterateData(this.start, this.end, this.interval)) {
            var energyValue = function(key) {
                if (typeof lastValues[key] === 'undefined') {
                    if (typeof timeValue[key] !== 'undefined') {
                        lastValues[key] = {
                                'time':parseFloat(timeValue.time),
                                'value':parseFloat(timeValue[key])
                        };
                    }
                    return null;
                }
                var time = null;
                var energy = null;
                if (typeof timeValue[key] !== 'undefined') {
                    time = parseFloat(timeValue.time);
                    energy = parseFloat(timeValue[key]);
                }
                if (typeof newValues[key] !== 'undefined' && isNaN(energy)
                        && newValues[key].time > lastValues[key].time) {
                    time = newValues[key].time;
                    energy = newValues[key].value;
                }
                if (isNaN(energy) || time <= lastValues[key].time) {
                    return null;
                }
                newValues[key] = {
                        'time':time,
                        'value':energy
                };
                
                var value = energy - parseFloat(lastValues[key].value);
                if (isNaN(value) || value < 0) {
                    return null;
                }
                return value;
            };
            var powerValue = function(key, energy, timeValue) {
            	if (typeof newValues[key] === 'undefined') {
                    return [timeValue, 0];
            	}
                var time = newValues[key].time;
                var timeLast = lastValues[key].time;
                var scale = (time - timeLast)/3600000000;
                if (scale <= 0) {
                    return [time, 0];
                }
                return [time, energy/scale];
            }
            var elapsedTime = function(key, timeValue) {
                if (typeof lastValues[key] === 'undefined') {
                	return 0;
                }
                if (typeof newValues[key] === 'undefined') {
                    return (timeValue - lastValues[key].time)/1000;
                }
                return (newValues[key].time - lastValues[key].time)/1000;;
            }
            
            var solar = energyValue(Graph.SOLAR);
            var exp = energyValue(Graph.EXPORT);
            var imp = energyValue(Graph.IMPORT);
            if ((imp == null || imp == 0) && !(solar != null || solar > 0)) {
                if (elapsedTime(Graph.IMPORT, timeValue.time) < 900) {
                    continue;
                }
                imp = 0;
            }
            if (this.solar) {
                if (solar == null || solar == 0 || exp == null) {
                    if (elapsedTime(Graph.SOLAR, timeValue.time) < 900) {
                        continue;
                    }
                    solar = 0;
                }
                if (this.feedin) {
                    if (exp >= imp) {
                        exp -= imp;
                        imp = 0;
                    }
                    else {
                        imp -= exp;
                        exp = 0;
                    }
                }
                exportSeries.push(powerValue(Graph.EXPORT, (imp>0)?0:exp, timeValue.time));
                exportWindow += exp;
                
                solarSeries.push(powerValue(Graph.SOLAR, solar, timeValue.time));
                solarWindow += solar;
                
                var selfCons = Math.max(0, solar - exp);
                selfConsSeries.push(powerValue(Graph.SOLAR, selfCons, timeValue.time));
                selfConsWindow += selfCons;
            }
            importSeries.push(powerValue(Graph.IMPORT, imp, timeValue.time));
            importWindow += imp;
            
            Object.assign(lastValues, newValues);
        }
        
        if (this.view.unit == "energy") {
            var consumptionWindow = importWindow + selfConsWindow;
            
            $("#window-cons", this.view.container).html(consumptionWindow.toFixed(1)+ " kWh");
            if (solarWindow > 0) {
                $("#window-gen", this.view.container).html(solarWindow.toFixed(1)+ " kWh");
                
                var selfConsShare = 0;
                if (consumptionWindow > 0) {
                    selfConsShare = Math.min(100, selfConsWindow/solarWindow*100);
                }
                var selfSuffShare = 0;
                if (solarWindow > 0) {
                    selfSuffShare = Math.min(100, selfConsWindow/consumptionWindow*100);
                }
                $("#window-selfcons", this.view.container).html(selfConsShare.toFixed(0)+ "%");
                $("#window-selfsuff", this.view.container).html(selfSuffShare.toFixed(0)+ "%");
                
                $(".window.self").show();
                $(".window.generation").show();
            }
            else {
                $(".window.self").hide();
                $(".window.generation").hide();
            }
        } else {
            $("#window-cons", this.view.container).html(this.view.currency+(importWindow*this.view.cost[Graph.IMPORT]).toFixed(2));
            if (exportWindow > 0) {
                $("#window-gen", this.view.container).html(this.view.currency+(exportWindow*this.view.cost[Graph.EXPORT]).toFixed(2));
                $(".window.generation").show();
            }
            else {
                $(".window.generation").hide();
            }
            $(".window.self").hide();
        }
        $(".window.power", this.view.container).show();
        $(".window.energy", this.view.container).hide();
        
        var windowStats = {};
        windowStats["Import"] = Graph.stats(importSeries);
        windowStats["Export"] = Graph.stats(exportSeries);
        windowStats["Solar"] = Graph.stats(solarSeries);
        
        var windowStatsOut = "";
        for (var key in windowStats) {
            windowStatsOut += "<tr>";
            windowStatsOut += "<td style='text-align:left'>"+key+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[key].minval.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[key].maxval.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[key].diff.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[key].mean.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[key].stdev.toFixed(2)+"</td>";
            windowStatsOut += "</tr>";
        }
        $("#graph-stats").html(windowStatsOut);
        
        var series = [];
        if (selfConsSeries.length > 0) {
            series.push({
                label:"Self-consumption", data: selfConsSeries, yaxis: 1, color: "#a1b97b", 
                lines: { show: true, fill: 0.8, lineWidth: 0},
                stack: 0
            });
        }
        if (importSeries.length > 0) {
            series.push({
                label:"Consumption", data: importSeries, yaxis: 1, color: "#44b3e2", 
                lines: { show: true, fill: 0.8, lineWidth: 0},
                stack: 0
            });
        }
        if (exportSeries.length > 0) {
            series.push({
                label:"Generation", data: exportSeries, yaxis: 1, color: "#ffbe14", 
                lines: { show: true, fill: 0.8, lineWidth: 0},
                stack: 0
            });
        }
        
        var options = {
            lines: {
                fill: false
            },
            xaxis: {
                mode: "time",
                timezone: "browser", 
                min: this.start,
                max: this.end, 
                font: {
                    size: this.view.flotFontSize,
                    color: "#666"
                },
                reserveSpace: false
            },
            yaxes: [
                {font: {size: this.view.flotFontSize, color: "#666"}, reserveSpace: false},
                {font: {size: this.view.flotFontSize, color: "#666"}, reserveSpace: false}
            ],
            grid: {
                show: true, 
                color: "#aaa",
                borderWidth: 0,
                hoverable: true, 
                clickable: true,
                // labelMargin:0,
                // axisMargin:0
                margin: {top: 30}
            },
            selection: {mode: "x"},
            legend: {
                show: false,
//                position: "NW",
//                noColumns: 4
            }
        }
        if (!$('.graph').is(":hidden")) {
            this.plot = $.plot($('.graph'), series, options);        
            this.events();

            $(".graph-loader", this.view.container).hide();
        }
    }

    events() {
        super.events();
        var navigation = $('.graph-header', this.view.container).off('click');
        navigation.on('click', '.history', function() {
            $(".graph-header .power", this.view.container).hide();
            $(".graph-header .energy", this.view.container).show();
            $(".graph-stats", this.view.container).hide();
            $("#graph-stats", this.view.container).empty();
            
            this.view.mode = "energy";
            this.view.load();
            
        }.bind(this));
        
        navigation.on('click', '.time', function(event) {
            var days = $(event.target).data('days');
            this.setTimeWindowDays(days);
            this.load();
            
        }.bind(this));
        
        navigation.on('click', '.zoom-in', function() { this.zoomIn(); }.bind(this));
        navigation.on('click', '.zoom-out', function() { this.zoomOut(); }.bind(this));
        navigation.on('click', '.pan-left', function() { this.panLeft(); }.bind(this));
        navigation.on('click', '.pan-right', function() { this.panRight(); }.bind(this));
        
        $('.graph-footer').off('click').on('click', '.details', function(event) {
            var action = $(event.target, this.view.container);
            var mode = action.html();
            if (mode.toLowerCase().indexOf('show') !== -1) {
                $(".graph-stats", this.view.container).slideDown(350);
                action.html("HIDE DETAIL");
            }
            else {
                $(".graph-stats", this.view.container).slideUp(350);
                action.html("SHOW DETAIL");
            }
        }.bind(this));
    }

    zoomOut() {
        var date = new Date();
        var now = date.getTime();
        
        var timeWindow = this.end - this.start;
        var middle = this.start + timeWindow/2;
        timeWindow = timeWindow*2;
        var start = Math.max(middle - (timeWindow/2), this.earliest);
        var end = Math.min(middle + (timeWindow/2), now);
        
        this.setTimeWindow(start, end);
        this.load();
    }

    zoomIn() {
        var timeWindow = this.end - this.start;
        var middle = this.start + timeWindow/2;
        timeWindow = timeWindow*0.5;
        var start = middle - (timeWindow/2);
        var end = middle + (timeWindow/2);
        
        this.setTimeWindow(start, end);
        this.load();
    }

    panRight() {
        var date = new Date();
        var now = date.getTime();
        
        var timeWindow = this.end - this.start;
        var shiftSize = timeWindow*0.2;
        if (this.end + shiftSize > now) {
            shiftSize = now - this.end;
        }
        var start = this.start + shiftSize;
        var end = this.end + shiftSize;
      
        this.setTimeWindow(start, end);
        this.load();
    }

    panLeft() {
        var timeWindow = this.end - this.start;
        var shiftSize = timeWindow*0.2;
        if (this.start - shiftSize < this.earliest) {
            shiftSize = this.start - this.earliest;
        }
        var start = this.start - shiftSize;
        var end = this.end - shiftSize;
        
        this.setTimeWindow(start, end);
        this.load();
    }
}

class EnergyGraph extends Graph {
    constructor(view) {
        super(view, data.getGroup(Graph.ENERGY));
        
        this.setTimeWindowDays(30);
    }

    setTimeWindow(start, end) {
        // Align the timewindow to midnight of each day
        var startDate = new Date(start);
        startDate.setHours(0,0,0,0);
        this.start = Math.max(0, startDate.getTime());
        
        var endDate = new Date(end);
        endDate.setHours(0,0,0,0);
        this.end = endDate.getTime();
    }

    load() {
        // Only reload, if the requested interval is not already hold in cache
        if (this.data.hasDailyData(this.start, this.end)) {
            this.draw();
            
            return Promise.resolve(this.data);
        }
        $(".graph-loader", this.view.container).show();
        
        // Load a day more than selected, to allow daily energy consumption for the last day
        return this.data.loadDailyData(this.start, this.end).then(function(result) {
            this.draw();
            return result;
            
        }.bind(this)).catch(function(error) {
            this.draw();
            return error;
            
        }.bind(this));
    }

    loadTimeOfUse() {
      /*
      $.ajax({                                      
          url: path+"household/data?id="+feeds["use"].id,
          dataType: 'json',
          success: function(result) {
              var prc = Math.round(100*((result.overnightkwh + result.middaykwh) / result.totalkwh));
              $("#prclocal").html(prc);
              
              if (prc>20) $("#star1").attr("src",path+"files/star.png");
              if (prc>40) setTimeout(function() { $("#star2").attr("src",path+"files/star.png"); }, 100);
              if (prc>60) setTimeout(function() { $("#star3").attr("src",path+"files/star.png"); }, 200);
              if (prc>80) setTimeout(function() { $("#star4").attr("src",path+"files/star.png"); }, 300);
              if (prc>90) setTimeout(function() { $("#star5").attr("src",path+"files/star.png"); }, 400);
              
              var data = [
                {name:"AM PEAK", value: result.morningkwh, color:"rgba(68,179,226,0.8)"},
                {name:"DAYTIME", value: result.middaykwh, color:"rgba(68,179,226,0.6)"},
                {name:"PM PEAK", value: result.eveningkwh, color:"rgba(68,179,226,0.9)"},
                {name:"NIGHT", value: result.overnightkwh, color:"rgba(68,179,226,0.4)"},
                // {name:"HYDRO", value: 2.0, color:"rgba(255,255,255,0.2)"}   
              ];
              
              var options = {
                "color": "#333",
                "centertext": "THIS "+periodText.toUpperCase()
              }; 
              
              piegraph("piegraph",data,options);
          } 
      });*/
    }

    draw() {
        if (this.freeze) {
            return;
        }
        $(".graph-header .power", this.view.container).hide();
        $(".graph-header .energy", this.view.container).show();
        $(".graph-stats", this.view.container).hide();
        
        var series = this.view.unit == "energy" ? this.drawEnergy() : this.drawCost();
        var options = {
            xaxis: {
                mode: "time", 
                timezone: "browser", 
                font: {size: this.view.flotFontSize, color: "#666"}, 
                // labelHeight: -5
                reserveSpace: false
            },
            yaxis: {
                font: {size: this.view.flotFontSize, color: "#666"}, 
                // labelWidth: -5
                reserveSpace: false
            },
            selection: { mode: "x" },
            legend: {
                show: false
            },
            grid: {
                show: true, 
                color: "#aaa",
                borderWidth: 0,
                hoverable: true, 
                clickable: true
            }
        }
        this.plot = $.plot($('.graph', this.view.container), series, options);
        this.events();

        $(".graph-loader", this.view.container).hide();
    }

    drawEnergy() {
        var importSeries = [];
        var importWindow = 0;
        
        var exportSeries = [];
        var exportWindow = 0;
        
        var solarWindow = 0;
        var selfConsSeries = [];
        var selfConsWindow = 0;
        
        for (var day of this.data.iterateDailyData(this.start, this.end)) {
            var time = day.time;
            
            var energyValue = function(key) {
                if (typeof day[key] !== 'undefined') {
                    var value = parseFloat(day[key]);
                    if (!isNaN(value) && value >= 0) {
                        return value;
                    }
                }
                return 0;
            }
            var imp = energyValue(Graph.IMPORT);
            var exp = energyValue(Graph.EXPORT);
            var solar = energyValue(Graph.SOLAR);
            
            // Trim days with zero energy consumption
            if (imp > 0 || solar > 0) {
                importWindow += imp;
                importSeries.push([time, imp]);
                
                solarWindow += solar;
                exportWindow += exp;
                exportSeries.push([time, -exp]);
                
                var selfCons = Math.max(0, solar - exp);
                selfConsWindow += selfCons;
                selfConsSeries.push([time, selfCons]);
            }
        }
        var series = [];
        series.push({
            label:"Export", data: exportSeries, color: "#ffbe14", //highlightColor: '#ffcb47',
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 0
        });
        series.push({
            label:"Self-consumption", data: selfConsSeries, color: "#a1b97b", //highlightColor: '#b9cb9c',
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 1
        });
        series.push({
            label:"Consumption", data: importSeries, color: "#44b3e2", //highlightColor: '#5cbce6',
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 1
        });
        var consumptionWindow = importWindow + selfConsWindow;
        
        $("#window-cons", this.view.container).html((consumptionWindow/importSeries.length).toFixed(1)+ " kWh");
        if (solarWindow > 0) {
            $("#window-gen", this.view.container).html((solarWindow/importSeries.length).toFixed(1)+ " kWh");
            
            var selfConsShare = 0;
            if (consumptionWindow > 0) {
                selfConsShare = Math.min(100, selfConsWindow/solarWindow*100);
            }
            var selfSuffShare = 0;
            if (solarWindow > 0) {
                selfSuffShare = Math.min(100, selfConsWindow/consumptionWindow*100);
            }
            $("#window-selfcons", this.view.container).html(selfConsShare.toFixed(0)+ "%");
            $("#window-selfsuff", this.view.container).html(selfSuffShare.toFixed(0)+ "%");
            
            $(".window.self").show();
            $(".window.generation").show();
        }
        else {
            $(".window.self").hide();
            $(".window.generation").hide();
        }
        $(".window.energy", this.view.container).show();
        $(".window.power", this.view.container).hide();
        
        return series;
    }

    drawCost() {
        var savings = [];
        
        var importCost = [];
        var importWindow = 0;
        
        var exportCost = [];
        var exportWindow = 0;
        
        for (var day of this.data.iterateDailyData(this.start, this.end)) {
            var time = day.time;
            
            let energyValue = function(key) {
                if (typeof day[key] !== 'undefined') {
                    var value = parseFloat(day[key]);
                    if (!isNaN(value) && value >= 0) {
                        return value;
                    }
                }
                return 0;
            }
            var imp = energyValue(Graph.IMPORT);
            var exp = energyValue(Graph.EXPORT);
            var solar = energyValue(Graph.SOLAR);
            
            // Trim days with zero energy consumption
            if (imp > 0 || solar > 0) {
                var saving = 0;
                
                var cost = imp*this.view.cost[Graph.IMPORT];
                var income = exp*this.view.cost[Graph.EXPORT];
                
                importWindow += cost;
                exportWindow += income;
                
                if (this.view.cost[Graph.EXPORT] > 0) {
                    if (cost >= income) {
                        saving = income;
                        
                        cost -= income;
                        income = 0;
                    }
                    else {
                        saving = cost;
                        
                        income -= cost;
                        cost = 0;
                    }
                }
                saving += Math.max(0, solar - exp)*this.view.cost[Graph.IMPORT];
                savings.push([time, saving]);
                importCost.push([time, cost]);
                exportCost.push([time, -income]);
            }
        }
        var series = [];
        series.push({
            label:"Export", data: exportCost, color: "#a1b97b",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 0
        });
        series.push({
            label:"Import", data: importCost, color: "#dd7777",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 1
        });
        series.push({
            label:"Consumption", data: savings, color: "#ddd",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0},
            stack: 1
        });
        
        $("#window-cons", this.view.container).html(this.view.currency+importWindow.toFixed(2));
        if (exportWindow > 0) {
            $("#window-gen", this.view.container).html(this.view.currency+exportWindow.toFixed(2));
            $(".window.generation").show();
        }
        else {
            $(".window.generation").hide();
        }
        $(".window.self").hide();
        
        $(".window.energy", this.view.container).show();
        $(".window.power", this.view.container).hide();
        
        return series;
    }

    events() {
        super.events();
        $('.graph-header', this.view.container).off('click').on('click', '.time', function(event) {
            var time = $(event.target);
            var text = time.data('text');
            if (text == 'all') {
                this.setTimeWindow(this.earliest, new Date().getTime());
            }
            else {
                this.setTimeWindowDays(time.data('days'));
            }
            this.periodText = text;
            this.load();
        }.bind(this));
    }
}

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values/901144#901144
var urlParams;
(window.onpopstate = function () {
    var match,
        pl = /\+/g, // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();
