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

var binding;
var activeCalls = 0;
var emitter = new EventEmitter;

emitter.on('debug', debug);

module.exports.devices = devices;
module.exports.trackDevices = trackDevices;
module.exports.installApp = installApp;
module.exports.log = log;

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

		binding.devices(function (err, devs) {
			callback(err, devs);
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
 * @param {Function} callback(err, devices) - A function to call with the connected devices.
 * @returns {Function} A function that discontinues tracking.
 */
function trackDevices(callback) {
	var stopped = true;
	var handler = function (devices) {
		if (!stopped) {
			debug('Devices changed, calling callback');
			binding.devices(callback);
		}
	};

	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		activeCalls++;
		binding.devices(callback);
		stopped = false;

		// listen for any device connects or disconnects
		binding.resume();
		emitter.on('devicesChanged', handler);
	});

	// return the stop() function
	return function stop() {
		stopped = true;
		emitter.removeListener('devicesChanged', handler);
		if (--activeCalls === 0) {
			binding.suspend();
		}
	};
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
 * @param {Function} callback(err) - A function to call with each log message.
 * @returns {Function} - A function to that stops streaming the log output.
 */
function log(udid, callback) {
	var stopped = true;

	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		stopped = false;
		activeCalls++;

		emitter.on(udid, callback);

		binding.resume();
		binding.startLogRelay(udid);
	});

	// return the stop() function
	return function stop() {
		stopped = true;
		emitter.removeListener(udid, callback);

		if (!emitter._events[udid] || emitter._events[udid].length <= 0) {
			binding.stopLogRelay(udid);
		}

		if (--activeCalls === 0) {
			binding.suspend();
		}
	};
}
