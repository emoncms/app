<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Lib/js/clipboard.js");
load_js("Lib/js/vue.global.prod-3.5.22.min.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/solarbatterysim/solarbatterysim.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

  <div class="app-panel">
    <nav class="app-top-bar align-items-center mb-0 border-0">
      <ul class="btn-list app-tabs">
        <li><h1 class="app-btn active m-0"><i class="svg-icon-sun"></i><span>Solar &amp; Battery Simulator</span></h1></li>
      </ul>
      <ul class="btn-list gap-2">
        <li>
          <span class="ctrl-group">
            <span class="ctrl-label">Interval</span>
            <select id="resolution">
              <option value="600">10 mins</option>
              <option value="900">15 mins</option>
              <option value="1800">30 mins</option>
            </select>
          </span>
        </li>
        <li><button class="app-btn config-open" title="Configure app"><i class="svg-icon-wrench"></i></button></li>
      </ul>
    </nav>
  </div>

  <div class="app-panel">
    <div class="visnavblock mb-2 d-flex justify-content-start">
      <button class="visnav app-btn graph-time" time="1">D</button>
      <button class="visnav app-btn graph-time" time="7">W</button>
      <button class="visnav app-btn graph-time" time="30">M</button>
      <button class="visnav app-btn graph-time" time="365">Y</button>
      <button id="zoomin" class="visnav app-btn">+</button>
      <button id="zoomout" class="visnav app-btn">-</button>
      <button id="left" class="visnav app-btn">&lt;</button>
      <button id="right" class="visnav app-btn">&gt;</button>
    </div>
    <div id="graph"></div>
  </div>

  <div id="app">

    <div class="app-panel">
      <div class="stats-grid">
        <div>
          <h5 class="power-title">IMPORT SAVING</h5>
          <h2 class="power-value text-success">£{{ toFixed(annual.import_saving, 0) }}<span class="power-unit fs-5"> /yr</span></h2>
        </div>
        <div>
          <h5 class="power-title">SIMPLE PAYBACK</h5>
          <h2 class="power-value text-use">{{ toFixed(output.simple_payback, 1) }}<span class="power-unit fs-5"> years</span></h2>
        </div>
        <div>
          <h5 class="power-title">UNIT PRICE</h5>
          <h2 class="power-value text-use">{{ toFixed(annual.unit_price*100, 1) }}<span class="power-unit fs-5"> p/kWh</span></h2>
        </div>
        <div>
          <h5 class="power-title">SYSTEM COST</h5>
          <h2 class="power-value text-battery">£{{ toFixed(annual.system_cost, 0) }}<span class="power-unit fs-5"> /yr</span></h2>
        </div>
        <div>
          <h5 class="power-title">SYSTEM + IMPORT</h5>
          <h2 class="power-value text-battery">£{{ toFixed(annual.total_cost, 0) }}<span class="power-unit fs-5"> /yr</span></h2>
        </div>
        <div>
          <h5 class="power-title">GRID IMPORT</h5>
          <h2 class="power-value text-import">{{ toFixed(annual.total_import, 0) }}<span class="power-unit fs-5"> kWh</span></h2>
        </div>
      </div>
    </div>

    <div class="app-panel sim-inputs">
      <div class="row g-4">
        <div class="col-lg-4">
          <h4>Solar &amp; battery</h4>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Existing solar</span>
            <span class="input-group-text"><input type="checkbox" class="form-check-input mt-0" v-model="input.solar_existing" /></span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Solar capacity</span>
            <input type="text" class="form-control" v-model.number="input.solar_capacity" />
            <span class="input-group-text">W</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Capacity (useable)</span>
            <input type="text" class="form-control" v-model.number="input.battery_capacity" />
            <span class="input-group-text">kWh</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Max charge rate</span>
            <input type="text" class="form-control" v-model.number="input.battery_max_charge_rate" />
            <span class="input-group-text">W</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Max discharge rate</span>
            <input type="text" class="form-control" v-model.number="input.battery_max_discharge_rate" />
            <span class="input-group-text">W</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Round trip efficiency</span>
            <input type="text" class="form-control" v-model.number="input.battery_round_trip_efficiency" />
            <span class="input-group-text">%</span>
          </div>
        </div>

        <div class="col-lg-4">
          <h4>Off-peak charging</h4>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Enable</span>
            <span class="input-group-text"><input type="checkbox" class="form-check-input mt-0" v-model="input.offpeak_enable" /></span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Winter SOC start</span>
            <input type="text" class="form-control" v-model.number="input.battery_offpeak_soc_start_winter" />
            <span class="input-group-text">%</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Winter SOC end</span>
            <input type="text" class="form-control" v-model.number="input.battery_offpeak_soc_target_winter" />
            <span class="input-group-text">%</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Summer SOC start</span>
            <input type="text" class="form-control" v-model.number="input.battery_offpeak_soc_start_summer" />
            <span class="input-group-text">%</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Summer SOC end</span>
            <input type="text" class="form-control" v-model.number="input.battery_offpeak_soc_target_summer" />
            <span class="input-group-text">%</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Minimum battery SOC</span>
            <input type="text" class="form-control" v-model.number="input.battery_minimum_soc" />
            <span class="input-group-text">%</span>
          </div>
        </div>

        <div class="col-lg-4">
          <h4>Tariff &amp; costs</h4>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Off-peak start</span>
            <input type="text" class="form-control" v-model.number="input.offpeak_start" />
            <span class="input-group-text">h</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Off-peak end</span>
            <input type="text" class="form-control" v-model.number="input.offpeak_end" />
            <span class="input-group-text">h</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Peak unit rate</span>
            <input type="text" class="form-control" v-model.number="input.peak_unit_rate" />
            <span class="input-group-text">p/kWh</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Off-peak unit rate</span>
            <input type="text" class="form-control" v-model.number="input.offpeak_unit_rate" />
            <span class="input-group-text">p/kWh</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">Export unit rate</span>
            <input type="text" class="form-control" v-model.number="input.export_unit_rate" />
            <span class="input-group-text">p/kWh</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">System cost</span>
            <input type="text" class="form-control" v-model.number="input.system_cost" />
            <span class="input-group-text">£</span>
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">System lifespan</span>
            <input type="text" class="form-control" v-model.number="input.system_lifespan" />
            <span class="input-group-text">years</span>
          </div>
        </div>
      </div>
      <div class="text-end">
        <button class="cost-btn" id="simulate" @click="run">Simulate</button>
      </div>
    </div>

    <div class="app-panel">
      <div class="table-responsive">
        <table class="app-table text-nowrap">
          <tr>
            <th>Month</th>
            <th>Use</th>
            <th>Solar</th>
            <th>Import</th>
            <th>Export</th>
            <th>Solar direct</th>
            <th>Charge</th>
            <th>Discharge</th>
            <th>Import cost</th>
            <th>Export value</th>
            <th>Ref cost</th>
          </tr>
          <tr v-for="(month, index) in monthly">
            <td class="col-primary">{{ month.name }}</td>
            <td>{{ toFixed(month.total_consumption, 0) }} kWh</td>
            <td>{{ toFixed(month.total_generation, 0) }} kWh</td>
            <td>{{ toFixed(month.total_import, 0) }} kWh</td>
            <td>{{ toFixed(month.total_export, 0) }} kWh</td>
            <td>{{ toFixed(month.total_solar_direct, 0) }} kWh</td>
            <td>{{ toFixed(month.total_charge, 0) }} kWh</td>
            <td>{{ toFixed(month.total_discharge, 0) }} kWh</td>
            <td>£{{ toFixed(month.total_import_cost, 2) }}</td>
            <td>£{{ toFixed(month.total_export_value, 2) }}</td>
            <td>£{{ toFixed(month.total_reference_cost, 2) }}</td>
          </tr>
          <tr class="col-primary">
            <th>TOTAL</th>
            <th>{{ toFixed(annual.total_consumption, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_generation, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_import, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_export, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_solar_direct, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_charge, 0) }} kWh</th>
            <th>{{ toFixed(annual.total_discharge, 0) }} kWh</th>
            <th>£{{ toFixed(annual.total_import_cost, 2) }}</th>
            <th>£{{ toFixed(annual.total_export_value, 2) }}</th>
            <th>£{{ toFixed(annual.total_reference_cost, 2) }}</th>
          </tr>
        </table>
      </div>
    </div>

  </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore impact and savings of installing solar and battery storage.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>


</div>
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
if (!sessionwrite) $(".config-open").hide();

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------
config.app = {
    "use":{"type":"feed", "autoname":"house_kwh"},
    "solar":{"type":"feed", "autoname":"solar_kwh","optional":true}, 
    "solar_capacity":{"type":"value", "name": "Solar capacity (W)", "default": 1250, "optional":true, "description":"Enter solar capacity"},
    "public_solar_feed":{"type":"value", "name": "Public solar feed id", "default": 462987, "optional":true, "description":"Hosted on emoncms.org"},
    "public_solar_capacity":{"type":"value", "name": "Public solar feed id", "default": 1250, "optional":true, "description":"Solar capacity of public dataset"}
};
config.app_name = "Solar & Battery Simulator";
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

app = Vue.createApp({
    data() { return {
        input: input,
        monthly: monthly,
        annual: annual,
        output: output
    }; },
    methods: {
        run: function() {
          show();
        },
        toFixed: function(value, dp) {
            return isFinite(value) ? value.toFixed(dp) : "--";
        }
    }
}).mount('#app');


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
        if (charging_offpeak && offpeak) charge = input.battery_max_charge_rate;
        
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
    data.push({label:"SOC", data: soc_prc_data, yaxis:2, color: "#fb7b50", lines:{lineWidth:1, fill:0.0}});

    options = {
        series: { lines: { fill: true, lineWidth: 2 } },
        legend: { show: true },
        //bars: { show: true, align: "center", barWidth: 0.75*interval*1000, fill: false},
        xaxis: { mode: "time", timezone: "browser", timeBase: "milliseconds", autoScale: "none", min: view.start, max: view.end, axisPan: true, plotPan: true, axisZoom: true, plotZoom: true },
        yaxis: { axisPan: false, plotPan: false, axisZoom: false, plotZoom: false },
        // Flot 5 needs the second axis declared for the SOC series
        yaxes: [{}, { position: "right", min: 0, max: 100 }],
        grid: {
            show:true, 
            hoverable: true, 
            clickable: true,
            borderWidth: 0
        },
        selection: { mode: is_touch_primary() ? null : "x", color: "#e8cfac", visualization: "fill" },
        zoom: { interactive: is_touch_primary(), enableTouch: true, amount: 1.5 },
        pan: { interactive: is_touch_primary(), enableTouch: true, touchMode: "smartLock", frameRate: 60 },
        recenter: { interactive: is_touch_primary(), enableTouch: true }
    }
    
    // Draw graph
    Flot.plot(document.getElementById('graph'),data, options);
    $(".ajax-loader").hide();
}
   
function updater()
{

}

function resize() 
{
    updater();
    Flot.plot(document.getElementById('graph'),data, options);
}

function draw() {

    options.xaxis.min = view.start;
    options.xaxis.max = view.end;
    Flot.plot(document.getElementById('graph'),data, options);
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

document.getElementById("graph").addEventListener("plotselected", function (event)
{
    var ranges = event.detail[0];
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
