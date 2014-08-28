/**
 * Detects iOS developer and distribution certificates and the WWDC certificate.
 *
 * @module simulator
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
	EventEmitter = require('events').EventEmitter,
	fs = require('fs'),
	path = require('path'),
	plist = require('simple-plist'),
	simulators = require('./simulators.json'),
	spawn = require('child_process').spawn,
	Tail = require('always-tail'),
	xcode = require('./xcode'),
	__ = appc.i18n(__dirname).__,
	iossim = path.join(__dirname, 'ios-sim');

var cache;

exports.detect = detect;
exports.launch = launch;
exports.stop = stop;
exports.SimulatorCrash = SimulatorCrash;

/**
 * @class
 * @classdesc An exception for when an app crashes in the iOS Simulator.
 * @constructor
 * @param {Object} [crash] - The crash details.
 */
function SimulatorCrash(crash) {
	this.name = 'SimulatorCrash';
	this.message = __('App crashed in the iOS Simulator');
	crash !== null && typeof crash === 'object' && appc.util.mix(this, crash);
}
SimulatorCrash.prototype = Object.create(Error.prototype);
SimulatorCrash.prototype.constructor = SimulatorCrash;

/**
 * Detects iOS simulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all iOS simulators.
 * @param {String} [options.type] - The type of emulators to return. Can be either "iphone" or "ipad". Defaults to all types.
 * @param {Function} [callback(err, results)] - A function to call with the simulator information.
 *
 * @emits module:simulator#detected
 * @emits module:simulator#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
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

	var results = {
			executables: {
				'ios-sim': iossim
			},
			simulators: {},
			crashDir: appc.fs.resolvePath('~/Library/Logs/DiagnosticReports'),
			issues: []
		};

	xcode.detect(options, function (err, xcodeInfo) {
		if (err) {
			emitter.emit('error', err);
			return callback(err);
		}

		var xcodeIds = Object.keys(xcodeInfo.xcode).sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; }),
			simSDKmap = {},
			legacySims = [];

		// prepare the pre-Xcode 6 simulator profiles
		xcodeIds.forEach(function (id) {
			var xc = xcodeInfo.xcode[id];
			xc.sims && xc.sims.forEach(function (sdk) {
				simSDKmap[sdk] = 1;
			});
		});

		var simSDKs = Object.keys(simSDKmap).sort();

		Object.keys(simulators).forEach(function (name) {
			var sim = simulators[name],
				type = sim.type || 'iphone',
				_64bit = !!sim['64bit'],
				retina = !!sim.retina,
				tall = !!sim.tall,
				versions = {};

			if (!options.type || options.type === type) {
				// calculate the sdks
				simSDKs.forEach(function (sdk) {
					if (type === 'iphone' || (type === 'ipad' && appc.version.gte(sdk, '3.0.0'))) {
						if (!_64bit || appc.version.gte(sdk, '7.0.0')) {
							if (!tall || appc.version.gte(sdk, '6.0.0')) {
								if ((!retina && type === 'ipad' || appc.version.lt(sdk, '7.0.0')) || (retina && appc.version.gte(sdk, '4.0.0'))) {
									versions[sdk] = 1;
								}
							}
						}
					}
				});

				versions = Object.keys(versions).sort();

				// if we don't have at least 1 simulator version that matches this profile, don't add it
				if (versions.length) {
					legacySims.push({
						name: name,
						id: sim.id,
						type: type,
						'64bit': _64bit,
						retina: retina,
						tall: tall,
						versions: versions
					});
				}
			}
		});

		var retinaRegExp = /^iPad 2$/i,
			tallRegExp = /^iPad 2|iPhone 4s?$/i,
			_64bitRegExp = /^(iPhone (4|4s|5))|iPad 2|iPad Retina$/i;

		function simSort(a, b) {
			if (!a.resizable && b.resizable) return -1;
			if (a.resizable && !b.resizable) return 1;
			if (a.type === 'iphone' && b.type !== 'iphone') return -1;
			if (a.type !== 'iphone' && b.type === 'iphone') return 1;
			if (a.xcode < b.xcode) return -1;
			if (a.xcode > b.xcode) return 1;
			if (!a.retina && b.retina) return -1;
			if (a.retina && !b.retina) return 1;
			if (!a.tall && b.tall) return -1;
			if (a.tall && !b.tall) return 1;
			if (!a['64bit'] && b['64bit']) return -1;
			if (a['64bit'] && !b['64bit']) return 1;
			return 0;
		}

		// for each xcode version, add the sims
		async.eachSeries(xcodeIds, function (id, next) {
			var xc = xcodeInfo.xcode[id];

			if (appc.version.gte(xc.version, '6.0.0')) {
				// modern Xcode 6 path
				appc.subprocess.run(iossim, ['showallsimulators', '--xcode-dir', xc.path], function (code, out, err) {
					if (code) {
						next();
					} else {
						try {
							JSON.parse(out).forEach(function (sim) {
								results.simulators[sim.version] || (results.simulators[sim.version] = []);

								if (!results.simulators[sim.version].some(function (s) { return s.udid === sim.udid; })) {
									results.simulators[sim.version].push({
										'deviceType': sim.deviceType,
										'udid': sim.udid,
										'type': sim.type.toLowerCase(),
										'name': sim.name,
										'ios': sim.version,
										'retina': !retinaRegExp.test(sim.deviceType),
										'tall': !tallRegExp.test(sim.deviceType),
										'64bit': !_64bitRegExp.test(sim.deviceType),
										'resizable': sim.deviceType.toLowerCase().indexOf('resizable') !== -1,
										'xcode': xc.version,
										'app': path.join(xc.path, 'Applications', 'iOS Simulator.app'),
										'systemLog': path.join(sim.logpath, 'system.log'),
										'logPaths': [
											appc.fs.resolvePath('~/Library/Developer/CoreSimulator/Devices/' + sim.udid + '/data/Applications'),
											appc.fs.resolvePath('~/Library/Developer/CoreSimulator/Devices/' + sim.udid + '/data/Containers/Data/Application')
										],
										'logFile': null,
										'cmd': [
											iossim,
											'launch',
											'<app path>',
											'--verbose',
											'--xcode-dir', xc.path,
											'--udid', sim.udid
										]
									});
								}

								results.simulators[sim.version].sort(simSort);
							});
						} catch (ex) {}
						next();
					}
				});
			} else {
				// legacy Xcode 5 path
				xc.sims.forEach(function (simVer) {
					legacySims.forEach(function (sim) {
						if (sim.versions.indexOf(simVer) !== -1) {
							var i = 0,
								udid = appc.version.format(simVer, 4, 4).split('.').map(function (id) { return appc.string.lpad(id, i++ === 0 ? 8 : 4, '0'); }).join('-') + '-' + appc.string.lpad(sim.id, 12, '0');

							results.simulators[simVer] || (results.simulators[simVer] = []);

							if (!results.simulators[simVer].some(function (s) { return s.udid === udid; })) {
								var info = {
										'deviceType': sim.name,
										'udid': udid,
										'type': sim.type,
										'name': sim.name,
										'ios': simVer,
										'retina': sim.retina,
										'tall': sim.retina && sim.tall,
										'64bit': !!sim['64bit'],
										'resizable': false,
										'xcode': xc.version,
										'app': path.join(xc.path, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'Applications', 'iPhone Simulator.app'),
										'systemLog': appc.fs.resolvePath('~/Library/Logs/iOS Simulator/' + simVer + (sim['64bit'] ? '-64' : '') + '/system.log'),
										'logPaths': [
											appc.fs.resolvePath('~/Library/Application Support/iPhone Simulator/' + simVer + (sim['64bit'] ? '-64' : '') + '/Applications')
										],
										'logFile': null,
										'cmd': [
											iossim,
											'launch',
											'<app path>',
											'--verbose',
											'--xcode-dir', xc.path,
											'--sdk', appc.version.format(simVer, 2, 2),
											'--family', sim.type
										]
									};

								if (sim.retina) {
									info.cmd.push('--retina');
									if (sim.tall) {
										info.cmd.push('--tall');
									}
								}

								if (sim['64bit']) {
									info.cmd.push('--sim-64bit');
								}

								results.simulators[simVer].push(info);
							}

							// sort the simulators
							results.simulators[simVer].sort(simSort);
						}
					});
				});
				next();
			}
		}, function () {
			cache = results;
			emitter.emit('detected', results);
			callback(null, results);
		});
	});

	return emitter;
};

/**
 * Launches the specified iOS Simulator or picks one automatically.
 *
 * @param {String} udid - The UDID of the iOS Simulator to launch or null if you want ioslib to pick one.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appName] - The name of the app. Defaults to the name of the last appPath segment.
 * @param {String} [options.appPath] - The path to the iOS app to install after launching the iOS Simulator.
 * @param {Boolean} [options.autoExit=false] - When "appPath" has been specified, causes the iOS Simulator to exit when the autoExitToken has been emitted to the log output.
 * @param {String} [options.autoExitToken=AUTO_EXIT] - A string to watch for to know when to quit the iOS simulator when "appPath" has been specified.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all iOS simulators.
 * @param {Boolean} [options.focus=true] - Focus the iOS Simulator after launching. Overrides the "hide" option.
 * @param {Boolean} [options.hide=false] - Hide the iOS Simulator after launching. Useful for testing. Ignored if "focus" option is set to true.
 * @param {Boolean} [options.killIfRunning=false] - Kill the iOS Simulator if already running.
 * @param {String} [options.logFilename] - The name of the log file to search for in the iOS Simulator's "Documents" folder. This file is created after the app is started.
 * @param {String} [options.simType=iphone] - The type of simulator to launch. Must be either "iphone" or "ipad". Only applicable when udid is not specified.
 * @param {String} [options.simVersion] - The iOS version to boot. Defaults to the most recent version.
 * @param {Number} [options.timeout] - Number of milliseconds to wait before timing out.
 * @param {Function} [callback(err, simHandle)] - A function to call when the simulator has launched.
 *
 * @emits module:simulator#launched
 * @emits module:simulator#error
 * @emits module:simulator#quit
 * @emits module:simulator#timeout
 * @emits module:simulator#appStarted
 * @emits module:simulator#logFile
 *
 * @returns {EventEmitter}
 */
