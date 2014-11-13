/**
 * Detects general Windows environment information such as PowerShell permissions.
 *
 * @module env
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
	fs = require('fs'),
	magik = require('./utilities').magik,
	path = require('path'),
	__ = appc.i18n(__dirname).__;

var cache;

exports.detect = detect;

/**
 * Detects general Windows environment information such as PowerShell permissions.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects Windows environment information.
 * @param {String} [options.powershell] - Path to the <code>powershell</code> executable.
 * @param {Function} [callback(err, results)] - A function to call with the Windows environment information.
 *
 * @emits module:env#detected
 * @emits module:env#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		var results = cache = {
			os: {
				name: null,
				version: null
			},
			powershell: {
				enabled: null
			},
			issues: []
		};

		async.series([
			function osInfo(next) {
				appc.subprocess.run('wmic', ['os', 'get', 'Caption,Version'], function (code, out, err) {
					if (code) return next(code);

					var s = out.split('\n')[1].split(/ {2,}/);
					s.length > 0 && (results.os.name = s[0].trim());
					s.length > 1 && (results.os.version = s[1].trim());

					next();
				});
			},

			function powershell(next) {
				if (!results.os.version) return next();

				if (appc.version.lt(results.os.version, '6.2.0')) {
					results.issues.push({
						id: 'WINDOWS_STORE_APPS_NOT_SUPPORTED',
						type: 'warning',
						message: __('Windows Store apps are not supported on this version of Windows.') + '\n' +
							__('You must use Windows 8 or newer to create Windows Store apps.')
					});
					return next();
				}

				appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'test_permissions.ps1'), function (err, psScript) {
					if (err) {
						return next(err);
					}

					appc.subprocess.run(options.powershell || 'powershell', [
						'-command', psScript
					], function (code, out, err) {
						if (!code && /success/i.test(out.trim().split('\n').shift())) {
							results.powershell.enabled = true;
						} else {
							results.powershell.enabled = false;
							results.issues.push({
								id: 'WINDOWS_POWERSHELL_SCRIPTS_DISABLED',
								type: 'error',
								message: __('Executing PowerShell scripts is disabled.') + '\n' +
									__('In order to build Windows Hybrid apps for the Windows Store (winstore), you must change the execution policy to allow PowerShell scripts.') + '\n' +
									__('To enable PowerShell scripts, search __PowerShell__ in the __Start__ menu, right click the icon, select __Run as administrator__, then run:') + '\n' +
									'    __Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser__'
							});
						}
						next();
					});
				});
			}
		], function (err) {
			if (err) {
				emitter.emit('error', err);
				callback(err);
			} else {
				emitter.emit('detected', results);
				callback(null, results);
			}
		});
	});
};
