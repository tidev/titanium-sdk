0.2.35 (2/9/2015)
------------------
 * Added more logging for why a Titanium module was found incompatible [TIMOB-20275]
 * Improved plist parsing
 * Updated NPM dependencies

0.2.34 (12/11/2015)
------------------
 * Individual library modules are loaded lazy loaded for improved performance

0.2.33 (10/6/2016)
------------------
 * Added the bugs URL to the package.json [TIMOB-19671]

0.2.32 (10/1/2015)
------------------
 * Added PNG info (width, height, alpha) to image lib [TIMOB-19512]

0.2.31 (9/3/2015)
------------------
 * Bug fix in JDK detection [TIMOB-19400]

0.2.30 (8/31/2015)
------------------
 * Windows specific bug fixes [TIMOB-19400]

0.2.29 (8/28/2015)
------------------
 * Improved JDK detection and added ability to find more than one JDK [TIMOB-19400]

0.2.28
------------------
 * ?

0.2.27
------------------
 * ?

0.2.26 (3/17/2015)
------------------
 * Removed authentication from the analytics and anonymized the data [TIMOB-18711]

0.2.25 (3/2/2015)
------------------
 * Added contents of Titanium SDK top-level package.json to the SDK info object [TIMOB-18629]

0.2.24 (1/9/2015)
------------------
 * Fixed subprocess run to pass in an empty array of args instead of null [TIMOB-18538]

0.2.23 (12/18/2014)
------------------
 * Fixed bug caused by previous release where installPath was no longer properly being set on vanilla environments.

0.2.22 (11/17/2014)
------------------
 * Fixed bug with the parent process not properly detaching the child analytics process [TIMOB-18046]

0.2.21 (11/12/2014)
-------------------
 * Fixed bug where duplicate paths were searched for Titanium SDKs due to not fully resolving the real path of the search path.

0.2.20 (11/5/2014)
-------------------
 * Fixed bug with how discovered modules are combined from multiple install locations [TIMOB-17872]

0.2.19 (10/13/2014)
-------------------
 * Fixed bug in timodule with the handling of supported platforms [TIMOB-17822]

0.2.18 (10/6/2014)
-------------------
 * Refactored timodule library to address incorrect module caching, support for bypassing cache, and improved API [TIMOB-17822]

0.2.17 (9/16/2014)
-------------------
 * Fixed timodule logic to find latest *valid* module instead of latest module [TIMOB-17545]

0.2.16 (8/22/2014)
-------------------
 * Fixed bug with parseMin() and parseMax() in version module
 * Updated NPM dependencies

0.2.15 (7/15/2014)
-------------------
 * Added support to async lib for zero argument callbacks which will be run sync

0.2.14 (6/24/2014)
-------------------
 * Fixed bug where the analytics child send process doesn't disconnect from the parent allowing the parent to exit [TIMOB-17206]

0.2.13 (6/20/2014)
-------------------
 * Restructured the analytics lib so the parent writes events to disk, then forks the analytics send process [TIMOB-17046]

0.2.12 (6/19/2014)
-------------------
 * Added Java architecture detection to JDK library
 * Fixed a bug caused by TIMOB-17144 when detecting Titanium modules, but no specific modules are being loaded

0.2.11 (6/13/2014)
-------------------
 * Fixed bug with detecting and unzipping modules when project does not have any modules already [TIMOB-17144]

0.2.10 (6/4/2014)
-------------------
 * Added support to version.parseMax() for keeping the X in the version number [TIMOB-17066]

0.2.9
-------------------
 * Botched release, unpublished

0.2.8
-------------------
 * Botched release, unpublished

0.2.7 (5/30/2014)
-------------------
 * Fixed filename bug when writing analytics events to disk [TIMOB-17052]

0.2.6 (5/21/2014)
-------------------
 * Fixed bug where analytics would get stuck in an infinite loop if another process was trying to send analytics [TIMOB-17007]

0.2.5 (5/19/2014)
-------------------
 * More tweaks to the analytics handling to prevent analytics from being run more than once at a time [TIMOB-16979]

0.2.4 (5/16/2014)
-------------------
 * Added better error handling around the analytics event files [TIMOB-16979]

0.2.3 (5/14/2014)
-------------------
 * Only send analytics by one process at a time and write each event to separate files to avoid conflicts [TIMOB-16960]

0.2.2 (4/18/2014)
-------------------
 * Updated Appcelerator API URLs to api.appcelerator.com [TIMOB-16282]

