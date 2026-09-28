<?php load_js("Lib/js/vue.global.prod-3.5.22.min.js"); ?>

<?php load_css("Modules/app/Lib/appconf/appconf.css"); ?>

<?php
// Option card for each item in a Vue list
if (!function_exists('cfg_option_cards')) { function cfg_option_cards($items) { ?>
            <div v-for="item in <?php echo $items; ?>" :key="item.key" class="card">
                <div class="ref-row">
                    <div class="cfg-text">
                        <div class="cfg-key">{{ item.label }}</div>
                        <div class="cfg-desc">{{ item.description }}</div>
                    </div>
                    <div class="cfg-ctrl">
                        <div v-if="item.type === 'checkbox'" class="form-check form-switch m-0">
                            <input class="form-check-input app-config-value" type="checkbox" :checked="item.inputValue" @change="changeValue(item.key, $event.target.checked)">
                        </div>
                        <input v-else-if="item.type === 'value'" class="form-control app-config-value" type="text" :value="item.inputValue" @change="changeValue(item.key, $event.target.value)">
                        <select v-else-if="item.type === 'select'" class="form-select app-config-value" :value="item.inputValue" @change="changeValue(item.key, $event.target.value)">
                            <option v-for="opt in item.selectOptions">{{ opt }}</option>
                        </select>
                    </div>
                </div>
            </div>
<?php } } ?>

<div id="vue-config">

<div id="app-setup" class="hide" data-bs-theme="dark">
<div class="ref-page">

    <!-- Title, lead and launch -->
    <div class="ref-head mb-4">
        <div>
            <h2 :style="{ color: app_name_color }">{{ app_name }}</h2>
            <p v-if="app_lead" v-html="app_lead"></p>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-primary app-launch" :disabled="!config_valid" @click="launchApp"><i class="svg-icon-play"></i> Launch app</button>
        </div>
    </div>

    <!-- Readiness -->
    <div class="card mb-4"><div class="ref-row">
        <span :class="['ref-icon', 'ref-icon-sm', config_valid ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis']"><i :class="config_valid ? 'svg-icon-check' : 'svg-icon-close'"></i></span>
        <div>
            <b>{{ config_valid ? "Ready to launch" : (missing_feeds.length ? missing_feeds.length + " required feed" + (missing_feeds.length > 1 ? "s" : "") + " missing" : "Configuration incomplete") }}</b>
            <span class="text-body-secondary ms-2">{{ connected_feeds.length }} of {{ feed_items.length }} feeds connected</span>
            <span v-if="config_valid && autogen_feeds.length && !autogen_all_present" class="text-warning-emphasis ms-2">History needs the kWh flow feeds below</span>
        </div>
        <div class="progress cfg-progress ms-auto" role="progressbar" :aria-valuenow="feed_progress" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar bg-success" :style="{ width: feed_progress + '%' }"></div></div>
    </div></div>

    <!-- App settings and description -->
    <div class="row row-cols-1 row-cols-lg-2 g-3">
        <div class="col"><div class="card card-body h-100">
            <div class="ref-card-title mb-3"><span class="ref-icon"><i class="svg-icon-apps"></i></span>App</div>
            <label class="form-label text-body-secondary" for="cfg-name">Name in the menu</label>
            <input id="cfg-name" class="form-control app-config-name" type="text" :value="config_name" @change="changeName">
            <div class="d-flex align-items-center justify-content-between gap-3 mt-3">
                <div><div class="cfg-key">Public</div><div class="cfg-desc">Anyone with the link can view the app. Make its feeds public too.</div></div>
                <div class="form-check form-switch m-0"><input class="form-check-input app-config-public" type="checkbox" :checked="config_public" @change="changePublic"></div>
            </div>
        </div></div>
        <div class="col"><div class="card card-body h-100">
            <div class="ref-card-title mb-3"><span class="ref-icon"><i class="svg-icon-info"></i></span>About</div>
            <div ref="about" :class="['cfg-about', about_long && !about_open ? 'is-clamped' : '']">
                <div v-html="app_description"></div>
                <div v-html="app_instructions"></div>
                <p><b>Auto configure:</b> feeds named as shown are connected automatically. Click a feed to choose another.</p>
            </div>
            <button v-if="about_long" class="btn btn-link p-0 align-self-start" @click="about_open = !about_open">{{ about_open ? "Show less" : "Show more" }}</button>
        </div></div>
    </div>

    <!-- Setup options, before the feeds -->
    <template v-if="setup_items.length">
        <div class="ref-section"><h4 class="ref-label">Setup</h4></div>
        <div class="cfg-grid">
