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

var util = require(__dirname + "/util");

module.exports = new function() {
	var self = this;
	this.driverConnections = {};

	this.messageHandler;

	this.start = function() {
		var ciServer;
		var driverServer;

		function startCiServer() {
			ciServer = net.createServer(function(acceptedConnection) {
				util.log("connection accepted from CI server");

				acceptedConnection.on("close", function() {
					util.log("CI connection closed");
					acceptedConnection.destroy();
				});
				acceptedConnection.on("error", function() {
					util.log("error occured on CI connection");
					acceptedConnection.destroy();
				});
				acceptedConnection.on("data", function(data) {
					if (Buffer.isBuffer(data)) {
						data = data.toString();
					}

					self.messageHandler.processCiMessage(acceptedConnection, util.trimStringRight(data));
				});
			});
			ciServer.on("close", function() {
				util.log("CI server connection closed");
				setTimeout(startCiServer, 3000); // fine to hard code this value
			});
			ciServer.on("error", function() {
				util.log("error occurred when listening for CI connections");

				try {
					ciServer.close(); // server will be restarted in the close event handler

				} catch(e) {
					setTimeout(startCiServer, 3000);
				}
			});

			ciServer.listen(hubGlobal.config.ciListenPort, function() {
				util.log("listening for CI connections");
			});
		}

		function startDriverServer() {
			driverServer = net.createServer(function(acceptedConnection) {
				var registered = false;
				var driverId = "";
				var bytesReceived = 0;
				var recvBuffer = new Buffer(0);
				var payloadSize = null;

				util.log("connection accepted from driver server");

				acceptedConnection.on("close", function() {
					util.log("connection for driver <" + driverId + "> closed");

					delete self.driverConnections[driverId];
					acceptedConnection.destroy();
				});
				acceptedConnection.on("error", function(error) {
					util.log("error <" + error + "> occurred on driver <" + driverId + "> connection");
				});
				acceptedConnection.on("data", function(data) {
					bytesReceived += data.length;
					recvBuffer = Buffer.concat([recvBuffer, data]);

					if (payloadSize === null) {
						if (bytesReceived >= 4) {
							payloadSize = recvBuffer.readUInt32BE(0);
						}
					}

					if ((payloadSize !== null) && (bytesReceived >= (4 + payloadSize))) {
						if (registered === false) {
							var message = JSON.parse(recvBuffer.slice(4));

							bytesReceived = 0;
							recvBuffer = new Buffer(0);
							payloadSize = null;

							if (message.type === "registration") {
								util.log("registration received for driver <" + message.id + ">");
								registered = true;
								driverId = message.id;
								self.driverConnections[message.id] = acceptedConnection;

								// is there a run the driver can go ahead and process?
								self.messageHandler.getDriverRun(driverId);

							} else {
								util.log("got something other than registration as first message, closing");
								acceptedConnection.destroy();
							}

						} else {
							util.log("results received from driver: " + bytesReceived);
							self.messageHandler.processDriverResults(driverId, recvBuffer.slice(4), function() {
								// close the driver connection once the results are processed
								acceptedConnection.destroy();
							});
						}
					}
				});
			});
			driverServer.on("close", function() {
				util.log("driver server connection closed");
				setTimeout(startDriverServer, 3000);
			});
			driverServer.on("error", function() {
				util.log("error occurred when listening for driver connections");

				try {
					driverServer.close(); // server will be restarted in the close event handler

				} catch(e) {
					setTimeout(startDriverServer, 3000);
				}
			});

			driverServer.listen(hubGlobal.config.driverListenPort, function() {
				util.log("listening for driver connections");
			});
		}

		startCiServer();
		startDriverServer();
	};

	this.sendMessageToDriver = function(driverId, message) {
		var driverConnection = self.driverConnections[driverId];
		if ((typeof driverConnection) === "undefined") {
			util.log("requested driver <" + driverId + "> not found");
			return null;
		}

		if ((typeof message) === "object") {
			message = JSON.stringify(message);
		}

		var sendBuffer = new Buffer(4 + message.length);
		sendBuffer.writeUInt32BE(message.length, 0);
		sendBuffer.write(message, 4);

		driverConnection.write(sendBuffer, function() {
			util.log("message sent to the driver");
		});
	};
};

