class GraphView {
    constructor(path, container) {
        if (!container) {
            alert('Graph has to be loaded into a valid container');
            return false;
        }
        this.container = container;
        this.container.load(path + "Modules/app/lib/graph.html");
        
        if (!$('#tooltip').length) {
            $("<div id='tooltip'></div>").css({
                position: 'absolute',
                display: 'none',
                border: '1px solid #000',
                padding: '2px',
                'font-weight': 'bold',
                'text-align': 'left',
                'background-color': '#fff',
                color: '#000',
                opacity: 0.80
            }).appendTo("body");
        }
        this.flotFontSize = 12;
        this.mode = "energy";
        this.unit = "energy";
    }
    
    init(data, config) {
        this.data = data;
        this.power = new PowerGraph(this);
        this.energy = new EnergyGraph(this);
        
        this.unitCost = config.app.unitcost.value;
        this.currency = config.app.currency.value;
        
        this.data.loadMeta(function(result) {
            this.power.earliest = result.getEarliestPowerTime();
            this.energy.earliest = result.getEarliestEnergyTime();
        }.bind(this));
    }
    
    load(callback) {
        if (this.mode == "power") {
            this.power.load(callback);
        }
        else if (this.mode == "energy") {
            this.energy.load(callback);
        }
    }
    
    draw(flotFontSize) {
        if (typeof flotFontSize !== 'undefined') {
            this.flotFontSize = flotFontSize;
        }
        
        if (this.mode == "power") {
            this.power.draw();
        }
        else if (this.mode == "energy") {
            this.energy.draw();
        }
    }
    
    setTimeWindow(start, stop) {
        if (this.mode == "power") {
            this.power.setTimeWindow(start, stop);
        }
        else if (this.mode == "energy") {
            this.energy.setTimeWindow(start, stop);
        }
    }
}

class Graph {
    constructor(view) {
        this.view = view;
        
        this.earliest = 0;
        this.start = 0;
        this.end = 0;

        this.panning = false;
        this.selectedLast = null;
    }
    
