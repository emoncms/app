<?php
/*
  Start and End fields shown in place of the time bar by its date window switch.
  Include after div#graph-nav. Needs Lib/js/DateTimePicker.js and
  Theme/css/datetimepicker.css.
*/
defined('EMONCMS_EXEC') or die('Restricted access');
?>
<div id="graph-nav-manual" class="app-navbar d-none">
    <div class="input-group w-auto">
        <span class="input-group-text"><?php echo tr('Start') ?></span>
        <input id="request-start" class="form-control" type="text" placeholder="YYYY-MM-DD HH:MM:SS" />
    </div>
    <div class="input-group w-auto">
        <span class="input-group-text"><?php echo tr('End') ?></span>
        <input id="request-end" class="form-control" type="text" placeholder="YYYY-MM-DD HH:MM:SS" />
    </div>
    <div class="btn-group app-timebar">
        <button id="time-manual-close" class="btn" title="<?php echo tr('Done') ?>"><i class="icon-ok icon-white"></i></button>
    </div>
</div>
