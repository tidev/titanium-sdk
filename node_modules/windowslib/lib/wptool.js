/**
 * Wrapper around the wptool command line tool for enumerating and connecting
 * to Windows Phone devices and emulators.
 *
 * @module wptool
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
	assemblies = require('./assemblies'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs'),
	magik = require('./utilities').magik,
	checkOutdated = require('./utilities').checkOutdated,
	emulator = require('./emulator'),
	path = require('path'),
	spawn = require('child_process').spawn,
	visualstudio = require('./visualstudio'),
	windowsphone = require('./windowsphone'),
	wrench = require('wrench'),
	wptool = path.resolve(__dirname, '..', 'bin', 'wptool.exe'),
	__ = appc.i18n(__dirname).__,

	// this is a hard coded list of emulators to detect.
	// when the next windows phone is released, the enumerate()
	// function will need to detect the new emulators.
	wpsdks = ['8.0', '8.1', '10.0'],
	PREFERRED_SDK = '10.0'; // ultimate fallback sdk version to use by default

var cache;

exports.enumerate = enumerate;
exports.connect = connect;
exports.install = install;
exports.detect = detect;
// expose some methods for unit testing
exports.test = {
	parseWinAppDeployCmdListing: parseWinAppDeployCmdListing,
	parseAppDeployCmdListing: parseAppDeployCmdListing
};


/**
 * Detects all Windows 10 Mobile devices using WinAppDeployCmd.exe
 *
 * @param {String} [deployCmd] - The full path to WinAppDeployCmd.exe
 * @param {Function} [next(err, results)] - A function to call with the device information.
 */
function winAppDeployCmdEnumerate(deployCmd, next) {
	var cmd = deployCmd,
		args = ['devices', '2'], // TODO What timeout should we use here? Using 2 seconds for now, since I think wptool takes that long anyways
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
				ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to enumerate devices for WP SDK 10.0 (code %s)', code));
			next(ex, null);
		} else {
			var devices = parseWinAppDeployCmdListing(out);
			next(null, {
				devices: devices,
				emulators: []
			});
		}
	});
}

/**
 * @param {String} [deployCmd] - Device listing output from WinAppDeployCmd.exe
 * @return {Array[Object]} - Array of devices
 **/
function parseWinAppDeployCmdListing(out) {
	var deviceListingRE = /^((\d{1,3}\.){3}\d{1,3})\s+([0-9A-F]{8}[-]?([0-9A-F]{4}[-]?){3}[0-9A-F]{12})\s+(.+?)$/igm;
	var devices = [];
	var match,
		i = 0;
	while ((match = deviceListingRE.exec(out)) !== null)
	{
		// TODO How can we know what SDK is on the phone? My win 8.1U1 phone shows up in listings when connected via USB
		devices.push({name: match[5], udid: match[3], index: i, wpsdk: null, ip: match[1], type: 'device'});
		i++;
	}

	return devices;
}

/**
 * Detects all Windows Phone devices and emulators using our custom tooling (wptool.exe)
 *
 * @param {String} [wpsdk] - The windows phone sdk version ('8.0', '8.1', '10.0').
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [next(err, results)] - A function to call with the device information.
 */
