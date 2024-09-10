<?php
/*
 All Emoncms code is released under the GNU Affero General Public License.
 See COPYRIGHT.txt and LICENSE.txt.
 
 ---------------------------------------------------------------------
 Emoncms - open source energy visualisation
 Part of the OpenEnergyMonitor project:
 http://openenergymonitor.org
 */

// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

class AppConfig
{
    private $mysqli;
    private $settings;
    private $available;
    public $app_table_exists = true;

    public function __construct($mysqli, $settings)
    {
        $this->mysqli = $mysqli;
        $this->settings = $settings;
        
        $this->available = $this->load_available();

        // Option to skip db check
        if (isset($settings['db_check']) && $settings['db_check'] == 0) {
            return;
        }
        
        // Check and migrate database
        if (!$this->app_table_exists()) {
            $this->app_table_exists = false;
        } else {
            if ($this->if_pre_v2_9()) {
                $this->migrate_v2_9();
            }
        }
    }

    // ----------------------------------------------------------------------------------------------
    // Get metadata for available apps
    // ----------------------------------------------------------------------------------------------
    public function load_available()
    {
        $list = array();
        
        $dirs = new RecursiveDirectoryIterator("Modules/app/apps/");
        $it = new RecursiveIteratorIterator($dirs);
        foreach($it as $file) {
            // Restrict iteration to two levels
            if ($it->getDepth() > 2) {
                continue;
            }
            
            // Replace all backslashes to avoid conflicts with paths on windows machines
            $file = str_replace('\\', '/', $file);
            if(basename($file ,".json") == 'app') {
                $dir = dirname($file);
                
                $content = (array) json_decode(file_get_contents($file));
                if (!isset($content['order'])) $content['order'] = 100;
                if (json_last_error() == 0 && array_key_exists("title", $content) && array_key_exists("description", $content)) {
                    $content['dir'] = stripslashes($dir.'/');
                    
                    $id = basename($dir);
                    if ((!isset($this->settings) || !isset($this->settings['hidden']) 
                        || !in_array($id, $this->settings['hidden']))) {
                        
                        $list[$id] = $content;
                    }
                }
            }
        }
        uasort($list, function($a1, $a2) {
            if($a1['order'] > $a2['order']) {
                return 1;
            } else {
               return -1;
            }
        });
        return $list;
    }
    
    public function get_available()
    {
        return $this->available;
    } 
    
    public function get_app_dir($app_id) {
        if (isset($this->available[$app_id])) {
            return $this->available[$app_id]['dir'];
        }
        return false;
    }

    // Get user app list
    public function get_list($userid) 
    {
        $userid = (int) $userid;

        if (!$this->app_table_exists) {
            return array();
        }

        $apps = array();
        $result = $this->mysqli->query("SELECT `id`, `app`, `name`, `public` FROM app WHERE `userid`='$userid'");
        while ($row = $result->fetch_object()) {
            $apps[] = $row;
        }
        return $apps;
    }
    
    /** 
     * Get app by name or default
     * 
     * @param int $userid User ID
     * @param string $app_name App name
     * @param bool $context_public Context public
     * @return object App object or false
     */ 
    public function get_app_or_default($userid,$app_name,$context_public) {

        $userid = (int) $userid;
        $applist = $this->get_list($userid);

        // TRY TO FIND APP BY NAME
        foreach ($applist as $appitem) {
            if ($appitem->name == $app_name) {
                // If context is public and app is not public, break out of loop
                if ($context_public && !$appitem->public) break;
                // else return the app
                return $this->get_app_by_id($appitem->id);
            }
        }

        // DEFAULT APP
        // If app not found in user app list, return default app
        foreach ($applist as $appitem) {
            // If context is public and app is not public, skip to next app
            if ($context_public && !$appitem->public) continue;
            // else return the app
            return $this->get_app_by_id($appitem->id);
        }

        return false;
    }

    /**
     * Get app by id
     * 
     * @param int $id App id
     */
    public function get_app_by_id($id) {
        $id = (int) $id;

        $result = $this->mysqli->query("SELECT `id`, `userid`, `app`, `name`, `public`, `config` FROM app WHERE `id`='$id'");
        if ($result && $row = $result->fetch_object()) {
            $row->config = json_decode($row->config);
            return $row;
        } else {
            return false;
        }
    }

