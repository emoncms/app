<?php global $path; ?>
<script src="<?php echo $path; ?>Lib/vue.min.js"></script>

<div style="padding:20px">

  <h2>Available Apps</h2>
  <p>Create a new instance of an app by clicking on one of the apps below.</p>

  <div id="available-apps">

    <p><b>Featured apps:</b></p>

    <div class="app-group">
      <div class="app-item" v-for="(app, index) in apps" :key="index" :app="index" v-if="app.primary">
        <div class="app-item-title">{{ app.title }}</div>
        <div class="app-item-description">{{ app.description || "no description..." }}</div>
      </div>
    </div>
    <br>

    <p><b>All apps:</b></p>

    <div class="app-group">
      <div class="app-item" v-for="(app, index) in apps" :key="index" :app="index" v-if="!app.primary">
        <div class="app-item-title">{{ app.title }}</div>
        <div class="app-item-description">{{ app.description || "no description..." }}</div>
      </div>
    </div>

  </div>

</div>

<!-------------------------------------------------------------------------------------------
  MODALS
-------------------------------------------------------------------------------------------->
<!-- GROUP CREATE -->
<div id="app-new-modal" class="modal hide" tabindex="-1" role="dialog" aria-labelledby="app-new-modal-label" aria-hidden="true" data-backdrop="static">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="app-new-modal-label">Please enter name for app</h3>
    </div>
    <div class="modal-body">

    <p>Enter a unique name for the app:<br>
    <input id="app-new-name" type="text"></p>

    </div>
    <div class="modal-footer">
        <button id="app-new-cancel" class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
        <button id="app-new-action" class="btn btn-primary">Create</button>
    </div>
</div>

<script>

var available_apps = JSON.parse('<?php echo json_encode($apps); ?>');
var selected_app = "";
var app_new_enable = true;


var app_list = new Vue({
    el: '#available-apps',
    data: {
        apps: available_apps
    }
});


$(function() {
    $(".app-group").each(function() { $(this).find(".app-item").first().css("border-top","1px solid #ccc"); });

    $(".app-item").click(function(){
        if (app_new_enable) {
            var app = $(this).attr("app");
            selected_app = app;
            $("#app-new-modal-label").html("Create app: "+available_apps[app].title);
            $("#app-new-name").val(available_apps[app].title);
            $('#app-new-modal').modal('show');
        }
    });

    $("#app-new-action").click(function(){
        app_new_enable = false;
        setTimeout(function(){ app_new_enable = true; }, 500);
        $('#app-new-modal').modal('hide');
        
        var app_name = $("#app-new-name").val();
        app_name =  app_name.replace(/\W/g, '');
        var nicename = escape(app_name).replace(/%20/g, "+");
        $.ajax({                                      
            url: path+"app/add?name="+nicename+"&app="+selected_app,
            dataType: 'json',
            async: true,
            success: function(result) {
                // console.log(result);
                window.location = path+"app/view?name="+nicename;
            }
        });
    });

    $("#app-new-cancel").click(function(){
        app_new_enable = false;
        setTimeout(function(){ app_new_enable = true; }, 500);
    });
})

</script>
