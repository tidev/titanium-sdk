/**
 * Detects iOS developer and distribution certificates and the WWDC certificate.
 *
 * @module simulator
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	EventEmitter = require('events').EventEmitter,
	magik = require('./utilities').magik,
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	path = require('path'),
	readPlist = require('./utilities').readPlist,
	spawn = require('child_process').spawn,
	Tail = require('always-tail'),
	util = require('util'),
	xcode = require('./xcode'),
	__ = appc.i18n(__dirname).__;

var cache;

exports.detect = detect;
exports.findSimulators = findSimulators;
exports.launch = launch;
exports.stop = stop;
exports.SimHandle = SimHandle;
exports.SimulatorCrash = SimulatorCrash;

/**
 * @class
 * @classdesc An exception for when an app crashes in the iOS Simulator.
 * @constructor
 * @param {Array|Object} [crashFiles] - The crash details.
 */
function SimulatorCrash(crashFiles) {
	this.name       = 'SimulatorCrash';
	this.message    = __('App crashed in the iOS Simulator');
	this.crashFiles = Array.isArray(crashFiles) ? crashFiles : crashFiles ? [ crashFiles ] : null;
}
SimulatorCrash.prototype = Object.create(Error.prototype);
SimulatorCrash.prototype.constructor = SimulatorCrash;

function SimHandle(obj) {
	appc.util.mix(this, obj);
}

const deviceState = exports.deviceState = {
	DOES_NOT_EXIST: -1,
	CREATING: 0,
	SHUTDOWN: 1,
	BOOTING: 2,
	BOOTED: 3,
	SHUTTING_DOWN: 4
};

const deviceStateNames = exports.deviceStateNames = {
	0: 'Creating',
	1: 'Shutdown',
	2: 'Booting',
	3: 'Booted',
	4: 'Shutting Down'
};

/**
 * Helper function for comparing two simulators based on the model name.
 *
 * @param {Object} a - A simulator handle.
 * @param {Object} b - Another simulator handle.
 *
 * @returns {Number} - Returns -1 if a < b, 1 if a > b, and 0 if they are equal.
 */
function compareSims(a, b) {
	return a.model < b.model ? -1 : a.model > b.model ? 1 : 0;
}

/**
 * Detects iOS simulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all iOS simulators.
 * @param {Function} [callback(err, results)] - A function to call with the simulator information.
 *
 * @emits module:simulator#detected
 * @emits module:simulator#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			var dupe = JSON.parse(JSON.stringify(cache));
			emitter.emit('detected', dupe);
			return callback(null, dupe);
		}

		function fakeWatchSim(name, udid, model, xcodes) {
			return {
				udid:           udid,
				name:           name,
				version:        '1.0',
				type:           'watchos',

				deviceType:     null,
				deviceName:     name,
				deviceDir:      null,
				model:          model,
				family:         'watch',
				supportsXcode:  xcodes,
				supportsWatch:  {},
				watchCompanion: {},

				runtime:        null,
				runtimeName:    'watchOS 1.0',

				systemLog:      null,
				dataDir:        null
			};
		}

		var results = {
			simulators: {
				ios: {},
				watchos: {},
				crashDir: appc.fs.resolvePath('~/Library/Logs/DiagnosticReports'),
			},
			issues: []
		};

		xcode.detect(options, function (err, xcodeInfo) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var xcodeIds = Object
				.keys(xcodeInfo.xcode)
				.filter(function (ver) { return xcodeInfo.xcode[ver].supported; })
				.sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; });

			// if we have Xcode 6.2, 6.3, or 6.4, then inject some fake devices for WatchKit 1.x
			xcodeIds.some(function (id) {
				var xc = xcodeInfo.xcode[id];
				if (appc.version.satisfies(xc.version, '>=6.2 <7.0')) {
					var xcodes = {};
					xcodeIds.forEach(function (id) {
						if (appc.version.satisfies(xcodeInfo.xcode[id].version, '>=6.2 <7.0')) {
							xcodes[id] = true;
						}
					});
					results.simulators.watchos['1.0'] = [
						fakeWatchSim('Apple Watch - 38mm', '58045222-F0C1-41F7-A4BD-E2EDCFBCF5B9', 'Watch0,1', xcodes),
						fakeWatchSim('Apple Watch - 42mm', 'D5C1DA2F-7A74-49C8-809A-906E554021B0', 'Watch0,2', xcodes)
					];
					return true;
				}
			});

			// read the devices
			var coreSimDir = appc.fs.resolvePath('~/Library/Developer/CoreSimulator/Devices');
			fs.existsSync(coreSimDir) && fs.readdirSync(coreSimDir).forEach(function (name) {
				var plist = readPlist(path.join(coreSimDir, name, 'device.plist'));
				if (plist) {
					xcodeIds.forEach(function (id) {
						var xc = xcodeInfo.xcode[id],
							deviceType = xc.simDeviceTypes[plist.deviceType],
							runtime = xc.simRuntimes[plist.runtime];

						if (!deviceType || !runtime) {
							// wrong xcode, skip
							return;
						}

						var family = deviceType.model.replace(/[\W0-9]/g, '').toLowerCase(),
							type = family === 'iphone' || family === 'ipad' ? 'ios' : 'watchos',
							sim;

						results.simulators[type][runtime.version] || (results.simulators[type][runtime.version] = []);
						results.simulators[type][runtime.version].some(function (s) {
							if (s.udid === plist.UDID) {
								sim = s;
								return true;
							}
						});

						if (!sim) {
							results.simulators[type][runtime.version].push(sim = {
								udid:           plist.UDID,
								name:           plist.name,
								version:        runtime.version,
								type:           type,

								deviceType:     plist.deviceType,
								deviceName:     deviceType.name,
								deviceDir:      path.join(coreSimDir, name),
								model:          deviceType.model,
								family:         family,
								supportsXcode:  {},
								supportsWatch:  {},
								watchCompanion: {},

								runtime:        plist.runtime,
								runtimeName:    runtime.name,

								systemLog:      appc.fs.resolvePath('~/Library/Logs/CoreSimulator/' + name + '/system.log'),
								dataDir:        path.join(coreSimDir, name, 'data')
							});
						}

						sim.supportsXcode[id] = true;
						if (type === 'ios') {
							sim.supportsWatch[id] = deviceType.supportsWatch;
						}
					});
				}
			});

			// this is pretty nasty, but necessary...
			// basically this will populate the watchCompanion property for each iOS Simulator
			// so that it makes choosing simulator pairs way easier
			Object.keys(results.simulators.ios).forEach(function (iosSimVersion) {
				results.simulators.ios[iosSimVersion].forEach(function (iosSim) {
					Object.keys(iosSim.supportsWatch).forEach(function (xcodeId) {
						if (iosSim.supportsWatch[xcodeId]) {
							var xc = xcodeInfo.xcode[xcodeId];
							Object.keys(xc.simDevicePairs).forEach(function (iOSRange) {
								if (appc.version.satisfies(iosSim.version, iOSRange)) {
									Object.keys(xc.simDevicePairs[iOSRange]).forEach(function (watchOSRange) {
										Object.keys(results.simulators.watchos).forEach(function (watchosSDK) {
											results.simulators.watchos[watchosSDK].forEach(function (watchSim) {
												if (appc.version.satisfies(watchSim.version, watchOSRange)) {
													iosSim.watchCompanion[xcodeId] || (iosSim.watchCompanion[xcodeId] = []);
													iosSim.watchCompanion[xcodeId].push(watchSim.udid);
												}
											});
										});
									});
								}
							});
						}
					});
				});
			});

			// sort the simulators
			['ios', 'watchos'].forEach(function (type) {
				Object.keys(results.simulators[type]).forEach(function (ver) {
					results.simulators[type][ver].sort(compareSims);
				});
			});

			// the cache must be a clean copy that we'll clone for subsequent detect() calls
			// because we can't allow the cache to be modified by reference
			cache = JSON.parse(JSON.stringify(results));

			emitter.emit('detected', results);
			callback(null, results);
		});
	});
};

/**
 * Finds the specified app's bundle identifier. If a watch app name is specified,
 * then it will attempt to find the watch app's bundle identifier.
 *
 * @param {String} appPath - The path to the compiled .app directory
 * @param {String|Boolean} [watchAppName] - The name of the watch app to find. If value is true, then it will choose the first watch app.
 *
 * @returns {Object} An object containing the app's id and if `watchAppName` is specified, the watch app's id, OS version, and min OS version.
 */
