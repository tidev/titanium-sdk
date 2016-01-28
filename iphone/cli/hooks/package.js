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

						productsDir = path.join(build.buildDir, 'build', 'Products'),

						archiveBundle = afs.resolvePath('~/Library/Developer/Xcode/Archives',
							now.getFullYear() + '-' + (month >= 10 ? month : '0' + month) + '-' + (day >= 10 ? day : '0' + day) + path.sep +
							name + '_' + (hours >= 10 ? hours : '0' + hours) + '-' + (minutes >= 10 ? minutes : '0' + minutes) + '-' +
							(seconds >= 10 ? seconds : '0' + seconds) + '.xcarchive'),
						archiveApp = path.join(archiveBundle, 'Products', 'Applications', name + '.app'),
						archiveDsymDir = path.join(archiveBundle, 'dSYMs'),
						dsymRegExp = /\.dSYM$/,

						bcSymbolMapsDir = path.join(archiveBundle, 'BCSymbolMaps'),
						bcSymbolMapsRegExp = /\.bcsymbolmap$/,

						// no clue what this is for
						scmBlueprintDir = path.join(archiveBundle, 'SCMBlueprint'),

						watchKitSupport2Dir = path.join(archiveBundle, 'WatchKitSupport2');

					if (!fs.existsSync(productsDir) || !fs.statSync(productsDir).isDirectory()) {
						// this should never happen!
						logger.error(__('Products dir "%s" does not exist!', productsDir) + '\n');
						process.exit(1);
					}

					wrench.mkdirSyncRecursive(archiveApp);
					wrench.mkdirSyncRecursive(archiveDsymDir);
					wrench.mkdirSyncRecursive(bcSymbolMapsDir);
					wrench.mkdirSyncRecursive(scmBlueprintDir);

					async.parallel([
						function archiveApplication(next) {
							logger.info(__('Archiving app bundle: %s', archiveApp.cyan));
							appc.subprocess.run('ditto', [ build.xcodeAppDir, archiveApp ], next);
						},

						function archiveDebugAndBitCodeSymbols(next) {
							var dsyms = [],
								bcSymbolMaps = [];

							fs.readdirSync(productsDir).forEach(function (name) {
								var subdir = path.join(productsDir, name);
								if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
									fs.readdirSync(subdir).forEach(function (name) {
										var file = path.join(subdir, name);
										if (fs.existsSync(file)) {
											if (dsymRegExp.test(name) && fs.statSync(file).isDirectory()) {
												dsyms.push(file);
											} else if (bcSymbolMapsRegExp.test(name) && !fs.statSync(file).isDirectory()) {
												bcSymbolMaps.push(file);
											}
										}
									});
								}
							});

							async.each(dsyms, function (dsym, cb) {
								var dest = path.join(archiveDsymDir, path.basename(dsym));
								logger.info(__('Archiving debug symbols: %s', dest.cyan));
								appc.subprocess.run('ditto', [ dsym, dest ], cb);
							}, function (err) {
								if (err) {
									return next(err);
								}

								bcSymbolMaps.forEach(function (bcSymbolMap) {
									var dest = path.join(bcSymbolMapsDir, path.basename(bcSymbolMap));
									logger.info(__('Archiving Bitcode Symbol Map: %s', dest.cyan));
									fs.writeFileSync(dest, fs.readFileSync(bcSymbolMap));
								});

								next();
							});
						},
						function archiveWatchKitSupportFiles(next) {
							// NOTE: this will probably break when WatchKit 3 hits the scene
							if (build.hasWatchAppV2orNewer) {
								wrench.mkdirSyncRecursive(watchKitSupport2Dir);

								// find the _WatchKitStub dir
								var watchDir = path.join(build.xcodeAppDir, 'Watch');
								if (fs.existsSync(watchDir) && fs.statSync(watchDir).isDirectory()) {
									fs.readdirSync(watchDir).forEach(function (name) {
										var watchAppDir = path.join(watchDir, name);
										if (fs.existsSync(watchAppDir) && fs.statSync(watchAppDir).isDirectory()) {
											var wkStubDir = path.join(watchAppDir, '_WatchKitStub');
											if (fs.existsSync(wkStubDir) && fs.statSync(wkStubDir).isDirectory()) {
												logger.info(__('Archiving %s support files: %s', name.cyan, wkStubDir.cyan));
												build.copyDirSync(wkStubDir, watchKitSupport2Dir, { forceCopy: true });
											}
										}
									});
								}
							}
							next();
						},
						function archiveInfoPlist(next) {
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
										CFBundleShortVersionString: origPlist.CFBundleShortVersionString,
										CFBundleVersion: origPlist.CFBundleVersion,
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
