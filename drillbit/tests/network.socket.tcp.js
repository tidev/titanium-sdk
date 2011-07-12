describe("Ti.Network.Socket.TCP tests", {
	testAPI: function() {
		var socket = Ti.Network.Socket.createTCP();
		valueOf(socket).shouldBeObject();

		var functions = ['connect','listen','accept','close'];
		
		for (var i=0; i < functions.length; i++) {
			valueOf(socket[functions[i]]).shouldBeFunction();
		}
	},

	testConnectAccept: asyncTest({
		start: function(callback) {
			var listener = Ti.Network.Socket.createTCP({
				host:'localhost',
				port:40404
			});
			var acceptPassed = false;
			var connectPassed = false;
			listener.accepted = function (e) {
				try {
					valueOf(e.socket).shouldBeObject();
					valueOf(e.socket.state).shouldBe(Ti.Network.Socket.LISTENING);
					valueOf(e.inbound).shouldBeObject();
					valueOf(e.inbound.state).shouldBe(Ti.Network.Socket.CONNECTED);
				
					valueOf(e.inbound.error).shouldBeFunction();
					
					valueOf(function() { e.inbound.close(); }).shouldNotThrowException();
					valueOf(function() { e.socket.close(); }).shouldNotThrowException();
					acceptPassed = true;
					if (connectPassed) {
						callback.passed();
					}
				} catch (e) {
					callback.failed(e);
				}
			};
			var connector = Ti.Network.Socket.createTCP({
				host:'localhost',
				port:40404
			});
			connector.connected = function (e) {
				try {
					valueOf(e.socket).shouldBeObject();
					valueOf(e.socket.state).shouldBe(Ti.Network.Socket.CONNECTED);
					connectPassed = true;
					valueOf(function() {e.socket.close()}).shouldNotThrowException();
					if (acceptPassed) {
						callback.passed();
					}
				} catch (e) {
					callback.failed(e);
				}
			};
			var x = function(e) {};
			valueOf(function() { listener.listen() }).shouldNotThrowException();
			valueOf(function() { listener.accept({
				error:x
			}) }).shouldNotThrowException();
			valueOf(function() { connector.connect() }).shouldNotThrowException();
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for sockets to connect"
	}),

	testSocketIO: asyncTest({
		start: function() {
			var sourceBuffer = Ti.createBuffer({
				data:"ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
			});
			var readBuffer = Ti.createBuffer({
				length:sourceBuffer.length
			});
			
			var readCallback = this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBe(sourceBuffer.length);
				valueOf(e.bytesProcessed).shouldBe(readBuffer.length);
				
				for (var i=0; i< readBuffer.length; i++) {
					valueOf(sourceBuffer[i]).shouldBe(readBuffer[i]);
				}
				
				valueOf(function() { listener.close(); }).shouldNotThrowException();
				valueOf(function() { connector.close(); }).shouldNotThrowException();
			});
			var writeCallback = this.async(function(e) {
				valueOf(e.errorState).shouldBeUndefined();
				valueOf(e.errorDescription).shouldBeUndefined();
				valueOf(e.bytesProcessed).shouldBe(sourceBuffer.length);
				
				Ti.Stream.read(connector, readBuffer, readCallback);
			});
			
			var listener = Ti.Network.Socket.createTCP({
				host:'localhost',
				port:40405
			});
			listener.accepted = this.async(function (e) {
				Ti.Stream.write(e.inbound, sourceBuffer, writeCallback);
			});
			
			var connector = Ti.Network.Socket.createTCP({
				host:'localhost',
				port:40405
			});
			
			valueOf(function() { listener.listen(); }).shouldNotThrowException();
			valueOf(function() { listener.accept({}); }).shouldNotThrowException();
			valueOf(function() { connector.connect(); }).shouldNotThrowException();
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for socket I/O"
	})
});
