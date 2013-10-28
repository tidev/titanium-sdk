/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	exec = require('child_process').exec;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (build, finished) {
			if (cli.argv.target != 'device') return finished();

			async.parallel([
				function (next) {
					var pkgapp = path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					if (fs.existsSync(pkgapp)) {
						exec('"' + pkgapp + '" "' + build.xcodeAppDir + '"', function (err, stdout, stderr) {
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
				fs.existsSync(ipa) || (ipa = build.xcodeAppDir);

				if (cli.argv['build-only']) {
					logger.info(__('Performed build only, skipping installing of the application'));
					return finished();
				}

				logger.info(__('Installing application into iTunes'));

				exec('open -b com.apple.itunes "' + ipa + '"', function (err, stdout, stderr) {
					if (err) {
						return finished(new appc.exception(__('Failed to launch iTunes')));
					}

					logger.info(__('Initiating iTunes sync'));
					exec('osascript "' + path.join(build.titaniumIosSdkPath, 'itunes_sync.scpt') + '"', function (err, stdout, stderr) {
						if (err) {
							if (stderr.indexOf('(-1708)') != -1) {
								// stderr == "itunes_sync.scpt: execution error: iTunes got an error: every source doesn’t understand the count message. (-1708)"
								// TODO: alert that the EULA needs to be accepted and if prompting is enabled,
								// then wait for them to accept it and then try again
								finished(new appc.exception(__('Failed to initiate iTunes sync'), stderr.split('\n').filter(function (line) { return !!line.length; })));
							} else {
								finished(new appc.exception(__('Failed to initiate iTunes sync'), stderr.split('\n').filter(function (line) { return !!line.length; })));
							}
						} else {
							finished();
						}
					});
				});
			});
		}
	});

};
