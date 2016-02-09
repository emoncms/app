<?php
    $domain = "messages";
    bindtextdomain($domain, dirname(__FILE__)."/locale");
    global $session, $user;
    $apikey = "";
    $lang = substr($user->get_lang($session['userid']),0,2);
    global $path, $user;
    $apikey = $_GET['apikey'];
    $lang = (isset($_GET["lang"])) ? strtolower(substr($_GET['lang'], 0, 2)) : 'en';
    $modpath = $path."Modules/app"
?>

<script>
    var path = "<?php print $path; ?>";
    var modpath = "<?php print $modpath; ?>";
    var apikey = "<?php print $apikey; ?>";
    var lang = "<?php print $lang; ?>";
    apikeystr = (apikey !== "") ? "&apikey="+apikey : "";
</script>

<link href="<?php echo $modpath; ?>/style.css" rel="stylesheet">
<script type="text/javascript" src="<?php echo $modpath; ?>/app.js"></script>

<div class="container">
  <h2><?php echo _("Missing table error") ?></h2>
  <!-- Trigger the modal with a button -->
  <button type="button" class="btn btn-warning btn-lg" data-toggle="modal" data-target="#myModal"><?php echo _("App module needs a configuration table") ?></button>

  <!-- Modal -->
  <div class="modal fade type-danger" id="myModal" role="dialog">
    <div class="modal-dialog">

      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header  modal-header-danger">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title"><?php echo _("App module needs a configuration table") ?></h4>
        </div>
        <div class="modal-body type-danger">
          <p><?php echo _("Use the administration tools to update your database and add the missing table")?>.</p>
          <a href= "admin/db" class="btn btn-primary" name="button"><?php echo _("Administration") ?></a>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo _("Close") ?></button>
        </div>
      </div>

    </div>
  </div>

</div>
<script>
    $( document ).ready(function() {
        $("#myModal").modal("show")
    });
</script>
