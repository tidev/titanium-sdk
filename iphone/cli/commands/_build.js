/*
 * build.js: Titanium IOS CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	Buffer = require('buffer').Buffer,
	wrench = require('wrench'),
	cleanCSS = require('clean-css'),
	UglifyJS = require('uglify-js'),
	DOMParser = require('xmldom').DOMParser,
	uuid = require('node-uuid'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	ios = appc.ios,
	version = appc.version,
	parallel = appc.async.parallel,
	series = appc.async.series,
	minIosSdkVersion = '4.0',
	iosEnv,
	devNameIdRegExp = /\([0-9A-Za-z]*\)$/,
	targets = ['simulator', 'device', 'dist-appstore', 'dist-adhoc'],
	deviceFamilies = {
		iphone: '1',
		ipad: '2',
		universal: '1,2'
	},
	deviceFamilyNames = {
		iphone: ['ios', 'iphone'],
		ipad: ['ios', 'ipad'],
		universal: ['ios', 'iphone', 'ipad']
	},
	xcodeTargetSuffixes = {
		iphone: '',
		ipad: '-iPad',
		universal: '-universal'
	},
	simTypes = {
		iphone: 'iPhone',
		ipad: 'iPad'
	},
	provisioningProfileMap = {
		device: 'development',
		'dist-appstore': 'distribution',
		'dist-adhoc': 'adhoc'
	},
	deployTypes = {
		simulator: 'development',
		device: 'test',
		'dist-appstore': 'production',
		'dist-adhoc': 'production'
	},
	blacklistDirectories = [
		'contents',
		'resources'
	],
	graylistDirectories = [
		'frameworks',
		'plugins'
	],
	ipadSplashImages = [
		'Default-Landscape.png',
		'Default-Landscape@2x.png',
		'Default-Portrait.png',
		'Default-Portrait@2x.png',
		'Default-LandscapeLeft.png',
		'Default-LandscapeLeft@2x.png',
		'Default-LandscapeRight.png',
		'Default-LandscapeRight@2x.png',
		'Default-PortraitUpsideDown.png',
		'Default-PortraitUpsideDown@2x.png'
	];

// silence uglify's default warn mechanism
UglifyJS.AST_Node.warn_function = function () {};

exports.config = function (logger, config, cli) {
	return function (done) {
		ios.detect(function (env) {
			iosEnv = env || {};

			var sdks = {},
				sims = {},
				defaultSdk,
				conf,
				devName,
				lowerCasedDevNames = iosEnv.certs.devNames.map(function (s) { return s.toLowerCase(); }),
				lowerCasedDistNames = iosEnv.certs.distNames.map(function (s) { return s.toLowerCase(); }),
				humanize = require('humanize'),
				libTiCoreSize = humanize.filesize(fs.statSync(afs.resolvePath(__dirname, '..', '..', 'libTiCore.a')).size, 1024, 1).toUpperCase();

			// attempt to resolve a default ios developer cert name (used for device builds)
			if (process.env.CODE_SIGN_IDENTITY) {
				devName = process.env.CODE_SIGN_IDENTITY.replace(/(iPhone Developer\: (.+) \(.+)/, '$2');
			} else if (config.ios && config.ios.developerName) {
				devName = config.ios.developerName.trim();
				if (devNameIdRegExp.test(devName)) {
					if (lowerCasedDevNames.indexOf(devName.toLowerCase()) == -1) {
						devName = undefined;
					}
				} else {
					lowerCasedDevNames = lowerCasedDevNames.map(function (name) {
						var m = name.match(/^([^(]+?)*/);
						return (m ? m[0] : name).trim().toLowerCase();
					});
					var p = lowerCasedDevNames.indexOf(devName.toLowerCase());
					if (p == -1) {
						devName = lowerCasedDevNames[p];
					}
				}
			}

			Object.keys(iosEnv.xcode).forEach(function (key) {
				iosEnv.xcode[key].sdks.forEach(function (sdk) {
					if (iosEnv.xcode[key].selected && !defaultSdk || version.gt(sdk, defaultSdk)) {
						defaultSdk = sdk;
					}
					sdks[sdk] = 1;
				});
			});
			sdks = Object.keys(sdks).sort().reverse();

			Object.keys(iosEnv.xcode).forEach(function (key) {
				iosEnv.xcode[key].sims.forEach(function (sdk) {
					sims[sdk] = 1;
				});
			});
			sims = Object.keys(sims).sort().reverse();

			cli.createHook('build.ios.config', function (callback) {
				callback({
					flags: {
						retina: {
							desc: __('use the retina version of the iOS Simulator'),
							hidden: version.lte(ti.manifest.version, '3.0.2')
						},
						tall: {
							desc: __('in combination with %s flag, start the tall version of the retina device', '--retina'),
							hidden: version.lte(ti.manifest.version, '3.0.2')
						},
						'force-copy': {
							default: false,
							desc: __('forces files to be copied instead of symlinked for %s builds only', 'simulator'.cyan)
						},
						'force-copy-all': {
							default: false,
							desc: __('identical to the %s flag, except this will also copy the %s libTiCore.a file', '--force-copy', libTiCoreSize.cyan)
						},
						xcode: {
							// secret flag to perform Xcode pre-compile build step
							hidden: true
						}
					},
					options: {
						'debug-host': {
							//desc: __('debug connection info; airkey and hosts required for %s and %s, ignored for %s', 'device'.cyan, 'dist-adhoc'.cyan, 'dist-appstore'.cyan),
							//hint: 'host:port[:airkey:hosts]',
							hidden: true
						},
						'launch-url': {
							//desc: __('url for the application to launch in mobileSafari , as soon as the app boots up.'),
							//hint: 'http://www.appcelerator.com/',
							hidden: true
						},
						'deploy-type': {
							abbr: 'D',
							desc: __('the type of deployment; only used when target is %s or %s', 'simulator'.cyan, 'device'.cyan),
							hint: __('type'),
							values: ['test', 'development']
						},
						'developer-name': {
							abbr: 'V',
							default: devName,
							desc: __('the iOS Developer Certificate to use; required when target is %s', 'device'.cyan),
							hint: 'name',
							prompt: {
								label: __('Name of the iOS Developer Certificate to use'),
								error: __('Invalid developer name'),
								validator: function (name) {
									name && (name = name.trim());

									var dn = devNameIdRegExp.test(name) ? lowerCasedDevNames.map(function (name) {
											return name.trim();
										}) : lowerCasedDevNames.map(function (name) {
											var m = name.match(/^([^(]+?)*/);
											return (m ? m[0] : name).trim();
										});

									if (!name || dn.indexOf(name.toLowerCase()) == -1) {
										var width = 0,
											i = 0,
											l = iosEnv.certs.devNames.length,
											h = Math.ceil(l / 2),
											output = [__('Available names:')];

										for (; i < h; i++) {
											if (iosEnv.certs.devNames[i].length > width) {
												width = iosEnv.certs.devNames[i].length;
											}
											output.push('    ' + iosEnv.certs.devNames[i]);
										}

										width += 12; // 4 spaces left padding, 8 spaces between columns
										for (h = 1; i < l; h++, i++) {
											output[h] = appc.string.rpad(output[h], width) + iosEnv.certs.devNames[i];
										}

										throw new appc.exception(
											name ? __('Unable to find an iOS Developer Certificate for "%s"', name) : __('Select an iOS Developer Certificate:'),
											output.map(function (s, i) { return i ? s.cyan : s; })
										);
									}
									return true;
								}
							}
						},
						'distribution-name': {
							abbr: 'R',
							default: config.ios && config.ios.distributionName && lowerCasedDistNames.indexOf(config.ios.distributionName.toLowerCase()) != -1 ? config.ios.distributionName : undefined,
							desc: __('the iOS Distribution Certificate to use; required when target is %s or %s', 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
							hint: 'name',
							prompt: {
								label: __('Name of the iOS Distribution Certificate to use'),
								error: __('Invalid distribution name'),
								validator: function (name) {
									name && (name = name.trim());
									if (!name || lowerCasedDistNames.indexOf(name.toLowerCase()) == -1) {
										var names = [__('Available names:')];
										names = names.concat(iosEnv.certs.distNames);
										throw new appc.exception(
											name ? __('Unable to find an iOS Distribution Certificate for "%s"', name) : __('Select an iOS Distribution Certificate:'),
											names.map(function (s, i) { return i ? '    ' + s.cyan : s; })
										);
									}
									return true;
								}
							}
						},
						'device-family': {
							abbr: 'F',
							desc: __('the device family to build for'),
							values: Object.keys(deviceFamilies)
						},
						'ios-version': {
							abbr: 'I',
							default: process.env.SDK_NAME ? process.env.SDK_NAME.replace(/iphonesimulator|iphoneos/, '') : defaultSdk || (sdks.length && sdks[0]),
							desc: __('iOS SDK version to build for'),
							values: sdks
						},
						'keychain': {
							abbr: 'K',
							desc: __('path to the distribution keychain to use instead of the system default; only used when target is %s, %s, or %s', 'device'.cyan, 'dist-appstore'.cyan, 'dist-adhoc'.cyan)
						},
						'output-dir': {
							abbr: 'O',
							desc: __('the output directory when using %s', 'dist-adhoc'.cyan),
							hint: 'dir',
							prompt: {
								default: function () {
									return cli.argv['project-dir'] && path.join(cli.argv['project-dir'], 'dist');
								},
								label: __('Output directory'),
								error: __('Invalid output directory'),
								validator: function (dir) {
									if (!afs.resolvePath(dir)) {
										throw new appc.exception(__('Invalid output directory'));
									}
									return true;
								}
							}
						},
						'pp-uuid': {
							abbr: 'P',
							default: process.env.PROVISIONING_PROFILE,
							desc: __('the provisioning profile uuid; required when target is %s, %s, or %s', 'device'.cyan, 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
							hint: 'uuid',
							prompt: {
								label: __('Provisioning Profile UUID'),
								error: __('Invalid Provisioning Profile UUID'),
								validator: function (uuid) {
									uuid = (uuid || '').trim();

									var availableUUIDs = [],
										addUUIDs = function (section, uuids) {
											if (uuids.length) {
												availableUUIDs.push(section);
												for (var i = 0; i < uuids.length; i++) {
													if (uuids[i].uuid == uuid) {
														return true;
													}
													availableUUIDs.push('    ' + uuids[i].uuid.cyan + '  ' + uuids[i].appId + ' (' + uuids[i].name + ')');
												}
											}
										};

									if (cli.argv.target == 'device') {
										if (addUUIDs(__('Available Development UUIDs:'), iosEnv.provisioningProfiles.development)) return true;
									} else {
										if (addUUIDs(__('Available Distribution UUIDs:'), iosEnv.provisioningProfiles.distribution)) return true;
										if (addUUIDs(__('Available Adhoc UUIDs:'), iosEnv.provisioningProfiles.adhoc)) return true;
										// TODO: display enterprise adhoc uuids
									}

									if (uuid) {
										throw new appc.exception(__('Unable to find a Provisioning Profile UUID "%s"', uuid), availableUUIDs);
									} else {
										throw new appc.exception(__('Please specify a Provisioning Profile UUID'), availableUUIDs);
									}
								}
							}
						},
						'profiler-host': {
							//desc: __('debug connection info; airkey and hosts required for %s and %s, ignored for %s', 'device'.cyan, 'dist-adhoc'.cyan, 'dist-appstore'.cyan),
							//hint: 'host:port[:airkey:hosts]',
							hidden: true
						},
						'sim-type': {
							abbr: 'Y',
							desc: __('iOS Simulator type; only used when target is %s', 'simulator'.cyan),
							hint: 'type',
							values: Object.keys(simTypes)
						},
						'sim-version': {
							abbr: 'S',
							desc: __('iOS Simulator version; only used when target is %s', 'simulator'.cyan),
							hint: 'version',
							values: sims
						},
						target: {
							abbr: 'T',
							callback: function (value) {
								var pp = iosEnv.provisioningProfiles;

								// as soon as we know the target, toggle required options for validation
								switch (value) {
									case 'device':
										conf.options['developer-name'].required = true;
										conf.options['pp-uuid'].required = true;

										if (!iosEnv.certs.devNames.length) {
											logger.error(__('Unable to find any iOS Developer Certificates') + '\n');
											logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/certificates/team/index.action'.cyan) + '\n');
											process.exit(1);
										}

										if (!pp.development.length) {
											logger.error(__('No development provisioning profiles found') + '\n');
											logger.log(__('Download and install a provisioning profile from %s', 'https://developer.apple.com/ios/manage/provisioningprofiles/index.action'.cyan) + '\n');
											process.exit(1);
										}
										break;

									case 'dist-adhoc':
										conf.options['output-dir'].required = true;
										// purposely fall through!

									case 'dist-appstore':
										conf.options['distribution-name'].required = true;
										conf.options['pp-uuid'].required = true;

										if (!iosEnv.certs.distNames.length) {
											logger.error(__('Unable to find any iOS Distribution Certificates') + '\n');
											logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/distribution/index.action'.cyan) + '\n');
											process.exit(1);
										}

										if (!pp.distribution.length && !pp.adhoc.length && !pp.enterprise.length) {
											logger.error(__('No distribution or adhoc provisioning profiles found') + '\n');
											logger.log(__('Download and install a provisioning profile from %s', 'https://developer.apple.com/ios/manage/provisioningprofiles/index.action'.cyan) + '\n');
											process.exit(1);
										}
								}
							},
							default: 'simulator',
							desc: __('the target to build for'),
							required: true,
							values: targets
						}
					}
				});
			})(function (err, results, result) {
				done(conf = result);
			});
		}, {
			minsdk: minIosSdkVersion
		});
	};
};

