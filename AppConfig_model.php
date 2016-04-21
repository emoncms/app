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

    public function __construct($mysqli)
    {
        $this->mysqli = $mysqli;
    }
    
    public function set($userid,$json)
    {
        $userid = (int) $userid;
        
        if ($json=="") return array('success'=>false, "message"=>"Empty config object");
        $data = json_decode($json);
        if (!$data || $data==null) return array('success'=>false, "message"=>"Could not parse json");
        
        // Input sanitisation
        $outdata = array();
        foreach ($data as $appname=>$properties)
        {
            $appname = preg_replace("/[^A-Za-z0-9;&]/",'',$appname);
            if ($appname!=$appname) return array('success'=>false, "message"=>"Invalid characters in appname");
            
            if (gettype($properties)=="object") {
                $outdata[$appname] = array();
                foreach ($properties as $property=>$value)
                {
                    $property = preg_replace("/[^A-Za-z0-9;&_]/",'',$property);
                    if ($property!=$property) return array('success'=>false, "message"=>"Invalid characters in config property");
                    if (gettype($value)=="array") {
                        $tmp = array();
                        foreach ($value as $val) $tmp[] = (int) $val;
                        $value = $tmp;
                    } else {
                        $value = preg_replace("/[^A-Za-z0-9,;£$.&]/",'',$value);
                        if ($value!=$value) return array('success'=>false, "message"=>"Invalid characters in config value");
                    }
                    
                    $outdata[$appname][$property] = $value;
                }
            }
        }
        // Re-encode for storage in db text field
        $json = json_encode($outdata);
        
        // Alternative to json_encode($outdata,JSON_UNESCAPED_UNICODE), for php 5.3 support
        $json = preg_replace_callback('/\\\\u(\w{4})/', function ($matches) {
            return html_entity_decode('&#x' . $matches[1] . ';', ENT_COMPAT, 'UTF-8');
        }, $json);
        
        $result = $this->mysqli->query("SELECT `userid` FROM app_config WHERE `userid`='$userid'");
        if ($result->num_rows) {
        
            $stmt = $this->mysqli->prepare("UPDATE app_config SET `data`=? WHERE `userid`=?");
            $stmt->bind_param("si", $json, $userid);
            if (!$stmt->execute()) {
                return array('success'=>false, 'message'=>"Error on app_config update");
            }
            return array('success'=>true);
            
        } else {
            $stmt = $this->mysqli->prepare("INSERT INTO app_config (`userid`,`data`) VALUES (?,?)");
            $stmt->bind_param("is", $userid,$json);
            if (!$stmt->execute()) {
                return array('success'=>false, 'message'=>"Error on app_config insert");
            }
            return array('success'=>true);
        }
        
        return array('success'=>false, 'message'=>"End of setconfig method");
    }
    
    public function get($userid)
    {
        $userid = (int) $userid;
        $result = $this->mysqli->query("SELECT `data` FROM app_config WHERE `userid`='$userid'");
        if ($row = $result->fetch_array()) {
            global $route;
            header('content-type:text;charset=utf-8');
            $route->format = "text";
            return $row['data'];
        } else {
            $config = new stdClass();
            return $config;
        }
        
    }

}

