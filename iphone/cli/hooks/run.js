/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	fs = require('fs'),
	path = require('path'),
	parallel = require('async').parallel,
	cp = require('child_process'),
	exec = cp.exec;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	
	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (build, finished) {
			if (cli.argv.target != 'simulator') return finished();
			
			if (cli.argv['build-only']) {
				logger.info(__('Performed build only, skipping running of the application'));
				return finished();
			}
			
			logger.info(__('Running application in iOS Simulator'));
			
			parallel([
				function (next) {
					logger.debug(__('Terminating all iOS simulators'));
					exec('/usr/bin/killall ios-sim', next);
				},
				
				function (next) {
					exec('/usr/bin/killall "iPhone Simulator"', next);
				},
				
				function (next) {
					setTimeout(next, 2000);
				},
				
				function (next) {
					var simulatorDir = afs.resolvePath('~/Library/Application Support/iPhone Simulator/' + build.iosSimVersion),
						logFile = build.tiapp.guid + '.log';
					
					// sometimes the simulator doesn't remove old log files in which case we get
					// our logging jacked - we need to remove them before running the simulator
					if (!afs.exists(simulatorDir)) {
						return next();
					}
					
					afs.visitFiles(simulatorDir, function (filename, fullpath) {
						if (filename == logFile) {
							try {
								logger.debug(__('Removing old log file: %s', fullpath.cyan));
								fs.unlink(fullpath);
							} catch (e) {}
						}
					}, next);
				}
			], function () {
				var cmd = [
						'"' + path.join(build.titaniumIosSdkPath, 'ios-sim') + '"',
						'launch',
						'"' + build.xcodeAppDir + '"',
						'--sdk',
						build.iosSimVersion,
						'--family',
						build.deviceFamily
					],
					timer = setTimeout(function () {
						exec([
							'osascript',
							'"' + path.join(build.titaniumIosSdkPath, 'iphone_sim_activate.scpt') + '"',
							'"' + path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'Applications', 'iPhone Simulator.app') + '"'
						].join(' '), function (err, stdout, stderr) {
							if (err) {
								console.log('ACT ERR! ' + stderr);
							}
						})
					}, 500);
				
				cli.argv.retina && cmd.push('--retina');
				cmd = cmd.join(' ');
				
				logger.info(__('Launching application in iOS Simulator'));
				logger.debug(__('Simulator command: %s', cmd.cyan));
				
				exec('/bin/sh -c "' + cmd.replace(/"/g, '\\"') + '"', {
					cwd: build.titaniumIosSdkPath,
					env: {
						DYLD_FRAMEWORK_PATH: path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'Library', 'PrivateFrameworks') +
							':' + afs.resolvePath(build.xcodeEnv.path, '..', 'OtherFrameworks')
					}
				}, function (err, stdout, stderr) {
					if (err) {
						clearTimeout(timer);
						finished(new appc.exception(__('An error occurred running the iOS Simulator'), stderr.split('\n').map(function (line) {
							return line.replace(/^[(?:TRACE|DEBUG|INFO|WARN|ERROR)] /, '');
						})));
					} else {
						logger.info(__('Application has exited from iOS Simulator'));
						finished();
					}
				});
			});
		}
	});
	
};
