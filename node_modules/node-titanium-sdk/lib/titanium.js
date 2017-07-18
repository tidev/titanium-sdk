/**
 * Titanium SDK Library for Node.js
 * Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */
var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	spawn = require('child_process').spawn,
	afs = appc.fs,
	version = appc.version,
	manifest = appc.pkginfo.manifest(module),
	platformAliases = {
		// add additional aliases here for new platforms
		'ipad': 'iphone',
		'ios': 'iphone'
	};

exports.i18n = require('./i18n');
exports.jss = require('./jss');
exports.tiappxml = require('./tiappxml');

exports.manifest = manifest;
exports.platforms = [].concat(manifest.platforms);
exports.targetPlatforms = (manifest.platforms || []).map(function (p) {
	return p == 'iphone' ? 'ios' : p;
}).sort();
exports.availablePlatforms = (manifest.platforms || []).sort();
exports.availablePlatformsNames = function (platforms) {
	Object.keys(platformAliases).forEach(function (alias) {
		if (platforms.indexOf(platformAliases[alias]) != -1) {
			platforms.push(alias);
		}
	});
	return platforms.sort();
}(manifest.platforms || []);

exports.commonOptions = function (logger, config) {
	return {
		'log-level': {
			callback: function (value) {
				logger.levels.hasOwnProperty(value) && logger.setLevel(value);
			},
			desc: __('minimum logging level'),
			default: config.cli.logLevel || 'trace',
			hint: __('level'),
			values: logger.getLevels()
		}
	};
};

exports.platformOptions = function (logger, config, cli, commandName, finished) {
	var result = {},
		targetPlatform = !cli.argv.help && (cli.argv.platform || cli.argv.p);

	if (!commandName) {
		finished(result);
		return;
	}

	function set(obj, title, platform) {
		// add the platform and title to the options and flags
		['options', 'flags'].forEach(function (type) {
			if (obj && obj[type]) {
				result[platform] || (result[platform] = {
					platform: platform,
					title: title || platform
				});
				result[platform][type] = obj[type];
			}
		});
	}

	// translate the platform name
	targetPlatform = platformAliases[targetPlatform] || targetPlatform;

	// for each platform, fetch their specific flags/options
	async.parallel(manifest.platforms.map(function (platform) {
		return function (callback) {

			// only configure target platform
			if (targetPlatform && platform !== targetPlatform) {
				return callback();
			}

			var platformDir = path.join(path.dirname(module.filename), '..', '..', '..', platform),
				platformCommand = path.join(platformDir, 'cli', 'commands', '_' + commandName + '.js'),
				command,
				conf,
				title;

			if (!fs.existsSync(platformCommand)) return callback();

			command = require(platformCommand);
			if (!command || !command.config) return callback();

			// try to get the platform specific configuration
			conf = command.config(logger, config, cli);

			try {
				// try to read a title from the platform's package.json
				title = JSON.parse(fs.readFileSync(path.join(platformDir, 'package.json'))).title;
			} catch (e) {}

			if (typeof conf == 'function') {
				// async callback
				conf(function (obj) {
					set(obj, title, platform);
					callback();
				});
				return;
			}

			set(conf, title, platform);
			callback();
		};
	}), function () {
		finished(result);
	});
};

exports.validateProjectDir = function(logger, cli, argv, name) {
	var dir = argv[name] || (process.env.SOURCE_ROOT ? path.join(process.env.SOURCE_ROOT, '..', '..') : '.'),
		projectDir = argv[name] = appc.fs.resolvePath(dir);

	if (!fs.existsSync(projectDir)) {
		logger.banner();
		logger.error(__('Project directory does not exist') + '\n');
		process.exit(1);
	}

	var tiapp = path.join(projectDir, 'tiapp.xml');
	while (!fs.existsSync(tiapp) && tiapp.split(path.sep).length > 2) {
		projectDir = argv[name] = path.dirname(projectDir);
		tiapp = path.join(projectDir, 'tiapp.xml');
	}

	if (tiapp.split(path.sep).length == 2) {
		logger.banner();
		logger.error(__('Invalid project directory "%s"', dir) + '\n');
		dir == '.' && logger.log(__("Use the %s property to specify the project's directory", '--project-dir'.cyan) + '\n');
		process.exit(1);
	}

	// load the tiapp.xml
	cli.tiapp = new exports.tiappxml(path.join(projectDir, 'tiapp.xml'));
};

