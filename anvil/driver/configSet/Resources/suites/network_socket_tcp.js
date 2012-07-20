/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

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

	this.testAPI = function(testRun) {
		var socket = Ti.Network.Socket.createTCP();
		valueOf(testRun, socket).shouldBeObject();

		var functions = ['connect','listen','accept','close'];

		for (var i=0; i < functions.length; i++) {
			valueOf(testRun, socket[functions[i]]).shouldBeFunction();
		}

		finish(testRun);
	}

	this.testConnectAccept = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var listener = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40505
		});
		var acceptPassed = false;
		var connectPassed = false;
		listener.accepted = function (e) {
			try {
				valueOf(testRun, e.socket).shouldBeObject();
				valueOf(testRun, e.socket.state).shouldBe(Ti.Network.Socket.LISTENING);
				valueOf(testRun, e.inbound).shouldBeObject();
				valueOf(testRun, e.inbound.state).shouldBe(Ti.Network.Socket.CONNECTED);

				valueOf(testRun, e.inbound.error).shouldBeFunction();

				valueOf(testRun, function() { e.inbound.close(); }).shouldNotThrowException();
				valueOf(testRun, function() { e.socket.close(); }).shouldNotThrowException();
				acceptPassed = true;
				if (connectPassed) {
					finish(testRun);
				}
			} catch (e) {
				callback_error(e);
			}
		};
		var connector = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40505
		});
		connector.connected = function (e) {
			try {
				valueOf(testRun, e.socket).shouldBeObject();
				valueOf(testRun, e.socket.state).shouldBe(Ti.Network.Socket.CONNECTED);
				valueOf(testRun, function() {e.socket.close()}).shouldNotThrowException();
				connectPassed = true;
				if (acceptPassed) {
					finish(testRun);
				}
			} catch (e) {
				callback_error(e);
			}
		};
		var x = function(e) {};
		valueOf(testRun, function() { listener.listen() }).shouldNotThrowException();
		valueOf(testRun, function() { listener.accept({
			error:x
		}) }).shouldNotThrowException();
		valueOf(testRun, function() { connector.connect() }).shouldNotThrowException();
	}

	this.testSocketIO = function(testRun) {
		var readPassed = false;
		var writePassed = false;
		var sourceBuffer = Ti.createBuffer({
			data:"ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY ALL WORK AND NO PLAY MAKES JACK A DULL BOY"
		});
		var readBuffer = Ti.createBuffer({
			length:sourceBuffer.length
		});

		var readCallback = function(e) {
			valueOf(testRun, e.errorState).shouldBeZero();
			valueOf(testRun, e.errorDescription).shouldBe('');
			valueOf(testRun, e.bytesProcessed).shouldBe(sourceBuffer.length);
			valueOf(testRun, e.bytesProcessed).shouldBe(readBuffer.length);
				
			for (var i=0; i< readBuffer.length; i++) {
				valueOf(testRun, sourceBuffer[i]).shouldBe(readBuffer[i]);
			}

			valueOf(testRun, function() { listener.close(); }).shouldNotThrowException();
			valueOf(testRun, function() { connector.close(); }).shouldNotThrowException();

			readPassed = true;
			if (writePassed) {
				finish(testRun);
			}
		};
		var writeCallback = function(e) {
			valueOf(testRun, e.errorState).shouldBeZero();
			valueOf(testRun, e.errorDescription).shouldBe('');
			valueOf(testRun, e.bytesProcessed).shouldBe(sourceBuffer.length);

			Ti.Stream.read(connector, readBuffer, readCallback);

			writePassed = true;
			if (readPassed) {
				finish(testRun);
			}
		};

		var listener = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40506
		});
		listener.accepted = function (e) {
			Ti.Stream.write(e.inbound, sourceBuffer, writeCallback);
		};

		var connector = Ti.Network.Socket.createTCP({
			host:'localhost',
			port:40506
		});

		valueOf(testRun, function() { listener.listen(); }).shouldNotThrowException();
		valueOf(testRun, function() { listener.accept({}); }).shouldNotThrowException();
		valueOf(testRun, function() { connector.connect(); }).shouldNotThrowException();
	}
}
