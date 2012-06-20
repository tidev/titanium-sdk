/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: entry point for Anvil Driver (IE: "node driver.js <args>")
 *
 * Description: file invoked by node.js when the Driver is started.  Contains definition
 * of global properties object, handles initial argument checking and general initialization
 */

var fs = require("fs");
var path = require("path");

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
	util.log("Usage: \"node driver.js --platform=<platform> [--mode=<mode>] [--log-level=<log level>] [--command=<command>]\"\n"
		+ "Modes:\n"
		+ "    local - run Driver locally via manual commands (default)\n"
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
if(mode == "remote") {
	mode = require("./remoteMode.js");

} else if(mode != undefined && mode != "local") {
	/*
	don't just use the default - if they set an incorrect mode they should be notified there is 
	a problem
	*/
	console.log("unrecognized mode");
	printHelp();

} else {
	// default
	mode = require("./localMode.js");
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
var logLevel = util.getArgument(process.argv, "--log-level");
if(logLevel) {
	driverGlobal.logLevel = logLevel;
}

// make sure the require temp directories exist
if(!(path.existsSync(driverGlobal.tempDir))) {
	try {
		fs.mkdirSync(driverGlobal.tempDir, 0777);

	} catch(e) {
		console.log("exception <" + e + "> occurred when creating " + driverGlobal.tempDir);
	}
}

var tmpHarnessDir = driverGlobal.tempDir + "/harness";
if(!(path.existsSync(tmpHarnessDir))) {
	try {
		fs.mkdirSync(tmpHarnessDir, 0777);

	} catch(e) {
		console.log("exception <" + e + "> occurred when creating " + tmpHarnessDir);
	}
}

var tmpLogsDir = driverGlobal.tempDir + "/logs";
if(!(path.existsSync(tmpLogsDir))) {
	try {
		fs.mkdirSync(tmpLogsDir, 0777);

	} catch(e) {
		console.log("exception <" + e + "> occurred when creating " + tmpLogsDir);
	}
}

var tmpPlatformLogsDir = driverGlobal.tempDir + "/logs/" + driverGlobal.platform.name;
if(!(path.existsSync(tmpPlatformLogsDir))) {
	try {
		fs.mkdirSync(tmpPlatformLogsDir, 0777);

	} catch(e) {
		console.log("exception <" + e + "> occurred when creating " + tmpPlatformLogsDir);
	}
}

mode.start();

