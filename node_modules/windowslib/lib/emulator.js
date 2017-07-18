/**
 * Detects Windows Phone emulators.
 *
 * @module emulator
 *
 * @copyright
 * Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	env = require('./env'),
	fs = require('fs'),
	magik = require('./utilities').magik,
	path = require('path'),
	proc = require('./process'),
	spawn = require('child_process').spawn,
	windowsphone = require('./windowsphone'),
	wptool = require('./wptool'),
	__ = appc.i18n(__dirname).__;

var cache;

exports.detect = detect;
exports.isRunning = isRunning;
exports.launch = launch;
exports.install = install;
exports.stop = stop;
exports.status = status;

/**
 * Detects connected Windows Phone emulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Windows Phone emulators.
 * @param {Function} [callback(err, results)] - A function to call with the emulator information.
 *
 * @emits module:emulator#detected
 * @emits module:emulator#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		wptool.enumerate(options, function (err, results) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var result = {
				emulators: {},
				issues: []
			};

			if (!err) {
				Object.keys(results).forEach(function (wpsdk) {
					result.emulators[wpsdk] = results[wpsdk].emulators;
				});

				cache = result;
			}

			emitter.emit('detected', result);
			callback(null, result);
		});
	});
}

/**
 * Detects if the specified emulator is running.
 *
 * @param {String} udid - The UDID of the Windows Phone emulator to check if running.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Windows Phone emulators.
 * @param {String} [options.powershell] - Path to the 'powershell' executable.
 * @param {Function} [callback(err, results)] - A function to call with the emulator information.
 *
 * @emits module:emulator#detected
 * @emits module:emulator#error
 *
 * @returns {EventEmitter}
 */
function isRunning(udid, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		env.detect(options)
			.on('error', function (err) {
				emitter.emit('error', err);
				callback(err);
			})
			.on('detected', function (results) {

				detect(options)
					.on('error', function (err) {
						emitter.emit('error', err);
						callback(err);
					})
					.on('detected', function (results) {
						var emu;
						// find the emulator
						function testDev(d) {
							if (d.udid == udid) { // this MUST be == because the udid might be a number and not a string
								emu = d;
								return true;
							}
						};
						Object.keys(results.emulators).some(function (wpsdk) {
							return results.emulators[wpsdk].some(testDev);
						});

						if (!emu) {
							var err = new Error(__('Invalid udid "%s"', udid));
							emitter.emit('error', err);
							return callback(err);
						}

						appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'wp_emulator_status.ps1'), function (err, script) {
							if (err) {
								emitter.emit('error', err);
								return callback(err);
							}

							appc.subprocess.run(options.powershell || 'powershell', [
								'-ExecutionPolicy', 'Bypass', '-NoLogo', '-NonInteractive', '-NoProfile',
								'-File',
								script
							], function (code, out, err) {
								if (code) {
									var err = new Error(__('Failed to detect running emulators'));
									emitter.emit('error', err);
									return callback(err);
								}

								var re = new RegExp('^' + emu.name + '\\..*(\\d+)(?:\\s+\\d+)$', 'i'),
									match = out.trim().split(/\r\n|\n/).map(function (line) {
										line = line.trim();
										return line && line.match(re);
									}).filter(function (m) { return !!m; }).shift(),
									running = match && ~~match[1] === 2 || false;

								emitter.emit('running', running);
								callback(null, running);
							});
						});
					});
			});
	});
}

/**
 * Launches the specified Windows Phone emulator or picks one automatically.
 *
 * @param {String} udid - The UDID of the Windows Phone emulator to launch or null if you want windowslib to pick one.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appPath] - The path to the Windows Phone app to install after launching the Windows Phone Emulator.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all emulators.
 * @param {Boolean} [options.killIfRunning=false] - Kill the Windows Phone emulator if already running.
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
 * @param {Boolean} [options.skipLaunch] - Whether we should just install without launching.
 * @param {Boolean} [options.tasklist] - The path to the 'tasklist' executable.
 * @param {Number} [options.timeout] - Number of milliseconds to wait for the emulator to launch and launch the app before timing out. Must be at least 1 millisecond.
 * @param {String} options.wpsdk - A specific Windows Phone version to query.
 * @param {Function} [callback(err, emuHandle)] - A function to call when the emulator has launched.
 *
 * @emits module:emulator#error
 * @emits module:emulator#launched
 * @emits module:emulator#timeout
 *
 * @returns {EventEmitter}
 */
