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
	Buffer = require('buffer').Buffer,
	wrench = require('wrench'),
	appc = require('node-appc'),
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
					'build-only': {
						abbr: 'b',
						default: false,
						desc: __('only perform the build; if true, does not install or run the app')
					},
					force: {
						abbr: 'f',
						default: false,
						desc: __('force a full rebuild')
					},
					xcode: {
						// secret flag to perform Xcode pre-compile build step
						default: false,
						hidden: true
					}
				},
				options: {
					'debug-host': {
						abbr: 'H',
						desc: __('debug connection info; airkey required for %s and %s, ignored for %s', 'device'.cyan, 'dist-adhoc'.cyan, 'dist-appstore'.cyan),
						hint: 'host:port[:airkey]'
					},
					'deploy-type': {
						abbr: 'D',
						desc: __('the type of deployment; only used with target is %s or %s', 'simulator'.cyan, 'device'.cyan),
						hint: __('type'),
						values: ['production', 'test', 'development']
					},
					'developer-name': {
						abbr: 'V',
						default: config.ios && config.ios.developerName && devNames.indexOf(config.ios.developerName) != -1 ? config.ios.developerName : undefined,
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
					'pp-uuid': {
						abbr: 'P',
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
								
								case 'dist-appstore':
								case 'dist-adhoc':
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
	
	if (cli.argv.xcode && process.env.SOURCE_ROOT) {
		cli.argv['project-dir'] = path.join(process.env.SOURCE_ROOT, '..', '..');
	}
	ti.validateProjectDir(logger, cli.argv, 'project-dir');
	
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
			});
			if (devNames.indexOf(cli.argv['developer-name']) == -1) {
				logger.error(__('Unable to find an iOS Developer Certificate for "%s"', cli.argv['developer-name']) + '\n');
				logger.log(__('Available developer names:'));
				devNames.forEach(function (name) {
					logger.log('    ' + name.cyan);
				});
				logger.log();
				appc.string.suggest(cli.argv['developer-name'], devNames, logger.log);
				process.exit(1);
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
	
	var deviceFamily = cli.argv['device-family'];
	if (!deviceFamily || !deviceFamilies[deviceFamily]) {
		logger.error(__('Invalid device family "%s"', deviceFamily) + '\n');
		appc.string.suggest(deviceFamily, Object.keys(deviceFamilies), logger.log, 3);
		process.exit(1);
	}
	
	if (cli.argv['debug-host'] && cli.argv.target != 'dist-appstore') {
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
	new build(logger, config, cli, finished);
};

function build(logger, config, cli, finished) {
	this.logger = logger;
	this.cli = cli;
	
	this.titaniumSdkVersion = ti.manifest.version;
	this.titaniumIosSdkPath = afs.resolvePath(path.dirname(module.filename), '..', '..');
	
	this.platformName = path.basename(this.titaniumIosSdkPath); // the name of the actual platform directory which will some day be "ios"
	
	this.projectDir = cli.argv['project-dir'];
	this.tiapp = new ti.tiappxml(path.join(this.projectDir, 'tiapp.xml'));
	this.target = cli.argv.target;
	this.provisioningProfileUUID = cli.argv['pp-uuid'];
	
	this.buildDir = path.join(this.projectDir, 'build', this.platformName);
	
	this.buildManifest = {};
	this.buildManifestFile = path.join(this.buildDir, 'Resources', 'build-manifest.json');
	
	this.debugHost = cli.argv['debug-host'];
	this.keychain = cli.argv.keychain;
	
	if (cli.argv.xcode) {
		this.deployType = process.env.CURRENT_ARCH === 'i386' ? 'development' : process.env.CONFIGURATION === 'Debug' ? 'test' : 'production';
	} else {
		this.deployType = /simulator|device/.test(this.target) && cli.argv['deploy-type'] ? cli.argv['deploy-type'] : deployTypes[this.target];
	}
	this.xcodeTarget = process.env.CONFIGURATION || (/device|simulator/.test(this.target) ? 'Debug' : 'Release');
	this.iosSdkVersion = cli.argv['ios-version'];
	this.iosSimVersion = cli.argv['sim-version'];
	this.deviceFamily = cli.argv['device-family'];
	this.xcodeTargetOS = this.target == 'simulator' ? 'iphonesimulator-' + this.iosSimVersion : 'iphoneos-' + this.iosSdkVersion;
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
	this.logger.debug(__('iOS development certificates: %s', iosEnv.certs.devNames.length ? iosEnv.certs.devNames.join(', ').cyan : __('not found').cyan));
	this.logger.debug(__('iOS distribution certificates: %s', iosEnv.certs.distNames.length ? iosEnv.certs.distNames.join(', ').cyan : __('not found').cyan));
	this.logger.debug(__('iOS WWDR certificate: %s', iosEnv.certs.wwdr ? __('installed').cyan : __('not found').cyan));
	
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
	
	if (cli.argv.xcode) {
		series(this, [
			'compileLocale',
			function (cb) {
				this.compileResources(true, cb);
			}
		], function () {
			finished();
			process.exit(0);
		});
		return;
	}
	
	/*
	SIMULATOR ONLY
	force_xcode is true if
	 - there's a native module DONE!
	 - project.xcconfig's appid != tiapp.xml's appid DONE!
	 - Info.plist's appid != tiapp.xml's appid DONE!
	 - debugger.plist changed (either didn't exist or debughost was toggled) DONE!
	 - recompile = copy_tiapp_properties(projectDir) is true DONE!
	*/
	
	this.architectures = 'armv6 armv7 i386';
	// no armv6 support above 4.3 or with 6.0+ SDK
	if (version.gte(cli.argv['ios-version'], '6.0')) {
		this.architectures = 'armv7 armv7s i386';
	} else if (version.gte(this.minIosVer, '4.3')) {
		this.architectures = 'armv7 i386';
	}
	this.logger.debug(__('Building for the following architectures: %s', this.architectures.cyan));
	
	// create the build directory (<project dir>/build/[iphone|ios])
	wrench.mkdirSyncRecursive(this.buildDir);
	
	// read the build manifest from the last time we built, if exists
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
		wrench.rmdirSyncRecursive(this.buildDir, true);
		wrench.mkdirSyncRecursive(this.xcodeAppDir);
	}
	
	// let's start building some apps!
	parallel(this, [
		'createInfoPlist',
		'createDebuggerPlist',
		'createEntitlementsPlist',
		'copySimulatorSpecificFiles',
		'compileLocale',
		'detectModules'
	], function () {
		series(this, [
			function (cb) {
				if (this.forceRebuild) {
					this.logger.info(__('Performing full rebuild'));
					this.forceXcode = true;
					this.createXcodeProject();
					this.injectMain();
					this.injectApplicationMods();
					this.compileResources(false, cb);
				} else if (this.target == 'simulator') {
					this.createSoftlinks();
					cb();
				}
			}
		], function () {
			this.injectPropertiesIntoApplicationDefaults();
			
			// only build if force rebuild (different version) or the app hasn't yet been built initially
			fs.writeFileSync(this.buildManifestFile, JSON.stringify(this.buildManifest = {
				target: this.target,
				iosSdkPath: this.titaniumIosSdkPath,
				appGuid: this.tiapp.guid,
				tiCoreHash: this.libTiCoreHash,
				modulesHash: this.modulesHash,
				gitHash: ti.manifest.githash
			}, null, '\t'));
			
			var xcodeCommand = [
				'xcodebuild',
				'-target ' + this.tiapp.name + xcodeTargetSuffixes[this.deviceFamily],
				'-configuration ' + this.xcodeTarget,
				'-sdk ' + this.xcodeTargetOS,
				'IPHONEOS_DEPLOYMENT_TARGET=' + this.minIosVer,
				'TARGETED_DEVICE_FAMILY=' + deviceFamilies[this.deviceFamily],
				'VALID_ARCHS=' + this.architectures
			];
			
			if (this.target == 'simulator') {
				xcodeCommand.push('GCC_PREPROCESSOR_DEFINITIONS=__LOG__ID__=' + this.tiapp.guid);
				xcodeCommand.push('DEPLOYTYPE=' + this.deployType);
				xcodeCommand.push('TI_DEVELOPMENT=1');
				xcodeCommand.push('DEBUG=1');
				xcodeCommand.push('TI_VERSION=' + ti.manifest.version);
			}
			
			if (/simulator|device|dist\-adhoc/.test(this.target)) {
				this.tiapp.ios && this.tiapp.ios.enablecoverage && xcodeCommand.push('KROLL_COVERAGE=1');
				this.debugHost && xcodeCommand.push('DEBUGGER_ENABLED=1');
			}
			
			if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
				xcodeCommand.push('GCC_PREPROCESSOR_DEFINITIONS=DEPLOYTYPE=' + this.deployType);
				xcodeCommand.push('PROVISIONING_PROFILE=' + this.provisioningProfileUUID);
				xcodeCommand.push('DEPLOYMENT_POSTPROCESSING=YES');
				this.keychain && xcodeCommand.push('OTHER_CODE_SIGN_FLAGS=--keychain ' + this.keychain);
				this.codeSignEntitlements && xcodeCommand.push('CODE_SIGN_ENTITLEMENTS=Resources/Entitlements.plist');
			}
			
			if (/device|dist\-adhoc/.test(this.target)) {
				xcodeCommand.push('TI_TEST=1');
			}
			
			if (this.target == 'device') {
				xcodeCommand.push('CODE_SIGN_IDENTITY=iPhone Developer: ' + cli.argv['developer-name']);
			}
			
			if (/dist-appstore|dist\-adhoc/.test(this.target)) {
				xcodeCommand.push('CODE_SIGN_IDENTITY=iPhone Distribution: ' + cli.argv['distribution-name']);
			}
			
			if (this.target == 'dist-appstore') {
				xcodeCommand.push('TI_PRODUCTION=1');
			}
			
			dump(xcodeCommand);
			
			cli.fireHook('postbuild', finished);
			
			/*
			exec(xcodeCommand.join(' '), {
				cwd: this.buildDir,
				env: {
					'DEVELOPER_DIR': this.xcodeEnv.path
				}
			}, function (err, stdout, stderr) {
				if (err) {
					logger.error('ERROR! ' + err);
					logger.info(stdout);
					logger.info(stderr);
				} else {
					logger.info('SUCCESS!');
					logger.info(stdout);
				}
				
				finished && finished();
			});
			*/
		});
	});
}

