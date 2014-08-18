/**
 * The main CLI logic. This orchestrates all argument parsing, command loading,
 * validation, and execution.
 *
 * @module cli
 *
 * @copyright
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path'),

	// flag used to make sure we don't require the native module twice
	initialized = false,

	// the native module
	iosDeviceModule,

	// reference counter to track how many trackDevice() calls are active
	pumping = 0,

	// the setInterval() reference
	interval;

/**
 * Detects which version of node-ios-device should be require()'d.
 */
function loadIosDeviceModule() {
	if (initialized) return;

	var modulesVer = parseInt(process.versions.modules) || (function (m) {
		return !m || m[1] == '0.8' ? 1 : m[1] == '0.10' ? 11 : m[1] == '0.11' && m[2] < 8 ? 12 : 13;
	}(process.version.match(/^v(\d+\.\d+)\.(\d+)$/)));

	var lib = __dirname + '/out/node_ios_device_v' + modulesVer;

	var file = path.resolve(lib + '.node');
	if (!fs.existsSync(file)) {
		throw new Error('Missing compatible node-ios-device library');
	}

	iosDeviceModule = require(lib);
	initialized = true;
}

/**
 * Retrieves an array of all connected iOS devices.
 *
 * @param {Function} callback(err, devices) - A function to call with the connected devices
 */
exports.devices = function devices(callback) {
	if (process.platform != 'darwin') {
		return callback(new Error('OS "' + process.platform + '" not supported'));
	}

	loadIosDeviceModule();
	iosDeviceModule.pumpRunLoop();

	callback(null, iosDeviceModule.devices());
};

/**
 * Continuously retrieves an array of all connected iOS devices. Whenever a
 * device is connected or disconnected, the specified callback is fired.
 *
 * @param {Function} callback(err, devices) - A function to call with the connected devices
 * @returns {Function} off() - A function that discontinues tracking
 */
exports.trackDevices = function trackDevices(callback) {
	if (process.platform != 'darwin') {
		return callback(new Error('OS "' + process.platform + '" not supported'));
	}

	loadIosDeviceModule();

	// if we're not already pumping, start up the pumper
	if (!pumping) {
		interval = setInterval(iosDeviceModule.pumpRunLoop, exports.pumpInterval);
	}
	pumping++;

	// immediately return the array of devices
	exports.devices(callback);

	var off = false;

	// listen for any device connects or disconnects
	iosDeviceModule.on("devicesChanged", function (devices) {
		off || callback(null, iosDeviceModule.devices());
	});

	// return the off() function
	return function () {
		if (!off) {
			off = true;
			pumping = Math.max(pumping - 1, 0);
			pumping || clearInterval(interval);
		}
	};
};

/**
 * Installs an iOS app on the specified device.
 *
 * @param {String} udid - The device udid to install the app to
 * @param {String} appPath - The path to iOS .app directory to install
 * @param {Function} callback(err) - A function to call when the install finishes
 */
exports.installApp = function installApp(udid, appPath, callback) {
	if (process.platform != 'darwin') {
		return callback(new Error('OS "' + process.platform + '" not supported'));
	}

	appPath = path.resolve(appPath);
	if (!fs.existsSync(appPath)) {
		return callback(new Error('Specified .app path does not exist'));
	}
	if (!fs.statSync(appPath).isDirectory() || !fs.existsSync(path.join(appPath, 'PkgInfo'))) {
		return callback(new Error('Specified .app path is not a valid app'));
	}

	loadIosDeviceModule();
	iosDeviceModule.pumpRunLoop();

	try {
		iosDeviceModule.installApp(udid, appPath);
		callback(null);
	} catch (ex) {
		callback(ex);
	}
};

/**
 * Forwards the specified iOS device's log messages.
 *
 * @param {String} udid - The device udid to forward log messages
 * @param {Function} callback(err) - A function to call with each log message
 */
exports.log = function log(udid, callback) {
	if (process.platform != 'darwin') {
		return callback(new Error('OS "' + process.platform + '" not supported'));
	}

	loadIosDeviceModule();

	// if we're not already pumping, start up the pumper
	if (!pumping) {
		interval = setInterval(iosDeviceModule.pumpRunLoop, exports.pumpInterval);
	}
	pumping++;

	var off = false;

	iosDeviceModule.log(udid, function (msg) {
		off || callback(msg);
	});

	// return the off() function
	return function () {
		if (!off) {
			off = true;
			pumping = Math.max(pumping - 1, 0);
			pumping || clearInterval(interval);
		}
	};
};