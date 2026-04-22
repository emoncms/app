<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path;
?>
<script src="<?php echo $path; ?>Lib/vue.min.js"></script>

<div id="app" style="padding:20px">
    <h2><?php echo _("My Apps"); ?></h2>

    <div v-if="apps.length == 0">
        <p><?php echo _("You have no apps yet. Click the button below to create your first app."); ?></p>
        <a href="<?php echo $path; ?>app/new" class="btn btn-primary"><?php echo _("Create App"); ?></a>
    </div>

    <div v-else>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th><?php echo _("ID"); ?></th>
                    <th><?php echo _("App"); ?></th>
                    <th><?php echo _("Name"); ?></th>
                    <th><?php echo _("Public"); ?></th>
                    <th><?php echo _("Actions"); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="app in apps" :key="app.id">
                    <td>{{ app.id }}</td>
                    <td><span class="label label-info">{{ app.app }}</span></td>
                    <td>
                        <span v-if="!app.editing">{{ app.name }}</span>
                        <input v-else type="text" class="input-medium" v-model="app.editName" />
                    </td>
                    <td>
                        <span v-if="!app.editing">
                            <span class="badge" :class="app.public ? 'badge-success' : ''">{{ app.public ? '<?php echo _("Public"); ?>' : '<?php echo _("Private"); ?>' }}</span>
                        </span>
                        <span v-else>
                            <label class="checkbox inline" style="margin:0">
                                <input type="checkbox" v-model="app.editPublic" /> <?php echo _("Public"); ?>
                            </label>
                        </span>
                    </td>
                    <td>
                        <div v-if="!app.editing" class="btn-group">
                            <a :href="'<?php echo $path; ?>app/view?name=' + encodeURIComponent(app.name)" class="btn btn-small btn-info"><?php echo _("View"); ?></a>
                            <button class="btn btn-small" @click="editApp(app)"><?php echo _("Edit"); ?></button>
                            <button class="btn btn-small btn-danger" @click="deleteApp(app.id)"><i class="icon-trash icon-white"></i></button>
                        </div>
                        <div v-else class="btn-group">
                            <button class="btn btn-small btn-success" @click="saveApp(app)"><i class="icon-ok icon-white"></i> <?php echo _("Save"); ?></button>
                            <button class="btn btn-small" @click="cancelEdit(app)"><?php echo _("Cancel"); ?></button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <a href="<?php echo $path; ?>app/new" class="btn btn-info"><?php echo _("Create New App"); ?></a>
    </div>


</div>
<script>
var app = new Vue({
    el: '#app',
    data: {
        apps: []
    },
    mounted() {
        this.getApps();
    },
    methods: {
        getApps() {
            fetch('<?php echo $path; ?>app/list.json')
                .then(response => response.json())
                .then(data => {
                    data.forEach(app => {
                        app.id = parseInt(app.id);
                        app.public = parseInt(app.public);
                        app.editing = false;
                        app.editName = app.name;
                        app.editPublic = !!app.public;
                    });
                    this.apps = data;
                });
        },
        editApp(app) {
            app.editName = app.name;
            app.editPublic = !!app.public;
            app.editing = true;
        },
        cancelEdit(app) {
            app.editing = false;
        },
        saveApp(app) {
            const nameChanged = app.editName !== app.name;
            const publicChanged = (app.editPublic ? 1 : 0) !== app.public;

            const promises = [];

            if (nameChanged) {
                promises.push(
                    fetch('<?php echo $path; ?>app/setname?id=' + app.id + '&name=' + encodeURIComponent(app.editName))
                        .then(r => r.json())
                        .then(data => { if (!data.success) throw new Error(data.message); })
                );
            }
            if (publicChanged) {
                promises.push(
                    fetch('<?php echo $path; ?>app/setpublic?id=' + app.id + '&public=' + (app.editPublic ? 1 : 0))
                        .then(r => r.json())
                        .then(data => { if (!data.success) throw new Error(data.message); })
                );
            }

            Promise.all(promises)
                .then(() => {
                    app.name = app.editName;
                    app.public = app.editPublic ? 1 : 0;
                    app.editing = false;
                })
                .catch(err => {
                    alert('<?php echo _("Failed to save changes"); ?>: ' + err.message);
                });
        },
        deleteApp(appId) {
            if (confirm('<?php echo _("Are you sure you want to delete this app?"); ?>')) {
                fetch('<?php echo $path; ?>app/remove?id='+appId, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.getApps();
                    } else {
                        alert('<?php echo _("Failed to delete app."); ?>');
                    }
                });
            }
        }
    }
});
</script>