exports.validate = function (logger, config, cli) {
	var sdks = {},
		sims = {};

	// if we're running from Xcode, we want to use the PROJECT_DIR environment variable
	if (process.env.PROJECT_DIR) {
		cli.argv['project-dir'] = path.dirname(process.env.PROJECT_DIR);
	}

	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');

	if (!cli.argv.xcode || !process.env.TITANIUM_CLI_XCODEBUILD) {
		// make sure the app doesn't have any blacklisted directories in the Resources directory and warn about graylisted names
		var resourcesDir = path.join(cli.argv['project-dir'], 'Resources');
		if (afs.exists(resourcesDir)) {
			fs.readdirSync(resourcesDir).forEach(function (filename) {
				var lcaseFilename = filename.toLowerCase(),
					isDir = fs.statSync(path.join(resourcesDir, filename)).isDirectory();
	
				if (blacklistDirectories.indexOf(lcaseFilename) != -1) {
					if (isDir) {
						logger.error(__('Found blacklisted directory in the Resources directory') + '\n');
						logger.error(__('The directory "%s" is a reserved word.', filename));
						logger.error(__('You must rename this directory to something else.') + '\n');
					} else {
						logger.error(__('Found blacklisted file in the Resources directory') + '\n');
						logger.error(__('The file "%s" is a reserved word.', filename));
						logger.error(__('You must rename this file to something else.') + '\n');
					}
					process.exit(1);
				} else if (graylistDirectories.indexOf(lcaseFilename) != -1) {
					if (isDir) {
						logger.warn(__('Found graylisted directory in the Resources directory'));
						logger.warn(__('The directory "%s" is potentially a reserved word.', filename));
						logger.warn(__('There is a good chance your app will be rejected by Apple.'));
						logger.warn(__('It is highly recommended you rename this directory to something else.'));
					} else {
						logger.warn(__('Found graylisted file in the Resources directory'));
						logger.warn(__('The file "%s" is potentially a reserved word.', filename));
						logger.warn(__('There is a good chance your app will be rejected by Apple.'));
						logger.warn(__('It is highly recommended you rename this file to something else.'));
					}
				}
			});
		}
	}

	ti.validateTiappXml(logger, cli.tiapp);

	// at this point we've validated everything except underscores in the app id
	if (cli.tiapp.id.indexOf('_') != -1) {
		logger.error(__('tiapp.xml contains an invalid app id "%s"', cli.tiapp.id));
		logger.error(__('The app id must consist of letters, numbers, and dashes.'));
		logger.error(__('The first character must be a letter.'));
		logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
		process.exit(1);
	}

	if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
		// we're running the build command for the wrong SDK version, gracefully return
		return false;
	}

	if (!Object.keys(iosEnv.xcode).length) {
		logger.error(__('Unable to find Xcode') + '\n');
		logger.error(__('Please download and install Xcode, then try again') + '\n');
		process.exit(1);
	}

	if (!iosEnv.xcode.__selected__) {
		logger.error(__('No Xcode version is currently selected') + '\n');
		logger.error(__("Use 'xcode-select' to select one of the Xcode versions:"));
		Object.keys(iosEnv.xcode).forEach(function (ver) {
			if (ver != '__selected__') {
				logger.log('\n' + ('    xcode-select -switch ' + iosEnv.xcode[ver].path).cyan);
			}
		});
		logger.log();
		process.exit(1);
	}

	Object.keys(iosEnv.xcode).forEach(function (sdk) {
		sdk != '__selected__' && iosEnv.xcode[sdk].sdks.forEach(function (ver) {
			sdks[ver] = iosEnv.xcode[sdk].sims;
		});
	});

	if (!Object.keys(sdks).length) {
		logger.error(__('Unable to find any iOS SDKs') + '\n');
		logger.error(__('Please download and install an iOS SDK (version %s or newer)', version.format(minIosSdkVersion, 2)) + '\n');
		process.exit(1);
	}

	if (!cli.argv['ios-version'] || !Object.keys(sdks).some(function (ver) {
		if (version.eq(ver, cli.argv['ios-version'])) {
			cli.argv['ios-version'] = ver;
			return true;
		}
	})) {
		logger.error(cli.argv['ios-version'] ? __('Unable to find iOS SDK %s', cli.argv['ios-version']) + '\n' : __('Missing iOS SDK') + '\n');
		logger.log(__('Available iOS SDK versions:'));
		Object.keys(sdks).forEach(function (ver) {
			logger.log('    ' + ver.cyan);
		});
		logger.log();
		process.exit(1);
	}

	// check if this is the Xcode pre-compile phase
	if (cli.argv.xcode) {
		if (process.env.TITANIUM_CLI_XCODEBUILD) {
			// we are being built from the CLI, so we must have a valid buildManifest.json
			var buildManifestFile = path.join(cli.argv['project-dir'], 'build', path.basename(afs.resolvePath(__dirname, '..', '..')), 'build-manifest.json');
			try {
				var buildManifest = JSON.parse(fs.readFileSync(buildManifestFile));
				// first mix everything in
				appc.util.mix(cli.argv, buildManifest);
				// next translate specific keys that may differ
				cli.argv.target = process.env.CURRENT_ARCH === 'i386' ? 'simulator' : (buildManifest.target != 'simulator' ? buildManifest.target : 'device');
				cli.argv['deploy-type']			= buildManifest.deployType;
				cli.argv['output-dir']			= buildManifest.outputDir;
				cli.argv['developer-name']		= buildManifest.developerName;
				cli.argv['distribution-name']	= buildManifest.distributionName;
				cli.argv['skip-js-minify']		= buildManifest.skipJSMinification;
				cli.argv['force-copy']			= buildManifest.forceCopy;
				cli.argv['force-copy-all']		= buildManifest.forceCopyAll;
			} catch (e) {
				if (afs.exists(buildManifestFile)) {
					logger.error(__('Build manifest is invalid: %s', buildManifestFile));
				} else {
					logger.error(__('Build manifest does not exist: %s', buildManifestFile));
				}
				logger.error(__('Clean your project, then rebuild it'));
				process.exit(1);
			}
		} else {
			// we are being build from Xcode
			cli.argv.target = process.env.CURRENT_ARCH === 'i386' ? 'simulator' : 'device';
			cli.argv['deploy-type']			= process.env.CURRENT_ARCH === 'i386' ? 'development' : 'test';
			cli.argv['developer-name']		= process.env.CODE_SIGN_IDENTITY.replace(/^iPhone Developer\: /, '');
			cli.argv['distribution-name']	= process.env.CODE_SIGN_IDENTITY.replace(/^iPhone Distribution\: /, '');
			cli.argv['skip-js-minify']		= true; // never minify Xcode builds
			cli.argv['force-copy']			= true; // if building from xcode, we'll force files to be copied instead of symlinked
			cli.argv['force-copy-all']		= false; // we don't want to copy the big libTiCore.a file around by default
		}
	}

	if (targets.indexOf(cli.argv.target) == -1) {
		logger.error(__('Invalid target "%s"', cli.argv.target) + '\n');
		appc.string.suggest(cli.argv.target, targets, logger.log, 3);
		process.exit(1);
	}

	if (!cli.argv.xcode && cli.argv.target != 'simulator') {
		// make sure they have Apple's WWDR cert installed
		if (!iosEnv.certs.wwdr) {
			logger.error(__('WWDR Intermediate Certificate not found') + '\n');
			logger.log(__('Download and install the certificate from %s', 'https://developer.apple.com/ios/manage/certificates/team/index.action'.cyan) + '\n');
			process.exit(1);
		}

		if (cli.argv.target == 'device') {
			// validate developer cert
			if (!iosEnv.certs.devNames.length) {
				logger.error(__('Unable to find any iOS Developer Certificates') + '\n');
				logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/certificates/team/index.action'.cyan) + '\n');
				process.exit(1);
			}

			cli.argv['developer-name'] = (cli.argv['developer-name'] || '').trim();

			var devNames = devNameIdRegExp.test(cli.argv['developer-name']) ? iosEnv.certs.devNames.map(function (name) {
					return name.trim().toLowerCase();
				}) : iosEnv.certs.devNames.map(function (name) {
					var m = name.match(/^([^(]+?)*/);
					return (m ? m[0] : name).trim().toLowerCase();
				}),
				p = devNames.indexOf(cli.argv['developer-name'].toLowerCase());

			if (p == -1) {
				logger.error(__('Unable to find an iOS Developer Certificate for "%s"', cli.argv['developer-name']) + '\n');
				logger.log(__('Available developer names:'));
				iosEnv.certs.devNames.forEach(function (name) {
					logger.log('    ' + name.cyan);
				});
				logger.log();
				appc.string.suggest(cli.argv['developer-name'], iosEnv.certs.devNames, logger.log);
				process.exit(1);
			} else {
				cli.argv['developer-name'] = iosEnv.certs.devNames[p];
			}
		} else {
			// validate distribution cert
			if (!iosEnv.certs.distNames.length) {
				logger.error(__('Unable to find any iOS Distribution Certificates') + '\n');
				logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/distribution/index.action'.cyan) + '\n');
				process.exit(1);
			}

			cli.argv['distribution-name'] = (cli.argv['distribution-name'] || '').trim();

			var p = iosEnv.certs.distNames.map(function (name) {
				return name.toLowerCase();
			}).indexOf(cli.argv['distribution-name'].toLowerCase());

			if (p != -1) {
				cli.argv['distribution-name'] = iosEnv.certs.distNames[p];
			} else {
				logger.error(__('Unable to find an iOS Distribution Certificate for name "%s"', cli.argv['distribution-name']) + '\n');
				logger.log(__('Available distribution names:'));
				iosEnv.certs.distNames.forEach(function (name) {
					logger.log('    ' + name.cyan);
				});
				logger.log();
				appc.string.suggest(cli.argv['distribution-name'], iosEnv.certs.distNames, logger.log);
				process.exit(1);
			}
		}

		// validate provisioning profile
		if (!cli.argv['pp-uuid']) {
			logger.error(__('Missing required option "--pp-uuid"') + '\n');
			process.exit(1);
		}

		cli.argv['pp-uuid'] = cli.argv['pp-uuid'].trim();

		(function (pp) {
			iosEnv.provisioningProfilesByUUID = {};

			var availableUUIDs = [],
				allUUIDs = [],
				addUUIDs = function (section, uuids) {
					var match = 0;
					if (uuids.length) {
						availableUUIDs.push(section);
						for (var i = 0; i < uuids.length; i++) {
							if (uuids[i].uuid == cli.argv['pp-uuid']) {
								match = 1;
							}
							allUUIDs.push(uuids[i].uuid);
							iosEnv.provisioningProfilesByUUID[uuids[i].uuid] = uuids[i];
							availableUUIDs.push('    ' + uuids[i].uuid.cyan + '  ' + uuids[i].appId + ' (' + uuids[i].name + ')');
						}
					}
					return match;
				};

			if (cli.argv.target == 'device') {
				if (addUUIDs(__('Available Development UUIDs:'), pp.development)) return;
			} else {
				if (addUUIDs(__('Available Distribution UUIDs:'), pp.distribution) + addUUIDs(__('Available Adhoc UUIDs:'), pp.adhoc)) return;
				// TODO: display enterprise adhoc uuids
			}

			logger.error(__('Invalid Provisioning Profile UUID "%s"', cli.argv['pp-uuid']) + '\n');
			availableUUIDs.forEach(function (line) {
				logger.log(line);
			});
			logger.log();
			appc.string.suggest(cli.argv['pp-uuid'], allUUIDs, logger.log);
			process.exit(1);
		})(iosEnv.provisioningProfiles);

		// validate keychain
		var keychain = cli.argv.keychain ? afs.resolvePath(cli.argv.keychain) : null;
		if (keychain && !afs.exists(keychain)) {
			logger.error(__('Unable to find keychain "%s"', keychain) + '\n');
			logger.log(__('Available keychains:'));
			iosEnv.keychains.forEach(function (kc) {
				logger.log('    ' + kc.cyan);
			});
			logger.log();
			appc.string.suggest(keychain, iosEnv.keychains, logger.log);
			process.exit(1);
		}
	}

	if (cli.argv.target == 'dist-adhoc') {
		if (!cli.argv['output-dir']) {
			logger.error(__('Invalid required option "--output-dir"') + '\n');
			process.exit(1);
		}

		cli.argv['output-dir'] = afs.resolvePath(cli.argv['output-dir']);
		if (!afs.exists(cli.argv['output-dir'])) {
			wrench.mkdirSyncRecursive(cli.argv['output-dir']);
		} else if (!fs.statSync(cli.argv['output-dir']).isDirectory()) {
			logger.error(__('Invalid required option "--output-dir", option is not a directory.') + '\n');
			process.exit(1);
		}
	}

	var deviceFamily = cli.argv['device-family'],
		deploymentTargets = cli.tiapp['deployment-targets'];
	if (!deviceFamily && process.env.TARGETED_DEVICE_FAMILY) {
		// device family was not specified at the command line, but we did get it via an environment variable!
		deviceFamily = process.env.TARGETED_DEVICE_FAMILY === '1' ? 'iphone' : process.env.TARGETED_DEVICE_FAMILY == '2' ? 'ipad' : 'universal';
	}
	if (!deviceFamily && deploymentTargets) {
		// device family was not an environment variable, construct via the tiapp.xml's deployment targets
		if (deploymentTargets.iphone && deploymentTargets.ipad) {
			deviceFamily = cli.argv.$originalPlatform == 'ipad' ? 'ipad' : 'universal';
		} else if (deploymentTargets.iphone) {
			deviceFamily = 'iphone';
		} else if (deploymentTargets.ipad) {
			deviceFamily = 'ipad';
		}
	}
	if (!deviceFamily) {
		logger.info(__('No device family specified, defaulting to %s', 'universal'));
		deviceFamily = 'universal';
	}

	if (!deviceFamilies[deviceFamily]) {
		logger.error(__('Invalid device family "%s"', deviceFamily) + '\n');
		appc.string.suggest(deviceFamily, Object.keys(deviceFamilies), logger.log, 3);
		process.exit(1);
	}

	// device family may have been modified, so set it back in the args
	cli.argv['device-family'] = deviceFamily;

	if (cli.argv.target == 'simulator') {
		if (!cli.argv['sim-version']) {
			cli.argv['sim-version'] = cli.argv['ios-version'];
		}
		if (!sdks[cli.argv['ios-version']].some(function (ver) {
			if (version.eq(ver, cli.argv['sim-version'])) {
				cli.argv['sim-version'] = ver;
				return true;
			}
		})) {
			logger.error(__('Unable to find iOS Simulator %s', cli.argv['sim-version']) + '\n');
			logger.log(__('Available iOS Simulator versions for iOS SDK %s:', cli.argv['ios-version']));
			sdks[cli.argv['ios-version']].forEach(function (ver) {
				logger.log('    ' + ver.cyan);
			});
			logger.log();
			process.exit(1);
		}

		if (!cli.argv['sim-type']) {
			cli.argv['sim-type'] = cli.argv['device-family'] == 'ipad' ? 'ipad' : 'iphone';
		}
	}

	['debug', 'profiler'].forEach(function (type) {
		if (cli.argv[type + '-host'] && cli.argv.target != 'dist-appstore') {
			if (typeof cli.argv[type + '-host'] == 'number') {
				logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
				logger.log(__('The ' + type + ' host must be in the format "host:port".') + '\n');
				process.exit(1);
			}

			var parts = cli.argv[type + '-host'].split(':');

			if ((cli.argv.target == 'simulator' && parts.length < 2) || (cli.argv.target != 'simulator' && parts.length < 4)) {
				logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
				if (cli.argv.target == 'simulator') {
					logger.log(__('The ' + type + ' host must be in the format "host:port".') + '\n');
				} else {
					logger.log(__('The ' + type + ' host must be in the format "host:port:airkey:hosts".') + '\n');
				}
				process.exit(1);
			}

			if (parts.length > 1 && parts[1]) {
				var port = parseInt(parts[1]);
				if (isNaN(port) || port < 1 || port > 65535) {
					logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
					logger.log(__('The port must be a valid integer between 1 and 65535.') + '\n');
					process.exit(1);
				}
			}
		}
	});
};

