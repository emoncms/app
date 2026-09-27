<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v, $user;
// The user's configured timezone (e.g. "Europe/London") is used to allocate
// energy to days and tiers, so the split is correct regardless of the browser.
$timezone = $user->get_timezone($session['userid']);
if (!$timezone || is_numeric($timezone)) $timezone = 'UTC';
?>
<?php load_css("Modules/app/Views/css/app-kit.css"); ?>
<?php load_css("Modules/app/apps/OpenEnergyMonitor/timeofuse2/timeofuse2.css"); ?>
<?php load_js("Modules/feed/feed.js"); ?>

<?php load_js("Lib/js/flot-5.1.0.mod.min.js"); ?>
<?php load_js("Modules/app/Lib/vis.helper.js"); ?>

<div class="app-page" data-bs-theme="dark">
  <section id="app-block" style="display:none">

    <div class="app-panel">
      <nav class="app-top-bar">
        <ul class="btn-list app-tabs">
          <li><button class="app-btn active"><i class="svg-icon-schedule"></i><span>TIME OF USE</span></button></li>
        </ul>
        <ul class="btn-list">
          <li><button class="app-btn viewcostenergy">ENERGY MODE</button></li>
          <li><button class="app-btn config-open" title="Configure app"><i class="svg-icon-wrench"></i></button></li>
        </ul>
      </nav>

      <div class="stats-grid stats-grid-2">
        <div>
          <h5 class="power-title">POWER NOW</h5>
          <h2 class="power-value text-use" id="power_now">---</h2>
        </div>
        <div>
          <h5 class="power-title">USE TODAY</h5>
          <h2 class="power-value text-use" id="kwh_today">---</h2>
        </div>
      </div>
    </div>

    <div class="app-panel">
      <div class="visnavblock bargraph-navigation mb-2">
        <button class="visnav app-btn bargraph-week" days="7">WEEK</button>
        <button class="visnav app-btn bargraph-month" days="30">MONTH</button>
        <button class="visnav app-btn bargraph-year" days="365">YEAR</button>
      </div>

      <div class="visnavblock powergraph-navigation mb-2" style="display:none">
        <button class="visnav app-btn time" time='24' title="Day">D</button>
        <button class="visnav app-btn time" time='168' title="Week">W</button>
        <button class="visnav app-btn time" time='720' title="Month">M</button>
        <button class="visnav app-btn" id="zoomin" title="Zoom in">+</button>
        <button class="visnav app-btn" id="zoomout" title="Zoom out">-</button>
        <button class="visnav app-btn" id="left" title="Scroll left">&lt;</button>
        <button class="visnav app-btn" id="right" title="Scroll right">&gt;</button>
        <button class="app-btn viewhistory ms-auto" title="Back to daily summary">Daily</button>
      </div>

      <div id="placeholder_bound" style="width:100%; height:500px">
        <div id="placeholder" style="height:500px"></div>
      </div>

      <div id="power-graph-footer" style="display:none">
        <div class="d-flex flex-wrap align-items-center gap-3 px-2">
          <div class="me-auto text-body-secondary">kWh in window: <b class="text-body"><span id="window-kwh"></span> kWh</b></div>
          <button id="advanced-toggle" class="app-btn">SHOW DETAIL</button>
        </div>
      </div>

      <div id="advanced-block" style="display:none">
        <table class="app-table">
          <tr>
            <th></th>
            <th class="text-center">Min</th>
            <th class="text-center">Max</th>
            <th class="text-center">Diff</th>
            <th class="text-center">Mean</th>
            <th class="text-center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
      </div>
    </div>

    <!-- Tariffs and schedule builder, a Vue app mounted on #schedule-builder-app.
         Directives must sit on a child of the mount root, so #schedule-builder carries v-show. -->
    <div id="schedule-builder-app">
      <div id="schedule-builder" class="app-panel" v-show="visible">
        <nav class="app-top-bar">
          <ul class="btn-list app-tabs">
            <li><button class="app-btn active"><i class="svg-icon-calendar"></i><span>Tariffs &amp; schedule</span></button></li>
          </ul>
          <ul class="btn-list">
            <li><button class="app-btn sched-configure" :class="{active: editing}" v-show="sessionwrite" title="Configure tariffs &amp; schedule" @click="toggleConfigure"><i class="svg-icon-wrench"></i></button></li>
          </ul>
        </nav>

        <div class="p-2">
          <div class="row g-3">

            <!-- Tariff names and prices, with totals -->
            <div class="col-md-8">
              <div class="border rounded p-3 h-100">
                <div class="sched-subhead">Tariffs</div>
                <table class="table table-sm align-middle sched-table">
                  <thead>
                    <tr>
                      <th>Tariff</th>
                      <th>Price (<span class="sched-cur">{{ currency }}</span>/kWh)</th>
                      <th class="text-end">Total</th>
                      <th class="text-end">Average</th>
                      <th class="text-end" v-show="editing"><button type="button" class="btn btn-link p-0 tariff-add" title="Add a tariff" @click="addTariff"><span class="svg-icon-plus"></span></button></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(t, i) in tariffs" :key="i">
                      <template v-if="editing">
                        <td>
                          <div class="d-flex align-items-center">
                            <span class="app-swatch" :style="{background: tariffColour(i)}"></span>
                            <input type="text" class="form-control form-control-sm sched-name" :value="t.name" @change="renameTariff(i, $event.target.value)" placeholder="Tariff name">
                          </div>
                        </td>
                        <td><input type="number" step="0.001" min="0" class="form-control form-control-sm text-end sched-num" v-model.number="t.price"></td>
                      </template>
                      <template v-else>
                        <td><span class="app-swatch" :style="{background: tariffColour(i)}"></span>{{ t.name }}</td>
                        <td class="text-body-secondary">{{ t.price }}</td>
                      </template>
                      <td class="text-end text-nowrap text-body-secondary">{{ tierTotal(t.name) }}</td>
                      <td class="text-end text-nowrap text-body-secondary">{{ tierAverage(t.name) }}</td>
                      <td class="text-end" v-show="editing"><button type="button" class="btn btn-link p-0 sched-del" title="Remove tariff" @click="delTariff(i)"><span class="svg-icon-close"></span></button></td>
                    </tr>
                  </tbody>
                  <tfoot id="tariff-foot" class="table-group-divider fw-bold" v-if="totals">
                    <tr>
                      <td class="text-end text-body-secondary" colspan="2">Combined</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.combined.total, false) }}</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.combined.average, true) }}</td>
                      <td v-show="editing"></td>
                    </tr>
                    <tr v-if="totals.cl">
                      <td class="text-end text-body-secondary" colspan="2">Controlled load</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.cl.total, false) }}</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.cl.average, true) }}</td>
                      <td v-show="editing"></td>
                    </tr>
                    <tr v-if="totals.supply">
                      <td class="text-end text-body-secondary" colspan="2">Supply</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.supply.total, false) }}</td>
                      <td class="text-end text-nowrap">{{ fmt(totals.supply.average, true) }}</td>
                      <td v-show="editing"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- When each tariff applies -->
            <div class="col-md-4">
              <div class="border rounded p-3 h-100">
                <div class="sched-subhead">Schedule</div>
                <nav class="nav nav-underline mb-2">
                  <a class="nav-link" href="#" :class="{active: tab=='weekday'}" @click.prevent="setTab('weekday')">Weekday</a>
                  <a class="nav-link" href="#" :class="{active: tab=='weekend'}" @click.prevent="setTab('weekend')">Weekend</a>
                </nav>
                <table class="table table-sm align-middle sched-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Tariff</th>
                      <th class="text-end" v-show="editing"><button type="button" class="btn btn-link p-0 block-add" title="Add a time block" @click="addBlock"><span class="svg-icon-plus"></span></button></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, i) in schedule[tab]" :key="i">
                      <template v-if="editing">
                        <td>
                          <select class="form-select form-select-sm sched-num" v-model="b.start" @change="onBlockTimeChange">
                            <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                          </select>
                        </td>
                        <td>
                          <div class="d-flex align-items-center">
                            <span class="app-swatch" :style="{background: tariffColourByName(b.name)}"></span>
                            <select class="form-select form-select-sm sched-name" v-model="b.name">
                              <option v-for="n in tariffOptions(b.name)" :key="n" :value="n">{{ n }}</option>
                            </select>
                          </div>
                        </td>
                      </template>
                      <template v-else>
                        <td>{{ b.start }}</td>
                        <td><span class="app-swatch" :style="{background: tariffColourByName(b.name)}"></span>{{ b.name }}</td>
                      </template>
                      <td class="text-end" v-show="editing"><button type="button" class="btn btn-link p-0 sched-del" title="Remove this block" @click="delBlock(i)"><span class="svg-icon-close"></span></button></td>
                    </tr>
                  </tbody>
                </table>

                <div class="mt-3" v-show="editing">
                  <label class="form-label fw-bold mb-1" for="sched-ph">Public holidays <span class="fw-normal text-body-secondary">(treated as a weekend day)</span></label>
                  <textarea id="sched-ph" class="form-control font-monospace" rows="2" v-model="phDays" placeholder="2026:1,104,359;2027:1"></textarea>
                  <div class="form-text">Format: <code>year:day-of-year,day-of-year;year:...</code>, e.g. <code>2026:1,104,359,360</code>. <a href="https://www.epochconverter.com/days" target="_blank" rel="noopener">day-of-year reference</a></div>
                </div>
              </div>
            </div>

          </div>

          <div class="mt-3" v-show="editing || status.text">
            <button type="button" id="sched-save" class="btn btn-primary me-2" v-show="editing" :disabled="saving" @click="save">Save</button>
            <span id="sched-status" :class="{'text-success': status.cls=='ok', 'text-danger': status.cls=='err'}">{{ status.text }}</span>
          </div>
        </div>
      </div>
    </div>

  </section>

