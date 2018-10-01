/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Ti.Network.TCP.Socket', function () {
	var socket;
	this.timeout(6e4);

	afterEach(function () {
		if (socket && socket.state == Ti.Network.Socket.CONNECTED) { // eslint-disable-line eqeqeq
			socket.close();
		}
		socket = null;
	});

	it('#connect() and #write() async', function (finish) {
		socket = Ti.Network.Socket.createTCP({
			host: 'www.appcelerator.com',
			port: 80,
			connected: function () {
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET / HTTP/1.1\r\nHost: www.appcelerator.com\r\nConnection: close\r\n\r\n' }), function (evt) {
					try {
						evt.success.should.eql(true);
						evt.bytesProcessed.should.eql(65);
						finish();
					} catch (err) {
						finish(err);
					}
				});
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});

	it.windowsBroken('#connect(), #write(), #pump() async', function (finish) {
		var buffer = '';
		socket = Ti.Network.Socket.createTCP({
			host: 'pastebin.com',
			port: 80,
			timeout: 20000,
			connected: function (e) {
				// receive callback
				should(socket.read).not.be.null;
				should(socket.read).be.a.Function;

				// send GET request
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET /raw/eF5dK0xU HTTP/1.1\r\nHost: pastebin.com\r\nConnection: close\r\n\r\n' }), function (evt) {
					evt.success.should.eql(true);

					Ti.Stream.pump(e.socket, function (e) {
						if (e.buffer) {
							buffer += e.buffer.toString();
						}
						// end of stream
						// note: iOS e.buffer will be `null` where Android wont
						if (e.bytesProcessed === -1) {
							if (buffer.indexOf('SUCCESS!') !== -1) {
								finish();
							} else {
								finish(new Error('failed to receive success'));
							}
						}
					}, 1024, true);
				});
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
