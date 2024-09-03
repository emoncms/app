<?php
    defined('EMONCMS_EXEC') or die('Restricted access');
    global $path, $session, $v;
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script> 
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path;?>Lib/misc/clipboard.js?v=<?php echo $v; ?>"></script>
<script src="<?php echo $path; ?>Lib/vue.min.js"></script>

<style>
.color-box {
  height:15px;
  width:15px;
}
textarea {
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: scroll;
}
</style>

<div id="app-block" style="display:none">
  <div class="col1">
    <div class="col1-inner">
      <div style="float:right;">
        <div class='btn-group' style="margin-top:10px;">
          <button class='btn graph-time' type='button' time='1'>D</button>
          <button class='btn graph-time' type='button' time='7'>W</button>
          <button class='btn graph-time' type='button' time='30'>M</button>
          <button class='btn graph-time' type='button' time='365'>Y</button>
          <button class='btn graph-nav' id='zoomin'>+</button>
          <button class='btn graph-nav' id='zoomout'>-</button>
          <button class='btn graph-nav' id='left'><</button>
          <button class='btn graph-nav' id='right'>></button>
        </div>   
      
        <select id="resolution" class="btn" style="width:100px; margin-top:10px; text-align:left">
          <option value="600">10 mins</option>
          <option value="900">15 mins</option>
          <option value="1800">30 mins</option>
        </select>
        <button class="btn config-open" style="margin-top:10px">
          <i class=" icon-wrench"></i>
        </button>
      </div>
      <h3>Solar PV & Battery Simulator</h3>
    </div>
  </div>

  <div id="graph" style="height:500px; width:100%;"></div>
  
  <div id="app">
    
    <div style="float:left; width:350px">
        <h4>Solar & Battery</h4>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Existing solar</span>
          <span class="add-on"><input type="checkbox" v-model="input.solar_existing" style="width:120px" /></span>
        </div><br>
        

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Solar capacity</span>
          <input type="text" v-model.number="input.solar_capacity" style="width:120px" />
        </div><br>
        
        <div class="input-prepend">
          <span class="add-on" style="width:140px">Capacity (Useable)</span>
          <input type="text" v-model.number="input.battery_capacity" style="width:120px" />
        </div><br>
        
        <div class="input-prepend">
          <span class="add-on" style="width:140px">Max charge rate</span>
          <input type="text" v-model.number="input.battery_max_charge_rate" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Max discharge rate</span>
          <input type="text" v-model.number="input.battery_max_discharge_rate" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Round trip efficiency</span>
          <input type="text" v-model.number="input.battery_round_trip_efficiency" style="width:120px" />
        </div><br>
    
    </div>
    
    <div style="float:left; width:350px">
        <h4>Off-peak charging period</h4>

        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Enable</span>
          <span class="add-on" style="width:79px">
          <input type="checkbox" v-model="input.offpeak_enable"  />
          </span>
        </div><br>

        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Winter SOC start</span>
          <input type="text" v-model.number="input.battery_offpeak_soc_start_winter" style="width:50px" />
          <span class="add-on">%</span>
        </div><br>

        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Winter SOC end</span>
          <input type="text" v-model.number="input.battery_offpeak_soc_target_winter" style="width:50px" />
          <span class="add-on">%</span>
        </div><br>
        
        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Summer SOC start</span>
          <input type="text" v-model.number="input.battery_offpeak_soc_start_summer" style="width:50px" />
          <span class="add-on">%</span>
        </div><br>

        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Summer SOC end</span>
          <input type="text" v-model.number="input.battery_offpeak_soc_target_summer" style="width:50px" />
          <span class="add-on">%</span>
        </div><br>

        <div class="input-prepend input-append">
          <span class="add-on" style="width:140px">Minimum battery SOC</span>
          <input type="text" v-model.number="input.battery_minimum_soc" style="width:50px" />
          <span class="add-on">%</span>
        </div><br>
    
    </div>
    
    <div style="float:left">
        <h4>Tariff & Costs</h4>
        
        <div class="input-prepend">
          <span class="add-on" style="width:140px">Off-peak start</span>
          <input type="text" v-model.number="input.offpeak_start" style="width:120px" />
        </div><br>
        
        <div class="input-prepend">
          <span class="add-on" style="width:140px">Off-peak end</span>
          <input type="text" v-model.number="input.offpeak_end" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Peak unit rate</span>
          <input type="text" v-model.number="input.peak_unit_rate" style="width:120px" />
        </div><br>
        
        <div class="input-prepend">
          <span class="add-on" style="width:140px">Off-peak unit rate</span>
          <input type="text" v-model.number="input.offpeak_unit_rate" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">Export unit rate</span>
          <input type="text" v-model.number="input.export_unit_rate" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">System cost (£)</span>
          <input type="text" v-model.number="input.system_cost" style="width:120px" />
        </div><br>

        <div class="input-prepend">
          <span class="add-on" style="width:140px">System lifespan (years)</span>
          <input type="text" v-model.number="input.system_lifespan" style="width:120px" />
        </div><br>
    
    </div>
    
    <div style="clear:both"></div>
    <button class="btn btn-success" id="simulate" @click="run" style="float:right">Simulate</button>
    
    <h4>Results</h4>
    <table class="table table-striped">
      <tr>
        <th>Month</th>
        <th>Use</th>
        <th>Solar</th>
        <th>Import</th>
        <th>Export</th>
        <th>Solar direct</th>
        <th>Charge</th>
        <th>Discharge</th>
        <th>Import Cost</th>
        <th>Export Value</th>
        <th>Ref Cost</th>
      </tr>
      <tr v-for="(month, index) in monthly">
        <td>{{ month.name }}</td>
        <td>{{ month.total_consumption | toFixed(0) }} kWh</td>
        <td>{{ month.total_generation | toFixed(0) }} kWh</td>
        <td>{{ month.total_import | toFixed(0) }} kWh</td>
        <td>{{ month.total_export | toFixed(0) }} kWh</td>
        <td>{{ month.total_solar_direct | toFixed(0) }} kWh</td>
        <td>{{ month.total_charge | toFixed(0) }} kWh</td>
        <td>{{ month.total_discharge | toFixed(0) }} kWh</td>
        <td>£{{ month.total_import_cost | toFixed(2) }}</td>
        <td>£{{ month.total_export_value | toFixed(2) }}</td>
        <td>£{{ month.total_reference_cost | toFixed(2) }}</td>
      </tr>
      
      <tr>
        <th>TOTAL</th>
        <th>{{ annual.total_consumption | toFixed(0) }} kWh</th>
        <th>{{ annual.total_generation | toFixed(0) }} kWh</th>
        <th>{{ annual.total_import | toFixed(0) }} kWh</th>
        <th>{{ annual.total_export | toFixed(0) }} kWh</th>
        <th>{{ annual.total_solar_direct | toFixed(0) }} kWh</th>
        <th>{{ annual.total_charge | toFixed(0) }} kWh</th>
        <th>{{ annual.total_discharge | toFixed(0) }} kWh</th>
        <th>£{{ annual.total_import_cost | toFixed(2) }}</th>
        <th>£{{ annual.total_export_value | toFixed(2) }}</th>
        <th>£{{ annual.total_reference_cost | toFixed(2) }}</th>
      </tr>
    </table>
    
    <h4>Savings and payback</h4>
    <table class="table table-striped">
      <tr><td>Annual import saving</td><td>£{{ annual.import_saving | toFixed(2) }}</td></tr>
      <tr><td>Simple payback (system cost / import saving)</td><td>{{ output.simple_payback | toFixed(1) }} years</td></tr>
      <tr><td>Annual solar & battery system cost</td><td>£{{ annual.system_cost | toFixed(2) }}</td></tr>
      <tr><td>Annual solar & battery system + import cost</td><td>£{{ annual.total_cost | toFixed(2) }}</td></tr>
      <tr><td>Annual averaged unit price</td><td>{{ annual.unit_price*100 | toFixed(2) }} p/kWh</td></tr>
    </table>
    
    
  </div>
  
