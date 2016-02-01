/**
 * Main namespace for the windowslib.
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc         = require('node-appc'),
	async        = require('async'),
	EventEmitter = require('events').EventEmitter,
	magik        = require('./lib/utilities').magik,
	mix          = require('./lib/utilities').mix,
	__           = appc.i18n(__dirname).__,

	packageJson  = require('./package.json'),

	assemblies   = exports.assemblies   = require('./lib/assemblies'),
	device       = exports.device       = require('./lib/device'),
	emulator     = exports.emulator     = require('./lib/emulator'),
	env          = exports.env          = require('./lib/env'),
	windowsphone = exports.windowsphone = require('./lib/windowsphone'),
	wptool       = exports.wptool       = require('./lib/wptool'),
	winstore     = exports.winstore     = require('./lib/winstore'),
	visualstudio = exports.visualstudio = require('./lib/visualstudio');

var cache;

exports.certs    = require('./lib/certs');
exports.detect   = detect;
exports.install  = install;
exports.LogRelay = require('./lib/logrelay');
exports.process  = require('./lib/process');
exports.version  = packageJson.version;

/**
 * Detects the entire Windows phone environment information.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the all Windows phone information.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {String} [options.powershell] - Path to the <code>powershell</code> executable.
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} [options.preferredVisualStudio] - The preferred version of Visual Studio to use by default. Example: "13".
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
 * @param {String} [options.supportedMSBuildVersions] - A string with a version number or range to check if a MSBuild version is supported.
 * @param {String} [options.supportedVisualStudioVersions] - A string with a version number or range to check if a Visual Studio install is supported.
 * @param {Function} [callback(err, info)] - A function to call when all detection tasks have completed.
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		var results = {
			detectVersion: '3.0',
			issues: []
		};

		async.each([env, visualstudio, windowsphone, assemblies, device, winstore, emulator], function (lib, next) {
			lib.detect(options, function (err, result) {
				err || mix(result, results);
				next(err);
			});
		}, function (err) {
			if (err) {
				emitter.emit('error', err);
				callback(err);
			} else {
				cache = results;
				emitter.emit('detected', results);
				callback(null, results);
			}
		});
	});
}

/**
 * Installs the specified app to an Windows Phone emulator. If the emulator is not running, it will launch it.
 *
 * @param {String} udid - The UDID of the emulator to install the app to or null if you want windowslib to pick one.
 * @param {String} appPath - The path to the Windows Phone app to install.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the environment configuration.
 * @param {Number} [options.timeout] - Number of milliseconds to wait before timing out.
 * @param {Function} [callback(err)] - A function to call when the simulator has launched.
 *
 * ?????????????????????????????????????????????????????????????????? @emits module:windowslib#app-quit
 * ?????????????????????????????????????????????????????????????????? @emits module:windowslib#app-started
 * @emits module:windowslib#error
 * @emits module:windowslib#installed
 * ?????????????????????????????????????????????????????????????????? @emits module:windowslib#log
 *
 * @returns {EventEmitter}
 */
function install(udid, appPath, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		detect(options, function (err, results) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}
			var type;

			// determine if this is a device or emulator udid
			if (results.devices.some(function (d) { return d.udid === udid; })) {
				// it's a device!
				type = device;
			} else {
				Object.keys(results.emulators).some(function (wpsdk) {
					return results.emulators[wpsdk].some(function (e) {
						if (e.udid === udid) {
							type = emulator;
							return true;
						}
					});
				});
			}

			if (!type) {
				// oh no
				var ex = new Error(__('Invalid device id: %s', udid));
				emitter.emit('error', ex);
				return callback(ex);
			}

			var installEmitter = type.install(udid, appPath, options, callback),
				originalEmitter = installEmitter.emit;

			// make sure we have at least one 'error' handler to keep longjohn from complaining
			installEmitter.on('error', function () {});

			installEmitter.emit = function () {
				originalEmitter.apply(installEmitter, arguments);
				emitter.emit.apply(emitter, arguments);
			};
		});
	});
}
