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
    private $available_apps;

    public function __construct($mysqli,$available_apps)
    {
        $this->mysqli = $mysqli;
        $this->available_apps = $available_apps;
    }
    
    // ----------------------------------------------------------------------------------------------
    // Get user app list
    // ----------------------------------------------------------------------------------------------
    public function applist($userid) 
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
        if (preg_replace('/[^\p{N}\p{L}_\s-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name"); 
        
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
        if (preg_replace('/[^\p{N}\p{L}_\s-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name"); 
        
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
    public function setconfig($userid,$name,$config) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}_\s-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
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
            if (preg_replace("/[^A-Za-z0-9,;£$.&]/",'',$value)!=$value) return array('success'=>false, "message"=>"Invalid config value");
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
    public function getconfig($userid,$name) 
    {
        $userid = (int) $userid;
        if (preg_replace('/[^\p{N}\p{L}_\s-:]/u','',$name)!=$name) return array('success'=>false, "message"=>"Invalid app name");
        
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
        if ($row = $result->fetch_object()) {
            $applist = json_decode($row->data);
            if (gettype($applist)=="array" || $applist===null) $applist = new stdClass();
        } else {
            $applist = new stdClass();
        }
        
        // App list config migration
        foreach ($applist as $name=>$appitem) {
            if (!isset($applist->$name->config)) {
                $applist->$name = new stdClass();
                $applist->$name->app = $name;
                $applist->$name->config = $appitem;
            }
            if (!isset($this->available_apps[$name])) {
                unset($applist->$name);
            }
        }
        
        return $applist;
    }
}

