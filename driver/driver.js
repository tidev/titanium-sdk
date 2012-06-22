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
 *
 *
 * DRIVER / HARNESS COMMUNICATION PROTOCOL:
 * The communication protocol used between the driver and harness is outlined below.  The protocol 
 * is the same when running tests for socket based platforms (Android and iOS currently) but is 
 * slightly modified for http based platforms like Mobile Web.  Messages sent from the Driver to 
 * the harness are in a simple pipe delimited format.  Messages sent from the Harness to the Driver 
 * are all JSON object identified via a "type" property that exists in all messages
 *
 * Messages sent from Driver to Harness:
 *     Name: connect
 *     Description: sent in response to a "connect" message from the Harness.  This is only sent 
 *         when running a test pass on a http based platform (Mobile Web) since socket based 
 *         Harness code skips sending a "connect" message and skip directly to sending a "ready"
 *         message.  This is sent in response to a "connect" message from the Harness
 *     Format: "connect|<http host>|<http port>"
 *
 *     Name: getSuites
 *     Description: request the list of suites that belong to the currently running configuration.
 *         This is sent in response to a "ready" message from the Harness
 *     Format: "getSuites"
 *
 *     Name: getTests
 *     Description: request the list of tests that belong to the specified suite.  This is sent in 
 *         response to a "suites" message from the Harness
 *     Format: "getTests|<suite name>"
 *
 *     Name: run
 *     Description: request the list of tests that belong to the specified suite.  Once the list of 
 *         tests for the a suite is loaded, these message start being sent.  The first one will be 
 *         sent in response to the "tests" message and the rest will be in response to "result" 
 *         messages from the Harness
 *     Format: "run|<suite name>|<test name>"
 *
 * Messages send from Harness to Driver:
 *     Name: connect
 *     Description: this is a message that is only sent to the driver when running a test run for 
 *         platforms that are http based (Mobile Web).  This message is sent once the "page" has 
 *         been loaded and is ready to begin normal message handling.  Upon receiving this message, 
 *         the driver will send a "connect" message back to the Harness with host and port
 *         information
 *     Format: {type: "connect"}
 *
 *     Name: ready
 *     Description: this message indicates to the Driver that the Harness is ready to run tests.
 *         When running a http based test run this message is sent in response to a "connect" 
 *         message from the Driver.  When running a socket based test run this message is sent by 
 *         the Harness upon startup
 *     Format: {type: "ready"}
 *
 *     Name: suites
 *     Description: this message contains a list of suites contained within the Harness.  This is 
 *         sent in response to a "getSuites" message from the Driver
 *     Format: {
 *         type: "suites",
 *         suites: <list of suites>
 *     }
 *
 *     Name: tests
 *     Description: this message contains a list of tests for the specified suite.  This is sent 
 *         in response to a "getTests" message from the Driver
 *     Format: {
 *     {
 *         type: "tests",
 *         tests: <list of tests>
 *     }
 *
 *     Name: result
 *     Description: this message contains the results of a single test
 *     Format: {
 *     {
 *         type: "result",
 *         suite: <suite name>,
 *         test: <test name>,
 *         result: <result>,
 *         description: <result description>,
 *         duration: <time it took for test to run>
 *     }
 */

var fs = require("fs");
var path = require("path");

var util = require("./util");


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
		+ "    quiet - only print test results summary and error output\n"
		+ "    normal (default) - print \"quiet\" content along with normal operation output (creating directory, etc)\n"
		+ "    verbose - print \"quiet\" and \"normal\" content along with all debug info such as output seen when calling\n"
		+ "        the platform specific build scripts\n",
		driverGlobal.logLevels.quiet, true);

	process.exit(1);
};