<?php cfg_option_cards("setup_items"); ?>
        </div>
    </template>

    <!-- Feeds -->
    <div class="ref-section"><h4 class="ref-label">Feeds</h4><span class="small text-body-secondary">{{ connected_feeds.length }} connected</span></div>
    <div class="cfg-grid">
        <div v-for="item in shown_feeds" :key="item.key" :class="['card', open_key === item.key ? 'open' : '']">
            <div class="ref-row is-link" @click="toggleFeed(item.key)">
                <span :class="['ref-icon', 'ref-icon-sm', stateClass(item)]"><i :class="stateIcon(item)"></i></span>
                <div class="cfg-text">
                    <div class="cfg-key font-monospace">{{ item.key }}</div>
                    <div class="cfg-desc">{{ item.description }}</div>
                </div>
                <div class="cfg-value">
                    <div v-if="item.feedName && item.feedName !== item.key" class="font-monospace">{{ item.feedName }}</div>
                    <div class="cfg-node">
                        <span v-if="item.feedTag !== false">{{ item.feedTag }}</span>
                        <span v-else-if="item.selectionMode === 'DERIVE'">from the other feeds</span>
                        <span v-else>not set</span>
                        <span v-if="item.selectionMode === 'AUTO' && item.isValid" class="badge px-2 bg-info-subtle text-info-emphasis">AUTO</span>
                        <span v-if="item.selectionMode === 'DERIVE'" class="badge px-2 cfg-derive">DERIVED</span>
                        <span v-if="item.selectionMode === 'DISABLED'" class="badge px-2 bg-secondary-subtle text-secondary-emphasis">DISABLED</span>
                        <span v-if="item.state === 'miss'" class="badge px-2 bg-danger-subtle text-danger-emphasis">REQUIRED</span>
                    </div>
                </div>
            </div>
            <div v-if="open_key === item.key" class="cfg-form">
                <select class="form-select feed-select" v-model="item.selectedFeedId">
                    <option value="auto">Auto select ({{ item.autoname }})</option>
                    <option value="derive" v-if="item.derivable">Derive from the other feeds</option>
                    <option v-else value="disable">Not used</option>
                    <optgroup v-for="group in item.feedGroups" :label="group.name">
                        <option v-for="f in group.feeds" :value="f.id">{{ f.name }}</option>
                    </optgroup>
                </select>
                <button class="btn btn-primary feed-select-ok" @click="selectFeed(item.key, item.selectedFeedId)">Save</button>
                <button class="btn btn-default" @click="open_key = null">Cancel</button>
            </div>
        </div>
    </div>
    <button v-if="unused_feeds.length" class="cfg-more" @click="show_unused = !show_unused">
        {{ show_unused ? "Hide" : "Show" }} {{ unused_feeds.length }} optional feed{{ unused_feeds.length > 1 ? "s" : "" }} not in use
        <span class="font-monospace">({{ unused_feeds.map(i => i.key).join(", ") }})</span>
    </button>

    <!-- Option groups, e.g. Options or Tariff -->
    <template v-for="group in option_groups" :key="group.name">
        <div class="ref-section"><h4 class="ref-label">{{ group.name }}</h4></div>
        <div class="cfg-grid">
<?php cfg_option_cards("group.items"); ?>
        </div>
    </template>

    <!-- Auto generated kWh flow feeds -->
    <template v-if="autogen_feeds.length > 0">
        <div class="ref-section">
            <h4 class="ref-label">kWh flow feeds</h4><span class="small text-body-secondary">generated by post processing</span>
            <span :class="['badge', 'px-2', 'ms-auto', autogen_all_present ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis']">{{ autogen_present_count }} of {{ autogen_feeds.length }} present</span>
        </div>
        <div class="card">
            <div class="d-flex flex-wrap align-items-center gap-2 p-3">
                <span class="cfg-desc me-auto">Needed for the half-hourly and daily history. Generated from the power feeds.</span>
                <div class="input-group w-auto">
                    <span class="input-group-text">Node</span>
                    <input type="text" class="form-control" v-model="autogen_node" style="width:210px" placeholder="Node name">
                    <button class="btn btn-default" @click="setNode">Set</button>
                </div>
            </div>
            <table class="table cfg-table">
                <tbody>
                    <tr v-for="f in autogen_feeds">
                        <td class="font-monospace">{{ f.name }}</td>
                        <td class="text-end">
                            <span v-if="f.feedid" class="badge px-2 bg-success-subtle text-success-emphasis">EXISTS</span>
                            <span v-else class="badge px-2 bg-warning-subtle text-warning-emphasis">MISSING</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="d-flex flex-wrap align-items-center gap-2 p-3">
                <button class="btn btn-outline-primary" v-show="!autogen_all_present" @click="createMissingFeeds"><i class="svg-icon-plus"></i> Create missing feeds</button>
                <button class="btn btn-outline-primary" v-show="autogen_all_present" :disabled="!!autogen_blocked" @click="runPostProcessor"><i class="svg-icon-play"></i> Run post-processor</button>
                <button class="btn btn-default" v-show="autogen_all_present" @click="resetFeeds">Reset and clear</button>
                <span v-if="autogen_blocked && !autogen_status" class="small ms-2 text-warning-emphasis">{{ autogen_blocked }}</span>
                <span class="small ms-2" :style="{ color: autogen_status_color }">{{ autogen_status }}</span>
            </div>
        </div>
    </template>

    <!-- Manage -->
    <div class="ref-section"><h4 class="ref-label">Manage</h4></div>
    <div class="cfg-grid">
        <div v-if="enable_process_daily" class="card">
            <div class="ref-row">
                <div class="cfg-text"><div class="cfg-key">Reload daily data</div><div class="cfg-desc">Recalculate the daily summaries from the feeds.</div></div>
                <button class="btn btn-default" @click="reloadDailyData">Reload</button>
            </div>
        </div>
        <div class="card border-danger-subtle">
            <div class="ref-row">
                <div class="cfg-text"><div class="cfg-key">Delete app</div><div class="cfg-desc">Removes the app and its settings. Feeds are kept.</div></div>
                <button class="btn btn-danger app-delete" @click="deleteApp"><i class="svg-icon-trash"></i> Delete</button>
            </div>
        </div>
    </div>

</div>
</div>
</div>

<?php load_js('Modules/app/Lib/appconf/appconf.js'); ?>
