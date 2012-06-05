var readline = require("readline");
var util = require("./util");

module.exports = new function() {
	var self = this;
	var readlineInterface;

	var printHelp = function() {
		console.log("Usage: \"... --mode=local --platform=<platform>\"\n"
			+ "Platforms:\n"
			+ "\tandroid - \n"
			+ "\tios - \n"
			+ "\tmw - \n"
		);

		process.exit(1);
	}

	var startReadingCommands = function() {
		readlineInterface = readline.createInterface(process.stdin, process.stdout);
		readlineInterface.on("line", function(line) {
			readlineInterface.pause();

			driverGlobal.platform.processCommand(line.trim(), self.resumeReadingCommands);
		});

		showPrompt();
	}

	var showPrompt = function() {
		readlineInterface.setPrompt(driverGlobal.prompt, driverGlobal.prompt.length);
		readlineInterface.prompt();
	}

	this.resumeReadingCommands = function() {
		showPrompt();
		readlineInterface.resume();
	}

	this.start = function() {
		var platform = util.getArgument("--platform");
		if(platform == undefined) {
			printHelp();
		}

		if(platform == "android") {
			driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/android");

		} else if(platform == "ios") {
			driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/ios");

		} else if(platform == "mw") {
			driverGlobal.platform = require(driverGlobal.driverDir + "/platforms/mw");

		} else {
			printHelp();
		}

		startReadingCommands();
	}
}
