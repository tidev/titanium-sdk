/*
 * build.js: Titanium Android CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ADB = require('titanium-sdk/lib/adb'),
	AdmZip = require('adm-zip'),
	android = require('titanium-sdk/lib/android'),
	androidDetect = require('../lib/detect').detect,
	appc = require('node-appc'),
	async = require('async'),
	Builder = require('titanium-sdk/lib/builder'),
	cleanCSS = require('clean-css'),
	crypto = require('crypto'),
	DOMParser = require('xmldom').DOMParser,
	ejs = require('ejs'),
	EmulatorManager = require('titanium-sdk/lib/emulator'),
	fields = require('fields'),
	fs = require('fs'),
	i18n = require('titanium-sdk/lib/i18n'),
	jsanalyze = require('titanium-sdk/lib/jsanalyze'),
	path = require('path'),
	spawn = require('child_process').spawn,
	temp = require('temp'),
	ti = require('titanium-sdk'),
	util = require('util'),
	wrench = require('wrench'),

	afs = appc.fs,
	i18nLib = appc.i18n(__dirname),
	__ = i18nLib.__,
	__n = i18nLib.__n,
	version = appc.version,
	xml = appc.xml,

	packageJson = appc.pkginfo.package(module);

function hash(s) {
	return crypto.createHash('md5').update(s || '').digest('hex');
}

function AndroidBuilder() {
	Builder.apply(this, arguments);

	this.androidTargetSDK = null;

	this.keystoreAliases = [];

	this.tiSymbols = {};

	this.deployTypes = {
		'emulator': 'development',
		'device': 'test',
		'dist-playstore': 'production'
	};

	this.targets = ['emulator', 'device', 'dist-playstore'];

	this.xmlMergeRegExp = /^(strings|attrs|styles|bools|colors|dimens|ids|integers|arrays)\.xml$/;
}

util.inherits(AndroidBuilder, Builder);

AndroidBuilder.prototype.config = function config(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);

	var _t = this;

	// we hook into the pre-validate event so that we can stop the build before
	// prompting if we know the build is going to fail.

	// this is also where we can detect android and jdk environments before
	// prompting occurs. because detection is expensive we also do it here instead
	// of during config() because there's no sense detecting if config() is being
	// called because of the help command.
	cli.on('cli:pre-validate', function (obj, callback) {
		async.series([
			function (next) {
				// detect android environment
				androidDetect(config, { packageJson: packageJson }, function (androidInfo) {
					_t.androidInfo = androidInfo;
					next();
				});
			},

			function (next) {
				// detect java development kit
				appc.jdk.detect(config, null, function (jdkInfo) {
					if (!jdkInfo.version) {
						logger.error(__('Unable to locate the Java Development Kit') + '\n');
						logger.log(__('You can specify the location by setting the %s environment variable.', 'JAVA_HOME'.cyan) + '\n');
						process.exit(1);
					}

					if (!version.satisfies(jdkInfo.version, packageJson.vendorDependencies.java)) {
						logger.error(__('JDK version %s detected, but only version %s is supported', jdkInfo.version, packageJson.vendorDependencies.java) + '\n');
						process.exit(1);
					}

					_t.jdkInfo = jdkInfo;
					next();
				});
			}
		], callback);
	});

	var targetDeviceCache = {};

	function findTargetDevices(target, callback) {
		if (targetDeviceCache[target]) return callback(null, targetDeviceCache[target]);

		if (target == 'device') {
			new ADB(config).devices(function (err, devices) {
				if (err) {
					callback(err);
				} else {
					_t.devices = devices;
					callback(null, targetDeviceCache[target] = devices.map(function (d) {
						return {
							name: d.model || d.manufacturer,
							id: d.id,
							version: d.release,
							abi: Array.isArray(d.abi) ? d.abi.join(',') : d.abi,
							type: 'device'
						};
					}));
				}
			});
		} else if (target == 'emulator') {
			new EmulatorManager(config).detect(function (err, emus) {
				if (err) {
					callback(err);
				} else {
					_t.devices = emus;
					callback(null, targetDeviceCache[target] = emus.map(function (emu) {
						// normalize the emulator info
						if (emu.type == 'avd') {
							return {
								name: emu.name,
								id: emu.name,
								version: emu.target,
								abi: emu.abi,
								type: emu.type,
								googleApis: emu.googleApis
							};
						} else if (emu.type == 'genymotion') {
							return {
								name: emu.name,
								id: emu.name,
								version: emu.target,
								abi: emu.abi,
								type: emu.type,
								googleApis: emu.googleApis
							};
						}
						return emu; // not good
					}));
				}
			});
		} else {
			callback();
		}
	}

	return function (finished) {
		cli.createHook('build.android.config', function (callback) {
			var conf = {
				options: {
					'alias': {
						abbr: 'L',
						desc: __('the alias for the keystore'),
						hint: 'alias',
						order: 107,
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
						order: 101,
						prompt: function (callback) {
							callback(fields.file({
								promptLabel: __('Where is the Android SDK?'),
								default: config.android && config.android.sdkPath && afs.resolvePath(config.android.sdkPath),
								complete: true,
								showHidden: true,
								ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
								ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
								validate: _t.conf.options['android-sdk'].validate.bind(_t)
							}));
						},
						required: true,
						validate: function (value, callback) {
							if (!value) {
								callback(new Error(__('Invalid Android SDK path')));
							} else {
								// do a quick scan to see if the path is correct
								android.findSDK(value, config, appc.pkginfo.package(module), function (err, results) {
									if (err) {
										callback(new Error(__('Invalid Android SDK path: %s', value)));
									} else {
										// set the android sdk in the config just in case a plugin or something needs it
										config.set('android.sdkPath', value);

										// path looks good, do a full scan again
										androidDetect(config, { packageJson: packageJson }, function (androidInfo) {
											_t.androidInfo = androidInfo;
											callback(null, value);
										});
									}
								});
							}
						}
					},
					'avd-abi': {
						abbr: 'B',
						desc: __('the abi for the Android emulator; deprecated, use --device-id'),
						hint: __('abi')
					},
					'avd-id': {
						abbr: 'I',
						desc: __('the id for the Android emulator; deprecated, use --device-id'),
						hint: __('id')
					},
					'avd-skin': {
						abbr: 'S',
						desc: __('the skin for the Android emulator; deprecated, use --device-id'),
						hint: __('skin')
					},
					'debug-host': {
						hidden: true
					},
					'deploy-type': {
						abbr: 'D',
						desc: __('the type of deployment; only used when target is %s or %s', 'emulator'.cyan, 'device'.cyan),
						hint: __('type'),
						values: ['test', 'development']
					},
					'device-id': {
						abbr: 'V',
						desc: __('the name for the device or Android emulator to install the application to'),
						hint: __('name'),
						order: 103,
						prompt: function (callback) {
							findTargetDevices(cli.argv.target, function (err, results) {
								var opts = {};

								// we need to sort all results into groups for the select field
								if (cli.argv.target == 'device' && results.length) {
									opts[__('Devices')] = results;
								} else if (cli.argv.target == 'emulator') {
									// for emulators, we sort by type
									var emus = results.filter(function (e) {
											return e.type == 'avd';
										});

									if (emus.length) {
										opts[__('Android Emulators')] = emus;
									}

									emus = results.filter(function (e) {
										return e.type == 'genymotion';
									});
									if (emus.length) {
										opts[__('Genymotion Emulators')] = emus;

										logger.log(__('NOTE: Genymotion emulator must be running to detect Google API support').magenta + '\n');
									}
								}

								// if there are no devices/emulators, error
								if (!Object.keys(opts).length) {
									if (cli.argv.target == 'device') {
										logger.error(__('Unable to find any devices') + '\n');
										logger.log(__('Please plug in an Android device, then try again.') + '\n');
									} else {
										logger.error(__('Unable to find any emulators') + '\n');
										logger.log(__('Please create an Android emulator, then try again.') + '\n');
									}
									process.exit(1);
								}

								callback(fields.select({
									title: __('Where do you want to install your application after building?'),
									promptLabel: __('Select a device by number or name'),
									formatters: {
										option: function (opt, idx, num) {
											return '    ' + num + opt.name.cyan + (opt.googleApis
												? (' (' + __('Google APIs supported') + ')').grey
												: opt.googleApis === null
													? (' (' + __('Google APIs support unknown') + ')').grey
													: '');
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
						required: true,
						validate: function (device, callback) {
							findTargetDevices(cli.argv.target, function (err, devices) {
								if (!devices.some(function (d) { return d.name == device; })) {
									return callback(new Error(__('Invalid device "%s"', device)));
								}
								callback(null, device);
							});
						},
						verifyIfRequired: function (callback) {
							if (cli.argv.target != 'emulator') {
								return callback(true);
							}

							findTargetDevices(cli.argv.target, function (err, results) {
								var avds = results.filter(function (a) { return a.type == 'avd'; }).map(function (a) { return a.name; });

								// if --device-id was not specified, but --avd-id was, then we need to
								// try to resolve a device based on the legacy --avd-* options
								if (cli.argv['device-id'] == undefined && avds.length && cli.argv['avd-id']) {
									// try finding the first avd that starts with the avd id
									var name = 'titanium_' + cli.argv['avd-id'] + '_';
									avds = avds.filter(function (avd) { return avd.indexOf(name) == 0; });
									if (avds.length == 1) {
										cli.argv['device-id'] = avds[0];
										return callback();
									} else if (avds.length > 1) {
										// next try using the avd skin
										if (!cli.argv['avd-skin']) {
											// we have more than one match
											logger.error(__n('Found %s avd with id "%%s"', 'Found %s avds with id "%%s"', avds.length, cli.argv['avd-id']));
											logger.error(__('Specify --avd-skin and --avd-abi to select a specific emulator') + '\n');
										} else {
											name += cli.argv['avd-skin'];
											// try exact match
											var tmp = avds.filter(function (avd) { return avd == name; });
											if (tmp.length) {
												avds = tmp;
											} else {
												// try partial match
												avds = avds.filter(function (avd) { return avd.indexOf(name + '_') == 0; });
											}
											if (avds.length == 0) {
												logger.error(__('No emulators found with id "%s" and skin "%s"', cli.argv['avd-id'], cli.argv['avd-skin']) + '\n');
											} else if (avds.length == 1) {
												cli.argv['device-id'] = avds[0];
												return callback();
											} else if (!cli.argv['avd-abi']) {
												// we have more than one matching avd, but no abi to filter by so we have to error
												logger.error(__n('Found %s avd with id "%%s" and skin "%%s"', 'Found %s avds with id "%%s" and skin "%%s"', avds.length, cli.argv['avd-id'], cli.argv['avd-skin']));
												logger.error(__('Specify --avd-abi to select a specific emulator') + '\n');
											} else {
												name += '_' + cli.argv['avd-abi'];
												// try exact match
												tmp = avds.filter(function (avd) { return avd == name; });
												if (tmp.length) {
													avds = tmp;
												} else {
													avds = avds.filter(function (avd) { return avd.indexOf(name + '_') == 0; });
												}
												if (avds.length == 0) {
													logger.error(__('No emulators found with id "%s", skin "%s", and abi "%s"', cli.argv['avd-id'], cli.argv['avd-skin'], cli.argv['avd-abi']) + '\n');
												} else {
													// there is one or more avds, but we'll just return the first one
													cli.argv['device-id'] = avds[0];
													return callback();
												}
											}
										}
									}

									logger.warn(__('%s options have been %s, please use %s', '--avd-*'.cyan, 'deprecated'.red, '--device-id'.cyan) + '\n');

									// print list of available avds
									if (results.length && !cli.argv.prompt) {
										logger.log(__('Available Emulators:'))
										results.forEach(function (emu) {
											logger.log('    ' + emu.name.cyan);
										});
										logger.log();
									}
								}

								// yup, still required
								callback(true);
							});
						}
					},
					'key-password': {
						desc: __('the password for the keystore private key (defaults to the store-password)'),
						hint: 'keypass',
						order: 106,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __("What is the keystore's __key password__?") + ' ' + __('(leave blank to use the store password)').grey,
								password: true,
								validate: function (value, callback) {
									callback(null, value);
								}
							}));
						},
						secret: true
					},
					'keystore': {
						abbr: 'K',
						callback: function (value) {
							_t.conf.options['alias'].required = true;
							_t.conf.options['store-password'].required = true;
						},
						desc: __('the location of the keystore file'),
						hint: 'path',
						order: 104,
						prompt: function (callback) {
							_t.conf.options['key-password'].required = true;
							callback(fields.file({
								promptLabel: __('Where is the __keystore file__ used to sign the app?'),
								complete: true,
								showHidden: true,
								ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
								ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
								validate: _t.conf.options.keystore.validate.bind(_t)
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
						order: 108,
						prompt: function (callback) {
							callback(fields.file({
								promptLabel: __('Where would you like the output APK file saved?'),
								default: cli.argv['project-dir'] && afs.resolvePath(cli.argv['project-dir'], 'dist'),
								complete: true,
								showHidden: true,
								ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
								ignoreFiles: /.*/,
								validate: _t.conf.options['output-dir'].validate.bind(_t)
							}));
						},
						validate: function (outputDir, callback) {
							callback(outputDir ? null : new Error(__('Invalid output directory')), outputDir);
						}
					},
					'store-password': {
						abbr: 'P',
						desc: __('the password for the keystore'),
						hint: 'password',
						order: 105,
						prompt: function (callback) {
							callback(fields.text({
								next: function (err, value) {
									return err && err.next || null;
								},
								promptLabel: __("What is the keystore's __password__?"),
								password: true,
								// if the password fails due to bad keystore file,
								// we need to prompt for the keystore file again
								repromptOnError: false,
								validate: _t.conf.options['store-password'].validate.bind(_t)
							}));
						},
						secret: true,
						validate: function (storePassword, callback) {
							if (!storePassword) {
								return callback(new Error(__('Please specify a keystore password')));
							}

							// sanity check they keystore
							_t.conf.options.keystore.validate(cli.argv.keystore, function (err, keystoreFile) {
								if (err) {
									// we have a bad --keystore arg
									console.log('bad --keystore');
									cli.argv.keystore = undefined;
									throw err;
								}

								if (keystoreFile && _t.jdkInfo && _t.jdkInfo.executables.keytool) {
									appc.subprocess.run(_t.jdkInfo.executables.keytool, ['-list', '-v', '-keystore', keystoreFile, '-storepass', storePassword], function (code, out, err) {
										if (code) {
											var msg = out.split('\n').shift().split('java.io.IOException:');
											if (msg.length > 1) {
												msg = msg[1].trim();
												if (/invalid keystore format/i.test(msg)) {
													msg = __('Invalid keystore file');
													cli.argv.keystore = undefined;
													_t.conf.options.keystore.required = true;
												}
											} else {
												msg = out.trim();
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
							});
						}
					},
					'target': {
						abbr: 'T',
						callback: function (value) {
							// as soon as we know the target, toggle required options for validation
							if (value === 'dist-playstore') {
								_t.conf.options['alias'].required = true;
								_t.conf.options['deploy-type'].values = ['production'];
								_t.conf.options['device-id'].required = false;
								_t.conf.options['keystore'].required = true;
								_t.conf.options['output-dir'].required = true;
								_t.conf.options['store-password'].required = true;
							}
						},
						default: 'emulator',
						desc: __('the target to build for'),
						order: 102,
						required: true,
						values: _t.targets
					}
				}
			};

			// we need to map store-password to password for backwards compatibility
			// because we needed to change it as to not conflict with the login
			// password and be more descriptive compared to the --key-password
			conf.options.password = appc.util.mix({
				hidden: true
			}, conf.options['store-password']);
			delete conf.options.password.abbr;

			callback(_t.conf = conf);
		})(function (err, results, result) {
			finished(result);
		});
	}.bind(this);
};