function wptoolEnumerate(wpsdk, options, next) {
	function run(wpsdk, next) {
		var child = spawn(wptool, ['enumerate', '--wpsdk', wpsdk]),
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
				next(ex, null);
			} else {
				next(null, JSON.parse(out));
			}
		});
	}

	return windowsphone.detect(options, function (err, phoneResults) {
		if (err) {
			return next(err);
		}

		if (!phoneResults.windowsphone[wpsdk]) {
			// Just move on if we have no results for a given version
			return next(null, {devices:[],emulators:[]});
		}

		// device discovery is slower, do it in parallel with emulator discovery/listing
		async.parallel([
			// discover windows 10 devices in network using WinAppDeployCmd
			function (cb) {
				winAppDeployCmdEnumerate(phoneResults.windowsphone[wpsdk].deployCmd, cb);
			},
			// Use our custom wptool binary to gather Windows 10 emulators
			function (cb) {
				// TODO Handle when we don't have permissions to the folders in SDK and need to offload build to user HOME
				var wpToolCs = path.resolve(__dirname, '..', 'wptool', 'wptool.cs');
				checkOutdated(wpToolCs, wptool, function (err, outdated) {
					if (err) {
						return cb(err);
					}
					if (outdated) {
						return buildWpTool(options, function (err, path) {
							if (err) {
								return cb(err);
							}
							run(wpsdk, cb);
						});
					}

					run(wpsdk, cb);
				});
			}
		], function (err, results) {
			if (err) {
				return next(err);
			}
			// Combine devices and emulators listings!
			var combined = results[1];
			combined.devices = results[0].devices.concat(combined.devices);
			return next(null, combined);
		});
	});
}

/**
 * Parses the emulator listing from AppDeployCmd.exe
 *
 * @param {String} [out] - The raw string output from AppDeployCmd.exe
 * @param {String} [wpsdk] - The windows phone sdk version ('8.0', '8.1', '10.0').
 * @return {Array[Object]} - An array of the emulators detected
 */
function parseAppDeployCmdListing(out, wpsdk) {
	// Parse the output! Hope this regex is OK!
	var deviceListingRE = /^\s*(\d+)\s+([\w \.]+)/mg;
	deviceListingRE.exec(out); // skip device
	var emulators = [];
	var match;
	while ((match = deviceListingRE.exec(out)) !== null)
	{
		emulators.push({name: match[2], udid: wpsdk.replace('.', '-') + "-" + match[1], index: parseInt(match[1]), wpsdk: wpsdk, type: 'emulator'});
	}

	// TIMOB-19576
	// Windows 10 Mobile Emulators are detected by 8.1 sdk,
	// which can be used for both 8.1 and 10 project.
	if (wpsdk != '8.0') {
		// limit 8.1 or 10.0 emulators to those SDKs only
		emulators = emulators.filter(function (e) {
			return new RegExp("Emulator\ " + wpsdk).test(e.name);
		});
		// FIXME change the udids back if they don't start at 1? (If we have 8.1 and 10, the 8.1 emulators udids start at 8-1-7)
	}
	return emulators;
}

/**
 * Detects all Windows Phone devices and emulators using the native tooling (AppDeployCmd.exe)
 *
 * @param {String} [wpsdk] - The windows phone sdk version ('8.0', '8.1', '10.0').
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [next(err, results)] - A function to call with the device information.
 */
function nativeEnumerate(wpsdk, options, next) {
	return windowsphone.detect(options, function (err, phoneResults) {
		if (err) {
			return next(err, null);
		}

		if (!phoneResults.windowsphone[wpsdk]) {
			// Just move on if we have no results for a given version
			return next(null, {devices:[],emulators:[]});
		}

		if (!phoneResults.windowsphone[wpsdk].deployCmd) {
			var ex = new Error(__('No deploy command found for WP SDK %s. Cannot enumerate devices.', wpsdk));
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
				next(ex, null);
			} else {
				var emulators = parseAppDeployCmdListing(out, wpsdk);
				next(null, {
					devices: [{name: 'Device', udid: 0, index: 0, wpsdk: null, type: 'device'}],
					emulators: emulators
				});
			}
		});
	});
}

/**
 * Detects Windows Phone devices and emulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all Windows Phone devices.
 * @param {Function} [callback(err, results)] - A function to call with the device/emulator information.
 */
