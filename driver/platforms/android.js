/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: contains specific logic for running driver commands on Android
 *
 * Description: contains Android specific wrapper functions around common driver commands
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

	this.name = "android";

	this.init = function(commandCallback, testPassCallback) {
		commandFinishedCallback = commandCallback;
		testPassFinishedCallback = testPassCallback;
	};

	this.processCommand = function(command) {
		var commandElements = command.split(" ");

		if (commandElements[0] == "create") {
			createHarness(commandFinishedCallback, commandFinishedCallback);

		} else if (commandElements[0] == "delete") {
			deleteHarness(commandFinishedCallback);

		} else if (commandElements[0] == "build") {
			buildHarness(commandFinishedCallback, commandFinishedCallback);

		} else if (commandElements[0] == "start") {
			self.startTestPass(commandElements);

		} else if (commandElements[0] == "uninstall") {
			uninstallHarness(commandFinishedCallback, commandFinishedCallback);

		} else if (commandElements[0] == "exit") {
			process.exit(1);

		} else {
			util.log("invalid command\n"
				+ "Commands:\n"
				+ "    create - create harness project\n"
				+ "    delete - delete harness project\n"
				+ "    build - build harness apk\n"
				+ "    start - starts test run which includes starting over with clean harness project\n"
				+ "        Arguments:\n"
				+ "            --config=<config ID> - runs the specified configuration only\n"
				+ "            --suite=<suite name> - runs the specified suite only\n"
				+ "            --test=<test name> - runs the specified test only (--suite must be specified)\n\n"
				+ "    uninstall - removes harness from device\n"
				+ "    exit - exit driver\n",
				driverGlobal.logLevels.quiet, true);

			commandFinishedCallback();
		}
	};

	var createHarness = function(successCallback, errorCallback) {
		common.createHarness(
			"android",
			driverGlobal.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/android --platform=android --name=harness --type=project --id=com.appcelerator.harness",
			successCallback,
			errorCallback
			);
	};

	var deleteHarness = function(callback) {
		common.deleteHarness("android", callback);
	};

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = ["build", "harness", driverGlobal.androidSdkDir, driverGlobal.harnessDir + "/android/harness", "com.appcelerator.harness", 8];
			util.runProcess(driverGlobal.tiSdkDir + "/android/builder.py", args, 0, 0, function(code) {
				if (code != 0) {
					util.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					util.log("harness built");
					successCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/android/harness/tiapp.xml")) {
			buildCallback();

		} else {
			util.log("harness does not exist, creating");
			createHarness(buildCallback, errorCallback);
		}
	};

	this.startTestPass = function(commandElements) {
		var deleteCallback = function() {
			deleteHarness(installCallback);
		}

		var installCallback = function() {
			installHarness(runCallback, commandFinishedCallback);
		}

		var runCallback = function() {
			runHarness(connectCallback, commandFinishedCallback);
		}

		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		}

		common.startTestPass(commandElements, deleteCallback);
	};

	var installHarness = function(successCallback, errorCallback) {
		var installCallback = function() {
			if (path.existsSync(driverGlobal.harnessDir + "/android/harness/build/android/bin/app.apk")) {
				util.runCommand("adb install " + driverGlobal.harnessDir + "/android/harness/build/android/bin/app.apk", 2, function(error) {
					if (error != null) {
						util.log("error encountered when installing harness: " + error);
						if (errorCallback) {
							errorCallback();
						}

					} else {
						util.log("harness installed");
						if (successCallback) {
							successCallback();
						}
					}
				});

			} else {
				util.log("harness is not built, building");
				buildHarness(installCallback, errorCallback);
			}
		}

		uninstallHarness(installCallback, errorCallback);
	};

	var uninstallHarness = function(successCallback, errorCallback) {
		util.runCommand("adb uninstall com.appcelerator.harness", 2, function(error) {
			if (error != null) {
				util.log("error encountered when uninstalling harness: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				util.log("harness uninstalled");
				if (successCallback) {
					successCallback();
				}
			}
		});
	};

	var runHarness = function(successCallback, errorCallback) {
		util.runCommand("adb shell am start -n com.appcelerator.harness/.HarnessActivity", 2, function(error) {
			if (error != null) {
				util.log("error encountered when running harness: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				util.log("running harness");
				if (successCallback) {
					successCallback();
				}
			}
		});
	};

	var connectToHarness = function(errorCallback) {
		var retryCount = 0;

		var connectCallback = function() {
			connection = net.connect(driverGlobal.socketPort);

			connection.on('data', function(data) {
				var responseData = common.processHarnessMessage(data);
				if (responseData) {
					connection.write(responseData);
				}
			});
			connection.on('close', function() {
				this.destroy();

				if (stoppingHarness == true) {
					stoppingHarness = false;
					return;
				}

				if (retryCount < driverGlobal.maxSocketConnectAttempts) {
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
		};

		util.runCommand("adb forward tcp:" + driverGlobal.socketPort + " tcp:" + driverGlobal.socketPort, 2, function(error) {
			if (error != null) {
				util.log("error encountered when setting up port forwarding for <" + driverGlobal.socketPort + ">");
				errorCallback();

			} else {
				util.log("port forwarding activated for <" + driverGlobal.socketPort + ">");
				connectCallback();
			}
		});
	};

	// handles restarting the test pass (usually when an error is encountered)
	this.resumeTestPass = function() {
		var runCallback = function() {
			runHarness(connectCallback, commandFinishedCallback);
		}

		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		}

		stopHarness();
		installHarness(runCallback, commandFinishedCallback);
	};

	// called when a config is finished running
	this.finishTestPass = function() {
		stopHarness();

		var finishCallback = function() {
			common.finishTestPass(testPassFinishedCallback);
		}
		uninstallHarness(finishCallback, commandFinishedCallback);
	};

	var stopHarness = function() {
		stoppingHarness = true;
		connection.destroy();
	};

	this.stopPortForwarding = function(callback) {
		util.runCommand("adb kill-server", 2, function(error) {
			if (error != null) {
				util.log("error encountered when killing adb");
			}

			callback();
		});
	};
};
