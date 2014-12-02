/**
 * Main namespace for the ioslib.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	async = require('async'),
	EventEmitter = require('events').EventEmitter,

	certs        = exports.certs        = require('./lib/certs'),
	device       = exports.device       = require('./lib/device'),
	env          = exports.env          = require('./lib/env'),
	provisioning = exports.provisioning = require('./lib/provisioning'),
	simulator    = exports.simulator    = require('./lib/simulator'),
	xcode        = exports.xcode        = require('./lib/xcode');

var cache;

exports.detect = detect;
exports.findValidDeviceCertProfileCombos = findValidDeviceCertProfileCombos;

/**
 * Detects the entire iOS environment information.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the all iOS information.
 * @param {String} [options.minIosVersion] - The minimum iOS SDK to detect.
 * @param {String} [options.profileDir=~/Library/MobileDevice/Provisioning Profiles] - The path to search for provisioning profiles.
 * @param {String} [options.security] - Path to the <code>security</code> executable
 * @param {String} [options.supportedVersions] - A string with a version number or range to check if an Xcode install is supported.
 * @param {String} [options.type] - The type of emulators to return. Can be either "iphone" or "ipad". Defaults to all types.
 * @param {Boolean} [options.validOnly=true] - When true, only returns non-expired, valid certificates.
 * @param {String} [options.xcodeSelect] - Path to the <code>xcode-select</code> executable
 * @param {Function} [callback(err, info)] - A function to call when all detection tasks have completed.
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
		detectVersion: '3.0',
		issues: []
	};

	function mix(src, dest) {
		Object.keys(src).forEach(function (name) {
			if (Array.isArray(src[name])) {
				if (Array.isArray(dest[name])) {
					dest[name] = dest[name].concat(src[name]);
				} else {
					dest[name] = src[name];
				}
			} else if (src[name] !== null && typeof src[name] === 'object') {
				dest[name] || (dest[name] = {});
				Object.keys(src[name]).forEach(function (key) {
					dest[name][key] = src[name][key];
				});
			} else {
				dest[name] = src[name];
			}
		});
	}

	async.parallel([
		function certificates(done) {
			certs.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		},
		function devices(done) {
			device.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		},
		function environment(done) {
			env.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		},
		function provisioningProfiles(done) {
			provisioning.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		},
		function simulators(done) {
			simulator.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		},
		function xcodes(done) {
			xcode.detect(options, function (err, result) {
				err || mix(result, results);
				done(err);
			});
		}
	], function (err) {
		if (err) {
			emitter.emit('error', err);
			callback(err);
		} else {
			cache = results;
			emitter.emit('detected', results);
			callback(null, results);
		}
	});

	return emitter;
};

/**
 * Finds all valid device/cert/provisioning profile combinations. This is handy for quickly
 * finding valid parameters for building an app for an iOS device.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appId] - The app identifier (com.domain.app) to filter provisioning profiles by.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects the all iOS information.
 * @param {Function} [callback(err, info)] - A function to call when the simulator has launched.
 */
function findValidDeviceCertProfileCombos(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	// find us a device
	device.detect(function (err, deviceResults) {
		if (!deviceResults.devices.length) {
			// no devices connected
			return callback(new Error('No iOS devices connected'));
		}

		// next find us some certs
		certs.detect(function (err, certResults) {
			var certs = [];
			Object.keys(certResults.certs.keychains).forEach(function (keychain) {
				var types = certResults.certs.keychains[keychain];
				Object.keys(types).forEach(function (type) {
					certs = certs.concat(types[type]);
				});
			});

			if (!certs.length) {
				return callback(new Error('No iOS certificates'));
			}

			// find us a provisioning profile
			provisioning.find({
				appId: options.appId,
				certs: certs,
				devicesUDIDs: deviceResults.devices.map(function (device) { return device.udid; })
			}, function (err, profiles) {
				if (!profiles.length) {
					return callback(new Error('No provisioning profiles found'));

				}

				var combos = [];
				profiles.forEach(function (profile) {
					deviceResults.devices.forEach(function (device) {
						if (profile.devices.indexOf(device.udid) !== -1) {
							certs.forEach(function (cert) {
								var prefix = cert.pem.replace(/^-----BEGIN CERTIFICATE-----\n/, '').substring(0, 60);
								profile.certs.forEach(function (pcert) {
									if (pcert.indexOf(prefix) === 0) {
										combos.push({
											ppUUID: profile.uuid,
											certName: cert.name,
											deviceUDID: device.udid
										});
									}
								});
							});
						}
					});
				});

				callback(null, combos);
			});
		});
	});
}