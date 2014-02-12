/*
 * run.js: Titanium Mobile Web CLI run in Windows Phone 8 hook
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
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

	if (process.platform != 'win32') {
		return;
	}

	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (build, finished) {
			if (cli.argv.target != 'wp8') {
				finished();
				return;
			}

			logger.info(__('Installing and launching the application'));
			wp8.detect(function (env) {

				if (env.issues.length) {
					logger.error(__('There were issues detected with the Windows Phone 8 development environment setup. ' +
						'Please run "titanium info" for more information'));
					process.exit(1);
				}

				var tiapp = build.tiapp,
					buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug',
					installProcess;

				// Install and launch the app
				installProcess = spawn(env.xapDeployCmd, [
					'/installlaunch',
					path.resolve(path.join(build.buildDir, '..', 'mobileweb-wp8',
						tiapp.id, 'Bin', buildType, tiapp.id + '_' + buildType + '_AnyCPU.xap')),
					'/targetdevice:' + cli.argv['device-id']]);
				installProcess.stdout.on('data', function (data) {
					data.toString().split('\r\n').forEach(function (line) {
						if (line.length) {
							logger.trace(line);
						}
					});
				});
				installProcess.stderr.on('data', function (data) {
					data.toString().split('\r\n').forEach(function (line) {
						if (line.length) {
							logger.error(line);
						}
					});
				});
				installProcess.on('close', function (code) {
					if (code) {
						finished(code);
					} else {
						logger.info(__('Finished launching the application'));
						finished();
					}
				});
			});
		}
	});
};