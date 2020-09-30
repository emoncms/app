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

Optionally, if certain apps should not be possible to be created, as e.g. their configurations do not apply for certain countrys, a blacklist may be maintained in the `settings.php` file.  
To use this functionality, simply edit the default settings file

    sudo nano /var/www/emoncms/settings.ini

And add the following lines to the bottom of the file, to e.g. blacklist all *Time of use* apps:

#### App module settings

    [app]
    ; csv list of hidden apps
    hidden = template
    
## ❤️ Contributors

Thanks go to these wonderful people:

<table>
  <tr>
    <td align="center"><a href="https://github.com/emrysr"><img src="https://avatars2.githubusercontent.com/u/1466013?s=460&v=4" width="100px;" alt="Emrys Roberts"/><br /><sub><b>Dung Emrys Roberts</b></sub></a><br /></td>
   </tr>
</table>    

