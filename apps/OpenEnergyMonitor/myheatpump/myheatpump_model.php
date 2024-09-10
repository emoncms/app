<?php

class MyHeatPump {

    private $mysqli;
    private $redis;
    private $feed;
    private $appconfig;
    private $schema;

    // constructor
    function __construct($mysqli,$redis,$feed,$appconfig) {
        $this->mysqli = $mysqli;
        $this->redis = $redis;
        $this->feed = $feed;
        $this->appconfig = $appconfig;

        // Load schema
        $schema = array();
        require "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_schema.php";
        $schema['myheatpump_daily_stats'] = $this->populate_codes($schema['myheatpump_daily_stats']);
        $this->schema = $schema;
    }

    /**
     * Get daily data range from myheatpump_daily_stats table
     * 
     * @param int $id - app id
     * @return array start, end
     */
    public function get_daily_range($id) {
        $id = (int) $id;

        $result = $this->mysqli->query("SELECT MIN(`timestamp`) AS `start`, MAX(`timestamp`) AS `end` FROM myheatpump_daily_stats WHERE `id`='$id'");
        $row = $result->fetch_object();

        $days = ($row->end - $row->start) / 86400;

        return array("start"=>$row->start*1, "end"=>$row->end*1, "days"=>$days);
    }

    /**
     * Get daily data
     *
     * @param int $id - app id
     * @param int $start - start timestamp
     * @param int $end - end timestamp
     * @return string csv
     */
    public function get_daily($id, $start, $end) {
        // Fetch daily data from myheatpump_daily_stats table
        $id = (int) $id;
        $start = (int) $start;
        $end = (int) $end;

        $result = $this->mysqli->query("SELECT * FROM myheatpump_daily_stats WHERE `id`='$id' AND `timestamp`>='$start' AND `timestamp`<='$end' ORDER BY `timestamp` ASC");
        $data = array();
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        return $this->format_csv($data);
    }

    /**
     * Format data to csv
     *  
     * @param array $data
     * @return string
     */
    public function format_csv($data) {
        
        $out = "";
        $fields = array();
    
        // use first row to get field names
        if (count($data)>0) {
            $fields = array_keys($data[0]);
        }
    
        $out .= implode(",",$fields)."\n";
            
        foreach ($data as $row) {
            $values = array();
            foreach ($fields as $field) {
                $values[] = $row[$field];
            }
            $out .= implode(",",$values)."\n";
        }
    
        return $out;
    }

    public function process_lock($id) {
        $id = (int) $id;

        if (!$this->redis) {
            return true;
        }

        $lock_key = "myheatpump_process_lock_$id";
        $lock = $this->redis->get($lock_key);
        if ($lock) {
            return false;
        }

        // Set lock
        $this->redis->set($lock_key,1);
        // expire lock after 1 minute
        $this->redis->expire($lock_key,60);

        return true;
    }

    public function process_unlock($id) {
        $id = (int) $id;

        if (!$this->redis) {
            return;
        }
        
        $lock_key = "myheatpump_process_lock_$id";
        $this->redis->del($lock_key);
    }

