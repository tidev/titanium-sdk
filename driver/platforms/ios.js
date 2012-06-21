/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: contains specific logic for running driver commands on iOS
 *
 * Description: contains iOS specific wrapper functions around common driver commands
 */

var net = require("net");
var path = require("path");

var common = require(driverGlobal.driverDir + "/common");
var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var self = this;
	var commandFinishedCallback;
	var testPassFinishedCallback;
	var connection;
	var stoppingHarness = false;

	/*
	not sure this needs to be configurable beyond command line argument for the time being so
	leaving it as a hard coded default
	*/
	var defaultSimVersion = "5.0";
	var simVersion;

	this.name = "ios";

	this.init = function(commandCallback, testPassCallback) {
		commandFinishedCallback = commandCallback;
		testPassFinishedCallback = testPassCallback;
	}

	this.processCommand = function(command) {
		var commandElements = command.split(" ");

		if(commandElements[0] == "create") {
			createHarness(commandFinishedCallback, commandFinishedCallback);

		} else if(commandElements[0] == "delete") {
			deleteHarness(commandFinishedCallback);

		} else if(commandElements[0] == "start") {
			self.startTestPass(commandElements);

		} else if(commandElements[0] == "exit") {
			process.exit(1);

		} else {
			util.log("invalid command\n"
				+ "Commands:\n"
				+ "    create - create harness project\n"
				+ "    delete - delete harness project\n"
				+ "    start - starts test run which includes starting over with clean harness project\n"
				+ "        Arguments:\n"
				+ "            --config=<config ID> - runs the specified configuration only\n"
				+ "            --suite=<suite name> - runs the specified suite only\n"
				+ "            --test=<test name> - runs the specified test only (--suite must be specified)\n\n"
				+ "    exit - exit driver\n",
				0, true);

			commandFinishedCallback();
		}
	}

	var createHarness = function(successCallback, errorCallback) {
		common.createHarness(
			"ios",
			driverGlobal.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/ios --platform=iphone --name=harness --type=project --id=com.appcelerator.harness",
			successCallback,
			errorCallback
			);
	}

	var deleteHarness = function(callback) {
		common.deleteHarness("ios", callback);
	}

	this.startTestPass = function(commandElements) {
		var deleteCallback = function() {
			deleteHarness(runCallback);
		}

		var runCallback = function() {
			runHarness(connectCallback, commandFinishedCallback);
		}

		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		}

		// pull out ios specific start arguments
		simVersion = util.getArgument(commandElements, "--sim-version");
		if(!simVersion) {
			simVersion = defaultSimVersion;
		}

		common.startTestPass(commandElements, deleteCallback);
	}

	var runHarness = function(successCallback, errorCallback) {
		var runCallback = function() {
			var stdoutCallback = function(message) {
				util.log(message, driverGlobal.logLevels.verbose);
				if(message.indexOf("[INFO] Application started") > -1) {
					successCallback();
				}
			}

			util.log("running iOS simulator version " + simVersion);

			var args = ["simulator", simVersion, driverGlobal.harnessDir + "/ios/harness", "com.appcelerator.harness", "harness"];
			util.runProcess(driverGlobal.tiSdkDir + "/iphone/builder.py", args, stdoutCallback, 0, function(code) {
				if(code != 0) {
					util.log("error encountered when running harness: " + code);
					errorCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/ios/harness/tiapp.xml")) {
			runCallback();

		} else {
			util.log("harness does not exist, creating");
			createHarness(runCallback, errorCallback);
		}
	}

	var connectToHarness = function(errorCallback) {
		var retryCount = 0;

		var connectCallback = function() {
			connection = net.connect(driverGlobal.socketPort);

			connection.on('data', function(data) {
				var responseData = common.processHarnessMessage(data);
				if(responseData) {
					connection.write(responseData);
				}
			});
			connection.on('close', function() {
				this.destroy();

				if(stoppingHarness == true) {
					stoppingHarness = false;
					return;
				}

				if(retryCount < driverGlobal.maxSocketConnectAttempts) {
					util.log("unable to connect, retry attempt " + (retryCount + 1) + "...");
					retryCount += 1;

					setTimeout(function() {
						connectCallback();
					}, 1000);

				} else {
					util.log("max number of retry attempts reached");
					errorCallback();
				}
			});
			connection.on('error', function() {
				this.destroy();
			});
			connection.on('timeout', function() {
				this.destroy();
			});
		}

		connectCallback();
	}

	// handles restarting the test pass (usually when an error is encountered)
	this.resumeTestPass = function() {
		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		}

		stopHarness();
		runHarness(connectCallback, commandFinishedCallback);
	}

	// called when a config is finished running
	this.finishTestPass = function() {
		stopHarness();

		var finishCallback = function() {
			common.finishTestPass(testPassFinishedCallback);
		}
		closeSimulator(finishCallback);
	}

	var stopHarness = function() {
		stoppingHarness = true;
		connection.destroy();
	}

	var closeSimulator = function(callback) {
		var closeIphoneCallback = function() {
			util.runCommand("/usr/bin/killall 'iPhone Simulator'", 2, function(error) {
				if(error != null) {
					util.log("error encountered when closing iPhone simulator: " + error);

				} else {
					util.log("iPhone simulator closed");
				}

				callback();
			});
		}

		util.runCommand("/usr/bin/killall 'ios-sim'", 2, function(error) {
			if(error != null) {
				util.log("error encountered when closing ios-sim: " + error);

			} else {
				util.log("ios-sim closed");
			}

			closeIphoneCallback();
		});
	}
}
