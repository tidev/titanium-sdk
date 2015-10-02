/**
 * Wrapper around the wptool command line tool for enumerating and connecting
 * to Windows Phone devices and emulators.
 *
 * @module wptool
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
	assemblies = require('./assemblies'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs'),
	magik = require('./utilities').magik,
	path = require('path'),
	spawn = require('child_process').spawn,
	visualstudio = require('./visualstudio'),
	windowsphone = require('./windowsphone'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__,

	// this is a hard coded list of emulators to detect.
	// when the next windows phone is released, the enumerate()
	// function will need to detect the new emulators.
	wpsdks = ['8.0', '8.1', '10'];

var cache;

exports.enumerate = enumerate;
exports.connect = connect;

/**
 * Detects all Windows Phone devices and emulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects devices and emulators.
 * @param {Function} [callback(err, results)] - A function to call with the device information.
 *
 * @emits module:wptool#detected
 * @emits module:wptool#error
 *
 * @returns {EventEmitter}
 */
function enumerate(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		function nativeEnumerate(wpsdk, next) {
			// Run deploy cmd to grab listing!
			return windowsphone.detect(options, function (err, phoneResults) {
				if (err) {
					emitter.emit('error', err);
					return next(err, null);
				}

				// Just move on if we have no results for a given version?
				if (!phoneResults.windowsphone[wpsdk]) {
					var ex = new Error(__('Did not find support for WP SDK %s. Cannot enumerate devices.', wpsdk));
					return next(ex, null);
				}

				if (!phoneResults.windowsphone[wpsdk].deployCmd) {
					var ex = new Error(__('No deploy command found for WP SDK %s. Cannot enuemrate devices.', wpsdk));
					return next(ex, null);
				}

				var cmd = phoneResults.windowsphone[wpsdk].deployCmd,
					args = ['/EnumerateDevices'],
					child = spawn(cmd, args),
					out = '',
					result;

				child.stdout.on('data', function (data) {
					out += data.toString();
				});

				child.stderr.on('data', function (data) {
					out += data.toString();
				});

				child.on('close', function (code) {
					if (code) {
						var errmsg = out.trim().split(/\r\n|\n/).shift(),
							ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to enumerate devices/emulators for WP SDK %s (code %s)', wpsdk, code));
						emitter.emit('error', ex);
						next(ex, null);
					} else {
						// Parse the output! Hope this regex is OK!
						var deviceListingRE = /^\s*(\d+)\s+([\w \.]+)/mg
						deviceListingRE.exec(out); // skip device
						var emulators = [];
						var match;
						while ((match = deviceListingRE.exec(out)) !== null)
						{
							emulators.push({name: match[2], udid: wpsdk.replace('.', '-') + "-" + match[1], index: parseInt(match[1]), wpsdk: wpsdk});
						}
						
						next(null, {
							devices: [{name: 'Device', udid: 0, index: 0, wpsdk: null}],
							emulators: emulators,
						});
					}
				});
			});
		}

		function runTool() {
			var results = {},
				errors = [];

			// wpsdks is a constant above that contains all supported Windows Phone SDK versions
			async.eachSeries(wpsdks, function (wpsdk, next) {
				// TIMOB-18303
				nativeEnumerate(wpsdk, function (err, result) {
					if (err) {
						// If there was an error, move on, but record error.
						// Then later if we have no results for any version, we propagate the error
						if (!results[wpsdk]) {
							results[wpsdk] = {
								devices: [{name: 'Device', udid: 0, index: 0, wpsdk: null}],
								emulators: [],
							};
						}
						errors.push(err);
						next();
					} else {

						// TIMOB-19576
						// Windows 10 Mobile Emulators are detected by 8.1 sdk,
						// which can be used for both 8.1 and 10 project.
						if (wpsdk == '8.1') {
							results['10'] = {
								devices: [{name: 'Device', udid: 0, index: 0, wpsdk: null}],
								emulators: []
							}
							Object.keys(result.emulators).forEach(function(emu) {
								if (/Mobile\ Emulator\ 10\./.test(result.emulators[emu].name)) {
									results['10'].emulators.push(result.emulators[emu]);
								}
							});
						}

						results[wpsdk] = result;
						next();
					}
				});
			}, function (err) {
				// If there are no emulators for either version, surface the first error
				if (errors.length > 0 && !Object.keys(results).some(function (wpsdk) {
					return results[wpsdk].emulators.length > 0;
				})) {
					emitter.emit('error', errors[0]);
					return callback(errors[0]);
				}
				
				// add a helper function to get a device by udid
				Object.defineProperty(results, 'getByUdid', {
					value: function (udid) {
						var dev = null;

						function testDev(d) {
							if (d.udid == udid) { // this MUST be == because the udid might be a number and not a string
								dev = d;
								return true;
							}
						}

						Object.keys(results).some(function (wpsdk) {
							return results[wpsdk].devices.some(testDev) || results[wpsdk].emulators.some(testDev);
						});

						return dev;
					}
				});

				cache = results;
				emitter.emit('detected', cache);
				callback(null, cache);
			});
		}

		runTool();
	});
}