exports.run = function (logger, config, cli, finished) {
	cli.argv.platform = 'ios';

	if (cli.argv.xcode) {
		// basically, we bypass the pre, post, and finalize hooks for xcode builds
		new build(logger, config, cli, finished);
	} else {
		cli.fireHook('build.pre.construct', function () {
			new build(logger, config, cli, function (err) {
				cli.fireHook('build.post.compile', this, function (postHookErr) {
					sendAnalytics(cli);
					if (postHookErr && postHookErr.type == 'AppcException') {
						logger.error(postHookErr.message);
						postHookErr.details.forEach(function (line) {
							line && logger.error(line);
						});
						logger.error();
					}
					cli.fireHook('build.finalize', this, function () {
						finished(err || postHookErr);
					});
				}.bind(this));
			});
		});
	}
};

function sendAnalytics(cli) {
	var eventName = cli.argv['device-family'] + '.' + cli.argv.target;

	if (cli.argv.target == 'dist-appstore' || cli.argv.target == 'dist-adhoc') {
		eventName = cli.argv['device-family'] + '.distribute.' + cli.argv.target.replace('dist-', '');
	} else if (cli.argv['debug-host']) {
		eventName += '.debug';
	} else if (cli.argv['profiler-host']) {
		eventName += '.profile';
	} else {
		eventName += '.run';
	}

	cli.addAnalyticsEvent(eventName, {
		dir: cli.argv['project-dir'],
		name: cli.tiapp.name,
		publisher: cli.tiapp.publisher,
		url: cli.tiapp.url,
		image: cli.tiapp.icon,
		appid: cli.tiapp.id,
		description: cli.tiapp.description,
		type: cli.argv.type,
		guid: cli.tiapp.guid,
		version: cli.tiapp.version,
		copyright: cli.tiapp.copyright,
		date: (new Date()).toDateString()
	});
}

function build(logger, config, cli, finished) {
	this.logger = logger;
	this.cli = cli;

	this.titaniumIosSdkPath = afs.resolvePath(__dirname, '..', '..');
	this.titaniumSdkVersion = path.basename(path.join(this.titaniumIosSdkPath, '..'));

	this.platformName = path.basename(this.titaniumIosSdkPath); // the name of the actual platform directory which will some day be "ios"

	this.projectDir = cli.argv['project-dir'];
	this.buildDir = path.join(this.projectDir, 'build', this.platformName);
	this.assetsDir = path.join(this.buildDir, 'assets');
	this.tiapp = cli.tiapp;
	this.target = cli.argv.target;
	this.provisioningProfileUUID = cli.argv['pp-uuid'];

	this.moduleSearchPaths = [ this.projectDir, afs.resolvePath(this.titaniumIosSdkPath, '..', '..', '..', '..') ];
	if (config.paths && Array.isArray(config.paths.modules)) {
		this.moduleSearchPaths = this.moduleSearchPaths.concat(config.paths.modules);
	}

	this.debugHost = cli.argv['debug-host'];
	this.profilerHost = cli.argv['profiler-host'];
	this.launchUrl = cli.argv['launch-url'];
	this.keychain = cli.argv.keychain;

	if (cli.argv.xcode) {
		this.deployType = cli.argv['deploy-type'];
	} else {
		this.deployType = /device|simulator/.test(this.target) && cli.argv['deploy-type'] ? cli.argv['deploy-type'] : deployTypes[this.target];
	}
	this.xcodeTarget = process.env.CONFIGURATION || (/device|simulator/.test(this.target) ? 'Debug' : 'Release');
	this.iosSdkVersion = cli.argv['ios-version'];
	this.iosSimVersion = cli.argv['sim-version'];
	this.iosSimType = cli.argv['sim-type'];
	this.deviceFamily = cli.argv['device-family'];
	this.xcodeTargetOS = this.target == 'simulator' ? 'iphonesimulator' + this.iosSdkVersion : 'iphoneos' + this.iosSdkVersion;
	this.iosBuildDir = path.join(this.buildDir, 'build', this.xcodeTarget + '-' + (this.target == 'simulator' ? 'iphonesimulator' : 'iphoneos'));
	this.xcodeAppDir = cli.argv.xcode ? path.join(process.env.TARGET_BUILD_DIR, process.env.CONTENTS_FOLDER_PATH) : path.join(this.iosBuildDir, this.tiapp.name + '.app');
	this.xcodeProjectConfigFile = path.join(this.buildDir, 'project.xcconfig');

	this.certDeveloperName = cli.argv['developer-name'];
	this.certDistributionName = cli.argv['distribution-name'];

	this.forceCopy = !!cli.argv['force-copy'];
	this.forceCopyAll = !!cli.argv['force-copy-all'];

	this.forceRebuild = false;

	// the ios sdk version is not in the selected xcode version, need to find the version that does have it
	Object.keys(iosEnv.xcode).forEach(function (sdk) {
		if (sdk != '__selected__' && (!this.xcodeEnv || iosEnv.xcode[sdk].selected) && iosEnv.xcode[sdk].sdks.some(function (ver) { return version.eq(ver, this.iosSdkVersion); }, this)) {
			this.xcodeEnv = iosEnv.xcode[sdk];
		}
	}, this);

	this.logger.debug(__('Titanium iOS SDK directory: %s', this.titaniumIosSdkPath.cyan));
	this.logger.info(__('Deploy type: %s', this.deployType.cyan));
	this.logger.info(__('Building for target: %s', this.target.cyan));
	this.logger.info(__('Building using iOS SDK: %s', version.format(this.iosSdkVersion, 2).cyan));
	if (this.target == 'simulator') {
		this.logger.info(__('Building for iOS %s Simulator: %s', simTypes[this.iosSimType], this.iosSimVersion.cyan));
	}
	this.logger.info(__('Building for device family: %s', this.deviceFamily.cyan));
	this.logger.debug(__('Setting Xcode target to %s', this.xcodeTarget.cyan));
	this.logger.debug(__('Setting Xcode build OS to %s', this.xcodeTargetOS.cyan));
	this.logger.debug(__('Xcode installation: %s', this.xcodeEnv.path.cyan));
	this.logger.debug(__('iOS WWDR certificate: %s', iosEnv.certs.wwdr ? __('installed').cyan : __('not found').cyan));
	if (this.target == 'device') {
		this.logger.info(__('iOS Development Certificate: %s', this.certDeveloperName.cyan));
	} else if (/dist-appstore|dist\-adhoc/.test(this.target)) {
		this.logger.info(__('iOS Distribution Certificate: %s', this.certDistributionName.cyan));
	}

	// validate the min-ios-ver from the tiapp.xml
	this.minIosVer = this.tiapp.ios && this.tiapp.ios['min-ios-ver'] || minIosSdkVersion;
	if (version.gte(this.iosSdkVersion, '6.0') && version.lt(this.minIosVer, '4.3')) {
		this.logger.info(__('Building for iOS %s; using %s as minimum iOS version', version.format(this.iosSdkVersion, 2).cyan, '4.3'.cyan));
		this.minIosVer = '4.3';
	} else if (version.lt(this.minIosVer, minIosSdkVersion)) {
		this.logger.info(__('The %s of the iOS section in the tiapp.xml is lower than minimum supported version: Using %s as minimum', 'min-ios-ver'.cyan, version.format(minIosSdkVersion, 2).cyan));
		this.minIosVer = minIosSdkVersion;
	} else if (version.gt(this.minIosVer, this.iosSdkVersion)) {
		this.logger.info(__('The %s of the iOS section in the tiapp.xml is greater than the specified %s: Using %s as minimum', 'min-ios-ver'.cyan, 'ios-version'.cyan, version.format(this.iosSdkVersion, 2).cyan));
		this.minIosVer = this.iosSdkVersion;
	}
	this.logger.info(__('Minimum iOS version: %s', version.format(this.minIosVer, 2, 3).cyan));

	if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
		if (this.keychain) {
			this.logger.info(__('Using keychain: %s', this.keychain));
		} else {
			this.logger.info(__('Using default keychain'));
		}
	}

	if (this.debugHost && this.target != 'dist-appstore') {
		this.logger.info(__('Debugging enabled via debug host: %s', this.debugHost.cyan));
	} else {
		this.logger.info(__('Debugging disabled'));
	}

	if (this.profilerHost && this.target != 'dist-appstore') {
		this.logger.info(__('Profiler enabled via profiler host: %s', this.profilerHost.cyan));
	} else {
		this.logger.info(__('Profiler disabled'));
	}

	// make sure we have an icon
	if (!this.tiapp.icon || !['Resources', 'Resources/iphone', 'Resources/ios'].some(function (p) {
			return afs.exists(this.projectDir, p, this.tiapp.icon);
		}, this)) {
		this.tiapp.icon = 'appicon.png';
	}

	Array.isArray(this.tiapp.modules) || (this.tiapp.modules = []);

	if (cli.argv.xcode) {
		this.logger.info(__('Initiating Xcode pre-compile phase'));
		this.xcodePrecompilePhase(finished);
	} else {
		this.logger.info(__('Initiating prepare phase'));
		this.preparePhase(finished);
	}
}

