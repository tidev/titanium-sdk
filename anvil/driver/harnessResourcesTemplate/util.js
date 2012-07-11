/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: utility file for harness
 *
 * Description: contains general utility functions that are not specific to running tests such as 
 * connectivity helpers, etc 
 */

module.exports = new function() {
	var harnessGlobal;
	var driverSocket;

	var sendHttpData = function(data) {
		var httpClient = Ti.Network.createHTTPClient({
			onload: function(e) {
				// the call to processing the message data needs to be triggered from a setTimeout 
				// otherwise the the onload callback will not return until the full chain of tests 
				// has completed.  eventually the stack of onload callbacks will cause errors due 
				// to too many open connections or the error callbacks being invoked once the 
				// driver shuts down the http server at the end of the test run
				var responseText = this.responseText;
				setTimeout(function() {
					harnessGlobal.common.processDriverData(responseText);
				}, 10);
			},
			onerror: function(e) {
				Ti.API.error("error occured when sending http message to driver: " + e.error);
			},
			timeout: 10000
		});

		httpClient.open("POST", harnessGlobal.httpHost + ":" + harnessGlobal.httpPort + "/message.anvil");
		httpClient.send(JSON.stringify(data));
	};

	var sendSocketData = function(data) {
		driverSocket.write(Ti.createBuffer({value: JSON.stringify(data)}));
	};

	this.init = function(arg) {
		harnessGlobal = arg;
	};

	this.socketListen = function(acceptedMessage) {
		var pumpCallback = function(e) {
			if (e.bytesProcessed == -1) { // EOF
				Ti.API.info("<EOF> - Can't perform any more operations on connected socket");

			} else if (e.errorDescription == null || e.errorDescription == "") {
				var data = e.buffer.toString();
				harnessGlobal.common.processDriverData(data);

			} else {
				Ti.API.info("READ ERROR: " + e.errorDescription);
			}
		};

		var listenSocket = Ti.Network.Socket.createTCP({
		    port: harnessGlobal.socketPort,
		    accepted: function(e) {
    		    driverSocket = e.inbound;

				var readyMessage = {type: "ready"};
    		    driverSocket.write(Ti.createBuffer({value: JSON.stringify(readyMessage)}));

    		    Ti.Stream.pump(driverSocket, pumpCallback, 1024, true);
    		},
    		error: function(e) {
				e.socket.close();
			}
		});
		listenSocket.listen();

		listenSocket.accept({
			error: function(e) {
				Ti.API.error("error occured on driver socket, closing");
				e.socket.close();
			}
		});
	};

	this.sendData = function(data) {
		if (Ti.Platform.name == "mobileweb") {
			sendHttpData(data);

		} else {
			sendSocketData(data);
		}
	};
};