function detect(options, callback) {
	return enumerate(options, function (err, results) {
		var result = {
			emulators: {},
			devices: [],
			issues: []
		},
		tmp = {};

		if (err && !results) {
			// detected an error with no results
			callback(err);
		} else {
			Object.keys(results).forEach(function (wpsdk) {
				result.emulators[wpsdk] = results[wpsdk].emulators;
				results[wpsdk].devices.forEach(function (dev) {
					if (!tmp[dev.udid]) {
						tmp[dev.udid] = result.devices.length+1;
						result.devices.push(dev);
					} else if (dev.wpsdk) {
						result.devices[tmp[dev.udid]-1] = dev;
					}
				});
			});
			// If we have a device with udid of 0 and non-null wpsdk _and_
			// we have a device with real udid we got from WinAppDeployCmd, combine the listings!
			var wpsdkIndex = -1,
			    realDeviceIndex = -1;
			for (var i = 0; i < result.devices.length; i++) {
				var dev = result.devices[i];
				if (dev.udid == 0 && dev.wpsdk) {
					wpsdkIndex = i;
				} else if (dev.udid != 0 && !dev.wpsdk) {
					// now find with "real" device
					realDeviceIndex = i;
				}
				if (wpsdkIndex != -1 && realDeviceIndex != -1) {
					break;
				}
			};
			if (wpsdkIndex != -1 && realDeviceIndex != -1) {
				// set 'real' device wpsdk to the value we got from wptool binary
				result.devices[realDeviceIndex].wpsdk = result.devices[wpsdkIndex].wpsdk;
				// remove the wptool binary entry
				result.devices.splice(wpsdkIndex, 1);
			}
		}

		callback(null, result);
	});
}

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

		function runTool() {
			var results = {},
				errors = [];

			// wpsdks is a constant above that contains all supported Windows Phone SDK versions
			async.eachSeries(wpsdks, function (wpsdk, next) {
				// Use custom wptool for 10.0 and 8.1, use native tooling for 8.0
				var funcToCall = (wpsdk == '10.0') ? wptoolEnumerate : nativeEnumerate;

				funcToCall(wpsdk, options, function (err, result) {
					if (err) {
						// If there was an error, move on, but record error.
						// Then later if we have no results for any version, we propagate the error
						if (!results[wpsdk]) {
							results[wpsdk] = {
								devices: [],
								emulators: [],
							};
						}
						errors.push(err);
						next();
					} else {
						results[wpsdk] = result;
						next();
					}
				});
			}, function (err) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}
				// If there are no emulators for either version, surface the first error
				if (errors.length > 0 && !Object.keys(results).some(function (wpsdk) {
					return results[wpsdk].emulators.length > 0;
				})) {
					emitter.emit('error', errors[0]);
					return callback(errors[0], results);
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
				// TODO if we have win 10 use it's deploy tool to push to devices?
				var wpsdk = dev.wpsdk || options.wpsdk || options.preferredWindowsPhoneSDK || PREFERRED_SDK,
					done = function (err, result) {
						if (err) {
							emitter.emit(result || 'error', err);
							return callback(err);
						}
						emitter.emit('connected', result); // send along device info we have
						callback(null, result);
					};

				if (wpsdk == '10.0') {
					// if win10, just call connect on our native tool!
					wpToolConnect(dev, options, done);
				} else {
					// If win 8.x, launch bogus app
					nativeLaunch(dev, 'f8ce6878-0aeb-497f-bcf4-65be961d4bba', options, done);
				}
			});
	});
}

/**
 * Builds our own custom tool to interact with emulators and devices.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
 * @param {Function} [callback(err, path)] - A function to call after building the executable.
 */
