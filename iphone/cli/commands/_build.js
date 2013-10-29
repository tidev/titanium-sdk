/**
 * iOS build command.
 *
 * @module cli/_build
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * @requires clean-css
 * @requires humanize
 * @requires node-appc
 * @requires node-uuid
 * @requires titanium-sdk
 * @requires uglify-js
 * @requires wrench
 * @requires xmldom
 */

var appc = require('node-appc'),
	async = require('async'),
	Builder = require('titanium-sdk/lib/builder'),
	cleanCSS = require('clean-css'),
	crypto = require('crypto'),
	detect = require('../lib/detect').detect,
	DOMParser = require('xmldom').DOMParser,
	ejs = require('ejs'),
	fs = require('fs'),
	humanize = require('humanize'),
	jsanalyze = require('titanium-sdk/lib/jsanalyze'),
	path = require('path'),
	spawn = require('child_process').spawn,
	ti = require('titanium-sdk'),
	UglifyJS = require('uglify-js'),
	util = require('util'),
	uuid = require('node-uuid'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__,

	afs = appc.fs,
	parallel = appc.async.parallel,
	series = appc.async.series,
	version = appc.version,

	iosEnv,
	devNameIdRegExp = /\([0-9A-Za-z]*\)$/;

// silence uglify's default warn mechanism
UglifyJS.AST_Node.warn_function = function () {};

function iOSBuilder() {
	Builder.apply(this, arguments);

	this.minSupportedIosSdk = parseInt(version.parseMin(this.packageJson.vendorDependencies['ios sdk']));
	this.maxSupportedIosSdk = parseInt(version.parseMax(this.packageJson.vendorDependencies['ios sdk']));

	this.deployTypes = {
		'simulator': 'development',
		'device': 'test',
		'dist-appstore': 'production',
		'dist-adhoc': 'production'
	};

	this.targets = ['simulator', 'device', 'dist-appstore', 'dist-adhoc'];

	this.deviceFamilies = {
		iphone: '1',
		ipad: '2',
		universal: '1,2'
	};

	this.deviceFamilyNames = {
		iphone: ['ios', 'iphone'],
		ipad: ['ios', 'ipad'],
		universal: ['ios', 'iphone', 'ipad']
	};

	this.xcodeTargetSuffixes = {
		iphone: '',
		ipad: '-iPad',
		universal: '-universal'
	};

	this.simTypes = {
		iphone: 'iPhone',
		ipad: 'iPad'
	};

	this.blacklistDirectories = [
		'contents',
		'resources'
	];

	this.graylistDirectories = [
		'frameworks',
		'plugins'
	];

	this.ipadSplashImages = [
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
}

util.inherits(iOSBuilder, Builder);

/**
 * Returns iOS build-specific configuration options.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 * @returns {Function|undefined} A function that returns the config info or undefined
 */
iOSBuilder.prototype.config = function config(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);

	var _t = this;

	this.ignoreDirs = new RegExp(config.get('cli.ignoreDirs'));
	this.ignoreFiles = new RegExp(config.get('cli.ignoreFiles'));

	return function (done) {
		detect(config, { minSDK: _t.minSupportedIosSdk }, function (env) {
			iosEnv = env || {};

			var sdks = {},
				sims = {},
				defaultSdk,
				conf,
				devName,
				lowerCasedDevNames = [],
				lowerCasedDistNames = [],
				libTiCoreSize = humanize.filesize(fs.statSync(afs.resolvePath(__dirname, '..', '..', 'libTiCore.a')).size, 1024, 1).toUpperCase();

			iosEnv.certs.devNames = [];
			iosEnv.certs.distNames = [];

			// build the list of dev and dist cert names
			Object.keys(iosEnv.certs.keychains).forEach(function (keychain) {
				iosEnv.certs.keychains[keychain].developer && iosEnv.certs.keychains[keychain].developer.forEach(function (dev) {
					iosEnv.certs.devNames.push(dev.name);
					lowerCasedDevNames.push(dev.name.toLowerCase());
				});

				iosEnv.certs.keychains[keychain].distribution && iosEnv.certs.keychains[keychain].distribution.forEach(function (dist) {
					iosEnv.certs.distNames.push(dist.name);
					lowerCasedDistNames.push(dist.name.toLowerCase());
				});
			});

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
						'sim-64bit': {
							desc: __('in combination with %s flag & %s flag, start the 64-bit tall version of the retina simulator', '--retina'.cyan, '--tall'.cyan),
							hidden: version.lte(ti.manifest.version, '3.1.2')
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
/*						'device-id': {
							abbr: 'C',
							desc: __('the name for the device or iOS simulator to install the application to'),
							hint: __('name'),
							order: 130,
							prompt: function (callback) {
								callback();
							},
							required: true,
							validate: function (device, callback) {
								callback(null, device);
							},
							verifyIfRequired: function (callback) {
								callback(true);
							}
						},
*/						'launch-url': {
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
							values: Object.keys(_t.deviceFamilies)
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
							values: Object.keys(_t.simTypes)
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
							values: _t.targets
						}
					}
				});
			})(function (err, results, result) {
				done(conf = result);
			});
		});
	};
};

