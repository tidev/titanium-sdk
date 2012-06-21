/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: contains specific logic for handling running the driver via command line
 *
 * Description: implements simple CLI and handles result reporting once a test pass via
 * command line has finished
 */

var fs = require("fs");
var readline = require("readline");

var util = require("./util");

module.exports = new function() {
	var readlineInterface;

	this.start = function() {
		var command = util.getArgument(process.argv, "--command");
		if(command) {
			var startCallback = function() {
				driverGlobal.platform.init(exitCallback, printAndPackageCallback);
				driverGlobal.platform.processCommand(command);
			}

			var exitCallback = function() {
				process.exit(1);
			}

			var printAndPackageCallback = function() {
				printAndPackageResults(exitCallback);
			}

			util.runCommand("rm -r " + driverGlobal.logsDir + "/json_results", 0, function(error) {
				if(error != null) {
					util.log("error encountered when deleting json results file: " + error);

				} else {
					util.log("json results file deleted");
				}

				startCallback();
			});

		} else {
			var printResultsCallback = function() {
				printResults(resumeReadingCommands);
			}
			driverGlobal.platform.init(resumeReadingCommands, printResultsCallback);

			readlineInterface = readline.createInterface(process.stdin, process.stdout);
			readlineInterface.on("line", function(line) {
				readlineInterface.pause();
				driverGlobal.platform.processCommand(util.rightStringTrim(line));
			});

			showPrompt();
		}
	}

	var showPrompt = function() {
		readlineInterface.setPrompt("CLI>", 4);
		readlineInterface.prompt();
	}

	var resumeReadingCommands = function() {
		showPrompt();
		readlineInterface.resume();
	}

	var printAndPackageResults = function(callback) {
		var packageCallback = function() {
			var resultsFile = fs.openSync(driverGlobal.logsDir + "/json_results", 'w');
			fs.writeSync(resultsFile, JSON.stringify(driverGlobal.results));
			fs.closeSync(resultsFile);

			callback();
		}

		printResults(packageCallback);
	}

	var printResults = function(callback) {
		var passedCount = 0;
		var failedCount = 0;

		util.log("\nRESULTS SUMMARY:", driverGlobal.logLevels.quiet);

		var numConfigs = driverGlobal.results.length;
		for(var i = 0; i < numConfigs; i++) {
			var numSuites = driverGlobal.results[i].configSuites.length;

			if(numSuites > 0) {
				util.log("    Config ID <" + driverGlobal.results[i].configName + ">:", driverGlobal.logLevels.quiet);

				for(var j = 0; j < numSuites; j++) {
					if(j > 0) {
						util.log("", driverGlobal.logLevels.quiet);
					}
					util.log("        Suite name <" + driverGlobal.results[i].configSuites[j].suiteName + ">:", driverGlobal.logLevels.quiet);

					var numTests = driverGlobal.results[i].configSuites[j].suiteTests.length;
					for(var k = 0; k < numTests; k++) {
						var testInfo = driverGlobal.results[i].configSuites[j].suiteTests[k];
						var testName = driverGlobal.results[i].configSuites[j].suiteTests[k].testName;
						var testDuration = driverGlobal.results[i].configSuites[j].suiteTests[k].testResult.duration;
						var testResult = driverGlobal.results[i].configSuites[j].suiteTests[k].testResult.result;

						var testDescription = driverGlobal.results[i].configSuites[j].suiteTests[k].testResult.description;
						if(testDescription) {
							testDescription = " - " + testDescription;

						} else {
							testDescription = "";
						}
						util.log("            " + testName + " - " + testDuration + "ms - " + testResult + testDescription, driverGlobal.logLevels.quiet);

						if(testResult == "success") {
							passedCount++;

						} else if((testResult == "error") || (testResult == "exception") || (testResult == "timeout")) {
							failedCount++;
						}
					}
				}

				util.log("", driverGlobal.logLevels.quiet);
			}
		}

		util.log("    Results count:", driverGlobal.logLevels.quiet);
		util.log("        PASSED - " + passedCount, driverGlobal.logLevels.quiet);
		util.log("        FAILED - " + failedCount, driverGlobal.logLevels.quiet);
		util.log("", 0);

		callback();
	}
}
