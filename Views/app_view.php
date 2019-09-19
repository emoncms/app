<?php global $path; ?>

<div style="padding:20px">

  <h2>Available Apps</h2>
  <p>Create a new instance of an app by clicking on one of the apps below.</p>

  <div id="available-apps"></div>

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

var out = "";
for (var z in available_apps) {
    if (available_apps[z].description=="") 
        available_apps[z].description = "no description...";
    out += '<div class="app-item" app="'+z+'">';
    var status = "";
    if (available_apps[z].status!="") status = available_apps[z].status+": ";
    out += '<div class="app-item-title">'+status+available_apps[z].title+'</div>';
    out += '<div class="app-item-description">'+available_apps[z].description+'</div>';
    out += '</div>';
}
$(function() {
    $("#available-apps").html(out);
    $(".app-item").first().css("border-top","1px solid #ccc");

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
        var nicename = escape($("#app-new-name").val()).replace(/%20/g, "+");
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