AndroidBuilder.prototype.validate = function validate(logger, config, cli) {
	this.minSupportedApiLevel = parseInt(version.parseMin(this.packageJson.vendorDependencies['android sdk']));
	this.maxSupportedApiLevel = parseInt(version.parseMax(this.packageJson.vendorDependencies['android sdk']));

	// copy args to build object
	this.target = cli.argv.target;
	this.deployType = /^device|emulator$/.test(this.target) && cli.argv['deploy-type'] ? cli.argv['deploy-type'] : this.deployTypes[this.target];

	// manually inject the build profile settings into the tiapp.xml
	switch (this.deployType) {
		case 'production':
			this.encodeI18N = true;
			this.minifyJS = true;
			this.encryptJS = true;
			this.removeUnusedTiAPIs = true;
			this.allowDebugging = false;
			this.allowProfiling = false;
			this.showErrors = false;
			break;

		case 'test':
			this.encodeI18N = true;
			this.minifyJS = true;
			this.encryptJS = true;
			this.removeUnusedTiAPIs = true;
			this.allowDebugging = true;
			this.allowProfiling = true;
			this.showErrors = true;
			break;

		case 'development':
		default:
			this.encodeI18N = false;
			this.minifyJS = false;
			this.encryptJS = false;
			this.removeUnusedTiAPIs = false;
			this.allowDebugging = true;
			this.allowProfiling = true;
			this.showErrors = true;
	}

	var assertIssue = function (name) {
		var issues = this.androidInfo.issues,
			i = 0,
			len = issues.length;
		for (; i < len; i++) {
			if ((typeof name == 'string' && issues[i].id == name) || (typeof name == 'object' && name.test(issues[i].id))) {
				issues[i].message.split('\n').forEach(function (line) {
					logger.error(line.replace(/(__(.+?)__)/g, '$2'.bold));
				});
				logger.log();
				process.exit(1);
			}
		}
	}.bind(this);

	// check that the Android SDK is found and sane
	assertIssue('ANDROID_SDK_NOT_FOUND');
	assertIssue('ANDROID_SDK_MISSING_PROGRAMS');

	// check if the Android SDK is in a directory containing ampersands on Windows
	assertIssue('ANDROID_SDK_PATH_CONTAINS_AMPERSANDS');

	// make sure we have an Android SDK and some Android targets
	if (Object.keys(this.androidInfo.targets).filter(function (id) { return id > this.minSupportedApiLevel; }.bind(this)).length <= 0) {
		logger.error(__('No Android SDK targets found.') + '\n');
		logger.log(__('Please download SDK targets (api level %s or newer) via Android SDK Manager and try again.', this.minSupportedApiLevel) + '\n');
		process.exit(1);
	}

	// check the Android specific app id rules
	if (!config.get('android.skipAppIdValidation')) {
		if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(cli.tiapp.id)) {
			logger.error(__('tiapp.xml contains an invalid app id "%s"', cli.tiapp.id));
			logger.error(__('The app id must consist only of letters, numbers, dashes, and underscores.'));
			logger.error(__('Note: Android does not allow dashes.'));
			logger.error(__('The first character must be a letter or underscore.'));
			logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
			process.exit(1);
		}

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

	this.tiappAndroidManifest = cli.tiapp.android && cli.tiapp.android.manifest && this.parseAndroidManifestXml(cli.tiapp.android && cli.tiapp.android.manifest);

	// map sdk versions to sdk targets instead of by id
	var targetSDKMap = {};
	Object.keys(this.androidInfo.targets).forEach(function (id) {
		var t = this.androidInfo.targets[id];
		if (t.type == 'platform') {
			targetSDKMap[~~t.id.replace('android-', '')] = t;
		}
	}, this);

	// validate the sdk levels
	var usesSDK = this.tiappAndroidManifest && this.tiappAndroidManifest['uses-sdk'];

	this.minSDK = this.minSupportedApiLevel;
	this.targetSDK = cli.tiapp.android && ~~cli.tiapp.android['tool-api-level'] || null;
	this.maxSDK = null;

	if (this.targetSDK) {
		logger.warn(__('%s has been deprecated, please specify the target SDK using the %s tag:', '<tool-api-level>'.cyan, '<uses-sdk>'.cyan));
		logger.warn();
		logger.warn('<ti:app xmlns:ti="http://ti.appcelerator.org">'.grey);
		logger.warn('    <!-- snip -->'.grey);
		logger.warn('    <android>'.grey);
		logger.warn('        <manifest>'.grey);
		logger.warn('            <uses-sdk android:minSdkVersion="10" android:targetSdkVersion="17" android:maxSdkVersion="18"/>'.magenta);
		logger.warn('        </manifest>'.grey);
		logger.warn('    </android>'.grey);
		logger.warn('</ti:app>'.grey);
		logger.log();
	}

	if (usesSDK) {
		usesSDK['android:minSdkVersion'] && (this.minSDK = ~~usesSDK['android:minSdkVersion']);
		usesSDK['android:targetSdkVersion'] && (this.targetSDK = ~~usesSDK['android:targetSdkVersion']);
		usesSDK['android:maxSdkVersion'] && (this.maxSDK = ~~usesSDK['android:maxSdkVersion']);
	}

	if (this.minSDK < this.minSupportedApiLevel) {
		logger.error(__('Minimum Android SDK version must be %s or newer', this.minSupportedApiLevel) + '\n');
		process.exit(1);
	}

	// if no target sdk, then default to most recent supported/installed
	if (!this.targetSDK) {
		var levels = Object.keys(targetSDKMap).sort(),
			i = levels.length - 1;
		for (; i >= 0; i--) {
			if (levels[i] >= this.minSupportedApiLevel && levels[i] <= this.maxSupportedApiLevel) {
				this.targetSDK = levels[i];
				break;
			}
		}

		if (!this.targetSDK) {
			this.logger.error(__('Unable to find a suitable installed Android SDK that is >=%s and <=%s', this.minSupportedApiLevel, this.maxSupportedApiLevel) + '\n');
			process.exit(1);
		}
	}

	// check that we have this target sdk installed
	this.androidTargetSDK = targetSDKMap[this.targetSDK];

	if (!this.androidTargetSDK) {
		this.logger.error(__('Target Android SDK %s is not installed', this.targetSDK) + '\n');

		var sdks = Object.keys(targetSDKMap);
		if (sdks.length) {
			this.logger.log(__('To target Android SDK %s, you first must install it using the Android SDK manager.', this.targetSDK.cyan) + '\n');
			this.logger.log(__('You can also change the %s in the %s section of the tiapp.xml to one of the following:', '<tool-api-level>'.cyan, '<android>'.cyan));
			sdks.forEach(function (name) {
				this.logger.log('    ' + name.cyan);
			}, this);
			this.logger.log();
		} else {
			this.logger.log(__('To target Android SDK %s, you first must install it using the Android SDK manager', this.targetSDK.cyan) + '\n');
		}
		process.exit(1);
	}

	if (this.targetSDK < this.minSDK) {
		logger.error(__('Target Android SDK version must be %s or newer', this.minSDK) + '\n');
		process.exit(1);
	}

	if (this.maxSDK && this.maxSDK < this.targetSDK) {
		logger.error(__('Maximum Android SDK version must be greater than or equal to the target SDK %s', (''+this.targetSDK).cyan) + '\n');
		process.exit(1);
	}

	if (this.maxSupportedApiLevel && this.targetSDK > this.maxSupportedApiLevel) {
		// print warning that version this.targetSDK is not tested
		logger.warn(__('Building with Android SDK %s which hasn\'t been tested against Titanium SDK %s', (''+this.targetSDK).cyan, this.titaniumSdkVersion));
	}

	// if we're building for the emulator, make sure we don't have any issues
	if (cli.argv.target == 'emulator') {
		this.androidInfo.issues.forEach(function (issue) {
			if (/^ANDROID_MISSING_(LIBGL|I386_ARCH|IA32_LIBS|32BIT_GLIBC|32BIT_LIBSTDCPP)$/.test(issue.id)) {
				issue.message.split('\n').forEach(function (line) {
					logger.warn(line);
				});
			}
		});
	}

	// validate debugger and profiler options
	var tool = [];
	this.allowDebugging && tool.push('debug');
	this.allowProfiling && tool.push('profiler');
	tool.forEach(function (type) {
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

			var port = parseInt(parts[1]);
			if (isNaN(port) || port < 1 || port > 65535) {
				logger.error(__('Invalid ' + type + ' host "%s"', cli.argv[type + '-host']) + '\n');
				logger.log(__('The port must be a valid integer between 1 and 65535.') + '\n');
				process.exit(1);
			}

			this[type + 'Host'] = parts[0];
			this[type + 'Port'] = port;
		} else {
			this[type + 'Host'] = null;
			this[type + 'Port'] = null;
		}
	}, this);

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

	// make sure we have an icon
	if (!cli.tiapp.icon || !['Resources', 'Resources/android'].some(function (p) {
			return fs.existsSync(cli.argv['project-dir'], p, cli.tiapp.icon);
		})) {
		cli.tiapp.icon = 'appicon.png';
	}

	return function (finished) {
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
					module.bindings = this.getNativeModuleBindings(module.jarFile);
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

			this.modulesManifestHash = hash(manifestHashes.length ? manifestHashes.sort().join(',') : '');
			this.modulesJarHash = hash(jarHashes.length ? jarHashes.sort().join(',') : '');
			this.modulesBindingsHash = hash(bindingsHashes.length ? bindingsHashes.sort().join(',') : '');

			finished();
		}.bind(this)); // end timodule.find()
	}.bind(this); // end returned callback
};

