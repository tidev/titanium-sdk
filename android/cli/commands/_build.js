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

	AdmZip = require('adm-zip'),
	async = require('async'),
	crypto = require('crypto'),
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	wrench = require('wrench'),

	spawn = require('child_process').spawn,
	androidDetect = require('../lib/detect').detect,

	ADB = require('titanium-sdk/lib/adb'),
	EmulatorManager = require('titanium-sdk/lib/emulator'),
	android = require('titanium-sdk/lib/android'),
	Builder = require('titanium-sdk/lib/builder'),

	packageJson = appc.pkginfo.package(module),

	androidEnv,
	deployTypes = ['production', 'test', 'development'],
	targets = ['emulator', 'device', 'dist-playstore'];

function hash(s) {
	return crypto.createHash('md5').update(s || '').digest('hex');
}

function AndroidBuilder() {
	Builder.apply(this, arguments);

	this.keystoreAliases = [];

	this.deployTypes = {
		'emulator': 'development',
		'device': 'test',
		'dist-playstore': 'production'
	};
}

util.inherits(AndroidBuilder, Builder);

AndroidBuilder.prototype.config = function config(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);

	var _t = this;

	// we hook into the pre-validate event so that we can stop the build before
	// prompting if we know the build is going to fail
	cli.on('cli:pre-validate', function (obj, callback) {
		// Check for java version
		if (!_t.jdkInfo.version) {
			logger.error(__('Unable to locate the Java Development Kit') + '\n');
			logger.log(__('You can specify the location by setting the %s environment variable.', 'JAVA_HOME'.cyan) + '\n');
			process.exit(1);
		}

		if (!version.satisfies(_t.jdkInfo.version, packageJson.vendorDependencies.java)) {
			logger.error(__('JDK version %s detected, but only version %s is supported', _t.jdkInfo.version, packageJson.vendorDependencies.java) + '\n');
			process.exit(1);
		}

		async.series([
			function (next) {
				if (cli.argv.keystore === void 0) return next();
				_t.conf.keystore.validate(cli.argv.keystore, next);
			},
			function (next) {
				if (cli.argv['store-password'] === void 0) return next();
				_t.conf['store-password'].validate(cli.argv['store-password'], next);
			}
		], function (err) {
			if (err) {
				logger.error(err.message || err.toString());
				logger.log();
				process.exit(1);
			}
			callback();
		});
	});

	return function (finished) {
		async.parallel([
			function (done) {
				androidDetect(config, { packageJson: packageJson }, function (androidInfo) {
					_t.androidInfo = androidInfo;
					done();
				});
			},
			function (done) {
				appc.jdk.detect(config, null, function (jdkInfo) {
					_t.jdkInfo = jdkInfo;
					done();
				});
			},
			function (done) {
				cli.createHook('build.android.config', function (callback) {
					callback({
						options: {
							'alias': {
								abbr: 'L',
								desc: __('the alias for the keystore'),
								hint: 'alias',
								order: 7,
								prompt: function (callback) {
									callback(fields.select({
										title: __("What is the name of the keystore's certificate alias?"),
										promptLabel: __('Select a certificate alias by number or name'),
										margin: '',
										optionLabel: 'name',
										optionValue: 'name',
										numbered: true,
										relistOnError: true,
										complete: true,
										suggest: false,
										options: _t.keystoreAliases
									}));
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
								order: 1,
								prompt: function (callback) {
									callback(fields.file({
										promptLabel: __('Where is the Android SDK?'),
										default: config.android && config.android.sdkPath && afs.resolvePath(config.android.sdkPath),
										complete: true,
										showHidden: true,
										ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
										ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
										validate: function (value, cb) {
											if (!value) {
												logger.error(__('Invalid Android SDK path'));
												return cb(true);
											}
											android.findSDK(value, config, appc.pkginfo.package(module), function (err, results) {
												if (err) logger.error(__('Invalid Android SDK path: %s', value));
												cb(err, results);
											});
										}
									}));
									/*.prompt(function (err, value) {
										if (err) return callback(err);
										config.set('android.sdkPath', value);
										callback(null, value);
									});*/
								},
								required: true
							},
							'avd-abi': {
								abbr: 'B',
								desc: __('the abi for the Android emulator; deprecated, use --device'),
								hint: __('abi')
							},
							'avd-id': {
								abbr: 'I',
								desc: __('the id for the Android emulator; deprecated, use --device'),
								hint: __('id')
							},
							'avd-skin': {
								abbr: 'S',
								desc: __('the skin for the Android emulator; deprecated, use --device'),
								hint: __('skin')
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
								order: 3,
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

										callback(fields.select({
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
										}));
									});
								},
								required: true
							},
							'key-password': {
								desc: __('the password for the keystore private key (defaults to the store-password)'),
								hint: 'keypass',
								order: 6,
								prompt: function (callback) {
									callback(fields.text({
										promptLabel: __("What is the keystore's key password? %s", __('(leave blank to use the store password)').grey),
										password: true,
										validate: function (value, cb) {
											cb(null, value);
										}
									}));
								}
							},
							'keystore': {
								abbr: 'K',
								desc: __('the location of the keystore file'),
								hint: 'path',
								order: 4,
								prompt: function (callback) {
									callback(fields.file({
										promptLabel: __('Where is the keystore file used to sign the app?'),
										complete: true,
										showHidden: true,
										ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
										ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
										validate: _t.conf.keystore.validate.bind(_t)
									}));
								},
								validate: function (keystoreFile, callback) {
									if (!keystoreFile || !fs.existsSync(keystoreFile) || !fs.statSync(keystoreFile).isFile()) {
										callback(new Error(keystoreFile ? __('Invalid keystore file') : __('Please specify the path to your keystore file')));
									} else {
										callback(null, keystoreFile);
									}
								}
							},
							'output-dir': {
								abbr: 'O',
								desc: __('the output directory when using %s', 'dist-playstore'.cyan),
								hint: 'dir',
								order: 8,
								prompt: function (callback) {
									callback(fields.file({
										promptLabel: __('Where would you like the output APK file saved?'),
										default: cli.argv['project-dir'] && afs.resolvePath(cli.argv['project-dir'], 'dist'),
										complete: true,
										showHidden: true,
										ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
										ignoreFiles: /.*/,
										validate: function (outputDir, cb) {
											if (!outputDir) {
												logger.error(__('Invalid output directory'));
												return cb(true);
											}
											cb(null, outputDir);
										}
									}));
								}
							},
							'store-password': {
								abbr: 'P',
								alias: 'password', // for backwards compatibility (also this conflicts with the login password option)
								desc: __('the password for the keystore'),
								hint: 'storepass',
								order: 5,
								prompt: function (callback) {
									callback(fields.text({
										next: function (err, value) {
											return err && err.next || null;
										},
										promptLabel: __("What is the keystore's store password?"),
										password: true,
										// if the password fails due to bad keystore file,
										// we need to prompt for the keystore file again
										repromptOnError: false,
										validate: _t.conf['store-password'].bind(_t)
									}));
								},
								validate: function (storePassword, callback) {
									if (!storePassword) {
										return callback(new Error(__('Please specify a keystore password')));
									}

									if (cli.argv.keystore && _t.jdkInfo && _t.jdkInfo.executables.keytool) {
										appc.subprocess.run(_t.jdkInfo.executables.keytool, ['-list', '-v', '-keystore', cli.argv.keystore, '-storepass', storePassword], function (code, out, err) {
											if (code) {
												var msg = out.split('\n').shift().split('java.io.IOException:');

												if (msg.length > 1) {
													msg = msg[1].trim();
													if (/invalid keystore format/i.test(msg)) {
														msg = __('Invalid keystore file');
														cli.argv.keystore = undefined;
													}
												} else {
													msg = out;
												}

												return callback(new Error(msg));
											}

											// empty the alias array. it is important that we don't destory the original
											// instance since it was passed by reference to the alias select list
											while (_t.keystoreAliases.length) {
												_t.keystoreAliases.pop();
											}

											var re = /Alias name\: (.+)/;
											out.split('\n').forEach(function (line) {
												var m = line.match(re);
												if (m) {
													_t.keystoreAliases.push({ name: m[1] });
												}
											}.bind(_t));

											if (_t.keystoreAliases.length == 0) {
												cli.argv.keystore = undefined;
												return callback(new Error(__('Keystore does not contain any certificates')));
											} else if (_t.keystoreAliases.length == 1) {
												cli.argv.alias = _t.keystoreAliases[0].name;
											}

											callback(null, storePassword);
										}.bind(_t));
									} else {
										callback(null, storePassword);
									}
								}
							},
							'target': {
								abbr: 'T',
								callback: function (value) {
									// as soon as we know the target, toggle required options for validation
									if (value === 'dist-playstore') {
										_t.conf.options['alias'].required = true;
										_t.conf.options['deploy-type'].values = ['production'];
										_t.conf.options['device'].required = false;
										_t.conf.options['key-password'].required = true;
										_t.conf.options['keystore'].required = true;
										_t.conf.options['output-dir'].required = true;
										_t.conf.options['store-password'].required = true;
									}
								},
								default: 'emulator',
								desc: __('the target to build for'),
								order: 2,
								required: true,
								values: targets
							}
						}
					});
				})(function (err, results, result) {
					_t.conf = result;
					done();
				});
			}
		], function (err, results) {
			finished(_t.conf);
		});
	}.bind(this);
};

