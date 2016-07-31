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

var fs = require('fs');
var init = require('node-pre-gyp-init');
var path = require('path');

// reference counter to track how many trackDevice() calls are active
var pumping = 0;
var timer;
var binding;

module.exports.pumpInterval = 10;
module.exports.devices = devices;
module.exports.trackDevices = trackDevices;
module.exports.installApp = installApp;
module.exports.log = log;

function initBinding(callback) {
	if (process.platform !== 'darwin') {
		return setImmediate(function () {
			callback(new Error(process.platform + ' not supported'));
		});
	}

	if (binding) {
		return setImmediate(callback);
	}

	init(path.resolve(__dirname, './package.json'), function (err, bindingPath) {
		if (!err) {
			binding = require(bindingPath);
		}
		callback(err);
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

		binding.pumpRunLoop();
		callback(null, binding.devices());
	});
}

/**
 * Continuously retrieves an array of all connected iOS devices. Whenever a
 * device is connected or disconnected, the specified callback is fired.
 *
 * @param {Function} callback(err, devices) - A function to call with the connected devices.
 * @returns {Function} off() - A function that discontinues tracking.
 */
function trackDevices(callback) {
	var stopped = true;

	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		// if we're not already pumping, start up the pumper
		if (!pumping) {
			pump(binding);
		}
		pumping++;

		// immediately return the array of devices
		callback(null, binding.devices());

		stopped = false;

		// listen for any device connects or disconnects
		binding.on('devicesChanged', function (devices) {
			stopped || callback(null, binding.devices());
		});
	});

	// return the stop() function
	return function () {
		if (!stopped) {
			stopped = true;
			pumping = Math.max(pumping - 1, 0);
			pumping || clearTimeout(timer);
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

		if (!fs.existsSync(appPath)) {
			return callback(new Error('Specified .app path does not exist'));
		}
		if (!fs.statSync(appPath).isDirectory() || !fs.existsSync(path.join(appPath, 'PkgInfo'))) {
			return callback(new Error('Specified .app path is not a valid app'));
		}

		binding.pumpRunLoop();

		try {
			binding.installApp(udid, appPath);
			callback(null);
		} catch (ex) {
			callback(ex);
		}
	});
}

/**
 * Forwards the specified iOS device's log messages.
 *
 * @param {String} udid - The device udid to forward log messages.
 * @param {Function} callback(err) - A function to call with each log message.
 */
function log(udid, callback) {
	var stopped = true;

	initBinding(function (err) {
		if (err) {
			return callback(err);
		}

		// if we're not already pumping, start up the pumper
		if (!pumping) {
			pump();
		}
		pumping++;

		stopped = false;

		binding.log(udid, function (msg) {
			stopped || callback(msg);
		});
	});

	// return the off() function
	return function () {
		if (!stopped) {
			stopped = true;
			pumping = Math.max(pumping - 1, 0);
			pumping || clearTimeout(timer);
		}
	};
}

/**
 * Ticks the CoreFoundation run loop.
 *
 * @param {Object} binding - The native module binding.
 */
function pump() {
	binding.pumpRunLoop();
	timer = setTimeout(pump, exports.pumpInterval);
}
