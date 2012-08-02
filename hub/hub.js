var fs = require("fs");

var messageHandler = require(__dirname + "/messageHandler");
var server = require(__dirname + "/server");
var util = require(__dirname + "/util");

function loadConfigModule() {
	var configModulePath = __dirname + "/config.js";
	if (!(fs.existsSync(configModulePath))) {
		console.log("No config module found!  Do the following:\n" +
			util.getTabs(1) + "1) copy the exampleConfig.js to config.js in the root driver directory\n" +
			util.getTabs(1) + "2) update the config.js with appropriate values based on the comments in\n" +
			util.getTabs(1) + "   the exampleConfig.js file\n" +
			util.getTabs(1) + "3) restart hub\n");

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

util.openLog(function() {
	util.runCommand("mysql -uroot < anvil.sql", function(error, stdout, stderr) {
		if (error !== null) {
			console.log("error encountered when running sql script: " + error);
			process.exit(1);

		} else {
			messageHandler.init();
			server.start();
		}
	});
});

