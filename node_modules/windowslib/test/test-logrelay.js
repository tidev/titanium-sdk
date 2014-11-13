/**
 * Tests windowslib's logrelay module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	net = require('net'),
	windowslib = require('..');

describe('log relay', function () {
	it('namespace should be an object', function () {
		should(windowslib.LogRelay).be.an.Function;
	});

	it('start log relay, receive TCP connection, get log message, shutdown', function (done) {
		this.timeout(5000);
		this.slow(4000);

		var relay = new windowslib.LogRelay();
		var testMsg = 'Hello World!';

		relay.on('started', function () {
			var client = net.createConnection(relay.tcpPort, function (conn) {
				client.write(relay.serverToken + '\n');
				client.write(testMsg);
				client.destroy();
			});
		});

		relay.on('message', function (msg) {
			relay.stop();
			should(msg).equal(testMsg);
			done();
		});

		relay.start();
	});

	it('start log relay, receive TCP connection, get log message, wait for buffers to flush, shutdown', function (done) {
		this.timeout(5000);
		this.slow(4000);

		var relay = new windowslib.LogRelay();
		var testMsg = 'Hello World!';

		relay.on('started', function () {
			var client = net.createConnection(relay.tcpPort, function (conn) {
				client.write(relay.serverToken + '\n');
				client.write(testMsg);
			});
		});

		relay.on('message', function (msg) {
			relay.stop();
			should(msg).equal(testMsg);
			done();
		});

		relay.start();
	});
});