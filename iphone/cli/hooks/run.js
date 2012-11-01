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
	exec = cp.exec,
	spawn = cp.spawn;

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
			
			var simulatorDir = afs.resolvePath('~/Library/Application Support/iPhone Simulator/' + build.iosSimVersion + '/Applications'),
				logFile = build.tiapp.guid + '.log';
			
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
					// sometimes the simulator doesn't remove old log files in which case we get
					// our logging jacked - we need to remove them before running the simulator
					afs.exists(simulatorDir) && fs.readdirSync(simulatorDir).forEach(function (guid) {
						var file = path.join(simulatorDir, guid, 'Documents', logFile);
						if (afs.exists(file)) {
							logger.debug(__('Removing old log file: %s', file.cyan));
							fs.unlinkSync(file);
						}
					});
					
					next();
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
					findLogTimer,
					simActivateTimer = setTimeout(function () {
						exec([
							'osascript',
							'"' + path.join(build.titaniumIosSdkPath, 'iphone_sim_activate.scpt') + '"',
							'"' + path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'Applications', 'iPhone Simulator.app') + '"'
						].join(' '), function (err, stdout, stderr) {
							if (err) {
								logger.error(__('Failed to activate the iPhone Simulator window'));
								logger.error(stderr);
							}
						})
					}, 500),
					simProcess,
					simErr = [],
					stripLogLevelRE = new RegExp('[(?:' + logger.getLevels().join('|') + ')] '),
					logLevelRE = new RegExp('(\u001b\\[\\d+m)?\\[?(' + logger.getLevels().join('|') + ')\\]?\s*(\u001b\\[\\d+m)?(.*)', 'i'),
					logProcess;
				
				cli.argv.retina && cmd.push('--retina');
				cmd = cmd.join(' ');
				
				logger.info(__('Launching application in iOS Simulator'));
				logger.debug(__('Simulator command: %s', cmd.cyan));
				
				simProcess = spawn('/bin/sh', ['-c', cmd], {
					cwd: build.titaniumIosSdkPath,
					env: {
						DYLD_FRAMEWORK_PATH: path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'Library', 'PrivateFrameworks') +
							':' + afs.resolvePath(build.xcodeEnv.path, '..', 'OtherFrameworks')
					}
				});
				
				simProcess.stderr.on('data', function (data) {
					data.toString().split('\n').forEach(function (line) {
						line.length && simErr.push(line.replace(stripLogLevelRE, ''));
					}, this);
				}.bind(this));
				
				simProcess.on('exit', function (code, signal) {
					clearTimeout(simActivateTimer);
					clearTimeout(findLogTimer);
					logProcess && logProcess.kill();
					
					if (code) {
						finished(new appc.exception(__('An error occurred running the iOS Simulator'), simErr));
					} else {
						logger.info(__('Application has exited from iOS Simulator'));
						finished();
					}
				}.bind(this));
				
				function findLogFile() {
					var files = fs.readdirSync(simulatorDir),
						file,
						i = 0,
						l = files.length;
					
					for (; i < l; i++) {
						file = path.join(simulatorDir, files[i], 'Documents', logFile);
						if (afs.exists(file)) {
							logger.debug(__('Found iPhone Simulator log file: %s', file.cyan));
							logger.info(__('iPhone Simulator log:'));
							
							logProcess = spawn('/usr/bin/tail', ['-f', file]);
							
							logProcess.stdout.on('data', function (data) {
								data.toString().split('\n').forEach(function (line) {
									if (line) {
										var m = line.match(logLevelRE);
										if (m) {
											logger[m[2].toLowerCase()](m[4].trim());
										} else {
											logger.debug(line);
										}
									}
								});
							});
							
							return;
						}
					}
					
					findLogTimer = setTimeout(findLogFile, 250);
				}
				
				afs.exists(simulatorDir) && findLogFile();
			});
		}
	});
	
};
