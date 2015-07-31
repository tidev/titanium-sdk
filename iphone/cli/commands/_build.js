/**
 * iOS build command.
 *
 * @module cli/_build
 *
 * @copyright
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	bufferEqual = require('buffer-equal'),
	Builder = require('titanium-sdk/lib/builder'),
	CleanCSS = require('clean-css'),
	cyan = require('colors').cyan,
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs'),
	humanize = require('humanize'),
	ioslib = require('ioslib'),
	iosPackageJson = appc.pkginfo.package(module),
	jsanalyze = require('titanium-sdk/lib/jsanalyze'),
	moment = require('moment'),
	path = require('path'),
	spawn = require('child_process').spawn,
	ti = require('titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
	wrench = require('wrench'),
	xcode = require('xcode'),
	xcodeParser = require('xcode/lib/parser/pbxproj')
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	parallel = appc.async.parallel,
	series = appc.async.series,
	version = appc.version;

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
		universal: '1,2',
		watch: '4'
	};

	// populated the first time getDeviceFamily() is called
	this.deviceFamily = null;

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
		'resources',
		'plugins',
		'watch'
	];

	this.graylistDirectories = [
		'frameworks'
	];

	this.ipadLaunchImages = [
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

	this.templatesDir = path.join(this.platformPath, 'templates', 'build');

	this.tiSymbols = {};

	// when true, uses the JavaScriptCore that ships with iOS instead of the original Titanium version
	this.useJSCore = false;

	// populated the first time getDeviceInfo() is called
	this.deviceInfoCache = null;

	// cache of provisioning profiles
	this.provisioningProfileLookup = {};

	// list of all extensions (including watch apps)
	this.extensions = [];

	// simulator handles; only used when --target is simulator
	this.simHandle = null;
	this.watchSimHandle = null;

	// when true and building an app with a watch extension for the simulator and the --launch-watch-app
	// flag is passed in, then show the external display and launch the watch app
	this.hasWatchAppV1 = false;
	this.hasWatchAppV2orNewer = false;

	// if this app has any watch apps, then we need to know the min watchOS version for one of them
	// so that we can select a watch simulator
	this.watchMinOSVersion = null;

	// the parsed build manifest from the previous build
	this.previousBuildManifest = {};

	// contains the current build's info
	this.currentBuildManifest = {
		files: {}
	};

	// when true, the entire build dir is nuked at the start of the build
	this.forceCleanBuild = false;

	// when true, calls xcodebuild
	this.forceRebuild = false;

	// a list of relative paths to js files that need to be encrypted
	// note: the filename will have all periods replaced with underscores
	this.jsFilesToEncrypt = [];

	// set to true if any js files changed so that we can trigger encryption to run
	this.jsFilesChanged = false;

	// an array of products (Xcode targets) being built
	this.products = [];
}

util.inherits(iOSBuilder, Builder);

iOSBuilder.prototype.assertIssue = function assertIssue(issues, name) {
	var i = 0,
		len = issues.length;
	for (; i < len; i++) {
		if ((typeof name === 'string' && issues[i].id === name) || (typeof name === 'object' && name.test(issues[i].id))) {
			this.logger.banner();
			appc.string.wrap(issues[i].message, this.config.get('cli.width', 100)).split('\n').forEach(function (line, i, arr) {
				this.logger.error(line.replace(/(__(.+?)__)/g, '$2'.bold));
				if (!i && arr.length > 1) this.logger.log();
			}, this);
			this.logger.log();
			process.exit(1);
		}
	}
};

iOSBuilder.prototype.getDeviceInfo = function getDeviceInfo() {
	if (this.deviceInfoCache) {
		return this.deviceInfoCache;
	}

	var argv = this.cli.argv,
		deviceInfo = {
			devices: [],
			udids: {},
			maxName: 0,
			preferred: null
		};

	if (argv.target === 'device') {
		// build the list of devices
		this.iosInfo.devices.forEach(function (device) {
			device.name.length > deviceInfo.maxName && (deviceInfo.maxName = device.name.length);
			deviceInfo.devices.push({
				udid: device.udid,
				name: device.name,
				deviceClass: device.deviceClass,
				productVersion: device.productVersion
			});
			deviceInfo.udids[device.udid] = device;
		});

		if (this.config.get('ios.autoSelectDevice', true) && !argv['device-id']) {
			deviceInfo.preferred = deviceInfo.devices[0];
		}
	} else if (argv.target === 'simulator') {
		deviceInfo.devices = {};

		// build the list of simulators
		Object.keys(this.iosInfo.simulators.ios).sort().reverse().forEach(function (ver) {
			deviceInfo.devices[ver] || (deviceInfo.devices[ver] = []);
			this.iosInfo.simulators.ios[ver].forEach(function (sim) {
				sim.name.length > deviceInfo.maxName && (deviceInfo.maxName = sim.name.length);
				deviceInfo.devices[ver].push({
					udid: sim.udid,
					name: sim.name,
					deviceClass: sim.family,
					model: sim.model,
					productVersion: ver
				});
				deviceInfo.udids[sim.udid] = sim;

				// see if we should prefer this simulator
				if (this.config.get('ios.autoSelectDevice', true) && argv['ios-version'] && !argv['device-id']) {
					deviceInfo.preferred = deviceInfo.devices[argv['ios-version']] && deviceInfo.devices[argv['ios-version']][0];
				}
			}, this);
		}, this);
	}

	return this.deviceInfoCache = deviceInfo;
};

iOSBuilder.prototype.getDeviceFamily = function getDeviceFamily() {
	if (this.deviceFamily) {
		return deviceFamily;
	}

	var deviceFamily = this.cli.argv['device-family'],
		deploymentTargets = this.cli.tiapp && this.cli.tiapp['deployment-targets'];

	if (!deviceFamily && deploymentTargets) {
		// device family was not an environment variable, construct via the tiapp.xml's deployment targets
		if (deploymentTargets.iphone && deploymentTargets.ipad) {
			deviceFamily = this.cli.argv.$originalPlatform === 'ipad' ? 'ipad' : 'universal';
		} else if (deploymentTargets.iphone) {
			deviceFamily = 'iphone';
		} else if (deploymentTargets.ipad) {
			deviceFamily = 'ipad';
		}
	}

	return this.deviceFamily = deviceFamily;
};

/**
 * Returns iOS build-specific configuration options.
 *
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 *
 * @returns {Function|undefined} A function that returns the config info or undefined
 */
iOSBuilder.prototype.config = function config(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);

	var _t = this;

	// we hook into the pre-validate event so that we can stop the build before
	// prompting if we know the build is going to fail.
	cli.on('cli:pre-validate', function (obj, callback) {
		if (cli.argv.platform && !/^(ios|iphone|ipad)$/i.test(cli.argv.platform)) {
			return callback();
		}

		// check that the iOS environment is found and sane
		this.assertIssue(this.iosInfo.issues, 'IOS_XCODE_NOT_INSTALLED');
		this.assertIssue(this.iosInfo.issues, 'IOS_NO_SUPPORTED_XCODE_FOUND');
		this.assertIssue(this.iosInfo.issues, 'IOS_NO_IOS_SDKS');
		this.assertIssue(this.iosInfo.issues, 'IOS_NO_IOS_SIMS');

		callback();
	}.bind(this));

	return function (done) {
		ioslib.detect({
			// env
			xcodeSelect:       config.get('osx.executables.xcodeSelect'),
			security:          config.get('osx.executables.security'),
			// provisioning
			profileDir:        config.get('ios.profileDir'),
			// xcode
			searchPath:        config.get('paths.xcode'),
			minIosVersion:     iosPackageJson.minIosVersion,
			supportedVersions: iosPackageJson.vendorDependencies.xcode
		}, function (err, iosInfo) {
			this.iosInfo = iosInfo;

			// add itunes sync
			iosInfo.devices.push({
				udid: 'itunes',
				name: 'iTunes Sync'
			});

			// we have more than 1 device plus itunes, so we should show 'all'
			if (iosInfo.devices.length > 2) {
				iosInfo.devices.push({
					udid: 'all',
					name: 'All Devices'
				});
			}

			// get the all installed iOS SDKs and Simulators across all Xcode versions
			var allSdkVersions = {},
				sdkVersions = {},
				simVersions = {};
			Object.keys(iosInfo.xcode).forEach(function (ver) {
				if (iosInfo.xcode[ver].supported) {
					iosInfo.xcode[ver].sdks.forEach(function (sdk) {
						allSdkVersions[sdk] = 1;
						if (version.gte(sdk, this.minSupportedIosSdk)) {
							sdkVersions[sdk] = 1;
						}
					}, this);
					iosInfo.xcode[ver].sims.forEach(function (sim) {
						simVersions[sim] = 1;
					});
				}
			}, this);
			this.iosAllSdkVersions = version.sort(Object.keys(allSdkVersions));
			this.iosSdkVersions = version.sort(Object.keys(sdkVersions));

			cli.createHook('build.ios.config', function (callback) {
				callback(null, {
					flags: {
						'force-copy': {
							desc: __('forces files to be copied instead of symlinked for %s builds only', 'simulator'.cyan)
						},
						'force-copy-all': {
							desc: __('identical to the %s flag, except this will also copy the %s libTiCore.a file', '--force-copy',
								humanize.filesize(fs.statSync(path.join(_t.platformPath, 'libTiCore.a')).size, 1024, 1).toUpperCase().cyan)
						},
						'launch-watch-app': {
							desc: __('for %s builds, after installing an app with a watch extention, launch the watch app and the main app', 'simulator'.cyan)
						},
						'launch-watch-app-only': {
							desc: __('for %s builds, after installing an app with a watch extention, launch the watch app instead of the main app', 'simulator'.cyan)
						},
						'sim-focus': {
							default: true,
							desc: __('focus the iOS Simulator')
						},
						'xcode': {
							// DEPRECATED
							// secret flag to perform Xcode pre-compile build step
							callback: function (value) {
								if (value) {
									// we deprecated the --xcode flag which was passed in during the Xcode pre-compile phase
									logger.error(__('The generated Titanium Xcode project is too old.'));
									logger.error(__('Please clean and rebuild the project.'));
									process.exit(1);
								}
							},
							hidden: true
						}
					},
					options: {
						'build-type': {
							hidden: true
						},
						'debug-host': {
							hidden: true
						},
						'deploy-type':                this.configOptionDeployType(100),
						'device-id':                  this.configOptionDeviceID(210),
						'developer-name':             this.configOptionDeveloperName(170),
						'distribution-name':          this.configOptionDistributionName(180),
						'device-family':              this.configOptionDeviceFamily(120),
						'ios-version':                this.configOptioniOSVersion(130),
						'keychain':                   this.configOptionKeychain(),
						'launch-bundle-id':           this.configOptionLaunchBundleId(),
						'launch-url': {
							// url for the application to launch in mobile Safari, as soon as the app boots up
							hidden: true
						},
						'output-dir':                 this.configOptionOutputDir(200),
						'pp-uuid':                    this.configOptionPPuuid(190),
						'profiler-host': {
							hidden: true
						},
						'target':                     this.configOptionTarget(110),
						'watch-app-name':             this.configOptionWatchAppName(212),
						'watch-device-id':            this.configOptionWatchDeviceId(215)
					}
				});
			}.bind(this))(function (err, result) {
				done(_t.conf = result);
			});
		}.bind(this)); // end of ioslib.detect()
	}.bind(this);
};

/**
 * Defines the --deploy-type option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionDeployType = function configOptionDeployType(order) {
	return {
		abbr: 'D',
		desc: __('the type of deployment; only used when target is %s or %s', 'simulator'.cyan, 'device'.cyan),
		hint: __('type'),
		order: order,
		values: ['test', 'development']
	};
};

/**
 * Defines the --device-id option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionDeviceID = function configOptionDeviceID(order) {
	return {
		abbr: 'C',
		desc: __('the udid of the iOS simulator or iOS device to install the application to; for %s builds %s',
			'device'.cyan, ('[' + 'itunes'.bold + ', <udid>, all]').grey),
		hint: __('udid'),
		order: order,
		helpNoPrompt: function (logger, msg) {
			// if prompting is disabled and there's a problem, then help will use this function to display details
			logger.error(msg);
			var info = this.getDeviceInfo();
			if (info.devices) {
				if (this.cli.argv.target === 'device') {
					logger.log('\n' + __('Available iOS Devices:'));
					info.devices.forEach(function (sim) {
						logger.log('  ' + (info.devices.length > 1 ? appc.string.rpad(sim.udid, 40) : sim.udid).cyan + '  ' + sim.name);
					});
					logger.log();
				} else {
					logger.log('\n' + __('Available iOS Simulators:'));
					Object.keys(info.devices).forEach(function (ver) {
						logger.log(String(ver).grey);
						info.devices[ver].forEach(function (sim) {
							logger.log('  ' + sim.udid.cyan + '  ' + sim.name);
						});
						logger.log();
					});
				}
			}
		}.bind(this),
		prompt: function (callback) {
			var info = this.getDeviceInfo();
			if (info.preferred) {
				this.cli.argv['device-id'] = info.preferred.udid;
				return callback();
			}

			var options = {},
				maxName = 0,
				maxDesc = 0;

			// build a filtered list of simulators based on any legacy options/flags
			if (Array.isArray(info.devices)) {
				options = info.devices;
				info.devices.forEach(function (d) {
					if (d.name.length > maxName) {
						maxName = d.name.length;
					}
					var s = d.deviceClass ? (d.deviceClass + ' (' + d.productVersion + ')') : '';
					if (s.length > maxDesc) {
						maxDesc = s.length;
					}
				});
			} else {
				Object.keys(info.devices).forEach(function (sdk) {
					info.devices[sdk].forEach(function (sim) {
						options[sdk] || (options[sdk] = []);
						options[sdk].push(sim);
						if (sim.name.length > maxName) {
							maxName = sim.name.length;
						}
					});
				});
			}

			var params = {
				formatters: {},
				default: '1', // just default to the first one, whatever that will be
				autoSelectOne: true,
				margin: '',
				optionLabel: 'name',
				optionValue: 'udid',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: true,
				options: options
			};

			if (this.cli.argv.target === 'device') {
				// device specific settings
				params.title = __('Which device do you want to install your app on?');
				params.promptLabel = __('Select an device by number or name');
				params.formatters.option = function (opt, idx, num) {
					return '  ' + num + [
						appc.string.rpad(opt.name, info.maxName).cyan,
						appc.string.rpad(opt.deviceClass ? opt.deviceClass + ' (' + opt.productVersion + ')' : '', maxDesc),
						opt.udid.grey
					].join('  ');
				};
			} else if (this.cli.argv.target === 'simulator') {
				// simulator specific settings
				params.title = __('Which simulator do you want to launch your app in?');
				params.promptLabel = __('Select an simulator by number or name');
				params.formatters.option = function (opt, idx, num) {
					return '  ' + num + appc.string.rpad(opt.name, maxName).cyan + '  ' + opt.udid.grey;
				};
			}

			callback(fields.select(params));
		}.bind(this),
		required: true,
		validate: function (udid, callback) {
			// this function is called if they specify a --device-id and we need to check that it is valid
			if (typeof udid === 'boolean') {
				return callback(true);
			}

			if (this.cli.argv.target === 'device' && udid === 'all') {
				// we let 'all' slide by
				return callback(null, udid);
			}

			var info = this.getDeviceInfo();
			if (info.udids[udid]) {
				callback(null, udid)
			} else {
				callback(new Error(this.cli.argv.target === 'device' ? __('Invalid iOS device "%s"', udid) : __('Invalid iOS simulator "%s"', udid)));
			}
		}.bind(this),
		verifyIfRequired: function (callback) {
			// this function is called by the CLI when the option is not specified and is required (i.e. missing).
			// the CLI will then double check that this option is still required by calling this function
			if (this.cli.argv['build-only']) {
				// not required if we're build only
				return callback();
			}

			if (this.cli.argv['device-id'] === undefined && this.config.get('ios.autoSelectDevice', true) && (this.cli.argv.target === 'simulator' || this.cli.argv.target === 'device')) {
				// --device-id not specified and we're not prompting, so pick a device later
				callback();
			} else {
				// yup, still required
				callback(true);
			}
		}.bind(this)
	};
};

/**
 * Defines the --developer-name option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionDeveloperName = function configOptionDeveloperName(order) {
	var cli = this.cli,
		iosInfo = this.iosInfo,
		developerCertLookup = {};

	Object.keys(iosInfo.certs.keychains).forEach(function (keychain) {
		(iosInfo.certs.keychains[keychain].developer || []).forEach(function (d) {
			if (!d.invalid) {
				developerCertLookup[d.name.toLowerCase()] = d.name;
			}
		});
	});

	return {
		abbr: 'V',
		default: this.config.get('ios.developerName'),
		desc: __('the iOS Developer Certificate to use; required when target is %s', 'device'.cyan),
		hint: 'name',
		order: order,
		prompt: function (callback) {
			var developerCerts = {},
				maxDevCertLen = 0;

			Object.keys(iosInfo.certs.keychains).forEach(function (keychain) {
				(iosInfo.certs.keychains[keychain].developer || []).forEach(function (d) {
					if (!d.invalid) {
						Array.isArray(developerCerts[keychain]) || (developerCerts[keychain] = []);
						developerCerts[keychain].push(d);
						maxDevCertLen = Math.max(d.name.length, maxDevCertLen);
					}
				});
			});

			// sort the certs
			Object.keys(developerCerts).forEach(function (keychain) {
				developerCerts[keychain] = developerCerts[keychain].sort(function (a, b) {
					return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
				});
			});

			callback(fields.select({
				title: __("Which developer certificate would you like to use?"),
				promptLabel: __('Select a certificate by number or name'),
				formatters: {
					option: function (opt, idx, num) {
						var expires = moment(opt.after),
							day = expires.format('D'),
							hour = expires.format('h');
						return '  ' + num + appc.string.rpad(opt.name, maxDevCertLen + 1).cyan
							+ (opt.after ? (' (' + __('expires %s', expires.format('MMM') + ' '
							+ (day.length === 1 ? ' ' : '') + day + ', ' + expires.format('YYYY') + ' '
							+ (hour.length === 1 ? ' ' : '') + hour + ':' + expires.format('mm:ss a'))
							+ ')').grey : '');
					}
				},
				margin: '',
				optionLabel: 'name',
				optionValue: 'name',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: false,
				options: developerCerts
			}));
		},
		validate: function (value, callback) {
			if (typeof value === 'boolean') {
				return callback(true);
			}
			if (cli.argv.target !== 'device') {
				return callback(null, value);
			}
			if (value) {
				var v = developerCertLookup[value.toLowerCase()];
				if (v) {
					return callback(null, v);
				}
			}
			callback(new Error(__('Invalid developer certificate "%s"', value)));
		}
	};
};

/**
 * Defines the --distribution-name option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionDistributionName = function configOptionDistributionName(order) {
	var cli = this.cli,
		iosInfo = this.iosInfo,
		distributionCertLookup = {};

	Object.keys(iosInfo.certs.keychains).forEach(function (keychain) {
		(iosInfo.certs.keychains[keychain].distribution || []).forEach(function (d) {
			if (!d.invalid) {
				distributionCertLookup[d.name.toLowerCase()] = d.name;
			}
		});
	});

	return {
		abbr: 'R',
		default: this.config.get('ios.distributionName'),
		desc: __('the iOS Distribution Certificate to use; required when target is %s or %s', 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
		hint: 'name',
		order: order,
		prompt: function (callback) {
			var distributionCerts = {},
				maxDistCertLen = 0;

			Object.keys(iosInfo.certs.keychains).forEach(function (keychain) {
				(iosInfo.certs.keychains[keychain].distribution || []).forEach(function (d) {
					if (!d.invalid) {
						Array.isArray(distributionCerts[keychain]) || (distributionCerts[keychain] = []);
						distributionCerts[keychain].push(d);
						maxDistCertLen = Math.max(d.name.length, maxDistCertLen);
					}
				});
			});

			// sort the certs
			Object.keys(distributionCerts).forEach(function (keychain) {
				distributionCerts[keychain] = distributionCerts[keychain].sort(function (a, b) {
					return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
				});
			});

			callback(fields.select({
				title: __("Which distribution certificate would you like to use?"),
				promptLabel: __('Select a certificate by number or name'),
				formatters: {
					option: function (opt, idx, num) {
						var expires = moment(opt.after),
							day = expires.format('D'),
							hour = expires.format('h');
						return '  ' + num + appc.string.rpad(opt.name, maxDistCertLen + 1).cyan
							+ (opt.after ? (' (' + __('expires %s', expires.format('MMM') + ' '
							+ (day.length === 1 ? ' ' : '') + day + ', ' + expires.format('YYYY') + ' '
							+ (hour.length === 1 ? ' ' : '') + hour + ':' + expires.format('mm:ss a'))
							+ ')').grey : '');
					}
				},
				margin: '',
				optionLabel: 'name',
				optionValue: 'name',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: false,
				options: distributionCerts
			}));
		},
		validate: function (value, callback) {
			if (typeof value === 'boolean') {
				return callback(true);
			}
			if (cli.argv.target !== 'dist-appstore' && cli.argv.target !== 'dist-adhoc') {
				return callback(null, value);
			}
			if (value) {
				var v = distributionCertLookup[value.toLowerCase()];
				if (v) {
					return callback(null, v);
				}
			}
			callback(new Error(__('Invalid distribution certificate "%s"', value)));
		}
	};
};

/**
 * Defines the --device-family option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionDeviceFamily = function configOptionDeviceFamily(order) {
	return {
		abbr: 'F',
		desc: __('the device family to build for'),
		order: order,
		values: Object.keys(this.deviceFamilies)
	};
};

/**
 * Defines the --ios-version option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptioniOSVersion = function configOptioniOSVersion(order) {
	var _t = this;

	return {
		abbr: 'I',
		callback: function (value) {
			try {
				if (value && _t.iosAllSdkVersions.indexOf(value) !== -1 && version.lt(value, _t.minSupportedIosSdk)) {
					logger.banner();
					logger.error(__('The specified iOS SDK version "%s" is not supported by Titanium %s', value, _t.titaniumSdkVersion) + '\n');
					if (_t.iosSdkVersions.length) {
						logger.log(__('Available supported iOS SDKs:'));
						_t.iosSdkVersions.forEach(function (ver) {
							logger.log('   ' + ver.cyan);
						});
						logger.log();
					}
					process.exit(1);
				}
			} catch (e) {
				// squelch and let the cli detect the bad version
			}
		},
		desc: __('iOS SDK version to build with'),
		order: order,
		prompt: function (callback) {
			callback(fields.select({
				title: __("Which iOS SDK version would you like to build with?"),
				promptLabel: __('Select an iOS SDK version by number or name'),
				margin: '',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: false,
				options: _t.iosSdkVersions
			}));
		},
		values: _t.iosSdkVersions
	};
};

/**
 * Defines the --keychain option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionKeychain = function configOptionKeychain() {
	return {
		abbr: 'K',
		desc: __('path to the distribution keychain to use instead of the system default; only used when target is %s, %s, or %s', 'device'.cyan, 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
		hideValues: true,
		validate: function (value, callback) {
			value && typeof value !== 'string' && (value = null);
			if (value && !fs.existsSync(value)) {
				callback(new Error(__('Unable to find keychain: %s', value)));
			} else {
				callback(null, value);
			}
		}
	};
};

/**
 * Defines the --launch-bundle-id option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionLaunchBundleId = function configOptionLaunchBundleId() {
	return {
		desc: __('after installing the app, launch an different app instead; only used when target is %s', 'simulator'.cyan),
		hint: __('id')
	};
};

/**
 * Defines the --output-dir option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionOutputDir = function configOptionOutputDir(order) {
	var _t = this,
		cli = this.cli;

	function validate(outputDir, callback) {
		callback(outputDir || !_t.conf.options['output-dir'].required ? null : new Error(__('Invalid output directory')), outputDir);
	}

	return {
		abbr: 'O',
		desc: __('the output directory when using %s', 'dist-adhoc'.cyan),
		hint: 'dir',
		order: order,
		prompt: function (callback) {
			callback(fields.file({
				promptLabel: __('Where would you like the output IPA file saved?'),
				default: cli.argv['project-dir'] && appc.fs.resolvePath(cli.argv['project-dir'], 'dist'),
				complete: true,
				showHidden: true,
				ignoreDirs: _t.ignoreDirs,
				ignoreFiles: /.*/,
				validate: validate
			}));
		},
		validate: validate
	};
};

