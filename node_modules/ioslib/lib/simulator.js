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
	magik = require('./utilities').magik,
	fs = require('fs'),
	path = require('path'),
	plist = require('simple-plist'),
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
function SimulatorCrash(crashFile, crash) {
	this.name = 'SimulatorCrash';
	this.message = __('App crashed in the iOS Simulator');
	this.file = crashFile;
	this.report = crash;
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
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
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

			var xcodeIds = Object.keys(xcodeInfo.xcode).filter(function (ver) { return xcodeInfo.xcode[ver].supported; }).sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; }),
				retinaRegExp = /^iPad 2$/i,
				tallRegExp = /^(.*iPad.*|iPhone 4s?)$/i,
				_64bitRegExp = /^(iPhone (4|4s|5)|iPad 2|iPad Retina)$/i;

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

				appc.subprocess.run(iossim, ['show-simulators', '--xcode-dir', xc.path], function (code, out, err) {
					if (code) {
						return next();
					}

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
									'supportsWatch': !!sim.supportsWatch,
									'xcode': xc.version,
									'xcodePath': xc.path,
									'app': path.join(xc.path, 'Applications', 'iOS Simulator.app'),
									'systemLog': path.join(sim.logpath, 'system.log'),
									'logPaths': [
										appc.fs.resolvePath('~/Library/Developer/CoreSimulator/Devices/' + sim.udid + '/data/Applications'),
										appc.fs.resolvePath('~/Library/Developer/CoreSimulator/Devices/' + sim.udid + '/data/Containers/Data/Application')
									]
								});
							}

							results.simulators[sim.version].sort(simSort);
						});
					} catch (ex) {}

					next();
				});
			}, function () {
				cache = results;
				emitter.emit('detected', results);
				callback(null, results);
			});
		});
	});
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
 * @param {String} [options.externalDisplayType] - The type of external display to show. This is mostly used for watch apps. Possible values are `watch-regular`, `watch-compact`, and `carplay`.
 * @param {Boolean} [options.focus=true] - Focus the iOS Simulator after launching. Overrides the "hide" option.
 * @param {Boolean} [options.hide=false] - Hide the iOS Simulator after launching. Useful for testing. Ignored if "focus" option is set to true.
 * @param {Boolean} [options.killIfRunning=false] - Kill the iOS Simulator if already running.
 * @param {String} [options.launchBundleId] - Launches a specific app when the simulator loads. When installing an app, defaults to the app's id unless `launchWatchApp` is set to true.
 * @param {Boolean} [options.launchWatchApp=false] - When true, launches the specified app's watch extension on an external display.
 * @param {String} [options.logFilename] - The name of the log file to search for in the iOS Simulator's "Documents" folder. This file is created after the app is started.
 * @param {String} [options.simType=iphone] - The type of simulator to launch. Must be either "iphone" or "ipad". Only applicable when udid is not specified.
 * @param {String} [options.simVersion] - The iOS version to boot. Defaults to the most recent version.
 * @param {Number} [options.timeout=30] - Number of seconds to wait for the simulator to launch and launch the app before timing out. Defaults to 30. Minimum of 1 second. Ignored if not installing an app.
 * @param {String} [options.watchLaunchMode] - The mode of the watch app to launch. This is used for watch apps. Possible values are `main`, `glance`, and `notification`. When set to `notification`, requires `watchNotificationPayload` to be set.
 * @param {String} [options.watchNotificationPayload] - A path to a file containing the notification payload when `watchLaunchMode` is set to `notification`.
 * @param {Function} [callback(err, simHandle)] - A function to call when the simulator has launched.
 *
 * @emits module:simulator#app-quit
 * @emits module:simulator#app-started
 * @emits module:simulator#error
 * @emits module:simulator#launched
 * @emits module:simulator#log
 * @emits module:simulator#log-debug
 * @emits module:simulator#log-file
 * @emits module:simulator#log-raw
 * @emits module:simulator#timeout
 *
 * @returns {EventEmitter}
 */
