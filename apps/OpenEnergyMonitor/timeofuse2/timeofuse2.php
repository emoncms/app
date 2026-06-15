<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path, $session, $v, $user;
// The user's configured timezone (e.g. "Europe/London") is used to allocate
// energy to days and tiers, so the split is correct regardless of the browser.
$timezone = $user->get_timezone($session['userid']);
if (!$timezone || is_numeric($timezone)) $timezone = 'UTC';
?>
<link href="<?php echo $path; ?>Modules/app/Views/css/light.css?v=<?php echo $v; ?>" rel="stylesheet">
<link href="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/timeofuse2/timeofuse2.css?v=<?php echo $v; ?>" rel="stylesheet">

<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Montserrat&amp;lang=en" />
<script type="text/javascript" src="<?php echo $path; ?>Modules/feed/feed.js?v=<?php echo $v; ?>"></script>

<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.time.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.selection.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/jquery.flot.stack.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/flot/date.format.min.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="<?php echo $path; ?>Lib/vis.helper.js?v=<?php echo $v; ?>"></script>

<div style="font-family: Montserrat, Veranda, sans-serif;">
<div id="app-block" style="display:none">

  <div class="col1"><div class="col1-inner">

    <div class="block-bound">
      <div class="bluenav config-open"><i class="icon-wrench icon-white"></i></div>
      <div class="bluenav viewcostenergy">ENERGY MODE</div>
      <!--<div class="bluenav cost">Cost</div>
      <div class="bluenav energy">Energy</div>-->
      <div class="block-title">TIME OF USE</div>
    </div>

    <div style="background-color:#fff; color:#333; padding:10px;">
      <table style="width:100%">
        <tr>
          <td style="width:40%">
              <div class="electric-title">POWER NOW</div>
              <div class="power-value"><span id="power_now">0</span></div>
          </td>
          <td style="text-align:right">
              <div class="electric-title">USE TODAY</div>
              <div class="power-value"><span id="kwh_today">0</span></div>
          </td>
        </tr>
      </table>
    </div>

  </div></div>
  <div class="col1"><div class="col1-inner">

    <div class="block-bound">

      <div class="bargraph-navigation">
        <!--<div class="bluenav bargraph-other">OTHER</div>-->
        <div class="bluenav bargraph-year">YEAR</div>
        <div class="bluenav bargraph-month">MONTH</div>
        <div class="bluenav bargraph-week">WEEK</div>
      </div>

      <div class="powergraph-navigation" style="display:none">
        <div class="bluenav viewhistory">VIEW HISTORY</div>
        <span class="bluenav" id="right" >&gt;</span>
        <span class="bluenav" id="left" >&lt;</span>
        <span class="bluenav" id="zoomout" >-</span>
        <span class="bluenav" id="zoomin" >+</span>
        <span class="bluenav time" time='720'>M</span>
        <span class="bluenav time" time='168'>W</span>
        <span class="bluenav time" time='24'>D</span>
      </div>

      <div class="block-title">HISTORY</div>

    </div>

    <div style="background-color:rgba(68,179,226,0.1); padding:10px;">
      <div id="placeholder_bound" style="width:100%; height:500px;">
        <div id="placeholder" style="height:500px"></div>
      </div>
    </div>

    <div id="power-graph-footer" style="background-color:#eee; color:#333; display:none">
      <div id='advanced-toggle' class='bluenav' >SHOW DETAIL</div>

       <div style="padding:10px;">
        kWh in window: <b id="window-kwh"></b> <b>kWh</b>
      </div>

      <div style="clear:both"></div>
    </div>

    <div id="advanced-block" style="background-color:#eee; padding:10px; display:none">
      <div style="color:#000">
        <table class="table">
          <tr>
          <th></th>
          <th style="text-align:center">Min</th>
          <th style="text-align:center">Max</th>
          <th style="text-align:center">Diff</th>
          <th style="text-align:center">Mean</th>
          <th style="text-align:center">StDev</th>
          </tr>
          <tbody id="stats"></tbody>
        </table>
      </div>
    </div>

  </div></div>

  <div style="clear:both"></div>

  <!-- Tariffs & schedule builder (Vue app, mounted on #schedule-builder-app).
       Note: directives must live on a child of the mount root, so #schedule-builder
       itself carries v-show / :class rather than the wrapper. -->
  <div id="schedule-builder-app">
  <div id="schedule-builder" class="col1" style="width:100%;" v-show="visible" :class="{editing: editing}"><div class="col1-inner">
    <div class="block-bound">
      <div class="bluenav sched-configure" v-show="sessionwrite" title="Configure tariffs &amp; schedule" @click="toggleConfigure"><i class="icon-wrench icon-white"></i></div>
      <div class="block-title">TARIFFS &amp; SCHEDULE</div>
    </div>
    <div style="background-color:#fff; color:#333; padding:15px;">

      <div class="sched-cols">

        <!-- Left: tariff definitions (name + price), where totals are shown -->
        <div class="sched-col sched-col-left">
          <div class="sched-subhead">Tariffs</div>
          <table class="sched-table tariff-table">
            <thead>
              <tr>
                <th class="sched-th-name">Tariff</th>
                <th class="sched-th-price">Price (<span class="sched-cur">{{ currency }}</span>/kWh)</th>
                <th class="sched-th-total">Total</th>
                <th class="sched-th-average">Average</th>
                <th class="sched-th-actions"><span class="tariff-add" title="Add a tariff" @click="addTariff">+</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in tariffs" :key="i">
                <template v-if="editing">
                  <td>
                    <div style="display:flex; align-items:center;">
                      <span class="sched-swatch" :style="{background: tariffColour(i)}"></span>
                      <input type="text" class="tariff-name" style="flex:1" :value="t.name" @change="renameTariff(i, $event.target.value)" placeholder="Tariff name">
                    </div>
                  </td>
                  <td><input type="number" step="0.001" min="0" class="tariff-price" v-model.number="t.price"></td>
                </template>
                <template v-else>
                  <td><span class="sched-swatch" :style="{background: tariffColour(i)}"></span>{{ t.name }}</td>
                  <td class="sched-ro-price">{{ t.price }}</td>
                </template>
                <td class="sched-total">{{ tierTotal(t.name) }}</td>
                <td class="sched-average">{{ tierAverage(t.name) }}</td>
                <td class="sched-actions-cell"><span class="tariff-del" title="Remove tariff" @click="delTariff(i)">&#10005;</span></td>
              </tr>
            </tbody>
            <tfoot id="tariff-foot" v-if="totals">
              <tr>
                <td class="sched-foot-label" colspan="2">Combined</td>
                <td class="sched-total">{{ fmt(totals.combined.total, false) }}</td>
                <td class="sched-average">{{ fmt(totals.combined.average, true) }}</td>
                <td class="sched-actions-cell"></td>
              </tr>
              <tr v-if="totals.cl">
                <td class="sched-foot-label" colspan="2">Controlled load</td>
                <td class="sched-total">{{ fmt(totals.cl.total, false) }}</td>
                <td class="sched-average">{{ fmt(totals.cl.average, true) }}</td>
                <td class="sched-actions-cell"></td>
              </tr>
              <tr v-if="totals.supply">
                <td class="sched-foot-label" colspan="2">Supply</td>
                <td class="sched-total">{{ fmt(totals.supply.total, false) }}</td>
                <td class="sched-average">{{ fmt(totals.supply.average, true) }}</td>
                <td class="sched-actions-cell"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Right: when each tariff applies -->
        <div class="sched-col sched-col-right">
          <div class="sched-subhead">Schedule</div>
          <div class="sched-tabs">
            <span class="sched-tab" :class="{active: tab=='weekday'}" @click="setTab('weekday')">Weekday</span>
            <span class="sched-tab" :class="{active: tab=='weekend'}" @click="setTab('weekend')">Weekend</span>
          </div>
          <table class="sched-table schedule-table">
            <thead>
              <tr>
                <th class="sched-th-time">Time</th>
                <th class="sched-th-name">Tariff</th>
                <th class="sched-th-actions"><span class="block-add" title="Add a time block" @click="addBlock">+</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in schedule[tab]" :key="i">
                <template v-if="editing">
                  <td>
                    <select class="sched-time" v-model="b.start" @change="onBlockTimeChange">
                      <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center;">
                      <span class="sched-swatch" :style="{background: tariffColourByName(b.name)}"></span>
                      <select class="sched-tariff" v-model="b.name">
                        <option v-for="n in tariffOptions(b.name)" :key="n" :value="n">{{ n }}</option>
                      </select>
                    </div>
                  </td>
                </template>
                <template v-else>
                  <td class="sched-ro-time">{{ b.start }}</td>
                  <td><span class="sched-swatch" :style="{background: tariffColourByName(b.name)}"></span>{{ b.name }}</td>
                </template>
                <td class="sched-actions-cell"><span class="block-del" title="Remove this block" @click="delBlock(i)">&#10005;</span></td>
              </tr>
            </tbody>
          </table>

          <div class="sched-ph-wrap">
            <label class="sched-ph-label">Public holidays <span class="sched-muted">(treated as a weekend day)</span></label>
            <textarea id="sched-ph" rows="2" v-model="phDays" placeholder="2026:1,104,359;2027:1"></textarea>
            <div class="sched-help">Format: <code>year:day-of-year,day-of-year;year:...</code> &mdash; e.g. <code>2026:1,104,359,360</code>. <a href="https://www.epochconverter.com/days" target="_blank" rel="noopener">day-of-year reference</a></div>
          </div>
        </div>

      </div>

      <div class="sched-actions">
        <button type="button" id="sched-save" class="sched-save-btn" :disabled="saving" @click="save">Save</button>
        <span id="sched-status" class="sched-status" :class="status.cls">{{ status.text }}</span>
      </div>

    </div>
  </div></div>
  </div>

</div>
</div>

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
<a href="https://www.epochconverter.com/days" class="text-light">epochconverter.com/days</a> provides an easy reference.</p>

<hr>
<h3 class="text-white">Supply charge</h3>
<p>Set a fixed <strong class="text-white">daily supply charge</strong> in your chosen currency in the configuration on the right. It is added to each day in cost mode and is only shown when greater than zero.</p>

<h3 class="text-white">Controlled load (optional)</h3>
<p>Tick <strong class="text-white">"Controlled load"</strong> in the configuration on the right to monitor a separate load on its own tariff, such as off-peak hot water. Enabling it reveals the <code>cl_use</code> power feed, the <code>cl_kwh</code> accumulated kWh feed, and the controlled load cost (currency/kWh). The controlled load is shown as an additional stacked series on the graphs and as its own line in the totals and averages.</p>
</div>
<?php include('Modules/app/Lib/appconf/appconf.php'); ?>

<div class="ajax-loader"></div>

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
<script type="text/javascript" src="<?php echo $path; ?>Modules/app/apps/OpenEnergyMonitor/timeofuse2/timeofuse2.js?v=<?php echo $v; ?>"></script>