function launch(udid, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		// detect emulators
		detect(options, function (err, emuInfo) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var emuHandle;

			if (udid) {
				// validate the udid
				Object.keys(emuInfo.emulators).filter(function (wpsdk) {
					return !options.wpsdk || wpsdk === options.wpsdk;
				}).some(function (wpsdk) {
					return emuInfo.emulators[wpsdk].some(function (emu) {
						if (emu.udid === udid) {
							emuHandle = appc.util.mix({}, emu);
							return true;
						}
					});
				});

				if (!emuHandle) {
					err = new Error(__('Unable to find an Windows Phone emulator with the UDID "%s"', udid));
				}
			} else {
				Object.keys(emuInfo.emulators).filter(function (wpsdk) {
					return !options.wpsdk || wpsdk === options.wpsdk;
				}).some(function (wpsdk) {
					if (emuInfo.emulators[wpsdk].length) {
						emuHandle = appc.util.mix({}, emuInfo.emulators[wpsdk][0]);
						return true;
					}
				});

				if (!emuHandle) {
					// user experience!
					if (options.wpsdk) {
						err = new Error(__('Unable to find an Windows Phone %s emulator.', options.wpsdk));
					} else {
						err = new Error(__('Unable to find an Windows Phone emulator.'));
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

			emuHandle.startTime = Date.now();
			emuHandle.running = false;

			function launchEmulator() {
				var timeout = options.timeout !== void 0 && Math.max(~~options.timeout, 1); // minimum of 1 millisecond
				if (options.appPath) {
					var mixedOptions = appc.util.mix({timeout: timeout}, options);
					wptool.install(emuHandle, options.appPath, mixedOptions)
					.on('error', function (err) {
						emitter.emit('error', err);
						callback(err);
					}).on('installed', function () {
						emuHandle.running = true;
						emitter.emit('installed', emuHandle);
						// If we're not going to launch, this is the end of the lifecycle here.
						if (mixedOptions.skipLaunch) {
							callback(null, emuHandle);
						}
					}).on('launched', function () {
						emitter.emit('launched', emuHandle);
						// Don't do callback until we launch if we're supposed to be launching
						if (!mixedOptions.skipLaunch) {
							callback(null, emuHandle);
						}
					}).on('timeout', function (err) {
						err || (err = new Error(__('Timed out after %d milliseconds waiting to launch the emulator.', timeout)));
						emitter.emit('timeout', err);
						callback(err);
					});
				} else {
					// not installing an app, just launch the emulator
					wptool.connect(emuHandle.udid, {
						timeout: timeout
					}).on('error', function (err) {
						emitter.emit('error', err);
						callback(err);
					}).on('connected', function (emu) {
						emuHandle.ip = emu.ip; // copy IP address we got from connecting
						emuHandle.running = emu.running || true;
						emitter.emit('launched', emuHandle);
						callback(null, emuHandle);
					}).on('timeout', function (err) {
						err || (err = new Error(__('Timed out after %d milliseconds waiting to launch the emulator.', timeout)));
						emitter.emit('timeout', err);
						callback(err);
					});
				}
			}

			if (options.killIfRunning) {
				stop(emuHandle, options, launchEmulator);
			} else {
				launchEmulator();
			}
		});
	});
}

/**
 * Installs the specified app to an Windows Phone emulator. If the emulator is not running, it will launch it.
 *
 * @param {String} udid - The UDID of the emulator to install the app to or null if you want windowslib to pick one.
 * @param {String} appPath - The path to the Windows Phone app to install.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the environment configuration.
 * @param {Boolean} [options.skipLaunch=false] - When true, only installs the app, does not attempt to launch it.
 * @param {Number} [options.timeout] - Number of milliseconds to wait before timing out.
 * @param {Function} [callback(err)] - A function to call when the app is installed. To know when the app gets launched, hook an event listener for 'launched' event
 *
 * @emits module:emulator#error
 * @emits module:emulator#installed
 * @emits module:emulator#launched
 *
 * @returns {EventEmitter}
 */