iOSBuilder.prototype.validate = function (logger, config, cli) {
	var sdks = {},
		sims = {};

	this.target = cli.argv.target;

	if (!cli.argv.xcode || !process.env.TITANIUM_CLI_XCODEBUILD) {
		// make sure the app doesn't have any blacklisted directories in the Resources directory and warn about graylisted names
		var resourcesDir = path.join(cli.argv['project-dir'], 'Resources');
		if (fs.existsSync(resourcesDir)) {
			fs.readdirSync(resourcesDir).forEach(function (filename) {
				var lcaseFilename = filename.toLowerCase(),
					isDir = fs.statSync(path.join(resourcesDir, filename)).isDirectory();

				if (this.blacklistDirectories.indexOf(lcaseFilename) != -1) {
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
				} else if (this.graylistDirectories.indexOf(lcaseFilename) != -1) {
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
			}, this);
		}
	}

	// at this point we've validated everything except underscores in the app id
	if (!config.get('ios.skipAppIdValidation')) {
		if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(cli.tiapp.id)) {
			logger.error(__('tiapp.xml contains an invalid app id "%s"', cli.tiapp.id));
			logger.error(__('The app id must consist only of letters, numbers, dashes, and underscores.'));
			logger.error(__('Note: iOS does not allow underscores.'));
			logger.error(__('The first character must be a letter or underscore.'));
			logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
			process.exit(1);
		}

		if (cli.tiapp.id.indexOf('_') != -1) {
			logger.error(__('tiapp.xml contains an invalid app id "%s"', cli.tiapp.id));
			logger.error(__('The app id must consist of letters, numbers, and dashes.'));
			logger.error(__('The first character must be a letter.'));
			logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
			process.exit(1);
		}
	}

	if (!Object.keys(iosEnv.xcode).length) {
		logger.error(__('Unable to find Xcode') + '\n');
		logger.error(__('Please download and install Xcode, then try again') + '\n');
		process.exit(1);
	}

	if (!Object.keys(iosEnv.xcode).some(function (ver) { return iosEnv.xcode[ver].selected; })) {
		logger.error(__('No Xcode version is currently selected') + '\n');
		logger.error(__("Use 'xcode-select' to select one of the Xcode versions:"));
		Object.keys(iosEnv.xcode).forEach(function (ver) {
			if (ver != '__selected__') {
				logger.log('\n' + ('    sudo xcode-select -switch ' + iosEnv.xcode[ver].path).cyan);
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
		logger.error(__('Please download and install an iOS SDK (version %s or newer)', version.format(this.minSupportedIosSdk, 2)) + '\n');
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
				if (fs.existsSync(buildManifestFile)) {
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

	if (this.targets.indexOf(cli.argv.target) == -1) {
		logger.error(__('Invalid target "%s"', cli.argv.target) + '\n');
		appc.string.suggest(cli.argv.target, this.targets, logger.log, 3);
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
		if (keychain && !fs.existsSync(keychain)) {
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
		if (!fs.existsSync(cli.argv['output-dir'])) {
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

	if (!this.deviceFamilies[deviceFamily]) {
		logger.error(__('Invalid device family "%s"', deviceFamily) + '\n');
		appc.string.suggest(deviceFamily, Object.keys(this.deviceFamilies), logger.log, 3);
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

	if (cli.argv.target != 'dist-appstore') {
		['debug', 'profiler'].forEach(function (type) {
			if (cli.argv[type + '-host']) {
				if (typeof cli.argv[type + '-host'] == 'number') {
					logger.error(__('Invalid %s host "%s"', type, cli.argv[type + '-host']) + '\n');
					logger.log(__('The %s host must be in the format "host:port".', type) + '\n');
					process.exit(1);
				}

				var parts = cli.argv[type + '-host'].split(':');

				if ((cli.argv.target == 'simulator' && parts.length < 2) || (cli.argv.target != 'simulator' && parts.length < 4)) {
					logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
					if (cli.argv.target == 'simulator') {
						logger.log(__('The %s host must be in the format "host:port".', type) + '\n');
					} else {
						logger.log(__('The %s host must be in the format "host:port:airkey:hosts".', type) + '\n');
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
	}
};

iOSBuilder.prototype.run = function (logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	// force the platform to "ios" just in case it was "iphone" so that plugins can reference it
	cli.argv.platform = 'ios';

	// if in the xcode phase, bypass the pre, post, and finalize hooks for xcode builds
	if (cli.argv.xcode) {
		appc.async.series(this, [
			'initialize',
			'loginfo',
			'xcodePrecompilePhase'
		], function () {
			finished();
		});
		return;
	}

	appc.async.series(this, [
		function (next) {
			cli.emit('build.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',
		'loginfo',

		//'readBuildManifest',
		//'checkIfNeedToRecompile',
		//'getLastBuildState',

		'preparePhase',

		function (next) {
			cli.emit('build.pre.compile', this, next);
		},

		function (next) {
			// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
			// Alloy generate an app.js, it may not have existed during validate(), but should exist now
			// that build.pre.compile was fired.
			ti.validateAppJsExists(this.projectDir, this.logger, ['iphone', 'ios']);
			next();
		},

		'createInfoPlist',
		'createEntitlementsPlist',
		'detectModules',
		'initBuildDir',
		'createSymlinks',
		'createDebuggerPlist',
		'createProfilerPlist',
		'injectModulesIntoXcodeProject',
		'injectApplicationDefaults', // if ApplicationDefaults.m was modified, forceRebuild will be set to true
		'copyTitaniumLibraries',
		'copyModuleResources',
		'copyCommonJSModules',
		'copyItunesArtwork',
		'copyGraphics',
		'writeBuildManifest',

		function (next) {
			// this is a hack... for non-deployment builds we need to force xcode so that the pre-compile phase
			// is run and the ApplicationRouting.m gets updated
			if (!this.forceRebuild && this.deployType != 'development') {
				this.logger.info(__('Forcing rebuild: deploy type is %s, so need to recompile ApplicationRouting.m', this.deployType));
				this.forceRebuild = true;
			}

			if (this.forceRebuild || this.target != 'simulator' || !fs.existsSync(this.xcodeAppDir, this.tiapp.name)) {
				this.logger.info(__('Invoking xcodebuild'));
				this.xcodePrecompilePhase(function () {
					this.invokeXcodeBuild(next);
				}.bind(this));
			} else {
				this.logger.info(__('Skipping xcodebuild'));
				next();
			}
		},

		function (next) {
			if (!this.buildOnly) {
				var delta = appc.time.prettyDiff(this.cli.startTime, Date.now());
				this.logger.info(__('Finished building the application in %s', delta.cyan));
			}

			cli.emit('build.post.compile', this, next);
		}
	], function (err) {
		cli.emit('build.finalize', this, function () {
			finished(err);
		});
	});
};

iOSBuilder.prototype.doAnalytics = function doAnalytics(next) {
	var cli = this.cli,
		eventName = cli.argv['device-family'] + '.' + cli.argv.target;

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

	next();
};

iOSBuilder.prototype.initialize = function initialize(next) {
	var argv = this.cli.argv;

	this.titaniumIosSdkPath = afs.resolvePath(__dirname, '..', '..');
	this.titaniumSdkVersion = path.basename(path.join(this.titaniumIosSdkPath, '..'));

	this.templatesDir = path.join(this.titaniumIosSdkPath, 'templates', 'build');

	this.platformName = path.basename(this.titaniumIosSdkPath); // the name of the actual platform directory which will some day be "ios"

	this.assetsDir = path.join(this.buildDir, 'assets');
	this.provisioningProfileUUID = argv['pp-uuid'];

	this.moduleSearchPaths = [ this.projectDir, afs.resolvePath(this.titaniumIosSdkPath, '..', '..', '..', '..') ];
	if (this.config.paths && Array.isArray(this.config.paths.modules)) {
		this.moduleSearchPaths = this.moduleSearchPaths.concat(this.config.paths.modules);
	}

	this.debugHost = argv['debug-host'];
	this.profilerHost = argv['profiler-host'];
	this.launchUrl = argv['launch-url'];
	this.keychain = argv.keychain;

	if (argv.xcode) {
		this.deployType = argv['deploy-type'];
	} else {
		this.deployType = /^device|simulator$/.test(this.target) && argv['deploy-type'] ? argv['deploy-type'] : this.deployTypes[this.target];
	}
	this.xcodeTarget = process.env.CONFIGURATION || (/^device|simulator$/.test(this.target) ? 'Debug' : 'Release');
	this.iosSdkVersion = argv['ios-version'];
	this.iosSimVersion = argv['sim-version'];
	this.iosSimType = argv['sim-type'];
	this.deviceFamily = argv['device-family'];
	this.xcodeTargetOS = (this.target == 'simulator' ? 'iphonesimulator' : 'iphoneos') + version.format(this.iosSdkVersion, 2, 2);
	this.iosBuildDir = path.join(this.buildDir, 'build', this.xcodeTarget + '-' + (this.target == 'simulator' ? 'iphonesimulator' : 'iphoneos'));
	this.xcodeAppDir = argv.xcode ? path.join(process.env.TARGET_BUILD_DIR, process.env.CONTENTS_FOLDER_PATH) : path.join(this.iosBuildDir, this.tiapp.name + '.app');
	this.xcodeProjectConfigFile = path.join(this.buildDir, 'project.xcconfig');

	this.certDeveloperName = argv['developer-name'];
	this.certDistributionName = argv['distribution-name'];

	this.forceCopy = !!argv['force-copy'];
	this.forceCopyAll = !!argv['force-copy-all'];

	this.forceRebuild = false;

	// the ios sdk version is not in the selected xcode version, need to find the version that does have it
	Object.keys(iosEnv.xcode).forEach(function (sdk) {
		if (sdk != '__selected__' && (!this.xcodeEnv || iosEnv.xcode[sdk].selected) && iosEnv.xcode[sdk].sdks.some(function (ver) { return version.eq(ver, this.iosSdkVersion); }, this)) {
			this.xcodeEnv = iosEnv.xcode[sdk];
		}
	}, this);

	// make sure we have an icon
	if (!this.tiapp.icon || !['Resources', 'Resources/iphone', 'Resources/ios'].some(function (p) {
			return fs.existsSync(this.projectDir, p, this.tiapp.icon);
		}, this)) {
		this.tiapp.icon = 'appicon.png';
	}

	Array.isArray(this.tiapp.modules) || (this.tiapp.modules = []);

	this.architectures = 'armv6 armv7 i386';
	// no armv6 support above 4.3 or with 6.0+ SDK
	if (version.gte(this.iosSdkVersion, '6.0')) {
		this.architectures = 'armv7 armv7s i386';
	} else if (version.gte(this.minIosVer, '4.3')) {
		this.architectures = 'armv7 i386';
	}

	next();
};

iOSBuilder.prototype.loginfo = function loginfo(next) {
	this.logger.debug(__('Titanium SDK iOS directory: %s', this.platformPath.cyan));
	this.logger.info(__('Deploy type: %s', this.deployType.cyan));
	this.logger.info(__('Building for target: %s', this.target.cyan));
	this.logger.info(__('Building using iOS SDK: %s', version.format(this.iosSdkVersion, 2).cyan));
	if (this.target == 'simulator') {
		this.logger.info(__('Building for iOS %s Simulator: %s', this.simTypes[this.iosSimType], this.iosSimVersion.cyan));
	}
	this.logger.info(__('Building for device family: %s', this.deviceFamily.cyan));
	this.logger.debug(__('Setting Xcode target to %s', this.xcodeTarget.cyan));
	this.logger.debug(__('Setting Xcode build OS to %s', this.xcodeTargetOS.cyan));
	this.logger.debug(__('Xcode installation: %s', this.xcodeEnv.path.cyan));
	this.logger.debug(__('iOS WWDR certificate: %s', iosEnv.certs.wwdr ? __('installed').cyan : __('not found').cyan));
	this.logger.debug(__('Building for the following architectures: %s', this.architectures.cyan));
	if (this.target == 'device') {
		this.logger.info(__('iOS Development Certificate: %s', this.certDeveloperName.cyan));
	} else if (/^dist-appstore|dist\-adhoc$/.test(this.target)) {
		this.logger.info(__('iOS Distribution Certificate: %s', this.certDistributionName.cyan));
	}

	// validate the min-ios-ver from the tiapp.xml
	this.minIosVer = this.tiapp.ios && this.tiapp.ios['min-ios-ver'] || this.minSupportedIosSdk;
	if (version.gte(this.iosSdkVersion, '6.0') && version.lt(this.minIosVer, this.minSupportedIosSdk)) {
		this.logger.info(__('Building for iOS %s; using %s as minimum iOS version', version.format(this.iosSdkVersion, 2).cyan, version.format(this.minSupportedIosSdk, 2).cyan));
		this.minIosVer = this.minSupportedIosSdk;
	} else if (version.lt(this.minIosVer, this.minSupportedIosSdk)) {
		this.logger.info(__('The %s of the iOS section in the tiapp.xml is lower than minimum supported version: Using %s as minimum', 'min-ios-ver'.cyan, version.format(this.minSupportedIosSdk, 2).cyan));
		this.minIosVer = this.minSupportedIosSdk;
	} else if (version.gt(this.minIosVer, this.iosSdkVersion)) {
		this.logger.info(__('The %s of the iOS section in the tiapp.xml is greater than the specified %s: Using %s as minimum', 'min-ios-ver'.cyan, 'ios-version'.cyan, version.format(this.iosSdkVersion, 2).cyan));
		this.minIosVer = this.iosSdkVersion;
	}
	this.logger.info(__('Minimum iOS version: %s', version.format(this.minIosVer, 2, 3).cyan));

	if (/^device|dist\-appstore|dist\-adhoc$/.test(this.target)) {
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

	next();
};

iOSBuilder.prototype.hashFile = function hashFile(file) {
	return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
};

iOSBuilder.prototype.copyDirSync = function copyDirSync(src, dest, opts) {
	afs.copyDirSyncRecursive(src, dest, opts || {
		preserve: true,
		logger: this.logger.debug,
		ignoreDirs: this.ignoreDirs,
		ignoreFiles: this.ignoreFiles
	});
};

iOSBuilder.prototype.copyDirAsync = function copyDirAsync(src, dest, callback, opts) {
	afs.copyDirRecursive(src, dest, callback, opts || {
		preserve: true,
		logger: this.logger.debug,
		ignoreDirs: this.ignoreDirs,
		ignoreFiles: this.ignoreFiles
	});
};

iOSBuilder.prototype.scrubName = function scrubName(name) {
	name = name.replace(/-/g, '_').replace(/\W/g, '')
	return /^[0-9]/.test(name) ? 'k' + name : name;
};

iOSBuilder.prototype.preparePhase = function preparePhase(next) {
	this.logger.info(__('Initiating prepare phase'));

	// recreate the build directory (<project dir>/build/[iphone|ios]/assets)
	fs.existsSync(this.assetsDir) && wrench.rmdirSyncRecursive(this.assetsDir);
	wrench.mkdirSyncRecursive(this.assetsDir);

	// read the build manifest from the last time we built, if exists
	this.buildManifest = {};
	this.buildManifestFile = path.join(this.buildDir, 'build-manifest.json');
	if (fs.existsSync(this.buildManifestFile)) {
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

	next();
};

iOSBuilder.prototype.initBuildDir = function initBuildDir(next) {
	if (this.forceRebuild) {
		var xcodeBuildDir = path.join(this.buildDir, 'build');
		if (fs.existsSync(xcodeBuildDir)) {
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
	wrench.mkdirSyncRecursive(path.join(this.buildDir, 'Classes'));

	next();
};

iOSBuilder.prototype.createInfoPlist = function createInfoPlist(next) {
	var src = this.projectDir + '/Info.plist',
		dest = this.buildDir + '/Info.plist',
		plist = new appc.plist(),
		iphone = this.tiapp.iphone,
		ios = this.tiapp.ios,
		defaultInfoPlist = path.join(this.titaniumIosSdkPath, 'Info.plist'),
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

	// default info.plist
	if (fs.existsSync(defaultInfoPlist)) {
		plist.parse(fs.readFileSync(defaultInfoPlist).toString().replace(/(__.+__)/g, function (match, key, format) {
			return consts.hasOwnProperty(key) ? consts[key] : '<!-- ' + key + ' -->'; // if they key is not a match, just comment out the key
		}));
	}

	// if the user has a Info.plist in their project directory, consider that a custom override
	if (fs.existsSync(src)) {
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
	['.png', '@2x.png', '-72.png', '-60.png', '-60@2x.png', '-76.png', '-76@2x.png', '-Small-50.png', '-72@2x.png', '-Small-50@2x.png', '-Small.png', '-Small@2x.png', '-Small-40.png', '-Small-40@2x.png'].forEach(function (name) {
		name = iconName + name;
		if (fs.existsSync(this.projectDir, 'Resources', name) ||
			fs.existsSync(this.projectDir, 'Resources', 'iphone', name) ||
			fs.existsSync(this.projectDir, 'Resources', this.platformName, name)) {
			if (plist.CFBundleIconFiles.indexOf(name) == -1) {
				plist.CFBundleIconFiles.push(name);
			}
		}
	}, this);

	// scan for ttf and otf font files
	var fontMap = {},
		resourceDir = path.join(this.projectDir, 'Resources'),
		iphoneDir = path.join(resourceDir, 'iphone'),
		iosDir = path.join(resourceDir, 'ios');

	(plist.UIAppFonts || []).forEach(function (f) {
		fontMap[f] = 1;
	});

	(function scanFonts(dir, isRoot) {
		fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (file) {
			var p = path.join(dir, file);
			if (fs.statSync(p).isDirectory() && (!isRoot || file == 'iphone' || file == 'ios' || ti.availablePlatformsNames.indexOf(file) == -1)) {
				scanFonts(p);
			} else if (/\.(otf|ttf)$/i.test(file)) {
				fontMap['/' + p.replace(iphoneDir, '').replace(iosDir, '').replace(resourceDir, '').replace(/^\//, '')] = 1;
			}
		});
	}(resourceDir, true));

	var fonts = Object.keys(fontMap);
	fonts.length && (plist.UIAppFonts = fonts);

	// write the Info.plist
	fs.writeFile(dest, plist.toString('xml'), next);
};

iOSBuilder.prototype.createDebuggerPlist = function createDebuggerPlist(next) {
	var parts = (this.debugHost || '').split(':'),
		plist = ejs.render(fs.readFileSync(path.join(this.templatesDir, 'debugger.plist')).toString(), {
			host: parts.length > 0 ? parts[0] : '',
			port: parts.length > 1 ? parts[1] : '',
			airkey: parts.length > 2 ? parts[2] : '',
			hosts: parts.length > 3 ? parts[3] : ''
		}),
		dest = path.join(this.buildDir, 'debugger.plist'),
		exists = fs.existsSync(dest);

	if (!exists || fs.readFileSync(dest).toString() != plist) {
		if (this.target != 'simulator') {
			if (!exists) {
				this.logger.info(__('Forcing rebuild: debugger.plist does not exist'));
			} else {
				this.logger.info(__('Forcing rebuild: debugger settings changed since last build'));
			}
			this.forceRebuild = true;
		} else {
			// write the debugger.plist to the app dir now since we're skipping Xcode and the pre-compile phase
			fs.writeFileSync(path.join(this.xcodeAppDir, 'debugger.plist'), plist);
		}
		fs.writeFile(dest, plist, next);
	} else {
		next();
	}
};

iOSBuilder.prototype.createProfilerPlist = function createProfilerPlist(next) {
	var parts = (this.debugHost || '').split(':'),
		plist = ejs.render(fs.readFileSync(path.join(this.templatesDir, 'profiler.plist')).toString(), {
			host: parts.length > 0 ? parts[0] : '',
			port: parts.length > 1 ? parts[1] : '',
			airkey: parts.length > 2 ? parts[2] : '',
			hosts: parts.length > 3 ? parts[3] : ''
		}),
		dest = path.join(this.buildDir, 'profiler.plist'),
		exists = fs.existsSync(dest);

	if (!exists || fs.readFileSync(dest).toString() != plist) {
		if (this.target != 'simulator') {
			if (!exists) {
				this.logger.info(__('Forcing rebuild: profiler.plist does not exist'));
			} else {
				this.logger.info(__('Forcing rebuild: profiler settings changed since last build'));
			}
			this.forceRebuild = true;
		} else {
			// write the profiler.plist to the app dir now since we're skipping Xcode and the pre-compile phase
			fs.writeFileSync(path.join(this.xcodeAppDir, 'debugger.plist'), plist);
		}
		fs.writeFile(dest, plist, next);
	} else {
		next();
	}
};

iOSBuilder.prototype.createEntitlementsPlist = function createEntitlementsPlist(next) {
	if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
		// allow the project to have its own custom entitlements
		var entitlementsFile = path.join(this.projectDir, 'Entitlements.plist'),
			contents = '',
			pp;
		if (fs.existsSync(entitlementsFile)) {
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
		fs.writeFile(path.join(this.buildDir, 'Entitlements.plist'), contents, next);
	} else {
		next();
	}
};

iOSBuilder.prototype.createXcodeProject = function createXcodeProject() {
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
			ignoreDirs: this.ignoreDirs,
			ignoreFiles: /^(bridge\.txt|libTitanium\.a|\.gitignore|\.npmignore|\.cvsignore|\.DS_Store|\._.*|[Tt]humbs.db|\.vspscc|\.vssscc|\.sublime-project|\.sublime-workspace|\.project|\.tmproj)$'/,
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
		.replace(/PRODUCT_NAME \= ['"]?Titanium(-iPad|-universal)?['"]?/g, 'PRODUCT_NAME = "' + this.tiapp.name + '$1"') // note: there are no PRODUCT_NAMEs with -iPad and -universal
		.replace(/path \= Titanium_Prefix\.pch;/g, 'path = "' + this.tiapp.name + '_Prefix.pch";')
		.replace(/GCC_PREFIX_HEADER \= Titanium_Prefix\.pch;/g, 'GCC_PREFIX_HEADER = "' + this.tiapp.name + '_Prefix.pch";')
		.replace(/Titanium_Prefix\.pch/g, this.tiapp.name + '_Prefix.pch')
		.replace(/Titanium/g, namespace);

	proj = injectCompileShellScript(
		proj,
		'Pre-Compile',
		'if [ \\"x$TITANIUM_CLI_XCODEBUILD\\" == \\"x\\" ]; then ' +
			(process.execPath || 'node') + ' \\"' + this.cli.argv.$0.replace(/^(.+\/)*node /, '') + '\\" build --platform ' +
			this.platformName + ' --sdk ' + this.titaniumSdkVersion + ' --no-prompt --no-banner --no-colors --xcode\\nexit $?' +
		'; else echo \\"skipping pre-compile phase\\"; fi'
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
};

iOSBuilder.prototype.checkIfShouldForceRebuild = function checkIfShouldForceRebuild() {
	var manifest = this.buildManifest;

	if (this.cli.argv.force) {
		this.logger.info(__('Forcing rebuild: %s flag was set', '--force'.cyan));
		return true;
	}

	if (!fs.existsSync(this.buildManifestFile)) {
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

	if (fs.existsSync(this.xcodeProjectConfigFile)) {
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

	if (!fs.existsSync(this.xcodeAppDir)) {
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
};

iOSBuilder.prototype.detectModules = function detectModules(next) {
	this.modules = [];
	this.commonJsModules = [];
	this.nativeLibModules = [];

	if (!this.tiapp.modules || !this.tiapp.modules.length) {
		this.logger.info(__('No Titanium Modules required, continuing'));
		next();
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

				if (!fs.existsSync(module.libFile)) {
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

		next();
	}.bind(this));
};

iOSBuilder.prototype.injectApplicationDefaults = function injectApplicationDefaults(next) {
	var file = path.join(this.buildDir, 'Classes', 'ApplicationDefaults.m'),
		exists = fs.existsSync(file),
		contents = ejs.render(fs.readFileSync(path.join(this.templatesDir, 'ApplicationDefaults.m')).toString(), {
			props: this.tiapp.properties || {},
			deployType: this.deployType,
			launchUrl: this.launchUrl
		});

	if (!exists || fs.readFileSync(file).toString() != contents) {
		if (!exists) {
			this.logger.info(__('Forcing rebuild: ApplicationDefaults.m does not exist'));
		} else {
			this.logger.info(__('Forcing rebuild: ApplicationDefaults.m has changed since last build'));
		}
		this.forceRebuild = true;
		this.logger.info(__('Writing application defaults: %s', file.cyan));
		fs.writeFile(file, contents, next);
	} else {
		next();
	}
};

iOSBuilder.prototype.copyModuleResources = function copyModuleResources(next) {
	var counter = 0;
	parallel(this, this.nativeLibModules.map(function (m) {
		return function (next) {
			var src = path.join(m.modulePath, 'assets'),
				dest = path.join(this.xcodeAppDir, 'modules', m.id);
			if (fs.existsSync(src)) {
				wrench.mkdirSyncRecursive(dest);
				counter++ == 0 && this.logger.info(__('Copying module resources'));
				this.copyDirAsync(src, dest, next);
			} else {
				next();
			}
		};
	}), function () {
		counter || this.logger.info(__('No module resources to copy'));
		next();
	});
};

iOSBuilder.prototype.copyCommonJSModules = function copyCommonJSModules(next) {
	this.logger.info(this.commonJsModules.length ? __('Copying CommonJS modules') : __('No CommonJS modules to copy'));
	parallel(this, this.commonJsModules.map(function (m) {
		return function (next) {
			// note: during test and production builds, this commonjs file is re-copied and minified and
			// this actual js file is deleted
			var src = path.join(m.modulePath, m.id + '.js');
			fs.existsSync(src) && afs.copyFileSync(src, this.xcodeAppDir, { logger: this.logger.debug });
			next();
		};
	}), next);
};

iOSBuilder.prototype.copyItunesArtwork = function copyItunesArtwork(next) {
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
	next();
};

iOSBuilder.prototype.copyGraphics = function copyGraphics(next) {
	var paths = [
			path.join(this.projectDir, 'Resources', 'iphone'),
			path.join(this.projectDir, 'Resources', 'ios'),
			path.join(this.titaniumIosSdkPath, 'resources')
		],
		len = paths.length,
		i, src;

	for (i = 0; i < len; i++) {
		if (fs.existsSync(src = path.join(paths[i], this.tiapp.icon))) {
			afs.copyFileSync(src, this.xcodeAppDir, {
				logger: this.logger.debug
			});
			break;
		}
	}

	next();
};

iOSBuilder.prototype.writeBuildManifest = function writeBuildManifest(next) {
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
		next();
	});
};

iOSBuilder.prototype.compileI18N = function compileI18N(next) {
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
							appc.subprocess.run('/usr/bin/plutil', ['-convert', 'binary1', dest], function (code, out, err) {
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
		next
	);
};

iOSBuilder.prototype.copyLocalizedSplashScreens = function copyLocalizedSplashScreens(next) {
	ti.i18n.splashScreens(this.projectDir, this.logger).forEach(function (splashImage) {
		var token = splashImage.split('/'),
			file = token.pop(),
			lang = token.pop(),
			lprojDir = path.join(this.xcodeAppDir, lang + '.lproj'),
			globalFile = path.join(this.xcodeAppDir, file);

		// this would never need to run. But just to be safe
		if (!fs.existsSync(lprojDir)) {
			this.logger.debug(__('Creating lproj folder %s', lprojDir.cyan));
			wrench.mkdirSyncRecursive(lprojDir);
		}

		// check for it in the root of the xcode build folder
		if (fs.existsSync(globalFile)) {
			this.logger.debug(__('Removing File %s, as it is being localized', globalFile.cyan));
			fs.unlinkSync(globalFile);
		}

		afs.copyFileSync(splashImage, lprojDir, {
			logger: this.logger.debug
		});
	}, this);
	next();
};

iOSBuilder.prototype.injectModulesIntoXcodeProject = function injectModulesIntoXcodeProject(next) {
	if (!this.nativeLibModules.length) {
		return next();
	}

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

	next();
};

iOSBuilder.prototype.populateIosFiles = function populateIosFiles(next) {
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
		mainContents = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'main.m')).toString().replace(/(__.+?__)/g, function (match, key, format) {
			var s = consts.hasOwnProperty(key) ? consts[key] : key;
			return typeof s == 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
		}),
		xcconfigContents = [
			'// this is a generated file - DO NOT EDIT',
			''
		];

	dest = path.join(this.buildDir, 'main.m');
	if (!fs.existsSync(dest) || fs.readFileSync(dest).toString() != mainContents) {
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, mainContents);
	}

	if (this.modules.length) {
		// add the modules to the xcconfig file
		this.modules.forEach(function (m) {
			var moduleId = m.manifest.moduleid.toLowerCase(),
				moduleName = m.manifest.name.toLowerCase(),
				prefix = m.manifest.moduleid.toUpperCase().replace(/\./g, '_');

			[	path.join(m.modulePath, 'module.xcconfig'),
				path.join(this.projectDir, 'modules', 'iphone', moduleName + '.xcconfig')
			].forEach(function (file) {
				if (fs.existsSync(file)) {
					var xc = new appc.xcconfig(file);
					Object.keys(xc).forEach(function (key) {
						var name = (prefix + '_' + key).replace(/[^\w]/g, '_');
						variables[key] || (variables[key] = []);
						variables[key].push(name);
						xcconfigContents.push((name + '=' + xc[key]).replace(new RegExp('\$\(' + key + '\)', 'g'), '$(' + name + ')'));
					});
				}
			});
		}, this);

		// write the ApplicationMods.m file
		var applicationModsContents = ejs.render(fs.readFileSync(path.join(this.templatesDir, 'ApplicationMods.m')).toString(), {
				modules: this.modules
			}),
			applicationModsFile = path.join(this.buildDir, 'Classes', 'ApplicationMods.m');
		if (!fs.existsSync(applicationModsFile) || fs.readFileSync(applicationModsFile).toString() != applicationModsContents) {
			this.logger.debug(__('Writing application modules source file: %s', applicationModsFile.cyan));
			fs.writeFileSync(applicationModsFile, applicationModsContents);
		} else {
			this.logger.debug(__('Application modules source file already up-to-date: %s', applicationModsFile.cyan));
		}
	}

	// write the module.xcconfig file
	Object.keys(variables).forEach(function (v) {
		xcconfigContents.push(v + '=$(inherited) ' + variables[v].map(function (x) { return '$(' + x + ') '; }).join(''));
	});
	xcconfigContents = xcconfigContents.join('\n');

	dest = path.join(this.buildDir, 'module.xcconfig');
	if (!fs.existsSync(dest) || fs.readFileSync(dest).toString() != xcconfigContents) {
		this.logger.debug(__('Writing module xcconfig file: %s', dest.cyan));
		fs.writeFileSync(dest, xcconfigContents);
	} else {
		this.logger.debug(__('Module xccconfig file already up-to-date: %s', dest.cyan));
	}
};

iOSBuilder.prototype.copyTitaniumLibraries = function copyTitaniumLibraries(next) {
	// check to see if the symlink exists and that it points to the right version of the library
	var dir = path.join(this.buildDir, 'lib'),
		dest;

	wrench.mkdirSyncRecursive(dir);

	dest = path.join(dir, 'libTiCore.a');
	if (this.cli.argv['force-copy-all']) {
		fs.existsSync(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), dest, { logger: this.logger.debug });
	} else {
		if (!fs.existsSync(dest) || !fs.lstatSync(dest).isSymbolicLink() || fs.readlinkSync(dest).indexOf(this.titaniumSdkVersion) == -1) {
			try {
				fs.unlinkSync(dest);
			} catch (e) {}
			fs.symlinkSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), dest);
		}
	}

	dest = path.join(dir, 'libtiverify.a');
	fs.existsSync(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libtiverify.a'), dest, { logger: this.logger.debug });

	dest = path.join(dir, 'libti_ios_debugger.a');
	fs.existsSync(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libti_ios_debugger.a'), dest, { logger: this.logger.debug });

	dest = path.join(dir, 'libti_ios_profiler.a');
	fs.existsSync(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libti_ios_profiler.a'), dest, { logger: this.logger.debug });

	next();
};

iOSBuilder.prototype.createSymlinks = function createSymlinks(callback) {
	if (this.target == 'simulator' && this.deployType == 'development') {
		var icon = (this.tiapp.icon || 'appicon.png').match(/^(.*)\.(.+)$/),
			ignoreDirs = this.ignoreDirs,
			ignoreFiles = this.ignoreFiles,
			unsymlinkableFileRegExp = new RegExp("^Default.*\.png|.+\.(otf|ttf)|iTunesArtwork" + (icon ? '|' + icon[1].replace(/\./g, '\\.') + '.*\\.' + icon[2] : '') + "$"),
			symlinkHook = this.cli.createHook('build.ios.copyResource', this, function (srcFile, destFile, cb) {
				this.logger.debug(__('Symlinking %s => %s', srcFile.cyan, destFile.cyan));
				try {
					// check if the file exists, even if it's a broken symlink
					fs.lstatSync(destFile) && fs.unlinkSync(destFile);
				} catch (ex) {}
				fs.symlinkSync(srcFile, destFile);
				setTimeout(cb, 1);
			}),
			symlinkResources = function (src, dest, doIgnoreDirs, cb) {
				if (fs.existsSync(src)) {
					this.logger.debug(__('Walking directory %s', src.cyan));
					wrench.mkdirSyncRecursive(dest);

					series(this, fs.readdirSync(src).map(function (file) {
						var srcFile = path.join(src, file),
							destFile = path.join(dest, file),
							isDir = fs.existsSync(srcFile) && fs.statSync(srcFile).isDirectory();

						return function (next) {
							if ((this.deviceFamily != 'iphone' || this.ipadSplashImages.indexOf(file) == -1) && !(isDir ? ignoreDirs : ignoreFiles).test(file) && (!doIgnoreDirs || ti.availablePlatformsNames.indexOf(file) == -1)) {
								if (fs.statSync(srcFile).isDirectory()) {
									setTimeout(function () {
										symlinkResources(srcFile, destFile, false, next);
									}, 1);
								} else if (this.forceCopy || unsymlinkableFileRegExp.test(file)) {
									afs.copyFileSync(srcFile, destFile, { logger: this.logger.debug });
									next();
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

		if (this.forceCopy) {
			this.logger.info(__('Forcing copying of files instead of creating symlinks'));
		} else {
			this.logger.info(__('Creating symlinks for simulator build'));
		}

		series(this, [
			function (next) {
				symlinkResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, true, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'Resources', 'ios'), this.xcodeAppDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'Resources', 'iphone'), this.xcodeAppDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'platform', 'ios'), this.buildDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'platform', 'iphone'), this.buildDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'modules', 'ios'), destModulesDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.projectDir, 'modules', 'iphone'), destModulesDir, false, next);
			},
			function (next) {
				symlinkResources(path.join(this.titaniumIosSdkPath, 'modules'), path.join(this.xcodeAppDir, 'modules'), false, next);
			},
			'compileJSS',
			'compileI18N'
		], callback);
	} else {
		callback();
	}
};

iOSBuilder.prototype.compileJSS = function compileJSS(next) {
	ti.jss.load(path.join(this.projectDir, 'Resources'), this.deviceFamilyNames[this.deviceFamily], this.logger, function (results) {
		var appStylesheet = path.join(this.xcodeAppDir, 'stylesheet.plist'),
			plist = new appc.plist();
		appc.util.mix(plist, results);
		fs.writeFile(appStylesheet, plist.toString('xml'), function () {
			if (this.target != 'simulator') {
				// compile plist into binary format so it's faster to load, we can be slow on simulator
				appc.subprocess.run('/usr/bin/plutil', ['-convert', 'binary1', appStylesheet], function (code, out, err) {
					next();
				});
			} else {
				next();
			}
		}.bind(this));
	}.bind(this));
};

iOSBuilder.prototype.invokeXcodeBuild = function invokeXcodeBuild(finished) {
	var xcodeArgs = [
			'-target', this.tiapp.name + this.xcodeTargetSuffixes[this.deviceFamily],
			'-configuration', this.xcodeTarget,
			'-sdk', this.xcodeTargetOS,
			'IPHONEOS_DEPLOYMENT_TARGET=' + appc.version.format(this.minIosVer, 2),
			'TARGETED_DEVICE_FAMILY=' + this.deviceFamilies[this.deviceFamily],
			'VALID_ARCHS=' + this.architectures
		],
		gccDefs = [ 'DEPLOYTYPE=' + this.deployType ];

	// Note: There is no evidence that TI_DEVELOPMENT, TI_TEST, TI_DEVELOPMENT, or
	//       DEBUGGER_ENABLED are used anymore.

	if (this.target == 'simulator') {
		gccDefs.push('__LOG__ID__=' + this.tiapp.guid);
		gccDefs.push('DEBUG=1');
		gccDefs.push('TI_VERSION=' + this.titaniumSdkVersion);
	}

	if (/simulator|device|dist\-adhoc/.test(this.target)) {
		this.tiapp.ios && this.tiapp.ios.enablecoverage && gccDefs.push('KROLL_COVERAGE=1');
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
				TMPDIR: process.env.TMPDIR,
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
							this.logger.error(__('Error details: %s', out[j]));
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
};

iOSBuilder.prototype.compileResources = function compileResources(src, dest, callback) {
	if ((this.target != 'simulator' || this.deployType != 'development') && fs.existsSync(src)) {
		var compiledTargets = {},
			ignoreDirs = this.ignoreDirs,
			ignoreFiles = this.ignoreFiles,
			recursivelyCopy = function (from, to, rel, ignore, done) {
				wrench.mkdirSyncRecursive(to);
				series(this, fs.readdirSync(from).map(function (file) {
					return function (next) {
						var f = path.join(from, file),
							t = f.replace(from, to),
							fstat = fs.statSync(f),
							p = rel ? rel + '/' + file : file;

						if ((fstat.isDirectory() ? ignoreDirs : ignoreFiles).test(file) || (ignore && ignore.indexOf(file) != -1)) {
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
							if ((this.deviceFamily != 'iphone' || this.ipadSplashImages.indexOf(file) == -1) && ((this.deployType == 'development' || !m || !/css|js/.test(m[1])) && (!fs.existsSync(t) || fstat.size != fs.statSync(t).size))) {
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
							this.jsFilesToPrepare.indexOf(id) == -1 && this.jsFilesToPrepare.push(id);
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
};

iOSBuilder.prototype.findSymbols = function findSymbols(ast, file) {
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
				buffer.length && this.addSymbol(buffer.join('.'), file);
			}
		}.bind(this));

	ast.walk(walker);
};

iOSBuilder.prototype.addSymbol = function addSymbol(symbol, id) {
	var tokens = symbol.split('.'),
		current = '',
		s = tokens[0].toLowerCase();

	this.tiModules.indexOf(s) == -1 && this.tiModules.push(s);

	if (!Array.isArray(this.symbols[id])) {
		this.symbols[id] = [];
	}

	tokens.forEach(function (t) {
		current += t + '.';
		var s = 'USE_TI_' + current.replace(/\.create/g, '').replace(/\./g, '').replace(/\-/g, '_').toUpperCase();
		if (this.symbols[id].indexOf(s) == -1) {
			this.logger.debug(__('Found symbol %s', s));
			this.symbols[id].push(s);
		}
	}, this);
};

iOSBuilder.prototype.compileJsFile = function compileJsFile(id, file) {
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
			this.logger.error(ex.message);
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
	this.findSymbols(ast, id);

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
};

iOSBuilder.prototype.xcodePrecompilePhase = function xcodePrecompilePhase(finished) {
	this.logger.info(__('Initiating Xcode pre-compile phase'));

	series(this, [
		'copyResources'
	], function () {
		finished();
	});
};

iOSBuilder.prototype.copyResources = function copyResources(finished) {
	this.tiModules = [];
	this.symbols = {
		$: ['USE_TI_ANALYTICS', 'USE_TI_NETWORK', 'USE_TI_PLATFORM', 'USE_TI_UI', 'USE_TI_API']
	};
	this.jsFilesToPrepare = [];

	var tasks = [
		// first task is to copy all files in the Resources directory, but ignore
		// any directory that is the name of a known platform
		function (cb) {
			copyDir.call(this, {
				src: path.join(this.projectDir, 'Resources'),
				dest: this.buildBinAssetsResourcesDir,
				ignoreRootDirs: ti.availablePlatformsNames
			}, cb);
		},

		// next copy all files from the iOS specific Resources directory
		function (cb) {
			copyDir.call(this, {
				src: path.join(this.projectDir, 'Resources', 'iphone'),
				dest: this.buildBinAssetsResourcesDir
			}, cb);
		},

		function (cb) {
			copyDir.call(this, {
				src: path.join(this.projectDir, 'Resources', 'ios'),
				dest: this.buildBinAssetsResourcesDir
			}, cb);
		}
	];



	this.compileResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, function () {
		parallel(this, [
			'compileJSS',
			'compileI18N',
			'copyLocalizedSplashScreens',
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
				this.compileResources(path.join(this.projectDir, 'platform', 'ios'), this.buildDir, next);
			},
			function (next) {
				this.compileResources(path.join(this.projectDir, 'platform', 'iphone'), this.buildDir, next);
			},
			function (next) {
				this.detectModules(function () {
					// copy module assets and find all Titanium symbols used by modules
					series(this, this.modules.map(function (m) {
						return function (cb) {
							var file = path.join(m.modulePath, 'metadata.json');
							if (fs.existsSync(file)) {
								try {
									var metadata = JSON.parse(fs.readFileSync(file));
									metadata && Array.isArray(metadata.exports) && metadata.exports.forEach(this.addSymbol, this);
								} catch (e) {}
							}

							var assets = path.join(m.modulePath, 'assets');
							if (fs.existsSync(assets)) {
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
					} else if (fs.existsSync(dest)) {
						this.logger.info(__('Removing unwanted %s from build', filename.cyan));
						fs.unlinkSync(dest);
					}
				}, this);

				next();
			}
		], function () {
			// if development and the simulator, then we're symlinking files and there's no need to anything below
			if (this.deployType == 'development' && this.target == 'simulator' && !this.forceCopy) {
				return finished.call(this);
			}

			series(this, [
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
						if (fs.existsSync(file)) {
							var id = m.id.replace(/\./g, '_') + '_js';
							this.compileJsFile(id, file);
							this.jsFilesToPrepare.indexOf(id) == -1 && this.jsFilesToPrepare.push(id);
						}

						// remove this module's js file that was copied by the copyCommonJSModules() function
						file = path.join(this.xcodeAppDir, m.id + '.js');
						if (fs.existsSync(file)) {
							this.logger.debug(__('Removing %s', file.cyan));
							fs.unlinkSync(file);
						}
					}, this);

					this.cli.fireHook('build.ios.prerouting', this, function (err) {
						var exe = path.join(this.titaniumIosSdkPath, 'titanium_prep'),
							args = [this.tiapp.id, this.assetsDir],
							tries = 0,
							done = false;

						this.logger.info(__('Running titanium_prep: %s', (exe + ' ' + args.join(' ')).cyan));
						this.jsFilesToPrepare.forEach(function (file) {
							this.logger.debug(__('Preparing %s', file.cyan));
						}, this);

						async.whilst(
							function () {
								if (tries > 3) {
									// we failed 3 times, so just give up
									this.logger.error(__('titanium_prep failed to complete successfully'));
									this.logger.error(__('Try cleaning this project and build again') + '\n');
									process.exit(1);
								}
								return !done;
							},
							function (cb) {
								var child = spawn(exe, args),
									out = '';

								child.stdin.write(this.jsFilesToPrepare.join('\n'));
								child.stdin.end();

								child.stdout.on('data', function (data) {
									out += data.toString();
								});

								child.on('close', function (code) {
									if (code) {
										this.logger.error(__('titanium_prep failed to run (%s)', code) + '\n');
										process.exit(1);
									}

									if (out.indexOf('initWithObjectsAndKeys') != -1) {
										// success!
										var file = path.join(this.buildDir, 'Classes', 'ApplicationRouting.m');
										this.logger.debug(__('Writing application routing source file: %s', file.cyan));
										fs.writeFileSync(
											file,
											ejs.render(fs.readFileSync(path.join(this.templatesDir, 'ApplicationRouting.m')).toString(), {
												bytes: out
											})
										);
										done = true;
									} else {
										// failure, maybe it was a fluke, try again
										this.logger.warn(__('titanium_prep failed to complete successfully, trying again'));
										tries++;
									}

									cb();
								}.bind(this));
							}.bind(this),
							next
						);
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
						if (fs.existsSync(tool)) {
							this.logger.info(__('Optimizing all images in %s', this.xcodeAppDir.cyan));
							appc.subprocess.run(tool, [this.xcodeAppDir], function (code, out, err) {
								// remove empty directories
								this.logger.info(__('Removing empty directories'));
								appc.subprocess.run('find', ['.', '-type', 'd', '-empty', '-delete'], {
									cwd: this.xcodeAppDir
								}, function (code, out, err) {
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
							],
							symbols = {};

						Object.keys(this.symbols).forEach(function (filename) {
							this.symbols[filename].forEach(function (symbol) {
								symbols[symbol] = 1;
							});
						}, this);

						contents = contents.concat(Object.keys(symbols).sort().map(function (s) {
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

						if (!fs.existsSync(dest) || fs.readFileSync(dest).toString() != contents) {
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
	}.bind(this));
};

// create the builder instance and expose the public api
(function (iosBuilder) {
	exports.config   = iosBuilder.config.bind(iosBuilder);
	exports.validate = iosBuilder.validate.bind(iosBuilder);
	exports.run      = iosBuilder.run.bind(iosBuilder);
}(new iOSBuilder(module)));