function getAppInfo(appPath, watchAppName) {
	// validate the specified appPath
	if (!fs.existsSync(appPath)) {
		throw new Error(__('App path does not exist: ' + appPath));
	}

	// get the app's id
	var infoPlist = path.join(appPath, 'Info.plist');
	if (!fs.existsSync(infoPlist)) {
		throw new Error(__('Unable to find Info.plist in root of specified app path: ' + infoPlist));
	}

	var plist = readPlist(infoPlist);
	if (!plist || !plist.CFBundleIdentifier) {
		throw new Error(__('Failed to parse app\'s Info.plist: ' + infoPlist));
	}

	var results = {
		appId: plist.CFBundleIdentifier,
		appName: path.basename(appPath).replace(/\.app$/, '')
	};

	if (watchAppName) {
		// look for WatchKit v1 apps
		var pluginsDir = path.join(appPath, 'PlugIns');
		fs.existsSync(pluginsDir) && fs.readdirSync(pluginsDir).some(function (name) {
			var extDir = path.join(pluginsDir, name);
			if (fs.existsSync(extDir) && fs.statSync(extDir).isDirectory() && /\.appex$/.test(name)) {
				return fs.readdirSync(extDir).some(function (name) {
					var appDir = path.join(extDir, name);
					if (fs.existsSync(appDir) && fs.statSync(appDir).isDirectory() && /\.app$/.test(name)) {
						var plist = readPlist(path.join(appDir, 'Info.plist'));
						if (plist && plist.WKWatchKitApp && (typeof watchAppName !== 'string' || fs.existsSync(path.join(appDir, watchAppName)))) {
							results.watchAppName      = path.basename(appDir).replace(/\.app$/, '');
							results.watchAppId        = plist.CFBundleIdentifier;
							results.watchOSVersion    = '1.0';
							results.watchMinOSVersion = '1.0';
							return true;
						}
					}
				});
			}
		});

		if (!results.watchAppId) {
			// look for WatchKit v2 apps
			var watchDir = path.join(appPath, 'Watch');
			fs.existsSync(watchDir) && fs.readdirSync(watchDir).some(function (name) {
				var plist = readPlist(path.join(watchDir, name, 'Info.plist'));
				if (plist && (plist.DTPlatformName === 'watchos' || plist.WKWatchKitApp) && (typeof watchAppName !== 'string' || fs.existsSync(path.join(watchDir, watchAppName)))) {
					results.watchAppName      = name.replace(/\.app$/, '');
					results.watchAppId        = plist.CFBundleIdentifier;
					results.watchOSVersion    = plist.DTPlatformVersion;
					results.watchMinOSVersion = plist.MinimumOSVersion;
					return true;
				}
			});
		}

		if (!results.watchAppId) {
			if (typeof watchAppName === 'string') {
				throw new Error(__('Unable to find a watch app named "%s".', watchAppName));
			} else {
				throw new Error(__('The launch watch app flag was set, however unable to find a watch app.'));
			}
		}
	}

	return results;
}

/**
 * Finds a iOS Simulator and/or Watch Simulator as well as the supported Xcode based on the specified options.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appBeingInstalled] - The path to the iOS app to install after launching the iOS Simulator.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects Xcode and all simulators.
 * @param {Function [options.logger] - A function to log debug messages to.
 * @param {String} [options.iosVersion] - The iOS version of the app so that ioslib picks the appropriate Xcode.
 * @param {String} [options.minIosVersion] - The minimum iOS SDK to detect.
 * @param {String} [options.minWatchosVersion] - The minimum WatchOS SDK to detect.
 * @param {String|Array<String>} [options.searchPath] - One or more path to scan for Xcode installations.
 * @param {String|SimHandle} simHandleOrUDID - A iOS sim handle or the UDID of the iOS Simulator to launch or null if you want ioslib to pick one.
 * @param {String} [options.simType=iphone] - The type of simulator to launch. Must be either "iphone" or "ipad". Only applicable when udid is not specified.
 * @param {String} [options.simVersion] - The iOS version to boot. Defaults to the most recent version.
 * @param {String} [options.supportedVersions] - A string with a version number or range to check if an Xcode install is supported.
 * @param {Boolean} [options.watchAppBeingInstalled] - The id of the watch app. Required in order to find a watch simulator.
 * @param {String} [options.watchHandleOrUDID] - A watch sim handle or UDID of the Watch Simulator to launch or null if your app has a watch app and you want ioslib to pick one.
 * @param {String} [options.watchMinOSVersion] - The min Watch OS version supported by the specified watch app id.
 * @param {Function} callback(err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) - A function to call with the simulators found.
 */