AndroidBuilder.prototype.validate = function validate() {
	this.minSupportedApiLevel = parseInt(version.parseMin(this.packageJson.vendorDependencies['android sdk']));

	// copy args to build object
	this.target = this.cli.argv.target;
	this.deployType = /^device|emulator$/.test(this.target) && this.cli.argv['deploy-type'] ? this.cli.argv['deploy-type'] : this.deployTypes[this.target];

	return function (finished) {
		// figure out the minimum Android SDK version
		var logger = this.logger,
			config = this.config,
			cli = this.cli;

		function assertNotIssue(name, issues, onerror) {
			issues.forEach(function(issue) {
				if ((typeof name == 'string' && issue.id == name) || (typeof name == 'object' && name.test(issue.id))) {
					issue.message.split('\n').forEach(function (line) {
						logger.error(line.replace(/(__(.+?)__)/g, '$2'.bold));
					});
					logger.log();
					onerror(false);
				}
			});
		}

		// check that the Android SDK is found and sane
		assertNotIssue('ANDROID_SDK_NOT_FOUND', this.androidInfo.issues, finished);
		assertNotIssue('ANDROID_SDK_MISSING_PROGRAMS', this.androidInfo.issues, finished);

		// check if the Android SDK is in a directory containing ampersands
		assertNotIssue('ANDROID_SDK_PATH_CONTAINS_AMPERSANDS', this.androidInfo.issues, finished);

		// make sure we have an Android SDK and some Android targets
		if (Object.keys(this.androidInfo.targets).filter(function (id) { return id > this.minSupportedApiLevel; }.bind(this)).length <= 0) {
			logger.error(__('No Android SDK targets found.') + '\n');
			logger.log(__('Please download SDK targets (api level %s or newer) via Android SDK Manager and try again.', this.minSupportedApiLevel) + '\n');
			process.exit(1);
		}

		ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');

		ti.validateTiappXml(logger, cli.tiapp);

		if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
			// we're running the build command for the wrong SDK version, gracefully return
			return false;
		}

		// check the Android specific app id rules
		if (!config.get('android.skipAppIdValidation') && !/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(cli.tiapp.id)) {
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

		// validate the sdk levels
		var usesSDK = cli.tiapp.android && cli.tiapp.android.manifest && cli.tiapp.android.manifest['uses-sdk'];
		this.minSDK = cli.tiapp.android && cli.tiapp.android['tool-api-level'] || this.minSupportedApiLevel;
		this.targetSDK = null;

		if (usesSDK) {
			usesSDK['android:minSdkVersion'] && (this.minSDK = usesSDK['android:minSdkVersion']);
			usesSDK['android:targetSdkVersion'] && (this.targetSDK = usesSDK['android:targetSdkVersion']);
		}
		if (this.minSDK < this.minSupportedApiLevel) {
			logger.error(__('Minimum Android SDK version must be %s or newer', this.minSupportedApiLevel) + '\n');
			process.exit(1);
		}
		if (this.targetSDK && this.targetSDK < this.minSupportedApiLevel) {
			logger.error(__('Target Android SDK version must be %s or newer', this.minSupportedApiLevel) + '\n');
			process.exit(1);
		}

		// from here on out, we go async
		appc.async.series(this, [
			function (next) {
				// Set defaults for target Emulator
				if (cli.argv.target == 'emulator') {
					this.androidInfo.issues.forEach(function (issue) {
						if (/^ANDROID_MISSING_(LIBGL|I386_ARCH|IA32_LIBS|32BIT_GLIBC|32BIT_LIBSTDCPP)$/.test(issue.id)) {
							issue.message.split('\n').forEach(function (line) {
								logger.warn(line);
							});
						}
					});

					var avdid = parseInt(cli.argv['avd-id']);

					// double check and make sure that the avd-id passed (or the default)
					// exists as an android target and if not, deal with it vs. bombing
					if (isNaN(avdid) || !this.androidInfo.targets || !this.androidInfo.targets[avdid]) {
						var keys = Object.keys(this.androidInfo.targets || {}),
							name,
							skins;

						avdid = 0;
						for (var c = 0; c < keys.length; c++) {
							var target = this.androidInfo.targets[keys[c]],
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
						if (this.androidInfo.targets && this.androidInfo.targets[cli.argv['avd-id']]) {
							cli.argv['avd-abi'] = this.androidInfo.targets[cli.argv['avd-id']].abis[0] || this.androidInfo.targets['7'].abis[0] || 'armeabi';
						} else {
							logger.warn(__('AVD ID %s not found. Please use %s to specify a valid AVD ID. Ignoring --avd-abi.', cli.argv['avd-id'], '--avd-id'.cyan));
						}
					}
				}

				next();
			},

/*
			function (next) {
				// Validate arguments for dist-playstore
				if (cli.argv.target == 'dist-playstore') {
					appc.async.series(this, [
						function (cb) {
							console.log('keystore should already be valid: ' + cli.argv.keystore);
							//this.validateKeystore(cli.argv.keystore, function (err) {
							//	if (err) process.exit(1);
								cb();
							//});
						},
						function (cb) {
							console.log('store password should already be valid: ' + cli.argv['store-password']);
							//this.validateStorePassword(cli.argv['store-password'], function (err) {
							//	if (err) process.exit(1);
								cb();
							//});
						}
					], function () {
						next();
					});
				} else {
					next();
				}
			},

*/
/*
			function (next) {
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
				}
				next();
			},
*/

			function (next) {
				if (/emulator|device/.test(cli.argv.target)) {
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
				next();
			},

			function (next) {
				// check that the build directory is writeable
				var buildDir = path.join(cli.argv['project-dir'], 'build');
				if (fs.existsSync(buildDir)) {
					if (!afs.isDirWritable(buildDir)) {
						logger.error(__('The build directory is not writeable: %s', buildDir) + '\n');
						logger.log(__('Make sure the build directory is writeable and that you have sufficient free disk space.') + '\n');
						process.exit(1);
					}
				} else if (!afs.isDirWritable(cli.argv['project-dir'])) {
					logger.error(__('The project directory is not writeable: %s', cli.argv['project-dir']) + '\n');
					logger.log(__('Make sure the project directory is writeable and that you have sufficient free disk space.') + '\n');
					process.exit(1);
				}
				next();
			},

			function (next) {
				// make sure we have an icon
				if (!cli.tiapp.icon || !['Resources', 'Resources/android'].some(function (p) {
						return fs.existsSync(cli.argv['project-dir'], p, cli.tiapp.icon);
					})) {
					cli.tiapp.icon = 'appicon.png';
				}
				next();
			},

			function (next) {
				// validate modules
				var moduleSearchPaths = [ cli.argv['project-dir'], this.globalModulesPath ];
				if (config.paths && Array.isArray(config.paths.modules)) {
					moduleSearchPaths = moduleSearchPaths.concat(config.paths.modules);
				}

				appc.timodule.find(cli.tiapp.modules, 'android', this.deployType, this.titaniumSdkVersion, moduleSearchPaths, logger, function (modules) {
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

					this.modules = modules.found;
					this.commonJsModules = [];
					this.nativeLibModules = [];

					var manifestHashes = [],
						jarHashes = [],
						bindingsHashes = [];

					modules.found.forEach(function (module) {
						manifestHashes.push(hash(JSON.stringify(module.manifest)));

						if (module.platform.indexOf('commonjs') != -1) {
							this.commonJsModules.push(module);
						} else {
							// jar filenames are always lower case and must correspond to the name in the module's build.xml file
							module.jarName = module.manifest.name.toLowerCase() + '.jar',
							module.jarFile = path.join(module.modulePath, module.jarName);

							if (!fs.existsSync(module.jarFile)) {
								logger.error(__('Module %s version %s is missing jar file: %s', module.id.cyan, (module.manifest.version || 'latest').cyan, module.jarFile.cyan) + '\n');
								process.exit(1);
							}

							// read in the bindings
							var zip = new AdmZip(module.jarFile),
								zipEntries = zip.getEntries(),
								i = 0,
								len = zipEntries.length,
								pathName = 'org/appcelerator/titanium/bindings/',
								pathNameLen = pathName.length,
								entry, name;

							for (; i < len; i++) {
								entry = zipEntries[i];
								name = entry.entryName.toString();
								if (name.length > pathNameLen && name.indexOf(pathName) == 0) {
									try {
										module.bindings = JSON.parse(entry.getData());
									} catch (e) {
										logger.error(__('Module %s version %s contains invalid bindings json file', module.id.cyan, (module.manifest.version || 'latest').cyan) + '\n');
										process.exit(1);
									}
									break;
								}
							}

							if (!module.bindings) {
								logger.error(__('Module %s version %s is missing bindings json file', module.id.cyan, (module.manifest.version || 'latest').cyan) + '\n');
								process.exit(1);
							}

							jarHashes.push(module.hash = afs.hashFile(module.jarFile));
							bindingsHashes.push(hash(JSON.stringify(module.bindings)));

							logger.info(__('Detected third-party native Android module: %s version %s', module.id.cyan, (module.manifest.version || 'latest').cyan));
							this.nativeLibModules.push(module);
						}

						// scan the module for any CLI hooks
						cli.scanHooks(path.join(module.modulePath, 'hooks'));
					}, this);

					this.modulesManifestHash = manifestHashes.length ? hash(manifestHashes.sort().join(',')) : '';
					this.modulesJarHash = jarHashes.length ? hash(jarHashes.sort().join(',')) : '';
					this.modulesBindingsHash = bindingsHashes.length ? hash(bindingsHashes.sort().join(',')) : '';

					next();
				}.bind(this));
			}
		], function () {
			finished();
		});
	}.bind(this); // end returned callback
};

AndroidBuilder.prototype.run = function run(logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	appc.async.series(this, [
		function (next) {
			// fire "build.pre.construct" event
			cli.emit('build.pre.construct', next);
		},

		'doAnalytics',

		function (next) {
			this.appid = this.tiapp.id;
			this.appid.indexOf('.') == -1 && (this.appid = 'com.' + this.appid);

			this.classname = this.tiapp.name.split(/[^A-Za-z0-9_]/).map(function (word) {
				return appc.string.capitalize(word.toLowerCase());
			}).join('');
			/^[0-9]/.test(this.classname) && (this.classname = '_' + this.classname);

			// manually inject the build profile settings into the tiapp.xml
			switch (this.deployType) {
				case 'development':
					this.tiapp['encode-i18n'] = false;
					this.tiapp['minify-js'] = false;
					this.tiapp['minify-cs'] = false;
					this.tiapp['encrypt-js'] = false;
					this.tiapp['remove-unused-ti-apis'] = false;
					this.tiapp['allow-debugging'] = true;
					this.tiapp['allow-profiling'] = true;
					this.tiapp['show-errors'] = true;
					break;

				case 'test':
					this.tiapp['encode-i18n'] = true;
					this.tiapp['minify-js'] = true;
					this.tiapp['minify-cs'] = true;
					this.tiapp['encrypt-js'] = false;
					this.tiapp['remove-unused-ti-apis'] = true;
					this.tiapp['allow-debugging'] = true;
					this.tiapp['allow-profiling'] = true;
					this.tiapp['show-errors'] = true;
					break;

				case 'production':
					this.tiapp['encode-i18n'] = true;
					this.tiapp['minify-js'] = true;
					this.tiapp['minify-cs'] = true;
					this.tiapp['encrypt-js'] = true;
					this.tiapp['remove-unused-ti-apis'] = true;
					this.tiapp['allow-debugging'] = false;
					this.tiapp['allow-profiling'] = false;
					this.tiapp['show-errors'] = false;
					break;
			}

			this.buildManifestFile = path.join(this.buildDir, 'build-manifest.json');
			this.androidManifestFile = path.join(this.buildDir, 'AndroidManifest.xml');

			this.modulesHash = !Array.isArray(this.tiapp.modules) ? '' : crypto.createHash('md5').update(this.tiapp.modules.filter(function (m) {
				return !m.platform || /^iphone|ipad|commonjs$/.test(m.platform);
			}).map(function (m) {
				return m.id + ',' + m.platform + ',' + m.version;
			}).join('|')).digest('hex');

			this.propertiesHash = hash(this.tiapp.properties ? JSON.stringify(this.tiapp.properties) : '');
			var android = this.tiapp.android;
			this.activitiesHash = hash(android && android.application && android.application ? JSON.stringify(android.application.activities) : '');
			this.servicesHash = hash(android && android.services ? JSON.stringify(android.services) : '');

			this.jssFilesHash = hash((function walk(dir) {
				var re = /\.jss$/,
					hashes = [];
				fs.readdirSync(dir).forEach(function (name) {
					var file = path.join(dir, name);
					if (fs.existsSync(file)) {
						var stat = fs.statSync(file);
						if (stat.isFile() && re.test(name)) {
							hashes.push(hash(fs.readFileSync(file).toString()));
						} else if (stat.isDirectory()) {
							hashes = hashes.concat(walk(file));
						}
					}
				});
				return hashes;
			}(this.projectDir)).join(','));

			// read the build manifest from the last build, if exists, so we
			// can determine if we need to do a full rebuild
			this.buildManifest = {};
			this.readBuildManifest();

			next();
		},

		function (next) {
			this.logger.debug(__('Titanium SDK Android directory: %s', this.platformPath.cyan));
			this.logger.info(__('Deploy type: %s', this.deployType.cyan));
			this.logger.info(__('Building for target: %s', this.target.cyan));

			// TODO: output other awesome info here

			next();
		},

		function (next) {
			// check if we need to do a rebuild
			this.forceRebuild = this.checkIfShouldForceRebuild();

			if (this.forceRebuild && fs.existsSync(this.buildDir)) {
				wrench.rmdirSyncRecursive(this.buildDir);
			}

			this.writeBuildManifest(next);
		},

		// THIS OUTPUT IS TEMPORARY
		function (next) {
			console.log();
			console.log('titaniumSdkPath     ='.cyan, this.titaniumSdkPath);
			console.log('titaniumSdkVersion  ='.cyan, this.titaniumSdkVersion);
			console.log('platformPath        ='.cyan, this.platformPath);
			console.log('platformName        ='.cyan, this.platformName);
			console.log('projectDir          ='.cyan, this.projectDir);
			console.log('buildDir            ='.cyan, this.buildDir);
			console.log('packageJson         =\n'.cyan, this.packageJson);
			console.log('conf                =\n'.cyan, this.conf);
			console.log('tiapp               =\n'.cyan, this.tiapp);
			console.log('jdkInfo             =\n'.cyan, this.jdkInfo);
			console.log('alias               ='.cyan, this.cli.argv['alias']);
			console.log('keystoreAliases     ='.cyan, this.keystoreAliases);
			console.log('avd-abi             ='.cyan, this.cli.argv['avd-abi']);
			console.log('avd-id              ='.cyan, this.cli.argv['avd-id']);
			console.log('avd-skin            ='.cyan, this.cli.argv['avd-skin']);
			console.log('debug-host          ='.cyan, this.cli.argv['debug-host']);
			console.log('deploy-type         ='.cyan, this.deployType);
			console.log('device              ='.cyan, this.cli.argv['device']);
			console.log('keystore            ='.cyan, this.cli.argv['keystore']);
			console.log('store-password      ='.cyan, this.cli.argv['store-password']);
			console.log('key-password        ='.cyan, this.cli.argv['key-password']);
			console.log('output-dir          ='.cyan, this.cli.argv['output-dir']);
			console.log('target              ='.cyan, this.target);
			console.log('buildManifestFile   ='.cyan, this.buildManifestFile);
			console.log('androidManifestFile ='.cyan, this.androidManifestFile);
			console.log('classname           ='.cyan, this.classname);
			console.log('modulesHash         ='.cyan, this.modulesHash);
			console.log('modulesManifestHash ='.cyan, this.modulesManifestHash);
			console.log('modulesJarHash      ='.cyan, this.modulesJarHash);
			console.log('modulesBindingsHash ='.cyan, this.modulesBindingsHash);
			console.log('minSDK              ='.cyan, this.minSDK);
			console.log('targetSDK           ='.cyan, this.targetSDK);
			console.log('activitiesHash      ='.cyan, this.activitiesHash);
			console.log('servicesHash        ='.cyan, this.servicesHash);
			console.log('jssFilesHash        ='.cyan, this.jssFilesHash);
			console.log();
			next();
		},

		function (next) {
			// fire "build.pre.compile" event
			cli.emit('build.pre.compile', next);
		},

		function (next) {
			// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
			// Alloy generate an app.js, it may not have existed during validate(), but should exist now
			// that build.pre.compile was fired.
			ti.validateAppJsExists(this.projectDir, this.logger);

			fs.existsSync(this.buildDir) || wrench.mkdirSyncRecursive(this.buildDir);

			var dir,
				genPkgDir = path.join(this.buildDir, 'gen', this.appid.split('.').join(path.sep)),
				templatesDir = path.join(this.platformPath, 'templates');

			// remove directories
			fs.existsSync(dir = path.join(this.buildDir, 'res')) && wrench.rmdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'src')) && wrench.rmdirSyncRecursive(dir);

			// make directories
			fs.existsSync(dir = path.join(this.buildDir, 'assets')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'bin', 'assets', 'Resources')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'bin', 'classes')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'gen')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(genPkgDir) || wrench.mkdirSyncRecursive(genPkgDir);
			fs.existsSync(dir = path.join(this.buildDir, 'lib')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'res')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'res', 'drawable')) || wrench.mkdirSyncRecursive(dir);
			fs.existsSync(dir = path.join(this.buildDir, 'res', 'values')) || wrench.mkdirSyncRecursive(dir);
			// IS THIS EVEN USED??? if not, we don't need the aidl file
			fs.existsSync(dir = path.join(this.buildDir, 'src')) || wrench.mkdirSyncRecursive(dir);

			var copyTemplate = function (src, dest) {
					if (this.forceRebuild || !fs.existsSync(dest)) {
						this.logger.debug(__('Copying template %s => %s', src.cyan, dest.cyan));
						// TODO: use ejs!
						//fs.writeFileSync(dest, doT.template(fs.readFileSync(src).toString())(this));
					}
				}.bind(this),
				copyOpts = { logger: this.logger.debug };

			copyTemplate(path.join(templatesDir, 'AppInfo.java'), path.join(genPkgDir, 'AppInfo.java'));
			copyTemplate(path.join(templatesDir, 'AndroidManifest.xml'), path.join(this.buildDir, 'AndroidManifest.xml'));
			copyTemplate(path.join(templatesDir, 'App.java'), path.join(genPkgDir, this.classname + 'Application.java'));
			copyTemplate(path.join(templatesDir, 'Activity.java'), path.join(genPkgDir, this.classname + 'Activity.java'));
			copyTemplate(path.join(templatesDir, 'project'), path.join(this.buildDir, '.project'));
			copyTemplate(path.join(templatesDir, 'default.properties'), path.join(this.buildDir, 'default.properties'));
			afs.copyFileSync(path.join(templatesDir, 'classpath'), path.join(this.buildDir, '.classpath'), copyOpts);
			afs.copyFileSync(path.join(templatesDir, 'gitignore'), path.join(this.buildDir, '.gitignore'), copyOpts);

			// TODO: merge custom classpath with build/android/.classpath

			// TODO: generate activities from tiapp.xml

			// TODO: generate services from tiapp.xml

			// TODO: write app_modules to build/android/bin/assets/app.json???

			// TODO: BUILD THE APP!!

			next();
		},

		function (next) {
			// fire "build.post.compile" event
			cli.emit('build.post.compile', next);
		}
	], function (err) {
		cli.emit('build.finalize', this, function () {
			finished(err);
		});
	});
};

