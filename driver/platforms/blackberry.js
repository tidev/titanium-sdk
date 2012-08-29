/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: contains specific logic for running driver commands on BlackBerry
 *
 * Description: contains BlackBerry specific wrapper functions around common driver commands
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

	this.name = "blackberry";

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
		// make sure the harness has access to what port number it should listen on for a connection from the driver
		common.customTiappXmlProperties["driver.socketPort"] = driverGlobal.config.blackberrySocketPort;

		common.createHarness(
			"blackberry",
			driverGlobal.config.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/blackberry --platform=blackberry --name=harness --type=project --id=com.appcelerator.harness --blackberry=" + driverGlobal.config.blackberryNdkDir,
			successCallback,
			errorCallback
			);
	};

	var deleteHarness = function(callback) {
		common.deleteHarness("blackberry", callback);
	};

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = [driverGlobal.config.tiSdkDir + "/blackberry/builder.py", "build", "-t", "simulator", "-d", driverGlobal.harnessDir + "/blackberry/harness", "-p", driverGlobal.config.blackberryNdkDir];
			util.runProcess("python", args, 0, 0, function(code) {
				if (code !== 0) {
					util.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					util.log("harness built");
					successCallback();
				}
			});
		};

		if (path.existsSync(driverGlobal.harnessDir + "/blackberry/harness/tiapp.xml")) {
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
			// TODO: need a better way to determine if we need to build
			if (path.existsSync(driverGlobal.harnessDir + "/blackberry/harness/build/blackberry/x86/o-g/harness")
				|| path.existsSync(driverGlobal.harnessDir + "/blackberry/harness/build/blackberry/x86/o-g/test_harness")) {
				// build scripts currently only allow us to run
				successCallback();
			} else {
				util.log("harness is not built, building");
				buildHarness(installCallback, errorCallback);
			}
		};

		uninstallHarness(installCallback, errorCallback);
	};

	var uninstallHarness = function(successCallback, errorCallback) {
		var args = [driverGlobal.config.tiSdkDir + "/blackberry/builder.py", "uninstallApp", "-t", "simulator", "--ip_address=" + driverGlobal.config.blackberryDeviceIp, "-d", driverGlobal.harnessDir + "/blackberry/harness", "-p", driverGlobal.config.blackberryNdkDir];
		util.runProcess("python", args, 0, 0, function(code) {
			if (code !== 0) {
				util.log("error encountered when uninstalling harness: " + code);
				// continue anyways
			} else {
				util.log("harness uninstalled");
			}
			successCallback();
		});
	};

	var runHarness = function(successCallback, errorCallback) {
		var args = [driverGlobal.config.tiSdkDir + "/blackberry/builder.py", "run", "-t", "simulator", "--ip_address=" + driverGlobal.config.blackberryDeviceIp, "-d", driverGlobal.harnessDir + "/blackberry/harness", "-p", driverGlobal.config.blackberryNdkDir];
		util.runProcess("python", args, 0, 0, function(code) {
			if (code !== 0) {
				util.log("error encountered when running harness: " + code);
				errorCallback();

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
			connection = net.connect(driverGlobal.config.blackberrySocketPort, driverGlobal.config.blackberryDeviceIp);

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

		connectCallback();
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
		// Not yet implemented in the scripts, so assume true. Running the harness will fail instead for now
		callback(true);
	};
};
