/*
 * run.js: Titanium Mobile Web CLI run in Windows Phone 8 hook
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	path = require('path'),
	spawn = require('child_process').spawn,
	windows = require('titanium-sdk/lib/windows'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {

	if (process.platform != 'win32') {
		return;
	}

	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (cli.argv.target != 'wp8') {
				finished();
				return;
			}

			windows.detect(config, null, function (env) {
				var wpInfo = windows.getSelectedWindowsPhoneSDK(env);

				if (!wpInfo) {
					var validVersions = Object.keys(env.windowsphone).filter(function (v) { return env.windowsphone[v].supported; }).sort();
					if (validVersions.length) {
						logger.error(
							__('Unable to find a suitable Windows Phone SDK.') + '\n' +
							__('Manually select one of the following: %s', validVersions.join(', ')) + '\n' +
							'  titanium config windows.windowsphone.selectedVersion <version>\n'
						);
					} else {
						logger.error(
							__('Unable to find a suitable Windows Phone SDK.') + '\n' +
							__('You can install it from %s.', '__http://appcelerator.com/windowsphone__') + '\n'
						);
					}
					return finished(1);
				}

				function makePipe(log) {
					return function (data) {
						data.toString().split(/\r\n|\n/).forEach(function (line) {
							line = line.trim();
							line.length && log(line);
						});
					};
				}

				var tiapp = builder.tiapp,
					buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug',
					cmd = wpInfo.xapDeployCmd,
					args = [
						'/installlaunch',
						path.resolve(builder.buildDir, '..', 'mobileweb-wp8', tiapp.id, 'Bin', buildType, tiapp.id + '_' + buildType + '_AnyCPU.xap'),
						'/targetdevice:' + cli.argv['device-id']
					];

				logger.info(__('Installing and launching the application'));
				logger.debug(__('Running: %s', (cmd + ' "' + args.join('" "') + '"').cyan));

				var child = spawn(cmd, args);
				child.stdout.on('data', makePipe(logger.trace));
				child.stderr.on('data', makePipe(logger.error));
				child.on('close', function (code) {
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