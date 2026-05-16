<?php
defined('EMONCMS_EXEC') or die('Restricted access');
global $path;
?>
<style>
  .content-container { max-width: 1150px; }
</style>
<div id="app">

    <div class="page-header">
      <h2><?php echo tr('My Apps'); ?></h2>
    </div>

    <div v-if="!apps.length" class="empty-state">
        <h4><?php echo _("No apps"); ?></h4>
        <p><?php echo _("You have no apps yet. Click the button below to create your first app."); ?></p>
    </div>

    <div v-else class="card">
        <div class="card-header">
            <span class="card-accent"></span>
            <span class="card-name"><?php echo _("My Apps"); ?></span>
            <span class="card-badge">{{ apps.length }}</span>
        </div>
        <table>
            <colgroup>
                <col style="width:6%">
                <col style="width:6%">
                <col style="width:30%">
                <col style="width:20%">
                <col style="width:14%">
            </colgroup>
            <thead>
                <tr>
                    <th class="col-action col-select">
                        <input
                            class="app-select-checkbox"
                            type="checkbox"
                            :checked="allSelected"
                            :indeterminate.prop="isPartiallySelected"
                            @change="toggleSelectAll($event.target.checked)"
                            :title="allSelected ? '<?php echo _("Unselect all"); ?>' : '<?php echo _("Select all"); ?>'"
                        />
                    </th>
                    <th><?php echo _("ID"); ?></th>
                    <th><?php echo _("Name"); ?></th>
                    <th><?php echo _("Type"); ?></th>
                    <th><?php echo _("Visibility"); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="app in apps" :key="app.id" class="app-row" @click="openApp(app)">
                    <td class="col-action">
                        <input
                            class="app-select-checkbox"
                            type="checkbox"
                            :value="app.id"
                            v-model="selectedAppIds"
                            @click.stop
                            :title="'<?php echo _("Select"); ?> ' + app.name"
                        />
                    </td>
                    <td class="col-secondary">{{ app.id }}</td>
                    <td class="col-primary">
                        <div v-if="!app.editing" class="app-name-line">
                            <span style="font-weight:600">{{ app.name }}</span>
                            <i class="icon-pencil row-action" @click.stop="editApp(app)" title="<?php echo _("Edit"); ?>"></i>
                        </div>
                        <div v-else class="inline-edit" @click.stop>
                            <input type="text" v-model="app.editName" />
                            <button class="app-btn app-btn-sm" @click.stop="saveApp(app)"><i class="icon-check"></i></button>
                        </div>
                    </td>
                    <td class="col-chip">{{ app.app }}</td>


                    <td class="col-secondary" v-if="!app.editing">
                        <button
                            class="app-visibility-badge"
                            :class="app.public ? 'is-public' : 'is-private'"
                            @click.stop="toggleVisibility(app)"
                            :title="app.public ? '<?php echo _("Click to make private"); ?>' : '<?php echo _("Click to make public"); ?>'"
                        >
                            {{ app.public ? '<?php echo _("Public"); ?>' : '<?php echo _("Private"); ?>' }}
                        </button>
                    </td>
                    <td v-else></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="app-toolbar">
        <button v-if="selectedAppIds.length" class="app-btn app-btn-danger" @click="deleteSelectedApps()">
            <i class="icon-trash"></i>
            <?php echo _("Delete selected"); ?> ({{ selectedAppIds.length }})
        </button>
        <a class="app-btn" href="<?php echo $path; ?>app/new"><i class="icon-plus-sign"></i> <?php echo _("New app"); ?></a>
    </div>

</div>
<style>
.app-select-checkbox {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--accent);
    cursor: pointer;
}

th.col-select .app-select-checkbox {
    display: block;
    margin: 0 auto;
}

html.color-mode-dark .app-select-checkbox {
    filter: brightness(1.05);
}

html.color-mode-light .app-select-checkbox {
    filter: none;
}