function launch(udid, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!options.appPath && options.launchWatchApp) {
			var err = new Error(__('You must specify an appPath when launchWatchApp is true.'));
			emitter.emit('error', err);
			return callback(err);
		}

		// detect xcodes
		xcode.detect(options, function (err, xcodeInfo) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			// detect the simulators
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
						err = new Error(__('Unable to find an iOS Simulator with the UDID "%s".', options.udid));
					} else if (options.launchWatchApp && !simHandle.supportsWatch) {
						err = new Error(__('Selected iOS Simulator with the UDID "%s" does not support watch extensions.', options.udid));
					}
				} else {
					// pick one
					var xcodeIds = Object
						.keys(xcodeInfo.xcode)
						.filter(function (ver) { return xcodeInfo.xcode[ver].supported; })
						.sort(function (a, b) { return !xcodeInfo.xcode[a].selected || a > b; });

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
										// lastly, if we're installing a watch extension, make sure we pick a simulator that supports the watch
										if (!options.appPath || !options.launchWatchApp || sims[k].supportsWatch) {
											simHandle = sims[k];
										}
									}
								}
							}
						}
					}

					if (!simHandle) {
						// user experience!
						if (options.simVersion) {
							err = new Error(__('Unable to find an iOS Simulator running iOS %s.', options.simVersion));
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
								emitter.emit('log-debug', __('Removing old log file: %s', file));
								fs.unlinkSync(file);
							}
						});
					});
				}

				function getCrashes() {
					if (fs.existsSync(simInfo.crashDir)) {
						return fs.readdirSync(simInfo.crashDir).filter(function (n) { return path.extname(n) === '.crash'; });
					}
					return [];
				}

				function launchSim() {
					var existingCrashes = getCrashes(),
						simProcess,
						appName = options.appName || (options.appPath ? path.basename(options.appPath) : null),
						findLogTimer = null,
						tail,
						args = [
							'launch',
							'--udid', simHandle.udid,
							'--verbose',
							'--kill-sim-on-error',
							'--xcode-dir', simHandle.xcodePath,
							'--timeout', ~~options.timeout || 30
						];

					options.appPath        && args.push('--install-app', options.appPath);
					options.launchBundleId && args.push('--launch-bundle-id', options.launchBundleId);
					if (options.launchWatchApp) {
						args.push('--launch-watch-app');
						options.externalDisplayType && args.push('--external-display-type', options.externalDisplayType);
						if (options.watchLaunchMode) {
							args.push('--watch-launch-mode', options.watchLaunchMode);
							if (options.watchLaunchMode === 'notification' && options.watchNotificationPayload) {
								if (!fs.existsSync(options.watchNotificationPayload)) {
									var err = new Error(__('Watch notification payload file does not exist: %s', options.watchNotificationPayload));
									emitter.emit('error', err);
									return callback(err);
								}
								args.push('--watch-notification-payload', options.watchNotificationPayload);
							}
						}
					}

					simProcess = spawn(iossim, args),

					emitter.emit('log-debug', __('Executing: %s', iossim + ' "' + args.map(function (a) { return a && typeof a === 'string' ? a.replace(/ /g, '\ ') : a; }).join('" "') + '"'));

					// listen for ios-sim output
					simProcess.stderr.on('data', function (data) {
						var output = data.toString().trim();
						output.split('\n').forEach(function (line) {
							emitter.emit('log-debug', '[ios-sim] ' + line);
						});
						if (output.indexOf('Simulator started successfully') !== -1) {
							emitter.emit('launched', simHandle);
						} else if (output.indexOf('App launched successfully') !== -1) {
							emitter.emit('app-started', simHandle);
						}
					});

					if (appName) {
						var autoExitToken = options.autoExitToken || 'AUTO_EXIT',
							logRegExp = new RegExp(appName.replace(/\.app$/, '') + '\\[\\w+\\:\\w+\\]\\s+(.*)$');

						// listen for NSLog() output
						simProcess.stdout.on('data', function (data) {
							var exit = false,
								output = data.toString().trim();
							output.split('\n').forEach(function (line) {
								emitter.emit('log-debug', '[ios-sim] ' + line);
							});
							output.split('\n').forEach(function (line) {
								emitter.emit('log-raw', line);

								var m = line.match(logRegExp);
								m && emitter.emit('log', m[1]);

								if (options.autoExit && line.indexOf(autoExitToken) !== -1) {
									exit = true;
								}
							});
							exit && stop(simHandle);
						});
					} else {
						// when not installing an app, there should be no output on stdout, so just
						// gobble up the bytes just in case
						simProcess.stdout.on('data', function (data) {});
					}

					simProcess.on('close', function (code, signal) {
						// stop looking for the log file
						clearTimeout(findLogTimer);

						tail && process.nextTick(function () {
							tail && tail.unwatch();
							tail = null;
						});

						// wait 100ms for the potential crash log to be written
						setTimeout(function () {
							// did we crash?
							var crashes = getCrashes(),
								diffCrashes = crashes.filter(function (file) {
									return existingCrashes.indexOf(file) === -1;
								}).sort();

							if (diffCrashes.length) {
								// when a crash occurs, we need to provide the plist crash information as a result object
								var crashFile = path.join(simInfo.crashDir, diffCrashes.pop()),
									crash = fs.readFileSync(crashFile).toString();

								emitter.emit('log-debug', '[ios-sim] ' + __('Application crashed: %s', crashFile));
								emitter.emit('app-quit', new SimulatorCrash(crashFile, crash));
							} else {
								emitter.emit('log-debug', '[ios-sim] ' + __('Exited with code: %s', code));
								emitter.emit('app-quit', code);
							}
						}, 1000);
					});

					if ((options.focus === undefined && !options.hide && !options.autoExit) || options.focus) {
						// focus the simulator
						emitter.emit('log-debug', __('Executing: %s', 'osascript "' + path.join(__dirname, 'iphone_sim_activate.scpt') + '" "' + simHandle.app + '"'));
						appc.subprocess.run('osascript', [ path.join(__dirname, 'iphone_sim_activate.scpt'), simHandle.app ], function () {});
					} else if (options.hide || options.autoExit) {
						emitter.emit('log-debug', __('Executing: %s', 'osascript "' + path.join(__dirname, 'iphone_sim_hide.scpt') + '" "' + simHandle.app + '"'));
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
											emitter.emit('log-debug', __('Found application log file: %s', file));
											tail = new Tail(file, '\n', { interval: 500 } );
											tail.on('line', function (msg) {
												emitter.emit('log-file', msg);
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

					simHandle.running = true;
					callback(null, simHandle);
				} // end of launchSim()

				if (options.killIfRunning) {
					stop(simHandle, launchSim);
				} else {
					launchSim();
				}
			});
		});
	});
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
	return magik(null, callback, function (emitter, options, callback) {
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
	});
};