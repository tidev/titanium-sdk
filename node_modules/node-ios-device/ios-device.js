/**
 * Public API for the node-ios-device library.
 *
 * @module ios-device
 *
 * @copyright
 * Copyright (c) 2012-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

var debug = require('debug')('node-ios-device');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var init = require('node-pre-gyp-init');
var path = require('path');
var util = require('util');

var binding;
var activeCalls = 0;
var emitter = new EventEmitter;

emitter.on('debug', debug);

module.exports.devices = devices;
module.exports.trackDevices = trackDevices;
module.exports.installApp = installApp;
module.exports.log = log;

/**
 * Exposes both an event emitter API and a `stop()` method for canceling long
 * running functions such as `trackDevices()` and `log()`.
 */
function Handle() {}
util.inherits(Handle, EventEmitter);
Handle.prototype.stop = function stop() {
	// meant to be overwritten
};

/**
 * Internal helper function that initializes the node-ios-device binding.
 *
 * @param {Function} callback - A function to call after node-ios-device has
 * been loaded and initialized.
 */
function initBinding(callback) {
	if (process.platform !== 'darwin') {
		return setImmediate(function () {
			callback(new Error(process.platform + ' not supported'));
		});
	}

	if (binding) {
		return setImmediate(callback);
	}

	debug('Initializing binding');

	init(path.resolve(__dirname, './package.json'), function (err, bindingPath) {
		if (err) {
			return callback(err);
		}

		debug('Loading binding: ' + bindingPath);
		binding = require(bindingPath);

		debug('Initializing node-ios-device and setting emitter');
		binding.initialize(emitter);

		callback();
	});
}

/**
 * Retrieves an array of all connected iOS devices.
 *
 * @param {Function} callback(err, devices) - A function to call with the connected devices.
 */
function devices(callback) {
	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		debug('Calling binding.devices()');
		activeCalls++;

		binding.devices(function (err, devices) {
			callback(err, devices);
			if (--activeCalls === 0) {
				binding.suspend();
			}
		});
	});
}

/**
 * Continuously retrieves an array of all connected iOS devices. Whenever a
 * device is connected or disconnected, the specified callback is fired.
 *
 * @returns {Handle} A handle that emits a `log` event and `stop()` method.
 */
function trackDevices() {
	var handle = new Handle;
	var running = false;
	var onDevicesChanged = function () {
		if (running) {
			debug('Devices changed, calling callback');
			binding.devices(function (err, devices) {
				if (err) {
					handle.stop();
					handle.emit('error', err);
				} else {
					handle.emit('devices', devices);
				}
			});
		}
	};

	handle.stop = function stop() {
		if (running) {
			running = false;
			emitter.removeListener('devicesChanged', onDevicesChanged);
			if (--activeCalls === 0) {
				binding.suspend();
			}
		}
	};

	initBinding(function (err) {
		if (err) {
			return handle.emit('error', err);
		}

		activeCalls++;
		running = true;

		binding.devices(function (err, devices) {
			if (err) {
				handle.stop();
				handle.emit('error', err);
			} else {
				handle.emit('devices', devices);
			}
		});

		emitter.on('devicesChanged', onDevicesChanged);
		binding.resume();
	});

	return handle;
}

/**
 * Installs an iOS app on the specified device.
 *
 * @param {String} udid - The device udid to install the app to.
 * @param {String} appPath - The path to iOS .app directory to install.
 * @param {Function} callback(err) - A function to call when the install finishes.
 */
function installApp(udid, appPath, callback) {
	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		appPath = path.resolve(appPath);

		try {
			if (!fs.statSync(appPath).isDirectory()) {
				return callback(new Error('Specified .app path is not a valid app'));
			}
		} catch (e) {
			return callback(new Error('Specified .app path does not exist'));
		}

		try {
			fs.statSync(path.join(appPath, 'PkgInfo'));
		} catch (e) {
			return callback(new Error('Specified .app path is not a valid app'));
		}

		activeCalls++;
		binding.resume();
		binding.installApp(udid, appPath, function (err) {
			callback(err);
			if (--activeCalls === 0) {
				binding.suspend();
			}
		});
	});
}

/**
 * Forwards the specified iOS device's log messages.
 *
 * @param {String} udid - The device udid to forward log messages.
 * @param {Number} [port] - An optional port number to connect to on the device,
 * otherwise assumes syslog.
 * @returns {Handle} A handle that emits a `log` event and `stop()` method.
 */
function log(udid, port) {
	if (typeof port !== 'undefined' && (typeof port !== 'number' || port < 1 || port > 65535)) {
		throw new Error('Port must be a number between 1 and 65535');
	}

	var handle = new Handle;
	var running = false;
	var evtName = (port ? 'LOG_PORT_' + port + '_' : 'SYSLOG_') + udid;
	var emitFn = function (msg) {
		handle.emit('log', msg);
	};
	emitter.on(evtName, emitFn);
	var timer = null;

	function tryStartLogRelay() {
		try {
			binding.startLogRelay(udid, port);
			running = true;
			handle.emit('app-started');
		} catch (e) {
			timer = setTimeout(tryStartLogRelay, 250);
		}
	};

	emitter.on('app-quit', function (_port) {
		if (~~_port === port) {
			handle.emit('app-quit');
			setImmediate(tryStartLogRelay);
		}
	});

	var trackHandle = trackDevices()
		.on('devices', function (devices) {
			debug('Connected devices: ' + devices.map(function (dev) { return dev.udid; }).join(', '));
			clearTimeout(timer);
			if (devices.some(function (dev) { return dev.udid === udid; })) {
				tryStartLogRelay();
			} else if (running) {
				// device was disconnected
				debug('Device was disconnected');
				handle.emit('disconnect');
			} else {
				// device was never connected
				handle.stop();
				handle.emit('error', new Error('Device \'' + udid + '\' not connected'));
			}
		})
		.on('error', function (err) {
			handle.stop();
			handle.emit('error', err);
		});

	handle.stop = function stop() {
		running = false;
		clearTimeout(timer);
		emitter.removeListener(evtName, emitFn);

		if (!emitter._events[evtName] || emitter._events[evtName].length <= 0) {
			try {
				// if the device has been disconnected before this stop()
				// function has been called, then node-ios-device will throw an
				// error that it can't stop relaying the log since the device
				// has been disconnected
				binding.stopLogRelay(udid, port);
			} catch (e) {
				// squeltch
			}
		}

		trackHandle.stop();
	};

	return handle;
}
