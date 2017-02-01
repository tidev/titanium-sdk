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
			if (this.target !== 'dist-appstore' && this.target !== 'dist-adhoc') {
				return finished();
			}

			var stagingArchiveDir = path.join(this.buildDir, this.tiapp.name + '.xcarchive');
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
			var target = cli.argv.target;

			if (target !== 'dist-appstore' && target !== 'dist-adhoc') {
				return finished();
			}

			var name = builder.tiapp.name;
			var stagingArchiveDir = path.join(builder.buildDir, name + '.xcarchive');
			if (!fs.existsSync(stagingArchiveDir)) {
				return finished(new Error(__('Staging archive directory does not exist')));
			}

			var now = new Date;
			var destInfoPlist = path.join(stagingArchiveDir, 'Info.plist');
			if (!fs.existsSync(destInfoPlist)) {
				var origPlist = new appc.plist(path.join(builder.buildDir, 'Info.plist'));
				var newPlist = new appc.plist();
				var appBundle = 'Applications/' + name + '.app';

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

			switch (target) {
				case 'dist-appstore':
					logger.info(__('Preparing xcarchive'));

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

					var now = new Date;
					var destInfoPlist = path.join(stagingArchiveDir, 'Info.plist');
					if (!fs.existsSync(destInfoPlist)) {
						var origPlist = new appc.plist(path.join(builder.buildDir, 'Info.plist'));
						var newPlist = new appc.plist();
						var appBundle = 'Applications/' + name + '.app';

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
					var outputDir = cli.argv['output-dir'] && afs.resolvePath(cli.argv['output-dir']);
					if (!outputDir) {
						logger.warn(__('Invalid %s, skipping packaging', '--output-dir'.cyan));
						return finished();
					}
					logger.info(__('Packaging for Ad Hoc distribution'));

					// make sure the output directory is good to go
					fs.existsSync(outputDir) || wrench.mkdirSyncRecursive(outputDir);
					var exportPath = path.join(outputDir, builder.tiapp.name + '.ipa');
					fs.existsSync(exportPath) && fs.unlinkSync(exportPath);

					// write the export options plist file
					var exportsOptionsPlistFile = path.join(builder.buildDir, 'export_options.plist');
					var exportsOptions = new appc.plist();
					exportsOptions.method = 'ad-hoc';

					var pp = null;
					builder.iosInfo.provisioning.distribution.some(function (p) {
						if (p.uuid === builder.provisioningProfileUUID) {
							pp = p;
							return true;
						}
					});
					if (!pp) {
						builder.iosInfo.provisioning.adhoc.some(function (p) {
							if (p.uuid === builder.provisioningProfileUUID) {
								pp = p;
								return true;
							}
						});
					}
					if (pp && pp.team && pp.team.length) {
						exportsOptions.team = pp.team[0];
					}

					fs.writeFileSync(exportsOptionsPlistFile, exportsOptions.toString('xml'));

					// construct the command
					var cmd = [
						builder.xcodeEnv.executables.xcodebuild,
						'-exportArchive',
						'-archivePath', '"' + stagingArchiveDir + '"',
						'-exportPath', '"' + exportPath + '"',
						'-exportOptionsPlist', '"' + exportsOptionsPlistFile + '"'
					].join(' ');

					// execute!
					logger.debug(__('Running: %s', cmd.cyan));
					exec(cmd, function (err, stdout, stderr) {
						if (err) {
							logger.error(__('Failed to export archive to ipa'));
							stderr.trim().split('\n').forEach(logger.error);
						} else {
							logger.info(__('Packaging complete'));
							logger.info(__('Package location: %s', exportPath.cyan));
						}
						finished();
					});
					return;
			}

			finished();
		}
	});

};
