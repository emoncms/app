<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;

load_js("Modules/feed/feed.js");
load_js("Lib/js/flot-5.1.0.mod.min.js");
load_js("Modules/app/Lib/vis.helper.js");
load_js("Modules/app/Lib/remotefeed.js");
load_js("Lib/js/vue.global.prod-3.5.22.min.js");
load_css("Modules/app/Views/css/app-kit.css");
load_css("Modules/app/apps/OpenEnergyMonitor/storagesim/storagesim.css");
?>

<div class="app-page" data-bs-theme="dark">

<section id="app-block" style="display:none">

    <div class="app-panel">
        <nav class="app-top-bar mb-0 border-0">
            <div id="tabs" class="nav nav-underline">
                <span class="nav-link active"><i class="svg-icon-box-add"></i><?php echo tr('Storage simulator') ?></span>
            </div>
            <div class="nav">
                <button class="nav-link config-open" title="<?php echo tr('Configure app') ?>"><i class="svg-icon-wrench"></i></button>
                <button class="nav-link config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button>
            </div>
        </nav>
    </div>

    <div class="app-panel">
        <div id="graph-nav" class="app-navbar">
            <div class="btn-group app-timebar">
                <button class='btn time' time='1'><?php echo tr('D') ?></button>
                <button class='btn time' time='7'><?php echo tr('W') ?></button>
                <button class='btn time' time='30'><?php echo tr('M') ?></button>
                <button class='btn time' time='365'><?php echo tr('Y') ?></button>
                <button id='zoomin' class='btn'>+</button>
                <button id='zoomout' class='btn'>-</button>
                <button id='left' class='btn'>&lt;</button>
                <button id='right' class='btn'>&gt;</button>
            </div>
        </div>
        <div id="graph"></div>
    </div>

    <div id="app" class="sim-grid">
        <div class="app-panel">
            <h5 class="sim-title">Generation</h5>
            <table class="table align-middle mb-0">
                <tr v-for="gen, index in generation">
                    <td class="col-primary">{{gen.name}}</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model="gen.capacity" @change="update"><span class="input-group-text">kW</span></div></td>
                    <td>{{ toFixed(gen.kwh, 0) }} kWh ({{ toFixed(100*gen.capacity_factor, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Nuclear / geothermal<br>(non load following)</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model="nuclear.output" @change="update"><span class="input-group-text">kW</span></div></td>
                    <td>{{ toFixed(nuclear.kwh, 0) }} kWh ({{ toFixed(100*nuclear.capacity_factor, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Home solar feed</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model="home_solar.scale" @change="update"><span class="input-group-text">%</span></div></td>
                    <td>{{ toFixed(home_solar.kwh, 0) }} kWh ({{ toFixed(100*home_solar.capacity_factor, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Total supply</td>
                    <td></td>
                    <td>{{ toFixed(supply.kwh, 0) }} kWh</td>
                </tr>
                <tr>
                    <td class="col-primary">Consumption</td>
                    <td></td>
                    <td>{{ toFixed(consumption.kwh, 0) }} kWh</td>
                </tr>
                <tr>
                    <td class="col-primary">Direct e-fuel demand (e.g industry, shipping or aviation)</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="consumption.efuel_demand" @change="update"><span class="input-group-text">kWh</span></div></td>
                    <td></td>
                </tr>
                <tr>
                    <td class="col-primary">Primary energy factor</td>
                    <td></td>
                    <td>{{ toFixed(100*supply.kwh/consumption.kwh, 0) }}%</td>
                </tr>
                <tr>
                    <td class="col-primary">Balance before battery storage</td>
                    <td></td>
                    <td>{{ toFixed(100*balance.before_store1, 0) }}%</td>
                </tr>
                <tr>
                    <td class="col-primary">Surplus</td>
                    <td></td>
                    <td>{{ toFixed(balance.surplus, 1) }} kWh</td>
                </tr>
                <tr>
                    <td class="col-primary">Unmet</td>
                    <td></td>
                    <td>{{ toFixed(balance.unmet, 1) }} kWh</td>
                </tr>
                <tr>
                    <td class="col-primary">Peak shaving storage requirement</td>
                    <td><div class="form-check small mb-0"><input id="show-peak-shaving" class="form-check-input" type="checkbox" v-model="show_peak_shaving_balance" @change="update"><label class="form-check-label" for="show-peak-shaving">Show</label></div></td>
                    <td>{{ toFixed(max_peak_shaving_deficit, 1) }} kWh</td>
                </tr>
            </table>
        </div>

        <div class="app-panel">
            <h5 class="sim-title">Store 1</h5>
            <p class="small text-body-secondary">E.g battery storage</p>
            <table class="table align-middle mb-0">
                <tr>
                    <td class="col-primary">Storage capacity</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.capacity" @change="update"><span class="input-group-text">kWh</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">SOC start</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.starting_soc" @change="update"><span class="input-group-text">kWh</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Charge efficiency</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.charge_efficiency" @change="update"><span class="input-group-text">%</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Discharge efficiency</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.discharge_efficiency" @change="update"><span class="input-group-text">%</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Max charge rate</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.charge_max" @change="update"><span class="input-group-text">kW</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Max discharge rate</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store1.discharge_max" @change="update"><span class="input-group-text">kW</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Total charge</td>
                    <td>{{ toFixed(store1.charge_kwh, 1) }} kWh ({{ toFixed(100*store1.charge_CF, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Total discharge</td>
                    <td>{{ toFixed(store1.discharge_kwh, 1) }} kWh ({{ toFixed(100*store1.discharge_CF, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Cycles</td>
                    <td>{{ toFixed(store1.cycles, 1) }} cycles</td>
                </tr>
                <tr>
                    <td class="col-primary">Balance after store 1</td>
                    <td>{{ toFixed(100*balance.after_store1, 0) }}%</td>
                </tr>
            </table>
        </div>

        <div class="app-panel">
            <h5 class="sim-title">Store 2</h5>
            <p class="small text-body-secondary">E.g H2, e-Methane, e-Methanol</p>
            <table class="table align-middle mb-0">
                <tr>
                    <td class="col-primary">Storage capacity</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.capacity" @change="update"><span class="input-group-text">kWh</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">SOC start</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.starting_soc" @change="update"><span class="input-group-text">kWh</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Charge efficiency</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.charge_efficiency" @change="update"><span class="input-group-text">%</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Discharge efficiency</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.discharge_efficiency" @change="update"><span class="input-group-text">%</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Max charge rate</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.charge_max" @change="update"><span class="input-group-text">kW</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Max discharge rate</td>
                    <td><div class="input-group"><input type="text" class="form-control input-75" v-model.number="store2.discharge_max" @change="update"><span class="input-group-text">kW</span></div></td>
                </tr>
                <tr>
                    <td class="col-primary">Total charge</td>
                    <td>{{ toFixed(store2.charge_kwh, 1) }} kWh ({{ toFixed(100*store2.charge_CF, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Total discharge</td>
                    <td>{{ toFixed(store2.discharge_kwh, 1) }} kWh ({{ toFixed(100*store2.discharge_CF, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Cycles</td>
                    <td>{{ toFixed(store2.cycles, 1) }} cycles</td>
                </tr>
                <tr>
                    <td class="col-primary">Balance after store 2</td>
                    <td>{{ toFixed(100*balance.after_store2, 0) }}%</td>
                </tr>
            </table>
            <button class="btn btn-outline-primary mt-2" @click="auto">Auto</button>
        </div>
    </div>

</section>

<div id="appconf-description" style="display:none">
    <p class="lead">Explore adding energy storage to increase supply and demand matching.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

</div>

<script>
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.app_name = "Storage Simulator";
    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
</script>

<?php load_js("Modules/app/apps/OpenEnergyMonitor/storagesim/storagesim.js"); ?>
