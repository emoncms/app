feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "consumption": {
        "type": "feed",
        "autoname": "use"
    },
    "solar": {
        "type": "feed",
        "autoname": "solar",
        "optional": true
    },
    "public": {
        "type": "checkbox",
        "name": "Public",
        "default": 0,
        "optional": true,
        "description": "Make app public"
    }
};
config.name = app_name;
config.db = app_config;
config.feeds = feed.list();

config.initapp = function() {

};
config.showapp = function() {
    $(".ajax-loader").hide();
    $("body").css('background-color','#fff');
    load();
};
config.hideapp = function() {

};

// ----------------------------------------------------------------------

var series = [];
var feed_data = {};
var options = {
    xaxis: {
        mode: "time",
        timezone: "browser"
    },
    selection: { 
        mode: "x", 
        color:"#000" 
    },
    grid: {
        hoverable: true,
        clickable: true
    }
};
// Janurary 2023 - 1 hour interval
view.end = (new Date("2023-05-01")).getTime();
view.start = (new Date("2022-05-01")).getTime();
view.limit_x = false;
interval = 1800;

// Vue app
var app = new Vue({
    el: '#app',
    data: {
        generation: {
            wind: {
                name: "UK Wind (normalised)",
                id: 480172,
                color: "#00B050",
                capacity: 1.54, 
                kwh: 0, 
                capacity_factor: 0
            },
            solar: {
                name: "UK Solar (normalised)", 
                id: 480863,
                color: "#FFC000",
                capacity: 0, 
                kwh: 0, 
                capacity_factor: 0
            }
        },
        nuclear: {
            output: 0,
            kwh: 0,
            capacity_factor: 0
        },
        home_solar: {
            scale: 0,
            kwh: 0,
            capacity_factor: 0
        },
        supply: {
            kwh: 0
        },
        consumption: {
            kwh: 0,
            efuel_demand: 0
        },
        balance: {
            before_store1: 0,
            after_store1: 0,
            after_store2: 0,
            surplus: 0,
            unmet: 0
        },
        store1: {
            charge_max: 3,
            charge_efficiency: 0.9,
            discharge_max: 3,
            discharge_efficiency: 0.9,
            capacity: 5,
            starting_soc: 2.5,
            soc: 0,
            charge_kwh: 0,
            discharge_kwh: 0,
            cycles: 0,
            max_charge: 0,
            max_discharge: 0
        },
        store2: {
            charge_max:0.8,
            charge_efficiency: 0.8,
            discharge_max: 1.6,
            discharge_efficiency: 0.5,
            capacity: 1200,
            starting_soc: 100,
            soc: 0,
            charge_kwh: 0,
            discharge_kwh: 0,
            cycles: 0,
            max_charge: 0,
            max_discharge: 0
        },
        auto_optimise: false,
        show_peak_shaving_balance: false,
        max_peak_shaving_deficit: 0
    },
    methods: {
        update: function() {
            model();
        },
        auto: function() {
            this.auto_optimise = true;
            model();
            this.auto_optimise = false;
            model();
        }
    },
    filters: {
        toFixed: function (value,dp) {
            // if (!value) return ''
            return value.toFixed(dp)
        }   
    }
});

config.init();

function load(){
    
    // Specify generation feeds
    var ids = [];
    var keys = [];
    for (var key in app.generation) {
        ids.push(app.generation[key].id);
        keys.push(key);
    }
    // Consumption feed
    ids.push(476422);
    keys.push("consumption");
    
    var start_date = new Date("2022-05-01");

    // Initialise feed_data object
    for (var z in keys) {
        feed_data[keys[z]] = [];
    }
    feed_data["consumption"] = [];
    feed_data["home_solar"] = [];

    // Load remote data in 1 month chunks
    for (var i=0; i<4; i++) {
        start_time = start_date.getTime();
        end_time = start_date.setMonth(start_date.getMonth()+3);
        
        var month = remote.getdata(ids,start_time,end_time,interval,1,0,0,0,'notime',false,false);
        // Add data to feed_data object
        for (var z in keys) {
            // append array to array
            for (var j in month[z].data) {
                feed_data[keys[z]].push(month[z].data[j]);
            }
        }
    }
/*
    if (config.app.consumption.value!="disable" && parseInt(config.app.consumption.value)>0) {
        start_date = new Date("2022-05-01");
        // Load local data in 1 month chunks
        for (var i=0; i<1; i++) {
            start_time = start_date.getTime();
            end_time = start_date.setMonth(start_date.getMonth()+12);
            var month = feed.getdata(config.app.consumption.value,start_time,end_time,interval,1,0,0,0,false,false,'notime');
            for (var j in month) {
                feed_data["consumption"].push(month[j]);
            }
        }
    } else {
        feed_data["consumption"] = undefined;
    }*/

    if (config.app.solar.value!="disable" && parseInt(config.app.solar.value)>0) {
        start_date = new Date("2022-05-01");
        // Load local data in 1 month chunks
        for (var i=0; i<4; i++) {
            start_time = start_date.getTime();
            end_time = start_date.setMonth(start_date.getMonth()+3);
            var month = feed.getdata(config.app.solar.value,start_time,end_time,interval,1,0,0,0,false,false,'notime');
            for (var j in month) {
                feed_data["home_solar"].push(month[j]);
            }
        }
    } else {
        feed_data["home_solar"] = undefined;
    }    

    model();
}