AndroidBuilder.prototype.run = function run(logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	appc.async.series(this, [
		function (next) {
			cli.emit('build.pre.construct', next);
		},

		'doAnalytics',
		'initialize',
		'computeHashes',
		'readBuildManifest',

		function (next) {
			this.logger.debug(__('Titanium SDK Android directory: %s', this.platformPath.cyan));
			this.logger.info(__('Deploy type: %s', this.deployType.cyan));
			this.logger.info(__('Building for target: %s', this.target.cyan));
			if (this.target == 'emulator') {
				this.logger.info(__('Emulator name: %s', this.deviceId.cyan));
			} else if (this.target == 'device') {
				this.logger.info(__('Device name: %s', this.deviceId.cyan));
			}

			// TODO: output other awesome info here

			next();
		},

		function (next) {
			// check if we need to do a rebuild
			this.forceRebuild = this.checkIfShouldForceRebuild();

			if (this.forceRebuild && fs.existsSync(this.buildDir)) {
				wrench.rmdirSyncRecursive(this.buildDir);
			}

			next();
		},

		'writeBuildManifest',

		function (next) {
			cli.emit('build.pre.compile', next);
		},

		'createBuildDirs',
		'copyResources',
		'compileJSS',
		'generateRequireIndex',
		'processTiSymbols',
		'generateJavaFiles',
		'copyModuleResources',
		'generateAidl',
		'generateI18N',
		'generateAndroidManifest',
		'compileJavaClasses',
		'runDexer',
		'packageApp',
		'createUnsignedApk',
		'createSignedApk',
		'zipAlignApk',

		function (next) {
			cli.emit('build.post.compile', next);
		}
	], function (err) {
		cli.emit('build.finalize', this, function () {
			finished(err);
		});
	});
};

AndroidBuilder.prototype.parseAndroidManifestXml = function parseAndroidManifestXml(contents) {
	var obj = {};

	// for more info, refer to http://developer.android.com/guide/topics/manifest/manifest-intro.html

	xml.forEachElement((new DOMParser({ errorHandler: function(){} }).parseFromString(contents, 'text/xml')).documentElement, function (node) {
		switch (node.tagName) {
			case 'uses-sdk':
				obj['uses-sdk'] = {};
				xml.forEachAttr(node, function (attr) {
					obj['uses-sdk'][attr.name] = attr.value;
				});
				break;

			case 'uses-permission':
			case 'permission':
			case 'permission-tree':
			case 'permission-group':
			case 'instrumentation':
			case 'uses-configuration':
			case 'uses-feature':
			case 'supports-screens':
			case 'compatible-screens':
			case 'supports-gl-texture':
			case 'application':
				// not supported :(
				break;
		}
	});

	return obj;
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

AndroidBuilder.prototype.initialize = function initialize(next) {
	var argv = this.cli.argv;

	this.appid = this.tiapp.id;
	this.appid.indexOf('.') == -1 && (this.appid = 'com.' + this.appid);

	this.classname = this.tiapp.name.split(/[^A-Za-z0-9_]/).map(function (word) {
		return appc.string.capitalize(word.toLowerCase());
	}).join('');
	/^[0-9]/.test(this.classname) && (this.classname = '_' + this.classname);

	var deviceId = this.deviceId = argv['device-id'];

	if (this.target == 'emulator') {
		var emu = this.devices.filter(function (e) { return e.name == deviceId; }).shift();
		if (!emu) {
			// sanity check
			this.logger.error(__('Unable to find Android emulator "%s"', deviceId) + '\n');
			process.exit(0);
		}
		this.emulator = emu;
	}

	this.buildOnly = argv['build-only'];
	this.outputDir = argv['output-dir'] ? afs.resolvePath(argv['output-dir']) : null;

	// set the keystore to the dev keystore, if not already set
	this.keystore = argv.keystore;
	this.keystoreStorePassword = argv['store-password'];
	this.keystoreKeyPassword = argv['key-password'];
	this.keystoreAlias = argv.alias;
	if (!this.keystore) {
		this.keystore = path.join(this.platformPath, 'dev_keystore');
		this.keystoreStorePassword = 'tirocks';
		this.keystoreAlias = 'tidev';
	}

	var loadFromSDCardProp = this.tiapp.properties['ti.android.loadfromsdcard'];
	this.loadFromSDCard = loadFromSDCardProp && loadFromSDCardProp.value === true;

	// determine if we're going to be minifying javascript
	var compileJSProp = this.tiapp.properties['ti.android.compilejs'];
	if (argv['skip-js-minify']) {
		if (this.compileJS) {
			logger.debug(__('JavaScript files were going to be minified, but %s is forcing them to not be minified', '--skip-js-minify'.cyan));
		}
		this.compileJS = this.encryptJS = false;
	} else if (compileJSProp) {
		if (this.compileJS && !compileJSProp.value) {
			logger.debug(__('JavaScript files were going to be minified, but %s is forcing them to not be minified', 'ti.android.loadfromsdcard'.cyan));
		}
		this.compileJS = this.encryptJS = !!compileJSProp.value;
	}

	var includeAllTiModulesProp = this.tiapp.properties['ti.android.include_all_modules'];
	this.includeAllTiModules = includeAllTiModulesProp && includeAllTiModulesProp.value;

	this.buildManifestFile = path.join(this.buildDir, 'build-manifest.json');
	this.androidManifestFile = path.join(this.buildDir, 'AndroidManifest.xml');
	this.buildAssetsDir = path.join(this.buildDir, 'assets');
	this.buildBinAssetsDir = path.join(this.buildDir, 'bin', 'assets');
	this.buildBinAssetsResourcesDir = path.join(this.buildBinAssetsDir, 'Resources');
	this.buildGenAppIdDir = path.join(this.buildDir, 'gen', this.appid.split('.').join(path.sep));
	this.buildResDir = path.join(this.buildDir, 'res');
	this.buildSrcDir = path.join(this.buildDir, 'src');
	this.templatesDir = path.join(this.platformPath, 'templates', 'build');

	next();
};

AndroidBuilder.prototype.computeHashes = function computeHashes(next) {
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

	next();
};

AndroidBuilder.prototype.readBuildManifest = function readBuildManifest(next) {
	// read the build manifest from the last build, if exists, so we
	// can determine if we need to do a full rebuild
	this.buildManifest = {};

	if (fs.existsSync(this.buildManifestFile)) {
		try {
			this.buildManifest = JSON.parse(fs.readFileSync(this.buildManifestFile)) || {};
		} catch (e) {}
	}

	next();
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
		'navbar-hidden': this.tiapp['navbar-hidden'],
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
		this.logger.info(__('Forcing rebuild: tiapp.xml navbar-hidden changed since last build'));
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

AndroidBuilder.prototype.createBuildDirs = function createBuildDirs(next) {
	// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
	// Alloy generate an app.js, it may not have existed during validate(), but should exist now
	// that build.pre.compile was fired.
	ti.validateAppJsExists(this.projectDir, this.logger, 'android');

	fs.existsSync(this.buildDir) || wrench.mkdirSyncRecursive(this.buildDir);

	var dir;

	// remove directories
	// TODO: do we REALLY want to delete these directories???
	fs.existsSync(dir = path.join(this.buildDir, 'res')) && wrench.rmdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildDir, 'src')) && wrench.rmdirSyncRecursive(dir);

	// remove the previous deploy.json file which contains debugging/profiling info
	fs.existsSync(dir = path.join(this.buildDir, 'bin', 'deploy.json')) && fs.unlinkSync(dir);

	// make directories
	fs.existsSync(dir = path.join(this.buildDir, 'assets')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = this.buildBinAssetsResourcesDir) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildDir, 'bin', 'classes')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildDir, 'gen')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = this.buildGenAppIdDir) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildDir, 'lib')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = this.buildResDir) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildResDir, 'drawable')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = path.join(this.buildResDir, 'values')) || wrench.mkdirSyncRecursive(dir);
	fs.existsSync(dir = this.buildSrcDir) || wrench.mkdirSyncRecursive(dir);

	next();
};

