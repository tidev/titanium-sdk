0.4.23 (9/16/2016)
-------------------
  * [TIMOB-23879] Terminate running app at launch

0.4.22 (9/14/2016)
-------------------
  * [TIMOB-23661] Fix typo around preferred SDK

0.4.21 (8/26/2016)
-------------------
  * [TIMOB-23834] Ability to skip windows phone detection

0.4.20 (8/26/2016)
-------------------
  * [TIMOB-23816] Fix 8.1 emulator listing

0.4.19 (8/23/2016)
-------------------
  * [TIMOB-23800] CLI hangs on install of app when a different app is installed

0.4.18 (8/12/2016)
-------------------
  * [TIMOB-23762] Handle duplicate package error from Windows SDK 10.0.14393

0.4.17 (8/12/2016)
-------------------
  * [TIMOB-23768] Detect installed Win10 SDK versions

0.4.16 (8/9/2016)
-------------------
  * [TIMOB-23748] Fix: Failed to connect to WP 8.1 device

0.4.15 (7/13/2016)
-------------------
  * [TIMOB-23279] Only report detected device 

0.4.14 (6/24/2016)
-------------------
  * [TIMOB-23484] wptool.detect() ignore errors when results are present

0.4.13 (4/29/2016)
-------------------
  * Fix [TIMOB-20376] Windows Phone: Cannot read property 'split' of undefined

0.4.12 (4/27/2016)
-------------------
  * Fix "TypeError: undefined is not a function" at Array.findIndex on Node.js 0.12.7

0.4.11 (4/27/2016)
-------------------
  * Fix: async.each to async.eachSeries

0.4.10 (4/27/2016)
-------------------
  * [TIMOB-23253] Windows: Build errors when building to device and selecting second option in device prompt
  * Send separate installed and launched events for wptool#install/device#install/emulator#install/windowslib#install
  * We can tell if the app got installed but failed to launch (which I'm seeing repeatedly with my Windows 10 mobile device), allowing us to tell the user to launch the app manually.

0.4.9 (4/18/2016)
-------------------
  * [TIMOB-20611] Allow wptool to launch Windows 10 apps

0.4.8 (4/14/2016)
-------------------
  * [TIMOB-20571] Combine device listings

0.4.7 (4/13/2016)
-------------------
  * [TIMOB-20571] Add device version and wpsdk to enumerate

0.4.6 (4/12/2016)
-------------------
  * Fix to force uninstall then install if first install fails because an existing version is already installed for Win 10 mobile: https://jira.appcelerator.org/browse/TIMOB-23181

0.4.5 (4/5/2016)
-------------------
  * [TIMOB-19673] Fix unescaped characters in vcvarsall

0.4.4 (3/16/2016)
-------------------
  * [TIMOB-20566] Add support for Windows 10 devices
  * Improve log output from certutil

0.4.3 (2/17/2016)
-------------------
  * Another fix for uninstalling store apps from Windows 8.1

0.4.2 (2/17/2016)
-------------------
  * Align dependencies with titanium_mobile

0.4.1 (2/17/2016)
-------------------
  * When removing windows store package, properly pass along command (was broken on Windows 8.1)

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
