/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.Network.Socket.TCP', function () {
	var socket;
	this.timeout(6e4);

	afterEach(function () {
		if (socket && socket.state == Ti.Network.Socket.CONNECTED) { // eslint-disable-line eqeqeq
			socket.close();
		}
		socket = null;
	});

	it('should open SSL/TLS connection using HTTPS', done => {
		socket = Ti.Network.Socket.createTCP({
			host: 'httpbin.org',
			port: 443,
			useTls: true,
			connected: () => {
				Ti.Stream.pump(socket, (e) => {
					if (e.bytesProcessed === -1 || e.bytesProcessed === '-1') {
						done(new Error('Socket EOF / Error using SSL/TLS'));
					}

					const response = e.buffer.toString();
					if (response.indexOf('HTTP/1.') !== -1) {
						return done();
					} else {
						done(new Error('Invalid HTTP response.'));
					}
				}, 64 * 1024, true);

				let httpHeader = 'GET /html HTTP/1.1\r\n';
				httpHeader += 'Host: httpbin.org\r\n';
				httpHeader += '\r\n';
				const data = Ti.createBuffer({
					value: httpHeader
				});
				socket.write(data, () => {});
			},
			error: e => {
				done(new Error(e.error));
			}
		});
		socket.connect();
	});

	it('should connect when manual hostname verification succeeds', done => {
		socket = Ti.Network.Socket.createTCP({
			host: 'httpbin.org',
			port: 443,
			useTls: true,
			checkServerIdentity(hostname, cert) {
				if (hostname === cert.subject.CN) {
					return null;
				}

				return new Error('Invalid certificate');
			},
			connected: () => {
				Ti.Stream.pump(socket, (e) => {
					if (e.bytesProcessed === -1 || e.bytesProcessed === '-1') {
						done(new Error('Socket EOF / Error using SSL/TLS'));
					}

					const response = e.buffer.toString();
					if (response.indexOf('HTTP/1.') !== -1) {
						return done();
					} else {
						done(new Error('Invalid HTTP response.'));
					}
				}, 64 * 1024, true);

				let httpHeader = 'GET /html HTTP/1.1\r\n';
				httpHeader += 'Host: httpbin.org\r\n';
				httpHeader += '\r\n';
				const data = Ti.createBuffer({
					value: httpHeader
				});
				socket.write(data, () => {});
			},
			error: e => {
				done(new Error(e.error));
			}
		});
		socket.connect();
	});

	it('should error when manual hostname verification fails', done => {
		socket = Ti.Network.Socket.createTCP({
			host: 'httpbin.org',
			port: 443,
			useTls: true,
			checkServerIdentity(hostname, cert) {
				return new Error('Invalid certificate');
			},
			connected() {
				done(new Error('Unexpected socket connection.'));
			},
			error: e => {
				done();
			}
		});
		socket.connect();
	});
});
