<?php
/*
  Time bar for the compact app layout, as the graph module: range select, date
  window switch, zoom, pan and Now, then the window dates. Include inside
  div#graph-nav.app-navbar, and Lib/timebar_manual.php after it.
  Set $timebar_ranges (hours => label) before the include to change the list.
  On phones the Power and Daily toggle (.viewmode-toggle in the same row) folds
  into a button at the end of the time bar.
  Behaviour: timebar_update, timebar_manual and timebar_now in Lib/vis.helper.js.
*/
defined('EMONCMS_EXEC') or die('Restricted access');

if (!isset($timebar_ranges)) {
    $timebar_ranges = array(
        1 => tr('1 hour'),
        3 => tr('3 hours'),
        6 => tr('6 hours'),
        24 => tr('24 hours'),
        168 => tr('1 week'),
        720 => tr('1 month'),
        8760 => tr('1 year')
    );
}
?>
<div class="btn-group app-timebar">
    <select id="time-select" class="btn" title="<?php echo tr('Time range') ?>">
        <option id="time-custom" value="" hidden></option>
        <?php foreach ($timebar_ranges as $hours => $label) { ?>
        <option value="<?php echo $hours ?>"><?php echo $label ?></option>
        <?php } ?>
    </select>
    <button id="time-manual-open" class="btn" title="<?php echo tr('Select time window') ?>"><i class="icon-resize-horizontal"></i></button>
    <button id="zoomin" class="btn" title="<?php echo tr('Zoom in') ?>"><i class="svg-icon-zoom_in"></i></button>
    <button id="zoomout" class="btn" title="<?php echo tr('Zoom out') ?>"><i class="svg-icon-zoom_out"></i></button>
    <button id="left" class="btn" title="<?php echo tr('Earlier') ?>"><i class="svg-icon-pan_left"></i></button>
    <button id="right" class="btn" title="<?php echo tr('Later') ?>"><i class="svg-icon-pan_right"></i></button>
    <button id="time-now" class="btn" title="<?php echo tr('Move the window to now') ?>" style="display:none"><span class="app-now-text"><?php echo tr('Now') ?></span><i class="svg-icon-pan_end"></i></button>
    <button class="btn app-view-switch" title="<?php echo tr('Switch between power and daily view') ?>"><i class="svg-icon-bar_chart"></i><i class="svg-icon-show_chart"></i></button>
</div>
<span id="window-label" class="app-window-text"></span>
