/*
 * run.js: Titanium Android run hook
 *
 * Copyright (c) 2012-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const ADB = require('node-titanium-sdk/lib/adb'),
	appc = require('node-appc'),
	async = require('async'),
	EmulatorManager = require('node-titanium-sdk/lib/emulator'),
	fs = require('fs'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	let deviceInfo = [];

	cli.on('build.pre.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (builder.buildOnly) {
				return finished();
			}

			if (builder.target === 'emulator') {
				logger.info(__('Launching emulator: %s', builder.deviceId.cyan));

				cli.createHook('build.android.startEmulator', function (deviceId, opts, cb) {
					const emulator = new EmulatorManager(config);

					logger.trace(__('Starting emulator: %s', deviceId.cyan));

					emulator.start(deviceId, opts, function (err, emu) {
						if (err) {
							logger.error(__('Unable to start emulator "%s"', deviceId.cyan) + '\n');
							logger.error(err.message || err);
							logger.log();
							process.exit(1);
						}

						logger.trace(__('Emulator process started'));

						emu.on('ready', function (device) {
							logger.info(__('Emulator ready!'));
							deviceInfo = [ device ];
						});

						let stderr = '';
						emu.on('stderr', function (data) {
							stderr += data.toString();
						});

						emu.on('timeout', function (err) {
							logger.error(__('Emulator timeout after waiting %s ms', err.waited));
							logger.log();
							process.exit(1);
						});

						emu.on('error', function (err) {
							logger.error(__('An emulator error occurred'));
							logger.error(err);
							logger.log();
							process.exit(1);
						});

						emu.on('exit', function (code) {
							if (code) {
								logger.error(__('Emulator exited with error: %s', code));
								stderr.trim().split('\n').forEach(logger.error);
								logger.log();
								process.exit(1);
							}
						});

						cb();
					});
				})(builder.deviceId, {
					logger: logger
				}, finished);

			} else if (builder.target === 'device') {
				const adb = new ADB(config);
				adb.devices(function (err, devices) {
					if (err) {
						err.toString.split('\n').forEach(logger.error);
						logger.log();
						process.exit(1);
					}

					deviceInfo = builder.deviceId === 'all'
						? devices
						: devices.filter(function (d) {
							return d.id === builder.deviceId;
						});

					if (!deviceInfo.length) {
						if (builder.deviceId === 'all') {
							logger.error(__('Unable to find any connected devices'));
						} else {
							logger.error(__('Unable to find device "%s"', builder.deviceId));
						}
						logger.error(__('Did you unplug it?') + '\n');
						process.exit(1);
					}

					finished();
				});

			} else {
				finished();
			}
		}
	});

	cli.on('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (builder.target !== 'emulator' && builder.target !== 'device') {
				return finished();
			}

			if (builder.buildOnly) {
				logger.info(__('Performed build only, skipping installing of the application'));
				return finished();
			}

			if (!builder.apkFile || !fs.existsSync(builder.apkFile)) {
				logger.error(__('No APK file to install and run, skipping'));
				return finished();
			}

			const adb = new ADB(config);

			async.series([
				function (next) {
					logger.info(__('Making sure the adb server is running'));
					adb.startServer(next);
				},

				function (next) {
					if (deviceInfo.length || builder.target !== 'emulator') {
						return next();
					}

					logger.info(__('Waiting for emulator to become ready...'));

					const timeout = config.get('android.emulatorStartTimeout', 2 * 60 * 1000),  // 2 minute default
						waitUntil = Date.now() + timeout,
						timer = setInterval(function () {
							if (deviceInfo.length) {
								clearInterval(timer);
								next();
							} else if (Date.now() > waitUntil) {
								logger.error(__('Emulator failed to start in a timely manner') + '\n');
								logger.log(__('The current timeout is set to %s ms', String(timeout).cyan));
								logger.log(__('You can increase this timeout by running: %s', (cli.argv.$ + ' config android.emulatorStartTimeout <timeout ms>').cyan) + '\n');
								process.exit(1);
							}
						}, 250);
				},

				function (next) {
					// install the app
					logger.info(__('Installing apk: %s', builder.apkFile.cyan));

					let failCounter = 0;
					const installTimeout = config.get('android.appInstallTimeout', 4 * 60 * 1000); // 4 minute default
					let retryInterval = config.get('android.appInstallRetryInterval', 2000); // 2 second default

					async.eachSeries(deviceInfo, function (device, cb) {
						builder.target === 'device' && logger.info(__('Installing app on device: %s', (device.model || device.manufacturer || device.id).cyan));

						let intervalTimer = null;
						const abortTimer = setTimeout(function () {
							clearTimeout(intervalTimer);
							logger.error(__('Application failed to install') + '\n');
							logger.log(__('The current timeout is set to %s ms', String(installTimeout).cyan));
							logger.log(__('You can increase this timeout by running: %s', (cli.argv.$ + ' config android.appInstallTimeout <timeout ms>').cyan) + '\n');
							if (++failCounter >= deviceInfo.length) {
								process.exit(1);
							}
						}, installTimeout);

						logger.trace(__('Checking if package manager service is started'));

						(function installApp() {
							adb.ps(device.id, function (err, output) {
								if (err || output.toString().indexOf('system_server') === -1) {
									logger.trace(__('Package manager not started yet, trying again in %sms...', retryInterval));
									intervalTimer = setTimeout(installApp, retryInterval);
									return;
								}

								logger.trace(__('Package manager has started'));

								adb.installApp(device.id, builder.apkFile, { logger: logger }, function (err) {
									if (err) {
										if (err instanceof Error && (err.message.indexOf('Could not access the Package Manager') !== -1 || err.message.indexOf('Can\'t find service: package') !== -1)) {
											logger.debug(__('ADB install failed because package manager service is still starting, trying again in %sms...', retryInterval));
											intervalTimer = setTimeout(installApp, retryInterval);
											return;
										}

										logger.error(__('Failed to install apk on "%s"', device.id));
										err = err.toString();
										err.split('\n').forEach(logger.error);
										if (err.indexOf('INSTALL_PARSE_FAILED_NO_CERTIFICATES') !== -1) {
											logger.error(__('Make sure your keystore is signed with a compatible signature algorithm such as "SHA1withRSA" or "MD5withRSA".'));
										}
										logger.log();
										process.exit(1);
									}

									clearTimeout(intervalTimer);
									clearTimeout(abortTimer);

									logger.info(__('App successfully installed'));
									cb();
								});
							});
						}());
					}, next);
				},

				function (next) {
					cli.emit('build.post.install', builder, next);
				},

				function (next) {
					if (!cli.argv.launch) {
						logger.info(__('Skipping launch of: %s', (builder.appid + '/.' + builder.classname + 'Activity').cyan));
						return next(true);
					}
					next();
				},

				function (next) {
					const tiapiRegExp = /^(\w\/TiAPI\s*:)/,
						nonTiLogRegexp = /^\w\/.+\s*\(\s*\d+\):/;

					let lastLogLevel,
						logBuffer = [],
						displayStartLog = true,
						endLog = false,
						instances = deviceInfo.length;

					function printData(device, deviceName, line) {
						let logLevel = lastLogLevel; // if continuing from middle of last message, keep same log level

						// start of a new log message
						if (device.appPidRegExp.test(line)) {
							line = line.trim().replace(device.appPidRegExp, ':');
							logLevel = line.charAt(0).toLowerCase();
							if (tiapiRegExp.test(line)) {
								line = line.replace(tiapiRegExp, '').trim();
							} else {
								line = line.replace(/^\w\/(\w+)\s*:/g, '$1:').grey;
							}
							line = deviceName + line;
						// if it begins with something like "E/SQLiteLog( 1659):" it's not a contination, don't log it.
						} else if (nonTiLogRegexp.test(line)) {
							return;
						}

						switch (logLevel) {
							case 'v':
								logger.trace(line);
								break;
							case 'd':
								logger.debug(line);
								break;
							case 'w':
								logger.warn(line);
								break;
							case 'e':
								logger.error(line);
								break;
							case 'i':
							default:
								logger.info(line);
						}
						lastLogLevel = logLevel;
					}

					deviceInfo.forEach(function (device) {
						const deviceName = deviceInfo.length > 1 ? ('[' + (device.model || device.manufacturer || device.id) + '] ').magenta : '';
						adb.logcat(device.id, function (data) {
							// logcat now guarantees we get per-line output
							if (device.appPidRegExp) {
								if (displayStartLog) {
									const startLogTxt = __('Start application log');
									logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
									displayStartLog = false;
								}

								// flush log buffer
								if (logBuffer.length) {
									logBuffer.forEach(function (line) {
										printData(device, deviceName, line);
									});
									logBuffer = [];
								}

								// flush data
								data.trim().split('\n').forEach(function (line) {
									printData(device, deviceName, line);
								});
							} else {
								logBuffer = logBuffer.concat(data.trim().split('\n'));
							}
						}, function () {
							if (--instances === 0 && !displayStartLog) {
								// the adb server shutdown, the emulator quit, or the device was unplugged
								const endLogTxt = __('End application log');
								logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
								endLog = true;
							}
						});
					});

					// listen for ctrl-c
					process.on('SIGINT', function () {
						if (!endLog && !displayStartLog) {
							const endLogTxt = __('End application log');
							logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					});

					next();
				},

				function (next) {
					logger.info(__('Starting app: %s', (builder.appid + '/.' + builder.classname + 'Activity').cyan));

					let failCounter = 0;
					const retryInterval = config.get('android.appStartRetryInterval', 30 * 1000), // 30 second default
						startTimeout = config.get('android.appStartTimeout', 2 * 60 * 1000); // 2 minute default

					async.eachSeries(deviceInfo, function (device, cb) {
						let watchingPid = false,
							intervalTimer = null;
						const abortTimer = setTimeout(function () {
							clearTimeout(intervalTimer);
							logger.error(__('Application failed to launch') + '\n');
							logger.log(__('The current timeout is set to %s ms', String(startTimeout).cyan));
							logger.log(__('You can increase this timeout by running: %s', (cli.argv.$ + ' config android.appStartTimeout <timeout ms>').cyan) + '\n');
							if (++failCounter >= deviceInfo.length) {
								process.exit(1);
							}
						}, startTimeout);

						(function startApp() {
							logger.debug(__('Trying to start the app...'));
							adb.startApp(device.id, builder.appid, builder.classname + 'Activity', function (err) { // eslint-disable-line no-unused-vars
								if (watchingPid) {
									return;
								}
								watchingPid = true;

								let done = false;
								async.whilst(
									function (wcb) { return wcb(null, !done); },
									function (cb2) {
										adb.getPid(device.id, builder.appid, function (err, pid) {
											if (err || !pid) {
												setTimeout(cb2, 250);
											} else {
												clearTimeout(intervalTimer);
												clearTimeout(abortTimer);

												logger.info(__('Application pid: %s', String(pid).cyan));
												device.appPidRegExp = new RegExp('\\(\\s*' + pid + '\\):'); // eslint-disable-line security/detect-non-literal-regexp
												done = true;
												setTimeout(cb2, 0);
											}
										});
									},
									cb
								);
							});

							intervalTimer = setTimeout(function () {
								logger.debug(__('App still not started, trying again'));
								startApp();
							}, retryInterval);
						}());
					}, next);
				},

				function (next) {
					if (builder.debugPort) {
						logger.info(__('Forwarding host port %s to device for debugging', builder.debugPort));
						const forwardPort = 'tcp:' + builder.debugPort;
						async.series(deviceInfo.map(function (device) {
							return function (cb) {
								adb.forward(device.id, forwardPort, forwardPort, cb);
							};
						}), next);
					} else {
						next();
					}
				},

				function (next) {
					if (builder.profilerPort) {
						logger.info(__('Forwarding host port %s to device for profiling', builder.profilerPort));
						const forwardPort = 'tcp:' + builder.profilerPort;
						async.series(deviceInfo.map(function (device) {
							return function (cb) {
								adb.forward(device.id, forwardPort, forwardPort, cb);
							};
						}), next);
					} else {
						next();
					}
				}

			], function (err) {
				if (err && err instanceof Error) {
					logger.error(err);
				}
				finished();
			});
		}
	});

};
