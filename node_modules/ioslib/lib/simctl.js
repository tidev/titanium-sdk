/**
 * A wrapper around Xcode's `simctl` command line program.
 *
 * @module simctl
 *
 * @copyright
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc');
const async = require('async');
const debug = require('debug');
const path = require('path');
const fs = require('fs');
const __ = appc.i18n(__dirname).__;

exports.activatePair = activatePair;
exports.create = create;
exports.getSim = getSim;
exports.install = install;
exports.launch = launch;
exports.list = list;
exports.pair = pair;
exports.pairAndActivate = pairAndActivate;
exports.shutdown = shutdown;
exports.uninstall = uninstall;
exports.unpair = unpair;
exports.waitUntilBooted = waitUntilBooted;

const log = debug('ioslib:simctl');

/**
 * Activates an existing device pair.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.udid - The pair udid to activate.
 * @param {Function} callback(err) - A function to call when finished.
 */
function activatePair(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}

	trySimctl(params, ['pair_activate', params.udid], function (err) {
		// code 37 means the pair is already active
		callback(err && err.code !== 37 ? new Error(__('Failed to activate pair: %s', err.message)) : null);
	});
}

/**
 * Creates a new simulator.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.deviceType - The device type to use such as
 * `com.apple.CoreSimulator.SimDeviceType.iPhone-7-Plus`.
 * @param {String} params.name - The name of the simulator.
 * @param {String} params.runtime - The runtime to use such as
 * `com.apple.CoreSimulator.SimRuntime.iOS-10-2`.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Function} callback(err, udid) - A function to call when finished.
 */
function create(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.name) {
		return callback(new Error(__('Missing "name" param')));
	}
	if (!params.deviceType) {
		return callback(new Error(__('Missing "deviceType" param')));
	}
	if (!params.runtime) {
		return callback(new Error(__('Missing "runtime" param')));
	}

	trySimctl(params, ['create', params.name, params.deviceType, params.runtime], function (err, output) {
		if (err) {
			return callback(err);
		}
		callback(null, output.split('\n').shift().trim());
	});
}

/**
 * Installs an app in the specified simulator. Simulator must be running.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.appPath - The full path to the `.app` directory.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.udid - The simulator udid to install the app on.
 * @param {Function} callback(err) - A function to call when finished.
 */
function install(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}
	if (!params.appPath) {
		return callback(new Error(__('Missing "appPath" param')));
	}

	trySimctl(params, ['install', params.udid, params.appPath], callback);
}

/**
 * Launches an app in the specified simulator. Simulator must be running.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.appId - The id of the app to launch.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.udid - The simulator udid to launch the app on.
 * @param {Function} callback(err) - A function to call when finished.
 */
function launch(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}
	if (!params.appId) {
		return callback(new Error(__('Missing "appId" param')));
	}

	trySimctl(params, ['launch', params.udid, params.appId], callback);
}

/**
 * Returns a list of all devices, runtimes, device types, and pairs.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {Function} callback(err, info) - A function to call when finished.
 */
function list(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}

	var done = false;
	var tries = 0;
	var maxTries = params.tries || 4;

	async.whilst(
		function () {
			return !done && tries++ < maxTries;
		},
		function (cb) {
			trySimctl(params, ['list', '--json'], function (err, output) {
				if (err) {
					return cb(err);
				}

				output = output.trim();
				if (!output) {
					log('simctl list output was empty!');
					return cb();
				}

				var json = null;
				try {
					json = JSON.parse(output.substring(output.indexOf('{')));
				} catch (e) {
					return cb(e);
				}

				if (!json) {
					return cb(new Error(__('simctl list: json is null')));
				}

				// convert the pairs from <pair udid> -> (ios sim + watch sim) to <ios sim> -> <watch sims> -> <pair udid>
				json.iosSimToWatchSimToPair = {};
				Object.keys(json.pairs).forEach(function (pairUdid) {
					var pair = json.pairs[pairUdid];
					var m = pair.state.match(/^\(((?:in)?active),/);
					if (m) {
						json.iosSimToWatchSimToPair[pair.phone.udid] || (json.iosSimToWatchSimToPair[pair.phone.udid] = {});
						json.iosSimToWatchSimToPair[pair.phone.udid][pair.watch.udid] = { udid: pairUdid, active: m[1] === 'active' };
					}
				});

				done = true;
				cb(null, json);
			});
		},
		function (err, info) {
			if (err) {
				return callback(err);
			}

			if (!done) {
				return callback(new Error(__('simctl list failed after %s tries', maxTries)));
			}

			callback(null, info);
		}
	);
}