0.2.1 (4/8/2014)
-------------------
 * Fixed bug where JAVA_HOME beginning with a tilde was not being resolved to the home directory before checking if the path exists [TIMOB-16085]
 * Fixed version.satisfies() function to accept versions with a -label suffix [TIMOB-16365]
 * Fixed bug where 'ipconfig /all' output was incorrectly being parsed on Windows and thus the mac addresses were not being properly extracted [TIMOB-16747]
 * Fixed bug in the net.online() function to perform a simple single DNS check instead of once per interface

0.2.0 (12/18/2013)
-------------------
 * Added try/catch around analytics processing with showErrors flag to display errors
 * Added check to see if session file is writable when logging in or out of Appc network [TIMOB-13908]
 * Improved AppcException to include a toString() function and improved dump() function
 * Added isFileWritable() function to fs library
 * Fixed bug with Android SDK add-ons with missing manifest.ini files to crash the CLI [TIMOB-13634]
 * Added code coverage reporting
 * Added unit tests for 30 libraries (currently 72% code coverage)
 * Added JSDoc comments for nearly entire code base
 * Complete rewrite of i18n-tool that analyzes Titanium CLI, node-appc, and Titanium SDK Node code and syncs i18n strings with webtranslateit.com
 * Migrated old zip library from using built-in unzip, zip, and 7zip commands to use the adm-zip module
 * Updated a number of APIs to have better dependency injection and less hard-coded parameters (needed for unit tests)
 * Added HAXM environment detection
 * Moved Java environment detection from Android detection library into standalone library and greatly improved Android SDK detection
 * Removed deprecated astwalker library
 * Added new subprocess library to make finding and calling subprocesses easier
 * Removed deprecated hitch() util function
 * Major cleanup to authentication library
 * Added gateway interface detection to network library
 * Updated nearly all dependencies on appc.fs.exists() to fs.existsSync()
 * Added i18n support for entire files
 * Added better plist parsing and serializing support
 * Added new string utility functions wrap() and renderColumns()
 * Internationalized strings in the time library
 * Better/cleaner Titanium module and CLI plugin detection
 * Fixed bug in copyFileSync() when copying a file to a directory [TIMOB-14386]
 * Fixed bug with symlinked modules and plugins not being found [TIMOB-14209]
 * Fixed bug with visitDirsSync() passing the correct filename and path to the visitor function [TIMOB-14958]
 * Fixed bug with Red Hat Linux-based distros (Fedora, Centos) not detecting the name and version of the OS [TIMOB-14960]
 * Added ampersand escaping in subprocess.run() for Windows [TIMOB-2527]
 * Added hashfile() function to fs lib
 * Added more version handling functions: parseMin(), parseMax(), satisfies(), sort()
 * Updated async lib to allow both arrays and objects of tasks
 * Added a scopedDetect() function to the tiplugin lib and updated find() to use that if searchPaths is an object
 * Added support to the copy directory functions in the fs lib for both array and regex ignore files/dirs
 * Added a sort-of-async copy file function to the fs lib
 * Added forEachAttr() to xml lib
 * Fixed bug in recursive copy with opts not being passed to itself
 * Added ability for unzip visitor to return false to prevent a file from being decompressed
 * Added getRealName() function to subprocess lib that gets a path's 8.3 formatted name on Windows
 * Updated timodule lib to use the module's version directory as the version number instead of the version in the manifest
 * Added Mac OS X CLI tools detection lib [TIMOB-15562]
 * Fixed bug in timodule lib where the best candidate for a module was not being selected if it found more than one match
 * Fixed bug when piping the output of an app using node-appc into another app
 * Added JDK home directory to JDK detection info
 * Fixed bug with auth lib when authenticating for the first time and .titanium home directory does not exist
 * Shorten all third party URLs to appcelerator.com/<shortcut> URLs
 * Added ability to override JAVA_HOME environment variable with one in the CLI config
 * Fixed bug with module zip files not being automatically unzipped into the modules directory [TIMOB-15714]
 * Updated third party Node.js module dependency version where safe to do so
 * Added config option "rejectUnauthorized" to auth and analytics libs [TIMOB-15743]
 * Added online() function to net lib to detect if you are online
 * Improved jdk lib java home detection [TIMOB-15818]
 * Fixed bug in util.mix() when mixing process.env into an object where process.env is not a real object in Node.js 0.8
 * Fixed bug that when not all required JDK tools are found, we still try to get the path to the ones that were not found which results in an error [TIMOB-3180]