    /**
     * Process daily data
     * 
     * @param int $id - app id
     * @param int $timeout - optional timeout in seconds
     * @return array days_processed, days_left
     */
    public function process_daily($id, $timeout = 3) {
        $id = (int) $id;
        $timeout = (int) $timeout;

        // Load app config
        $app = $this->appconfig->get_app_by_id($id);

        // Check if processing is locked
        if (!$this->process_lock($id)) {
            return array("success"=>false, "message"=>"Processing locked");
        }

        // Get start and end time of available data
        $result = $this->get_data_period($id);

        if ($result['start']===false || $result['end']===false) {
            $this->process_unlock($id);
            return array("success"=>false, "message"=>"No data available");
        }

        // Get most recent day in table
        $start_time = 0;
        $last = $this->mysqli->query("SELECT `timestamp` FROM myheatpump_daily_stats WHERE `id`='$id' ORDER BY `timestamp` DESC LIMIT 1");
        if ($row = $last->fetch_object()) {
            $start_time = $row->timestamp;
        }

        // Assign start time to data start if no stats in table
        if ($start_time==0) {
            $start_time = $result['start'];
        }
        $end_time = $result['end'];

        // Calculate start and end time aligned to midnight
        $date = new DateTime();
        $date->setTimezone(new DateTimeZone('Europe/London'));

        $date->setTimestamp($end_time);
        $date->modify("midnight");
        $date->modify("+1 day");
        $end = $date->getTimestamp();

        $date->setTimestamp($start_time);
        $date->modify("midnight");
        $start = $date->getTimestamp();

        // Calculate number of days to process
        $elapsed = $end - $start;
        $days = $elapsed / 86400;

        // This should be an option to set.. for now hard coded
        $starting_power = 100;
        
        // Timeout mechanism
        $timer_start = microtime(true);

        // Count days processed 
        $days_processed = 0;

        // Main processing loop
        $time = $start;
        while ($time<$end) {
            
            // Get stats for the day
            $stats = get_heatpump_stats($this->feed,$app,$time,$time+(3600*24),$starting_power);

            // Translate for database field compatibility
            $row = $this->format_flat_keys($stats);

            // Save the day!
            $this->save_day($app->id, $row);
            $days_processed++;
            
            // Move to next day
            $date->modify("+1 day");
            $time = $date->getTimestamp();

            // The default timeout on a php script is 30 seconds when running from the browser
            // this timeout mechanism is used to exit before this time is reached
            // it can also be set to a lower value for a more responsive UI
            if (microtime(true)-$timer_start>=$timeout) {
                break;
            }
        }

        // days left to process
        $days_left = $days - $days_processed;

        // Unlock processing
        $this->process_unlock($id);

        // feedback to the ui on progress
        // can be used for a progress bar
        return array(
            "success"=>true,
            "days"=>round($days),
            "days_processed"=>$days_processed, 
            "days_left"=>round($days_left),
            "processing_time"=>number_format(microtime(true)-$timer_start,3)*1
        );
    }

    /**
     * Format stats to flat keys
     * 
     * @param array $stats
     * @return array
     */
    public function format_flat_keys($stats) {

        $categories = ["combined","running","space","water"];
        
        $row = array();

        // Translate keys from stats to schema
        $row['timestamp'] = $stats['start'];

        // Map all standard categories
        foreach ($categories as $category) {
            foreach ($stats['stats'][$category] as $key=>$value) {
                $row[$category."_".$key] = $value;
            }
        }

        // Custom for combined
        $row["combined_cooling_kwh"] = $stats['stats']["combined"]['cooling_kwh'];
        $row["combined_starts"] = $stats['stats']["combined"]['starts'];
        $row["combined_starts_per_hour"] = $stats['stats']["combined"]['starts_per_hour'];

        // Map from_energy_feeds
        foreach ($stats['stats']['from_energy_feeds'] as $key=>$value) {
            $row["from_energy_feeds_".$key] = $value;
        }

        // Map quality
        foreach ($stats['quality'] as $key=>$value) {
            $row["quality_".$key] = $value;
        }

        return $row;
    }

    /**
     * Get data period
     * 
     * @param int $id
     * @return array start, end
     */
    public function get_data_period($id) {

        $app = $this->appconfig->get_app_by_id($id);
        
        $result = array("start"=>0, "end"=>0);

        if (isset($app->config->heatpump_elec)) {
            $meta = $this->feed->get_meta($app->config->heatpump_elec);
            $result['start'] = $meta->start_time;
            $result['end'] = $meta->end_time;
        }

        if (isset($app->config->heatpump_heat)) {
            $meta = $this->feed->get_meta($app->config->heatpump_heat);
            if ($meta->start_time>$result['start']) $result['start'] = $meta->start_time;
            if ($meta->end_time<$result['end']) $result['end'] = $meta->end_time;
        }

        if (isset($app->config->start_date) && $app->config->start_date>$result['start']) {
            $result['start'] = $app->config->start_date*1;
        }

        if ($result['start']==0) $result['start'] = false;
        if ($result['end']==0) $result['end'] = false;

        return $result;
    }

    // Save day
    public function save_day($id, $row) 
    {
        $id = (int) $id;
        $timestamp = (int) $row['timestamp'];
        $row['id'] = $id;

        // Delete existing stats
        $this->mysqli->query("DELETE FROM myheatpump_daily_stats WHERE `id`='$id' AND `timestamp`='$timestamp'");

        // Insert new
        $this->save_stats_table('myheatpump_daily_stats', $row);

        return array("success" => true, "message" => "Saved");
    }


