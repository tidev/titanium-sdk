/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright (c) 2012-2014, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	ioslib = require('ioslib'),
	__ = appc.i18n(__dirname).__;

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
				lastLogger = 'debug',
				levels = logger.getLevels(),
				logLevelRE = new RegExp('^(\u001b\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\s*(\u001b\\[\\d+m)?(.*)', 'i');

			ioslib.simulator.launch(builder.deviceId, {
				appName: builder.tiapp.name,
				appPath: builder.xcodeAppDir,
				focus: cli.argv['sim-focus'],
				logFilename: builder.tiapp.guid + '.log',
				simType: builder.iosSimType,
				simVersion: builder.iosSimVersion
			}).on('appStarted', function (simHandle) {
				simStarted = true;
				logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
			}).on('logFile', function (line) {
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
			}).on('quit', function (code) {
				if (simStarted) {
					logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey);
				}

				if (code) {
					finished(new appc.exception(__('An error occurred running the iOS Simulator')));
				} else {
					logger.info(__('Application has exited from iOS Simulator'));
					finished();
				}
			}).on('error', function (err) {
				if (simStarted) {
					logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey);
				}
				logger.error(err);
				logger.log();
				process.exit(0);
			});
		}
	});
};