<div id="appconf-description" style="display:none">
<p class="lead">The "Time of Use - flexible" app is a simple home energy monitoring app for exploring home or building electricity consumption and cost over time. It allows you to track multiple electricity tariffs as used in Australia, an optional daily supply charge, and an optional separately-monitored controlled load.</p>
<h3 class="text-white">Cumulative kWh</h3>
<p> feeds can be generated from power feeds with the power_to_kwh input processor.</p>
<p><img src="<?php echo $path; ?>Modules/app/images/timeofuse_app.png" style="width:600px" class="img-rounded"></p>

<h3 class="text-white">Tariffs &amp; schedule</h3>
<p>Once the feeds are configured, use the <strong class="text-white">Tariffs &amp; Schedule</strong> editor below the chart (click the wrench to configure). It has two stages:</p>
<ul>
    <li><strong class="text-white">Tariffs</strong> &mdash; define each tariff once with a name and a price (currency/kWh). The totals and averages for the displayed period are shown here against the tariff names.</li>
    <li><strong class="text-white">Schedule</strong> &mdash; on the <strong class="text-white">Weekday</strong> and <strong class="text-white">Weekend</strong> tabs, add a row for each time block, choosing its start time (on the hour or half hour) and which tariff applies.</li>
</ul>
<p>The public-holidays box lists days that should use the weekend schedule.</p>

