/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: TODO
 *
 * Description: TODO
 */

var fs = require("fs");
var net = require("net");

var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var hubConnection = {
		connection: null,
		connected: false
	};

	this.start = function() {
		// hard code the location for remote mode since this should not change
		driverGlobal.config.tiSdkDirs = "titanium_mobile/dist/mobilesdk/osx";

		driverGlobal.platform.init(
			function() {
				process.exit(1);
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
					id: driverGlobal.config.driverId
				});

				var sendBuffer = new Buffer(4 + registration.length);
				sendBuffer.writeUInt32BE(registration.length, 0);
				sendBuffer.write(registration, 4);

				sendDataToHub(sendBuffer, function() {
					util.log("registration sent to hub");
				});
			});
			hubConnection.connection.on("data", function(data) {
				bytesReceived += data.length;
				console.log("data received: " + bytesReceived);
				recvBuffer = Buffer.concat([recvBuffer, data]);

				if (payloadSize === null) {
					if (bytesReceived >= 4) {
						payloadSize = recvBuffer.readUInt32BE(0);
					}
				}

				if ((payloadSize !== null) && (bytesReceived >= (4 + payloadSize))) {
					console.log("message received");
					var payload = recvBuffer.slice(4);

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
			hubConnection.connection.on("error", function() {
				hubConnection.connected = false;
				hubConnection.connection.destroy(); // close event will be fired
				util.log("error occurred on hub connection");
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

			util.runCommand("tar -xzvf *.zip", util.logStderr, function(error, stdout, stderr) {
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
		var command = "tar -cvf " + driverGlobal.currentLogDir + "/results.tgz -C " +
			driverGlobal.currentLogDir + " log.txt json_results";

		util.runCommand(command, util.logStderr, function(error, stdout, stderr) {
			if (error !== null) {
				util.log("error <" + error + "> occurred when trying to compress results in <" + 
					driverGlobal.currentLogDir + ">");

				process.exit(1);
			}

			var resultsStat = fs.statSync(driverGlobal.currentLogDir + "/results.tgz");
			var resultsSize = resultsStat.size;

			var sendBuffer = new Buffer(4 + resultsSize);
			sendBuffer.writeUInt32BE(resultsSize, 0);

			try {
				var resultsFile = fs.openSync(driverGlobal.currentLogDir + "/results.tgz", 'r');

			} catch(e) {
				util.log("exception <" + e + "> occurred when trying to open <" + driverGlobal.currentLogDir + "/results.tgz>");
			}
			fs.readSync(resultsFile, sendBuffer, 4, resultsSize, 0);
			fs.closeSync(resultsFile);

			sendDataToHub(sendBuffer, function() {
				util.log("results sent to hub");
			});
		});
	}
};

