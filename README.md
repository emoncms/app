App, is an EMONCMS complementary module made to display technical information on theoretically any type of device.  The screen is preformated to show predefined type of feeds.

Example: My electric is able to show the house electrical need, consumption of the day, month, year, with values and graphs.

how to use it:
copy or clone this repository into the module directory of your EMONCMS installation.
Visit admin page and update database. This module uses a specific table, not present in previous releases.
Go to the config page (wrench positionned top right of screen) to configure to your needs
NB:
If this interface is to be used in your language different from English, do not forget to modify apikey login in user_model.php file lines 56, 71 an 88 to use the user language instead of 'en'.

code for lines 71 and 88:
´´´javascript
$session['lang'] = $row['language'];
´´´
rem : A conversion to bootstrat3 will probably make the presentation more responsive.