    public function save_stats_table($table_name, $stats) {
        // Generate query from schema
        $fields = array();
        $qmarks = array();
        $codes = array();
        $values = array();
        foreach ($this->schema[$table_name] as $field => $field_schema) {
            if (isset($stats[$field])) {
                $fields[] = $field;
                $qmarks[] = '?';
                $codes[] = $field_schema['code'];
                $values[] = $stats[$field];
            }
        }
        $fields = implode(',',$fields);
        $qmarks = implode(',',$qmarks);
        $codes = implode('',$codes);

        $stmt = $this->mysqli->prepare("INSERT INTO $table_name ($fields) VALUES ($qmarks)");
        $stmt->bind_param($codes, ...$values);
        $stmt->execute();
        $stmt->close();
    }


    public function populate_codes($schema) {
        // populate schema codes based on type
        foreach ($schema as $key=>$value) {
            if (strpos($schema[$key]['type'],'varchar')!==false) $schema[$key]['code'] = 's';
            else if (strpos($schema[$key]['type'],'text')!==false) $schema[$key]['code'] = 's';
            else if (strpos($schema[$key]['type'],'int')!==false) $schema[$key]['code'] = 'i';
            else if (strpos($schema[$key]['type'],'float')!==false) $schema[$key]['code'] = 'd';
            else if (strpos($schema[$key]['type'],'bool')!==false) $schema[$key]['code'] = 'b';
        }
        return $schema;
    }

    // Processing of daily data

    /**
     * Process daily data
     * 
     * @param int $id - app id
     * @param int $start - start timestamp
     * @param int $end - end timestamp
     * @return array
     */
    public function process_from_daily($id, $start = false, $end = false) {

        $id = (int) $id;
        
        if ($start==false && $end==false) {
            $where = "WHERE id = $id";
        } else {
            $start = (int) $start;
            $end = (int) $end;
            $where = "WHERE timestamp >= $start AND timestamp < $end AND id = $id";
        }
        
        $rows = array();

        // Get daily data from myheatpump_daily_stats table for this app and time period
        $result = $this->mysqli->query("SELECT * FROM myheatpump_daily_stats $where");
        while ($row = $result->fetch_object()) {
            $rows[] = $row;
        }

        return $this->process($rows,$id,$start);
    }

