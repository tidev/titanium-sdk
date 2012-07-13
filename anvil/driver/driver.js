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

var mode;

function printUsageAndExit() {
	console.log("\nUsage: \"node driver.js --platform=<platform> [--mode=<mode>] [--log-level=<log level>] [--command=<command>]\"\n"
		+ "Modes (optional - default is local):\n"
		+ "    local - run Driver locally via manual commands (default)\n"
		+ "    remote - run Driver remotely (this should never be selected by hand)\n"
		+ "\n"
		+ "Platforms (optional override if the defaultPlatform config property is set):\n"
		+ "    android - starts driver for Android\n"
		+ "    ios - starts driver for iOS\n"
		+ "    mobileweb - starts driver for Mobile Web\n"
		+ "\n"
		+ "Log level:\n"
		+ "    quiet - only print test results summary and error output\n"
		+ "    normal (default) - print \"quiet\" content along with normal operation output (creating directory, etc)\n"
		+ "    verbose - print \"quiet\" and \"normal\" content along with all debug info such as output seen when calling\n"
		+ "        the platform specific build scripts\n");

	process.exit(1);
}

function init() {
	global.driverGlobal = {};

	// populate the driverGlobal with non config file properties
	driverGlobal.logLevels = {
		quiet: 0,
		normal: 1,
		verbose: 2
	};

	driverGlobal.driverDir = __dirname;
	driverGlobal.configSetDir = driverGlobal.driverDir + "/configSet";
	driverGlobal.harnessTemplateDir = driverGlobal.driverDir + "/harnessResourcesTemplate";

	driverGlobal.platforms = {};

	var platforms = ["android", "ios", "mobileweb"];
	for (var i = 0; i < platforms.length; i++) {
		try {
			driverGlobal.platforms[platforms[i]] = require(driverGlobal.driverDir + "/platforms/" + platforms[i]);;

		} catch(e) {
			console.log("exception occurred when loading platform module for <" + platforms[i] + ">: " + e);
			process.exit(1);
		}
	}

	driverGlobal.results = [];
}

function processCommandLineArgs(callback) {
	/*
	 * mode represents whether the driver is being run via command line(local) or remotely
	 * such as would be the case for CI integration(remote)
	 */
	var modeArg = util.getArgument(process.argv, "--mode");
	if ((typeof modeArg) === "undefined") {
		modeArg = "local";
	}

	var modePath = driverGlobal.driverDir + "/" + modeArg + "Mode.js";
	if (!(path.existsSync(modePath))) {
		console.log("unable to find the specified mode: " + modeArg);
		printUsageAndExit();
	}

	try {
		mode = require(modePath);

	} catch(e) {
		console.log("exception occurred when loading mode module: " + e);
		process.exit(1);
	}

	/*
	 * logLevel represents the level of logging that will be printed out to the console.
	 * NOTE: this does not change what gets written to the log file
	 */
	var logLevelArg = util.getArgument(process.argv, "--log-level");
	if ((typeof logLevelArg) !== "undefined") {
		var logLevel = driverGlobal.logLevels[logLevelArg];
		if ((typeof logLevel) === "undefined") {
			console.log("unrecognized log level: " + logLevelArg);
			printUsageAndExit();
		}

		driverGlobal.logLevel = logLevel;
	}

	// load platform module
	var platformArg = util.getArgument(process.argv, "--platform");
	if ((typeof platformArg) !== "undefined") {
		var specifiedPlatform = driverGlobal.platforms[platformArg];
		if ((typeof specifiedPlatform) === "undefined") {
			console.log("unable to find the specified platform: " + platformArg);
			printUsageAndExit();
		}
		driverGlobal.platform = specifiedPlatform;
	}
}

