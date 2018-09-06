<div class="graph-header">
    <div class="title grow"><?php echo "HISTORY"; ?></div>
    <div class="action power history" style="display:none;"><?php echo "VIEW ENERGY"; ?></div>
    <div class="action power time" data-days='1' data-text='day' style="display:none;"><?php echo "DAY"; ?></div>
    <div class="action energy power time" data-days='7' data-text='week'><?php echo "WEEK"; ?></div>
    <div class="action energy power time" data-days='30' data-text='month'><?php echo "MONTH"; ?></div>
    <div class="action energy time" data-text='all'><?php echo "ALL TIME"; ?></div>
    <div class="action power zoom-in" style="display:none;"><span class="icon-plus icon-white"></span></div>
    <div class="action power zoom-out" style="display:none;"><span class="icon-minus icon-white"></span></div>
    <div class="action power pan-left" style="display:none;"><span class="icon-chevron-left icon-white"></span></div>
    <div class="action power pan-right" style="display:none;"><span class="icon-chevron-right icon-white"></span></div>
</div>

<div class="graph-body">
    <div class="graph"></div>
    <div class="graph-loader ajax-loader" style="display:none;"></div>
</div>

<div class="graph-footer">
    <div class="graph-info">
        <div>
            <span class="window energy">
                <span><?php echo "Average in window:"; ?></span>
            </span>
        </div>
        <div>
            <span class="window power hide">
                <span><?php echo "Energy in window:"; ?></span>
            </span>
        </div>
        <div>
            <span class="window info">
                <b><span id="window-cons"></span></b> <span style="padding-right:20px;"><?php echo "consumed"; ?></span>
            </span>
        </div>
        <div>
            <span class="window generation hide">
                <b><span id="window-gen"></span></b> <span style="padding-right:20px;"><?php echo "generated"; ?></span>
            </span>
        </div>
        <div>
            <span class="window self hide">
                <b><span id="window-selfcons"></span></b> <span style="padding-right:20px;"><?php echo "self-consumed"; ?></span>
            </span>
        </div>
        <div>
            <span class="window self hide" >
                <b><span id="window-selfsuff"></span></b> <span style="padding-right:20px;"><?php echo "self-sufficient"; ?></span>
            </span>
        </div>
        <div class="window grow"></div>
        <div class='window power action details' style="display:none;">
            <span><?php echo "SHOW DETAILS"; ?></span>
        </div>
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
