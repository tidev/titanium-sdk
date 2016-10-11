/**
 * Detects iOS developer and distribution certificates and the WWDC certificate.
 *
 * @module device
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc');
const async = require('async');
const magik = require('./utilities').magik;
const fs = require('fs');
const iosDevice = require('node-ios-device');
const path = require('path');
const __ = appc.i18n(__dirname).__;

var cache;

exports.detect = detect;
exports.install = install;

/**
 * Detects connected iOS devices.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all connected iOS devices.
 * @param {Function} [callback(err, results)] - A function to call with the device information.
 *
 * @emits module:device#detected
 * @emits module:device#error
 *
 * @returns {Handle}
 */
function detect(options, callback) {
	return magik(options, callback, function (handle, options, callback) {
		if (cache && !options.bypassCache) {
			var dupe = JSON.parse(JSON.stringify(cache));
			handle.emit('detected', dupe);
			return callback(null, dupe);
		}

		iosDevice.devices(function (err, devices) {
			if (err) {
				handle.emit('error', err);
				return callback(err);
			}

			var results = {
				devices: devices,
				issues: []
			};

			// the cache must be a clean copy that we'll clone for subsequent detect() calls
			// because we can't allow the cache to be modified by reference
			cache = JSON.parse(JSON.stringify(results));

			handle.emit('detected', results);
			return callback(null, results);
		});
	});
};

/**
 * Installs the specified app to an iOS device.
 *
 * @param {String} udid - The UDID of the device to install the app to or null if you want ioslib to pick one.
 * @param {String} appPath - The path to the iOS app to install after launching the iOS Simulator.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all iOS simulators.
 * @param {Number} [options.logPort] - A port to connect to in the iOS app and relay log messages from.
 * @param {Number} [options.timeout] - Number of milliseconds to wait before timing out.
 *
 * @emits module:device#app-quit - Only omitted when `options.logPort` is specified and app starts a TCP server.
 * @emits module:device#app-started - Only omitted when `options.logPort` is specified and app starts a TCP server.
 * @emits module:device#disconnect - Only omitted when `options.logPort` is specified and app starts a TCP server.
 * @emits module:device#error
 * @emits module:device#installed
 * @emits module:device#log - Only omitted when `options.logPort` is specified and app starts a TCP server.
 *
 * @returns {Handle}
 */
function install(udid, appPath, options) {
	return magik(options, null, function (handle, options) {
		if (!appPath) {
			return handle.emit('error', new Error(__('Missing app path argument')));
		}

		if (!fs.existsSync(appPath)) {
			return handle.emit('error', new Error(__('App path does not exist: ' + appPath)));
		}

		iosDevice.installApp(udid, appPath, function (err) {
			if (err) {
				return handle.emit('error', err);
			}

			handle.emit('installed');

			if (options.logPort) {
				iosDevice
					.log(udid, options.logPort)
					.on('log', function (msg) {
						handle.emit('log', msg);
					})
					.on('app-started', function () {
						handle.emit('app-started');
					})
					.on('app-quit', function () {
						handle.emit('app-quit');
					})
					.on('disconnect', function () {
						handle.emit('disconnect');
					})
					.on('error', function (err) {
						handle.emit('log-error', err);
					});
			}
		});
	});
}
