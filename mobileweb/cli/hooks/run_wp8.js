/*
 * run.js: Titanium Mobile Web CLI run in Windows Phone 8 hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	spawn = require('child_process').spawn,
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	wp8 = require('titanium-sdk/lib/wp8');

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (build, finished) {
			if (cli.argv.target != 'wp8') {
				finished();
				return;
			}

			logger.info(__('Installing and launching the app'));
			wp8.detect(function (env) {

				var tiapp = build.tiapp,
					buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug',
					buildProcess;

				// Install and launch the app
				buildProcess = spawn(env.xapDeployCmd, [
					'/installlaunch',
					path.resolve(path.join(build.buildDir, '..', 'mobileweb-wp8',
						tiapp.name, 'Bin', buildType, tiapp.name + '_' + buildType + '_AnyCPU.xap')),
					'/targetdevice:' + cli.argv['device-id']]);
				buildProcess.stdout.on('data', function (data) {
					data.toString().split('\r\n').forEach(function (line) {
						if (line.length) {
							logger.trace(line);
						}
					});
				});
				buildProcess.stderr.on('data', function (data) {
					data.toString().split('\r\n').forEach(function (line) {
						if (line.length) {
							logger.error(line);
						}
					});
				});
				buildProcess.on('close', function (code) {
					if (code) {
						logger.info(__('There were errors building the project'));
						finished(code);
					} else {
						logger.info(__('Finished building the application'));
						finished();
					}
				});
			});
		}
	});
};