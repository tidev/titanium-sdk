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

					// if output-dir don't move the archive, instead export it into an IPA
					if (cli.argv['output-dir']) {
						exportIPA(builder, target, stagingArchiveDir, cli.argv['output-dir'], finished);
						return;
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
					appc.fs.copyDirSyncRecursive(stagingArchiveDir, dest, {
						logger: logger.debug
					});

					// if not build-only open xcode + organizer after packaging, otherwise finish
					if (!cli.argv['build-only']) {
						logger.info(__('Launching Xcode: %s', builder.xcodeEnv.xcodeapp.cyan));
						exec('open -a "' + builder.xcodeEnv.xcodeapp + '"', function (err, stdout, stderr) {
							process.env.TI_ENV_NAME = process.env.STUDIO_NAME || 'Terminal.app';
							exec('osascript "' + path.join(builder.platformPath, 'xcode_organizer.scpt') + '"', { env: process.env }, function (err, stdout, stderr) {
								logger.info(__('Packaging complete'));
								finished();
							});
						});
					} else {
						logger.info(__('Packaging complete'));
						finished();
					}
					return;

				case 'dist-adhoc':
					logger.info(__('Packaging for Ad Hoc distribution'));
					exportIPA(builder, target, stagingArchiveDir, cli.argv['output-dir'], finished);
					return;
			}

			finished();
		}
	});

	/**
	 * Centralized function to export build into an IPA
	 */
	function exportIPA(builder, target, stagingArchiveDir, outputDirArg, callback) {
		logger.debug(__('Packaging IPA for target %s', target.cyan));

		var outputDir = outputDirArg && afs.resolvePath(outputDirArg);
		if (!outputDir) {
			logger.warn(__('Invalid output directory %s, skipping packaging', '--output-dir'.cyan));
			return callback();
		}

		// make sure the output directory is good to go
		if (fs.existsSync(outputDir)) {
			logger.info(__('Deleting dist directory: %s', outputDir.cyan));
			wrench.rmdirSyncRecursive(outputDir);
		}
		wrench.mkdirSyncRecursive(outputDir);
		var ipaFile = path.join(outputDir, builder.tiapp.name + '.ipa');

		var exportsOptionsPlistFile = path.join(builder.buildDir, 'export_options.plist');
		var exportsOptions = new appc.plist();
		var pp = builder.provisioningProfile;

		// Build the options plist file
		if (target === 'dist-appstore') {
			exportsOptions.method = 'app-store';
		} else {
			exportsOptions.method = 'ad-hoc';

			if (pp.type === 'enterprise') {
				exportsOptions.method = 'enterprise';
			}

			if (pp.appPrefix) {
				exportsOptions.teamId = pp.appPrefix;
			}
		}

		var keychains = builder.iosInfo.certs.keychains;
		Object.keys(keychains).some(function (keychain) {
			return (keychains[keychain].distribution || []).some(function (d) {
				if (!d.invalid && d.name === builder.certDistributionName) {
					exportsOptions.signingCertificate = d.fullname;
					return true;
				}
			}, this);
		}, this);

		exportsOptions.provisioningProfiles = {};
		exportsOptions.provisioningProfiles[builder.tiapp.id] = pp.uuid;

		fs.writeFileSync(exportsOptionsPlistFile, exportsOptions.toString('xml'));

		// construct the command
		var cmd = [
			builder.xcodeEnv.executables.xcodebuild,
			'-exportArchive',
			'-archivePath', '"' + stagingArchiveDir + '"',
			'-exportPath', '"' + outputDir + '"',
			'-exportOptionsPlist', '"' + exportsOptionsPlistFile + '"'
		].join(' ');

		// execute!
		logger.debug(__('Running: %s', cmd.cyan));
		exec(cmd, function (err, stdout, stderr) {
			if (err) {
				var output = stderr.trim();
				output.split('\n').forEach(logger.trace);
				logger.error(__('Failed to export archive to ipa'));

				var targetName = target === 'dist-appstore' ? 'Distribution' : 'Ad Hoc';

				if (pp) {
					if (pp.type === 'distribution' && target === 'dist-adhoc') {
						logger.error(__('The selected provisioning profile "%s (%s)" appears to be a Distribution provisioning profile and not an Ad Hoc provisioning profile.', pp.name, pp.uuid));
					} else if (pp.type === 'adhoc' && target === 'dist-appstore') {
						logger.error(__('The selected provisioning profile "%s (%s)" appears to be an Ad Hoc provisioning profile and not a Distribution provisioning profile.', pp.name, pp.uuid));
					}
					else {
						logger.error(__('The selected provisioning profile "%s (%s)" is most likely not a valid %s provisioning profile.', pp.name, pp.uuid, targetName));
					}
				} else {
					logger.error(__('The selected provisioning profile doesn\'t appear to be a %s provisioning profile or match the signing identity.', targetName));
				}
				logger.error(__('Please ensure you are using a valid %s provisioning that is linked to the signing identity, then try again.', targetName));
			} else {
				logger.info(__('Packaging complete'));
				logger.info(__('Package location: %s', ipaFile.cyan));
			}
			callback();
		});
	}
};
