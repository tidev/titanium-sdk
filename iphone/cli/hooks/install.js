/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	path = require('path'),
	async = require('async'),
	exec = require('child_process').exec;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	
	cli.addHook('build.post', {
		priority: 8000,
		post: function (build, finished) {
			if (cli.argv.target != 'device') return finished();
			
			if (cli.argv['build-only']) {
				logger.info('Performed build only, skipping installing of the application');
				return finished();
			}
			
			logger.info('Installing application into iTunes');
			
			async.parallel([
				function (next) {
					var pkgapp = path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					if (afs.exists(pkgapp)) {
						exec(pkgapp + ' "' + build.xcodeAppDir + '"', function (err, stdout, stderr) {
							if (err) {
								logger.warn(__('An error occurred running the iOS Package Application tool'));
								stderr.split('\n').forEach(logger.debug);
							}
							next();
						});
					} else {
						logger.warn(__('Unable to locate iOS Package Application tool'));
						next();
					}
				}
			], function () {
				var ipa = path.join(path.dirname(build.xcodeAppDir), build.tiapp.name + '.ipa');
				afs.exists(ipa) || (ipa = build.xcodeAppDir);
				
				logger.info(__('Launching iTunes'));
				exec('open -b com.apple.itunes "' + ipa + '"', function (err, stdout, stderr) {
					if (err) {
						return finished(new appc.exception(__('Failed to launch iTunes')));
					}
					
					logger.info(__('Initiating iTunes sync'));
					exec('osascript "' + path.join(build.titaniumIosSdkPath, 'itunes_sync.scpt') + '"', function (err, stdout, stderr) {
						if (err) {
							finished(new appc.exception(__('Failed to initiate iTunes sync')));
						} else {
							finished();
						}
					});
				});
			});
		}
	});
	
};