</div>    

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Solar & Battery Simulator</h2>
    <div class="app-config-description">
        <div class="app-config-description-inner">
            Explore impact and savings of installing solar and battery storage
        </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>

// ----------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------
var apikey = "<?php print $apikey; ?>";
var sessionwrite = <?php echo $session['write']; ?>;
feed.apikey = apikey;
feed.public_userid = public_userid;
feed.public_username = public_username;

var interval = 1800;
$("#resolution").val(interval);

// Graph variables
var data = [];
var options = {}
// ----------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------
$("body").css('background-color','#fff');
$(window).ready(function(){

});
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"house_kwh"},
    "solar":{"type":"feed", "autoname":"solar_kwh","optional":true}, 
    "solar_capacity":{"type":"value", "name": "Solar capacity (W)", "default": 1250, "optional":true, "description":"Enter solar capacity"},
    "public_solar_feed":{"type":"value", "name": "Public solar feed id", "default": 462987, "optional":true, "description":"Hosted on emoncms.org"},
    "public_solar_capacity":{"type":"value", "name": "Public solar feed id", "default": 1250, "optional":true, "description":"Solar capacity of public dataset"},
    "public":{"type":"checkbox", "name": "Public", "default": 0, "optional":true, "description":"Make app public"}
};
config.id = <?php echo $id; ?>;
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
config.feeds = feed.list();