AndroidBuilder.prototype.copyResources = function copyResources(next) {
	var ignoreDirs = new RegExp(this.config.get('cli.ignoreDirs')),
		ignoreFiles = new RegExp(this.config.get('cli.ignoreFiles')),
		extRegExp = /\.(.+)$/,
		drawableRegExp = /^images\/(high|medium|low|res-[^\/]+)(\/(.*))?/,
		drawableDpiRegExp = /^(high|medium|low)$/,
		drawableExtRegExp = /((\.9)?\.(png|jpg))$/,
		jsFiles = {},
		htmlJsFiles = {};

	function copyDir(opts, callback) {
		if (opts && opts.src && fs.existsSync(opts.src) && opts.dest) {
			opts.origDest = opts.dest;
			recursivelyCopy.call(this, opts.src, opts.dest, opts.ignoreRootDirs, opts, callback);
		} else {
			callback();
		}
	}

	function recursivelyCopy(src, dest, ignoreRootDirs, opts, done) {
		wrench.mkdirSyncRecursive(dest);

		var files;
		if (fs.statSync(src).isDirectory()) {
			files = fs.readdirSync(src);
		} else {
			// we have a file, so fake a directory listing
			files = [ path.basename(src) ];
			src = path.dirname(src);
		}

		appc.async.series(this, files.map(function (filename) {
			return function (next) {
				var from = path.join(src, filename),
					to = path.join(dest, filename);

				// check that the file actually exists and isn't a broken symlink
				if (!fs.existsSync(from)) return next();

				var isDir = fs.statSync(from).isDirectory();

				// check if we are ignoring this file
				if ((isDir && ignoreRootDirs && ignoreRootDirs.indexOf(filename) != -1) || (isDir ? ignoreDirs : ignoreFiles).test(filename)) {
					this.logger.debug(__('Ignoring %s', from.cyan));
					return next();
				}

				// if this is a directory, recurse
				if (isDir) return recursivelyCopy.call(this, from, path.join(dest, filename), null, opts, next);

				// we have a file, now we need to see what sort of file

				// check if it's a drawable resource
				if (filename != 'default.png') {
					var m = to.replace(opts.origDest, '').replace(/^\//, '').replace(/\\/g, '/').match(drawableRegExp);
					if (m && m.length >= 4) {
						var destFilename = m[3].toLowerCase(),
							name = destFilename.replace(drawableExtRegExp, ''),
							ext = destFilename.match(drawableExtRegExp);

						dest = path.join(
							this.buildResDir,
							drawableDpiRegExp.test(m[1]) ? 'drawable-' + m[1][0] : 'drawable-' + m[1].substring(4)
						);

						to = path.join(
							dest,
							name.replace(/[^a-z0-9_]/g, '_').substring(0, 80) + '_' + hash(name).substring(0, 10) + (ext ? ext[1] : '')
						);
					}
				}

				// if the destination directory does not exists, create it
				fs.existsSync(dest) || wrench.mkdirSyncRecursive(dest);

				var ext = filename.match(extRegExp);
				switch (ext && ext[1]) {
					case 'css':
						// if we encounter a css file, check if we should minify it
						if (this.minifyCSS) {
							this.logger.debug(__('Copying and minifying %s => %s', from.cyan, to.cyan));
							fs.readFile(from, function (err, data) {
								fs.writeFile(to, cleanCSS.process(data.toString()), next);
							});
						} else {
							afs.copyFileAsync(from, to, { logger: this.logger.debug }, next);
						}
						break;

					case 'html':
						// find all app:// js files referenced in this html file
						jsanalyze.analyzeHtmlFile(from).forEach(function (file) {
							htmlJsFiles[file] = 1;
						});

						afs.copyFileAsync(from, to, { logger: this.logger.debug }, next);
						break;

					case 'js':
						// track each js file so we can copy/minify later

						// we use the destination file name minus the path to the assets dir as the id
						// which will eliminate dupes
						var id = to.replace(this.buildBinAssetsResourcesDir, '').replace(/^\//, '');

						if (!jsFiles[id] || !opts || !opts.onJsConflict || opts.onJsConflict(from, to, id)) {
							jsFiles[id] = from;
						}

						next();
						break;

					case 'jss':
						// ignore, these will be compiled later by compileJSS()
						next();
						break;

					case 'xml':
						if (this.xmlMergeRegExp.test(filename)) {
							this.writeXmlFile(from, to);
							next();
							break;
						}

					default:
						// normal file, just copy it into the build/android/bin/assets directory
						afs.copyFileAsync(from, to, { logger: this.logger.debug }, next);
				}
			};
		}), done);
	}

	function warnDupeDrawableFolders(resourceDir) {
		var dir = path.join(resourceDir, 'images');
		['high', 'medium', 'low'].forEach(function (dpi) {
			var oldDir = path.join(dir, dpi),
				newDir = path.join(dir, 'res-' + dpi[0] + 'dpi');
			if (fs.existsSync(oldDir) && fs.existsSync(newDir)) {
				oldDir = oldDir.replace(this.projectDir, '').replace(/^\//, '');
				newDir = newDir.replace(this.projectDir, '').replace(/^\//, '');
				this.logger.warn(__('You have both an %s folder and an %s folder', oldDir.cyan, newDir.cyan));
				this.logger.warn(__('Files from both of these folders will end up in %s', ('res/drawable-' + dpi[0]+ 'dpi').cyan));
				this.logger.warn(__('If two files are named the same, there is no guarantee which one will be copied last and therefore be the one the application uses'));
				this.logger.warn(__('You should use just one of these folders to avoid conflicts'));
			}
		}, this);
	}

	var tasks = [
		// first task is to copy all files in the Resources directory, but ignore
		// any directory that is the name of a known platform
		function (cb) {
			var src = path.join(this.projectDir, 'Resources');
			warnDupeDrawableFolders.call(this, src);
			copyDir.call(this, {
				src: src,
				dest: this.buildBinAssetsResourcesDir,
				ignoreRootDirs: ti.availablePlatformsNames
			}, cb);
		},

		// next copy all files from the Android specific Resources directory
		function (cb) {
			var src = path.join(this.projectDir, 'Resources', 'android');
			warnDupeDrawableFolders.call(this, src);
			copyDir.call(this, {
				src: src,
				dest: this.buildBinAssetsResourcesDir
			}, cb);
		}
	];

	// copy all commonjs modules
	this.commonJsModules.forEach(function (module) {
		var src = path.join(module.modulePath, module.id + '.js');
		if (fs.existsSync(src)) {
			tasks.push(function (cb) {
				copyDir.call(this, {
					src: src,
					dest: this.buildBinAssetsResourcesDir,
					onJsConflict: function (src, dest, id) {
						this.logger.error(__('There is a project resource "%s" that conflicts with a CommonJS module', id));
						this.logger.error(__('Please rename the file, then rebuild') + '\n');
						process.exit(1);
					}.bind(this)
				}, cb);
			});
		} else {
			this.logger.error(__('Unable to find main source file for CommonJS module "%s"', module.id) + '\n');
			process.exit(1);
		}
	});

	// WARNING! This is pretty dangerous, but yes, we're intentionally copying
	// every file from platform/android and all modules into the build dir
	var modulePaths = this.modules.map(function (module) {
		return path.join(module.modulePath, 'platform', 'android');
	});
	modulePaths.unshift(path.join(this.projectDir, 'platform', 'android'));
	modulePaths.forEach(function (dir) {
		if (fs.existsSync(dir)) {
			tasks.push(function (cb) {
				copyDir.call(this, {
					src: dir,
					dest: this.buildDir
				}, cb);
			});
		}
	}, this);

	appc.async.series(this, tasks, function (err, results) {
		var jsFilesToEncrypt = this.jsFilesToEncrypt = [];

		// copy js files into assets directory and minify if needed
		appc.async.parallel(this, Object.keys(jsFiles).map(function (id) {
			return function (done) {
				var from = jsFiles[id],
					to = path.join(this.buildBinAssetsResourcesDir, id);

				if (htmlJsFiles[id]) {
					// this js file is referenced from an html file, so don't minify or encrypt
					afs.copyFileAsync(from, to, { logger: this.logger.debug }, done);

				} else {
					// we have a js file that may be minified or encrypted

					// if we're encrypting the JavaScript, copy the files to the assets dir
					// for processing later
					if (this.encryptJS) {
						to = path.join(this.buildAssetsDir, id);
						jsFilesToEncrypt.push(id);
					}

					var r = jsanalyze.analyzeJsFile(from, { minify: this.minifyJS });

					// we want to sort by the "to" filename so that we correctly handle file overwriting
					this.tiSymbols[to] = r.symbols;

					// if we're not minifying the JavaScript and we're not forcing all
					// Titanium Android modules to be included, then parse the AST and detect
					// all Titanium symbols
					if (this.minifyJS || !this.includeAllTiModules) {
						this.logger.debug(this.minifyJS
							? __('Copying and minifying %s => %s', from.cyan, to.cyan)
							: __('Copying %s => %s', from.cyan, to.cyan));

						var dir = path.dirname(to);
						fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
						fs.writeFile(to, r.contents, done);
					} else {
						// no need to parse the AST, so just copy the file
						afs.copyFileAsync(from, to, { logger: this.logger.debug }, done);
					}
				}
			};
		}), function () {
			if (!jsFilesToEncrypt.length) {
				// nothing to encrypt, continue
				return next();
			}

			// figure out which titanium prep to run
			var titaniumPrep = 'titanium_prep';
			if (process.platform == 'darwin') {
				titaniumPrep += '.macos';
			} else if (process.platform == 'win32') {
				titaniumPrep += '.win.exe';
			} else if (process.platform == 'linux') {
				titaniumPrep += '.linux' + (process.arch == 'x64' ? '64' : '32');
			}

			var args = [ this.appid, this.buildAssetsDir ].concat(jsFilesToEncrypt);

			this.logger.info('Encrypting JavaScript files: %s', (path.join(this.platformPath, titaniumPrep) + ' "' + args.join('" "') + '"').cyan);

			// encrypt the javascript
			appc.subprocess.run(path.join(this.platformPath, titaniumPrep), args, function (code, out, err) {
				if (code) {
					this.logger.error(__('Failed to encrypt JavaScript files'));
					err.trim().split('\n').forEach(this.logger.error);
					this.logger.log();
					process.exit(1);
				}

				// write the encrypted JS bytes to the generated Java file
				fs.writeFileSync(
					path.join(this.buildGenAppIdDir, 'AssetCryptImpl.java'),
					ejs.render(fs.readFileSync(path.join(this.templatesDir, 'AssetCryptImpl.java')).toString(), {
						appid: this.appid,
						encryptedAssets: out
					})
				);

				next();
			}.bind(this));
		});
	});
};

AndroidBuilder.prototype.compileJSS = function compileJSS(callback) {
	ti.jss.load(path.join(this.projectDir, 'Resources'), ['android'], this.logger, function (results) {
		fs.writeFile(
			path.join(this.buildGenAppIdDir, 'ApplicationStylesheet.java'),
			ejs.render(fs.readFileSync(path.join(this.templatesDir, 'ApplicationStylesheet.java')).toString(), {
				appid: this.appid,
				classes: appc.util.mix({}, results.classes, results.tags),
				classesDensity: appc.util.mix({}, results.classes_density, results.tags_density),
				ids: results.ids,
				idsDensity: results.ids_density
			}),
			callback
		);
	}.bind(this));
};

AndroidBuilder.prototype.generateRequireIndex = function generateRequireIndex(callback) {
	var index = {},
		binAssetsDir = this.buildBinAssetsDir,
		destFile = path.join(binAssetsDir, 'index.json');

	(function walk(dir) {
		fs.readdirSync(dir).forEach(function (filename) {
			var file = path.join(dir, filename);
			if (fs.existsSync(file)) {
				if (fs.statSync(file).isDirectory()) {
					walk(file);
				} else if (/\.js$/.test(filename)) {
					index[file.replace(/\\/g, '/').replace(binAssetsDir + '/', '')] = 1;
				}
			}
		});
	}(this.buildBinAssetsResourcesDir));

	this.jsFilesToEncrypt.forEach(function (file) {
		index['Resources/' + file] = 1;
	});

	fs.writeFile(destFile, JSON.stringify(index), callback);
};

AndroidBuilder.prototype.getNativeModuleBindings = function getNativeModuleBindings(jarFile) {
	var zip = new AdmZip(jarFile),
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
				return JSON.parse(entry.getData());
			} catch (e) {}
			return;
		}
	}
};

AndroidBuilder.prototype.processTiSymbols = function processTiSymbols(next) {
	var depMap = JSON.parse(fs.readFileSync(path.join(this.platformPath, 'dependency.json'))),
		modulesMap = JSON.parse(fs.readFileSync(path.join(this.platformPath, 'modules.json'))),
		modulesPath = path.join(this.platformPath, 'modules'),
		moduleBindings = {},
		externalChildModules = {},
		moduleJarMap = {},
		tiNamespaces = this.tiNamespaces = {}, // map of namespace => titanium functions (i.e. ui => createWindow)
		jarLibraries = this.jarLibraries = {},
		appModules = this.appModules = [],
		appModulesMap = {},
		customModules = this.customModules = [],
		ignoreNamespaces = /^(addEventListener|builddate|buildhash|fireEvent|include|_JSON|name|removeEventListener|userAgent|version)$/;

	// reorg the modules map by module => jar instead of jar => modules
	Object.keys(modulesMap).forEach(function (jar) {
		modulesMap[jar].forEach(function (name) {
			moduleJarMap[name.toLowerCase()] = jar;
		});
	});

	// load all module bindings
	fs.readdirSync(modulesPath).forEach(function (filename) {
		var file = path.join(modulesPath, filename);
		if (fs.existsSync(file) && fs.statSync(file).isFile() && /\.jar$/.test(filename)) {
			var bindings = this.getNativeModuleBindings(file);
			if (bindings) {
				Object.keys(bindings.modules).forEach(function (moduleClass) {
					if (bindings.proxies[moduleClass]) {
						moduleBindings[moduleClass] = bindings.modules[moduleClass];
						moduleBindings[moduleClass].fullAPIName = bindings.proxies[moduleClass].proxyAttrs.fullAPIName;
					} else {
						// parent module is external, so the reference needs to be injected at boot time
						Array.isArray(externalChildModules[moduleClass]) || (externalChildModules[moduleClass] = []);
						externalChildModules[moduleClass] = externalChildModules[moduleClass].concat(bindings.modules[moduleClass].childModules);
					}
				});
			}
		}
	}, this);

	// get the v8 runtime jar file(s)
	if (depMap && depMap.runtimes && depMap.runtimes.v8) {
		var v8 = depMap.runtimes.v8;
		(Array.isArray(v8) ? v8 : [ v8 ]).forEach(function (jar) {
			if (fs.existsSync(jar = path.join(this.platformPath, jar))) {
				this.logger.debug(__('Adding library %s', jar.cyan));
				jarLibraries[jar] = 1;
			}
		}, this);
	}

	function addTitaniumLibrary(namespace) {
		namespace = namespace.toLowerCase();
		if (ignoreNamespaces.test(namespace) || tiNamespaces[namespace]) return;
		tiNamespaces[namespace] = [];

		var jar = moduleJarMap[namespace];
		if (jar) {
			jar = jar == 'titanium.jar' ? path.join(this.platformPath, jar) : path.join(this.platformPath, 'modules', jar);
			if (fs.existsSync(jar) && !jarLibraries[jar]) {
				this.logger.debug(__('Adding library %s', jar.cyan));
				jarLibraries[jar] = 1;
			}
		} else {
			this.logger.debug(__('Unknown namespace %s, skipping', namespace.cyan));
		}

		depMap.libraries[namespace] && depMap.libraries[namespace].forEach(function (jar) {
			if (fs.existsSync(jar = path.join(this.platformPath, jar)) && !jarLibraries[jar]) {
				this.logger.debug(__('Adding dependency library %s', jar.cyan));
				jarLibraries[jar] = 1;
			}
		}, this);

		depMap.dependencies[namespace] && depMap.dependencies[namespace].forEach(addTitaniumLibrary, this);
	}

	// get all required titanium modules
	depMap.required.forEach(addTitaniumLibrary, this);

	// if we need to include all titanium modules, then do it
	if (this.includeAllTiModules) {
		Object.keys(moduleJarMap).forEach(addTitaniumLibrary, this);
	}

	// for each Titanium symbol found when we copied the JavaScript files, we need
	// extract the Titanium namespace and make sure we include its jar library
	Object.keys(this.tiSymbols).forEach(function (file) {
		this.tiSymbols[file].forEach(function (symbol) {
			var parts = symbol.split('.'),
				namespace = parts.slice(0, -1).join('.');
			if (namespace) {
				addTitaniumLibrary.call(this, namespace);
				if (tiNamespaces[namespace]) {
					// track each method/property
					tiNamespaces[namespace].push(parts.pop());
				}
			}
		}, this);
	}, this);

	function createModuleDescriptor(namespace) {
		var results = {
				apiName: '',
				className: '',
				bindings: tiNamespaces[namespace],
				externalChildModules: [],
				onAppCreate: null
			},
			moduleBindingKeys = Object.keys(moduleBindings),
			len = moduleBindingKeys.length,
			i, name, extChildModule;

		for (i = 0; i < len; i++) {
			name = moduleBindingKeys[i];
			if (moduleBindings[name].fullAPIName.toLowerCase() == namespace) {
				results.apiName = moduleBindings[name].fullAPIName
				results.className = name;
				if (moduleBindings[name].onAppCreate) {
					results.onAppCreate = moduleBindings[name].onAppCreate;
				}
				break;
			}
		}

		// check if we found the api name and if not bail
		if (!results.apiName) return;

		if (extChildModule = externalChildModules[results.className]) {
			for (i = 0, len = extChildModule.length; i < len; i++) {
				if (tiNamespaces[extChildModule[i].fullAPIName.toLowerCase()]) {
					results.externalChildModules.push(extChildModule[i]);
					break;
				}
			}
		}

		appModulesMap[results.apiName.toLowerCase()] = 1;

		return results;
	}

	// build the list of modules for the templates
	Object.keys(tiNamespaces).map(createModuleDescriptor).forEach(function (m) {
		m && this.appModules.push(m);
	}, this);

	this.modules.forEach(function (module) {
		// check if the module has a metadata.json (which most native-wrapped CommonJS
		// modules should), then make sure those Titanium namespaces are loaded
		var metadataFile = path.join(module.modulePath, 'metadata.json'),
			metadata;
		if (fs.existsSync(metadataFile)) {
			metadata = JSON.parse(fs.readFileSync(metadataFile));
			if (metadata && typeof metadata == 'object' && Array.isArray(metadata.exports)) {
				metadata.exports.forEach(function (namespace) {
					addTitaniumLibrary.call(this, namespace);
				}, this);
			} else {
				metadata = null;
			}
		}

		if (!module.jarFile || !module.bindings) return;

		Object.keys(module.bindings.modules).forEach(function (moduleClass) {
			var proxy = module.bindings.proxies[moduleClass],
				result = {
					id: proxy.proxyAttrs.id,
					apiName: module.bindings.modules[moduleClass].apiName,
					proxyName: proxy.proxyClassName,
					className: moduleClass,
					manifest: module.manifest,
					onAppCreate: proxy.onAppCreate || null,
					isNativeJsModule: !!module.manifest.commonjs
				};

			if (result.id != module.manifest.moduleid) return;

			// make sure that the module was not built before 1.8.0.1
			if (~~module.manifest.apiversion < 2) {
				this.logger.error(__('The "apiversion" for "%s" in the module manifest is less than version 2.', id.cyan));
				this.logger.error(__('The module was likely built against a Titanium SDK 1.8.0.1 or older.'));
				this.logger.error(__('Please use a version of the module that has "apiversion" 2 or greater'));
				this.logger.log();
				process.exit(1);
			}

			customModules.push(result);

			metadata && metadata.exports.forEach(function (namespace) {
				if (!appModulesMap[namespace]) {
					var r = createModuleDescriptor(namespace);
					r && appModules.push(r);
				}
			});
		}, this);
	}, this);

	next();
};

AndroidBuilder.prototype.generateJavaFiles = function generateJavaFiles(next) {
	var android = this.tiapp.android,
		copyTemplate = function (src, dest) {
			if (this.forceRebuild || !fs.existsSync(dest)) {
				this.logger.debug(__('Copying template %s => %s', src.cyan, dest.cyan));
				fs.writeFileSync(dest, ejs.render(fs.readFileSync(src).toString(), this));
			}
		}.bind(this);

	// copy and populate templates
	copyTemplate(path.join(this.templatesDir, 'AppInfo.java'), path.join(this.buildGenAppIdDir, 'AppInfo.java'));
	copyTemplate(path.join(this.templatesDir, 'AndroidManifest.xml'), path.join(this.buildDir, 'AndroidManifest.xml'));
	copyTemplate(path.join(this.templatesDir, 'App.java'), path.join(this.buildGenAppIdDir, this.classname + 'Application.java'));
	copyTemplate(path.join(this.templatesDir, 'Activity.java'), path.join(this.buildGenAppIdDir, this.classname + 'Activity.java'));
	copyTemplate(path.join(this.templatesDir, 'project'), path.join(this.buildDir, '.project'));
	copyTemplate(path.join(this.templatesDir, 'default.properties'), path.join(this.buildDir, 'default.properties'));

	afs.copyFileSync(path.join(this.templatesDir, 'gitignore'), path.join(this.buildDir, '.gitignore'), { logger: this.logger.debug });

	// TODO: merge custom classpath with build/android/.classpath
	afs.copyFileSync(path.join(this.templatesDir, 'classpath'), path.join(this.buildDir, '.classpath'), { logger: this.logger.debug });

	// generate the JavaScript-based activities
	if (android && android.activities) {
		var activityTemplate = fs.readFileSync(path.join(this.templatesDir, 'JSActivity.java')).toString();
		Object.keys(android.activities).forEach(function (name) {
			var activity = android.activities[name];
			this.logger.debug(__('Generating activity class: %s', activity.classname.cyan));
			fs.writeFileSync(path.join(this.buildGenAppIdDir, activity.classname + '.java'), ejs.render(activityTemplate, {
				appid: this.appid,
				activity: activity
			}));
		}, this);
	}

	// generate the JavaScript-based services
	if (android && android.services) {
		var serviceTemplate = fs.readFileSync(path.join(this.templatesDir, 'JSService.java')).toString(),
			intervalServiceTemplate = fs.readFileSync(path.join(this.templatesDir, 'JSIntervalService.java')).toString();
		Object.keys(android.services).forEach(function (name) {
			var service = android.services[name],
				tpl = serviceTemplate;
			if (service.type == 'interval') {
				tpl = intervalServiceTemplate;
				this.logger.debug(__('Generating interval service class: %s', service.classname.cyan));
			} else {
				this.logger.debug(__('Generating service class: %s', service.classname.cyan));
			}
			fs.writeFileSync(path.join(this.buildGenAppIdDir, service.classname + '.java'), ejs.render(tpl, {
				appid: this.appid,
				service: service
			}));
		}, this);
	}

	// write the app.json
	fs.writeFileSync(path.join(this.buildBinAssetsDir, 'app.json'), JSON.stringify({
		app_modules: this.appModules
	}));

	next();
};

AndroidBuilder.prototype.writeXmlFile = function writeXmlFile(srcOrDoc, dest) {
	var filename = path.basename(dest),
		destExists = fs.existsSync(dest),
		srcDoc = typeof srcOrDoc == 'string' ? (new DOMParser({ errorHandler: function(){} }).parseFromString(fs.readFileSync(srcOrDoc).toString(), 'text/xml')).documentElement : srcOrDoc,
		destDoc,
		dom = new DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n<resources/>', 'text/xml'),
		root = dom.documentElement,
		nodes = {},
		byName = function (node) {
			var n = xml.getAttr(node, 'name');
			n && (nodes[n] = node);
		},
		byTagAndName = function (node) {
			var n = xml.getAttr(node, 'name');
			if (n) {
				nodes[node.tagName] || (nodes[node.tagName] = {});
				nodes[node.tagName][n] = node;
			}
		};

	if (destExists) {
		// we're merging
		destDoc = (new DOMParser({ errorHandler: function(){} }).parseFromString(fs.readFileSync(dest).toString(), 'text/xml')).documentElement;
		if (typeof srcOrDoc == 'string') {
			this.logger.debug(__('Merging %s => %s', srcOrDoc.cyan, dest.cyan));
		}
	} else {
		// copy the file, but make sure there are no dupes
		if (typeof srcOrDoc == 'string') {
			this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		}
	}

	switch (filename) {
		case 'arrays.xml':
		case 'attrs.xml':
		case 'bools.xml':
		case 'colors.xml':
		case 'dimens.xml':
		case 'ids.xml':
		case 'integers.xml':
		case 'strings.xml':
			destDoc && xml.forEachElement(destDoc, byName);
			xml.forEachElement(srcDoc, byName);
			Object.keys(nodes).forEach(function (name) {
				root.appendChild(dom.createTextNode('\n\t'));
				root.appendChild(nodes[name]);
			});
			break;

		case 'styles.xml':
			destDoc && xml.forEachElement(destDoc, byTagAndName);
			xml.forEachElement(srcDoc, byTagAndName);
			Object.keys(nodes).forEach(function (tag) {
				Object.keys(nodes[tag]).forEach(function (name) {
					root.appendChild(dom.createTextNode('\n\t'));
					root.appendChild(nodes[tag][name]);
				});
			});
			break;
	}

	root.appendChild(dom.createTextNode('\n'));
	destExists && fs.unlinkSync(dest);
	fs.writeFileSync(dest, '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString());
};

AndroidBuilder.prototype.copyModuleResources = function copyModuleResources(next) {
	// for each jar library, if it has a companion resource zip file, extract
	// all of its files into the build dir, and yes, this is stupidly dangerous
	appc.async.series(this, Object.keys(this.jarLibraries).map(function (jarFile) {
		return function (done) {
			var resFile = jarFile.replace(/\.jar$/, '.res.zip');
			if (!fs.existsSync(jarFile) || !fs.existsSync(resFile)) return done();
			this.logger.info(__('Extracting module resources: %s', resFile.cyan));
			var tmp = temp.mkdirSync();
			appc.zip.unzip(resFile, tmp, {}, function (ex) {
				if (ex) {
					this.logger.error(__('Failed to extract module resource zip: %s', resFile.cyan) + '\n');
					process.exit(1);
				}

				var _t = this;

				// copy the files from the temp folder into the build dir
				(function copy(src, dest) {
					fs.readdirSync(src).forEach(function (filename) {
						var from = path.join(src, filename),
							to = path.join(dest, filename);
						if (fs.existsSync(from)) {
							if (fs.statSync(from).isDirectory()) {
								copy(from, to);
							} else if (_t.xmlMergeRegExp.test(filename)) {
								_t.writeXmlFile(from, to);
							} else {
								appc.fs.copyFileSync(from, to, { logger: _t.logger.debug });
							}
						}
					});
				}(tmp, this.buildDir));

				done();
			}.bind(this));
		};
	}), next);
};

AndroidBuilder.prototype.generateAidl = function generateAidl(next) {
	if (!this.androidTargetSDK.aidl) {
		this.logger.info(__('Android SDK %s missing framework aidl, skipping', this.androidTargetSDK['api-level']));
		return next();
	}

	var aidlRegExp = /\.aidl$/,
		files = (function scan(dir) {
			var f = [];
			fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);
				if (fs.existsSync(file)) {
					if (fs.statSync(file).isDirectory()) {
						f = f.concat(scan(file));
					} else if (aidlRegExp.test(name)) {
						f.push(file);
					}
				}
			});
			return f;
		}(this.buildSrcDir));

	if (!files.length) {
		this.logger.info(__('No aidl files to compile, continuing'));
		return next();
	}

	appc.async.series(this, files.map(function (file) {
		return function (callback) {
			var args = ['-p' + this.androidTargetSDK.aidl, '-I' + this.buildSrcDir, '-o' + this.buildGenAppIdDir, file];
			this.logger.info(__('Compiling aidl file: %s', file));
			this.logger.debug(__('Running %s', this.androidInfo.sdk.executables.aidl + ' ' + args.join(' ')));
			appc.subprocess.run(
				this.androidInfo.sdk.executables.aidl,
				args,
				callback
			);
		};
	}), next);
};

