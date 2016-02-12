0.4.0 (2/10/2016)
-------------------
  * Support enumerating devices using Windows 10 WinAppDeployCmd
  * Make wstool print pid after launching Windows Store app sucessfully (as stdout)
  * Move common code to utilities.js for checking if wptool/wstool need to be rebuilt.
  * Add method for loopback ip network isolation exempting a Windows Store app by id/Name: windowslib.winstore.loopbackExempt(appId, options, callback);
  * Add method to get listing of Windows appx containers as JSON: windowslib.winstore.getAppxPackages(options, callback);
  * Fix broken wp_get_appx_metadata.ps1 file from newline mid-line
  * Add method to find a process by pid: windowslib.process.find(pid, options, callback);

0.3.0 (1/6/2016)
-------------------
  * Support detection and use of Windows 10 SDK/tooling without requiring 8.1 tools installed.

0.2.2 (12/14/2015)
-------------------
  * Better error messages about bad app GUIDs when launching using our custom wptool
  * Support appxbundles for extracting the app GUID, look in multiple locations in XML (still may get just the text appid and not GUID)
  * Support passing in the app GUID for the launch/install methods so we don't need to extract it from appx/appxbundle if we already know it.

0.2.1 (12/11/2015)
-------------------
  * Fix detection of Windows 10 phone details

0.2.0 (12/10/2015)
-------------------
  * Add custom tooling for Win 10 mobile.
  * Support enumerating, launching and installing apps to Win 10 Mobile emulators

0.1.22 (12/4/2015)
-------------------
  * Fix: Windows 10 Mobile detection #26

0.1.21 (10/29/2015)
-------------------
  * Fix: escape vcvarsall before subprocess.run #25

0.1.20 (10/13/2015)
-------------------
  * [Windows: windowslib wstool doesn't launch on Windows 10](https://jira.appcelerator.org/browse/TIMOB-19693)

0.1.19 (10/7/2015)
-------------------
  * Line up dependencies to match titanium_mobile's dependencies.

0.1.18 (10/7/2015)
-------------------
  * [Remove error message for Windows Store deploy command](https://github.com/appcelerator/windowslib/pull/23)
  * [Fix: visualstudio.detect failed when install path contains space](https://github.com/appcelerator/windowslib/pull/22)

0.1.17 (9/30/2015)
-------------------
  * Line up dependencies to match titanium_mobile's dependencies.

0.1.16 (9/30/2015)
-------------------
  * Add Windows 10 SDK as option, list Windows 10 emulators for 10/8.1: https://github.com/appcelerator/windowslib/pull/21

0.1.15 (6/29/2015)
-------------------
  * Fix for [TIMOB-19090](https://jira.appcelerator.org/browse/TIMOB-19090) - Windows: Building for ws-local fails with powershell error 'Read-Host : Windows PowerShell is in NonInteractive mode'
  * Install of winstore app script requires not using the -NoInteractive flag to powershell.

0.1.14 (6/25/2015)
-------------------
  * More changes related to fixing [TIMOB-18958](https://jira.appcelerator.org/browse/TIMOB-18958) - Windows: CLI builds hang on first try due to Powershell permission check in windowslib

0.1.13 (6/11/2015)
-------------------
  * Expand cert utility functionality
  * Fix for winstore app install method

0.1.12 (6/9/2015)
-------------------
  * Fix [TIMOB-18958](https://jira.appcelerator.org/browse/TIMOB-18958) - Windows: CLI builds hang on first try due to Powershell permission check in windowslib
  * Expand Win Store Tooling Detection

0.1.11 (4/16/2015)
-------------------
  * Fix [TIMOB-18822](https://jira.appcelerator.org/browse/TIMOB-18822) - Added check so that os name and powershell info is only detected on Windows 8 or newer.

0.1.10 (3/18/2015)
-------------------
  * Fix [TIMOB-18706](https://jira.appcelerator.org/browse/TIMOB-18706) - Error when Windows Phone SDK is NOT installed

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
