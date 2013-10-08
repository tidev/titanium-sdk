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
	var emulatorReady = false;

	cli.on('build.pre.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (builder.buildOnly || builder.target != 'emulator') return finished();

			var emulator = new EmulatorManager(config);
			emulator.start(builder.deviceId, function (err, emu) {
				if (err) {
					logger.error(__('Unable to start emulator "%s"', builder.deviceId) + '\n');
					process.exit(1);
				}

				emu.on('ready', function (emu, device) {
					emulatorReady = true;
				});

				finished();
			});
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
				deviceId = build.deviceId,
				deployData = {
					debuggerEnabled: builder.allowDebugging && builder.debugPort,
					debuggerPort: builder.allowDebugging && builder.debugPort || -1,
					profilerEnabled: builder.allowProfiling && builder.profilePort,
					profilerPort: builder.allowProfiling && builder.profilePort || -1
				};

			async.series([
				function (next) {
					adb.startServer(next);
				},

				function (next) {
					if (builder.target != 'emulator') {
						return next();
					}

					var tries = 4 * 60, // wait for a minute after the build finishes
						timer = setInterval(function () {
							if (emulatorReady) {
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
						adb.shell(deviceId, 'mkdir /sdcard/' + builder.appid + ' || echo', function () {
							adb.push(deviceId, deployJsonFile, '/sdcard/' + builder.appid + '/deploy.json', next);
						});
					} else {
						next();
					}
				},

				function (next) {
					// install the app
					var tries = 5;
					async.whilst(
						function () { return tries-- > 0; },
						function () {
							adb.installApp(deviceId, builder.apkFile, function (err) {
								if (!err) {
									// success!
									tries = 0;
								}
							});
						},
						next
					);
				},

				function (next) {
					adb.startApp(deviceId, builder.appid, builder.classname + 'Activity', next);
				},

				function (next) {
					if (deployData.debuggerEnabled) {
						logger.info(__('Forwarding host port %s to device for debugging', builder.debugPort));
						var forwardPort = 'tcp:' + builder.debugPort;
						adb.forward(deviceId, forwardPort, forwardPort, next);
					} else {
						next();
					}
				},

				function (next) {
					if (deployData.profilerEnabled) {
						logger.info(__('Forwarding host port %s:%s to device for profiling', builder.profilePort));
						var forwardPort = 'tcp:' + builder.profilePort;
						adb.forward(deviceId, forwardPort, forwardPort, next);
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

			finished();
		}
	});

};
