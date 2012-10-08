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
var path = require("path");
var readline = require("readline");

var driverUtils = require(path.join(driverGlobal.driverDir, "driverUtils"));

module.exports = new function() {
	var readlineInterface = readline.createInterface(process.stdin, process.stdout);

	this.start = function() {
		driverUtils.setCurrentTiSdk();

		var command = driverUtils.getArgument(process.argv, "--command");
		if ((typeof command) === "undefined") {
			var printResultsCallback = function(results) {
				printResults(results, resumeReadingCommands);
			};
			driverGlobal.platform.init(resumeReadingCommands, printResultsCallback);

			readlineInterface.on("line", function(line) {
				readlineInterface.pause();
				driverGlobal.platform.processCommand(driverUtils.trimStringRight(line));
			});

			showPrompt();

		} else {
			var startCallback = function() {
				driverGlobal.platform.init(exitCallback, printAndPackageCallback);
				driverGlobal.platform.processCommand(command);
			};

			var exitCallback = function() {
				process.exit(1);
			};

			var printAndPackageCallback = function(results) {
				printAndPackageResults(results, exitCallback);
			};

			if (path.existsSync(path.join(driverGlobal.logsDir, "json_results"))) {
				wrench.rmdirSyncRecursive(path.join(driverGlobal.logsDir, "json_results"), failSilent);
			}

			startCallback();
		}
	};

	var showPrompt = function() {
		readlineInterface.setPrompt("CLI> ", 5);
		readlineInterface.prompt();
	};

	var resumeReadingCommands = function() {
		showPrompt();
		readlineInterface.resume();
	};

	var printAndPackageResults = function(results, callback) {
		var packageCallback = function() {
			var resultsFile = fs.openSync(path.join(driverGlobal.logsDir, "json_results"), 'w');
			fs.writeSync(resultsFile, JSON.stringify(results));
			fs.closeSync(resultsFile);

			callback();
		};

		printResults(results, packageCallback);
	};

	var printResults = function(results, callback) {
		var passedCount = 0;
		var failedCount = 0;

		driverUtils.log("\nRESULTS SUMMARY:", driverGlobal.logLevels.quiet);

		var numSets = results.length
		for (var i = 0; i < numSets; i++) {
			var numConfigs = results[i].setConfigs.length;
			for (var j = 0; j < numConfigs; j++) {
				var numSuites = results[i].setConfigs[j].configSuites.length;

				if (numSuites > 0) {
					driverUtils.log(driverUtils.getTabs(1) + "Set name <" + results[i].setName + "> Config ID <" + results[i].setConfigs[j].configName + ">:", driverGlobal.logLevels.quiet);

					for (var k = 0; k < numSuites; k++) {
						if (k > 0) {
							driverUtils.log("", driverGlobal.logLevels.quiet);
						}
						driverUtils.log(driverUtils.getTabs(2) + "Suite name <" + results[i].setConfigs[j].configSuites[k].suiteName + ">:", driverGlobal.logLevels.quiet);

						var numTests = results[i].setConfigs[j].configSuites[k].suiteTests.length;
						for (var l = 0; l < numTests; l++) {
							var testName = results[i].setConfigs[j].configSuites[k].suiteTests[l].testName;
							var testDuration = results[i].setConfigs[j].configSuites[k].suiteTests[l].testResult.duration;
							var testResult = results[i].setConfigs[j].configSuites[k].suiteTests[l].testResult.result;

							var testDescription = results[i].setConfigs[j].configSuites[k].suiteTests[l].testResult.description;
							if (testDescription) {
								testDescription = " - " + testDescription;

							} else {
								testDescription = "";
							}
							driverUtils.log(driverUtils.getTabs(3) + testName + " - " + testDuration + "ms - " + testResult + testDescription, driverGlobal.logLevels.quiet);

							if (testResult == "success") {
								passedCount++;

							} else if ((testResult == "error") || (testResult == "exception") || (testResult == "timeout")) {
								failedCount++;
							}
						}
					}

					driverUtils.log("", driverGlobal.logLevels.quiet);
				}
			}
		}

		driverUtils.log(driverUtils.getTabs(1) + "Results count:", driverGlobal.logLevels.quiet);
		driverUtils.log(driverUtils.getTabs(2) + "PASSED - " + passedCount, driverGlobal.logLevels.quiet);
		driverUtils.log(driverUtils.getTabs(2) + "FAILED - " + failedCount, driverGlobal.logLevels.quiet);
		driverUtils.log("", 0);

		callback();
	};
};