function loadConfigModule() {
	var configModulePath = __dirname + "/config.js";
	if (!(path.existsSync(configModulePath))) {
		console.log("No config module found!  Do the following:\n" +
			util.getTabs(1) + "1) copy the exampleConfig.js to config.js in the root driver directory\n" +
			util.getTabs(1) + "2) update the config.js with appropriate values based on the comments in\n" +
			util.getTabs(1) + "   the exampleConfig.js file\n" +
			util.getTabs(1) + "3) restart driver\n");

		process.exit(1);
	}

	var config;
	try {
		config = require(configModulePath);

	} catch(e) {
		console.log("exception occurred when loading config module: " + e);
		process.exit(1);
	}

	function checkConfigItem(configItemName, configItemValue, expectedType) {
		var configItemType = (typeof configItemValue);
		if (configItemType === "undefined") {
			printFailureAndExit(configItemName + " property in the config module cannot be undefined");

		} else if (configItemType !== expectedType) {
			printFailureAndExit("androidSdkDir property in the config module should be <" + expectedType +
				"> but was <" + configItemType + ">");
		}
	}

	function printFailureAndExit(errorMessage) {
		console.log(errorMessage);
		process.exit(1);
	}

	checkConfigItem("androidSdkDir", config.androidSdkDir, "string");
	checkConfigItem("tiSdkDir", config.tiSdkDir, "string");
	checkConfigItem("maxLogs", config.maxLogs, "number");
	checkConfigItem("androidSocketPort", config.androidSocketPort, "number");
	checkConfigItem("iosSocketPort", config.iosSocketPort, "number");
	checkConfigItem("maxSocketConnectAttempts", config.maxSocketConnectAttempts, "number");
	checkConfigItem("httpPort", config.httpPort, "number");
	checkConfigItem("defaultTestTimeout", config.defaultTestTimeout, "number");
	checkConfigItem("tabString", config.tabString, "string");
	checkConfigItem("defaultIosSimVersion", config.defaultIosSimVersion, "string");

	// load the defaultPlatform config property and set the global platform property if needed
	new function() {
		if ((typeof driverGlobal.platform === "undefined") ) {
			var defaultPlatformType = (typeof config.defaultPlatform);
			if (defaultPlatformType === "undefined") {
				console.log("the defaultPlatform config property was not set and the " + 
					"--platform argument was not provided.  One of the two must be set or provided");

				printUsageAndExit();

			} else if (defaultPlatformType !== "string") {
				console.log("defaultPlatform property in the config module should be " +
					"<string> but was <" + defaultPlatformType + ">");

				printUsageAndExit();
			}

			var defaultPlatform = driverGlobal.platforms[config.defaultPlatform];
			if ((typeof defaultPlatform) === "undefined") {
				console.log("unable to find the default platform: " + config.defaultPlatform);
				printUsageAndExit();
			}
			driverGlobal.platform = defaultPlatform;
		}
	}

	// load the tempDir config property and setup other properties that rely on the tempDir property
	new function() {
		checkConfigItem("tempDir", config.tempDir, "string");
		driverGlobal.harnessDir = config.tempDir + "/harness";
		driverGlobal.logsDir = config.tempDir + "/logs";
	}

	/*
	load the defaultLogLevel property and setup other properties that rely on the defaultLogLevel
	property
	*/
	new function() {
		checkConfigItem("defaultLogLevel", config.defaultLogLevel, "string");

		// translate the defaultLogLevel from string to number value defined in logLevels
		if (driverGlobal.logLevels[config.defaultLogLevel]) {
			config.defaultLogLevel = driverGlobal.logLevels[config.defaultLogLevel];

		} else {
			// not specified, just set to normal as a fallback
			config.defaultLogLevel = driverGlobal.logLevels.normal;
		}

		if ((typeof driverGlobal.logLevel) === "undefined") {
			driverGlobal.logLevel = config.defaultLogLevel;
		}
	}

	driverGlobal.config = config;
}

function setupTempDirs() {
	function createDir(dir) {
		if (path.existsSync(dir)) {
			return;
		}

		try {
			fs.mkdirSync(dir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + dir);
		}
	}

	createDir(driverGlobal.config.tempDir);
	createDir(driverGlobal.harnessDir);
	createDir(driverGlobal.logsDir);
	createDir(driverGlobal.logsDir + "/" + driverGlobal.platform.name);
}

init();
processCommandLineArgs();
loadConfigModule();
setupTempDirs();
mode.start();