var input = {
    solar_existing: false,
    solar_capacity: 3000,
    
    battery_capacity: 8.5,
    battery_max_charge_rate: 3000,
    battery_max_discharge_rate: 3000,
    battery_round_trip_efficiency: 95,
    battery_offpeak_soc_target_summer: 75,
    battery_offpeak_soc_start_summer: 60,
    battery_offpeak_soc_target_winter: 100,
    battery_offpeak_soc_start_winter: 70,
    battery_minimum_soc: 2,

    offpeak_enable: 1,
    offpeak_start: 0.5,
    offpeak_end: 4.5,
    peak_unit_rate: 42.0,
    offpeak_unit_rate: 7.5,
    export_unit_rate: 5.0,
    
    system_cost: 8000,
    system_lifespan: 20
}

var monthly = []
var annual = {}
var output = {}
var cache_use = {};
var cache_solar = {};

var use_data = [];
var solar_data = [];
var charge_data = [];
var discharge_data = [];
var soc_prc_data = [];
var grid_import_data = [];

app = new Vue({
    el: '#app',
    data: {
        input: input,
        monthly: monthly,
        annual: annual,
        output: output
    },
    methods: {
        run: function() {
          show();
        }
    },
    filters: {
        toFixed: function(value,dp) {
            return value.toFixed(dp)
        }
    }
});


config.initapp = function(){init()};
config.showapp = function(){
    $(".ajax-loader").show();
    cache_use = {};
    cache_solar = {};
    
    if (config.app.solar.value!='disable' && config.app.solar.value>0) {
        input.solar_capacity = config.app.solar_capacity.value
    } else {
        input.solar_capacity = 3000;
    }
    
    show()
};
config.hideapp = function(){clear()};

// ----------------------------------------------------------------------
// APPLICATION
// ----------------------------------------------------------------------
var feeds = {};

config.init();

function init()
{

}

