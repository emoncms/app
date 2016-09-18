# Emoncms App Module

## Application specific dashboards

* **MyElectric**
Power + Kwh/D

* **-MySolar**
Solar power generated Vs. consumed

* **MySolar (with divert)**
Solar power generated Vs. consumed, with special handling for excess generation that's been diverted to an immersion/electric car/etc.

* **MyHeatpump**
Heatpump statistics

* **MyEnergy**
Same as MySolar plus live grid carbon intensity and wind turbine output


![image](image.png)

# Install

    cd /var/www/emoncms/Modules
    git clone https://github.com/emoncms/app

Check for database updates in Emoncms > Admin