/**
 * Defines the --pp-uuid option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionPPuuid = function configOptionPPuuid(order) {
	var _t = this,
		cli = this.cli,
		iosInfo = this.iosInfo;

	return {
		abbr: 'P',
		desc: __('the provisioning profile uuid; required when target is %s, %s, or %s', 'device'.cyan, 'dist-appstore'.cyan, 'dist-adhoc'.cyan),
		hint: 'uuid',
		order: order,
		prompt: function (callback) {
			var provisioningProfiles = {},
				appId = cli.tiapp.id,
				maxAppId = 0,
				pp;

			function prep(a) {
				return a.filter(function (p) {
					if (!p.expired) {
						var re = new RegExp(p.appId.replace(/\./g, '\\.').replace(/\*/g, '.*'));
						if (re.test(appId)) {
							var label = p.name;
							if (label.indexOf(p.appId) === -1) {
								label += ': ' + p.appId;
							}
							p.label = label;
							maxAppId = Math.max(p.label.length, maxAppId);
							return true;
						}
					}
				}).sort(function (a, b) {
					return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
				});
			}

			if (cli.argv.target === 'device') {
				if (iosInfo.provisioning.development.length) {
					pp = prep(iosInfo.provisioning.development);
					if (pp.length) {
						provisioningProfiles[__('Available Development UUIDs:')] = pp;
					} else {
						logger.error(__('Unable to find any non-expired development provisioning profiles that match the app id "%s"', appId) + '\n');
						logger.log(__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
							'http://appcelerator.com/ios-dev-certs'.cyan) + '\n');
						process.exit(1);
					}
				} else {
					logger.error(__('Unable to find any development provisioning profiles') + '\n');
					logger.log(__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
						'http://appcelerator.com/ios-dev-certs'.cyan) + '\n');
					process.exit(1);
				}
			} else if (cli.argv.target === 'dist-appstore' || cli.argv.target === 'dist-adhoc') {
				if (iosInfo.provisioning.distribution.length || iosInfo.provisioning.adhoc.length) {
					pp = prep(iosInfo.provisioning.distribution);
					var valid = pp.length;
					if (pp.length) {
						provisioningProfiles[__('Available Distribution UUIDs:')] = pp;
					}

					pp = prep(iosInfo.provisioning.adhoc);
					valid += pp.length;
					if (pp.length) {
						provisioningProfiles[__('Available Adhoc UUIDs:')] = pp;
					}

					if (!valid) {
						logger.error(__('Unable to find any non-expired distribution or adhoc provisioning profiles that match the app id "%s".', appId) + '\n');
						logger.log(__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
							'http://appcelerator.com/ios-dist-certs'.cyan) + '\n');
						process.exit(1);
					}
				} else {
					logger.error(__('Unable to find any distribution or adhoc provisioning profiles'));
					logger.log(__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
						'http://appcelerator.com/ios-dist-certs'.cyan) + '\n');
					process.exit(1);
				}
			}

			callback(fields.select({
				title: __("Which provisioning profile would you like to use?"),
				promptLabel: __('Select a provisioning profile UUID by number or name'),
				formatters: {
					option: function (opt, idx, num) {
						var expires = moment(opt.expirationDate),
							day = expires.format('D'),
							hour = expires.format('h');
						return '  ' + num + String(opt.uuid).cyan + ' '
							+ appc.string.rpad(opt.label, maxAppId + 1)
							+ (opt.expirationDate ? (' (' + __('expires %s', expires.format('MMM') + ' '
							+ (day.length === 1 ? ' ' : '') + day + ', ' + expires.format('YYYY') + ' '
							+ (hour.length === 1 ? ' ' : '') + hour + ':' + expires.format('mm:ss a'))
							+ ')').grey : '');
					}
				},
				margin: '',
				optionLabel: 'name',
				optionValue: 'uuid',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: false,
				options: provisioningProfiles
			}));
		},
		validate: function (value, callback) {
			if (cli.argv.target === 'simulator') {
				return callback(null, value);
			}
			if (value) {
				var v = _t.provisioningProfileLookup[value.toLowerCase()];
				if (v) {
					return callback(null, v);
				}
				return callback(new Error(__('Invalid provisioning profile UUID "%s"', value)));
			}
			callback(true);
		}
	};
};

/**
 * Defines the --target option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionTarget = function configOptionTarget(order) {
	var _t = this,
		cli = this.cli,
		iosInfo = this.iosInfo;

	return {
		abbr: 'T',
		callback: function (value) {
			if (value !== 'simulator') {
				_t.assertIssue(iosInfo.issues, 'IOS_NO_KEYCHAINS_FOUND');
				_t.assertIssue(iosInfo.issues, 'IOS_NO_WWDR_CERT_FOUND');
			}

			// as soon as we know the target, toggle required options for validation
			switch (value) {
				case 'device':
					_t.assertIssue(iosInfo.issues, 'IOS_NO_VALID_DEV_CERTS_FOUND');
					_t.assertIssue(iosInfo.issues, 'IOS_NO_VALID_DEVELOPMENT_PROVISIONING_PROFILES');
					iosInfo.provisioning.development.forEach(function (d) {
						_t.provisioningProfileLookup[d.uuid.toLowerCase()] = d.uuid;
					});
					_t.conf.options['developer-name'].required = true;
					_t.conf.options['pp-uuid'].required = true;
					break;

				case 'dist-adhoc':
					_t.assertIssue(iosInfo.issues, 'IOS_NO_VALID_DIST_CERTS_FOUND');
					// TODO: assert there is at least one distribution or adhoc provisioning profile

					_t.conf.options['output-dir'].required = true;

					// purposely fall through!

				case 'dist-appstore':
					_t.assertIssue(iosInfo.issues, 'IOS_NO_VALID_DIST_CERTS_FOUND');

					_t.conf.options['deploy-type'].values = ['production'];
					_t.conf.options['device-id'].required = false;
					_t.conf.options['distribution-name'].required = true;
					_t.conf.options['pp-uuid'].required = true;

					// build lookup maps
					iosInfo.provisioning.distribution.forEach(function (d) {
						_t.provisioningProfileLookup[d.uuid.toLowerCase()] = d.uuid;
					});
					iosInfo.provisioning.adhoc.forEach(function (d) {
						_t.provisioningProfileLookup[d.uuid.toLowerCase()] = d.uuid;
					});
			}
		},
		default: 'simulator',
		desc: __('the target to build for'),
		order: 110,
		required: true,
		values: this.targets
	};
};

/**
 * Defines the --watch-app-name option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionWatchAppName = function configOptionWatchAppName(order) {
	return {
		desc: __('when building an app with multiple watch app, the name of the watch app to launch; only used when target is %s', 'simulator'.cyan),
		hint: __('name')
	};
};

/**
 * Defines the --watch-device-id option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
iOSBuilder.prototype.configOptionWatchDeviceId = function configOptionWatchDeviceId(order) {
	var cli = this.cli,
		watchSims = this.iosInfo.simulators.watchos;

	return {
		desc: __('the watch simulator UDID to launch when building an app with a watch app; only used when target is %s', 'simulator'.cyan),
		hint: __('udid'),
		prompt: function (callback) {
			if (cli.argv.target !== 'simulator') {
				return callback();
			}

			var options = {},
				maxName = 0,
				maxDesc = 0;

			Object.keys(watchSims).forEach(function (sdk) {
				watchSims[sdk].forEach(function (sim) {
					options[sdk] || (options[sdk] = []);
					options[sdk].push(sim);
					if (sim.name.length > maxName) {
						maxName = sim.name.length;
					}
				});
			});

			var params = {
				formatters: {},
				default: '1', // just default to the first one, whatever that will be
				autoSelectOne: true,
				margin: '',
				optionLabel: 'name',
				optionValue: 'udid',
				numbered: true,
				relistOnError: true,
				complete: true,
				suggest: true,
				options: options
			};

			// simulator specific settings
			params.title = __('Which simulator do you want to launch your app in?');
			params.promptLabel = __('Select an simulator by number or name');
			params.formatters.option = function (opt, idx, num) {
				return '  ' + num + appc.string.rpad(opt.name, maxName).cyan + '  ' + opt.udid.grey;
			};

			callback(fields.select(params));
		},
		validate: function (value, callback) {
			callback(cli.argv.target === 'simulator' && (!value || value === true || !Object.keys(watchSims).some(function (ver) {
				return watchSims[ver].some(function (sim) {
					return sim.udid === value;
				});
			})), value);
		}
	};
};

/**
 * Validates the iOS build-specific arguments, tiapp.xml settings, and environment.
 *
 * @param {Object} logger - The logger instance.
 * @param {Object} config - The Titanium CLI config instance.
 * @param {Object} cli - The Titanium CLI instance.
 *
 * @returns {Function} A function to be called async which returns the actual configuration.
 */