exports.validateTiappXml = function (logger, config, tiapp) {
	if (!tiapp.id) {
		logger.error(__('tiapp.xml is missing the <id> element'));
		logger.error(__('The app id must consist of letters, numbers, and underscores.'));
		logger.error(__('Note: Android does not allow dashes and iOS does not allow underscores.'));
		logger.error(__('The first character must be a letter or underscore.'));
		logger.error(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
		process.exit(1);
	}

	if (!tiapp.name) {
		logger.error(__('tiapp.xml is missing the <name> element'));
		logger.error(__('The project name must consist of letters, numbers, dashes, and underscores.'));
		logger.error(__('The first character must be a letter.') + '\n');
		process.exit(1);
	}

	if (!tiapp.guid) {
		logger.error(__('tiapp.xml is missing the <guid> element'));
		logger.error(__('The guid must be in the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX and consist of letters and numbers.') + '\n');
		logger.log(__('If you need a new guid, below are 5 freshly generated new ones that you can choose from:'));
		for (var i = 0, uuid = require('node-uuid'); i < 5; i++) {
			logger.log('    ' + uuid.v4().cyan);
		}
		logger.log();
		process.exit(1);
	}

	if (!/^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/.test(tiapp.guid)) {
		logger.error(__('tiapp.xml contains an invalid guid "%s"', tiapp.guid));
		logger.error(__('The guid must be in the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX and consist of letters and numbers.') + '\n');
		logger.log(__('If you need a new guid, below are 5 freshly generated new ones that you can choose from:'));
		for (var i = 0, uuid = require('node-uuid'); i < 5; i++) {
			logger.log('    ' + uuid.v4().cyan);
		}
		logger.log();
		process.exit(1);
	}

	tiapp.version || (tiapp.version = '1.0');

	if (!config.get('app.skipVersionValidation') && !tiapp.properties['ti.skipVersionValidation']) {
		if (!/^\d+(\.\d+(\.\d+(\..+)?)?)?$/.test(tiapp.version)) {
			logger.error(__('tiapp.xml contains an invalid version "%s"', tiapp.version));
			logger.error(__('The version must consist of three positive integers in the format "X.Y.Z".') + '\n');
			process.exit(1);
		}

		if ((''+tiapp.version).charAt(0) == '0') {
			logger.warn(__('tiapp.xml contains an invalid version "%s"', tiapp.version));
			logger.warn(__('The app version major number must be greater than zero.'));
		}
	}
};

exports.validAppId = function (id) {
	var words = {
			'abstract': 1,
			'assert': 1,
			'boolean': 1,
			'break': 1,
			'byte': 1,
			'case': 1,
			'catch': 1,
			'char': 1,
			'class': 1,
			'const': 1,
			'continue': 1,
			'default': 1,
			'do': 1,
			'double': 1,
			'else': 1,
			'enum': 1,
			'extends': 1,
			'false': 1,
			'final': 1,
			'finally': 1,
			'float': 1,
			'for': 1,
			'goto': 1,
			'if': 1,
			'implements': 1,
			'import': 1,
			'instanceof': 1,
			'int': 1,
			'interface': 1,
			'long': 1,
			'native': 1,
			'new': 1,
			'null': 1,
			'package': 1,
			'private': 1,
			'protected': 1,
			'public': 1,
			'return': 1,
			'short': 1,
			'static': 1,
			'strictfp': 1,
			'super': 1,
			'switch': 1,
			'synchronized': 1,
			'this': 1,
			'throw': 1,
			'throws': 1,
			'transient': 1,
			'true': 1,
			'try': 1,
			'void': 1,
			'volatile': 1,
			'while': 1
		},
		parts = id.split('.'),
		i = 0,
		l = parts.length;

	for (; i < l; i++) {
		if (words[parts[i]]) {
			return false;
		}
	}

	return true;
};

exports.loadPlugins = function (logger, config, cli, projectDir, finished, silent, compact) {
	var searchPaths = {
			project: [ path.join(projectDir, 'plugins') ],
			config: [],
			global: []
		},
		confPaths = config.get('paths.plugins'),
		defaultInstallLocation = cli.env.installPath,
		sdkLocations = cli.env.os.sdkPaths.map(function (p) { return afs.resolvePath(p); });

	// set our paths from the config file
	Array.isArray(confPaths) || (confPaths = [ confPaths ]);
	confPaths.forEach(function (p) {
		p && fs.existsSync(p = afs.resolvePath(p)) && searchPaths.project.indexOf(p) == -1 && searchPaths.config.indexOf(p) == -1 && (searchPaths.config.push(p));
	});

	// add any plugins from various sdk locations
	sdkLocations.indexOf(defaultInstallLocation) == -1 && sdkLocations.push(defaultInstallLocation);
	cli.sdk && sdkLocations.push(afs.resolvePath(cli.sdk.path, '..', '..', '..'));
	sdkLocations.forEach(function (p) {
		fs.existsSync(p = afs.resolvePath(p, 'plugins')) && searchPaths.project.indexOf(p) == -1 && searchPaths.config.indexOf(p) == -1 && searchPaths.global.indexOf(p) == -1 && (searchPaths.global.push(p));
	});

	// find all hooks for active plugins
	appc.tiplugin.find(cli.tiapp.plugins, searchPaths, config, logger, function (plugins) {
		if (plugins.missing.length) {
			if (logger) {
				logger.error(__('Could not find all required Titanium plugins:'))
				plugins.missing.forEach(function (m) {
					logger.error('   id: ' + m.id + '\t version: ' + m.version);
				});
				logger.log();
			}
			process.exit(1);
		}

		if (plugins.found.length) {
			plugins.found.forEach(function (plugin) {
				cli.scanHooks(afs.resolvePath(plugin.pluginPath, 'hooks'));
			});
		} else {
			logger && logger.debug(__('No project level plugins to load'));
		}

		silent || cli.emit('cli:check-plugins', { compact: compact === undefined ? true : compact });

		finished();
	});
};

exports.loadModuleManifest = function (logger, manifestFile) {
	var re = /^(\S+)\s*:\s*(.*)$/,
		match,
		manifest = {};

	if (!fs.existsSync(manifestFile)) {
		logger.error(__('Missing %s', manifestFile));
		logger.log();
		process.exit(1);
	}

	fs.readFileSync(manifestFile).toString().split(/\r?\n/).forEach(function (line) {
		match = line.match(re);
		if (match) {
			manifest[match[1].trim()] = match[2].trim();
		}
	});

	return manifest;
};

exports.validateModuleManifest = function (logger, cli, manifest) {
	var requiredModuleKeys = [
		'name',
		'version',
		'moduleid',
		'description',
		'copyright',
		'license',
		'copyright',
		'platform',
		'minsdk',
		'architectures'
	];

	// check if all the required module keys are in the list
	requiredModuleKeys.forEach(function (key) {
		if (!manifest[key]) {
			logger.error(__('Missing required manifest key "%s"', key));
			logger.log();
			process.exit(1);
		}
	});

	if (cli.argv.platform !== exports.resolvePlatform(manifest.platform)) {
		logger.error(__('Unable to find "%s" module', cli.argv.platform));
		logger.log();
		process.exit(1);
	}
};

exports.validateCorrectSDK = function (logger, config, cli, commandName) {
	// tiapp.xml should exist by the time we get here
	var argv = cli.argv,
		tiapp = cli.tiapp,
		sdkName = tiapp['sdk-version'],
		selectedSdk = cli.sdk && cli.sdk.name || manifest.version;

	if (!sdkName) {
		sdkName = tiapp['sdk-version'] = cli.sdk && cli.sdk.name || Object.keys(cli.env.sdks).sort().pop();
	}

	if (argv.legacy !== true && (!sdkName || sdkName === selectedSdk)) {
		return true;
	}

	// check the project's preferred sdk is even installed
	if (sdkName == '__global__' || !cli.env.sdks[sdkName]) {
		logger.banner();
		logger.error(__("Unable to compile project because the 'sdk-version' in the tiapp.xml is not installed") + '\n');
		logger.log(__("The project's %s is currently set to %s, which is not installed.", 'sdk-version'.cyan, sdkName.cyan) + '\n');
		logger.log(__("Update the %s in the tiapp.xml to one of the installed Titaniums SDKs:", 'sdk-version'.cyan));
		Object.keys(cli.env.sdks).sort().forEach(function (ver) {
			if (ver != '__global__') {
				logger.log('    ' + ver.cyan);
			}
		});
		logger.log(__("or run '%s' to download and install Titanium SDK %s", ('titanium sdk install ' + sdkName).cyan, sdkName) + '\n');
		process.exit(1);
	}

	var sdkVersion = cli.env.sdks[sdkName].manifest && cli.env.sdks[sdkName].manifest.version || sdkName;
	if (version.gte(sdkVersion, '3.0.0') && version.lte(sdkVersion, '3.0.2') && version.gte(process.version, '0.9.0')) {
		logger.banner();
		logger.error(__('Unable to compile project using Titanium SDK %s with Node.js %s', sdkName, process.version) + '\n');
		logger.log(__('Titanium SDK %s requires Node.js v0.8. Node.js v0.10 and newer will not work.', sdkName.cyan) + '\n');
		logger.log(__('Either update your application to Titanium SDK %s or newer or download Node.js %s from %s.', '3.1.0.GA'.cyan, 'v0.8'.cyan, 'http://nodejs.org/dist/'.cyan) + '\n');
		process.exit(1);
	}

	// fork or die
	if (config.cli.failOnWrongSDK) {
		logger.banner();
		logger.error(__('Unable to compile a %s project with Titanium SDK %s', sdkName, selectedSdk));
		logger.error(__('To build this application, set the <sdk-version> in the tiapp.xml to the current Titaniums SDK: %s', selectedSdk) + '\n');
		process.exit(1);
	}

	var args = argv.$_,
		p = args.indexOf('--sdk'),
		platform = exports.resolvePlatform(argv.platform),
		cmd = [],
		cmdSafe = [],
		cmdRoot,
		hideBanner = false,
		delayCmd = false;

	function cmdAdd() {
		for (var i = 0; i < arguments.length; i++) {
			cmd.push(arguments[i]);
			cmdSafe.push(arguments[i]);
		}
	}

	function cmdAddSecret(param) {
		for (var i = 0; i < arguments.length; i++) {
			cmd.push(arguments[i]);
			cmdSafe.push('*******');
		}
	}

	if (p != -1) {
		args.splice(p, 2);
	}

	if (!argv.legacy) {
		logger.info(__('tiapp.xml <sdk-version> set to %s, but current Titanium SDK set to %s', sdkName.cyan, selectedSdk.cyan));
	}

	if (argv.legacy || version.lt(sdkVersion, '2.2.0')) { // technically, there is no 2.2, it was released as 3.0
		// in 3.2, we renamed --password to --store-password as to not conflict with the
		// authentication --password option
		if (argv.platform == 'android' && argv['store-password']) {
			argv.password = argv['store-password'];
		}

		cmdRoot = 'python';

		var builderPy = path.join(path.resolve(cli.env.sdks[sdkName].path), platform, 'builder.py');
		cmdAdd(builderPy);

		switch (platform) {
			case 'iphone':
				switch (argv.target) {
					case 'simulator':
						if (argv['build-only']) {
							cmdAdd('build', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['device-family'], argv['sim-type'], argv['debug-host']);
						} else {
							cmdAdd('run', argv['project-dir'], argv['ios-version'], '', '', argv['device-family'], argv['sim-type'], argv['debug-host']);
						}
						break;

					case 'device':
						cmdAdd('install', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['developer-name'], argv['device-family'], argv.keychain, argv['debug-host']);
						break;

					case 'dist-appstore':
						cmdAdd('distribute', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['distribution-name'], '.', argv['device-family'], argv.keychain);
						break;

					case 'dist-adhoc':
						cmdAdd('adhoc', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['distribution-name'], argv['device-family'], argv.keychain, argv['debug-host']);
						break;
				}
				break;

			case 'mobileweb':
				cmdAdd(argv['project-dir'], argv['deploy-type']);
				break;

			case 'android':
				if (argv['build-only']) {
					cmdAdd('build', tiapp.name, argv['android-sdk'], argv['project-dir'] , tiapp.id);
				} else {
					if (argv.target == 'emulator') {
						if (!argv['avd-id']) {
							logger.error(__('Missing required option "%s"', '--avd-id') + '\n');
							process.exit(1);
						}
						if (!argv['avd-skin']) {
							logger.error(__('Missing required option "%s"', '--avd-skin') + '\n');
							process.exit(1);
						}
					}

					switch (argv.target) {
						case 'emulator':
							cmdAdd('simulator', tiapp.name, argv['android-sdk'], argv['project-dir'] , tiapp.id, argv['avd-id'], argv['avd-skin']);
							delayCmd = true;

							// launch the emulator
							var emuArgs = [ builderPy, 'emulator', tiapp.name, argv['android-sdk'], argv['project-dir'] , tiapp.id, argv['avd-id'], argv['avd-skin'] ];
							argv['avd-abi'] && emuArgs.push(argv['avd-abi']);
							logger.info(__('Launching Android emulator: %s', ('"' + cmdRoot + '" "' +  emuArgs.join('" "') + '"').cyan));
							spawn(cmdRoot, emuArgs, {
								detached: true,
								stdio: 'ignore'
							}).on('exit', function (code, signal) {
								console.log('EMULATOR EXITED', code, signal);
							});
							break;

						case 'device':
							cmdAdd('install', tiapp.name, argv['android-sdk'], argv['project-dir'] , tiapp.id, 1);
							break;

						case 'dist-playstore':
							cmdAdd('distribute', tiapp.name, argv['android-sdk'], argv['project-dir'] , tiapp.id, argv['keystore']);
							cmdAddSecret(argv['password']);
							cmdAdd(argv['alias'], argv['output-dir']);
							break;
					}
				}

				// Add debug host if it's defined
				if (argv['debug-host']) {
					if (argv.target == 'device') {
						cmdAdd('');
					}
					cmdAdd(argv['debug-host']);
				}
				// Add profiler host if it's defined
				if (argv['profiler-host']) {
					if (argv.target == 'device') {
						cmdAdd('');
					}
					cmdAdd(argv['profiler-host']);
					cmdAdd('profiler');
				}
		}

	} else {

		// 3.0.0's iOS build does not like it if node has a full path, so we hope they have node in the path
		cmdRoot = version.gte(sdkVersion, '3.0.2') ? (process.execPath || 'node') : 'node';

		hideBanner = true;

		// If the titanium path has spaces, then we are trying to combine the paths and verify after they were split.
		var titaniumPath = function getTitaniumPath (params) {
			var paramsArray = params.split(' '),
				pathSegment,
				prevPath = '';
			while ((pathSegment = paramsArray.pop())) {
				if (fs.existsSync(pathSegment + prevPath)) {
					return pathSegment + prevPath;
				}
				prevPath = ' ' + pathSegment;
			}
			// fallback to default last segment, if we fail for any reason.
			return params.split(' ').pop();
		}(argv.$0);

		cmdAdd(titaniumPath);
		cmdAdd(commandName, '--sdk', sdkName);

		var flags = {},
			options = {};

		// mix the command and platform specific options together
		[cli.globalContext, cli.command, cli.command.platform].forEach(function (ctx) {
			if (ctx && ctx.conf) {
				ctx.conf.flags && appc.util.mix(flags, ctx.conf.flags);
				ctx.conf.options && appc.util.mix(options, ctx.conf.options);
			}
		});

		Object.keys(flags).forEach(function (name) {
			var def = flags[name].hasOwnProperty('default') ? flags[name].default : false;
			if (argv[name] !== undefined && def !== argv[name]) {
				cmdAdd('--' + (!!argv[name] ? '' : 'no-') + name);
			}
		});

		Object.keys(options).forEach(function (name) {
			if (name != 'sdk' && argv[name] !== undefined) {
				// in 3.2, we renamed --password to --store-password as to not conflict with the
				// authentication --password option
				var arg = name;
				if (argv.platform == 'android' && arg == 'store-password' && version.lt(sdkVersion, '3.2.0')) {
					arg = 'password';
				}

				cmdAdd('--' + arg);
				if (options[name].secret) {
					cmdAddSecret(argv[name]);
				} else {
					cmdAdd(argv[name]);
				}
			}
		});
	}

	// trim off the empty trailing args
	while (!cmd[cmd.length-1]) {
		cmd.pop();
		cmdSafe.pop();
	}

	if (argv.legacy) {
		logger.info(__('Forking legacy SDK command: %s', (cmdRoot + ' "' +  cmdSafe.join('" "') + '"').cyan) + '\n');
	} else {
		logger.info(__('Forking correct SDK command: %s', ('"' + cmdRoot + '" "' +  cmdSafe.join('" "') + '"').cyan) + '\n');
	}

	hideBanner && cmd.push('--no-banner');

	// when doing a legacy Android build (1.X or 2.X), then we delay the build to
	// allow the emulator to start because there is a bug where the builder.py
	// doesn't like to be run concurrently
	setTimeout(function () {
		spawn(cmdRoot, cmd, {
			stdio: 'inherit'
		}).on('exit', function (code, signal) {
			code && process.exit(code);
		});
	}, delayCmd ? 1000 : 0);
};

exports.validateAppJsExists = function (projectDir, logger, platformDirs) {
	if (!fs.existsSync(path.join(projectDir, 'Resources'))) {
		logger.error(__('"Resources" directory not found'));
		logger.error(__("Ensure the \"Resources\" directory exists and contains an \"app.js\" file.") + '\n');
		process.exit(1);
	}

	var files = [
		path.join(projectDir, 'Resources', 'app.js')
	];

	Array.isArray(platformDirs) || (platformDirs = [ platformDirs ]);
	platformDirs.forEach(function (platformDir) {
		files.push(path.join(projectDir, 'Resources', platformDir, 'app.js'));
	});

	if (!files.some(function (file) { return fs.existsSync(file); })) {
		logger.error(__('"app.js" not found'));
		logger.error(__("Ensure the \"app.js\" file exists in your project's \"Resources\" directory.") + '\n');
		process.exit(1);
	}
};

exports.validatePlatformOptions = function (logger, config, cli, commandName) {
	var platform = exports.resolvePlatform(cli.argv.platform),
		platformCommand = path.join(path.dirname(module.filename), '..', '..', '..', manifest.platforms[manifest.platforms.indexOf(platform)], 'cli', 'commands', '_' + commandName + '.js');
	if (fs.existsSync(platformCommand)) {
		var command = require(platformCommand);
		return command && typeof command.validate == 'function' ? command.validate(logger, config, cli) : null;
	}
};

exports.scrubPlatforms = function (platforms) {
	var scrubbed = {}, // distinct list of un-aliased platforms
		original = {},
		bad = {};

	platforms.toLowerCase().split(',').forEach(function (platform) {
		var name = platformAliases[platform] || platform;
		// if name is falsey, then it's invalid anyways
		if (name) {
			if (manifest.platforms.indexOf(name) == -1) {
				bad[platform] = 1;
			} else {
				scrubbed[name] = 1;
				original[platform] = 1;
			}
		}
	});

	return {
		scrubbed: Object.keys(scrubbed).sort(), // distinct list of un-aliased platforms
		original: Object.keys(original).sort(),
		bad: Object.keys(bad).sort()
	};
};

exports.resolvePlatform = function (platform) {
	return platformAliases[platform] || platform;
};

exports.filterPlatforms = function (platform) {
	platform = platformAliases[platform] || platform;
	return exports.availablePlatformsNames.filter(function (name) {
		return name != platform;
	});
};

exports.validatePlatform = function (logger, cli, name) {
	var platform = name ? cli.argv[name] : cli.argv,
		p = cli.argv[name] = platformAliases[platform] || platform;
	if (!p || manifest.platforms.indexOf(p) == -1) {
		logger.banner();
		logger.error(__('Invalid platform "%s"', platform) + '\n');
		appc.string.suggest(platform, exports.targetPlatforms, logger.log);
		logger.log(__('Available platforms for SDK version %s:', cli.sdk && cli.sdk.name || manifest.version));
		exports.targetPlatforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
};