function buildWpTool(options, callback) {
	// FIXME Handle when we don't have permission to edit the existing csproj or copy to the bin dir!
	// We should move to a writable directory under HOME and return path to that

	// find required assemblies
	return assemblies.detect(options, function (err, results) {
		if (err) {
			return callback(err);
		}

		// check that we have the assemblies we need
		var requiredAssemblies = {
				'Microsoft.SmartDevice.Connectivity.Interface': null,
				'Microsoft.SmartDevice.MultiTargeting.Connectivity': null
			},
			missing = Object.keys(requiredAssemblies).filter(function (assembly) {
				var r = results.assemblies[assembly];
				if (!r) return true;
				requiredAssemblies[assembly] = r[Object.keys(r).sort().pop()];
			});

		if (missing.length) {
			var ex = new Error(__('Missing one or more required Microsoft .NET assemblies: %s', missing.join(', ')));
			return callback(ex);
		}

		// update visual studio references
		var project = path.resolve(__dirname, '..', 'wptool', 'wptool.csproj'),
			parser = new DOMParser({ errorHandler: function () {} }),
			dom = parser.parseFromString(fs.readFileSync(project).toString(), 'text/xml');

		(function updateRefs(node) {
			while (node) {
				if (node.nodeType === appc.xml.ELEMENT_NODE) {
					switch (node.tagName) {
						case 'Reference':
							var inc = node.getAttribute('Include');
							if (inc) {
								var name = inc.split(',').shift();

								if (requiredAssemblies[name]) {
									node.setAttribute('Include', name + ', Version=' + requiredAssemblies[name].assemblyVersion + ', Culture=neutral, PublicKeyToken=' + requiredAssemblies[name].publicKeyToken + ', processorArchitecture=MSIL');

									var child = node.firstChild,
										found = false;

									while (child) {
										if (child.nodeType === appc.xml.ELEMENT_NODE && child.tagName === 'HintPath') {
											while (child.firstChild) {
												child.removeChild(child.firstChild);
											}
											child.appendChild(dom.createTextNode(requiredAssemblies[name].assemblyFile));
											found = true;
											break;
										}
										child = child.nextSibling;
									}

									if (!found) {
										child = dom.createElement('HintPath');
										child.appendChild(dom.createTextNode(requiredAssemblies[name].assemblyFile));
										node.appendChild(child);
									}
								}
							}
							break;
						default:
							updateRefs(node.firstChild);
					}
				}
				node = node.nextSibling;
			}
		}(dom.documentElement.firstChild));

		fs.writeFileSync(project, '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString());

		// remove the bin and obj folders
		var d;
		fs.existsSync(d = path.resolve(__dirname, '..', 'wptool', 'bin')) && wrench.rmdirSyncRecursive(d);
		fs.existsSync(d = path.resolve(__dirname, '..', 'wptool', 'obj')) && wrench.rmdirSyncRecursive(d);

		// build the wptool
		visualstudio.build(appc.util.mix({
			buildConfiguration: 'Release',
			project: project
		}, options), function (err, result) {
			if (err) {
				return callback(err);
			}

			var src = path.resolve(__dirname, '..', 'wptool', 'bin', 'Release', 'wptool.exe');
			if (!fs.existsSync(src)) {
				var ex = new Error(__('Failed to build the wptool executable.'));
				return callback(ex);
			}

			// Always copy wptool.exe whenever we build it
			fs.writeFileSync(wptool, fs.readFileSync(src));

			// Make sure to copy all dependencies
			var srcdir = path.resolve(__dirname, '..', 'wptool', 'bin', 'Release');
			fs.readdirSync(srcdir).forEach(function(filename) {
				if (path.extname(filename) == '.dll') {
					var dest = path.resolve(__dirname, '..', 'bin', filename);
					fs.writeFileSync(dest, fs.readFileSync(path.resolve(srcdir, filename)));
				}
			});

			return callback(null, wptool);
		});
	});
}

function wpToolConnect(device, options, callback) {
	var args = [
			'connect',
			device.index
		],
		child = spawn(wptool, args),
		out = '',
		abortTimer,
		timedOut = false;

	child.stdout.on('data', function (data) {
		out += data.toString();
	});

	child.stderr.on('data', function (data) {
		out += data.toString();
	});

	child.on('close', function (code) {
		clearTimeout(abortTimer);

		try {
			var result = JSON.parse(out),
				pollEmulator;

			if (!result.success) {
				clearTimeout(abortTimer);
				return callback(new Error(__('Failed to connect to %s', device.name)));
			}
			device.ip = result.ip;
			// If this is an emulator we should poll the status and wait until it's 'Running' before moving on
			// I'm seeing consistent failures to install an app on Windows 10 emulators in our builds here.
			if (device.type == 'emulator') {
				pollEmulator = function() {
					if (timedOut) {
						return;
					}

					// check if emulator is running...
					emulator.status(device, function(err, status) {
						if (err) {
							clearTimeout(abortTimer);
							return callback(err);
						}

						if (status == 2) { // running state
							clearTimeout(abortTimer);
							device.running = true; // mark it as running so we don't try and launch it again via connect
							callback(null, device);
						} else {
							// try again in 500ms
							setTimeout(pollEmulator, 500);
						}
					});
				};
				// wait 250ms and check status of emulator
				setTimeout(pollEmulator, 250);
			} else {
				// It's a device, just assume we're ok
				clearTimeout(abortTimer);
				device.running = true; // mark it as running so we don't try and launch it again via connect
				callback(null, device);
			}
		} catch (e) {
			clearTimeout(abortTimer);
			callback(new Error(__('Failed to connect to %s', device.name)));
		}
	});
	if (options.timeout) {
		abortTimer = setTimeout(function () {
			timedOut = true; // set flag so we don't poll on emulator state change
			child.kill();

			var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, device.name));
			callback(ex, 'timeout');
		}, options.timeout);
	}
}

