

/*
 * build.js: Titanium Android CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	fs = require('fs'),
	path = require('path'),
	android = appc.android,
	spawn = require('child_process').spawn,
	minAndroidSdkVersion = '2.2',
	minJavaSdkVersion = '1.6.0',
	version = appc.version,
	wrench = require('wrench'),
	androidEnv,
	deployTypes = ['production', 'test', 'development'],
	targets = ['emulator', 'device', 'dist-playstore'];

exports.config = function (logger, config, cli) {
	return function (finished) {
		android.detect(function (env) {
			var conf;
			androidEnv = env;

			cli.createHook('build.android.config', function (callback) {
				callback({
					options: {
						'alias': {
							abbr: 'L',
							desc: __('the alias for the keystore'),
							hint: 'alias',
							prompt: {
								label: __('Keystore alias'),
								error: __('Invalid keystore alias'),
								validator: function (alias) {
									if (!alias) {
										throw new appc.exception(__('Invalid keystore alias'));
									}
									return true;
								}
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
							prompt: {
								label: __('Android SDK path'),
								error: __('Invalid Android SDK path'),
								validator: function (dir) {
									dir = dir.trim();
									if (!afs.exists(dir, 'platform-tools')) {
										throw new appc.exception(__('Invalid Android SDK path'));
									}
									if (!afs.exists(dir, 'platform-tools', 'adb') && !afs.exists(dir, 'platform-tools', 'adb.exe')) {
										throw new appc.exception(__('Invalid Android SDK installation: unable to find adb'));
									}
									return true;
								}
							},
							required: true
						},
						'avd-abi': {
							abbr: 'B',
							desc: __('the abi for the avd')
						},
						'avd-id': {
							abbr: 'I',
							desc: __('the id for the avd'),
							hint: __('id')
						},
						/*
						'avd-name': {
							abbr: 'N',
							desc: __('the name for the avd'),
							hint: __('name')
						},
						*/
						'avd-skin': {
							abbr: 'S',
							desc: __('the skin for the avd'),
							hint: __('skin'),
							default: 'HVGA'
						},
						'debug-host': {
							//abbr: 'H',
							//desc: __('debug connection info'),
							//hint: 'host:port',
							hidden: true
						},
						/* not actually used, yet
						'deploy-type': {
							abbr: 'D',
							desc: __('the type of deployment; only used with target is %s', 'emulator'.cyan),
							hint: __('type'),
							values: ['test', 'development'],
							default: 'development'
						},
						*/
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
						'password': {
							abbr: 'P',
							desc: __('the password for the keystore'),
							hint: 'alias',
							password: true,
							prompt: {
								label: __('Keystore password'),
								error: __('Invalid keystore password'),
								validator: function (password) {
									if (!password) {
										throw new appc.exception(__('Invalid keystore password'));
									}
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
									conf.options['password'].required = true;
									conf.options['alias'].required = true;
									conf.options['output-dir'].required = true;
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
				finished(conf = result);
			});
		}, config.android && config.android.sdkPath, config.android && config.android.ndkPath);
	}
};

exports.validate = function (logger, config, cli) {
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	ti.validateTiappXml(logger, cli.tiapp);
	
	if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
		// we're running the build command for the wrong SDK version, gracefully return
		return false;
	}
	if (!androidEnv || !Object.keys(androidEnv.targets).length) {
		logger.error(__('Unable to detect Android SDK targets.') + '\n');
		logger.log(__('Please download SDK targets via Android SDK Manager and try again. (version %s or newer)', version.format(minAndroidSdkVersion, 2)) + '\n');
		process.exit(1);
	}
	
	if (targets.indexOf(cli.argv.target) == -1) {
		logger.error(__('Invalid target "%s"', cli.argv.target) + '\n');
		appc.string.suggest(cli.argv.target, targets, logger.log, 3);
		process.exit(1);
	}
	
	if (!afs.exists(cli.argv['android-sdk'], 'platform-tools')) {
		logger.error(__('Invalid Android SDK path') + '\n');
		process.exit(1);
	}
	if (!afs.exists(cli.argv['android-sdk'], 'platform-tools', 'adb') && !afs.exists(cli.argv['android-sdk'], 'platform-tools', 'adb.exe')) {
		logger.error(__('Invalid Android SDK installation: unable to find adb') + '\n');
		process.exit(1);
	}
	
	// Check for java version
	if (!androidEnv.java.version) {
		logger.error(__('"Missing Java SDK. Please make sure Java SDK is on your PATH') + '\n');
		process.exit(1);
	} else if (version.lt(androidEnv.java.version, minJavaSdkVersion)) {
		logger.error(__('JDK version %s detected, but at least %s is required', androidEnv.java.version, minJavaSdkVersion) + '\n');
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
	
	// Set defaults for target Emulator
	if (cli.argv.target == 'emulator') {
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
			logger.error(__('Invalid required option "--alias"') + '\n');
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
			logger.error(__('Invalid required option "--password"') + '\n');
			process.exit(1);
		}
		
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
	
	if (cli.argv['debug-host'] && cli.argv.target != 'dist-playstore') {
		if (typeof cli.argv['debug-host'] == 'number') {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			logger.log(__('The debug host must be in the format "host:port".') + '\n');
			process.exit(1);
		}

		var parts = cli.argv['debug-host'].split(':'),
			port = parts.length > 1 && parseInt(parts[1]);

		if (parts.length < 2) {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			logger.log(__('The debug host must be in the format "host:port".') + '\n');
			process.exit(1);
		}
		if (isNaN(port) || port < 1 || port > 65535) {
			logger.error(__('Invalid debug host "%s"', cli.argv['debug-host']) + '\n');
			logger.log(__('The port must be a valid integer between 1 and 65535.') + '\n');
			process.exit(1);
		}
		cli.argv['debug-host'] = parts.map(function (p) { return p.trim(); }).join(':');
	}

	// Resolve path for android-sdk
	cli.argv['android-sdk'] = afs.resolvePath(cli.argv['android-sdk']);
};

exports.run = function (logger, config, cli, finished) {
	// TODO Add analytics events later when we implement the full andorid build instead of wrapping.
	sendAnalytics(cli);
	cli.fireHook('build.pre.construct', function () {
		new build(logger, config, cli, function (err) {
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
};

function sendAnalytics(cli) {
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
}

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
