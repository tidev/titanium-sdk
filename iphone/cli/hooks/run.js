/* eslint-disable security/detect-non-literal-regexp */
/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * See the LICENSE file for more information.
 */
'use strict';

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (cli.argv.target !== 'simulator' && cli.argv.target !== 'macos') {
				return finished();
			}

			const i18n = require('node-appc').i18n(__dirname);
			const __ = i18n.__;
			const __n = i18n.__n;

			if (cli.argv['build-only']) {
				logger.info(__('Performed build only, skipping running of the application'));
				return finished();
			}

			const ioslib = require('ioslib');
			const path = require('path');
			const fs = require('fs-extra');
			// eslint-disable-next-line security/detect-child-process
			const { exec, spawn } = require('child_process');

			let simStarted = false;
			let lastLogger = 'debug';
			let startLogTxt = '';
			let endLogTxt = '';

			// Clean up when the process/sim/app exits
			let logFileTail;
			function endLog() {
				if (simStarted) {
					logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
					simStarted = false;
				}
				if (logFileTail) {
					logFileTail.unwatch();
					logFileTail = null;
				}
			}
			// listen for ctrl-c
			process.on('SIGINT', () => {
				logger.log();
				endLog();
				process.exit(128); // Use 128 as assumed value for SIGINT, See https://nodejs.org/api/process.html
			});

			// Handle logging (forward app logging to this process)
			const levels = logger.getLevels();
			const trimRE = new RegExp('^.*' + builder.tiapp.name + '\\[[^\\]]+\\]\\s*', 'g');
			const logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\\s*(\u001b\\[\\d+m)?(.*)', 'i');
			function handleLogFile(line) {
				// Titanium app log messages
				if (!simStarted) {
					simStarted = true;
					logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
				}
				line = line.replace(trimRE, '');
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
			}

			if (cli.argv.target === 'macos') {
				startLogTxt = __('Start mac application log');
				endLogTxt = __('End mac application log');

				const HOME = require('os').homedir();
				// NOTE: if app is not sandboxed, log file is at path.join(HOME, 'Documents', `${builder.tiapp.guid}.log`);
				const logFile = path.join(HOME, `Library/Containers/${builder.tiapp.id}/Data/Documents/${builder.tiapp.guid}.log`);

				// TODO: It does force quit. Find another way to quit.
				exec(`pkill -QUIT -x ${builder.tiapp.name}`, function () {
					// If there's already a log file from previous run, wipe it
					if (fs.pathExistsSync(logFile)) {
						try {
							fs.accessSync(logFile, fs.constants.W_OK);
							fs.removeSync(logFile);
						} catch (err) {
							// Note to user that they process does not have rights to the log file, which typically means macos
							// Catalina has prompted and been denied access to the user's Documents folder!
							// they'll need to add node (or whatever host process) rights to the Documents folder
							logger.error('This process does not have rights to delete the existing log file. Please ensure you have not denied rights to your Documents folder, as it may result in not being able to see the app logs. If so, you will need to allow access in the System Preferences > Security & Privacy > Files and Folders UI.');
						}
					}

					// Open the app
					logger.info(__('Launching Mac application'));
					const child = spawn('open', [ '-a', `${builder.iosBuildDir}/${builder.tiapp.name}.app`, '-W' ]);
					child.on('error', err => logger.error(err));
					// "Forward" the exit code of the app to this process (when the app exits)
					child.on('exit', (code, _signal) => {
						endLog();
						process.exit(code);
					});
					child.on('close', (code, _signal) => {
						endLog();
						process.exit(code);
					});
					// Now tail the log file
					const Tail = require('always-tail');
					logFileTail = new Tail(logFile, '\n', { interval: 500, start: 0 });
					logFileTail.on('line', function (msg) {
						handleLogFile(msg);
					});
					logFileTail.watch();

					// we're done
					finished && finished();
					finished = null;
				});
			} else {
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
						handleLogFile(line);
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
						// TODO: Add "installed" event to "ioslib" module for simulators and emit below event from there.
						cli.emit('build.post.install', builder, () => {
							finished && finished();
							finished = null;
						});
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
						process.exit(1);
					});
			}
		}
	});
};
