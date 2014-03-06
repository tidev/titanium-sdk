/*
 * run.js: Titanium Mobile Web CLI run in Windows Store hook
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
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
		post: function (build, finished) {
			if (cli.argv.target != 'winstore') {
				finished();
				return;
			}

			logger.info(__('Installing and launching the application'));

			windows.detect(config, null, function (env) {
				var powershell = config.get('windows.executables.powershell', 'powershell'),
					tiapp = build.tiapp,
					previousPackageFullName;

				async.series([
					// Check if the app is already running
					function (next) {
						logger.info(__('Checking to see if the application is already installed'));
						appc.subprocess.run(powershell, [ '-command', 'Get-AppxPackage' ], function (code, out, err) {
							if (code) {
								logger.error(__('Could not query the list of installed Windows Store apps: %s', err || code));
							} else {
								var packageFullNameLineRegex = new RegExp('PackageFullName[\\s]*:[\\s]*(' + tiapp.id + '.*)');

								out.split(/\r\n|\n/).forEach(function (line) {
									line = line.trim();
									var m = line.match(packageFullNameLineRegex);
									if (m) {
										previousPackageFullName = m[1];
									}
								});
							}
							next(code);
						});
					},

					// Remove the previously installed app, if it exists
					function (next) {
						if (previousPackageFullName) {
							logger.debug(__('App is already installed, uninstalling now'));
							appc.subprocess.run(powershell, [ '-command', 'Remove-AppxPackage', previousPackageFullName ], function (code, out, err) {
								if (code) {
									logger.error(__('Could not remove the previously installed app: %s', err || code));
								} else {
									logger.debug(__('Successfully removed the previously installed app'));
								}
								next(code);
							});
						} else {
							next();
						}
					},

					// Install the app
					function (next) {
						var buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug';

						appc.subprocess.getRealName(path.resolve(
							build.buildDir,
							'..',
							'mobileweb-winstore',
							tiapp.id,
							'AppPackages',
							tiapp.id + '_' + tiapp._windowsVersion + '_AnyCPU_' + buildType + '_Test',
							'Add-AppDevPackage.ps1'
						), function (err, psScript) {
							var installProcess,
								args = [ '-command', psScript + ' -Force' ];

							logger.info(__('Installing the app'));
							logger.debug(__('Running: %s', (powershell + ' "' + args.join('" "') + '"').cyan));
							appc.subprocess.run(powershell, args, function (code, out, err) {
								if (!code) {
									logger.debug(__('Finished deploying the application'));
									return next();
								}

								if (out.indexOf('Please rerun the script without the -Force parameter') == -1) {
									logger.error(__('There were errors deploying the application') + '\n');
									process.exit(1);
								}

								var args = [ '-command', psScript ];
								logger.debug(__('Failed, trying again without -Force'));
								logger.debug(__('Running: %s', (powershell + ' "' + args.join('" "') + '"').cyan));
								appc.subprocess.run(powershell, args, function (code, out, err) {
									if (code) {
										logger.error(__('There were errors deploying the application') + '\n');
									} else {
										logger.info(__('Finished deploying the application'));
									}
									next(code);
								});
							});
						});
					},

					// Launch the app
					function (next) {
						var cmd = path.resolve(__dirname, '..', '..', '..', 'common', 'Win8AppLauncher', 'AppLauncher.exe'),
							args = [
								tiapp.id,
								tiapp._windowsVersion // this is the cleaned up tiapp.version from package_windows.js
							];

						logger.info(__('Launching the application'));
						logger.debug(__('Running: %s', (cmd + ' ' + args.join(' ')).cyan));

						function makePipe(log) {
							return function (data) {
								data.toString().split(/\r\n|\n/).forEach(function (line) {
									line = line.trim();
									line.length && log(line);
								});
							};
						}

						var child = spawn(cmd, args);
						child.stdout.on('data', makePipe(logger.trace));
						child.stderr.on('data', makePipe(logger.error));
						child.on('close', function (code) {
							if (code) {
								logger.error(__('There were errors launching the application.'));
								logger.error(__('You may need to enable script execution by running "Set-ExecutionPolicy AllSigned" from within PowerShell'));
							} else {
								logger.info(__('Finished launching the application'));
							}
							next(code);
						});
					}
				], finished);
			});
		}
	});
};