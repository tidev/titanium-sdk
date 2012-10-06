var path = require("path");

module.exports = new function() {

	// local values
	/*******************************************************************************/

	/*
	local values used for defining the required properties (IE: you can change this section to 
	taste by adding or removing values if desired)

	Examples:
	var baseDir = path.resolve(path.sep, "Users", "ocyrus", "dev");
	var tiDir = path.resolve(baseDir, "appcelerator", "git", "titanium_mobile");
	*/


	// required values for all driver configurations
	/*******************************************************************************/

	/*
	location of titanium SDKs.  This directory should be the containing directory of various 
	versions of the titanium SDK.  For example, the contents of an example directory location 
	might contain the following: "1.8.2 1.8.3 2.0.0 2.0.1 2.0.2 2.1.0 2.1.1 2.2.0"

	Example: this.tiSdkDirs = path.resolve(path.sep, "Users", "ocyrus", "Library",
		"Application Support", "Titanium", "mobilesdk", "osx");
	*/
	this.tiSdkDirs = "";

	/*
	this can be changed but shouldn't need to be. This is the location where the harness instances 
	and log output is stored under

	Example: this.tempDir = path.resolve(__dirname, "tmp");
	*/
	this.tempDir = path.resolve(path.sep, "tmp", "driver");

	// change this to control how many log files are kept per platform
	this.maxLogs = 20;

	/*
	change this in the case you normally want a different logging level (can be "quiet", 
	"normal" or "verbose")
	*/
	this.defaultLogLevel = "normal";

	// max number of connection attempts (driver to harness) for socket based test runs
	this.maxSocketConnectAttempts = 20;

	/*
	if no timeout value is set in a suite file for a specific test, this value will be used as 
	a timeout value for the test
	*/
	this.defaultTestTimeout = 10000;

	// string representing a tab (currently only used for printing results)
	this.tabString = "   ";


	// required for socket based configurations
	/*******************************************************************************/

	// max number of connection attempts (driver to harness) for socket based test runs
	this.maxSocketConnectAttempts = 20;


	// required values for android driver configurations
	/*******************************************************************************/

	/*
	location of the android SDK - only needed when running with --platform=android;

	Example: this.androidSdkDir = path.resolve(baseDir, "installed", "android-sdk-mac_x86");
	*/
	this.androidSdkDir = "";

	/*
	Port that will be used for communication between driver and harness running on Android.  
	Note that Android and iOS need to use a different port from other platforms in order
	to get around some behavior in ADB
	*/
	this.androidSocketPort = 40404;


	// required values for iOS driver configurations
	/*******************************************************************************/

	/*
	Port that will be used for communication between driver and harness running on iOS.  
	Note that Android and iOS need to use a different port from other platforms in order
	to get around some behavior in ADB

	WARNING: Make sure that the port you assign is not used in any tests!!! Otherwise there will be
	reporting problems, test failures, and possibly other issues, since the simulator and the driver
	are sharing a network interface.

	To assist with this, ports in the range 40500-40600 should be considered reserved for harness testing.
	*/
	this.iosSocketPort = 40405;

	/*
	default sim version to use when running ios test pass if a specific sim version is not 
	specified with the --sim-version argument to the start command
	*/
	this.defaultIosSimVersion = "5.0";


	// required values for mobile web driver configurations
	/*******************************************************************************/

	// port that the driver will listen on for http based test runs
	this.httpPort = 8125;


	// required values for driver configurations running in remote mode
	/*******************************************************************************/

	// host that the hub lives on
	this.hubHost = "anvil.appcelerator.com";

	// hub listens for driver connections on this port
	this.hubPort = 97;

	// id that this driver instance will be identified as in reporting from the hub
	this.driverId = "exampleDriver";

	// description of the driver that will be used for reporting via the hub
	this.driverDescription = "this is an example driver instance";

	/*
	this object is passed to the hub upon registration and used by the hub to filter which driver
	instances should be used to test certain SDK versions.  

	An example of this is when you have an older iOS SDK that is not compatible with an older 
	version of XCode.  In that scenario we will have multiple drivers for iOS with varied 
	environments (older versions of XCode and some newer) and this provides a means for the hub to 
	only have the older driver environment run the tests for that specific SDK version.

	The supported properties on the object will evolve over time as needed.  The list of supported
	properties will be listed in the readme for the hub
	*/
	this.driverEnvironment = {
		// always specify a platform
		platform: "android",

		// if running for iOS, specify the version of Xcode
		xcodeVersion: "4.2.1"
	};


	// optional values
	/*******************************************************************************/

	// default platform to be used if the --platform argument is not provided
	this.defaultPlatform = "android";

	/*
	list of directories that contain additonal test configs that should be included in the list of 
	harness configs that will be run when a test pass is started (assuming no specific config set
	is specified)

	Example: this.customHarnessConfigDirs = [path.resolve(path.sep, "tmp", "myconfigs")];
	*/
}

