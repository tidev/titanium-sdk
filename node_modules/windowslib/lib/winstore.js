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

var architectures = [ 'arm', 'x86', 'x64' ];

var detectCache,
	deviceCache = {};

exports.install = install;
exports.launch = launch;
exports.uninstall = uninstall;
exports.detect = detect;

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

			appc.subprocess.run(options.powershell || 'powershell', ['-ExecutionPolicy', 'Bypass', '-NoLogo', '-NoProfile', '-File', psScript, '-Force'], function (code, out, err) {
				if (!code) {
					emitter.emit('installed');
					return callback();
				}

				// I'm seeing "Please run this script without the -Force parameter" for Win 8.1 store apps.
				// This originally was "Please rerun the script without the -Force parameter" (for Win 8 hybrid apps?)
				// It's a hack to check for the common substring. Hopefully use of the exact error codes works better first
				// Error codes 9 and 14 mean rerun without -Force
				if ((code && (code == 9 || code == 14)) ||
					out.indexOf('script without the -Force parameter') !== -1) {
					appc.subprocess.run(options.powershell || 'powershell', ['-ExecutionPolicy', 'Bypass', '-NoLogo', '-NoProfile', '-File', psScript], function (code, out, err) {
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
		appc.subprocess.run(options.powershell || 'powershell', ['-command', 'Get-AppxPackage'], function (code, out, err) {
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
				appc.subprocess.run(options.powershell || 'powershell', ['-command', 'Remove-AppxPackage', packageName], function (code, out, err) {
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
			var args = ['launch', '--appid', appId];

			if (options.version) {
				args.push('--version');
				args.push(options.version);
			}

			if (options.windowsAppId) {
				args.push('--windowsAppId');
				args.push(options.windowsAppId);
			}

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

/**
 * Detects Windows Store SDKs.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the Windows SDKs.
 * @param {String} [options.preferredWindowsSDK] - The preferred version of the Windows SDK to use by default. Example "8.0".
 * @param {String} [options.supportedWindowsSDKVersions] - A string with a version number or range to check if a Windows SDK is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Windows SDK information.
 *
 * @emits module:windowsphone#detected
 * @emits module:windowsphone#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (detectCache && !options.bypassCache) {
			emitter.emit('detected', detectCache);
			return callback(null, detectCache);
		}

		var results = {
				windows: {},
				issues: []
			},
			searchPaths = [
				'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Microsoft SDKs\\Windows', // probably nothing here
				'HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\Microsoft\\Microsoft SDKs\\Windows' // this is most likely where Windows SDK will be found
			];

		function finalize() {
			detectCache = results;
			emitter.emit('detected', results);
			callback(null, results);
		}

		async.each(searchPaths, function (keyPath, next) {
			appc.subprocess.run('reg', ['query', keyPath], function (code, out, err) {
				var keyRegExp = /.+\\(v\d+\.\d)$/;
				if (!code) {
					out.trim().split(/\r\n|\n/).forEach(function (key) {
						key = key.trim();
						var m = key.match(keyRegExp);
						if (!m) {
							return;
						}
						var version = m[1].replace(/^v/, '');
						if (m) {
							results.windows || (results.windows = {});
							results.windows[version] = {
								version: version,
								registryKey: keyPath + '\\' + m[1],
								supported: !options.supportedWindowsSDKVersions || appc.version.satisfies(version, options.supportedWindowsSDKVersions, false), // no maybes
								path: null,
								signTool: null,
								makeCert: null,
								pvk2pfx: null,
								selected: false
							};
						}
					});
				}
				next();
			});
		}, function () {
			// check if we didn't find any Windows SDKs, then we're done
			if (!Object.keys(results.windows).length) {
				results.issues.push({
					id: 'WINDOWS_STORE_SDK_NOT_INSTALLED',
					type: 'error',
					message: __('Microsoft Windows Store SDK not found.') + '\n' +
					__('You will be unable to build Windows Store apps.')
				});
				return finalize();
			}

			// fetch Windows SDK install information
			async.each(Object.keys(results.windows), function (ver, next) {
				appc.subprocess.run('reg', ['query', results.windows[ver].registryKey, '/v', '*'], function (code, out, err) {
					if (code) {
						// bad key? either way, remove this version
						delete results.windows[ver];
					} else {
						// get only the values we are interested in
						out.trim().split(/\r\n|\n/).forEach(function (line) {
							var parts = line.trim().split('   ').map(function (p) { return p.trim(); });
							if (parts.length == 3) {
								if (parts[0] == 'InstallationFolder') {
									results.windows[ver].path = parts[2];
									
									function addIfExists(key, exe) {
										for (var i = 0; i < architectures.length; i++) {
											var arch = architectures[i],
												tool = path.join(parts[2], 'bin', arch, exe);
											if (fs.existsSync(tool)) {
												!results.windows[ver][key] && (results.windows[ver][key] = {});
												results.windows[ver][key][arch] = tool;
											}
										}
									}

									addIfExists('signTool', 'SignTool.exe');
									addIfExists('makeCert', 'MakeCert.exe');
									addIfExists('pvk2pfx', 'pvk2pfx.exe');
								}
							}
						});
					}
					next();
				});
			}, function () {
				// double check if we didn't find any Windows SDKs, then we're done
				if (Object.keys(results.windows).every(function (v) { return !results.windows[v].path; })) {
					results.issues.push({
						id: 'WINDOWS_STORE_SDK_NOT_INSTALLED',
						type: 'error',
						message: __('Microsoft Windows Store SDK not found.') + '\n' +
						__('You will be unable to build Windows Store apps.')
					});
					return finalize();
				}

				var preferred = options.preferred;
				if (!results.windows[preferred] || !results.windows[preferred].supported) {
					preferred = Object.keys(results.windows).filter(function (v) { return results.windows[v].supported; }).sort().pop();
				}
				if (preferred) {
					results.windows[preferred].selected = true;
				}

				finalize();
			});
		});
	});
}