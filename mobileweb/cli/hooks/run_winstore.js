/*
 * run.js: Titanium Mobile Web CLI run in Windows Store hook
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	async = require('async');

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (build, finished) {
			if (cli.argv.target != 'winstore') {
				finished();
				return;
			}

			var tiapp = build.tiapp,
				previousPackageFullName;

			async.series([

				// Check if the app is already running
				function (next) {
					logger.info(__('Checking to see if the application is already installed'));
					exec('powershell.exe -command "Get-AppxPackage"', function (code, stdout, stderr) {
						var lines,
							i, len,
							packageFullNameLineRegex = new RegExp('PackageFullName[\\s]*:[\\s]*(' + tiapp.id + '.*)'),
							match;
						if (code) {
							logger.error(__('Could not query the list of installed Windows Store apps: %s', stderr || code));
							next(code);
						} else {
							lines = stdout.split('\r\n');
							for (i = 0, len = lines.length; i < len; i++) {
								match = packageFullNameLineRegex.exec(lines[i]);
								if (match) {
									previousPackageFullName = match[1];
								}
							}
							logger.info('App is not already installed');
							next();
						}
					});
				},

				// Remove the previously installed app, if it exists
				function (next) {
					if (previousPackageFullName) {
						logger.info(__('App was previously installed, uninstalling now'));
						exec('powershell.exe -command "Remove-AppxPackage \\"' + previousPackageFullName + '\\"',
							function (code, stdout, stderr) {
								if (code) {
									logger.error(__('Could not remove the previously installed app: %s', stderr || code));
								} else {
									logger.info(__('Successfully removed the previously installed app'));
								}
								next(code);
						});
					} else {
						next();
					}
				},

				// Install the app
				function (next) {
					var installProcess,
						buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug';

					logger.info(__('Installing the app'));
					installProcess = spawn('powershell.exe', [ path.join(build.buildDir, '..', 'mobileweb-winstore',
						tiapp.id, 'AppPackages', tiapp.id + '_' + tiapp._windowsVersion + '_AnyCPU_' + buildType + '_Test',
						'Add-AppDevPackage.ps1'), '-Force' ]);
					installProcess.stdout.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							line = line.trim();
							if (line.length) {
								logger.trace(line);
							}
						});
					});
					installProcess.stderr.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							line = line.trim();
							if (line.length) {
								logger.error(line);
							}
						});
					});
					installProcess.on('close', function (code) {
						if (code) {
							logger.info(__('There were errors deploying the project. You may need to enable script execution by running "Set-ExecutionPolicy RemoteSigned" from an elevated powershell prompt'));
						} else {
							logger.info(__('Finished deploying the application'));
						}
						next(code);
					});
				}
			], function (err) {
				finished(err);
			});
		}
	});
};