/**
 * Launches an app on a given emulator/device.
 **/
function wpToolLaunch(device, productGuid, options, callback) {
	var args = [
			'launch',
			device.index,
			productGuid
		],
		child = spawn(wptool, args),
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

		try {
			var result = JSON.parse(out);
			if (result.success) {
				return callback(null, device);
			}
			var ex = new Error(__('Failed to launch app: %s', result.message));
			callback(ex);
		} catch (e) {
			var ex = new Error(__('Failed to connect to emulator: %s', out));
			callback(ex);
		}
	});
	if (options.timeout) {
		abortTimer = setTimeout(function () {
			child.kill();

			var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, device.type));
			callback(ex, 'timeout');
		}, options.timeout);
	}
}

function nativeLaunch(device, appid, options, callback) {
	windowsphone.detect(options, function (err, phoneResults) {
		if (err) {
			return callback(err);
		}

		var wpsdk = device.wpsdk || options.wpsdk || options.preferredWindowsPhoneSDK || PREFERRED_SDK,
			deployCmd = phoneResults.windowsphone[wpsdk].deployCmd,
			args = [
				'/launch',
				appid,
				'/targetdevice:' + device.index
			],
			child,
			out = '',
			abortTimer;
		if (!deployCmd) {
			var ex = new Error(__('Windows Phone SDK v%s does not appear to have an App deploy tool.', wpsdk));
			return callback(ex);
		}

		child = spawn(deployCmd, args);

		child.stdout.on('data', function (data) {
			out += data.toString();
		});

		child.stderr.on('data', function (data) {
			out += data.toString();
		});

		child.on('close', function (code) {
			clearTimeout(abortTimer);

			var errmsg = out.trim().split(/\r\n|\n/).shift(),
				ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to start %s (code %s)', device.name, code));
			// Here's where we expect the failure that the app is not installed, which is right.
			// We're explicitly telling to launch a bogus app, so we expect a very specific failure as "success" here...
			// if (code == -2146233088 || code == 2148734208)
			if (errmsg == '' || errmsg.indexOf('The application is not installed.') != -1) {
				// we must be successful, right?
				callback(null, device);
			} else {
				// we sometimes get the same code, but different error message
				callback(ex);
			}
		});
		if (options.timeout) {
			abortTimer = setTimeout(function () {
				child.kill();

				var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, device.type));
				callback(ex, 'timeout');
			}, options.timeout);
		}
	});
}