/**
 * Pairs a iOS Simulator with a watchOS Simulator.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.simUdid - The udid of the iOS Simulator.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {String} params.watchSimUdid - The udid of the watchOS Simulator.
 * @param {Function} callback(err, udid) - A function to call when finished.
 */
function pair(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.simUdid) {
		return callback(new Error(__('Missing "simUdid" param')));
	}
	if (!params.watchSimUdid) {
		return callback(new Error(__('Missing "watchSimUdid" param')));
	}

	trySimctl(params, ['pair', params.watchSimUdid, params.simUdid], function (err, output) {
		if (err) {
			var alreadyPaired = err.message.indexOf('The selected devices are already paired with each other') !== -1;
			if (err.code !== 161 || !alreadyPaired) {
				return callback(err);
			}
		} else {
			return callback(null, output.split('\n').shift().trim());
		}

		// already paired, get the udid
		log('Already paired, getting pair id');
		list(params, function (err, info) {
			if (err) {
				return callback(err);
			}

			if (!info.iosSimToWatchSimToPair[params.simUdid]) {
				return callback(new Error(__('iOS Simulator %s doesn\'t have any paired watchOS Simulators!', params.simUdid)));
			}

			var watchSim = info.iosSimToWatchSimToPair[params.simUdid][params.watchSimUdid];
			if (!watchSim) {
				return callback(new Error(__('Failed to find device pair for iOS sim %s and watchOS sim %s.', params.simUdid, params.watchSimUdid)));
			}

			var udid = watchSim.udid;
			log('Found pair id: ' + udid);
			callback(null, udid);
		});
	});
}

/**
 * Pairs a iOS Simulator with a watchOS Simulator, then activates it.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.simUdid - The udid of the iOS Simulator.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {String} params.watchSimUdid - The udid of the watchOS Simulator.
 * @param {Function} callback(err) - A function to call when finished.
 */
function pairAndActivate(params, callback) {
	pair(params, function (err, udid) {
		if (err) {
			return callback(err);
		}

		params.udid = udid;
		activatePair(params, callback);
	});
}

/**
 * Shuts down the simulator.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.udid - The udid of the simulator to shutdown.
 * @param {Function} callback(err) - A function to call when finished.
 */
function shutdown(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}

	getSim(params, function (err, sim) {
		if (err) {
			return callback(err);
		}

		if (!sim) {
			return callback(new Error(__('Unable to find Simulator %s', params.udid)));
		}

		if (sim.availability !== '(available)') {
			return callback(new Error(__('Simulator is not available')));
		}

		log('Sim state: ' + sim.state);
		if (/^shutdown|creating$/i.test(sim.state)) {
			return callback();
		}

		trySimctl(params, ['shutdown', params.udid], callback);
	});
}

/**
 * Uninstalls an app from the specified simulator. Simulator must be running.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {String} params.udid - The udid of the simulator.
 * @param {String} params.appId - The app id to uninstall.
 * @param {Function} callback(err) - A function to call when finished.
 */
function uninstall(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}
	if (!params.appId) {
		return callback(new Error(__('Missing "appId" param')));
	}

	trySimctl(params, ['uninstall', params.udid, params.appId], function (err) {
		if (err && err.code === 1) {
			// app wasn't installed
			return callback();
		}

		if (err) {
			return callback(new Error('Failed to uninstall app'));
		}

		callback();
	});
}

/**
 * Unpairs a iOS Simulator from a watchOS Simulator.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {String} params.udid - The pair udid.
 * @param {Function} callback(err) - A function to call when finished.
 */
function unpair(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}

	list(params, function (err, info) {
		if (err) {
			return callback(err);
		}

		var pair = info.pairs[params.udid];
		if (!pair) {
			// already unpaired... or invalid udid
			return callback();
		}

		trySimctl(params, ['unpair', params.udid], function (err) {
			if (err) {
				return callback(err);
			}

			// check if the unpair was successful
			list(params, function (err, info) {
				if (err) {
					return callback(err);
				}

				if (info.iosSimToWatchSimToPair[pair.phone.udid] && info.iosSimToWatchSimToPair[pair.phone.udid][pair.watch.udid]) {
					log('Unpair failed');
					err = new Error('Unable to unpair');
					err.code = 666;
				}

				callback(err);
			});
		});
	});
}

