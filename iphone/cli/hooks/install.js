/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
	fs = require('fs'),
	iosDevice = require('node-ios-device'),
	path = require('path'),
	run = appc.subprocess.run,
	__ = appc.i18n(__dirname).__,
	exec = require('child_process').exec;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (cli.argv.target != 'device') return finished();

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
				}
			], function () {
				var ipa = path.join(path.dirname(builder.xcodeAppDir), builder.tiapp.name + '.ipa');
				fs.existsSync(ipa) || (ipa = builder.xcodeAppDir);

				if (cli.argv['build-only']) {
					logger.info(__('Performed build only, skipping installing of the application'));
					return finished();
				}

				if (!builder.deviceId || builder.deviceId == 'itunes') {
					logger.info(__('Installing application into iTunes'));

					run('open', ['-b', 'com.apple.itunes', ipa], function (code, out, err) {
						if (code) {
							return finished(new appc.exception(__('Failed to launch iTunes')));
						}

						logger.info(__('Initiating iTunes sync'));
						run('osascript', path.join(builder.titaniumIosSdkPath, 'itunes_sync.scpt'), function (code, out, err) {
							if (code) {
								if (err.indexOf('(-1708)') != -1) {
									// err == "itunes_sync.scpt: execution error: iTunes got an error: every source doesn’t understand the count message. (-1708)"
									// TODO: alert that the EULA needs to be accepted and if prompting is enabled,
									// then wait for them to accept it and then try again
									finished(new appc.exception(__('Failed to initiate iTunes sync'), err.split('\n').filter(function (line) { return !!line.length; })));
								} else {
									finished(new appc.exception(__('Failed to initiate iTunes sync'), err.split('\n').filter(function (line) { return !!line.length; })));
								}
							} else {
								finished();
							}
						});
					});
				} else {
					iosDevice.devices(function (err, connectedDevices) {
						var displayStartLog = true,
							endLog = false,
							devices = builder.deviceId == 'all' ? connectedDevices : connectedDevices.filter(function (device) { return device.udid == builder.deviceId; }),
							instances = devices.length,
							logRegExp = new RegExp(' ' + cli.tiapp.name + '[^:]+: (.*)'),
							levels = logger.getLevels(),
							logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\s*(\u001b\\[\\d+m)?(.*)', 'i'),
							quitRegExp = new RegExp(' backboardd[^:]+: Application .+\\:' + cli.tiapp.id + '\\[');

						logger.debug(__('Waiting for device logs to sync'));

						async.series(devices.map(function (device) {
							return function (next) {
								var lastLogger = 'debug',
									lastLineWasOurs = false,
									PUMPING_LOG = 1,
									INSTALLING = 2,
									INSTALLED = 3,
									state = PUMPING_LOG,
									timer = null;

								try {
									iosDevice.log(device.udid, function (msg) {
										if (state == PUMPING_LOG) {
											// we create a timer here so that if we haven't received any messages for a
											// half second, then the log must be caught up and we're ready to install
											clearTimeout(timer);
											timer = setTimeout(function () {
												// logs quieted down, go ahead and install
												state = INSTALLING;
												logger.info(__('Installing app on device: %s', device.name.cyan));
												iosDevice.installApp(device.udid, builder.xcodeAppDir, function (err) {
													if (err) {
														err = err.message || err;
														logger.error(err);
														if (err.indexOf('0xe8008017') != -1) {
															logger.error(__('Chances are there is a signing issue with your provisioning profile or the generated app is not compatible with your device'));
														}
														next(err);
													} else {
														logger.info(__('App successfully installed on device: %s', device.name.cyan));
														state = INSTALLED;
														next();
													}

													if (displayStartLog) {
														logger.log(__('Please manually launch the application or press CTRL-C to quit').magenta + '\n');
														var startLogTxt = __('Start application log');
														logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
														displayStartLog = false;
													}
												});
											}, 500);
										} else if (state == INSTALLING) {
											// do nothing
										} else if (state == INSTALLED) {
											var m = msg.match(logRegExp);
											if (m) {
												// one of our log messages
												msg = m[1];
												m = msg.match(logLevelRE);
												if (m) {
													var line = m[0].trim();
													m = line.match(logLevelRE);
													if (m) {
														lastLogger = m[2].toLowerCase();
														line = m[4].trim();
													}
													if (levels.indexOf(lastLogger) == -1) {
														logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
													} else {
														logger[lastLogger](line);
													}
													lastLineWasOurs = true;
												}
											} else if (/^\s/.test(msg) && lastLineWasOurs) {
												// one of our multiline log messages
												msg = msg.replace(/^\t/, '');
												if (levels.indexOf(lastLogger) == -1) {
													logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + msg);
												} else {
													logger[lastLogger](msg);
												}
											} else if (quitRegExp.test(msg)) {
												// they quit the app
												if (!displayStartLog && !endLog) {
													var endLogTxt = __('End application log');
													logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
												}
												process.exit(0);
											} else {
												// some other log line
												lastLineWasOurs = false;
											}
										}
									});
								} catch (ex) {
									// something blew up in the ios device library
									logger.error(ex.message || ex.toString());
									if (--instances == 0) {
										if (!displayStartLog) {
											var endLogTxt = __('End application log');
											logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
											endLog = true;
										}
										process.exit(1);
									}
								}

								// listen for ctrl-c
								process.on('SIGINT', function () {
									if (!displayStartLog && !endLog) {
										var endLogTxt = __('End application log');
										logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
									}
									process.exit(0);
								});
							};
						}), finished);
					});
				}
			});
		}
	});

};