var loadDriverConfig = function() {
	var configModulePath = __dirname + "/config.js";
	if (!(path.existsSync(configModulePath))) {
		console.log("No config module found!  Do the following:\n" +
			"    1) copy the exampleConfig.js to config.js in the root driver directory\n" +
			"    2) update the config.js with appropriate values based on the comments in\n" +
			"       the exampleConfig.js file\n" +
			"    3) restart driver\n");

		process.exit(1);
	}

	try {
		global.driverGlobal = require(configModulePath);

	} catch(e) {
		console.log("exception occurred when loading config module: " + e);
	}

	// populate the driverGlobal with non config file properties
	driverGlobal.logLevels = {
		quiet: 0,
		normal: 1,
		verbose: 2
	};

	// translate the defaultLogLevel from string to numeric value defined in logLevels
	if (driverGlobal.logLevels[driverGlobal.defaultLogLevel]) {
		driverGlobal.defaultLogLevel = driverGlobal.logLevels[driverGlobal.defaultLogLevel];

	} else {
		// not specified, just set to normal as a fallback
		driverGlobal.defaultLogLevel = driverGlobal.logLevels.normal;
	}
	driverGlobal.logLevel = driverGlobal.defaultLogLevel; // set default

	driverGlobal.driverDir = __dirname;
	driverGlobal.harnessConfigsDir = driverGlobal.driverDir + "/harnessTemplate/configs";
	driverGlobal.harnessDir = driverGlobal.tempDir + "/harness";
	driverGlobal.logsDir = driverGlobal.tempDir + "/logs";

	// basically just a list of tiapp.xml and app.js combinations
	driverGlobal.harnessConfigs = [];

	driverGlobal.results = [];

	function getIpAddress() {
		var networkInterfaces = require("os").networkInterfaces();
		for (i in networkInterfaces) {
			for (j in networkInterfaces[i]) {
				var address = networkInterfaces[i][j];
				if (address.family == 'IPv4' && !(address.internal)) {
					return address.address;
				}
			}
		}
	}

	var ipAddress = getIpAddress();
	if (ipAddress) {
		/*
		if the ip address is undefined then we will throw an error when trying to start the mobile 
		web module (assuming mobile web is the selected platform)
		*/
		driverGlobal.httpHost = "http://" + ipAddress;
	}

	driverGlobal.platform = undefined;
};

var processArguments = function(callback) {
	/*
	 * mode represents whether the driver is being run via command line(local) or remotely
	 * such as would be the case for CI integration(remote)
	 */
	mode = util.getArgument(process.argv, "--mode");
	if (mode == "remote") {
		mode = require("./remoteMode.js");

	} else if (mode != undefined && mode != "local") {
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

	/*
	 * logLevel represents the level of logging that will be printed out to the console.
	 * NOTE: this does not change what gets written to the log file
	 */
	var logLevel = util.getArgument(process.argv, "--log-level");
	if (driverGlobal.logLevels[logLevel] !== undefined) {
		driverGlobal.logLevel = driverGlobal.logLevels[logLevel];

	} else if (logLevel !== undefined) {
		console.log("unrecognized log level, ignoring");
	}

	var platform = util.getArgument(process.argv, "--platform");
	if ((typeof platform) === "undefined") {
		console.log("must specify a platform");
		printHelp();
	}

	/*
	if we can't find a valid address to host a http server then there isn't much point in 
	running the Driver for Mobile Web
	*/
	if ((platform == "mw") && ((typeof driverGlobal.httpHost) == "undefined")) {
		console.log("unable to find valid network address to host server on for Mobile Web, exiting");
		printHelp();
	}

	try {
		driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/" + platform);

	} catch(e) {
		console.log("unable to load platform module for " + platform + ": " + e);
		printHelp();
	}

	/*
	if the platform is not android or mobile web then we need to stop adb in order to make sure 
	port forwarding for adb has been stopped and thus freed up for new connections on that port 
	outside of adb
	*/
	if ((platform != "android") && (platform != "mw")) {
		require(driverGlobal.driverDir +"/platforms/android").stopPortForwarding(callback);

	} else {
		callback();
	}
};

var setupDirs = function() {
	// make sure the require temp directories exist
	if (!(path.existsSync(driverGlobal.tempDir))) {
		try {
			fs.mkdirSync(driverGlobal.tempDir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + driverGlobal.tempDir);
		}
	}

	var tmpHarnessDir = driverGlobal.tempDir + "/harness";
	if (!(path.existsSync(tmpHarnessDir))) {
		try {
			fs.mkdirSync(tmpHarnessDir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + tmpHarnessDir);
		}
	}

	var tmpLogsDir = driverGlobal.tempDir + "/logs";
	if (!(path.existsSync(tmpLogsDir))) {
		try {
			fs.mkdirSync(tmpLogsDir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + tmpLogsDir);
		}
	}

	var tmpPlatformLogsDir = driverGlobal.tempDir + "/logs/" + driverGlobal.platform.name;
	if (!(path.existsSync(tmpPlatformLogsDir))) {
		try {
			fs.mkdirSync(tmpPlatformLogsDir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + tmpPlatformLogsDir);
		}
	}
};

var buildHarnessConfigs = function() {
	// build list of tiapp.xml and app.js combinations
	var files = fs.readdirSync(driverGlobal.harnessConfigsDir);
	for (var i = 0; i < files.length; i++) {
		var stat = fs.statSync(driverGlobal.harnessConfigsDir + "/" + files[i]);
		if (stat.isDirectory()) {
			driverGlobal.harnessConfigs.push(files[i]);
			driverGlobal.results.push({
				configName: files[i],
				configSuites: []
			});
		}
	}

	if (driverGlobal.harnessConfigs.length < 1) {
		util.log("there must be at least one harness config, exiting");
		process.exit(1);
	}
};


var mode; // set by processArguments()

loadDriverConfig();
processArguments(function() {
	setupDirs();
	buildHarnessConfigs();
	mode.start();
});

