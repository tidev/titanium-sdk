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
	tiapp,
	deployTypes = ['production', 'test', 'development'],
	targets = ['emulator', 'device', 'dist-playstore'],
	javaKeywords = [
		"abstract",	"continue",	"for", "new", "switch",
		"assert", "default", "goto", "package", "synchronized",
		"boolean", "do", "if", "private", "this",
		"break", "double", "implements", "protected", "throw",
		"byte", "else", "import", "public", "throws",
		"case", "enum", "instanceof", "return", "transient",
		"catch", "extends", "int", "short", "try",
		"char", "final", "interface", "static", "void",
		"class", "finally", "long",	"strictfp", "volatile",
		"const", "float", "native",	"super", "while",
		"true", "false", "null"
	];

exports.config = function (logger, config, cli) {
	return function (callback) {
		android.detect(function (env) {
			var conf;
			androidEnv = env;
			
			callback(conf = {
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
						default: config.android && config.android.sdkPath,
						desc: __('the path to the Android SDK'),
						hint: __('path'),
						prompt: {
							label: __('Android SDK path'),
							error: __('Invalid Android SDK path'),
							validator: function (dir) {
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
						hint: __('id'),
						default: 7
					},
					'avd-name': {
						abbr: 'N',
						desc: __('the name for the avd'),
						hint: __('name')
					},
					'avd-skin': {
						abbr: 'S',
						desc: __('the skin for the avd'),
						hint: __('skin'),
						default: 'HVGA'
					},
					'debug-host': {
						abbr: 'H',
						desc: __('debug connection info'),
						hint: 'host:port'
					},
					'deploy-type': {
						abbr: 'D',
						desc: __('the type of deployment; only used with target is %s or %s', 'emulator'.cyan, 'device'.cyan),
						hint: __('type'),
						values: deployTypes,
						default: 'development'
					},
					'keystore': {
						abbr: 'K',
						desc: __('the location of the keystore'),
						hint: 'path',
						prompt: {
							label: __('Keystore Location'),
							error: __('Invalid keystore'),
							validator: function (keystorePath) {
								if (!afs.exists(keystorePath) || !fs.statSync(keystorePath).isFile()) {
									throw new appc.exception(__('Invalid keystore location'));
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
		});
	}
};

exports.validate = function (logger, config, cli) {
	var tokens,
		parts,
		port,
		i;
	
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	if (!ti.validateCorrectSDK(logger, config, cli, cli.argv['project-dir'])) {
		// we're running the build command for the wrong SDK version, gracefully return
		return false;
	}
	if (!Object.keys(androidEnv.targets).length) {
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
	
	if (deployTypes.indexOf(cli.argv['deploy-type']) == -1) {
		logger.error(__('Invalid deploy type "%s"', cli.argv['deploy-type']) + '\n');
		appc.string.suggest(cli.argv.target, targets, logger.log, 3);
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
	
	// Validate App ID
	tiapp = new ti.tiappxml(path.join(cli.argv['project-dir'], 'tiapp.xml'));
	tokens = tiapp.id.split('.');
	for ( i = 0; i < tokens.length; i++) {
		if (javaKeywords.indexOf(tokens[i]) != -1) {
			logger.error(__('Invalid java keyword used in project app id: %s', tokens[i]) + '\n');
			process.exit(1);
		}
	}
	
	// Set defaults for target Emulator
	if (cli.argv.target == 'emulator') {
		if (isNaN(parseInt(cli.argv['avd-id']))) {
			cli.argv['avd-id'] = 7;
		}
		if (!cli.argv['avd-skin']) {
			cli.argv['avd-skin'] = 'HVGA';
		}
		if (!cli.argv['avd-abi']) {
			cli.argv['avd-abi'] = androidEnv.targets[cli.argv['avd-id']].abis[0] || androidEnv.targets['7'].abis[0] || 'armeabi';
		}
	}
	
	// Validate arguments for dist-playstore
	if (cli.argv.target == 'dist-playstore') {
		if(!cli.argv['alias']) {
			logger.error(__('Invalid required option "--alias"') + '\n');
			process.exit(1);
		}
		
		if (!cli.argv['keystore']) {
			logger.error(__('Invalid required option "--keystore"') + '\n');
			process.exit(1);
		}
		
		cli.argv['keystore'] = afs.resolvePath(cli.argv['keystore']);
		if (!afs.exists(cli.argv['keystore']) || !fs.statSync(cli.argv['keystore']).isFile()) {
			logger.error(__('Invalid required option "--keystore"') + '\n');
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

		parts = cli.argv['debug-host'].split(':'),
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
	cli.fireHook('build.pre.compile', this, function (e) {
		var emulatorCmd = [],
			cmd = [],
			cmdSpawn,
			options = {
				stdio: 'inherit'
			};
		
		logger.info(__('Compiling "%s" build', cli.argv['deploy-type']));
		
		ti.legacy.constructLegacyCommand(cli, tiapp, cli.argv.platform , cmd, emulatorCmd);
		
		// console.log('Forking correct SDK command: ' + ('python ' + cmd.join(' ')).cyan + '\n');
		
		if (emulatorCmd.length > 0) {
			spawn('python', emulatorCmd,{}).on('exit', function(code) {
				if (code) {
					finished && finished('An error occurred while running the command: ' + ('python ' + cmd.join(' ')).cyan + '\n');
				}
			});
			
			// TODO Remove this when we don't want to wrap the python scripts anymore.
			// We have to send the analytics here because for the emulator command, we will never 'exit' properly, 
			// as a result send won't get called on exit
			cli.sendAnalytics();
		}
		
		cmdSpawn = spawn('python', cmd, options);
		
		cmdSpawn.on('exit', function(code) {
			var err;
			if (code) {
				err = 'An error occurred while running the command: ' + ('python ' + cmd.join(' ')).cyan + '\n';
			} else if (cli.argv['target'] == 'emulator') {
				// Call the logcat command in the old builder.py after the emulator, so we get logcat output
				spawn('python', [
					path.join(path.resolve(cli.env.sdks[tiapp['sdk-version']].path), cli.argv.platform, 'builder.py'),
					'logcat',
					cli.argv['android-sdk'],
					'-e'
				], options);
			}
			finished && finished.call(this, err);
		}.bind(this));
	}.bind(this));
}

build.prototype = {

	//

};