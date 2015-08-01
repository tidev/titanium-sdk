/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright (c) 2012-2015, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	ioslib = require('ioslib'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (cli.argv.target != 'simulator') return finished();

			if (cli.argv['build-only']) {
				logger.info(__('Performed build only, skipping running of the application'));
				return finished();
			}

			logger.info(__('Launching iOS Simulator'));

			var simStarted = false,
				startLogTxt = __('Start simulator log'),
				endLogTxt = __('End simulator log'),
				endLog = function () {
					if (simStarted) {
						logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						simStarted = false;
					}
				},
				lastLogger = 'debug',
				levels = logger.getLevels(),
				logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\s*(\u001b\\[\\d+m)?(.*)', 'i');

			ioslib.simulator.launch(builder.simHandle, {
				appPath: builder.xcodeAppDir,
				focus: cli.argv['sim-focus'],
				killIfRunning: false, // it will only kill the simulator if the device udid is different
				launchBundleId: cli.argv['launch-bundle-id'],
				launchWatchApp: builder.hasWatchApp && cli.argv['launch-watch-app'],
				launchWatchAppOnly: builder.hasWatchApp && cli.argv['launch-watch-app-only'],
				logFilename: builder.tiapp.guid + '.log',
				watchHandleOrUDID: builder.watchSimHandle,
				watchAppName: cli.argv['watch-app-name']
			}).on('log-file', function (line) {
				if (!simStarted) {
					finished && finished();
					finished = null;
					simStarted = true;
					logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
				}
				var m = line.match(logLevelRE);
				if (m) {
					lastLogger = m[2].toLowerCase();
					line = m[4].trim();
				}
				if (levels.indexOf(lastLogger) == -1) {
					logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
				} else {
					logger[lastLogger](line);
				}
			}).on('log-debug', function (msg) {
				logger.trace(('[ioslib] ' + msg.replace('[DEBUG] ', '')).grey);
			}).on('app-quit', function (code) {
				endLog();
				var ex;
				if (code) {
					if (code instanceof ioslib.simulator.SimulatorCrash) {
						ex = new appc.exception(
							__n('Detected crash:', 'Detected multiple crashes:', code.crashFiles.length),
							code.crashFiles.map(function (f) { return '  ' + f; }).concat(
								__n('Note: this crash may or may not be related to running your app.', 'Note: these crashes may or may not be related to running your app.', code.crashFiles.length)
							)
						);
					} else {
						ex = new appc.exception(__('An error occurred running the iOS Simulator (ios-sim exit code %s)', code));
					}
				}
				finished && finished(ex);
				finished = null;
			}).on('exit', function () {
				// no need to stick around, exit
				endLog();
				finished && finished();
				finished = null;
			}).on('error', function (err) {
				endLog();
				logger.error(err);
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