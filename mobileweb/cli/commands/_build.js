/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
	Builder = require('titanium-sdk/lib/builder'),
	cleanCSS = require('clean-css'),
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs'),
	i18n = appc.i18n(__dirname),
	path = require('path'),
	ti = require('titanium-sdk'),
	UglifyJS = require('uglify-js'),
	util = require('util'),
	windows = require('titanium-sdk/lib/windows'),
	wrench = require('wrench'),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	parallel = appc.async.parallel;

// silence uglify's default warn mechanism
UglifyJS.AST_Node.warn_function = function () {};

ejs.filters.escapeQuotes = function escapeQuotes(s) {
	return String(s).replace(/"/g, '\\"');
};

function assertIssue(logger, issues, name, exit) {
	var i = 0,
		len = issues.length;
	for (; i < len; i++) {
		if ((typeof name == 'string' && issues[i].id == name) || (typeof name == 'object' && name.test(issues[i].id))) {
			issues[i].message.split('\n').forEach(function (line) {
				logger.error(line.replace(/(__(.+?)__)/g, '$2'.bold));
			});
			logger.log();
			exit && process.exit(1);
		}
	}
}

function MobileWebBuilder() {
	Builder.apply(this, arguments);

	this.templatesDir = path.join(this.platformPath, 'templates', 'build');

	this.imageMimeTypes = {
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.jpg': 'image/jpg',
		'.jpeg': 'image/jpg'
	};

	this.windowsInfo = null;
}

util.inherits(MobileWebBuilder, Builder);

MobileWebBuilder.prototype.config = function config(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);

	var _t = this;

	cli.on('cli:pre-validate', function (obj, callback) {
		if (cli.argv.platform && cli.argv.platform != 'mobileweb') {
			return callback();
		}

		appc.jdk.detect(config, null, function (jdkInfo) {
			if (!jdkInfo.executables.java) {
				logger.error(__('Unable to locate Java'));
				logger.error(__("If you already have Java installed, make sure it's in the system PATH"));
				logger.error(__('Java can be downloaded and installed from %s', 'http://appcelerator.com/jdk') + '\n');
				process.exit(1);
			}
			callback();
		});
	});

	return function (finished) {
		var targets = ['web'];

		if (process.platform == 'win32') {
			windows.detect(config, null, function (windowsInfo) {
				_t.windowsInfo = windowsInfo;
				if (windowsInfo.visualstudio) {
					if (windowsInfo.windowsphone) {
						targets.push('wp8');
					}
					targets.push('winstore');
				}
				configure();
			});
		} else {
			configure();
		}

		function configure() {
			cli.createHook('build.mobileweb.config', function (callback) {
				var conf = {
					options: {
						'deploy-type': {
							abbr: 'D',
							default: 'development',
							desc: __('the type of deployment; production performs optimizations'),
							hint: __('type'),
							order: 100,
							values: ['production', 'development']
						},
						'target': {
							abbr: 'T',
							callback: function (value) {
								if (process.platform == 'win32' && targets.indexOf(value) != -1) {
									if (value == 'wp8' || value == 'winstore') {
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_VISUAL_STUDIO_NOT_INSTALLED', true);
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_MSBUILD_ERROR', true);
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_MSBUILD_TOO_OLD', true);
									}

									// if this is a Windows Phone 8 target, validate the wp8 specific parameters
									if (value == 'wp8') {
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_PHONE_SDK_NOT_INSTALLED', true);
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_PHONE_SDK_MISSING_XAP_DEPLOY_CMD', true);
										assertIssue(logger, _t.windowsInfo.issues, 'WINDOWS_PHONE_ENUMERATE_DEVICES_FAILED', true);

										conf.options['wp8-publisher-guid'].required = true;
										conf.options['device-id'].required = true;
									}
								}
							},
							default: 'web',
							desc: __('the target to build for'),
							order: 110,
							values: targets
						}
					}
				};

				if (process.platform == 'win32') {
					conf.options['device-id'] = {
						abbr: 'C',
						callback: function (value) {
							if (value != 'xd' && value != 'de' && _t.windowsInfo.devices && !_t.windowsInfo.devices[value]) {
								// maybe it's a device name?
								for (var i = 0, k = Object.keys(_t.windowsInfo.devices), l = k.length; i < l; i++) {
									if (_t.windowsInfo.devices[k[i]] == value) {
										value = k[i];
									}
								}
							}
							return value;
						},
						desc: __('On Windows Phone 8, the device-id of the emulator/device to run the app in, "xd" for any emulator, or "de" for any device'),
						order: 130,
						prompt: function (callback) {
							callback(fields.select({
								title: __("Which device or emulator do you want to install your app on?"),
								promptLabel: __('Select by number or name'),
								margin: '',
								numbered: true,
								relistOnError: true,
								complete: true,
								suggest: true,
								options: Object.keys(_t.windowsInfo.devices).map(function (id) {
									return {
										label: _t.windowsInfo.devices[id],
										value: id
									};
								})
							}));
						},
						validate: function (value, callback) {
							if (!value || (value != 'xd' && value != 'de' && _t.windowsInfo.devices && !_t.windowsInfo.devices[value])) {
								return callback(new Error(__('Invalid device id: %s', value)));
							}
							callback(null, value);
						}
					};

					conf.options['wp8-publisher-guid'] = {
						default: config.get('windows.wp8PublisherGuid'),
						desc: __('your publisher GUID, obtained from %s', 'http://appcelerator.com/windowsphone'.cyan),
						hint: __('guid'),
						order: 120,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __('What is your __Windows Phone 8 Publisher GUID__?'),
								validate: conf.options['wp8-publisher-guid'].validate
							}));
						},
						validate: function (value, callback) {
							if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
								return callback(new Error(__('Invalid "--wp8-publisher-guid" value "%s"', value)));
							}
							callback(null, value);
						}
					};
				}

				callback(null, conf);
			})(function (err, result) {
				finished(result);
			});
		};
	}
};

