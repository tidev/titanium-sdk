/**
 * Detects the iOS development environment.
 *
 * @module env
 *
 * @copyright
 * Copyright (c) 2014-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	magik = require('./utilities').magik,
	__ = appc.i18n(__dirname).__;

var cache = null;

/**
 * Fired when the developer profiles have been updated.
 * @event module:env#detected
 * @type {Object}
 */

/**
 * Fired when there was an error retreiving the provisioning profiles.
 * @event module:env#error
 * @type {Error}
 */

/**
 * Detects the iOS development enviroment dependencies.
 *
 * @param {Object} [options] - An object containing various settings
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the development environment dependencies
 * @param {String} [options.security] - Path to the <code>security</code> executable
 * @param {String} [options.xcodeSelect] - Path to the <code>xcode-select</code> executable
 * @param {Function} [callback(err, results)] - A function to call with the development environment information
 *
 * @emits module:env#detected
 * @emits module:env#error
 *
 * @returns {Handle}
 */
exports.detect = function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			return callback(null, cache);
		}

		var results = {
			executables: {
				xcodeSelect: null,
				security: null
			},
			issues: []
		};

		async.parallel({
			security: function (next) {
				appc.subprocess.findExecutable([options.security, '/usr/bin/security', 'security'], function (err, result) {
					if (err) {
						results.issues.push({
							id: 'IOS_SECURITY_EXECUTABLE_NOT_FOUND',
							type: 'error',
							message: __("Unable to find the 'security' executable.") + '\n'
								+ __('Please verify your system path.') + '\n'
								+ __("This program is distributed with macOS and if it's missing, you'll have to restore it from a backup or another computer, or reinstall macOS.")
						});
					} else {
						results.executables.security = result;
					}
					next();
				});
			},

			xcodeSelect: function (next) {
				appc.subprocess.findExecutable([options.xcodeSelect, '/usr/bin/xcode-select', 'xcode-select'], function (err, result) {
					if (err) {
						results.issues.push({
							id: 'IOS_XCODE_SELECT_EXECUTABLE_NOT_FOUND',
							type: 'error',
							message: __("Unable to find the 'xcode-select' executable.") + '\n'
								+ __('Perhaps Xcode is not installed, your Xcode installation is corrupt, or your system path is incomplete.')
						});
					} else {
						results.executables.xcodeSelect = result;
					}
					next();
				});
			}
		}, function () {
			cache = results;
			emitter.emit('detected', results);
			callback(null, results);
		});
	});
};