function model(){

    series = []
    for (var z in app.generation) {
        series.push({
            label: app.generation[z].name, 
            data: [], color: 
            app.generation[z].color,
            stack: true,
            lines: { show: true, fill: true, lineWidth: 0 }
        });
    }
    series.push({label: "Nuclear", data: [], color: "#DDA0DD", lines: { show: true, fill: true, lineWidth: 1 }});
    series.push({label: "Store2 Discharge", data: [], color: "#888", stack: true, lines: { show: true, fill: true, lineWidth: 0 }});
    series.push({label: "Consumption", data: [], color: "#666", lines: { show: true, fill: true, lineWidth: 1 }});
    series.push({label: "Store1 SOC", data: [], color: "#000", yaxis: 2, lines: { show: true, fill: false, lineWidth: 1 }});
    series.push({label: "Store2 SOC", data: [], color: "#0000ff", yaxis: 2, lines: { show: true, fill: false, lineWidth: 1 }});
    if (app.show_peak_shaving_balance) {
        series.push({label: "Peak Shaving Balance", data: [], color: "#000", yaxis: 3, lines: { show: true, fill: false, lineWidth: 1 }});
    }
    let power_to_kwh = interval / 3600;

    // Model
    let wind = 0;
    let solar = 0;
    let home_solar = 0;
    let nuclear = 0;
    let consumption = 0;

    let wind_kwh = 0
    let solar_kwh = 0
    let home_solar_kwh = 0
    let nuclear_kwh = 0
    let consumption_kwh = 0
    let supply_kwh = 0

    let deficit_before_store1_kwh = 0;
    let deficit_after_store1_kwh = 0;
    let deficit_after_store2_kwh = 0;

    let peak_shaving_balance = 0;
    
    app.store1.charge_kwh = 0;
    app.store1.discharge_kwh = 0;

    app.store2.charge_kwh = 0;
    app.store2.discharge_kwh = 0;

    app.store1.soc = app.store1.starting_soc;
    app.store2.soc = app.store2.starting_soc;

    app.balance.surplus = 0;
    app.balance.unmet = 0;

    let home_solar_max = 0;
    
    app.store1.max_charge = 0;
    app.store2.max_charge = 0;

    app.store1.max_discharge = 0;
    app.store2.max_discharge = 0;

    app.store2.max_level = 0;
    app.store2.min_level = 100000;

    if (app.auto_optimise) {
        app.store1.charge_max = 1000;
        app.store1.discharge_max = 1000;
        app.store2.charge_max = 1000;
        app.store2.discharge_max = 1000;
        // app.store2.capacity = 100000;
        // app.store2.starting_soc = 5000;
        // app.store2.soc = app.store2.starting_soc;
    }

    app.max_peak_shaving_deficit = 0

    if (feed_data['consumption']==undefined) {
        return false;
    }

    var interval_direct_efuel_demand = app.consumption.efuel_demand / feed_data['consumption'].length;
    var unmet_direct_efuel_demand = 0;

    var start = feed_data['consumption'][0][0];
    for (var z=0; z<feed_data['consumption'].length; z++) {
        let time = start*0.001 + (z * interval);

        if (feed_data['wind'][z][1]!=null)
            wind = feed_data['wind'][z][1] * app.generation.wind.capacity;

        if (feed_data['solar'][z][1]!=null)
            solar = feed_data['solar'][z][1] * app.generation.solar.capacity;

        if (feed_data['consumption'][z][1]!=null)
            consumption = feed_data['consumption'][z][1] * 0.001;
            if (consumption<0) consumption = 0;

        if (feed_data['home_solar']!=undefined && feed_data['home_solar'][z][1]!=null)
            home_solar = feed_data['home_solar'][z][1] * 0.001 * app.home_solar.scale * 0.01;
            if (home_solar<0) home_solar = 0;
            if (home_solar>home_solar_max) home_solar_max = home_solar;

        nuclear = app.nuclear.output;

        // Calculate kwh
        wind_kwh += wind * power_to_kwh;
        solar_kwh += solar * power_to_kwh;
        home_solar_kwh += home_solar * power_to_kwh;
        nuclear_kwh += nuclear * power_to_kwh;
        consumption_kwh += consumption * power_to_kwh;

        // Calculate balance
        supply = wind + solar + home_solar + nuclear;
        supply_kwh += supply * power_to_kwh;
        demand = consumption;
        balance = supply - demand;

        // Record deficit before battery storage
        if (balance<0) {
            let deficit_before_store1 = -balance;
            deficit_before_store1_kwh += deficit_before_store1 * power_to_kwh;
        }

        // Store 1
        if (balance>0) {
        
            // Charge battery
            let charge = balance;
            if (charge > app.store1.charge_max) {
                charge = app.store1.charge_max;
            }
            let charge_after_loss = charge * app.store1.charge_efficiency;
            let soc_inc = charge_after_loss * power_to_kwh;
            // Limit charge to battery capacity
            if (app.store1.soc + soc_inc > app.store1.capacity) {
                soc_inc = app.store1.capacity - app.store1.soc;
                charge_after_loss = soc_inc * (1/power_to_kwh);
                charge = charge_after_loss / app.store1.charge_efficiency;
            }
            if (charge>app.store1.max_charge) {
                app.store1.max_charge = charge;
            }
            app.store1.soc += soc_inc;
            balance -= charge;
            app.store1.charge_kwh += charge * power_to_kwh;
        } else {
            // Discharge battery
            let discharge = -balance;
            if (discharge > app.store1.discharge_max) {
                discharge = app.store1.discharge_max;
            }
            let discharge_before_loss = discharge / app.store1.discharge_efficiency;
            let soc_dec = discharge_before_loss * power_to_kwh;
            // Limit discharge to battery SOC
            if (app.store1.soc - soc_dec < 0) {
                soc_dec = app.store1.soc;
                discharge_before_loss = soc_dec * (1/power_to_kwh);
                discharge = discharge_before_loss * app.store1.discharge_efficiency;
            }
            if (discharge>app.store1.max_discharge) {
                app.store1.max_discharge = discharge;
            }   
            app.store1.soc -= soc_dec;
            balance += discharge;
            app.store1.discharge_kwh += discharge * power_to_kwh;
        }

        // Record deficit after battery storage
        if (balance<0) {
            let deficit_after_store1 = -balance;
            deficit_after_store1_kwh += deficit_after_store1 * power_to_kwh;
        }

        let store2_discharge = 0;

        // Store 2
        if (balance>0) {
        
            // Charge battery
            let charge = balance;
            if (charge > app.store2.charge_max) {
                charge = app.store2.charge_max;
            }
            let charge_after_loss = charge * app.store2.charge_efficiency;
            let soc_inc = charge_after_loss * power_to_kwh;
            // Limit charge to battery capacity
            if (app.store2.soc + soc_inc > app.store2.capacity) {
                soc_inc = app.store2.capacity - app.store2.soc;
                charge_after_loss = soc_inc * (1/power_to_kwh);
                charge = charge_after_loss / app.store2.charge_efficiency;
            }
            if (charge>app.store2.max_charge) {
                app.store2.max_charge = charge;
            }  
            app.store2.soc += soc_inc;
            balance -= charge;
            app.store2.charge_kwh += charge * power_to_kwh;
        } else {
            // Discharge battery
            let discharge = -balance;
            if (discharge > app.store2.discharge_max) {
                discharge = app.store2.discharge_max;
            }
            peak_shaving_balance -= (-balance - app.store2.discharge_max) * power_to_kwh;

            let discharge_before_loss = discharge / app.store2.discharge_efficiency;
            let soc_dec = discharge_before_loss * power_to_kwh;
            // Limit discharge to battery SOC
            if (app.store2.soc - soc_dec < 0) {
                soc_dec = app.store2.soc;
                discharge_before_loss = soc_dec * (1/power_to_kwh);
                discharge = discharge_before_loss * app.store2.discharge_efficiency;
            }
            if (discharge>app.store2.max_discharge) {
                app.store2.max_discharge = discharge;
            }   
            app.store2.soc -= soc_dec;
            balance += discharge;
            app.store2.discharge_kwh += discharge * power_to_kwh;
            store2_discharge = discharge;
        }

        // Substract direct efuel demand
        if (app.store2.soc - interval_direct_efuel_demand < 0) {
            unmet_direct_efuel_demand += interval_direct_efuel_demand - app.store2.soc;
            app.store2.soc = 0;
        } else {
            app.store2.soc -= interval_direct_efuel_demand;
        }

        // Record max and min store level
        if (app.store2.soc>app.store2.max_level) {
            app.store2.max_level = app.store2.soc;
        }
        if (app.store2.soc<app.store2.min_level) {
            app.store2.min_level = app.store2.soc;
        }  

        if (peak_shaving_balance>0) {
            peak_shaving_balance = 0;
        }

        if (-peak_shaving_balance>app.max_peak_shaving_deficit) {
            app.max_peak_shaving_deficit = -peak_shaving_balance;
        }

        // Record deficit after store2 storage
        if (balance<0) {
            let deficit_after_store2 = -balance;
            deficit_after_store2_kwh += deficit_after_store2 * power_to_kwh;
        } else {
            app.balance.surplus += balance * power_to_kwh;
        }

        // Add to series
        series[0].data.push([time*1000,wind]);
        series[1].data.push([time*1000,solar+home_solar]);
        series[2].data.push([time*1000,nuclear]);
        series[3].data.push([time*1000,store2_discharge]);
        series[4].data.push([time*1000,consumption]);
        series[5].data.push([time*1000,app.store1.soc]);
        series[6].data.push([time*1000,app.store2.soc]);
        if (app.show_peak_shaving_balance) {
            series[7].data.push([time*1000,peak_shaving_balance]);
        }
        
    }
    if (app.auto_optimise) {
        if (app.store1.max_charge<app.store1.charge_max) {
            app.store1.charge_max = 1*(app.store1.max_charge).toFixed(2);
        }
        if (app.store2.max_charge<app.store2.charge_max) {
            app.store2.charge_max = 1*(app.store2.max_charge).toFixed(2);
        }
        if (app.store1.max_discharge<app.store1.discharge_max) {
            app.store1.discharge_max = 1*(app.store1.max_discharge).toFixed(2);
        }
        if (app.store2.max_discharge<app.store2.discharge_max) {
            app.store2.discharge_max = 1*(app.store2.max_discharge).toFixed(2);
        }
        // let store_diff = app.store2.max_level - app.store2.min_level;
        // app.store2.capacity = 1*(store_diff*1.1).toFixed(0);
        // app.store2.starting_soc = 1*(store_diff*0.05).toFixed(0);
    }
    
    app.store1.charge_CF = app.store1.charge_kwh / (app.store1.charge_max * 24 * 365);
    app.store2.charge_CF = app.store2.charge_kwh / (app.store2.charge_max * 24 * 365);  
    app.store1.discharge_CF = app.store1.discharge_kwh / (app.store1.discharge_max * 24 * 365);
    app.store2.discharge_CF = app.store2.discharge_kwh / (app.store2.discharge_max * 24 * 365);  
    
    app.balance.before_store1 = (consumption_kwh - deficit_before_store1_kwh) / consumption_kwh;
    app.balance.after_store1 = (consumption_kwh - deficit_after_store1_kwh) / consumption_kwh;
    app.balance.after_store2 = (consumption_kwh - deficit_after_store2_kwh) / consumption_kwh;
    app.balance.unmet = deficit_after_store2_kwh + unmet_direct_efuel_demand;

    app.generation.wind.kwh = wind_kwh;
    app.generation.solar.kwh = solar_kwh;
    app.home_solar.kwh = home_solar_kwh;
    app.nuclear.kwh = nuclear_kwh;
    app.consumption.kwh = consumption_kwh + app.consumption.efuel_demand;
    app.supply.kwh = supply_kwh;

    app.store1.cycles = 0.5*(app.store1.charge_kwh + app.store1.discharge_kwh) / app.store1.capacity;
    app.store2.cycles = 0.5*(app.store2.charge_kwh + app.store2.discharge_kwh) / app.store2.capacity;
    
    app.generation.wind.capacity_factor = app.generation.wind.kwh / (app.generation.wind.capacity * 24 * 365);
    app.generation.solar.capacity_factor = app.generation.solar.kwh / (app.generation.solar.capacity * 24 * 365);
    app.home_solar.capacity_factor = app.home_solar.kwh / (home_solar_max * 24 * 365);
    draw();
}

function draw() {
    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    var plot = $.plot($("#graph"), series, options);
}

$('#graph').bind("plotselected", function (event, ranges) {
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    draw();
});

$("#zoomout").click(function () {view.zoomout(); draw();});
$("#zoomin").click(function () {view.zoomin(); draw();});
$('#right').click(function () {view.panright(); draw();});
$('#left').click(function () {view.panleft(); draw();});
$('.time').click(function () {view.timewindow($(this).attr("time")); draw();});