.app-name-line {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
}

.app-row {
    cursor: pointer;
}

.app-visibility-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    padding: 0 0.55rem;
    min-height: 22px;
    font-size: var(--font-xs);
    line-height: 1.6;
    cursor: pointer;
    background: transparent;
    color: var(--text-secondary);
}

.app-visibility-badge.is-public {
    border-color: rgba(54, 158, 87, 0.5);
    color: #5ac37a;
    background: rgba(54, 158, 87, 0.13);
}

.app-visibility-badge.is-private {
    border-color: var(--border-strong);
    color: var(--text-secondary);
    background: var(--bg-card-row-hover);
}

.app-visibility-badge:hover,
.app-visibility-badge:focus {
    border-color: var(--accent);
    color: var(--text-primary);
    outline: none;
}
</style>
<script>
var app = Vue.createApp({
    data: function() {
        return {
            apps: [],
            selectedAppIds: []
        };
    },
    computed: {
        allSelected() {
            return this.apps.length > 0 && this.selectedAppIds.length === this.apps.length;
        },
        isPartiallySelected() {
            return this.selectedAppIds.length > 0 && !this.allSelected;
        }
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
                    });
                    this.apps = data;
                    const validIds = new Set(data.map(app => app.id));
                    this.selectedAppIds = this.selectedAppIds.filter(id => validIds.has(id));
                });
        },
        toggleSelectAll(shouldSelectAll) {
            this.selectedAppIds = shouldSelectAll ? this.apps.map(app => app.id) : [];
        },
        editApp(app) {
            app.editName = app.name;
            app.editing = true;
        },
        saveApp(app) {
            const nameChanged = app.editName !== app.name;

            if (!nameChanged) {
                app.editing = false;
                return;
            }

            const promises = [];

            if (nameChanged) {
                promises.push(
                    fetch('<?php echo $path; ?>app/setname?id=' + app.id + '&name=' + encodeURIComponent(app.editName))
                        .then(r => r.json())
                        .then(data => { if (!data.success) throw new Error(data.message); })
                );
            }
            Promise.all(promises)
                .then(() => {
                    app.name = app.editName;
                    app.editing = false;
                })
                .catch(err => {
                    alert('<?php echo _("Failed to save changes"); ?>: ' + err.message);
                });
        },
        openApp(app) {
            if (app.editing) return;
            window.location.href = '<?php echo $path; ?>app/view?name=' + encodeURIComponent(app.name);
        },
        toggleVisibility(app) {
            const newPublicValue = app.public ? 0 : 1;

            fetch('<?php echo $path; ?>app/setpublic?id=' + app.id + '&public=' + newPublicValue)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        app.public = newPublicValue;
                    } else {
                        throw new Error(data.message || '<?php echo _("Failed to update visibility."); ?>');
                    }
                })
                .catch(err => {
                    alert('<?php echo _("Failed to update visibility."); ?>: ' + err.message);
                });
        },
        deleteSelectedApps() {
            if (!this.selectedAppIds.length) return;

            const appCount = this.selectedAppIds.length;
            const confirmMessage = appCount === 1
                ? '<?php echo _("Are you sure you want to delete this app?"); ?>'
                : '<?php echo _("Are you sure you want to delete these apps?"); ?>';

            if (!confirm(confirmMessage)) return;

            Promise.all(this.selectedAppIds.map(appId => {
                return fetch('<?php echo $path; ?>app/remove?id=' + appId, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json());
            }))
            .then(results => {
                const allSuccessful = results.every(result => result && result.success);
                if (allSuccessful) {
                    this.selectedAppIds = [];
                    this.getApps();
                } else {
                    alert('<?php echo _("Failed to delete one or more apps."); ?>');
                }
            })
            .catch(() => {
                alert('<?php echo _("Failed to delete one or more apps."); ?>');
            });
        }
    }
}).mount('#app');
</script>