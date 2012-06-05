var net = require("net");
var path = require("path");

var driverGlobal = global.driverGlobal;
var util = require(driverGlobal.driverDir + "/util");
var common = require(driverGlobal.driverDir + "/common");

module.exports = new function() {
	var client;

	var createHarness = function(successCallback, errorCallback) {
		var createCallback = function() {
			util.runCommand(driverGlobal.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/android --platform=android --name=" + driverGlobal.harnessName + " --type=project --id=" + driverGlobal.harnessId, 2, function(error) {
				if(error != null) {
					console.log("error encountered when created harness: " + error);
					if(errorCallback) {
						errorCallback();
					}

				} else {
					console.log("harness created");

					util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/* " + driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName, 2, function(error) {
						if(error != null) {
							console.log("unable to update resources for harness: " + error);
							if(errorCallback) {
								errorCallback();
							}

						} else {
							console.log("resources updated for harness");
							if(successCallback) {
								successCallback();
							}
						}
					});
				}
			});
		}

		if(path.existsSync(driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName + "/tiapp.xml")) {
			deleteHarness(createCallback, errorCallback);

		} else {
			createCallback();
		}
	}

	var deleteHarness = function(successCallback, errorCallback) {
		util.runCommand("rm -r " + driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName, 0, function(error) {
			if(error != null) {
				console.log("error encountered when deleting harness: " + error);
				if(errorCallback) {
					errorCallback();
				}

			} else {
				console.log("harness deleted");
				if(successCallback) {
					successCallback();
				}
			}
		});
	}

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = ["build", driverGlobal.harnessName, driverGlobal.androidSdkDir, driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName, driverGlobal.harnessId, 8];
			util.runProcess(driverGlobal.tiSdkDir + "/android/builder.py", args, 0, 0, function(code) {
				if(code != 0) {
					console.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					console.log("harness built");
					successCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName + "/tiapp.xml")) {
			buildCallback();

		} else {
			console.log("harness does not exist, creating");
			createHarness(buildCallback, errorCallback);
		}
	}

	var startTests = function(errorCallback) {
		var installCallback = function() {
			installHarness(runCallback, errorCallback);
		}

		var runCallback = function() {
			runHarness(connectCallback, errorCallback);
		}

		var connectCallback = function() {
			connectToHarness(errorCallback);
		}

		deleteHarness(installCallback, errorCallback);
	}

	var installHarness = function(successCallback, errorCallback) {
		var installCallback = function() {
			if (path.existsSync(driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName + "/build/android/bin/app.apk")) {
				util.runCommand("adb install " + driverGlobal.harnessDir + "/android/" + driverGlobal.harnessName + "/build/android/bin/app.apk", 0, function(error) {
					if(error != null) {
						console.log("error encountered when installing harness: " + error);
						if(errorCallback) {
							errorCallback();
						}

					} else {
						console.log("harness installed");
						if(successCallback) {
							successCallback();
						}
					}
				});

			} else {
				console.log("harness is not built, building");
				buildHarness(installCallback, errorCallback);
			}
		}

		uninstallHarness(installCallback, errorCallback);
	}

	var uninstallHarness = function(successCallback, errorCallback) {
		util.runCommand("adb uninstall com.appcelerator.harness", 0, function(error) {
			if(error != null) {
				console.log("error encountered when uninstalling harness: " + error);
				if(errorCallback) {
					errorCallback();
				}

			} else {
				console.log("harness uninstalled");
				if(successCallback) {
					successCallback();
				}
			}
		});
	}

	var runHarness = function(successCallback, errorCallback) {
		util.runCommand("adb shell am start -n com.appcelerator.harness/.HarnessActivity", 0, function(error) {
			if(error != null) {
				console.log("error encountered when running harness: " + error);
				if(errorCallback) {
					errorCallback();
				}

			} else {
				console.log("running harness");
				if(successCallback) {
					successCallback();
				}
			}
		});
	}

	var connectToHarness = function(errorCallback) {
		var retryCount = 0;

		var connectCallback = function() {
			client = net.connect(driverGlobal.socketPort);
			client.connected = false;

			client.on('data', function(data) {
				if(data == "ready") {
					console.log("connection verified");
					this.connected = true;
					client.write("getSuites");

				} else if(this.connected) {
					var responseData = common.processHarnessMessage(data);
					client.write(responseData);

				} else {
					console.log("unrecognized connection response received, closing");
					this.destroy();
				}
			});
			client.on('close', function() {
				this.destroy();

				if(this.connected) {
					console.log("connection closed");
					errorCallback();

				} else {
					if(retryCount < 10) {
						console.log("unable to connect, retrying...");
						retryCount += 1;

						setTimeout(function() {
							connectCallback();
						}, 1000);

					} else {
						console.log("max number of retry attempts reached");
						errorCallback();
					}
				}
			});
			client.on('error', function() {
				this.destroy();
			});
			client.on('timeout', function() {
				this.destroy();
			});
		}

		util.runCommand("adb forward tcp:" + driverGlobal.socketPort + " tcp:" + driverGlobal.socketPort, 0, function(error) {
			if(error != null) {
				console.log("error encountered when setting up port forwarding for <" + driverGlobal.socketPort + ">");
				errorCallback();

			} else {
				console.log("port forwarding activated for <" + driverGlobal.socketPort + ">");
				connectCallback();
			}
		});
	}

	this.processCommand = function(command, callback) {
		var commandElements = command.split(" ");

		if(commandElements[0] == "create") {
			createHarness(callback, callback);

		} else if(commandElements[0] == "delete") {
			deleteHarness(callback, callback);

		} else if(commandElements[0] == "build") {
			buildHarness(callback, callback);

		} else if(commandElements[0] == "start") {
			startTests(callback);

		} else if(commandElements[0] == "uninstall") {
			uninstallHarness(callback, callback);

		} else {
			console.log("invalid command\n"
				+ "Commands:\n"
				+ "\tcreate - create harness project\n"
				+ "\tdelete - delete harness project\n"
				+ "\tbuild - build harness apk\n"
				+ "\tstart - starts test run which includes starting over with clean harness project\n"
				+ "\tuninstall - removes harness from device\n"
			);

			callback();
		}
	}

	this.reset = function() {
		client.destroy();
	}
}
