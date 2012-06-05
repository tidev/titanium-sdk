var net = require("net");
var path = require("path");

var driverGlobal = global.driverGlobal;
var util = require(driverGlobal.driverDir + "/util");
var common = require(driverGlobal.driverDir + "/common");

module.exports = new function() {
	var client;

	var createHarness = function(successCallback, errorCallback) {
		var createCallback = function() {
			util.runCommand(driverGlobal.tiSdkDir + "/titanium.py create --dir=" + driverGlobal.harnessDir + "/ios --platform=iphone --name=" + driverGlobal.harnessName + " --type=project --id=" + driverGlobal.harnessId, 2, function(error) {
				if(error != null) {
					console.log("error encountered when created harness: " + error);
					if(errorCallback) {
						errorCallback();
					}

				} else {
					console.log("harness created");

					util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/* " + driverGlobal.harnessDir + "/ios/" + driverGlobal.harnessName, 2, function(error) {
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

		if(path.existsSync(driverGlobal.harnessDir + "/ios/" + driverGlobal.harnessName + "/tiapp.xml")) {
			deleteHarness(createCallback, errorCallback);

		} else {
			createCallback();
		}
	}

	var deleteHarness = function(successCallback, errorCallback) {
		util.runCommand("rm -r " + driverGlobal.harnessDir + "/ios/" + driverGlobal.harnessName, 0, function(error) {
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

	var startTests = function(errorCallback) {
		var connectCallback = function() {
			connectToHarness(errorCallback);
		}

		runHarness(connectCallback, errorCallback);
	}

	var runHarness = function(successCallback, errorCallback) {
		var runCallback = function() {
			var stdoutCallback = function(message) {
				if(message.indexOf("[INFO] Application started") > -1) {
					successCallback();
				}
			}

			var args = ["simulator", "5.0", driverGlobal.harnessDir + "/ios/" + driverGlobal.harnessName, driverGlobal.harnessId, driverGlobal.harnessName];
			util.runProcess(driverGlobal.tiSdkDir + "/iphone/builder.py", args, stdoutCallback, 0, function(code) {
				if(code != 0) {
					console.log("error encountered when running harness: " + code);
					errorCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/ios/" + driverGlobal.harnessName + "/tiapp.xml")) {
			runCallback();

		} else {
			console.log("harness does not exist, creating");
			createHarness(runCallback, errorCallback);
		}
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

		connectCallback();
	}

	var closeSimulator = function() {
		var closeIphoneCallback = function() {
			util.runCommand("/usr/bin/killall 'iPhone Simulator'", 0, function(error) {
				if(error != null) {
					console.log("error encountered when closing iPhone simulator: " + error);

				} else {
					console.log("iPhone simulator closed");
				}
			});
		}

		util.runCommand("/usr/bin/killall 'ios-sim'", 0, function(error) {
			if(error != null) {
				console.log("error encountered when closing ios-sim: " + error);

			} else {
				console.log("ios-sim closed");
			}

			closeIphoneCallback();
		});
	}

	this.processCommand = function(command, callback) {
		var commandElements = command.split(" ");

		if(commandElements[0] == "create") {
			createHarness(callback, callback);

		} else if(commandElements[0] == "delete") {
			deleteHarness(callback, callback);

		} else if(commandElements[0] == "start") {
			startTests(callback);

		} else {
			console.log("invalid command\n"
				+ "Commands:\n"
				+ "\tcreate - create harness project\n"
				+ "\tdelete - delete harness project\n"
				+ "\tstart - starts test run which includes starting over with clean harness project\n"
			);

			callback();
		}
	}

	this.reset = function() {
		closeSimulator();
	}
}