function findSimulators(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (typeof options !== 'object') {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	// detect xcodes
	xcode.detect(options, function (err, xcodeInfo) {
		if (err) {
			return callback(err);
		}

		// detect the simulators
		detect(options, function (err, simInfo) {
			if (err) {
				return callback(err);
			}

			var logger = typeof options.logger === 'function' ? options.logger : function () {},
				simHandle = options.simHandleOrUDID instanceof SimHandle ? options.simHandleOrUDID : null,
				watchSimHandle = options.watchHandleOrUDID instanceof SimHandle ? options.watchHandleOrUDID : null,
				selectedXcode;

			if (options.simHandleOrUDID) {
				// validate the udid
				if (!(options.simHandleOrUDID instanceof SimHandle)) {
					var vers = Object.keys(simInfo.simulators.ios);

					logger(__('Validating iOS Simulator UDID %s', options.simHandleOrUDID));

					for (var i = 0, l = vers.length; !simHandle && i < l; i++) {
						var sims = simInfo.simulators.ios[vers[i]];
						for (var j = 0, k = sims.length; j < k; j++) {
							if (sims[j].udid === options.simHandleOrUDID) {
								logger(__('Found iOS Simulator UDID %s', options.simHandleOrUDID));
								simHandle = new SimHandle(sims[j]);
								break;
							}
						}
					}

					if (!simHandle) {
						return callback(new Error(__('Unable to find an iOS Simulator with the UDID "%s".', options.simHandleOrUDID)));
					}
				}

				if (options.watchAppBeingInstalled) {
					if (options.watchHandleOrUDID) {
						if (!(options.watchHandleOrUDID instanceof SimHandle)) {
							logger(__('Watch app present, validating Watch Simulator UDID %s', options.watchHandleOrUDID));

							Object.keys(simInfo.simulators.watchos).some(function (ver) {
								return simInfo.simulators.watchos[ver].some(function (sim) {
									if (sim.udid === options.watchHandleOrUDID) {
										logger(__('Found Watch Simulator UDID %s', options.watchHandleOrUDID));
										watchSimHandle = new SimHandle(sim);
										return true;
									}
								});
							});

							if (!watchSimHandle) {
								return callback(new Error(__('Unable to find a Watch Simulator with the UDID "%s".', options.watchHandleOrUDID)));
							}
						}

						if (!simHandle.watchCompanion[watchSimHandle.udid]) {
							return callback(new Error(__('Specified Watch Simulator "%s" is not compatible with iOS Simulator "%s".', watchSimHandle.udid, simHandle.udid)));
						}
					} else {
						logger(__('Watch app present, autoselecting a Watch Simulator'));

						Object.keys(simHandle.watchCompanion)
							.sort(function (a, b) {
								return simHandle.watchCompanion[a].model < simHandle.watchCompanion[b].model ? 1 : simHandle.watchCompanion[a].model > simHandle.watchCompanion[b].model ? -1 : 0;
							})
							.some(function (watchUDID) {
								watchSimHandle = new SimHandle(simHandle.watchCompanion[watchUDID]);
								return true;
							});

						if (!watchSimHandle) {
							return callback(new Error(__('Specified iOS Simulator "%s" does not support watch apps.', options.simHandleOrUDID)));
						}
					}

					Object.keys(simHandle.supportsXcode).some(function (xcodeId) {
						if (simHandle.supportsXcode[xcodeId]) {
							return Object.keys(watchSimHandle.supportsXcode).some(function (xcodeId2) {
								if (watchSimHandle.supportsXcode[xcodeId2] && xcodeId === xcodeId2) {
									selectedXcode = xcodeInfo.xcode[xcodeId];
									return true;
								}
							});
						}
					});
				} else {
					// no watch sim, just an ios sim
					// find the version of Xcode
					Object.keys(simHandle.supportsXcode).sort().reverse().forEach(function (id) {
						if (simHandle.supportsXcode[id] &&
							xcodeInfo.xcode[id].supported &&
							(!options.iosVersion || xcodeInfo.xcode[id].sdks.indexOf(options.iosVersion) !== -1) &&
							(!options.minIosVersion || xcodeInfo.xcode[id].sdks.some(function (ver) { return appc.version.gte(ver, options.minIosVersion); }))
						) {
							selectedXcode = xcodeInfo.xcode[id];
							return true;
						}
					});
				}

				if (!selectedXcode) {
					if (options.iosVersion) {
						return callback(new Error(__('Unable to find any Xcode installations that support both iOS %s and iOS Simulator %s.', options.iosVersion, options.simHandleOrUDID)));
					} else if (options.minIosVersion) {
						return callback(new Error(__('Unable to find any Xcode installations that support at least iOS %s and iOS Simulator %s.', options.minIosVersion, options.simHandleOrUDID)));
					} else {
						return callback(new Error(__('Unable to find any supported Xcode installations. Please install the latest Xcode.')));
					}
				}

				if (options.watchAppBeingInstalled && !options.watchHandleOrUDID && !watchSimHandle) {
					if (options.watchMinOSVersion) {
						return callback(new Error(__('Unable to find a Watch Simulator that supports watchOS %s.', options.watchMinOSVersion)));
					} else {
						return callback(new Error(__('Unable to find a Watch Simulator.')));
					}
				}

				logger(__('Selected iOS Simulator: %s', simHandle.name));
				logger(__('  UDID    = %s', simHandle.udid));
				logger(__('  iOS     = %s', simHandle.version));
				if (watchSimHandle) {
					if (options.watchAppBeingInstalled && options.watchHandleOrUDID) {
						logger(__('Selected WatchOS Simulator: %s', watchSimHandle.name));
					} else {
						logger(__('Autoselected WatchOS Simulator: %s', watchSimHandle.name));
					}
					logger(__('  UDID    = %s', watchSimHandle.udid));
					logger(__('  WatchOS = %s', watchSimHandle.version));
				}
				logger(__('Autoselected Xcode: %s', selectedXcode.version));
			} else {
				logger(__('No iOS Simulator UDID specified, searching for best match'));

				if (options.watchAppBeingInstalled && options.watchHandleOrUDID) {
					logger(__('Validating Watch Simulator UDID %s', options.watchHandleOrUDID));
					Object.keys(simInfo.simulators.watchos).some(function (ver) {
						return simInfo.simulators.watchos[ver].some(function (sim) {
							if (sim.udid === options.watchHandleOrUDID) {
								watchSimHandle = new SimHandle(sim);
								logger(__('Found Watch Simulator UDID %s', options.watchHandleOrUDID));
								return true;
							}
						});
					});
					if (!watchSimHandle) {
						return callback(new Error(__('Unable to find a Watch Simulator with the UDID "%s".', options.watchHandleOrUDID)));
					}
				}

				// pick one
				var xcodeIds = Object
					.keys(xcodeInfo.xcode)
					.filter(function (ver) {
						if (!xcodeInfo.xcode[ver].supported) {
							return false;
						}
						if (watchSimHandle && !watchSimHandle.supportsXcode[ver]) {
							return false;
						}
						if (options.iosVersion && xcodeInfo.xcode[ver].sdks.indexOf(options.iosVersion) === -1) {
							return false;
						}
						if (options.minIosVersion && !xcodeInfo.xcode[ver].sdks.some(function (ver) { return appc.version.gte(ver, options.minIosVersion); })) {
							return false;
						}
						return true;
					})
					.sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; });

				logger(__('Scanning Xcodes: %s', xcodeIds.join(' ')));

				// loop through xcodes
				for (var i = 0; !simHandle && i < xcodeIds.length; i++) {
					var xc = xcodeInfo.xcode[xcodeIds[i]],
						simVers = xc.sims.sort().reverse();

					// loop through each xcode simulators
					for (var j = 0; !simHandle && j < simVers.length; j++) {
						if ((!options.simVersion || simVers[j] === options.simVersion) && simInfo.simulators.ios[simVers[j]]) {
							var sims = simInfo.simulators.ios[simVers[j]].sort(compareSims).reverse();

							// loop through each simulator
							for (var k = 0; !simHandle && k < sims.length; k++) {
								if (!options.simType || sims[k].family === options.simType) {
									if (!options.appBeingInstalled || !options.watchAppBeingInstalled) {
										logger(__('No app being installed, so picking first simulator'));
										simHandle = new SimHandle(sims[k]);
										Object.keys(simHandle.supportsXcode).sort().reverse().forEach(function (id) {
											if (simHandle.supportsXcode[id]) {
												selectedXcode = xcodeInfo.xcode[id];
												return true;
											}
										});

									// if we're installing a watch extension, make sure we pick a simulator that supports the watch
									} else if (options.watchAppBeingInstalled) {
										if (watchSimHandle) {
											Object.keys(sims[k].supportsWatch).forEach(function (xcodeVer) {
												if (watchSimHandle.supportsXcode[xcodeVer]) {
													selectedXcode = xcodeInfo.xcode[xcodeVer];
													simHandle = new SimHandle(sims[k]);
													return true;
												}
											});
										} else if (sims[k].supportsWatch[xcodeIds[i]]) {
											// make sure this version of Xcode has a watch simulator that supports the watch app version
											xc.watchos.sims.some(function (ver) {
												if (appc.version.gte(ver, options.watchMinOSVersion) && simInfo.simulators.watchos[ver]) {
													simHandle = new SimHandle(sims[k]);
													selectedXcode = xcodeInfo.xcode[xcodeIds[i]];
													watchSimHandle = new SimHandle(simInfo.simulators.watchos[ver].sort(compareSims).reverse()[0]);
													return true;
												}
											});
										}
									}
								}
							}
						}
					}
				}

				if (!selectedXcode) {
					if (options.iosVersion) {
						return callback(new Error(__('Unable to find any Xcode installations that supports iOS %s.', options.iosVersion)));
					} else if (options.minIosVersion) {
						return callback(new Error(__('Unable to find any Xcode installations that supports at least iOS %s.', options.minIosVersion)));
					} else {
						return callback(new Error(__('Unable to find any supported Xcode installations. Please install the latest Xcode.')));
					}
				}

				if (!simHandle) {
					// user experience!
					if (options.simVersion) {
						return callback(new Error(__('Unable to find an iOS Simulator running iOS %s.', options.simVersion)));
					} else {
						return callback(new Error(__('Unable to find an iOS Simulator.')));
					}
				} else if (options.watchAppBeingInstalled && !watchSimHandle) {
					return callback(new Error(__('Unable to find a watchOS Simulator that supports watchOS %s', options.watchMinOSVersion)));
				}

				logger(__('Autoselected iOS Simulator: %s', simHandle.name));
				logger(__('  UDID    = %s', simHandle.udid));
				logger(__('  iOS     = %s', simHandle.version));
				if (watchSimHandle) {
					if (options.watchAppBeingInstalled && options.watchHandleOrUDID) {
						logger(__('Selected WatchOS Simulator: %s', watchSimHandle.name));
					} else {
						logger(__('Autoselected WatchOS Simulator: %s', watchSimHandle.name));
					}
					logger(__('  UDID    = %s', watchSimHandle.udid));
					logger(__('  WatchOS = %s', watchSimHandle.version));
				}
				logger(__('Autoselected Xcode: %s', selectedXcode.version));
			}

			simHandle.simulator = selectedXcode.executables.simulator;
			simHandle.simctl = selectedXcode.executables.simctl;
			if (watchSimHandle) {
				watchSimHandle.simulator = selectedXcode.executables.watchsimulator;
				watchSimHandle.simctl = selectedXcode.executables.simctl;
			}

			callback(null, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo);
		});
	});
}