function nativeInstall(deployCmd, device, appPath, options, callback) {
	// We're explicitly telling to launch a bogus app, so we expect a very specific failure as "success" here...
	var args = [
			options.skipLaunch ? '/install' : '/installlaunch',
			appPath,
			'/targetdevice:' + device.index
		],
		child = spawn(deployCmd, args),
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

		if (out.trim() != '' && code) {
			var errmsg = out.trim().split(/\r\n|\n/).shift(),
				ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to install app (code %s)', code));
			callback(ex);
		} else {
			device.running = true;
			callback(null, device);
		}
	});
	if (options.timeout) {
		abortTimer = setTimeout(function () {
			child.kill();

			var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, device.type));
			callback(ex, 'timeout');
		}, options.timeout);
	}
}

/**
 * Installs an app on a device/emulator, via WinAppDeployCmd. If necessary we'll
 * first launch the emulator and grab the IP address before installing.
 *
 * @param {String} [deployCmd] - Path to WinAppDeployCmd.exe
 * @param {Object} [device] - The windows phone device or emulator.
 * @param {String} [appPath] - Path to the appx, xap or appxbundle to install.
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [callback(err, device)] - A function to call with the device information.
 */
function wpToolInstall(deployCmd, device, appPath, options, callback) {
	if (!device.ip || !device.running) {
		// Launch the emulator, grab the IP and mark as running then install the app
		return wpToolConnect(device, options, function(err, dev) {
			if (err) {
				return callback(err);
			}

			wpToolInstall(deployCmd, dev, appPath, options, callback);
		});
	}

	var args = [
			options.forceUnInstall ? 'uninstall' : 'install',
			'-file',
			appPath,
			'-ip',
			device.ip
		],
		child = spawn(deployCmd, args),
		out = '',
		abortTimer;

	child.stdout.on('data', function (data) {
		out += data.toString();
	});

	child.stderr.on('data', function (data) {
		out += data.toString();
	});

	// TODO If the app install fails because it needs a pin, we should help guide the user. Prompt for pin, or spit out a message
	// telling them how to install manually and pair once with pin?
	child.on('close', function (code) {
		clearTimeout(abortTimer);

		if (code) {
			// handle duplicate package identity error code from Windows 10.0.14393 tooling and above
			if (code == '2148734208') {
				if (out.indexOf('because the current user does not have that package installed') == -1) {
					options.forceUnInstall = true;
					wpToolInstall(deployCmd, device, appPath, options, callback);
				} else {
					// Windows cannot remove the app because the current user does not have that package installed.
					callback(new Error('A debug application is already installed, please remove existing debug application'));
				}
			} else {
				var errmsg = out.trim().split(/\r\n|\n/).shift(),
					ex = new Error(/^Error: /.test(errmsg) ? errmsg.substring(7) : __('Failed to install app (code %s): %s', code, out));
				callback(ex);
			}
		} else {
			var errmsg = /failed\. (\w*)\r?\n(.*)/.exec(out);
			if (errmsg) {
				var err = errmsg[1],
					msg = errmsg[2];

				if (err == '0x80073CF9') {
					callback(new Error('A debug application is already installed, please remove existing debug application'));
				} else if (err == '0x80073CFB') {
					// Provided package has the same identity as an already-installed package. Proceed uninstalling.
					options.forceUnInstall = true;
					wpToolInstall(deployCmd, device, appPath, options, callback);
				} else {
					callback(new Error(__('Failed to install app (code %s): %s', err, msg)));
				}
			} else {
				// Provided package is uninstalled...proceed re-installing.
				if (options.forceUnInstall) {
					options.forceUnInstall = false;
					wpToolInstall(deployCmd, device, appPath, options, callback);
				} else {
					callback(null, device);
				}
			}
		}
	});
	if (options.timeout) {
		abortTimer = setTimeout(function () {
			child.kill();

			var ex = new Error(__('Timed out after %d milliseconds trying to connect to %s', options.timeout, device.type));
			callback(ex, 'timeout');
		}, options.timeout);
	}

}