function process_month(d) {

   var month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    var month = {
        name: month[d.getMonth()]+" "+d.getFullYear(),
        total_consumption: 0,
        total_generation: 0,
        total_import: 0,
        total_export: 0,
        total_charge: 0,
        total_discharge: 0,
        total_solar_direct: 0,
        total_import_cost: 0,
        total_export_value: 0,
        total_reference_cost: 0,
        unit_price: 0
    }

    var max_datapoints = 8928;
    
    var this_month = d.getMonth();
    
    if (this_month>=9 || this_month<4) {
        battery_offpeak_soc_start = input.battery_offpeak_soc_start_winter
        battery_offpeak_soc_target = input.battery_offpeak_soc_target_winter
    } else {
        battery_offpeak_soc_start = input.battery_offpeak_soc_start_summer
        battery_offpeak_soc_target = input.battery_offpeak_soc_target_summer
    }
    
    start = d.getTime();
    
    d.setMonth(d.getMonth()+1);

    end = d.getTime();
    
    if (cache_use[month.name]==undefined) {
        use_data_month = feed.getdata(config.app.use.value,start,end-(interval*1000),interval,0,1,0,0);
        cache_use[month.name] = use_data_month;
    } else {
        use_data_month = cache_use[month.name];
    }
    
    if (cache_solar[month.name]==undefined) {
        if (config.app.solar.value!='disable' && config.app.solar.value>0) {
            solar_data_month = feed.getdata(config.app.solar.value,start,end-(interval*1000),interval,0,1,0,0);
        } else {
            solar_data_month = getdataremote(config.app.public_solar_feed.value,start,end-(interval*1000),interval,0,1,0,0)
        }
        cache_solar[month.name] = solar_data_month;
    } else {
        solar_data_month = cache_solar[month.name];
    }
    
    var use = 0;
    var solar = 0;
    var solar_direct = 0;

    var single_trip_efficiency = 1.0-(1.0-input.battery_round_trip_efficiency*0.01)*0.5;
    var minimum_battery_SOC = ((input.battery_minimum_soc/100)*input.battery_capacity);
    
    if (config.app.solar.value!='disable' && config.app.solar.value>0) {
        feed_solar_capacity = config.app.solar_capacity.value;
    } else {
        feed_solar_capacity = config.app.public_solar_capacity.value;
    }
    
    var charging_offpeak = false;
    var charged_during_offpeak_period = false;
    
    var date = new Date();
      
    var power_to_kwh = interval / 3600000.0;
    var convert = 3600000.0 / interval;
    
    for (var z in use_data_month) {
    
        time = use_data_month[z][0]
        date.setTime(time);
        hour = date.getHours() + (date.getMinutes()/60);
    
        // Load consumption data from user feed
        if (use_data_month[z][1]!=null) {
            use = use_data_month[z][1]*convert;
        }
        month.total_consumption += use * power_to_kwh

        // Load generation data from public feed
        if (solar_data_month[z]!=undefined && solar_data_month[z][1]!=null) {
            solar = solar_data_month[z][1] * convert * (input.solar_capacity/feed_solar_capacity);
        }
        month.total_generation += solar * power_to_kwh

        // Limits
        if (use<0) use = 0;
        if (solar<0) solar = 0;
        
        solar_direct = solar;
        if (solar_direct>use) solar_direct = use;
        
        offpeak = false;
        if (input.offpeak_start<input.offpeak_end) {
            if (hour>=input.offpeak_start && hour<input.offpeak_end) offpeak = true;
        } else if (input.offpeak_start>input.offpeak_end) {
            if (hour>=input.offpeak_start || hour<input.offpeak_end) offpeak = true;     
        }
        

        // Starts the offpeak charge session
        if (offpeak && input.offpeak_enable) {
            if (!charging_offpeak && !charged_during_offpeak_period) {
                if (soc<(battery_offpeak_soc_start*0.01*input.battery_capacity)) {
                    charging_offpeak = true;
                    charged_during_offpeak_period = true;
                }
            }
        }
        if (input.offpeak_start<input.offpeak_end) {  
            if (charged_during_offpeak_period && hour>=input.offpeak_end) {
                charged_during_offpeak_period = false;
            }
        } else if (input.offpeak_start>input.offpeak_end) {
            if (charged_during_offpeak_period && hour>=input.offpeak_end && hour<input.offpeak_start) {
                charged_during_offpeak_period = false;
            } 
        }
        
        charge = 0;
        // Charging when there is excess solar 
        if (solar>use) charge = solar-use;
        // Offpeak / night time charge
        if (charging_offpeak) charge = input.battery_max_charge_rate;
        
        if (charge>0) {
            if (charge>input.battery_max_charge_rate) charge = input.battery_max_charge_rate;
            charge_after_loss = charge * single_trip_efficiency;
            soc_inc = charge_after_loss * power_to_kwh;
            // Upper limit
            if ((soc+soc_inc)>=input.battery_capacity) {
                soc_inc = input.battery_capacity - soc;
                charge_after_loss = (soc_inc * 3600000.0) / interval;
                charge = charge_after_loss / single_trip_efficiency;
            }
                        
            soc += soc_inc;
        }
        
        // Discharge when use is more than solar
        discharge = 0;
        if (use>solar && charge==0) {
        
            if (!offpeak || (offpeak && !charged_during_offpeak_period)) {
        
                discharge = use-solar;
                if (discharge>input.battery_max_discharge_rate) discharge = input.battery_max_discharge_rate;
                discharge_before_loss = discharge / single_trip_efficiency;
                soc_dec = discharge_before_loss * power_to_kwh;
                // Lower limit
                if ((soc-soc_dec)<=minimum_battery_SOC) {
                    soc_dec = 0;
                    discharge_before_loss = (soc_dec * 3600000.0) / interval;
                    discharge = discharge_before_loss * single_trip_efficiency;
                }
                soc -= soc_dec;
            
            }
        }
        
        // Balance solar & consumption only
        // Used for savings calculation when solar has already been installed.
        balance_pre_battery = solar - use
        grid_import_pre_battery = 0;
        grid_export_pre_battery = 0;
        if (balance_pre_battery>0) {
            grid_export_pre_battery = balance_pre_battery;
        } else {
            grid_import_pre_battery = -1*balance_pre_battery;
        }
               
        // Full balance with battery
        balance = solar - use - charge + discharge;
        grid_import = 0;
        grid_export = 0;
        if (balance>0) {
            grid_export = balance;
        } else {
            grid_import = -1*balance;
        }
        
        soc_prc = 100.0*soc/input.battery_capacity;

        // turn off offpeak charge if we reach 
        if (soc_prc>=battery_offpeak_soc_target) {
            charging_offpeak = false;
        }
        
        if (offpeak) {
            month.total_import_cost += grid_import * power_to_kwh * input.offpeak_unit_rate * 0.01;
            if (!input.solar_existing) {
                month.total_reference_cost += use * power_to_kwh * input.offpeak_unit_rate * 0.01;
            } else {
                month.total_reference_cost += grid_import_pre_battery * power_to_kwh * input.offpeak_unit_rate * 0.01;
            }
        } else {
            month.total_import_cost += grid_import * power_to_kwh * input.peak_unit_rate * 0.01;
            if (!input.solar_existing) {    
                month.total_reference_cost += use * power_to_kwh * input.peak_unit_rate * 0.01;
            } else {
                month.total_reference_cost += grid_import_pre_battery * power_to_kwh * input.peak_unit_rate * 0.01;    
            }
        }
        
        month.total_export_value += grid_export * power_to_kwh * input.export_unit_rate * 0.01;

        month.total_charge += charge * power_to_kwh;
        month.total_discharge += discharge * power_to_kwh;
        month.total_import += grid_import * power_to_kwh;
        month.total_export += grid_export * power_to_kwh;
        month.total_solar_direct += solar_direct * power_to_kwh;
        
        solar_data.push([time,solar]);
        use_data.push([time,use]);
        charge_data.push([time,charge]);
        discharge_data.push([time,discharge]);
        soc_prc_data.push([time,soc_prc]);
        grid_import_data.push([time,grid_import]);
        
    }
    
    month.unit_price = month.total_import_cost / month.total_consumption;
    
    return month;
}
    
