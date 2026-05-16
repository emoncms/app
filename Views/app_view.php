<?php global $path; ?>

<div id="app-page" style="padding:20px">

    <h2>Available Apps</h2>
    <p>Create a new instance of an app by clicking on one of the apps below.</p>

    <div id="available-apps">

        <p><b>Featured apps:</b></p>

        <div class="app-group">
            <div class="app-item" v-for="entry in featuredApps" :key="entry.id" @click="openCreateModal(entry.id)">
                <div class="app-item-title">{{ entry.app.title }}</div>
                <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
            </div>
        </div>
        <br>

        <p><b>All apps:</b></p>

        <div class="app-group">
            <div class="app-item" v-for="entry in otherApps" :key="entry.id" @click="openCreateModal(entry.id)">
                <div class="app-item-title">{{ entry.app.title }}</div>
                <div class="app-item-description">{{ entry.app.description || "no description..." }}</div>
            </div>
        </div>

    </div>

<!-------------------------------------------------------------------------------------------
  MODALS
-------------------------------------------------------------------------------------------->
<!-- GROUP CREATE -->
<dialog id="app-new-modal" class="ec-modal" aria-labelledby="app-new-modal-label" data-backdrop="static" style="--modal-width: 620px;">
    <div class="modal-header">
        <button type="button" class="modal-close-btn" data-modal-close aria-label="Close">&times;</button>
        <h3 id="app-new-modal-label">{{ modalTitle }}</h3>
    </div>
    <div class="modal-body">

        <p>Enter a unique name for the app:<br>
            <input id="app-new-name" type="text" v-model="appName"></p>

    </div>
    <div class="modal-footer">
        <button id="app-new-cancel" class="btn" data-modal-close @click="cancelCreate">Cancel</button>
        <button id="app-new-action" class="btn btn-primary" @click="createApp">Create</button>
    </div>
</dialog>

</div>

<script>

var available_apps = JSON.parse('<?php echo json_encode($apps); ?>');
var app_list = Vue.createApp({
    data: function() {
        return {
            apps: available_apps,
            selectedApp: "",
            appName: "",
            appNewEnable: true
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
                return !!entry.app.primary;
            });
        },
        otherApps: function() {
            return this.appEntries.filter(function(entry) {
                return !entry.app.primary;
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
            emoncmsModal.open('app-new-modal');
        },
        createApp: function() {
            var self = this;
            self.appNewEnable = false;
            setTimeout(function() { self.appNewEnable = true; }, 500);
            emoncmsModal.close('app-new-modal');

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
