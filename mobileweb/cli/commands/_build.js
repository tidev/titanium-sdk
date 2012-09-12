/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	appc = require('node-appc'),
	afs = appc.fs,
	xml = appc.xml,
	parallel = appc.async.parallel,
	uglify = require('uglify-js'),
	fs = require('fs'),
	path = require('path'),
	semver = require('semver'),
	wrench = require('wrench'),
	DOMParser = require('xmldom').DOMParser,
	jsExtRegExp = /\.js$/,
	HTML_HEADER = [
		'<!--',
		'	WARNING: this is generated code and will be lost if changes are made.',
		'	This generated source code is Copyright (c) 2010-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
		'	-->'
		].join('\n'),
	HEADER = [
		'/**',
		' * WARNING: this is generated code and will be lost if changes are made.',
		' * This generated source code is Copyright (c) 2010-' + (new Date).getFullYear() + ' by Appcelerator, Inc. All Rights Reserved.',
		' */'
		].join('\n'),
	imageMimeTypes = {
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.jpg': 'image/jpg',
		'.jpeg': 'image/jpg'
	};

exports.run = function (logger, config, cli, finished) {
	new build(logger, config, cli, finished);
};

function build(logger, config, cli, finished) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	this.logger = logger;
	this.buildType = cli.argv['build-type'];
	this.os = cli.env.os;
	
	this.projectDir = afs.resolvePath(cli.argv.dir);
	this.projectResDir = this.projectDir + '/Resources';
	this.buildDir = this.projectDir + '/build/mobileweb';
	this.mobilewebSdkPath = afs.resolvePath(path.dirname(module.filename) + '/../..');
	this.mobilewebThemeDir = this.mobilewebSdkPath + '/themes';
	this.mobilewebTitaniumDir = this.mobilewebSdkPath + '/titanium';
	
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
	
	var pkgJson = this.readTiPackageJson();
	this.packages = [{
		name: pkgJson.name,
		location: './titanium',
		main: pkgJson.main
	}];
	
	// read the tiapp.xml and initialize some sensible defaults
	this.tiapp = this.readTiappXml();
	applyDefaults(this.tiapp, {
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
	});
	
	this.validateTheme();
	
	var mwBuildSettings = this.tiapp.mobileweb.build[this.buildType];
	this.minifyJS = mwBuildSettings && mwBuildSettings.js ? !!mwBuildSettings.js.minify : this.buildType == 'production';
	
	parallel(this, [
		'copyFiles',
		'findProjectDependencies'
	], function () {
		parallel(this, [
			'createIcons',
			function (callback) {
				parallel(this, [
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
						this.logger.info(
							__n('Found %s dependency', 'Found %s dependencies', this.projectDependencies.length) + ', ' +
							__n('%s package', '%s packages', this.packages.length) + ', ' +
							__n('%s module', '%s modules', this.modulesToCache.length)
						);
						parallel(this, [
							'assembleTitaniumJS',
							'assembleTitaniumCSS'
						], callback);
					});
				});
			}
		], function () {
			this.minifyJavaScript();
			this.createFilesystemRegistry();
			this.createIndexHtml();
			finished && finished();
		});
	});
};

