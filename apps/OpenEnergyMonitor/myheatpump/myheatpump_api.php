<?php

function get_heatpump_stats($feed,$app,$start,$end,$starting_power) {

    // This first part fetches values for the last 365 days and the last 30 days
    // independently of the start and end times passed in the URL. The second part
    // specifically returns stats for the start and end times passed in the URL.

    $end_time = 0;
    $start_time = 0;
    if (isset($app->config->heatpump_elec_kwh)) {
        $elec_kwh_meta = $feed->get_meta($app->config->heatpump_elec_kwh);
        $end_time = $elec_kwh_meta->end_time;
        $start_time = $elec_kwh_meta->start_time;
    }
    if (isset($app->config->heatpump_heat_kwh)) {
        $heat_kwh_meta = $feed->get_meta($app->config->heatpump_heat_kwh);
        if ($heat_kwh_meta->end_time<$end_time) $end_time = $heat_kwh_meta->end_time;
        if ($heat_kwh_meta->start_time>$start_time) $start_time = $heat_kwh_meta->start_time;
    }
    
    if (isset($app->config->start_date) && $app->config->start_date>$start_time) {
        $start_time = $app->config->start_date*1;
    }
    
    $data_start = $start_time;
    

    $year_start_time = $start_time;
    $last30_start_time = $start_time;
    $year_ago = time() - 365*24*3600;
    $last30_ago = time() - 30*24*3600;
    if ($year_start_time<$year_ago) $year_start_time = $year_ago;
    if ($last30_start_time<$last30_ago) $last30_start_time = $last30_ago;

    $last365_elec_kwh = 0;
    $last30_elec_kwh = 0;
    if (isset($app->config->heatpump_elec_kwh)) {
        $end_value = $feed->get_value($app->config->heatpump_elec_kwh,$end_time);
        if ($year_start_time<$end_time) {
            $last365_elec_kwh = $end_value-$feed->get_value($app->config->heatpump_elec_kwh,$year_start_time);
        }
        if ($last30_start_time<$end_time) {
            $last30_elec_kwh = $end_value-$feed->get_value($app->config->heatpump_elec_kwh,$last30_start_time);
        }
    }
    $last365_heat_kwh = 0;
    $last30_heat_kwh = 0;
    if (isset($app->config->heatpump_heat_kwh)) {
        $end_value = $feed->get_value($app->config->heatpump_heat_kwh,$end_time);
        if ($year_start_time<$end_time) {
            $last365_heat_kwh = $end_value-$feed->get_value($app->config->heatpump_heat_kwh,$year_start_time);
        }
        if ($last30_start_time<$end_time) {
            $last30_heat_kwh = $end_value-$feed->get_value($app->config->heatpump_heat_kwh,$last30_start_time);
        }
    }

    // If no start and end times specificed in URL, return stats for the last 30 days available in the feeds

    if ($end==null || $start==null) {
        $end = $end_time;
        $start = $last30_start_time;
    } else {
        $timezone = 'Europe/London';
        $start = convert_time($start,$timezone);
        $end = convert_time($end,$timezone);
                
        if ($end<=$start) return array('success'=>false, 'message'=>"Request end time before start time");
    }

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
    
    if ($start<$end) {
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
    } else {
        $elec_data = array();
        $heat_data = array();
        $outsideT_data = array();
        $returnT_data = array();
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
    
    $elec_null_count = 0;
    $heat_null_count = 0;
    $flow_null_count = 0;
    $return_null_count = 0;
    $outside_null_count = 0;
    
    $count = 0;
    
    for ($z=0; $z<count($elec_data); $z++) {
        $time = $start + $z*$interval;
        
        if ($time>$start_time) {
             
            if (!is_null($elec_data[$z])) {
                $elec = $elec_data[$z];
            } else {
                $elec_null_count++;
            }
            
            if ($heat_data && !is_null($heat_data[$z])) {
                $heat = $heat_data[$z];        
            } else {
                $heat_null_count++;
            }
            
            if (!is_null($flowT_data[$z])) {
                $flowT = $flowT_data[$z];
            } else {
                $flow_null_count++;
            }
            
            if ($returnT_data && !is_null($returnT_data[$z])) {
                $returnT = $returnT_data[$z];
            } else {
                $return_null_count++;
            }
            
            if ($outsideT_data && !is_null($outsideT_data[$z])) {
                $ambientT = $outsideT_data[$z];
            } else {
                $outside_null_count++;
            }
                
            if ($time<$elec_meta->end_time) {
                
                $elec_kwh += $elec * $interval / 3600000.0;
                $heat_kwh += $heat * $interval / 3600000.0;           
                
                $carnot_A = $flowT+$condensing_offset+273;
                $carnot_B = ($flowT+$condensing_offset+273) - ($ambientT+$evaporator_offset+273);
                if ($carnot_B!=0) {
                    $carnot_COP = $carnot_A / $carnot_B;
                } else {
                    $carnot_COP = 0;
                }

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
        } else {
            $elec_null_count++;
            $heat_null_count++;
            $flow_null_count++;
            $return_null_count++;
            $outside_null_count++;
        }
    }
    if ($running_count>0) {
        $elec_mean = $elec_sum/$running_count;
        $heat_mean = $heat_sum/$running_count;
        $ideal_carnot_heat_mean = $ideal_carnot_heat_sum / $running_count;
        $prc_of_carnot = (100 * $heat_mean / $ideal_carnot_heat_mean);
        
        $when_running_flowT = $flowT_sum / $running_count;
        $when_running_returnT = $returnT_sum / $running_count;
        $when_running_dT = $dT_sum / $running_count;
        $when_running_outsideT = $outside_sum / $running_count;
        $when_running_flow_minus_outside = $flow_minus_outside_sum / $running_count;
    } else {
        $elec_mean = 0;
        $heat_mean = 0;
        $ideal_carnot_heat_mean = 0;
        $prc_of_carnot = 0;
        $when_running_flowT = 0;
        $when_running_returnT = 0;
        $when_running_dT = 0;
        $when_running_outsideT = 0;
        $when_running_flow_minus_outside = 0;
    }
    $count = count($elec_data);
    
    $running_COP = 0;
    if ($elec_kwh_running>0) {
        $running_COP = $heat_kwh_running/$elec_kwh_running;
    }
    
    $full_period_cop = 0;
    if ($elec_kwh!=0) {
        $full_period_cop = $heat_kwh / $elec_kwh;
    }
    
    $last365_cop = 0;
    if ($last365_elec_kwh!=0) {
        $last365_cop = $last365_heat_kwh / $last365_elec_kwh;
    }

    $last30_cop = 0;
    if ($last30_elec_kwh!=0) {
        $last30_cop = $last30_heat_kwh / $last30_elec_kwh;
    }
    
    $quality_elec = 0;
    $quality_heat = 0;
    $quality_flow = 0;
    $quality_return = 0;
    $quality_outside = 0;
    
    if ($count) {
        $quality_elec = round(100*(1-($elec_null_count / $count)));
        $quality_heat = round(100*(1-($heat_null_count / $count)));
        $quality_flow = round(100*(1-($flow_null_count / $count)));
        $quality_return = round(100*(1-($return_null_count / $count)));
        $quality_outside = round(100*(1-($outside_null_count / $count)));
    }
    
    $data_length_start = $start;
    if ($data_start>$start) $data_length_start = $data_start;
    $full_period_data_length = $end - $data_length_start;
    if ($full_period_data_length<0) $full_period_data_length = 0;
    
    
    $last365_data_length = $end_time - $year_start_time;
    $last30_data_length = $end_time - $last30_start_time;
    
    $result = [
      "start"=>(int)$start,
      "end"=>(int)$end,
      "interval"=>(int)$interval,
      "datapoints"=>count($elec_data),
      "full_period"=>[
        "elec_kwh"=>number_format($elec_kwh,3,'.','')*1,
        "heat_kwh"=>number_format($heat_kwh,3,'.','')*1,
        "cop"=>number_format($full_period_cop,2,'.','')*1,
        "data_length"=>$full_period_data_length
      ],
      "standby_threshold"=>$starting_power,
      "standby_kwh"=>number_format($standby_kwh,3,'.','')*1,
      "when_running"=>[
        "elec_kwh"=>number_format($elec_kwh_running,3,'.','')*1,
        "heat_kwh"=>number_format($heat_kwh_running,3,'.','')*1,
        "cop"=>number_format($running_COP,2,'.','')*1,
        "elec_W"=>number_format($elec_mean,0,'.','')*1,
        "heat_W"=>number_format($heat_mean,0,'.','')*1,
        "flowT"=>number_format($when_running_flowT,2,'.','')*1,
        "returnT"=>number_format($when_running_returnT,2,'.','')*1,
        "flow_minus_return"=>number_format($when_running_dT,2,'.','')*1,
        "outsideT"=>number_format($when_running_outsideT,2,'.','')*1,
        "flow_minus_outside"=>number_format($when_running_flow_minus_outside,2,'.','')*1,
        "carnot_prc"=>number_format($prc_of_carnot,2,'.','')*1
      ],
      "last365"=>[
        "elec_kwh"=>number_format($last365_elec_kwh,3,'.','')*1,
        "heat_kwh"=>number_format($last365_heat_kwh,3,'.','')*1,
        "cop"=>number_format($last365_cop,2,'.','')*1,
        "since"=>$year_start_time,
        "data_length"=>$last365_data_length
      ],
      "last30"=>[
        "elec_kwh"=>number_format($last30_elec_kwh,3,'.','')*1,
        "heat_kwh"=>number_format($last30_heat_kwh,3,'.','')*1,
        "cop"=>number_format($last30_cop,2,'.','')*1,
        "since"=>$last30_start_time,
        "data_length"=>$last30_data_length
      ],
      "quality_elec"=>$quality_elec,
      "quality_heat"=>$quality_heat,
      "quality_flow"=>$quality_flow,
      "quality_return"=>$quality_return,
      "quality_outside"=>$quality_outside,
      "data_start"=>$data_start
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