/**
 * Launches the specified iOS Simulator or picks one automatically.
 *
 * @param {String|SimHandle} simHandleOrUDID - A iOS sim handle or the UDID of the iOS Simulator to launch or null if you want ioslib to pick one.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appPath] - The path to the iOS app to install after launching the iOS Simulator.
 * @param {Boolean} [options.autoExit=false] - When "appPath" has been specified, causes the iOS Simulator to exit when the autoExitToken has been emitted to the log output.
 * @param {String} [options.autoExitToken=AUTO_EXIT] - A string to watch for to know when to quit the iOS simulator when "appPath" has been specified.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects Xcode and all simulators.
 * @param {Boolean} [options.focus=true] - Focus the iOS Simulator after launching. Overrides the "hide" option.
 * @param {Boolean} [options.hide=false] - Hide the iOS Simulator after launching. Useful for testing. Ignored if "focus" option is set to true.
 * @param {Boolean} [options.killIfRunning] - Kill the iOS Simulator if already running.
 * @param {String} [options.launchBundleId] - Launches a specific app when the simulator loads. When installing an app, defaults to the app's id unless `launchWatchApp` is set to true.
 * @param {Boolean} [options.launchWatchApp=false] - When true, launches the specified app's watch app on an external display and the main app.
 * @param {Boolean} [options.launchWatchAppOnly=false] - When true, launches the specified app's watch app on an external display and not the main app.
 * @param {String} [options.logFilename] - The name of the log file to search for in the iOS Simulator's "Documents" folder. This file is created after the app is started.
 * @param {String} [options.minIosVersion] - The minimum iOS SDK to detect.
 * @param {String} [options.minWatchosVersion] - The minimum WatchOS SDK to detect.
 * @param {String|Array<String>} [options.searchPath] - One or more path to scan for Xcode installations.
 * @param {String} [options.simType=iphone] - The type of simulator to launch. Must be either "iphone" or "ipad". Only applicable when udid is not specified.
 * @param {String} [options.simVersion] - The iOS version to boot. Defaults to the most recent version.
 * @param {String} [options.supportedVersions] - A string with a version number or range to check if an Xcode install is supported.
 * @param {Boolean} [options.uninstallApp=false] - When true and `appPath` is specified, uninstalls the app before installing the new app. If app is not installed already, it continues.
 * @param {String} [options.watchAppName] - The name of the watch app to install. If omitted, automatically picks the watch app.
 * @param {String} [options.watchHandleOrUDID] - A watch sim handle or the UDID of the Watch Simulator to launch or null if your app has a watch app and you want ioslib to pick one.
 * @param {Function} [callback(err, simHandle)] - A function to call when the simulator has launched.
 *
 * @emits module:simulator#app-quit
 * @emits module:simulator#app-started
 * @emits module:simulator#error
 * @emits module:simulator#exit
 * @emits module:simulator#launched
 * @emits module:simulator#log
 * @emits module:simulator#log-debug
 * @emits module:simulator#log-error
 * @emits module:simulator#log-file
 * @emits module:simulator#log-raw
 *
 * @returns {EventEmitter}
 */