/**
 * Installs an app on a device/emulator, defaults to launching it as well.
 *
 * @param {Object} [device] - The windows phonedevice or emulator.
 * @param {String} [appPath] - Path to the appx, xap or appxbundle to install.
 * @param {Object} [options] - An object containing various settings.
 * @param {Object} [options.skipLaunch] - Just install the app, don't launch it too.
 * @param {Object} [options.appGuid] - The generated app guid. May be null/empty, if so we'll try to detect it
 * @param {String} [options.powershell] - Path to the 'powershell' executable.
 * @param {Function} [callback(err, results)] - A function to call with the device information once the app is installed. To know when the app gets launched, hook an event listener for 'launched' event
 *
 * @emits module:wptool#error
 * @emits module:wptool#timeout
 * @emits module:wptool#installed
 * @emits module:wptool#launched
 *
 * @returns {EventEmitter}
 */
function install(device, appPath, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		windowsphone.detect(options, function (err, phoneResults) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var wpsdk = device.wpsdk || options.wpsdk || options.preferredWindowsPhoneSDK || PREFERRED_SDK,
				cmd = phoneResults.windowsphone[wpsdk].deployCmd;
			if (!cmd) {
				var ex = new Error(__('Windows Phone SDK v%s does not appear to have an App deploy tool.', wpsdk));
				return callback(ex);
			}

			if (wpsdk == '10.0') {
				if (!options.skipLaunch) {
					var guid;
					// we need the appid to launch, so install the app and get the app id in parallel
					async.parallel([
						function (next) {
							wpToolInstall(cmd, device, appPath, options, function (err, result) {
								if (err) {
									emitter.emit(result || 'error', err);
									return next(err);
								}
								emitter.emit('installed', device);
								next();
							});
						},
						function (next) {
							if (options.appGuid) {
								guid = options.appGuid;
								next();
							} else {
								getProductGUID(appPath, options, function(err, productGuid) {
									if (err) {
										emitter.emit('error', err);
										return next(err);
									}

									guid = productGuid;
									next();
								});
							}
						}
					], function (err, results) {
						if (err) {
							return callback(err);
						}
						// now launch it!
						wpToolLaunch(device, guid, options, function (err, result) {
							if (err) {
								emitter.emit(result || 'error', err);
								return callback(err);
							}
							emitter.emit('launched', device);
							callback(null, result);
						});
					});
				} else {
					// We're just installing. No need to grab appid or launch the app
					wpToolInstall(cmd, device, appPath, options, function (err, result) {
						if (err) {
							emitter.emit(result || 'error', err);
							return callback(err);
						}

						emitter.emit('installed', device);
						return callback(null, result);
					});
				}
			} else {
				nativeInstall(cmd, device, appPath, options, function (err, result) {
					if (err) {
						emitter.emit(result || 'error', err);
						return callback(err);
					}
					emitter.emit('installed', device);
					if (!options.skipLaunch) {
						emitter.emit('launched', device);
					}
					callback(null, result);
				});
			}
		});
	});
}

/**
 * Unzips an appx file to read the AppxManifest.xml and grab the product guid
 * out (so we know the guid we need to launch it)
 *
 * @param {String} [appxFile] - Path to the appx, xap or appxbundle to inspect.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell] - Path to the 'powershell' executable.
 * @param {Function} [callback(err, results)] - A function to call with the GUID
 */
function getProductGUID(appxFile, options, callback) {
	appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'wp_get_appx_metadata.ps1'), function (err, script) {
		if (err) {
			return callback(err);
		}

		appc.subprocess.run(options.powershell || 'powershell', [
			'-ExecutionPolicy', 'Bypass', '-NoLogo', '-NonInteractive', '-NoProfile',
			'-File',
			script,
			appxFile
		], function (code, out, err) {
			if (code) {
				var ex = new Error(__('Failed to detect product id of appx: %s', out));
				return callback(ex);
			}

			callback(null, out.trim());
		});
	});
}
