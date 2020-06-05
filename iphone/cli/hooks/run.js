/* eslint-disable security/detect-non-literal-regexp */

/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright (c) 2012-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	ioslib = require('ioslib'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	net = require('net'),
	exec = require('child_process').exec;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			let simStarted = false,
				lastLogger = 'debug',
				startLogTxt = '',
				endLogTxt = '';

			const levels = logger.getLevels(),
				trimRE = new RegExp('^.*' + builder.tiapp.name + '\\[[^\\]]+\\]\\s*', 'g'),
				logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\\s*(\u001b\\[\\d+m)?(.*)', 'i');

			if (cli.argv.target === 'macos') {

				const quitCommand = 'osascript -e ' + '\'' + 'quit app ' + '\"' + builder.tiapp.name + '\"' + '\'';
				logger.info(__(quitCommand));

				exec(quitCommand, function () {

				logger.info(__('Launching Mac application'));
				const command = 'open -a ' + builder.iosBuildDir + '/' + builder.tiapp.name + '.app/Contents/MacOS/' + builder.tiapp.name;

				exec(command, function () {
					// TO DO: It only log app messages. 
					// Need to  make logging better for macos and should be comparable to logging as in ios simulator and device. 
					// Probably can  be done after first release.
				    startLogTxt = __('Start mac application log');
					endLogTxt = __('End mac application log');
				function connectToLogServer() {
						if (builder.tiLogServerPort) {
							logger.trace(__('Trying to connect to log server port %s...', builder.tiLogServerPort).grey);

							(function tryConnecting() {
								var client = net.connect(builder.tiLogServerPort, function () {
							    logger.trace(__('Connected to log server port %s...', builder.tiLogServerPort).grey);

									var disconnectLogServer = function () {
										if (client) {
											client.end();
											client.destroy();
											client = null;
										}
									};

									client.on('close', () => {
										endLog();
										process.exit(0);
									});
								});
								client.on('data', data => {
									data.toString().split('\n').forEach(function (line) {
										line = line.replace(/\s+$/g, '');

										if (!simStarted) {
											simStarted = true;
											logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
										}
										line = line.replace(trimRE, '');
										var m = line.match(logLevelRE);

										if (m) {
											let line1 = m[0].trim();
											m = line1.match(logLevelRE);
											if (m) {
												lastLogger = m[2].toLowerCase();
												line1 = m[4].trim();
											}
											if (levels.indexOf(lastLogger) === -1) {
												// unknown log level
												logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line1);
											} else {
												logger[lastLogger](line1);
											}
										} else if (levels.indexOf(lastLogger) === -1) {
											logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + msg);
										} else {
											logger[lastLogger](msg);
										}
									});
								});
								client.on('error', err => {
									if (err.code === 'ECONNREFUSED') {
										client.destroy();
										setTimeout(tryConnecting, 250);
									} else {
										logger.error(__('Failed to connect to log server port %s...', err.message || err.toString()));									}
								});
							}());
						}
					};
					connectToLogServer();
				});
				});
			} else {
				if (cli.argv.target !== 'simulator') {
					return finished();
				}

				if (cli.argv['build-only']) {
					logger.info(__('Performed build only, skipping running of the application'));
					return finished();
				}

				logger.info(__('Launching iOS Simulator'));

				startLogTxt = __('Start simulator log');
				endLogTxt = __('End simulator log');

				ioslib.simulator
					.launch(builder.simHandle, {
						appPath:            builder.xcodeAppDir,
						focus:              cli.argv['sim-focus'],
						iosVersion:         builder.iosSdkVersion,
						killIfRunning:      false, // it will only kill the simulator if the device udid is different
						launchBundleId:     cli.argv['launch-bundle-id'],
						launchWatchApp:     builder.hasWatchApp && cli.argv['launch-watch-app'],
						launchWatchAppOnly: builder.hasWatchApp && cli.argv['launch-watch-app-only'],
						logFilename:        builder.tiapp.guid + '.log',
						watchHandleOrUDID:  builder.watchSimHandle,
						watchAppName:       cli.argv['watch-app-name']
					})
					.on('log-file', function (line) {
						// Titanium app log messages
						if (!simStarted) {
							simStarted = true;
							logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
						}
						line = line.replace(trimRE, '');
						var m = line.match(logLevelRE);
						if (m) {
							lastLogger = m[2].toLowerCase();
							line = m[4].trim();
						}
						if (levels.indexOf(lastLogger) === -1) {
							logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
						} else {
							logger[lastLogger](line);
						}
					})
					.on('log', function (msg, simHandle) {
						// system log messages
						logger.trace(('[' + simHandle.appName + '] ' + msg).grey);
					})
					.on('log-debug', function (msg) {
						// ioslib debug messages
						logger.trace(('[ioslib] ' + msg.replace('[DEBUG] ', '')).grey);
					})
					.on('log-error', function (msg, simHandle) {
						// system log error messages
						logger.error('[' + simHandle.appName + '] ' + msg);
					})
					.on('app-started', function () {
						finished && finished();
						finished = null;
					})
					.on('app-quit', function (code) {
						if (code) {
							if (code instanceof ioslib.simulator.SimulatorCrash) {
								logger.error(__n('Detected crash:', 'Detected multiple crashes:', code.crashFiles.length));
								code.crashFiles.forEach(function (f) {
									logger.error('  ' + f);
								});
								logger.error(__n('Note: this crash may or may not be related to running your app.', 'Note: these crashes may or may not be related to running your app.', code.crashFiles.length) + '\n');
							} else {
								logger.error(__('An error occurred running the iOS Simulator (exit code %s)', code));
							}
						}
						endLog();
						process.exit(0);
					})
					.on('exit', function () {
						// no need to stick around, exit
						endLog();
						process.exit(0);
					})
					.on('error', function (err) {
						endLog();
						logger.error(err.message || err.toString());
						logger.log();
						process.exit(0);
					});
			}

			function endLog() {
				if (simStarted) {
					logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
					simStarted = false;
				}
			};
							// listen for ctrl-c
			process.on('SIGINT', function () {
				logger.log();
				endLog();
				process.exit(0);
			});

		}
	});
};