function launch(simHandleOrUDID, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!options.appPath && (options.launchWatchApp || options.launchWatchAppOnly)) {
			var err = new Error(
				options.launchWatchAppOnly
					? __('You must specify an appPath when launchWatchApp is true.')
					: __('You must specify an appPath when launchWatchAppOnly is true.')
				);
			emitter.emit('error', err);
			return callback(err);
		}

		var appId,
			watchAppId,
			findSimOpts = appc.util.mix({
				simHandleOrUDID: simHandleOrUDID,
				logger: function (msg) {
					emitter.emit('log-debug', msg);
				}
			}, options);

		if (options.appPath) {
			findSimOpts.appBeingInstalled = true;
			try {
				var ids = getAppInfo(options.appPath, options.watchAppName || !!options.launchWatchApp || !!options.launchWatchAppOnly);
				if (!options.launchBundleId) {
					appId = ids.appId;
				}
				if (ids.watchAppId) {
					watchAppId = ids.watchAppId;
					if (findSimOpts) {
						findSimOpts.watchAppBeingInstalled = true;
						findSimOpts.watchMinOSVersion = ids.watchMinOSVersion;
					}
					emitter.emit('log-debug', __('Found watchOS %s app: %s', ids.watchOSVersion, watchAppId));
				}
			} catch (ex) {
				emitter.emit('error', ex);
				return callback(ex);
			}
		} else if (options.launchBundleId) {
			appId = options.launchBundleId;
		}

		findSimulators(findSimOpts, function (err, simHandle, watchSimHandle, selectedXcode, simInfo) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			if (!selectedXcode.eulaAccepted) {
				var eulaErr = new Error(__('Xcode must be launched and the EULA must be accepted before a simulator can be launched.'));
				emitter.emit('error', eulaErr);
				return callback(eulaErr);
			}

			var crashFileRegExp,
				existingCrashes = getCrashes(),
				findLogTimer = null,
				logFileTail;

			if (options.appPath) {
				crashFileRegExp = new RegExp('^' + ids.appName + '_\\d{4}\\-\\d{2}\\-\\d{2}\\-\\d{6}_.*\.crash$'),
				simHandle.appName = ids.appName;
				watchSimHandle && (watchSimHandle.appName = ids.watchAppName);
			}

			// sometimes the simulator doesn't remove old log files in which case we get
			// our logging jacked - we need to remove them before running the simulator
			if (options.logFilename && simHandle.dataDir) {
				(function walk(dir) {
					var logFile = path.join(dir, 'Documents', options.logFilename);
					if (fs.existsSync(logFile)) {
						emitter.emit('log-debug', __('Removing old log file: %s', logFile));
						fs.unlinkSync(logFile);
						return true;
					}

					if (fs.existsSync(dir)) {
						return fs.readdirSync(dir).some(function (name) {
							var subdir = path.join(dir, name);
							if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
								return walk(subdir);
							}
						});
					}
				}(simHandle.dataDir));
			}

			var cleanupOnce = false;
			function cleanupAndEmit(evt) {
				if (!cleanupOnce) {
					cleanupOnce = true;
				}

				simHandle.systemLogTail && simHandle.systemLogTail.unwatch();
				simHandle.systemLogTail = null;

				if (watchSimHandle) {
					watchSimHandle.systemLogTail && watchSimHandle.systemLogTail.unwatch();
					watchSimHandle.systemLogTail = null;
				}

				emitter.emit.apply(emitter, arguments);
			}

			function getCrashes() {
				if (crashFileRegExp && fs.existsSync(simInfo.simulators.crashDir)) {
					return fs.readdirSync(simInfo.simulators.crashDir).filter(function (n) { return crashFileRegExp.test(n); });
				}
				return [];
			}

			function checkIfCrashed() {
				var crashes = getCrashes(),
					diffCrashes = crashes
						.filter(function (file) {
							return existingCrashes.indexOf(file) === -1;
						})
						.map(function (file) {
							return path.join(simInfo.simulators.crashDir, file);
						})
						.sort();

				if (diffCrashes.length) {
					// when a crash occurs, we need to provide the plist crash information as a result object
					diffCrashes.forEach(function (crashFile) {
						emitter.emit('log-debug', __('Detected crash file: %s', crashFile));
					});
					cleanupAndEmit('app-quit', new SimulatorCrash(diffCrashes));
					return true;
				}

				return false;
			}

			function startSimulator(handle) {
				var booted = false,
					simEmitter = new EventEmitter;

				function simExited(code, signal) {
					if (code || code === 0) {
						emitter.emit('log-debug', __('%s Simulator has exited with code %s', handle.deviceName, code));
					} else {
						emitter.emit('log-debug', __('%s Simulator has exited', handle.deviceName));
					}
					handle.systemLogTail && handle.systemLogTail.unwatch();
					handle.systemLogTail = null;
					simEmitter.emit('stop', code);
				}

				async.series([
					function checkIfRunningAndBooted(next) {
						isRunning(handle.simulator, function (err, pid, udid) {
							if (err) {
								return next(err);
							}

							if (!pid) {
								return next();
							}

							appc.subprocess.run(handle.simctl, ['getenv', handle.udid, 'chrisrocks'], function (code, out, run) {
								if (code) {
									emitter.emit('log-debug', __('%s Simulator is running, but not in a booted state, stopping simulator', handle.deviceName));
									stop(handle, next);
								} else {
									emitter.emit('log-debug', __('%s Simulator already running with the correct udid', handle.deviceName));
									booted = true;

									// because we didn't start the simulator, we have no child process to
									// listen for when it exits, so we need to monitor it ourselves
									setTimeout(function check() {
										appc.subprocess.run('ps', ['-p', pid], function (code, out, err) {
											if (code) {
												simExited();
											} else {
												setTimeout(check, 1000);
											}
										});
									}, 1000);

									next();
								}
							});
						});
					},

					function tailSystemLog(next) {
						if (!handle.systemLog) {
							return next();
						}

						// make sure the system log exists
						if (!fs.existsSync(handle.systemLog)) {
							var dir = path.dirname(handle.systemLog);
							fs.existsSync(dir) || mkdirp.sync(dir);
							fs.writeFileSync(handle.systemLog, '');
						}

						var smsRegExp = / SpringBoard\[\d+\]\: SMS Plugin initialized/,
							systemLogRegExp = new RegExp(' ' + handle.appName + '\\[(\\d+)\\]: (.*)'),
							watchLogMsgRegExp = handle.type === 'ios' && watchAppId ? new RegExp('companionappd\\[(\\d+)\\]: \\((.+)\\) WatchKit: application \\(' + watchAppId + '\\),?\w*(.*)') : null,
							xcode73WatchLogMsgRegExp = handle.type === 'ios' && watchAppId ? new RegExp('Installation of ' + watchAppId + ' (.*).') : null,
							watchInstallRegExp = /install status: (\d+), message: (.*)$/,
							successRegExp = /succeeded|success/i,
							crash1RegExp = /^\*\*\* Terminating app/, // objective-c issue
							crash2RegExp = new RegExp(' (SpringBoard|Carousel)\\[(\\d+)\\]: Application \'UIKitApplication:' + appId + '\\[(\\w+)\\]\' crashed'), // c++ issue
							crash3RegExp = new RegExp('launchd_sim\\[(\\d+)\\] \\(UIKitApplication:' + appId + '\\[(\\w+)\\]'), // killed by ios or seg fault
							autoExitToken = options.autoExitToken || 'AUTO_EXIT',
							detectedCrash = false;

						emitter.emit('log-debug', __('Tailing %s Simulator system log: %s', handle.deviceName, handle.systemLog));

						// tail the simulator's system log.
						// as we do this, we want to look for specific things like the watch being installed,
						// and the app starting.
						handle.systemLogTail = new Tail(handle.systemLog, '\n', { interval: 500 }, /* fromBeginning */ false );
						handle.systemLogTail.on('line', function (line) {
							var m;
							emitter.emit('log-raw', line, handle);

							if (!booted || !handle.installing) {
								return;
							}

							if (xcode73WatchLogMsgRegExp) {
								if (m = line.match(xcode73WatchLogMsgRegExp)) {
									if (m[1] === 'acknowledged') {
										emitter.emit('log-debug', __('Watch App installed successfully!'));
										handle.installed = true;
									} else {
										simEmitter.emit('error', new Error(__('Watch App installation failure')));
									}
									return;
								}
							}

							if (watchLogMsgRegExp) {
								if (m = line.match(watchLogMsgRegExp)) {
									// refine our regex now that we have the pid
									watchLogMsgRegExp = new RegExp('companionappd\\[(' + m[1] + ')\\]: \\((.+)\\) WatchKit: (.*)$');

									var type = m[2].trim().toLowerCase(),
										msg = m[3].trim();

									if (type === 'note') {
										// did the watch app install succeed?
										if (!handle.installed && (m = msg.match(watchInstallRegExp)) && parseInt(m[1]) === 2 && successRegExp.test(m[2])) {
											emitter.emit('log-debug', __('Watch App installed successfully!'));
											handle.installed = true;
										}
									} else if (type === 'error') {
										// did the watch app install fail?
										simEmitter.emit('error', new Error(__('Watch App installation failure: %s', msg)));
									}

									return;
								}
							}

							if (handle.appStarted) {
								m = line.match(systemLogRegExp);

								if (m) {
									if (handle.type === 'watchos' && m[2].indexOf('(Error) WatchKit:') !== -1) {
										emitter.emit('log-error', m[2], handle);
										return;
									}

									emitter.emit('log', m[2], handle);
									if (options.autoExit && m[2].indexOf(autoExitToken) !== -1) {
										emitter.emit('log-debug', __('Found "%s" token, stopping simulator', autoExitToken));
										// stopping the simulator will cause the "close" event to fire
										stop(handle, function () {
											cleanupAndEmit('app-quit');
										});
										return;
									}
								}

								// check for an iPhone app crash
								if (!detectedCrash && handle.type === 'ios' && ((m && crash1RegExp.test(m[2])) || crash2RegExp.test(line) || crash3RegExp.test(line))) {
									detectedCrash = true;
									// wait 1 second for the potential crash log to be written
									setTimeout(function () {
										// did we crash?
										if (!checkIfCrashed()) {
											// well something happened, exit
											emitter.emit('log-debug', __('Detected crash, but no crash file'));
											cleanupAndEmit('app-quit');
										}
									}, 1000);
								}
							}
						});
						handle.systemLogTail.watch();

						next();
					},

					function shutdownJustInCase(next) {
						if (booted) {
							return next();
						}

						emitter.emit('log-debug', __('Running: %s', handle.simctl + ' shutdown ' + handle.udid));
						appc.subprocess.run(handle.simctl, ['shutdown', handle.udid], function (code, out, err) {
							if (code) {
								emitter.emit('log-debug', __('%s Simulator was already shutdown', handle.deviceName));
							} else {
								emitter.emit('log-debug', __('%s Simulator needed to be shutdown', handle.deviceName));
							}
							next();
						});
					},

					function startTheSimulator(next) {
						if (booted) {
							return next();
						}

						// not running, start the simulator
						emitter.emit('log-debug', __('Running: %s', handle.simulator + ' -CurrentDeviceUDID ' + handle.udid));

						var child = spawn(handle.simulator, ['-CurrentDeviceUDID', handle.udid], { detached: true, stdio: 'ignore' });
						child.on('close', simExited);
						child.unref();

						// wait for the simulator to boot
						async.whilst(
							function () { return !booted; },
							function (cb) {
								appc.subprocess.run(handle.simctl, ['getenv', handle.udid, 'chrisrocks'], function (code, out, run) {
									if (code) {
										setTimeout(function () {
											cb();
										}, 250);
									} else {
										booted = true;
										cb();
									}
								});
							},
							function () {
								emitter.emit('log-debug', __('%s Simulator started', handle.deviceName));
								next();
							}
						);
					}
				], function (err) {
					simEmitter.emit('start', err);
				});

				return simEmitter;
			}

			async.series([
				function stopIosSim(next) {
					// check if we need to stop the iOS simulator
					if (options.killIfRunning !== false) {
						emitter.emit('log-debug', __('Stopping iOS Simulator, if running'));
						stop(simHandle, next);
					} else {
						next();
					}
				},

				function stopWatchSim(next) {
					// check if we need to stop the watchOS simulator
					if (watchSimHandle && options.killIfRunning !== false && appc.version.gte(watchSimHandle.version, '2.0')) {
						emitter.emit('log-debug', __('Stopping watchOS Simulator, if running'));
						stop(watchSimHandle, next);
					} else {
						next();
					}
				},

				function pairIosAndWatchSims(next) {
					// check if we need to pair devices
					if (!watchSimHandle) {
						// no need to pair
						return next();
					}

					if (appc.version.lt(watchSimHandle.version, '2.0')) {
						// no need to pair
						emitter.emit('log-debug', __('No need to pair WatchKit 1.x app'));
						return next();
					}

					emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' list pairs --json'));
					appc.subprocess.run(selectedXcode.executables.simctl, ['list', 'pairs', '--json'], function (code, out, err) {
						if (code) {
							return next(code ? new Error(err.trim()) : null);
						}

						var devicePairs;
						try {
							devicePairs = JSON.parse(out.substring(out.indexOf('{'))).pairs;
						} catch (e) {
							return next(e);
						}

						// we need to pair, check if we're already paired
						if (Object.keys(devicePairs).some(function (udid) {
							var dp = devicePairs[udid];
							return dp.phone.udid === simHandle.udid && dp.watch.udid === watchSimHandle.udid;
						})) {
							// already paired!
							emitter.emit('log-debug', __('iOS and watchOS simulators already paired'));
							return next();
						}

						// check if we need to unpair
						async.eachSeries(Object.keys(devicePairs), function (udid, next) {
							var dp = devicePairs[udid];
							if (dp.phone.udid !== simHandle.udid && dp.watch.udid !== watchSimHandle.udid) {
								return next();
							}

							emitter.emit('log-debug', __('Unpairing iOS and watchOS simulator pair: %s', udid));
							var args = ['unpair', udid];
							emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
							appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
								next(code ? new Error(err.trim()) : null);
							});
						}, function (err) {
							if (err) {
								return next(err);
							}

							// pair!
							emitter.emit('log-debug', __('Pairing iOS and watchOS simulator pair: %s -> %s', watchSimHandle.udid, simHandle.udid));
							var args = ['pair', watchSimHandle.udid, simHandle.udid];
							emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
							appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
								next(code ? new Error(err.trim()) : null);
							});
						});
					});
				},

				function startIosSim(next) {
					// start the iOS Simulator
					simHandle.startTime = Date.now();
					simHandle.running = false;

					function shutdown(code) {
						// simulator process ended

						// stop looking for the log file
						clearTimeout(findLogTimer);

						logFileTail && logFileTail.unwatch();
						logFileTail = null;

						if (code instanceof Error) {
							cleanupAndEmit('error', code);
						} else {
							// wait 1 second for the potential crash log to be written
							setTimeout(function () {
								// did we crash?
								if (!checkIfCrashed()) {
									// we didn't find a crash file, so just report the simulator exited with the code
									emitter.emit('log-debug', __('Exited with code: %s', code));
									cleanupAndEmit('exit', code);
								}
							}, 1000);
						}
					}

					startSimulator(simHandle)
						.on('start', function (err) {
							emitter.emit('launched', simHandle, watchSimHandle);
							next(err);
						})
						.on('error', function (err) {
							if (err) {
								simHandle.error = err;
								shutdown(err);
							}
						})
						.on('stop', shutdown);
				},

				function startWatchSim(next) {
					// if we need to, start the watchOS Simulator
					if (watchSimHandle && appc.version.gte(selectedXcode.version, '7.0')) {
						startSimulator(watchSimHandle)
							.on('start', next)
							.on('stop', function (code) {
								// TODO: detect crashes for the watch app
							});
					} else {
						next();
					}
				},

				function focusOrHideSims(next) {
					async.eachSeries([ watchSimHandle, simHandle ], function (handle, next) {
						if (!handle || (handle.type === 'watchos' && appc.version.lt(handle.version, '2.0'))) {
							// either we don't have a watch handle or we do, but it's version 1.x which
							// is an external display and doesn't need to be focused
							return next();
						}

						var done = false,
							args,
							action;

						// focus or hide the iOS Simulator
						if (options.focus !== false && !options.hide && !options.autoExit) {
							action = ['focus', 'focused'];
							args = [
								path.join(__dirname, 'sim_focus.scpt'),
								path.basename(handle.simulator)
							];

							if (watchSimHandle && appc.version.satisfies(selectedXcode.version, '>=6.2 <7.0')) {
								// Xcode 6... we need to show the external display via the activate script
								args.push(watchSimHandle.name);
							} else if (appc.version.lt(selectedXcode.version, '7.0')) {
								args.push('Disabled');
							}
						} else if (options.hide || options.autoExit) {
							action = ['hide', 'hidden'];
							args = [
								path.join(__dirname, 'sim_hide.scpt'),
								path.basename(handle.simulator)
							];
						}

						if (!args) {
							return next();
						}

						async.whilst(
							function () { return !done; },
							function (cb) {
								emitter.emit('log-debug', __('Running: %s', 'osascript "' + args.join('" "') + '"'));
								appc.subprocess.run('osascript', args, function (code, out, err) {
									if (code && /Application isn.t running/.test(err)) {
										// give the iOS Simulator a half second to load
										setTimeout(function () {
											cb();
										}, 500);
										return;
									}

									if (code) {
										emitter.emit('log-debug', __('Failed to %s %s Simulator, continuing', action[0], handle.deviceName));
									} else {
										emitter.emit('log-debug', __('%s Simulator successfully %s', handle.deviceName, action[1]));
									}
									done = true;

									cb();
								});
							},
							next
						);
					}, next);
				},

				function uninstallApp(next) {
					if (!options.appPath || !appId || options.uninstallApp !== true) {
						return next();
					}

					// uninstall the app
					var args = ['uninstall', simHandle.udid, appId];
					emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
					appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
						// if code == 1, then the app wasn't installed, so just skip it
						if (code > 1) {
							emitter.emit('log-debug', __('App failed to uninstall'));
							err.trim().split('\n').forEach(function (line) {
								emitter.emit('log-debug', line);
							});
						} else if (code === 1) {
							emitter.emit('log-debug', __('App was not installed'));
						} else {
							emitter.emit('log-debug', __('App uninstalled'));
						}
						next(code > 1 ? new Error(__('Failed to uninstall app')) : null);
					});
				},

				function installApp(next) {
					if (!options.appPath || !appId) {
						return next();
					}

					// install the app
					var args = ['install', simHandle.udid, options.appPath];
					simHandle.installing = true;
					watchSimHandle && (watchSimHandle.installing = true);
					emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
					appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
						if (code) {
							emitter.emit('log-debug', __('App failed to install'));
							err.trim().split('\n').forEach(function (line) {
								emitter.emit('log-debug', line);
							});
						} else if (simHandle.error) {
							return next(simHandle.error);
						} else {
							emitter.emit('log-debug', __('App installed'));
						}
						next(code ? new Error(__('Failed to install app')) : null);
					});
				}
			], function (err) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}

				// at this point the simulator should be launched

				// if we're not launching an app, then just return now
				if (!options.appPath || !appId) {
					return callback(null, simHandle);
				}

				async.series([
					function waitForWatchAppToSync(next) {
						if (watchSimHandle && watchAppId && !simHandle.installed) {
							// since we are launching the Watch Simulator, we need to give the iOS Simulator a
							// second to install the watch app in the Watch Simulator
							emitter.emit('log-debug', __('Waiting for Watch App to install...'));
							var timer = setInterval(function () {
								if (simHandle.installed) {
									clearInterval(timer);
									next();
								}
							}, 250);
						} else {
							next();
						}
					},

					function launchWatchApp(next) {
						if (!watchSimHandle || !watchAppId) {
							return next();
						}

						// launch the watchOS app
						//
						// we launch this first because on Xcode 6 iOS Simulator the watch app causes the iPhone
						// to show a black screen which will flash for a second before main app launches instead
						// of the main app flashing for a second before the screen turned black.
						var args = ['launch'];
						if (appc.version.gte(selectedXcode.version, '7.0')) {
							args.push(watchSimHandle.udid, watchAppId);
						} else {
							args.push(simHandle.udid, watchAppId);
						}

						emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
						appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
							if (code) {
								next(new Error(err.trim()));
							} else {
								watchSimHandle.appStarted = true;
								emitter.emit('log-debug', __('Watch app launched'));
								next();
							}
						});
					},

					function launchIosApp(next) {
						// launch the iOS app
						if (options.launchWatchAppOnly) {
							return next();
						}

						var args = ['launch', simHandle.udid, appId];

						emitter.emit('log-debug', __('Running: %s', selectedXcode.executables.simctl + ' ' + args.join(' ')));
						appc.subprocess.run(selectedXcode.executables.simctl, args, function (code, out, err) {
							if (code) {
								next(new Error(err.trim()));
							} else {
								simHandle.appStarted = true;
								emitter.emit('log-debug', __('App launched'));
								next();
							}
						});
					},

					function findTitaniumAppLogFile(next) {
						if (watchSimHandle && options.launchWatchAppOnly) {
							// nothing to do here, later we'll signal app-quit so that clients can know that
							// they don't need to wait around for logs
						} else if (options.logFilename) {
							// we are installing an app and we found the simulator log directory, now we just
							// need to find the log file
							(function findLogFile() {
								var found = false;

								(function walk(dir) {
									var logFile = path.join(dir, 'Documents', options.logFilename);
									if (fs.existsSync(logFile)) {
										emitter.emit('log-debug', __('Found application log file: %s', logFile));
										logFileTail = new Tail(logFile, '\n', { interval: 500 }, /* fromBeginning */ true );
										logFileTail.on('line', function (msg) {
											emitter.emit('log-file', msg);
										});
										logFileTail.watch();
										found = true;
										return true;
									}

									if (fs.existsSync(dir)) {
										return fs.readdirSync(dir).some(function (name) {
											var subdir = path.join(dir, name);
											if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
												return walk(subdir);
											}
										});
									}
								}(simHandle.dataDir));

								// try again
								if (!found) {
									findLogTimer = setTimeout(findLogFile, 250);
								}
							}());
						}
						next();
					}
				], function () {
					emitter.emit('app-started', simHandle, watchSimHandle);
					callback(null, simHandle, watchSimHandle);

					if (watchSimHandle && options.launchWatchAppOnly && appc.version.satisfies(selectedXcode.version, '>=6.2 <7.0')) {
						cleanupAndEmit('exit');
					}
				});
			});
		});
	});
};