/**
 * Finds the specified simulator and returns it's state and availability.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {String} params.udid - The pair udid.
 * @param {Function} callback(err, sim) - A function to call when finished.
 */
function getSim(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}

	list(params, function (err, info) {
		if (err) {
			return callback(err);
		}

		var found = null;

		Object.keys(info.devices).some(function (type) {
			return info.devices[type].some(function (sim) {
				if (sim.udid === params.udid) {
					found = sim;
					return true;
				}
			});
		});

		callback(null, found);
	});
}

/**
 * Waits for the simulator to boot.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Number} [params.timeout] - A number of milliseconds to wait before
 * timing out and aborting.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {String} params.udid - The pair udid.
 * @param {Function} callback(err, booted) - A function to call when finished.
 */
function waitUntilBooted(params, callback) {
	if (!params || typeof params !== 'object') {
		return callback(new Error(__('Missing params')));
	}
	if (!params.simctl) {
		return callback(new Error(__('Missing "simctl" param')));
	}
	if (!params.udid) {
		return callback(new Error(__('Missing "udid" param')));
	}

	var booted = false;
	var timedOut = false;
	var tries = 0;
	var maxTries = params.tries || 4;
	var timer = null;

	log('Waiting for sim ' + params.udid + ' to boot');

	if (params.timeout) {
		timer = setTimeout(function () {
			timedOut = true;
			log('Timed out waiting for the Simulator to boot');
		}, params.timeout);
	}

	async.whilst(
		function () {
			return !booted && !timedOut;
		},
		function (cb) {
			getSim(params, function (err, sim) {
				if (err) {
					return cb(err);
				}

				if (!sim) {
					return cb(new Error(__('Unable to find Simulator %s', params.udid)));
				}

				if (sim.availability !== '(available)') {
					return cb(new Error(__('Simulator is not available')));
				}

				log('Sim state: ' + sim.state);
				if (/^booted$/i.test(sim.state)) {
					booted = true;
					clearTimeout(timer);
					return cb();
				}

				setTimeout(function () {
					cb();
				}, 500);
			});
		},
		function (err) {
			if (err) {
				return callback(err);
			}
			if (timedOut) {
				err = new Error(__('Timed out waiting for sim to boot'));
				err.code = 666;
				return callback(err);
			}
			callback(null, booted);
		}
	);
}

/**
 * Calls `simctl` in an async loop until it succeeds or hits the max number of
 * tries.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.simctl - The path to the `simctl` executable.
 * @param {Number} [params.tries] - The max number of `simctl` tries.
 * @param {Array} args - The args to pass directly into `simctl`.
 * @param {Function} callback(err) - A function to call when finished.
 */
function trySimctl(params, args, callback) {
	var done = false;
	var tries = 0;
	var maxTries = params.tries || 4;
	var timeout = 100;

	async.whilst(
		function () {
			return !done && tries++ < maxTries;
		},
		function (cb) {
			log('Running: ' + params.simctl + (Array.isArray(args) ? ' ' + args.map(function (s) { return s.indexOf(' ') !== -1 ? '"' + s + '"' : s; }).join(' ') : ''));
			appc.subprocess.run(params.simctl, args, function (code, out, err) {
				if (!code) {
					done = true;
					return cb(null, out);
				}

				err = new Error(err.trim());
				err.code = code;

				// check for pair error
				if (code === 161 || (code === 37 && err.message.indexOf('This pair is already active') !== -1)) {
					done = true;
					return cb(err);
				}

				if (err.message.indexOf('Failed to load CoreSimulatorService') !== -1) {
					log('simctl needs to switch the CoreSimulatorService, waiting a couple seconds (code ' + code + ')');
					setTimeout(function () {
						cb();
					}, 2000);
					return;
				}

				if (tries < maxTries) {
					log('simctl failed: ' + err.message);
					setTimeout(function () {
						timeout *= 2;
						log('Retrying...');
						cb();
					}, timeout);
				} else {
					log('Giving up');
					cb(err);
				}
			});
		},
		callback
	);
}
