/*
 * build.js: Titanium Android CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	version = appc.version,

	async = require('async'),
	fields = require('fields'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	wrench = require('wrench'),

	spawn = require('child_process').spawn,
	detect = require('../lib/detect').detect,

	ADB = require('titanium-sdk/lib/adb'),
	EmulatorManager = require('titanium-sdk/lib/emulator'),
	android = require('titanium-sdk/lib/android'),
	Builder = require('titanium-sdk/lib/builder'),

	packageJson = appc.pkginfo.package(module),

	androidEnv,
	deployTypes = ['production', 'test', 'development'],
	targets = ['emulator', 'device', 'dist-playstore'];

exports.config = function (logger, config, cli) {
	return function (finished) {
		detect(config, null, function (env) {
			var conf;
			androidEnv = env;

			cli.createHook('build.android.config', function (callback) {
				callback({
					options: {
						'alias': {
							abbr: 'L',
							desc: __('the alias for the keystore'),
							hint: 'alias',
							prompt: function (callback) {
								fields.text({
									promptLabel: __("What is the name of the keystore's certificate alias?"),
									validate: function (value, cb) {
										if (!value) logger.error(__('Invalid keystore alias'));
										cb(!value, value);
									}
								}).prompt(callback);
							}
						},
						'android-sdk': {
							abbr: 'A',
							callback: function (value) {
								return value.trim();
							},
							default: config.android && config.android.sdkPath && afs.resolvePath(config.android.sdkPath),
							desc: __('the path to the Android SDK'),
							hint: __('path'),
							required: true,
							prompt: function (callback) {
								fields.file({
									promptLabel: __('Where is the Android SDK?'),
									default: config.android && config.android.sdkPath && afs.resolvePath(config.android.sdkPath),
									complete: true,
									showHidden: true,
									ignoreDirs: config.get('cli.ignoreDirs'),
									ignoreFiles: config.get('cil.ignoreFiles'),
									validate: function (value, cb) {
										if (!value) {
											logger.error(__('Invalid Android SDK path'));
											return cb(true);
										}
										android.findSDK(value, config, function (err, results) {
											if (err) logger.error(__('Invalid Android SDK path: %s', value));
											cb(err, results);
										});
									}
								}).prompt(function (err, value) {
									if (err) return callback(err);
									// rerun detection
									config.set('android.sdkPath', value);
									detect(config, { bypassCache: true }, function (env) {
										androidEnv = env;
										callback(null, value);
									});
								});
							}
						},
						'avd-abi': {
							abbr: 'B',
							desc: __('the abi for the Android emulator; deprecated, use --device')
						},
						'avd-id': {
							abbr: 'I',
							desc: __('the id for the Android emulator; deprecated, use --device'),
							hint: __('id')
						},
						'avd-skin': {
							abbr: 'S',
							desc: __('the skin for the Android emulator; deprecated, use --device'),
							hint: __('skin'),
							default: 'HVGA'
						},
						'debug-host': {
							hidden: true
						},
						'deploy-type': {
							abbr: 'D',
							desc: __('the type of deployment; only used with target is %s or %s', 'emulator'.cyan, 'device'.cyan),
							hint: __('type'),
							values: ['test', 'development'],
						},
						'device': {
							abbr: 'V',
							desc: __('the name for the device or Android emulator to install the application to'),
							hint: __('name'),
							required: true,
							prompt: function (callback) {
								// we need to get a list of all devices and emulators
								async.series({
									devices: function (cb) {
										if (cli.argv.target != 'device') return cb();
										var adb = new ADB(config);
										adb.devices(cb);
									},
									avds: function (cb) {
										if (cli.argv.target != 'emulator') return cb();
										new EmulatorManager(config).detect(cb);
									}
								}, function (err, results) {
									var opts = {},
										avds = {};

									if (Array.isArray(results.devices) && results.devices.length) {
										opts[__('Devices')] = results.devices.map(function (d) {
											return {
												name: d.model || d.manufacturer,
												id: d.id,
												version: d.release,
												abi: Array.isArray(d.abi) ? d.abi.join(',') : d.abi,
												type: 'device'
											};
										});
									}

									if (Array.isArray(results.avds) && results.avds.length) {
										var avd = __('Android Emulators'),
											gm = __('Genymotion Emulators');
										results.avds.forEach(function (a) {
											if (a.type == 'avd') {
												avds[a.name] = 1;
												opts[avd] || (opts[avd] = []);
												opts[avd].push({
													name: a.name,
													id: a.name,
													version: a.target,
													abi: a.abi,
													type: a.type
												});
											} else if (a.type == 'genymotion') {
												opts[gm] || (opts[gm] = []);
												opts[gm].push({
													name: a.name,
													id: a.guid,
													version: a.target,
													abi: a.abi,
													type: a.type
												});
											}
										});
									}

									// maybe they specified the old legacy --avd-id stuff
									if (avds['titanium_' + cli.argv['avd-id'] + '_' + cli.argv['avd-skin'] + '_' + cli.argv['avd-abi']]
										|| avds['titanium_' + cli.argv['avd-id'] + '_' + cli.argv['avd-skin']]) {
										return callback();
									}

									// if there are no devices/emulators, error
									if (!Object.keys(opts).length) {
										logger.error(__('Unable to find any devices or emulators') + '\n');
										logger.log(__('Please create an emulator or plug in an Android device, then try again.') + '\n');
										process.exit(1);
									}

									fields.select({
										title: __('Where do you want to install your application after building?'),
										promptLabel: __('Select a device by number or name'),
										formatters: {
											option: function (opt, idx, num) {
												return '    ' + num + opt.name.cyan + ' (' + opt.id + ')';
											}
										},
										margin: '',
										optionLabel: 'name',
										optionValue: 'id',
										numbered: true,
										relistOnError: true,
										complete: true,
										suggest: true,
										options: opts
									}).prompt(callback);
								});
							}
						},
						'key-password': {
							desc: __('the password for the keystore private key (defaults to the store-password)'),
							hint: 'keypass',
							password: true,
							prompt: {
								label: __('Keystore private key password'),
								error: __('Invalid keystore private key password'),
								validator: function (password) {
									if (!password) {
										throw new appc.exception(__('Invalid keystore private key password'));
									}
									return true;
								}
							}
						},
						'keystore': {
							abbr: 'K',
							desc: __('the location of the keystore file'),
							hint: 'path',
							prompt: {
								label: __('Keystore File Location'),
								error: __('Invalid keystore file'),
								validator: function (keystorePath) {
									keystorePath = afs.resolvePath(keystorePath);
									if (!afs.exists(keystorePath) || !fs.lstatSync(keystorePath).isFile()) {
										throw new appc.exception(__('Invalid keystore file location'));
									}
									return true;
								}
							}
						},
						'output-dir': {
							abbr: 'O',
							desc: __('the output directory when using %s', 'dist-playstore'.cyan),
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
						'store-password': {
							abbr: 'P',
							alias: 'password',
							desc: __('the password for the keystore'),
							hint: 'storepass',
							password: true,
							prompt: {
								label: __('Keystore password'),
								error: __('Invalid keystore password'),
								validator: function (password) {
									if (!password) {
										throw new appc.exception(__('Invalid keystore password'));
									}
									// TODO: check that the password actually works
									return true;
								}
							}
						},
						target: {
							abbr: 'T',
							callback: function (value) {
								// as soon as we know the target, toggle required options for validation
								if (value === 'dist-playstore') {
									conf.options['keystore'].required = true;
									conf.options['store-password'].required = true;
									conf.options['key-password'].required = true;
									conf.options['alias'].required = true;
									conf.options['output-dir'].required = true;
									conf.options['deploy-type'].values = ['production'];
									conf.options['device'].values = false;
								}
							},
							default: 'emulator',
							desc: __('the target to build for'),
							required: true,
							values: targets
						}
					}
				});
			})(function (err, results, result) {
				conf = result;
				appc.jdk.detect(config, null, function (r) {
					jdk = r;
					finished(conf);
				});
			});
		}, config.android && config.android.sdkPath, config.android && config.android.ndkPath);
	}
};

exports.validate = function (logger, config, cli) {
	return function (finished) {
		ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
		ti.validateTiappXml(logger, cli.tiapp);

		if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
			// we're running the build command for the wrong SDK version, gracefully return
			return false;
		}

		// figure out the minimum Android SDK version
		var minAndroidSdkVersion = appc.version.parseMin(packageJson.vendorDependencies['android sdk']);

		// make sure we have an Android SDK and some Android targets
		if (!androidEnv || !Object.keys(androidEnv.targets).length) {
			logger.error(__('Unable to detect Android SDK targets.') + '\n');
			logger.log(__('Please download SDK targets via Android SDK Manager and try again. (version %s or newer)', version.format(minAndroidSdkVersion, 3)) + '\n');
			process.exit(1);
		}

		// check if the Android SDK is in a directory containing ampersands
		androidEnv.issues.forEach(function(issue) {
			if (issue.id == 'ANDROID_SDK_PATH_CONTAINS_AMPERSANDS') {
				issue.message.split('\n').forEach(function (line) {
					logger.error(line);
				});
				logger.log();
				process.exit(1);
			}
		});

		// check that the Android SDK is sane
		androidEnv.issues.forEach(function(issue) {
			if (/^ANDROID_SDK_(NOT_FOUND|MISSING_PROGRAMS)$/.test(issue.id)) {
				issue.message.split('\n').forEach(function (line) {
					logger.error(line);
				});
				logger.log();
				process.exit(1);
			}
		});

		// check that the target is valid
		if (targets.indexOf(cli.argv.target) == -1) {
			logger.error(__('Invalid target "%s"', cli.argv.target) + '\n');
			appc.string.suggest(cli.argv.target, targets, logger.log, 3);
			process.exit(1);
		}

		// Check for java version
		if (!jdk.version) {
			logger.error(__('"Missing Java SDK. Please make sure Java SDK is on your PATH') + '\n');
			process.exit(1);
		} else if (version.satisfies(jdk.version, packageJson.vendorDependencies.java)) {
			logger.error(__('JDK version %s detected, but at least %s is required', androidEnv.java.version, minJavaSdkVersion) + '\n');
			process.exit(1);
		}

		// check the Android specific app id rules
		if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(cli.tiapp.id)) {
			logger.error(__('tiapp.xml contains an invalid app id "%s"', cli.tiapp.id));
			logger.error(__('The app id must consist of letters, numbers, and underscores.'));
			logger.error(__('The first character must be a letter or underscore.'));
			logger.error(__('The first character after a period must not be a number.'));
			logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
			process.exit(1);
		}

		if (!ti.validAppId(cli.tiapp.id)) {
			logger.error(__('Invalid app id "%s"', cli.tiapp.id));
			logger.error(__('The app id must not contain Java reserved words.') + '\n');
			process.exit(1);
		}

		// check the default unit
		cli.tiapp.properties || (cli.tiapp.properties = {});
		cli.tiapp.properties['ti.ui.defaultunit'] || (cli.tiapp.properties['ti.ui.defaultunit'] = { type: 'string', value: 'system'});
		if (!/^system|px|dp|dip|mm|cm|in$/.test(cli.tiapp.properties['ti.ui.defaultunit'].value)) {
			logger.error(__('Invalid "ti.ui.defaultunit" property value "%s"', cli.tiapp.properties['ti.ui.defaultunit'].value) + '\n');
			logger.log(__('Valid units:'));
			'system,px,dp,dip,mm,cm,in'.split(',').forEach(function (unit) {
				logger.log('  ' + unit.cyan);
			});
			logger.log();
			process.exit(1);
		}

		var usesSDK = cli.tiapp.android && cli.tiapp.android.manifest && cli.tiapp.android.manifest['uses-sdk'],
			minSDK = cli.tiapp.android && cli.tiapp.android['tool-api-level'] || 10,
			targetSDK = null;
		if (usesSDK) {
			usesSDK['android:minSdkVersion'] && (minSDK = usesSDK['android:minSdkVersion']);
			usesSDK['android:targetSdkVersion'] && (targetSDK = usesSDK['android:targetSdkVersion']);
		}
		if (minSDK < minAndroidSdkVersion) {
			logger.error(__('Minimum Android SDK version must be 10 or newer') + '\n');
			process.exit(1);
		}
		if (targetSDK && targetSDK < minAndroidSdkVersion) {
			logger.error(__('Target Android SDK version must be 10 or newer') + '\n');
			process.exit(1);
		}

		// Set defaults for target Emulator
		if (cli.argv.target == 'emulator') {
			androidEnv.issues.forEach(function (issue) {
				if (/^ANDROID_MISSING_(LIBGL|I386_ARCH|IA32_LIBS|32BIT_GLIBC|32BIT_LIBSTDCPP)$/.test(issue.id)) {
					issue.message.split('\n').forEach(function (line) {
						logger.warn(line);
					});
				}
			});

			var avdid = parseInt(cli.argv['avd-id']);

			// double check and make sure that the avd-id passed (or the default)
			// exists as an android target and if not, deal with it vs. bombing
			if (isNaN(avdid) || !androidEnv.targets || !androidEnv.targets[avdid]) {
				var keys = Object.keys(androidEnv.targets || {}),
					name,
					skins;

				avdid = 0;
				for (var c = 0; c < keys.length; c++) {
					var target = androidEnv.targets[keys[c]],
						api = target['api-level'];

					// search for the first api > 10 (Android 2.3.3) which is what titanium requires
					if (api >= 10) {
						avdid = keys[c];
						name = target.name;
						skins = target.skins;
						break;
					}
				}

				if (avdid) {
					// if we found a valid avd id, let's use it but warn the user
					if (cli.argv['avd-id']) {
						logger.warn(__('AVD ID %s not found. Launching with the AVD ID %s%s.',
							(''+cli.argv['avd-id']).cyan, (''+avdid).cyan, name ? ' (' + name + ')' : ''));
					} else {
						logger.warn(__('No AVD ID specified. Launching with the AVD ID %s%s.',
							(''+avdid).cyan, name ? ' (' + name + ')' : ''));
					}
					cli.argv['avd-id'] = avdid;
					var s = skins.length && skins[skins.length - 1];
					if (s && skins && skins.indexOf(cli.argv['avd-skin']) == -1) {
						logger.warn(__('AVD ID %s does not support skin %s. Launching with the AVD skin %s.',
							avdid, (''+cli.argv['avd-skin']).cyan, (''+s).cyan));
						cli.argv['avd-skin'] = s;
					}
				} else {
					// if we couldn't find one
					if (cli.argv['avd-id']) {
						logger.error(__('AVD ID %s not found and no suitable Android SDKs found. Please install Android SDK 2.3.3 or newer.', (''+cli.argv['avd-id']).cyan) + '\n');
					} else {
						logger.error(__('No suitable Android SDKs found. Please install Android SDK 2.3.3 or newer.', (''+cli.argv['avd-id']).cyan) + '\n');
					}
					process.exit(1);
				}
			}

			if (!cli.argv['avd-abi']) {
				// check to make sure exists
				if (androidEnv.targets && androidEnv.targets[cli.argv['avd-id']]) {
					cli.argv['avd-abi'] = androidEnv.targets[cli.argv['avd-id']].abis[0] || androidEnv.targets['7'].abis[0] || 'armeabi';
				} else {
					logger.warn(__('AVD ID %s not found. Please use %s to specify a valid AVD ID. Ignoring --avd-abi.', cli.argv['avd-id'], '--avd-id'.cyan));
				}
			}
		}

		// Validate arguments for dist-playstore
		if (cli.argv.target == 'dist-playstore') {
			if(!cli.argv['alias']) {
				logger.error(__('Invalid required option "%s"', '--alias') + '\n');
				process.exit(1);
			}

			if (!cli.argv.keystore) {
				logger.error(__('Missing required keystore file path') + '\n');
				process.exit(1);
			}

			cli.argv.keystore = afs.resolvePath(cli.argv.keystore);
			if (!afs.exists(cli.argv.keystore) || !fs.statSync(cli.argv.keystore).isFile()) {
				logger.error(__('Invalid keystore file: %s', cli.argv.keystore.cyan) + '\n');
				process.exit(1);
			}

			if(!cli.argv['password']) {
				logger.error(__('Invalid required option "%s"', '--password') + '\n');
				process.exit(1);
			}

			if (!cli.argv['output-dir']) {
				logger.error(__('Invalid required option "%s"', '--output-dir') + '\n');
				process.exit(1);
			}

			cli.argv['output-dir'] = afs.resolvePath(cli.argv['output-dir']);
			if (!afs.exists(cli.argv['output-dir'])) {
				wrench.mkdirSyncRecursive(cli.argv['output-dir']);
			} else if (!fs.statSync(cli.argv['output-dir']).isDirectory()) {
				logger.error(__('Invalid required option "%s", option is not a directory.', '--output-dir') + '\n');
				process.exit(1);
			}
		} else {
			// not dist-playstore

			['debug', 'profiler'].forEach(function (type) {
				if (cli.argv[type + '-host']) {
					if (typeof cli.argv[type + '-host'] == 'number') {
						logger.error(__('Invalid %s host "%s"', type, cli.argv[type + '-host']) + '\n');
						logger.log(__('The %s host must be in the format "host:port".', type) + '\n');
						process.exit(1);
					}

					var parts = cli.argv[type + '-host'].split(':');

					if (parts.length < 2) {
						logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
						logger.log(__('The %s host must be in the format "host:port".', type) + '\n');
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

		// check that the build directory is writeable
		var buildDir = path.join(cli.argv['project-dir'], 'build');
		if (!afs.isDirWritable(buildDir)) {
			logger.error(__('The build directory is not writeable: %s', buildDir) + '\n');
			logger.log(__('Make sure the build directory is writeable and that you have sufficient free disk space.') + '\n');
			process.exit(1);
		}

		// make sure we have an icon
		if (!cli.tiapp.icon || !['Resources', 'Resources/android'].some(function (p) {
				return fs.existsSync(cli.argv['project-dir'], p, cli.tiapp.icon);
			})) {
			cli.tiapp.icon = 'appicon.png';
		}

		// validate modules
		var titaniumAndroidSdkPath = afs.resolvePath(__dirname, '..', '..'),
			titaniumSdkVersion = path.basename(path.join(titaniumAndroidSdkPath, '..')),
			moduleSearchPaths = [ cli.argv['project-dir'], afs.resolvePath(titaniumAndroidSdkPath, '..', '..', '..', '..') ],
			modules = [],
			commonJsModules = [];
		if (config.paths && Array.isArray(config.paths.modules)) {
			moduleSearchPaths = moduleSearchPaths.concat(config.paths.modules);
		}
		appc.timodule.find(cli.tiapp.modules, 'android', cli.argv.deployType, titaniumSdkVersion, moduleSearchPaths, logger, function (modules) {
			if (modules.missing.length) {
				logger.error(__('Could not find all required Titanium Modules:'))
				modules.missing.forEach(function (m) {
					logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t deploy-type: ' + m.deployType);
				}, this);
				logger.log();
				process.exit(1);
			}

			if (modules.incompatible.length) {
				logger.error(__('Found incompatible Titanium Modules:'));
				modules.incompatible.forEach(function (m) {
					logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t min sdk: ' + m.minsdk);
				}, this);
				logger.log();
				process.exit(1);
			}

			if (modules.conflict.length) {
				logger.error(__('Found conflicting Titanium modules:'));
				modules.conflict.forEach(function (m) {
					logger.error('   ' + __('Titanium module "%s" requested for both iOS and CommonJS platforms, but only one may be used at a time.', m.id));
				}, this);
				logger.log();
				process.exit(1);
			}

			modules = modules.found;

			var hashes = [];

			modules.found.forEach(function (module) {
				if (module.platform.indexOf('commonjs') != -1) {
					commonJsModules.push(module);
				} else {
					module.libName = module.name + '.jar',
					module.libFile = path.join(module.modulePath, module.libName);

					if (!fs.existsSync(module.libFile)) {
						this.logger.error(__('Module %s version %s is missing library file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, module.libFile.cyan) + '\n');
						process.exit(1);
					}

					hashes.push(module.hash = afs.hashFile(module.libFile));

					logger.info(__('Detected third-party native iOS module: %s version %s', module.id.cyan, (module.manifest.version || 'latest').cyan));
					nativeLibModules.push(module);
				}

				// scan the module for any CLI hooks
				cli.scanHooks(path.join(module.modulePath, 'hooks'));
			}, this);

			finished();
		});
	};
};

exports.run = function (logger, config, cli, finished) {

	// temporary debug output
	console.log('\nDONE!\n');

	finished();

/*
	var eventName = 'android.' + cli.argv.target;

	if (cli.argv.target == 'dist-playstore') {
		eventName = "android.distribute.playstore";
	} else if(cli.argv['debug-host']) {
		eventName += '.debug';
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

	cli.fireHook('build.pre.construct', function () {
		new build(logger, config, cli, function (err) {
			// TODO: packageid must contain at least one period (prepend "com." if no periods present)
			// TODO: classname is the app name, capitalized, only alpha-numeric and _, prepend _ if starts with a number
			cli.fireHook('build.post.compile', this, function (e) {
				if (e && e.type == 'AppcException') {
					logger.error(e.message);
					e.details.forEach(function (line) {
						line && logger.error(line);
					});
				}
				cli.fireHook('build.finalize', this, function () {
					finished(err);
				});
			}.bind(this));
		});
	});
*/
};

