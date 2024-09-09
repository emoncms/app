<?php

class MyHeatPump {

    private $mysqli;
    private $redis;
    private $feed;
    private $app;
    private $schema;

    // constructor
    function __construct($mysqli,$redis,$feed,$app) {
        $this->mysqli = $mysqli;
        $this->redis = $redis;
        $this->feed = $feed;
        $this->app = $app;

        // Load schema
        $schema = array();
        require "Modules/app/apps/OpenEnergyMonitor/myheatpump/myheatpump_schema.php";
        $schema['myheatpump_daily_stats'] = $this->populate_codes($schema['myheatpump_daily_stats']);
        $this->schema = $schema;
    }

    /**
     * Get daily data
     *
     * @param int $id - system id
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
        $lock_key = "myheatpump_process_lock_$id";
        $this->redis->del($lock_key);
    }

    /**
     * Process daily data
     * 
     * @param int $id - system id
     * @param int $timeout - optional timeout in seconds
     * @return array days_processed, days_left
     */
    public function process_daily($id, $timeout = 3) {
        $id = (int) $id;
        $timeout = (int) $timeout;

        // Check if processing is locked
        if (!$this->process_lock($id)) {
            return array("success"=>false, "meassage"=>"Processing locked");
        }

        // Get start and end time of available data
        $result = $this->get_data_period($id);

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
            $stats = get_heatpump_stats($this->feed,$this->app,$time,$time+(3600*24),$starting_power);

            // Translate for database field compatibility
            $row = $this->format_flat_keys($stats);

            // Save the day!
            $this->save_day($this->app->id, $row);
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
            "days"=>number_format($days,2)*1,
            "days_processed"=>$days_processed, 
            "days_left"=>number_format($days_left,2)*1,
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

        $app = $this->app;
        
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
    public function save_day($systemid, $row) 
    {
        $systemid = (int) $systemid;
        $timestamp = (int) $row['timestamp'];
        $row['id'] = $systemid;

        // Delete existing stats
        $this->mysqli->query("DELETE FROM myheatpump_daily_stats WHERE `id`='$systemid' AND `timestamp`='$timestamp'");

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
}