AndroidBuilder.prototype.generateI18N = function generateI18N(next) {
	var data = i18n.load(this.projectDir, this.logger);

	Object.keys(data).forEach(function (locale) {
		var dest = path.join(this.buildResDir, 'values' + (locale == 'en' ? '' : '-' + locale), 'strings.xml'),
			dom = new DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n<resources/>', 'text/xml'),
			root = dom.documentElement;

		Object.keys(data[locale].strings).forEach(function (name) {
			var node = dom.createElement('string');
			node.setAttribute('name', name);
			node.appendChild(dom.createTextNode(data[locale].strings[name]));
			root.appendChild(dom.createTextNode('\n\t'));
			root.appendChild(node);
		});

		root.appendChild(dom.createTextNode('\n'));

		if (fs.existsSync(dest)) {
			this.logger.debug(__('Merging %s strings => %s', locale.cyan, dest.cyan));
		} else {
			this.logger.debug(__('Writing %s strings => %s', locale.cyan, dest.cyan));
		}
		this.writeXmlFile(dom.documentElement, dest);
	}, this);

	next();
};

AndroidBuilder.prototype.generateAndroidManifest = function generateAndroidManifest(next) {
	var calendarPermissions = [ 'READ_CALENDAR', 'WRITE_CALENDAR' ],
		cameraPermissions = [ 'CAMERA' ],
		contactsPermissions = [ 'READ_CONTACTS', 'WRITE_CONTACTS' ],
		contactsReadPermissions = [ 'READ_CONTACTS' ],
		geoPermissions = [ 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION' ],
		vibratePermissions = [ 'VIBRATE' ],
		wallpaperPermissions = [ 'SET_WALLPAPER' ],

		permissions = {
			'INTERNET': 1,
			'ACCESS_WIFI_STATE': 1,
			'ACCESS_NETWORK_STATE': 1,
			'WRITE_EXTERNAL_STORAGE': 1
		},

		tiNamespacePermissions = {
			'geolocation': geoPermissions
		},

		tiMethodPermissions = {
			// old calendar
			'Android.Calendar.getAllAlerts': calendarPermissions,
			'Android.Calendar.getAllCalendars': calendarPermissions,
			'Android.Calendar.getCalendarById': calendarPermissions,
			'Android.Calendar.getSelectableCalendars': calendarPermissions,

			// new calendar
			'Calendar.getAllAlerts': calendarPermissions,
			'Calendar.getAllCalendars': calendarPermissions,
			'Calendar.getCalendarById': calendarPermissions,
			'Calendar.getSelectableCalendars': calendarPermissions,

			'Contacts.createPerson': contactsPermissions,
			'Contacts.removePerson': contactsPermissions,
			'Contacts.getAllContacts': contactsReadPermissions,
			'Contacts.showContactPicker': contactsReadPermissions,
			'Contacts.showContacts': contactsReadPermissions,
			'Contacts.getPersonByID': contactsReadPermissions,
			'Contacts.getPeopleWithName': contactsReadPermissions,
			'Contacts.getAllPeople': contactsReadPermissions,
			'Contacts.getAllGroups': contactsReadPermissions,
			'Contacts.getGroupByID': contactsReadPermissions,

			'Map.createView': geoPermissions,

			'Media.Android.setSystemWallpaper': wallpaperPermissions,
			'Media.showCamera': cameraPermissions,
			'Media.vibrate': vibratePermissions,
		},

		tiMethodActivities = {
			'Map.createView': {
				'activity': {
					'android:name': 'ti.modules.titanium.map.TiMapActivity',
					'android:configChanges': 'keyboardHidden|orientation',
					'android:launchMode': 'singleTask'
				},
				'uses-library': {
					'android:name': 'com.google.android.maps'
				}
			},
			'Media.createVideoPlayer': {
				'activity': {
					'android:name': 'ti.modules.titanium.media.TiVideoActivity',
					'android:configChanges': 'keyboardHidden|orientation',
					'android:theme': '@android:style/Theme.NoTitleBar.Fullscreen',
					'android:launchMode': 'singleTask'
				}
			},
			'Media.showCamera': {
				'activity': {
					'android:name': 'ti.modules.titanium.media.TiCameraActivity',
					'android:configChanges': 'keyboardHidden|orientation',
					'android:theme': '@android:style/Theme.Translucent.NoTitleBar.Fullscreen'
				}
			}
		},

		googleAPIs = [
			'Map.createView'
		],

		enableGoogleAPIWarning = this.target == 'emulator' && this.emulator && !this.emulator.googleApis,

		activities = [];

	if (this.deployType == 'development' || this.deployType == 'test') {
		// enable mock location if in development or test mode
		geoPermissions.push('ACCESS_MOCK_LOCATION');
	}

	// set permissions for each titanium namespace found
	Object.keys(this.tiNamespaces).forEach(function (ns) {
		if (tiNamespacePermissions[ns]) {
			tiNamespacePermissions[ns].forEach(function (perm) {
				permissions[perm] = 1;
			});
		}
	}, this);

	// set permissions for each titanium method found
	var tmp = {};
	Object.keys(this.tiSymbols).forEach(function (file) {
		this.tiSymbols[file].forEach(function (symbol) {
			if (tmp[symbol]) return;
			tmp[symbol] = 1;

			if (tiMethodPermissions[symbol]) {
				tiMethodPermissions[symbol].forEach(function (perm) {
					permissions[perm] = 1;
				});
			}

			if (tiMethodActivities[symbol]) {
				activities.push(tiMethodActivities[symbol]);
			}

			if (enableGoogleAPIWarning && googleAPIs.indexOf(symbol) != -1) {
				var fn = 'Titanium.' + symbol + '()';
				if (this.emulator.googleApis === null) {
					this.logger.warn(__('Detected %s call which requires Google APIs, however the selected emulator %s may or may not support Google APIs', fn.cyan, ('"' + this.emulator.name + '"').cyan));
					this.logger.warn(__('If the emulator does not support Google APIs, the %s call will fail', fn.cyan));
				} else {
					this.logger.warn(__('Detected %s call which requires Google APIs, but the selected emulator %s does not support Google APIs', fn.cyan, ('"' + this.emulator.name + '"').cyan));
					this.logger.warn(__('Expect the %s call to fail', fn.cyan));
				}
				this.logger.warn(__('You should use, or create, an Android emulator that does support Google APIs'));
			}
		}, this);
	}, this);

	dump(permissions);

/*
		# Javascript-based activities defined in tiapp.xml
		if self.tiapp and self.tiapp.android and 'activities' in self.tiapp.android:
			tiapp_activities = self.tiapp.android['activities']
			for key in tiapp_activities:
				activity = tiapp_activities[key]
				if not 'url' in activity:
					continue
				activity_name = self.app_id + '.' + activity['classname']
				activity_str = '<activity \n\t\t\tandroid:name="%s"' % activity_name
				for subkey in activity:
					if subkey not in ('nodes', 'name', 'url', 'options', 'classname', 'android:name'):
						activity_str += '\n\t\t\t%s="%s"' % (subkey, activity[subkey])

				if 'android:config' not in activity:
					activity_str += '\n\t\t\tandroid:configChanges="keyboardHidden|orientation"'
				if 'nodes' in activity:
					activity_str += '>'
					for node in activity['nodes']:
						activity_str += '\n\t\t\t\t' + node.toxml()
					activities.append(activity_str + '\n\t\t</activity>\n')
				else:
					activities.append(activity_str + '\n\t\t/>\n')

		activities = set(activities)

		services = []
		# Javascript-based services defined in tiapp.xml
		if self.tiapp and self.tiapp.android and 'services' in self.tiapp.android:
			tiapp_services = self.tiapp.android['services']
			for key in tiapp_services:
				service = tiapp_services[key]
				if not 'url' in service:
					continue
				service_name = self.app_id + '.' + service['classname']
				service_str = '<service \n\t\t\tandroid:name="%s"' % service_name
				for subkey in service:
					if subkey not in ('nodes', 'service_type', 'type', 'name', 'url', 'options', 'classname', 'android:name'):
						service_str += '\n\t\t\t%s="%s"' % (subkey, service[subkey])

				if 'nodes' in service:
					service_str += '>'
					for node in service['nodes']:
						service_str += '\n\t\t\t\t' + node.toxml()
					services.append(service_str + '\n\t\t</service>\n')
				else:
					services.append(service_str + '\n\t\t/>\n')


		self.use_maps = False
		self.res_changed = False
		icon_name = self.tiapp.properties['icon']
		icon_path = os.path.join(self.assets_resources_dir, icon_name)
		icon_ext = os.path.splitext(icon_path)[1]

		res_drawable_dest = os.path.join(self.project_dir, 'res', 'drawable')
		if not os.path.exists(res_drawable_dest):
			os.makedirs(res_drawable_dest)

		default_icon = os.path.join(self.support_resources_dir, 'default.png')
		dest_icon = os.path.join(res_drawable_dest, 'appicon%s' % icon_ext)
		if Deltafy.needs_update(icon_path, dest_icon):
			self.res_changed = True
			debug("copying app icon: %s" % icon_path)
			shutil.copy(icon_path, dest_icon)
		elif Deltafy.needs_update(default_icon, dest_icon):
			self.res_changed = True
			debug("copying default app icon")
			shutil.copy(default_icon, dest_icon)

		# make our Titanium theme for our icon
		res_values_dir = os.path.join(self.project_dir, 'res','values')
		if not os.path.exists(res_values_dir):
			os.makedirs(res_values_dir)
		theme_xml = os.path.join(res_values_dir,'theme.xml')
		if not os.path.exists(theme_xml):
			self.res_changed = True
			debug('generating theme.xml')
			theme_file = open(theme_xml, 'w')
			theme_flags = "Theme"
			# We need to treat the default values for fulscreen and
			# navbar-hidden the same as android.py does -- false for both.
			theme_fullscreen = False
			theme_navbarhidden = False
			if (self.tiapp.properties.get("fullscreen") == "true" or
					self.tiapp.properties.get("statusbar-hidden") == "true"):
				theme_fullscreen = True
			elif self.tiapp.properties.get("navbar-hidden") == "true":
				theme_navbarhidden = True
			if theme_fullscreen:
				theme_flags += ".NoTitleBar.Fullscreen"
			elif theme_navbarhidden:
				theme_flags += ".NoTitleBar"
			# Wait, one exception.  If you want the notification area (very
			# top of screen) hidden, but want the title bar in the app,
			# there's no theme for that.  So we have to use the default theme (no flags)
			# and when the application code starts running, the adjustments are then made.
			# Only do this when the properties are explicitly set, so as to avoid changing
			# old default behavior.
			if theme_flags.endswith('.Fullscreen') and \
					self.tiapp.properties.get("navbar-hidden") == 'false' and \
					('fullscreen' in self.tiapp.explicit_properties or \
					'statusbar-hidden' in self.tiapp.explicit_properties) and \
					'navbar-hidden' in self.tiapp.explicit_properties:
				theme_flags = 'Theme'

			TITANIUM_THEME="""<?xml version="1.0" encoding="utf-8"?>
<resources>
<style name="Theme.Titanium" parent="android:%s">
    <item name="android:windowBackground">@drawable/background</item>
</style>
</resources>
""" % theme_flags
			theme_file.write(TITANIUM_THEME)
			theme_file.close()

		# create our background image which acts as splash screen during load
		resources_dir = os.path.join(self.top_dir, 'Resources')
		android_images_dir = os.path.join(resources_dir, 'android', 'images')
		# look for density-specific default.png's first


		NOTE: we need to support nine patch as well as jpg
		/^default\.(9\.png|png|jpg)$/


		if os.path.exists(android_images_dir):
			pattern = r'/android/images/(high|medium|low|res-[^/]+)/default.png'
			for root, dirs, files in os.walk(android_images_dir):
				remove_ignored_dirs(dirs)
				for f in files:
					if f in ignoreFiles:
						continue
					path = os.path.join(root, f)
					if re.search(pattern, path.replace(os.sep, "/")):
						res_folder = resource_drawable_folder(path)
						debug('found %s splash screen at %s' % (res_folder, path))
						dest_path = os.path.join(self.res_dir, res_folder)
						dest_file = os.path.join(dest_path, 'background.png')
						if not os.path.exists(dest_path):
							os.makedirs(dest_path)
						if Deltafy.needs_update(path, dest_file):
							self.res_changed = True
							debug('copying %s splash screen to %s' % (path, dest_file))
							shutil.copy(path, dest_file)

		default_png = os.path.join(self.assets_resources_dir, 'default.png')
		support_default_png = os.path.join(self.support_resources_dir, 'default.png')
		background_png = os.path.join(self.project_dir, 'res','drawable','background.png')
		if os.path.exists(default_png) and Deltafy.needs_update(default_png, background_png):
			self.res_changed = True
			debug("found splash screen at %s" % os.path.abspath(default_png))
			shutil.copy(default_png, background_png)
		elif Deltafy.needs_update(support_default_png, background_png):
			self.res_changed = True
			debug("copying default splash screen")
			shutil.copy(support_default_png, background_png)


		android_manifest = os.path.join(self.project_dir, 'AndroidManifest.xml')
		android_manifest_to_read = android_manifest

		# NOTE: allow the user to use their own custom AndroidManifest if they put a file named
		# AndroidManifest.xml in platform/android, in which case all bets are off
		is_custom = False
		# Catch people who may have it in project root (un-released 1.4.x android_native_refactor branch users)
		if os.path.exists(os.path.join(self.top_dir, 'AndroidManifest.xml')):
			warn('AndroidManifest.xml file in the project root is ignored.  Move it to platform/android if you want it to be your custom manifest.')
		android_custom_manifest = os.path.join(self.project_dir, 'AndroidManifest.custom.xml')
		if not os.path.exists(android_custom_manifest):
			android_custom_manifest = os.path.join(self.platform_dir, 'AndroidManifest.xml')
		else:
			warn('Use of AndroidManifest.custom.xml is deprecated. Please put your custom manifest as "AndroidManifest.xml" in the "platform/android" directory if you do not need to compile for versions < 1.5')
		if os.path.exists(android_custom_manifest):
			android_manifest_to_read = android_custom_manifest
			is_custom = True
			info("Detected custom ApplicationManifest.xml -- no Titanium version migration supported")



		default_manifest_contents = self.android.render_android_manifest()

		def render_android_manifest(self):
			template_dir = os.path.dirname(sys._getframe(0).f_code.co_filename)
			tmpl = self.load_template(os.path.join(template_dir, 'templates', 'AndroidManifest.xml'))
			return tmpl.render(config = self.config)




		if self.sdk.api_level >= HONEYCOMB_MR2_LEVEL:
			# Need to add "screenSize" in our default "configChanges" attribute on
			# <activity> elements, else changes in orientation will cause the app
			# to restart. cf. TIMOB-10863.
			default_manifest_contents = default_manifest_contents.replace('|orientation"', '|orientation|screenSize"')
			debug("Added 'screenSize' to <activity android:configChanges> because targeted api level %s is >= %s" % (self.sdk.api_level, HONEYCOMB_MR2_LEVEL))

		custom_manifest_contents = None
		if is_custom:
			custom_manifest_contents = open(android_manifest_to_read,'r').read()

		manifest_xml = ''
		def get_manifest_xml(tiapp, template_obj=None):
			xml = ''
			if 'manifest' in tiapp.android_manifest:
				for manifest_el in tiapp.android_manifest['manifest']:
					# since we already track permissions in another way, go ahead and us e that
					if manifest_el.nodeName == 'uses-permission' and manifest_el.hasAttribute('android:name'):
						if manifest_el.getAttribute('android:name').split('.')[-1] not in permissions_required:
							perm_val = manifest_el.getAttribute('android:name')
							if template_obj is not None and "${" in perm_val:
								perm_val = render_template_with_tiapp(perm_val, template_obj)
							permissions_required.append(perm_val)
					elif manifest_el.nodeName not in ('supports-screens', 'uses-sdk'):
						this_xml = manifest_el.toprettyxml()
						if template_obj is not None and "${" in this_xml:
							this_xml = render_template_with_tiapp(this_xml, template_obj)
						xml += this_xml
			return xml

		application_xml = ''
		def get_application_xml(tiapp, template_obj=None):
			xml = ''
			if 'application' in tiapp.android_manifest:
				for app_el in tiapp.android_manifest['application']:
					this_xml = app_el.toxml()
					if template_obj is not None and "${" in this_xml:
						this_xml = render_template_with_tiapp(this_xml, template_obj)
					xml += this_xml
			return xml

		# add manifest / application entries from tiapp.xml
		manifest_xml += get_manifest_xml(self.tiapp)
		application_xml += get_application_xml(self.tiapp)

		# add manifest / application entries from modules
		for module in self.modules:
			if module.xml == None: continue
			manifest_xml += get_manifest_xml(module.xml, self.tiapp)
			application_xml += get_application_xml(module.xml, self.tiapp)

		# build the permissions XML based on the permissions detected
		permissions_required = set(permissions_required)
		permissions_required_xml = ""
		for p in permissions_required:
			if '.' not in p:
				permissions_required_xml+="<uses-permission android:name=\"android.permission.%s\"/>\n\t" % p
			else:
				permissions_required_xml+="<uses-permission android:name=\"%s\"/>\n\t" % p

		def fill_manifest(manifest_source):
			ti_activities = '<!-- TI_ACTIVITIES -->'
			ti_permissions = '<!-- TI_PERMISSIONS -->'
			ti_manifest = '<!-- TI_MANIFEST -->'
			ti_application = '<!-- TI_APPLICATION -->'
			ti_services = '<!-- TI_SERVICES -->'
			manifest_source = manifest_source.replace(ti_activities,"\n\n\t\t".join(activities))
			manifest_source = manifest_source.replace(ti_services,"\n\n\t\t".join(services))
			manifest_source = manifest_source.replace(ti_permissions,permissions_required_xml)
			if len(manifest_xml) > 0:
				manifest_source = manifest_source.replace(ti_manifest, manifest_xml)
			if len(application_xml) > 0:
				manifest_source = manifest_source.replace(ti_application, application_xml)

			return manifest_source

		default_manifest_contents = fill_manifest(default_manifest_contents)
		# if a custom uses-sdk or supports-screens has been specified via tiapp.xml
		# <android><manifest>..., we need to replace the ones in the generated
		# default manifest
		supports_screens_node = None
		uses_sdk_node = None
		if 'manifest' in self.tiapp.android_manifest:
			for node in self.tiapp.android_manifest['manifest']:
				if node.nodeName == 'uses-sdk':
					uses_sdk_node = node
				elif node.nodeName == 'supports-screens':
					supports_screens_node = node
		if supports_screens_node or uses_sdk_node or ('manifest-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['manifest-attributes'].length) or ('application-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['application-attributes'].length):
			dom = parseString(default_manifest_contents)
			def replace_node(olddom, newnode):
				nodes = olddom.getElementsByTagName(newnode.nodeName)
				retval = False
				if nodes:
					olddom.documentElement.replaceChild(newnode, nodes[0])
					retval = True
				return retval

			if supports_screens_node:
				if not replace_node(dom, supports_screens_node):
					dom.documentElement.insertBefore(supports_screens_node, dom.documentElement.firstChild.nextSibling)
			if uses_sdk_node:
				replace_node(dom, uses_sdk_node)

			def set_attrs(element, new_attr_set):
				for k in new_attr_set.keys():
					if element.hasAttribute(k):
						element.removeAttribute(k)
					element.setAttribute(k, new_attr_set.get(k).value)

			if 'manifest-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['manifest-attributes'].length:
				set_attrs(dom.documentElement, self.tiapp.android_manifest['manifest-attributes'])
			if 'application-attributes' in self.tiapp.android_manifest and self.tiapp.android_manifest['application-attributes'].length:
				set_attrs(dom.getElementsByTagName('application')[0], self.tiapp.android_manifest['application-attributes'])

			default_manifest_contents = dom.toxml()

		if application_xml:
			# If the tiapp.xml <manifest><application> section was not empty, it could be
			# that user put in <activity> entries that duplicate our own,
			# such as if they want a custom theme on TiActivity.  So we should delete any dupes.
			dom = parseString(default_manifest_contents)
			package_name = dom.documentElement.getAttribute('package')
			manifest_activities = dom.getElementsByTagName('activity')
			activity_names = []
			nodes_to_delete = []
			for manifest_activity in manifest_activities:
				if manifest_activity.hasAttribute('android:name'):
					activity_name = manifest_activity.getAttribute('android:name')
					if activity_name.startswith('.'):
						activity_name = package_name + activity_name
					if activity_name in activity_names:
						nodes_to_delete.append(manifest_activity)
					else:
						activity_names.append(activity_name)
			if nodes_to_delete:
				for node_to_delete in nodes_to_delete:
					node_to_delete.parentNode.removeChild(node_to_delete)
				default_manifest_contents = dom.toxml()

		if custom_manifest_contents:
			custom_manifest_contents = fill_manifest(custom_manifest_contents)

		new_manifest_contents = None
		android_manifest_gen = android_manifest + '.default'
		if custom_manifest_contents:
			new_manifest_contents = custom_manifest_contents
			# Write the would-be default as well so user can see
			# some of the auto-gen'd insides of it if they need/want.
			amf = open(android_manifest_gen, 'w')
			amf.write(default_manifest_contents)
			amf.close()
		else:
			new_manifest_contents = default_manifest_contents
			if os.path.exists(android_manifest_gen):
				os.remove(android_manifest_gen)

		manifest_changed = False
		old_contents = None
		if os.path.exists(android_manifest):
			old_contents = open(android_manifest, 'r').read()

		if new_manifest_contents != old_contents:
			trace("Writing out AndroidManifest.xml")
			amf = open(android_manifest,'w')
			amf.write(new_manifest_contents)
			amf.close()
			manifest_changed = True

		if self.res_changed or manifest_changed:
			res_dir = os.path.join(self.project_dir, 'res')
			output = run.run([self.aapt, 'package', '-m',
				'-J', self.project_gen_dir,
				'-M', android_manifest,
				'-S', res_dir,
				'-I', self.android_jar], warning_regex=r'skipping')

		r_file = os.path.join(self.project_gen_dir, self.app_id.replace('.', os.sep), 'R.java')
		if not os.path.exists(r_file) or (self.res_changed and output == None):
			error("Error generating R.java from manifest")
			sys.exit(1)

		return manifest_changed
	*/
	next();
};

AndroidBuilder.prototype.compileJavaClasses = function compileJavaClasses(next) {
	/*
	src_list = []
	self.module_jars = []

	classpath = os.pathsep.join([self.android_jar, os.pathsep.join(self.android_jars)])

	project_module_dir = os.path.join(self.top_dir,'modules','android')
	for module in self.modules:
		if module.jar == None: continue
		self.module_jars.append(module.jar)
		classpath = os.pathsep.join([classpath, module.jar])
		module_lib = module.get_resource('lib')
		for jar in glob.glob(os.path.join(module_lib, '*.jar')):
			self.module_jars.append(jar)
			classpath = os.pathsep.join([classpath, jar])

	if len(self.module_jars) > 0:
		# kroll-apt.jar is needed for modules
		classpath = os.pathsep.join([classpath, self.kroll_apt_jar])

	classpath = os.pathsep.join([classpath, os.path.join(self.support_dir, 'lib', 'titanium-verify.jar')])
	if self.deploy_type != 'production':
		classpath = os.pathsep.join([classpath, os.path.join(self.support_dir, 'lib', 'titanium-debug.jar')])
		classpath = os.pathsep.join([classpath, os.path.join(self.support_dir, 'lib', 'titanium-profiler.jar')])

	for java_file in self.recurse([self.project_src_dir, self.project_gen_dir], '*.java'):
		if self.project_src_dir in java_file:
			relative_path = java_file[len(self.project_src_dir)+1:]
		else:
			relative_path = java_file[len(self.project_gen_dir)+1:]
		class_file = os.path.join(self.classes_dir, relative_path.replace('.java', '.class'))

		if Deltafy.needs_update(java_file, class_file) > 0:
			# the file list file still needs each file escaped apparently
			debug("adding %s to javac build list" % java_file)
			src_list.append('"%s"' % java_file.replace("\\", "\\\\"))

	if len(src_list) == 0:
		# No sources are older than their classfile counterparts, we can skip javac / dex
		return False

	debug("Building Java Sources: " + " ".join(src_list))
	javac_command = [self.javac, '-encoding', 'utf8',
		'-classpath', classpath, '-d', self.classes_dir, '-proc:none',
		'-sourcepath', self.project_src_dir,
		'-sourcepath', self.project_gen_dir, '-target', '1.6', '-source', '1.6']
	(src_list_osfile, src_list_filename) = tempfile.mkstemp()
	src_list_file = os.fdopen(src_list_osfile, 'w')
	src_list_file.write("\n".join(src_list))
	src_list_file.close()

	javac_command.append('@' + src_list_filename)
	(out, err, javac_process) = run.run(javac_command, ignore_error=True, return_error=True, return_process=True)
	os.remove(src_list_filename)
	if javac_process.returncode != 0:
		error("Error(s) compiling generated Java code")
		error(str(err))
		sys.exit(1)
	return True
	*/
	next();
};

AndroidBuilder.prototype.runDexer = function runDexer(next) {
	// run the dexer
	// TODO: fire a hook
	/*
	self.classes_dex = os.path.join(self.project_dir, 'bin', 'classes.dex')

	# the dx.bat that ships with android in windows doesn't allow command line
	# overriding of the java heap space, so we call the jar directly
	if platform.system() == 'Windows':
		dex_args = [self.java, '-Xmx1024M', '-Djava.ext.dirs=%s' % self.sdk.get_platform_tools_dir(), '-jar', self.sdk.get_dx_jar()]
	else:
		dex_args = [dx, '-JXmx1536M', '-JXX:-UseGCOverheadLimit']

	# Look for New Relic module
	newrelic_module = None
	for module in self.modules:
		if module.path.find("newrelic") > 0:
			newrelic_module = module
			break

	# If New Relic is present, add its Java agent to the dex arguments.
	if newrelic_module:
		info("Adding New Relic support.")

		# Copy the dexer java agent jar to a tempfile. Eliminates white space from
		# the module path which causes problems with the dex -Jjavaagent argument.
		temp_jar = tempfile.NamedTemporaryFile(suffix='.jar', delete=True)
		shutil.copyfile(os.path.join(newrelic_module.path, 'class.rewriter.jar'), temp_jar.name)
		dex_args += ['-Jjavaagent:' + os.path.join(temp_jar.name)]

	dex_args += ['--dex', '--output='+self.classes_dex, self.classes_dir]
	dex_args += self.android_jars
	dex_args += self.module_jars

	dex_args.append(os.path.join(self.support_dir, 'lib', 'titanium-verify.jar'))
	if self.deploy_type != 'production':
		dex_args.append(os.path.join(self.support_dir, 'lib', 'titanium-debug.jar'))
		dex_args.append(os.path.join(self.support_dir, 'lib', 'titanium-profiler.jar'))
		# the verifier depends on Ti.Network classes, so we may need to inject it
		has_network_jar = False
		for jar in self.android_jars:
			if jar.endswith('titanium-network.jar'):
				has_network_jar = True
				break
		if not has_network_jar:
			dex_args.append(os.path.join(self.support_dir, 'modules', 'titanium-network.jar'))
	run_result = run.run(dex_args, warning_regex=r'warning: ')
	*/
	next();
};

AndroidBuilder.prototype.packageApp = function packageApp(next) {
	/*
	# If in production mode and compiling JS, we do not package the JS
	# files as assets (we protect them from prying eyes). But if a JS
	# file is referenced in an html <script> tag, we DO need to package it.
	def get_js_referenced_in_html():
		js_files = []
		for root, dirs, files in os.walk(self.assets_dir):
			for one_file in files:
				if one_file.lower().endswith(".html"):
					full_path = os.path.join(root, one_file)
					html_source = None
					file_stream = None
					try:
						file_stream = open(full_path, "r")
						html_source = file_stream.read()
					except:
						error("Unable to read html file '%s'" % full_path)
					finally:
						file_stream.close()

					if html_source:
						parser = HTMLParser()
						parser.parse(html_source)
						relative_js_files = parser.get_referenced_js_files()
						if relative_js_files:
							for one_rel_js_file in relative_js_files:
								if one_rel_js_file.startswith("http:") or one_rel_js_file.startswith("https:"):
									continue
								if one_rel_js_file.startswith("app://"):
									one_rel_js_file = one_rel_js_file[6:]
								js_files.append(os.path.abspath(os.path.join(os.path.dirname(full_path), one_rel_js_file)))

		return js_files

	ap_ = os.path.join(self.project_dir, 'bin', 'app.ap_')

	# This is only to check if this has been overridden in production
	has_compile_js = self.tiappxml.has_app_property("ti.android.compilejs")
	compile_js = not has_compile_js or (has_compile_js and \
		self.tiappxml.to_bool(self.tiappxml.get_app_property('ti.android.compilejs')))

	# JS files referenced in html files and thus likely needed for webviews.
	webview_js_files = []

	pkg_assets_dir = self.assets_dir
	if self.deploy_type == "test":
		compile_js = False

	if compile_js and os.environ.has_key('SKIP_JS_MINIFY'):
		compile_js = False
		info("Disabling JavaScript minification")

	if self.deploy_type == "production" and compile_js:
		webview_js_files = get_js_referenced_in_html()
		non_js_assets = os.path.join(self.project_dir, 'bin', 'non-js-assets')
		if not os.path.exists(non_js_assets):
			os.mkdir(non_js_assets)
		copy_all(self.assets_dir, non_js_assets, ignore_exts=['.js'])

		# if we have any js files referenced in html, we *do* need
		# to package them as if they are non-js assets.
		if webview_js_files:
			for one_js_file in webview_js_files:
				if os.path.exists(one_js_file):
					dest_file = one_js_file.replace(self.assets_dir, non_js_assets, 1)
					if not os.path.exists(os.path.dirname(dest_file)):
						os.makedirs(os.path.dirname(dest_file))
					shutil.copyfile(one_js_file, dest_file)

		pkg_assets_dir = non_js_assets

	run.run([self.aapt, 'package', '-f', '-M', 'AndroidManifest.xml', '-A', pkg_assets_dir,
		'-S', 'res', '-I', self.android_jar, '-I', self.titanium_jar, '-F', ap_], warning_regex=r'skipping')
	*/
	next();
};

AndroidBuilder.prototype.createUnsignedApk = function createUnsignedApk(next) {
	// create the unsigned apk
	// unsigned_apk = self.create_unsigned_apk(ap_, webview_js_files)
	/*
	def create_unsigned_apk(self, resources_zip_file, webview_js_files=None):
		unsigned_apk = os.path.join(self.project_dir, 'bin', 'app-unsigned.apk')
		self.apk_updated = False

		apk_modified = None
		if os.path.exists(unsigned_apk):
			apk_modified = Deltafy.get_modified_datetime(unsigned_apk)

		debug("creating unsigned apk: " + unsigned_apk)
		# copy existing resources into the APK
		apk_zip = zipfile.ZipFile(unsigned_apk, 'w', zipfile.ZIP_DEFLATED)

		def skip_jar_path(path):
			ext = os.path.splitext(path)[1]
			if path.endswith('/'): return True
			if path.startswith('META-INF/'): return True
			if path.split('/')[-1].startswith('.'): return True
			if ext == '.class': return True
			if 'org/appcelerator/titanium/bindings' in path and ext == '.json': return True
			if 'tiapp' in path and ext =='.xml': return True

		def skip_js_file(path):
			return self.compile_js is True and \
				os.path.splitext(path)[1] == '.js' and \
				os.path.join(self.project_dir, "bin", path) not in webview_js_files

		def compression_type(path):
			ext = os.path.splitext(path)[1]
			if ext in uncompressed_types:
				return zipfile.ZIP_STORED
			return zipfile.ZIP_DEFLATED

		def zipinfo(path):
			info = zipfile.ZipInfo(path)
			info.compress_type = compression_type(path)
			return info

		def is_modified(path):
			return apk_modified is None or Deltafy.needs_update_timestamp(path, apk_modified)

		def zip_contains(zip, entry):
			try:
				zip.getinfo(entry)
			except:
				return False
			return True

		if is_modified(resources_zip_file):
			self.apk_updated = True
			resources_zip = zipfile.ZipFile(resources_zip_file)
			for path in resources_zip.namelist():
				if skip_jar_path(path) or skip_js_file(path): continue
				debug("from resource zip => " + path)
				apk_zip.writestr(zipinfo(path), resources_zip.read(path))
			resources_zip.close()

		# add classes.dex
		if is_modified(self.classes_dex) or not zip_contains(apk_zip, 'classes.dex'):
			apk_zip.write(self.classes_dex, 'classes.dex')

		# add all resource files from the project
		for root, dirs, files in os.walk(self.project_src_dir, True, None, True):
			remove_ignored_dirs(dirs)
			for f in files:
				if f in ignoreFiles:
					continue
				if os.path.splitext(f)[1] != '.java':
					absolute_path = os.path.join(root, f)
					relative_path = os.path.join(root[len(self.project_src_dir)+1:], f)
					if is_modified(absolute_path) or not zip_contains(apk_zip, relative_path):
						self.apk_updated = True
						debug("resource file => " + relative_path)
						apk_zip.write(os.path.join(root, f), relative_path, compression_type(f))

		def add_resource_jar(jar_file):
			jar = zipfile.ZipFile(jar_file)
			for path in jar.namelist():
				if skip_jar_path(path): continue
				debug("from JAR %s => %s" % (jar_file, path))
				apk_zip.writestr(zipinfo(path), jar.read(path))
			jar.close()

		for jar_file in self.module_jars:
			add_resource_jar(jar_file)
		for jar_file in self.android_jars:
			add_resource_jar(jar_file)

		def add_native_libs(libs_dir, exclude=[]):
			if os.path.exists(libs_dir):
				for abi_dir in os.listdir(libs_dir):
					if abi_dir not in self.abis:
						continue
					libs_abi_dir = os.path.join(libs_dir, abi_dir)
					if not os.path.isdir(libs_abi_dir): continue
					for file in os.listdir(libs_abi_dir):
						if file.endswith('.so') and file not in exclude:
							native_lib = os.path.join(libs_abi_dir, file)
							path_in_zip = '/'.join(['lib', abi_dir, file])
							if is_modified(native_lib) or not zip_contains(apk_zip, path_in_zip):
								self.apk_updated = True
								debug("installing native lib: %s" % native_lib)
								apk_zip.write(native_lib, path_in_zip)

		# add module native libraries
		for module in self.modules:
			exclude_libs = []
			add_native_libs(module.get_resource('libs'), exclude_libs)
	*/
	//	# add any native libraries : libs/**/*.so -> lib/**/*.so
	/*
		add_native_libs(os.path.join(self.project_dir, 'libs'))

		# add sdk runtime native libraries
		debug("installing native SDK libs")
		sdk_native_libs = os.path.join(template_dir, 'native', 'libs')

		for abi in self.abis:
			lib_source_dir = os.path.join(sdk_native_libs, abi)
			lib_dest_dir = 'lib/%s/' % abi
			if abi == 'x86' and ((not os.path.exists(lib_source_dir)) or self.deploy_type == 'production'):
				# x86 only in non-production builds for now.
				continue

			# libtiverify is always included
			apk_zip.write(os.path.join(lib_source_dir, 'libtiverify.so'), lib_dest_dir + 'libtiverify.so')
			# profiler
			apk_zip.write(os.path.join(lib_source_dir, 'libtiprofiler.so'), lib_dest_dir + 'libtiprofiler.so')

			for fname in ('libkroll-v8.so', 'libstlport_shared.so'):
				apk_zip.write(os.path.join(lib_source_dir, fname), lib_dest_dir + fname)

		self.apk_updated = True

		apk_zip.close()
		return unsigned_apk
	*/
	next();
};

AndroidBuilder.prototype.createSignedApk = function createSignedApk(next) {
	// sign the apk
	/*
	def get_sigalg(self):
		output = run.run([self.keytool,
			'-v',
			'-list',
			'-keystore', self.keystore,
			'-storepass', self.keystore_pass,
			'-alias', self.keystore_alias
		], protect_arg_positions=(6,))

		# If the keytool encounters an error, that means some of the provided
		# keychain info is invalid and we should bail anyway
		run.check_output_for_error(output, r'RuntimeException: (.*)', True)
		run.check_output_for_error(output, r'^keytool: (.*)', True)

		match = re.search(r'Signature algorithm name: (.*)', output)
		if match is not None:
			return match.group(1)

		# Return the default:
		return "MD5withRSA"

	output = run.run([self.jarsigner,
		'-sigalg', self.get_sigalg(),
		'-digestalg', 'SHA1',
		'-storepass', self.keystore_pass,
		'-keystore', self.keystore,
		'-signedjar', app_apk,
		unsigned_apk,
		self.keystore_alias], protect_arg_positions=(6,))
	run.check_output_for_error(output, r'RuntimeException: (.*)', True)
	run.check_output_for_error(output, r'^jarsigner: (.*)', True)
	*/
	next();
};

AndroidBuilder.prototype.zipAlignApk = function zipAlignApk(next) {
	// zip align the signed apk
	/*
	# zipalign to align byte boundaries
	zipalign = self.sdk.get_zipalign()
	if os.path.exists(app_apk+'z'):
		os.remove(app_apk+'z')
	ALIGN_32_BIT = 4
	output = run.run([zipalign, '-v', str(ALIGN_32_BIT), app_apk, app_apk+'z'])
	*/
	next();
};

// create the builder instance and expose the public api
(function (androidBuilder) {
	exports.config   = androidBuilder.config.bind(androidBuilder);
	exports.validate = androidBuilder.validate.bind(androidBuilder);
	exports.run      = androidBuilder.run.bind(androidBuilder);
}(new AndroidBuilder(module)));
