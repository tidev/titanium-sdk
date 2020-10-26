/*
 * package.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	fs = require('fs-extra'),
	path = require('path'),
	exec = require('child_process').exec; // eslint-disable-line security/detect-child-process

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.on('build.ios.xcodebuild', {
		pre: function (data, finished) {
			if (this.target !== 'dist-appstore' && this.target !== 'dist-adhoc' && this.target !== 'dist-macappstore') {
				return finished();
			}

			const stagingArchiveDir = path.join(this.buildDir, this.tiapp.name + '.xcarchive');
			fs.removeSync(stagingArchiveDir);

			// inject the temporary archive path into the xcodebuild args
			const args = data.args[1];
			const p = args.indexOf('-archivePath');
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
			const target = cli.argv.target;

			if (target !== 'dist-appstore' && target !== 'dist-adhoc' && target !== 'dist-macappstore') {
				return finished();
			}

			const name = builder.tiapp.name;
			const stagingArchiveDir = path.join(builder.buildDir, name + '.xcarchive');
			if (!fs.existsSync(stagingArchiveDir)) {
				return finished(new Error(__('Staging archive directory does not exist')));
			}

			const now = new Date();
			const destInfoPlist = path.join(stagingArchiveDir, 'Info.plist');
			if (!fs.existsSync(destInfoPlist)) {
				const origPlist = new appc.plist(path.join(builder.buildDir, 'Info.plist'));
				const newPlist = new appc.plist();
				const appBundle = 'Applications/' + name + '.app';

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
				case 'dist-macappstore':
					logger.info(__('Preparing xcarchive'));

					const productsDir = path.join(builder.buildDir, 'build', 'Products');
					if (!fs.existsSync(productsDir)) {
						return finished(new Error(__('Products directory does not exist')));
					}

					// copy symbols
					const archiveDsymDir = path.join(stagingArchiveDir, 'dSYMs');
					fs.ensureDirSync(archiveDsymDir);
					const bcSymbolMapsDir = path.join(stagingArchiveDir, 'BCSymbolMaps');
					fs.ensureDirSync(bcSymbolMapsDir);
					const dsymRegExp = /\.dSYM$/;
					const bcSymbolMapsRegExp = /\.bcsymbolmap$/;
					fs.readdirSync(productsDir).forEach(function (name) {
						var subdir = path.join(productsDir, name);
						if (fs.existsSync(subdir) && fs.statSync(subdir).isDirectory()) {
							fs.readdirSync(subdir).forEach(function (name) {
								var file = path.join(subdir, name);
								if (dsymRegExp.test(name) && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
									logger.info(__('Archiving debug symbols: %s', file.cyan));
									fs.copySync(file, path.join(archiveDsymDir, name), { overwrite: false });
								} else if (bcSymbolMapsRegExp.test(name) && fs.existsSync(file) && fs.statSync(file).isFile()) {
									const dest = path.join(bcSymbolMapsDir, name);
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

					const month = now.getMonth() + 1;
					const day = now.getDate();
					const hours = now.getHours();
					const minutes = now.getMinutes();
					const seconds = now.getSeconds();
					const date = now.getFullYear() + '-' + (month >= 10 ? month : '0' + month) + '-' + (day >= 10 ? day : '0' + day);
					const time = (hours >= 10 ? hours : '0' + hours) + '-' + (minutes >= 10 ? minutes : '0' + minutes) + '-' + (seconds >= 10 ? seconds : '0' + seconds);

					const archivesDir = afs.resolvePath('~/Library/Developer/Xcode/Archives', date);
					const dest = path.join(archivesDir, name + ' ' + date + ' ' + time + '.xcarchive');

					// move the finished archive directory into the correct location
					fs.ensureDirSync(archivesDir);
					try  {
						fs.move(stagingArchiveDir, dest);
					} catch (error) {
						logger.error(__('Failed to to move archive to correct location'));
					}
					// if not build-only open xcode + organizer after packaging, otherwise finish
					if (!cli.argv['build-only']) {
						logger.info(__('Launching Xcode: %s', builder.xcodeEnv.xcodeapp.cyan));
						exec('open -a "' + builder.xcodeEnv.xcodeapp + '"', function () {
							process.env.TI_ENV_NAME = process.env.STUDIO_NAME || 'Terminal.app';
							exec('osascript "' + path.join(builder.platformPath, 'xcode_organizer.scpt') + '"', { env: process.env }, function () {
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
	 * @param  {object}   builder           builder object
	 * @param  {string}   target            target store/consumer
	 * @param  {string}   stagingArchiveDir path to staging dir
	 * @param  {string}   outputDirArg      path to ultimate output dir
	 * @param  {Function} callback          callback function
	 * @return {undefined}
	 */
	function exportIPA(builder, target, stagingArchiveDir, outputDirArg, callback) {
		logger.debug(__('Packaging IPA for target %s', target.cyan));

		const outputDir = outputDirArg && afs.resolvePath(outputDirArg);
		if (!outputDir) {
			logger.warn(__('Invalid output directory %s, skipping packaging', '--output-dir'.cyan));
			return callback();
		}

		// make sure the output directory is good to go
		fs.ensureDirSync(outputDir);

		const ipaFile = path.join(outputDir, builder.tiapp.name + '.ipa');
		if (fs.existsSync(ipaFile)) {
			logger.debug(__('Deleting old .ipa file'));
			fs.unlinkSync(ipaFile);
		}

		const exportsOptionsPlistFile = path.join(builder.buildDir, 'export_options.plist');
		const exportsOptions = new appc.plist();
		const pp = builder.provisioningProfile;

		// Build the options plist file
		if (target === 'dist-appstore' || target === 'dist-macappstore') {
			exportsOptions.method = 'app-store';
		} else {
			exportsOptions.method = 'ad-hoc';

			if (pp.type === 'enterprise') {
				exportsOptions.method = 'enterprise';
			}

			if (builder.teamId || (pp && (pp.team || pp.appPrefix))) {
				// NOTE: if there isn't an explicit <team-id> in the tiapp.xml and there is no
				// teams or more than 1 team in the provisioning profile, then we use the appPrefix
				// which should be the team id, but can differ and since we don't check it, this
				// next line of code could be problematic
				exportsOptions.teamId = builder.teamId || (pp.team.length === 1 ? pp.team[0] : pp.appPrefix);
			}
		}

		const keychains = builder.iosInfo.certs.keychains;
		Object.keys(keychains).some(function (keychain) {
			return (keychains[keychain].distribution || []).some(function (d) {
				if (!d.invalid && d.fullname === builder.certDistributionName) {
					exportsOptions.signingCertificate = d.fullname;
					return true;
				}
				return false;
			}, this);
		}, this);

		exportsOptions.provisioningProfiles = {};
		exportsOptions.provisioningProfiles[builder.tiapp.id] = pp.uuid;

		builder.extensions.forEach(function (ext) {
			const nativeTargets = ext.objs.PBXNativeTarget;
			ext.targets.forEach(function (extTarget) {
				if (extTarget.ppUUIDs[target]) {
					const targetUUID = Object.keys(nativeTargets).filter(uuid => typeof nativeTargets[uuid] === 'object' && nativeTargets[uuid].name.replace(/^"/, '').replace(/"$/, '') === extTarget.name)[0];
					const buildConf = targetUUID && ext.objs.XCConfigurationList[nativeTargets[targetUUID].buildConfigurationList].buildConfigurations.filter(c => c.comment === 'Release');
					const confUUID = buildConf && buildConf.length && buildConf[0].value;
					const id = confUUID && ext.objs.XCBuildConfiguration[confUUID].buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
					if (id) {
						exportsOptions.provisioningProfiles[id] = extTarget.ppUUIDs[target];
					}
				}
			});
		});

		// check if the app is using CloudKit
		const entitlementsFile = path.join(builder.buildDir, builder.tiapp.name + '.entitlements');
		if (fs.existsSync(entitlementsFile)) {
			const plist = new appc.plist(entitlementsFile);
			if (Object.keys(plist).indexOf('com.apple.developer.icloud-container-identifiers') !== -1) {
				exportsOptions.iCloudContainerEnvironment = 'Production';
			}
		}

		fs.writeFileSync(exportsOptionsPlistFile, exportsOptions.toString('xml'));

		const args = [
			'-exportArchive',
			'-archivePath', stagingArchiveDir,
			'-exportPath', outputDir,
			'-exportOptionsPlist', exportsOptionsPlistFile
		];

		// execute!
		logger.debug(__('Running: %s %s', builder.xcodeEnv.executables.xcodebuild.cyan, args.join(' ').cyan));
		appc.subprocess.run(builder.xcodeEnv.executables.xcodebuild, args, function (err, stdout, stderr) {
			if (err) {
				const output = stderr.trim();
				output.split('\n').forEach(logger.trace);
				logger.error(__('Failed to export archive to ipa'));

				const targetName = target === 'dist-appstore' ? 'Distribution' : 'Ad Hoc';

				if (pp) {
					if (pp.type === 'distribution' && target === 'dist-adhoc') {
						logger.error(__('The selected provisioning profile "%s (%s)" appears to be a Distribution provisioning profile and not an Ad Hoc provisioning profile.', pp.name, pp.uuid));
					} else if (pp.type === 'adhoc' && target === 'dist-appstore') {
						logger.error(__('The selected provisioning profile "%s (%s)" appears to be an Ad Hoc provisioning profile and not a Distribution provisioning profile.', pp.name, pp.uuid));
					} else {
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
