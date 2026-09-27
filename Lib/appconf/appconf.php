<?php load_js("Lib/js/vue.global.prod-3.5.22.min.js"); ?>

<?php load_css("Modules/app/Lib/appconf/appconf.css"); ?>

<div id="vue-config">

<div id="app-setup" class="hide" data-bs-theme="dark">
<div class="cfg">

    <!-- Title, lead and launch -->
    <div class="cfg-head">
        <div>
            <h2 :style="{ color: app_name_color }">{{ app_name }}</h2>
            <p v-if="app_lead" v-html="app_lead"></p>
        </div>
        <div class="cfg-actions">
            <button class="btn btn-primary app-launch" :disabled="!config_valid" @click="launchApp"><i class="svg-icon-play"></i> Launch app</button>
        </div>
    </div>

    <!-- Readiness -->
    <div class="cfg-status">
        <span :class="['cfg-icon', 'cfg-state', config_valid ? 'ok' : 'miss']"><i :class="config_valid ? 'svg-icon-check' : 'svg-icon-close'"></i></span>
        <div>
            <b>{{ config_valid ? "Ready to launch" : (missing_feeds.length ? missing_feeds.length + " required feed" + (missing_feeds.length > 1 ? "s" : "") + " missing" : "Configuration incomplete") }}</b>
            <span class="text-body-secondary ms-2">{{ connected_feeds.length }} of {{ feed_items.length }} feeds connected</span>
        </div>
        <div class="cfg-progress ms-auto"><div :style="{ width: feed_progress + '%' }"></div></div>
    </div>

    <!-- App settings and description -->
    <div class="cfg-cards">
        <div class="cfg-card">
            <div class="cfg-card-title"><span class="cfg-icon"><i class="svg-icon-apps"></i></span>App</div>
            <label class="cfg-label" for="cfg-name">Name in the menu</label>
            <input id="cfg-name" class="form-control app-config-name" type="text" :value="config_name" @change="changeName">
            <div class="cfg-switch-row">
                <div><div class="cfg-key">Public</div><div class="cfg-desc">Anyone with the link can view the app. Make its feeds public too.</div></div>
                <div class="form-check form-switch m-0"><input class="form-check-input app-config-public" type="checkbox" :checked="config_public" @change="changePublic"></div>
            </div>
        </div>
        <div class="cfg-card">
            <div class="cfg-card-title"><span class="cfg-icon"><i class="svg-icon-info"></i></span>About</div>
            <div ref="about" :class="['cfg-about', about_long && !about_open ? 'is-clamped' : '']">
                <div v-html="app_description"></div>
                <div v-html="app_instructions"></div>
                <p><b>Auto configure:</b> feeds named as shown are connected automatically. Click a feed to choose another.</p>
            </div>
            <button v-if="about_long" class="btn btn-link p-0" @click="about_open = !about_open">{{ about_open ? "Show less" : "Show more" }}</button>
        </div>
    </div>

    <!-- Feeds -->
    <div class="cfg-section"><h4>Feeds</h4><span class="cfg-count">{{ connected_feeds.length }} connected</span></div>
    <div class="cfg-grid">
        <div v-for="item in shown_feeds" :key="item.key" :class="['cfg-row', 'is-link', open_key === item.key ? 'open' : '']">
            <div class="cfg-row-main" @click="toggleFeed(item.key)">
                <span :class="['cfg-icon', 'cfg-state', item.state]"><i :class="stateIcon(item)"></i></span>
                <div class="cfg-text">
                    <div class="cfg-key cfg-mono">{{ item.key }}</div>
                    <div class="cfg-desc">{{ item.description }}</div>
                </div>
                <div class="cfg-value">
                    <div v-if="item.feedName && item.feedName !== item.key" class="cfg-mono">{{ item.feedName }}</div>
                    <div class="cfg-node">
                        <span v-if="item.feedTag !== false">{{ item.feedTag }}</span>
                        <span v-else-if="item.selectionMode === 'DERIVE'">from the other feeds</span>
                        <span v-else>not set</span>
                        <span v-if="item.selectionMode === 'AUTO' && item.isValid" class="cfg-tag cfg-tag-auto">AUTO</span>
                        <span v-if="item.selectionMode === 'DERIVE'" class="cfg-tag cfg-tag-derive">DERIVED</span>
                        <span v-if="item.selectionMode === 'DISABLED'" class="cfg-tag cfg-tag-off">DISABLED</span>
                        <span v-if="item.state === 'miss'" class="cfg-tag cfg-tag-miss">REQUIRED</span>
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
        <span class="cfg-mono">({{ unused_feeds.map(i => i.key).join(", ") }})</span>
    </button>

    <!-- Auto generated kWh flow feeds -->
    <template v-if="autogen_feeds.length > 0">
        <div class="cfg-section">
            <h4>kWh flow feeds</h4><span class="cfg-count">generated by post processing</span>
            <span :class="['cfg-tag', 'ms-auto', autogen_all_present ? 'cfg-tag-set' : 'cfg-tag-warn']">{{ autogen_present_count }} of {{ autogen_feeds.length }} present</span>
        </div>
        <div class="cfg-card p-0">
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
                        <td class="cfg-mono">{{ f.name }}</td>
                        <td class="text-end">
                            <span v-if="f.feedid" class="cfg-tag cfg-tag-set">EXISTS</span>
                            <span v-else class="cfg-tag cfg-tag-warn">MISSING</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="d-flex flex-wrap align-items-center gap-2 p-3">
                <button class="btn btn-outline-primary" v-show="!autogen_all_present" @click="createMissingFeeds"><i class="svg-icon-plus"></i> Create missing feeds</button>
                <button class="btn btn-outline-primary" v-show="autogen_all_present" @click="runPostProcessor"><i class="svg-icon-play"></i> Run post-processor</button>
                <button class="btn btn-default" v-show="autogen_all_present" @click="resetFeeds">Reset and clear</button>
                <span class="small ms-2" :style="{ color: autogen_status_color }">{{ autogen_status }}</span>
            </div>
        </div>
    </template>

    <!-- Options -->
    <template v-if="option_items.length">
        <div class="cfg-section"><h4>Options</h4></div>
        <div class="cfg-grid">
            <div v-for="item in option_items" :key="item.key" class="cfg-row">
                <div class="cfg-row-main">
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
        </div>
    </template>

    <!-- Manage -->
    <div class="cfg-section"><h4>Manage</h4></div>
    <div class="cfg-grid">
        <div v-if="enable_process_daily" class="cfg-row">
            <div class="cfg-row-main">
                <div class="cfg-text"><div class="cfg-key">Reload daily data</div><div class="cfg-desc">Recalculate the daily summaries from the feeds.</div></div>
                <button class="btn btn-default" @click="reloadDailyData">Reload</button>
            </div>
        </div>
        <div class="cfg-row cfg-danger">
            <div class="cfg-row-main">
                <div class="cfg-text"><div class="cfg-key">Delete app</div><div class="cfg-desc">Removes the app and its settings. Feeds are kept.</div></div>
                <button class="btn btn-danger app-delete" @click="deleteApp"><i class="svg-icon-trash"></i> Delete</button>
            </div>
        </div>
    </div>

</div>
</div>
</div>

<?php load_js('Modules/app/Lib/appconf/appconf.js'); ?>
