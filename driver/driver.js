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
		0, true);

	process.exit(1);
}

var loadDriverConfig = function() {
	var configFilePath = __dirname + "/driver.cfg";
	if(!(path.existsSync(configFilePath))) {
		console.log("No config file found!  Do the following:\n" +
			"    1) copy the example.cfg to driver.cfg in the root driver directory\n" +
			"    2) update the driver.cfg with appropriate values based on the comments in\n" +
			"       the example.cfg file\n" +
			"    3) restart driver\n");

		process.exit(1);
	}

	var configString = fs.readFileSync(configFilePath);
	try {
		/*
		yes this is eval but a regular JSON object would not give the flexibility of variable 
		expansion and robust commenting that we want in the config file and pulling in a JS object 
		is more "in sync" with the rest of the mechanism than a traditional cfg or xml file
	
		I consider the traditional risks associated with eval acceptable in this specific use case
		*/
		global.driverGlobal = eval('(' + configString + ')');

		// populate the driverGlobal with non config file properties
		driverGlobal.logLevels = {
			quiet: 0,
			normal: 1,
			verbose: 2
		}

		// translate the defaultLogLevel from string to numeric value defined in logLevels
		if(driverGlobal.logLevels[driverGlobal.defaultLogLevel]) {
			driverGlobal.defaultLogLevel = driverGlobal.logLevels[driverGlobal.defaultLogLevel];

		} else {
			// not specified, just set to normal as a fallback
			driverGlobal.defaultLogLevel = driverGlobal.logLevels.normal;
		}
		driverGlobal.logLevel = driverGlobal.defaultLogLevel; // set default

		driverGlobal.driverDir = __dirname;
		driverGlobal.platform = undefined;

		// basically just a list of tiapp.xml and app.js combinations
		driverGlobal.harnessConfigs = [];

		driverGlobal.results = [];
		driverGlobal.httpHost = "http://" + require("os").networkInterfaces().en1[1].address;

	} catch(e) {
		console.log("error occurred when loading config object: " + e)
		process.exit(1);
	}
}

var processArguments = function() {
	/*
	 * mode represents whether the driver is being run via command line(local) or remotely
	 * such as would be the case for CI integration(remote)
	 */
	mode = util.getArgument(process.argv, "--mode");
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
	try {
		driverGlobal.platform = require(__dirname + "/platforms/" + platform);

	} catch(e) {
		console.log("unable to load platform module for " + platform + ":" + e);
		printHelp();
	}

	/*
	 * logLevel represents the level of logging that will be printed out to the console.
	 * NOTE: this does not change what gets written to the log file
	 */
	var logLevel = util.getArgument(process.argv, "--log-level");
	if(driverGlobal.logLevels[logLevel] !== undefined) {
		driverGlobal.logLevel = driverGlobal.logLevels[logLevel];

	} else {
		console.log("unrecognized log level, ignoring");
	}
}

var setupDirs = function() {
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
}

var buildHarnessConfigs = function() {
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
}


var mode; // set by processArguments()

loadDriverConfig();
processArguments();
setupDirs();
buildHarnessConfigs();
mode.start();

