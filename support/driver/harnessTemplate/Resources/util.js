module.exports = new function() {
	var self = this;
	var harnessGlobal;
	var driverSocket;

	var sendHttpData = function(data) {
		var client = Ti.Network.createHTTPClient({
			onload: function() {
				harnessGlobal.required.common.processDriverData(this.responseText);
			},
			onerror: function(e) {
				Ti.API.error("error occured when sending http message to driver: " + e.error);
			},
			timeout: 5000
		});

		client.open("POST", harnessGlobal.httpHost + ":" + harnessGlobal.httpPort + "/message.anvil");
		client.send(JSON.stringify(data));
	}

	var sendSocketData = function(data) {
		driverSocket.write(Ti.createBuffer({value: JSON.stringify(data)}));
	}

	this.init = function(arg) {
		harnessGlobal = arg;
	}

	this.connect = function() {
		var pumpCallback = function(e) {
			if (e.bytesProcessed == -1) { // EOF
				Ti.API.info("<EOF> - Can't perform any more operations on connected socket");

			} else if (e.errorDescription == null || e.errorDescription == "") {
				var data = e.buffer.toString();
				harnessGlobal.required.common.processDriverData(data);

			} else {
				Ti.API.info("READ ERROR: "+e.errorDescription);
			}
		}

		var listenSocket = Ti.Network.Socket.createTCP({
		    port: harnessGlobal.socketPort,
		    accepted: function(e) {
    		    driverSocket = e.inbound;
    		    driverSocket.write(Ti.createBuffer({value:"ready"}));
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
	}

	this.sendData = function(data) {
		if(Ti.Platform.name == "mobileweb") {
			sendHttpData(data);

		} else {
			sendSocketData(data);
		}
	}

	this.sendTestResult = function(suite, test, results) {
		var testResults = {
			type: "result",
			suite: suite,
			test: test,
			results: results
		}

		self.sendData(testResults);
	}
}
