/**
 * Detects VisualStudio installs and their Windows Phone SDKs.
 *
 * @module visualstudio
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

var cache,
	runningBuilds = {};

exports.detect = detect;
exports.build = build;

/**
 * Detects Visual Studio installations.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Visual Studio installations.
 * @param {String} [options.preferredVisualStudio] - The version of Visual Studio to use by default. Example: "13".
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} [options.supportedMSBuildVersions] - A string with a version number or range to check if a MSBuild version is supported.
 * @param {String} [options.supportedVisualStudioVersions] - A string with a version number or range to check if a Visual Studio install is supported.
 * @param {String} [options.supportedWindowsPhoneSDKVersions] - A string with a version number or range to check if a Windows Phone SDK is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Visual Studio information.
 *
 * @emits module:visualstudio#detected
 * @emits module:visualstudio#error
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
				selectedVisualStudio: null,
				visualstudio: null,
				issues: []
			},
			keyRegExp = /.+\\(\d+\.\d)_config$/i,
			possibleVersions = {},
			vsInfo = {};

		function finalize() {
			cache = results;
			emitter.emit('detected', results);
			callback(null, results);
		}

		async.each([
			'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\VisualStudio', // there should not be anything here because VS is currently 32-bit and we'll find it next
			'HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\Microsoft\\VisualStudio', // this is where VS should be found because it's 32-bit
			'HKEY_CURRENT_USER\\Software\\Microsoft\\VisualStudio', // should be the same as the one above, but just to be safe
			'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\VSWinExpress', // there should not be anything here because VS is currently 32-bit and we'll find it next
			'HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\Microsoft\\VSWinExpress', // this is where VS should be found because it's 32-bit
			'HKEY_CURRENT_USER\\Software\\Microsoft\\VSWinExpress' // should be the same as the one above, but just to be safe
			], function (keyPath, next) {
			appc.subprocess.run('reg', ['query', keyPath], function (code, out, err) {
				if (!code) {
					out.trim().split(/\r\n|\n/).forEach(function (configKey) {
						configKey = configKey.trim();
						var m = configKey.match(keyRegExp);
						if (m) {
							possibleVersions[configKey] = {
								version: m[1],
								configKey: configKey
							};
						}
					});
				}
				next();
			});
		}, function () {
			// if we didn't find any Visual Studios, then we're done
			if (!Object.keys(possibleVersions).length) {
				results.issues.push({
					id: 'WINDOWS_VISUAL_STUDIO_NOT_INSTALLED',
					type: 'error',
					message: __('Microsoft Visual Studio not found.') + '\n' +
						__('You will be unable to build Windows Phone or Windows Store apps.')
				});
				return finalize();
			}

			// fetch Visual Studio install information
			async.each(Object.keys(possibleVersions), function (configKey, next) {
				appc.subprocess.run('reg', ['query', configKey, '/v', '*'], function (code, out, err) {
					results.visualstudio || (results.visualstudio = {});

					var ver = possibleVersions[configKey].version,
						info = results.visualstudio[ver] = {
							version: ver,
							registryKey: configKey,
							supported: !options.supportedVisualStudioVersions || appc.version.satisfies(ver, options.supportedVisualStudioVersions, true),
							vcvarsall: null,
							msbuildVersion: null,
							wpsdk: null,
							selected: false
						};

					if (!code) {
						// get only the values we are interested in
						out.trim().split(/\r\n|\n/).forEach(function (line) {
							var parts = line.trim().split('   ').map(function (p) { return p.trim(); });
							if (parts.length == 3) {
								if (parts[0] == 'CLR Version') {
									info.clrVersion = parts[2];
								} else if (parts[0] == 'ShellFolder') {
									info.path = parts[2];
								}
							}
						});

						// verify that this Visual Studio actually exists
						if (info.path && fs.existsSync(info.path)) {
							// get the vcvarsall script
							var vcvarsall = path.join(info.path, 'VC', 'vcvarsall.bat');
							if (fs.existsSync(vcvarsall)) {
								info.vcvarsall = vcvarsall;
							}

							// detect all Windows Phone SDKs
							var wpsdkDir = path.join(info.path, 'VC', 'WPSDK');
							fs.existsSync(wpsdkDir) && fs.readdirSync(wpsdkDir).forEach(function (ver) {
								var vcvarsphone = path.join(wpsdkDir, ver, 'vcvarsphoneall.bat');
								if (fs.existsSync(vcvarsphone) && /^wp\d+$/i.test(ver)) {
									// we found a windows phone sdk!
									var name = (parseInt(ver.replace(/^wp/i, '')) / 10).toFixed(1);
									info.wpsdk || (info.wpsdk = {});
									info.wpsdk[name] = {
										vcvarsphone: vcvarsphone
									};
								}
							});
						}
					}

					if (info.vcvarsall) {
						appc.subprocess.getRealName(info.vcvarsall, function (err, vcvarsall) {
							if (!err) {
								info.vcvarsall = vcvarsall;
								// vcvarsall may contain space
								vcvarsall = vcvarsall.replace(/\ /g, '^ ');

								// now that we have vcvarsall, get the msbuild version
								appc.subprocess.run('cmd', [ '/C', vcvarsall + ' && MSBuild /version' ], function (code, out, err) {
									if (code) {
										results.issues.push({
											id: 'WINDOWS_MSBUILD_ERROR',
											type: 'error',
											message: __('Failed to run MSBuild.') + '\n' +
												__('This is most likely due to Visual Studio cannot find a suitable .NET framework.') + '\n' +
												__('Please install the latest .NET framework.')
										});
									} else {
										var chunks = out.trim().split(/\r\n\r\n|\n\n/);
										chunks.shift(); // strip off the first chunk

										var ver = info.msbuildVersion = chunks.shift().split(/\r\n|\n/).pop().trim();

										if (options.supportedMSBuildVersions && !appc.version.satisfies(ver, options.supportedMSBuildVersions)) {
											results.issues.push({
												id: 'WINDOWS_MSBUILD_TOO_OLD',
												type: 'error',
												message: __('The MSBuild version %s is too old.', ver) + '\n' +
													__("Titanium requires .NET MSBuild '%s'.", options.supportedMSBuildVersions) + '\n' +
													__('Please install the latest .NET framework.')
											});
										}
									}

									next();
								});
							} else {
								next();
							}
						});
					} else {
						next();
					}
				});
			}, function () {
				// double check if we didn't find any Visual Studios, then we're done
				if (!Object.keys(results.visualstudio).length) {
					results.issues.push({
						id: 'WINDOWS_VISUAL_STUDIO_NOT_INSTALLED',
						type: 'error',
						message: __('Microsoft Visual Studio not found.') + '\n' +
							__('You will be unable to build Windows Phone or Windows Store apps.')
					});
					return finalize();
				}

				var preferred = options.preferredVisualStudio;
				if (!results.visualstudio[preferred] || !results.visualstudio[preferred].supported) {
					preferred = Object.keys(results.visualstudio).filter(function (v) { return results.visualstudio[v].supported; }).sort().pop();
				}
				if (preferred) {
					results.visualstudio[preferred].selected = true;
					results.selectedVisualStudio = results.visualstudio[preferred];
				}

				finalize();
			});
		});
	});
};

/**
 * Builds a Visual Studio project.
 *
 * @param {Object} options - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Visual Studio installations.
 * @param {String} [options.buildConfiguration='Release'] - The type of configuration to build using. Example: "Release" or "Debug".
 * @param {String} [options.preferredVisualStudio] - The version of Visual Studio to use by default. Example: "13".
 * @param {String} [options.preferredWindowsPhoneSDK] - The preferred version of the Windows Phone SDK to use by default. Example "8.0".
 * @param {String} options.project - The path to the Visual Studio project to build.
 * @param {String} [options.supportedMSBuildVersions] - A string with a version number or range to check if a MSBuild version is supported.
 * @param {String} [options.supportedVisualStudioVersions] - A string with a version number or range to check if a Visual Studio install is supported.
 * @param {String} [options.supportedWindowsPhoneSDKVersions] - A string with a version number or range to check if a Windows Phone SDK is supported.
 * @param {Function} [callback(err, result)] - A function to call with the build output.
 *
 * @emits module:visualstudio#error
 * @emits module:visualstudio#success
 *
 * @returns {EventEmitter}
 */