function show()
{
    $("body").css('background-color','#fff');
    
    var d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(1);
    d.setMonth(d.getMonth()-12);
    
    if (!view.start) view.start = d.getTime();
    
    use_data = [];
    solar_data = [];
    charge_data = [];
    discharge_data = [];
    soc_prc_data = [];
    grid_import_data = [];
    
    app.monthly = [];
    
    soc = input.battery_capacity*0.5;
    
    // Calculate 12 months
    for (var i=0; i<12; i++) {
        app.monthly.push(process_month(d));
    }
    
    if (!view.end) view.end = d.getTime();
    
    // Sum annual totals
    app.annual = {};    
    for (var z in app.monthly) {
        for (var k in app.monthly[z]) {
            if (app.annual[k]==undefined) app.annual[k] = 0;
            app.annual[k] += app.monthly[z][k]
        }
    }
    
    app.annual.unit_price = app.annual.total_import_cost / app.annual.total_consumption
    app.annual.import_saving = (app.annual.total_reference_cost - app.annual.total_import_cost) + app.annual.total_export_value
    app.annual.system_cost = input.system_cost / input.system_lifespan
    app.output.simple_payback = input.system_cost / app.annual.import_saving
    app.annual.total_cost = app.annual.system_cost + (app.annual.total_import_cost - app.annual.total_export_value)
    app.annual.unit_price = app.annual.total_cost / app.annual.total_consumption
    csv = "";
        
    data = [];
    data.push({label:"Consumption", data: use_data, color: "#0699fa",lines:{lineWidth:0, fill:0.8}});
    data.push({label:"Solar", data: solar_data, color: "#dccc1f", lines:{lineWidth:0, fill:0.8}});
    data.push({label:"SOC", data: soc_prc_data, yaxis:2, color: "#000", lines:{lineWidth:1, fill:0.0}});

    options = {
        canvas: true,
        lines: { fill: true },
        //bars: { show: true, align: "center", barWidth: 0.75*interval*1000, fill: false},
        xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end },
        grid: {
            show:true, 
            hoverable: true, 
            clickable: true
        },
        selection: { mode: "x" },
        touch: { pan: "x", scale: "x" }
    }
    
    // Draw graph
    $.plot($('#graph'),data, options);
    $(".ajax-loader").hide();
}
   
