/*
 * run.js: Titanium Android run hook
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ADB = require('titanium-sdk/lib/adb'),
	appc = require('node-appc'),
	async = require('async'),
	EmulatorManager = require('titanium-sdk/lib/emulator'),
	fs = require('fs'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	var deviceInfo = [];

	cli.on('build.pre.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (builder.buildOnly) return finished();

			if (builder.target == 'emulator') {
				logger.info(__('Launching emulator: %s', builder.deviceId.cyan));

				cli.createHook('build.android.startEmulator', function (deviceId, opts, cb) {
					var emulator = new EmulatorManager(config);
					emulator.start(deviceId, opts, function (err, emu) {
						if (err) {
							logger.error(__('Unable to start emulator "%s"', deviceId) + '\n');
							logger.error(err.message || err);
							logger.log();
							process.exit(1);
						}

						emu.on('ready', function (device) {
							logger.info(__('Emulator ready!'));
							deviceInfo = [ device ];
						});

						var stdout = '';
						emu.on('stdout', function (data) {
							stdout += data.toString();
						});

						var stderr = '';
						emu.on('stderr', function (data) {
							stderr += data.toString();
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
					logger: logger,
					checkMounts: builder.debugPort || builder.profilerPort
				}, finished);

			} else if (builder.target == 'device') {
				var adb = new ADB(config);
				adb.devices(function (err, devices) {
					if (err) {
						err.toString.split('\n').forEach(logger.error);
						logger.log();
						process.exit(1);
					}

					deviceInfo = builder.deviceId == 'all' ? devices : devices.filter(function (d) { return d.id == builder.deviceId; });

					if (!deviceInfo.length) {
						if (builder.deviceId == 'all') {
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
			if (builder.target != 'emulator' && builder.target != 'device') return finished();

			if (builder.buildOnly) {
				logger.info(__('Performed build only, skipping installing of the application'));
				return finished();
			}

			if (!builder.apkFile || !fs.existsSync(builder.apkFile)) {
				logger.error(__('No APK file to install and run, skipping'));
				return finished();
			}

			var adb = new ADB(config),
				deployData = {
					debuggerEnabled: !!builder.debugPort,
					debuggerPort: builder.debugPort || -1,
					profilerEnabled: !!builder.profilerPort,
					profilerPort: builder.profilerPort || -1
				};

			async.series([
				function (next) {
					logger.info(__('Making sure the adb server is running'));
					adb.startServer(next);
				},

				function (next) {
					if (deviceInfo.length || builder.target != 'emulator') {
						return next();
					}

					logger.info(__('Waiting for emulator to become ready'));

					var timeout = config.get('android.emulatorStartTimeout', 2 * 60 * 1000),  // 2 minute default
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
					async.series(deviceInfo.map(function (device) {
						return function (cb) {
							if (deployData.debuggerEnabled || deployData.profilerEnabled) {
								// push deploy.json
								var deployJsonFile = path.join(builder.buildDir, 'bin', 'deploy.json');
								fs.writeFileSync(deployJsonFile, JSON.stringify(deployData));
								logger.info(__('Pushing %s to SD card', deployJsonFile.cyan));
								adb.shell(device.id, [
									'if [ -d "/sdcard/' + builder.appid + '" ]; then',
									'	echo "SUCCESS"',
									'else',
									'	mkdir "/sdcard/' + builder.appid + '"',
									'	if [ $? -ne 0 ]; then',
									'		echo "FAILED"',
									'	else',
									'		echo "SUCCESS"',
									'	fi',
									'fi'
								].join('\n'), function (err, output) {
									if (err || output.toString().trim().split('\n').shift().trim() == 'FAILED') {
										if (builder.target == 'device') {
											logger.error(__('Failed to copy "deploy.json" to Android device\'s SD card. Perhaps it\'s read only or out of space.') + '\n');
										} else {
											logger.error(__('Failed to copy "deploy.json" to Android emulator\'s SD card. Perhaps it\'s read only or out of space.') + '\n');
										}
										process.exit(1);
									}
									adb.push(device.id, deployJsonFile, '/sdcard/' + builder.appid + '/deploy.json', cb);
								});
							} else {
								logger.info(__('Removing %s from SD card', 'deploy.json'.cyan));
								adb.shell(device.id, '[ -f "/sdcard/' + builder.appid + '/deploy.json" ] && rm -f "/sdcard/' + builder.appid + '/deploy.json"\necho "DONE"', cb);
							}
						};
					}), next);
				},

				function (next) {
					// install the app
					logger.info(__('Installing apk: %s', builder.apkFile.cyan));

					async.series(deviceInfo.map(function (device) {
						return function (cb) {
							builder.target == 'device' && logger.info(__('Installing app on device: %s', (device.model || device.manufacturer || device.id).cyan));

							adb.installApp(device.id, builder.apkFile, function (err) {
								if (err) {
									logger.error(__('Failed to install apk on "%s"', device.id));
									err.toString().split('\n').forEach(logger.error);
									logger.log();
									process.exit(1);
								}

								logger.info(__('App successfully installed'));
								cb();
							});
						};
					}), next);
				},

				function (next) {
					var logBuffer = [],
						displayStartLog = true,
						tiapiRegExp = /^(\w\/TiAPI\s*\:)/,
						instances = deviceInfo.length,
						endLog = false;

					function printData(device, deviceName, line) {
						if (device.appPidRegExp.test(line)) {
							line = line.trim().replace(/\%/g, '%%').replace(device.appPidRegExp, ':');
							var logLevel = line.charAt(0).toLowerCase();
							if (tiapiRegExp.test(line)) {
								line = line.replace(tiapiRegExp, '').trim();
							} else {
								line = line.replace(/^\w\/(\w+)\s*\:/g, '$1:').grey;
							}
							line = deviceName + line;
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
						}
					}

					deviceInfo.forEach(function (device) {
						var deviceName = deviceInfo.length > 1 ? ('[' + (device.model || device.manufacturer || device.id) + '] ').magenta : '';
						adb.logcat(device.id, function (data) {
							if (device.appPidRegExp) {
								if (displayStartLog) {
									var startLogTxt = __('Start application log');
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
							if (--instances == 0) {
								// the adb server shutdown, the emulator quit, or the device was unplugged
								var endLogTxt = __('End application log');
								logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
								endLog = true;
							}
						});
					});

					// listen for ctrl-c
					process.on('SIGINT', function () {
						if (!endLog) {
							var endLogTxt = __('End application log');
							logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					});

					next();
				},

				function (next) {
					logger.info(__('Starting app: %s', (builder.appid + '/.' + builder.classname + 'Activity').cyan));
					async.series(deviceInfo.map(function (device) {
						return function (cb) {
							adb.startApp(device.id, builder.appid, builder.classname + 'Activity', function (err) {
								var timeout = config.get('android.appStartTimeout', 2 * 60 * 1000),  // 2 minute default
									waitUntil = Date.now() + timeout,
									done = false;

								async.whilst(
									function () { return !done; },
									function (cb2) {
										if (Date.now() > waitUntil) {
											logger.error(__('Application failed to launch') + '\n');
											logger.log(__('The current timeout is set to %s ms', String(timeout).cyan));
											logger.log(__('You can increase this timeout by running: %s', (cli.argv.$ + ' config android.emulatorStartTimeout <timeout ms>').cyan) + '\n');
											process.exit(1);
										}

										adb.getPid(device.id, builder.appid, function (err, pid) {
											if (err || !pid) {
												setTimeout(cb2, 100);
											} else {
												logger.info(__('Application pid: %s', String(pid).cyan));
												device.appPidRegExp = new RegExp('\\(\\s*' + pid + '\\)\:');
												done = true;
												cb2();
											}
										});
									},
									cb
								);
							});
						};
					}), next);
				},

				function (next) {
					if (deployData.debuggerEnabled) {
						logger.info(__('Forwarding host port %s to device for debugging', builder.debugPort));
						var forwardPort = 'tcp:' + builder.debugPort;
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
					if (deployData.profilerEnabled) {
						logger.info(__('Forwarding host port %s to device for profiling', builder.profilerPort));
						var forwardPort = 'tcp:' + builder.profilerPort;
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
				if (err) {
					logger.error(err);
				}
				finished();
			});
		}
	});

};