    public function process($rows,$id,$start) {

        $categories = array('combined','running','space','water');

        // Totals only
        $totals = array();
        $total_fields = array('elec_kwh','heat_kwh','data_length');
        foreach ($categories as $category) {
            foreach ($total_fields as $field) {
                $totals[$category][$field] = 0;
            }
        }

        // sum x data_length
        $sum = array();
        $sum_fields = array('elec_mean','heat_mean','flowT_mean','returnT_mean','outsideT_mean','roomT_mean','prc_carnot');
        foreach ($categories as $category) {
            foreach ($sum_fields as $field) {
                $sum[$category][$field] = 0;
            }
        }

        // Custom fields
        $totals['combined']['cooling_kwh'] = 0;
        $totals['combined']['starts'] = 0;
        $totals['from_energy_feeds'] = array('elec_kwh'=>0,'heat_kwh'=>0);
        $totals['agile_cost'] = 0;
        $totals['cosy_cost'] = 0;
        $totals['go_cost'] = 0;

        // Quality
        $quality_fields = array('elec','heat','flowT','returnT','outsideT','roomT');
        $quality_totals = array();
        foreach ($quality_fields as $field) {
            $quality_totals[$field] = 0;
        }
        
        // Count days
        $days = 0;

        foreach ($rows as $row) {

            foreach ($categories as $category) {
                foreach ($total_fields as $field) {
                    $totals[$category][$field] += $row->{$category."_".$field};
                }
                foreach ($sum_fields as $field) {
                    $sum[$category][$field] += $row->{$category."_".$field} * $row->{$category."_data_length"};
                }
            }

            foreach ($quality_fields as $field) {
                $quality_totals[$field] += $row->{"quality_".$field};
            }

            $totals['combined']['starts'] += $row->combined_starts*1;
            $totals['combined']['cooling_kwh'] += $row->combined_cooling_kwh;
            $totals['from_energy_feeds']['elec_kwh'] += $row->from_energy_feeds_elec_kwh;
            $totals['from_energy_feeds']['heat_kwh'] += $row->from_energy_feeds_heat_kwh;

            $agile_cost = $row->unit_rate_agile * 0.01 * $totals['from_energy_feeds']['elec_kwh'];
            $totals['agile_cost'] += $agile_cost;

            $cosy_cost = $row->unit_rate_cosy * 0.01 * $totals['from_energy_feeds']['elec_kwh'];
            $totals['cosy_cost'] += $cosy_cost;

            $go_cost = $row->unit_rate_go * 0.01 * $totals['from_energy_feeds']['elec_kwh'];
            $totals['go_cost'] += $go_cost;
            
            $days++;
        }

        if ($days == 0) {
            return false;
        }

        // Calculate mean from sum
        $mean = array();
        foreach ($categories as $category) {
            foreach ($sum_fields as $field) {
                $mean[$category][$field] = null;
                if ($totals[$category]['data_length'] > 0) {
                    $mean[$category][$field] = $sum[$category][$field] / $totals[$category]['data_length'];
                }
            }
        }

        // Calculate quality
        $quality = array();
        foreach ($quality_fields as $field) {
            $quality[$field] = 0;
            if ($days > 0) {
                $quality[$field] = $quality_totals[$field] / $days;
            }
        }

        $stats = array(
            'id' => $id,
            'timestamp' => $start   
        );

        // As above but without number formatting
        foreach ($categories as $category) {
            $stats[$category.'_elec_kwh'] = $totals[$category]['elec_kwh'];
            $stats[$category.'_heat_kwh'] = $totals[$category]['heat_kwh'];
            if ($totals[$category]['elec_kwh'] > 0) {
                $stats[$category.'_cop'] = $totals[$category]['heat_kwh'] / $totals[$category]['elec_kwh'];
            } else {
                $stats[$category.'_cop'] = null;
            }
            $stats[$category.'_data_length'] = $totals[$category]['data_length'];

            $stats[$category.'_elec_mean'] = $mean[$category]['elec_mean'];
            $stats[$category.'_heat_mean'] = $mean[$category]['heat_mean'];
            $stats[$category.'_flowT_mean'] = $mean[$category]['flowT_mean'];
            $stats[$category.'_returnT_mean'] = $mean[$category]['returnT_mean'];
            $stats[$category.'_outsideT_mean'] = $mean[$category]['outsideT_mean'];
            $stats[$category.'_roomT_mean'] = $mean[$category]['roomT_mean'];
            $stats[$category.'_prc_carnot'] = $mean[$category]['prc_carnot'];
        }

        $stats['combined_cooling_kwh'] = $totals['combined']['cooling_kwh'];
        $stats['combined_starts'] = $totals['combined']['starts'];
        if ($totals['combined']['data_length']>0) {
            $stats['combined_starts_per_hour'] = $totals['combined']['starts'] / ($totals['combined']['data_length'] / 3600.0);
        } else {
            $stats['combined_starts_per_hour'] = 0;
        }
        $stats['from_energy_feeds_elec_kwh'] = $totals['from_energy_feeds']['elec_kwh'];
        $stats['from_energy_feeds_heat_kwh'] = $totals['from_energy_feeds']['heat_kwh'];
        $stats['from_energy_feeds_cop'] = 0;
        if ($totals['from_energy_feeds']['elec_kwh'] > 0) {
            $stats['from_energy_feeds_cop'] = $totals['from_energy_feeds']['heat_kwh'] / $totals['from_energy_feeds']['elec_kwh'];
        }

        foreach ($quality_fields as $field) {
            $stats['quality_'.$field] = $quality[$field];
        }

        $stats['unit_rate_agile'] = null;
        $stats['unit_rate_cosy'] = null;
        $stats['unit_rate_go'] = null;

        if ($totals['from_energy_feeds']['elec_kwh'] > 0) {
            $stats['unit_rate_agile'] = round(100*$totals['agile_cost'] / $totals['from_energy_feeds']['elec_kwh'],1);
            $stats['unit_rate_cosy'] = round(100*$totals['cosy_cost'] / $totals['from_energy_feeds']['elec_kwh'],1);
            $stats['unit_rate_go'] = round(100*$totals['go_cost'] / $totals['from_energy_feeds']['elec_kwh'],1);
        }

        if ($stats['unit_rate_agile'] === 0) $stats['unit_rate_agile'] = null;
        if ($stats['unit_rate_cosy'] === 0) $stats['unit_rate_cosy'] = null;
        if ($stats['unit_rate_go'] === 0) $stats['unit_rate_go'] = null;

        return $stats;
    }
}