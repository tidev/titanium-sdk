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

		if (commandElements[0] === "start") {
			common.startTestPass(commandElements, self.startConfig, commandFinishedCallback);

		} else if (commandElements[0] === "exit") {
			process.exit(1);

		} else {
			console.log("invalid command\n\n"
				+ "Commands:\n"
				+ "    start - starts test run which includes starting over with clean harness project\n"
				+ "        Arguments (optional):\n"
				+ "            --config-set=<config set ID> - runs the specified config set\n"
				+ "            --config=<config ID> - runs the specified configuration only\n"
				+ "            --suite=<suite name> - runs the specified suite only\n"
				+ "            --test=<test name> - runs the specified test only (--suite must be specified)\n\n"
				+ "    exit - exit driver\n");

			commandFinishedCallback();
		}
	};

	var createHarness = function(successCallback, errorCallback) {
		/*
		make sure the harness has access to what port number it should listen on for a connection 
		from the driver
		*/
		common.customTiappXmlProperties["driver.socketPort"] = driverGlobal.config.androidSocketPort;

		common.createHarness(
			"android",
			driverGlobal.config.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/android --platform=android --name=harness --type=project --id=com.appcelerator.harness",
			successCallback,
			errorCallback
			);
	};

	var deleteHarness = function(callback) {
		common.deleteHarness("android", callback);
	};

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = ["build", "harness", driverGlobal.config.androidSdkDir, driverGlobal.harnessDir + "/android/harness", "com.appcelerator.harness", 8];
			util.runProcess(driverGlobal.config.tiSdkDir + "/android/builder.py", args, 0, 0, function(code) {
				if (code !== 0) {
					util.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					util.log("harness built");
					successCallback();
				}
			});
		};

		if (path.existsSync(driverGlobal.harnessDir + "/android/harness/tiapp.xml")) {
			buildCallback();

		} else {
			util.log("harness does not exist, creating");
			createHarness(buildCallback, errorCallback);
		}
	};

	this.startConfig = function() {
		var deleteCallback = function() {
			deleteHarness(installCallback);
		};

		var installCallback = function() {
			installHarness(runCallback, commandFinishedCallback);
		};

		var runCallback = function() {
			runHarness(connectCallback, commandFinishedCallback);
		};

		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		};

		self.deviceIsConnected(function(connected) {
			if (connected) {
				common.startConfig(deleteCallback);

			} else {
				util.log("no attached device found, unable to start config", driverGlobal.logLevels.quiet);
				commandFinishedCallback();
			}
		});
	};

	var installHarness = function(successCallback, errorCallback) {
		var installCallback = function() {
			if (path.existsSync(driverGlobal.harnessDir + "/android/harness/build/android/bin/app.apk")) {
				util.runCommand("adb install " + driverGlobal.harnessDir + "/android/harness/build/android/bin/app.apk", util.logStdout, function(error) {
					if (error !== null) {
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
		};

		uninstallHarness(installCallback, errorCallback);
	};

	var uninstallHarness = function(successCallback, errorCallback) {
		util.runCommand("adb uninstall com.appcelerator.harness", util.logStdout, function(error) {
			if (error !== null) {
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
		util.runCommand("adb shell am start -n com.appcelerator.harness/.HarnessActivity", util.logStdout, function(error) {
			if (error !== null) {
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
			connection = net.connect(driverGlobal.config.androidSocketPort);

			connection.on('data', function(data) {
				var responseData = common.processHarnessMessage(data);
				if (responseData) {
					connection.write(responseData);
				}
			});
			connection.on('close', function() {
				this.destroy();

				if (stoppingHarness === true) {
					stoppingHarness = false;
					return;
				}

				if (retryCount < driverGlobal.config.maxSocketConnectAttempts) {
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

		util.runCommand("adb forward tcp:" + driverGlobal.config.androidSocketPort + " tcp:" + driverGlobal.config.androidSocketPort, util.logStdout, function(error) {
			if (error !== null) {
				util.log("error encountered when setting up port forwarding for <" + driverGlobal.config.androidSocketPort + ">");
				errorCallback();

			} else {
				util.log("port forwarding activated for <" + driverGlobal.config.androidSocketPort + ">");
				connectCallback();
			}
		});
	};

	// handles restarting the test pass (usually when an error is encountered)
	this.resumeConfig = function() {
		var runCallback = function() {
			runHarness(connectCallback, commandFinishedCallback);
		};

		var connectCallback = function() {
			connectToHarness(commandFinishedCallback);
		};

		stopHarness();
		installHarness(runCallback, commandFinishedCallback);
	};

	// called when a config is finished running
	this.finishConfig = function() {
		stopHarness();

		var finishConfigCallback = function() {
			common.finishConfig(testPassFinishedCallback);
		};
		uninstallHarness(finishConfigCallback, commandFinishedCallback);
	};

	var stopHarness = function() {
		stoppingHarness = true;
		connection.destroy();
	};

	this.deviceIsConnected = function(callback) {
		util.runCommand("adb devices", driverGlobal.logLevels.quiet, function(error, stdout, stderr) {
			var searchString = "List of devices attached";
			var deviceListString = "";

			var startPos = stdout.indexOf(searchString);
			if (startPos > -1) {
				var deviceListString = stdout.substring(startPos + searchString.length, stdout.length);
				deviceListString = deviceListString.replace(/\s/g,"");
			}

			if (deviceListString.length < 1) {
				callback(false);

			} else {
				callback(true);
			}
		});
	};
};
