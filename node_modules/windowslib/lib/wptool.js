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
	wptool = path.resolve(__dirname, '..', 'bin', 'wptool.exe'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__,

	// this is a hard coded list of emulators to detect.
	// when the next windows phone is released, the enumerate()
	// function will need to detect the new emulators.
	wpsdks = ['8.0', '8.1'];

var cache;

exports.enumerate = enumerate;
exports.connect = connect;

/**
 * Detects all Windows Phone devices and emulators.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects devices and emulators.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
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
			var results = {};

			// wpsdks is a constant above that contains all supported Windows Phone SDK versions
			async.eachSeries(wpsdks, function (wpsdk, next) {
				var args = ['enumerate'];
				if (wpsdk) {
					args.push('--wpsdk', wpsdk);
				}

				appc.subprocess.run(wptool, args, function (code, out, err) {
					if (code) {
						var ex = new Error(__('Failed to enumerate Windows Phone devices.'));
						return next(ex);
					}

					try {
						results[wpsdk] = JSON.parse(out);
					} catch (ex) {
						next(ex);
						return;
					}

					next();
				});
			}, function (err) {
				if (err) {
					emitter.emit('error', ex);
					return callback(ex);
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

		// check if the wptool exists
		if (fs.existsSync(wptool)) {
			runTool();
		} else {
			// find required assemblies
			assemblies.detect(options, function (err, results) {
				if (err) {
					emitter.emit('error', err);
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
					emitter.emit('error', ex);
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
						emitter.emit('error', err);
						return callback(err);
					}

					var src = path.resolve(__dirname, '..', 'wptool', 'bin', 'Release', 'wptool.exe');
					if (!fs.existsSync(src)) {
						var ex = new Error(__('Failed to build the wptool executable.'));
						emitter.emit('error', ex);
						return callback(ex);
					}

					// sanity check that the wptool.exe wasn't copied by another async task in windowslib
					if (!fs.existsSync(wptool)) {
						fs.writeFileSync(wptool, fs.readFileSync(src));
					}

					runTool();
				});
			});
		}
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

		enumerate()
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

				var args = ['connect', dev.index];
				if (dev.wpsdk) {
					args.push('--wpsdk', dev.wpsdk);
				}

				var child = spawn(wptool, args),
					out = '',
					err = '',
					abortTimer;

				child.stdout.on('data', function (data) {
					out += data.toString();
				});

				child.stderr.on('data', function (data) {
					err += data.toString();
				});

				child.on('close', function (code) {
					clearTimeout(abortTimer);

					try {
						var r = JSON.parse(out);
					} catch (e) {
						// JSON parse exception
						var ex = new Error(__('Failed to connect to device "%s"', udid));
						emitter.emit('error', ex);
						callback(ex);
					}

					if (code || !r || !r.success) {
						var ex = new Error(r && r.message || __('Failed to connect to device "%s"', udid));
						emitter.emit('error', ex);
						return callback(ex);
					}

					// we must be successful, right?
					emitter.emit('connected', dev);
					callback(null, dev);
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
}
