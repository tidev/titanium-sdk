0.1.9 (2/25/2015)
-------------------
 * Update to node-appc 0.2.24

0.1.8 (2/23/2015)
-------------------
 * Fix issues launching phone emulator seen on some setups/foreign languages

0.1.7 (1/8/2015)
-------------------
 * Remove use of custom wptool, defer to deploy cmd for launch/connect [TIMOB-18303]
 * Surface exact error message from deploy command on failure (Issue #5)

0.1.6 (12/16/2014)
-------------------
 * Minor fix for surfacing errors in wptool.js, wrong variable name referenced.

0.1.5 (12/05/2014)
-------------------
 * Made wstool launch of WinStore apps more robust

0.1.4 (12/03/2014)
-------------------
 * Detects Visual Studio Express editions and have a better error reporting when Visual Studio is not found
 * Added missing node-appc reference in the index.js

0.1.3 (12/01/2014)
-------------------
 * add option to skipLaunch when installing Windows Phone app

0.1.2 (11/25/2014)
-------------------
 * Added detection of the XapSignTool executable

0.1.1 (11/12/2014)
-------------------
 * Fixed bug with installing Windows Store apps

0.1.0 (11/12/2014)
-------------------
 * Initial release of windowslib
 * Supports launching Windows Phone emulators, install apps to emulators and
   devices, log output, cert generation, development environment detection
   and much, much more [TIMOB-17515]