function install(udid, appPath, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!appPath) {
			var err = new Error(__('Missing app path argument'));
			emitter.emit('error', err);
			return callback(err);
		}

		var launchEmitter = launch(udid, appc.util.mix({
				appPath: appPath
			}, options), callback),
			oldEmit = launchEmitter.emit;

		launchEmitter.emit = function () {
			oldEmit.apply(launchEmitter, arguments);
			emitter.emit.apply(emitter, arguments);
		};
	});
}

/**
 * Stops the specified Windows Phone emulator.
 *
 * @param {Object} emuHandle - The emulator handle.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell] - Path to the 'powershell' executable.
 * @param {Boolean} [options.tasklist] - The path to the 'tasklist' executable.
 * @param {Function} [callback(err)] - A function to call when the emulator has quit.
 *
 * @emits module:emulator#error
 * @emits module:emulator#stopped
 *
 * @returns {EventEmitter}
 */
function stop(emuHandle, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!emuHandle || typeof emuHandle !== 'object') {
			var err = new Error(__('Invalid emulator handle argument'));
			emitter.emit('error', err);
			return callback(err);
		}

		// make sure the Windows Phone emulator has had some time to launch the emulator
		setTimeout(function () {
			proc.list(options, function (err, processes) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}

				appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'wp_stop_emulator.ps1'), function (err, psScript) {
					if (err) {
						emitter.emit('error', err);
						return callback(err);
					}

					var xdeRegExp = /^xde\.exe$/i,
						name = emuHandle.name.toLowerCase();

					async.eachSeries(processes, function (p, next) {
						if (xdeRegExp.test(p.name) && p.title.toLowerCase() === name) {
							// first kill the emulator
							process.kill(p.pid, 'SIGKILL'); // FIXME If we get ESRCH, can we assume the process died on it's own?

							setTimeout(function () {
								// next get hyper-v to think the emulator is not running
								appc.subprocess.run(options.powershell || 'powershell', [
									'-ExecutionPolicy', 'Bypass', '-NoLogo', '-NonInteractive', '-NoProfile',
									'-File',
									psScript,
									'"' + emuHandle.name + '"'
								], function (code, out, err) {
									try {
										if (!code) {
											var r = JSON.parse(out);
											if (r.success) {
												return next();
											}
										}
									} catch (e) {}
									next(new Error('Failed to stop emulator'));
								});
							}, 1000);
						} else {
							next();
						}
					}, function () {
						emuHandle.running = false;
						emitter.emit('stopped');
						callback();
					});
				});
			});
		}, Date.now() - emuHandle.startTime < 250 ? 250 : 0);
	});
}

/**
 * Retrieves the status of the specified Windows Phone emulator.
 *
 * @param {Object} emuHandle - The emulator handle.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell] - Path to the 'powershell' executable.
 * @param {Boolean} [options.tasklist] - The path to the 'tasklist' executable.
 * @param {Function} [callback(err)] - A function to call when the emulator has quit.
 *
 * @returns {EventEmitter}
 */
function status(emuHandle, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (!emuHandle || typeof emuHandle !== 'object') {
			var err = new Error(__('Invalid emulator handle argument'));
			emitter.emit('error', err);
			return callback(err);
		}

		appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'wp_emulator_enabledstate.ps1'), function (err, psScript) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			// next get hyper-v to think the emulator is not running
			appc.subprocess.run(options.powershell || 'powershell', [
				'-ExecutionPolicy', 'Bypass', '-NoLogo', '-NonInteractive', '-NoProfile',
				'-File',
				psScript,
				emuHandle.name
			], function (code, out, err) {
				try {
					if (!code) {
						var result = JSON.parse(out);
						if (result.success) {
							return callback(null, result.state);
						} else {
							return callback(result.message);
						}
					}
				} catch (e) {}
				callback(new Error('Failed to retrieve emulator status'));
			});
		});
	});
}
