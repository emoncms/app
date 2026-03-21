
<?php
    global $path;
    $app_conf_path = $path . 'Modules/app/Lib/appconf/';
    $app_conf_version = 1;
?>

<link href="<?php echo $app_conf_path; ?>appconf.css?v=1" rel="stylesheet">
<script type="text/javascript" src="<?php echo $app_conf_path; ?>appconf.js?v=1"></script>

<section id="app-setup" class="hide pb-3">
    <!-- instructions and settings -->
    <div class="px-3">
        <div class="row-fluid">
            <div class="span7 xappconfig-description">
                <div class="xappconfig-description-inner text-light">
                    <h2 class="appconfig-title text-warning"><?php echo tr('My Solar & Battery'); ?></h2>
                    <p class="lead">
                    This app can be used to explore onsite solar generation, self consumption, battery integration, export and building consumption.</p>
                    <p><strong class="text-white">Auto configure:</strong> This app can auto-configure connecting to emoncms feeds with the names shown on the right, alternatively feeds can be selected by clicking on the edit button.</p>
                    <p><strong class="text-white">History view:</strong> Daily energy flow breakdown feeds can be generated from the power feeds using the <strong class="text-white">Solar battery kWh flows</strong> post-processor (<code>solarbatterykwh</code>).</p>
                </div>

                <div style="border: 1px solid #fff; padding: 10px; margin-top: 20px; color:#fff;">
                    <p><b>Auto generate kWh flow feeds</b></p>
                    <p style="color:#aaa; font-size:13px; margin-bottom:12px;">
                        The following feeds are required for the history view. They are generated from the power feeds
                        using the <strong style="color:#fff;">Solar battery kWh flows</strong> post-processor (<code>solarbatterykwh</code>).
                        The feed tag/node will be set to match the app name: <strong class="autogen-appname" style="color:#dccc1f;"></strong>
                    </p>

                    <!-- Input text box to set the node name of the feeds to be generated -->
                    <div style="margin-bottom:12px;">
                        <label for="feed-node-input" style="font-size:13px; color:#aaa;">Feed node:</label>
                        <input type="text" id="feed-node-input" class="form-control form-control-sm" style="width:200px; display:inline-block; margin-left:8px;" placeholder="Enter feed node name">
                        <button id="set-node-btn" class="btn btn-secondary btn-sm" style="margin-left:8px;" onclick="set_feed_node()">
                            Set node
                        </button>
                    </div>

                    <table style="width:100%; border-collapse:collapse; font-size:13px;" id="autogen-feed-list">
                        <thead>
                            <tr style="color:#aaa; border-bottom:1px solid #444;">
                                <th style="text-align:left; padding:4px 8px;">Feed name</th>
                                <th style="text-align:left; padding:4px 8px;">Node</th>
                                <th style="text-align:center; padding:4px 8px;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="autogen-feed-rows">
                            <!-- populated by JS -->
                        </tbody>
                    </table>

                    <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <button id="btn-create-feeds" class="btn btn-warning btn-sm" style="display:none;" onclick="create_missing_feeds()">
                            &#43; Create missing feeds
                        </button>
                        <button id="btn-run-processor" class="btn btn-success btn-sm" style="display:none;" onclick="run_post_processor()">
                            &#9654; Run post-processor
                        </button>
                        <button id="btn-reset-feeds" class="btn btn-danger btn-sm" style="display:none;" onclick="reset_feeds()">
                            &#10006; Reset / clear feeds
                        </button>
                        <span id="autogen-status" style="font-size:12px; color:#aaa; margin-left:4px;"></span>
                    </div>
                </div>

            </div>
            <div class="span5 app-config pt-3"></div>
        </div>
    </div>
</section>