/**
 * @overview
 * Library for controlling an Android Emulator.
 *
 * @module lib/emulator
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var android = require('./android'),
	appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	ADB = require('./adb'),
	async = require('async'),
	events = require('events'),
	fs = require('fs'),
	path = require('path'),
	util = require('util');

module.exports = EmulatorManager;

/**
 * Creates an Emulator instace.
 * @class
 * @extends EventEmitter
 * @classdesc Simple object that contains the avd settings and exposes event
 * methods.
 * @constructor
 */
function Emulator() {}
util.inherits(EmulatorManager.Emulator = Emulator, events.EventEmitter);

/**
 * Creates an EmulatorManager instance.
 * @class
 * @classdesc Manages emulator implementations and responsible for launching and
 * killing emulators.
 * @constructor
 * @param {Object} config - The CLI config object
 */
function EmulatorManager(config) {
	this.config = config;
}

/**
 * Loads emulator implementation modules and detects all available emulators.
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} callback - A function to call when the detection has completed
 */
EmulatorManager.prototype.detect = function detect(opts, callback) {
	if (opts && typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	var files = opts && opts.type ? [ opts.type + '.js' ] : fs.readdirSync(path.join(__dirname, 'emulators')),
		re = /\.js$/,
		config = this.config;

	async.parallel(files.map(function (filename) {
		return function (next) {
			var file = path.join(__dirname, 'emulators', filename);
			if (re.test(filename) && fs.existsSync(file)) {
				var module = require(file);
				if (typeof module.detect == 'function') {
					module.detect(config, opts, next);
					return;
				}
			}
			next();
		};
	}), function (err, results) {
		if (err) {
			return callback(err);
		}

		android.detect(this.config, opts, function (androidEnv) {
			var ver2api = {},
				emus = [];

			Object.keys(androidEnv.targets).forEach(function (id) {
				if (androidEnv.targets[id].type === 'platform') {
					ver2api[androidEnv.targets[id].version] = androidEnv.targets[id].sdk;
				}
			});

			results.forEach(function (r) {
				if (r && Array.isArray(r.avds)) {
					r.avds.forEach(function (avd) {
						avd['api-level'] = ver2api[avd['sdk-version']] || null;
						emus.push(avd);
					});
				}
			});

			opts.logger && opts.logger.trace(__('Found %s emulators', String(emus.length).cyan));
			callback(null, emus);
		});
	}.bind(this));
};

/**
 * Detects if a specific Android emulator is running.
 * @param {String} name - The name of the emulator
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} callback - A function to call when the detection has completed
 */
EmulatorManager.prototype.isRunning = function isRunning(name, opts, callback) {
	if (opts && typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	opts.logger && opts.logger.trace(__('Detecting if %s exists...', name.cyan));

	this.detect(opts, function (err, emus) {
		if (err) return callback(err);

		var emu = emus.filter(function (e) {
			return e && e.name == name;
		}).shift();

		if (!emu) return callback(new Error(__('Invalid emulator "%s"', name)), null);

		opts.logger && opts.logger.trace(__('Emulator exists, detecting all running emulators and connected devices...'));

		// need to see if the emulator is running
		var adb = new ADB(this.config);
		adb.devices(function (err, devices) {
			if (err) return callback(err);

			opts.logger && opts.logger.trace(__('Detected %s running emulators and connected devices', String(devices.length).cyan));

			// if there are no devices, then it can't possibly be running
			if (!devices.length) return callback(null, null);

			opts.logger && opts.logger.trace(__("Checking %s devices to see if it's the emulator we want", String(devices.length).cyan));

			require(path.join(__dirname, 'emulators', emu.type + '.js')).isRunning(this.config, emu, devices, function (err, device) {
				if (err) {
					opts.logger && opts.logger.trace(__('Failed to check if the emulator was running: %s', err));
				} else if (device) {
					opts.logger && opts.logger.trace(__('The emulator is running'));
				} else {
					opts.logger && opts.logger.trace(__('The emulator is NOT running'));
				}
				callback(err, device);
			});
		}.bind(this));
	}.bind(this));
};

/**
 * Determines if the specified "device name" is an emulator or a device.
 * @param {String} device - The name of the device returned from 'adb devices'
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} callback - A function to call when the detection has completed
 */
EmulatorManager.prototype.isEmulator = function isEmulator(device, opts, callback) {
	if (opts && typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	var files = opts && opts.type ? [ opts.type + '.js' ] : fs.readdirSync(path.join(__dirname, 'emulators')),
		re = /\.js$/,
		config = this.config;

	async.parallel(files.map(function (filename) {
		return function (next) {
			var file = path.join(__dirname, 'emulators', filename);
			if (re.test(filename) && fs.existsSync(file)) {
				var module = require(file);
				if (typeof module.isEmulator == 'function') {
					module.isEmulator(config, device, next);
					return;
				}
			}
			next();
		};
	}), function (err, results) {
		if (err) {
			callback(new Error(__('Unable to find device "%s"', device)));
		} else {
			callback(null, results.filter(function (n) { return n; }).shift());
		}
	});
};

function checkedBooted(config, opts, emulator) {
	// we need to get the id of emulator
	var adb = new ADB(config),
		retryTimeout = 2000, // if an adb call fails, how long before we retry
		bootTimeout = opts.bootTimeout || 240000, // 4 minutes to boot before timeout
		// if a timeout is set and the emulator doesn't boot quick enough, fire the timeout event,
		// however if the timeout is zero, still listen for the timeout to kill the whilst loop above
		bootTimer = setTimeout(function () {
			opts.logger && opts.logger.trace(__('Timed out while waiting for the emulator to boot; waited %s ms', bootTimeout));
			conn && conn.end();
			bootTimeout && emulator.emit('timeout', { type: 'emulator', waited: bootTimeout });
		}, bootTimeout),
		sdcardTimeout = opts.sdcardTimeout || 60000, // 1 minute to boot before timeout
		sdcardTimer,
		conn,
		deviceId,
		emu = emulator.emulator,
		emulib = require(path.join(__dirname, 'emulators', emu.type + '.js')),
		devicesCache;

	opts.logger && opts.logger.trace(__('Checking the boot state for the next %s ms', bootTimeout));
	opts.logger && opts.logger.trace(__('Waiting for emulator to register with ADB'));

	conn = adb.trackDevices(function (err, devices) {
		if (err || !devices.length) {
			opts.logger && opts.logger.trace(__('No devices found, continuing to wait'));
			return;
		}

		// just in case we get any extra events but we already have the deviceId, just return
		if (deviceId) return;

		opts.logger && opts.logger.trace(__('Found %s devices, checking if any of them are the emulator...', devices.length));

		emulib.isRunning(config, emu, devices, function (err, running) {
			if (err) {
				// TODO: this could be bad... maybe we should emit an error event?
				opts.logger && opts.logger.trace(__('Error checking if emulator is running: %s', err));
			} else if (!running) {
				// try again
				opts.logger && opts.logger.trace(__('Emulator not running yet, continuing to wait'));
			} else {
				// running!
				opts.logger && opts.logger.trace(__('Emulator is running!'));
				appc.util.mix(emulator, running);
				deviceId = running.id;
				conn.end(); // no need to track devices anymore

				// keep polling until the boot animation has finished
				opts.logger && opts.logger.trace(__('Checking if boot animation has finished...'));
				(function checkBootAnim() {
					// emulator is running, now shell into it and check if it has booted
					adb.shell(deviceId, 'getprop init.svc.bootanim', function (err, output) {
						if (!err && output.toString().split('\n').shift().trim() == 'stopped') {
							clearTimeout(bootTimer);
							opts.logger && opts.logger.trace(__('Emulator is booted, emitting booted event'));
							emulator.emit('booted', emulator);
						} else {
							opts.logger && opts.logger.trace(__('Emulator is not booted yet; checking again in %s ms', retryTimeout));
							setTimeout(checkBootAnim, retryTimeout);
						}
					});
				})();
			}
		});
	});

	emulator.on('booted', function () {
		var done = false;

		opts.logger && opts.logger.info(__('Emulator is booted'));

		if (!opts.checkMounts || !emu.sdcard) {
			// nothing to do, fire ready event
			opts.logger && opts.logger.info(__('SD card not required, skipping mount check'));
			emulator.emit('ready', emulator);
			return;
		}

		opts.logger && opts.logger.info(__('Checking if SD card is mounted'));

		// keep polling /sdcard until it's mounted
		async.whilst(
			function () { return !done; },

			function (cb) {
				// emulator is running, now shell into it and check if it has booted
				adb.shell(deviceId, 'cd /sdcard && echo "SDCARD READY"', function (err, output) {
					if (!err && output.toString().split('\n').shift().trim() == 'SDCARD READY') {
						done = true;
						cb();
					} else {
						setTimeout(cb, retryTimeout);
					}
				});
			}.bind(this),

			function () {
				var mounted = false,
					mountPoints = [ '/sdcard', '/mnt/sdcard' ];

				adb.shell(deviceId, 'ls -l /sdcard', function (err, output) {
					if (!err) {
						var m = output.toString().trim().split('\n').shift().trim().match(/\-\> (\S+)/);
						if (m && mountPoints.indexOf(m[1]) == -1) {
							mountPoints.unshift(m[1]);
						}
					}

					opts.logger && opts.logger.debug(__('Checking mount points: %s', mountPoints.join(', ').cyan));

					// wait for the sd card to be mounted
					async.whilst(
						function () { return !mounted; },

						function (cb) {
							adb.shell(deviceId, 'mount', function (err, output) {
								if (!err && output.toString().trim().split('\n').some(function (line) {
									var parts = line.trim().split(' ');
									return parts.length > 1 && mountPoints.indexOf(parts[1]) != -1;
								})) {
									mounted = true;
									clearTimeout(sdcardTimer);
									opts.logger && opts.logger.debug(__('SD card is mounted'));
									cb();
								} else {
									setTimeout(cb, retryTimeout);
								}
							});
						},

						function () {
							// requery the devices since device state may have changed
							adb.devices(function (err, devices) {
								emulib.isRunning(config, emu, devices.filter(function (d) { return d.id = emulator.id; }), function (err, running) {
									if (!err && running) {
										appc.util.mix(emulator, running);
									}
									emulator.emit('ready', emulator);
								});
							});
						}
					);
				});
			}
		);

		sdcardTimer = setTimeout(function () {
			sdcardTimeout && emulator.emit('timeout', { type: 'sdcard', waited: sdcardTimeout });
			done = true;
		}, sdcardTimeout || 30000);
	});
}

/**
 * Starts the specified emulator, if not already running.
 * @param {String} name - The name of the emulator
 * @param {Object} [opts] - Options for detection and launching the emulator
 * @param {Function} callback - A function to call when the emulator as launched
 */
EmulatorManager.prototype.start = function start(name, opts, callback) {
	if (opts && typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	opts.logger && opts.logger.trace(__('Checking if emulator %s is running...', name.cyan));

	this.isRunning(name, opts, function (err, running) {
		if (err) {
			// something went boom
			return callback(err);
		}

		if (running) {
			// already running
			var emulator = new Emulator;
			appc.util.mix(emulator, running);
			opts.logger && opts.logger.info(__('Emulator already running'));
			checkedBooted(this.config, opts, emulator);
			callback(null, emulator);
			return;
		}

		opts.logger && opts.logger.trace(__('Emulator not running, detecting running emulators'));

		// not running, start the emulator
		this.detect(opts, function (err, emus) {
			if (err) {
				return callback(err);
			}

			var emu = emus.filter(function (e) {
				return e && e.name == name;
			}).shift();

			// this should never happen because it would have happened already thanks to isRunning()
			if (!emu) return callback(new Error(__('Invalid emulator "%s"', name)), null);

			opts.logger && opts.logger.trace(__('Starting the emulator...'));

			var emulib = require(path.join(__dirname, 'emulators', emu.type + '.js'));
			emulib.start(this.config, emu, opts, function (err, emulator) {
				if (err) {
					callback(err);
				} else {
					// give the emulator a second to get started before we start beating up adb
					opts.logger && opts.logger.trace(__('Emulator is starting, monitoring boot state...'));
					checkedBooted(this.config, opts, emulator);
					callback(null, emulator);
				}
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

/**
 * Stops the specified emulator, if running.
 * @param {String} name - The name of the emulator
 * @param {Object} [opts] - Options for detection and killing the emulator
 * @param {Function} callback - A function to call when the emulator as been killed
 */
EmulatorManager.prototype.stop = function stop(name, opts, callback) {
	if (opts && typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	this.isRunning(name, opts, function (err, running) {
		if (err) {
			// something went boom
			callback(err);
		} else if (!running) {
			// already stopped
			callback(new Error(__('Emulator "%s" not running', name)));
		} else {
			require(path.join(__dirname, 'emulators', running.emulator.type + '.js')).stop(this.config, name, running, opts, callback);
		}
	}.bind(this));
};
