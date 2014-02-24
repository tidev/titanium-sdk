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
					iosDevice.devices(function (err, devices) {
						async.series(devices.map(function (device) {
							return function (next) {
								if (builder.deviceId == 'all' || builder.deviceId == device.udid) {
									logger.info(__('Installing app on device: %s', device.name.cyan));
									iosDevice.installApp(device.udid, builder.xcodeAppDir, function (err) {
										if (err) {
											err = err.message || err;
											logger.error(err);
											if (err.indexOf('0xe8008017') != -1) {
												logger.error(__('Chances are there is a signing issue with your provisioning profile or the generated app is not compatible with your device'));
											}
										} else {
											logger.info(__('App successfully installed on device: %s', device.name.cyan));
										}
										next();
									});
								} else {
									next();
								}
							};
						}), finished);
					});
				}
			});
		}
	});

};
