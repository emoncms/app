<div class="graph-header">
    <div class="title grow"><?php echo "HISTORY"; ?></div>
    <div class="action power history" style="display: none"><?php echo "VIEW ENERGY"; ?></div>
    <div class="action power time" data-days='1' data-text='day' style="display: none"><?php echo "DAY"; ?></div>
    <div class="action energy power time" data-days='7' data-text='week'><?php echo "WEEK"; ?></div>
    <div class="action energy power time" data-days='30' data-text='month'><?php echo "MONTH"; ?></div>
    <div class="action energy time" data-text='all'><?php echo "ALL TIME"; ?></div>
    <div class="action power zoom-in" style="display: none"><span class="icon-plus icon-white"></div>
    <div class="action power zoom-out" style="display: none"><span class="icon-minus icon-white"></div>
    <div class="action power pan-left" style="display: none"><span class="icon-chevron-left icon-white"></div>
    <div class="action power pan-right" style="display: none"><span class="icon-chevron-right icon-white"></div>
</div>

<div class="graph-body">
    <div class="graph"></div>
</div>

<div class="graph-footer">
    <div class="graph-info" style="display:none">
        <div class="energy grow">
            <?php echo "kWh in window: "; ?><b id="window-kwh"></b> <b id="window-cost"></b>
        </div>
        <div class='action details'><?php echo "SHOW DETAILS"; ?></div>
    </div>
    <div class="graph-stats" style="display:none">
        <table class="table">
            <tr>
                <th></th>
                <th style="text-align:center"><?php echo "Min"; ?></th>
                <th style="text-align:center"><?php echo "Max"; ?></th>
                <th style="text-align:center"><?php echo "Diff"; ?></th>
                <th style="text-align:center"><?php echo "Mean"; ?></th>
                <th style="text-align:center"><?php echo "StDev"; ?></th>
            </tr>
            <tbody id="graph-stats"></tbody>
        </table>
    </div>
</div>
