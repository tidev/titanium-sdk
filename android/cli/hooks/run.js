/*
 * run.js: Titanium Android run hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import ADB from 'node-titanium-sdk/lib/adb.js';
import async from 'async';
import EmulatorManager from 'node-titanium-sdk/lib/emulator.js';
import fs from 'node:fs';

export const cliVersion = '>=3.2';

export function init(logger, config, cli) {
	let deviceInfo = [];
	const ignoreLog = config.cli.ignoreLog || [];

	cli.on('build.pre.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (builder.buildOnly) {
				return finished();
			}

			if (builder.target === 'emulator') {
				logger.info(`Launching emulator: ${builder.deviceId.cyan}`);

				cli.createHook('build.android.startEmulator', function (deviceId, opts, cb) {
					const emulator = new EmulatorManager(config);

					logger.trace(`Starting emulator: ${deviceId.cyan}`);

					emulator.start(deviceId, opts, function (err, emu) {
						if (err) {
							logger.error(`Unable to start emulator "${deviceId.cyan}"\n`);
							logger.error(err.message || err);
							logger.log();
							process.exit(1);
						}

						logger.trace('Emulator process started');

						emu.on('ready', function (device) {
							logger.info('Emulator ready!');
							deviceInfo = [ device ];
						});

						let stderr = '';
						emu.on('stderr', function (data) {
							stderr += data.toString();
						});

						emu.on('timeout', function (err) {
							logger.error(`Emulator timeout after waiting ${err.waited} ms`);
							logger.log();
							process.exit(1);
						});

						emu.on('error', function (err) {
							logger.error('An emulator error occurred');
							logger.error(err);
							logger.log();
							process.exit(1);
						});

						emu.on('exit', function (code) {
							if (code) {
								logger.error(`Emulator exited with error: ${code}`);
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
							logger.error('Unable to find any connected devices');
						} else {
							logger.error(`Unable to find device "${builder.deviceId}"`);
						}
						logger.error('Did you unplug it?\n');
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
				logger.info('Performed build only, skipping installing of the application');
				return finished();
			}

			if (!builder.apkFile || !fs.existsSync(builder.apkFile)) {
				logger.error('No APK file to install and run, skipping');
				return finished();
			}

			const adb = new ADB(config);

			async.series([
				function (next) {
					logger.info('Making sure the adb server is running');
					adb.startServer(next);
				},

				function (next) {
					if (deviceInfo.length || builder.target !== 'emulator') {
						return next();
					}

					logger.info('Waiting for emulator to become ready...');

					const timeout = config.get('android.emulatorStartTimeout', 2 * 60 * 1000),  // 2 minute default
						waitUntil = Date.now() + timeout,
						timer = setInterval(function () {
							if (deviceInfo.length) {
								clearInterval(timer);
								next();
							} else if (Date.now() > waitUntil) {
								logger.error('Emulator failed to start in a timely manner\n');
								logger.log(`The current timeout is set to ${String(timeout).cyan} ms`);
								logger.log(`You can increase this timeout by running: ${(cli.argv.$ + ' config android.emulatorStartTimeout <timeout ms>').cyan}\n`);
								process.exit(1);
							}
						}, 250);
				},

				function (next) {
					// install the app
					logger.info(`Installing apk: ${builder.apkFile.cyan}`);

					let failCounter = 0;
					const installTimeout = config.get('android.appInstallTimeout', 4 * 60 * 1000); // 4 minute default
					let retryInterval = config.get('android.appInstallRetryInterval', 2000); // 2 second default

					async.eachSeries(deviceInfo, function (device, cb) {
						builder.target === 'device' && logger.info(`Installing app on device: ${(device.model || device.manufacturer || device.id).cyan}`);

						let intervalTimer = null;
						const abortTimer = setTimeout(function () {
							clearTimeout(intervalTimer);
							logger.error('Application failed to install\n');
							logger.log(`The current timeout is set to ${String(installTimeout).cyan} ms`);
							logger.log(`You can increase this timeout by running: ${(cli.argv.$ + ' config android.appInstallTimeout <timeout ms>').cyan}\n`);
							if (++failCounter >= deviceInfo.length) {
								process.exit(1);
							}
						}, installTimeout);

						logger.trace('Checking if package manager service is started');

						(function installApp() {
							adb.ps(device.id, function (err, output) {
								if (err || output.toString().indexOf('system_server') === -1) {
									logger.trace(`Package manager not started yet, trying again in ${retryInterval} ms...`);
									intervalTimer = setTimeout(installApp, retryInterval);
									return;
								}

								logger.trace('Package manager has started');

								adb.installApp(device.id, builder.apkFile, { logger: logger }, function (err) {
									if (err) {
										if (err instanceof Error && (err.message.indexOf('Could not access the Package Manager') !== -1 || err.message.indexOf('Can\'t find service: package') !== -1)) {
											logger.debug(`ADB install failed because package manager service is still starting, trying again in ${retryInterval} ms...`);
											intervalTimer = setTimeout(installApp, retryInterval);
											return;
										}

										logger.error(`Failed to install apk on "${device.id}"`);
										err = err.toString();
										err.split('\n').forEach(logger.error);
										if (err.indexOf('INSTALL_PARSE_FAILED_NO_CERTIFICATES') !== -1) {
											logger.error('Make sure your keystore is signed with a compatible signature algorithm such as "SHA1withRSA" or "MD5withRSA".');
										}
										logger.log();
										process.exit(1);
									}

									clearTimeout(intervalTimer);
									clearTimeout(abortTimer);

									logger.info('App successfully installed');
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
						logger.info(`Skipping launch of: ${(builder.appid + '/.' + builder.classname + 'Activity').cyan}`);
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
							line = line.replace(/^ {1,2}/, '').replace(device.appPidRegExp, ':');
							logLevel = line.charAt(0).toLowerCase();
							if (tiapiRegExp.test(line)) {
								line = line.replace(tiapiRegExp, '').replace(/^ {1,2}/, '');
							} else {
								line = line.replace(/^\w\/(\w+)\s*:/g, '$1:').grey;
							}
							line = deviceName + line;
						// if it begins with something like "E/SQLiteLog( 1659):" it's not a continuation, don't log it.
						} else if (nonTiLogRegexp.test(line)) {
							return;
						}

						// ignore some Android logs in info log level
						if (ignoreLog.some(ignoreItem => line.includes(ignoreItem))) {
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
									const startLogTxt = 'Start application log';
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
								const endLogTxt = 'End application log';
								logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
								endLog = true;
							}
						});
					});

					// listen for ctrl-c
					process.on('SIGINT', function () {
						if (!endLog && !displayStartLog) {
							const endLogTxt = 'End application log';
							logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					});

					next();
				},

				function (next) {
					logger.info(`Starting app: ${(builder.appid + '/.' + builder.classname + 'Activity').cyan}`);

					let failCounter = 0;
					const retryInterval = config.get('android.appStartRetryInterval', 30 * 1000), // 30 second default
						startTimeout = config.get('android.appStartTimeout', 2 * 60 * 1000); // 2 minute default

					async.eachSeries(deviceInfo, function (device, cb) {
						let watchingPid = false,
							intervalTimer = null;
						const abortTimer = setTimeout(function () {
							clearTimeout(intervalTimer);
							logger.error('Application failed to launch\n');
							logger.log(`The current timeout is set to ${String(startTimeout).cyan} ms`);
							logger.log(`You can increase this timeout by running: ${(cli.argv.$ + ' config android.appStartTimeout <timeout ms>').cyan}\n`);
							if (++failCounter >= deviceInfo.length) {
								process.exit(1);
							}
						}, startTimeout);

						(function startApp() {
							logger.debug('Trying to start the app...');
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

												logger.info(`Application pid: ${String(pid).cyan}`);
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
								logger.debug('App still not started, trying again');
								startApp();
							}, retryInterval);
						}());
					}, next);
				},

				function (next) {
					if (builder.debugPort) {
						logger.info(`Forwarding host port ${builder.debugPort} to device for debugging`);
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
						logger.info(`Forwarding host port ${builder.profilerPort} to device for profiling}`);
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
}
