<?php

$schema['myheatpump_daily_stats'] = array(
    
    // App ID (On heatpumpmonitor.org this is the system ID)
    'id' => array('type' => 'int(11)'),
    
    // Start of day timestamp
    'timestamp' => array('type' => 'int(11)'),
    
    // Full period stats
    'combined_elec_kwh' => array('type' => 'float', 'name'=>'Electricity consumption', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>'kWh'),
    'combined_heat_kwh' => array('type' => 'float', 'name'=>'Heat output', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>'kWh'),
    'combined_cop' => array('type' => 'float', 'name'=>'COP', 'heading'=>"COP", 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>''),
    'combined_data_length' => array('type' => 'float', 'name'=>'Data length', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>''),
    'combined_elec_mean' => array('type' => 'float', 'name'=>'Elec mean', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>'W'),
    'combined_heat_mean' => array('type' => 'float', 'name'=>'Heat mean', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>'W'),
    'combined_flowT_mean' => array('type' => 'float', 'name'=>'FlowT mean', 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>'°C'),
    'combined_returnT_mean' => array('type' => 'float', 'name'=>'ReturnT mean', 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>'°C'),
    'combined_outsideT_mean' => array('type' => 'float', 'name'=>'OutsideT mean', 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>'°C'),
    'combined_roomT_mean' => array('type' => 'float', 'name'=>'RoomT mean', 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>'°C'),
    'combined_prc_carnot' => array('type' => 'float', 'name'=>'% Carnot', 'group'=>'Stats: Combined', 'dp'=>1, 'unit'=>'%'),
    'combined_cooling_kwh' => array('type' => 'float', 'name'=>'Cooling energy', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>'kWh'),
    'combined_starts' => array('type' => 'float', 'name'=>'Starts', 'group'=>'Stats: Combined', 'dp'=>0, 'unit'=>''),
    'combined_starts_per_hour' => array('type' => 'float', 'name'=>'Starts per hour', 'group'=>'Stats: Combined', 'dp'=>2, 'unit'=>''),
    
    // When Running
    'running_elec_kwh' => array('type' => 'float', 'name'=>'Electricity consumption', 'group'=>'Stats: When Running', 'dp'=>0, 'unit'=>'kWh'),
    'running_heat_kwh' => array('type' => 'float', 'name'=>'Heat output', 'group'=>'Stats: When Running', 'dp'=>0, 'unit'=>'kWh'),
    'running_cop' => array('type' => 'float', 'name'=>'COP', 'heading'=>"Running<br>COP", 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>''),
    'running_data_length' => array('type' => 'float', 'name'=>'Data length', 'group'=>'Stats: When Running', 'dp'=>0, 'unit'=>''),
    'running_elec_mean' => array('type' => 'float', 'name'=>'Elec mean', 'group'=>'Stats: When Running', 'dp'=>0, 'unit'=>'W'),
    'running_heat_mean' => array('type' => 'float', 'name'=>'Heat mean', 'group'=>'Stats: When Running', 'dp'=>0, 'unit'=>'W'),
    'running_flowT_mean' => array('type' => 'float', 'name'=>'FlowT mean', 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>'°C'),
    'running_returnT_mean' => array('type' => 'float', 'name'=>'ReturnT mean', 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>'°C'),
    'running_outsideT_mean' => array('type' => 'float', 'name'=>'OutsideT mean', 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>'°C'),
    'running_roomT_mean' => array('type' => 'float', 'name'=>'RoomT mean', 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>'°C'),
    'running_prc_carnot' => array('type' => 'float', 'name'=>'% Carnot', 'group'=>'Stats: When Running', 'dp'=>1, 'unit'=>'%'),
    
    // Space heating
    'space_elec_kwh' => array('type' => 'float', 'name'=>'Electricity consumption', 'group'=>'Stats: Space heating', 'dp'=>0, 'unit'=>'kWh'),
    'space_heat_kwh' => array('type' => 'float', 'name'=>'Heat output', 'group'=>'Stats: Space heating', 'dp'=>0, 'unit'=>'kWh'),
    'space_cop' => array('type' => 'float', 'name'=>'COP', 'heading'=>"Space<br>COP", 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>''),
    'space_data_length' => array('type' => 'float', 'name'=>'Data length', 'group'=>'Stats: Space heating', 'dp'=>0, 'unit'=>''),
    'space_elec_mean' => array('type' => 'float', 'name'=>'Elec mean', 'group'=>'Stats: Space heating', 'dp'=>0, 'unit'=>'W'),
    'space_heat_mean' => array('type' => 'float', 'name'=>'Heat mean', 'group'=>'Stats: Space heating', 'dp'=>0, 'unit'=>'W'),
    'space_flowT_mean' => array('type' => 'float', 'name'=>'FlowT mean', 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>'°C'),
    'space_returnT_mean' => array('type' => 'float', 'name'=>'ReturnT mean', 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>'°C'),
    'space_outsideT_mean' => array('type' => 'float', 'name'=>'OutsideT mean', 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>'°C'),
    'space_roomT_mean' => array('type' => 'float', 'name'=>'RoomT mean', 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>'°C'),
    'space_prc_carnot' => array('type' => 'float', 'name'=>'% Carnot', 'group'=>'Stats: Space heating', 'dp'=>1, 'unit'=>'%'),
        
    // Water heating
    'water_elec_kwh' => array('type' => 'float', 'name'=>'Electricity consumption', 'group'=>'Stats: Water heating', 'dp'=>0, 'unit'=>'kWh'),
    'water_heat_kwh' => array('type' => 'float', 'name'=>'Heat output', 'group'=>'Stats: Water heating', 'dp'=>0, 'unit'=>'kWh'),
    'water_cop' => array('type' => 'float', 'name'=>'COP', 'heading'=>"DHW", 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>''),
    'water_data_length' => array('type' => 'float', 'name'=>'Data length', 'group'=>'Stats: Water heating', 'dp'=>0, 'unit'=>''),
    'water_elec_mean' => array('type' => 'float', 'name'=>'Elec mean', 'group'=>'Stats: Water heating', 'dp'=>0, 'unit'=>'W'),
    'water_heat_mean' => array('type' => 'float', 'name'=>'Heat mean', 'group'=>'Stats: Water heating', 'dp'=>0, 'unit'=>'W'),
    'water_flowT_mean' => array('type' => 'float', 'name'=>'FlowT mean', 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>'°C'),
    'water_returnT_mean' => array('type' => 'float', 'name'=>'ReturnT mean', 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>'°C'),
    'water_outsideT_mean' => array('type' => 'float', 'name'=>'OutsideT mean', 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>'°C'),
    'water_roomT_mean' => array('type' => 'float', 'name'=>'RoomT mean', 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>'°C'),
    'water_prc_carnot' => array('type' => 'float', 'name'=>'% Carnot', 'group'=>'Stats: Water heating', 'dp'=>1, 'unit'=>'%'),

    // from energy feeds
    'from_energy_feeds_elec_kwh' => array('type' => 'float', 'name'=>'Electricity consumption', 'group'=>'From energy feeds', 'dp'=>0, 'unit'=>'kWh'),
    'from_energy_feeds_heat_kwh' => array('type' => 'float', 'name'=>'Heat output', 'group'=>'From energy feeds', 'dp'=>0, 'unit'=>'kWh'),
    'from_energy_feeds_cop' => array('type' => 'float', 'name'=>'COP', 'group'=>'From energy feeds', 'dp'=>1, 'unit'=>''),
    
    // Quality
    'quality_elec' => array('type' => 'float', 'name'=>'Quality elec', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),
    'quality_heat' => array('type' => 'float', 'name'=>'Quality heat', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),
    'quality_flowT' => array('type' => 'float', 'name'=>'Quality flowT', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),
    'quality_returnT' => array('type' => 'float', 'name'=>'Quality returnT', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),
    'quality_outsideT' => array('type' => 'float', 'name'=>'Quality outsideT', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),
    'quality_roomT' => array('type' => 'float', 'name'=>'Quality roomT', 'group'=>'Quality', 'dp'=>1, 'unit'=>'%'),

    // Unit rates
    'unit_rate_agile' => array('type' => 'float', 'name'=>'Unit rate agile', 'group'=>'Unit rates', 'dp'=>1, 'unit'=>'p/kWh'),
    'unit_rate_cosy' => array('type' => 'float', 'name'=>'Unit rate cosy', 'group'=>'Unit rates', 'dp'=>1, 'unit'=>'p/kWh'),
    'unit_rate_go' => array('type' => 'float', 'name'=>'Unit rate GO', 'group'=>'Unit rates', 'dp'=>1, 'unit'=>'p/kWh')


);