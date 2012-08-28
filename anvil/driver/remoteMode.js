/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: Manages driver operation when started in remote mode
 *
 * Description: The remote mode for the driver manages communication with the hub and waits for 
 * messages from the hub telling the driver instance to start a test run on the specified git hash.
 * Upon completion, the results are sent back to the hub for storage and reporting.  There should 
 * never be a reason to manually interact with a driver running in remote mode.
 */

var fs = require("fs");
var net = require("net");

var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var 32B_INT_SIZE = 4; // size in bytes of a 32 bit integer

	var hubConnection = {
		connection: null,
		connected: false
	};

	this.start = function() {
		// check remote mode specific config values
		util.checkConfigItem("hubHost", driverGlobal.config.hubHost, "string");
		util.checkConfigItem("hubPort", driverGlobal.config.hubPort, "number");
		util.checkConfigItem("driverId", driverGlobal.config.driverId, "string");
		util.checkConfigItem("driverDescription", driverGlobal.config.driverDescription, "string");

		// hard code the location for remote mode since this should not change
		driverGlobal.config.tiSdkDirs = "titanium_mobile/dist/mobilesdk/osx";

		driverGlobal.platform.init(
			// this function is the 
			function() {
				// command finished so exit
				process.exit(0);
			},
			packageAndSendResults);

		if (fs.existsSync(driverGlobal.logsDir + "/json_results")) {
			util.runCommand("rm -r " + driverGlobal.logsDir + "/json_results", util.logNone, function(error) {
				if (error != null) {
					util.log("error encountered when deleting json results file: " + error);

				} else {
					util.log("json results file deleted");
				}

				connectToHub();
			});

		} else {
			connectToHub();
		}
	};

	function connectToHub() {
		function connectCallback() {
			var bytesReceived = 0;
			var recvBuffer = new Buffer(0);
			var payloadSize = null;
			var hubReconnectDelay = 5000;

			hubConnection.connection = net.connect(driverGlobal.config.hubPort, driverGlobal.config.hubHost);

			hubConnection.connection.on("connect", function() {
				hubConnection.connected = true;
				util.log("connected to hub");

				var registration = JSON.stringify({
					type: "registration",
					id: driverGlobal.config.driverId,
					description: driverGlobal.config.driverDescription
				});

				var sendBuffer = new Buffer(32B_INT_SIZE + registration.length);
				sendBuffer.writeUInt32BE(registration.length, 0);
				sendBuffer.write(registration, 32B_INT_SIZE);

				sendDataToHub(sendBuffer, function() {
					util.log("registration sent to hub");
				});
			});
			hubConnection.connection.on("data", function(data) {
				bytesReceived += data.length;
				console.log("data received: " + bytesReceived);
				recvBuffer = Buffer.concat([recvBuffer, data]);

				if ((payloadSize === null) && (bytesReceived >= 32B_INT_SIZE)) {
					payloadSize = recvBuffer.readUInt32BE(0);
				}

				if ((payloadSize !== null) && (bytesReceived >= (32B_INT_SIZE + payloadSize))) {
					console.log("message received");
					var payload = recvBuffer.slice(32B_INT_SIZE);

					var payloadObject = JSON.parse(payload);
					if ((typeof payloadObject.command) === "undefined") {
						console.log("no command property on message, ignoring");
						return;
					}

					if ((typeof payloadObject.gitHash) === "undefined") {
						console.log("no gitHash property on message, ignoring");
						return;
					}

					checkoutAndBuildGithash(payloadObject.gitHash, function() {
						driverGlobal.platform.processCommand(payloadObject.command);
					});
				}
			});
			hubConnection.connection.on("close", function() {
				hubConnection.connected = false;
				util.log("close occurred for hub connection");
				setTimeout(connectCallback, hubReconnectDelay);
			});
			hubConnection.connection.on("error", function(exception) {
				hubConnection.connected = false;
				hubConnection.connection.destroy(); // close event will be fired
				util.log("error <" + exception.code + "> occurred on hub connection");
			});
		};

		connectCallback();
	}

	function sendDataToHub(data, callback) {
		if (hubConnection.connected === true) {
			hubConnection.connection.write(data, function() {
				console.log("data sent to the hub: " + data.length);
				callback();
			});

		} else {
			console.log("unable to send, not connected");
			callback();
		}
	}

	/*
	make sure that you have cloned the repo as part of setup before this is called.
	IE:  "git clone git@github.com:appcelerator/titanium_mobile.git"
	*/
	function checkoutAndBuildGithash(gitHash, callback) {	
		function updateRepo() {
			util.runProcess("git", ["fetch"], 0, 0, function(code) {
				if (code !== 0) {
					util.log("error encountered when fetching titanium_mobile branches: " + code);
					process.exit(1);

				} else {
					util.log("titanium_mobile branches fetched");
					checkoutCallback();
				}
			});
		}

		function checkoutCallback() {
			util.runProcess("git", ["checkout", gitHash], 0, 0, function(code) {
				if (code !== 0) {
					util.log("error encountered when fetching titanium_mobile branches: " + code);
					process.exit(1);

				} else {
					util.log("titanium_mobile branches fetched");
					cleanCallback();
				}
			});
		}

		function cleanCallback() {
			if (fs.existsSync("dist")) {
				util.runCommand("rm -rf dist", util.logStderr, function(error, stdout, stderr) {
					if (error !== null) {
						util.log("error occurred when deleting previous dist dir");
						process.exit(1);
					}

					buildCallback();
				});

			} else {
				buildCallback();
			}
		}

		function buildCallback() {
			util.runProcess("scons", [], 0, 0, function(code) {
				if (code !== 0) {
					util.log("error encountered when building titanium_mobile: " + code);
					process.exit(1);

				} else {
					util.log("titanium_mobile built");
					unpackCallback();
				}
			});
		}

		function unpackCallback() {
			process.chdir("dist");

			util.runCommand("tar -xvf *.zip", util.logStderr, function(error, stdout, stderr) {
				if (error !== null) {
					util.log("error <" + error + "> occurred when trying to unpack SDK: " + error);

					process.exit(1);
				}

				process.chdir("..");
				finishedCallback();
			});
		}

		function finishedCallback() {
			process.chdir("..");
			util.setCurrentTiSdk();
			callback();
		};

		try {
			process.chdir("titanium_mobile");

		} catch (err) {
			console.log("error when changing dir:" + err);
			process.exit(1);
		}
		updateRepo();
	}

	function packageAndSendResults(results, callback) {
		var versionContents = fs.readFileSync(driverGlobal.config.currentTiSdkDir + "/version.txt", "utf-8");
		var version = "";

		var splitPos = versionContents.indexOf("=");
		var endPos = versionContents.indexOf("\n");
		if ((splitPos !== -1) && (endPos !== -1)) {
			version = versionContents.substr(splitPos + 1, (endPos - splitPos) - 1);
		}

		// insert general run info into results
		results = {
			info: {
				sdkVersion: version
			},
			results: results
		};

		/*
		when reporting to the hub, make sure we provide a JSON output file since it's easier to
		parse
		*/
		var resultsFile = fs.openSync(driverGlobal.currentLogDir + "/json_results", 'w');
		fs.writeSync(resultsFile, JSON.stringify(results));
		fs.closeSync(resultsFile);

		// package up the entire results set to be reported
		var command = "tar -czvf " + driverGlobal.currentLogDir + "/results.tgz -C " +
			driverGlobal.currentLogDir + " log.txt json_results";

		util.runCommand(command, util.logStderr, function(error, stdout, stderr) {
			if (error !== null) {
				util.log("error <" + error + "> occurred when trying to compress results in <" + 
					driverGlobal.currentLogDir + ">");

				process.exit(1);
			}

			var resultsStat = fs.statSync(driverGlobal.currentLogDir + "/results.tgz");
			var resultsSize = resultsStat.size;

			var sendBuffer = new Buffer(32B_INT_SIZE + resultsSize);
			sendBuffer.writeUInt32BE(resultsSize, 0);

			try {
				var resultsFile = fs.openSync(driverGlobal.currentLogDir + "/results.tgz", 'r');

			} catch(e) {
				util.log("exception <" + e + "> occurred when trying to open <" + driverGlobal.currentLogDir + "/results.tgz>");
			}
			fs.readSync(resultsFile, sendBuffer, 32B_INT_SIZE, resultsSize, 0);
			fs.closeSync(resultsFile);

			sendDataToHub(sendBuffer, function() {
				util.log("results sent to hub");
			});
		});
	}
};