function build(logger, config, cli, finished) {
	cli.fireHook('build.pre.compile', this, function (e) {
		var env = {};
		for (var i in process.env) {
			env[i] = process.env[i];
		}

		// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
		// Alloy generate an app.js, it may not have existed during validate(), but should exist now
		// that build.pre.compile was fired.
		ti.validateAppJsExists(cli.argv['project-dir'], logger);

		if (cli.argv['skip-js-minify']) {
			process.env.SKIP_JS_MINIFY = '1';
		}

		cli.createHook('build.android.setBuilderPyEnv', this, function (e, cb) {
			env = e;
			cb();
		})(env, function () {
			var emulatorCmd = [],
				buildCmd = [],
				emulatorProcess,
				buildProcess,
				logcatProcess,
				adbProcess,
				emulatorRunning = false;

			ti.legacy.constructLegacyCommand(cli, cli.tiapp, cli.argv.platform, buildCmd, emulatorCmd);

			if (emulatorCmd.length) {
				logger.info(__('Running emulator process: %s', ('python "' + emulatorCmd.join('" "') + '"').cyan));

				emulatorRunning = true;
				emulatorProcess = spawn('python', emulatorCmd, { detached: true, stdio: 'ignore' });

				emulatorProcess.on('exit', function (code, signal) {
					if (code || buildProcess) {
						if (code) {
							emulatorRunning = false;
							logger.error(__('Emulator process exited with code %s', code) + '\n');
							logcatProcess && logcatProcess.kill('SIGKILL');
							adbProcess && adbProcess.kill('SIGKILL');
							buildProcess && buildProcess.kill('SIGKILL');
						} else {
							// is the emulator really running?
							var results = '',
								devicesProcess = spawn(path.join(androidEnv.sdkPath, 'platform-tools', 'adb'), ['devices']);

							devicesProcess.stdout.on('data', function (data) {
								results += data.toString();
							});

							devicesProcess.on('exit', function (code, status) {
								if (results.indexOf('emulator') != -1) {
									logger.info(__('Emulator is running') + '\n');
								} else {
									emulatorRunning = false;
									logger.info(__('Emulator process exited successfully') + '\n');
									logcatProcess && logcatProcess.kill('SIGKILL');
									adbProcess && adbProcess.kill('SIGKILL');
									buildProcess && buildProcess.kill('SIGKILL');
									emulatorProcess = buildProcess = logcatProcess = adbProcess = null;
								}
							});
						}
					}
				}.bind(this));
			}

			logger.info(__('Running build process: %s', (Object.keys(env).filter(function (i) { return !process.env[i]; }).map(function (k) {
				return env[k].indexOf(' ') != -1 ? (k + '="' + env[k] + '"') : (k + '=' + env[k]);
			}).join(' ') + ' python "' + buildCmd.join('" "') + '"').cyan));

			buildProcess = spawn('python', buildCmd, {
				env: env,
				stdio: 'inherit'
			});

			buildProcess.on('exit', function (code, signal) {
				if (code) {
					// build failed, error out
					logger.error(__('Build process exited with code %s', code));
					emulatorProcess && emulatorProcess.kill('SIGKILL');
					finished && finished(code);
					finished = buildProcess = emulatorProcess = null;

				} else {
					// we call finished here to display the build time and fire post build plugins
					finished && finished();

					if (cli.argv.target == 'emulator') {
						if (!emulatorRunning) {
							logger.info(__('Emulator not running, exiting...') + '\n');
						} else {
							// Call the logcat command in the old builder.py after the emulator, so we get logcat output
							var args = [
								path.join(path.resolve(cli.env.sdks[cli.tiapp['sdk-version']].path), cli.argv.platform, 'builder.py'),
								'logcat',
								cli.argv['android-sdk'],
								'-e'
							];
							logger.info(__('Running logcat process: %s', ('python "' + args.join('" "') + '"').cyan));
							logcatProcess = spawn('python', args, {
								stdio: 'inherit'
							});
							logcatProcess.on('exit', function (code) {
								if (code) {
									logger.error(__('Logcat failed with exit code %s', code) + '\n');
								} else {
									logger.info(__('Logcat shutdown successfully') + '\n');
								}
							});
						}

					} else if (cli.argv.target == 'device') {
						// Since installing on device does not run
						// the application we must send the "intent" ourselves.
						// We will launch the MAIN activity for the application.
						var adbCmd = path.join(androidEnv.sdkPath, 'platform-tools', 'adb'),
							args = [
								'-d', 'shell', 'am', 'start',
								'-a', 'android.intent.action.MAIN',
								'-c', 'android.intent.category.LAUNCHER',
								'-n', cli.tiapp.id + '/.' + appnameToClassname(cli.tiapp.name) + 'Activity',
								'-f', '0x10200000'
							];
						logger.info(__('Launching application on device: %s', (adbCmd + ' "' + args.join('" "') + '"').cyan));
						adbProcess = spawn(adbCmd, args, {
							stdio: 'inherit'
						});
						adbProcess.on('exit', function (code) {
							if (code) {
								logger.error(__('Install app failed with exit code %s', code) + '\n');
							} else {
								logger.info(__('App installer shutdown successfully') + '\n');
							}
						});
					}
				}
			}.bind(this));
		});
	});
}

// Converts an application name to a Java classname.
function appnameToClassname(appname) {
	var classname = appname.split(/[^A-Za-z0-9_]/).map(function(word) {
		return appc.string.capitalize(word.toLowerCase());
	}).join('');

	// Classnames cannot begin with a number.
	if (classname.match(/^[0-9]/) !== null) {
		classname = '_' + classname;
	}

	return classname;
}

build.prototype = {

	//

};