MobileWebBuilder.prototype.validate = function validate(logger, config, cli) {
	this.target = cli.argv.target;
	this.deployType = cli.argv['deploy-type'];

	// TODO: validate modules here
};

MobileWebBuilder.prototype.run = function run(logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	appc.async.series(this, [
		function (next) {
			cli.emit('build.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',

		function (next) {
			cli.emit('build.pre.compile', this, next);
		},

		'createBuildDirs',

		function (next) {
			parallel(this, [
				'copyFiles',
				'findProjectDependencies'
			], function () {
				parallel(this, [
					'createIcons',
					'findModulesToCache',
					'findPrecacheModules',
					'findPrecacheImages',
					'findTiModules',
					'findI18N'
				], function () {
					parallel(this, [
						'findDistinctCachedModules',
						'detectCircularDependencies'
					], function () {
						logger.info(
							__n('Found %s dependency', 'Found %s dependencies', this.projectDependencies.length) + ', ' +
							__n('%s package', '%s packages', this.packages.length) + ', ' +
							__n('%s module', '%s modules', this.modulesToCache.length)
						);
						parallel(this, [
							'assembleTitaniumJS',
							'assembleTitaniumCSS'
						], next);
					});
				});
			});
		},

		'minifyJavaScript',
		'createFilesystemRegistry',
		'createIndexHtml',

		function (next) {
			if (!this.buildOnly && (this.target == 'wp8' || this.target == 'winstore')) {
				var delta = appc.time.prettyDiff(this.cli.startTime, Date.now());
				logger.info(__('Finished building the application in %s', delta.cyan));
			}

			cli.emit('build.post.compile', this, next);
		}
	], function (err) {
		cli.emit('build.finalize', this, function () {
			finished(err);
		});
	});
};

MobileWebBuilder.prototype.doAnalytics = function doAnalytics(next) {
	var cli = this.cli;
	cli.addAnalyticsEvent('mobileweb.build.' + cli.argv['deploy-type'], {
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

MobileWebBuilder.prototype.initialize = function initialize(next) {
	this.logger.info(__('Compiling "%s" build', this.deployType));

	this.projectResDir = path.join(this.projectDir, 'Resources');
	this.mobilewebThemeDir = path.join(this.platformPath, 'themes');
	this.mobilewebTitaniumDir = path.join(this.platformPath, 'titanium');

	this.moduleSearchPaths = [ this.projectDir, this.globalModulesPath ];
	if (this.config.paths && Array.isArray(this.config.paths.modules)) {
		this.moduleSearchPaths = this.moduleSearchPaths.concat(this.config.paths.modules);
	}

	this.projectDependencies = [];
	this.modulesToLoad = [];
	this.tiModulesToLoad = [];
	this.requireCache = {};
	this.moduleMap = {};
	this.modulesToCache = [
		'Ti/_/image',
		'Ti/_/include'
	];
	this.precacheImages = [];
	this.locales = [];
	this.appNames = {};
	this.splashHtml = '';

	this.logger.info(__('Reading Titanium Mobile Web package.json file'));
	var mwPackageFile = path.join(this.platformPath, 'titanium', 'package.json');

	if (!fs.existsSync(mwPackageFile)) {
	 	this.logger.error(__('Unable to find Titanium Mobile Web package.json file'));
		this.logger.error(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	var pkgJson;
	try {
		pkgJson = JSON.parse(fs.readFileSync(mwPackageFile));
	} catch (e) {
		this.logger.error(__("Unable to parse Titanium Mobile Web's package.json file"));
		this.logger.error(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	this.packages = [{
		name: pkgJson.name,
		location: './titanium',
		main: pkgJson.main
	}];

	if (!this.dependenciesMap) {
		this.dependenciesMap = JSON.parse(fs.readFileSync(path.join(this.mobilewebTitaniumDir, 'dependencies.json')));
	}

	// read the tiapp.xml and initialize some sensible defaults
	(function applyDefaults(dest, src) {
		Object.keys(src).forEach(function (key) {
			if (dest.hasOwnProperty(key)) {
				if (Object.prototype.toString.call(dest[key]) == '[object Object]') {
					applyDefaults(dest[key], src[key]);
				}
			} else {
				if (Object.prototype.toString.call(src[key]) == '[object Object]') {
					dest[key] = {};
					applyDefaults(dest[key], src[key]);
				} else {
					dest[key] = src[key];
				}
			}
		});
	}(this.tiapp, {
		mobileweb: {
			analytics: {
				'use-xhr': false
			},
			build: {},
			'disable-error-screen': false,
			filesystem: {
				backend: '', // blank defaults to Ti/_/Filesystem/Local
				registry: 'ondemand'
			},
			map: {
				backend: '', // blank defaults to Ti/_/Map/Google
				apikey: ''
			},
			splash: {
				enabled: true,
				'inline-css-images': true
			},
			theme: 'default'
		}
	}));

	this.logger.info(__('Validating theme'));
	this.theme = this.tiapp.mobileweb.theme || 'default';
	if (!fs.existsSync(path.join(this.mobilewebThemeDir, this.theme))) {
		this.logger.error(__('Unable to find the "%s" theme. Please verify the theme setting in the tiapp.xml.', this.theme) + '\n');
		process.exit(1);
	}
	this.logger.debug(__('Using %s theme', this.theme.cyan));

	var mwBuildSettings = this.tiapp.mobileweb.build[this.deployType];
	this.minifyJS = mwBuildSettings && mwBuildSettings.js ? !!mwBuildSettings.js.minify : this.deployType == 'production';

	// Note: code processor is a pre-compile hook
	this.codeProcessor = this.cli.codeProcessor;

	next();
};

MobileWebBuilder.prototype.createBuildDirs = function createBuildDirs(next) {
	// Make sure we have an app.js. This used to be validated in validate(), but since plugins like
	// Alloy generate an app.js, it may not have existed during validate(), but should exist now
	// that build.pre.compile was fired.
	ti.validateAppJsExists(this.projectDir, this.logger, 'android');

	if (fs.existsSync(this.buildDir)) {
		this.logger.debug(__('Deleting existing build directory'));
		try {
			wrench.rmdirSyncRecursive(this.buildDir);
		} catch (e) {
			this.logger.error(__('Failed to remove build directory: %s', this.buildDir));
			if (e.message.indexOf('resource busy or locked') != -1) {
				this.logger.error(__('Build directory is busy or locked'));
				this.logger.error(__('Check that you don\'t have any terminal sessions or programs with open files in the build directory') + '\n');
			} else {
				this.logger.error(e.message + '\n');
			}
			process.exit(1);
		}
	}

	try {
		wrench.mkdirSyncRecursive(this.buildDir);
	} catch (e) {
		if (e.code == 'EPERM') {
			// hmm, try again?
			try {
				wrench.mkdirSyncRecursive(this.buildDir);
			} catch (e) {
				if (e.code == 'EPERM') {
					// hmm, try again?
					this.logger.error(__('Unable to create build directory: %s', this.buildDir));
					this.logger.error(__("It's possible that the build directory is busy or locked"));
					this.logger.error(__("Check that you don't have any terminal sessions or programs with open files in the build directory") + '\n');
					process.exit(1);
				} else {
					throw e;
				}
			}
		} else {
			throw e;
		}
	}

	next();
};

MobileWebBuilder.prototype.copyFiles = function copyFiles(next) {
	this.logger.info(__('Copying project files'));

	afs.copyDirSyncRecursive(this.mobilewebThemeDir, path.join(this.buildDir, 'themes'), { preserve: true, logger: this.logger.debug });
	afs.copyDirSyncRecursive(this.mobilewebTitaniumDir, path.join(this.buildDir, 'titanium'), { preserve: true, logger: this.logger.debug });
	afs.copyDirSyncRecursive(this.projectResDir, this.buildDir, { preserve: true, logger: this.logger.debug, rootIgnore: ti.filterPlatforms('mobileweb') });

	var mobilewebDir = path.join(this.projectResDir, 'mobileweb');

	if (fs.existsSync(mobilewebDir)) {
		afs.copyDirSyncRecursive(mobilewebDir, this.buildDir, { preserve: true, logger: this.logger.debug, rootIgnore: ['apple_startup_images', 'splash'] });
		['Default.jpg', 'Default-Portrait.jpg', 'Default-Landscape.jpg'].forEach(function (file) {
			file = path.join(mobilewebDir, 'apple_startup_images', file);
			if (fs.existsSync(file)) {
				afs.copyFileSync(file, this.buildDir, { logger: this.logger.debug });
				afs.copyFileSync(file, path.join(this.buildDir, 'apple_startup_images'), { logger: this.logger.debug });
			}
		}, this);
	}

	next();
};

MobileWebBuilder.prototype.findProjectDependencies = function findProjectDependencies(next) {
	var i, len,
		plugins,
		usedAPIs,
		p;

	this.logger.info(__('Finding all Titanium API dependencies'));

	if (this.codeProcessor && this.codeProcessor.plugins) {
		plugins = this.codeProcessor.plugins;
		for (i = 0, len = plugins.length; i < len; i++) {
			if (plugins[i].name === 'ti-api-usage-finder') {
				usedAPIs = plugins[i].global,
				this.projectDependencies = ['Ti'];
				for(p in usedAPIs) {
					p = p.replace('Titanium', 'Ti').replace(/\./g, '/');
					if (p in this.dependenciesMap && this.projectDependencies.indexOf(p) != -1) {
						this.logger.debug(__('Found Titanium API module: ') + p.replace('Ti', 'Titanium').replace(/\//g, '.'));
						this.projectDependencies.push(p);
					}
				}
				break;
			}
		}
	} else {
		this.projectDependencies = Object.keys(this.dependenciesMap);
	}

	next();
};

MobileWebBuilder.prototype.createIcons = function createIcons(next) {
	this.logger.info(__('Creating favicon and Apple touch icons'));

	var file = path.join(this.projectResDir, this.tiapp.icon);
	if (!/\.(png|jpg|gif)$/.test(file) || !fs.existsSync(file)) {
		file = path.join(this.projectResDir, 'mobileweb', 'appicon.png');
	}

	if (!fs.existsSync(file)) {
		return next();
	}

	afs.copyFileSync(file, this.buildDir, { logger: this.logger.debug });

	var params = [
		{ file: path.join(this.buildDir, 'favicon.ico'), width: 16, height: 16 },
		{ file: path.join(this.buildDir, 'apple-touch-icon-precomposed.png'), width: 57, height: 57 },
		{ file: path.join(this.buildDir, 'apple-touch-icon-57x57-precomposed.png'), width: 57, height: 57 },
		{ file: path.join(this.buildDir, 'apple-touch-icon-72x72-precomposed.png'), width: 72, height: 72 },
		{ file: path.join(this.buildDir, 'apple-touch-icon-114x114-precomposed.png'), width: 114, height: 114 },
		{ file: path.join(this.buildDir, 'appicon144.png'), width: 144, height: 144 }
	];

	appc.image.resize(file, params, function (err, stdout, stderr) {
		if (err) {
			this.logger.error(__('Failed to create icons'));
			stdout && stdout.toString().split('\n').forEach(function (line) {
				line && this.logger.error(line.replace(/^\[ERROR\]/i, '').trim());
			}, this);
			stderr && stderr.toString().split('\n').forEach(function (line) {
				line && this.logger.error(line.replace(/^\[ERROR\]/i, '').trim());
			}, this);
			this.logger.log('');
			process.exit(1);
		}
		next();
	}.bind(this), this.logger);
};

MobileWebBuilder.prototype.findModulesToCache = function findModulesToCache(next) {
	this.logger.info(__('Finding all required modules to be cached'));
	this.projectDependencies.forEach(function (mid) {
		this.parseModule(mid);
	}, this);
	this.modulesToCache = this.modulesToCache.concat(Object.keys(this.requireCache));
	next();
};

MobileWebBuilder.prototype.findPrecacheModules = function findPrecacheModules(next) {
	this.logger.info(__('Finding all precached modules'));
	var mwTiapp = this.tiapp.mobileweb;
	if (mwTiapp.precache) {
		mwTiapp.precache.require && mwTiapp.precache.require.forEach(function (x) {
			this.modulesToCache.push('commonjs:' + x);
		}, this);
		mwTiapp.precache.includes && mwTiapp.precache.includes.forEach(function (x) {
			this.modulesToCache.push('url:' + x);
		}, this);
	}
	next();
};

MobileWebBuilder.prototype.findPrecacheImages = function findPrecacheImages(next) {
	this.logger.info(__('Finding all precached images'));
	this.moduleMap['Ti/UI/TableViewRow'] && this.precacheImages.push('/themes/' + this.theme + '/UI/TableViewRow/child.png');
	var images = (this.tiapp.mobileweb.precache && this.tiapp.mobileweb.precache.images) || [];
	images && (this.precacheImages = this.precacheImages.concat(images));
	next();
};

MobileWebBuilder.prototype.findTiModules = function findTiModules(next) {
	if (!this.tiapp.modules || !this.tiapp.modules.length) {
		this.logger.info(__('No Titanium Modules required, continuing'));
		return next();
	}

	this.logger.info(__n('Searching for %s Titanium Module', 'Searching for %s Titanium Modules', this.tiapp.modules.length));
	appc.timodule.find(this.tiapp.modules, 'mobileweb', this.deployType, this.titaniumSdkVersion, this.moduleSearchPaths, this.logger, function (modules) {
		if (modules.missing.length) {
			this.logger.error(__('Could not find all required Titanium Modules:'));
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
				this.logger.error('   ' + __('Titanium module "%s" requested for both Mobile Web and CommonJS platforms, but only one may be used at a time.', m.id));
			}, this);
			this.logger.log();
			process.exit(1);
		}

		modules.found.forEach(function (module) {
			var moduleDir = module.modulePath,
				pkgJson,
				pkgJsonFile = path.join(moduleDir, 'package.json');
			if (!fs.existsSync(pkgJsonFile)) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": missing package.json', module.id) + '\n');
				process.exit(1);
			}

			try {
				pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile));
			} catch (e) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": unable to parse package.json', module.id) + '\n');
				process.exit(1);
			}

			var libDir = ((pkgJson.directories && pkgJson.directories.lib) || '').replace(/^\//, '');

			var mainFilePath = path.join(moduleDir, libDir, (pkgJson.main || '').replace(/\.js$/, '') + '.js');
			if (!fs.existsSync(mainFilePath)) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": unable to find main file "%s"', module.id, pkgJson.main) + '\n');
				process.exit(1);
			}

			this.logger.info(__('Bundling Titanium Mobile Module %s', module.id.cyan));

			this.projectDependencies.push(pkgJson.main);

			var moduleName = module.id != pkgJson.main ? module.id + '/' + pkgJson.main : module.id;

			if (/\/commonjs/.test(moduleDir)) {
				this.modulesToCache.push((/\/commonjs/.test(moduleDir) ? 'commonjs:' : '') + moduleName);
			} else {
				this.modulesToCache.push(moduleName);
				this.tiModulesToLoad.push(module.id);
			}

			this.packages.push({
				'name': module.id,
				'location': './' + this.collapsePath('modules/' + module.id + (libDir ? '/' + libDir : '')),
				'main': pkgJson.main,
				'root': 1
			});

			// TODO: need to combine ALL Ti module .js files into the titanium.js, not just the main file

			// TODO: need to combine ALL Ti module .css files into the titanium.css

			var dest = path.join(this.buildDir, 'modules', module.id);
			wrench.mkdirSyncRecursive(dest);
			afs.copyDirSyncRecursive(moduleDir, dest, { preserve: true });
		}, this);

		next();
	}.bind(this));
};

MobileWebBuilder.prototype.findI18N = function findI18N(next) {
	var data = ti.i18n.load(this.projectDir, this.logger),
		precacheLocales = (this.tiapp.mobileweb.precache || {}).locales || [];

	Object.keys(data).forEach(function (lang) {
		data[lang].app && data[lang].appname && (self.appNames[lang] = data[lang].appname);
		if (data[lang].strings) {
			var dir = path.join(this.buildDir, 'titanium', 'Ti', 'Locale', lang);
			wrench.mkdirSyncRecursive(dir);
			fs.writeFileSync(path.join(dir, 'i18n.js'), 'define(' + JSON.stringify(data[lang].strings, null, '\t') + ');');
			this.locales.push(lang);
			precacheLocales.indexOf(lang) != -1 && this.modulesToCache.push('Ti/Locale/' + lang + '/i18n');
		};
	}, this);

	next();
};

MobileWebBuilder.prototype.findDistinctCachedModules = function findDistinctCachedModules(next) {
	this.logger.info(__('Finding all distinct cached modules'));
	var depMap = {};
	this.modulesToCache.forEach(function (m) {
		for (var i in this.moduleMap) {
			if (this.moduleMap.hasOwnProperty(i) && this.moduleMap[i].indexOf(m) != -1) {
				depMap[m] = 1;
			}
		}
	}, this);
	Object.keys(this.moduleMap).forEach(function (m) {
		depMap[m] || this.modulesToLoad.push(m);
	}, this);
	next();
};

MobileWebBuilder.prototype.detectCircularDependencies = function detectCircularDependencies(next) {
	this.modulesToCache.forEach(function (m) {
		var deps = this.moduleMap[m];
		deps && deps.forEach(function (d) {
			if (this.moduleMap[d] && this.moduleMap[d].indexOf(m) != -1) {
				this.logger.warn(__('Circular dependency detected: %s dependent on %s'), m, d);
			}
		}, this);
	}, this);
	next();
};

MobileWebBuilder.prototype.assembleTitaniumJS = function assembleTitaniumJS(next) {
	this.logger.info(__('Assembling titanium.js'));

	var tiapp = this.tiapp;

	async.waterfall([
		// 1) render the header
		function (next) {
			next(null, ejs.render(fs.readFileSync(path.join(this.templatesDir, 'header.ejs')).toString()) + '\n');
		}.bind(this),

		// 2) read in the config.js and fill in the template
		function (tiJS, next) {
			this.cli.createHook('build.mobileweb.processConfigTemplate', this, function (template, options, callback) {
				callback(null, tiJS + ejs.render(template, options) + '\n\n');
			})(
				fs.readFileSync(path.join(this.platformPath, 'src', 'config.js')).toString(),
				{
					appAnalytics: tiapp.analytics,
					appCopyright: tiapp.copyright,
					appDescription: tiapp.description,
					appGuid: tiapp.guid,
					appId: tiapp.id,
					appName: tiapp.name,
					appNames: JSON.stringify(this.appNames),
					appPublisher: tiapp.publisher,
					appUrl: tiapp.url,
					appVersion: tiapp.version,
					deployType: this.deployType,
					locales: JSON.stringify(this.locales),
					packages: JSON.stringify(this.packages),
					projectId: tiapp.id,
					projectName: tiapp.name,
					target: this.target,
					tiAnalyticsPlatformName: 'mobileweb',
					tiFsRegistry: tiapp.mobileweb.filesystem.registry,
					tiTheme: this.theme,
					tiGithash: ti.manifest.githash,
					tiOsName: 'mobileweb',
					tiPlatformName: 'mobileweb',
					tiTimestamp: ti.manifest.timestamp,
					tiVersion: ti.manifest.version,
					hasAnalyticsUseXhr: tiapp.mobileweb.analytics ? tiapp.mobileweb.analytics['use-xhr'] === true : false,
					hasShowErrors: this.deployType != 'production' && tiapp.mobileweb['disable-error-screen'] !== true,
					hasInstrumentation: !!tiapp.mobileweb.instrumentation,
					hasAllowTouch: tiapp.mobileweb.hasOwnProperty('allow-touch') ? !!tiapp.mobileweb['allow-touch'] : true
				},
				next
			);
		}.bind(this),

		// 3) copy in instrumentation if it's enabled
		function (tiJS, next) {
			if (tiapp.mobileweb.instrumentation) {
				next(null, tiJS + fs.readFileSync(path.join(this.platformPath, 'src', 'instrumentation.js')).toString() + '\n');
			} else {
				next(null, tiJS);
			}
		}.bind(this),

		// 4) copy in the loader
		function (tiJS, next) {
			next(null, tiJS + fs.readFileSync(path.join(this.platformPath, 'src', 'loader.js')).toString() + '\n\n');
		}.bind(this),

		// 5) cache the dependencies
		function (tiJS, next) {
			var first = true,
				requireCacheWritten = false,
				moduleCounter = 0;

			// uncomment next line to bypass module caching (which is ill advised):
			// this.modulesToCache = [];

			this.modulesToCache.forEach(function (moduleName) {
				var isCommonJS = false;
				if (/^commonjs\:/.test(moduleName)) {
					isCommonJS = true;
					moduleName = moduleName.substring(9);
				}

				var dep = this.resolveModuleId(moduleName);
				if (!dep.length) return;

				if (!requireCacheWritten) {
					tiJS += 'require.cache({\n';
					requireCacheWritten = true;
				}

				if (!first) {
					tiJS += ',\n';
				}
				first = false;
				moduleCounter++;

				var file = path.join(dep[0], /\.js$/.test(dep[1]) ? dep[1] : dep[1] + '.js');

				if (/^url\:/.test(moduleName)) {
					if (this.minifyJS) {
						var source = file + '.uncompressed.js';
						fs.renameSync(file, source);
						this.logger.debug(__('Minifying include %s', file));
						try {
							fs.writeFileSync(file, UglifyJS.minify(source).code);
						} catch (ex) {
							this.logger.error(__('Failed to minify %s', source));
							if (ex.line) {
								this.logger.error(__('%s [line %s, column %s]', ex.message, ex.line, ex.col));
							} else {
								this.logger.error(__('%s', ex.message));
							}
							try {
								var contents = fs.readFileSync(source).toString().split('\n');
								if (ex.line && ex.line <= contents.length) {
									this.logger.error('');
									this.logger.error('    ' + contents[ex.line-1]);
									if (ex.col) {
										var i = 0,
											len = ex.col;
											buffer = '    ';
										for (; i < len; i++) {
											buffer += '-';
										}
										this.logger.error(buffer + '^');
									}
									this.logger.log();
								}
							} catch (ex2) {}
							process.exit(1);
						}
					}
					tiJS += '"' + moduleName + '":"' + fs.readFileSync(file).toString().trim().replace(/\\/g, '\\\\').replace(/\n/g, '\\n\\\n').replace(/"/g, '\\"') + '"';
				} else if (isCommonJS) {
					tiJS += '"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\ndefine(function(require,exports,module){\n' + fs.readFileSync(file).toString() + '\n});\n}';
				} else {
					tiJS += '"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\n\n' + fs.readFileSync(file).toString() + '\n}';
				}
			}, this);

			this.precacheImages.forEach(function (url) {
				url = url.replace(/\\/g, '/');

				var img = path.join(this.projectResDir, /^\//.test(url) ? '.' + url : url),
					m = img.match(/(\.[a-zA-Z]{3,4})$/),
					type = m && this.imageMimeTypes[m[1]];

				if (type && fs.existsSync(img)) {
					if (!requireCacheWritten) {
						tiJS += 'require.cache({\n';
						requireCacheWritten = true;
					}

					if (!first) {
						tiJS += ',\n';
					}
					first = false;
					moduleCounter++;

					tiJS += '"url:' + url + '":"data:' + type + ';base64,' + fs.readFileSync(img).toString('base64') + '"';
				}
			}, this);

			if (requireCacheWritten) {
				tiJS += '});\n';
			}

			next(null, tiJS);
		}.bind(this),

		// 6) write the ti.app.properties
		function (tiJS, next) {
			var props = this.tiapp.properties || {};
			this.tiapp.mobileweb.filesystem.backend && (props['ti.fs.backend'] = { type: 'string', value: this.tiapp.mobileweb.filesystem.backend });
			this.tiapp.mobileweb.map.backend && (props['ti.map.backend'] = { type: 'string', value: this.tiapp.mobileweb.map.backend });
			this.tiapp.mobileweb.map.apikey && (props['ti.map.apikey'] = { type: 'string', value: this.tiapp.mobileweb.map.apikey });

			tiJS += 'require("Ti/App/Properties", function(p) {\n';
			Object.keys(props).forEach(function (name) {
				var prop = props[name],
					type = prop.type || 'string';
				tiJS += '\tp.set' + type.charAt(0).toUpperCase() + type.substring(1).toLowerCase() + '("'
					+ name.replace(/"/g, '\\"') + '",' + (type == 'string' ? '"' + prop.value.replace(/"/g, '\\"') + '"': prop.value) + ');\n';
			});
			tiJS += '});\n';

			next(null, tiJS);
		}.bind(this),

		// 7) write require() to load all Ti modules
		function (tiJS, next) {
			this.modulesToLoad.sort();
			this.modulesToLoad = this.modulesToLoad.concat(this.tiModulesToLoad);
			next(null, tiJS + 'require(' + JSON.stringify(this.modulesToLoad) + ');\n');
		}.bind(this)

	], function (err, tiJS) {
		fs.writeFile(path.join(this.buildDir, 'titanium.js'), tiJS, next);
	}.bind(this));
};

MobileWebBuilder.prototype.assembleTitaniumCSS = function assembleTitaniumCSS(next) {
	var tiCSS = [
		ejs.render(fs.readFileSync(path.join(this.templatesDir, 'header.ejs')).toString()), '\n'
	];

	if (this.tiapp.mobileweb.splash.enabled) {
		var splashDir = path.join(this.projectResDir, 'mobileweb', 'splash'),
			splashHtmlFile = path.join(splashDir, 'splash.html'),
			splashCssFile = path.join(splashDir, 'splash.css');

		if (fs.existsSync(splashDir)) {
			this.logger.info(__('Processing splash screen'));
			fs.existsSync(splashHtmlFile) && (this.splashHtml = fs.readFileSync(splashHtmlFile));
			if (fs.existsSync(splashCssFile)) {
				var css = fs.readFileSync(splashCssFile).toString();
				if (this.tiapp.mobileweb.splash['inline-css-images']) {
					var parts = css.split('url('),
						i = 1, p, img, imgPath, imgType,
						len = parts.length;
					for (; i < len; i++) {
						p = parts[i].indexOf(')');
						if (p != -1) {
							img = parts[i].substring(0, p).replace(/["']/g, '').trim();
							if (!/^data\:/.test(img)) {
								imgPath = img.charAt(0) == '/' ? this.projectResDir + img : splashDir + '/' + img;
								imgType = this.imageMimeTypes[imgPath.match(/(\.[a-zA-Z]{3})$/)[1]];
								if (fs.existsSync(imgPath) && imgType) {
									parts[i] = 'data:' + imgType + ';base64,' + fs.readFileSync(imgPath).toString('base64') + parts[i].substring(p);
								}
							}
						}
					}
					css = parts.join('url(');
				}
				tiCSS.push(css);
			}
		}
	}

	this.logger.info(__('Assembling titanium.css'));

	var commonCss = this.mobilewebThemeDir + '/common.css';
	fs.existsSync(commonCss) && tiCSS.push(fs.readFileSync(commonCss).toString());

	// TODO: need to rewrite absolute paths for urls

	// TODO: code below does NOT inline imports, nor remove them... do NOT use imports until themes are fleshed out

	var themePath = path.join(this.projectResDir, 'themes', this.theme);
	fs.existsSync(themePath) || (themePath = path.join(this.projectResDir, this.theme));
	fs.existsSync(themePath) || (themePath = path.join(this.platformPath, 'themes', this.theme));
	if (!fs.existsSync(themePath)) {
		this.logger.error(__('Unable to locate theme "%s"', this.theme) + '\n');
		process.exit(1);
	}

	wrench.readdirSyncRecursive(themePath).forEach(function (file) {
		/\.css$/.test(file) && tiCSS.push(fs.readFileSync(path.join(themePath, file)).toString() + '\n');
	});

	// detect any fonts and add font face rules to the css file
	var fonts = {};
	wrench.readdirSyncRecursive(this.projectResDir).forEach(function (file) {
		var match = file.match(/^(.+)\.(otf|woff|ttf)$/),
			name = match && match[1].split('/').pop();
		if (name) {
			fonts[name] || (fonts[name] = []);
			fonts[name].push(file);
		}
	});
	Object.keys(fonts).forEach(function (name) {
		this.logger.debug(__('Found font: %s', name.cyan));
		tiCSS.push('@font-face{font-family:"' + name + '";src:url("' + fonts[name] + '");}\n');
	}, this);

	// write the titanium.css
	fs.writeFileSync(path.join(this.buildDir, 'titanium.css'), this.deployType == 'production' ? cleanCSS.process(tiCSS.join('')) : tiCSS.join(''));

	next();
};

MobileWebBuilder.prototype.minifyJavaScript = function minifyJavaScript(next) {
	if (!this.minifyJS) return next();

	this.logger.info(__('Minifying JavaScript'));
	var self = this;

	(function walk(dir) {
		fs.readdirSync(dir).sort().forEach(function (filename) {
			var file = path.join(dir, filename),
				stat = fs.statSync(file);
			if (stat.isDirectory()) {
				walk(file);
			} else if (/\.js$/.test(filename)) {
				var source = file + '.uncompressed.js';
				fs.renameSync(file, source);
				self.logger.debug(__('Minifying include %s', file));
				try {
					fs.writeFileSync(file, UglifyJS.minify(source).code);
				} catch (ex) {
					self.logger.error(__('Failed to minify %s', file));
					if (ex.line) {
						self.logger.error(__('%s [line %s, column %s]', ex.message, ex.line, ex.col));
					} else {
						self.logger.error(__('%s', ex.message));
					}
					try {
						var contents = fs.readFileSync(source).toString().split('\n');
						if (ex.line && ex.line <= contents.length) {
							self.logger.error('');
							self.logger.error('    ' + contents[ex.line-1]);
							if (ex.col) {
								var i = 0,
									len = ex.col;
									buffer = '    ';
								for (; i < len; i++) {
									buffer += '-';
								}
								self.logger.error(buffer + '^');
							}
							self.logger.log();
						}
					} catch (ex2) {}
					process.exit(1);
				}
			}
		});
	}(this.buildDir));

	next();
};

MobileWebBuilder.prototype.createFilesystemRegistry = function createFilesystemRegistry(next) {
	this.logger.info(__('Creating the filesystem registry'));

	var registry = 'ts\t' + fs.statSync(this.buildDir).ctime.getTime() + '\n' +
		(function walk(dir, depth) {
			var s = '';
			depth = depth | 0;
			fs.readdirSync(dir).sort().forEach(function (file) {
				// TODO: screen out specific file/folder patterns (i.e. uncompressed js files)
				var stat = fs.statSync(path.join(dir, file));
				if (stat.isDirectory()) {
					s += (depth ? (new Array(depth + 1)).join('\t') : '') + file + '\n' + walk(path.join(dir, file), depth + 1);
				} else {
					s += (depth ? (new Array(depth + 1)).join('\t') : '') + file + '\t' + stat.size + '\n';
				}
			});
			return s;
		}(this.buildDir)).trim();

	fs.writeFileSync(path.join(this.buildDir, 'titanium', 'filesystem.registry'), registry);

	if (this.tiapp.mobileweb.filesystem.registry == 'preload') {
		fs.appendFileSync(path.join(this.buildDir, 'titanium.js'), 'require.cache({"url:/titanium/filesystem.registry":"' + registry.replace(/\n/g, '|') + '"});');
	}

	next();
};

MobileWebBuilder.prototype.createIndexHtml = function createIndexHtml(next) {
	this.logger.info(__('Creating the index.html'));

	// get status bar style
	var statusBarStyle = 'default';
	if (this.tiapp['statusbar-style']) {
		statusBarStyle = this.tiapp['statusbar-style'];
		if (/^opaque_black|opaque$/.test(statusBarStyle)) {
			statusBarStyle = 'black';
		} else if (/^translucent_black|transparent|translucent$/.test(statusBarStyle)) {
			statusBarStyle = 'black-translucent';
		} else {
			statusBarStyle = 'default';
		}
	}

	// write the index.html
	fs.writeFile(
		path.join(this.buildDir, 'index.html'),
		ejs.render(
			fs.readFileSync(path.join(this.platformPath, 'src', 'index.html')).toString(),
			{
				target: this.target,
				tiHeader: ejs.render(fs.readFileSync(path.join(this.templatesDir, 'header.html.ejs')).toString()),
				projectName: this.tiapp.name || '',
				appDescription: this.tiapp.description || '',
				appPublisher: this.tiapp.publisher || '',
				tiGenerator: 'Appcelerator Titanium Mobile ' + ti.manifest.version,
				tiStatusbarStyle: statusBarStyle,
				tiCss: fs.readFileSync(path.join(this.buildDir, 'titanium.css')).toString(),
				splashScreen: this.splashHtml,
				tiJs: fs.readFileSync(path.join(this.buildDir, 'titanium.js')).toString()
			}
		),
		next
	);
};

MobileWebBuilder.prototype.collapsePath = function collapsePath(p) {
	var result = [], segment, lastSegment;
	p = p.replace(/\\/g, '/').split('/');
	while (p.length) {
		segment = p.shift();
		if (segment == '..' && result.length && lastSegment != '..') {
			result.pop();
			lastSegment = result[result.length - 1];
		} else if (segment != '.') {
			result.push(lastSegment = segment);
		}
	}
	return result.join('/');
};

MobileWebBuilder.prototype.resolveModuleId = function resolveModuleId(mid, ref) {
	var parts = mid.split('!');
	mid = parts[parts.length-1];

	if (/^url\:/.test(mid)) {
		mid = mid.substring(4);
		if (/^\//.test(mid)) {
			mid = '.' + mid;
		}
		parts = mid.split('/');
		for (var i = 0, l = this.packages.length; i < l; i++) {
			if (this.packages[i].name == parts[0]) {
				return [this.collapsePath(this.buildDir + '/' + this.packages[i].location), mid];
			}
		}
		return [this.buildDir, mid];
	}

	if (mid.indexOf(':') != -1) return [];
	if (/^\//.test(mid) || (parts.length == 1 && /\.js$/.test(mid))) return [this.buildDir, mid];
	/^\./.test(mid) && ref && (mid = this.collapsePath(ref + mid));
	parts = mid.split('/');

	for (var i = 0, l = this.packages.length; i < l; i++) {
		if (this.packages[i].name == parts[0]) {
			this.packages[i].name != 'Ti' && (mid = mid.replace(this.packages[i].name + '/', ''));
			return [ this.collapsePath(path.join(this.buildDir, this.packages[i].location)), mid ];
		}
	}

	return [ this.buildDir, mid ];
};

MobileWebBuilder.prototype.parseModule = function parseModule(mid, ref) {
	if (this.requireCache[mid] || mid == 'require') {
		return;
	}

	var parts = mid.split('!');

	if (parts.length == 1) {
		if (mid.charAt(0) == '.' && ref) {
			mid = this.collapsePath(ref + mid);
		}
		this.requireCache[mid] = 1;
	}

	var dep = this.resolveModuleId(mid, ref);
	if (!dep.length) {
		return;
	}

	parts.length > 1 && (this.requireCache['url:' + parts[1]] = 1);

	var deps = this.dependenciesMap[parts.length > 1 ? mid : dep[1]];
	for (var i = 0, l = deps.length; i < l; i++) {
		dep = deps[i];
		ref = mid.split('/');
		ref.pop();
		ref = ref.join('/') + '/';
		this.parseModule(dep, ref);
	}
	this.moduleMap[mid] = deps;
};

// create the builder instance and expose the public api
(function (mobileWebBuilder) {
	exports.config   = mobileWebBuilder.config.bind(mobileWebBuilder);
	exports.validate = mobileWebBuilder.validate.bind(mobileWebBuilder);
	exports.run      = mobileWebBuilder.run.bind(mobileWebBuilder);
}(new MobileWebBuilder(module)));
