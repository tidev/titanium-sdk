/**
 * Detects iOS developer and distribution certificates and the WWDC certificate.
 *
 * @module device
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
	async = require('async'),
	magik = require('./utilities').magik,
	fs = require('fs'),
	iosDevice = require('node-ios-device'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

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
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		iosDevice.devices(function (err, devices) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			cache = {
				devices: JSON.parse(JSON.stringify(devices)),
				issues: []
			};

			emitter.emit('detected', cache);
			return callback(null, cache);
		});
	});
};

/**
 * Installs the specified app to an iOS device.
 *
 * @param {String} udid - The UDID of the device to install the app to or null if you want ioslib to pick one.
 * @param {String} appPath - The path to the iOS app to install after launching the iOS Simulator.
 * @param {String} appId - The app id of the app such as "com.domain.app".
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appName] - The name of the app. Defaults to the name of the last appPath segment.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all iOS simulators.
 * @param {Number} [options.timeout] - Number of milliseconds to wait before timing out.
 * @param {Function} [callback(err)] - A function to call when the simulator has launched.
 *
 * @emits module:device#app-quit
 * @emits module:device#app-started
 * @emits module:device#error
 * @emits module:device#installed
 * @emits module:device#log
 *
 * @returns {EventEmitter}
 */
function install(udid, appPath, appId, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!appPath) {
			var err = new Error(__('Missing app path argument'));
			emitter.emit('error', err);
			return callback(err);
		}

		if (!fs.existsSync(appPath)) {
			var err = new Error(__('App path does not exist: ' + appPath));
			emitter.emit('error', err);
			return callback(err);
		}

		var appName = options.appName || path.basename(appPath).replace(/\.app$/, ''),
			installedRegExp = new RegExp(' installd\\[.* Installing .*' + appId),
			logRegExp = new RegExp(' ' + appName + '\\[(\\d+)\\][^:]+: (.*)'),
			quitRegExp = new RegExp(' backboardd\\[[^:]+: Application .+\\:' + appId + '\\['),
			lastLineWasOurs = false,
			PUMPING_LOG = 1,
			INSTALLING = 2,
			INSTALLED = 3,
			RUNNING = 4,
			state = PUMPING_LOG,
			timer = null,
			logOff,
			trackOff = iosDevice.trackDevices(function (err, devices) {
				if (!devices.some(function (device) { return device.udid === udid; })) {
					trackOff && trackOff();
					logOff && logOff();
					if (state === RUNNING) {
						emitter.emit('app-quit');
					}
					emitter.emit('disconnect');
				}
			});

		try {
			logOff = iosDevice.log(udid, function (msg) {
				if (state == PUMPING_LOG) {
					// we create a timer here so that if we haven't received any messages for a
					// half second, then the log must be caught up and we're ready to install
					clearTimeout(timer);
					timer = setTimeout(function () {
						// logs quieted down, go ahead and install
						state = INSTALLING;
						iosDevice.installApp(udid, appPath, function (err) {
							if (err) {
								emitter.emit('error', err);
								trackOff && trackOff();
								logOff && logOff();
							} else {
								emitter.emit('installed');
							}
							return callback(err);
						});
					}, 500);
				} else if (state == INSTALLING) {
					// wait for the installd message
					var m = msg.match(installedRegExp);
					if (m) {
						// now the app is installed
						state = INSTALLED;
					}
				} else if (state == INSTALLED) {
					// wait for the app to be started
					var m = msg.match(logRegExp);
					if (m) {
						state = RUNNING;
						emitter.emit('app-started');
					}
				}

				if (state == RUNNING) {
					var m = msg.match(logRegExp);
					if (m) {
						emitter.emit('log', m[2]);
						lastLineWasOurs = true;
					} else if (/^\s/.test(msg) && lastLineWasOurs) {
						emitter.emit('log', msg.replace(/^\t/, ''));
					} else if (quitRegExp.test(msg)) {
						// they quit the app
						emitter.emit('app-quit');
					} else {
						// some other log line
						lastLineWasOurs = false;
					}
				}
			});
		} catch (ex) {
			// something blew up in the ios device library
			emitter.emit('error', ex.message || ex.toString());
		}
	});
};