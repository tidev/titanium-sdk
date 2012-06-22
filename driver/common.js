/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: common file across platforms for driver tasks
 *
 * Description: contains common logic used by all platforms when executing driver tasks.
 * Most of the logic defined here represents only partial pieces of an overall task and most
 * of these functions are invoked by the platform specific task handlers.  As the test format
 * between driver and harness is not platform specific, the handling mechanism is defined in
 * this file.
 */

var path = require("path");

var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var self = this;
	var suites;
	var tests = [];
	var currentConfig;
	var currentSuite;
	var currentTest;
	var selectedConfig;
	var selectedSuite;
	var selectedTest;
	var timer;

	/*
	 * invoked each time a run of a config is started.  the commandElements argument is only
	 * defined the first time this function is called at the start of a test pass.  the overall
	 * purpose of this function is to cycle configs during a test pass and reset other state 
	 * variables
	 */
	this.startTestPass = function(commandElements, callback) {
		var postCommandCallback = function() {
			currentSuite = 0;
			currentTest = 0;
			callback();
		};

		if (commandElements) {
			var commandCallback = function() {
				var selectedConfigArg = util.getArgument(commandElements, "--config");
				if (selectedConfigArg) {
					var numConfigs = driverGlobal.harnessConfigs.length;
					for (var i = 0; i < numConfigs; i++) {
						if (selectedConfigArg == driverGlobal.harnessConfigs[i]) {
							currentConfig = i;
							selectedConfig = i;
							break;
						}
					}

					if (selectedConfig == undefined) {
						util.log("specified config is not recognized, ignoring");
					}
				}

				selectedSuite = util.getArgument(commandElements, "--suite");
				selectedTest = util.getArgument(commandElements, "--test");

				postCommandCallback();
			};

			currentConfig = 0;
			selectedConfig = undefined;
			util.rotateLogs(commandCallback);

		} else {
			postCommandCallback();
		}
	};

	/*
	 * basically this function handles picking between starting a new config pass and finishing
	 * the test pass
	 */
	this.finishTestPass = function(passFinishedCallback) {
		if ((currentConfig < (driverGlobal.harnessConfigs.length - 1)) && (selectedConfig == undefined)) {
			currentConfig++;
			driverGlobal.platform.startTestPass();

		} else {
			util.closeLog();

			var numConfigs = driverGlobal.results.length;
			for (var i = 0; i < numConfigs; i++) {
				driverGlobal.results[i].configSuites = [];
			}

			passFinishedCallback();
		}
	};

	this.createHarness = function(platform, command, successCallback, errorCallback) {
		var createCallback = function() {
			try {
				fs.mkdirSync(driverGlobal.tempDir + "/harness/" + platform, 0777);

			} catch(e) {
				util.log("temp " + platform + " harness dir already exist");
			}

			util.runCommand(command, 2, function(error) {
				if (error != null) {
					util.log("error encountered when created harness: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					util.log("harness created");
					updateHarness(platform, successCallback, errorCallback);
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/" + platform + "/harness/tiapp.xml")) {
			this.deleteHarness(platform, createCallback);

		} else {
			createCallback();
		}
	};

	/*
	 * makes sure that the newly created harness contains the correct tiapp.xml and resources
	 * based on the harness template
	 */
	var updateHarness = function(platform, successCallback, errorCallback) {
		var updateResourcesCallback = function() {
			util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/Resources/* " + driverGlobal.harnessDir + "/" + platform + "/harness/Resources", 2, function(error) {
				if (error != null) {
					util.log("unable to update resources for harness: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					util.log("resources updated for harness");
					updateAppjsCallback();
				}
			});
		};

		var updateAppjsCallback = function() {
			util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/configs/" + driverGlobal.harnessConfigs[currentConfig] + "/app.js " + driverGlobal.harnessDir + "/" + platform + "/harness/Resources", 2, function(error) {
				if (error != null) {
					util.log("unable to update app.js for harness: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					util.log("app.js updated for harness");
					if (successCallback) {
						successCallback();
					}
				}
			});
		};

		util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/configs/" + driverGlobal.harnessConfigs[currentConfig] + "/tiapp.xml " + driverGlobal.harnessDir + "/" + platform + "/harness", 2, function(error) {
			if (error != null) {
				util.log("unable to update tiapp.xml for harness: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				util.log("tiapp.xml updated for harness");
				updateResourcesCallback();
			}
		});
	};

	this.deleteHarness = function(platform, callback) {
		if (path.existsSync(driverGlobal.harnessDir + "/" + platform + "/harness")) {
			util.runCommand("rm -r " + driverGlobal.harnessDir + "/" + platform + "/harness", 0, function(error) {
				if (error != null) {
					util.log("error encountered when deleting harness: " + error);

				} else {
					util.log("harness deleted");
				}

				callback();
			});

		} else {
			callback();
		}
	};

	/*
	this function handles messages from the driver and implements the communication protocol 
	outlined in the driver.js comment section
	*/
	this.processHarnessMessage = function(rawMessage) {
		var message;
		try {
			message = eval("(" + rawMessage + ")");
		} catch(e) {
			// this means something has gone waaaaaay wrong 
			console.log("exception <" + e + "> occured when trying to evaluate message from Driver");
			exit(1);
		}

		var responseData = "";

		if ((typeof message) != "object") {
			util.log("invalid message, expecting object");
			return responseData;
		}

		if (message.type == "connect") {
			responseData = "connect|" + driverGlobal.httpHost + "|" + driverGlobal.httpPort;

		} else if (message.type == "ready") {
			responseData = "getSuites";

		} else if (message.type == "suites") {
			suites = message.suites;

			if (selectedSuite) {
				var found = false;

				for (var i = 0; i < suites.length; i++) {
					if (selectedSuite == suites[i].name) {
						currentSuite = i;
						responseData = startSuite();
						found = true;
					}
				}

				if (!found) {
					util.log("specified suite not found");
					driverGlobal.platform.finishTestPass();
				}

			} else {
				if (suites.length == 0) {
					util.log("no suites found for configuration");
					driverGlobal.platform.finishTestPass();

				} else {
					responseData = startSuite();
				}
			}

		} else if (message.type == "tests") {
			tests[currentSuite] = message.tests;

			var numSuites = driverGlobal.results[currentConfig].configSuites.length;
			var found = false;
			for (var i = 0; i < numSuites; i++) {
				if (suites[currentSuite].name == driverGlobal.results[currentConfig].configSuites[i].suiteName) {
					found = true;
				}
			}

			if (!found) {
				driverGlobal.results[currentConfig].configSuites.push({
					suiteName: suites[currentSuite].name,
					suiteTests: []
				});
			}

			if (selectedSuite && selectedTest) {
				var found = false;

				for (var i = 0; i < tests[currentSuite].length; i++) {
					if (selectedTest == tests[currentSuite][i].name) {
						currentTest = i;
						found = true;
						break;
					}
				}

				if (found) {
					responseData = startTest();

				} else {
					util.log("specified test not found");
					driverGlobal.platform.finishTestPass();
				}

			} else {
				responseData = startTest();
			}

		} else if (message.type == "result") {
			clearTimeout(timer);

			var numSuites = driverGlobal.results[currentConfig].configSuites.length;
			driverGlobal.results[currentConfig].configSuites[numSuites - 1].suiteTests.push({
				testName: message.test,
				testResult: {
					result: message.result,
					description: message.description,
					duration: message.duration
				}
			});

			util.log("suite<" + message.suite + "> test<" + message.test + "> result<" + message.result + ">");

			if (selectedSuite && selectedTest) {
				driverGlobal.platform.finishTestPass();

			} else {
				var next = incrementTest();
				if (next == "suite") {
					responseData = startSuite();

				} else if (next == "test") {
					responseData = startTest();
				}
			}
		}

		return responseData;
	};

	var startSuite = function() {
		return "getTests|" + suites[currentSuite].name;
	};

	var startTest = function() {
		var timeout = tests[currentSuite][currentTest].timeout;
		if (timeout) {
			timeout = parseInt(timeout);

		} else {
			timeout = driverGlobal.defaultTestTimeout;
		}
		/*
		add this so that we give a little overhead for network latency.  The goal here is that is 
		that general network overhead doesn't eat up time out of a specific test timeout
		*/
		timeout += 500;

		timer = setTimeout(function() {
			var numSuites = driverGlobal.results[currentConfig].configSuites.length;
			driverGlobal.results[currentConfig].configSuites[numSuites - 1].suiteTests.push({
				testName: tests[currentSuite][currentTest].name,
				testResult: {
					result: "timeout",
					description: "",
					duration: timeout
				}
			});

			util.log("suite<" + suites[currentSuite].name + "> test<" + tests[currentSuite][currentTest].name + "> result<timeout>");

			if (selectedSuite && selectedTest) {
				driverGlobal.platform.finishTestPass();

			} else {
				incrementTest();
				driverGlobal.platform.resumeTestPass();
			}
		}, timeout);

		return "run|" + suites[currentSuite].name + "|" + tests[currentSuite][currentTest].name;
	};

	/*
	 * when a test is finished, update the current test and if need be, roll over into the
	 * next suite.  returns value indicating what the next test position is
	 */
	var incrementTest = function() {
		if (currentTest < (tests[currentSuite].length - 1)) {
			currentTest++;
			return "test";

		} else {
			util.log("test run finished for suite<" + suites[currentSuite].name + ">");

			if (currentSuite < (suites.length - 1)) {
				if (selectedSuite) {
					driverGlobal.platform.finishTestPass();

				} else {
					currentTest = 0;
					currentSuite++;
					return "suite";
				}

			} else {
				util.log("all suites completed");
				driverGlobal.platform.finishTestPass();
			}
		}

		return "";
	};
}
