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
	uglify = require('uglify-js'),
	uglifyProcessor = uglify.uglify,
	uglifyParser = uglify.parser,
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
	};

exports.config = function (logger, config, cli) {
	return function (callback) {
		ios.detect(function (env) {
			iosEnv = env || {};
			
			var sdks = {},
				sims = {},
				defaultSdk,
				conf,
				devNames = iosEnv.certs.devNames.map(function (name) {
					var m = name.match(/^([^(]+?)*/);
					return m && m[0].trim();
				}),
				distNames = iosEnv.certs.distNames.map(function (name) {
					var m = name.match(/^([^(]+?)*/);
					return m && m[0].trim();
				});
			
			Object.keys(iosEnv.xcode).forEach(function (key) {
				iosEnv.xcode[key].sdks.forEach(function (sdk, i) {
					if (iosEnv.xcode[key].selected && i == 0) {
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
			
			callback(conf = {
				flags: {
					retina: {
						desc: __('use the retina version of the iOS Simulator')
					},
					xcode: {
						// secret flag to perform Xcode pre-compile build step
						hidden: true
					}
				},
				options: {
					'debug-host': {
						abbr: 'H',
						desc: __('debug connection info; airkey and hosts required for %s and %s, ignored for %s', 'device'.cyan, 'dist-adhoc'.cyan, 'dist-appstore'.cyan),
						hint: 'host:port[:airkey:hosts]'
					},
					'deploy-type': {
						abbr: 'D',
						default: 'development',
						desc: __('the type of deployment; only used with target is %s', 'simulator'.cyan),
						hint: __('type'),
						values: ['test', 'development']
					},
					'developer-name': {
						abbr: 'V',
						default: process.env.CODE_SIGN_IDENTITY ? process.env.CODE_SIGN_IDENTITY.replace(/(iPhone Developer\: (.+) \(.+)/, '$2') : (config.ios && config.ios.developerName && devNames.indexOf(config.ios.developerName) != -1 ? config.ios.developerName : undefined),
						desc: __('the iOS Developer Certificate to use; required when target is %s', 'device'.cyan),
						hint: 'name',
						prompt: {
							label: __('Name of the iOS Developer Certificate to use'),
							error: __('Invalid developer name'),
							validator: function (name) {
								if (devNames.indexOf(name) == -1) {
									throw new appc.exception(__('Unable to find an iOS Developer Certificate for "%s"', name), [
										__('Available names: %s', '"' + devNames.join('", "') + '"')
									]);
								}
								return true;
							}
						}
					},
					'distribution-name': {
						abbr: 'R',
						default: config.ios && config.ios.distributionName && distNames.indexOf(config.ios.distributionName) != -1 ? config.ios.distributionName : undefined,
						desc: __('the iOS Distribution Certificate to use; required when target is %s or %s', 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
						hint: 'name',
						prompt: {
							label: __('Name of the iOS Distribution Certificate to use'),
							error: __('Invalid distribution name'),
							validator: function (name) {
								if (distNames.indexOf(name) == -1) {
									throw new appc.exception(__('Unable to find an iOS Distribution Certificate for "%s"', name), [
										__('Available names: %s', '"' + distNames.join('", "') + '"')
									]);
								}
								return true;
							}
						}
					},
					'device-family': {
						abbr: 'F',
						default: process.env.TARGETED_DEVICE_FAMILY === '1' ? 'iphone' : process.env.TARGETED_DEVICE_FAMILY == '2' ? 'ipad' : 'universal',
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
							label: __('Provisioning profile UUID'),
							error: __('Invalid provisioning profile UUID'),
							validator: function (uuid) {
								var i = 0,
									j,
									availableUUIDs = [__('Available UUIDs:')],
									type = cli.argv.target == 'device' ? 'development' : cli.argv.target == 'dist-appstore' ? 'distribution' : 'adhoc',
									profiles = iosEnv.provisioningProfiles[type];
								
								for (; i < profiles.length; i++) {
									if (profiles[i].uuid == uuid) {
										return true;
									}
									availableUUIDs.push('    ' + profiles[i].uuid.cyan + '  ' + profiles[i].appId + ' (' + profiles[i].name + ')');
								}
								
								throw new appc.exception(__('Unable to find a Provisioning Profile UUID "%s"', uuid), availableUUIDs);
							}
						}
					},
					'sim-version': {
						abbr: 'S',
						desc: __('iOS Simulator version; only used when target is %s', 'simulator'.cyan),
						values: sims
					},
					target: {
						abbr: 'T',
						callback: function (value) {
							// as soon as we know the target, toggle required options for validation
							switch (value) {
								case 'device':
									conf.options['developer-name'].required = true;
									conf.options['pp-uuid'].required = true;
									break;
								
								case 'dist-adhoc':
									conf.options['output-dir'].required = true;
									// purposely fall through!
								case 'dist-appstore':
									conf.options['distribution-name'].required = true;
									conf.options['pp-uuid'].required = true;
							}
						},
						default: 'simulator',
						desc: __('the target to build for'),
						required: true,
						values: targets
					}
				}
			});
		}, {
			minsdk: minIosSdkVersion
		});
	};
};

exports.validate = function (logger, config, cli) {
	var sdks = {},
		sims = {};
	
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	
	if (!ti.validateCorrectSDK(logger, config, cli, cli.argv['project-dir'])) {
		// we're running the build command for the wrong SDK version, gracefully return
		return false;
	}
	
	if (!Object.keys(iosEnv.xcode).length) {
		logger.error(__('Unable to find Xcode') + '\n');
		logger.log(__('Please download and install Xcode, then try again') + '\n');
		process.exit(1);
	}
	
	if (!iosEnv.xcode.__selected__) {
		logger.error(__('No Xcode version is currently selected') + '\n');
		logger.log(__("Use 'xcode-select' to select one of the Xcode versions:"));
		Object.keys(iosEnv.xcode).forEach(function (ver) {
			if (ver != '__selected__') {
				logger.log(('    xcode-select --switch ' + iosEnv[ver].xcode).cyan);
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
		logger.log(__('Please download and install an iOS SDK (version %s or newer)', version.format(minIosSdkVersion, 2)) + '\n');
		process.exit(1);
	}
	
	if (!Object.keys(sdks).some(function (ver) {
		if (version.eq(ver, cli.argv['ios-version'])) {
			cli.argv['ios-version'] = ver;
			return true;
		}
	})) {
		logger.error(__('Unable to find iOS SDK %s', cli.argv['ios-version']) + '\n');
		logger.log(__('Available iOS SDK versions:'));
		Object.keys(sdks).forEach(function (ver) {
			logger.log('    ' + ver.cyan);
		});
		logger.log();
		process.exit(1);
	}
	
	if (targets.indexOf(cli.argv.target) == -1) {
		logger.error(__('Invalid target "%s"', cli.argv.target) + '\n');
		appc.string.suggest(cli.argv.target, targets, logger.log, 3);
		process.exit(1);
	}
	
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
	}
	
	if (cli.argv.target != 'simulator') {
		if (!iosEnv.certs.wwdr) {
			logger.error(__('WWDR Intermediate Certificate not found') + '\n');
			logger.log(__('Download and install the certificate from %s', 'https://developer.apple.com/ios/manage/certificates/team/index.action'.cyan) + '\n');
			process.exit(1);
		}
		
		if (cli.argv.target == 'device') {
			if (!iosEnv.certs.devNames.length) {
				logger.error(__('Unable to find any iOS Developer Certificates') + '\n');
				logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/certificates/team/index.action'.cyan) + '\n');
				process.exit(1);
			}
			
			var devNames = iosEnv.certs.devNames.map(function (name) {
					var m = name.match(/^([^(]+?)*/);
					return m && m[0].trim();
				}),
				p = devNames.indexOf(cli.argv['developer-name']);
			if (p == -1) {
				logger.error(__('Unable to find an iOS Developer Certificate for "%s"', cli.argv['developer-name']) + '\n');
				logger.log(__('Available developer names:'));
				devNames.forEach(function (name) {
					logger.log('    ' + name.cyan);
				});
				logger.log();
				appc.string.suggest(cli.argv['developer-name'], devNames, logger.log);
				process.exit(1);
			} else {
				cli.argv['developer-name'] = iosEnv.certs.devNames[p];
			}
		} else {
			if (!iosEnv.certs.distNames.length) {
				logger.error(__('Unable to find any iOS Distribution Certificates') + '\n');
				logger.log(__('Download and install a certificate from %s', 'https://developer.apple.com/ios/manage/distribution/index.action'.cyan) + '\n');
				process.exit(1);
			}
			
			var distNames = iosEnv.certs.distNames.map(function (name) {
				var m = name.match(/^([^(]+?)*/);
				return m && m[0].trim();
			});
			if (distNames.indexOf(cli.argv['distribution-name']) == -1) {
				logger.error(__('Unable to find an iOS Distribution Certificate for name "%s"', cli.argv['distribution-name']) + '\n');
				logger.log(__('Available distribution names:'));
				distNames.forEach(function (name) {
					logger.log('    ' + name.cyan);
				});
				logger.log();
				appc.string.suggest(cli.argv['distribution-name'], distNames, logger.log);
				process.exit(1);
			}
		}
		
		if (!cli.argv['pp-uuid']) {
			logger.error(__('Missing required option "--pp-uuid"') + '\n');
			process.exit(1);
		}
		
		var profiles = iosEnv.provisioningProfilesByUUID = {};
		iosEnv.provisioningProfiles[provisioningProfileMap[cli.argv.target]].forEach(function (profile) {
			profiles[profile.uuid] = profile;
		});
		if (!profiles[cli.argv['pp-uuid']]) {
			logger.error(__('Invalid Provisioning Profile UUID "%s"', cli.argv['pp-uuid']) + '\n');
			logger.log(__('Available Provisioning Profile UUIDs:'));
			Object.keys(profiles).forEach(function (uuid) {
				logger.log('    ' + (profiles[uuid].uuid + '  ' + profiles[uuid].appId + ' (' + profiles[uuid].name + ')').cyan);
			});
			logger.log();
			appc.string.suggest(cli.argv['pp-uuid'], Object.keys(profiles), logger.log);
			process.exit(1);
		}
		
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
	
	var deviceFamily = cli.argv['device-family'];
	if (!deviceFamily || !deviceFamilies[deviceFamily]) {
		logger.error(__('Invalid device family "%s"', deviceFamily) + '\n');
		appc.string.suggest(deviceFamily, Object.keys(deviceFamilies), logger.log, 3);
		process.exit(1);
	}
	
	if (cli.argv['debug-host'] && cli.argv.target != 'dist-appstore') {
		if (typeof cli.argv['debug-host'] == 'number') {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			logger.log(__('The debug host must be in the format "host:port".') + '\n');
			process.exit(1);
		}

		var parts = cli.argv['debug-host'].split(':'),
			port = parts.length > 1 && parseInt(parts[1]);
		if ((cli.argv.target == 'simulator' && parts.length < 2) || (cli.argv.target != 'simulator' && parts.length < 3)) {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			if (cli.argv.target == 'simulator') {
				logger.log(__('The debug host must be in the format "host:port".') + '\n');
			} else {
				logger.log(__('The debug host must be in the format "host:port:airkey".') + '\n');
			}
			process.exit(1);
		}
		if (isNaN(port) || port < 1 || port > 65535) {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			logger.log(__('The port must be a valid integer between 1 and 65535.') + '\n');
			process.exit(1);
		}
		cli.argv['debug-host'] = parts.map(function (p) { return p.trim(); }).join(':');
	}
};

exports.run = function (logger, config, cli, finished) {
	if (cli.argv.xcode) {
		// basically, we bypass the pre, post, and finalize hooks for xcode builds
		var buildObj = new build(logger, config, cli, finished);
		sendAnalytics(cli, buildObj.tiapp);
	} else {
		cli.fireHook('build.pre.construct', function () {
			new build(logger, config, cli, function (err) {
				cli.fireHook('build.post.compile', this, function (e) {
					if (e && e.type == 'AppcException') {
						logger.error(e.message);
						e.details.forEach(function (line) {
							line && logger.error(line);
						});
					}
					sendAnalytics(cli, this.tiapp);
					cli.fireHook('build.finalize', this, function () {
						finished(err);
					});
				}.bind(this));
			});
		});
	}
};

function sendAnalytics(cli, tiapp) {
	var eventName = cli.argv['device-family'] + '.' + cli.argv.target;

	if (cli.argv.target == 'dist-appstore' || cli.argv.target == 'dist-adhoc') {
		eventName = cli.argv['device-family'] + '.distribute.' + cli.argv.target.replace('dist-', '');
	} else if (cli.argv['debug-host']) {
		eventName += '.debug';
	} else {
		eventName += '.run';
	}

	cli.addAnalyticsEvent(eventName, {
		dir: cli.argv['project-dir'],
		name: tiapp.name,
		publisher: tiapp.publisher,
		url: tiapp.url,
		image: tiapp.image,
		appid: tiapp.id,
		description: tiapp.description,
		type: cli.argv.type,
		guid: tiapp.guid,
		version: tiapp.version,
		copyright: tiapp.copyright,
		date: (new Date()).toDateString()
	});
}

function build(logger, config, cli, finished) {
	this.logger = logger;
	this.cli = cli;
	
	this.titaniumSdkVersion = ti.manifest.version;
	this.titaniumIosSdkPath = afs.resolvePath(path.dirname(module.filename), '..', '..');
	
	this.platformName = path.basename(this.titaniumIosSdkPath); // the name of the actual platform directory which will some day be "ios"
	
	this.projectDir = cli.argv['project-dir'];
	this.buildDir = path.join(this.projectDir, 'build', this.platformName);
	this.assetsDir = path.join(this.buildDir, 'assets');
	this.tiapp = new ti.tiappxml(path.join(this.projectDir, 'tiapp.xml'));
	this.target = cli.argv.target;
	this.provisioningProfileUUID = cli.argv['pp-uuid'];
	
	this.debugHost = cli.argv['debug-host'];
	this.keychain = cli.argv.keychain;
	
	if (cli.argv.xcode) {
		this.deployType = process.env.CURRENT_ARCH === 'i386' ? 'development' : process.env.CONFIGURATION === 'Debug' ? 'test' : 'production';
	} else {
		this.deployType = this.target == 'simulator' && cli.argv['deploy-type'] ? cli.argv['deploy-type'] : deployTypes[this.target];
	}
	this.xcodeTarget = process.env.CONFIGURATION || (/device|simulator/.test(this.target) ? 'Debug' : 'Release');
	this.iosSdkVersion = cli.argv['ios-version'];
	this.iosSimVersion = cli.argv['sim-version'];
	this.deviceFamily = cli.argv['device-family'];
	this.xcodeTargetOS = this.target == 'simulator' ? 'iphonesimulator' + this.iosSimVersion : 'iphoneos' + this.iosSdkVersion;
	this.iosBuildDir = path.join(this.buildDir, 'build', this.xcodeTarget + '-' + (this.target == 'simulator' ? 'iphonesimulator' : 'iphoneos'));
	this.xcodeAppDir = cli.argv.xcode ? path.join(process.env.TARGET_BUILD_DIR, process.env.CONTENTS_FOLDER_PATH) : path.join(this.iosBuildDir, this.tiapp.name + '.app');
	this.xcodeProjectConfigFile = path.join(this.buildDir, 'project.xcconfig');
	
	this.forceRebuild = false;
	this.forceXcode = false;
	
	// the ios sdk version is not in the selected xcode version, need to find the version that does have it
	Object.keys(iosEnv.xcode).forEach(function (sdk) {
		if (sdk != '__selected__' && (!this.xcodeEnv || iosEnv.xcode[sdk].selected) && iosEnv.xcode[sdk].sdks.some(function (ver) { return version.eq(ver, this.iosSdkVersion); }, this)) {
			this.xcodeEnv = iosEnv.xcode[sdk];
		}
	}, this);
	
	this.logger.info(__('Build type: %s', this.deployType));
	this.logger.debug(__('Titanium iOS SDK directory: %s', this.titaniumIosSdkPath.cyan));
	this.logger.info(__('Building for target: %s', this.target.cyan));
	this.logger.info(__('Building using iOS SDK: %s', version.format(this.iosSdkVersion, 2).cyan));
	if (this.target == 'simulator') {
		this.logger.info(__('Building for iOS Simulator: %s', this.iosSimVersion.cyan));
	}
	this.logger.info(__('Building for device family: %s', this.deviceFamily.cyan));
	this.logger.debug(__('Setting Xcode target to %s', this.xcodeTarget.cyan));
	this.logger.debug(__('Setting Xcode build OS to %s', this.xcodeTargetOS.cyan));
	this.logger.debug(__('Xcode installation: %s', this.xcodeEnv.path.cyan));
	this.logger.debug(__('iOS WWDR certificate: %s', iosEnv.certs.wwdr ? __('installed').cyan : __('not found').cyan));
	if (this.target == 'device') {
		this.logger.info(__('iOS Development Certificate: %s', cli.argv['developer-name'].cyan));
	} else if (/dist-appstore|dist\-adhoc/.test(this.target)) {
		this.logger.info(__('iOS Distribution Certificate: %s', cli.argv['distribution-name'].cyan));
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
	this.logger.debug(__('Minimum iOS version: %s', version.format(this.minIosVer, 2, 3).cyan));
	
	if (this.keychain) {
		this.logger.info(__('Using keychain: %s', this.keychain));
	}
	if (this.debugHost && this.target != 'dist-appstore') {
		this.logger.info(__('Debugging enabled via debug host: %s', this.debugHost.cyan));
	} else {
		this.logger.info(__('Debugging disabled'));
	}
	
	// make sure we have an icon
	if (!this.tiapp.icon || !['Resources', 'Resources/iphone', 'Resources/ios'].some(function (p) {
		return afs.exists(this.projectDir, p, this.tiapp.icon);
	}, this)) {
		this.tiapp.icon = 'appicon.png';
	}
	
	// if installing a non-production build on device, add a timestamp to the version
	if (this.target != 'simulator' && this.deployType != 'production') {
		this.tiapp.version = appc.version.format(this.tiapp.version || 1, 2, 3) + '.' + (new Date).getTime();
		this.logger.info(__('Setting non-production device build version to %s', this.tiapp.version));
	}
	
	Array.isArray(this.tiapp.modules) && (this.tiapp.modules = []);
	
	if (cli.argv.xcode) {
		this.logger.info(__('Performing Xcode pre-compile phase'));
		return this.xcodePrecompilePhase(finished);
	}
	
	this.architectures = 'armv6 armv7 i386';
	// no armv6 support above 4.3 or with 6.0+ SDK
	if (version.gte(cli.argv['ios-version'], '6.0')) {
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
	var libTiCoreFD = fs.openSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), 'r');
	if (libTiCoreFD) {
		try {
			var buffer = new Buffer(1024);
			fs.readSync(libTiCoreFD, buffer, 0, 1024, 0);
			this.libTiCoreHash = crypto.createHash('md5').update(buffer).digest('hex');
		} finally {
			fs.closeSync(libTiCoreFD);
		}
	}
	
	// figure out all of the modules currently in use
	this.modulesHash = crypto.createHash('md5').update(this.tiapp.modules.filter(function (m) {
		return !m.platform || /^iphone|ipad|commonjs$/.test(m.platform);
	}).map(function (m) {
		return m.id + ',' + m.platform + ',' + m.version;
	}).join('|')).digest('hex');
	
	// check if we need to do a rebuild
	this.forceRebuild = this.checkIfShouldForceRebuild();
	
	// if certain tiapp.xml settings changed or the target changed, then nuke the app directory
	if (this.forceRebuild || this.target != this.buildManifest.target) {
		this.logger.info(__('Cleaning old build directory'));
		// wipe the actual Xcode build dir, not the Titanium build dir
		wrench.rmdirSyncRecursive(path.join(this.buildDir, 'build'), true);
		wrench.mkdirSyncRecursive(path.join(this.buildDir, 'build'));
	}
	
	cli.fireHook('build.pre.compile', this, function () {
		// let's start building some apps!
		parallel(this, [
			'createInfoPlist',
			'createDebuggerPlist',
			'createEntitlementsPlist',
			'detectModules'
		], function () {
			if (this.forceRebuild) {
				this.logger.info(__('Performing full rebuild'));
				this.forceXcode = true;
				this.createXcodeProject();
				this.populateIosFiles();
			}
			
			// create the actual .app dir if it doesn't exist
			wrench.mkdirSyncRecursive(this.xcodeAppDir);
			
			parallel(this, [
				function (next) {
					if (this.target == 'simulator') {
						this.createSymlinks(next);
					} else {
						next();
					}
				},
				'injectModulesIntoXcodeProject',
				'injectApplicationDefaults',
				'compileJSS',
				'compileI18N',
				'copyTitaniumLibraries',
				'copySimulatorSpecificFiles',
				'copyModuleResources',
				'copyCommonJSModules',
				'copyItunesArtwork',
				'copyGraphics',
				'writeBuildManifest'
			], function () {
				var xcodeArgs = [
					'-target', this.tiapp.name + xcodeTargetSuffixes[this.deviceFamily],
					'-configuration', this.xcodeTarget,
					'-sdk', this.xcodeTargetOS,
					'IPHONEOS_DEPLOYMENT_TARGET=' + this.minIosVer,
					'TARGETED_DEVICE_FAMILY=' + deviceFamilies[this.deviceFamily],
					'VALID_ARCHS=' + this.architectures
				];
				
				if (this.target == 'simulator') {
					xcodeArgs.push('GCC_PREPROCESSOR_DEFINITIONS=__LOG__ID__=' + this.tiapp.guid);
					xcodeArgs.push('DEPLOYTYPE=' + this.deployType);
					xcodeArgs.push('TI_DEVELOPMENT=1');
					xcodeArgs.push('DEBUG=1');
					xcodeArgs.push('TI_VERSION=' + ti.manifest.version);
				}
				
				if (/simulator|device|dist\-adhoc/.test(this.target)) {
					this.tiapp.ios && this.tiapp.ios.enablecoverage && xcodeArgs.push('KROLL_COVERAGE=1');
					this.debugHost && xcodeArgs.push('DEBUGGER_ENABLED=1');
				}
				
				if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
					xcodeArgs.push('GCC_PREPROCESSOR_DEFINITIONS=DEPLOYTYPE=' + this.deployType);
					xcodeArgs.push('PROVISIONING_PROFILE=' + this.provisioningProfileUUID);
					xcodeArgs.push('DEPLOYMENT_POSTPROCESSING=YES');
					if (this.keychain) {
						xcodeArgs.push('OTHER_CODE_SIGN_FLAGS=--keychain');
						xcodeArgs.push(this.keychain);
					}
					this.codeSignEntitlements && xcodeArgs.push('CODE_SIGN_ENTITLEMENTS=Resources/Entitlements.plist');
				}
				
				if (/device|dist\-adhoc/.test(this.target)) {
					xcodeArgs.push('TI_TEST=1');
				}
				
				if (this.target == 'device') {
					xcodeArgs.push('CODE_SIGN_IDENTITY=iPhone Developer: ' + cli.argv['developer-name']);
				}
				
				if (/dist-appstore|dist\-adhoc/.test(this.target)) {
					xcodeArgs.push('CODE_SIGN_IDENTITY=iPhone Distribution: ' + cli.argv['distribution-name']);
				}
				
				if (this.target == 'dist-appstore') {
					xcodeArgs.push('TI_PRODUCTION=1');
				}
				
				var p = spawn(this.xcodeEnv.xcodebuild, xcodeArgs, {
						cwd: this.buildDir,
						env: {
							DEVELOPER_DIR: this.xcodeEnv.path,
							HOME: process.env.HOME,
							PATH: process.env.PATH
						}
					});
				
				p.stderr.on('data', function (data) {
					data.toString().split('\n').forEach(function (line) {
						line.length && this.logger.error(line);
					}, this);
					process.exit(1);
				}.bind(this));
				
				p.stdout.on('data', function (data) {
					data.toString().split('\n').forEach(function (line) {
						line.length && this.logger.trace(line);
					}, this);
				}.bind(this));
				
				p.on('exit', function (code, signal) {
					if (!cli.argv['build-only']) {
						var delta = appc.time.prettyDiff(cli.startTime, Date.now());
						this.logger.info(__('Finished building the application in %s', delta));
					}
					
					// end of the line
					finished.call(this, code);
				}.bind(this));
			});
		});
	}.bind(this));
}

build.prototype = {
	
	copyDirSync: function (src, dest, opts) {
		afs.copyDirSyncRecursive(src, dest, opts || {
			preserve: true,
			logger: this.logger.debug,
			ignoreDirs: ['.git','.svn', 'CVS'],
			ignoreFiles: ['.gitignore', '.cvsignore']
		});
	},
	
	copyDirAsync: function (src, dest, callback, opts) {
		afs.copyDirRecursive(src, dest, callback, opts || {
			preserve: true,
			logger: this.logger.debug,
			ignoreDirs: ['.git','.svn', 'CVS'],
			ignoreFiles: ['.gitignore', '.cvsignore']
		});
	},
	
	createInfoPlist: function (callback) {
		var src = this.projectDir + '/Info.plist';
		// if the user has a Info.plist in their project directory, consider that a custom override
		if (afs.exists(src)) {
			this.logger.info(__('Copying Info.plist'));
			
			var dest = this.buildDir + '/Info.plist',
				contents = fs.readFileSync(src).toString(),
				plist = new appc.plist().parse(contents);
			
			if (plist.CFBundleIdentifier != this.tiapp.id) {
				this.forceXcode = true;
			}
			this.logger.debug(__('Copying %s => %s', src.cyan, dest.cyan));
			
			fs.writeFileSync(dest, contents);
		} else {
			this.logger.info(__('Building Info.plist'));
			
			var iphone = this.tiapp.iphone,
				ios = this.tiapp.ios,
				fbAppId = this.tiapp.properties && this.tiapp.properties['ti.facebook.appid'],
				iconName = this.tiapp.icon.replace(/(.+)(\..*)$/, '$1'), // note: this is basically stripping the file extension
				consts = {
					'__APPICON__': iconName,
					'__PROJECT_NAME__': this.tiapp.name,
					'__PROJECT_ID__': this.tiapp.id,
					'__URL__': this.tiapp.id,
					'__URLSCHEME__': this.tiapp.name.replace(/\./g, '_').replace(/ /g, '').toLowerCase(),
					'__ADDITIONAL_URL_SCHEMES__': fbAppId ? '<string>fb' + fbAppId + '</string>' : ''
				},
				plist = new appc.plist();
			
			if (afs.exists(this.titaniumIosSdkPath, 'Info.plist')) {
				plist.parse(fs.readFileSync(path.join(this.titaniumIosSdkPath, 'Info.plist')).toString().replace(/(__.+__)/g, function (match, key, format) {
					return consts.hasOwnProperty(key) ? consts[key] : '<!-- ' + key + ' -->'; // if they key is not a match, just comment out the key
				}));
			}
			
			plist.UIRequiresPersistentWiFi = this.tiapp['persistent-wifi'];
			plist.UIPrerenderedIcon = this.tiapp['prerendered-icon'];
			plist.UIStatusBarHidden = this.tiapp['statusbar-hidden'];
			
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
						var arr = plist['UISupportedInterfaceOrientations' + (key == 'ipad' ? '~ipad' : '')] = [];
						iphone.orientations[key].forEach(function (name) {
							// name should be in the format Ti.UI.PORTRAIT, so pop the last part and see if it's in the map
							arr.push(orientationsMap[name.split('.').pop().toUpperCase()] || name);
						});
					});
				}
				
				if (iphone.backgroundModes) {
					plist.UIBackgroundModes = [].concat(iphone.backgroundModes);
				}
				
				if (iphone.requires) {
					plist.UIRequiredDeviceCapabilities = [].concat(iphone.requiredFeatures);
				}
				
				if (iphone.types) {
					var types = plist.CFBundleDocumentTypes = [];
					iphone.types.forEach(function (type) {
						types.push({
							CFBundleTypeName: type.name,
							CFBundleTypeIconFiles: type.icon,
							LSItemContentTypes: type.uti,
							LSHandlerRank: type.owner ? 'Owner' : 'Alternate'
						});
					});
				}
			}
			
			ios && ios.plist && Object.keys(ios.plist).forEach(function (prop) {
				if (!/^\+/.test(prop)) {
					plist[prop] = ios.plist[prop];
				}
			});
			
			plist.CFBundleIdentifier = this.tiapp.id;
			plist.CFBundleVersion = appc.version.format(this.tiapp.version || 1, 2);
			plist.CFBundleShortVersionString = appc.version.format(this.tiapp.version || 1, 2, 3);
			
			plist.CFBundleIconFiles = [];
			['.png', '@2x.png', '-72.png', '-Small-50.png', '-72@2x.png', '-Small-50@2x.png', '-Small.png', '-Small@2x.png'].forEach(function (name) {
				name = iconName + name;
				if (afs.exists(this.projectDir, 'Resources', name) ||
					afs.exists(this.projectDir, 'Resources', 'iphone', name) ||
					afs.exists(this.projectDir, 'Resources', this.platformName, name)) {
					plist.CFBundleIconFiles.push(name);
				}
			}, this);
			
			fs.writeFileSync(this.buildDir + '/Info.plist', plist.toString('xml'));
		}
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
			dest = path.join(this.buildDir, 'Resources', 'debugger.plist');
		
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != plist) {
			this.forceXcode = true;
			wrench.mkdirSyncRecursive(path.dirname(dest));
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
			fs.writeFile(path.join(this.buildDir, 'Resources', 'Entitlements.plist'), contents, callback);
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
				[/TitaniumModule/g, namespace + '$Module'],
				[/Titanium|Appcelerator/g, namespace],
				[/titanium/g, '_' + namespace.toLowerCase()],
				[new RegExp(namespace + '(' + namespace + '\\$?Module)', 'g'), '$1'],
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
		['Classes', 'headers', 'Resources'].forEach(function (dir) {
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
			'node \\"' + this.cli.argv.$0.replace(/^node /, '') + '\\" build --platform ' +
				this.platformName + ' --sdk ' + this.titaniumSdkVersion + ' --no-prompt --no-banner --xcode\\nexit $?'
		);
		proj = injectCompileShellScript(
			proj,
			'Post-Compile',
			"echo 'post-compile'"
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
			this.logger.debug(__('Forcing rebuild: %s flag was set', '--force'.cyan));
			return true;
		}
		
		if (!afs.exists(this.buildManifestFile)) {
			// if no .version file, rebuild!
			this.logger.debug(__('Forcing rebuild: %s does not exist', this.buildManifestFile.cyan));
			return true;
		}
		
		if (afs.exists(this.xcodeProjectConfigFile)) {
			// we have a previous build, see if the Titanium SDK changed
			var conf = fs.readFileSync(this.xcodeProjectConfigFile).toString(),
				versionMatch = conf.match(/TI_VERSION\=([^\n]*)/),
				idMatch = conf.match(/TI_APPID\=([^\n]*)/);
			
			if (versionMatch && !appc.version.eq(versionMatch[1], this.titaniumSdkVersion)) {
				this.logger.debug(__("Forcing rebuild: last build was under Titanium SDK version %s and we're compiling for version %s", versionMatch[1].cyan, this.titaniumSdkVersion.cyan));
				return true;
			}
			
			if (idMatch && idMatch[1] != this.tiapp.id) {
				this.logger.debug(__("Forcing rebuild: app id changed from %s to %s", idMatch[1].cyan, this.tiapp.id.cyan));
				return true;
			}
		}
		
		if (!afs.exists(this.xcodeAppDir)) {
			this.logger.debug(__('Forcing rebuild: %s does not exist', this.xcodeAppDir.cyan));
			return true;
		}
		
		// check that we have a libTiCore hash
		if (!manifest.tiCoreHash) {
			this.logger.debug(__('Forcing rebuild: incomplete version file %s', this.buildVersionFile.cyan));
			return true;
		}
		
		// check if the libTiCore hashes are different
		if (this.libTiCoreHash != manifest.tiCoreHash) {
			this.logger.debug(__('Forcing rebuild: libTiCore hash changed since last build'));
			this.logger.debug('  ' + __('Was: %s', manifest.tiCoreHash));
			this.logger.debug('  ' + __('Now: %s', this.libTiCoreHash));
			return true;
		}
		
		// check if the titanium sdk paths are different
		if (manifest.iosSdkPath != this.titaniumIosSdkPath) {
			this.logger.debug(__('Forcing rebuild: Titanium SDK path changed since last build'));
			this.logger.debug('  ' + __('Was: %s', manifest.iosSdkPath));
			this.logger.debug('  ' + __('Now: %s', this.titaniumIosSdkPath));
			return true;
		}
		
		// check the git hashes are different
		if (!manifest.gitHash || manifest.gitHash != ti.manifest.githash) {
			this.logger.debug(__('Forcing rebuild: githash changed since last build'));
			this.logger.debug('  ' + __('Was: %s', manifest.gitHash));
			this.logger.debug('  ' + __('Now: %s', ti.manifest.githash));
			return true;
		}
		
		// check if the app guids are different
		if (this.tiapp.guid != manifest.appGuid) {
			this.logger.debug(__('Forcing rebuild: githash changed since last build'));
			this.logger.debug('  ' + __('Was: %s', manifest.appGuid));
			this.logger.debug('  ' + __('Now: %s', this.tiapp.guid));
			return true;
		}
		
		// check if the modules hashes are different
		if (this.modulesHash != manifest.modulesHash) {
			this.logger.debug(__('Forcing rebuild: modules hash changed since last build'));
			this.logger.debug('  ' + __('Was: %s', manifest.modulesHash));
			this.logger.debug('  ' + __('Now: %s', this.modulesHash));
			return true;
		}
		
		return false;
	},
	
	detectModules: function (callback) {
		this.modules = [];
		this.commonJsModules = [];
		this.nativeLibModules = [];
		
		if (!this.tiapp.modules || !this.tiapp.modules.length) {
			this.logger.info(__('No Titanium Modules required, continuing'));
			callback();
			return;
		}
		
		appc.timodule.find(this.tiapp.modules, ['iphone', 'ios'], this.deployType, this.titaniumSdkVersion, this.projectDir, this.logger, function (modules) {
			if (modules.missing.length) {
				this.logger.error(__('Could not find all required Titanium Modules:'))
				modules.missing.forEach(function (m) {
					this.logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform);
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
			
			this.modules = modules.found;
			
			modules.found.forEach(function (module) {
				if (module.platform == 'commonjs') {
					this.commonJsModules.push(module);
				} else {
					module.libName = 'lib' + module.id.toLowerCase() + '.a',
					module.libFile = path.join(module.modulePath, module.libName);
					
					if (!afs.exists(module.libFile)) {
						this.logger.error(__('Module %s version %s is missing library file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, libFile.cyan));
						process.exit(1);
					}
					
					this.logger.info(__('Detected third-party native iOS module: %s version %s', module.id.cyan, (module.manifest.version || 'latest').cyan));
					this.nativeLibModules.push(module);
					
					// since we have native modules, let's force a rebuild of the Xcode project
					this.forceXcode = true;
				}
			}, this);
			
			callback();
		}.bind(this));
	},
	
	copySimulatorSpecificFiles: function (callback) {
		if (this.target == 'simulator') {
			// during simulator we need to copy in standard built-in module files
			// since we might not run the compiler on subsequent launches
			['facebook', 'ui'].forEach(function (name) {
				this.copyDirSync(path.join(this.titaniumIosSdkPath, 'modules', name, 'images'), path.join(this.xcodeAppDir, 'modules', name, 'images'));
			}, this);
			
			// when in simulator since we point to the resources directory, we need
			// to explicitly copy over any files
			['ios', 'iphone'].forEach(function (name) {
				var dir = path.join(this.projectDir, 'Resources', name);
				afs.exists(dir) && this.copyDirSync(dir, this.xcodeAppDir);
				
				dir = path.join(this.projectDir, 'platform', name);
				afs.exists(dir) && this.copyDirSync(dir, this.xcodeAppDir);
			}, this);
			
			// copy the custom fonts
			fs.readdirSync(path.join(this.projectDir, 'Resources')).forEach(function (file) {
				var src = path.join(this.projectDir, 'Resources', file);
				if (fs.lstatSync(src).isFile() && /.+\.(ttf|otf)$/.test(file)) {
					this.logger.info(__('Detected custom font: %s', file));
					
					var dest = path.join(this.xcodeAppDir, file);
					afs.exists(dest) && fs.unlinkSync(dest);
					afs.copyFileSync(src, dest, { logger: this.logger.debug });
				}
			}, this);
		}
		callback();
	},
	
	injectApplicationDefaults: function (callback) {
		var props = this.tiapp.properties || {},
			dest = path.join(this.buildDir, 'Classes', 'ApplicationDefaults.m');
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
		contents.push('@end');
		contents = contents.join('\n');
		
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
			this.forceXcode = true;
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
		if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
			this.logger.info(__('Copying iTunes artwork'));
			parallel(this, ['iTunesArtwork', 'iTunesArtwork@2x'].map(function (dir) {
				return function (next) {
					dir = path.join(this.projectDir, dir);
					if (afs.exists(dir)) {
						this.copyDirAsync(dir, this.xcodeAppDir, next);
					} else {
						next();
					}
				};
			}), callback);
		} else {
			callback();
		}
	},
	
	copyGraphics: function (callback) {
		var paths = [
				path.join(this.projectDir, 'Resources', 'iphone'),
				path.join(this.projectDir, 'Resources', 'ios'),
				path.join(this.titaniumIosSdkPath, 'resources'),
			],
			i = 0,
			src,
			dest = path.join(this.buildDir, 'Resources'),
			copyOpts = {
				logger: this.logger.debug
			};
		
		for (; i < paths.length; i++) {
			if (afs.exists(src = path.join(paths[i], this.tiapp.icon))) {
				afs.copyFileSync(src, this.xcodeAppDir, copyOpts);
				break;
			}
		}
		
		fs.readdirSync(src = path.join(this.titaniumIosSdkPath, 'resources'), function (file) {
			afs.copyFileSync(path.join(src, file), dest, copyOpts);
		});
		
		callback();
	},
	
	writeBuildManifest: function (callback) {
		fs.writeFile(this.buildManifestFile, JSON.stringify(this.buildManifest = {
			target: this.target,
			iosSdkPath: this.titaniumIosSdkPath,
			appGuid: this.tiapp.guid,
			tiCoreHash: this.libTiCoreHash,
			modulesHash: this.modulesHash,
			gitHash: ti.manifest.githash
		}, null, '\t'), callback);
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
								return '"' + (map && map[name] || name).replace(/\\/g, '\\\\').replace(/"/g, '\\"') +
									'" = "' + obj[name].replace(/%s/g, '%@').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '";';
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
				'__APP_ANALYTICS__': '' + !!this.tiapp.analytics,
				'__APP_PUBLISHER__': this.tiapp.publisher,
				'__APP_URL__': this.tiapp.url,
				'__APP_NAME__': this.tiapp.name,
				'__APP_VERSION__': version.format(this.tiapp.version, 2),
				'__APP_DESCRIPTION__': this.tiapp.description,
				'__APP_COPYRIGHT__': this.tiapp.copyright,
				'__APP_GUID__': this.tiapp.guid,
				'__APP_RESOURCE_DIR__': ''
			},
			dest,
			variables = {},
			mainContents = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'main.m')).toString().replace(/(__.+__)/g, function (match, key, format) {
				var s = consts.hasOwnProperty(key) ? consts[key] : key;
				return typeof s == 'string' ? s.replace(/"/g, '\\"') : s;
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
			],
			defines = [],
			definesContents = [
				'// Warning: this is generated file. Do not modify!',
				''
			];
		
		dest = path.join(this.buildDir, 'main.m');
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != mainContents) {
			this.logger.debug(__('Writing %s', dest.cyan));
			fs.writeFileSync(dest, mainContents);
		}
		
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
		});
		
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
		if (!afs.exists(dest) || !fs.lstatSync(dest).isSymbolicLink() || fs.readlinkSync(dest).indexOf(this.titaniumSdkVersion) == -1) {
			try {
				fs.unlinkSync(dest);
			} catch (e) {}
			fs.symlinkSync(path.join(this.titaniumIosSdkPath, 'libTiCore.a'), dest);
		}
		
		dest = path.join(dir, 'libtiverify.a');
		afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libtiverify.a'), dest, { logger: this.logger.debug });
		
		dest = path.join(dir, 'libti_ios_debugger.a');
		afs.exists(dest) || afs.copyFileSync(path.join(this.titaniumIosSdkPath, 'libti_ios_debugger.a'), dest, { logger: this.logger.debug });
		
		callback();
	},
	
	createSymlinks: function (callback) {
		var ignoreRegExp = /^\.gitignore|\.cvsignore|\.DS_Store|\.git|\.svn|_svn|CVS$/,
			symlinkResources = function (src, dest, doIgnoreDirs) {
				if (afs.exists(src)) {
					this.logger.debug(__('Walking directory %s', src.cyan));
					wrench.mkdirSyncRecursive(dest);
					fs.readdirSync(src).forEach(function (file) {
						if (!ignoreRegExp.test(file) && (!doIgnoreDirs || ti.availablePlatformsNames.indexOf(file) == -1)) {
							var srcFile = path.join(src, file),
								destFile = path.join(dest, file);
							if (fs.lstatSync(srcFile).isDirectory()) {
								symlinkResources(srcFile, destFile);
							} else {
								this.logger.debug(__('Symlinking %s => %s', srcFile.cyan, destFile.cyan));
								afs.exists(destFile) && fs.unlinkSync(destFile);
								fs.symlinkSync(srcFile, destFile);
							}
						}
					}, this);
				}
			}.bind(this),
			destModulesDir = path.join(this.xcodeAppDir, 'modules');
		
		this.logger.info(__('Creating symlinks for simulator build'));
		
		symlinkResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, true);
		symlinkResources(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir, false);
		symlinkResources(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir, false);
		symlinkResources(path.join(this.projectDir, 'modules', 'ios'), destModulesDir, true);
		symlinkResources(path.join(this.projectDir, 'modules', 'iphone'), destModulesDir, true);
		
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
	},
	
	compileJSS: function (callback) {
		ti.jss.load(path.join(this.projectDir, 'Resources'), deviceFamilyNames[this.deviceFamily], this.logger, function (results) {
			var appStylesheet = path.join(this.buildDir, 'Resources', 'stylesheet.plist'),
				plist = new appc.plist();
			appc.util.mix(plist, results);
			fs.writeFile(appStylesheet, plist.toString('xml'), function () {
				if (this.target != 'simulator') {
					// compile plist into binary format so it's faster to load we can be slow on simulator
					exec('/usr/bin/plutil -convert binary1 "' + appStylesheet + '"', callback);
				} else {
					callback();
				}
			}.bind(this));
		}.bind(this));
	},
	
	compileResources: function (src, dest) {
		if (afs.exists(src)) {
			var compiledTargets = {},
				ignoreRegExp = /^\.gitignore|\.cvsignore|\.DS_Store|\.git|\.svn|_svn|CVS$/,
				recursivelyCopy = function (from, to, rel, ignore) {
					wrench.mkdirSyncRecursive(to);
					fs.readdirSync(from).forEach(function (file) {
						var f = path.join(from, file),
							t = f.replace(from, to),
							fstat = fs.lstatSync(f),
							p = rel ? rel + '/' + file : file;
						if (ignoreRegExp.test(file) || (ignore && ignore.indexOf(file) != -1)) {
							this.logger.debug(__('Ignoring %s', f.cyan));
						} else if (fstat.isDirectory()) {
							recursivelyCopy(f, t, p);
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
							if ((this.deployType == 'development' || !m || !/css|js/.test(m[1])) && (!afs.exists(t) || fstat.size != fs.lstatSync(t).size)) {
								afs.copyFileSync(f, t, { logger: this.logger.debug });
							}
						}
					}, this);
				}.bind(this);
			
			recursivelyCopy(src, dest, null, ti.availablePlatformsNames);
			
			/*
			The following code scans all html files for script tags referencing app:// js files, however in
			production/test, we actually want this files minified and prepared. In development builds, we
			don't care if it's minified and we don't want to prepare the file anwyays.
			
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
						uglifyProcessor.gen_code(
							uglifyProcessor.ast_squeeze(
								uglifyProcessor.ast_mangle(
									uglifyParser.parse(
										fs.readFileSync(c.from).toString().replace(/Titanium\./g,'Ti.')
									)
								)
							)
						)
					);
				}, this);
			}
			*/
			
			// minify css files
			compiledTargets.css && compiledTargets.css.forEach(function (file) {
				if (this.deployType == 'development') {
					afs.copyFileSync(file.from, file.to, { logger: this.logger.debug });
				} else {
					this.logger.debug(__('Writing minified CSS file: %s', file.to.cyan));
					fs.writeFileSync(file.to, cleanCSS.process(fs.readFileSync(file.from).toString()));
				}
			}, this);
			
			// minify js files
			compiledTargets.js && compiledTargets.js.forEach(function (target) {
				var id = target.path.replace(/\./g, '_');
				this.compileJsFile(id, target.from);
				this.jsFilesToPrepare.push(id);
			}, this);
		}
	},
	
	findSymbols: function (ast) {
		function walkdot(n) {
			if (n.length > 1) {
				if (n[0] == 'dot') {
					var x = walkdot(n[1]);
					return x ? x + '.' + n[2] : null;
				} else if (n[0] == 'name' && n[1] == 'Ti') {
					return n[1];
				}
			}
		}
		
		var walk = function (n) {
			if (n && Array.isArray(n)) {
				for (var i = 0; i < n.length; i++) {
					if (Array.isArray(n[i])) {
						walk(n[i]);
					} else if (n[i] == 'dot') {
						var s = walkdot(n[++i]);
						s && s.length > 3 && s != 'dot' && this.addSymbol(s.substring(3) + '.' + n[++i]);
					}
				}
			}
		}.bind(this);
		
		walk(ast);
	},
	
	addSymbol: function (symbol) {
		var tokens = symbol.split('.'),
			current = '',
			s = tokens[0].toLowerCase();
		
		this.tiModules.indexOf(s) == -1 && this.tiModules.push(s);
		
		tokens.forEach(function (t) {
			current += t + '.';
			var s = 'USE_TI_' + current.replace(/\.create/g, '').replace(/\./g, '').replace(/\-/g, '_').toUpperCase();
			this.symbols.indexOf(s) == -1 && this.symbols.push(s);
		}, this);
	},
	
	compileJsFile: function (id, file) {
		var contents = fs.readFileSync(file).toString().replace(/Titanium\./g,'Ti.'),
			ast = uglifyParser.parse(contents);
		
		if (this.deployType != 'development') {
			contents = uglifyProcessor.gen_code(
				uglifyProcessor.ast_squeeze(
					uglifyProcessor.ast_mangle(ast)
				)
			);
		}
		
		this.logger.info(__('Finding Titanium symbols in file %s', file.cyan));
		this.findSymbols(ast);
		
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
			function (next) {
				this.compileResources(path.join(this.projectDir, 'Resources', 'ios'), this.xcodeAppDir);
				this.compileResources(path.join(this.projectDir, 'Resources', 'iphone'), this.xcodeAppDir);
				this.compileResources(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir);
				this.compileResources(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir);
				next();
			},
			function (next) {
				this.detectModules(function () {
					// copy module assets and find all Titanium symbols used by modules
					this.modules.forEach(function (m) {
						var assets = path.join(m.modulePath, 'assets');
						if (afs.exists(assets)) {
							this.compileResources(assets, path.join(this.xcodeAppDir, 'modules', m.id.toLowerCase()));
						}
						
						var file = path.join(m.modulePath, 'metadata.json');
						if (afs.exists(file)) {
							try {
								var metadata = JSON.parse(fs.readFileSync(file));
								metadata && Array.isArray(metadata.exports) && metadata.exports.forEach(this.addSymbol, this);
							} catch (e) {}
						}
					}, this);
					next();
				}.bind(this));
			},
			function (next) {
				var debuggerPlist = path.join(this.xcodeAppDir, 'debugger.plist');
				if (this.deployType == 'production' && afs.exists(debuggerPlist)) {
					this.logger.info(__('Removing %s from production build', 'debugger.plist'.cyan));
					fs.unlinkSync(debuggerPlist);
				}
				next();
			}
		], function () {
			parallel(this, [
				function (next) {
					// if development, then we're symlinking files and there's no need to anything below
					if (this.deployType == 'development') {
						return next();
					}
					
					// copy, analyze, and minify resources
					this.compileResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir);
					
					// for each module, copying modules images, if any
					if (this.tiModules.length) {
						this.logger.info(__('Processing module images'));
						this.tiModules.forEach(function (name) {
							this.compileResources(path.join(this.titaniumIosSdkPath, 'modules', name, 'images'), path.join(this.xcodeAppDir, 'modules', name, 'images'));
						}, this);
					}
					
					this.commonJsModules.forEach(function (m) {
						var file = path.join(m.modulePath, m.id + '.js');
						if (afs.exists(file)) {
							var id = 'modules/' + m.id.replace(/\./g, '_') + '_js';
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
					
					this.cli.fireHook('build.prerouting', this, function (err) {
						var args = [path.join(this.titaniumIosSdkPath, 'titanium_prep'), this.tiapp.id, this.assetsDir],
							out = '',
							child;
						
						this.logger.info(__('Running titanium_prep: %s', args.join(' ').cyan));
						this.jsFilesToPrepare.forEach(function (file) {
							this.logger.debug(__('Preparing %s', file.cyan));
						}, this);
						
						child = spawn(args.shift(), args);
						child.stdin.write(this.jsFilesToPrepare.join('\n'));
						child.stdin.end();
						child.stdout.on('data', function (data) {
							out += data.toString();
						});
						child.stderr.on('data', function (data) {
							out += data.toString();
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
									out,
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
						})).join('\n');
						
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