build.prototype = {

	copyDirSync: function (src, dest, opts) {
		afs.copyDirSyncRecursive(src, dest, opts || {
			preserve: true,
			logger: this.logger.debug,
			ignoreDirs: ['.git', '.svn', 'CVS'],
			ignoreFiles: ['.gitignore', '.cvsignore']
		});
	},

	copyDirAsync: function (src, dest, callback, opts) {
		afs.copyDirRecursive(src, dest, callback, opts || {
			preserve: true,
			logger: this.logger.debug,
			ignoreDirs: ['.git', '.svn', 'CVS'],
			ignoreFiles: ['.gitignore', '.cvsignore']
		});
	},

	hashFile: function (file, limit) {
		var result = '';
		if (afs.exists(file)) {
			var size = limit || fs.statSync(file).size,
				buffer = new Buffer(size),
				fd = fs.openSync(file, 'r');
			if (fd) {
				try {
					fs.readSync(fd, buffer, 0, size, 0);
					result = crypto.createHash('md5').update(buffer).digest('hex');
				} finally {
					fs.closeSync(fd);
				}
			}
		}
		return result;
	},

	preparePhase: function (finished) {
		this.architectures = 'armv6 armv7 i386';
		// no armv6 support above 4.3 or with 6.0+ SDK
		if (version.gte(this.cli.argv['ios-version'], '6.0')) {
			this.architectures = 'armv7 armv7s i386';
		} else if (version.gte(this.minIosVer, '4.3')) {
			this.architectures = 'armv7 i386';
		}
		this.logger.debug(__('Building for the following architectures: %s', this.architectures.cyan));

		// create the build directory (<project dir>/build/[iphone|ios]) if it doesn't already exist
		wrench.mkdirSyncRecursive(this.assetsDir);

		// read the build manifest from the last time we built, if exists
		this.buildManifest = {};
		this.buildManifestFile = path.join(this.buildDir, 'build-manifest.json');
		if (afs.exists(this.buildManifestFile)) {
			try {
				this.buildManifest = JSON.parse(fs.readFileSync(this.buildManifestFile)) || {};
			} catch (e) {}
		}

		// determine the libTiCore hash
		this.libTiCoreHash = this.hashFile(path.join(this.titaniumIosSdkPath, 'libTiCore.a'));

		// figure out all of the modules currently in use
		this.modulesHash = crypto.createHash('md5').update(this.tiapp.modules.filter(function (m) {
			return !m.platform || /^iphone|ipad|commonjs$/.test(m.platform);
		}).map(function (m) {
			return m.id + ',' + m.platform + ',' + m.version;
		}).join('|')).digest('hex');

		// check if we need to do a rebuild
		this.forceRebuild = this.checkIfShouldForceRebuild();

		this.cli.fireHook('build.pre.compile', this, function () {
			// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
			// Alloy generate an app.js, it may not have existed during validate(), but should exist now
			// that build.pre.compile was fired.
			ti.validateAppJsExists(this.projectDir, this.logger);

			// let's start building some apps!
			parallel(this, [
				'createInfoPlist',
				'createEntitlementsPlist',
				'detectModules'
			], function () {
				if (this.forceRebuild) {
					var xcodeBuildDir = path.join(this.buildDir, 'build');
					if (afs.exists(xcodeBuildDir)) {
						this.logger.info(__('Cleaning old build directory'));
						// wipe the actual Xcode build dir, not the Titanium build dir
						wrench.rmdirSyncRecursive(xcodeBuildDir, true);
						wrench.mkdirSyncRecursive(xcodeBuildDir);
					}
					this.logger.info(__('Performing full rebuild'));
					this.createXcodeProject();
					this.populateIosFiles();
				}

				// create the actual .app dir if it doesn't exist
				wrench.mkdirSyncRecursive(this.xcodeAppDir);

				parallel(this, [
					function (next) {
						if (this.target == 'simulator') {
							if (this.deployType == 'development') {
								if (this.forceCopy) {
									this.logger.info(__('Forcing copying of files instead of creating symlinks'));
								} else {
									return this.createSymlinks(next);
								}
							} else {
								// during simulator we need to copy in standard built-in module files
								// since we might not run the compiler on subsequent launches
								this.copyDirSync(path.join(this.titaniumIosSdkPath, 'modules'), path.join(this.xcodeAppDir, 'modules'));

								var copyOpts = {
									preserve: true,
									logger: this.logger.debug,
									ignoreDirs: ['.git', '.svn', 'CVS'],
									ignoreFiles: ['.gitignore', '.cvsignore']
								};

								if (this.deviceFamily == 'iphone') {
									copyOpts.rootIgnore = ipadSplashImages;
								}

								// when in simulator since we point to the resources directory, we need
								// to explicitly copy over any files
								['ios', 'iphone'].forEach(function (name) {
									var dir = path.join(this.projectDir, 'Resources', name);
									afs.exists(dir) && this.copyDirSync(dir, this.xcodeAppDir, copyOpts);

									dir = path.join(this.projectDir, 'platform', name);
									afs.exists(dir) && this.copyDirSync(dir, this.xcodeAppDir, copyOpts);
								}, this);

								// copy the custom fonts
								fs.readdirSync(path.join(this.projectDir, 'Resources')).forEach(function (file) {
									var src = path.join(this.projectDir, 'Resources', file);
									if (fs.statSync(src).isFile() && /.+\.(ttf|otf)$/.test(file)) {
										this.logger.info(__('Detected custom font: %s', file));

										var dest = path.join(this.xcodeAppDir, file);
										afs.exists(dest) && fs.unlinkSync(dest);
										afs.copyFileSync(src, dest, { logger: this.logger.debug });
									}
								}, this);
							}
						}
						next();
					},
					'createDebuggerPlist',
					'createProfilerPlist',
					'injectModulesIntoXcodeProject',
					'injectApplicationDefaults', // if ApplicationDefaults.m was modified, forceRebuild will be set to true
					'copyTitaniumLibraries',
					'copyModuleResources',
					'copyCommonJSModules',
					'copyItunesArtwork',
					'copyGraphics',
					'writeBuildManifest'
				], function () {
					// this is a hack... for non-deployment builds we need to force xcode so that the pre-compile phase
					// is run and the ApplicationRouting.m gets updated
					if (!this.forceRebuild && this.deployType != 'development') {
						this.logger.info(__('Forcing rebuild: deploy type is %s, so need to recompile ApplicationRouting.m', this.deployType));
						this.forceRebuild = true;
					}

					if (this.forceRebuild || this.target != 'simulator' || !afs.exists(this.xcodeAppDir, this.tiapp.name)) {
						this.logger.info(__('Invoking xcodebuild'));
						this.invokeXcodeBuild(finished);
					} else {
						this.logger.info(__('Skipping xcodebuild'));
						var delta = appc.time.prettyDiff(this.cli.startTime, Date.now());
						this.logger.info(__('Finished building the application in %s', delta));
						finished.call(this);
					}
				});
			});
		}.bind(this));
	},

	createInfoPlist: function (callback) {
		var src = this.projectDir + '/Info.plist',
			dest = this.buildDir + '/Info.plist',
			plist = new appc.plist(),
			iphone = this.tiapp.iphone,
			ios = this.tiapp.ios,
			fbAppId = this.tiapp.properties && this.tiapp.properties['ti.facebook.appid'] && this.tiapp.properties['ti.facebook.appid']['value'],
			iconName = this.tiapp.icon.replace(/(.+)(\..*)$/, '$1'), // note: this is basically stripping the file extension
			consts = {
				'__APPICON__': iconName,
				'__PROJECT_NAME__': this.tiapp.name,
				'__PROJECT_ID__': this.tiapp.id,
				'__URL__': this.tiapp.id,
				'__URLSCHEME__': this.tiapp.name.replace(/\./g, '_').replace(/ /g, '').toLowerCase(),
				'__ADDITIONAL_URL_SCHEMES__': fbAppId ? '<string>fb' + fbAppId + '</string>' : ''
			};

		function merge(src, dest) {
			Object.keys(src).forEach(function (prop) {
				if (!/^\+/.test(prop)) {
					if (Object.prototype.toString.call(src[prop]) == '[object Object]') {
						dest.hasOwnProperty(prop) || (dest[prop] = {});
						merge(src[prop], dest[prop]);
					} else {
						dest[prop] = src[prop];
					}
				}
			});
		}

		if (afs.exists(this.titaniumIosSdkPath, 'Info.plist')) {
			plist.parse(fs.readFileSync(path.join(this.titaniumIosSdkPath, 'Info.plist')).toString().replace(/(__.+__)/g, function (match, key, format) {
				return consts.hasOwnProperty(key) ? consts[key] : '<!-- ' + key + ' -->'; // if they key is not a match, just comment out the key
			}));
		}

		// if the user has a Info.plist in their project directory, consider that a custom override
		if (afs.exists(src)) {
			this.logger.info(__('Copying custom Info.plist from project directory'));

			var custom = new appc.plist().parse(fs.readFileSync(src).toString());
			if (custom.CFBundleIdentifier != this.tiapp.id) {
				this.logger.info(__('Forcing rebuild: custom Info.plist CFBundleIdentifier not equal to tiapp.xml <id>'));
				this.forceRebuild = true;
			}

			merge(custom, plist);
		}

		plist.UIRequiresPersistentWiFi = this.tiapp.hasOwnProperty('persistent-wifi') ? !!this.tiapp['persistent-wifi'] : false;
		plist.UIPrerenderedIcon = this.tiapp.hasOwnProperty('prerendered-icon') ? !!this.tiapp['prerendered-icon'] : false;
		plist.UIStatusBarHidden = this.tiapp.hasOwnProperty('statusbar-hidden') ? !!this.tiapp['statusbar-hidden'] : false;

		plist.UIStatusBarStyle = 'UIStatusBarStyleDefault';
		if (/opaque_black|opaque|black/.test(this.tiapp['statusbar-style'])) {
			plist.UIStatusBarStyle = 'UIStatusBarStyleBlackOpaque';
		} else if (/translucent_black|transparent|translucent/.test(this.tiapp['statusbar-style'])) {
			plist.UIStatusBarStyle = 'UIStatusBarStyleBlackTranslucent';
		}

		if (iphone) {
			if (iphone.orientations) {
				var orientationsMap = {
					'PORTRAIT': 'UIInterfaceOrientationPortrait',
					'UPSIDE_PORTRAIT': 'UIInterfaceOrientationPortraitUpsideDown',
					'LANDSCAPE_LEFT': 'UIInterfaceOrientationLandscapeLeft',
					'LANDSCAPE_RIGHT': 'UIInterfaceOrientationLandscapeRight'
				};

				Object.keys(iphone.orientations).forEach(function (key) {
					var entry = 'UISupportedInterfaceOrientations' + (key == 'ipad' ? '~ipad' : '');

					Array.isArray(plist[entry]) || (plist[entry] = []);
					iphone.orientations[key].forEach(function (name) {
						var value = orientationsMap[name.split('.').pop().toUpperCase()] || name;
						// name should be in the format Ti.UI.PORTRAIT, so pop the last part and see if it's in the map
						if (plist[entry].indexOf(value) == -1) {
							plist[entry].push(value);
						}
					});
				});
			}

			if (iphone.backgroundModes) {
				plist.UIBackgroundModes = (plist.UIBackgroundModes || []).concat(iphone.backgroundModes);
			}

			if (iphone.requires) {
				plist.UIRequiredDeviceCapabilities = (plist.UIRequiredDeviceCapabilities || []).concat(iphone.requiredFeatures);
			}

			if (iphone.types) {
				Array.isArray(plist.CFBundleDocumentTypes) || (plist.CFBundleDocumentTypes = []);
				iphone.types.forEach(function (type) {
					var types = plist.CFBundleDocumentTypes,
						match = false,
						i = 0;

					for (; i < types.length; i++) {
						if (types[i].CFBundleTypeName == type.name) {
							types[i].CFBundleTypeIconFiles = type.icon;
							types[i].LSItemContentTypes = type.uti;
							types[i].LSHandlerRank = type.owner ? 'Owner' : 'Alternate';
							match = true;
							break;
						}
					}

					if (!match) {
						types.push({
							CFBundleTypeName: type.name,
							CFBundleTypeIconFiles: type.icon,
							LSItemContentTypes: type.uti,
							LSHandlerRank: type.owner ? 'Owner' : 'Alternate'
						});
					}
				});
			}
		}

		ios && ios.plist && merge(ios.plist, plist);

		plist.CFBundleIdentifier = this.tiapp.id;

		// device builds require an additional token to ensure uniquiness so that iTunes will detect an updated app to sync
		if (this.target == 'device') {
			plist.CFBundleVersion = appc.version.format(this.tiapp.version, 3, 3) + '.' + (new Date).getTime();
		} else {
			plist.CFBundleVersion = appc.version.format(this.tiapp.version, 3, 3);
		}
		plist.CFBundleShortVersionString = plist.CFBundleVersion;

		Array.isArray(plist.CFBundleIconFiles) || (plist.CFBundleIconFiles = []);
		['.png', '@2x.png', '-72.png', '-Small-50.png', '-72@2x.png', '-Small-50@2x.png', '-Small.png', '-Small@2x.png'].forEach(function (name) {
			name = iconName + name;
			if (afs.exists(this.projectDir, 'Resources', name) ||
				afs.exists(this.projectDir, 'Resources', 'iphone', name) ||
				afs.exists(this.projectDir, 'Resources', this.platformName, name)) {
				if (plist.CFBundleIconFiles.indexOf(name) == -1) {
					plist.CFBundleIconFiles.push(name);
				}
			}
		}, this);

		fs.writeFileSync(dest, plist.toString('xml'));

		callback();
	},

	createDebuggerPlist: function (callback) {
		var parts = (this.debugHost || '').split(':'),
			plist = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'debugger.plist'))
						.toString()
						.replace(/__DEBUGGER_HOST__/g, parts.length > 0 ? parts[0] : '')
						.replace(/__DEBUGGER_PORT__/g, parts.length > 1 ? parts[1] : '')
						.replace(/__DEBUGGER_AIRKEY__/g, parts.length > 2 ? parts[2] : '')
						.replace(/__DEBUGGER_HOSTS__/g, parts.length > 3 ? parts[3] : ''),
			dest = path.join(this.buildDir, 'debugger.plist'),
			plistExists = afs.exists(dest);

		if (!plistExists || fs.readFileSync(dest).toString() != plist) {
			if (this.target != 'simulator') {
				if (!plistExists) {
					this.logger.info(__('Forcing rebuild: debugger.plist does not exist'));
				} else {
					this.logger.info(__('Forcing rebuild: debugger settings changed since last build'));
				}
				this.forceRebuild = true;
			} else {
				// write the debugger.plist to the app dir now since we're skipping Xcode and the pre-compile phase
				fs.writeFileSync(path.join(this.xcodeAppDir, 'debugger.plist'), plist);
			}
			fs.writeFile(dest, plist, callback());
		} else {
			callback();
		}
	},

	createProfilerPlist: function (callback) {
		var parts = (this.profilerHost || '').split(':'),
			plist = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'profiler.plist'))
						.toString()
						.replace(/__PROFILER_HOST__/g, parts.length > 0 ? parts[0] : '')
						.replace(/__PROFILER_PORT__/g, parts.length > 1 ? parts[1] : '')
						.replace(/__PROFILER_AIRKEY__/g, parts.length > 2 ? parts[2] : '')
						.replace(/__PROFILER_HOSTS__/g, parts.length > 3 ? parts[3] : ''),
			dest = path.join(this.buildDir, 'profiler.plist'),
			plistExists = afs.exists(dest);

		if (!plistExists || fs.readFileSync(dest).toString() != plist) {
			if (this.target != 'simulator') {
				if (!plistExists) {
					this.logger.info(__('Forcing rebuild: profiler.plist does not exist'));
				} else {
					this.logger.info(__('Forcing rebuild: profiler settings changed since last build'));
				}
				this.forceRebuild = true;
			} else {
				// write the profiler.plist to the app dir now since we're skipping Xcode and the pre-compile phase
				fs.writeFileSync(path.join(this.xcodeAppDir, 'profiler.plist'), plist);
			}
			fs.writeFile(dest, plist, callback());
		} else {
			callback();
		}
	},

	createEntitlementsPlist: function (callback) {
		if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
			// allow the project to have its own custom entitlements
			var entitlementsFile = path.join(this.projectDir, 'Entitlements.plist'),
				contents = '',
				pp;
			if (afs.exists(entitlementsFile)) {
				this.logger.info(__('Found custom entitlements: %s', entitlementsFile));
				contents = fs.readFileSync(entitlementsFile).toString();
			} else if (pp = iosEnv.provisioningProfilesByUUID[this.provisioningProfileUUID]) {
				// attempt to customize it by reading provisioning profile
				var plist = new appc.plist();
				plist['get-task-allow'] = !!pp.getTaskAllow;
				pp.apsEnvironment && (plist['aps-environment'] = pp.apsEnvironment);
				this.target == 'dist-appstore' && (plist['application-identifier'] = plist['keychain-access-groups'] = pp.appPrefix + '.' + this.tiapp.id);
				contents = plist.toString('xml');
			}
			this.codeSignEntitlements = true;
			fs.writeFile(path.join(this.buildDir, 'Entitlements.plist'), contents, callback);
		} else {
			callback();
		}
	},

	scrubName: function (name) {
		name = name.replace(/-/g, '_').replace(/\W/g, '')
		return /^[0-9]/.test(name) ? 'k' + name : name;
	},

	createXcodeProject: function () {
		var xcodeDir = path.join(this.buildDir, this.tiapp.name + '.xcodeproj'),
			namespace = this.scrubName(this.tiapp.name),
			copyFileRegExps = [
				// note: order of regexps matters
				[/TitaniumViewController/g, namespace + '$ViewController'],
				[/TitaniumModule/g, namespace + '$Module'],
				[/Titanium|Appcelerator/g, namespace],
				[/titanium/g, '_' + namespace.toLowerCase()],
				[/(org|com)\.appcelerator/g, '$1.' + namespace.toLowerCase()],
				[new RegExp('\\* ' + namespace + ' ' + namespace + ' Mobile', 'g'), '* Appcelerator Titanium Mobile'],
				[new RegExp('\\* Copyright \\(c\\) \\d{4}(-\\d{4})? by ' + namespace + ', Inc\\.', 'g'), '* Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc.'],
				[/(\* Please see the LICENSE included with this distribution for details.\n)(?! \*\s*\* WARNING)/g, '$1 * \n * WARNING: This is generated code. Modify at your own risk and without support.\n']
			],
			extRegExp = /\.(c|cpp|h|m|mm|pbxproj)$/,
			copyOpts = {
				preserve: true,
				logger: this.logger.debug,
				ignoreDirs: ['.git','.svn', 'CVS'],
				ignoreFiles: ['.gitignore', '.cvsignore', 'bridge.txt', 'libTitanium.a'],
				callback: function (src, dest, contents, logger) {
					if (extRegExp.test(src) && src.indexOf('TiCore') == -1) {
						logger && logger(__('Processing %s', src.cyan));
						for (var i = 0, l = copyFileRegExps.length; i < l; i++) {
							contents = contents.toString().replace(copyFileRegExps[i][0], copyFileRegExps[i][1]);
						}
					}
					return contents;
				}
			};

		this.logger.info(__('Copying Xcode iOS files'));
		['Classes', 'headers'].forEach(function (dir) {
			afs.copyDirSyncRecursive(
				path.join(this.titaniumIosSdkPath, dir),
				path.join(this.buildDir, dir),
				copyOpts
			);
		}, this);

		afs.copyFileSync(
			path.join(this.titaniumIosSdkPath, this.platformName, 'Titanium_Prefix.pch'),
			path.join(this.buildDir, this.tiapp.name + '_Prefix.pch'),
			{
				logger: this.logger.debug
			}
		);

		this.logger.info(__('Creating Xcode project directory: %s', xcodeDir.cyan));
		wrench.mkdirSyncRecursive(xcodeDir);

		function injectCompileShellScript(str, sectionName, shellScript) {
			var p = 0;
			while (p != -1) {
				p = str.indexOf('name = "' + sectionName + '"', p);
				if (p != -1) {
					p = str.indexOf('shellScript = ', p);
					if (p != -1) {
						str = str.substring(0, p) + 'shellScript = "' + shellScript + '";' + str.substring(str.indexOf('\n', p));
					}
				}
			}
			return str;
		}

		this.logger.info(__('Writing Xcode project data file: %s', 'Titanium.xcodeproj/project.pbxproj'.cyan));
		var proj = fs.readFileSync(path.join(this.titaniumIosSdkPath, this.platformName, 'Titanium.xcodeproj', 'project.pbxproj')).toString();
		proj = proj.replace(/\.\.\/Classes/g, 'Classes')
			.replace(/\.\.\/Resources/g, 'Resources')
			.replace(/\.\.\/headers/g, 'headers')
			.replace(/\.\.\/lib/g, 'lib')
			.replace(/Titanium\.plist/g, 'Info.plist')
			.replace(/Titanium\-KitchenSink/g, this.tiapp.name)
			.replace(/path \= Titanium.app;/g, 'path = "' + this.tiapp.name + '.app";')
			.replace(/Titanium.app/g, this.tiapp.name + '.app')
			.replace(/PRODUCT_NAME \= ['"]?Titanium(-iPad|-universal)?['"]?/g, 'PRODUCT_NAME = "' + this.tiapp.name + '$1"') // note: there are no PRODUCT_NAMEs with -iPad and -univeral
			.replace(/path \= Titanium_Prefix\.pch;/g, 'path = "' + this.tiapp.name + '_Prefix.pch";')
			.replace(/GCC_PREFIX_HEADER \= Titanium_Prefix\.pch;/g, 'GCC_PREFIX_HEADER = "' + this.tiapp.name + '_Prefix.pch";')
			.replace(/Titanium_Prefix\.pch/g, this.tiapp.name + '_Prefix.pch')
			.replace(/Titanium/g, namespace);

		proj = injectCompileShellScript(
			proj,
			'Pre-Compile',
			'if [ \\"x$TITANIUM_CLI_XCODEBUILD\\" == \\"x\\" ]; then NO_COLORS=\\"--no-colors\\"; else NO_COLORS=\\"\\"; fi\\n' +
			(process.execPath || 'node') + ' \\"' + this.cli.argv.$0.replace(/^(.+\/)*node /, '') + '\\" build --platform ' +
				this.platformName + ' --sdk ' + this.titaniumSdkVersion + ' --no-prompt --no-banner $NO_COLORS --xcode\\nexit $?'
		);
		proj = injectCompileShellScript(
			proj,
			'Post-Compile',
			"echo 'Xcode Post-Compile Phase: Touching important files'\\ntouch -c Classes/ApplicationRouting.h Classes/ApplicationRouting.m Classes/ApplicationDefaults.m Classes/ApplicationMods.m Classes/defines.h"
		);
		fs.writeFileSync(path.join(this.buildDir, this.tiapp.name + '.xcodeproj', 'project.pbxproj'), proj);

		this.logger.info(__('Writing Xcode project configuration: %s', 'project.xcconfig'.cyan));
		fs.writeFileSync(this.xcodeProjectConfigFile, [
			'TI_VERSION=' + this.titaniumSdkVersion,
			'TI_SDK_DIR=' + this.titaniumIosSdkPath.replace(this.titaniumSdkVersion, '$(TI_VERSION)'),
			'TI_APPID=' + this.tiapp.id,
			'OTHER_LDFLAGS[sdk=iphoneos*]=$(inherited) -weak_framework iAd',
			'OTHER_LDFLAGS[sdk=iphonesimulator*]=$(inherited) -weak_framework iAd',
			'#include "module"'
		].join('\n') + '\n');

		this.logger.info(__('Writing Xcode module configuration: %s', 'module.xcconfig'.cyan));
		fs.writeFileSync(path.join(this.buildDir, 'module.xcconfig'), '// this is a generated file - DO NOT EDIT\n\n');
	},

	checkIfShouldForceRebuild: function () {
		var manifest = this.buildManifest;

		if (this.cli.argv.force) {
			this.logger.info(__('Forcing rebuild: %s flag was set', '--force'.cyan));
			return true;
		}

		if (!afs.exists(this.buildManifestFile)) {
			// if no .version file, rebuild!
			this.logger.info(__('Forcing rebuild: %s does not exist', this.buildManifestFile.cyan));
			return true;
		}

		// check if the target changed
		if (this.target != manifest.target) {
			this.logger.info(__('Forcing rebuild: target changed since last build'));
			this.logger.info('  ' + __('Was: %s', this.buildManifest.target));
			this.logger.info('  ' + __('Now: %s', this.target));
			return true;
		}

		if (afs.exists(this.xcodeProjectConfigFile)) {
			// we have a previous build, see if the Titanium SDK changed
			var conf = fs.readFileSync(this.xcodeProjectConfigFile).toString(),
				versionMatch = conf.match(/TI_VERSION\=([^\n]*)/),
				idMatch = conf.match(/TI_APPID\=([^\n]*)/);

			if (versionMatch && !appc.version.eq(versionMatch[1], this.titaniumSdkVersion)) {
				this.logger.info(__("Forcing rebuild: last build was under Titanium SDK version %s and we're compiling for version %s", versionMatch[1].cyan, this.titaniumSdkVersion.cyan));
				return true;
			}

			if (idMatch && idMatch[1] != this.tiapp.id) {
				this.logger.info(__("Forcing rebuild: app id changed from %s to %s", idMatch[1].cyan, this.tiapp.id.cyan));
				return true;
			}
		}

		if (!afs.exists(this.xcodeAppDir)) {
			this.logger.info(__('Forcing rebuild: %s does not exist', this.xcodeAppDir.cyan));
			return true;
		}

		// check that we have a libTiCore hash
		if (!manifest.tiCoreHash) {
			this.logger.info(__('Forcing rebuild: incomplete version file %s', this.buildVersionFile.cyan));
			return true;
		}

		// check if the libTiCore hashes are different
		if (this.libTiCoreHash != manifest.tiCoreHash) {
			this.logger.info(__('Forcing rebuild: libTiCore hash changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.tiCoreHash));
			this.logger.info('  ' + __('Now: %s', this.libTiCoreHash));
			return true;
		}

		// check if the titanium sdk paths are different
		if (manifest.iosSdkPath != this.titaniumIosSdkPath) {
			this.logger.info(__('Forcing rebuild: Titanium SDK path changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.iosSdkPath));
			this.logger.info('  ' + __('Now: %s', this.titaniumIosSdkPath));
			return true;
		}

		// check if the device family has changed (i.e. was universal, now iphone)
		if (manifest.deviceFamily != this.deviceFamily) {
			this.logger.info(__('Forcing rebuild: device family changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.deviceFamily));
			this.logger.info('  ' + __('Now: %s', this.deviceFamily));
			return true;
		}

		// check the git hashes are different
		if (!manifest.gitHash || manifest.gitHash != ti.manifest.githash) {
			this.logger.info(__('Forcing rebuild: githash changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.gitHash));
			this.logger.info('  ' + __('Now: %s', ti.manifest.githash));
			return true;
		}

		// check if the app guids are different
		if (this.tiapp.guid != manifest.appGuid) {
			this.logger.info(__('Forcing rebuild: githash changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.appGuid));
			this.logger.info('  ' + __('Now: %s', this.tiapp.guid));
			return true;
		}

		// check if the modules hashes are different
		if (this.modulesHash != manifest.modulesHash) {
			this.logger.info(__('Forcing rebuild: modules hash changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.modulesHash));
			this.logger.info('  ' + __('Now: %s', this.modulesHash));
			return true;
		}

		// next we check if any tiapp.xml values changed so we know if we need to reconstruct the main.m
		if (this.tiapp.name != manifest.name) {
			this.logger.info(__('Forcing rebuild: tiapp.xml project name changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.name));
			this.logger.info('  ' + __('Now: %s', this.tiapp.name));
			return true;
		}

		if (this.tiapp.id != manifest.id) {
			this.logger.info(__('Forcing rebuild: tiapp.xml app id changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.id));
			this.logger.info('  ' + __('Now: %s', this.tiapp.id));
			return true;
		}

		if (!this.tiapp.analytics != !manifest.analytics) {
			this.logger.info(__('Forcing rebuild: tiapp.xml analytics flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', !!manifest.analytics));
			this.logger.info('  ' + __('Now: %s', !!this.tiapp.analytics));
			return true;
		}
		if (this.tiapp.publisher != manifest.publisher) {
			this.logger.info(__('Forcing rebuild: tiapp.xml publisher changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.publisher));
			this.logger.info('  ' + __('Now: %s', this.tiapp.publisher));
			return true;
		}

		if (this.tiapp.url != manifest.url) {
			this.logger.info(__('Forcing rebuild: tiapp.xml url changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.url));
			this.logger.info('  ' + __('Now: %s', this.tiapp.url));
			return true;
		}

		if (this.tiapp.version != manifest.version) {
			this.logger.info(__('Forcing rebuild: tiapp.xml version changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.version));
			this.logger.info('  ' + __('Now: %s', this.tiapp.version));
			return true;
		}

		if (this.tiapp.description != manifest.description) {
			this.logger.info(__('Forcing rebuild: tiapp.xml description changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.description));
			this.logger.info('  ' + __('Now: %s', this.tiapp.description));
			return true;
		}

		if (this.tiapp.copyright != manifest.copyright) {
			this.logger.info(__('Forcing rebuild: tiapp.xml copyright changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.copyright));
			this.logger.info('  ' + __('Now: %s', this.tiapp.copyright));
			return true;
		}

		if (this.tiapp.guid != manifest.guid) {
			this.logger.info(__('Forcing rebuild: tiapp.xml guid changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.guid));
			this.logger.info('  ' + __('Now: %s', this.tiapp.guid));
			return true;
		}

		if (this.forceCopy != manifest.forceCopy) {
			this.logger.info(__('Forcing rebuild: force copy flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.forceCopy));
			this.logger.info('  ' + __('Now: %s', this.forceCopy));
			return true;
		}

		if (this.forceCopyAll != manifest.forceCopyAll) {
			this.logger.info(__('Forcing rebuild: force copy all flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.forceCopyAll));
			this.logger.info('  ' + __('Now: %s', this.forceCopyAll));
			return true;
		}

		return false;
	},

	detectModules: function (callback) {
		this.modules = [];
		this.commonJsModules = [];
		this.nativeLibModules = [];
		this.nativeLibModuleHashes = '';

		if (!this.tiapp.modules || !this.tiapp.modules.length) {
			this.logger.info(__('No Titanium Modules required, continuing'));
			callback();
			return;
		}

		appc.timodule.find(this.tiapp.modules, ['iphone', 'ios'], this.deployType, this.titaniumSdkVersion, this.moduleSearchPaths, this.logger, function (modules) {
			if (modules.missing.length) {
				this.logger.error(__('Could not find all required Titanium Modules:'))
				modules.missing.forEach(function (m) {
					this.logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t deploy-type: ' + m.deployType);
				}, this);
				this.logger.log();
				process.exit(1);
			}

			if (modules.incompatible.length) {
				this.logger.error(__('Found incompatible Titanium Modules:'));
				modules.incompatible.forEach(function (m) {
					this.logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t min sdk: ' + m.minsdk);
				}, this);
				this.logger.log();
				process.exit(1);
			}

			if (modules.conflict.length) {
				this.logger.error(__('Found conflicting Titanium modules:'));
				modules.conflict.forEach(function (m) {
					this.logger.error('   ' + __('Titanium module "%s" requested for both iOS and CommonJS platforms, but only one may be used at a time.', m.id));
				}, this);
				this.logger.log();
				process.exit(1);
			}

			this.modules = modules.found;

			var hashes = [];

			modules.found.forEach(function (module) {
				if (module.platform.indexOf('commonjs') != -1) {
					this.commonJsModules.push(module);
				} else {
					module.libName = 'lib' + module.id.toLowerCase() + '.a',
					module.libFile = path.join(module.modulePath, module.libName);

					if (!afs.exists(module.libFile)) {
						this.logger.error(__('Module %s version %s is missing library file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, module.libFile.cyan) + '\n');
						process.exit(1);
					}

					hashes.push(module.hash = this.hashFile(module.libFile));

					this.logger.info(__('Detected third-party native iOS module: %s version %s', module.id.cyan, (module.manifest.version || 'latest').cyan));
					this.nativeLibModules.push(module);
				}
			}, this);

			// check if any native modules were added, updated, or removed
			if (this.buildManifest) {
				this.nativeModulesHash = crypto.createHash('md5').update(hashes.sort().join(',')).digest('hex');
				if (this.nativeModulesHash != this.buildManifest.nativeModulesHash) {
					this.logger.info(__('Forcing rebuild: native modules hash changed since last build'));
					this.logger.info('  ' + __('Was: %s', this.buildManifest.nativeModulesHash));
					this.logger.info('  ' + __('Now: %s', this.nativeModulesHash));
					this.forceRebuild = true;
				}
			}

			callback();
		}.bind(this));
	},

	injectApplicationDefaults: function (callback) {
		var props = this.tiapp.properties || {},
			dest = path.join(this.buildDir, 'Classes', 'ApplicationDefaults.m'),
			exists = afs.exists(dest),
			contents = [
				'/**',
				' * Appcelerator Titanium Mobile',
				' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
				' * Licensed under the terms of the Apache Public License',
				' * Please see the LICENSE included with this distribution for details.',
				' *',
				' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
				' */',
				'',
				'#import <Foundation/Foundation.h>',
				'#import "TiUtils.h"',
				'#import "ApplicationDefaults.h"',
				'',
				'@implementation ApplicationDefaults',
				'',
				'+ (NSMutableDictionary*) copyDefaults',
				'{',
				'	NSMutableDictionary * _property = [[NSMutableDictionary alloc] init];',
				'	'
			];

		if (Object.keys(props).length) {
			Object.keys(props).forEach(function (name) {
				var prop = props[name],
					value = prop.value || '';
				switch (prop.type) {
					case 'bool':
						contents.push('	[_property setObject:[NSNumber numberWithBool:[TiUtils boolValue:@"' + value + '"]] forKey:@"' + name + '"];');
						break;
					case 'int':
						contents.push('	[_property setObject:[NSNumber numberWithInt:[TiUtils intValue:@"' + value + '"]] forKey:@"' + name + '"];');
						break;
					case 'double':
						contents.push('	[_property setObject:[NSNumber numberWithDouble:[TiUtils doubleValue:@"' + value + '"]] forKey:@"' + name + '"];');
						break;
					default: // includes strings
						contents.push('	[_property setObject:[TiUtils stringValue:@"' + value + '"] forKey:@"' + name + '"];');
				}
			}, this);
			contents.push('	return _property;');
		} else {
			contents.push('	[_property release];');
			contents.push('	return nil;');
		}

		contents.push('}');
		contents.push('');

		contents.push('+ (NSDictionary*) launchUrl {');
		contents.push('    static BOOL launched = NO;');
		contents.push('    if (!launched) {');
		contents.push('        launched = YES;');
		if (this.deployType != 'production' && this.launchUrl) {
			contents.push('        return [NSDictionary dictionaryWithObjectsAndKeys:[TiUtils stringValue:@"' + this.launchUrl + '"], @"application-launch-url", nil];');
		} else {
			contents.push('        return nil;');
		}
		contents.push('    } else { return nil;}');
		contents.push('}');
		contents.push(' ');

		contents.push('@end');
		contents = contents.join('\n');

		if (!exists || fs.readFileSync(dest).toString() != contents) {
			if (!exists) {
				this.logger.info(__('Forcing rebuild: ApplicationDefaults.m does not exist'));
			} else {
				this.logger.info(__('Forcing rebuild: ApplicationDefaults.m has changed since last build'));
			}
			this.forceRebuild = true;
			this.logger.info(__('Writing properties to %s', 'ApplicationDefaults.m'.cyan));
			fs.writeFile(dest, contents, callback);
		} else {
			callback();
		}
	},

	copyModuleResources: function (callback) {
		var counter = 0;
		parallel(this, this.nativeLibModules.map(function (m) {
			return function (next) {
				var src = path.join(m.modulePath, 'assets'),
					dest = path.join(this.xcodeAppDir, 'modules', m.id);
				if (afs.exists(src)) {
					wrench.mkdirSyncRecursive(dest);
					counter++ == 0 && this.logger.info(__('Copying module resources'));
					this.copyDirAsync(src, dest, next);
				} else {
					next();
				}
			};
		}), function () {
			counter || this.logger.info(__('No module resources to copy'));
			callback();
		});
	},

	copyCommonJSModules: function (callback) {
		this.logger.info(this.commonJsModules.length ? __('Copying CommonJS modules') : __('No CommonJS modules to copy'));
		parallel(this, this.commonJsModules.map(function (m) {
			return function (next) {
				// note: during test and production builds, this commonjs file is re-copied and minified and
				// this actual js file is deleted
				var src = path.join(m.modulePath, m.id + '.js');
				afs.exists(src) && afs.copyFileSync(src, this.xcodeAppDir, { logger: this.logger.debug });
				next();
			};
		}), callback);
	},

	copyItunesArtwork: function (callback) {
		// note: iTunesArtwork is a png image WITHOUT the file extension and the
		// purpose of this function is to copy it from the root of the project.
		// The preferred location of this file is <project-dir>/Resources/iphone
		// or <project-dir>/platform/iphone.
		if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
			this.logger.info(__('Copying iTunes artwork'));
			fs.readdirSync(this.projectDir).forEach(function (file) {
				var src = path.join(this.projectDir, file),
					m = file.match(/^iTunesArtwork(@2x)?$/i);
				if (m && fs.statSync(src).isFile()) {
					afs.copyFileSync(src, path.join(this.xcodeAppDir, 'iTunesArtwork' + (m[1] ? m[1].toLowerCase() : '')), {
						logger: this.logger.debug
					});
				}
			}, this);
		}
		callback();
	},

	copyGraphics: function (callback) {
		var paths = [
				path.join(this.projectDir, 'Resources', 'iphone'),
				path.join(this.projectDir, 'Resources', 'ios'),
				path.join(this.titaniumIosSdkPath, 'resources')
			],
			len = paths.length,
			i, src;

		for (i = 0; i < len; i++) {
			if (afs.exists(src = path.join(paths[i], this.tiapp.icon))) {
				afs.copyFileSync(src, this.xcodeAppDir, {
					logger: this.logger.debug
				});
				break;
			}
		}

		callback();
	},

	writeBuildManifest: function (callback) {
		this.cli.createHook('build.ios.writeBuildManifest', this, function (manifest, cb) {
			fs.writeFile(this.buildManifestFile, JSON.stringify(this.buildManifest = manifest, null, '\t'), function () {
				cb();
			});
		})({
			target: this.target,
			deployType: this.deployType,
			deviceFamily: this.deviceFamily,
			developerName: this.certDeveloperName,
			distributionName: this.certDistributionName,
			iosSdkPath: this.titaniumIosSdkPath,
			appGuid: this.tiapp.guid,
			tiCoreHash: this.libTiCoreHash,
			modulesHash: this.modulesHash,
			nativeModulesHash: this.nativeModulesHash,
			gitHash: ti.manifest.githash,
			outputDir: this.cli.argv['output-dir'],
			name: this.tiapp.name,
			id: this.tiapp.id,
			analytics: this.tiapp.analytics,
			publisher: this.tiapp.publisher,
			url: this.tiapp.url,
			version: this.tiapp.version,
			description: this.tiapp.description,
			copyright: this.tiapp.copyright,
			guid: this.tiapp.guid,
			skipJSMinification: !!this.cli.argv['skip-js-minify'],
			forceCopy: !!this.forceCopy,
			forceCopyAll: !!this.forceCopyAll
		}, function (err, results, result) {
			callback();
		});
	},

	compileI18N: function (callback) {
		var data = ti.i18n.load(this.projectDir, this.logger);

		parallel(this,
			Object.keys(data).map(function (lang) {
				return function (done) {
					var contents = [
							'/**',
							' * Appcelerator Titanium',
							' * this is a generated file - DO NOT EDIT',
							' */',
							''
						],
						dir = path.join(this.xcodeAppDir, lang + '.lproj'),
						tasks = [];

					wrench.mkdirSyncRecursive(dir);

					function add(obj, filename, map) {
						obj && tasks.push(function (next) {
							var dest = path.join(dir, filename);
							fs.writeFileSync(dest, contents.concat(Object.keys(obj).map(function (name) {
								return '"' + (map && map[name] || name).replace(/\\"/g, '"').replace(/"/g, '\\"') +
									'" = "' + (''+obj[name]).replace(/%s/g, '%@').replace(/\\"/g, '"').replace(/"/g, '\\"') + '";';
							})).join('\n'));
							if (this.deployType == 'development') {
								next();
							} else {
								exec('/usr/bin/plutil -convert binary1 "' + dest + '"', function (err, stdout, stderr) {
									next();
								});
							}
						});
					}

					add(data[lang].app, 'InfoPlist.strings', { appname: 'CFBundleDisplayName' });
					add(data[lang].strings, 'Localizable.strings');

					parallel(this, tasks, done);
				};
			}, this),
			callback
		);
	},

	copyLocalizedSplashScreens: function () {
		ti.i18n.splashScreens(this.projectDir, this.logger).forEach(function (splashImage) {
			var token = splashImage.split('/'),
				file = token.pop(),
				lang = token.pop(),
				lprojDir = path.join(this.xcodeAppDir, lang + '.lproj'),
				globalFile = path.join(this.xcodeAppDir, file);

			// this would never need to run. But just to be safe
			if (!afs.exists(lprojDir)) {
				this.logger.debug(__('Creating lproj folder %s', lprojDir.cyan));
				wrench.mkdirSyncRecursive(lprojDir);
			}

			// check for it in the root of the xcode build folder
			if (afs.exists(globalFile)) {
				this.logger.debug(__('Removing File %s, as it is being localized', globalFile.cyan));
				fs.unlinkSync(globalFile);
			}

			afs.copyFileSync(splashImage, lprojDir, {
				logger: this.logger.debug
			});
		}, this);
	},

	injectModulesIntoXcodeProject: function (callback) {
		if (this.nativeLibModules.length) {
			var projectFile = path.join(this.buildDir, this.tiapp.name + '.xcodeproj', 'project.pbxproj'),
				projectOrigContents = fs.readFileSync(projectFile).toString(),
				projectContents = projectOrigContents;
				targetLibs = [];

			this.nativeLibModules.forEach(function (lib) {
				projectContents.indexOf(lib.libName) == -1 && targetLibs.push(lib);
			}, this);

			if (targetLibs.length) {
				// we have some libraries to add to the project file
				this.logger.info(__('Injecting native libraries into Xcode project file'));

				var fileMarkers = [],
					fileMarkers2FileRefs = {},
					refMarkers = [],
					frameworkMarkers = [],
					groupMarkers = [],
					groupUUID;

				function makeUUID() {
					return uuid.v4().toUpperCase().replace(/-/g, '').substring(0, 24);
				}

				projectContents.split('\n').forEach(function (line) {
					line.indexOf('/* libTiCore.a */;') != -1 && fileMarkers.push(line);
					line.indexOf('/* libTiCore.a */ =') != -1 && refMarkers.push(line);
					line.indexOf('/* libTiCore.a in Frameworks */,') != -1 && frameworkMarkers.push(line);
					line.indexOf('/* libTiCore.a */,') != -1 && groupMarkers.push(line);
				});

				fileMarkers.forEach(function (marker) {
					var m = marker.match(/([0-9a-zA-Z]+) \/\*/);
					if (m) {
						fileMarkers2FileRefs[m[1].trim()] = makeUUID();
						!groupUUID && (m = marker.match(/fileRef \= ([0-9a-zA-Z]+) /)) && (groupUUID = m[1]);
					}
				});

				targetLibs.forEach(function (lib) {
					var newGroupUUID = makeUUID();

					fileMarkers.forEach(function (marker) {
						var begin = projectContents.indexOf(marker),
							end = begin + marker.length,
							m = marker.match(/([0-9a-zA-Z]+) \/\*/),
							newUUID = makeUUID(),
							line = projectContents
								.substring(begin, end)
								.replace(/libTiCore\.a/g, lib.libName)
								.replace(new RegExp(groupUUID, 'g'), newGroupUUID)
								.replace(new RegExp(m[1].trim(), 'g'), newUUID);
						fileMarkers2FileRefs[m[1].trim()] = newUUID;
						projectContents = projectContents.substring(0, end) + '\n' + line + '\n' + projectContents.substring(end + 1);
					});

					refMarkers.forEach(function (marker) {
						var begin = projectContents.indexOf(marker),
							end = begin + marker.length,
							m = marker.match(/([0-9a-zA-Z]+) \/\*/),
							line = projectContents
								.substring(begin, end)
								.replace(/lib\/libTiCore\.a/g, '"' + lib.libFile.replace(/"/g, '\\"') + '"')
								.replace(/libTiCore\.a/g, lib.libName)
								.replace(/SOURCE_ROOT/g, '"<absolute>"')
								.replace(new RegExp(m[1].trim(), 'g'), newGroupUUID);
						projectContents = projectContents.substring(0, end) + '\n' + line + '\n' + projectContents.substring(end + 1);
					});

					groupMarkers.forEach(function (marker) {
						var begin = projectContents.indexOf(marker),
							end = begin + marker.length,
							line = projectContents
								.substring(begin, end)
								.replace(/libTiCore\.a/g, lib.libName)
								.replace(new RegExp(groupUUID, 'g'), newGroupUUID);
						projectContents = projectContents.substring(0, end) + '\n' + line + '\n' + projectContents.substring(end + 1);
					});

					frameworkMarkers.forEach(function (marker) {
						var begin = projectContents.indexOf(marker),
							end = begin + marker.length,
							m = marker.match(/([0-9a-zA-Z]+) \/\*/),
							line = projectContents
								.substring(begin, end)
								.replace(/libTiCore\.a/g, lib.libName)
								.replace(new RegExp(m[1].trim(), 'g'), fileMarkers2FileRefs[m[1].trim()]);
						projectContents = projectContents.substring(0, end) + '\n' + line + '\n' + projectContents.substring(end + 1);
					});

					(function (libPath) {
						var begin = projectContents.indexOf(libPath),
							end, line;
						while (begin != -1) {
							end = begin + libPath.length;
							line = projectContents.substring(begin, end).replace(libPath, '"\\"' + path.dirname(lib.libFile) + '\\"",');
							projectContents = projectContents.substring(0, end) + '\n                                        ' +  line + '\n' + projectContents.substring(end + 1);
							begin = projectContents.indexOf(libPath, end + line.length);
						}
					}('"\\"$(SRCROOT)/lib\\"",'));
				}, this);

				if (projectContents != projectOrigContents) {
					this.logger.debug(__('Writing %s', projectFile.cyan));
					fs.writeFileSync(projectFile, projectContents);
				}
			}
		}
		callback();
	},

	populateIosFiles: function () {
		var consts = {
				'__PROJECT_NAME__': this.tiapp.name,
				'__PROJECT_ID__': this.tiapp.id,
				'__DEPLOYTYPE__': this.deployType,
				'__APP_ID__': this.tiapp.id,
				'__APP_ANALYTICS__': '' + (this.tiapp.hasOwnProperty('analytics') ? !!this.tiapp.analytics : true),
				'__APP_PUBLISHER__': this.tiapp.publisher,
				'__APP_URL__': this.tiapp.url,
				'__APP_NAME__': this.tiapp.name,
				'__APP_VERSION__': this.tiapp.version,
				'__APP_DESCRIPTION__': this.tiapp.description,
				'__APP_COPYRIGHT__': this.tiapp.copyright,
				'__APP_GUID__': this.tiapp.guid,
				'__APP_RESOURCE_DIR__': ''
			},
			dest,
			variables = {},
			mainContents = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'main.m')).toString().replace(/(__.+__)/g, function (match, key, format) {
				var s = consts.hasOwnProperty(key) ? consts[key] : key;
				return typeof s == 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
			}),
			xcconfigContents = [
				'// this is a generated file - DO NOT EDIT',
				''
			],
			applicationModsContents = [
				'#import "ApplicationMods.h"',
				'',
				'@implementation ApplicationMods',
				'',
				'+ (NSArray*) compiledMods',
				'{',
				'	NSMutableArray *modules = [NSMutableArray array];'
			];

		dest = path.join(this.buildDir, 'main.m');
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != mainContents) {
			this.logger.debug(__('Writing %s', dest.cyan));
			fs.writeFileSync(dest, mainContents);
		}

		if (this.modules.length) {
			// if we have modules, write out a new ApplicationMods.m, otherwise use the default one
			this.modules.forEach(function (m) {
				var moduleId = m.manifest.moduleid.toLowerCase(),
					moduleName = m.manifest.name.toLowerCase(),
					prefix = m.manifest.moduleid.toUpperCase().replace(/\./g, '_');

				[	path.join(m.modulePath, 'module.xcconfig'),
					path.join(this.projectDir, 'modules', 'iphone', moduleName + '.xcconfig')
				].forEach(function (file) {
					if (afs.exists(file)) {
						var xc = new appc.xcconfig(file);
						Object.keys(xc).forEach(function (key) {
							var name = (prefix + '_' + key).replace(/[^\w]/g, '_');
							variables[key] || (variables[key] = []);
							variables[key].push(name);
							xcconfigContents.push((name + '=' + xc[key]).replace(new RegExp('\$\(' + key + '\)', 'g'), '$(' + name + ')'));
						});
					}
				});

				applicationModsContents.push('	[modules addObject:[NSDictionary dictionaryWithObjectsAndKeys:@\"' +
					moduleName + '\",@\"name\",@\"' +
					moduleId + '\",@\"moduleid\",@\"' +
					(m.manifest.version || '') + '\",@\"version\",@\"' +
					(m.manifest.guid || '') + '\",@\"guid\",@\"' +
					(m.manifest.licensekey || '') + '\",@\"licensekey\",nil]];'
				);
			}, this);

			applicationModsContents.push('	return modules;');
			applicationModsContents.push('}\n');
			applicationModsContents.push('@end');
			applicationModsContents = applicationModsContents.join('\n');

			// write the ApplicationMods.m file
			dest = path.join(this.buildDir, 'Classes', 'ApplicationMods.m');
			if (!afs.exists(dest) || fs.readFileSync(dest).toString() != applicationModsContents) {
				this.logger.debug(__('Writing application modules source file: %s', dest.cyan));
				fs.writeFileSync(dest, applicationModsContents);
			} else {
				this.logger.debug(__('Application modules source file already up-to-date: %s', dest.cyan));
			}
		}

		// write the module.xcconfig file
		Object.keys(variables).forEach(function (v) {
			xcconfigContents.push(v + '=$(inherited) ' + variables[v].map(function (x) { return '$(' + x + ') '; }).join(''));
		});
		xcconfigContents = xcconfigContents.join('\n');

		dest = path.join(this.buildDir, 'module.xcconfig');
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != xcconfigContents) {
			this.logger.debug(__('Writing module xcconfig file: %s', dest.cyan));
			fs.writeFileSync(dest, xcconfigContents);
		} else {
			this.logger.debug(__('Module xccconfig file already up-to-date: %s', dest.cyan));
		}
	},

	copyTitaniumLibraries: function (callback) {
		// check to see if the symlink exists and that it points to the right version of the library
		var dir = path.join(this.buildDir, 'lib'),
			dest;

		wrench.mkdirSyncRecursive(dir);

		dest = path.join(dir, 'libTiCore.a');
		if (this.cli.argv['force-copy-all']) {
			afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), dest, { logger: this.logger.debug });
		} else {
			if (!afs.exists(dest) || !fs.lstatSync(dest).isSymbolicLink() || fs.readlinkSync(dest).indexOf(this.titaniumSdkVersion) == -1) {
				try {
					fs.unlinkSync(dest);
				} catch (e) {}
				fs.symlinkSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), dest);
			}
		}

		dest = path.join(dir, 'libtiverify.a');
		afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libtiverify.a'), dest, { logger: this.logger.debug });

		dest = path.join(dir, 'libti_ios_debugger.a');
		afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libti_ios_debugger.a'), dest, { logger: this.logger.debug });

		dest = path.join(dir, 'libti_ios_profiler.a');
		afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libti_ios_profiler.a'), dest, { logger: this.logger.debug });

		callback();
	},

	createSymlinks: function (callback) {
		var ignoreRegExp = /^\.gitignore|\.cvsignore|\.DS_Store|\.git|\.svn|_svn|CVS$/,
			symlinkHook = this.cli.createHook('build.ios.copyResource', this, function (srcFile, destFile, cb) {
				this.logger.debug(__('Symlinking %s => %s', srcFile.cyan, destFile.cyan));
				afs.exists(destFile) && fs.unlinkSync(destFile);
				fs.symlinkSync(srcFile, destFile);
				setTimeout(cb, 1);
			}),
			symlinkResources = function (src, dest, doIgnoreDirs, cb) {
				if (afs.exists(src)) {
					this.logger.debug(__('Walking directory %s', src.cyan));
					wrench.mkdirSyncRecursive(dest);

					series(this, fs.readdirSync(src).map(function (file) {
						return function (next) {
							if ((this.deviceFamily != 'iphone' || ipadSplashImages.indexOf(file) == -1) && !ignoreRegExp.test(file) && (!doIgnoreDirs || ti.availablePlatformsNames.indexOf(file) == -1)) {
								var srcFile = path.join(src, file),
									destFile = path.join(dest, file);
								if (fs.statSync(srcFile).isDirectory()) {
									setTimeout(function () {
										symlinkResources(srcFile, destFile, false, next);
									}, 1);
								} else {
									symlinkHook(srcFile, destFile, next);
								}
							} else {
								next();
							}
						};
					}), cb);
				} else {
					cb();
				}
			}.bind(this),
			destModulesDir = path.join(this.xcodeAppDir, 'modules');

		this.logger.info(__('Creating symlinks for simulator build'));

		series(this, [
			function (next) {
				symlinkResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, true, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'modules', 'ios'), destModulesDir, true, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'modules', 'iphone'), destModulesDir, true, next);
			}
		], function () {
			// reset the application routing
			wrench.mkdirSyncRecursive(path.join(this.buildDir, 'Classes'));
			fs.writeFile(path.join(this.buildDir, 'Classes', 'ApplicationRouting.m'), [
				'/**',
				' * Appcelerator Titanium Mobile',
				' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
				' * Licensed under the terms of the Apache Public License',
				' * Please see the LICENSE included with this distribution for details.',
				' *',
				' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
				' */',
				'',
				'#import <Foundation/Foundation.h>',
				'#import "ApplicationRouting.h"',
				'',
				'extern NSData* filterDataInRange(NSData* thedata, NSRange range);',
				'',
				'@implementation ApplicationRouting',
				'',
				'+ (NSData*) resolveAppAsset:(NSString*)path;',
				'{',
				'	return nil;',
				'}',
				'',
				'@end'
			].join('\n'), callback);
		});
	},

	compileJSS: function (callback) {
		ti.jss.load(path.join(this.projectDir, 'Resources'), deviceFamilyNames[this.deviceFamily], this.logger, function (results) {
			var appStylesheet = path.join(this.xcodeAppDir, 'stylesheet.plist'),
				plist = new appc.plist();
			appc.util.mix(plist, results);
			fs.writeFile(appStylesheet, plist.toString('xml'), function () {
				if (this.target != 'simulator') {
					// compile plist into binary format so it's faster to load, we can be slow on simulator
					exec('/usr/bin/plutil -convert binary1 "' + appStylesheet + '"', callback);
				} else {
					callback();
				}
			}.bind(this));
		}.bind(this));
	},

	invokeXcodeBuild: function (finished) {
		var xcodeArgs = [
				'-target', this.tiapp.name + xcodeTargetSuffixes[this.deviceFamily],
				'-configuration', this.xcodeTarget,
				'-sdk', this.xcodeTargetOS,
				'IPHONEOS_DEPLOYMENT_TARGET=' + appc.version.format(this.minIosVer, 2),
				'TARGETED_DEVICE_FAMILY=' + deviceFamilies[this.deviceFamily],
				'VALID_ARCHS=' + this.architectures
			],
			gccDefs = [ 'DEPLOYTYPE=' + this.deployType ];

		// Note: There is no evidence that TI_DEVELOPMENT, TI_TEST, TI_DEVELOPMENT, or
		//       DEBUGGER_ENABLED are used anymore.

		if (this.target == 'simulator') {
			gccDefs.push('__LOG__ID__=' + this.tiapp.guid);
			gccDefs.push('TI_DEVELOPMENT=1');
			gccDefs.push('DEBUG=1');
			gccDefs.push('TI_VERSION=' + this.titaniumSdkVersion);
		} else if (this.target == 'dist-appstore') {
			gccDefs.push('TI_PRODUCTION=1');
		} else if (this.target == 'dist-adhoc' || this.target == 'device') {
			gccDefs.push('TI_TEST=1');
		}

		if (/simulator|device|dist\-adhoc/.test(this.target)) {
			this.tiapp.ios && this.tiapp.ios.enablecoverage && gccDefs.push('KROLL_COVERAGE=1');
			this.debugHost && gccDefs.push('DEBUGGER_ENABLED=1');
			this.profilerHost && gccDefs.push('PROFILER_ENABLED=1');
		}

		xcodeArgs.push('GCC_PREPROCESSOR_DEFINITIONS=' + gccDefs.join(' '));

		if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
			xcodeArgs.push('PROVISIONING_PROFILE=' + this.provisioningProfileUUID);
			xcodeArgs.push('DEPLOYMENT_POSTPROCESSING=YES');
			if (this.keychain) {
				xcodeArgs.push('OTHER_CODE_SIGN_FLAGS=--keychain ' + this.keychain);
			}
			this.codeSignEntitlements && xcodeArgs.push('CODE_SIGN_ENTITLEMENTS=Entitlements.plist');
		}

		if (this.target == 'device') {
			xcodeArgs.push('CODE_SIGN_IDENTITY=iPhone Developer: ' + this.certDeveloperName);
		}

		if (/dist-appstore|dist\-adhoc/.test(this.target)) {
			xcodeArgs.push('CODE_SIGN_IDENTITY=iPhone Distribution: ' + this.certDistributionName);
		}

		var p = spawn(this.xcodeEnv.xcodebuild, xcodeArgs, {
				cwd: this.buildDir,
				env: {
					DEVELOPER_DIR: this.xcodeEnv.path,
					HOME: process.env.HOME,
					PATH: process.env.PATH,
					TITANIUM_CLI_XCODEBUILD: 'Enjoy hacking? http://jobs.appcelerator.com/'
				}
			}),
			out = [],
			err = [],
			stopOutputting = false;

		p.stdout.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				if (line.length) {
					out.push(line);
					if (line.indexOf('Failed to minify') != -1) {
						stopOutputting = true;
					}
					if (!stopOutputting) {
						this.logger.trace(line);
					}
				}
			}, this);
		}.bind(this));

		p.stderr.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				if (line.length) {
					err.push(line);
				}
			}, this);
		}.bind(this));

		p.on('exit', function (code, signal) {
			if (code) {
				// first see if we errored due to a dependency issue
				if (err.join('\n').indexOf('Check dependencies') != -1) {
					var len = out.length;
					for (var i = len - 1; i >= 0; i--) {
						if (out[i].indexOf('Check dependencies') != -1) {
							if (out[out.length - 1].indexOf('Command /bin/sh failed with exit code') != -1) {
								len--;
							}
							for (var j = i + 1; j < len; j++) {
								this.logger.error('Error details: ' + out[j]);
							}
							this.logger.log();
							process.exit(1);
						}
					}
				}

				// next see if it was a minification issue
				var len = out.length;
				for (var i = len - 1, k = 0; i >= 0 && k < 10; i--, k++) {
					if (out[i].indexOf('Failed to minify') != -1) {
						if (out[out.length - 1].indexOf('Command /bin/sh failed with exit code') != -1) {
							len--;
						}
						while (i < len) {
							this.logger.log(out[i++]);
						}
						this.logger.log();
						process.exit(1);
					}
				}

				// just print the entire error buffer
				err.forEach(function (line) {
					this.logger.error(line);
				}, this);
				this.logger.log();
				process.exit(1);
			}

			if (!this.cli.argv['build-only']) {
				var delta = appc.time.prettyDiff(this.cli.startTime, Date.now());
				this.logger.info(__('Finished building the application in %s', delta));
			}

			// end of the line
			finished.call(this, code);
		}.bind(this));
	},

	compileResources: function (src, dest, callback) {
		if ((this.target != 'simulator' || this.deployType != 'development') && afs.exists(src)) {
			var compiledTargets = {},
				ignoreRegExp = /^\.gitignore|\.cvsignore|\.DS_Store|\.git|\.svn|_svn|CVS$/,
				recursivelyCopy = function (from, to, rel, ignore, done) {
					wrench.mkdirSyncRecursive(to);
					series(this, fs.readdirSync(from).map(function (file) {
						return function (next) {
							var f = path.join(from, file),
								t = f.replace(from, to),
								fstat = fs.statSync(f),
								p = rel ? rel + '/' + file : file;
							if (ignoreRegExp.test(file) || (ignore && ignore.indexOf(file) != -1)) {
								this.logger.debug(__('Ignoring %s', f.cyan));
							} else if (fstat.isDirectory()) {
								recursivelyCopy(f, t, p, null, next);
								return;
							} else if (!/\.jss$/.test(file)) {
								var m = file.match(/\.(html|css|js)$/)
								if (m) {
									compiledTargets[m[1]] || (compiledTargets[m[1]] = []);
									compiledTargets[m[1]].push({
										path: p,
										from: f,
										to: t
									});
								}
								// only copy the file for test/production and if it's not a js file, otherwise
								// it will get compiled below
								if ((this.deviceFamily != 'iphone' || ipadSplashImages.indexOf(file) == -1) && ((this.deployType == 'development' || !m || !/css|js/.test(m[1])) && (!afs.exists(t) || fstat.size != fs.statSync(t).size))) {
									this.cli.createHook('build.ios.copyResource', this, function (srcFile, destFile, cb) {
										afs.copyFileSync(srcFile, destFile, { logger: this.logger.debug });
										setTimeout(cb, 0);
									})(f, t, function () {
										next();
									});
									return;
								}
							}
							setTimeout(next, 0);
						}.bind(this);
					}.bind(this)), done);
				}.bind(this);

			recursivelyCopy(src, dest, null, ti.availablePlatformsNames, function () {
				/*
				The following code scans all html files for script tags referencing app:// js files, however in
				production/test, we actually want this files minified and prepared. In development builds, we
				don't care if it's minified and we don't want to prepare the file anyways.

				So, long story short, I don't think we need the following code, but I'm gonna keep it around for
				a bit since it took me a while to code.

				if (compiledTargets.html) {
					var compiled = [];

					compiledTargets.html.forEach(function (target) {
						if (compiledTargets.js) {
							var dom = new DOMParser().parseFromString(fs.readFileSync(target.from).toString(), 'text/html'),
								doc = dom && dom.documentElement,
								scripts = doc && doc.getElementsByTagName('script'),
								i, j, len, m, src;

							if (scripts) {
								for (i = 0, len = scripts.length; i < len; i++) {
									src = scripts[i].getAttribute('src');
									m = src && src.match(/^app\:\/\/(.+)/);
									if (m) {
										src = path.join(path.dirname(target.from), m[1]);
										for (j = 0; j < compiledTargets.js.length; j++) {
											if (compiledTargets.js[j].from == src) {
												this.logger.debug(__('Minifying app:// JavaScript file: %s', src.cyan));
												compiled.push(compiledTargets.js[j]);
												compiledTargets.js.splice(j, 1);
												break;
											}
										}
									}
								}
							}
						}
						afs.copyFileSync(target.from, target.to, { logger: this.logger.debug });
					}, this);

					compiled.forEach(function (c) {
						this.logger.debug(__('Writing minifying JavaScript file: %s', c.to.cyan));
						fs.writeFileSync(
							c.to,
							UglifyJS.minify(c.from).code.replace(/Titanium\./g,'Ti.')
						);
					}, this);
				}
				*/

				// minify css files
				compiledTargets.css && compiledTargets.css.forEach(function (file) {
					// TODO: add hook!
					if (this.deployType == 'development') {
						afs.copyFileSync(file.from, file.to, { logger: this.logger.debug });
					} else {
						this.logger.debug(__('Writing minified CSS file: %s', file.to.cyan));
						fs.writeFileSync(file.to, cleanCSS.process(fs.readFileSync(file.from).toString()));
					}
				}, this);

				// minify js files
				if (compiledTargets.js) {
					series(this, compiledTargets.js.map(function (compileTarget) {
						return function (cb) {
							this.cli.createHook('build.ios.compileJsFile', this, function (target, cb2) {
								var id = target.path.replace(/\./g, '_');
								this.compileJsFile(id, target.from);
								this.jsFilesToPrepare.push(id);
								setTimeout(cb2, 0);
							})(compileTarget, function () {
								cb();
							});
						};
					}), function () {
						callback();
					});
				} else {
					callback();
				}
			});
		} else {
			callback();
		}
	},

	findSymbols: function (ast) {
		var walker = new UglifyJS.TreeWalker(function (node, descend) {
				if (node instanceof UglifyJS.AST_SymbolRef && node.name == 'Ti') {
					var p = walker.stack,
						buffer = [],
						i = p.length - 1; // we already know the top of the stack is Ti

					// loop until 2nd from bottom of stack since the bottom is the toplevel node which we don't care about
					while (--i) {
						if (p[i] instanceof UglifyJS.AST_Dot) {
							buffer.push(p[i].property);
						} else if (p[i] instanceof UglifyJS.AST_Symbol || p[i] instanceof UglifyJS.AST_SymbolRef) {
							buffer.push(p[i].name);
						} else {
							break;
						}
					}
					buffer.length && this.addSymbol(buffer.join('.'));
				}
			}.bind(this));

		ast.walk(walker);
	},

	addSymbol: function (symbol) {
		var tokens = symbol.split('.'),
			current = '',
			s = tokens[0].toLowerCase();

		this.tiModules.indexOf(s) == -1 && this.tiModules.push(s);

		tokens.forEach(function (t) {
			current += t + '.';
			var s = 'USE_TI_' + current.replace(/\.create/g, '').replace(/\./g, '').replace(/\-/g, '_').toUpperCase();
			if (this.symbols.indexOf(s) == -1) {
				this.logger.debug(__('Found symbol %s', s));
				this.symbols.push(s);
			}
		}, this);
	},

	compileJsFile: function (id, file) {
		var original = fs.readFileSync(file).toString(),
			contents = original.replace(/Titanium\./g, 'Ti.'),
			ast;

		try {
			ast = UglifyJS.parse(contents, { filename: file });
		} catch (ex) {
			this.logger.error(__('Failed to minify %s', file));
			if (ex.line) {
				this.logger.error(__('%s [line %s, column %s]', ex.message, ex.line, ex.col));
			} else {
				this.logger.error(__('%s', ex.message));
			}
			try {
				original = original.split('\n');
				if (ex.line && ex.line <= original.length) {
					this.logger.error('');
					this.logger.error('    ' + original[ex.line-1]);
					if (ex.col) {
						var i = 0,
							len = ex.col,
							buffer = '    ';
						for (; i < len; i++) {
							buffer += '-';
						}
						this.logger.error(buffer + '^');
					}
					this.logger.error('');
				}
			} catch (ex2) {}
			process.exit(1);
		}

		this.logger.info(__('Finding Titanium symbols in file %s', file.cyan));
		this.findSymbols(ast);

		if (!this.cli.argv['skip-js-minify'] && this.deployType != 'development') {
			ast.figure_out_scope();
			ast = ast.transform(UglifyJS.Compressor());
			ast.figure_out_scope();
			ast.compute_char_frequency();
			ast.mangle_names();
			var stream = UglifyJS.OutputStream();
			ast.print(stream);
			contents = stream.toString();
		}

		id = path.join(this.assetsDir, id);
		wrench.mkdirSyncRecursive(path.dirname(id));

		this.logger.debug(__('Writing JavaScript file: %s', id.cyan));
		fs.writeFileSync(id, contents);
	},

	xcodePrecompilePhase: function (finished) {
		this.tiModules = [];
		this.symbols = ['USE_TI_ANALYTICS', 'USE_TI_NETWORK', 'USE_TI_PLATFORM', 'USE_TI_UI', 'USE_TI_API'];
		this.jsFilesToPrepare = [];

		parallel(this, [
			'compileJSS',
			'compileI18N',
			function (next) {
				if (this.deployType != 'production' && !process.env.TITANIUM_CLI_XCODEBUILD) {
					var appDefaultsFile = path.join(this.buildDir, 'Classes', 'ApplicationDefaults.m');
					fs.writeFileSync(appDefaultsFile, fs.readFileSync(appDefaultsFile).toString().replace(/return \[NSDictionary dictionaryWithObjectsAndKeys\:\[TiUtils stringValue\:@".+"\], @"application-launch-url", nil];/, 'return nil;'));
				}
				next();
			},
			function (next) {
				this.compileResources(path.join(this.projectDir, 'Resources', 'ios'), this.xcodeAppDir, next);
			},
			function (next) {
				this.compileResources(path.join(this.projectDir, 'Resources', 'iphone'), this.xcodeAppDir, next);
			},
			function (next) {
				this.compileResources(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir, next);
			},
			function (next) {
				this.compileResources(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir, next);
			},
			function (next) {
				this.detectModules(function () {
					// copy module assets and find all Titanium symbols used by modules
					series(this, this.modules.map(function (m) {
						return function (cb) {
							var file = path.join(m.modulePath, 'metadata.json');
							if (afs.exists(file)) {
								try {
									var metadata = JSON.parse(fs.readFileSync(file));
									metadata && Array.isArray(metadata.exports) && metadata.exports.forEach(this.addSymbol, this);
								} catch (e) {}
							}

							var assets = path.join(m.modulePath, 'assets');
							if (afs.exists(assets)) {
								this.compileResources(assets, path.join(this.xcodeAppDir, 'modules', m.id.toLowerCase()), cb);
							} else {
								cb();
							}
						};
					}), function () {
						next();
					});
				}.bind(this));
			},
			function (next) {
				['debugger.plist', 'profiler.plist'].forEach(function (filename) {
					var src = path.join(this.buildDir, filename),
						dest = path.join(this.xcodeAppDir, filename);

					// we only copy the plist file for dev/test when building from Studio (via the Ti CLI), otherwise make sure the file doesn't exist
					if (this.deployType != 'production' && process.env.TITANIUM_CLI_XCODEBUILD) {
						afs.copyFileSync(
							src,
							dest,
							{ logger: this.logger.debug }
						);
					} else if (afs.exists(dest)) {
						this.logger.info(__('Removing unwanted %s from build', filename.cyan));
						fs.unlinkSync(dest);
					}
				}, this);

				next();
			}
		], function () {
			// localize the splash screen after the resources files have been copied
			this.copyLocalizedSplashScreens();

			// if development and the simulator, then we're symlinking files and there's no need to anything below
			if (this.deployType == 'development' && this.target == 'simulator' && !this.forceCopy) {
				return finished.call(this);
			}

			series(this, [
				function (next) {
					// copy, analyze, and minify resources
					this.compileResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, next);
				},
				function (next) {
					// for each module, copying modules images, if any
					if (this.tiModules.length) {
						this.logger.info(__('Processing module images'));
						series(this, this.tiModules.map(function (name) {
							return function (cb) {
								this.compileResources(path.join(this.titaniumIosSdkPath, 'modules', name, 'images'), path.join(this.xcodeAppDir, 'modules', name, 'images'), cb);
							};
						}), next);
					} else {
						next();
					}
				},
				function (next) {
					// if development, then we stop here
					if (this.deployType == 'development') {
						return next();
					}

					this.commonJsModules.forEach(function (m) {
						var file = path.join(m.modulePath, m.id + '.js');
						if (afs.exists(file)) {
							var id = m.id.replace(/\./g, '_') + '_js';
							this.compileJsFile(id, file);
							this.jsFilesToPrepare.push(id);
						}

						// remove this module's js file that was copied by the copyCommonJSModules() function
						file = path.join(this.xcodeAppDir, m.id + '.js');
						if (afs.exists(file)) {
							this.logger.debug(__('Removing %s', file.cyan));
							fs.unlinkSync(file);
						}
					}, this);

					this.cli.fireHook('build.ios.prerouting', this, function (err) {
						var args = [path.join(this.titaniumIosSdkPath, 'titanium_prep'), this.tiapp.id, this.assetsDir],
							out = [],
							child;

						this.logger.info(__('Running titanium_prep: %s', args.join(' ').cyan));
						this.jsFilesToPrepare.forEach(function (file) {
							this.logger.debug(__('Preparing %s', file.cyan));
						}, this);

						child = spawn(args.shift(), args);
						child.stdin.write(this.jsFilesToPrepare.join('\n'));
						child.stdin.end();
						child.stdout.on('data', function (data) {
							out.push(data.toString());
						});
						child.stderr.on('data', function (data) {
							out.push(data.toString());
						});
						child.on('exit', function (code) {
							if (code) {
								this.logger.error(__('Failed during titanium_prep') + '\n');
								process.exit(1);
							}

							var dest = path.join(this.buildDir, 'Classes', 'ApplicationRouting.h'),
								contents = [
									'/**',
									' * Appcelerator Titanium Mobile',
									' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
									' * Licensed under the terms of the Apache Public License',
									' * Please see the LICENSE included with this distribution for details.',
									' *',
									' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
									' */',
									'',
									'#import <Foundation/Foundation.h>',
									'',
									'@interface ApplicationRouting : NSObject {',
									'',
									'}',
									'+ (NSData*) resolveAppAsset:(NSString*)path;',
									'',
									'@end'
								].join('\n');

							if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
								this.logger.debug(__('Writing application routing header: %s', dest.cyan));
								fs.writeFileSync(dest, contents);
							} else {
								this.logger.debug(__('Application routing header already up-to-date: %s', dest.cyan));
							}

							dest = path.join(this.buildDir, 'Classes', 'ApplicationRouting.m');
							contents = [
								'/**',
								' * Appcelerator Titanium Mobile',
								' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
								' * Licensed under the terms of the Apache Public License',
								' * Please see the LICENSE included with this distribution for details.',
								' *',
								' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
								' */',
								'',
								'#import <Foundation/Foundation.h>',
								'#import "ApplicationRouting.h"',
								'',
								'extern NSData* filterDataInRange(NSData* thedata, NSRange range);',
								'',
								'@implementation ApplicationRouting',
								'',
								'+ (NSData*) resolveAppAsset:(NSString*)path;',
								'{',
									out.join(''),
								'	NSNumber *index = [map objectForKey:path];',
								'	if (index == nil) { return nil; }',
								'	return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);',
								'}',
								'',
								'@end'
							].join('\n');

							if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
								this.logger.debug(__('Writing application routing source file: %s', dest.cyan));
								fs.writeFileSync(dest, contents);
							} else {
								this.logger.debug(__('Application routing source file already up-to-date: %s', dest.cyan));
							}

							next();
						}.bind(this));
					}.bind(this));
				}
			], function () {
				// if we're in development mode, do not optimize images or optimize the defines.h
				if (this.deployType == 'development') {
					return finished.call(this);
				}

				parallel(this, [
					function (next) {
						// optimizing images
						var tool = path.join(this.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'iphoneos-optimize');
						if (afs.exists(tool)) {
							this.logger.info(__('Optimizing all images in %s', this.xcodeAppDir.cyan));
							exec(tool + ' ' + this.xcodeAppDir, function (err, stdout, stderr) {
								// remove empty directories
								this.logger.info(__('Removing empty directories'));
								exec('find . -type d -empty -delete', {
									cwd: this.xcodeAppDir
								}, function (err, stdout, stderr) {
									next();
								});
							}.bind(this));
						} else {
							this.logger.warn(__('Unable to find iphoneos-optimize, skipping image optimization'));
							next();
						}
					},
					function (next) {
						// build the defines.h file
						var dest = path.join(this.buildDir, 'Classes', 'defines.h'),
							contents = [
								'// Warning: this is generated file. Do not modify!',
								'',
								'#define TI_VERSION ' + this.titaniumSdkVersion
							];

						contents = contents.concat(this.symbols.sort().map(function (s) {
							return '#define ' + s;
						}));
						contents.push('#ifdef USE_TI_UILISTVIEW',
							'#define USE_TI_UILABEL',
							'#define USE_TI_UIBUTTON',
							'#define USE_TI_UIIMAGEVIEW',
							'#define USE_TI_UIPROGRESSBAR',
							'#define USE_TI_UIACTIVITYINDICATOR',
							'#define USE_TI_UISWITCH',
							'#define USE_TI_UISLIDER',
							'#define USE_TI_UITEXTFIELD',
							'#define USE_TI_UITEXTAREA',
							'#endif');
						contents = contents.join('\n');

						if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
							this.logger.debug(__('Writing Titanium symbol file: %s', dest.cyan));
							fs.writeFileSync(dest, contents);
						} else {
							this.logger.debug(__('Titanium symbol file already up-to-date: %s', dest.cyan));
						}

						next();
					}
				], finished.bind(this));
			});
		});
	}

};