function build(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		// validate project was specified
		if (typeof options.project !== 'string' || !options.project) {
			var ex = new Error(__('Missing required "%s" argument', 'options.project'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		// validate project exists
		if (!fs.existsSync(options.project)) {
			var err = new Error(__('Specified project does not exists: %s', options.project));
			emitter.emit('error', err);
			return callback(err);
		}

		detect(options, function (err, results) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var vsInfo = results.selectedVisualStudio;

			if (!vsInfo || !vsInfo.vcvarsall) {
				var e = new Error(__('Unable to find a supported Visual Studio installation'));
				emitter.emit('error', e);
				return callback(e);
			}

			// it's possible that this function could be called multiple times for the same
			// project such as when wptool.exe needs to be built and the master detect() is
			// running each module's detection code in parallel. so, we need to detect this
			// and create a queue of events to process after the build completes.
			if (runningBuilds[options.project]) {
				runningBuilds[options.project].push({
					emitter: emitter,
					callback: callback
				});
				return;
			}

			runningBuilds[options.project] = [ {
				emitter: emitter,
				callback: callback
			} ];

			appc.subprocess.run(vsInfo.vcvarsall.replace(/\ /g, '^ '), [
				'&&', 'MSBuild', '/t:rebuild', '/p:configuration=' + (options.buildConfiguration || 'Release'), options.project
			], function (code, out, err) {
				var queue = runningBuilds[options.project];
				delete runningBuilds[options.project];

				var result = {
					code: code,
					out: out,
					err: err
				};

				queue.forEach(function (p) {
					if (code) {
						var err = new Error(__('Failed to build project %s (code %s)', options.project, code));
						err.extendedError = result;
						p.emitter.emit('error', err);
						p.callback(err);
					} else {
						p.emitter.emit('success', result);
						p.callback(null, result);
					}
				});
			});
		});
	});
}
