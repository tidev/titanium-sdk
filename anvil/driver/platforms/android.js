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

var net = require("net"),
path = require("path"),
os = require("os"),
common = require(path.resolve(driverGlobal.driverDir, "common")),
driverUtils = require(path.resolve(driverGlobal.driverDir, "driverUtils"));

module.exports = new function() {
	var self = this;
	var commandFinishedCallback;
	var testPassFinishedCallback;
	var connection;
	var stoppingHarness = false;

	this.name = "android";

	this.init = function(commandCallback, testPassCallback) {
		// check android specific config items
		driverUtils.checkConfigItem("androidSdkDir", driverGlobal.config.androidSdkDir, "string");
		driverUtils.checkConfigItem("androidSocketPort", driverGlobal.config.androidSocketPort, "number");

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
		var argString = "create --dir=" + path.resolve(driverGlobal.harnessDir, "android") + " --platform=android --name=harness --type=project --id=com.appcelerator.harness --android=" + path.resolve(driverGlobal.config.androidSdkDir);

		/*
		make sure the harness has access to what port number it should listen on for a connection 
		from the driver
		*/
		common.customTiappXmlProperties["driver.socketPort"] = driverGlobal.config.androidSocketPort;

		// due to python behavior on windows, we need to escape the slashes in the argument string
		if (os.platform().substr(0 ,3) === "win") {
			argString = argString.replace(/\\/g, "\\\\");
		}

		common.createHarness(
			"android",
			"\"" + path.resolve(driverGlobal.config.currentTiSdkDir, "titanium.py") + "\" " + argString,
			successCallback,
			errorCallback
			);
	};

	var deleteHarness = function(callback) {
		common.deleteHarness("android", callback);
	};

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = [
				path.resolve(driverGlobal.config.currentTiSdkDir, "android", "builder.py"),
				"build",
				"harness",
				path.resolve(driverGlobal.config.androidSdkDir),
				path.resolve(driverGlobal.harnessDir, "android", "harness"),
				"com.appcelerator.harness",
				8
				];

			driverUtils.runProcess("python", args, 0, 0, function(code) {
				if (code !== 0) {
					driverUtils.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					driverUtils.log("harness built");
					successCallback();
				}
			});
		};

		if (path.existsSync(path.resolve(driverGlobal.harnessDir, "android", "harness", "tiapp.xml"))) {
			buildCallback();

		} else {
			driverUtils.log("harness does not exist, creating");
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
				driverUtils.log("no attached device found, unable to start config", driverGlobal.logLevels.quiet);
				commandFinishedCallback();
			}
		});
	};

	var installHarness = function(successCallback, errorCallback) {
		var installCallback = function() {
			if (path.existsSync(path.resolve(driverGlobal.harnessDir, "android", "harness", "build", "android", "bin", "app.apk"))) {
				driverUtils.runCommand("adb install " + path.resolve(driverGlobal.harnessDir, "android/harness/build/android/bin/app.apk"), driverUtils.logStdout, function(error) {
					if (error !== null) {
						driverUtils.log("error encountered when installing harness: " + error);
						if (errorCallback) {
							errorCallback();
						}

					} else {
						driverUtils.log("harness installed");
						if (successCallback) {
							successCallback();
						}
					}
				});

			} else {
				driverUtils.log("harness is not built, building");
				buildHarness(installCallback, errorCallback);
			}
		};

		uninstallHarness(installCallback, errorCallback);
	};

	var uninstallHarness = function(successCallback, errorCallback) {
		driverUtils.runCommand("adb uninstall com.appcelerator.harness", driverUtils.logStdout, function(error) {
			if (error !== null) {
				driverUtils.log("error encountered when uninstalling harness: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				driverUtils.log("harness uninstalled");
				if (successCallback) {
					successCallback();
				}
			}
		});
	};

	var runHarness = function(successCallback, errorCallback) {
		driverUtils.runCommand("adb shell am start -n com.appcelerator.harness/.HarnessActivity", driverUtils.logStdout, function(error) {
			if (error !== null) {
				driverUtils.log("error encountered when running harness: " + error);
				if (errorCallback) {
					errorCallback();
				}

			} else {
				driverUtils.log("running harness");
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
					driverUtils.log("unable to connect, retry attempt " + (retryCount + 1) + "...");
					retryCount += 1;

					setTimeout(function() {
						connectCallback();
					}, 1000);

				} else {
					driverUtils.log("max number of retry attempts reached");
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

		driverUtils.runCommand("adb forward tcp:" + driverGlobal.config.androidSocketPort + " tcp:" + driverGlobal.config.androidSocketPort, driverUtils.logStdout, function(error) {
			if (error !== null) {
				driverUtils.log("error encountered when setting up port forwarding for <" + driverGlobal.config.androidSocketPort + ">");
				errorCallback();

			} else {
				driverUtils.log("port forwarding activated for <" + driverGlobal.config.androidSocketPort + ">");
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
		driverUtils.runCommand("adb devices", driverGlobal.logLevels.quiet, function(error, stdout, stderr) {
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
