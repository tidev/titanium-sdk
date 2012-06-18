module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "network_socket_tcp";
	this.tests = [
		{name: "testAPI"},
		{name: "testConnectAccept", timeout: 10000},
		{name: "testSocketIO", timeout: 10000}
	]

	this.testAPI = function() {
		var socket = Ti.Network.Socket.createTCP();
		valueOf(socket).shouldBeObject();

		var functions = ['connect','listen','accept','close'];

		for (var i=0; i < functions.length; i++) {
			valueOf(socket[functions[i]]).shouldBeFunction();
		}

		finish();
	}

	this.testConnectAccept = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var listener = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40405
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
					finish();
				}
			} catch (e) {
				callback_error(e);
			}
		};
		var connector = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40405
		});
		connector.connected = function (e) {
			try {
				valueOf(e.socket).shouldBeObject();
				valueOf(e.socket.state).shouldBe(Ti.Network.Socket.CONNECTED);
				valueOf(function() {e.socket.close()}).shouldNotThrowException();
				connectPassed = true;
				if (acceptPassed) {
					finish();
				}
			} catch (e) {
				callback_error(e);
			}
		};
		var x = function(e) {};
		valueOf(function() { listener.listen() }).shouldNotThrowException();
		valueOf(function() { listener.accept({
			error:x
		}) }).shouldNotThrowException();
		valueOf(function() { connector.connect() }).shouldNotThrowException();
	}

	this.testSocketIO = function() {
		var readPassed = false;
		var writePassed = false;
		var sourceBuffer = Ti.createBuffer({
			data:"ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});
		var readBuffer = Ti.createBuffer({
			length:sourceBuffer.length
		});

		var readCallback = function(e) {
			valueOf(e.errorState).shouldBeUndefined();
			valueOf(e.errorDescription).shouldBeUndefined();
			valueOf(e.bytesProcessed).shouldBe(sourceBuffer.length);
			valueOf(e.bytesProcessed).shouldBe(readBuffer.length);
				
			for (var i=0; i< readBuffer.length; i++) {
				valueOf(sourceBuffer[i]).shouldBe(readBuffer[i]);
			}

			valueOf(function() { listener.close(); }).shouldNotThrowException();
			valueOf(function() { connector.close(); }).shouldNotThrowException();

			readPassed = true;
			if (writePassed) {
				finish();
			}
		};
		var writeCallback = function(e) {
			valueOf(e.errorState).shouldBeUndefined();
			valueOf(e.errorDescription).shouldBeUndefined();
			valueOf(e.bytesProcessed).shouldBe(sourceBuffer.length);

			Ti.Stream.read(connector, readBuffer, readCallback);

			writePassed = true;
			if (readPassed) {
				finish();
			}
		};

		var listener = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40406
		});
		listener.accepted = function (e) {
			Ti.Stream.write(e.inbound, sourceBuffer, writeCallback);
		};

		var connector = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40406
		});

		valueOf(function() { listener.listen(); }).shouldNotThrowException();
		valueOf(function() { listener.accept({}); }).shouldNotThrowException();
		valueOf(function() { connector.connect(); }).shouldNotThrowException();
	}
}
