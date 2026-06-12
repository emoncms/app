<?php global $path; ?>
<?php load_js("Lib/js/vue.global.prod-3.5.22.min.js"); ?>

<style>
    .app-group-box {
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 20px;
    }
    .app-group-box.featured {
        border-color: #e8b923;
        border-left: 4px solid #e8b923;
        background: #fffdf5;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .app-group-title {
        margin: 0 0 4px 0;
    }
    .app-group-title i {
        margin-right: 6px;
    }
    .app-group-box.featured .app-group-title i {
        color: #e8b923;
    }
    .app-item-title i {
        margin-right: 6px;
        opacity: 0.7;
    }
    .app-group-toggle {
        cursor: pointer;
        margin: 0;
        user-select: none;
        display: flex;
        align-items: center;
    }
    .app-group-toggle i {
        margin-right: 6px;
        opacity: 0.6;
    }
    .app-group-toggle:hover i {
        opacity: 1;
    }
</style>

<div id="app-page" style="padding:20px">

    <h2>Available Apps</h2>
    <p>Create a new instance of an app by clicking on one of the apps below.</p>

    <div id="available-apps">

        <div class="app-group-box featured">
            <p class="app-group-title"><i class="icon-star"></i><b>Featured apps</b></p>

            <div class="app-group">
                <div class="app-item" v-for="entry in featuredApps" :key="entry.id" @click="openCreateModal(entry.id)">
                    <div class="app-item-title"><i v-if="entry.app.icon" :class="entry.app.icon"></i>{{ entry.app.title }}</div>
                    <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
                </div>
            </div>
        </div>

        <div class="app-group-box">
            <p><b>Other apps:</b></p>

            <div class="app-group">
                <div class="app-item" v-for="entry in otherApps" :key="entry.id" @click="openCreateModal(entry.id)">
                    <div class="app-item-title"><i v-if="entry.app.icon" :class="entry.app.icon"></i>{{ entry.app.title }}</div>
                    <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
                </div>
            </div>
        </div>

        <div class="app-group-box">
            <p class="app-group-toggle" @click="showArchived = !showArchived">
                <i :class="showArchived ? 'icon-chevron-down' : 'icon-chevron-right'"></i>
                <b>Archived apps</b> <span style="color:#999;margin-left:6px;">({{ archivedApps.length }})</span>
            </p>

            <div class="app-group" v-show="showArchived" style="margin-top:10px;">
                <div class="app-item" v-for="entry in archivedApps" :key="entry.id" @click="openCreateModal(entry.id)">
                    <div class="app-item-title"><i v-if="entry.app.icon" :class="entry.app.icon"></i>{{ entry.app.title }}</div>
                    <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
                </div>
            </div>
        </div>

        <div class="app-group-box">
            <p class="app-group-toggle" @click="showDeveloper = !showDeveloper">
                <i :class="showDeveloper ? 'icon-chevron-down' : 'icon-chevron-right'"></i>
                <b>Developer apps</b> <span style="color:#999;margin-left:6px;">({{ developerApps.length }})</span>
            </p>

            <div class="app-group" v-show="showDeveloper" style="margin-top:10px;">
                <div class="app-item" v-for="entry in developerApps" :key="entry.id" @click="openCreateModal(entry.id)">
                    <div class="app-item-title"><i v-if="entry.app.icon" :class="entry.app.icon"></i>{{ entry.app.title }}</div>
                    <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
                </div>
            </div>
        </div>

    </div>

<!-------------------------------------------------------------------------------------------
  MODALS
-------------------------------------------------------------------------------------------->
<!-- GROUP CREATE -->
<div id="app-new-modal" class="modal hide" tabindex="-1" role="dialog" aria-labelledby="app-new-modal-label" aria-hidden="true" data-backdrop="static" style="width:620px;margin-left:-310px;">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h3 id="app-new-modal-label">{{ modalTitle }}</h3>
    </div>
    <div class="modal-body">

        <p>Enter a unique name for the app:<br>
            <input id="app-new-name" type="text" v-model="appName"></p>

    </div>
    <div class="modal-footer">
        <button id="app-new-cancel" class="btn" data-dismiss="modal" @click="cancelCreate">Cancel</button>
        <button id="app-new-action" class="btn btn-primary" @click="createApp">Create</button>
    </div>
</div>

</div>

<script>

var available_apps = JSON.parse('<?php echo json_encode($apps); ?>');
var app_list = Vue.createApp({
    data: function() {
        return {
            apps: available_apps,
            selectedApp: "",
            appName: "",
            appNewEnable: true,
            showArchived: false,
            showDeveloper: false
        };
    },
    computed: {
        appEntries: function() {
            var entries = [];
            for (var id in this.apps) {
                if (Object.prototype.hasOwnProperty.call(this.apps, id) && this.apps[id]) {
                    entries.push({ id: id, app: this.apps[id] });
                }
            }
            return entries;
        },
        featuredApps: function() {
            return this.appEntries.filter(function(entry) {
                return !!entry.app.primary && !entry.app.archived && !entry.app.developer;
            });
        },
        otherApps: function() {
            return this.appEntries.filter(function(entry) {
                return !entry.app.primary && !entry.app.archived && !entry.app.developer;
            });
        },
        archivedApps: function() {
            return this.appEntries.filter(function(entry) {
                return !!entry.app.archived;
            });
        },
        developerApps: function() {
            return this.appEntries.filter(function(entry) {
                return !!entry.app.developer;
            });
        },
        modalTitle: function() {
            if (this.selectedApp === "") {
                return "Please enter name for app";
            }
            return "Create app: " + (this.apps[this.selectedApp] ? this.apps[this.selectedApp].title : "");
        }
    },
    methods: {
        openCreateModal: function(index) {
            if (!this.appNewEnable) return;
            if (!this.apps[index]) return;
            this.selectedApp = index;
            this.appName = this.apps[index].title;
            $('#app-new-modal').modal('show');
        },
        createApp: function() {
            var self = this;
            self.appNewEnable = false;
            setTimeout(function() { self.appNewEnable = true; }, 500);
            $('#app-new-modal').modal('hide');

            var app_name = self.appName;
            app_name = app_name.replace(/\W/g, '');
            var nicename = escape(app_name).replace(/%20/g, "+");
            $.ajax({                                      
                url: path + "app/add?name=" + nicename + "&app=" + self.selectedApp,
                dataType: 'json',
                async: true,
                success: function(result) {
                    // console.log(result);
                    window.location = path + "app/view?name=" + nicename;
                }
            });
        },
        cancelCreate: function() {
            var self = this;
            self.appNewEnable = false;
            setTimeout(function() { self.appNewEnable = true; }, 500);
        }
    },
    mounted: function() {
        $(".app-group").each(function() {
            $(this).find(".app-item").first().css("border-top", "1px solid #ccc");
        });
    }
}).mount('#app-page');

</script>
