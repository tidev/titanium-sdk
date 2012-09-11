/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: Entry point for the Anvil hub
 *
 * Description: The hub handles connections from the drivers and CI server in order to drive new 
 * test runs.  Results from test runs are reported back and stored so they can be reported via a 
 * web interface.
 */

/*
TODO:
- change results storage to write to a temp DB first until whole set it loaded and then transfer
into actual results DB.  this will enable any issues during the processing of the results to be 
discarded without impacting the "real" data set
- i am sure there are possible DB optimizations that can be made
*/

var fs = require("fs");

var messageHandler = require(__dirname + "/messageHandler"),
server = require(__dirname + "/server"),
hubUtils = require(__dirname + "/hubUtils");

function loadConfigModule() {
	var configModulePath = __dirname + "/config.js",
	config;

	if (!(fs.existsSync(configModulePath))) {
		console.log("No config module found!  Do the following:\n" +
			hubUtils.getTabs(1) + "1) copy the exampleConfig.js to config.js in the root driver directory\n" +
			hubUtils.getTabs(1) + "2) update the config.js with appropriate values based on the comments in\n" +
			hubUtils.getTabs(1) + "   the exampleConfig.js file\n" +
			hubUtils.getTabs(1) + "3) restart hub\n");

		process.exit(1);
	}

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
			printFailureAndExit("<" + configItemName + "> property in the config module should be <" + expectedType +
				"> but was <" + configItemType + ">");
		}
	}

	function printFailureAndExit(errorMessage) {
		console.log(errorMessage);
		process.exit(1);
	}

	checkConfigItem("maxLogSize", config.maxLogSize, "number");
	checkConfigItem("maxLogs", config.maxLogs, "number");
	checkConfigItem("ciListenPort", config.ciListenPort, "number");
	checkConfigItem("driverListenPort", config.driverListenPort, "number");
	checkConfigItem("dbHost", config.dbHost, "string");
	checkConfigItem("dbUser", config.dbUser, "string");

	hubGlobal.logsDir = "logs";
	hubGlobal.workingDir = "working_dir";

	hubGlobal.config = config;
}

function setupTempDirs() {
	function createDir(dir) {
		if (fs.existsSync(dir)) {
			return;
		}

		try {
			fs.mkdirSync(dir, 0777);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating " + dir);
		}
	}

	createDir(hubGlobal.logsDir);
	createDir(hubGlobal.workingDir);
}

global.hubGlobal = {};
hubGlobal.hubDir = __dirname;

loadConfigModule();
setupTempDirs();

messageHandler.server = server;
server.messageHandler = messageHandler;

hubUtils.openLog(function() {
	hubUtils.runCommand("mysql -uroot < anvil.sql", function(error, stdout, stderr) {
		if (error !== null) {
			console.log("error encountered when running sql script: " + error);
			process.exit(1);

		} else {
			messageHandler.init(server.start);
		}
	});
});

