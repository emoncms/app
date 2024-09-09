<?php

require "myheatpump_api2.php";
require "/var/www/emoncms/Lib/load_emoncms.php";

require_once "Modules/app/app_model.php";

$settings['app'] = array();
$appconfig = new AppConfig($mysqli, $settings['app']);

$userid = 1;
$app_name = "Ecodan";
$public = false;

$app = $appconfig->get_app_or_default($userid,$app_name,$public);

require_once "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_model.php";
$myheatpump = new MyHeatPump($mysqli,$redis,$feed,$app);

$result = $myheatpump->process_daily($app->id,30);

print json_encode($result, JSON_PRETTY_PRINT);