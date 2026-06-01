<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v;
?>

<link href="<?php echo $path; ?>Modules/app/Views/css/config.css?v=1" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/Views/css/dark.css?v=<?php echo $v; ?>" rel="stylesheet">

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/appconf.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/Lib/remotefeed.js?v=5"></script>

<?php load_js("Lib/js/vue.global.prod-3.5.22.min.js"); ?>

<div id="app-block" style="display:none">
    <div class="col1">
        <div class="col1-inner">
            <div style="float:right;">
                <div class='btn-group' style="margin-top:10px;">
                    <button class='btn time' type='button' time='1'>D</button>
                    <button class='btn time' type='button' time='7'>W</button>
                    <button class='btn time' type='button' time='30'>M</button>
                    <button class='btn time' type='button' time='365'>Y</button>
                    <button class='btn' id='zoomin'>+</button>
                    <button class='btn' id='zoomout'>-</button>
                    <button class='btn' id='left'><</button>
                    <button class='btn' id='right'>></button>
                </div>

                <button class="btn config-open" style="margin-top:10px">
                    <i class=" icon-wrench"></i>
                </button>
            </div>
            <h3>Storage Simulator</h3>
        </div>
    </div>

    <div id="graph" style="height:500px; width:100%;"></div>
    <br>
    <div id="app">
        <div class="row">
            <div class="span5" style="background-color:aquamarine">
                <h4>Generation</h4>
                <table class="table">
                    <tr v-for="gen, index in generation">
                        <td>{{gen.name}}</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model="gen.capacity" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </div>
                        </td>
                        <td>{{ toFixed(gen.kwh, 0) }} kWh ({{ toFixed(100*gen.capacity_factor, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Nuclear / geothermal<br>(non load following)</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model="nuclear.output" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </td>
                        <td>{{ toFixed(nuclear.kwh, 0) }} kWh ({{ toFixed(100*nuclear.capacity_factor, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Home solar feed</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model="home_solar.scale" style="width:50px" @change="update">
                                <span class="add-on">%</span>
                            </td>
                        <td>{{ toFixed(home_solar.kwh, 0) }} kWh ({{ toFixed(100*home_solar.capacity_factor, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Total supply</td>
                        <td></td>
                        <td>{{ toFixed(supply.kwh, 0) }} kWh</td>
                    </tr>
                    <tr>
                        <td>Consumption</td>
                        <td></td>
                        <td>{{ toFixed(consumption.kwh, 0) }} kWh</td>
                    </tr>
                    <tr>
                        <td>Direct e-fuel demand (e.g industry, shipping or aviation)</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="consumption.efuel_demand" style="width:50px" @change="update">
                                <span class="add-on">kWh</span>
                            </div>
                        </td>
                        <td></td>
                    </tr>                    
                    <tr>
                        <td>Primary energy factor</td>
                        <td></td>
                        <td>{{ toFixed(100*supply.kwh/consumption.kwh, 0) }}%</td>
                    </tr>
                    <tr>
                        <td>Balance before battery storage</td>
                        <td></td>
                        <td>{{ toFixed(100*balance.before_store1, 0) }}%</td>
                    </tr>

                    <tr>
                        <td>Surplus</td>
                        <td></td>
                        <td>{{ toFixed(balance.surplus, 1) }} kWh</td>
                    </tr>
                    <tr>
                        <td>Unmet</td>
                        <td></td>
                        <td>{{ toFixed(balance.unmet, 1) }} kWh</td>
                    </tr>
                    <tr>
                        <td>Peak shaving storage requirement</td>
                        <td>
                            <div class="input-append">
                                <span class="add-on">Show</span>
                                <span class="add-on">
                                <input type="checkbox" v-model="show_peak_shaving_balance" @change="update"/>
                                </span>
                            </div>
                        </td>
                        <td>{{ toFixed(max_peak_shaving_deficit, 1) }} kWh</td>
                    </tr>                  
                </table>
            </div>
            <div class="span3" style="background-color:darkseagreen">
                <h4>Store 1</h4>
                <p>E.g battery storage</p>
                <table class="table">
                    <tr>
                        <td>Storage capacity</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.capacity" style="width:50px" @change="update">
                                <span class="add-on">kWh</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>SOC start</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.starting_soc" style="width:50px" @change="update">
                                <span class="add-on">kWh</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Charge efficiency</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.charge_efficiency" style="width:50px" @change="update">
                                <span class="add-on">%</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Discharge efficiency</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.discharge_efficiency" style="width:50px" @change="update">
                                <span class="add-on">%</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Max charge rate</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.charge_max" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Max discharge rate</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store1.discharge_max" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Total charge</td>
                        <td>{{ toFixed(store1.charge_kwh, 1) }} kWh ({{ toFixed(100*store1.charge_CF, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Total discharge</td>
                        <td>{{ toFixed(store1.discharge_kwh, 1) }} kWh ({{ toFixed(100*store1.discharge_CF, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Cycles</td>
                        <td>{{ toFixed(store1.cycles, 1) }} cycles</td>
                    </tr>
                    <tr>
                        <td>Balance after store 1</td>
                        <td>{{ toFixed(100*balance.after_store1, 0) }}%</td>
                    </tr>
                </table>

            </div>

            <div class="span3" style="background-color:deepskyblue">
                <h4>Store 2</h4>
                <p>E.g H2, e-Methane, e-Methanol</p>
                <table class="table">
                    <tr>
                        <td>Storage capacity</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.capacity" style="width:50px" @change="update">
                                <span class="add-on">kWh</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>SOC start</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.starting_soc" style="width:50px" @change="update">
                                <span class="add-on">kWh</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Charge efficiency</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.charge_efficiency" style="width:50px" @change="update">
                                <span class="add-on">%</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Discharge efficiency</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.discharge_efficiency" style="width:50px" @change="update">
                                <span class="add-on">%</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Max charge rate</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.charge_max" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Max discharge rate</td>
                        <td>
                            <div class="input-append">
                                <input type="text" v-model.number="store2.discharge_max" style="width:50px" @change="update">
                                <span class="add-on">kW</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Total charge</td>
                        <td>{{ toFixed(store2.charge_kwh, 1) }} kWh ({{ toFixed(100*store2.charge_CF, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Total discharge</td>
                        <td>{{ toFixed(store2.discharge_kwh, 1) }} kWh ({{ toFixed(100*store2.discharge_CF, 1) }}%)</td>
                    </tr>
                    <tr>
                        <td>Cycles</td>
                        <td>{{ toFixed(store2.cycles, 1) }} cycles</td>
                    </tr>
                    <tr>
                        <td>Balance after store 2</td>
                        <td>{{ toFixed(100*balance.after_store2, 0) }}%</td>
                    </tr>
                </table>

                <button class="btn" @click="auto">Auto</button>

            </div>
        </div>
    </div>
</div>

<div id="app-setup" style="display:none; padding-top:50px" class="block">
    <h2 class="app-config-title">Storage Simulator</h2>
    <div class="app-config-description">
        <div class="app-config-description-inner">
            Explore adding energy storage to increase supply and demand matching.
        </div>
    </div>
    <div class="app-config"></div>
</div>

<div class="ajax-loader"></div>

<script>
    var apikey = "<?php print $apikey; ?>";
    var sessionwrite = <?php echo $session['write']; ?>;

    config.id = <?php echo $id; ?>;
    config.name = "<?php echo $name; ?>";
    config.public = <?php echo $public; ?>;
    config.db = <?php echo json_encode($config); ?>;
</script>

<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/storagesim/storagesim.js?v=31"></script>
