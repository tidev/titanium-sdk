/*
 * package.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	wrench = require('wrench'),
	exec = require('child_process').exec;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (build, finished) {
			if (!/dist-(appstore|adhoc)/.test(cli.argv.target)) return finished();

			switch (cli.argv.target) {
				case 'dist-appstore':
					logger.info('Packaging for App Store distribution');

					var name = build.tiapp.name,
						now = new Date(),
						month = now.getMonth() + 1,
						day = now.getDate(),
						hours = now.getHours(),
						minutes = now.getMinutes(),
						seconds = now.getSeconds(),
						archiveBundle = afs.resolvePath('~/Library/Developer/Xcode/Archives',
							now.getFullYear() + '-' + (month >= 10 ? month : '0' + month) + '-' + (day >= 10 ? day : '0' + day) + path.sep +
							name + '_' + (hours >= 10 ? hours : '0' + hours) + '-' + (minutes >= 10 ? minutes : '0' + minutes) + '-' +
							(seconds >= 10 ? seconds : '0' + seconds) + '.xcarchive'),
						archiveApp = path.join(archiveBundle, 'Products', 'Applications', name + '.app'),
						archiveDsym = path.join(archiveBundle, 'dSYMs', name + '.app.dSYM');

					wrench.mkdirSyncRecursive(archiveApp);
					wrench.mkdirSyncRecursive(archiveDsym);

					async.parallel([
						function (next) {
							logger.info(__('Archiving app bundle to %s', archiveApp.cyan));
							exec('ditto "' + build.xcodeAppDir + '" "' + archiveApp + '"', next);
						},
						function (next) {
							logger.info(__('Archiving debug symbols to %s', archiveDsym.cyan));
							exec('ditto "' + build.xcodeAppDir + '.dSYM" "' + archiveDsym + '"', next);
						},
						function (next) {
							var tempPlist = path.join(archiveBundle, 'Info.xml.plist');

							exec('/usr/bin/plutil -convert xml1 -o "' + tempPlist + '" "' + path.join(build.xcodeAppDir, 'Info.plist') + '"', function (err, stdout, strderr) {
								var origPlist = new appc.plist(tempPlist),
									newPlist = new appc.plist(),
									appBundle = 'Applications/' + name + '.app';

								fs.unlinkSync(tempPlist);

								appc.util.mix(newPlist, {
									ApplicationProperties: {
										ApplicationPath: appBundle,
										CFBundleIdentifier: origPlist.CFBundleIdentifier,
										CFBundleShortVersionString: appc.version.format(origPlist.CFBundleVersion, 3, 3),
										IconPaths: [
											appBundle + '/' + build.tiapp.icon
										]
									},
									ArchiveVersion: newPlist.type('real', 1),
									CreationDate: now,
									Name: name,
									SchemeName: name
								}).save(path.join(archiveBundle, 'Info.plist'));

								next();
							});
						}
					], function () {
						// workaround for dumb Xcode4 bug that doesn't update the organizer unless files are touched in a very specific manner
						var temp = afs.resolvePath('~/Library/Developer/Xcode/Archives/temp');
						fs.renameSync(archiveBundle, temp);
						fs.renameSync(temp, archiveBundle);

						// open xcode + organizer after packaging
						logger.info(__('Launching Xcode: %s', build.xcodeEnv.xcodeapp.cyan));
						exec('open -a "' + build.xcodeEnv.xcodeapp + '"', function (err, stdout, stderr) {
							process.env.TI_ENV_NAME = process.env.STUDIO_NAME || 'Terminal.app';
							exec('osascript "' + path.join(build.platformPath, 'xcode_organizer.scpt') + '"', { env: process.env }, function (err, stdout, stderr) {
								logger.info(__('Packaging complete'));
								finished();
							});
						});
					});
					break;

				case 'dist-adhoc':
					logger.info('Packaging for Ad Hoc distribution');
					var pkgapp = path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					exec('"' + pkgapp + '" "' + build.xcodeAppDir + '"', function (err, stdout, stderr) {
						if (err) {
							logger.error(__('Failed to package application'));
							stderr.split('\n').forEach(logger.error);
							return finished();
						}

						var ipa = path.join(path.dirname(build.xcodeAppDir), build.tiapp.name + '.ipa'),
							dest = ipa,
							outputDir = cli.argv['output-dir'] && afs.resolvePath(cli.argv['output-dir']);

						if (outputDir && outputDir != path.dirname(dest)) {
							fs.existsSync(outputDir) || wrench.mkdirSyncRecursive(outputDir);
							dest = path.join(outputDir, build.tiapp.name + '.ipa');
							fs.existsSync(dest) && fs.unlinkSync(dest);
							afs.copyFileSync(ipa, dest, { logger: logger.debug });
						}

						logger.info(__('Packaging complete'));
						logger.info(__('Package location: %s', dest.cyan));

						finished();
					});
					break;
			}
		}
	});

};
