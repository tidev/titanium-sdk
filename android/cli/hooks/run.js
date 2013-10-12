/*
 * run.js: Titanium iOS Android run hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
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
	var deviceInfo;

	cli.on('build.pre.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (builder.buildOnly) return finished();

			if (builder.target == 'emulator') {
				logger.info(__('Launching emulator: %s', builder.deviceId.cyan));

				var emulator = new EmulatorManager(config);
				emulator.start(builder.deviceId, function (err, emu) {
					if (err) {
						logger.error(__('Unable to start emulator "%s"', builder.deviceId) + '\n');
						process.exit(1);
					}

					emu.on('ready', function (device) {
						logger.info(__('Emulator ready!'));
						deviceInfo = device;
					});

					finished();
				});

			} else if (builder.target == 'device') {
				var adb = new ADB(config);
				adb.devices(function (err, devices) {
					if (err) {
						err.toString.split('\n').forEach(logger.error);
						logger.log();
						process.exit(1);
					}

					deviceInfo = devices.filter(function (d) { return d.id == builder.deviceId; }).shift();

					if (!deviceInfo) {
						logger.error(__('Unable to find device "%s"', builder.deviceId));
						logger.error(__('Did you unplug it or some shit?') + '\n');
						process.exit(1);
					}

					finished();
				});
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
					debuggerEnabled: builder.allowDebugging && builder.debugPort,
					debuggerPort: builder.allowDebugging && builder.debugPort || -1,
					profilerEnabled: builder.allowProfiling && builder.profilePort,
					profilerPort: builder.allowProfiling && builder.profilePort || -1
				};

			async.series([
				function (next) {
					logger.info(__('Making sure the adb server is running'));
					adb.startServer(next);
				},

				function (next) {
					if (deviceInfo) {
						return next();
					}

					logger.info(__('Waiting for emulator to become ready'));

					var tries = 4 * 60, // wait for a minute after the build finishes
						timer = setInterval(function () {
							if (deviceInfo) {
								clearInterval(timer);
								next();
							}
							if (!tries--) {
								logger.error(__('Emulator failed to start in a timely manner') + '\n');
								process.exit(1);
							}
						}, 250);
				},

				function (next) {
					if (deployData.debuggerEnabled || deployData.profilerEnabled) {
						// push deploy.json
						var deployJsonFile = path.join(builder.buildDir, 'bin', 'deploy.json');
						fs.writeFileSync(deployJsonFile, JSON.stringify(deployData));
						logger.info(__('Pushing %s to sdcard', deployJsonFile.cyan));
						adb.shell(deviceInfo.id, 'mkdir /sdcard/' + builder.appid + ' || echo', function () {
							adb.push(deviceInfo.id, deployJsonFile, '/sdcard/' + builder.appid + '/deploy.json', next);
						});
					} else {
						logger.info(__('Removing %s from sdcard', 'deploy.json'.cyan));
						adb.shell(deviceInfo.id, '[ -f "/sdcard/' + builder.appid + '/deploy.json"] && rm -f "/sdcard/' + builder.appid + '/deploy.json" || echo ""', next);
					}
				},

				function (next) {
					// install the app
					var tries = 5,
						installError;
					logger.info(__('Installing apk: %s', builder.apkFile.cyan));

					adb.installApp(deviceInfo.id, builder.apkFile, function (err) {
						if (err) {
							logger.error(__('Failed to installed apk on device "%s"', deviceInfo.id));
							err.toString().split('\n').forEach(logger.error);
							logger.log();
							process.exit(1);
						}

						logger.info(__('App successfully installed'));
						next();
					});
				},

				function (next) {
					logger.info(__('Starting app: %s', (builder.appid + '/.' + builder.classname + 'Activity').cyan));
					adb.startApp(deviceInfo.id, builder.appid, builder.classname + 'Activity', next);
				},

				function (next) {
					if (deployData.debuggerEnabled) {
						logger.info(__('Forwarding host port %s to device for debugging', builder.debugPort));
						var forwardPort = 'tcp:' + builder.debugPort;
						adb.forward(deviceInfo.id, forwardPort, forwardPort, next);
					} else {
						next();
					}
				},

				function (next) {
					if (deployData.profilerEnabled) {
						logger.info(__('Forwarding host port %s:%s to device for profiling', builder.profilePort));
						var forwardPort = 'tcp:' + builder.profilePort;
						adb.forward(deviceInfo.id, forwardPort, forwardPort, next);
					} else {
						next();
					}
				},

			], function (err) {
				if (err) {
					logger.error(err);
				}
				finished();
			});
		}
	});

};