build.prototype = {

	readTiPackageJson: function () {
		this.logger.info(__('Reading Titanium Mobile Web package.json file'));
		var mwPackageFile = this.mobilewebSdkPath + '/titanium/package.json';
		afs.exists(mwPackageFile) || badInstall(__('Unable to find Titanium Mobile Web package.json file'));
		try {
			return JSON.parse(fs.readFileSync(mwPackageFile));
		} catch (e) {
			badInstall(__("Unable to parse Titanium Mobile Web's package.json file"));
		}
	},
	
	readTiappXml: function () {
		this.logger.info(__('Reading tiapp.xml file'));
		var tiappFile = this.projectDir + '/tiapp.xml';
		if (!afs.exists(tiappFile)) {
			this.logger.error(__('Unable to read tiapp.xml file in project directory') + '\n');
			process.exit(1);
		}
		return new ti.tiappxml(tiappFile);
	},
	
	validateTheme: function () {
		this.logger.info(__('Validating theme'));
		this.theme = this.tiapp.mobileweb.theme || 'default';
		if (!afs.exists(this.mobilewebThemeDir + '/' + this.theme)) {
			logger.error(__('Unable to find the "%s" theme. Please verify the theme setting in the tiapp.xml.', this.theme) + '\n');
			process.exit(1);
		}
		this.logger.debug(__('Using %s theme', this.theme.cyan));
	},
	
	copyFiles: function (callback) {
		this.logger.info(__('Copying project files'));
		if (afs.exists(this.buildDir)) {
			this.logger.debug(__('Deleting existing build directory'));
			wrench.rmdirSyncRecursive(this.buildDir);
		}
		wrench.mkdirSyncRecursive(this.buildDir);
		afs.copyDirSyncRecursive(this.mobilewebThemeDir, this.buildDir + '/themes', { preserve: true, logger: this.logger.debug });
		afs.copyDirSyncRecursive(this.mobilewebTitaniumDir, this.buildDir + '/titanium', { preserve: true, logger: this.logger.debug });
		afs.copyDirSyncRecursive(this.projectResDir, this.buildDir, { preserve: true, logger: this.logger.debug }, ti.availablePlatforms.filter(function (p) { return p != 'mobileweb'; }));
		if (afs.exists(this.projectResDir, 'mobileweb')) {
			afs.copyDirSyncRecursive(this.projectResDir + '/mobileweb', this.buildDir + '/mobileweb', { preserve: true, logger: this.logger.debug, rootIgnores: ['apple_startup_images', 'splash'] });
			['Default.jpg', 'Default-Portrait.jpg', 'Default-Landscape.jpg'].forEach(function (file) {
				file = this.projectResDir + '/mobileweb/apple_startup_images/' + file;
				afs.exists(file) && afs.copyFileSync(file, this.buildDir + '/mobileweb/apple_startup_images', { logger: this.logger.debug });
			}, this);
		}
		callback();
	},
	
	findProjectDependencies: function (callback) {
		this.logger.info(__('Finding all Titanium API dependencies'));
		
		// TODO: have the code processor begin scan of project for dependencies
		// IMPORTANT! scan this.projectResDir, not the this.buildDir since it's not copied yet
		
		this.projectDependencies = [
			'Ti',
			'Ti/Accelerometer',
			'Ti/Analytics',
			'Ti/API',
			'Ti/App',
			'Ti/App/Properties',
			'Ti/Blob',
			'Ti/Buffer',
			'Ti/Codec',
			'Ti/Facebook',
			'Ti/Facebook/LoginButton',
			'Ti/Filesystem',
			'Ti/Filesystem/File',
			'Ti/Filesystem/FileStream',
			'Ti/Gesture',
			'Ti/_/Gestures/GestureRecognizer',
			'Ti/_/Gestures/Dragging',
			'Ti/_/Gestures/DoubleTap',
			'Ti/_/Gestures/LongPress',
			'Ti/_/Gestures/Pinch',
			'Ti/_/Gestures/SingleTap',
			'Ti/_/Gestures/Swipe',
			'Ti/_/Gestures/TouchCancel',
			'Ti/_/Gestures/TouchEnd',
			'Ti/_/Gestures/TouchMove',
			'Ti/_/Gestures/TouchStart',
			'Ti/_/Gestures/TwoFingerTap',
			'Ti/Geolocation',
			'Ti/IOStream',
			'Ti/Locale',
			'Ti/Media',
			'Ti/Media/VideoPlayer',
			'Ti/Network',
			'Ti/Network/HTTPClient',
			'Ti/Platform',
			'Ti/Platform/DisplayCaps',
			'Ti/Map',
			'Ti/Map/View',
			'Ti/Map/Annotation',
			'Ti/UI',
			'Ti/UI/2DMatrix',
			'Ti/UI/ActivityIndicator',
			'Ti/UI/AlertDialog',
			'Ti/UI/Animation',
			'Ti/UI/Button',
			'Ti/UI/Clipboard',
			'Ti/UI/EmailDialog',
			'Ti/UI/ImageView',
			'Ti/UI/Label',
			'Ti/UI/MobileWeb',
			'Ti/UI/MobileWeb/NavigationGroup',
			'Ti/UI/OptionDialog',
			'Ti/UI/Picker',
			'Ti/UI/PickerColumn',
			'Ti/UI/PickerRow',
			'Ti/UI/ProgressBar',
			'Ti/UI/ScrollableView',
			'Ti/UI/ScrollView',
			'Ti/UI/Slider',
			'Ti/UI/Switch',
			'Ti/UI/Tab',
			'Ti/UI/TabGroup',
			'Ti/UI/TableView',
			'Ti/UI/TableViewRow',
			'Ti/UI/TableViewSection',
			'Ti/UI/TextArea',
			'Ti/UI/TextField',
			'Ti/UI/View',
			'Ti/UI/WebView',
			'Ti/UI/Window',
			'Ti/Utils',
			'Ti/XML',
			'Ti/Yahoo'
		];
		callback();
	},
	
	findModulesToCache: function (callback) {
		this.logger.info(__('Finding all required modules to be cached'));
		this.projectDependencies.forEach(function (mid) {
			this.parseModule(mid);
		}, this);
		this.modulesToCache = this.modulesToCache.concat(Object.keys(this.requireCache));
		callback();
	},
	
	findPrecacheModules: function (callback) {
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
		callback();
	},
	
	findDistinctCachedModules: function (callback) {
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
		callback();
	},
	
	findPrecacheImages: function (callback) {
		this.logger.info(__('Finding all precached images'));
		this.moduleMap['Ti/UI/TableViewRow'] && this.precacheImages.push('/themes/' + this.theme + '/UI/TableViewRow/child.png');
		var images = (this.tiapp.mobileweb.precache && this.tiapp.mobileweb.precache.images) || [];
		images && (this.precacheImages = this.precacheImages.concat(images));
		callback();
	},
	
	findTiModules: function (callback) {
		/*
		if (!this.tiapp.modules || !this.tiapp.modules.length) {
			this.logger.info(__('No Titanium Modules required, continuing'));
			callback();
			return;
		}
		
		this.logger.info(__n('Searching for %s Titanium Module', 'Searching for %s Titanium Modules', this.tiapp.modules.length));
		ti.module.find(this.tiapp.modules, 'mobileweb', this.projectDir, this.logger, function (modules) {
		*/
		
		var modules = (this.tiapp.modules || []).filter(function (m) { return /^(|mobileweb|commonjs)$/.test(m.platform); });
		if (!modules.length) {
			callback();
			return;
		}
		
		// TODO: remove unused i18n strings from below...
		this.logger.info(__('Locating Titanium Mobile Modules'));
		
		var sdkVersion = ti.manifest.version.split('.').slice(0, 3).join('.'),
			searchPaths = [
				this.projectDir + '/modules/__ID__/__VERSION__/mobileweb',
				this.projectDir + '/modules/__ID__/__VERSION__/commonjs',
				this.projectDir + '/modules/mobileweb/__ID__/__VERSION__',
				this.projectDir + '/modules/commonjs/__ID__/__VERSION__'
			];
		
		this.os.sdkPaths.forEach(function (p) {
			searchPaths.push(afs.resolvePath(p, 'modules/__ID__/__VERSION__/mobileweb'));
			searchPaths.push(afs.resolvePath(p, 'modules/__ID__/__VERSION__/commonjs'));
			searchPaths.push(afs.resolvePath(p, 'modules/mobileweb/__ID__/__VERSION__'));
			searchPaths.push(afs.resolvePath(p, 'modules/commonjs/__ID__/__VERSION__'));
		});
		
		modules.forEach(function (m) {
			var paths = searchPaths.map(function (p) {
					return (m.version ? p.replace('__VERSION__', m.version) : p.replace('/__VERSION__', '')).replace(/__ID__/, m.id);
				}),
				i = 0,
				l = paths.length,
				moduleDir,
				mainFile;
			
			for (; i < l; i++) {
				if (afs.exists(paths[i])) {
					moduleDir = paths[i];
					this.logger.debug(__('Found module %s in %s', m.id.cyan, paths[i].cyan));
					break;
				}
			}
			
			if (!moduleDir) {
				if (m.version) {
					this.logger.error(__('Unable to find Titanium Mobile Module "%s" version %s', m.id, m.version) + '\n');
				} else {
					this.logger.error(__('Unable to find Titanium Mobile Module "%s"', m.id) + '\n');
				}
				process.exit(1);
			}
			
			var manifestFile = moduleDir + '/manifest';
			if (!afs.exists(manifestFile)) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": missing manifest', m.id) + '\n');
				process.exit(1);
			}
			
			var manifest = {};
			fs.readFileSync(manifestFile).toString().split('\n').forEach(function (line) {
				line = line.trim();
				if (!/^#/.test(line) && line.indexOf(':') != -1) {
					line = line.split(':');
					manifest[line[0].trim()] = line[1].trim();
				}
			});
			
			if (manifest.minsdk && semver.gt(manifest.minsdk, sdkVersion)) {
				this.logger.error(__('Titanium Mobile Module "%s" requires a minimum SDK version of %s: current version %s',m.id, manifest.minsdk, sdkVersion));
				process.exit(1)
			}
			
			var pkgJsonFile = moduleDir + '/package.json';
			if (!afs.exists(pkgJsonFile)) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": missing package.json', m.id) + '\n');
				process.exit(1);
			}
			
			var pkgJson;
			try {
				pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile));
			} catch (e) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": unable to parse package.json', m.id) + '\n');
				process.exit(1);
			}
			
			var libDir = ((pkgJson.directories && pkgJson.directories.lib) || '').replace(/^\//, '');
			
			var mainFilePath = path.join(moduleDir, libDir, (pkgJson.main || '').replace(jsExtRegExp, '') + '.js')
			if (!afs.exists(mainFilePath)) {
				this.logger.error(__('Invalid Titanium Mobile Module "%s": unable to find main file "%s"', m.id, pkgJson.main) + '\n');
				process.exit(1);
			}
			
			this.logger.info(__('Bundling Titanium Mobile Module "%s"', m.id));
			
			this.projectDependencies.push(pkgJson.main);
			
			var moduleName = m.id != pkgJson.main ? m.id + '/' + pkgJson.main : m.id;
			
			if (/\/commonjs/.test(moduleDir)) {
				this.modulesToCache.push((/\/commonjs/.test(moduleDir) ? 'commonjs:' : '') + moduleName);
			} else {
				this.modulesToCache.push(moduleName);
				this.tiModulesToLoad.push(m.id);
			}
			
			this.packages.push({
				'name': m.id,
				'location': './' + this.collapsePath('modules/' + m.id + (libDir ? '/' + libDir : '')),
				'main': pkgJson.main,
				'root': 1
			});
			
			// TODO: need to combine ALL Ti module .js files into the titanium.js, not just the main file
			
			// TODO: need to combine ALL Ti module .css files into the titanium.css
			
			var dest = this.buildDir + '/modules/' + m.id;
			wrench.mkdirSyncRecursive(dest);
			afs.copyDirSyncRecursive(moduleDir, dest, { preserve: true });
		}, this);
		callback();
	},
	
	detectCircularDependencies: function (callback) {
		this.modulesToCache.forEach(function (m) {
			var deps = this.moduleMap[m];
			deps && deps.forEach(function (d) {
				if (this.moduleMap[d] && this.moduleMap[d].indexOf(m) != -1) {
					this.logger.warn(__('Circular dependency detected: %s dependent on %s'), m, d);
				}
			}, this);
		}, this);
		callback();
	},
	
	findI18N: function (callback) {
		var self = this,
			precacheLocales = (this.tiapp.precache || {}).locales || {},
			i18nDir = this.projectDir + '/i18n';
		
		if (afs.exists(i18nDir)) {
			this.logger.info(__('Processing i18n strings'));
			fs.readdirSync(i18nDir).forEach(function (lang) {
				var stat = fs.lstatSync(i18nDir + "/" + lang);
				if (stat.isDirectory()) {
					self.loadI18N(i18nDir + '/' + lang + '/app.xml', function (data) {
						data.appname && (self.appNames[lang] = data.appname);
					});
					self.loadI18N(i18nDir + '/' + lang + '/strings.xml', function (data) {
						self.locales.push(lang);
						var dir = self.buildDir + '/titanium/Ti/Locale/' + lang;
						wrench.mkdirSyncRecursive(dir);
						fs.writeFileSync(dir + '/i18n.js', 'define(' + JSON.stringify(data, null, '\t') + ')');
						precacheLocales[lang] && self.modulesToCache.push('Ti/Locale/' + lang + '/i18n');
					});
				}
			});
		}
		
		callback();
	},
	
	loadI18N: function (xmlFile, callback) {
		var data = {};
		
		if (afs.exists(xmlFile)) {
			this.logger.debug(__('Loading i18n XML file: %s', xmlFile.cyan));
			var dom = new DOMParser().parseFromString(fs.readFileSync(xmlFile).toString(), 'text/xml');
			xml.forEachElement(dom.documentElement, function (elem) {
				if (elem.nodeType == 1 && elem.tagName == 'string') {
					var name = xml.getAttr(elem, 'name');
					if (name) {
						data[name] = xml.getValue(elem);
					}
				}
			});
		}
		
		callback && callback(data);
		return data;
	},
	
	assembleTitaniumJS: function (callback) {
		this.logger.info(__('Assembling titanium.js'));
		
		var tiapp = this.tiapp,
			tiJS = [
				HEADER, '\n',
				
				// 1) read in the config.js and fill in the template
				renderTemplate(fs.readFileSync(this.mobilewebSdkPath + '/src/config.js').toString(), {
					app_analytics: tiapp.analytics,
					app_copyright: tiapp.copyright,
					app_description: tiapp.description,
					app_guid: tiapp.guid,
					app_id: tiapp.id,
					app_name: tiapp.name,
					app_names: JSON.stringify(this.appNames),
					app_publisher: tiapp.publisher,
					app_url: tiapp.url,
					app_version: tiapp.version,
					deploy_type: this.buildType,
					locales: JSON.stringify(this.locales),
					packages: JSON.stringify(this.packages),
					project_id: tiapp.id,
					project_name: tiapp.name,
					ti_fs_registry: tiapp.mobileweb.filesystem.registry,
					ti_theme: this.theme,
					ti_githash: ti.manifest.githash,
					ti_timestamp: ti.manifest.timestamp,
					ti_version: ti.manifest.version,
					has_analytics_use_xhr: tiapp.mobileweb.analytics ? tiapp.mobileweb.analytics['use-xhr'] === true : false,
					has_show_errors: this.buildType != 'production' && tiapp.mobileweb['disable-error-screen'] !== true,
					has_instrumentation: !!tiapp.mobileweb.instrumentation
				}),
				
				'\n', '\n'
			];
		
		// 2) copy in instrumentation if it's enabled
		!tiapp.mobileweb.instrumentation || tiJS.push(fs.readFileSync(this.mobilewebSdkPath + '/src/instrumentation.js').toString() + '\n');
		
		// 3) copy in the loader
		tiJS.push(fs.readFileSync(this.mobilewebSdkPath + '/src/loader.js').toString() + '\n\n');
		
		// 4) cache the dependencies
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
				tiJS.push('require.cache({\n');
				requireCacheWritten = true;
			}
			
			first || tiJS.push(',\n');
			first = false;
			moduleCounter++;
			
			var file = path.join(dep[0], jsExtRegExp.test(dep[1]) ? dep[1] : dep[1] + '.js');
			
			if (/^url\:/.test(moduleName)) {
				if (this.minifyJS) {
					var pro = uglify.uglify,
						source = file + '.uncompressed.js';
					
					fs.renameSync(file, source);
					this.logger.debug(__('Minifying include %s', file));
					fs.writeFileSync(file, pro.gen_code(pro.ast_squeeze(pro.ast_mangle(uglify.parser.parse(fs.readFileSync(source).toString())))));
				}
				tiJS.push('"' + moduleName + '":"' + fs.readFileSync(file).toString().trim().replace(/\\/g, '\\\\').replace(/\n/g, '\\n\\\n').replace(/"/g, '\\"') + '"');
			} else if (isCommonJS) {
				tiJS.push('"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\ndefine(function(require,exports,module){\n' + fs.readFileSync(file).toString() + '\n});\n}');
			} else {
				tiJS.push('"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\n\n' + fs.readFileSync(file).toString() + '\n}');
			}
		}, this);
		
		this.precacheImages.forEach(function (url) {
			url = url.replace(/\\/g, '/');
			
			var img = path.join(this.projectResDir, /^\//.test(url) ? '.' + url : url),
				type = imageMimeTypes[img.match(/(\.[a-zA-Z]{3})$/)[1]];
			
			if (afs.exists(img) && type) {
				if (!requireCacheWritten) {
					tiJS.push('require.cache({');
					requireCacheWritten = true;
				}
				
				first || tiJS.push(',\n');
				first = false;
				moduleCounter++;
				
				tiJS.push('"url:' + url + '":"data:' + type + ';base64,' + fs.readFileSync(img).toString('base64') + '"');
			}
		});
		
		requireCacheWritten && tiJS.push('});\n');
		
		// 4) write the ti.app.properties
		var props = this.tiapp.properties || {};
		this.tiapp.mobileweb.filesystem.backend && (props['ti.fs.backend'] = { type: 'string', value: this.tiapp.mobileweb.filesystem.backend });
		this.tiapp.mobileweb.map.backend && (props['ti.map.backend'] = { type: 'string', value: this.tiapp.mobileweb.map.backend });
		this.tiapp.mobileweb.map.apikey && (props['ti.map.apikey'] = { type: 'string', value: this.tiapp.mobileweb.map.apikey });
		
		tiJS.push('require("Ti/App/Properties", function(p) {\n');
		Object.keys(props).forEach(function (name) {
			var prop = props[name],
				type = prop.type || 'string';
			tiJS.push('\tp.set' + type.charAt(0).toUpperCase() + type.substring(1).toLowerCase() + '("'
				+ name.replace(/"/g, '\\"') + '",' + (type == 'string' ? '"' + prop.value.replace(/"/g, '\\"') + '"': prop.value) + ');\n');
		});
		tiJS.push('});\n');
		
		// 5) write require() to load all Ti modules
		this.modulesToLoad.sort();
		this.modulesToLoad = this.modulesToLoad.concat(this.tiModulesToLoad);
		tiJS.push('require(' + JSON.stringify(this.modulesToLoad) + ');\n');
		
		fs.writeFileSync(this.buildDir + '/titanium.js', tiJS.join(''));
		
		callback();
	},
	
	minifyJavaScript: function () {
		if (this.minifyJS) {
			this.logger.info(__('Minifying JavaScript'));
			var pro = uglify.uglify,
				self = this;
			(function walk(dir) {
				fs.readdirSync(dir).sort().forEach(function (dest) {
					var stat = fs.statSync(dir + '/' + dest);
					if (stat.isDirectory()) {
						walk(dir + '/' + dest);
					} else if (jsExtRegExp.test(dest)) {
						dest = dir + '/' + dest;
						var source = dest + '.uncompressed.js';
						fs.renameSync(dest, source);
						self.logger.debug(__('Minifying include %s', dest));
						fs.writeFileSync(dest, pro.gen_code(pro.ast_squeeze(pro.ast_mangle(uglify.parser.parse(fs.readFileSync(source).toString())))));
					}
				});
			}(this.buildDir))
		}
	},
	
	assembleTitaniumCSS: function (callback) {
		var tiCSS = [
			HEADER, '\n'
		];
		
		if (this.tiapp.mobileweb.splash.enabled) {
			var splashDir = this.projectResDir + '/mobileweb/splash',
				splashHtmlFile = splashDir + '/splash.html',
				splashCssFile = splashDir + '/splash.css';
			if (afs.exists(splashDir)) {
				this.logger.info(__('Processing splash screen'));
				afs.exists(splashHtmlFile) && (this.splashHtml = fs.readFileSync(splashHtmlFile));
				if (afs.exists(splashCssFile)) {
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
									imgType = imageMimeTypes[imgPath.match(/(\.[a-zA-Z]{3})$/)[1]];
									if (afs.exists(imgPath) && imgType) {
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
		afs.exists(commonCss) && tiCSS.push(fs.readFileSync(commonCss).toString());
		
		// TODO: need to rewrite absolute paths for urls
		
		// TODO: code below does NOT inline imports, nor remove them... do NOT use imports until themes are fleshed out
		
		var themePath = this.projectResDir + '/themes/' + this.theme;
		afs.exists(themePath) || (themePath = this.projectResDir + '/' + this.theme);
		afs.exists(themePath) || (themePath = this.mobilewebSdkPath + '/themes/' + this.theme);
		if (!afs.exists(themePath)) {
			this.logger.error(__('Unable to locate theme "%s"', this.theme) + '\n');
			process.exit(1);
		}
		
		wrench.readdirSyncRecursive(themePath).forEach(function (file) {
			/\.css$/.test(file) && tiCSS.push(fs.readFileSync(themePath + '/' + file).toString() + '\n');
		});
		
		// detect any fonts and add font face rules to the css file
		var fonts = {};
		wrench.readdirSyncRecursive(this.projectResDir).forEach(function (file) {
			var match = file.match(/^(.+)(\.otf|\.woff)$/);
			if (match) {
				fonts[match[0]] || (fonts[match[0]] = []);
				fonts[match[0]].push(file);
			}
		});
		Object.keys(fonts).forEach(function (name) {
			tiCSS.push('@font-face{font-family:' + name + ';src:url(' + fonts[name] + ');\n');
		});
		
		// TODO: minify the css
		
		// write the titanium.css
		fs.writeFileSync(this.buildDir + '/titanium.css', tiCSS.join(''));
		
		callback();
	},
	
	createIcons: function (callback) {
		this.logger.info(__('Creating favicon and Apple touch icons'));
		
		var file = this.projectResDir + '/' + this.tiapp.icon;
		if (!/\.(png|jpg|gif)$/.test(file) || !afs.exists(file)) {
			file = this.projectResDir + '/mobileweb/appicon.png';
		}
		
		if (afs.exists(file)) {
			appc.image.resize(file, [
				{ file: this.buildDir + '/favicon.png', width: 16, height: 16 },
				{ file: this.buildDir + '/apple-touch-icon-precomposed.png', width: 57, height: 57 },
				{ file: this.buildDir + '/apple-touch-icon-57x57-precomposed.png', width: 57, height: 57 },
				{ file: this.buildDir + '/apple-touch-icon-72x72-precomposed.png', width: 72, height: 72 },
				{ file: this.buildDir + '/apple-touch-icon-114x114-precomposed.png', width: 114, height: 114 },
			], function (err, stdout, stderr) {
				if (err) {
					this.logger.error(__('Failed to create icons'));
					stderr.toString().split('\n').forEach(function (line) {
						this.logger.error(line);
					});
					process.exit(1);
				}
				callback();
			});
		} else {
			callback();
		}
	},
	
	createFilesystemRegistry: function () {
		this.logger.info(__('Creating the filesystem registry'));
		var registry = 'ts\t' + fs.statSync(this.buildDir).ctime.getTime() + '\n' +
			(function walk(dir, depth) {
				var s = '';
				depth = depth | 0;
				fs.readdirSync(dir).sort().forEach(function (file) {
					// TODO: screen out specific file/folder patterns (i.e. uncompressed js files)
					var stat = fs.statSync(dir + '/' + file);
					if (stat.isDirectory()) {
						s += (depth ? (new Array(depth + 1)).join('\t') : '') + file + '\n' + walk(dir + '/' + file, depth + 1);
					} else {
						s += (depth ? (new Array(depth + 1)).join('\t') : '') + file + '\t' + stat.size + '\n';
					}
				});
				return s;
			}(this.buildDir)).trim();
		
		fs.writeFileSync(this.buildDir + '/titanium/filesystem.registry', registry);
		
		if (this.tiapp.mobileweb.filesystem.registry == 'preload') {
			fs.appendFileSync(this.buildDir + '/titanium.js', 'require.cache({"url:/titanium/filesystem.registry":"' + registry.replace(/\n/g, '|') + '"});');
		}
	},
	
	createIndexHtml: function () {
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
		fs.writeFileSync(this.buildDir + '/index.html', renderTemplate(fs.readFileSync(this.mobilewebSdkPath + '/src/index.html').toString().trim(), {
			ti_header: HTML_HEADER,
			project_name: this.tiapp.name || '',
			app_description: this.tiapp.description || '',
			app_publisher: this.tiapp.publisher || '',
			ti_generator: 'Appcelerator Titanium Mobile ' + ti.manifest.version,
			ti_statusbar_style: statusBarStyle,
			ti_css: fs.readFileSync(this.buildDir + '/titanium.css').toString(),
			splash_screen: this.splashHtml,
			ti_js: fs.readFileSync(this.buildDir + '/titanium.js').toString()
		}));
	},
	
	collapsePath: function (p) {
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
	},
	
	resolveModuleId: function (mid, ref) {
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
		if (/^\//.test(mid) || (parts.length == 1 && jsExtRegExp.test(mid))) return [this.buildDir, mid];
		/^\./.test(mid) && ref && (mid = this.collapsePath(ref + mid));
		parts = mid.split('/');
		
		for (var i = 0, l = this.packages.length; i < l; i++) {
			if (this.packages[i].name == parts[0]) {
				this.packages[i].name != 'Ti' && (mid = mid.replace(this.packages[i].name + '/', ''));
				return [this.collapsePath(this.buildDir + '/' + this.packages[i].location), mid];
			}
		}
		
		return [this.buildDir, mid];
	},
	
	parseDeps: function (deps) {
		var found = [],
			len = deps.length;
		if (len > 2) {
			deps.substring(1, len - 1).split(',').forEach(function (dep) {
				dep = dep.trim().split(' ')[0].trim();
				if (/^['"]/.test(dep)) {
					found.push(JSON.parse(dep));
				}
			});
		}
		return found;
	},
	
	parseModule: function (mid, ref) {
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
		
		var filename = dep[1];
		jsExtRegExp.test(filename) || (filename += '.js');
		
		var source = fs.readFileSync(dep[0] + '/' + filename).toString().substring(0, 1000), // define should be within the first 1000 bytes
			match = source.match(/define\(\s*(['"][^'"]*['"]\s*)?,?\s*(\[[^\]]+\])\s*?,?\s*(function|\{)/);
		
		if (!match) {
			this.moduleMap[mid] = [];
			return;
		}
		
		var deps = this.parseDeps(match[2]);
		for (var i = 0, l = deps.length; i < l; i++) {
			dep = deps[i];
			parts = dep.split('!');
			ref = mid.split('/');
			ref.pop();
			ref = ref.join('/') + '/';
			if (dep.charAt(0) == '.') {
				deps[i] = this.collapsePath(ref + dep);
			}
			if (parts.length == 1) {
				if (/^\.\//.test(dep)) {
					parts = mid.split('/');
					parts.pop();
					parts.push(dep);
					dep = this.collapsePath(parts.join('/'));
				}
				this.parseModule(dep, ref);
			} else {
				this.moduleMap[dep] = parts[0];
				this.parseModule(parts[0], mid);
				if (parts[0] == 'Ti/_/text') {
					if (/^\.\//.test(dep)) {
						parts = mid.split('/');
						parts.pop();
						parts.push(dep);
						dep = this.collapsePath(parts.join('/'));
					}
					this.parseModule(dep, ref);
				}
			}
		}
		this.moduleMap[mid] = deps;
	}

};

function badInstall(msg) {
	logger.error(msg + '\n');
	logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
	process.exit(1);
}

function applyDefaults(dest, src) {
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
}

function renderTemplate(template, props) {
	return template.replace(/\$\{([^\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key, format) {
		var parts = key.trim().split('|').map(function (s) { return s.trim(); });
		key = parts[0];
		var value = '' + (props.hasOwnProperty(key) ? props[key] : 'null');
		if (parts.length > 1) {
			parts[1].split(',').forEach(function (cmd) {
				if (cmd == 'h') {
					value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				} else if (cmd == 'trim') {
					value = value.trim();
				} else if (cmd == 'jsQuoteEscapeFilter') {
					value = value.replace(/\\"/g,'\\\\\\"');
				}
			});
		}
		return value;
	});
}