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
            <ul id="tabs" class="btn-list app-tabs">
                <li><button class="app-btn active"><i class="svg-icon-box-add"></i><span><?php echo tr('Storage simulator') ?></span></button></li>
            </ul>
            <ul class="btn-list">
                <li><button class="app-btn config-open" title="<?php echo tr('Edit') ?>"><i class="svg-icon-wrench"></i></button></li>
                <li><button class="app-btn config-close d-none" title="<?php echo tr('Close') ?>"><i class="svg-icon-close"></i></button></li>
            </ul>
        </nav>
    </div>

    <div class="app-panel">
        <div id="graph-nav" class="visnavblock mb-2 d-flex justify-content-start">
            <button class='visnav time app-btn' time='1'><?php echo tr('D') ?></button>
            <button class='visnav time app-btn' time='7'><?php echo tr('W') ?></button>
            <button class='visnav time app-btn' time='30'><?php echo tr('M') ?></button>
            <button class='visnav time app-btn' time='365'><?php echo tr('Y') ?></button>
            <button id='zoomin' class='visnav app-btn'>+</button>
            <button id='zoomout' class='visnav app-btn'>-</button>
            <button id='left' class='visnav app-btn'>&lt;</button>
            <button id='right' class='visnav app-btn'>&gt;</button>
        </div>
        <div id="graph"></div>
    </div>

    <div id="app" class="sim-grid">
        <div class="app-panel">
            <h5 class="sim-title">Generation</h5>
            <table class="app-table">
                <tr v-for="gen, index in generation">
                    <td class="col-primary">{{gen.name}}</td>
                    <td><span class="ctrl-group"><input type="text" v-model="gen.capacity" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
                    <td>{{ toFixed(gen.kwh, 0) }} kWh ({{ toFixed(100*gen.capacity_factor, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Nuclear / geothermal<br>(non load following)</td>
                    <td><span class="ctrl-group"><input type="text" v-model="nuclear.output" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
                    <td>{{ toFixed(nuclear.kwh, 0) }} kWh ({{ toFixed(100*nuclear.capacity_factor, 1) }}%)</td>
                </tr>
                <tr>
                    <td class="col-primary">Home solar feed</td>
                    <td><span class="ctrl-group"><input type="text" v-model="home_solar.scale" @change="update"><span class="ctrl-label ctrl-unit">%</span></span></td>
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
                    <td><span class="ctrl-group"><input type="text" v-model.number="consumption.efuel_demand" @change="update"><span class="ctrl-label ctrl-unit">kWh</span></span></td>
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
                    <td><label class="ctrl-checkbox"><input type="checkbox" v-model="show_peak_shaving_balance" @change="update"> Show</label></td>
                    <td>{{ toFixed(max_peak_shaving_deficit, 1) }} kWh</td>
                </tr>
            </table>
        </div>

        <div class="app-panel">
            <h5 class="sim-title">Store 1</h5>
            <p class="ctrl-note">E.g battery storage</p>
            <table class="app-table">
                <tr>
                    <td class="col-primary">Storage capacity</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.capacity" @change="update"><span class="ctrl-label ctrl-unit">kWh</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">SOC start</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.starting_soc" @change="update"><span class="ctrl-label ctrl-unit">kWh</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Charge efficiency</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.charge_efficiency" @change="update"><span class="ctrl-label ctrl-unit">%</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Discharge efficiency</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.discharge_efficiency" @change="update"><span class="ctrl-label ctrl-unit">%</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Max charge rate</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.charge_max" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Max discharge rate</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store1.discharge_max" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
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
            <p class="ctrl-note">E.g H2, e-Methane, e-Methanol</p>
            <table class="app-table">
                <tr>
                    <td class="col-primary">Storage capacity</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.capacity" @change="update"><span class="ctrl-label ctrl-unit">kWh</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">SOC start</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.starting_soc" @change="update"><span class="ctrl-label ctrl-unit">kWh</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Charge efficiency</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.charge_efficiency" @change="update"><span class="ctrl-label ctrl-unit">%</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Discharge efficiency</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.discharge_efficiency" @change="update"><span class="ctrl-label ctrl-unit">%</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Max charge rate</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.charge_max" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
                </tr>
                <tr>
                    <td class="col-primary">Max discharge rate</td>
                    <td><span class="ctrl-group"><input type="text" v-model.number="store2.discharge_max" @change="update"><span class="ctrl-label ctrl-unit">kW</span></span></td>
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
            <button class="cost-btn mt-2" @click="auto">Auto</button>
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
