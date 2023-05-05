// Graph configuration
var options = {
  xaxis: {
      mode: "time", 
      timezone: "browser"
  },
  selection: { 
      mode: "x", 
      color:"#000" 
  },
  legend: {
      show:false
  },
  grid: {
      show:true, 
      color:"#aaa",
      borderWidth:0,
      hoverable: true
  }
};
// Used for tooltip
var previousPoint = false;
var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Initial start and end times of graph
// 5 minute interval
// 7 days
var interval = 300;
var intervalms = interval*1000
var timenow = (new Date()).getTime();
view.limit_x = false;

var ids = [];
var series = [];
var mode = "forecast";

init_series();

function init_series() {
    if (mode=="forecast") {
        $('.time').hide();
        series = [
            {label:"WIND", feedid:477240, color:"rgba(0,255,0,0.6)"},
            {label:"WIND EMBEDDED", feedid:477234, color:"rgba(0,200,0,0.6)"},
            {label:"SOLAR", feedid:477236, color:"rgba(255,255,0,0.6)"},
            {label:"DEMAND", feedid:477241, color:"rgba(255,0,0,0.6)",stack: false,fill:false,show:true}
        ];
        view.start = Math.round(timenow / intervalms) * intervalms;
        view.end = view.start + (86400*1000*7);
    
    } else {
        $('.time').show();
        $('.time[time=1]').hide();
        $('.time[time=3]').hide();
        $('.time[time=6]').hide();
        series = [
            {label:"NUCLEAR", feedid:97697, color:"rgba(227,225,36,0.6)"},
            {label:"BIOMASS", feedid:382965, color:"#735d34"},
            
            {label:"INTFR", feedid:97707, color:"#36b271"},
            {label:"INTIRL", feedid:97709, color:"#64d098"},
            {label:"INTNED", feedid:97711, color:"#78d6a5"},
            {label:"INTEW", feedid:97713, color:"#8bdcb2"},
            {label:"INTNEM", feedid:382967, color:"#9fe2bf"},
            {label:"INTIFA2", feedid:476656, color:"#b3e8cc"},
            {label:"INTNSL", feedid:476657, color:"#c6eed9"},
            {label:"INTELEC", feedid:476658, color:"#daf4e6"},
            
            {label:"NPSHYD", feedid:97703, color:"rgba(0,50,255,0.6)"},
            {label:"WIND", feedid:97699, color:"rgba(0,255,0,0.6)"},
            {label:"WIND EMBEDDED", feedid:477234, color:"rgba(0,200,0,0.6)"},
            {label:"SOLAR", feedid:477236, color:"rgba(255,255,0,0.6)"},
            {label:"PS", feedid:97701, color:"rgba(0,150,255,0.6)"},

             
            {label:"OTHER", feedid:97705, color:"rgba(227,162,36,0.6)"},
            
            {label:"OIL", feedid:97693, color:"rgba(50,50,50,0.6)"},
            {label:"COAL",feedid:97695, color:"rgba(0,0,0,0.6)"},
            {label:"OCGT", feedid:97691, color:"rgba(0,100,200,0.6)"},
            {label:"CCGT", feedid:97689, color:"rgba(0,100,255,0.6)"},
        
            
            {label:"DEMAND", feedid:476659, color:"rgba(255,0,0,0.6)",stack: false,fill:false,show:true},
            {label:"INTENSITY", feedid:428391, color:"rgba(255,255,255,0.6)",yaxis:2,stack: false,fill:false,show:false}
        ];
        view.end = Math.round(timenow / intervalms) * intervalms;
        view.start = view.end - (86400*1000*7);
        
    }

    ids = [];

    var out = "";
    for (var z in series) {
        ids.push(series[z].feedid)
        
        if (series[z].show==undefined) series[z].show = true;
        if (series[z].stack==undefined) series[z].stack = true;
        
        if (series[z].fill!=undefined && series[z].fill==false) {
            series[z].lines = {show:true, fill:false};
        } else {
            series[z].lines = {show:true, fill:0.6, lineWidth:0};
        }
    
        var star = "";
        var show = 0;
        if (series[z].show) {star = "&nbsp;*&nbsp;"; show = 1;}
        out += '<div style="display:inline-block; width:180px"><div class="legendcheckbox" index="'+z+'" show='+show+' style="float:left; background-color:'+series[z].color+'; cursor:pointer">';
        out += '<div class="legendItem">'+star+'</div></div>'+series[z].label+'</div>';
    }
    $("#visible-checkboxes").html(out);
    load();
}

