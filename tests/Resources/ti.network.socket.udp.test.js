/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windows('Titanium.Network.Socket', function () {

	it('#createUDP()', function () {
		var socket = Ti.Network.Socket.createUDP({
			started: function () {
				setTimeout(function () {
					socket.stop();
				}, 1000);
			}
		});
		should(socket).have.readOnlyProperty('apiName').which.is.a.String();
		should(socket.apiName).be.eql('Ti.Network.Socket.UDP');
	});
});

describe.windows('Titanium.Network.Socket.UDP', function () {
	this.timeout(6e4);

	it('#start(Integer)', function (finish) {
		var socket = Ti.Network.Socket.createUDP({
			started: function (e) {
				should(e.address).not.be.null();
				should(e.port).not.be.null();
				setTimeout(function () {
					socket.stop();
					finish();
				}, 1000);
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.start).not.be.null();
		should(socket.start).be.a.Function();
		socket.start(43210);
	});

	// Timing out on Windows Phone
	it.windowsPhoneBroken('#sendString(Integer, Number, String)', function (finish) {
		var socket = Ti.Network.Socket.createUDP({
			started: function (e) {
				should(e.address).not.be.null();
				should(e.port).not.be.null();
				setTimeout(function () {
					socket.sendString(e.port, e.address, 'Hello, World!');
				}, 1000);
			},
			data: function (e) {
				should(e.address).not.be.null();
				should(e.port).not.be.null();
				should(e.stringData).not.be.null();
				should(e.bytesData).not.be.null();
				setTimeout(function () {
					socket.stop();
					finish();
				}, 1000);
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.sendString).not.be.null();
		should(socket.sendString).be.a.Function();
		socket.start(43211);
	});

	// Timing out on Windows Phone
	it.windowsBroken('#sendBytes(Number, String, Integer[])', function (finish) {
		var socket = Ti.Network.Socket.createUDP({
			started: function (e) {
				should(e.address).not.be.null();
				should(e.port).not.be.null();
				setTimeout(function () {
					socket.sendBytes(e.port, e.address, [ 73, 116, 32, 119, 111, 114, 107, 115, 33 ]);
				}, 1000);
			},
			data: function (e) {
				should(e.address).not.be.null();
				should(e.port).not.be.null();
				should(e.stringData).not.be.null();
				should(e.bytesData).not.be.null();
				setTimeout(function () {
					socket.stop();
					finish();
				}, 1000);
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.sendBytes).not.be.null();
		should(socket.sendBytes).be.a.Function();
		socket.start(43212);
	});
});
