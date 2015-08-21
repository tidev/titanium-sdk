/**
 * Detects Xcode installs and their iOS SDKs.
 *
 * @module xcode
 *
 * @copyright
 * Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved.
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
	hash = require('./utilities').hash,
	magik = require('./utilities').magik,
	fs = require('fs'),
	path = require('path'),
	readPlist = require('./utilities').readPlist,
	sqlite3 = require('sqlite3'),
	__ = appc.i18n(__dirname).__;

var cache,
	detecting = {},
	waiting = [];

/**
 * Detects Xcode installations.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Xcode installations.
 * @param {String|Array<String>} [options.searchPath] - One or more path to scan for Xcode installations.
 * @param {String} [options.minIosVersion] - The minimum iOS SDK to detect.
 * @param {String} [options.minWatchosVersion] - The minimum WatchOS SDK to detect.
 * @param {String} [options.supportedVersions] - A string with a version number or range to check if an Xcode install is supported.
 * @param {Function} [callback(err, results)] - A function to call with the Xcode information.
 *
 * @emits module:xcode#detected
 * @emits module:xcode#error
 *
 * @returns {EventEmitter}
 */
exports.detect = function detect(options, callback) {
	var hopt = hash(JSON.stringify(options));
	if (detecting[hopt]) {
		waiting.push(callback);
		return detecting[hopt];
	}

	return detecting[hopt] = magik(options, callback, function (emitter, options, callback) {
		waiting.push(callback);

		function fireCallbacks(err, result) {
			delete detecting[hopt];
			var w;
			while (w = waiting.shift()) {
				w(err, result);
			}
		}

		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return fireCallbacks(null, cache);
		}

		function findSimRuntimes(dir) {
			var runtimes = {};
			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
				var x = path.join(dir, name, 'Contents', 'Info.plist');
				var plist = readPlist(path.join(dir, name, 'Contents', 'Info.plist'));
				if (plist) {
					var runtime = runtimes[plist.CFBundleIdentifier] = {
						name: plist.CFBundleName,
						version: null
					};

					plist = readPlist(path.join(dir, name, 'Contents', 'Resources', 'profile.plist'));
					if (plist) {
						runtime.version = plist.defaultVersionString;
					}
				}
			});
			return runtimes;
		}

		function findSDKs(dir, nameRegExp, minVersion) {
			var vers = [];

			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);
				if (!fs.existsSync(file) || !fs.statSync(file).isDirectory()) return;
				var m = name.match(nameRegExp);
				if (m && (!minVersion || appc.version.gte(m[1], minVersion))) {
					var ver = m[1];
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

		function findIosSims(dir, xcodeVer) {
			var vers = findSDKs(dir, /^iPhoneSimulator(.+)\.sdk$/),
				simRuntimesDir = '/Library/Developer/CoreSimulator/Profiles/Runtimes';

			// for Xcode >=6.2 <7.0, the simulators are in a global directory
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
						if (vers.indexOf(ver) === -1) {
							vers.push(ver);
						}
					}
				});
			}

			return vers.sort().reverse();
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
			selectedXcodePath = null,
			globalSimRuntimes = findSimRuntimes('/Library/Developer/CoreSimulator/Profiles/Runtimes'),
			xcodes = [];

		// since we do not support Xcode 5 and below, weed them out
		options.supportedVersions = (options.supportedVersions ? options.supportedVersions + '||' : '') + '>=6.0.0';

		async.series([
			// build the list of searchPaths
			function detectOSXenv(next) {
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
			},

			function findXcodes(next) {
				// scan all searchPaths for Xcode installs
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
				next();
			},

			function loadXcodeInfo(next) {
				xcodes.forEach(function (dir) {
					var p = new appc.plist(path.join(path.dirname(dir), 'version.plist')),
						selected = dir == selectedXcodePath,
						supported = options.supportedVersions ? appc.version.satisfies(p.CFBundleShortVersionString, options.supportedVersions, true) : true,
						ver = p.CFBundleShortVersionString + ':' + p.ProductBuildVersion,
						f;

					if (!results.xcode[ver] || selected || dir <= results.xcode[ver].path) {
						var watchos = null;
						if (appc.version.gte(p.CFBundleShortVersionString, '7.0')) {
							watchos = {
								sdks: findSDKs(path.join(dir, 'Platforms', 'WatchOS.platform', 'Developer', 'SDKs'), /^WatchOS(.+)\.sdk$/, options.minWatchosVersion),
								sims: findSDKs(path.join(dir, 'Platforms', 'WatchSimulator.platform', 'Developer', 'SDKs'), /^WatchSimulator(.+)\.sdk$/, options.minWatchosVersion)
							};
						} else if (appc.version.gte(p.CFBundleShortVersionString, '6.2')) {
							watchos = {
								sdks: ['1.0'],
								sims: ['1.0']
							};
						}

						var xc = results.xcode[ver] = {
							xcodeapp:       dir.replace(/\/Contents\/Developer\/?$/, ''),
							path:           dir,
							selected:       selected,
							version:        p.CFBundleShortVersionString,
							build:          p.ProductBuildVersion,
							supported:      supported,
							sdks:           findSDKs(path.join(dir, 'Platforms', 'iPhoneOS.platform', 'Developer', 'SDKs'), /^iPhoneOS(.+)\.sdk$/, options.minIosVersion),
							sims:           findIosSims(path.join(dir, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'SDKs'), p.CFBundleShortVersionString),
							simDeviceTypes: {},
							simRuntimes:    appc.util.mix({}, globalSimRuntimes),
							watchos:        watchos,
							teams:          {},
							executables: {
								xcodebuild:     fs.existsSync(f = path.join(dir, 'usr', 'bin', 'xcodebuild')) ? f : null,
								clang:          fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'clang')) ? f : null,
								clang_xx:       fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'clang++')) ? f : null,
								libtool:        fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'libtool')) ? f : null,
								lipo:           fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'lipo')) ? f : null,
								otool:          fs.existsSync(f = path.join(dir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', 'otool')) ? f : null,
								pngcrush:       fs.existsSync(f = path.join(dir, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'pngcrush')) ? f : null,
								simulator:      null,
								watchsimulator: null,
								simctl:         fs.existsSync(f = path.join(dir, 'usr', 'bin', 'simctl')) ? f : null
							}
						};

						['iPhoneSimulator.platform', 'WatchSimulator.platform'].forEach(function (platform) {
							// read in the device types
							var deviceTypesDir = path.join(xc.path, 'Platforms', platform, 'Developer', 'Library', 'CoreSimulator', 'Profiles', 'DeviceTypes');
							fs.existsSync(deviceTypesDir) && fs.readdirSync(deviceTypesDir).forEach(function (name) {
								var plist = readPlist(path.join(deviceTypesDir, name, 'Contents', 'Info.plist')),
									devId = plist && plist.CFBundleIdentifier;
								if (plist) {
									var deviceType = xc.simDeviceTypes[devId] = {
										name: plist.CFBundleName,
										model: 'unknown',
										supportsWatch: false
									};

									plist = readPlist(path.join(deviceTypesDir, name, 'Contents', 'Resources', 'profile.plist'));
									if (plist) {
										deviceType.model = plist.modelIdentifier;
									}

									plist = readPlist(path.join(deviceTypesDir, name, 'Contents', 'Resources', 'capabilities.plist'));
									if (plist) {
										deviceType.supportsWatch = !!plist.capabilities['watch-companion'];
									}
								}
							});

							// read in the runtimes
							appc.util.mix(xc.simRuntimes, findSimRuntimes(path.join(xc.path, 'Platforms', platform, 'Developer', 'Library', 'CoreSimulator', 'Profiles', 'Runtimes')));
						});

						['Simulator', 'iOS Simulator'].some(function (name) {
							var p = path.join(dir, 'Applications', name + '.app', 'Contents', 'MacOS', name);
							if (fs.existsSync(p)) {
								xc.executables.simulator = p;
								return true;
							}
						});

						var watchsim = path.join(dir, 'Applications', 'Simulator (Watch).app', 'Contents', 'MacOS', 'Simulator (Watch)');
						if (fs.existsSync(watchsim)) {
							xc.executables.watchsimulator = watchsim;
						}

						selected && (results.selectedXcode = xc);

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
				next();
			},

			function findTeams(next) {
				async.each(Object.keys(results.xcode), function (id, cb) {
					var xc = results.xcode[id],
						dbFile = appc.fs.resolvePath('~/Library/Developer/Xcode/DeveloperPortal ' + xc.version + '.db');

					if (!fs.existsSync(dbFile)) {
						return cb();
					}

					var db = new sqlite3.Database(dbFile);
					db.all('SELECT ZNAME, ZSTATUS, ZTEAMID, ZTYPE FROM ZTEAM', function (err, rows) {
						err || rows.forEach(function (row) {
							if (row.ZTEAMID) {
								xc.teams[row.ZTEAMID] = {
									name: row.ZNAME,
									status: row.ZSTATUS || 'unknown',
									type: row.ZTYPE
								};
							}
						});
						db.close();
						cb();
					});
				}, next);
			}
		], function () {
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
			return fireCallbacks(null, results);
		});
	});
};