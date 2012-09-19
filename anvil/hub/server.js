/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: handles network connection with Drivers and CI server
 */

var net = require("net"),
hubUtils = require(__dirname + "/hubUtils");

module.exports = new function() {
	var self = this,
	INT_SIZE = 4; // size in bytes of a 32 bit integer

	this.driverConnections = {};
	this.messageHandler;

	this.start = function() {
		var ciServer,
		driverServer,
		ciServerRestartDelay = 5000,
		driverServerRestartDelay = 5000;

		function startCiServer() {
			ciServer = net.createServer(function(acceptedConnection) {
				hubUtils.log("connection accepted from CI server");

				acceptedConnection.on("close", function() {
					hubUtils.log("CI connection closed");
				});
				acceptedConnection.on("error", function() {
					hubUtils.log("error occured on CI connection");
					acceptedConnection.destroy(); // close event will be fired
				});
				acceptedConnection.on("data", function(data) {
					if (Buffer.isBuffer(data)) {
						data = data.toString();
					}

					self.messageHandler.processCiMessage(acceptedConnection, hubUtils.trimStringRight(data));
				});
			});
			ciServer.on("close", function() {
				hubUtils.log("CI server connection closed");
				setTimeout(startCiServer, ciServerRestartDelay);
			});
			ciServer.on("error", function() {
				/*
				the node JS docs say that the server doesn't even have a error event.  With the
				assumption that this is the regular socket error event, the close event should 
				follow but it does not - hence manually calling close or restarting the server
				*/
				hubUtils.log("error occurred when listening for CI connections");

				try {
					/*
					if the server is not running (unable to listen, etc) then this will fail
					so we cant rely on the close event handler restarting the server in all cases
					*/
					ciServer.close();

				} catch(e) {
					setTimeout(startCiServer, ciServerRestartDelay);
				}
			});

			ciServer.listen(hubGlobal.config.ciListenPort, function() {
				hubUtils.log("listening for CI connections");
			});
		}

		function startDriverServer() {
			driverServer = net.createServer(function(acceptedConnection) {
				var registered = false,
				driverId = "",
				bytesReceived = 0,
				recvBuffer = new Buffer(0),
				payloadSize = null,
				message;

				hubUtils.log("connection accepted from driver server");

				acceptedConnection.on("close", function() {
					hubUtils.log("connection for driver <" + driverId + "> closed");
					self.messageHandler.updateDriverState({
						id: driverId,
						state: "disconnected"
						});

					delete self.driverConnections[driverId];
				});
				acceptedConnection.on("error", function(error) {
					hubUtils.log("error <" + error + "> occurred on driver <" + driverId + "> connection");
					acceptedConnection.destroy(); // close event will be fired
				});
				acceptedConnection.on("data", function(data) {
					bytesReceived += data.length;
					recvBuffer = Buffer.concat([recvBuffer, data]);

					if ((payloadSize === null) && (bytesReceived >= INT_SIZE)) {
						payloadSize = recvBuffer.readUInt32BE(0);
					}

					if ((payloadSize !== null) && (bytesReceived >= (INT_SIZE + payloadSize))) {
						if (registered === false) {
							message = JSON.parse(recvBuffer.slice(INT_SIZE));

							bytesReceived = 0;
							recvBuffer = new Buffer(0);
							payloadSize = null;

							if (message.type === "registration") {
								hubUtils.log("registration received for driver <" + message.id + ">");
								registered = true;
								driverId = message.id;
								self.driverConnections[driverId] = acceptedConnection;

								// add the driver state into the DB
								self.messageHandler.updateDriverState({
									id: driverId, 
									state: "connected",
									description: message.description,
									environment: message.environment
									});

								// is there a run the driver can go ahead and process?
								self.messageHandler.getDriverRun(driverId);

							} else {
								hubUtils.log("got something other than registration as first message, closing");
								acceptedConnection.destroy(); // close event will be fired
							}

						} else {
							hubUtils.log("results received from driver: " + bytesReceived);
							self.messageHandler.processDriverResults(driverId, recvBuffer.slice(INT_SIZE), function() {
								// close the driver connection once the results are processed
								acceptedConnection.destroy();
							});
						}
					}
				});
			});
			driverServer.on("close", function() {
				hubUtils.log("driver server connection closed");
				setTimeout(startDriverServer, driverServerRestartDelay);
			});
			driverServer.on("error", function() {
				/*
				the node JS docs say that the server doesn't even have a error event.  With the
				assumption that this is the regular socket error event, the close event should 
				follow but it does not - hence manually calling close or restarting the server
				*/
				hubUtils.log("error occurred when listening for driver connections");

				try {
					/*
					if the server is not running (unable to listen, etc) then this will fail
					so we cant rely on the close event handler restarting the server in all cases
					*/
					driverServer.close();

				} catch(e) {
					setTimeout(startDriverServer, driverServerRestartDelay);
				}
			});

			driverServer.listen(hubGlobal.config.driverListenPort, function() {
				hubUtils.log("listening for driver connections");
			});
		}

		startCiServer();
		startDriverServer();
	};

	this.sendMessageToDriver = function(driverId, message) {
		var driverConnection = self.driverConnections[driverId],
		sendBuffer;

		if (typeof driverConnection === "undefined") {
			hubUtils.log("requested driver <" + driverId + "> not found");
			return null;
		}

		if (typeof message === "object") {
			message = JSON.stringify(message);
		}

		sendBuffer = new Buffer(INT_SIZE + message.length);
		sendBuffer.writeUInt32BE(message.length, 0);
		sendBuffer.write(message, INT_SIZE);

		driverConnection.write(sendBuffer, function() {
			hubUtils.log("message sent to the driver");
		});
	};
};

