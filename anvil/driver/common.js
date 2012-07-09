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

var fs = require("fs");
var path = require("path");

var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var self = this;

	/*
	any key/value pairs stored in here will be injected into the harness config tiapp.xml as 
	property entries
	*/
	this.customTiappXmlProperties = {};

	// keeps track of state within the harness set/config list
	var configs;
	var configSetIndex;
	var configIndex;

	/*
	keeps track of where the specified harness set/config can be found within the harness set/
	config list
	*/
	var selectedConfigSetIndex;
	var selectedConfigIndex;

	// specified suite and test args (pulled off at the start of the run so store them)
	var selectedSuiteArg;
	var selectedTestArg;

	/*
	keep track of where we are in the result set which can be different from the 
	set/config master list
	*/
	var results;
	var resultConfigSetIndex;
	var resultConfigIndex;
	var resultSuiteIndex;
	var resultTestIndex;

	// actual list of suites and tests reported by the harness
	var reportedSuites;
	var reportedTests;

	var timer; // set per test in order to catch timeouts

	/*
	called once per test pass no matter how many config sets, configs, suites or tests happen to be 
	involved.  This is where general init or cleaning logic that needs to occur before a test run 
	kicks off should live.  Inside this method, the harness config list will be built (or rebuilt), 
	the arguments given to the start command will be pulled off and processed (in the case of a 
	specified config set or config), the log file for the test run will be initialized and the 
	result set will be initialized
	*/
	this.startTestPass = function(startArgs, successCallback, errorCallback) {
		configs = [];
		results = [];
		configSetIndex = 0;
		configIndex = 0;
		selectedConfigSetIndex = null;
		selectedConfigIndex = null;

		// build list of tiapp.xml and app.js combinations
		function loadHarnessConfigs() {
			function loadConfig(setIndex, configDir, configName) {
				var stat = fs.statSync(configDir + "/" + configName);
				if (stat.isDirectory()) {
					configs[setIndex].setConfigs.push({
						configDir: configDir,
						configName: configName
					});
				}
			}

			// load standard configs
			var files = fs.readdirSync(driverGlobal.configSetDir + "/configs");
			if (files.length > 0) {
				configs.push({
					setDir: driverGlobal.configSetDir,
					setName: "standard",
					setConfigs: []
				});

				for (var i = 0; i < files.length; i++) {
					loadConfig((configs.length - 1), driverGlobal.configSetDir + "/configs", files[i]);
				}
			}

			// load custom configs
			if ((typeof driverGlobal.config.customHarnessConfigDirs) !== "undefined") {
				if (Object.prototype.toString.call(driverGlobal.config.customHarnessConfigDirs) === "[object Array]") {
					for (var i = 0; i < driverGlobal.config.customHarnessConfigDirs.length; i++) {
						var configSetDir = driverGlobal.config.customHarnessConfigDirs[i];
						var configSetName;

						// load the config set name
						if (path.existsSync(configSetDir + "/name.txt")) {
							configSetName = util.trimStringRight(fs.readFileSync(configSetDir + "/name.txt", "ascii"));

						} else {
							util.log("the custom harness config set at <" + configSetDir + "/name.txt" + 
							"> does not contain a name.txt file that provides a harness config set name, ignoring",
								driverGlobal.logLevels.quiet);

							continue;
						}

						var files = fs.readdirSync(configSetDir + "/configs");
						if (files.length > 0) {
							configs.push({
								setDir: configSetDir,
								setName: configSetName,
								setConfigs: []
							});

							for (var j = 0; j < files.length; j++) {
								loadConfig((configs.length - 1), configSetDir + "/configs", files[j]);
							}
						}
					}

				} else {
					util.log("the customHarnessConfigDirs property in the config module is set but is not an array",
						driverGlobal.logLevels.quiet);
				}
			}

			if (configs.length < 1) {
				util.log("there must be at least one harness config, exiting");
				process.exit(1);
			}
		}

		/*
		process the arguments passed to the "start" command (not the arguments that were passed to 
		the driver itself)
		*/
		var processStartArgsCallback = function() {
			var errorState = false;

			var configSetArg = util.getArgument(startArgs, "--config-set");
			if ((typeof configSetArg) !== "undefined") {
				var numConfigSets = configs.length;
				for (var i = 0; i < numConfigSets; i++) {
					if (configSetArg === configs[i].setName) {
						configSetIndex = i;
						selectedConfigSetIndex = i;

						break;
					}
				}

				if (selectedConfigSetIndex === null) {
					util.log("specified config set is not recognized");
					errorState = true;
				}
			}

			// config set must have also been specified if there is more than a single config set
			var configArg = util.getArgument(startArgs, "--config");
			if ((selectedConfigSetIndex !== null) || (configs.length === 1 )) {
				if ((typeof configArg) !== "undefined") {
					var numConfigs = configs[configSetIndex].setConfigs.length;
					for (var i = 0; i < numConfigs; i++) {
						if (configArg === configs[configSetIndex].setConfigs[i].configName) {
							configIndex = i;
							selectedConfigIndex = i;

							break;
						}
					}

					if (selectedConfigIndex === null) {
						util.log("specified config is not recognized");
						errorState = true;
					}
				}

			} else if ((selectedConfigSetIndex === null) && ((typeof configArg) !== "undefined")) {
				util.log("valid --config-set argument must be provided when --config is specified");
				errorState = true;
			}

			if (!errorState) {
				selectedSuiteArg = util.getArgument(startArgs, "--suite");
				selectedTestArg = util.getArgument(startArgs, "--test");
				successCallback();

			} else {
				errorCallback();
			}
		};

		loadHarnessConfigs();
		util.openLog(processStartArgsCallback);
	};

	/*
	 * invoked each time a run of a config is started.  the commandElements argument is only
	 * defined the first time this function is called at the start of a test pass.  the overall
	 * purpose of this function is to cycle configs during a test pass and reset other state 
	 * variables
	 */
	this.startConfig = function(callback) {
		/*
		this is the only safe place to reset the suite and test states - if done in the message 
		processing there is a chance that the config has just been restarted to deal with a timeout 
		and the states would be reset prematurely
		*/
		resultSuiteIndex = 0;
		resultTestIndex = 0;

		// add the config set to the results if it does not exist
		var foundSet = false;
		for (var i = 0; i < results.length; i++) {
			if (results[i].setName === configs[configSetIndex].setName) {
				foundSet = true;
			}
		}
		if (!foundSet) {
			results.push({
				setName: configs[configSetIndex].setName,
				setConfigs: []
			});
			resultConfigSetIndex = results.length - 1;
		}

		// add the config to the config set entry in the results (no risk of duplicate entry)
		results[resultConfigSetIndex].setConfigs.push({
			configName: configs[configSetIndex].setConfigs[configIndex].configName,
			configSuites: []
		});
		resultConfigIndex = results[resultConfigSetIndex].setConfigs.length - 1;

		callback();
	};

	/*
	 * basically this function handles picking between starting a new config pass and finishing
	 * the test pass
	 */
	this.finishConfig = function(passFinishedCallback) {
		var finishPass = false;

		// roll to the next config and roll to the next set if need be
		configIndex++;
		if ((configIndex + 1) > configs[configSetIndex].setConfigs.length) {
			configSetIndex++;
			if ((configSetIndex + 1) > configs.length) {
				finishPass = true; // this was the last set, finish the whole pass

			} else {
				// this was the last config in the set, reset for the start of the new set
				configIndex = 0;
			}
		}

		if (selectedConfigIndex !== null) {
			/*
			if we are here then that means that the specified config has finished and we don't 
			support running a specified config across multiple sets so finish the pass
			*/
			finishPass = true;
		}

		if (finishPass) {
			util.closeLog();
			passFinishedCallback(results);

		} else {
			driverGlobal.platform.startConfig();
		}
	};

	this.createHarness = function(platform, command, successCallback, errorCallback) {
		var harnessPlatformDir = driverGlobal.harnessDir + "/" + platform;

		var createCallback = function() {
			try {
				fs.mkdirSync(harnessPlatformDir, 0777);

			} catch(e) {
				util.log("temp " + platform + " harness dir already exist");
			}

			util.runCommand(command, util.logStdout, function(error) {
				if (error !== null) {
					util.log("error encountered when created harness: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					util.log("harness created");
					updateHarness(platform, successCallback, errorCallback);
				}
			});
		};

		if (path.existsSync(harnessPlatformDir + "/harness/tiapp.xml")) {
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
		var config = configs[configSetIndex].setConfigs[configIndex];
		var configDir = config.configDir + "/" + config.configName;
		var harnessPlatformDir = driverGlobal.harnessDir + "/" + platform;

		var updateSuitesCallback = function() {
			util.runCommand("cp -r " + configs[configSetIndex].setDir + "/Resources " + harnessPlatformDir + "/harness", util.logStdout, function(error) {
				if (error !== null) {
					util.log("unable to update the harness suites: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					util.log("harness suites updated");
					updateTiappCallback();
				}
			});
		};

		var updateTiappCallback = function() {
			function injectCustomTiappXmlProperties() {
				if (self.customTiappXmlProperties.length < 1) {
					// nothing custom to add so leave the copy alone
					return;
				}

				var tiappXmlPath = harnessPlatformDir + "/harness/tiapp.xml";
				var tiappXmlContents;

				// load the config set name
				if (path.existsSync(tiappXmlPath)) {
					try {
						tiappXmlContents = fs.readFileSync(tiappXmlPath, "utf8");

					} catch(e) {
						self.log("exception <" + e + "> occurred when reading tiapp.xml at: " + tiappXmlPath);
					}

				} else {
					/*
					this should not happen since the path to the tiapp.xml is passed in and it is assumed 
					that the file should exist in the harness before we start injecting values.  Die hard!
					*/
					util.log("no tiapp.xml file found at: " + tiappXmlPath, driverGlobal.logLevels.quiet);
					process.exit(1);
				}

				var splitPos = tiappXmlContents.indexOf("</ti:app>");
				if (splitPos === -1) {
					/*
					this could only happen if the tiapp.xml in the config is messed up so die 
					hard if it happens
					*/
					util.log("no closing ti:app tag found in the tiapp.xml file");
					process.exit(1);
				}
				var preSplit = tiappXmlContents.substring(0, splitPos);
				var postSplit = tiappXmlContents.substring(splitPos, tiappXmlContents.length - 1);

				var newTiappXmlContents = preSplit;
				for (var key in self.customTiappXmlProperties) {
					if (self.customTiappXmlProperties.hasOwnProperty(key)) {
						var foundPos = tiappXmlContents.indexOf("<property name=\"" + key + "\"");
						if (foundPos === -1) {
							/*
							make sure to only inject if the value doesn't already exist in the 
							config tiapp.xml so we avoid duplicates
							*/
							newTiappXmlContents += "\t<property name=\"" + key + "\">" + self.customTiappXmlProperties[key] + "</property>\n";
						}
					}
				}
				newTiappXmlContents += postSplit;

				fs.writeFileSync(tiappXmlPath, newTiappXmlContents);
			}

			util.runCommand("cp -r " + configDir + "/tiapp.xml " + harnessPlatformDir + "/harness", util.logStdout, function(error) {
				if (error !== null) {
					util.log("unable to update the harness tiapp.xml: " + error);
					if (errorCallback) {
						errorCallback();
					}

				} else {
					injectCustomTiappXmlProperties();
					util.log("harness tiapp.xml updated");

					updateAppjsCallback();
				}
			});
		};

		var updateAppjsCallback = function() {
			if (path.existsSync(configDir + "/app.js")) {
				util.runCommand("cp -r " + configDir + "/app.js " + harnessPlatformDir + "/harness/Resources", util.logStdout, function(error) {
					if (error !== null) {
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

			} else {
				successCallback();
			}
		};

		// update the harness based on the harness template packaged with the driver
		util.runCommand("cp -r " + driverGlobal.harnessTemplateDir + "/* " + harnessPlatformDir + "/harness/Resources", util.logStdout, function(error) {
			if (error !== null) {
				util.log("unable to update harness with template: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				util.log("harness updated with template");
				updateSuitesCallback();
			}
		});
	};

	this.deleteHarness = function(platform, callback) {
		var harnessDir = driverGlobal.harnessDir + "/" + platform + "/harness";

		if (path.existsSync(harnessDir)) {
			util.runCommand("rm -r " + harnessDir, util.logNone, function(error) {
				if (error !== null) {
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
			console.log("exception <" + e + "> occured when trying to evaluate message <" +
				rawMessage + "> from Driver");

			process.exit(1);
		}

		var responseData = "";

		if ((typeof message) !== "object") {
			util.log("invalid message, expecting object");
			return responseData;
		}

		if (message.type === "ready") {
			responseData = "getSuites";

		} else if (message.type === "suites") {
			reportedSuites = message.suites;

			if (selectedSuiteArg) {
				var found = false;

				// does the specified suite even exist in the current config?
				for (var i = 0; i < reportedSuites.length; i++) {
					if (selectedSuiteArg === reportedSuites[i].name) {
						/*
						usually we let incrementTest() handle rolling this value but in this case
						we need to jump to the specified index
						*/
						resultSuiteIndex = i;

						responseData = startSuite();
						found = true;
					}
				}

				if (!found) {
					util.log("specified suite not found");

					// maybe the next config has the suite we are looking for?
					driverGlobal.platform.finishConfig();
				}

			} else {
				if (reportedSuites.length === 0) {
					util.log("no suites found for configuration");
					driverGlobal.platform.finishConfig();

				} else {
					responseData = startSuite();
				}
			}

		} else if (message.type === "tests") {
			var found = false;

			reportedTests = message.tests;

			/*
			does the current suite already exist in the results?  Since we restart a suite when a 
			timeout occurs, it is possible to already have the suite in the results
			*/
			var configSuites = results[resultConfigSetIndex].setConfigs[resultConfigIndex].configSuites;
			var numSuites = configSuites.length;
			for (var i = 0; i < numSuites; i++) {
				if (reportedSuites[resultSuiteIndex].name === configSuites[i].suiteName) {
					found = true;
				}
			}

			// only add the suite to the results if the suite doesn't already exist in the results
			if (!found) {
				configSuites.push({
					suiteName: reportedSuites[resultSuiteIndex].name,
					suiteTests: []
				});
			}

			// in order to run a specific test, the suite must also be specified. Ignore otherwise
			if (selectedSuiteArg && selectedTestArg) {
				var found = false;

				for (var i = 0; i < reportedTests.length; i++) {
					if (selectedTestArg === reportedTests[i].name) {
						resultTestIndex = i;
						found = true;

						break;
					}
				}

				if (found) {
					responseData = startTest();

				} else {
					/*
					we can finish the entire config here since we know that a suite had to be 
					specified and therefore this suite is the only one being run for the config.
					In the case of the test not being found, we could just ignore the arg and run 
					the entire suite but I would prefer to log an error and just finish the config 
					rather than running tests that the user did not specify
					*/
					util.log("specified test not found");
					driverGlobal.platform.finishConfig();
				}

			} else {
				responseData = startTest();
			}

		} else if (message.type === "result") {
			/*
			now that we have a result, make sure we cancel the timer first so we don't risk 
			triggering a exception while we process the result
			*/
			clearTimeout(timer);

			addResult(message.result, message.description, message.duration);
			util.log("suite<" + message.suite + "> test<" + message.test + "> result<" + message.result + ">");

			if (selectedSuiteArg && selectedTestArg) {
				/*
				since this was the only test in the config that we needed to run just move onto the 
				next config
				*/
				driverGlobal.platform.finishConfig();

			} else {
				var next = incrementTest();
				if (next === "suite") {
					responseData = startSuite();

				} else if (next === "test") {
					responseData = startTest();
				}
			}
		}

		return responseData;
	};

	var startSuite = function() {
		return "getTests|" + reportedSuites[resultSuiteIndex].name;
	};

	var startTest = function() {
		var timeout = driverGlobal.config.defaultTestTimeout;

		// if there is a custom timeout set for the test, override the default
		var testTimeout = reportedTests[resultTestIndex].timeout;
		if ((typeof testTimeout) !== "undefined") {
			timeout = parseInt(testTimeout);
		}

		/*
		add this so that we give a little overhead for network latency.  The goal here is that is 
		that general network overhead doesn't eat up time out of a specific test timeout
		*/
		timeout += 500;

		var suiteName = reportedSuites[resultSuiteIndex].name;
		var testName = reportedTests[resultTestIndex].name;

		/*
		we need a fall back in the case of a test timing out which might occur for a variety of 
		reason such as poorly written test, legitimate test failure of device issue
		*/
		timer = setTimeout(function() {
			addResult("timeout", "", timeout);
			util.log("suite<" + suiteName + "> test<" + testName + "> result<timeout>");

			if (selectedSuiteArg && selectedTestArg) {
				driverGlobal.platform.finishConfig();

			} else {
				/*
				make sure we skip to the next test in the event of failure otherwise this will 
				loop forever (assuming that the timeout is consistent with each run of the test)
				*/
				incrementTest();

				driverGlobal.platform.resumeConfig();
			}
		}, timeout);

		console.log("running suite<" + suiteName + "> test<" + testName + ">...");
		return "run|" + suiteName + "|" + testName;
	};

	function addResult(result, description, duration) {
		var configSuites = results[resultConfigSetIndex].setConfigs[resultConfigIndex].configSuites;
		var numSuites = configSuites.length;
		configSuites[numSuites - 1].suiteTests.push({
			testName: reportedTests[resultTestIndex].name,
			testResult: {
				result: result,
				description: description,
				duration: duration
			}
		});
	}

	/*
	 * when a test is finished, update the current test and if need be, roll over into the
	 * next suite.  returns value indicating what the next test position is
	 */
	var incrementTest = function() {
		if (resultTestIndex < (reportedTests.length - 1)) {
			resultTestIndex++;

			return "test";

		} else {
			util.log("test run finished for suite<" + reportedSuites[resultSuiteIndex].name + ">");

			if (resultSuiteIndex < (reportedSuites.length - 1)) {
				if (selectedSuiteArg) {
					driverGlobal.platform.finishConfig();

				} else {
					resultTestIndex = 0;
					resultSuiteIndex++;

					return "suite";
				}

			} else {
				util.log("all suites completed");
				driverGlobal.platform.finishConfig();
			}
		}

		return "";
	};
};
