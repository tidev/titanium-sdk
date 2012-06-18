/*
 * Purpose: entry point for Anvil Driver (IE: "node driver.js <args>")
 *
 * Description: file invoked by node.js when the Driver is started.  Contains definition
 * of global properties object, handles initial argument checking and general initialization
 */

var fs = require("fs");

var util = require("./util");

global.driverGlobal = new function() {
	var baseDir = "/Users/ocyrus/dev";
	var tiDir = baseDir + "/appcelerator/git/titanium_mobile";

	this.androidSdkDir = baseDir + "/installed/android-sdk-mac_x86";
	this.tiSdkDir = tiDir + "/dist/mobilesdk/osx/2.1.0";
	this.driverDir = tiDir + "/driver";
	this.harnessConfigsDir = this.driverDir + "/harnessTemplate/configs";
	this.tempDir = "/tmp/driver";
	this.harnessDir = this.tempDir + "/harness";

	this.logsDir = this.tempDir + "/logs";
	this.logFilename;
	this.maxLogs = 20;
	this.defaultLogLevel = 1;
	this.logLevel = 1;

	this.harnessConfigs = []; // basically just a list of tiapp.xml and app.js combinations
	this.results = [];

	this.socketPort = 40404;
	this.maxSocketConnectAttempts = 20;
	this.httpHost = "http://" + require("os").networkInterfaces().en1[1].address;
	this.httpPort = 8125;

	this.platform;
	this.defaultTestTimeout = 10000;
}

var printHelp = function() {
	util.log("Usage: \"node driver.js --mode<mode> --platform=<platform> [--logLevel=<log level>] [--command=<command>]\"\n"
		+ "Modes:\n"
		+ "    local - run Driver locally via manual commands\n"
		+ "    remote - run Driver remotely (this should never be selected by hand)\n"
		+ "\n"
		+ "Platforms:\n"
		+ "    android - starts driver for Android\n"
		+ "    ios - starts driver for iOS\n"
		+ "    mw - starts driver for Mobile Web\n"
		+ "\n"
		+ "Log level:\n"
		+ "    0 - only print test results summary and error output\n"
		+ "    1 - print level 0 content along with normal operation output (creating directory, etc)\n"
		+ "    2 - print level 0-1 content along with all debug info such as output seen when calling\n"
		+ "        the platform specific build scripts\n"
	, 0);

	process.exit(1);
}

// build list of tiapp.xml and app.js combinations
var files = fs.readdirSync(driverGlobal.harnessConfigsDir);
for(var i = 0; i < files.length; i++) {
	var stat = fs.statSync(driverGlobal.harnessConfigsDir + "/" + files[i]);
	if(stat.isDirectory()) {
		driverGlobal.harnessConfigs.push(files[i]);
		driverGlobal.results.push({
			configName: files[i],
			configSuites: []
		});
	}
}

if(driverGlobal.harnessConfigs.length < 1) {
	util.log("there must be at least one harness config, exiting");
	process.exit(1);
}

/*
 * mode represents whether the driver is being run via command line(local) or remotely
 * such as would be the case for CI integration(remote)
 */
var mode = util.getArgument(process.argv, "--mode");
if(mode == "local") {
	mode = require("./localMode.js");

} else if(mode == "remote") {
	mode = require("./remoteMode.js");

} else {
	printHelp();
}

var platform = util.getArgument(process.argv, "--platform");
if(platform == "android") {
	driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/android");

} else if(platform == "ios") {
	driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/ios");

} else if(platform == "mw") {
	driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/mw");

} else {
	printHelp();
}

/*
 * logLevel represents the level of logging that will be printed out to the console.
 * NOTE: this does not change what gets written to the log file
 */
var logLevel = util.getArgument(process.argv, "--logLevel");
if(logLevel) {
	driverGlobal.logLevel = logLevel;
}

// make sure the require temp directories exist
try {
	fs.mkdirSync(driverGlobal.tempDir, 0777);

} catch(e) {
}

try {
	fs.mkdirSync(driverGlobal.tempDir + "/harness", 0777);

} catch(e) {
}

try {
	fs.mkdirSync(driverGlobal.tempDir + "/logs", 0777);

} catch(e) {
}

try {
	fs.mkdirSync(driverGlobal.tempDir + "/logs/" + driverGlobal.platform.name, 0777);

} catch(e) {
}

mode.start();