function load() {
    interval = ((view.end - view.start)*0.001) / 288;
    if (interval<300) interval = 300;
    
    intervalms = interval * 1000;
    view.start = Math.floor(view.start / intervalms) * intervalms;
    view.end = Math.floor(view.end / intervalms) * intervalms;
    
    $.ajax({                                      
        url: path+"app/dataremote",
        data: {
            ids: ids.join(","),
            start: view.start,
            end: view.end,
            interval: interval,
            timeformat: "notime",
            average:1,
            limitinterval:0,
            skipmissing:0
        },
        async: true,
        dataType: "json",
        success: function(data) {
            // Convert data to time series
            for (var z in series) {
                data_with_time = []
                time = view.start;
                for (var i in data[z].data) {
                    val = data[z].data[i]
                    if (val==null && series[z].stack) val = 0
                    data_with_time.push([time,val]);
                    time += intervalms;
                } 
                series[z].data = data_with_time
            }
            
            // Do not show embeded wind and solar forecast in historic fuel mix mode
            if (mode!="forecast") {
                var last_index = -1;
                for (var z=0; z<series[20].data.length; z++) {
                    if (series[20].data[z][1]!=null) {
                        last_index = z;
                    }
                }
            
                if (last_index!=-1) {
                    for (var z=last_index+1; z<series[12].data.length; z++) {
                        series[12].data[z][1] = null;
                        series[13].data[z][1] = null;
                    }
                }
            }
            
            // Modify demand data to include embedded wind and solar
            if (mode=="forecast") {
                for (var z=0; z<series[3].data.length; z++) {
                    if (series[1].data[z][1]!=null) {
                        series[3].data[z][1] += series[1].data[z][1];
                        series[3].data[z][1] += series[2].data[z][1];
                    }
                }
            } else {
                for (var z=0; z<series[20].data.length; z++) {
                    if (series[12].data[z][1]!=null) {
                        series[20].data[z][1] += series[12].data[z][1];
                        series[20].data[z][1] += series[13].data[z][1];
                    }
                }  
            }
            
            
            
            draw();
        }
    });
}

function draw() {
    var data = [];
    for (var z in series) {
        if (series[z].show) data.push(series[z]);
    }
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;  
    $.plot("#placeholder",data, options);
}

function resize(){
    draw();
}

// Event handlers

$(".fuelmix").click(function() {
    mode = "fuelmix";
    $(".forecast").toggleClass('active', false); 
    $(".fuelmix").toggleClass('active', true); 
    init_series();
    $("#forecast-info").hide();
    $("#fuel-mix-info").show();
});

$(".forecast").click(function() {
    mode = "forecast";
    $(".fuelmix").toggleClass('active', false);
    $(".forecast").toggleClass('active', true); 
    init_series();
    $("#forecast-info").show();
    $("#fuel-mix-info").hide();
});

$("#visible-checkboxes").on("click",".legendcheckbox",function() {
    var index = $(this).attr("index");
    var show = $(this).attr("show");
    
    if (show==0) {
        show = 1; 
        $(this).find(".legendItem").html("&nbsp;*&nbsp;");
    } else { 
        show=0;
        $(this).find(".legendItem").html("");
    }
    $(this).attr("show",show);
    
    series[index].show = show;
    draw();
});

$('#placeholder').bind("plotselected", function (event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    load();
});

$("#zoomout").click(function () {view.zoomout(); load();});
$("#zoomin").click(function () {view.zoomin(); load();});
$('#right').click(function () {view.panright(); load();});
$('#left').click(function () {view.panleft(); load();});
$('.time').click(function () {view.timewindow($(this).attr("time")/24.0); load();});


$('#placeholder').bind("plothover", function (event, pos, item) {
    if (item) {
        var i = item.dataIndex;
        
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;

            $("#tooltip").remove();
         
            var itemTime = item.datapoint[0];
            var itemValue = item.datapoint[1];
            
            var d = new Date(itemTime);
            var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            var date = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();
              
            var h = d.getHours();
            if (h<10) h = "0"+h;
            var m = d.getMinutes();
            if (m<10) m = "0"+m;
            var time = h+":"+m;
            
            var name = "";
            var unit = " MW";
            
            if (item.series.label=="INTENSITY") {
                unit = " gCO2/kWh"
            }
            
            var out ="";
            for (var z in series) {
                if (series[z].label==item.series.label) {
                    let value = series[z].data[i][1];
                    if (value!=null) {
                        out += series[z].label+": "+value.toFixed(0)+unit+"<br>";
                    }
                    break;
                }
            }
                  
            tooltip(item.pageX, item.pageY, out+date+", "+time, "#fff", "#000");
        }
    } else $("#tooltip").remove();
});

$(window).resize(function(){
    resize();
});
