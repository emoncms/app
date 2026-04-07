
<?php
    global $path;
    $app_conf_path = $path . 'Modules/app/Lib/appconf/';
    $app_conf_version = time(); // Use timestamp for cache busting during development, replace with static version for production
?>

<script src="<?php echo $path; ?>Lib/vue.min.js"></script>


<link href="<?php echo $app_conf_path; ?>appconf.css?v=<?php echo $app_conf_version; ?>" rel="stylesheet">

<div id="vue-config">

<div id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xappconfig-description app-config">
                <div class="xappconfig-description-inner text-light">
                    <h2 class="appconfig-title text-warning">{{ app_name }}</h2>
                    <p class="lead">{{ app_description }}</p>
                    <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                </div>

                <div style="border: 1px solid #fff; padding: 10px; margin-top: 20px; color:#fff;">
                    <p><b>Auto generate kWh flow feeds</b></p>
                    <p style="color:#aaa; font-size:13px; margin-bottom:12px;">
                        The following feeds are required for historic half-hourly and daily analysis. They are generated from the power feeds using feed post-processing.
                    </p>

                    <!-- Input text box to set the node name of the feeds to be generated -->
                    <div style="margin-bottom:12px;">
                        <label style="font-size:13px; color:#aaa;"><b>Feed node:</b></label>
                        <div class="input-append">
                        <input type="text" v-model="autogen_node" style="width:200px" placeholder="Enter feed node name">
                        <button class="btn btn-secondary" style="margin-top:5px" @click="setNode">
                            Set node
                        </button>
                        </div>
                    </div>

                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead>
                            <tr style="color:#aaa; border-bottom:1px solid #444;">
                                <th style="text-align:left; padding:4px 8px;">Feed name</th>
                                <th style="text-align:left; padding:4px 8px;">Node</th>
                                <th style="text-align:center; padding:4px 8px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(feed, j) in autogen_feeds" :style="{ background: j % 2 === 0 ? '#1e1e1e' : '#252525' }">
                                <td style="padding:6px 8px; font-family:monospace; color:#fff;">{{ feed.name }}</td>
                                <td style="padding:6px 8px; color:#aaa;">{{ feed.node }}</td>
                                <td style="padding:6px 8px; text-align:center;">
                                    <span v-if="feed.feedid" style="color:#5cb85c; font-weight:bold;">&#10003; exists</span>
                                    <span v-else style="color:#f0ad4e; font-weight:bold;">&#10007; missing</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-warning btn-sm" v-show="!autogen_all_present" @click="createMissingFeeds">
                            &#43; Create missing feeds
                        </button>
                        <button class="btn btn-success btn-sm" v-show="autogen_all_present" @click="runPostProcessor">
                            &#9654; Run post-processor
                        </button>
                        <button class="btn btn-danger btn-sm" v-show="autogen_all_present" @click="resetFeeds">
                            &#10006; Reset / clear feeds
                        </button>
                        <span style="font-size:12px; margin-left:4px;" :style="{ color: autogen_status_color }">{{ autogen_status }}</span>
                    </div>
                </div>

            </div>
            <div id="app-config-content" class="span5 app-config pt-3">

                <!-- App name -->
                <div class="app-config-box">
                    <i class="status icon-ok-sign icon-app-config"></i> <b>App name (menu)</b>
                    <br><span class="app-config-info"></span>
                    <input class="app-config-name" type="text" :value="config_name" @change="changeName">
                </div>
                <!-- Public -->
                <div class="app-config-box">
                    <i class="status icon-ok-sign icon-app-config"></i> <b>Public</b>
                    <br><span class="app-config-info">Make app public</span>
                    <input class="app-config-public" type="checkbox" style="margin-top:-2px" :checked="config_public" @change="changePublic">
                </div>

                <br>

                <div v-for="item in config_items" :key="item.key" class="app-config-box">
                    <!-- feed -->
                    <template v-if="item.type === 'feed'">
                        <i :class="['status', 'icon-app-config', item.isValid ? 'icon-ok-sign' : 'icon-remove-circle']"></i>
                        <b class="feed-name">{{ item.displayName }}<span v-if="item.selectionMode" class="feed-auto"> [{{ item.selectionMode }}]</span></b>
                        <i class="app-config-edit icon-pencil icon-app-config" style="float:right; cursor:pointer" @click="editFeed(item.key)"></i>
                        <br><span class="app-config-info">{{ item.description }}</span>
                        <div class="feed-select-div input-append" v-show="item.showSelector">
                            <select class="feed-select" v-model="item.selectedFeedId">
                                <option :value="0">Select {{ item.key }} feed:</option>
                                <option value="auto">AUTO SELECT</option>
                                <option value="disable">DISABLE</option>
                                <optgroup v-for="group in item.feedGroups" :label="group.name">
                                    <option v-for="f in group.feeds" :value="f.id">{{ f.name }}</option>
                                </optgroup>
                            </select>
                            <button class="btn feed-select-ok" @click="selectFeed(item.key, item.selectedFeedId)">ok</button>
                        </div>
                    </template>
                    <!-- value -->
                    <template v-else-if="item.type === 'value'">
                        <i class="status icon-ok-sign icon-app-config"></i> <b>{{ item.label }}</b>
                        <br><span class="app-config-info">{{ item.description }}</span>
                        <input class="app-config-value" type="text" :value="item.inputValue" @change="changeValue(item.key, $event.target.value)">
                    </template>
                    <!-- checkbox -->
                    <template v-else-if="item.type === 'checkbox'">
                        <i class="status icon-ok-sign icon-app-config"></i> <b>{{ item.label }}</b>
                        <br><span class="app-config-info">{{ item.description }}</span>
                        <input class="app-config-value" type="checkbox" :checked="item.inputValue" @change="changeValue(item.key, $event.target.checked)">
                    </template>
                    <!-- select -->
                    <template v-else-if="item.type === 'select'">
                        <i class="status icon-ok-sign icon-white"></i> <b>{{ item.label }}</b>
                        <select class="app-config-value" style="margin-top:5px; width:100%" :value="item.inputValue" @change="changeValue(item.key, $event.target.value)">
                            <option v-for="opt in item.selectOptions">{{ opt }}</option>
                        </select>
                    </template>
                </div>

                <br>
                <div style="text-align:center;">
                    <button class="btn app-launch" style="padding:10px" v-show="config_valid">Launch App</button>
                    <button class="btn btn-danger app-delete" style="padding:10px; margin-left:20px"><i class="icon-trash icon-app-config"></i> Delete</button>
                </div>

            </div>
        </div>
    </div>
</div>
</div>

<script type="text/javascript" src="<?php echo $app_conf_path; ?>appconf.js?v=<?php echo $app_conf_version; ?>"></script>
