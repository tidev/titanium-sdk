/**
 * An assortment of Windows Store app-related tools.
 *
 * @module winstore
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
	visualstudio = require('./visualstudio'),
	__ = appc.i18n(__dirname).__;

exports.install = install;
exports.launch = launch;
exports.uninstall = uninstall;

/**
 * Installs a Windows Store application.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.buildConfiguration='Release'] - The type of configuration to build using. Example: "Release" or "Debug".
 * @param {Function} [callback(err)] - A function to call after installing the Windows Store app.
 *
 * @emits module:winstore#error
 * @emits module:winstore#installed
 *
 * @returns {EventEmitter}
 */
function install(projectDir, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		var scripts = [],
			packageScript = 'Add-AppDevPackage.ps1';

		// find the Add-AppDevPackage.ps1
		(function walk(dir) {
			fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);
				if (fs.statSync(file).isDirectory()) {
					walk(file);
				} else if (name === packageScript && (!options.buildConfiguration || path.basename(dir).indexOf('_' + options.buildConfiguration) !== -1)) {
					scripts.push(file);
				}
			});
		}(projectDir));

		if (!scripts.length) {
			var err = new Error(__('Unable to find built application. Please rebuild the project.'));
			emitter.emit('error', err);
			return callback(err);
		}

		// let's grab the first match
		appc.subprocess.getRealName(scripts[0], function (err, psScript) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			appc.subprocess.run(options.powershell || 'powershell', [ '-command', psScript + ' -Force' ], function (code, out, err) {
				if (!code) {
					emitter.emit('installed');
					return callback();
				}

				if (out.indexOf('Please rerun the script without the -Force parameter') !== -1) {
					appc.subprocess.run(options.powershell || 'powershell', [ '-command', psScript ], function (code, out, err) {
						if (err) {
							emitter.emit('error', err);
							callback(err);
						} else {
							emitter.emit('installed');
							callback();
						}
					});
					return;
				}

				// must have been some other issue, error out
				var ex = new Error(__('Failed to install app: %s', out));
				emitter.emit('error', ex);
				callback(ex);
			});
		});
	});
}

/**
 * Uninstalls a Windows Store application.
 *
 * @param {String} appId - The application id.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell='powershell'] - Path to the 'powershell' executable.
 * @param {Function} [callback(err)] - A function to call after uninstalling the Windows Store app.
 *
 * @emits module:winstore#error
 * @emits module:winstore#uninstalled
 *
 * @returns {EventEmitter}
 */
function uninstall(appId, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		appc.subprocess.run(options.powershell || 'powershell', [ '-command', 'Get-AppxPackage' ], function (code, out, err) {
			if (code) {
				var ex = new Error(__('Could not query the list of installed Windows Store apps: %s', err || code));
				emitter.emit('error', ex);
				return callback(ex);
			}

			var packageNameRegExp = new RegExp('PackageFullName[\\s]*:[\\s]*(' + appId + '.*)'),
				packageName;

			out.split(/\r\n|\n/).some(function (line) {
				var m = line.trim().match(packageNameRegExp);
				if (m) {
					packageName = m[1];
					return true;
				}
			});

			if (packageName) {
				appc.subprocess.run(options.powershell || 'powershell', [ '-command', 'Remove-AppxPackage', packageName ], function (code, out, err) {
					if (err) {
						emitter.emit('error', err);
						callback(err);
					} else {
						emitter.emit('uninstalled');
						callback();
					}
				});
			} else {
				emitter.emit('uninstalled');
				callback();
			}
		});
	});
}

/**
 * Launches a Windows Store application.
 *
 * @param {String} appId - The application id.
 * @param {String} version - The application version.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell='powershell'] - Path to the 'powershell' executable.
 * @param {String} [options.version] - The specific version of the app to launch. If empty, picks the largest version.
 * @param {Function} [callback(err)] - A function to call after uninstalling the Windows Store app.
 *
 * @emits module:winstore#error
 * @emits module:winstore#launched
 *
 * @returns {EventEmitter}
 */
function launch(appId, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		var wstool = path.resolve(__dirname, '..', 'bin', 'wstool.exe');

		function runTool() {
			var args = [ 'launch', appId ];

			options.version && args.push(options.version);

			appc.subprocess.run(wstool, args, function (code, out, err) {
				if (code) {
					var ex = new Error(__('Erroring running wstool (code %s)', code) + '\n' + out);
					emitter.emit('error', ex);
					callback(ex);
				} else {
					emitter.emit('installed');
					callback();
				}
			});
		}

		if (fs.existsSync(wstool)) {
			runTool();
		} else {
			visualstudio.build(appc.util.mix({
				buildConfiguration: 'Release',
				project: path.resolve(__dirname, '..', 'wstool', 'wstool.csproj')
			}, options), function (err, result) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}

				var src = path.resolve(__dirname, '..', 'wstool', 'bin', 'Release', 'wstool.exe');
				if (!fs.existsSync(src)) {
					var ex = new Error(__('Failed to build the wstool executable.') + (result ? '\n' + result.out : ''));
					emitter.emit('error', ex);
					return callback(ex);
				}

				// sanity check that the wstool.exe wasn't copied by another async task in windowslib
				if (!fs.existsSync(wstool)) {
					fs.writeFileSync(wstool, fs.readFileSync(src));
				}

				runTool();
			});
		}
	});
}
