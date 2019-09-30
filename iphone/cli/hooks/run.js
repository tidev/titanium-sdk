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
	__n = i18n.__n;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (cli.argv.target !== 'simulator') {
				return finished();
			}

			if (cli.argv['build-only']) {
				logger.info(__('Performed build only, skipping running of the application'));
				return finished();
			}

			logger.info(__('Launching iOS Simulator'));

			let simStarted = false,
				lastLogger = 'debug';
			const startLogTxt = __('Start simulator log'),
				endLogTxt = __('End simulator log'),
				levels = logger.getLevels(),
				logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\\s*(\u001b\\[\\d+m)?(.*)', 'i'); // eslint-disable-line security/detect-non-literal-regexp

			function endLog() {
				if (simStarted) {
					logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
					simStarted = false;
				}
			}
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
					let skipLine = false;

					if (!simStarted) {
						if (line.indexOf('{') === 0) {
							try {
								const headers = JSON.parse(line);
								if (headers.appId !== builder.tiapp.id) {
									logger.error(__('Another Titanium app "%s" is currently running and using the log server port %d', headers.appId, builder.tiLogServerPort));
									logger.error(__('Stop the running Titanium app, then rebuild this app'));
									logger.error(__('-or-'));
									logger.error(__('Set a unique <log-server-port> between 1024 and 65535 in the <ios> section of the tiapp.xml') + '\n');
									process.exit(1);
								}
							} catch (e) {
								// squeltch
							}
							skipLine = true;
						}

						simStarted = true;
						logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
					}

					if (skipLine) {
						return;
					}

					const m = line.match(logLevelRE);
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

			// listen for ctrl-c
			process.on('SIGINT', function () {
				logger.log();
				endLog();
				process.exit(0);
			});
		}
	});
};
