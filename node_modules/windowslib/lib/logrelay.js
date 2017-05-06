/**
 * Relays log messages from a Windows Phone emulator or device.
 *
 * @module logrelay
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	EventEmitter = require('events').EventEmitter,
	net = require('net'),
	util = require('util'),
	uuid = require('uuid'),
	__ = appc.i18n(__dirname).__;

module.exports = LogRelay;

/**
 * Creates LogRelay object.
 *
 * @class
 * @classdesc Hook registry and dispatcher.
 * @extends EventEmitter
 * @constructor
 *
 * @param {Object} [opts] - An object containing various settings.
 * @param {Boolean} [opts.includeInternalIPAddresses=true] - When true, detects internal IP addresses including the local loopback interface.
 * @param {String} [opts.serverToken] - A unique token that describes the computer where the LogRelay is running.
 * @param {Number} [opts.tcpPort=8666] - The port to listen for the app to connect and received log messages.
 */
function LogRelay(opts) {
	opts || (opts = {});

	// the token is used by the app to try and find the correct log relay server
	this.serverToken = opts.serverToken || uuid.v4();

	this.includeInternalIPAddresses = opts.includeInternalIPAddresses !== void 0 ? opts.includeInternalIPAddresses : true;

	this.ipAddressList = [];
	this.tcpPort = opts.tcpPort || 8666;
	this.tcpServer = null;
}

util.inherits(LogRelay, EventEmitter);

/**
 * Starts the TCP log relay server.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [callback(err)] - A function that is called after the log relay server starts.
 *
 * @emits module:logrelay#connection
 * @emits module:logrelay#disconnect
 * @emits module:logrelay#error
 * @emits module:logrelay#message
 * @emits module:logrelay#started
 */
LogRelay.prototype.start = function start(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	var self = this;

	appc.net.interfaces(function (ifaces) {
		Object.keys(ifaces).forEach(function (name) {
			ifaces[name].ipAddresses.forEach(function (ip) {
				if (/IPv4/i.test(ip.family) && (!ip.internal || self.includeInternalIPAddresses === void 0 || self.includeInternalIPAddresses)) {
					self.ipAddressList.push(ip.address);
				}
			});
		});

		// because the tcp server is sensitive to port collisions, we basically create this loop
		// that will continue to try ports until it finds an open port
		(function startTCPServer() {
			// create and start the tcp server
			if (self.tcpServer) {
				try {
					self.tcpServer.close();
				} catch (e) {}
				self.tcpServer = null;
			}

			var tcpServer = self.tcpServer = net.createServer(handleLogConnection);

			tcpServer.on('error', function (e) {
				if (e.code == 'EADDRINUSE') {
					self.emit('log-debug', __('Log relay failed to bind to port %s, trying port %s', self.tcpPort, self.tcpPort + 1));
					self.tcpPort++;
					startTCPServer();
				} else {
					self.stop();
					var ex = new Error(__('TCP server error: %s', e.toString()));
					self.emit('error', ex);
					callback(ex);
				}
			});

			tcpServer.listen(self.tcpPort, function () {
				self.emit('log-debug', __('Log relay listening on port %s on %s', self.tcpPort, self.ipAddressList.join(', ')));
				self.emit('started', this);
				callback(null, this);
			});
		}());

		function emitLines(lines) {
			var len = lines.length;

			// if the last line is empty, then it's probably not wanted
			// note that we only want to strip the last empty line, so we can't use trim()
			if (len > 0 && lines[len - 1] === '') {
				len--;
			}

			for (var i = 0; i < len; i++) {
				self.emit('message', lines[i]);
			}
		}

		function handleLogConnection(conn) {
			self.emit('connection', conn);

			var initialized = false,
				buffer = '',
				timer;

			conn.on('data', function (data) {
				clearTimeout(timer);

				var lines = (buffer + data.toString()).split('\n');

				if (!initialized) {
					if (lines[0] !== self.serverToken) {
						// bad request, hang up
						conn.destroy();
						return;
					}

					lines.splice(0, 1);
					initialized = true;
				}

				// safe the last line in case it's incomplete
				buffer = lines.pop();

				// output what we have so far
				emitLines(lines);

				// we wait 2 seconds for more data before we just flush the buffer
				timer = setTimeout(function () {
					emitLines(buffer.split('\n'));
					buffer = '';
				}, 2000);
			});

			conn.on('close', function () {
				// flush buffer
				emitLines(buffer.split('\n'));
				buffer = '';

				self.emit('disconnect', conn);
			});

			conn.on('error', function () {});
		};
	});
};

/**
 * Stops the UDP beacon and TCP log relay servers.
 *
 * @emits module:logrelay#stopped
 */
LogRelay.prototype.stop = function stop() {
	if (this.tcpServer) {
		this.tcpServer.close();
		this.tcpServer = null;
	}

	this.emit('stopped');
};
