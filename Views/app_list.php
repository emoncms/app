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
                <tr v-for="app in apps" :key="app.name">
                    <td>{{ app.id }}</td>
                    <td><span class="label label-info">{{ app.app }}</span></td>
                    <td>{{ app.name }}</td>
                    <td><i :class="app.public ? 'icon-globe' : 'icon-lock'"></i></td>
                    <td>
                        <a :href="'<?php echo $path; ?>app/view?name=' + encodeURIComponent(app.name)" class="btn btn-secondary"><?php echo _("View"); ?></a>
                        <!-- delete -->
                        <button class="btn btn-danger" @click="deleteApp(app.id)"><i class="icon-trash"></i></button>
                </tr>
            </tbody>
        </table>
        <a href="<?php echo $path; ?>app/new" class="btn btn-primary"><?php echo _("Create New App"); ?></a>
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

                    // type cast id and public to int
                    data.forEach(app => {
                        app.id = parseInt(app.id);
                        app.public = parseInt(app.public);
                    });

                    this.apps = data;
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