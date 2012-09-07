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

var fs = require("fs"),
net = require("net"),
path = require("path"),
driverUtils = require(path.join(driverGlobal.driverDir, "driverUtils"));

module.exports = new function() {
	var INT_SIZE = 4, // size in bytes of a 32 bit integer
	hubConnection = {
		connection: null,
		connected: false
	};

	this.start = function() {
		// check remote mode specific config values
		driverUtils.checkConfigItem("hubHost", driverGlobal.config.hubHost, "string");
		driverUtils.checkConfigItem("hubPort", driverGlobal.config.hubPort, "number");
		driverUtils.checkConfigItem("driverId", driverGlobal.config.driverId, "string");
		driverUtils.checkConfigItem("driverDescription", driverGlobal.config.driverDescription, "string");

		// hard code the location for remote mode since this should not change
		driverGlobal.config.tiSdkDirs = "titanium_mobile/dist/mobilesdk/osx";

		driverGlobal.platform.init(
			// this function is the 
			function() {
				// command finished so exit
				process.exit(0);
			},
			packageAndSendResults);

		if (fs.existsSync(path.join(driverGlobal.logsDir, "json_results"))) {
			driverUtils.runCommand("rm -r " + path.join(driverGlobal.logsDir, "json_results"), driverUtils.logNone, function(error) {
				if (error != null) {
					driverUtils.log("error encountered when deleting json results file: " + error);

				} else {
					driverUtils.log("json results file deleted");
				}

				connectToHub();
			});

		} else {
			connectToHub();
		}
	};

	function connectToHub() {
		function connectCallback() {
			var bytesReceived = 0,
			recvBuffer = new Buffer(0),
			payloadSize = null,
			hubReconnectDelay = 5000;

			hubConnection.connection = net.connect(driverGlobal.config.hubPort, driverGlobal.config.hubHost);

			hubConnection.connection.on("connect", function() {
				var registration = JSON.stringify({
					type: "registration",
					id: driverGlobal.config.driverId,
					description: driverGlobal.config.driverDescription
				}),
				sendBuffer = new Buffer(INT_SIZE + registration.length);

				hubConnection.connected = true;
				driverUtils.log("connected to hub");

				sendBuffer.writeUInt32BE(registration.length, 0);
				sendBuffer.write(registration, INT_SIZE);

				sendDataToHub(sendBuffer, function() {
					driverUtils.log("registration sent to hub");
				});
			});
			hubConnection.connection.on("data", function(data) {
				var payload,
				payloadObject;

				bytesReceived += data.length;
				console.log("data received: " + bytesReceived);
				recvBuffer = Buffer.concat([recvBuffer, data]);

				if ((payloadSize === null) && (bytesReceived >= INT_SIZE)) {
					payloadSize = recvBuffer.readUInt32BE(0);
				}

				if ((payloadSize !== null) && (bytesReceived >= (INT_SIZE + payloadSize))) {
					console.log("message received");
					payload = recvBuffer.slice(INT_SIZE);

					payloadObject = JSON.parse(payload);
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
				driverUtils.log("close occurred for hub connection");
				setTimeout(connectCallback, hubReconnectDelay);
			});
			hubConnection.connection.on("error", function(exception) {
				hubConnection.connected = false;
				hubConnection.connection.destroy(); // close event will be fired
				driverUtils.log("error <" + exception.code + "> occurred on hub connection");
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
			driverUtils.runProcess("git", ["fetch"], 0, 0, function(code) {
				if (code !== 0) {
					driverUtils.log("error encountered when fetching titanium_mobile branches: " + code);
					process.exit(1);

				} else {
					driverUtils.log("titanium_mobile branches fetched");
					checkoutCallback();
				}
			});
		}

		function checkoutCallback() {
			driverUtils.runProcess("git", ["checkout", gitHash], 0, 0, function(code) {
				if (code !== 0) {
					driverUtils.log("error encountered when fetching titanium_mobile branches: " + code);
					process.exit(1);

				} else {
					driverUtils.log("titanium_mobile branches fetched");
					cleanCallback();
				}
			});
		}

		function cleanCallback() {
			if (fs.existsSync("dist")) {
				driverUtils.runCommand("rm -rf dist", driverUtils.logStderr, function(error, stdout, stderr) {
					if (error !== null) {
						driverUtils.log("error occurred when deleting previous dist dir");
						process.exit(1);
					}

					buildCallback();
				});

			} else {
				buildCallback();
			}
		}

		function buildCallback() {
			driverUtils.runProcess("scons", [], 0, 0, function(code) {
				if (code !== 0) {
					driverUtils.log("error encountered when building titanium_mobile: " + code);
					process.exit(1);

				} else {
					driverUtils.log("titanium_mobile built");
					unpackCallback();
				}
			});
		}

		function unpackCallback() {
			process.chdir("dist");

			driverUtils.runCommand("tar -xvf *.zip", driverUtils.logStderr, function(error, stdout, stderr) {
				if (error !== null) {
					driverUtils.log("error <" + error + "> occurred when trying to unpack SDK: " + error);

					process.exit(1);
				}

				process.chdir("..");
				finishedCallback();
			});
		}

		function finishedCallback() {
			process.chdir("..");
			driverUtils.setCurrentTiSdk();
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
		var versionContents = fs.readFileSync(path.join(driverGlobal.config.currentTiSdkDir, "version.txt"), "utf-8"),
		version = "",
		splitPos = versionContents.indexOf("="),
		resultsFile = fs.openSync(path.join(driverGlobal.currentLogDir, "json_results"), 'w'),
		command = "tar -czvf " + path.join(driverGlobal.currentLogDir, "results.tgz") + " -C " +
			driverGlobal.currentLogDir + " log.txt json_results";

		endPos = versionContents.indexOf("\n");
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
		fs.writeSync(resultsFile, JSON.stringify(results));
		fs.closeSync(resultsFile);

		// package up the entire results set to be reported
		driverUtils.runCommand(command, driverUtils.logStderr, function(error, stdout, stderr) {
			var resultsStat,
			resultsSize,
			sendBuffer;

			if (error !== null) {
				driverUtils.log("error <" + error + "> occurred when trying to compress results in <" + 
					driverGlobal.currentLogDir + ">");

				process.exit(1);
			}

			resultsStat = fs.statSync(path.join(driverGlobal.currentLogDir, "results.tgz"));
			resultsSize = resultsStat.size;
			sendBuffer = new Buffer(INT_SIZE + resultsSize);

			sendBuffer.writeUInt32BE(resultsSize, 0);

			try {
				var resultsFile = fs.openSync(path.join(driverGlobal.currentLogDir, "results.tgz"), 'r');

			} catch(e) {
				driverUtils.log("exception <" + e + "> occurred when trying to open <" + driverGlobal.currentLogDir + "/results.tgz>");
			}
			fs.readSync(resultsFile, sendBuffer, INT_SIZE, resultsSize, 0);
			fs.closeSync(resultsFile);

			sendDataToHub(sendBuffer, function() {
				driverUtils.log("results sent to hub");
			});
		});
	}
};