    events() {
        var plot = $('#placeholder', this.view.container).off();
        plot.on('plothover', function(event, pos, item) {
            if (item) {
                var itemTime = item.datapoint[0];
                if (this.selectedLast != itemTime) {
                    this.selectedLast = itemTime;
                    var date = new Date(itemTime);
                    var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    
                    var cons = item.datapoint[1];
                    var text = "";
                    if (this.view.mode == "energy") {
                        var header = days[date.getDay()]+", "+months[date.getMonth()]+" "+date.getDate();
                        
                        if (this.view.unit == "energy") {
                            text = header+"<br>"+(cons).toFixed(1)+" kWh";
                        } else {
                            text = header+"<br>"+(cons).toFixed(1)+" kWh ("+this.view.currency+(cons*this.view.unitCost).toFixed(2)+")";
                        }
                    }
                    else {
                        var header = months[date.getMonth()]+" "+date.getDate()+", "+date.getHours()+":"+date.getMinutes();
                        
                        if (cons < 10000) {
                            text = header+"<br>"+Math.round(cons)+" W";
                        }
                        else {
                            text = header+"<br>"+(cons*0.001).toFixed(1)+" kW";
                        }
                    }
                    var tooltip = $('#tooltip').html(text).fadeIn(200);
                    
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
                this.selectedLast = null;
                $("#tooltip").hide();
            }
        }.bind(this));
        
        // Auto click through to power graph
        plot.on('plotclick', function(event, pos, item) {
            if (item && !this.panning && this.view.mode == "energy") {
                var start = item.datapoint[0];
                var end = start + 86400000;
                
                this.view.mode = "power";
                this.view.setTimeWindow(start, end);
                this.view.load();
                
                $(".bargraph-navigation", this.view.container).hide();
                $(".powergraph-navigation", this.view.container).show();
            }
        }.bind(this));
        
        plot.on("plotselected", function (event, ranges) {
            var start = ranges.xaxis.from;
            var end = ranges.xaxis.to;
            this.panning = true; 
            
            this.view.setTimeWindow(start, end);
            this.view.load();
            
            setTimeout(function() { this.panning = false; }.bind(this), 100);
        }.bind(this));
    }
    
    setTimeWindowDays(days) {
        // Set the time windows to show a specific amount of days
        var end = (new Date()).getTime();
        var start = end - 86400000*days;
        
        this.setTimeWindow(start, end);
    }
    
    setTimeWindow(start, end) {
        this.start = start;
        this.end = end;
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
        var i=0;
        var minval = 0;
        var maxval = 0;
        for (z in data) {
            var val = data[z][1];
            if (val != null) {
                if (i==0) {
                    maxval = val;
                    minval = val;
                }
                if (val>maxval) maxval = val;
                if (val<minval) minval = val;
                sum += val;
                i++;
            }
        }
        var mean = sum / i;
        sum = 0, i=0;
        for (z in data) {
            sum += (data[z][1] - mean)*(data[z][1] - mean);
            i++;
        }
        var stdev = Math.sqrt(sum/i);
        
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
        super(view);
        
        //Set the initial time window to show the last 6 hours
        this.setTimeWindowDays(6/24.0);
    }
    
    load(callback) {
        this.view.data.loadPower(this.start, this.end, this.interval, function(result) {
            this.draw();
            
            if (callback != undefined) callback(result);
        }.bind(this));
    }
    
    draw() {
        $("#power-graph-footer", this.view.container).show();
        
        var windowPower = [];
        var windowEnergy = 0.0;
        for (var timevalue of this.view.data.iteratePower(this.start, this.end, this.interval)) {
            var time = timevalue.time;
            
            var power = timevalue['use'];
            if (power != null) {
                if (windowPower.length > 0) {
                    var timeDelta = (time - windowPower[windowPower.length-1][0])*0.001;
                    if (timeDelta < 3600) {
                        windowEnergy += (power*timeDelta)/3600000;
                    }
                }
                windowPower.push([time, power]);
            }
        }
        
        var options = {
            lines: {
                fill: false
            },
            xaxis: { 
                mode: "time",
                timezone: "browser", 
                min: this.view.start,
                max: this.view.end, 
                font: {
                    size: this.view.flotFontSize,
                    color: "#666"
                },
                reserveSpace: false
            },
            yaxes: [
                {min: 0, font: {size: this.view.flotFontSize, color: "#666"}, reserveSpace: false},
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
            legend: {position: "NW", noColumns: 4}
        }

        var series = [];
        series.push({
            data: windowPower, yaxis: 1, color: "#44b3e2", 
            lines: { show: true, fill: 0.8, lineWidth: 0}
        });
        
        var plot = $.plot($('#placeholder'), series, options);
        
        var windowStats = {};
        windowStats["use"] = Graph.stats(windowPower);
        
        var windowStatsOut = "";
        for (var z in windowStats) {
            windowStatsOut += "<tr>";
            windowStatsOut += "<td style='text-align:left'>"+z+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[z].minval.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[z].maxval.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[z].diff.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[z].mean.toFixed(2)+"</td>";
            windowStatsOut += "<td style='text-align:center'>"+windowStats[z].stdev.toFixed(2)+"</td>";
            windowStatsOut += "</tr>";
        }
        $("#stats").html(windowStatsOut);
        
        if (this.view.unit == "energy") {
            $("#window-kwh", this.view.container).html(windowEnergy.toFixed(1)+ "kWh");
            $("#window-cost", this.view.container).html("");
        } else {
            $("#window-kwh", this.view.container).html(windowEnergy.toFixed(1)+ "kWh");
            $("#window-cost", this.view.container).html("("+this.view.currency+(windowEnergy*this.view.unitCost).toFixed(2)+")");
        }
        this.events();
    }
    
    events() {
        super.events();
        var navigation = $('.powergraph-navigation', this.view.container).off();
        navigation.on('click', '.viewhistory', function() {
            $(".powergraph-navigation", this.view.container).hide();
            $(".bargraph-navigation", this.view.container).show();

            this.view.mode = "energy";
            this.view.load();
        }.bind(this));
        
        navigation.on('click', '.time', function(event) {
            var days = event.target.getAttribute('time');
            this.setTimeWindowDays(days/24.0);
            this.load();
        }.bind(this));
        
        $("#zoomout", this.view.container).off().on('click', function() { this.zoomOut(); }.bind(this));
        $("#zoomin", this.view.container).off().on('click', function() { this.zoomIn(); }.bind(this));
        $('#right', this.view.container).off().on('click', function() { this.panRight(); }.bind(this));
        $('#left', this.view.container).off().on('click', function() { this.panLeft(); }.bind(this));
        
        $("#advanced-toggle", this.view.container).off().on('click', function(event) {
            var element = $(event.target.id, this.view.container);
            var mode = element.html();
            if (mode == "SHOW DETAIL") {
                $("#advanced-block", this.view.container).show();
                element.html("HIDE DETAIL");
            }
            else {
                $("#advanced-block", this.view.container).hide();
                element.html("SHOW DETAIL");
            }
        }.bind(this));
    }
    
    setTimeWindow(start, end) {
        this.interval = Graph.roundInterval((end - start)*0.001/this.view.data.datapointsLimit);
        
        var intervalMillis = this.interval*1000;
        this.start = Math.ceil(start/intervalMillis)*intervalMillis;
        this.end = Math.ceil(end/intervalMillis)*intervalMillis;
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
        super(view);
        
        this.periodText = "month";
        this.periodAverage;
        
        this.setTimeWindowDays(30);
    }

    load(callback) {
        // Load a day more than selected, to allow daily energy consumption for the last day
        data.loadDailyEnergy(this.start, this.end+86400000, function(result) {
            this.draw();
            
            if (callback != undefined) callback(result);
        }.bind(this));
        
        this.loadTimeOfUse();
    }

    loadTimeOfUse() {
      /*
      $.ajax({                                      
          url: path+"household/data?id="+feeds["use"].id,
          dataType: 'json',                  
          success: function(result) {
              console.log("here...");
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
        $("#power-graph-footer", this.view.container).hide();
        
        var periodEnergy = 0;
        var dailyEnergy = [];
        for (var day of this.view.data.iterateDailyEnergy(this.start, this.end)) {
            var time = day.time;
            
            var value = day['use_kwh'];
            // Trim days with zero energy consumption
            if (value > 0 || dailyEnergy.length > 0) {
                periodEnergy += value;
                dailyEnergy.push([time, value]);
            }
        }
        this.periodAverage = periodEnergy/dailyEnergy.length;
        
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
                reserveSpace: false,
                min: 0
            },
            selection: { mode: "x" },
            grid: {
                show: true, 
                color: "#aaa",
                borderWidth: 0,
                hoverable: true, 
                clickable: true
            }
        }
        
        var series = [];
        series.push({
            data: dailyEnergy, color: "#44b3e2",
            bars: { show: true, align: "center", barWidth: 0.75*3600*24*1000, fill: 1.0, lineWidth: 0}
        });
        
        var plot = $.plot($('#placeholder', this.view.container), series, options);
        $('#placeholder', this.view.container).append("<div id='bargraph-label' style='position:absolute; left:50px; top:30px; color:#666; font-size:12px'></div>");
        
        this.events();
    }
    
    events() {
        super.events();
        var navigation = $('.bargraph-navigation', this.view.container).off();
        navigation.on('click', '.bargraph-week', function() {
            this.setTimeWindowDays(7);
            this.periodText = "week";

            this.load();
        }.bind(this));
        
        navigation.on('click', '.bargraph-month', function() {
            this.setTimeWindowDays(30);
            this.periodText = "month";

            this.load();
        }.bind(this));
        
        navigation.on('click', '.bargraph-alltime', function() {
            this.setTimeWindow(this.earliest, (new Date()).getTime());
            this.periodText = "period";
            
            this.load();
        }.bind(this));
    }
    
    setTimeWindow(start, end) {
        // Align the timewindow to midnight of each day
        var startDate = new Date(start);
        startDate.setHours(0,0,0,0);
        this.start = startDate.getTime();
        
        var endDate = new Date(end);
        endDate.setHours(0,0,0,0);
        this.end = endDate.getTime();
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