    /**
     * Check if app exists
     * 
     * @param int $userid User ID
     * @param string $name App name
     * @return bool id or false
     */
    public function app_exists_by_name($userid, $name) {
        $stmt = $this->mysqli->prepare("SELECT `id` FROM app WHERE `userid`=? AND `name`=?");
        $stmt->bind_param("is", $userid, $name);
        $stmt->execute();

        // return id or false
        $stmt->store_result();
        $stmt->bind_result($id);
        if ($stmt->fetch()) {
            $stmt->close();
            return $id;
        } else {
            $stmt->close();
            return false;
        }
    }

    /**
     * Check if app exists by id
     * 
     * @param int $userid User ID
     * @param int $id App id
     * @return bool id or false
     */
    public function app_exists_by_id($userid, $id) {
        $userid = (int) $userid;
        $id = (int) $id;

        $result = $this->mysqli->query("SELECT `id` FROM app WHERE `userid`='$userid' AND `id`='$id'");
        if ($result && $row = $result->fetch_object()) {
            return $row->id;
        } else {
            return false;
        }
    }

    /**
     * Check if userid is the owner of the app
     * 
     * @param int $userid User ID
     * @param int $id App id
     * @return bool Success status
     */
    public function is_owner($userid, $id) {
        $userid = (int) $userid;
        $id = (int) $id;

        $result = $this->mysqli->query("SELECT `id` FROM app WHERE `userid`='$userid' AND `id`='$id'");
        if ($result && $row = $result->fetch_object()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Add new app to app table
     *
     * @param int $userid User ID
     * @param string $app App identifier
     * @param string $name App name
     * @return array Success status and message
     */
    public function add($userid,$app,$name)
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}]/u','',$app)!=$app) return array('success'=>false, "message"=>"Invalid app"); 
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
        
        if ($this->app_exists_by_name($userid, $name)) {
            return array('success'=>false, "message"=>"App already exist with name $name");
        }

        // Add new app to app table
        $stmt = $this->mysqli->prepare("INSERT INTO app (`userid`, `app`, `name`, `public`, `config`) VALUES (?,?,?,0,'{}')");
        $stmt->bind_param("iss", $userid, $app, $name);
        if (!$stmt->execute()) {
            $stmt->close();
            return array('success'=>false, 'message'=>"Error on app insert");
        }

        // Get the ID of the newly inserted row
        $id = $this->mysqli->insert_id;
        $stmt->close();

