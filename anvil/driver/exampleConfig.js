module.exports = new function() {

	// local values
	/*******************************************************************************/

	/*
	local values used for defining the required properties (IE: you can change this section to 
	taste by adding or removing values if desired)

	Examples:
	var baseDir = "/Users/ocyrus/dev";
	var tiDir = baseDir + "/appcelerator/git/titanium_mobile";
	*/


	// required values
	/*******************************************************************************/

	// Example: this.androidSdkDir = baseDir + "/installed/android-sdk-mac_x86"
	this.androidSdkDir = ""; // location of the android SDK;

	// Example: this.tiSdkDir = tiDir + "/dist/mobilesdk/osx/2.1.0";
	this.tiSdkDir = ""; // location of titanium SDK;

	/*
	this can be changed but shouldn't need to be. This is the location where the harness instances 
	and log output is stored under
	*/
	this.tempDir = "/tmp/driver";

	this.maxLogs = 20; // change this to control how many log files are kept per platform

	/*
	change this in the case you normally want a different logging level (can be "quiet", 
	"normal" or "verbose")
	*/
	this.defaultLogLevel = "normal";

	/*
	ports that socket based test runs will use for communication between driver and harness.
	Android and iOS use different ports in order to get around some behavior in ADB
	*/
	this.androidSocketPort = 40404;
	this.iosSocketPort = 40405;

	// max number of connection attempts (driver to harness) for socket based test runs
	this.maxSocketConnectAttempts = 20;

	// port that the driver will listen on for http based test runs
	this.httpPort = 8125;

	/*
	if no timeout value is set in a suite file for a specific test, this value will be used as 
	a timeout value for the test
	*/
	this.defaultTestTimeout = 10000;

	// string representing a tab (currently only used for printing results)
	this.tabString = "   ";

	/*
	default sim version to use when running ios test pass if a specific sim version is not 
	specified with the --sim-version argument to the start command
	*/
	this.defaultIosSimVersion = "5.0";


	// optional values
	/*******************************************************************************/

	/*
	list of directories that contain additonal test configs that should be included in the list of 
	harness configs that will be run when a test pass is started (assuming no specific config set
	is specified)

	Example: this.customHarnessConfigDirs = ["/tmp/myconfigs"];
	*/

	/*
	default platform to be used if the --platform argument is not provided

	Example: this.defaultPlatform = "android";
	*/

}
