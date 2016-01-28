/**
 * Detects the Windows Phone SDKs.
 *
 * @module windowsphone
 *
 * @copyright
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	fs = require('fs'),
	magik = require('./utilities').magik,
	mix = require('./utilities').mix,
	path = require('path'),
	__ = appc.i18n(__dirname).__;

var detectCache,
	deviceCache = {};

exports.detect = detect;

/**
 * Detects Windows Phone SDKs 8.0/8.1.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the Windows Phone SDKs.
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} [options.supportedWindowsPhoneSDKVersions] - A string with a version number or range to check if a Windows Phone SDK is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Windows Phone SDK information.
 */
function detectLegacy(options, callback) {
	var results = {
			windowsphone: {},
			issues: []
		},
		searchPaths = [
			'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Microsoft SDKs\\WindowsPhone', // probably nothing here
			'HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\Microsoft\\Microsoft SDKs\\WindowsPhone' // this is most likely where WPSDK will be found
		];

	async.each(searchPaths, function (keyPath, next) {
		appc.subprocess.run('reg', ['query', keyPath], function (code, out, err) {
			var keyRegExp = /.+\\(v\d+\.\d)$/;
			if (!code) {
				out.trim().split(/\r\n|\n/).forEach(function (key) {
					key = key.trim();
					var m = key.match(keyRegExp),
						version = m[1].replace(/^v/, '');
					if (m) {
						results.windowsphone || (results.windowsphone = {});
						results.windowsphone[version] = {
							version: version,
							registryKey: keyPath + '\\' + m[1],
							supported: !options.supportedWindowsPhoneSDKVersions || appc.version.satisfies(version, options.supportedWindowsPhoneSDKVersions, false), // no maybes
							path: null,
							deployCmd: null,
							xapSignTool: null,
							selected: false
						};
					}
				});
			}
			next();
		});
	}, function () {
		// check if we didn't find any Windows Phone SDKs, then we're done
		if (!Object.keys(results.windowsphone).length) {
			return callback(null, results);
		}

		// fetch Windows Phone SDK install information
		async.each(Object.keys(results.windowsphone), function (ver, next) {
			appc.subprocess.run('reg', ['query', results.windowsphone[ver].registryKey + '\\Install Path', '/v', '*'], function (code, out, err) {
				if (code) {
					// bad key? either way, remove this version
					delete results.windowsphone[ver];
				} else {
					// get only the values we are interested in
					out.trim().split(/\r\n|\n/).forEach(function (line) {
						var parts = line.trim().split('   ').map(function (p) { return p.trim(); });
						if (parts.length == 3) {
							if (parts[0] == 'Install Path') {
								results.windowsphone[ver].path = parts[2];

								var deployCmd = path.join(parts[2], 'Tools', 'XAP Deployment', 'XapDeployCmd.exe');
								// check the old WP8 location
								if (fs.existsSync(deployCmd)) {
									results.windowsphone[ver].deployCmd = deployCmd;
								// check the new WP8.1 location
								} else if (fs.existsSync(deployCmd = path.join(parts[2], 'Tools', 'AppDeploy', 'AppDeployCmd.exe'))) {
									results.windowsphone[ver].deployCmd = deployCmd;
								} else {
									// no deploy command! For now, mark unsupported!
									results.windowsphone[ver].supported = false;
								}

								var xapSignTool = path.join(parts[2], 'Tools', 'XapSignTool', 'XapSignTool.exe');
								if (fs.existsSync(xapSignTool)) {
									results.windowsphone[ver].xapSignTool = xapSignTool;
								}
							}
						}
					});
				}
				next();
			});
		}, function () {
			callback(null, results);
		});
	});
};

/**
 * Detects Windows 10 SDK.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the Windows Phone SDKs.
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} [options.supportedWindowsPhoneSDKVersions] - A string with a version number or range to check if a Windows Phone SDK is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Windows Phone SDK information.
 */
function detectWin10(options, callback) {
	var results = {
			windowsphone: {},
			issues: []
		},
		win10SearchPaths = [
			'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Microsoft SDKs\\Windows\\v10.0', // probably nothing here
			'HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\Microsoft\\Microsoft SDKs\\Windows\\v10.0' // this is most likely where Windows SDK will be found
		];

	async.each(win10SearchPaths, function (keyPath, next) {
		appc.subprocess.run('reg', ['query', keyPath], function (code, out, err) {
			if (!code) {
				var version = '10.0';
				// get only the values we are interested in
				out.trim().split(/\r\n|\n/).forEach(function (line) {
					var parts = line.trim().split('   ').map(function (p) { return p.trim(); });
					if (parts.length == 3) {
						if (parts[0] == 'InstallationFolder') {
							results.windowsphone || (results.windowsphone = {});
							results.windowsphone[version] = {
								version: version,
								registryKey: keyPath,
								supported: !options.supportedWindowsPhoneSDKVersions || appc.version.satisfies(version, options.supportedWindowsPhoneSDKVersions, false), // no maybes
								path: parts[2],
								deployCmd: null,
								xapSignTool: null,
								selected: false
							};

							var deployCmd = path.join(parts[2], 'bin', 'x86', 'WinAppDeployCmd.exe'),
								signTool = path.join(parts[2], 'bin', 'x86', 'signtool.exe');
							if (fs.existsSync(deployCmd)) {
								results.windowsphone[version].deployCmd = deployCmd;
							}
							if (fs.existsSync(signTool)) {
								results.windowsphone[version].xapSignTool = signTool;
							}
						}
					}
				});
			}
			next();
		});
	}, function () {
		callback(null, results);
	});
};

/**
 * Detects Windows Phone SDKs.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the Windows Phone SDKs.
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} [options.supportedWindowsPhoneSDKVersions] - A string with a version number or range to check if a Windows Phone SDK is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Windows Phone SDK information.
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
				windowsphone: {},
				issues: []
			};

		function finalize() {
			detectCache = results;
			emitter.emit('detected', results);
			callback(null, results);
		}

		// Detect 8.0/8.1 and 10.0 in parallel
		async.parallel([
				function (next) {
					detectLegacy(options, next);
				},
				function (next) {
					detectWin10(options, next);
				}
			], function (err, detectResults) {
				// combine the results objects from 8.0/8.1 and 10.0!
				mix(detectResults[0], results);
				mix(detectResults[1], results);

				// double check if we didn't find any Windows Phone SDKs, then we're done
				if (Object.keys(results.windowsphone).every(function (v) { return !results.windowsphone[v].path; })) {
					results.issues.push({
						id: 'WINDOWS_PHONE_SDK_NOT_INSTALLED',
						type: 'error',
						message: __('Microsoft Windows Phone SDK not found.') + '\n' +
							__('You will be unable to build Windows Phone apps.')
					});
					return finalize();
				}

				if (Object.keys(results.windowsphone).every(function (v) { return !results.windowsphone[v].deployCmd; })) {
					results.issues.push({
						id: 'WINDOWS_PHONE_SDK_MISSING_DEPLOY_CMD',
						type: 'error',
						message: __('Microsoft Windows Phone SDK is missing the deploy command.') + '\n' +
							__('You will be unable to build Windows Phone apps.')
					});
					return finalize();
				}

				var preferred = options.preferred;
				if (!results.windowsphone[preferred] || !results.windowsphone[preferred].supported) {
					preferred = Object.keys(results.windowsphone).filter(function (v) { return results.windowsphone[v].supported; }).sort().pop();
				}
				if (preferred) {
					results.windowsphone[preferred].selected = true;
				}

				finalize();
			}
		);
	});
};
