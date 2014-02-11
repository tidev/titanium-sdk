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
	async = require('async'),
	winstore = require('titanium-sdk/lib/winstore');

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
			winstore.detect(function (env) {

				if (env.issues.length) {
					console.error(__('There were issues detected with the Windows Store development environment setup. ' +
						'Please run "titanium info" for more information'));
					process.exit(1);
				}

				var tiapp = build.tiapp,
					previousPackageFullName;

				async.series([

					// Check if the app is already running
					function (next) {
						logger.debug(__('Checking to see if the application is already installed'));
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
								next();
							}
						});
					},

					// Remove the previously installed app, if it exists
					function (next) {
						if (previousPackageFullName) {
							logger.debug(__('App is already installed, uninstalling now'));
							exec('powershell.exe -command "Remove-AppxPackage \\"' + previousPackageFullName + '\\"',
								function (code, stdout, stderr) {
									if (code) {
										logger.error(__('Could not remove the previously installed app: %s', stderr || code));
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

						appc.subprocess.getRealName(path.join(
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
							logger.debug(__('Running: %s', ('powershell.exe "' + args.join('" "') + '"').cyan));
							appc.subprocess.run('powershell.exe', args, function (code, out, err) {
								if (!code) {
									logger.debug(__('Finished deploying the application'));
									return next();
								}

								if (out.indexOf('Please rerun the script without the -Force parameter') == -1) {
									logger.error(__('There were errors deploying the application') + '\n');
									process.exit(1);
								}

								args = [ '-command', psScript ];
								logger.debug(__('Failed, trying again without -Force'));
								logger.debug(__('Running: %s', ('powershell.exe "' + args.join('" "') + '"').cyan));
								appc.subprocess.run('powershell.exe', args, function (code, out, err) {
									if (code) {
										logger.error(__('There were errors deploying the application') + '\n');
										process.exit(1);
									} else {
										logger.debug(__('Finished deploying the application'));
										next();
									}
								});
							});
						});
					},

					// Launch the app
					function (next) {
						var launchProcess;

						logger.info(__('Launching the application'));

						launchProcess = spawn(path.join(__dirname, '..', '..', '..', 'common', 'Win8AppLauncher', 'AppLauncher.exe'),
							[ tiapp.id, tiapp._windowsVersion ]);
						launchProcess.stdout.on('data', function (data) {
							data.toString().split('\r\n').forEach(function (line) {
								line = line.trim();
								if (line.length) {
									logger.trace(line);
								}
							});
						});
						launchProcess.stderr.on('data', function (data) {
							data.toString().split('\r\n').forEach(function (line) {
								line = line.trim();
								if (line.length) {
									logger.error(line);
								}
							});
						});
						launchProcess.on('close', function (code) {
							if (code) {
								logger.error(__('There were errors launching the application. ' +
									'You may need to enable script execution by running "Set-ExecutionPolicy AllSigned" from within PowerShell'));
							} else {
								logger.info(__('Finished launching the application'));
							}
							next(code);
						});
					}
				], function (err) {
					finished(err);
				});
			});
		}
	});
};