iOSBuilder.prototype.validate = function (logger, config, cli) {
	Builder.prototype.validate.apply(this, arguments);

	return function (callback) {
		this.target = cli.argv.target;
		this.deployType = !/^dist-/.test(this.target) && cli.argv['deploy-type'] ? cli.argv['deploy-type'] : this.deployTypes[this.target];
		this.buildType = cli.argv['build-type'] || '';

		// manually inject the build profile settings into the tiapp.xml
		switch (this.deployType) {
			case 'production':
				this.minifyJS = true;
				this.encryptJS = true;
				this.minifyCSS = true;
				this.allowDebugging = false;
				this.allowProfiling = false;
				this.includeAllTiModules = false;
				break;

			case 'test':
				this.minifyJS = true;
				this.encryptJS = true;
				this.minifyCSS = true;
				this.allowDebugging = true;
				this.allowProfiling = true;
				this.includeAllTiModules = false;
				break;

			case 'development':
			default:
				this.minifyJS = false;
				this.encryptJS = false;
				this.minifyCSS = false;
				this.allowDebugging = true;
				this.allowProfiling = true;
				this.includeAllTiModules = true;
		}

		if (cli.argv['skip-js-minify']) {
			this.minifyJS = false;
		}

		var appId = cli.tiapp.id;

		// at this point we've validated everything except underscores in the app id
		if (!config.get('app.skipAppIdValidation') && !cli.tiapp.properties['ti.skipAppIdValidation']) {
			if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(appId)) {
				logger.error(__('tiapp.xml contains an invalid app id "%s"', appId));
				logger.error(__('The app id must consist only of letters, numbers, dashes, and underscores.'));
				logger.error(__('Note: iOS does not allow underscores.'));
				logger.error(__('The first character must be a letter or underscore.'));
				logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
				process.exit(1);
			}

			if (appId.indexOf('_') !== -1) {
				logger.error(__('tiapp.xml contains an invalid app id "%s"', appId));
				logger.error(__('The app id must consist of letters, numbers, and dashes.'));
				logger.error(__('The first character must be a letter.'));
				logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
				process.exit(1);
			}
		}

		// make sure the app doesn't have any blacklisted directories in the Resources directory and warn about graylisted names
		var resourcesDir = path.join(cli.argv['project-dir'], 'Resources');
		if (fs.existsSync(resourcesDir)) {
			fs.readdirSync(resourcesDir).forEach(function (filename) {
				var lcaseFilename = filename.toLowerCase(),
					isDir = fs.statSync(path.join(resourcesDir, filename)).isDirectory();

				if (this.blacklistDirectories.indexOf(lcaseFilename) !== -1) {
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
				} else if (this.graylistDirectories.indexOf(lcaseFilename) !== -1) {
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

		// if in the prepare phase and doing a device/dist build...
		if (cli.argv.target !== 'simulator') {
			// make sure they have Apple's WWDR cert installed
			if (!this.iosInfo.certs.wwdr) {
				logger.error(__('WWDR Intermediate Certificate not found') + '\n');
				logger.log(__('Download and install the certificate from %s', 'http://appcelerator.com/ios-wwdr'.cyan) + '\n');
				process.exit(1);
			}

			// validate keychain
			var keychain = cli.argv.keychain ? appc.fs.resolvePath(cli.argv.keychain) : null;
			if (keychain && !fs.existsSync(keychain)) {
				logger.error(__('Unable to find keychain "%s"', keychain) + '\n');
				logger.log(__('Available keychains:'));
				Object.keys(this.iosInfo.certs.keychains).forEach(function (kc) {
					logger.log('    ' + kc.cyan);
				});
				logger.log();
				appc.string.suggest(keychain, Object.keys(this.iosInfo.certs.keychains), logger.log);
				process.exit(1);
			}
		}

		var deviceFamily = this.getDeviceFamily();
		if (!deviceFamily) {
			logger.info(__('No device family specified, defaulting to %s', 'universal'));
			deviceFamily = this.deviceFamily = 'universal';
		}

		if (!this.deviceFamilies[deviceFamily]) {
			logger.error(__('Invalid device family "%s"', deviceFamily) + '\n');
			appc.string.suggest(deviceFamily, Object.keys(this.deviceFamilies), logger.log, 3);
			process.exit(1);
		}

		// device family may have been modified, so set it back in the args
		cli.argv['device-family'] = deviceFamily;

		if (cli.argv.target !== 'dist-appstore') {
			var tool = [];
			this.allowDebugging && tool.push('debug');
			this.allowProfiling && tool.push('profiler');
			tool.forEach(function (type) {
				if (cli.argv[type + '-host']) {
					if (typeof cli.argv[type + '-host'] === 'number') {
						logger.error(__('Invalid %s host "%s"', type, cli.argv[type + '-host']) + '\n');
						logger.log(__('The %s host must be in the format "host:port".', type) + '\n');
						process.exit(1);
					}

					var parts = cli.argv[type + '-host'].split(':');

					if ((cli.argv.target === 'simulator' && parts.length < 2) || (cli.argv.target !== 'simulator' && parts.length < 4)) {
						logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
						if (cli.argv.target === 'simulator') {
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

		series(this, [
			function validateExtensions(next) {
				// if there's no extensions, then skip this step
				if (!this.tiapp.ios || !Array.isArray(this.tiapp.ios.extensions) || !this.tiapp.ios.extensions.length) {
					return next();
				}

				// if there are any extensions, validate them
				async.eachSeries(this.tiapp.ios.extensions, function (ext, next) {
					if (!ext.projectPath) {
						logger.error(__('iOS extensions must have a "projectPath" attribute that points to a folder containing an Xcode project') + '\n');
						process.exit(1);
					}

					// projectPath could be either the path to a project directory or the actual .xcodeproj
					ext.origProjectPath = ext.projectPath;
					ext.projectPath = appc.fs.resolvePath(ext.projectPath);

					var xcodeprojRegExp = /\.xcodeproj$/;

					if (!xcodeprojRegExp.test(ext.projectPath)) {
						// maybe we're the parent dir?
						ext.projectPath = path.join(ext.projectPath, path.basename(ext.projectPath) + '.xcodeproj');
					}

					var projectName = path.basename(ext.projectPath.replace(xcodeprojRegExp, ''));

					if (!fs.existsSync(ext.projectPath)) {
						logger.error(__('iOS extension "%s" Xcode project not found: %s', projectName, ext.projectPath) + '\n');
						process.exit(1);
					}

					var projFile = path.join(ext.projectPath, 'project.pbxproj');
					if (!fs.existsSync(projFile)) {
						logger.error(__('iOS extension "%s" project missing Xcode project file: %s', projectName, projFile) + '\n');
						process.exit(1);
					}

					if (!Array.isArray(ext.targets) || !ext.targets.length) {
						logger.warn(__('iOS extension "%s" has no targets, skipping.', projectName));
						return next();
					}

					var tiappTargets = {},
						swiftRegExp = /\.swift$/,
						proj = xcode.project(path.join(ext.projectPath, 'project.pbxproj')).parseSync();

					// flag each target we care about
					ext.targets.forEach(function (target) { tiappTargets[target.name] = target; }),

					// augment the ext entry with some extra details that we'll use later when constructing the Xcode project
					ext.objs        = proj.hash.project.objects;
					ext.project     = ext.objs.PBXProject[proj.hash.project.rootObject];
					ext.projectName = path.basename(ext.projectPath).replace(/\.xcodeproj$/, ''),
					ext.basePath    = path.dirname(ext.projectPath),
					ext.relPath     = 'extensions/' + path.basename(path.dirname(ext.projectPath)),
					ext.targetInfo  = {};

					var globalCfg = ext.objs.XCConfigurationList[ext.project.buildConfigurationList],
						globalCfgId = globalCfg.buildConfigurations
								.filter(function (c) { return c.comment.toLowerCase() === (globalCfg.defaultConfigurationName ? globalCfg.defaultConfigurationName.toLowerCase() : 'release'); })
								.map(function (c) { return c.value; })
								.shift(),
						globalBuildSettings = ext.objs.XCBuildConfiguration[globalCfgId].buildSettings;

					// find our targets
					ext.project.targets.forEach(function (t) {
						var targetName = t.comment;

						if (!tiappTargets[targetName]) {
							// not a target we care about
							return;
						}

						// we have found our target!

						if (cli.argv.target !== 'simulator') {
							// check that all target provisioning profile uuids are valid
							if (!tiappTargets[targetName].ppUUIDs || !tiappTargets[targetName].ppUUIDs[cli.argv.target]) {
								logger.error(__('iOS extension "%s" target "%s" is missing the %s provisioning profile UUID in tiapp.xml.', projectName, '<' + cli.argv.target + '>', targetName));
								logger.log();
								logger.log('<ti:app xmlns:ti="http://ti.appcelerator.org">'.grey);
								logger.log('    <ios>'.grey);
								logger.log('        <extensions>'.grey);
								logger.log(('            <extension projectPath="' + ext.origProjectPath + '">').grey);
								logger.log(('                <target name="' + targetName + '">').grey);
								logger.log('                    <provisioning-profiles>'.grey);
								logger.log(('                        <' + cli.argv.target + '>PROVISIONING PROFILE UUID</' + cli.argv.target + '>').magenta);
								logger.log('                    </provisioning-profiles>'.grey);
								logger.log('                </target>'.grey);
								logger.log('            </extension>'.grey);
								logger.log('        </extensions>'.grey);
								logger.log('    </ios>'.grey);
								logger.log('</ti:app>'.grey);
								logger.log();
								process.exit(1);
							}
						}

						// we don't need the tiapp target lookup anymore
						delete tiappTargets[targetName];

						var nativeTarget = ext.objs.PBXNativeTarget[t.value],

							cfg = ext.objs.XCConfigurationList[nativeTarget.buildConfigurationList],
							cfgid = cfg.buildConfigurations
								.filter(function (c) { return c.comment.toLowerCase() === (cfg.defaultConfigurationName ? cfg.defaultConfigurationName.toLowerCase() : 'release'); })
								.map(function (c) { return c.value; })
								.shift(),

							buildSettings = ext.objs.XCBuildConfiguration[cfgid].buildSettings,
							sourcesBuildPhase = nativeTarget.buildPhases.filter(function (p) { return /^Sources$/i.test(p.comment); }),

							productType = nativeTarget.productType.replace(/^"/, '').replace(/"$/, ''),
							containsExtension = productType.indexOf('extension') !== -1,
							containsWatchApp = productType.indexOf('watchapp') !== -1,
							containsWatchKit = productType.indexOf('watchkit') !== -1,

							targetInfo = ext.targetInfo[targetName] = {
								productType:           productType,
								isWatchAppV1Extension: productType === 'com.apple.product-type.watchkit-extension',
								isExtension:           containsExtension && (!containsWatchKit || productType === 'com.apple.product-type.watchkit-extension'),
								isWatchAppV1:          productType === 'com.apple.product-type.application.watchapp',
								isWatchAppV2orNewer:   containsWatchApp && productType !== 'com.apple.product-type.application.watchapp',
								sdkRoot:               productType === 'com.apple.product-type.application.watchapp' ? 'watchos' : (buildSettings.SDKROOT || globalBuildSettings.SDKROOT || null),
								watchOS:               productType === 'com.apple.product-type.application.watchapp' ? '1.0' : (buildSettings.WATCHOS_DEPLOYMENT_TARGET || globalBuildSettings.WATCHOS_DEPLOYMENT_TARGET || null),
								infoPlist:             null
							};

						// we need to get a min watch os version so that we can intelligently pick an appropriate watch simulator
						if ((targetInfo.isWatchAppV1 || targetInfo.isWatchAppV2orNewer)
								&& (!cli.argv['watch-app-name'] || targetName === cli.argv['watch-app-name'])
								&& (!this.watchMinOSVersion || appc.version.lt(targetInfo.watchOS, this.watchMinOSVersion))) {
							this.watchMinOSVersion = targetInfo.watchOS;
						}

						// check if this target contains any swift code
						if (sourcesBuildPhase.length && (!buildSettings.EMBEDDED_CONTENT_CONTAINS_SWIFT || /^NO$/i.test(buildSettings.EMBEDDED_CONTENT_CONTAINS_SWIFT))) {
							var files = ext.objs.PBXSourcesBuildPhase[sourcesBuildPhase[0].value].files;
							if (files.some(function (f) { return swiftRegExp.test(ext.objs.PBXBuildFile[f.value].fileRef_comment); })) {
								// oh no, error
								logger.error(__('iOS extension "%s" target "%s" contains Swift code, but "Embedded Content Contains Swift Code" is not enabled.', projectName, targetName) + '\n');
								process.exit(1);
							}
						}

						if (targetInfo.isWatchAppV1) {
							this.hasWatchAppV1 = true;
						} else if (targetInfo.isWatchAppV2orNewer) {
							this.hasWatchAppV2orNewer = true;
						}

						// find this target's Info.plist
						ext.objs.PBXGroup[ext.project.mainGroup].children.some(function (child) {
							if (child.comment !== targetName) {
								return;
							}

							(function walkGroup(uuid, basePath) {
								if (ext.objs.PBXGroup[uuid].path) {
									basePath = path.join(basePath, ext.objs.PBXGroup[uuid].path.replace(/^"/, '').replace(/"$/, ''));
								}

								ext.objs.PBXGroup[uuid].children.some(function (child) {
									if (ext.objs.PBXGroup[child.value]) {
										return walkGroup(child.value, basePath);
									} else if (ext.objs.PBXFileReference[child.value] && child.comment === 'Info.plist') {
										var infoPlistFile = path.join(basePath, 'Info.plist');
										if (!fs.existsSync(infoPlistFile)) {
											logger.error(__('Unable to find "%s" iOS extension\'s "%s" target\'s Info.plist: %s', ext.projectName, targetName, infoPlistFile) + '\n');
											process.exit(1);
										}

										var plist = ext.targetInfo[targetName].infoPlist = ioslib.utilities.readPlist(infoPlistFile);
										if (!plist) {
											logger.error(__('Failed to parse "%s" iOS extension\'s "%s" target\'s Info.plist: %s', ext.projectName, targetName, infoPlistFile) + '\n');
											process.exit(1);
										}

										if (plist.WKWatchKitApp) {
											if (plist.CFBundleIdentifier.indexOf(appId) !== 0) {
												logger.error(__('iOS extension "%s" WatchKit App bundle identifier is "%s", but must be prefixed with "%s".', ext.projectName, plist.CFBundleIdentifier, appId) + '\n');
												process.exit(1);
											}

											if (plist.CFBundleIdentifier.toLowerCase() === appId.toLowerCase()) {
												logger.error(__('iOS extension "%s" WatchKit App bundle identifier must be different from the Titanium app\'s id "%s".', ext.projectName, appId) + '\n');
												process.exit(1);
											}
										} else if (targetInfo.isWatchAppV1 || targetInfo.isWatchAppV2orNewer) {
											logger.error(__('The "%s" iOS extension "%s" target\'s Info.plist is missing the WKWatchKitApp property, yet the product type is of a watch: %s', ext.projectName, targetName, productType) + '\n');
											process.exit(1);
										}

										return true;
									}
								});
							}(child.value, ext.basePath));

							return true;
						});
					}, this);

					// check if we're missing any targets
					tiappTargets = Object.keys(tiappTargets);
					if (tiappTargets.length) {
						logger.error(__n('iOS extension "%%s" does not contain a target named "%%s".', 'iOS extension "%%s" does not contain the following targets: "%%s".', tiappTargets.length, projectName, tiappTargets.join(', ')) + '\n');
						process.exit(1);
					}

					this.extensions.push(ext);

					next();
				}.bind(this), next);
			},

			function selectIosVersion() {
				this.iosSdkVersion = cli.argv['ios-version'] || null;
				this.xcodeEnv = null;

				if (this.iosSdkVersion) {
					// find the Xcode for this version
					Object.keys(this.iosInfo.xcode).sort().reverse().some(function (ver) {
						if (this.iosInfo.xcode[ver].sdks.indexOf(this.iosSdkVersion) !== -1) {
							this.xcodeEnv = this.iosInfo.xcode[ver];
							return true;
						}
					}, this);

					if (!this.xcodeEnv) {
						// this should not be possible, but you never know
						logger.error(__('Unable to find any Xcode installations that support iOS SDK %s.', this.iosSdkVersion) + '\n');
						process.exit(1);
					}
				} else if (target === 'simulator') {
					// we'll let ioslib suggest an iOS version
				} else { // device, dist-appstore, dist-adhoc
					// pick the latest ios sdk
					if (this.iosInfo.selectedXcode && this.iosInfo.selectedXcode.supported && this.iosInfo.selectedXcode.sdks.length) {
						var sdks = this.iosInfo.selectedXcode.sdks.sort();
						this.iosSdkVersion = sdks[sdks.length - 1];
						this.xcodeEnv = this.iosInfo.selectedXcode;
					} else {
						// start scanning Xcodes until we find any iOS SDK
						Object.keys(this.iosInfo.xcode).sort().reverse().some(function (ver) {
							if (this.iosInfo.xcode[ver].supported && this.iosInfo.xcode[ver].sdks.length) {
								var sdks = this.iosInfo.xcode[ver].sdks.sort();
								this.iosSdkVersion = sdks[sdks.length - 1];
								this.xcodeEnv = this.iosInfo.xcode[ver];
								return true;
							}
						}, this);

						if (!this.iosSdkVersion) {
							logger.error(__('Unable to find any Xcode installations with a supported iOS SDK.'));
							logger.error(__('Please install the latest Xcode and point xcode-select to it.') + '\n');
							process.exit(1);
						}
					}
				}
			},

			function selectDevice(next) {
				if (cli.argv['build-only'] || (cli.argv.target !== 'simulator' && cli.argv.target !== 'device')) {
					return next();
				}

				// no --device-id, so pick a device

				if (cli.argv.target === 'device') {
					if (!cli.argv['device-id']) {
						cli.argv['device-id'] = this.iosInfo.devices.length ? this.iosInfo.devices[0].udid : 'itunes';
					}
					return next();
				}

				// if we found a watch app and --watch-device-id was set, but --launch-watch-app was not, then set it
				if ((this.hasWatchAppV1 || this.hasWatchAppV2orNewer) && cli.argv['watch-device-id'] && !cli.argv['launch-watch-app-only']) {
					cli.argv['launch-watch-app'] = true;
				}

				if (cli.argv['launch-watch-app'] || cli.argv['launch-watch-app-only']) {
					// make sure we have a watch app
					if (!this.hasWatchAppV1 && !this.hasWatchAppV2orNewer) {
						logger.warn(__('%s flag was set, however there are no iOS extensions containing a watch app.', cli.argv['launch-watch-app'] ? '--launch-watch-app' : '--launch-watch-app-only'));
						logger.warn(__('Disabling launch watch app flag'));
						cli.argv['launch-watch-app'] = cli.argv['launch-watch-app-only'] = false;
					}
				}
dump({
	simHandleOrUDID:   cli.argv['device-id'],
	iosVersion:        this.iosSdkVersion,
	simType:           deviceFamily === 'ipad' ? 'ipad' : 'iphone',
	simVersion:        this.iosSdkVersion,
	watchApp:          cli.argv['launch-watch-app'] || cli.argv['launch-watch-app-only'],
	watchHandleOrUDID: cli.argv['watch-device-id'],
	watchMinOSVersion: this.watchMinOSVersion
});

				// target is simulator
				ioslib.simulator.findSimulators({
					// env
					xcodeSelect:            config.get('osx.executables.xcodeSelect'),
					security:               config.get('osx.executables.security'),
					// provisioning
					profileDir:             config.get('ios.profileDir'),
					// xcode
					searchPath:             config.get('paths.xcode'),
					minIosVersion:          iosPackageJson.minIosVersion,
					supportedVersions:      iosPackageJson.vendorDependencies.xcode,
					// find params
					appBeingInstalled:      true,
					simHandleOrUDID:        cli.argv['device-id'],
					iosVersion:             this.iosSdkVersion,
					simType:                deviceFamily === 'ipad' ? 'ipad' : 'iphone',
					simVersion:             this.iosSdkVersion,
					watchAppBeingInstalled: cli.argv['launch-watch-app'] || cli.argv['launch-watch-app-only'],
					watchHandleOrUDID:      cli.argv['watch-device-id'],
					watchMinOSVersion:      this.watchMinOSVersion,
					logger: function (msg) {
						logger.trace(('[ioslib] ' + msg).grey);
					}
				}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo) {
					if (err) {
						return next(err);
					}

					this.simHandle = simHandle;
					this.watchSimHandle = watchSimHandle;
					this.xcodeEnv = selectedXcode;

					if (!this.iosSdkVersion) {
						var sdks = selectedXcode.sdks.sort();
						this.iosSdkVersion = sdks[sdks.length - 1];
					}

					next();
				}.bind(this));
			},

			function validateDevice() {
				// check the min-ios-ver for the device we're installing to
				if (this.target === 'device') {
					this.getDeviceInfo().devices.forEach(function (device) {
						if (device.udid !== 'all' && device.udid !== 'itunes' && (cli.argv['device-id'] === 'all' || cli.argv['device-id'] === device.udid) && version.lt(device.productVersion, this.minIosVer)) {
							logger.error(__('This app does not support the device "%s"', device.name) + '\n');
							logger.log(__("The device is running iOS %s, however the app's the minimum iOS version is set to %s", device.productVersion.cyan, version.format(this.minIosVer, 2, 3).cyan));
							logger.log(__('In order to install this app on this device, lower the %s to %s in the tiapp.xml:', '<min-ios-ver>'.cyan, version.format(device.productVersion, 2, 2).cyan));
							logger.log();
							logger.log('<ti:app xmlns:ti="http://ti.appcelerator.org">'.grey);
							logger.log('    <ios>'.grey);
							logger.log(('        <min-ios-ver>' + version.format(device.productVersion, 2, 2) + '</min-ios-ver>').magenta);
							logger.log('    </ios>'.grey);
							logger.log('</ti:app>'.grey);
							logger.log();
							process.exit(0);
						}
					}, this);
				}
			},

			function toSymlinkOrNotToSymlink() {
				// since things are looking good, determine if files should be symlinked on copy
				// note that iOS 9 simulator does not support symlinked files :(
				this.symlinkFilesOnCopy = config.get('ios.symlinkResources', true) && !cli.argv['force-copy'] && !cli.argv['force-copy-all'];
				// we should have a device-id by now
				if (cli.argv.target === 'simulator' && this.symlinkFilesOnCopy && appc.version.gte(this.simHandle.version, '9.0')) {
					logger.info(__('Symlinked files not supported with iOS %s simulator, forcing files to be copied', this.simHandle.version));
					this.symlinkFilesOnCopy = false;
				}
			},

			function determineMinIosVer() {
				// figure out the min-ios-ver that this app is going to support
				var defaultMinIosSdk = this.packageJson.minIosVersion;
				this.minIosVer = cli.tiapp.ios && cli.tiapp.ios['min-ios-ver'] || defaultMinIosSdk;
				if (version.gte(this.iosSdkVersion, '6.0') && version.lt(this.minIosVer, defaultMinIosSdk)) {
					logger.info(__('Building for iOS %s; using %s as minimum iOS version', version.format(this.iosSdkVersion, 2).cyan, defaultMinIosSdk.cyan));
					this.minIosVer = defaultMinIosSdk;
				} else if (version.lt(this.minIosVer, defaultMinIosSdk)) {
					logger.info(__('The %s of the iOS section in the tiapp.xml is lower than minimum supported version: Using %s as minimum', 'min-ios-ver'.cyan, version.format(defaultMinIosSdk, 2).cyan));
					this.minIosVer = defaultMinIosSdk;
				} else if (version.gt(this.minIosVer, this.iosSdkVersion)) {
					logger.info(__('The %s of the iOS section in the tiapp.xml is greater than the specified %s: Using %s as minimum', 'min-ios-ver'.cyan, 'ios-version'.cyan, version.format(this.iosSdkVersion, 2).cyan));
					this.minIosVer = this.iosSdkVersion;
				}
			},

			function validateModules(next) {
				this.validateTiModules(['ios', 'iphone'], this.deployType, function (err, modules) {
					this.modules = modules.found;

					this.commonJsModules = [];
					this.nativeLibModules = [];

					var nativeHashes = [];

					modules.found.forEach(function (module) {
						if (module.platform.indexOf('commonjs') !== -1) {
							module.native = false;

							module.libFile = path.join(module.modulePath, module.id + '.js');
							if (!fs.existsSync(module.libFile)) {
								this.logger.error(__('Module %s version %s is missing module file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, module.libFile.cyan) + '\n');
								process.exit(1);
							}

							this.commonJsModules.push(module);
						} else {
							module.native = true;

							module.libName = 'lib' + module.id.toLowerCase() + '.a',
							module.libFile = path.join(module.modulePath, module.libName);

							if (!fs.existsSync(module.libFile)) {
								this.logger.error(__('Module %s version %s is missing library file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, module.libFile.cyan) + '\n');
								process.exit(1);
							}

							nativeHashes.push(module.hash = this.hash(fs.readFileSync(module.libFile)));
							this.nativeLibModules.push(module);
						}

						// scan the module for any CLI hooks
						cli.scanHooks(path.join(module.modulePath, 'hooks'));
					}, this);

					this.modulesNativeHash = this.hash(nativeHashes.length ? nativeHashes.sort().join(',') : '');

					next();
				}.bind(this));
			}
		], function (err) {
			if (err) {
				logger.error((err.message || err.toString()) + '\n');
				process.exit(1);
			}
			callback();
		});
	}.bind(this); // end of function returned by validate()
};

/**
 * Performs the build operations.
 *
 * @param {Object} logger - The logger instance.
 * @param {Object} config - The Titanium CLI config instance.
 * @param {Object} cli - The Titanium CLI instance.
 * @param {Function} finished - A function to call when the build has finished or errored.
 */
iOSBuilder.prototype.run = function (logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	// force the platform to "ios" just in case it was "iphone" so that plugins can reference it
	cli.argv.platform = 'ios';

	series(this, [
		function (next) {
			cli.emit('build.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',
		'loginfo',
		'readBuildManifest',
		'checkIfNeedToRecompile',
		'initBuildDir',

		function (next) {
			cli.emit('build.pre.compile', this, next);
		},

		function () {
			// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
			// Alloy generate an app.js, it may not have existed during validate(), but should exist now
			// that build.pre.compile was fired.
			ti.validateAppJsExists(this.projectDir, this.logger, ['iphone', 'ios']);
		},

		// xcode related tasks
		'createXcodeProject',
		'writeEntitlementsPlist',
		'writeInfoPlist',
		'writeMain',
		'writeXcodeConfigFiles',
		'copyTitaniumLibraries',
		'copyTitaniumiOSFiles',
		'copyExtensionFiles',
		'cleanXcodeDerivedData',

		// titanium related tasks
		'copyAppIcons',
		'copyItunesArtwork',
		'copyTitaniumFiles',
		'copyLocalizedLaunchScreens',
		'encryptJSFiles',
		'writeDebugProfilePlists',
		'writeI18NFiles',
		'processTiSymbols',
		'removeFiles',

		function (next) {
			if (!this.forceRebuild && this.deployType !== 'development') {
				// normally we would force xcode to run here because ApplicationRouting.m was probably modified
				// but we're cool now and we don't have to force it, right?
			}

			parallel(this, [
				'invokeXcodeBuild',
				'optimizeFiles'
			], next);
		},

		'writeBuildManifest',

		function (next) {
			if (!this.buildOnly && (this.target === 'simulator' || this.target === 'device')) {
				var delta = appc.time.prettyDiff(this.cli.startTime, Date.now());
				this.logger.info(__('Finished building the application in %s', delta.cyan));
			}

			cli.emit('build.post.compile', this, next);
		},

		function (next) {
			cli.emit('build.finalize', this, next);
		}
	], finished);
};

iOSBuilder.prototype.doAnalytics = function doAnalytics(next) {
	var cli = this.cli,
		eventName = cli.argv['device-family'] + '.' + cli.argv.target;

	if (cli.argv.target === 'dist-appstore' || cli.argv.target === 'dist-adhoc') {
		eventName = cli.argv['device-family'] + '.distribute.' + cli.argv.target.replace('dist-', '');
	} else if (this.allowDebugging && cli.argv['debug-host']) {
		eventName += '.debug';
	} else if (this.allowProfiling && cli.argv['profiler-host']) {
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

iOSBuilder.prototype.initialize = function initialize() {
	var argv = this.cli.argv;

	// populate the build manifest object
	this.currentBuildManifest.target            = this.target;
	this.currentBuildManifest.deployType        = this.deployType;
	this.currentBuildManifest.sdkVersion        = this.tiapp['sdk-version'];
	this.currentBuildManifest.iosSdkVersion     = this.iosSdkVersion;
	this.currentBuildManifest.deviceFamily      = this.deviceFamily;
	this.currentBuildManifest.iosSdkPath        = this.platformPath;
	this.currentBuildManifest.tiCoreHash        = this.libTiCoreHash            = this.hash(fs.readFileSync(path.join(this.platformPath, 'libTiCore.a')));
	this.currentBuildManifest.developerName     = this.certDeveloperName        = argv['developer-name'];
	this.currentBuildManifest.distributionName  = this.certDistributionName     = argv['distribution-name'];
	this.currentBuildManifest.modulesHash       = this.modulesHash              = this.hash(!Array.isArray(this.tiapp.modules) ? '' : this.tiapp.modules.filter(function (m) {
			return !m.platform || /^iphone|ipad|ios|commonjs$/.test(m.platform);
		}).map(function (m) {
			return m.id + ',' + m.platform + ',' + m.version;
		}).join('|'));
	this.currentBuildManifest.modulesNativeHash  = this.modulesNativeHash;
	this.currentBuildManifest.gitHash            = ti.manifest.githash;
	this.currentBuildManifest.ppUuid             = this.provisioningProfileUUID = argv['pp-uuid'];
	this.currentBuildManifest.outputDir          = this.cli.argv['output-dir'],
	this.currentBuildManifest.forceCopy          = this.forceCopy               = !!argv['force-copy'];
	this.currentBuildManifest.forceCopyAll       = this.forceCopyAll            = !!argv['force-copy-all'];
	this.currentBuildManifest.name               = this.tiapp.name,
	this.currentBuildManifest.id                 = this.tiapp.id,
	this.currentBuildManifest.analytics          = this.tiapp.analytics,
	this.currentBuildManifest.publisher          = this.tiapp.publisher,
	this.currentBuildManifest.url                = this.tiapp.url,
	this.currentBuildManifest.version            = this.tiapp.version,
	this.currentBuildManifest.description        = this.tiapp.description,
	this.currentBuildManifest.copyright          = this.tiapp.copyright,
	this.currentBuildManifest.guid               = this.tiapp.guid,
	this.currentBuildManifest.skipJSMinification = !!this.cli.argv['skip-js-minify'],
	this.currentBuildManifest.encryptJS          = !!this.encryptJS

	// This is default behavior for now. Move this to true in phase 2.
	// Remove the debugHost/profilerHost check when we have debugging/profiling support with JSCore framework
	// TIMOB-17892
	this.currentBuildManifest.useJSCore = this.useJSCore = !this.debugHost && !this.profilerHost && this.cli.tiapp.ios && this.cli.tiapp.ios['use-jscore-framework'];

	this.moduleSearchPaths = [ this.projectDir, appc.fs.resolvePath(this.platformPath, '..', '..', '..', '..') ];
	if (this.config.paths && Array.isArray(this.config.paths.modules)) {
		this.moduleSearchPaths = this.moduleSearchPaths.concat(this.config.paths.modules);
	}

	this.debugHost     = this.allowDebugging && argv['debug-host'];
	this.profilerHost  = this.allowProfiling && argv['profiler-host'];
	this.buildOnly     = argv['build-only'];
	this.launchUrl     = argv['launch-url'];
	this.keychain      = argv['keychain'];
	this.deviceId      = argv['device-id'];
	this.deviceInfo    = this.deviceId ? this.getDeviceInfo().udids[this.deviceId] : null;
	this.xcodeTarget   = /^device|simulator$/.test(this.target) ? 'Debug' : 'Release';
	this.xcodeTargetOS = this.target === 'simulator' ? 'iphonesimulator' : 'iphoneos';

	this.iosBuildDir            = path.join(this.buildDir, 'build', this.xcodeTarget + '-' + (this.target === 'simulator' ? 'iphonesimulator' : 'iphoneos'));
	this.xcodeAppDir            = path.join(this.iosBuildDir, this.tiapp.name + '.app');
	this.xcodeProjectConfigFile = path.join(this.buildDir, 'project.xcconfig');
	this.buildAssetsDir         = path.join(this.buildDir, 'assets');
	this.buildManifestFile      = path.join(this.buildDir, 'build-manifest.json');

	// make sure we have an icon
	if (!this.tiapp.icon || !['Resources', 'Resources/iphone', 'Resources/ios'].some(function (p) {
			return fs.existsSync(this.projectDir, p, this.tiapp.icon);
		}, this)) {
		this.tiapp.icon = 'appicon.png';
	}

	this.imagesOptimizedFile = path.join(this.buildDir, 'images_optimized');
	fs.existsSync(this.imagesOptimizedFile) && fs.unlinkSync(this.imagesOptimizedFile);
	delete this.buildDirFiles[this.imagesOptimizedFile];
};

iOSBuilder.prototype.loginfo = function loginfo(next) {
	this.logger.debug(__('Titanium SDK iOS directory: %s', cyan(this.platformPath)));
	this.logger.info(__('Deploy type: %s', cyan(this.deployType)));
	this.logger.info(__('Building for target: %s', cyan(this.target)));
	this.logger.info(__('Building using iOS SDK: %s', cyan(version.format(this.iosSdkVersion, 2))));

	if (this.buildOnly) {
		this.logger.info(__('Performing build only'));
	} else {
		if (this.target === 'simulator') {
			this.logger.info(__('Building for iOS Simulator: %s', cyan(this.simHandle.name)));
			this.logger.debug(__('UDID: %s', cyan(this.simHandle.udid)));
			this.logger.debug(__('Simulator type: %s', cyan(this.simHandle.family)));
			this.logger.debug(__('Simulator version: %s', cyan(this.simHandle.version)));
		} else if (this.target === 'device') {
			this.logger.info(__('Building for iOS device: %s', cyan(this.deviceId)));
		}
	}

	this.logger.info(__('Building for device family: %s', cyan(this.deviceFamily)));
	this.logger.debug(__('Setting Xcode target to %s', cyan(this.xcodeTarget)));
	this.logger.debug(__('Setting Xcode build OS to %s', cyan(this.xcodeTargetOS)));
	this.logger.debug(__('Xcode installation: %s', cyan(this.xcodeEnv.path)));
	this.logger.debug(__('iOS WWDR certificate: %s', cyan(this.iosInfo.certs.wwdr ? __('installed') : __('not found'))));

	if (this.target === 'device') {
		this.logger.info(__('iOS Development Certificate: %s', cyan(this.certDeveloperName)));
	} else if (/^dist-appstore|dist\-adhoc$/.test(this.target)) {
		this.logger.info(__('iOS Distribution Certificate: %s', cyan(this.certDistributionName)));
	}

	// validate the min-ios-ver from the tiapp.xml
	this.logger.info(__('Minimum iOS version: %s', cyan(version.format(this.minIosVer, 2, 3))));

	if (/^device|dist\-appstore|dist\-adhoc$/.test(this.target)) {
		if (this.keychain) {
			this.logger.info(__('Using keychain: %s', cyan(this.keychain)));
		} else {
			this.logger.info(__('Using default keychain'));
		}
	}

	if (this.debugHost) {
		this.logger.info(__('Debugging enabled via debug host: %s', cyan(this.debugHost)));
	} else {
		this.logger.info(__('Debugging disabled'));
	}

	if (this.profilerHost) {
		this.logger.info(__('Profiler enabled via profiler host: %s', cyan(this.profilerHost)));
	} else {
		this.logger.info(__('Profiler disabled'));
	}

	next();
};

iOSBuilder.prototype.readBuildManifest = function readBuildManifest() {
	// read the build manifest from the last build, if exists, so we
	// can determine if we need to do a full rebuild
	if (fs.existsSync(this.buildManifestFile)) {
		try {
			this.previousBuildManifest = JSON.parse(fs.readFileSync(this.buildManifestFile)) || {};
		} catch (e) {}
	}

	// now that we've read the build manifest, delete it so if this build
	// becomes incomplete, the next build will be a full rebuild
	fs.existsSync(this.buildManifestFile) && fs.unlinkSync(this.buildManifestFile);

	delete this.buildDirFiles[this.buildManifestFile];
};

iOSBuilder.prototype.checkIfNeedToRecompile = function checkIfNeedToRecompile() {
	var manifest = this.previousBuildManifest;

	// check if we need to clean the build directory
	this.forceCleanBuild = function () {
		// check if the --force flag was passed in
		if (this.cli.argv.force) {
			this.logger.info(__('Forcing clean build: %s flag was set', cyan('--force')));
			return true;
		}

		// check if the build manifest file was read
		if (!Object.keys(this.previousBuildManifest).length) {
			this.logger.info(__('Forcing clean build: %s does not exist', cyan(this.buildManifestFile)));
			return true;
		}

		// check the <sdk-version> from the tiapp.xml
		if (!appc.version.eq(this.tiapp['sdk-version'], manifest.sdkVersion)) {
			this.logger.info(__('Forcing rebuild: tiapp.xml Titanium SDK version changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.sdkVersion)));
			this.logger.info('  ' + __('Now: %s', cyan(this.tiapp['sdk-version'])));
			return true;
		}

		// check if the titanium sdk version changed
		if (fs.existsSync(this.xcodeProjectConfigFile)) {
			// we have a previous build, see if the Titanium SDK changed
			var conf = fs.readFileSync(this.xcodeProjectConfigFile).toString(),
				versionMatch = conf.match(/TI_VERSION\=([^\n]*)/);

			if (versionMatch && !appc.version.eq(versionMatch[1], this.titaniumSdkVersion)) {
				this.logger.info(__('Forcing rebuild: Titanium SDK version in the project.xcconfig changed since last build'));
				this.logger.info('  ' + __('Was: %s', cyan(versionMatch[1])));
				this.logger.info('  ' + __('Now: %s', cyan(this.titaniumSdkVersion)));
				return true;
			}
		}

		return false;
	}.call(this);

	// if true, this will cause xcodebuild to be called
	// if false, it's possible that other steps after this will force xcodebuild to be called
	this.forceRebuild = this.forceCleanBuild || function () {
		// check if the xcode app directory exists
		if (!fs.existsSync(this.xcodeAppDir)) {
			this.logger.info(__('Forcing rebuild: %s does not exist', cyan(this.xcodeAppDir)));
			return true;
		}

		// check if the --force-copy or --force-copy-all flags were set
		if (this.forceCopy !== manifest.forceCopy) {
			this.logger.info(__('Forcing rebuild: force copy flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.forceCopy)));
			this.logger.info('  ' + __('Now: %s', cyan(this.forceCopy)));
			return true;
		}

		if (this.forceCopyAll !== manifest.forceCopyAll) {
			this.logger.info(__('Forcing rebuild: force copy all flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.forceCopyAll)));
			this.logger.info('  ' + __('Now: %s', cyan(this.forceCopyAll)));
			return true;
		}

		// check if the target changed
		if (this.target !== manifest.target) {
			this.logger.info(__('Forcing rebuild: target changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.target)));
			this.logger.info('  ' + __('Now: %s', cyan(this.target)));
			return true;
		}

		if (fs.existsSync(this.xcodeProjectConfigFile)) {
			// we have a previous build, see if the app id changed
			var conf = fs.readFileSync(this.xcodeProjectConfigFile).toString(),
				idMatch = conf.match(/TI_APPID\=([^\n]*)/);

			if (idMatch && idMatch[1] !== this.tiapp.id) {
				this.logger.info(__('Forcing rebuild: app id changed since last build'));
				this.logger.info('  ' + __('Was: %s', cyan(idMatch[1])));
				this.logger.info('  ' + __('Now: %s', cyan(this.tiapp.id)));
				return true;
			}
		}

		// check that we have a libTiCore hash
		if (!manifest.tiCoreHash) {
			this.logger.info(__('Forcing rebuild: incomplete version file %s', cyan(this.buildVersionFile)));
			return true;
		}

		// determine the libTiCore hash and check if the libTiCore hashes are different
		if (this.libTiCoreHash !== manifest.tiCoreHash) {
			this.logger.info(__('Forcing rebuild: libTiCore hash changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.tiCoreHash)));
			this.logger.info('  ' + __('Now: %s', cyan(this.libTiCoreHash)));
			return true;
		}

		// check if the titanium sdk paths are different
		if (manifest.iosSdkPath !== this.platformPath) {
			this.logger.info(__('Forcing rebuild: Titanium SDK path changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.iosSdkPath)));
			this.logger.info('  ' + __('Now: %s', cyan(this.platformPath)));
			return true;
		}

		// check if the iOS SDK has changed
		if (manifest.iosSdkVersion !== this.iosSdkVersion) {
			this.logger.info(__('Forcing rebuild: iOS SDK version changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.iosSdkVersion)));
			this.logger.info('  ' + __('Now: %s', cyan(this.iosSdkVersion)));
			return true;
		}

		// check if the device family has changed (i.e. was universal, now iphone)
		if (manifest.deviceFamily !== this.deviceFamily) {
			this.logger.info(__('Forcing rebuild: device family changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.deviceFamily)));
			this.logger.info('  ' + __('Now: %s', cyan(this.deviceFamily)));
			return true;
		}

		// check the git hashes are different
		if (!manifest.gitHash || manifest.gitHash !== ti.manifest.githash) {
			this.logger.info(__('Forcing rebuild: githash changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.gitHash)));
			this.logger.info('  ' + __('Now: %s', cyan(ti.manifest.githash)));
			return true;
		}

		// determine the modules hash and check if the modules hashes has changed
		if (this.modulesHash !== manifest.modulesHash) {
			this.logger.info(__('Forcing rebuild: modules hash changed since last build'));
			this.logger.info('  ' + __('Was: %s', cyan(manifest.modulesHash)));
			this.logger.info('  ' + __('Now: %s', cyan(this.modulesHash)));
			return true;
		}

		// check if the native modules hashes has changed
		if (this.modulesNativeHash !== manifest.modulesNativeHash) {
			this.logger.info(__('Forcing rebuild: native modules hash changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.modulesNativeHash));
			this.logger.info('  ' + __('Now: %s', this.modulesNativeHash));
			return true;
		}

		// check if the provisioning profile has changed
		if (this.provisioningProfileUUID !== manifest.ppUuid) {
			this.logger.info(__('Forcing rebuild: provisioning profile changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.ppUuid));
			this.logger.info('  ' + __('Now: %s', this.provisioningProfileUUID));
			return true;
		}

		// check if the use JavaScriptCore flag has changed
		if (this.useJSCore !== manifest.useJSCore) {
			this.logger.info(__('Forcing rebuild: use JSCore flag changed since last build'));
			this.logger.info('  ' + __('Was: %s', manifest.useJSCore));
			this.logger.info('  ' + __('Now: %s', this.useJSCore));
			return true;
		}

		// next we check if any tiapp.xml values changed so we know if we need to reconstruct the main.m
		// note: as soon as these tiapp.xml settings are written to an encrypted file instead of the binary, we can remove this whole section
		var tiappSettings = {
				'name':        'project name',
				'id':          'app id',
				'analytics':   'analytics flag',
				'publisher':   'publisher',
				'url':         'url',
				'version':     'version',
				'description': 'description',
				'copyright':   'copyright',
				'guid':        'guid'
			},
			changed = null;

		Object.keys(tiappSettings).some(function (key) {
			if (this.tiapp[key] !== manifest[key]) {
				changed = key;
				return true;
			}
		}, this);

		if (changed) {
			this.logger.info(__('Forcing rebuild: tiapp.xml %s changed since last build', tiappSettings[changed]));
			this.logger.info('  ' + __('Was: %s', cyan(manifest[changed])));
			this.logger.info('  ' + __('Now: %s', cyan(this.tiapp[changed])));
			return true;
		}

		return false;
	}.call(this);
};

iOSBuilder.prototype.initBuildDir = function initBuildDir() {
	this.logger.info(__('Initializing the build directory'));

	var buildDirExists = fs.existsSync(this.buildDir);

	if (this.forceCleanBuild && buildDirExists) {
		this.logger.debug(__('Recreating %s', cyan(this.buildDir)));
		wrench.rmdirSyncRecursive(this.buildDir);
		wrench.mkdirSyncRecursive(this.buildDir);
	} else if (!buildDirExists) {
		this.logger.debug(__('Creating %s', cyan(this.buildDir)));
		wrench.mkdirSyncRecursive(this.buildDir);
		this.forceCleanBuild = true;
	}

	fs.existsSync(this.xcodeAppDir) || wrench.mkdirSyncRecursive(this.xcodeAppDir);
};

iOSBuilder.prototype.createXcodeProject = function createXcodeProject(next) {
	this.logger.info(__('Creating Xcode project'));

	var logger = this.logger,
		appName = this.tiapp.name,
		scrubbedAppName = appName.replace(/-/g, '_').replace(/\W/g, ''),
		srcFile = path.join(this.platformPath, 'iphone', 'Titanium.xcodeproj', 'project.pbxproj'),
		contents = fs.readFileSync(srcFile).toString(),
		xcodeProject = xcode.project(path.join(this.buildDir, this.tiapp.name + '.xcodeproj', 'project.pbxproj')),
		xobjs,
		uuidIndex = 1,
		relPathRegExp = /\.\.\/(Classes|Resources|headers|lib)/;

	// normally we would want truly unique ids, but we want predictability so that we
	// can detect when the project has changed and if we need to rebuild the app
	function generateUuid() {
		var id = appc.string.lpad(uuidIndex++, 24, '0');
		if (xcodeProject.allUuids().indexOf(id) >= 0) {
			return generateUuid();
		} else {
			return id;
		}
	}

	xcodeProject.hash = xcodeParser.parse(fs.readFileSync(srcFile).toString());
	xobjs = xcodeProject.hash.project.objects;

	// we need to replace all instances of "Titanium" with the app name
	Object.keys(xobjs.PBXFileReference).forEach(function (id) {
		var obj = xobjs.PBXFileReference[id];
		if (obj && typeof obj === 'object') {
			if (obj.path === 'Titanium_Prefix.pch') {
				obj.path = xobjs.PBXFileReference[id + '_comment'] = scrubbedAppName + '_Prefix.pch';
			} else if (obj.path === 'Titanium.plist') {
				obj.path = xobjs.PBXFileReference[id + '_comment'] = 'Info.plist';
			} else if (obj.path === 'Titanium.app') {
				obj.path = xobjs.PBXFileReference[id + '_comment'] = '"' + appName + '"';
			} else if (relPathRegExp.test(obj.path)) {
				obj.path = obj.path.replace(relPathRegExp, '$1');
			}
		}
	});

	Object.keys(xobjs.PBXGroup).forEach(function (id) {
		var obj = xobjs.PBXGroup[id];
		if (obj && typeof obj === 'object') {
			if (obj.children) {
				obj.children.forEach(function (child) {
					if (child.comment === 'Titanium_Prefix.pch') {
						child.comment = scrubbedAppName + '_Prefix.pch';
					} else if (child.comment === 'Titanium.plist') {
						child.comment = 'Info.plist';
					} else if (child.comment === 'Titanium.app') {
						child.comment = '"' + appName + '.app"';
					}
				});
			}
			if (obj.path && relPathRegExp.test(obj.path)) {
				obj.path = obj.path.replace(relPathRegExp, '$1');
			}
		}
	});

	Object.keys(xobjs.PBXNativeTarget).forEach(function (id) {
		var obj = xobjs.PBXNativeTarget[id];
		if (obj && typeof obj === 'object') {
			Object.keys(obj).forEach(function (key) {
				if (obj[key] && typeof obj[key] === 'string' && obj[key].indexOf('Titanium') !== -1) {
					obj[key] = xobjs.PBXNativeTarget[id + '_comment'] = '"' + obj[key].replace(/Titanium/g, appName).replace(/^"/, '').replace(/"$/, '') + '"';
				}
			});
		}
	});

	Object.keys(xobjs.PBXProject).forEach(function (id) {
		var obj = xobjs.PBXProject[id];
		if (obj && typeof obj === 'object') {
			obj.buildConfigurationList_comment = '"' + obj.buildConfigurationList_comment.replace(/Titanium/g, appName).replace(/^"/, '').replace(/"$/, '') + '"';
			obj.targets.forEach(function (item) {
				item.comment = '"' + item.comment.replace(/Titanium/g, appName).replace(/^"/, '').replace(/"$/, '') + '"';
			});
		}
	});

	Object.keys(xobjs.XCBuildConfiguration).forEach(function (id) {
		var obj = xobjs.XCBuildConfiguration[id];
		if (obj && typeof obj === 'object' && obj.buildSettings) {
			if (obj.buildSettings.GCC_PREFIX_HEADER === 'Titanium_Prefix.pch') {
				obj.buildSettings.GCC_PREFIX_HEADER = scrubbedAppName + '_Prefix.pch';
			}
			if (obj.buildSettings.INFOPLIST_FILE === 'Titanium.plist') {
				obj.buildSettings.INFOPLIST_FILE = 'Info.plist';
			}
			if (obj.buildSettings.PRODUCT_NAME === 'Titanium') {
				obj.buildSettings.PRODUCT_NAME = '"' + appName + '"';
			}
			if (Array.isArray(obj.buildSettings.LIBRARY_SEARCH_PATHS)) {
				obj.buildSettings.LIBRARY_SEARCH_PATHS.forEach(function (item, i, arr) {
					arr[i] = item.replace(relPathRegExp, '$1');
				});
			}
			if (Array.isArray(obj.buildSettings.HEADER_SEARCH_PATHS)) {
				obj.buildSettings.HEADER_SEARCH_PATHS.forEach(function (item, i, arr) {
					arr[i] = item.replace(relPathRegExp, '$1');
				});
			}
		}
	});

	Object.keys(xobjs.XCConfigurationList).forEach(function (id) {
		if (xobjs.XCConfigurationList[id] && typeof xobjs.XCConfigurationList[id] === 'string') {
			xobjs.XCConfigurationList[id] = xobjs.XCConfigurationList[id].replace(/Titanium/g, appName);
		}
	});

	// delete the pre-compile build phases since we don't need it
	this.logger.trace(__('Removing pre-compile phase'));
	Object.keys(xobjs.PBXShellScriptBuildPhase).forEach(function (buildPhaseUuid) {
		if (xobjs.PBXShellScriptBuildPhase[buildPhaseUuid] && typeof xobjs.PBXShellScriptBuildPhase[buildPhaseUuid] === 'object' && /^"?Pre-Compile"?$/i.test(xobjs.PBXShellScriptBuildPhase[buildPhaseUuid].name)) {
			Object.keys(xobjs.PBXNativeTarget).forEach(function (key) {
				if (xobjs.PBXNativeTarget[key] && typeof xobjs.PBXNativeTarget[key] === 'object') {
					xobjs.PBXNativeTarget[key].buildPhases = xobjs.PBXNativeTarget[key].buildPhases.filter(function (phase) {
						return phase.value !== buildPhaseUuid;
					});
				}
			});
			delete xobjs.PBXShellScriptBuildPhase[buildPhaseUuid];
			delete xobjs.PBXShellScriptBuildPhase[buildPhaseUuid + '_comment'];
		}
	});

	// add the post-compile phase
	this.logger.trace(__('Adding post-compile phase'));
	var postCompilePhaseUuid = generateUuid();
	xobjs.PBXShellScriptBuildPhase[postCompilePhaseUuid] = {
		isa: 'PBXShellScriptBuildPhase',
		buildActionMask: 2147483647,
		files: [],
		inputPaths: [],
		name: '"Post-Compile"',
		outputPaths: [],
		runOnlyForDeploymentPostprocessing: 0,
		shellPath: '/bin/sh',
		shellScript: '"' + [
			'if [ \\"x$TITANIUM_CLI_IMAGES_OPTIMIZED\\" != \\"x\\" ]; then',
			'    if [ -f \\"$TITANIUM_CLI_IMAGES_OPTIMIZED\\" ]; then',
			'        echo \\"Xcode Post-Compile Phase: Image optimization finished before xcodebuild finished, continuing\\"',
			'    else',
			'        echo \\"Xcode Post-Compile Phase: Waiting for image optimization to complete\\"',
			'        echo \\"Xcode Post-Compile Phase: $TITANIUM_CLI_IMAGES_OPTIMIZED\\"',
			'        while [ ! -f \\"$TITANIUM_CLI_IMAGES_OPTIMIZED\\" ]',
			'        do',
			'            sleep 1',
			'        done',
			'        echo \\"Xcode Post-Compile Phase: Image optimization complete, continuing\\"',
			'    fi',
			'fi'
		].join('\\n') + '"'
	};
	xobjs.PBXShellScriptBuildPhase[postCompilePhaseUuid + '_comment'] = 'Post-Compile';

	Object.keys(xobjs.PBXNativeTarget).some(function (targetUuid) {
		if (xobjs.PBXNativeTarget[targetUuid].name === appName) {
			xobjs.PBXNativeTarget[targetUuid].buildPhases.push({
				value: postCompilePhaseUuid,
				comment: 'Post-Compile'
			});
			return true;
		}
	});

	var projectUuid = xcodeProject.hash.project.rootObject,
		pbxProject = xobjs.PBXProject[projectUuid],
		mainTargetUuid = pbxProject.targets.filter(function (t) { return t.comment.replace(/^"/, '').replace(/"$/, '') === appName; })[0].value,
		mainGroupChildren = xobjs.PBXGroup[pbxProject.mainGroup].children,
		extensionsGroup = xobjs.PBXGroup[mainGroupChildren.filter(function (child) { return child.comment === 'Extensions'; })[0].value],
		frameworksGroup = xobjs.PBXGroup[mainGroupChildren.filter(function (child) { return child.comment === 'Frameworks'; })[0].value],
		productsGroup = xobjs.PBXGroup[mainGroupChildren.filter(function (child) { return child.comment === 'Products'; })[0].value],
		frameworksBuildPhase = xobjs.PBXFrameworksBuildPhase[xobjs.PBXNativeTarget[mainTargetUuid].buildPhases.filter(function (phase) { return xobjs.PBXFrameworksBuildPhase[phase.value]; })[0].value],
		keychains = this.iosInfo.certs.keychains,
		gccDefs = [ 'DEPLOYTYPE=' + this.deployType ],
		buildSettings = {
			IPHONEOS_DEPLOYMENT_TARGET: appc.version.format(this.minIosVer, 2),
			TARGETED_DEVICE_FAMILY: '"' + this.deviceFamilies[this.deviceFamily] + '"',
			ONLY_ACTIVE_ARCH: 'NO',
			DEAD_CODE_STRIPPING: 'YES',
			SDKROOT: this.xcodeTargetOS
		};

	if (this.target === 'simulator') {
		gccDefs.push('__LOG__ID__=' + this.tiapp.guid);
		gccDefs.push('DEBUG=1');
		gccDefs.push('TI_VERSION=' + this.titaniumSdkVersion);
	}

	if (/simulator|device|dist\-adhoc/.test(this.target) && this.tiapp.ios && this.tiapp.ios.enablecoverage) {
		gccDefs.push('KROLL_COVERAGE=1');
	}

	buildSettings.GCC_PREPROCESSOR_DEFINITIONS = '"' + gccDefs.join(' ') + '"';

	if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
		buildSettings.PROVISIONING_PROFILE = '"' + this.provisioningProfileUUID + '"';
		buildSettings.DEPLOYMENT_POSTPROCESSING = 'YES';
		if (this.keychain) {
			buildSettings.OTHER_CODE_SIGN_FLAGS = '--keychain ' + this.keychain;
		}
	}

	if (this.target === 'device') {
		Object.keys(keychains).some(function (keychain) {
			return (keychains[keychain].developer || []).some(function (d) {
				if (!d.invalid && d.name === this.certDeveloperName) {
					buildSettings.CODE_SIGN_IDENTITY = '"' + d.fullname + '"';
					return true;
				}
			}, this);
		}, this);
	}

	if (/dist-appstore|dist\-adhoc/.test(this.target)) {
		Object.keys(keychains).some(function (keychain) {
			return (keychains[keychain].developer || []).some(function (d) {
				if (!d.invalid && d.name === this.certDistributionName) {
					buildSettings.CODE_SIGN_IDENTITY = '"' + d.fullname + '"';
					return true;
				}
			}, this);
		}, this);
	}

	// set the identity and provisioning profile for the app
	xobjs.XCConfigurationList[xobjs.PBXNativeTarget[mainTargetUuid].buildConfigurationList].buildConfigurations.forEach(function (buildConf) {
		appc.util.mix(xobjs.XCBuildConfiguration[buildConf.value].buildSettings, buildSettings);
	});

	// add the native libraries to the project
	if (this.nativeLibModules.length) {
		this.logger.trace(__n('Adding %%d native module library', 'Adding %%d native module libraries', this.nativeLibModules.length === 1 ? 1 : 2, this.nativeLibModules.length));
		this.nativeLibModules.forEach(function (lib) {
			var fileRefUuid = generateUuid(),
				buildFileUuid = generateUuid();

			// add the file reference
			xobjs.PBXFileReference[fileRefUuid] = {
				isa: 'PBXFileReference',
				lastKnownFileType: 'archive.ar',
				name: lib.libName,
				path: '"' + lib.libFile + '"',
				sourceTree: '"<absolute>"'
			};
			xobjs.PBXFileReference[fileRefUuid + '_comment'] = lib.libName;

			// add the library to the Frameworks group
			frameworksGroup.children.push({
				value: fileRefUuid,
				comment: lib.libName
			});

			// add the build file
			xobjs.PBXBuildFile[buildFileUuid] = {
				isa: 'PBXBuildFile',
				fileRef: fileRefUuid,
				fileRef_comment: lib.libName
			};
			xobjs.PBXBuildFile[buildFileUuid + '_comment'] = lib.libName + ' in Frameworks';

			// add the library to the frameworks build phase
			frameworksBuildPhase.files.push({
				value: buildFileUuid,
				comment: lib.libName + ' in Frameworks'
			});

			// add the library to the search paths
			xobjs.XCConfigurationList[xobjs.PBXNativeTarget[mainTargetUuid].buildConfigurationList].buildConfigurations.forEach(function (buildConf) {
				var buildSettings = xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
				buildSettings.LIBRARY_SEARCH_PATHS || (buildSettings.LIBRARY_SEARCH_PATHS = []);
				buildSettings.LIBRARY_SEARCH_PATHS.push('"\\"' + path.dirname(lib.libFile) + '\\""');
			});
		});
	} else {
		this.logger.trace(__('No native module libraries to add'));
	}

	// add extensions and their targets to the project
	if (this.extensions.length) {
		this.logger.trace(__n('Adding %%d iOS extension', 'Adding %%d iOS extensions', this.extensions.length === 1 ? 1 : 2, this.extensions.length));

		this.extensions.forEach(function (ext) {
			var extObjs = ext.objs,
				extPBXProject = ext.project;

			// create a group in the Extensions group for all the extension's groups
			var groupUuid = generateUuid();
			extensionsGroup.children.push({
				value: groupUuid,
				comment: ext.projectName
			});
			xobjs.PBXGroup[groupUuid] = {
				isa: 'PBXGroup',
				children: [],
				name: '"' + ext.projectName + '"',
				path: '"' + ext.relPath + '"',
				sourceTree: '"<group>"'
			};
			xobjs.PBXGroup[groupUuid + '_comment'] = ext.projectName;

			// loop through all of the extension's targets
			extPBXProject.targets.forEach(function (extTarget) {
				var target = null,
					targetUuid = extTarget.value,
					targetName = extTarget.comment,
					targetInfo = ext.targetInfo[targetName];

				// do we care about this target?
				ext.targets.some(function (t) { if (t.name === targetName) { target = t; return true; } });
				if (!target) {
					return;
				}

				pbxProject.targets.push(extTarget);

				// add target attributes
				if (extPBXProject.attributes && extPBXProject.attributes.TargetAttributes && extPBXProject.attributes.TargetAttributes[targetUuid]) {
					pbxProject.attributes || (pbxProject.attributes = {});
					pbxProject.attributes.TargetAttributes || (pbxProject.attributes.TargetAttributes = {});
					pbxProject.attributes.TargetAttributes[targetUuid] = extPBXProject.attributes.TargetAttributes[targetUuid];
				}

				// add the native target
				xobjs.PBXNativeTarget[targetUuid] = extObjs.PBXNativeTarget[targetUuid];
				xobjs.PBXNativeTarget[targetUuid + '_comment'] = extObjs.PBXNativeTarget[targetUuid + '_comment'];

				// add the target product to the products group
				productsGroup.children.push({
					value: xobjs.PBXNativeTarget[targetUuid].productReference,
					comment: xobjs.PBXNativeTarget[targetUuid].productReference_comment
				});

				// add the build phases
				xobjs.PBXNativeTarget[targetUuid].buildPhases.forEach(function (phase) {
					var type;

					if (extObjs.PBXSourcesBuildPhase[phase.value]) {
						type = 'PBXSourcesBuildPhase';
					} else if (extObjs.PBXFrameworksBuildPhase[phase.value]) {
						type = 'PBXFrameworksBuildPhase';
					} else if (extObjs.PBXResourcesBuildPhase[phase.value]) {
						type = 'PBXResourcesBuildPhase';
					} else if (extObjs.PBXCopyFilesBuildPhase[phase.value]) {
						type = 'PBXCopyFilesBuildPhase';
					} else {
						return;
					}

					xobjs[type] || (xobjs[type] = {});
					xobjs[type][phase.value] = extObjs[type][phase.value];
					xobjs[type][phase.value + '_comment'] = extObjs[type][phase.value + '_comment'];

					// add files
					xobjs[type][phase.value].files.forEach(function (file) {
						xobjs.PBXBuildFile[file.value] = extObjs.PBXBuildFile[file.value];
						xobjs.PBXBuildFile[file.value + '_comment'] = extObjs.PBXBuildFile[file.value + '_comment'];
					});
				});

				// add dependencies
				xobjs.PBXNativeTarget[targetUuid].dependencies.forEach(function (dep) {
					xobjs.PBXTargetDependency || (xobjs.PBXTargetDependency = {});
					xobjs.PBXTargetDependency[dep.value] = extObjs.PBXTargetDependency[dep.value];
					xobjs.PBXTargetDependency[dep.value + '_comment'] = extObjs.PBXTargetDependency[dep.value + '_comment'];

					// add the target proxy
					var proxyUuid = xobjs.PBXTargetDependency[dep.value].targetProxy;
					xobjs.PBXContainerItemProxy || (xobjs.PBXContainerItemProxy = {});
					xobjs.PBXContainerItemProxy[proxyUuid] = extObjs.PBXContainerItemProxy[proxyUuid];
					xobjs.PBXContainerItemProxy[proxyUuid].containerPortal = projectUuid;
					xobjs.PBXContainerItemProxy[proxyUuid + '_comment'] = extObjs.PBXContainerItemProxy[proxyUuid + '_comment'];
   				});

				// add the product reference
				var productUuid = xobjs.PBXNativeTarget[targetUuid].productReference;
				xobjs.PBXFileReference[productUuid] = extObjs.PBXFileReference[productUuid];
				xobjs.PBXFileReference[productUuid + '_comment'] = extObjs.PBXFileReference[productUuid + '_comment'];

				// add the groups and files
				extObjs.PBXGroup[extPBXProject.mainGroup].children.some(function (child) {
					if (child.comment !== target.name) return;

					xobjs.PBXGroup[groupUuid].children.push(child);

					(function addGroup(uuid, basePath) {
						if (extObjs.PBXGroup[uuid].path) {
							basePath = path.join(basePath, extObjs.PBXGroup[uuid].path.replace(/^"/, '').replace(/"$/, ''));
						}

						xobjs.PBXGroup[uuid] = extObjs.PBXGroup[uuid];
						xobjs.PBXGroup[uuid + '_comment'] = extObjs.PBXGroup[uuid + '_comment'];

						extObjs.PBXGroup[uuid].children.forEach(function (child) {
							if (extObjs.PBXGroup[child.value]) {
								addGroup(child.value, basePath);
							} else if (extObjs.PBXFileReference[child.value]) {
								xobjs.PBXFileReference[child.value] = extObjs.PBXFileReference[child.value];
								xobjs.PBXFileReference[child.value + '_comment'] = extObjs.PBXFileReference[child.value + '_comment'];
							}
						});
					}(child.value, ext.basePath));

					return true;
				});

				// add the build configuration
				var buildConfigurationListUuid = xobjs.PBXNativeTarget[targetUuid].buildConfigurationList;
				xobjs.XCConfigurationList[buildConfigurationListUuid] = extObjs.XCConfigurationList[buildConfigurationListUuid];
				xobjs.XCConfigurationList[buildConfigurationListUuid + '_comment'] = extObjs.XCConfigurationList[buildConfigurationListUuid + '_comment']

				xobjs.XCConfigurationList[buildConfigurationListUuid].buildConfigurations.forEach(function (conf) {
					xobjs.XCBuildConfiguration[conf.value] = extObjs.XCBuildConfiguration[conf.value];
					xobjs.XCBuildConfiguration[conf.value + '_comment'] = extObjs.XCBuildConfiguration[conf.value + '_comment'];

					// update info.plist path
					var extBuildSettings = xobjs.XCBuildConfiguration[conf.value].buildSettings;

					if (extBuildSettings.INFOPLIST_FILE) {
						extBuildSettings.INFOPLIST_FILE = '"' + ext.relPath + '/' + extBuildSettings.INFOPLIST_FILE.replace(/^"/, '').replace(/"$/, '') + '"';
					}

					if (!extBuildSettings.CLANG_ENABLE_OBJC_ARC) {
						// inherits from project
						var confList = extObjs.XCConfigurationList[extPBXProject.buildConfigurationList],
							confUuid = confList.buildConfigurations.filter(function (c) { return c.comment === confList.defaultConfigurationName || 'Release'; })[0].value;
						if (extObjs.XCBuildConfiguration[confUuid].buildSettings.CLANG_ENABLE_OBJC_ARC === 'YES') {
							extBuildSettings.CLANG_ENABLE_OBJC_ARC = 'YES';
						}
					}

					if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
						extBuildSettings.PROVISIONING_PROFILE = '"' + target.ppUUIDs[this.target] + '"';
						extBuildSettings.DEPLOYMENT_POSTPROCESSING = 'YES';
						if (this.keychain) {
							extBuildSettings.OTHER_CODE_SIGN_FLAGS = '--keychain ' + this.keychain;
						}
					}

					if (buildSettings.CODE_SIGN_IDENTITY) {
						extBuildSettings.CODE_SIGN_IDENTITY = buildSettings.CODE_SIGN_IDENTITY;
					}

					if (extBuildSettings.CODE_SIGN_ENTITLEMENTS) {
						extBuildSettings.CODE_SIGN_ENTITLEMENTS = '"' + ext.relPath + '/' + extBuildSettings.CODE_SIGN_ENTITLEMENTS.replace(/^"/, '').replace(/"$/, '') + '"';
					}
				}, this);

				if (targetInfo.isWatchAppV1Extension) {
					this.unmarkBuildDirFiles(path.join(this.xcodeAppDir, 'PlugIns', xobjs.PBXFileReference[productUuid].path.replace(/^"/, '').replace(/"$/, '')));
				} else if (targetInfo.isWatchAppV2orNewer) {
					this.unmarkBuildDirFiles(path.join(this.xcodeAppDir, 'Watch', xobjs.PBXFileReference[productUuid].path.replace(/^"/, '').replace(/"$/, '')));
				}

				if (targetInfo.isExtension || targetInfo.isWatchAppV2orNewer) {
					// add this target as a dependency of the titanium app's project
					var proxyUuid = generateUuid();
					xobjs.PBXContainerItemProxy || (xobjs.PBXContainerItemProxy = {});
					xobjs.PBXContainerItemProxy[proxyUuid] = {
						isa: 'PBXContainerItemProxy',
						containerPortal: projectUuid,
						containerPortal_comment: 'Project object',
						proxyType: 1,
						remoteGlobalIDString: targetUuid,
						remoteInfo: '"' + targetName + '"'
					};
					xobjs.PBXContainerItemProxy[proxyUuid + '_comment'] = 'PBXContainerItemProxy';

					var depUuid = generateUuid();
					xobjs.PBXTargetDependency || (xobjs.PBXTargetDependency = {});
					xobjs.PBXTargetDependency[depUuid] = {
						isa: 'PBXTargetDependency',
						target: targetUuid,
						target_comment: targetName,
						targetProxy: proxyUuid,
						targetProxy_comment: 'PBXContainerItemProxy'
					};
					xobjs.PBXTargetDependency[depUuid + '_comment'] = 'PBXTargetDependency';

					xobjs.PBXNativeTarget[mainTargetUuid].dependencies.push({
						value: depUuid,
						comment: 'PBXTargetDependency'
					});

					function addEmbedBuildPhase(name, dstPath) {
						embedExtPhase = xobjs.PBXNativeTarget[mainTargetUuid].buildPhases.filter(function (phase) { return phase.comment === name; }).shift();
						embedUuid = embedExtPhase && embedExtPhase.value;

						if (!embedUuid) {
							embedUuid = generateUuid();
							xobjs.PBXNativeTarget[mainTargetUuid].buildPhases.push({
								value: embedUuid,
								comment: name
							});
							xobjs.PBXCopyFilesBuildPhase || (xobjs.PBXCopyFilesBuildPhase = {});
							xobjs.PBXCopyFilesBuildPhase[embedUuid] = {
								isa: 'PBXCopyFilesBuildPhase',
								buildActionMask: 2147483647,
								dstPath: '"' + (dstPath || '') + '"',
								dstSubfolderSpec: 13, // type "plugin"
								files: [],
								name: '"' + name + '"',
								runOnlyForDeploymentPostprocessing: 0
							};
							xobjs.PBXCopyFilesBuildPhase[embedUuid + '_comment'] = name;
						}

						var productName = xobjs.PBXNativeTarget[targetUuid].productReference_comment;

						// add the copy files build phase
						var copyFilesUuid = generateUuid();

						xobjs.PBXCopyFilesBuildPhase[embedUuid].files.push({
							value: copyFilesUuid,
							comment: productName + ' in ' + name
						});

						xobjs.PBXBuildFile[copyFilesUuid] = {
							isa: 'PBXBuildFile',
							fileRef: productUuid,
							fileRef_comment: productName,
							settings: { ATTRIBUTES: [ 'RemoveHeadersOnCopy' ] }
						};
						xobjs.PBXBuildFile[copyFilesUuid + '_comment'] = productName + ' in ' + name;
					}

					if (targetInfo.isWatchAppV1Extension) {
						addEmbedBuildPhase('Embed App Extensions');
					} else if (targetInfo.isWatchAppV2orNewer) {
						addEmbedBuildPhase('Embed Watch Content', '$(CONTENTS_FOLDER_PATH)/Watch');
					}
				}
			}, this);
		}, this);
	} else {
		this.logger.trace(__('No extensions to add'));
	}

	// if any extensions contain a watch app, we must force the min iOS deployment target to 8.2
	if (this.hasWatchAppV1 || this.hasWatchAppV2orNewer) {
		// TODO: Make sure the version of Xcode can support this version of watch app

		var once = 0,
			iosDeploymentTarget = this.hasWatchAppV2orNewer ? '9.0' : '8.2';

		xobjs.XCConfigurationList[pbxProject.buildConfigurationList].buildConfigurations.forEach(function (buildConf) {
			var buildSettings = xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
			if (buildSettings.IPHONEOS_DEPLOYMENT_TARGET && appc.version.lt(buildSettings.IPHONEOS_DEPLOYMENT_TARGET, iosDeploymentTarget)) {
				once++ === 0 && this.logger.warn(__('WatchKit App detected, changing minimum iOS deployment target from %s to %s', buildSettings.IPHONEOS_DEPLOYMENT_TARGET, iosDeploymentTarget));
				buildSettings.IPHONEOS_DEPLOYMENT_TARGET = iosDeploymentTarget;
			}
		}, this);

		this.hasWatchApp = true;
	}

	// get the product names
	this.products = productsGroup.children.map(function (product) {
		return product.comment;
	});

	var hook = this.cli.createHook('build.ios.xcodeproject', this, function (xcodeProject, done) {
		var contents = xcodeProject.writeSync(),
			dest = xcodeProject.filepath,
			parent = path.dirname(dest);

		if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
			if (!this.forceRebuild) {
				this.logger.info(__('Forcing rebuild: Xcode project has changed since last build'));
				this.forceRebuild = true;
			}
			this.logger.debug(__('Writing %s', dest.cyan));
			fs.existsSync(parent) || wrench.mkdirSyncRecursive(parent);
			fs.writeFileSync(dest, contents);
		} else {
			this.logger.trace(__('No change, skipping %s', dest.cyan));
		}

		delete this.buildDirFiles[dest];
		done();
	});

	hook(xcodeProject, next);
};

iOSBuilder.prototype.writeEntitlementsPlist = function writeEntitlementsPlist() {
	this.logger.info(__('Creating Entitlements.plist'));

	// allow the project to have its own custom entitlements
	var entitlementsFile = path.join(this.projectDir, 'Entitlements.plist'),
		dest = path.join(this.buildDir, 'Entitlements.plist');

	if (fs.existsSync(entitlementsFile)) {
		this.logger.info(__('Found custom entitlements: %s', entitlementsFile.cyan));
		this.copyFileSync(entitlementsFile, dest);
		delete this.buildDirFiles[dest];
		return;
	}

	function getPP(list, uuid) {
		for (var i = 0, l = list.length; i < l; i++) {
			if (list[i].uuid === uuid) {
				return list[i];
			}
		}
	}

	var pp;
	if (this.target === 'device') {
		pp = getPP(this.iosInfo.provisioning.development, this.provisioningProfileUUID);
	} else {
		pp = getPP(this.iosInfo.provisioning.distribution, this.provisioningProfileUUID);
		if (!pp) {
			pp = getPP(this.iosInfo.provisioning.adhoc, this.provisioningProfileUUID);
		}
	}

	var plist = new appc.plist();
	if (pp) {
		// attempt to customize it by reading provisioning profile
		(this.target === 'dist-appstore') && (plist['beta-reports-active'] = true);
		plist['get-task-allow'] = !!pp.getTaskAllow;
		pp.apsEnvironment && (plist['aps-environment'] = pp.apsEnvironment);
		plist['application-identifier'] = pp.appPrefix + '.' + this.tiapp.id;
		plist['keychain-access-groups'] = [ plist['application-identifier'] ];
	}

	var contents = plist.toString('xml');
	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s has changed since last build', 'Entitlements.plist'));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', dest.cyan));
	}
	delete this.buildDirFiles[dest];
};

iOSBuilder.prototype.writeInfoPlist = function writeInfoPlist() {
	this.logger.info(__('Creating Info.plist'));

	var defaultInfoPlistFile = path.join(this.platformPath, 'Info.plist'),
		customInfoPlistFile = this.projectDir + '/Info.plist',
		plist = this.infoPlist = new appc.plist(),
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

	// default Info.plist
	if (fs.existsSync(defaultInfoPlistFile)) {
		plist.parse(fs.readFileSync(defaultInfoPlistFile).toString().replace(/(__.+__)/g, function (match, key, format) {
			return consts.hasOwnProperty(key) ? consts[key] : '<!-- ' + key + ' -->'; // if they key is not a match, just comment out the key
		}));

		// override the default versions with the tiapp.xml version
		plist.CFBundleVersion = String(this.tiapp.version);
		try {
			plist.CFBundleShortVersionString = appc.version.format(this.tiapp.version, 0, 3);
		} catch (ex) {
			plist.CFBundleShortVersionString = this.tiapp.version;
		}

		// this should not exist, but nuke it so we can create it below
		delete plist.UIAppFonts;

		// override the default icons with the tiapp.xml version
		Array.isArray(plist.CFBundleIconFiles) || (plist.CFBundleIconFiles = []);
		['.png', '@2x.png', '-72.png', '-60.png', '-60@2x.png', '-60@3x.png', '-76.png', '-76@2x.png', '-Small-50.png', '-72@2x.png', '-Small-50@2x.png', '-Small.png', '-Small@2x.png', '-Small@3x.png', '-Small-40.png', '-Small-40@2x.png'].forEach(function (name) {
			name = iconName + name;
			if (fs.existsSync(path.join(this.projectDir, 'Resources', name)) ||
				fs.existsSync(path.join(this.projectDir, 'Resources', 'iphone', name)) ||
				fs.existsSync(path.join(this.projectDir, 'Resources', 'ios', name))) {
				if (plist.CFBundleIconFiles.indexOf(name) === -1) {
					plist.CFBundleIconFiles.push(name);
				}
			}
		}, this);

		// override the default launch screens
		var resourceDir = path.join(this.projectDir, 'Resources'),
			iphoneDir = path.join(resourceDir, 'iphone'),
			iosDir = path.join(resourceDir, 'ios'),
			i18nLaunchScreens = ti.i18n.findLaunchScreens(this.projectDir, this.logger, { ignoreDirs: this.ignoreDirs }).map(function (p) { return path.basename(p); });
		[{
			'orientation': 'Portrait',
			'minimum-system-version': '8.0',
			'name': 'Default-Portrait',
			'subtype': '736h',
			'scale': ['3x'],
			'size': '{414, 736}'
		},
		{
			'orientation': 'Landscape',
			'minimum-system-version': '8.0',
			'name': 'Default-Landscape',
			'subtype': '736h',
			'scale': ['3x'],
			'size': '{414, 736}'
		},
		{
			'orientation': 'Portrait',
			'minimum-system-version': '8.0',
			'name': 'Default',
			'subtype': '667h',
			'scale': ['2x'],
			'size': '{375, 667}'
		},
		{
			'orientation': 'Portrait',
			'minimum-system-version': '7.0',
			'name': 'Default',
			'scale': ['2x', '1x'],
			'size': '{320, 480}'
		},
		{
			'orientation': 'Portrait',
			'minimum-system-version': '7.0',
			'name': 'Default',
			'subtype': '568h',
			'scale': ['2x'],
			'size': '{320, 568}'
		},
		{
			'orientation': 'Portrait',
			'idiom': 'ipad',
			'minimum-system-version': '7.0',
			'name': 'Default-Portrait',
			'scale': ['2x', '1x'],
			'size': '{768, 1024}'
		},
		{
			'orientation': 'Landscape',
			'idiom': 'ipad',
			'minimum-system-version': '7.0',
			'name': 'Default-Landscape',
			'scale': ['2x', '1x'],
			'size': '{768, 1024}'
		}].forEach(function (asset) {
			asset.scale.some(function (scale) {
				var key,
					basefilename = asset.name + (asset.subtype ? '-' + asset.subtype : ''),
					filename = basefilename + (scale !== '1x' ? '@' + scale : '') + '.png';

				if (i18nLaunchScreens.indexOf(filename) !== -1 ||
					fs.existsSync(path.join(resourceDir, filename)) ||
					fs.existsSync(path.join(iphoneDir, filename)) ||
					fs.existsSync(path.join(iosDir, filename))
				) {
					key = 'UILaunchImages' + (asset.idiom === 'ipad' ? '~ipad' : '');
					Array.isArray(plist[key]) || (plist[key] = []);
					plist[key].push({
						UILaunchImageName: basefilename,
						UILaunchImageOrientation: asset.orientation,
						UILaunchImageSize: asset.size,
						UILaunchImageMinimumOSVersion: asset['minimum-system-version']
					});
					return true;
				}
			});
		});
	}

	function merge(src, dest) {
		Object.keys(src).forEach(function (prop) {
			if (!/^\+/.test(prop)) {
				if (Object.prototype.toString.call(src[prop]) === '[object Object]') {
					dest.hasOwnProperty(prop) || (dest[prop] = {});
					merge(src[prop], dest[prop]);
				} else {
					dest[prop] = src[prop];
				}
			}
		});
	}

	// if the user has a Info.plist in their project directory, consider that a custom override
	if (fs.existsSync(customInfoPlistFile)) {
		this.logger.info(__('Copying custom Info.plist from project directory'));
		var custom = new appc.plist().parse(fs.readFileSync(customInfoPlistFile).toString());
		merge(custom, plist);
	}

	// tiapp.xml settings override the default and custom Info.plist
	plist.UIRequiresPersistentWiFi = this.tiapp.hasOwnProperty('persistent-wifi')  ? !!this.tiapp['persistent-wifi']  : false;
	plist.UIPrerenderedIcon        = this.tiapp.hasOwnProperty('prerendered-icon') ? !!this.tiapp['prerendered-icon'] : false;
	plist.UIStatusBarHidden        = this.tiapp.hasOwnProperty('statusbar-hidden') ? !!this.tiapp['statusbar-hidden'] : false;

	plist.UIStatusBarStyle = 'UIStatusBarStyleDefault';
	if (/opaque_black|opaque|black/.test(this.tiapp['statusbar-style'])) {
		plist.UIStatusBarStyle = 'UIStatusBarStyleBlackOpaque';
	} else if (/translucent_black|transparent|translucent/.test(this.tiapp['statusbar-style'])) {
		plist.UIStatusBarStyle = 'UIStatusBarStyleBlackTranslucent';
	}

	if (iphone) {
		if (iphone.orientations) {
			var orientationsMap = {
				'PORTRAIT':        'UIInterfaceOrientationPortrait',
				'UPSIDE_PORTRAIT': 'UIInterfaceOrientationPortraitUpsideDown',
				'LANDSCAPE_LEFT':  'UIInterfaceOrientationLandscapeLeft',
				'LANDSCAPE_RIGHT': 'UIInterfaceOrientationLandscapeRight'
			};

			Object.keys(iphone.orientations).forEach(function (key) {
				var entry = 'UISupportedInterfaceOrientations' + (key === 'ipad' ? '~ipad' : '');

				Array.isArray(plist[entry]) || (plist[entry] = []);
				iphone.orientations[key].forEach(function (name) {
					var value = orientationsMap[name.split('.').pop().toUpperCase()] || name;
					// name should be in the format Ti.UI.PORTRAIT, so pop the last part and see if it's in the map
					if (plist[entry].indexOf(value) === -1) {
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
					if (types[i].CFBundleTypeName === type.name) {
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

	// custom Info.plist from the tiapp.xml overrides everything
	ios && ios.plist && merge(ios.plist, plist);

	// override the CFBundleIdentifier to the app id
	plist.CFBundleIdentifier = this.tiapp.id;

	if (this.target === 'device' && this.deviceId === 'itunes') {
		// device builds require an additional token to ensure uniqueness so that iTunes will detect an updated app to sync.
		// we drop the milliseconds from the current time so that we still have a unique identifier, but is less than 10
		// characters so iTunes 11.2 doesn't get upset.
		plist.CFBundleVersion = String(+new Date);
		this.logger.debug(__('Building for iTunes sync which requires us to set the CFBundleVersion to a unique number to trigger iTunes to update your app'));
		this.logger.debug(__('Setting Info.plist CFBundleVersion to current epoch time %s', plist.CFBundleVersion.cyan));
	}

	// scan for ttf and otf font files
	var fontMap = {};
	(function scanFonts(dir, isRoot) {
		fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (file) {
			var p = path.join(dir, file);
			if (fs.statSync(p).isDirectory() && (!isRoot || file === 'iphone' || file === 'ios' || ti.availablePlatformsNames.indexOf(file) === -1)) {
				scanFonts(p);
			} else if (/\.(otf|ttf)$/i.test(file)) {
				fontMap['/' + p.replace(iphoneDir, '').replace(iosDir, '').replace(resourceDir, '').replace(/^\//, '')] = 1;
			}
		});
	}(resourceDir, true));

	if (Array.isArray(plist.UIAppFonts)) {
		plist.UIAppFonts.forEach(function (f) {
			if (!fontMap[f]) {
				this.logger.warn(__('Info.plist references non-existent font: %s', cyan(f)));
				fontMap[f] = 1;
			}
		});
	}

	var fonts = Object.keys(fontMap);
	fonts.length && (plist.UIAppFonts = fonts);

	// write the Info.plist
	var dest = path.join(this.buildDir, 'Info.plist'),
		contents = plist.toString('xml');
	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s changed since last build', 'Info.plist'));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', dest.cyan));
	}
	delete this.buildDirFiles[dest];
};

iOSBuilder.prototype.writeMain = function writeMain() {
	this.logger.info(__('Creating main.m'));

	var consts = {
			'__PROJECT_NAME__':     this.tiapp.name,
			'__PROJECT_ID__':       this.tiapp.id,
			'__DEPLOYTYPE__':       this.deployType,
			'__APP_ID__':           this.tiapp.id,
			'__APP_ANALYTICS__':    String(this.tiapp.hasOwnProperty('analytics') ? !!this.tiapp.analytics : true),
			'__APP_PUBLISHER__':    this.tiapp.publisher,
			'__APP_URL__':          this.tiapp.url,
			'__APP_NAME__':         this.tiapp.name,
			'__APP_VERSION__':      this.tiapp.version,
			'__APP_DESCRIPTION__':  this.tiapp.description,
			'__APP_COPYRIGHT__':    this.tiapp.copyright,
			'__APP_GUID__':         this.tiapp.guid,
			'__APP_RESOURCE_DIR__': '',
			'__APP_DEPLOY_TYPE__':  this.buildType
		},
		contents = fs.readFileSync(path.join(this.platformPath, 'main.m')).toString().replace(/(__.+?__)/g, function (match, key, format) {
			var s = consts.hasOwnProperty(key) ? consts[key] : key;
			return typeof s === 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
		}),
		dest = path.join(this.buildDir, 'main.m');

	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s has changed since last build', 'main.m'));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', dest.cyan));
	}

	delete this.buildDirFiles[dest];
};

iOSBuilder.prototype.writeXcodeConfigFiles = function writeXcodeConfigFiles() {
	this.logger.info(__('Creating Xcode config files'));

	// write the project.xcconfig
	var dest = this.xcodeProjectConfigFile,
		contents = [
			'TI_VERSION=' + this.titaniumSdkVersion,
			'TI_SDK_DIR=' + this.platformPath.replace(this.titaniumSdkVersion, '$(TI_VERSION)'),
			'TI_APPID=' + this.tiapp.id,
			'JSCORE_LD_FLAGS=-weak_framework JavaScriptCore',
			'TICORE_LD_FLAGS=-weak-lti_ios_profiler -weak-lti_ios_debugger -weak-lTiCore',
			'OTHER_LDFLAGS[sdk=iphoneos*]=$(inherited) ' + (this.useJSCore ? '$(JSCORE_LD_FLAGS)' : '$(TICORE_LD_FLAGS)'),
			'OTHER_LDFLAGS[sdk=iphonesimulator*]=$(inherited) ' + (this.useJSCore ? '$(JSCORE_LD_FLAGS)' : '$(TICORE_LD_FLAGS)'),
			'OTHER_LDFLAGS[sdk=iphoneos9.*]=$(inherited) -weak_framework Contacts -weak_framework ContactsUI',
			'OTHER_LDFLAGS[sdk=iphonesimulator9.*]=$(inherited) -weak_framework Contacts -weak_framework ContactsUI',
			'#include "module"'
		].join('\n') + '\n';

	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s has changed since last build', path.basename(this.xcodeProjectConfigFile)));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', this.xcodeProjectConfigFile.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', this.xcodeProjectConfigFile.cyan));
	}
	delete this.buildDirFiles[dest];

	// write the module.xcconfig
	var variables = {};
	dest = path.join(this.buildDir, 'module.xcconfig'),
	contents = [
		'// this is a generated file - DO NOT EDIT',
		''
	];

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
					Array.isArray(variables[key]) || (variables[key] = []);
					variables[key].push(name);
					contents.push((name + '=' + xc[key]).replace(new RegExp('\$\(' + key + '\)', 'g'), '$(' + name + ')'));
				});
			}
		});
	}, this);

	Object.keys(variables).forEach(function (v) {
		contents.push(v + '=$(inherited) ' + variables[v].map(function (x) { return '$(' + x + ') '; }).join(''));
	});
	contents = contents.join('\n');

	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s has changed since last build', 'module.xcconfig'));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', dest.cyan));
	}
	delete this.buildDirFiles[dest];
};

iOSBuilder.prototype.copyTitaniumLibraries = function copyTitaniumLibraries() {
	this.logger.info(__('Copying Titanium libraries'));

	var libDir = path.join(this.buildDir, 'lib');
	fs.existsSync(libDir) || wrench.mkdirSyncRecursive(libDir);

	['libTiCore.a', 'libtiverify.a', 'libti_ios_debugger.a', 'libti_ios_profiler.a'].forEach(function (filename) {
		var src = path.join(this.platformPath, filename),
			dest = path.join(libDir, filename);

		delete this.buildDirFiles[dest];

		if (!this.copyFileSync(src, dest, { forceCopy: filename === 'libTiCore.a' && this.forceCopyAll })) {
			this.logger.trace(__('No change, skipping %s', dest.cyan));
		}
	}, this);
};

iOSBuilder.prototype.copyTitaniumiOSFiles = function copyTitaniumiOSFiles() {
	this.logger.info(__('Copying Titanium iOS files'));

	var nameChanged = !this.previousBuildManifest || this.tiapp.name !== this.previousBuildManifest.name,
		name = this.tiapp.name.replace(/-/g, '_').replace(/\W/g, ''),
		namespace = /^[0-9]/.test(name) ? 'k' + name : name,
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
		extRegExp = /\.(c|cpp|h|m|mm)$/,

		// files to watch for while copying
		appFiles = {};

	appFiles['ApplicationDefaults.m'] = {
		props:      this.tiapp.properties || {},
		deployType: this.deployType,
		launchUrl:  this.launchUrl
	};

	appFiles['ApplicationMods.m'] = {
		modules: this.modules
	};

	['Classes', 'headers'].forEach(function (dir) {
		this.copyDirSync(path.join(this.platformPath, dir), path.join(this.buildDir, dir), {
			ignoreDirs: this.ignoreDirs,
			ignoreFiles: /^(defines\.h|bridge\.txt|libTitanium\.a|\.gitignore|\.npmignore|\.cvsignore|\.DS_Store|\._.*|[Tt]humbs.db|\.vspscc|\.vssscc|\.sublime-project|\.sublime-workspace|\.project|\.tmproj)$/,
			beforeCopy: function (srcFile, destFile, srcStat) {
				var rel = srcFile.replace(path.dirname(this.titaniumSdkPath) + '/', ''),
					filename = path.basename(srcFile),
					destExists = fs.existsSync(destFile),
					existingContent = destExists && fs.readFileSync(destFile),
					contents = fs.readFileSync(srcFile),
					srcHash = this.hash(contents),
					srcMtime = JSON.parse(JSON.stringify(srcStat.mtime)),
					changed = false;

				delete this.buildDirFiles[destFile];

				this.currentBuildManifest.files[rel] = {
					hash: srcHash,
					mtime: srcMtime,
					size: srcStat.size
				};

				if (appFiles[filename]) {
					contents = ejs.render(contents.toString(), appFiles[filename]);
					if (!destExists || contents !== existingContent.toString()) {
						if (!this.forceRebuild) {
							this.logger.info(__('Forcing rebuild: %s has changed since last build', rel));
							this.forceRebuild = true;
						}
						this.logger.debug(__('Writing %s', destFile.cyan));
						fs.writeFileSync(destFile, contents);
					}
					return null;
				}

				if (extRegExp.test(srcFile) && srcFile.indexOf('TiCore') === -1) {
					// look up the file to see if the original source changed
					var prev = this.previousBuildManifest.files && this.previousBuildManifest.files[rel];
					if (destExists && !nameChanged && prev && prev.size === srcStat.size && prev.mtime === srcMtime && prev.hash === srcHash) {
						// the original hasn't changed, so let's assume that there's nothing to do
						return null;
					}

					contents = contents.toString();
					for (var i = 0, l = copyFileRegExps.length; i < l; i++) {
						contents = contents.replace(copyFileRegExps[i][0], copyFileRegExps[i][1]);
					}

					changed = contents !== existingContent.toString();
				} else {
					changed = !bufferEqual(contents, existingContent);
				}

				if (!destExists || changed) {
					if (!this.forceRebuild) {
						this.logger.info(__('Forcing rebuild: %s has changed since last build', rel));
						this.forceRebuild = true;
					}
					this.logger.debug(__('Writing %s', destFile.cyan));
					fs.writeFileSync(destFile, contents);

					return null; // tell copyDirSync not to copy the file because we wrote it ourselves
				}
			}.bind(this),
			afterCopy: function (srcFile, destFile, srcStat, result) {
				if (!result) {
					this.logger.trace(__('No change, skipping %s', destFile.cyan));
				}
			}.bind(this)
		});
	}, this);

	var pchFile = path.join(this.buildDir, name + '_Prefix.pch');
	this.copyFileSync(path.join(this.platformPath, this.platformName, 'Titanium_Prefix.pch'), pchFile);
	delete this.buildDirFiles[pchFile];
};

iOSBuilder.prototype.copyExtensionFiles = function copyExtensionFiles() {
	if (!this.extensions.length) return;

	this.logger.info(__('Copying iOS extensions'));

	this.extensions.forEach(function (extension) {
		var extName = path.basename(extension.projectPath).replace(/\.xcodeproj$/, ''),
			src = path.dirname(extension.projectPath),
			dest = path.join(this.buildDir, 'extensions', path.basename(src));

		this.logger.debug(__('Copying %s', extName.cyan));

		this.copyDirSync(src, dest, {
			rootIgnoreDirs: /^build$/i,
			ignoreDirs: this.ignoreDirs,
			ignoreFiles: this.ignoreFiles,
			beforeCopy: function (srcFile, destFile, srcStat) {
				delete this.buildDirFiles[destFile];

				if (path.basename(srcFile) === 'Info.plist') {
					// validate the info.plist
					var infoPlist = new appc.plist(srcFile);
					if (infoPlist.WKWatchKitApp) {
						infoPlist.WKCompanionAppBundleIdentifier = this.tiapp.id;

						// note: we track whether the versions changed here to not confuse the output with warnings
						// if doing an subsequent build and the extension's Info.plist hasn't changed.
						var origCFBundleShortVersionString = infoPlist.CFBundleShortVersionString,
							changedCFBundleShortVersionString = origCFBundleShortVersionString !== this.infoPlist.CFBundleShortVersionString,
							origCFBundleVersion = infoPlist.CFBundleVersion,
							changedCFBundleVersion = origCFBundleVersion !== this.infoPlist.CFBundleVersion;

						if (changedCFBundleShortVersionString) {
							infoPlist.CFBundleShortVersionString = this.infoPlist.CFBundleShortVersionString;
						}

						if (changedCFBundleVersion) {
							infoPlist.CFBundleVersion = this.infoPlist.CFBundleVersion;
						}

						var contents = infoPlist.toString('xml');
						if (!fs.existsSync(destFile) || contents !== fs.readFileSync(destFile).toString()) {
							if (!this.forceRebuild) {
								this.logger.info(__('Forcing rebuild: iOS Extension "%s" has changed since last build', extName));
								this.forceRebuild = true;
							}
							if (changedCFBundleShortVersionString) {
								this.logger.warn(__('WatchKit App\'s CFBundleShortVersionString "%s" does not match the app\'s CFBundleShortVersionString "%s".', origCFBundleShortVersionString, this.infoPlist.CFBundleShortVersionString));
								this.logger.warn(__('Setting the WatchKit App\'s CFBundleShortVersionString to "%s"', this.infoPlist.CFBundleShortVersionString));
							}
							if (changedCFBundleVersion) {
								this.logger.warn(__('WatchKit App\'s CFBundleVersion "%s" does not match the app\'s CFBundleVersion "%s".', origCFBundleVersion, this.infoPlist.CFBundleVersion));
								this.logger.warn(__('Setting the WatchKit App\'s CFBundleVersion to "%s"', this.infoPlist.CFBundleVersion));
							}
							this.logger.debug(__('Writing %s', destFile.cyan));
							fs.writeFileSync(destFile, contents);
						} else {
							this.logger.trace(__('No change, skipping %s', destFile.cyan));
						}

						return null;
					}
				}

				var prev = this.previousBuildManifest.files && this.previousBuildManifest.files[srcFile],
					srcStat = fs.statSync(srcFile),
					srcMtime = JSON.parse(JSON.stringify(srcStat.mtime)),
					srcHash = this.hash(fs.readFileSync(srcFile));

				if (!this.forceRebuild && prev && (prev.size !== srcStat.size || prev.mtime !== srcMtime || prev.hash !== srcHash)) {
					this.logger.info(__('Forcing rebuild: iOS Extension "%s" has changed since last build', extName));
					this.forceRebuild = true;
				}

				this.currentBuildManifest.files[srcFile] = {
					hash: srcHash,
					mtime: srcMtime,
					size: srcStat.size
				};
			}.bind(this),
			afterCopy: function (srcFile, destFile, srcStat, result) {
				if (!result) {
					this.logger.trace(__('No change, skipping %s', destFile.cyan));
				}
			}.bind(this)
		});
		extension.projectPath = path.join(dest, path.basename(extension.projectPath));
	}, this);
};

iOSBuilder.prototype.cleanXcodeDerivedData = function cleanXcodeDerivedData(next) {
	if (!this.forceCleanBuild) {
		return next();
	}

	var exe = this.xcodeEnv.executables.xcodebuild,
		args = ['clean'];

	this.logger.info(__('Cleaning Xcode derived data'));
	this.logger.debug(__('Invoking: %s', ('DEVELOPER_DIR=' + this.xcodeEnv.path + ' ' + exe + ' ' + args.join(' ')).cyan));

	var child = spawn(exe, args, {
		cwd: this.buildDir,
		env: {
			DEVELOPER_DIR: this.xcodeEnv.path,
			TMPDIR: process.env.TMPDIR,
			HOME: process.env.HOME,
			PATH: process.env.PATH
		}
	});

	function display(data) {
		data.toString().split('\n').forEach(function (line) {
			line = line.trim();
			line && this.logger.trace(line);
		}, this);
	}

	child.stdout.on('data', display.bind(this));
	child.stderr.on('data', display.bind(this));

	child.on('close', function (code) {
		if (!code && !fs.existsSync(this.xcodeAppDir)) {
			wrench.mkdirSyncRecursive(this.xcodeAppDir);
		}
		next(code);
	}.bind(this));
};

iOSBuilder.prototype.copyAppIcons = function copyAppIcons() {
	this.logger.info(__('Copying app icons'));

	var paths = [
			path.join(this.projectDir, 'Resources', 'iphone', this.tiapp.icon),
			path.join(this.projectDir, 'Resources', 'ios', this.tiapp.icon),
			path.join(this.platformPath, 'resources', this.tiapp.icon)
		],
		prev = this.previousBuildManifest.files && this.previousBuildManifest.files[this.tiapp.icon],
		src;

	while (src = paths.shift()) {
		if (fs.existsSync(src)) {
			var dest = path.join(this.xcodeAppDir, this.tiapp.icon),
				contents = fs.readFileSync(src),
				hash = this.hash(contents);

			this.currentBuildManifest.files[this.tiapp.icon] = {
				hash: hash,
				mtime: 0,
				size: contents.length
			};

			if (!fs.existsSync(dest) || !prev || prev.hash !== hash) {
				if (!this.copyFileSync(src, dest, { contents: contents })) {
					this.logger.trace(__('No change, skipping %s', dest.cyan));
				}
			} else {
				this.logger.trace(__('No change, skipping %s', dest.cyan));
			}

			delete this.buildDirFiles[dest];

			break;
		}
	}
};

iOSBuilder.prototype.copyItunesArtwork = function copyItunesArtwork() {
	// note: iTunesArtwork is a png image WITHOUT the file extension and the
	// purpose of this function is to copy it from the root of the project.
	// The preferred location of this file is <project-dir>/Resources/iphone
	// or <project-dir>/platform/iphone.
	if (/device|dist\-appstore|dist\-adhoc/.test(this.target)) {
		this.logger.info(__('Copying iTunes artwork'));

		var src = path.join(this.projectDir, 'iTunesArtwork'),
			dest = path.join(this.xcodeAppDir, 'iTunesArtwork');
		if (fs.existsSync(src) && !this.copyFileSync(src, dest)) {
			this.logger.trace(__('No change, skipping %s', dest.cyan));
		}
		delete this.buildDirFiles[src];

		src = path.join(this.projectDir, 'iTunesArtwork@2x');
		dest = path.join(this.xcodeAppDir, 'iTunesArtwork@2x');
		if (fs.existsSync(src) && this.copyFileSync(src, dest)) {
			this.logger.trace(__('No change, skipping %s', dest.cyan));
		}
		delete this.buildDirFiles[src];
	}
};

iOSBuilder.prototype.copyTitaniumFiles = function copyTitaniumFiles(next) {
	this.logger.info(__('Analyzing Resources directory'));

	var iconFilename = this.tiapp.icon || 'appicon.png',
		icon = iconFilename.match(/^(.*)\.(.+)$/),

		ignoreDirs = this.ignoreDirs,
		ignoreFiles = this.ignoreFiles,
		ignorePlatformDirs = new RegExp('^(' + ti.platforms.filter(function (p) { return p !== 'iphone' && p !== 'ios'; }).concat(['iphone', 'ios', 'blackberry', iconFilename]).join('|') + ')$'),

		unsymlinkableFileRegExp = new RegExp("^Default.*\.png|.+\.(otf|ttf)|iTunesArtwork" + (icon ? '|' + icon[1].replace(/\./g, '\\.') + '.*\\.' + icon[2] : '') + "$"),
		extRegExp = /\.(\w+)$/,

		resourcesToCopy = {},
		jsFiles = {},
		cssFiles = {},
		htmlJsFiles = {},

		copyDirOpts = {
			beforeCopy: function (srcFile, destFile, srcStat) {
				delete this.buildDirFiles[destFile];
			}.bind(this)
		};

	function walk(src, dest, ignore, origSrc) {
		fs.existsSync(src) && fs.readdirSync(src).forEach(function (name) {
			var from = path.join(src, name),
				relPath = from.replace((origSrc || src) + '/', ''),
				srcStat = fs.statSync(from),
				isDir = srcStat.isDirectory();

			if ((!ignore || !ignore.test(name)) && (!ignoreDirs || !isDir || !ignoreDirs.test(name)) && (!ignoreFiles || isDir || !ignoreFiles.test(name)) && fs.existsSync(from)) {
				var to = path.join(dest, name);

				if (srcStat.isDirectory()) {
					return walk(from, to, null, origSrc || src);
				}

				var ext = name.match(extRegExp),
					info = {
						src: from,
						dest: to,
						srcStat: srcStat
					};

				switch (ext && ext[1]) {
					case 'js':
						jsFiles[relPath] = info;
						break;

					case 'css':
						cssFiles[relPath] = info;
						break;

					case 'html':
						jsanalyze.analyzeHtmlFile(from, relPath.split('/').slice(0, -1).join('/')).forEach(function (file) {
							htmlJsFiles[file] = 1;
						});
						// fall through to default case

					default:
						resourcesToCopy[relPath] = info;
				}
			}
		});
	}

	walk(path.join(this.projectDir, 'Resources'),           this.xcodeAppDir, ignorePlatformDirs);
	walk(path.join(this.projectDir, 'Resources', 'iphone'), this.xcodeAppDir, new RegExp('^' + iconFilename + '$'));
	walk(path.join(this.projectDir, 'Resources', 'ios'),    this.xcodeAppDir, new RegExp('^' + iconFilename + '$'));

	// don't process JS files referenced from HTML files
	Object.keys(htmlJsFiles).forEach(function (file) {
		if (jsFiles[file]) {
			resourcesToCopy[file] = jsFiles[file];
			delete jsFiles[file];
		}
	});

	// if device family is 'iphone', then don't copy the iPad launch images
	if (this.deviceFamily === 'iphone') {
		Object.keys(resourcesToCopy).forEach(function (file) {
			var rel = file.replace(this.xcodeAppDir + '/', '');
			if (this.ipadLaunchImages.indexOf(rel) !== -1) {
				delete resourcesToCopy[file];
			}
		}, this);
	}

	// detect ambiguous modules
	this.modules.forEach(function (module) {
		var filename = module.id + '.js';
		if (jsFiles[filename]) {
			this.logger.error(__('There is a project resource "%s" that conflicts with a native iOS module', filename));
			this.logger.error(__('Please rename the file, then rebuild') + '\n');
			process.exit(1);
		}
	}, this);

	this.commonJsModules.forEach(function (module) {
		var filename = path.basename(module.libFile);
		if (jsFiles[filename]) {
			this.logger.error(__('There is a project resource "%s" that conflicts with a CommonJS module', filename));
			this.logger.error(__('Please rename the file, then rebuild') + '\n');
			process.exit(1);
		}
	}, this);

	series(this, [
		function copyResources() {
			this.logger.debug(__('Copying resources'));
			Object.keys(resourcesToCopy).forEach(function (file) {
				var info = resourcesToCopy[file],
					srcStat = fs.statSync(info.src),
					prev = this.previousBuildManifest.files && this.previousBuildManifest.files[file],
					destExists = fs.existsSync(info.dest),
					destStat = destExists && fs.statSync(info.dest),
					unsymlinkable = unsymlinkableFileRegExp.test(path.basename(file)),
					needsCopy = unsymlinkable && (!destExists || !prev || prev.size !== srcStat.size || prev.mtime !== JSON.parse(JSON.stringify(srcStat.mtime)) || prev.hash !== this.hash(fs.readFileSync(info.src))),
					contents = fs.readFileSync(info.src);

				if (!needsCopy && (unsymlinkable || !this.copyFileSync(info.src, info.dest, { contents: contents, forceCopy: needsCopy }))) {
					this.logger.trace(__('No change, skipping %s', info.dest.cyan));
				} else if (needsCopy && !this.copyFileSync(info.src, info.dest, { contents: contents, forceCopy: needsCopy })) {
					this.logger.trace(__('No change, skipping %s', info.dest.cyan));
				}

				this.currentBuildManifest.files[file] = {
					hash: this.hash(contents),
					mtime: srcStat.mtime,
					size: srcStat.size
				};

				delete this.buildDirFiles[info.dest];
			}, this);
		},

		function copyCSSFiles() {
			this.logger.debug(__('Copying CSS files'));
			Object.keys(cssFiles).forEach(function (file) {
				var info = cssFiles[file];
				if (this.minifyCSS) {
					this.logger.debug(__('Copying and minifying %s => %s', info.src.cyan, info.dest.cyan));
					var dir = path.dirname(info.dest);
					fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
					fs.writeFileSync(info.dest, new CleanCSS().minify(fs.readFileSync(info.src).toString()).styles);
				} else if (!this.copyFileSync(info.src, info.dest, { forceCopy: unsymlinkableFileRegExp.test(path.basename(file)) })) {
					this.logger.trace(__('No change, skipping %s', info.dest.cyan));
				}
				delete this.buildDirFiles[info.dest];
			}, this);
		},

		function copyCommonJSFiles() {
			this.logger.debug(__('Copying CommonJS files'));
			this.commonJsModules.forEach(function (module) {
				var dest = path.join(this.xcodeAppDir, path.basename(module.libFile));
				if (!this.copyFileSync(module.libFile, dest)) {
					this.logger.trace(__('No change, skipping %s', dest.cyan));
				}
				delete this.buildDirFiles[dest];
			}, this);
		},

		function copyPlatformFiles() {
			this.logger.debug(__('Copying platform files'));
			this.copyDirSync(path.join(this.projectDir, 'platform', 'iphone'), this.xcodeAppDir, copyDirOpts);
			this.copyDirSync(path.join(this.projectDir, 'platform', 'ios'), this.xcodeAppDir, copyDirOpts);
		},

		function copyModuleFiles() {
			this.logger.debug(__('Copying module files'));
			this.modules.forEach(function (module) {
				this.copyDirSync(path.join(module.modulePath, 'assets'), path.join(this.xcodeAppDir, 'modules', module.id.toLowerCase()), copyDirOpts);
				this.copyDirSync(path.join(module.modulePath, 'platform', 'iphone'), this.xcodeAppDir, copyDirOpts);
				this.copyDirSync(path.join(module.modulePath, 'platform', 'ios'), this.xcodeAppDir, copyDirOpts);
			}, this);
		},

		function processJSFiles(next) {
			this.logger.info(__('Processing JavaScript files'));

			async.eachSeries(Object.keys(jsFiles), function (file, next) {
				var info = jsFiles[file];
				if (this.encryptJS) {
					file = file.replace(/\./g, '_');
					info.dest = path.join(this.buildAssetsDir, file);
					this.jsFilesToEncrypt.push(file);
				}

				this.cli.createHook('build.ios.copyResource', this, function (from, to, cb) {
					try {
						// parse the AST
						var r = jsanalyze.analyzeJsFile(from, { minify: this.minifyJS });
					} catch (ex) {
						ex.message.split('\n').forEach(this.logger.error);
						this.logger.log();
						process.exit(1);
					}

					// we want to sort by the "to" filename so that we correctly handle file overwriting
					this.tiSymbols[info.dest] = r.symbols;

					var dir = path.dirname(to);
					fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);

					delete this.buildDirFiles[to];

					if (this.minifyJS) {
						this.cli.createHook('build.ios.compileJsFile', this, function (r, from, to, cb2) {
							if (!fs.existsSync(to) || r.contents !== fs.readFileSync(to).toString()) {
								this.logger.debug(__('Copying and minifying %s => %s', from.cyan, to.cyan));
								fs.writeFileSync(to, r.contents);
								this.jsFilesChanged = true;
							} else {
								this.logger.trace(__('No change, skipping %s', to.cyan));
							}
							cb2();
						})(r, from, to, cb);
					} else {
						if (!this.copyFileSync(from, to)) {
							this.logger.trace(__('No change, skipping %s', to.cyan));
						}
						cb();
					}
				})(info.src, info.dest, next);
			}.bind(this), next);
		},

		function writeAppProps() {
			var appPropsFile = this.encryptJS ? path.join(this.buildAssetsDir, '_app_props__json') : path.join(this.xcodeAppDir, '_app_props_.json'),
				props = {};

			this.encryptJS && this.jsFilesToEncrypt.push('_app_props__json');

			this.tiapp.properties && Object.keys(this.tiapp.properties).forEach(function (prop) {
				props[prop] = this.tiapp.properties[prop].value;
			}, this);

			var contents = JSON.stringify(props);
			if (!fs.existsSync(appPropsFile) || contents !== fs.readFileSync(appPropsFile).toString()) {
				this.logger.debug(__('Writing %s', appPropsFile.cyan));
				fs.writeFileSync(appPropsFile, contents);
			} else {
				this.logger.trace(__('No change, skipping %s', appPropsFile.cyan));
			}

			delete this.buildDirFiles[appPropsFile];
		}
	], next);
};

iOSBuilder.prototype.copyLocalizedLaunchScreens = function copyLocalizedLaunchScreens() {
	this.logger.info(__('Copying localized launch screens'));

	var screens = ti.i18n.findLaunchScreens(this.projectDir, this.logger, { ignoreDirs: this.ignoreDirs });

	if (screens.length) {
		screens.forEach(function (launchImage) {
			var parts = launchImage.split('/'),
				file = parts.pop(),
				lang = parts.pop(),
				dest = path.join(this.xcodeAppDir, lang + '.lproj', file),
				defaultLaunchScreenFile = path.join(this.xcodeAppDir, file),
				contents = fs.readFileSync(launchImage);

			this.currentBuildManifest.files[lang + '.lproj/' + file] = {
				hash: this.hash(contents),
				mtime: 0,
				size: contents.length
			};

			// check for it in the root of the xcode build folder
			if (fs.existsSync(defaultLaunchScreenFile)) {
				this.logger.debug(__('Removing %s, as it is being localized', defaultLaunchScreenFile.cyan));
				fs.unlinkSync(defaultLaunchScreenFile);
			}

			// TODO: we should only copy the image if we need to

			if (!this.copyFileSync(launchImage, dest, { contents: contents })) {
				this.logger.trace(__('No change, skipping %s', dest.cyan));
			}

			delete this.buildDirFiles[dest];
		}, this);
	} else {
		this.logger.debug(__('No localized launch screens found'));
	}
};

iOSBuilder.prototype.encryptJSFiles = function encryptJSFiles(next) {
	if (!this.jsFilesToEncrypt.length) {
		// nothing to encrypt, continue
		return next();
	}

	var routingFile = path.join(this.buildDir, 'Classes', 'ApplicationRouting.m'),
		destExists = fs.existsSync(routingFile),
		destStat = destExists && fs.statSync(routingFile),
		existingContent = destExists && fs.readFileSync(routingFile).toString(),
		prev = this.previousBuildManifest.files && this.previousBuildManifest.files['Classes/ApplicationRouting.m'];

	if (!this.jsFilesChanged && destExists && prev && prev.size === destStat.size && prev.mtime === JSON.parse(JSON.stringify(destStat.mtime)) && prev.hash === this.hash(existingContent)) {
		this.logger.info(__('No JavaScript file changes, skipping titanium_prep'));
		this.currentBuildManifest.files['Classes/ApplicationRouting.m'] = prev;
		return next();
	}

	var titaniumPrepHook = this.cli.createHook('build.ios.titaniumprep', this, function (exe, args, opts, done) {
		var tries = 0,
			completed = false;

		this.logger.info('Encrypting JavaScript files');
		this.jsFilesToEncrypt.forEach(function (file) {
			this.logger.debug(__('Preparing %s', file.cyan));
		}, this);

		async.whilst(
			function () {
				if (!completed && tries > 3) {
					// we failed 3 times, so just give up
					this.logger.error(__('titanium_prep failed to complete successfully'));
					this.logger.error(__('Try cleaning this project and build again') + '\n');
					process.exit(1);
				}
				return !completed;
			},
			function (cb) {
				this.logger.debug(__('Running %s', (exe + ' "' + args.slice(0, -1).join('" "') + '"').cyan));

				var child = spawn(exe, args, opts),
					out = '';

				child.stdin.write(this.jsFilesToEncrypt.join('\n'));
				child.stdin.end();

				child.stdout.on('data', function (data) {
					out += data.toString();
				});

				child.on('close', function (code) {
					if (code) {
						this.logger.error(__('titanium_prep failed to run (%s)', code) + '\n');
						process.exit(1);
					}

					if (out.indexOf('initWithObjectsAndKeys') !== -1) {
						// success!
						var contents = ejs.render(fs.readFileSync(path.join(this.templatesDir, 'ApplicationRouting.m')).toString(), { bytes: out });

						if (!destExists || contents !== existingContent) {
							if (!this.forceRebuild) {
								// since we just modified the ApplicationRouting.m, we need to force xcodebuild
								this.forceRebuild = true;
								this.logger.info(__('Forcing rebuild: %s changed since last build', routingFile.replace(this.buildDir + '/', '').cyan));
							}

							this.logger.debug(__('Writing application routing source file: %s', routingFile.cyan));
							fs.writeFileSync(routingFile, contents);

							var stat = fs.statSync(routingFile);
							this.currentBuildManifest.files['Classes/ApplicationRouting.m'] = {
								hash: this.hash(contents),
								mtime: stat.mtime,
								size: stat.size
							};
						} else {
							this.logger.trace(__('No change, skipping %s', routingFile.cyan));
						}

						delete this.buildDirFiles[routingFile];
						completed = true;
					} else {
						// failure, maybe it was a fluke, try again
						this.logger.warn(__('titanium_prep failed to complete successfully, trying again'));
						tries++;
					}

					cb();
				}.bind(this));
			}.bind(this),
			done
		);
	});

	titaniumPrepHook(
		path.join(this.platformPath, 'titanium_prep'),
		[ this.tiapp.id, this.buildAssetsDir, this.tiapp.guid ],
		{},
		next
	);
};

iOSBuilder.prototype.writeDebugProfilePlists = function writeDebugProfilePlists() {
	this.logger.info(__('Creating debugger and profiler plists'));

	function processPlist(filename, host) {
		var src = path.join(this.templatesDir, filename),
			dest = path.join(this.xcodeAppDir, filename),
			exists = fs.existsSync(dest);

		if (host) {
			var parts = host.split(':'),
				contents = ejs.render(fs.readFileSync(src).toString(), {
					host: parts.length > 0 ? parts[0] : '',
					port: parts.length > 1 ? parts[1] : '',
					airkey: parts.length > 2 ? parts[2] : '',
					hosts: parts.length > 3 ? parts[3] : ''
				});

			if (!exists || contents !== fs.readFileSync(dest).toString()) {
				if (!this.forceRebuild && /device|dist\-appstore|dist\-adhoc/.test(this.target)) {
					this.logger.info(__('Forcing rebuild: %s changed since last build', filename));
					this.forceRebuild = true;
				}
				this.logger.debug(__('Writing %s', dest.cyan));
				fs.writeFileSync(dest, contents);
			} else {
				this.logger.trace(__('No change, skipping %s', dest.cyan));
			}
		} else if (exists) {
			this.logger.debug(__('Removing %s', dest.cyan));
			fs.unlinkSync(dest);
		} else {
			this.logger.debug(__('Skipping %s', dest.cyan));
		}

		delete this.buildDirFiles[dest];
	}

	processPlist.call(this, 'debugger.plist', this.debugHost);
	processPlist.call(this, 'profiler.plist', this.profilerHost);
};

iOSBuilder.prototype.writeI18NFiles = function writeI18NFiles() {
	this.logger.info(__('Writing i18n files'));

	var data = ti.i18n.load(this.projectDir, this.logger),
		header = '/**\n' +
		         ' * Appcelerator Titanium\n' +
		         ' * this is a generated file - DO NOT EDIT\n' +
		         ' */\n\n';

	function add(obj, dest, map) {
		if (obj) {
			var rel = dest.replace(this.xcodeAppDir + '/', ''),
				contents = header + Object.keys(obj).map(function (name) {
					return '"' + (map && map[name] || name).replace(/\\"/g, '"').replace(/"/g, '\\"') +
						'" = "' + (''+obj[name]).replace(/%s/g, '%@').replace(/\\"/g, '"').replace(/"/g, '\\"') + '";';
				}).join('\n');

			this.currentBuildManifest.files[rel] = {
				hash: this.hash(contents),
				mtime: 0,
				size: contents.length
			};

			if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
				if (!this.forceRebuild && /device|dist\-appstore|dist\-adhoc/.test(this.target)) {
					this.logger.info(__('Forcing rebuild: %s changed since last build', rel));
					this.forceRebuild = true;
				}
				this.logger.debug(__('Writing %s', dest.cyan));
				fs.writeFileSync(dest, contents);
			} else {
				this.logger.trace(__('No change, skipping %s', dest.cyan));
			}

			delete this.buildDirFiles[dest];
		}
	}

	Object.keys(data).forEach(function (lang) {
		var dir = path.join(this.xcodeAppDir, lang + '.lproj');
		fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);

		add.call(this, data[lang].app, path.join(dir, 'InfoPlist.strings'), { appname: 'CFBundleDisplayName' });
		add.call(this, data[lang].strings, path.join(dir, 'Localizable.strings'));
	}, this);
};

iOSBuilder.prototype.processTiSymbols = function processTiSymbols() {
	this.logger.info(__('Processing Titanium symbols'));

	var namespaces = {
			'analytics': 1,
			'api': 1,
			'network': 1,
			'platform': 1,
			'ui': 1
		},
		symbols = {};

	// generate the default symbols
	Object.keys(namespaces).forEach(function (ns) {
		symbols[ns.toUpperCase()] = 1;
	});

	function addSymbol(symbol) {
		var parts = symbol.replace(/^(Ti|Titanium)./, '').split('.');
		if (parts.length) {
			namespaces[parts[0].toLowerCase()] = 1;
			while (parts.length) {
				symbols[parts.join('.').replace(/\.create/gi, '').replace(/\./g, '').replace(/\-/g, '_').toUpperCase()] = 1;
				parts.pop();
			}
		}
	}

	// add the symbols we found
	Object.keys(this.tiSymbols).forEach(function (file) {
		this.tiSymbols[file].forEach(addSymbol);
	}, this);

	// for each module, if it has a metadata.json file, add its symbols
	this.modules.forEach(function (m) {
		var file = path.join(m.modulePath, 'metadata.json');
		if (fs.existsSync(file)) {
			try {
				var metadata = JSON.parse(fs.readFileSync(file));
				if (metadata && typeof metadata === 'object' && Array.isArray(metadata.exports)) {
					metadata.exports.forEach(addSymbol);
				}
			} catch (e) {}
		}
	});

	// for each Titanium namespace, copy any resources
	this.logger.debug(__('Processing Titanium namespace resources'));
	Object.keys(namespaces).forEach(function (ns) {
		var src = path.join(this.platformPath, 'modules', ns, 'images');
		if (fs.existsSync(src)) {
			this.copyDirSync(src, path.join(this.xcodeAppDir, 'modules', ns, 'images'), {
				beforeCopy: function (srcFile, destFile, srcStat) {
					delete this.buildDirFiles[destFile];
				}.bind(this)
			});
		}
	}, this);

	var dest = path.join(this.buildDir, 'Classes', 'defines.h'),
		contents;

	delete this.buildDirFiles[dest];

	// if we're doing a simulator build or we're including all titanium modules,
	// return now since we don't care about writing the defines.h
	if (this.target === 'simulator' || this.includeAllTiModules) {
		var definesFile = path.join(this.platformPath, 'Classes', 'defines.h');

		if (this.useJSCore) {
			contents = fs.readFileSync(definesFile).toString() + '\n#define USE_JSCORE_FRAMEWORK';
		} else {
			// just symlink the file
			if (!this.copyFileSync(definesFile, dest)) {
				this.logger.trace(__('No change, skipping %s', dest.cyan));
			}
			return;
		}
	} else {
		// build the defines.h file
		contents = [
			'// Warning: this is generated file. Do not modify!',
			'',
			'#define TI_VERSION ' + this.titaniumSdkVersion
		].concat(Object.keys(symbols).sort().map(function (s) {
			return '#define USE_TI_' + s;
		}));

		var infoPlist = this.infoPlist;
		if (Array.isArray(infoPlist.UIBackgroundModes) && infoPlist.UIBackgroundModes.indexOf('remote-notification') !== -1) {
			contents.push('#define USE_TI_SILENTPUSH');
		}
		if (Array.isArray(infoPlist.UIBackgroundModes) && infoPlist.UIBackgroundModes.indexOf('fetch') !== -1) {
			contents.push('#define USE_TI_FETCH');
		}

		contents.push(
			'#ifdef USE_TI_UILISTVIEW',
			'#define USE_TI_UILABEL',
			'#define USE_TI_UIBUTTON',
			'#define USE_TI_UIIMAGEVIEW',
			'#define USE_TI_UIPROGRESSBAR',
			'#define USE_TI_UIACTIVITYINDICATOR',
			'#define USE_TI_UISWITCH',
			'#define USE_TI_UISLIDER',
			'#define USE_TI_UITEXTFIELD',
			'#define USE_TI_UITEXTAREA',
			'#endif'
		);

		if (this.useJSCore) {
			contents.push('#define USE_JSCORE_FRAMEWORK')
		}

		contents = contents.join('\n');
	}

	if (!fs.existsSync(dest) || contents !== fs.readFileSync(dest).toString()) {
		if (!this.forceRebuild) {
			this.logger.info(__('Forcing rebuild: %s has changed since last build', 'Classes/defines.h'));
			this.forceRebuild = true;
		}
		this.logger.debug(__('Writing %s', dest.cyan));
		fs.writeFileSync(dest, contents);
	} else {
		this.logger.trace(__('No change, skipping %s', dest.cyan));
	}
};

iOSBuilder.prototype.removeFiles = function removeFiles(next) {
	this.unmarkBuildDirFiles(path.join(this.buildDir, 'build', this.tiapp.name + '.build'));
	this.products.forEach(function (product) {
		this.unmarkBuildDirFiles(path.join(this.iosBuildDir, product));
		this.unmarkBuildDirFiles(path.join(this.iosBuildDir, product + '.dSYM'));
	}, this);

	// mark a few files that would be generated by xcodebuild
	delete this.buildDirFiles[path.join(this.xcodeAppDir, this.tiapp.name)];
	delete this.buildDirFiles[path.join(this.xcodeAppDir, 'Info.plist')];
	delete this.buildDirFiles[path.join(this.xcodeAppDir, 'PkgInfo')];

	this.logger.info(__('Removing files'));

	Object.keys(this.buildDirFiles).forEach(function (file) {
		try {
			this.logger.debug(__('Removing %s', file.cyan));
			fs.unlinkSync(file);
		} catch (ex) {}
	}, this);

	this.logger.debug(__('Removing empty directories'));
	appc.subprocess.run('find', ['.', '-type', 'd', '-empty', '-delete'], { cwd: this.xcodeAppDir }, next);
};

iOSBuilder.prototype.invokeXcodeBuild = function invokeXcodeBuild(next) {
	if (!this.forceRebuild) {
		this.logger.info(__('Skipping xcodebuild'));
		return next();
	}

	this.logger.info(__('Invoking xcodebuild'));

	var xcodebuildHook = this.cli.createHook('build.ios.xcodebuild', this, function (exe, args, opts, done) {
			this.logger.debug(__('Invoking: %s', ('DEVELOPER_DIR=' + this.xcodeEnv.path + ' ' + exe + ' ' + args.map(function (a) { return a.indexOf(' ') !== -1 ? '"' + a + '"' : a; }).join(' ')).cyan));

			var p = spawn(exe, args, opts),
				out = [],
				err = [],
				stopOutputting = false,
				buffer = '';

			function printLine(line) {
				if (line.length) {
					out.push(line);
					if (line.indexOf('Failed to minify') !== -1) {
						stopOutputting = true;
					}
					if (!stopOutputting) {
						this.logger.trace(line);
					}
				}
			}

			p.stdout.on('data', function (data) {
				buffer += data.toString();
				var lines = buffer.split('\n');
				buffer = lines.pop();
				lines.forEach(printLine.bind(this));
			}.bind(this));

			p.stderr.on('data', function (data) {
				data.toString().split('\n').forEach(function (line) {
					if (line.length) {
						err.push(line);
					}
				}, this);
			}.bind(this));

			p.on('close', function (code, signal) {
				if (buffer.length) {
					buffer.split('\n').forEach(printLine.bind(this));
				}

				if (code) {
					// first see if we errored due to a dependency issue
					if (err.join('\n').indexOf('Check dependencies') !== -1) {
						var len = out.length;
						for (var i = len - 1; i >= 0; i--) {
							if (out[i].indexOf('Check dependencies') !== -1) {
								if (out[out.length - 1].indexOf('Command /bin/sh failed with exit code') !== -1) {
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
						if (out[i].indexOf('Failed to minify') !== -1) {
							if (out[out.length - 1].indexOf('Command /bin/sh failed with exit code') !== -1) {
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

				// end of the line
				done(code);
			}.bind(this));
		});

	xcodebuildHook(
		this.xcodeEnv.executables.xcodebuild,
		[
			'build',
			'-target', this.tiapp.name,
			'-configuration', this.xcodeTarget,
			'-sdk', this.xcodeTargetOS
		],
		{
			cwd: this.buildDir,
			env: {
				DEVELOPER_DIR: this.xcodeEnv.path,
				TMPDIR: process.env.TMPDIR,
				HOME: process.env.HOME,
				PATH: process.env.PATH,
				TITANIUM_CLI_XCODEBUILD: 'Enjoy hacking? http://jobs.appcelerator.com/',
				TITANIUM_CLI_IMAGES_OPTIMIZED: this.target === 'simulator' ? '' : this.imagesOptimizedFile
			}
		},
		next
	);
};

iOSBuilder.prototype.optimizeFiles = function optimizeFiles(next) {
	// if we're doing a simulator build, return now since we don't care about optimizing images
	if (this.target === 'simulator') {
		return next();
	}

	this.logger.info(__('Optimizing .plist and .png files'));

	var plistRegExp = /\.plist$/,
		pngRegExp = /\.png$/,
		plists = [],
		pngs = [],
		xcodeAppDir = this.xcodeAppDir + '/',
		previousBuildFiles = this.previousBuildManifest.files || {},
		currentBuildFiles = this.currentBuildManifest.files,
		logger = this.logger;

	function add(arr, name, file) {
		var rel = file.replace(xcodeAppDir, ''),
			prev = previousBuildFiles[rel],
			curr = currentBuildFiles[rel];

		if (!prev || prev.hash !== curr.hash) {
			arr.push(file);
		} else {
			logger.trace(__('No change, skipping %s', file.cyan));
		}
	}

	// find all plist and png files
	(function walk(dir) {
		fs.readdirSync(dir).forEach(function (name) {
			var file = path.join(dir, name);
			if (fs.existsSync(file)) {
				if (fs.statSync(file).isDirectory()) {
					walk(file);
				} else if (name === 'InfoPlist.strings' || name === 'Localizable.strings' || plistRegExp.test(name)) {
					add(plists, name, file);
				} else if (pngRegExp.test(name)) {
					add(pngs, name, file);
				}
			}
		});
	}(this.xcodeAppDir));

	parallel(this, [
		function (next) {
			async.each(plists, function (file, cb) {
				this.logger.debug(__('Optimizing %s', file.cyan));
				appc.subprocess.run('plutil', ['-convert', 'binary1', file], cb);
			}.bind(this), next);
		},

		function (next) {
			if (!fs.existsSync(this.xcodeEnv.executables.pngcrush)) {
				this.logger.warn(__('Unable to find pngcrush in Xcode directory, skipping image optimization'));
				return next();
			}

			async.each(pngs, function (file, cb) {
				var output = file + '.tmp';
				this.logger.debug(__('Optimizing %s', file.cyan));
				appc.subprocess.run(this.xcodeEnv.executables.pngcrush, ['-q', '-iphone', '-f', 0, file, output], function (code, out, err) {
					if (code) {
						this.logger.error(__('Failed to optimize %s (code %s)', file, code));
					} else {
						fs.existsSync(file) && fs.unlinkSync(file);
						fs.renameSync(output, file);
					}
					cb();
				}.bind(this));
			}.bind(this), next);
		}
	], function (err) {
		this.logger.debug(__('Image optimization complete'));
		appc.fs.touch(this.imagesOptimizedFile);
		next();
	});
};

iOSBuilder.prototype.writeBuildManifest = function writeBuildManifest(next) {
	this.cli.createHook('build.ios.writeBuildManifest', this, function (manifest, cb) {
		fs.existsSync(this.buildDir) || wrench.mkdirSyncRecursive(this.buildDir);
		fs.existsSync(this.buildManifestFile) && fs.unlinkSync(this.buildManifestFile);
		fs.writeFile(this.buildManifestFile, JSON.stringify(this.buildManifest = manifest, null, '\t'), cb);
	})(this.currentBuildManifest, next);
};

// create the builder instance and expose the public api
(function (iosBuilder) {
	exports.config   = iosBuilder.config.bind(iosBuilder);
	exports.validate = iosBuilder.validate.bind(iosBuilder);
	exports.run      = iosBuilder.run.bind(iosBuilder);
}(new iOSBuilder(module)));
