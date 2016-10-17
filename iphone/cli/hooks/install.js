/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright (c) 2012-2016, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
	fs = require('fs'),
	ioslib = require('ioslib'),
	path = require('path'),
	run = appc.subprocess.run,
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (cli.argv.target !== 'device') return finished();

			var devices = {};

			async.parallel([
				function (next) {
					var pkgapp = path.join(builder.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					if (fs.existsSync(pkgapp)) {
						run(pkgapp, builder.xcodeAppDir, function (code, out, err) {
							if (code) {
								logger.warn(__('An error occurred running the iOS Package Application tool'));
								err.split('\n').forEach(logger.debug);
							}
							next();
						});
					} else {
						logger.warn(__('Unable to locate iOS Package Application tool'));
						next();
					}
				},
				function (next) {
					if (cli.argv['build-only']) {
						return next();
					}
					ioslib.device.detect({ bypassCache: true }, function (err, results) {
						if (!err) {
							results.devices.forEach(function (device) {
								if (device.udid !== 'itunes' && device.udid !== 'all' && (builder.deviceId === 'all' || device.udid === builder.deviceId)) {
									devices[device.udid] = device;
								}
							});
						}
						next();
					});
				}
			], function () {
				if (cli.argv['build-only']) {
					logger.info(__('Performed build only, skipping installing of the application'));
					return finished();
				}

				// if we don't have a deviceId, or it's "itunes", or it's "all", but not devices are connected,
				// then install to iTunes
				if (!builder.deviceId || builder.deviceId === 'itunes' || (builder.deviceId && !Object.keys(devices).length)) {
					logger.info(__('Installing application into iTunes'));

					var ipa = path.join(path.dirname(builder.xcodeAppDir), builder.tiapp.name + '.ipa');
					fs.existsSync(ipa) || (ipa = builder.xcodeAppDir);
					run('open', ['-b', 'com.apple.itunes', ipa], function (code, out, err) {
						if (code) {
							return finished(new appc.exception(__('Failed to launch iTunes')));
						}

						logger.info(__('Initiating iTunes sync'));
						run('osascript', path.join(builder.platformPath, 'itunes_sync.scpt'), function (code, out, err) {
							if (code) {
								if (err.indexOf('(-1708)') !== -1) {
									// err == "itunes_sync.scpt: execution error: iTunes got an error: every source doesn’t understand the count message. (-1708)"
									//
									// TODO: alert that the EULA needs to be accepted and if prompting is enabled,
									//       then wait for them to accept it and then try again
									finished(new appc.exception(__('Failed to initiate iTunes sync'), err.split('\n').filter(function (line) { return !!line.length; })));
								} else {
									finished(new appc.exception(__('Failed to initiate iTunes sync'), err.split('\n').filter(function (line) { return !!line.length; })));
								}
							} else {
								finished();
							}
						});
					});

					return;
				}

				var udids = Object.keys(devices),
					levels = logger.getLevels(),
					logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\s*(\u001b\\[\\d+m)?(.*)', 'i'),
					startLog = false,
					runningCount = 0,
					disconnected = false,
					installCount = 0,
					handles = {};

				function quit(force, udid) {
					running = false;
					runningCount--;

					if (udid && handles[udid]) {
						handles[udid].stop();
						delete handles[udid];
					} else if (force) {
						Object.keys(handles).forEach(function (udid) {
							handles[udid].stop();
							delete handles[udid];
						});
					}

					if (force || runningCount <= 0) {
						if (startLog) {
							var endLogTxt = __('End application log');
							logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					}
				}

				// install the app for the specified device or "all" devices
				async.eachSeries(udids, function (udid, next) {
					var device = devices[udid],
						lastLogger = 'debug',
						running = false;

					logger.info(__('Installing app on device: %s', device.name.cyan));

					var handle = handles[udid] = ioslib.device
						.install(udid, builder.xcodeAppDir, {
							appName: builder.tiapp.name,
							logPort: builder.tiLogServerPort
						})
						.on('installed', function () {
							logger.info(__('App successfully installed on device: %s', device.name.cyan));
							if (++installCount === udids.length && !startLog) {
								setTimeout(function () {
									if (process.env.STUDIO_VERSION) {
										logger.log(__('Please manually launch the application').magenta + '\n');
									} else {
										logger.log(__('Please manually launch the application or press CTRL-C to quit').magenta + '\n');
									}
								}, 50);
							}
							next();
						})
						.on('app-started', function () {
							running = true;
							runningCount++;
						})
						.on('log', function (msg) {
							var skipLine = false;

							if (!handles[udid].logStarted) {
								if (msg.indexOf('{') === 0) {
									try {
										var headers = JSON.parse(msg);
										if (headers.appId !== builder.tiapp.id) {
											logger.error(__('Tried to connect to app "%s", but connected to another app with id "%s"', builder.tiapp.id, headers.appId));
											logger.error(__('It is likely that you have two apps using the same log server port %s', builder.tiLogServerPort));
											logger.error(__('Either stop all instances of the other app or explicitly set a unique <log-server-port> in the <ios> section of the tiapp.xml') + '\n');
											handle.stop();

											running = false;
											if (--runningCount <= 0) {
												process.exit(1);
											}
										}
									} catch (e) {
										// squeltch
									}
									skipLine = true;
								}
								handles[udid].logStarted = true;
							}

							if (!startLog) {
								var startLogTxt = __('Start application log');
								logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
								startLog = true;
							}

							if (skipLine) {
								return;
							}

							var m = msg.match(logLevelRE);
							if (m) {
								var line = m[0].trim();
								m = line.match(logLevelRE);
								if (m) {
									lastLogger = m[2].toLowerCase();
									line = m[4].trim();
								}
								if (levels.indexOf(lastLogger) === -1) {
									// unknown log level
									logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
								} else {
									logger[lastLogger](line);
								}
								lastLineWasOurs = true;
							} else {
								if (levels.indexOf(lastLogger) === -1) {
									logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + msg);
								} else {
									logger[lastLogger](msg);
								}
							}
						})
						.on('app-quit', function () { quit(false, udid); })
						.on('disconnect', function () { quit(false, udid); })
						.on('error', function (err) {
							err = err.message || err.toString();
							var details;
							if (err.indexOf('0xe8008017') !== -1) {
								details = __('Chances are there is a signing issue with your provisioning profile or the generated app is not compatible with your device.');
							} else if (err.indexOf('0xe8008019') !== -1) {
								details = __('Chances are there is a signing issue. Clean the project and try building the project again.');
							} else if (err.indexOf('0xe800007f') !== -1) {
								details = __('Try reconnecting your device and try again.');
							} else if (err.indexOf('0xe8008016') !== -1) {
								details = __('Chances are there is an issue with your entitlements. Verify the bundle IDs in the generated Info.plist file.');
							} else if (err.indexOf('0xe8008016') !== -1) {
								details = __('Your provisioning profile probably has some entitlements that are not enabled in the Entitlements.plist file.');
							} else {
								details = __('For some reason the app failed to install on the device. Try reconnecting your device and check your provisioning profile and entitlements.');
							}
							next(new appc.exception(err, details));
						});
				}, finished);

				// listen for ctrl-c
				process.on('SIGINT', function () {
					logger.log();
					quit(true);
				});
			});
		}
	});
};
