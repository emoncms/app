<?php

function get_heatpump_stats($feed,$app,$start,$end,$starting_power) {

    $timezone = 'Europe/London';
    $start = convert_time($start,$timezone);
    $end = convert_time($end,$timezone);
            
    if ($end<=$start) return array('success'=>false, 'message'=>"Request end time before start time");

    $period = $end-$start;
    if ($period<=3600*24*7) {
        $interval = 10;
    } else if ($period<=3600*24*14) {
        $interval = 20;
    } else if ($period<=3600*24*21) {
        $interval = 30;
    } else if ($period<=3600*24*42) {
        $interval = 60;
    } else if ($period<=3600*24*90) {
        $interval = 120;
    } else {
        return array('success'=>false, 'message'=>"period to large");
    } 



    if (!isset($app->config->heatpump_flowT) || $app->config->heatpump_flowT<1) return array('success'=>false, 'message'=>"Missing flow temperature feed");
    if (!isset($app->config->heatpump_elec) || $app->config->heatpump_elec<1) return array('success'=>false, 'message'=>"Missing electricity consumption feed");
        
    $elec_meta = $feed->get_meta($app->config->heatpump_elec);
    $elec_data = $feed->get_data($app->config->heatpump_elec,$start,$end,$interval,1,"UTC","notime",false,0,0,false);
    $flowT_data = $feed->get_data($app->config->heatpump_flowT,$start,$end,$interval,1,"UTC","notime",false,0,0,false);

    $returnT_data = false;
    if (isset($app->config->heatpump_returnT) && $app->config->heatpump_returnT>0) {
        $returnT_data = $feed->get_data($app->config->heatpump_returnT,$start,$end,$interval,1,"UTC","notime",false,0,0,false);
    }
  
    $outsideT_data = false;
    if (isset($app->config->heatpump_outsideT) && $app->config->heatpump_outsideT>0) {
        $outsideT_data = $feed->get_data($app->config->heatpump_outsideT,$start,$end,$interval,1,"UTC","notime",false,0,0,false);
    }
    
    $heat_data = false;
    if (isset($app->config->heatpump_heat) && $app->config->heatpump_heat>0) {
        $heat_data = $feed->get_data($app->config->heatpump_heat,$start,$end,$interval,1,"UTC","notime",false,0,0,false);
    }
    
    $condensing_offset = 4;
    $evaporator_offset = -6;
    
    // Carnot COP simulator
    $ideal_carnot_heat_sum = 0;
                
    $flowT = 0;
    $returnT = 0;
    $ambientT = 0;
    $elec = 0;
    $heat = 0;
    
    $flowT_sum = 0;
    $returnT_sum = 0;
    $elec_sum = 0;
    $heat_sum = 0;
    $outside_sum = 0;
    $flow_minus_outside_sum = 0;
    $dT_sum = 0;
    $running_count = 0;
    
    $elec_kwh = 0;
    $heat_kwh = 0;
    $standby_kwh = 0;

    $elec_kwh_running = 0;
    $heat_kwh_running = 0;
    
    for ($z=0; $z<count($elec_data); $z++) {
        $time = $start + $z*$interval;
        if ($time<$elec_meta->end_time) {
            
            if (!is_null($elec_data[$z])) $elec = $elec_data[$z];
            if ($heat_data && !is_null($heat_data[$z])) $heat = $heat_data[$z];        
            if (!is_null($flowT_data[$z])) $flowT = $flowT_data[$z];
            if ($returnT_data && !is_null($returnT_data[$z])) $returnT = $returnT_data[$z];
            if ($outsideT_data && !is_null($outsideT_data[$z])) $ambientT = $outsideT_data[$z];
            
            $elec_kwh += $elec * $interval / 3600000.0;
            $heat_kwh += $heat * $interval / 3600000.0;           
            
            $carnot_COP = (($flowT+$condensing_offset+273) / (($flowT+$condensing_offset+273) - ($ambientT+$evaporator_offset+273)));
            
            $ideal_carnot_heat = $elec * $carnot_COP;
            if ($returnT>$flowT) {
                $ideal_carnot_heat *= -1;
            }
            
            if ($elec>=$starting_power) {
                $flowT_sum += $flowT;
                $returnT_sum += $returnT;
                $elec_sum += $elec;
                $heat_sum += $heat;
                $dT_sum += ($flowT-$returnT);
                $outside_sum += $ambientT;
                $flow_minus_outside_sum += ($flowT-$ambientT);
                $ideal_carnot_heat_sum += $ideal_carnot_heat;
                $running_count++;
                
                $elec_kwh_running += $elec * $interval / 3600000.0; 
                $heat_kwh_running += $heat * $interval / 3600000.0; 
            } else {
                $standby_kwh += $elec * $interval / 3600000.0; 
            }
        }
    }
    $elec_mean = $elec_sum/$running_count;
    $heat_mean = $heat_sum/$running_count;
    $ideal_carnot_heat_mean = $ideal_carnot_heat_sum / $running_count;
    $prc_of_carnot = (100 * $heat_mean / $ideal_carnot_heat_mean);
    

    $result = [
      "start"=>(int)$start,
      "end"=>(int)$end,
      "interval"=>(int)$interval,
      "datapoints"=>count($elec_data),
      "full_period"=>[
        "elec_kwh"=>number_format($elec_kwh,3,'.','')*1,
        "heat_kwh"=>number_format($heat_kwh,3,'.','')*1,
        "cop"=>number_format($heat_kwh/$elec_kwh,2,'.','')*1
      ],
      "standby_threshold"=>$starting_power,
      "standby_kwh"=>number_format($standby_kwh,3,'.','')*1,
      "when_running"=>[
        "elec_kwh"=>number_format($elec_kwh_running,3,'.','')*1,
        "heat_kwh"=>number_format($heat_kwh_running,3,'.','')*1,
        "cop"=>number_format($heat_kwh_running/$elec_kwh_running,2,'.','')*1,
        "elec_W"=>number_format($elec_mean,0,'.','')*1,
        "heat_W"=>number_format($heat_mean,0,'.','')*1,
        "flowT"=>number_format($flowT_sum/$running_count,2,'.','')*1,
        "returnT"=>number_format($returnT_sum/$running_count,2,'.','')*1,
        "flow_minus_return"=>number_format($dT_sum/$running_count,2,'.','')*1,
        "outsideT"=>number_format($outside_sum/$running_count,2,'.','')*1,
        "flow_minus_outside"=>number_format($flow_minus_outside_sum/$running_count,2,'.','')*1,
        "carnot_prc"=>number_format($prc_of_carnot,2,'.','')*1
      ]
    ];

    if (!$heat_data) {
      $result["full_period"]["heat_kwh"] = false;
      $result["when_running"]["heat_kwh"] = false;
      $result["when_running"]["heat_W"] = false;
      $result["when_running"]["carnot_prc"] = false;
    }
    
    if (!$outsideT_data) {
      $result["when_running"]["outsideT"] = false;
      $result["when_running"]["flow_minus_outside"] = false;
      $result["when_running"]["carnot_prc"] = false;
    }

    if (!$returnT_data) {
      $result["when_running"]["returnT"] = false;
      $result["when_running"]["flow_minus_return"] = false;
      $result["when_running"]["carnot_prc"] = false;
    }
    
    return $result;
}

function convert_time($time,$timezone) {
    // Option to specify times as date strings
    if (!is_numeric($time)) {
        $date = new DateTime();
        $date->setTimezone(new DateTimeZone($timezone));
        $date->modify($time);
        $date->modify('midnight');
        $time = $date->getTimestamp();
    }    
    
    // If timestamp is in milliseconds convert to seconds
    if (($time/1000000000)>100) {
        $time *= 0.001;
    }
    return $time;
}
