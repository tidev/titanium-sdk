/*
 * package.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012-2016, Appcelerator, Inc.  All Rights Reserved.
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
	cli.on('build.ios.xcodebuild', {
		pre: function (data, finished) {
			if (this.target !== 'dist-appstore') {
				return finished();
			}

			var stagingArchiveDir = path.join(this.buildDir, 'staging.xcarchive');
			fs.existsSync(stagingArchiveDir) && wrench.rmdirSyncRecursive(stagingArchiveDir);

			// inject the temporary archive path into the xcodebuild args
			var args = data.args[1];
			var p = args.indexOf('-archivePath');
			if (p === -1) {
				args.push('-archivePath', stagingArchiveDir);
			} else {
				args[p + 1] = stagingArchiveDir;
			}

			finished();
		}
	});

	cli.on('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			switch (cli.argv.target) {
				case 'dist-appstore':
					logger.info(__('Preparing xcarchive'));

					var name = builder.tiapp.name;

					var stagingArchiveDir = path.join(builder.buildDir, 'staging.xcarchive');
					if (!fs.existsSync(stagingArchiveDir)) {
						return finished(new Error(__('Staging archive directory does not exist')));
					}

					var productsDir = path.join(builder.buildDir, 'build', 'Products');
					if (!fs.existsSync(productsDir)) {
						return finished(new Error(__('Products directory does not exist')));
					}

					// copy symbols
					var archiveDsymDir = path.join(stagingArchiveDir, 'dSYMs');
					fs.existsSync(archiveDsymDir) || wrench.mkdirSyncRecursive(archiveDsymDir);
					var bcSymbolMapsDir = path.join(stagingArchiveDir, 'BCSymbolMaps');
					fs.existsSync(bcSymbolMapsDir) || wrench.mkdirSyncRecursive(bcSymbolMapsDir);
					var dsymRegExp = /\.dSYM$/;
					var bcSymbolMapsRegExp = /\.bcsymbolmap$/;
					fs.readdirSync(productsDir).forEach(function (name) {
						var subdir = path.join(productsDir, name);
						if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
							fs.readdirSync(subdir).forEach(function (name) {
								var file = path.join(subdir, name);
								if (dsymRegExp.test(name) && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
									logger.info(__('Archiving debug symbols: %s', file.cyan));
									wrench.copyDirSyncRecursive(file, path.join(archiveDsymDir, name), { forceDelete: false });
								} else if (bcSymbolMapsRegExp.test(name) && fs.existsSync(file) && fs.statSync(file).isFile()) {
									var dest = path.join(bcSymbolMapsDir, name);
									logger.info(__('Archiving Bitcode Symbol Map: %s', file.cyan));
									fs.writeFileSync(dest, fs.readFileSync(file));
								}
							});
						}
					});

					var destInfoPlist = path.join(stagingArchiveDir, 'Info.plist');
					if (!fs.existsSync(destInfoPlist)) {
						var origPlist = new appc.plist(path.join(builder.buildDir, 'Info.plist'));
						var newPlist = new appc.plist();
						var appBundle = 'Applications/' + name + '.app';
						var now = new Date;

						appc.util.mix(newPlist, {
							ApplicationProperties: {
								ApplicationPath: appBundle,
								CFBundleIdentifier: origPlist.CFBundleIdentifier || builder.tiapp.id,
								CFBundleShortVersionString: origPlist.CFBundleShortVersionString || '1.0',
								CFBundleVersion: origPlist.CFBundleVersion || '1.0',
								SigningIdentity: 'iPhone Distribution: ' + builder.certDistributionName,
								IconPaths: [
									appBundle + '/' + builder.tiapp.icon
								]
							},
							ArchiveVersion: newPlist.type('integer', 2),
							CreationDate: now,
							Name: name,
							SchemeName: name
						}).save(destInfoPlist);
					}

					var month = now.getMonth() + 1;
					var day = now.getDate();
					var hours = now.getHours();
					var minutes = now.getMinutes();
					var seconds = now.getSeconds();
					var date = now.getFullYear() + '-' + (month >= 10 ? month : '0' + month) + '-' + (day >= 10 ? day : '0' + day);
					var time = (hours >= 10 ? hours : '0' + hours) + '-' + (minutes >= 10 ? minutes : '0' + minutes) + '-' + (seconds >= 10 ? seconds : '0' + seconds);

					var archivesDir = afs.resolvePath('~/Library/Developer/Xcode/Archives', date);
					var dest = path.join(archivesDir, name + ' ' + date + ' ' + time + '.xcarchive');

					// move the finished archive directory into the correct location
					fs.existsSync(archivesDir) || wrench.mkdirSyncRecursive(archivesDir);
					fs.renameSync(stagingArchiveDir, dest);

					// open xcode + organizer after packaging
					logger.info(__('Launching Xcode: %s', builder.xcodeEnv.xcodeapp.cyan));
					exec('open -a "' + builder.xcodeEnv.xcodeapp + '"', function (err, stdout, stderr) {
						process.env.TI_ENV_NAME = process.env.STUDIO_NAME || 'Terminal.app';
						exec('osascript "' + path.join(builder.platformPath, 'xcode_organizer.scpt') + '"', { env: process.env }, function (err, stdout, stderr) {
							logger.info(__('Packaging complete'));
							finished();
						});
					});
					return;

				case 'dist-adhoc':
					logger.info(__('Packaging for Ad Hoc distribution'));
					var pkgapp = path.join(builder.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					exec('"' + pkgapp + '" "' + builder.xcodeAppDir + '"', function (err, stdout, stderr) {
						if (err) {
							logger.error(__('Failed to package application'));
							stderr.split('\n').forEach(logger.error);
							return finished();
						}

						var ipa = path.join(path.dirname(builder.xcodeAppDir), builder.tiapp.name + '.ipa'),
							dest = ipa,
							outputDir = cli.argv['output-dir'] && afs.resolvePath(cli.argv['output-dir']);

						if (outputDir && outputDir != path.dirname(dest)) {
							fs.existsSync(outputDir) || wrench.mkdirSyncRecursive(outputDir);
							dest = path.join(outputDir, builder.tiapp.name + '.ipa');
							fs.existsSync(dest) && fs.unlinkSync(dest);
							afs.copyFileSync(ipa, dest, { logger: logger.debug });
						}

						logger.info(__('Packaging complete'));
						logger.info(__('Package location: %s', dest.cyan));

						finished();
					});
					return;
			}

			finished();
		}
	});

};