function updater()
{

}

function resize() 
{
    updater();
    // Resize graph
    $("#graph").width($('#app-block').width());
    $.plot($('#graph'),data, options);
}

function draw() {

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    $.plot($('#graph'),data, options);
}

function clear()
{
    clearInterval(updaterinst);
}

$(window).resize(function(){
    resize();
});

$("#resolution").change(function(){
    interval = 1*$(this).val();
    cache_solar = {};
    cache_use = {};
    show();
});

$("#zoomout").click(function () {view.zoomout(); draw();});
$("#zoomin").click(function () {view.zoomin(); draw();});
$('#right').click(function () {view.panright(); draw();});
$('#left').click(function () {view.panleft(); draw();});
$('.graph-time').click(function () {view.timewindow($(this).attr("time")); draw();});

$("#graph").bind("plotselected", function (event, ranges)
{
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    draw();
});

// ----------------------------------------------------------------------
// App log
// ----------------------------------------------------------------------
function app_log (level, message) {
    if (level=="ERROR") alert(level+": "+message);
    console.log(level+": "+message);
}

function getdataremote(id,start,end,interval,average,delta,skipmissing,limitinterval)
{   
    var data = [];
    $.ajax({                                      
        url: path+"app/dataremote",
        data: {id:id,start:start,end:end,interval:interval,average:average,delta:delta,skipmissing:skipmissing,limitinterval:limitinterval,timeformat:'notime',dp:4},
        dataType: 'json',
        async: false,                      
        success: function(result) {
            if (!result || result===null || result==="" || result.constructor!=Array) {
                console.log("ERROR","feed.getdataremote invalid response: "+result);
                result = [];
            }
            
            var intervalms = interval*1000;
            var time = Math.floor(start/intervalms)*intervalms;
            for (var z in result) {
                data.push([time,result[z]]);
                time += intervalms;
            }
        }
    });
    return data;
}
</script>
