<div class="app-bar graph-header">
    <div class="app-bar-title"><?php echo "HISTORY"; ?></div>
    <button class="app-bar-btn power history" style="display:none"><?php echo "VIEW ENERGY"; ?></button>
    <button class="app-bar-btn power time" data-days='1' data-text='day' style="display:none"><?php echo "DAY"; ?></button>
    <button class="app-bar-btn energy power time" data-days='7' data-text='week'><?php echo "WEEK"; ?></button>
    <button class="app-bar-btn energy power time" data-days='30' data-text='month'><?php echo "MONTH"; ?></button>
    <button class="app-bar-btn energy time" data-text='all'><?php echo "ALL TIME"; ?></button>
    <button class="app-bar-btn power zoom-in" title="Zoom in" style="display:none">+</button>
    <button class="app-bar-btn power zoom-out" title="Zoom out" style="display:none">-</button>
    <button class="app-bar-btn power pan-left" title="Scroll left" style="display:none">&lt;</button>
    <button class="app-bar-btn power pan-right" title="Scroll right" style="display:none">&gt;</button>
</div>

<div class="app-block-body graph-body position-relative">
    <div class="graph"></div>
    <div class="graph-loader ajax-loader" style="display:none"></div>
</div>

<div class="app-block-foot graph-footer">
    <div class="graph-info d-flex flex-wrap align-items-center gap-3">
        <span class="window energy"><?php echo "Average in window:"; ?></span>
        <span class="window power hide"><?php echo "Energy in window:"; ?></span>
        <span class="window info"><b id="window-cons"></b> <?php echo "consumed"; ?></span>
        <span class="window generation hide"><b id="window-gen"></b> <?php echo "generated"; ?></span>
        <span class="window self hide"><b id="window-selfcons"></b> <?php echo "self-consumed"; ?></span>
        <span class="window self hide"><b id="window-selfsuff"></b> <?php echo "self-sufficient"; ?></span>
        <button class="nav-link ms-auto window power details" style="display:none"><?php echo "SHOW DETAIL"; ?></button>
    </div>
</div>

<div class="app-block-body graph-stats" style="display:none">
    <table class="table mb-0">
        <tr>
            <th></th>
            <th class="text-center"><?php echo "Min"; ?></th>
            <th class="text-center"><?php echo "Max"; ?></th>
            <th class="text-center"><?php echo "Diff"; ?></th>
            <th class="text-center"><?php echo "Mean"; ?></th>
            <th class="text-center"><?php echo "StDev"; ?></th>
        </tr>
        <tbody id="graph-stats"></tbody>
    </table>
</div>