/**
 * Connects to a Windows Phone device or launches a Windows Phone emulator.
 *
 * @param {String} udid - The device or emulator udid.
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects devices and emulators.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
 * @param {Number} [options.timeout] - The number of milliseconds to wait before timing out.
 * @param {Function} [callback(err, handle)] - A function to call after attempting to connnect to the device/emulator.
 *
 * @emits module:wptool#connected
 * @emits module:wptool#error
 * @emits module:wptool#timeout
 *
 * @returns {EventEmitter}
 */
function connect(udid, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (udid === null || udid === void 0) {
			var ex = new Error(__('Missing required "%s" argument', 'udid'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		enumerate(options)
			.on('error', function (err) {
				emitter.emit('error', err);
				callback(err);
			})
			.on('detected', function (results) {
				// validate the udid
				var dev = results.getByUdid(udid);

				if (!dev) {
					var err = new Error(__('Invalid udid "%s"', udid));
					emitter.emit('error', err);
					return callback(err);
				}

				// Here we cheat and use AppDeployCmd to "connect"
				windowsphone.detect(options, function (err, phoneResults) {
					if (err) {
						emitter.emit('error', err);
						return callback(err);
					}

					// If dev.wpsdk is null, grab 8.1's deploy cmd!
					var wpsdk = dev.wpsdk || '8.1',
						cmd = phoneResults.windowsphone[wpsdk].deployCmd,
						// We're explicitly telling to launch a bogus app, so we expect a very specific failure as "success" here...
						args = [
							'/launch',
							'f8ce6878-0aeb-497f-bcf4-65be961d4bba', // bogus app id
							'/targetdevice:' + dev.index
						],
						child = spawn(cmd, args),
						out = '',
						abortTimer;

					child.stdout.on('data', function (data) {
						out += data.toString();
					});

					child.stderr.on('data', function (data) {
						out += data.toString();
					});

					child.on('close', function (code) {
						clearTimeout(abortTimer);

						var errmsg = out.trim().split(/\r\n|\n/).shift(),
							ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to start %s (code %s)', dev.name, code));
						// Here's where we expect the failure that the app is not installed, which is right.
						// if (code == -2146233088 || code == 2148734208)
						if (errmsg.indexOf('The application is not installed.') != -1) {
							// we must be successful, right?
							emitter.emit('connected', dev);
							callback(null, dev);
						} else {
							// we sometimes get the same code, but different error message
							emitter.emit('error', ex);
							callback(ex);
						}
					});

					if (options.timeout) {
						abortTimer = setTimeout(function () {
							child.kill();

							var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, dev.type));
							emitter.emit('timeout', ex);
							callback(ex);
						}, options.timeout);
					}
				});
			});
	});
}