function launch(udid, options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	var emitter = new EventEmitter;

	xcode.detect(options, function (err, xcodeInfo) {
		if (err) {
			emitter.emit('error', err);
			return callback(err);
		}

		detect(options, function (err, simInfo) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var simHandle;

			if (udid) {
				// validate the udid
				var vers = Object.keys(simInfo.simulators);
				for (var i = 0, l = vers.length; !simHandle && i < l; i++) {
					var sims = simInfo.simulators[vers[i]];
					for (var j = 0, k = sims.length; j < k; j++) {
						if (sims[j].udid === udid) {
							simHandle = sims[j];
							break;
						}
					}
				}

				if (!simHandle) {
					err = new Error(__('Unable to find an iOS Simulator with the UDID "%s"', options.udid));
				}
			} else {
				// pick one
				var xcodeIds = Object.keys(xcodeInfo.xcode).sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; });

				// loop through xcodes
				for (var i = 0; !simHandle && i < xcodeIds.length; i++) {
					var simVers = xcodeInfo.xcode[xcodeIds[i]].sims;
					// loop through each xcode simulators
					for (var j = 0; !simHandle && j < simVers.length; j++) {
						if (!options.simVersion || simVers[j] === options.simVersion) {
							var sims = simInfo.simulators[simVers[j]];
							// loop through each simulator
							for (var k = 0; !simHandle && k < sims.length; k++) {
								if (!options.simType || sims[k].type === options.simType) {
									simHandle = sims.shift();
								}
							}
						}
					}
				}

				if (!simHandle) {
					// user experience!
					if (options.simVersion) {
						err = new Error(__('Unable to find an iOS Simulator running iOS %s', options.simVersion));
					} else {
						err = new Error(__('Unable to find an iOS Simulator.'));
					}
				}
			}

			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			if (options.appPath && !fs.existsSync(options.appPath)) {
				err = new Error(__('App path does not exist: ' + options.appPath));
				emitter.emit('error', err);
				return callback(err);
			}

			simHandle.startTime = Date.now();
			simHandle.running = false;

			// sometimes the simulator doesn't remove old log files in which case we get
			// our logging jacked - we need to remove them before running the simulator
			if (options.logFilename) {
				simHandle.logPaths.forEach(function (logPath) {
					fs.existsSync(logPath) && fs.readdirSync(logPath).forEach(function (guid) {
						var file = path.join(logPath, guid, 'Documents', options.logFilename);
						if (fs.existsSync(file)) {
							fs.unlinkSync(file);
						}
					});
				});
			}

			function getCrashes() {
				if (!fs.existsSync(simInfo.crashDir)) {
					return [];
				}
				return fs.readdirSync(simInfo.crashDir).filter(function (n) { return path.extname(n) === '.plist'; });
			}

			if (options.killIfRunning) {
				stop(simHandle, launchSim);
			} else {
				launchSim();
			}

			function launchSim() {
				var launchTimer = null,
					existingCrashes = getCrashes(),
					args = simHandle.cmd.slice(1).map(function (p) { return p === '<app path>' ? (options.appPath || '') : p; }),
					simProcess = spawn(simHandle.cmd[0], args),
					appName = options.appName || (options.appPath ? path.basename(options.appPath) : null),
					findLogTimer = null,
					tail;

				if (options.timeout > 0) {
					setTimeout(function () {
						clearTimeout(findLogTimer);
						emitter.emit('timeout');
					}, options.timeout);
				}

				// listen for ios-sim output
				simProcess.stderr.on('data', function (data) {
					if (data.toString().trim().indexOf('Session started') !== -1) {
						clearTimeout(launchTimer);
						emitter.emit('appStarted', simHandle);
					}
				});

				if (appName) {
					var autoExitToken = options.autoExitToken || 'AUTO_EXIT',
						logRegExp = new RegExp(appName.replace(/\.app$/, '') + '\\[\\w+\\:\\w+\\]\\s+(.*)$');

					// listen for NSLog() output
					simProcess.stdout.on('data', function (data) {
						var exit = false;
						data.toString().trim().split('\n').forEach(function (line) {
							emitter.emit('log-raw', line);

							var m = line.match(logRegExp);
							m && emitter.emit('log', m[1]);

							if (options.autoExit && line.indexOf(autoExitToken) !== -1) {
								exit = true;
							}
						});
						exit && stop(simHandle);
					});
				}

				simProcess.on('close', function (code, signal) {
					// stop looking for the log file
					clearTimeout(launchTimer);
					clearTimeout(findLogTimer);

					tail && process.nextTick(function () {
						tail && tail.unwatch();
						tail = null;
					});

					// did we crash?
					var crashes = getCrashes(),
						diffCrashes = crashes.filter(function (file) {
							return existingCrashes.indexOf(file) === -1;
						}).sort();

					if (diffCrashes.length) {
						// when a crash occurs, we need to provide the plist crash information as a result object
						var crashPlistFile = path.join(simInfo.crashDir, diffCrashes.pop()),
							crash = plist.readFileSync(crashPlistFile);

						crash.crashPlistFile = crashPlistFile;
						crash.crashFile = path.join(path.dirname(crashPlistFile), path.basename(crashPlistFile).substring(1).replace(/\.plist$/, ''));

						emitter.emit('quit', new SimulatorCrash(crash));
					} else {
						emitter.emit('quit', code);
					}
				});

				if ((options.focus === undefined && !options.hide && !options.autoExit) || options.focus) {
					// focus the simulator
					appc.subprocess.run('osascript', [ path.join(__dirname, 'iphone_sim_activate.scpt'), simHandle.app ], function () {});
				} else if (options.hide || options.autoExit) {
					appc.subprocess.run('osascript', [ path.join(__dirname, 'iphone_sim_hide.scpt'), simHandle.app ], function () {});
				}

				if (options.appPath && fs.existsSync(options.appPath) && options.logFilename) {
					// we are installing an app and we found the simulator log directory, now we just
					// need to find the log file
					(function findLogFile() {
						var found = false;

						// scan all log paths
						simHandle.logPaths.forEach(function (logPath) {
							if (fs.existsSync(logPath)) {
								var files = fs.readdirSync(logPath),
									i = 0,
									l = files.length,
									file, appDir, stat, dt, docs, j, k;

								for (; i < l; i++) {
									if (fs.existsSync(file = path.join(logPath, /*guid*/files[i], 'Documents', options.logFilename))) {
										logFile = file;
										tail = new Tail(logFile, '\n', { interval: 500 } );
										tail.on('line', function (msg) {
											emitter.emit('logFile', msg);
										});
										tail.watch();
										found = true;
										return;
									}
								}
							}
						});

						// try again
						if (!found) {
							findLogTimer = setTimeout(findLogFile, 250);
						}
					})();
				}

				clearTimeout(launchTimer);
				simHandle.running = true;
				emitter.emit('launched', simHandle);
				callback(null, simHandle);
			} // end of launchSim()
		});
	});

	return emitter;
};

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
	typeof callback === 'function' || (callback = function () {});

	var emitter = new EventEmitter;

	if (!simHandle || typeof simHandle !== 'object') {
		var err = new Error(__('Invalid simulator handle argument'));
		emitter.emit('error', err);
		return callback(err);
	}

	// make sure ios-sim has had some time to launch the simulator
	setTimeout(function () {
		appc.subprocess.run('ps', '-ef', function (code, out, err) {
			if (code) {
				return callback(new Error(__('Failed to get process list (exit code %d)', code)));
			}

			var app = path.join(simHandle.app, 'Contents', 'MacOS'),
				lines = out.split('\n'),
				i = 0,
				l = lines.length,
				m;

			for (; i < l; i++) {
				if (lines[i].indexOf(app) !== -1 || lines[i].indexOf(iossim) !== -1) {
					m = lines[i].match(/^\s*\d+\s+(\d+)/);
					m && process.kill(parseInt(m[1]), 'SIGKILL');
				}
			}

			simHandle.running = false;
			emitter.emit('stopped');
			callback();
		});
	}, Date.now() - simHandle.startTime < 250 ? 250 : 0);

	return emitter;
};