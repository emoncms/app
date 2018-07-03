# Emoncms App Module

## Application specific dashboards

* **MyElectric**
Power + Kwh/D

* **MySolar**
Solar power generated Vs. consumed

* **MySolar (with divert)**
Solar power generated Vs. consumed, with special handling for excess generation that's been diverted to an immersion/electric car/etc.

* **MyHeatpump**
Heatpump statistics

* **MyEnergy**
Same as MySolar plus live grid carbon intensity and wind turbine output


![image](images/dark_app.png)

# Install

    cd /var/www/emoncms/Modules
    git clone https://github.com/emoncms/app

Make sure to check for database updates in **Emoncms > Admin**.

## Settings

Optionally, if only a selected list of applications should be possible to be configured, a whitelist may be maintained in the settings file, or the location where to look for existing apps may be configured.  
To use this functionalities, simply copy the default settings file and edit corresponding lines

    cp /var/www/emoncms/Modules/app/app_settings.default.php /var/www/emoncms/Modules/app/app_settings.php