<h3 class="text-white">Assumptions</h3>
<ul>
    <li>Any number of tariffs can be defined; assign the same tariff to multiple blocks/tabs to group them in the totals and averages.</li>
    <li>Each weekday (Monday to Friday) shares one schedule; each weekend day (Saturday and Sunday) shares another.</li>
    <li>Public holidays are treated the same as a weekend day.</li>
    <li>A block runs until the next block's start time; if no block starts at 00:00 the last block of the day wraps over midnight.</li>
</ul>

<h3 class="text-white">Public holidays</h3>
<p>Public holidays are entered in the schedule editor as a comma separated list of days of the year (1-365/366) per year, for example
<code>2017:2,104,107,115,163,275,359,360;2018:1</code>.
<a href="https://www.epochconverter.com/days">epochconverter.com/days</a> provides an easy reference.</p>

<hr>
<h3 class="text-white">Supply charge</h3>
<p>Set a fixed <strong class="text-white">daily supply charge</strong> in your chosen currency in the configuration on the right. It is added to each day in cost mode and is only shown when greater than zero.</p>

<h3 class="text-white">Controlled load (optional)</h3>
<p>Tick <strong class="text-white">"Controlled load"</strong> in the configuration on the right to monitor a separate load on its own tariff, such as off-peak hot water. Enabling it reveals the <code>cl_use</code> power feed, the <code>cl_kwh</code> accumulated kWh feed, and the controlled load cost (currency/kWh). The controlled load is shown as an additional stacked series on the graphs and as its own line in the totals and averages.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>
</div>

<script>
// Transfer php variables to javascript (consumed by timeofuse2.js)
var apikey = "<?php print $apikey; ?>";
var user_timezone = "<?php echo $timezone; ?>";
var sessionwrite = <?php echo $session['write']; ?>;

config.id = <?php echo $id; ?>;
config.name = "<?php echo $name; ?>";
config.public = <?php echo $public; ?>;
config.db = <?php echo json_encode($config); ?>;
</script>
<?php load_js("Modules/app/apps/OpenEnergyMonitor/timeofuse2/timeofuse2.js"); ?>