        return array('success' => true, 'id' => $id);
    }
    
    /**
     * Remove app from app table
     * 
     * @param int $userid User ID
     * @param int $name App id
     * @return array Success status and message
     */
    public function remove($userid,$app_id) 
    {
        $userid = (int) $userid;
        $id = (int) $app_id;

        if (!$this->app_exists_by_id($userid, $id)) {
            return array('success'=>false, "message"=>"App does not exist with id $id");
        }

        // Remove app by id from app table
        $this->mysqli->query("DELETE FROM app WHERE `userid`='$userid' AND `id`='$id'");
        
        return array('success'=>true);
    }

    /**
     * Set app name
     * 
     * @param int $userid User ID
     * @param int $id App id
     * @param string $name App name
     * @return array Success status and message
     */
    public function set_name($userid,$id,$name)
    {
        $userid = (int) $userid;
        $id = (int) $id;
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");

        if (!$this->app_exists_by_id($userid, $id)) {
            return array('success'=>false, "message"=>"App does not exist with id $id");
        }

        // Set app name
        $stmt = $this->mysqli->prepare("UPDATE app SET `name`=? WHERE `userid`=? AND `id`=?");
        $stmt->bind_param("sii", $name, $userid, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            return array('success'=>false, "message"=>"Error saving name");
        }
        $stmt->close();
        
        return array('success'=>true);
    }

    /**
     * Set app public status
     * 
     * @param int $userid User ID
     * @param int $id App id
     * @param bool $public Public status
     * @return array Success status and message
     */
    public function set_public($userid,$id,$public)
    {
        $userid = (int) $userid;
        $id = (int) $id;
        $public = (int) $public;

        if (!$this->app_exists_by_id($userid, $id)) {
            return array('success'=>false, "message"=>"App does not exist with id $id");
        }

        // Set app public status
        $stmt = $this->mysqli->prepare("UPDATE app SET `public`=? WHERE `userid`=? AND `id`=?");
        $stmt->bind_param("iii", $public, $userid, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            return array('success'=>false, "message"=>"Error saving public status");
        }
        $stmt->close();
        
        return array('success'=>true);
    }
    
    /**
     * Set config for a particular app in the user app list
     *  
     * @param int $userid User ID
     * @param int $id App id
     * @param string $config JSON encoded config
     * @return array Success status and message
     */
    public function set_config($userid,$id,$config) 
    {
        $userid = (int) $userid;
        $id = (int) $id;

        if (!$this->app_exists_by_id($userid, $id)) {
            return array('success'=>false, "message"=>"App does not exist with id $id");
        } 

        // if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
        // Config sanitisation 
        $config = json_decode($config);
        if (!$config || $config===null) return array('success'=>false, "message"=>"Could not parse json");
        foreach ($config as $key=>$value) {
            // Key must be lower case alphanumeric with no special char's
            if (preg_replace("/[^a-zA-Z0-9_]/",'',$key)!=$key) return array('success'=>false, "message"=>"Invalid config key");
            // Value type can not be object, array or resource
            if (gettype($value)=="object") return array('success'=>false, "message"=>"Config value cannot be object");
            if (gettype($value)=="array") return array('success'=>false, "message"=>"Config value cannot be array");
            if (gettype($value)=="resource") return array('success'=>false, "message"=>"Config value cannot be resource");
            // Value can be alphanumeric, either case plus selected char's
            // using unicode categories for pattern match to allow for any currency character
            //   \pSc (S = symbols, c = currency)
            //   \pL (L = letters)
            //   \pP (P = punctuation)
            //   \pN (N = number)
            //   \W = white space (not unicode category)
            // also using php's strip_tags() funciton to avoid html insertion (spaces required around greater than and less than)
            // 
            // EXAMPLE:
            // this input:
            //    <script> alert(123) </script> a is < than b but c is < >  to b,/?€@#~$¢£¤¥৲৳৻૱௹฿៛₠₡₢₣₤₥₦₧₨₩₪₫₭₮₯₰₱₲₳₴₵₸₹₺₽
            // would be recognized as:
            //    alert(123)  a is < than b but c is < >  to b,/?€@#~$¢£¤¥৲৳৻૱௹฿៛₠₡₢₣₤₥₦₧₨₩₪₫₭₮₯₰₱₲₳₴₵₸₹₺₽

            if (preg_replace("/[^\pSc\pL\pP\pN\W]/u",'',strip_tags($value))!=$value) return array('success'=>false, "message"=>"Invalid config value");
        }

        // Save config
        $config = json_encode($config);
        $stmt = $this->mysqli->prepare("UPDATE app SET `config`=? WHERE `userid`=? AND `id`=?");
        $stmt->bind_param("sii", $config, $userid, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            return array('success'=>false, "message"=>"Error saving config");
        }
        $stmt->close();
        
        return array('success'=>true);
    }

    // ----------------------------------------------------------------------------------------------
    // Migrate app config to new format
    // ----------------------------------------------------------------------------------------------
    private function app_table_exists() {
        // check if app table exists
        $result = $this->mysqli->query("SHOW TABLES LIKE 'app'");
        // if it does not return false
        if ($result->num_rows==0) {
            return false;
        }
        return true;
    }

    private function if_pre_v2_9() {
        // is app_config table empty?
        $result = $this->mysqli->query("SELECT `userid` FROM app_config");
        if ($result->num_rows) {
            return true;
        }
        return false;
    }

    private function migrate_v2_9() {

        // For each entry in the app_config table migrate the data to the new app table format
        // old: userid, data
        // new: app id, userid, name, config

        $main_result = $this->mysqli->query("SELECT `userid`, `data` FROM app_config");
        while ($row = $main_result->fetch_object()) {
            $userid = $row->userid;
            $applist = json_decode($row->data);
            if (gettype($applist)=="array" || $applist===null) $applist = new stdClass();

            foreach ($applist as $name=>$appitem) {
                $app = $appitem->app;
                // print "Migrating app $name : $app for userid $row->userid\n";

                // Check if app exists with this name in app table
                $result = $this->mysqli->query("SELECT `id` FROM app WHERE `userid`='$userid' AND `name`='$name'");
                if ($result->num_rows) {
                    // App already exists (this should not happen)
                    // print "App already exists\n";
                } else {

                    // Copy app to app table
                    if (isset($appitem->config)) {
                        $config = json_encode($appitem->config);
                    } else {
                        $config = "{}";
                    }

                    // Moving config field to field in app table
                    $public = 0;
                    if (isset($appitem->config->public) && $appitem->config->public) {
                        $public = 1;
                    }

                    $stmt = $this->mysqli->prepare("INSERT INTO app (`userid`, `app`, `name`, `public`, `config`) VALUES (?,?,?,?,?)");
                    $stmt->bind_param("issis", $userid, $app, $name, $public, $config);
                    $stmt->execute();
                }
            }

            // Delete old app_config entry
            $this->mysqli->query("DELETE FROM app_config WHERE `userid`='$userid'");
        }
        return true;
    }
}