0.1.31 (12/18/2013)
-------------------
 * Added config option "rejectUnauthorized" to auth and analytics libs [TIMOB-15783]
 * Added support for Xcode 5.0.1+ and iOS 7.0.1+ detection [TIMOB-15681]
 * Fixed bug with incorrect provisioning profile value being base64 encoded [TIMOB-15970]

0.1.30 (6/17/2013)
-------------------
 * Fixed bug with the Android SDK path not being stored back in the Android detection results object after being converted to an absolute path [TIMOB-13549]
 * Fixed a bug with not catching write exceptions in analytics [TIMOB-13908]

0.1.29 (4/16/2013)
-------------------
 * Fixed bug with timodule detection that wasn't properly handling multiple platforms [TIMOB-12844]
 * Fixed bug when a file is copied and the dest exists, the dest isn't deleted first [TIMOB-13051]

0.1.28 (2/19/2013)
-------------------
 * Fixed Titanium module detection library to properly handle the deploy-type property. [TIMOB-12422]
 * Removed the deprecated Uglify 1 AST walker since we've upgraded to Uglify 2. [TIMOB-12439]
 * Updated auth library to use request module instead of node.js built-in request functions. [TIMOB-12423]
 * Fixed analytics library to set the uid cookie and not pass in the app_id. [TIMOB-12653]
 * Fixed bug with the Android detection library failing to call 'android list' on Windows [TIMOB-12764]
 * Fixed analytics to only send payload when logged in. [TIMOB-12771]

0.1.27 (1/22/2013)
-------------------
 * Fixed bug if ~/.titanium folder doesn't already exist [TIMOB-12373]

0.1.26 (1/21/2013)
-------------------
 * Fixed bugs in the analytics library when the user is offline [TIMOB-12265]
 * Fixed plist parsing when <string> tag is empty [TIMOB-12167]
 * Fixed iOS cert parsing to properly decode special characters as well as organize certs by keychain [TIMOB-12033]
 * Fixed bug in fs lib's copyDirSyncRecursive() function with copying relative symlinks
 * Added support to Titanium module detection to find conflicting module names [TIMOB-11919]
 * Fixed Titanium module detection searching the same path twice

0.1.25 (12/21/2012)
-------------------
 * Fixed buffer size issues when ios library detects installed developer certs [TIMOB-12146]

0.1.24 (12/12/2012)
-------------------
 * Removed 'default' from Android skin detection that was throwing off Titanium Studio [TIMOB-12082]

0.1.23 (12/12/2012)
-------------------
 * Fixed bug with modules not properly being unzipped if the modules directory doesn't exist [TIMOB-12031]

0.1.22 (12/11/2012)
-------------------
 * Fixed timodule unzipping [TIMOB-12031]
 * Updated a i18n string

0.1.21 (12/7/2012)
-------------------
 * Fixed bug with the zip library not properly unzipping on Windows due to extraneous quotes [TIMOB-11649]
 * Added better error handling when unzipping on Windows
 * Added trace logging for the image resizing

0.1.20 (12/6/2012)
-------------------
 * Extended the AST walker to accept a pre-parsed AST tree instead of the filename of a file to parse

0.1.19 (12/6/2012)
-------------------
 * Fixed ISO string formatting in plist date fields [TIMOB-11982]

0.1.18 (12/6/2012)
-------------------
 * Updated i18n strings and fixed a bug with the locale being loaded correctly [TIMOB-11825]

0.1.17 (11/28/2012)
-------------------
 * Fixed Uglify version to 1.3.X [TIMOB-11867]

0.1.16 (11/27/2012)
-------------------
 * Fixed bug with zip file extracting on Windows [TIMOB-11880]

0.1.15 (11/21/2012)
-------------------
 * Small tweaks

0.1.14 (11/21/2012)
-------------------
 * Fixed bug with Android detection library not resolving Android SDK paths starting with a tilde (~) [TIMOB-11781]

0.1.13 (11/11/2012)
-------------------
 * Fixed bug with unzip arguments being unnecessarily quoted

0.1.12 (11/7/2012)
-------------------
 * Changed environ lib to explicit detect() call instead of automatic
 * Added support for additional Titanium SDK path detection
 * Fixed bug with unzipping files erroring because stdout exceeded buffer size [TIMOB-11649]

0.1.11 (10/31/2012)
-------------------
 * Fixed typo in variable name that was breaking analytics library
