/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.Socket.TCP', function () {

	it('#connect()', function (finish) {
		var socket = Ti.Network.Socket.createTCP({
			host: 'www.appcelerator.com', port: 80,
			connected: function () {
				finish();
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});

	it('#accept()', function () {
		var socket = Ti.Network.Socket.createTCP();
		should(socket.accept).not.be.null;
		should(socket.accept).be.a.Function;
	});

	it('#listen()', function () {
		var socket = Ti.Network.Socket.createTCP();
		should(socket.listen).not.be.null;
		should(socket.listen).be.a.Function;
	});

	it('#close()', function () {
		var socket = Ti.Network.Socket.createTCP();
		should(socket.close).not.be.null;
		should(socket.close).be.a.Function;
	});

	// FIXME: Android chokes with : android.os.NetworkOnMainThreadException
	it('#connect() and send data', function (finish) {
		var socket = Ti.Network.Socket.createTCP({
			host: 'www.appcelerator.com', port: 80,
			connected: function (e) {
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET / HTTP/1.1\r\nHost: www.appcelerator.com\r\nConnection: close\r\n\r\n' }));
				finish();
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});

	// FIXME: iOS fires the connected event twice
	// FIXME: Android chokes with : android.os.NetworkOnMainThreadException
	it('#connect() and receive data', function (finish) {
		var socket = Ti.Network.Socket.createTCP({
			host: 'pastebin.com', port: 80,
			connected: function (e) {
				// receive callback
				should(socket.read).not.be.null;
				should(socket.read).be.a.Function;
				Ti.Stream.pump(e.socket, function (e) {
					if (e.buffer.toString().indexOf('SUCCESS!') > 0) {
						finish();
					} else {
						finish(new Error('Did not get success'));
					}
				}, 1024, true);

				// send GET request
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET /raw/eF5dK0xU HTTP/1.1\r\nHost: pastebin.com\r\nConnection: close\r\n\r\n' }));
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});
});