build.prototype = {
	
	copyDir: function (src, dest, opts) {
		afs.copyDirSyncRecursive(src, dest, opts || {
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
				iconName = (this.tiapp.appicon || 'appicon.png').replace(/(.+)(\..*)$/, '$1'),
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
					Object.keys(iphone.orientations).forEach(function (key) {
						var arr = plist['UISupportedInterfaceOrientations' + (key == 'ipad' ? '~ipad' : '')] = [];
						iphone.orientations[key].forEach(function (name) {
							arr.push(name);
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
			var appver = this.tiapp.version + (this.target != 'simulator' ? '.' + (new Date).getTime() : '');
			plist.CFBundleVersion = appc.version.format(appver || 1, 3);
			plist.CFBundleShortVersionString = appc.version.format(appver || 1, 3, 3);
			
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
		
		afs.copyFileSync(path.join(this.titaniumIosSdkPath, this.platformName, 'Titanium_Prefix.pch'), path.join(this.buildDir, this.tiapp.name + '_Prefix.pch'), { logger: this.logger.debug });
		
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
		
		proj = injectCompileShellScript(proj, 'Pre-Compile', '\\"' + this.cli.argv.$0.replace(/^node /, '') + '\\" build --platform ' + this.platformName + ' --sdk ' + this.titaniumSdkVersion + ' --xcode\\nexit $?')
		proj = injectCompileShellScript(proj, 'Post-Compile', "echo 'post-compile'")
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
		if (!this.tiapp.modules || !this.tiapp.modules.length) {
			this.logger.info(__('No Titanium Modules required, continuing'));
			callback();
			return;
		}
		
		ti.module.find(this.tiapp.modules, ['ios', 'iphone'], this.deployType, this.projectDir, this.logger, function (modules) {
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
			this.commonJsModules = [];
			this.nativeLibModules = [];
			
			modules.found.forEach(function (module) {
				if (module.platform == 'commonjs') {
					this.commonJsModules.push(module);
				} else {
					var manifest = module.manifest,
						id = manifest.moduleid.toLowerCase(),
						modulePath = module.modulePath,
						libFilename = 'lib' + id + '.a',
						libFile = module.libFile = path.join(modulePath, libFilename);
					
					if (!afs.exists(libFile)) {
						this.logger.error(__('Module %s version %s is missing library file: %s', module.id.cyan, (manifest.version || 'latest').cyan, libFile.cyan));
						process.exit(1);
					}
					
					this.logger.info(__('Detected third-party native iOS module: %s version %s', module.id.cyan, (manifest.version || 'latest').cyan));
					this.nativeLibModules.push(module);
					
					// since we have native modules, let's force a rebuild of the Xcode project
					this.forceXcode = true;
					
					if (afs.exists(modulePath, 'assets')) {
						// copy module resources
						this.copyDir(path.join(modulePath, 'assets'), path.join(this.xcodeAppDir, 'modules', id));
					}
				}
			}, this);
			
			callback();
		}.bind(this));
	},
	
	createDebuggerPlist: function (callback) {
		var parts = (this.debugHost || '').split(':'),
			plist = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'debugger.plist'))
						.toString()
						.replace(/__DEBUGGER_HOST__/g, parts.length > 0 ? parts[0] : '')
						.replace(/__DEBUGGER_PORT__/g, parts.length > 1 ? parts[1] : '')
						.replace(/__DEBUGGER_AIRKEY__/g, parts.length > 2 ? parts[2] : ''),
			dest = path.join(this.buildDir, 'Resources', 'debugger.plist'),
			changed = !afs.exists(dest) || fs.readFileSync(dest).toString() != plist;
		
		if (changed) {
			this.forceXcode = true;
			wrench.mkdirSyncRecursive(path.dirname(dest));
			fs.writeFileSync(dest, plist);
		}
		
		callback();
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
			fs.writeFileSync(path.join(this.buildDir, 'Resources', 'Entitlements.plist'), contents);
			this.codeSignEntitlements = true;
		}
		callback();
	},
	
	copySimulatorSpecificFiles: function (callback) {
		if (this.target == 'simulator') {
			// during simulator we need to copy in standard built-in module files
			// since we might not run the compiler on subsequent launches
			['facebook', 'ui'].forEach(function (name) {
				this.copyDir(path.join(this.titaniumIosSdkPath, 'modules', name, 'images'), path.join(this.xcodeAppDir, 'modules', name, 'images'));
			}, this);
			
			// when in simulator since we point to the resources directory, we need
			// to explicitly copy over any files
			['ios', 'iphone'].forEach(function (name) {
				var dir = path.join(this.projectDir, 'Resources', name);
				afs.exists(dir) && this.copyDir(dir, this.xcodeAppDir);
				
				dir = path.join(this.projectDir, 'platform', name);
				afs.exists(dir) && this.copyDir(dir, this.xcodeAppDir);
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
	
	injectPropertiesIntoApplicationDefaults: function () {
		var props = this.tiapp.properties,
			dest = path.join(this.projectDir, 'build', 'iphone', 'Classes', 'ApplicationDefaults.m');
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
		
		contents.push('@end');
		contents = contents.join('\n');
		
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
			this.forceXcode = true;
			this.logger.info(__('Writing properties to ApplicationDefaults.m'));
			fs.writeFileSync(dest, contents);
		}
	},
	
	compileLocale: function (callback) {
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
	
	injectMain: function () {
		var consts = {
				'__PROJECT_NAME__': this.tiapp.name,
				'__PROJECT_ID__': this.tiapp.id,
				'__DEPLOYTYPE__': this.deployType,
				'__APP_ID__': this.tiapp.id,
				'__APP_ANALYTICS__': '' + !!this.tiapp.analytics,
				'__APP_PUBLISHER__': this.tiapp.publisher,
				'__APP_URL__': this.tiapp.url,
				'__APP_NAME__': this.tiapp.name,
				'__APP_VERSION__': this.tiapp.version,
				'__APP_DESCRIPTION__': this.tiapp.description,
				'__APP_COPYRIGHT__': this.tiapp.copyright,
				'__APP_GUID__': this.tiapp.guid,
				'__APP_RESOURCE_DIR__': ''
			},
			destMain = path.join(this.buildDir, 'main.m'),
			newMainContents = fs.readFileSync(path.join(this.titaniumIosSdkPath, 'main.m')).toString().replace(/(__.+__)/g, function (match, key, format) {
				var s = consts.hasOwnProperty(key) ? consts[key] : key;
				return typeof s == 'string' ? s.replace(/"/g, '\\"') : s;
			});
		
		if (!afs.exists(destMain) || fs.readFileSync(destMain).toString() != newMainContents) {
			fs.writeFileSync(destMain, newMainContents);
		}
	},
	
	injectApplicationMods: function () {
		var xcconfig = [],
			variables = {},
			dest,
			contents = [
				'#import "ApplicationMods.h"',
				'',
				'@implementation ApplicationMods',
				'',
				'+ (NSArray*) compiledMods',
				'{',
				'	NSMutableArray *modules = [NSMutableArray array];'
			];
		
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
						xcconfig.push((name + '=' + xc[key]).replace(new RegExp('\$\(' + key + '\)', 'g'), '$(' + name + ')'));
					});
				}
			});
			
			contents.push('	[modules addObject:[NSDictionary dictionaryWithObjectsAndKeys:@\"' +
				moduleName + '\",@\"name\",@\"' +
				moduleId + '\",@\"moduleid\",@\"' +
				(m.manifest.version || '') + '\",@\"version\",@\"' +
				(m.manifest.guid || '') + '\",@\"guid\",@\"' +
				(m.manifest.licensekey || '') + '\",@\"licensekey\",nil]];'
			);
			
			if (afs.exists(file = path.join(m.modulePath, 'metadata.json'))) {
				// self.load_metadata(metadata_path)
			}
		});
		
		contents.push('	return modules;');
		contents.push('}\n');
		contents.push('@end');
		contents = contents.join('\n');
		
		// write the ApplicationMods.m file
		dest = path.join(this.buildDir, 'Classes', 'ApplicationMods.m');
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != contents) {
			this.logger.debug(__('Writing application modules file: %s', dest.cyan));
			fs.writeFileSync(dest, contents);
		} else {
			this.logger.debug(__('%s does not need to be updated', dest.cyan));
		}
		
		// write the module.xcconfig file
		Object.keys(variables).forEach(function (v) {
			xcconfig.push(v + '=$(inherited) ' + variables[v].map(function (x) { return '$(' + x + ') '; }).join(''));
		});
		xcconfig = xcconfig.join('\n');
		
		dest = path.join(this.buildDir, 'module.xcconfig');
		if (!afs.exists(dest) || fs.readFileSync(dest).toString() != xcconfig) {
			this.logger.debug(__('Writing module xcconfig file: %s', dest.cyan));
			fs.writeFileSync(dest, xcconfig);
		} else {
			this.logger.debug(__('%s does not need to be updated', dest.cyan));
		}
	},
	
	compileResources: function (isXcode, callback) {
		callback();
		
		/*
		var assetsDir = path.join(this.projectDir, 'build', 'iphone', 'assets'),
			compileResources = function (src, dest) {
				var jsFiles = [],
					compiledTargets = {};
				
				if (afs.exists(src)) {
					this.logger.debug(__('Copying resources %s => %s', src.cyan, dest.cyan));
					
					console.log(wrench.readdirSyncRecursive(src));
					
					/*
					for root, dirs, files in os.walk(source, True, None, True):
						for name in ignoreDirs:
							if name in dirs:
								dirs.remove(name)	# don't visit ignored directories
						for file in files:
							if file in ignoreFiles:
								continue
							prefix = root[len(source):]
							from_ = to_unicode_or_not(os.path.join(root, file))
							to_ = os.path.expanduser(from_.replace(source, target, 1))
							to_directory = os.path.expanduser(os.path.split(to_)[0])
							if not os.path.exists(to_directory):
								os.makedirs(to_directory)
							fp = os.path.splitext(file)
							ext = fp[1]
							if ext == '.jss': continue
							if len(fp)>1 and ext in ['.html','.js','.css']:
								path = prefix + os.sep + file
								path = path[1:]
								entry = {'path':path,'from':from_,'to':to_}
								if compiled_targets.has_key(ext):
									compiled_targets[ext].append(entry)
								else:
									compiled_targets[ext]=[entry]
							if not isProd:
								# only copy if different filesize or doesn't exist
								if not os.path.exists(to_) or os.path.getsize(from_)!=os.path.getsize(to_):
									print "[DEBUG] copying: %s to %s" % (from_,to_)
									shutil.copyfile(from_, to_)
			
					if compiled_targets.has_key('.html'):
						compiled = self.process_html_files(compiled_targets,source)
						if len(compiled) > 0:
							for c in compiled:
								from_ = c['from']
								to_ = c['to']
								path = c['path']
								print "[DEBUG] copying: %s to %s" % (from_,to_)
								file_contents = open(from_).read()
								file_contents = jspacker.jsmin(file_contents)
								file_contents = file_contents.replace('Titanium.','Ti.')
								to = open(to_,'w')
								to.write(file_contents)
								to.close()
			
					for ext in ('.css','.html'):
						if compiled_targets.has_key(ext):
							for css_file in compiled_targets[ext]:
								from_ = css_file['from']
								to_ = css_file['to']
								print "[DEBUG] copying: %s to %s" % (from_,to_)
								if path.endswith('.css'):
									file_contents = open(from_).read()
									packer = CSSPacker(file_contents)
									file_contents = packer.pack()
									to = open(to_,'w')
									to.write(file_contents)
									to.close()
								else:
									shutil.copyfile(from_, to_)
			
					if compiled_targets.has_key('.js'):
						for js_file in compiled_targets['.js']:
							self.compile_js_asset_file(js_file['path'].replace('.','_'), js_file['from'])
							jsFiles.append(path);
					
					* /
				}
				
				return jsFiles;
			}.bind(this);
		
		afs.exists(assetsDir) || wrench.mkdirSyncRecursive(assetsDir);
		
		['Resources', 'platform'].forEach(function (lvl1) {
			['ios', 'iphone'].forEach(function (lvl2) {
				compileResources(path.join(this.projectDir, lvl1, lvl2), this.xcodeAppDir);
			}, this);
		}, this);
		
		/*
		function copy(src, dest) {
			return function (cb) {
				var jsFiles = [];
				
				afs.exists(dest) || wrench.mkdirSyncRecursive(dest);
				
				compileResources(src, dest, jsFiles);
				
				this.commonJsModules.forEach(function (module) {
					// compileJsFile(js_file['path'], js_file['from'], jsFiles)
					//self.compile_js_asset_file(js_file['path'].replace('.','_'), js_file['from'])
					//js_files.append(path);
				}, this);
				
				if (this.deployType == 'production') {
					var child = exec(path.join(this.titaniumIosSdkPath, 'titanium_prep') + ' ' + this.tiapp.id + ' ' + assetsDir, function (err, stdout, stderr) {
						fs.writeFileSync(path.join(this.projectDir, 'build', 'iphone', 'Classes', 'ApplicationRouting.h'), [
							'/**',
							' * Appcelerator Titanium Mobile',
							' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
							' * Licensed under the terms of the Apache Public License',
							' * Please see the LICENSE included with this distribution for details.',
							' *',
							' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
/////							' * /',
							'',
							'@interface ApplicationRouting : NSObject {',
							'}',
							'+ (NSData*) resolveAppAsset:(NSString*)path;',
							'',
							'@end'
						].join('\n'));
						
						fs.writeFileSync(path.join(this.projectDir, 'build', 'iphone', 'Classes', 'ApplicationRouting.m'), [
							'/**',
							' * Appcelerator Titanium Mobile',
							' * Copyright (c) 2009-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
							' * Licensed under the terms of the Apache Public License',
							' * Please see the LICENSE included with this distribution for details.',
							' *',
							' * WARNING: This is generated code. Do not modify. Your changes *will* be lost.',
/////////							' * /',
							'',
							'#import "ApplicationRouting.h"',
							'',
							'extern NSData* filterDataInRange(NSData* thedata, NSRange range);',
							'',
							'@implementation ApplicationRouting',
							'',
							'+ (NSData*) resolveAppAsset:(NSString*)path;',
							'{',
								err ? '' : stdout,
							'	NSNumber *index = [map objectForKey:path];',
							'	if (index == nil) { return nil; }',
							'	return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);',
							'}',
							'',
							'@end'
						].join('\n'));
						
						cb();
					});
					
					child.stdin = jsFiles.join('\n');
				} else {
					cb();
				}
			};
		}
		
		series(this, [
			//
		], function () {
			/*
			for metadata in self.modules_metadata:
				tp_dir = os.path.join(metadata['dir'],'assets')
				if not os.path.exists(tp_dir): continue
				tp_id = metadata['id']
				t = '%s/modules/%s' %(target,tp_id)
				copyCompiledResources(tp_dir, t);
			* /
			
			callback();
		});
		*/
	},
	
	createSoftlinks: function () {
		var ignoreRegExp = /^\.gitignore|\.cvsignore|\.DS_Store|\.git|\.svn|_svn|CVS$/,
			softlinkResources = function (src, dest, doIgnoreDirs) {
				if (afs.exists(src)) {
					this.logger.debug(__('Walking directory %s', src.cyan));
					wrench.mkdirSyncRecursive(dest);
					fs.readdirSync(src).forEach(function (file) {
						if (!ignoreRegExp.test(file) && (!doIgnoreDirs || ti.filterPlatforms(this.platformName).indexOf(file) == -1)) {
							var srcFile = path.join(src, file),
								destFile = path.join(dest, file);
							if (fs.lstatSync(srcFile).isDirectory()) {
								softlinkResources(srcFile, destFile);
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
		
		softlinkResources(path.join(this.projectDir, 'Resources'), this.xcodeAppDir, true);
		softlinkResources(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir, false);
		softlinkResources(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir, false);
		softlinkResources(path.join(this.projectDir, 'modules', 'ios'), destModulesDir, true);
		softlinkResources(path.join(this.projectDir, 'modules', 'iphone'), destModulesDir, true);
		
		// reset the application routing
		wrench.mkdirSyncRecursive(path.join(this.buildDir, 'iphone', 'Classes'));
		fs.writeFileSync(path.join(this.buildDir, 'iphone', 'Classes', 'ApplicationRouting.m'), [
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
		].join('\n'));
	}

};