/**
 * Determines if the iOS Simulator is running by scanning the output of the `ps` command.
 *
 * @param {String} proc - The path of the executable to find the pid for
 * @param {Function} callback - A function to call with the pid
 */
function isRunning(proc, callback) {
	appc.subprocess.run('ps', '-ef', function (code, out, err) {
		if (code) {
			return callback(new Error(__('Failed to get process list (exit code %d)', code)));
		}

		var lines = out.split('\n'),
			i = 0,
			l = lines.length,
			m,
			procRE = /^\s*\d+\s+(\d+).* \-CurrentDeviceUDID (.+)/;

		for (; i < l; i++) {
			if (lines[i].indexOf(proc) !== -1) {
				m = lines[i].match(procRE);
				return m ? callback(null, parseInt(m[1]), m[2]) : callback();
			}
		}

		callback(null, false);
	});
}

/**
 * Stops the specified iOS Simulator.
 *
 * @param {Object} simHandle - The simulator handle.
 * @param {Function} [callback(err)] - A function to call when the simulator has quit.
 *
 * @emits module:simulator#error
 * @emits module:simulator#stopped
 *
 * @returns {EventEmitter}
 */
function stop(simHandle, callback) {
	return magik(null, callback, function (emitter, options, callback) {
		if (!simHandle || typeof simHandle !== 'object') {
			var err = new Error(__('Invalid simulator handle argument'));
			emitter.emit('error', err);
			return callback(err);
		}

		// make sure the simulator has had some time to launch
		setTimeout(function () {
			isRunning(simHandle.simulator, function (err, pid) {
				if (err) {
					callback(err);
				} else if (pid) {
					try {
						process.kill(pid, 'SIGKILL');
					} catch (ex) {}
				}

				simHandle.running = true;

				// wait for the process to die
				async.whilst(
					function () { return simHandle.running; },
					function (cb) {
						isRunning(simHandle.simulator, function (err, pid) {
							if (!err && !pid) {
								simHandle.running = false;
								cb();
							} else {
								setTimeout(function () {
									cb();
								}, 250);
							}
						});
					},
					function () {
						emitter.emit('stopped');
						callback();
					}
				);
			});
		}, simHandle.startTime && Date.now() - simHandle.startTime < 250 ? 250 : 0);
	});
};
