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

    public function __construct($mysqli, $settings)
    {
        $this->mysqli = $mysqli;
        $this->settings = $settings;
    }

    // ----------------------------------------------------------------------------------------------
    // Get metadata for available apps
    // ----------------------------------------------------------------------------------------------
    public function get_available()
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
            if($a1['status'] == $a2['status'])
                return strcmp($a1['title'], $a2['title']);
            return strcmp($a1['status'], $a2['status']);
        });
        return $list;
    }

    // ----------------------------------------------------------------------------------------------
    // Get user app list
    // ----------------------------------------------------------------------------------------------
    public function get_list($userid) 
    {
        $userid = (int) $userid;
        return $this->get($userid);
    }

    // ----------------------------------------------------------------------------------------------
    // Add a new app to the user app list
    // ----------------------------------------------------------------------------------------------
    public function add($userid,$app,$name) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}]/u','',$app)!=$app) return array('success'=>false, "message"=>"Invalid app"); 
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name"); 
        
        // Load config from database
        $applist = $this->get($userid);
        if (isset($applist->$name)) return array('success'=>false, "message"=>"App already exist with name $name");
        
        // Add new app to config
        $applist->$name = new stdClass();
        $applist->$name->app = $app;
        $applist->$name->config = new stdClass();

        // Save        
        if (!$this->set($userid,$applist)) return array('success'=>false, 'message'=>"Error on app_config update");
        return array('success'=>true);
    }
    
    // ----------------------------------------------------------------------------------------------
    // Remove app from user app list
    // ----------------------------------------------------------------------------------------------
    public function remove($userid,$name) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name"); 
        
        // Load config from database
        $applist = $this->get($userid);
        if (!isset($applist->$name)) return array('success'=>false, "message"=>"App does not exist with name $name");
        
        // Delete the app
        unset($applist->$name);

        // Save
        if (!$this->set($userid,$applist)) return array('success'=>false, 'message'=>"Error on app_config update");
        return array('success'=>true);
    }
    
    // ----------------------------------------------------------------------------------------------
    // Set config off a particular app in the user app list
    // ----------------------------------------------------------------------------------------------    
    public function set_config($userid,$name,$config) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
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
        
        // Load config from database
        $applist = $this->get($userid);
        if (!isset($applist->$name)) return array('success'=>false, "message"=>"App does not exist with name $name");
        
        // Update the applist object with the configuration
        $applist->$name->config = $config;
        
        // Save
        if (!$this->set($userid,$applist)) return array('success'=>false, 'message'=>"Error on app_config update");
        return array('success'=>true);
    }

    // ----------------------------------------------------------------------------------------------
    // Get the config off a particular app in the user app list
    // ----------------------------------------------------------------------------------------------     
    public function get_config($userid,$name) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}_\s\-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
        
        $applist = $this->get($userid);
        if (!isset($applist->$name)) return array('success'=>false, "message"=>"App does not exist with name $name");
        
        return $applist->$name->config;
    }
    
    // ----------------------------------------------------------------------------------------------
    // Private app config database entry set method
    // ---------------------------------------------------------------------------------------------- 
    private function set($userid,$applist) 
    {
        // Re-encode for storage in db text field
        $json = json_encode($applist);
        
        // Alternative to json_encode($outdata,JSON_UNESCAPED_UNICODE), for php 5.3 support
        $json = preg_replace_callback('/\\\\u(\w{4})/', function ($matches) {
            return html_entity_decode('&#x' . $matches[1] . ';', ENT_COMPAT, 'UTF-8');
        }, $json);
        
        // Update database entry if it exists otherwise insert a new entry
        $result = $this->mysqli->query("SELECT `userid` FROM app_config WHERE `userid`='$userid'");
        if ($result->num_rows) {
        
            $stmt = $this->mysqli->prepare("UPDATE app_config SET `data`=? WHERE `userid`=?");
            $stmt->bind_param("si", $json, $userid);
            if (!$stmt->execute()) {
                return false;
            }
            return true;
            
        } else {
            $stmt = $this->mysqli->prepare("INSERT INTO app_config (`userid`,`data`) VALUES (?,?)");
            $stmt->bind_param("is", $userid,$json);
            if (!$stmt->execute()) {
                return false;
            }
            return true;
        }
    }
    
    // ----------------------------------------------------------------------------------------------
    // Private app config database entry get method
    // ---------------------------------------------------------------------------------------------- 
    private function get($userid) 
    {
        $result = $this->mysqli->query("SELECT `data` FROM app_config WHERE `userid`='$userid'");
        if ($result && $row = $result->fetch_object()) {
            $applist = json_decode($row->data);
            if (gettype($applist)=="array" || $applist===null) $applist = new stdClass();
        } else {
            $applist = new stdClass();
        }
        
        // App list config migration
        foreach ($applist as $name=>$appitem) {
            if (!isset($applist->$name->config)) {
                if (isset($this->available_apps[$name])) {
                    $applist->$name = new stdClass();
                    $applist->$name->app = $name;
                    $applist->$name->config = $appitem;
                } else {
                    unset($applist->$name);
                }
            }
        }
        
        return $applist;
    }
}