AndroidBuilder.prototype.doAnalytics = function doAnalytics(callback) {
	var cli = this.cli,
		eventName = 'android.' + cli.argv.target;

	if (cli.argv.target == 'dist-playstore') {
		eventName = "android.distribute.playstore";
	} else if (this.cli.argv['debug-host']) {
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

	callback();
};

AndroidBuilder.prototype.readBuildManifest = function readBuildManifest() {
	if (fs.existsSync(this.buildManifestFile)) {
		try {
			this.buildManifest = JSON.parse(fs.readFileSync(this.buildManifestFile)) || {};
		} catch (e) {}
	}
};

AndroidBuilder.prototype.writeBuildManifest = function writeBuildManifest(callback) {
	this.logger.info(__('Writing build manifest: %s', this.buildManifestFile.cyan));

	this.cli.createHook('build.android.writeBuildManifest', this, function (manifest, cb) {
		fs.existsSync(this.buildDir) || wrench.mkdirSyncRecursive(this.buildDir);
		fs.existsSync(this.buildManifestFile) && fs.unlinkSync(this.buildManifestFile);
		fs.writeFile(this.buildManifestFile, JSON.stringify(this.buildManifest = manifest, null, '\t'), function () {
			cb();
		});
	})({
		target: this.target,
		deployType: this.deployType,
		classname: this.classname,
		platformPath: this.platformPath,
		modulesHash: this.modulesHash,
		modulesManifestHash: this.modulesManifestHash,
		modulesJarHash: this.modulesJarHash,
		modulesBindingsHash: this.modulesBindingsHash,
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
		icon: this.tiapp.icon,
		fullscreen: this.tiapp.fullscreen,
		skipJSMinification: !!this.cli.argv['skip-js-minify'],
		minSDK: this.minSDK,
		targetSDK: this.targetSDK,
		propertiesHash: this.propertiesHash,
		activitiesHash: this.activitiesHash,
		servicesHash: this.servicesHash,
		jssFilesHash: this.jssFilesHash
	}, function (err, results, result) {
		callback();
	});
};

AndroidBuilder.prototype.checkIfShouldForceRebuild = function checkIfShouldForceRebuild() {
	var manifest = this.buildManifest;

	if (this.cli.argv.force) {
		this.logger.info(__('Forcing rebuild: %s flag was set', '--force'.cyan));
		return true;
	}

	if (!fs.existsSync(this.buildManifestFile)) {
		this.logger.info(__('Forcing rebuild: %s does not exist', this.buildManifestFile.cyan));
		return true;
	}

	if (!fs.existsSync(this.androidManifestFile)) {
		this.logger.info(__('Forcing rebuild: %s does not exist', this.androidManifestFile.cyan));
		return true;
	}

	// check if the target changed
	if (this.target != manifest.target) {
		this.logger.info(__('Forcing rebuild: target changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.target));
		this.logger.info('  ' + __('Now: %s', this.target));
		return true;
	}

	// check if the deploy type changed
	if (this.deployType != manifest.deployType) {
		this.logger.info(__('Forcing rebuild: deploy type changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.deployType));
		this.logger.info('  ' + __('Now: %s', this.deployType));
		return true;
	}

	// check if the classname changed
	if (this.classname != manifest.classname) {
		this.logger.info(__('Forcing rebuild: classname changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.classname));
		this.logger.info('  ' + __('Now: %s', this.classname));
		return true;
	}

	// check if the titanium sdk paths are different
	if (this.platformPath != manifest.platformPath) {
		this.logger.info(__('Forcing rebuild: Titanium SDK path changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.platformPath));
		this.logger.info('  ' + __('Now: %s', this.platformPath));
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

	if (this.modulesManifestHash != manifest.modulesManifestHash) {
		this.logger.info(__('Forcing rebuild: module manifest hash changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.modulesManifestHash));
		this.logger.info('  ' + __('Now: %s', this.modulesManifestHash));
		return true;
	}

	if (this.modulesJarHash != manifest.modulesJarHash) {
		this.logger.info(__('Forcing rebuild: native modules jar hash changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.modulesJarHash));
		this.logger.info('  ' + __('Now: %s', this.modulesJarHash));
		return true;
	}

	if (this.modulesBindingsHash != manifest.modulesBindingsHash) {
		this.logger.info(__('Forcing rebuild: native modules bindings hash changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.modulesBindingsHash));
		this.logger.info('  ' + __('Now: %s', this.modulesBindingsHash));
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

	if (this.tiapp.icon != manifest.icon) {
		this.logger.info(__('Forcing rebuild: tiapp.xml icon changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.icon));
		this.logger.info('  ' + __('Now: %s', this.tiapp.icon));
		return true;
	}

	if (this.tiapp.fullscreen != manifest.fullscreen) {
		this.logger.info(__('Forcing rebuild: tiapp.xml fullscreen changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.fullscreen));
		this.logger.info('  ' + __('Now: %s', this.tiapp.fullscreen));
		return true;
	}

	if (this.tiapp['navbar-hidden'] != manifest['navbar-hidden']) {
		this.logger.info(__('Forcing rebuild: tiapp.xml fullscreen changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest['navbar-hidden']));
		this.logger.info('  ' + __('Now: %s', this.tiapp['navbar-hidden']));
		return true;
	}

	if (this.minSDK != manifest.minSDK) {
		this.logger.info(__('Forcing rebuild: Android minimum SDK changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.minSDK));
		this.logger.info('  ' + __('Now: %s', this.minSDK));
		return true;
	}

	if (this.targetSDK != manifest.targetSDK) {
		this.logger.info(__('Forcing rebuild: Android target SDK changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.targetSDK));
		this.logger.info('  ' + __('Now: %s', this.targetSDK));
		return true;
	}

	if (this.propertiesHash != manifest.propertiesHash) {
		this.logger.info(__('Forcing rebuild: tiapp.xml properties changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.propertiesHash));
		this.logger.info('  ' + __('Now: %s', this.propertiesHash));
		return true;
	}

	if (this.activitiesHash != manifest.activitiesHash) {
		this.logger.info(__('Forcing rebuild: Android activites in tiapp.xml changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.activitiesHash));
		this.logger.info('  ' + __('Now: %s', this.activitiesHash));
		return true;
	}

	if (this.servicesHash != manifest.servicesHash) {
		this.logger.info(__('Forcing rebuild: Android services in tiapp.xml SDK changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.servicesHash));
		this.logger.info('  ' + __('Now: %s', this.servicesHash));
		return true;
	}

	if (this.jssFilesHash != manifest.jssFilesHash) {
		this.logger.info(__('Forcing rebuild: One or more JSS files changed since last build'));
		this.logger.info('  ' + __('Was: %s', manifest.jssFilesHash));
		this.logger.info('  ' + __('Now: %s', this.jssFilesHash));
		return true;
	}

	return false;
};

/*
function build(logger, config, cli, finished) {
	cli.emit('build.pre.compile', this, function (e) {
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
*/

// create the builder instance and expose the public api
(function (androidBuilder) {
	exports.config   = androidBuilder.config.bind(androidBuilder);
	exports.validate = androidBuilder.validate.bind(androidBuilder);
	exports.run      = androidBuilder.run.bind(androidBuilder);
}(new AndroidBuilder(module)));
