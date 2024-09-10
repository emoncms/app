<?php

    $schema['app'] = array(
        // unique id for the app
        'id' => array('type' => 'int(11)', 'Null'=>false, 'Key'=>'PRI', 'Extra'=>'auto_increment'),
        // app name
        'app' => array('type' => 'varchar(255)'),
        // userid of the owner of the app
        'userid' => array('type' => 'int(11)'),
        // name of the app
        'name' => array('type' => 'varchar(255)'),
        // public flag
        'public' => array('type' => 'tinyint(1)', 'default'=>0),
        // config json
        'config' => array('type' => 'text')
    );

    $schema['app_config'] = array(
        'userid' => array('type' => 'int(11)'),
        'data' => array('type' => 'text')
    );

    // Include app schema
    require_once "apps/OpenEnergyMonitor/myheatpump/myheatpump_schema.php";