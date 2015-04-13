/**
 * Detects Xcode installs and their iOS SDKs.
 *
 * @module xcode
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 * {@link https://github.com/digitalbazaar/forge}
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	env = require('./env'),
	EventEmitter = require('events').EventEmitter,
	fs = require('fs'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

var cache;

/**
 * Detects Xcode installations.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Xcode installations.
 * @param {String|Array<String>} [options.searchPath] - One or more path to scan for Xcode installations.
 * @param {String} [options.minIosVersion] - The minimum iOS SDK to detect.
 * @param {String} [options.supportedVersions] - A string with a version number or range to check if an Xcode install is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Xcode information.
 *
 * @emits module:xcode#detected
 * @emits module:xcode#error
 *
 * @returns {EventEmitter}
 */
exports.detect = function detect(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	var emitter = new EventEmitter;

	if (process.platform !== 'darwin') {
		process.nextTick(function () {
			var err = new Error(__('Unsupported platform "%s"', process.platform));
			emitter.emit('error', err);
			callback(err);
		});
		return emitter;
	}

	if (cache && !options.bypassCache) {
		process.nextTick(function () {
			emitter.emit('detected', cache);
			callback(null, cache);
		});
		return emitter;
	}

	var searchPaths = {
			'/Applications': 1,
			'~/Applications': 1
		},
		results = {
			selectedXcode: null,
			xcode: {},
			issues: []
		},
		selectedXcodePath = null;

	async.series([
		// build the list of searchPaths
		function (next) {
			env.detect(options, function (err, env) {
				(Array.isArray(options.searchPath) ? options.searchPath : [ options.searchPath ]).forEach(function (p) {
					p && (searchPaths[p] = 1);
				});

				// resolve each of the paths
				Object.keys(searchPaths).forEach(function (p) {
					delete searchPaths[p];
					searchPaths[appc.fs.resolvePath(p)] = 1;
				});

				if (err || !env.executables.xcodeSelect) {
					return next();
				}

				appc.subprocess.run(env.executables.xcodeSelect, '--print-path', function (code, out, err) {
					if (!err) {
						searchPaths[selectedXcodePath = out.trim()] = 1;
					}
					next();
				});
			});
		}
	], function () {
		// scan all searchPaths for Xcode installs
		var xcodes = [],
			sdkRegExp = /^iPhone(OS|Simulator)(.+)\.sdk$/;

		// scan search paths for Xcodes
		Object.keys(searchPaths).forEach(function (p) {
			if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
				// is this directory an Xcode dev dir?
				if (/\/Contents\/Developer\/?$/.test(p) && fs.existsSync(path.join(p, 'usr', 'bin', 'xcodebuild')) && xcodes.indexOf(p) === -1) {
					xcodes.push(p)
				} else {
					// is it the Xcode dir?
					var devDir = path.join(p, 'Contents', 'Developer');
					if (fs.existsSync(path.join(devDir, 'usr', 'bin', 'xcodebuild')) && xcodes.indexOf(devDir) === -1) {
						xcodes.push(devDir);
					} else {
						// possibly a parent folder, scan for Xcodes
						fs.readdirSync(p).forEach(function (name) {
							var dir = path.join(p, name, 'Contents', 'Developer');
							if (xcodes.indexOf(dir) === -1 && fs.existsSync(path.join(dir, 'usr', 'bin', 'xcodebuild'))) {
								xcodes.push(dir);
							}
						});
					}
				}
			}
		});

		function findIosSdks(dir) {
			var vers = [];
			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);
				if (!fs.existsSync(file) || !fs.statSync(file).isDirectory()) return;
				var m = name.match(sdkRegExp);
				if (m && (!options.minIosVersion || appc.version.gte(m[2], options.minIosVersion))) {
					var ver = m[2];
					file = path.join(file, 'System', 'Library', 'CoreServices', 'SystemVersion.plist');
					if (fs.existsSync(file)) {
						var p = new appc.plist(file);
						if (p.ProductVersion) {
							ver = p.ProductVersion;
						}
					}
					vers.push(ver);
				}
			});
			return vers.sort().reverse();
		}

		function findIosSimSdks(dir, xcodeVer) {
			var vers = findIosSdks(dir),
				simRuntimesDir = '/Library/Developer/CoreSimulator/Profiles/Runtimes';

			if (fs.existsSync(simRuntimesDir) && appc.version.gte(xcodeVer, '6.2')) {
				fs.readdirSync(simRuntimesDir).forEach(function (name) {
					var file = path.join(simRuntimesDir, name);
					if (!fs.existsSync(file) || !fs.statSync(file).isDirectory()) return;

					var m = name.match(/^iOS (.+)\.simruntime$/);
					if (m && (!options.minIosVersion || appc.version.gte(m[1], options.minIosVersion))) {
						var ver = m[1];
						file = path.join(file, 'Contents', 'Resources', 'RuntimeRoot', 'System', 'Library', 'CoreServices', 'SystemVersion.plist');
						if (fs.existsSync(file)) {
							var p = new appc.plist(file);
							if (p.ProductVersion) {
								ver = p.ProductVersion;
							}
						}
						vers.push(ver);
					}
				});
			}

			return vers.sort().reverse();
		}

		xcodes.forEach(function (dir) {
			var p = new appc.plist(path.join(path.dirname(dir), 'version.plist')),
				selected = dir == selectedXcodePath,
				supported = options.supportedVersions ? appc.version.satisfies(p.CFBundleShortVersionString, options.supportedVersions, true) : true,
				ver = p.CFBundleShortVersionString + ':' + p.ProductBuildVersion,
				f;

			if (!results.xcode[ver] || selected || dir <= results.xcode[ver].path) {
				results.xcode[ver] = {
					xcodeapp: dir.replace(/\/Contents\/Developer\/?$/, ''),
					path: dir,
					selected: selected,
					version: p.CFBundleShortVersionString,
					build: p.ProductBuildVersion,
					supported: supported,
					sdks: findIosSdks(path.join(dir, 'Platforms', 'iPhoneOS.platform', 'Developer', 'SDKs')),
					sims: findIosSimSdks(path.join(dir, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'SDKs'), p.CFBundleShortVersionString),
					executables: {
						xcodebuild: fs.existsSync(f = path.join(dir, 'usr', 'bin', 'xcodebuild')) ? f : null,
						clang:      fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'clang')) ? f : null,
						clang_xx:   fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'clang++')) ? f : null,
						libtool:    fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'libtool')) ? f : null,
						lipo:       fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'lipo')) ? f : null,
						otool:      fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'otool')) ? f : null
					}
				};

				selected && (results.selectedXcode = results.xcode[ver]);

				if (supported === false) {
					results.issues.push({
						id: 'IOS_XCODE_TOO_OLD',
						type: 'warning',
						message: __('Xcode %s is too old and is no longer supported.', '__' + p.CFBundleShortVersionString + '__') + '\n' +
							__('The minimum supported Xcode version is Xcode %s.', appc.version.parseMin(options.supportedVersions)),
						xcodeVer: p.CFBundleShortVersionString,
						minSupportedVer: appc.version.parseMin(options.supportedVersions)
					});
				} else if (supported === 'maybe') {
					results.issues.push({
						id: 'IOS_XCODE_TOO_NEW',
						type: 'warning',
						message: __('Xcode %s may or may not work as expected.', '__' + p.CFBundleShortVersionString + '__') + '\n' +
							__('The maximum supported Xcode version is Xcode %s.', appc.version.parseMax(options.supportedVersions, true)),
						xcodeVer: p.CFBundleShortVersionString,
						maxSupportedVer: appc.version.parseMax(options.supportedVersions, true)
					});
				}
			}
		});

		if (Object.keys(results.xcode).length) {
			var validXcodes = 0,
				sdkCounter = 0,
				simCounter = 0;

			Object.keys(results.xcode).forEach(function (x) {
				if (results.xcode[x].supported) {
					// we're counting maybe's as valid
					validXcodes++;
				}
				if (results.xcode[x].sdks) {
					sdkCounter += results.xcode[x].sdks.length;
				}
				if (results.xcode[x].sims) {
					simCounter += results.xcode[x].sims.length;
				}
			});

			if (options.supportedVersions && !validXcodes) {
				results.issues.push({
					id: 'IOS_NO_SUPPORTED_XCODE_FOUND',
					type: 'warning',
					message: __('There are no supported Xcode installations found.')
				});
			}

			if (!sdkCounter) {
				results.issues.push({
					id: 'IOS_NO_IOS_SDKS',
					type: 'error',
					message: __('There are no iOS SDKs found') + '\n' +
						__('Launch Xcode and download the mobile support packages.')
				});
			}

			if (!sdkCounter) {
				results.issues.push({
					id: 'IOS_NO_IOS_SIMS',
					type: 'error',
					message: __('There are no iOS Simulators found') + '\n' +
						__('You can install them from the Xcode Preferences > Downloads tab.')
				});
			}
		} else {
			results.issues.push({
				id: 'IOS_XCODE_NOT_INSTALLED',
				type: 'error',
				message: __('No Xcode installations found.') + '\n' +
					__('You can download it from the %s or from %s.', '__App Store__', '__https://developer.apple.com/xcode/__')
			});
		}

		cache = results;
		emitter.emit('detected', results);
		callback(null, results);
	});

	return emitter;
};