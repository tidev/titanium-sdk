/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	hitch = appc.util.hitch,
	xml = appc.xml,
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	semver = require('semver'),
	wrench = require('wrench'),
	DOMParser = require('xmldom').DOMParser,
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
		].join('\n');

function badInstall(msg) {
	logger.error(msg + '\n');
	logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
	process.exit(1);
}

function build(logger, config, cli, sdkVersion, lib, finished) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	this.logger = logger;
	this.sdkVersion = sdkVersion;
	this.lib = lib;
	this.buildType = cli.argv['build-type'];
	this.os = cli.env.os;
	
	this.projectDir = afs.resolvePath(cli.argv.dir);
	this.projectResDir = this.projectDir + '/Resources';
	this.buildDir = this.projectDir + '/build/mobileweb';
	this.mwPath = afs.resolvePath(path.dirname(module.filename) + '/../..');
	this.mwThemeDir = this.mwPath + '/themes';
	this.mwTitaniumDir = this.mwPath + '/titanium';
	
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
	
	var pkgJson = this.readTiPackageJson();
	this.packages = [{
		name: pkgJson.name,
		location: './titanium',
		main: pkgJson.main
	}];
	
	// read the tiapp.xml and initialize some sensible defaults
	this.tiapp = this.readTiappXml();
	applyDefaults(this.tiapp, {
		'mobileweb': {
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
				'enabled': true,
				'inline-css-images': true
			},
			theme: 'default'
		}
	});
	
	this.validateTheme();
	
	var mwBuildSettings = this.tiapp.mobileweb.build[this.buildType];
	this.minifyJS = mwBuildSettings && mwBuildSettings.js ? !!mwBuildSettings.js.minify : this.buildType == 'production';
	
	var self = this;
	async.parallel([
		hitch(self, 'copyFiles'),
		hitch(self, 'findProjectDependencies')
	], function () {
		async.parallel([
			hitch(self, 'findModulesToCache'),
			hitch(self, 'findPrecacheModules'),
			hitch(self, 'findPrecacheImages'),
			hitch(self, 'findTiModules'),
			hitch(self, 'findI18N')
		], hitch(self, function () {
			async.parallel([
				hitch(self, 'findDistinctCachedModules'),
				hitch(self, 'detectCircularDependencies')
			], function () {
				self.logger.info(
					__n('Found %s dependency', 'Found %s dependencies', self.projectDependencies.length) + ', ' +
					__n('%s package', '%s packages', self.packages.length) + ', ' +
					__n('%s module', '%s modules', self.modulesToCache.length)
				);
				async.parallel([
					hitch(self, "assembleTitaniumJS"),
					hitch(self, "assembleTitaniumCSS"),
					hitch(self, "createIcons"),
					hitch(self, "createFilesystemRegistry"),
				], hitch(self, function () {
					self.createIndexHtml();
					finished();
				}));
			});
		}));
	});
	
	//this.copyFiles();
	//this.findProjectDependencies();
	//this.findModulesToCache();
	//this.findPrecacheModules();
	//this.findDistinctCachedModules();
	//this.findPrecacheImages();
	//this.findTiModules();
	//this.detectCircularDependencies();
	//this.findI18N();
	
	//this.logger.info(
	//	__n('Found %s dependency', 'Found %s dependencies', this.projectDependencies.length) + ', ' +
	//	__n('%s package', '%s packages', this.packages.length) + ', ' +
	//	__n('%s module', '%s modules', this.modulesToCache.length)
	//);
	
	//this.assembleTitaniumJS();
	//this.assembleTitaniumCSS();
	//this.createIcons();
	//this.createFilesystemRegistry();
	//this.createIndexHtml();
};

build.prototype = {

	readTiPackageJson: function () {
		this.logger.info(__('Reading Titanium Mobile Web package.json file'));
		var mwPackageFile = this.mwPath + '/titanium/package.json';
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
		return new appc.tiappxml(tiappFile);
	},
	
	validateTheme: function () {
		this.logger.info(__('Validating theme'));
		this.theme = this.tiapp.mobileweb.theme || 'default';
		if (!afs.exists(this.mwThemeDir + '/' + this.theme)) {
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
		afs.copyDirSyncRecursive(this.mwThemeDir, this.buildDir + '/themes', { preserve: true, logger: this.logger.debug });
		afs.copyDirSyncRecursive(this.mwTitaniumDir, this.buildDir + '/titanium', { preserve: true, logger: this.logger.debug });
		afs.copyDirSyncRecursive(this.projectResDir, this.buildDir, { preserve: true, logger: this.logger.debug }, this.lib.availablePlatforms.filter(function (p) { return p != 'mobileweb'; }));
		afs.copyDirSyncRecursive(this.projectResDir + '/mobileweb', this.buildDir + '/mobileweb', { preserve: true, logger: this.logger.debug }, ['apple_startup_images', 'splash']);
		afs.copyFileSync(this.projectResDir + '/mobileweb/apple_startup_images/Default.jpg', this.buildDir + '/mobileweb/apple_startup_images', { logger: this.logger.debug });
		afs.copyFileSync(this.projectResDir + '/mobileweb/apple_startup_images/Default-Portrait.jpg', this.buildDir + '/mobileweb/apple_startup_images', { logger: this.logger.debug });
		afs.copyFileSync(this.projectResDir + '/mobileweb/apple_startup_images/Default-Landscape.jpg', this.buildDir + '/mobileweb/apple_startup_images', { logger: this.logger.debug });
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
		var modules = (this.tiapp.modules || []).filter(function (m) { return /^(|mobileweb|commonjs)$/.test(m.platform); });
		if (!modules.length) {
			return;
		}
		
		this.logger.info(__('Locating Titanium Mobile Modules'));
		
		var sdkVersion = this.sdkVersion.split('.').slice(0, 3).join('.'),
			sdkPaths = this.os.sdkPaths,
			searchPaths = [
				this.projectDir + '/modules/__ID__/__VERSION__/mobileweb',
				this.projectDir + '/modules/__ID__/__VERSION__/commonjs',
				this.projectDir + '/modules/mobileweb/__ID__/__VERSION__',
				this.projectDir + '/modules/commonjs/__ID__/__VERSION__'
			];
		
		sdkPaths.forEach(function (p) {
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
			
			var mainFilePath = path.join(moduleDir, libDir, (pkgJson.main || '').replace(/\.js$/, '') + '.js')
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
			configProps = {
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
				ti_githash: this.lib.manifest.githash,
				ti_timestamp: this.lib.manifest.timestamp,
				ti_version: this.sdkVersion,
				has_analytics_use_xhr: tiapp.mobileweb.analytics ? tiapp.mobileweb.analytics['use-xhr'] === true : false,
				has_show_errors: this.buildType != 'production' && tiapp.mobileweb['disable-error-screen'] !== true,
				has_instrumentation: !!tiapp.mobileweb.instrumentation
			},
			tiJS = [
				HEADER, '\n',
				
				// 1) read in the config.js and fill in the template
				fs.readFileSync(this.mwPath + '/src/config.js').toString().replace(/\$\{([^\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key, format) {
					var parts = key.trim().split('|').map(function (s) { return s.trim(); });
					key = parts[0];
					var value = '' + (configProps.hasOwnProperty(key) ? configProps[key] : 'null');
					return parts.length > 1 && parts[1] == 'jsQuoteEscapeFilter' ? value.replace(/\\"/g,'\\\\\\"') : value;
				}), '\n', '\n'
			];
		
		// 2) copy in instrumentation if it's enabled
		!tiapp.mobileweb.instrumentation || tiJS.push(fs.readFileSync(this.mwPath + '/src/instrumentation.js').toString() + '\n');
		
		// 3) copy in the loader
		tiJS.push(fs.readFileSync(this.mwPath + '/src/loader.js').toString() + '\n\n');
		
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
			
			var file = path.join(dep[0], /\.js$/.test(dep[1]) ? dep[1] : dep[1] + '.js');
			
			if (/^url\:/.test(moduleName)) {
				var source = file + '.uncompressed.js';
				if (this.minifyJS) {
/*
					os.rename(file_path, source)
					print '[INFO] Minifying include %s' % file_path
					p = subprocess.Popen('java -Xms256m -Xmx256m -jar "%s" --compilation_level SIMPLE_OPTIMIZATIONS --js "%s" --js_output_file "%s"' % (os.path.join(self.sdk_path, 'closureCompiler', 'compiler.jar'), source, file_path), shell=True, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
					stdout, stderr = p.communicate()
					if p.returncode != 0:
						print '[ERROR] Failed to minify "%s"' % file_path
						for line in stderr.split('\n'):
							if len(line):
								print '[ERROR]    %s' % line
						print '[WARN] Leaving %s un-minified' % file_path
						os.remove(file_path)
						shutil.copy(source, file_path)
*/
				}
				tiJS.push('"' + moduleName + '":"' + fs.readFileSync(file).toString().trim().replace(/\\/g, '\\\\').replace(/\n/g, '\\n\\\n').replace(/\\"/g, '\\\"') + '"');
			} else if (isCommonJS) {
				tiJS.push('"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\ndefine(function(require,exports,module{\n' + fs.readFileSync(file).toString() + '\n});\n}');
			} else {
				tiJS.push('"' + moduleName + '":function(){\n/* ' + file.replace(this.buildDir, '') + ' */\n\n' + fs.readFileSync(file).toString() + '\n}');
			}
		}, this);
		
		var imageMimeTypes = {
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.jpg': 'image/jpg',
			'.jpeg': 'image/jpg'
		};
		
		this.precacheImages.forEach(function (url) {
			url = url.replace(/\\/g, '/');
			
			var img = path.join(this.projectResDir, /^\//.test(url) ? '.' + url : url),
				type = imageMimeTypes[img.match(/\.([a-zA-Z]+)$/)[1]];
			
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
		var props = this.tiapp.properties;
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
	
	assembleTitaniumCSS: function (callback) {
		this.logger.info(__('Assembling splash screen'));
		/*
		splash_html = ''
		splash_css = ''
		if tiapp_xml['mobileweb']['splash']['enabled'] == 'true':
			print '[INFO] Processing splash screen...'
			splash_path = os.path.join(self.project_path, 'Resources', 'mobileweb', 'splash')
			splash_root_path = os.path.join(self.project_path, 'Resources')
			if not os.path.exists(splash_path):
				splash_path = os.path.join(self.sdk_path, 'splash')
				splash_root_path = splash_path
			splash_html_file = os.path.join(splash_path, 'splash.html')
			splash_css_file = os.path.join(splash_path, 'splash.css')
			if os.path.exists(splash_html_file):
				splash_html = codecs.open(splash_html_file, 'r', 'utf-8').read()
			if os.path.exists(splash_css_file):
				splash_css = codecs.open(splash_css_file, 'r', 'utf-8').read()
				if tiapp_xml['mobileweb']['splash']['inline-css-images'] == 'true':
					parts = splash_css.split('url(')
					for i in range(1, len(parts)):
						j = parts[i].find(')')
						if j != -1:
							img = parts[i][:j].replace('"', '').replace('\'', '').strip()
							if img.find('data:') == -1:
								if img[1] == '/':
									img_path = os.path.join(splash_root_path, img[1:])
								else:
									img_path = os.path.join(splash_path, img)
								if os.path.exists(img_path):
									fname, ext = os.path.splitext(img_path.lower())
									if ext in image_mime_types:
										parts[i] = 'data:%s;base64,%s%s' % (image_mime_types[ext], base64.b64encode(open(img_path,'rb').read()), parts[i][j:])
					splash_css = 'url('.join(parts)
		*/
		
		this.logger.info(__('Assembling titanium.css'));
		/*
		ti_css = HEADER + '\n' + splash_css + '\n' + codecs.open(os.path.join(self.themes_path, 'common.css'), 'r', 'utf-8').read()
		# TODO: need to rewrite absolute paths for urls
		
		# TODO: code below does NOT inline imports, nor remove them... do NOT use imports until themes are fleshed out
		
		if len(theme):
			theme_path = os.path.join(self.resources_path, 'themes', theme)
			if not os.path.exists(theme_path):
				theme_path = os.path.join(self.resources_path, theme)
			if not os.path.exists(theme_path):
				theme_path = os.path.join(self.themes_path, theme)
			if not os.path.exists(theme_path):
				print '[ERROR] Unable to locate theme "%s"' % theme
			else:
				for dirname, dirnames, filenames in os.walk(theme_path):
					for filename in filenames:
						fname, ext = os.path.splitext(filename.lower())
						if ext == '.css':
							ti_css += codecs.open(os.path.join(dirname, filename), 'r', 'utf-8').read()
		
		# detect any fonts and add font face rules to the css file
		fonts = {}
		for dirname, dirnames, filenames in os.walk(self.resources_path):
			for filename in filenames:
				fname, ext = os.path.splitext(filename.lower())
				if ext == '.otf' or ext == '.woff':
					if not fname in fonts:
						fonts[fname] = []
					fonts[fname].append(os.path.join(dirname, filename)[len(self.resources_path):])
		for font in fonts:
			ti_css += '@font-face{font-family:%s;src:url(%s);}\n' % (font, '),url('.join(fonts[font]))
		
		# minify the css
		if self.minify:
			ti_css = CSSPacker(ti_css).pack()
		
		# write the titanium.css
		ti_css_file = codecs.open(os.path.join(self.build_path, 'titanium.css'), 'w', 'utf-8')
		ti_css_file.write(ti_css)
		ti_css_file.close()
		*/
		
		callback();
	},
	
	createIcons: function (callback) {
		this.logger.info(__('Creating favicon and Apple touch icons'));
		/*
		icon_file = os.path.join(self.resources_path, tiapp_xml['icon'])
		fname, ext = os.path.splitext(icon_file.lower())
		if os.path.exists(icon_file) and (ext == '.png' or ext == '.jpg' or ext == '.gif'):
			self.build_icons(icon_file)
		else:
			icon_file = os.path.join(self.resources_path, 'mobileweb', 'appicon.png')
			if os.path.exists(icon_file):
				self.build_icons(icon_file)
		*/
		callback();
	},
	
	createFilesystemRegistry: function (callback) {
		this.logger.info(__('Creating the filesystem registry'));
		/*
		filesystem_registry = 'ts\t' + str(int(os.path.getctime(self.build_path)) * 1000) + '\n' + self.walk_fs(self.build_path, 0)
		filesystem_registry_file = codecs.open(os.path.join(self.build_path, 'titanium', 'filesystem.registry'), 'w', 'utf-8')
		filesystem_registry_file.write(filesystem_registry)
		filesystem_registry_file.close()
		
		// if we're preloading the filesystem registry, write it to the require cache
		if tiapp_xml['mobileweb']['filesystem']['registry'] == 'preload':
			ti_js = codecs.open(self.ti_js_file, 'a', 'utf-8')
			ti_js.write('require.cache({"url:/titanium/filesystem.registry":"' + filesystem_registry.strip().replace('\n', '|') + '"});')
			ti_js.close()
		*/
		callback()
	},
	
	createIndexHtml: function () {
		this.logger.info(__('Creating the index.html'));
		/*
		// get status bar style
		status_bar_style = 'default'
		if 'statusbar-style' in tiapp_xml:
			status_bar_style = tiapp_xml['statusbar-style']
			if status_bar_style == 'opaque_black' or status_bar_style == 'opaque':
				status_bar_style = 'black'
			elif status_bar_style == 'translucent_black' or status_bar_style == 'transparent' or status_bar_style == 'translucent':
				status_bar_style = 'black-translucent'
			else:
				status_bar_style = 'default'
		
		# populate index.html
		index_html_file = codecs.open(os.path.join(self.build_path, 'index.html'), 'w', 'utf-8')
		index_html_file.write(AppcTemplate(codecs.open(os.path.join(self.sdk_src_path, 'index.html'), 'r', 'utf-8').read().strip(), input_encoding='utf-8', output_encoding='utf-8').render(
			ti_header          = HTML_HEADER,
			project_name       = tiapp_xml['name'] or '',
			app_description    = tiapp_xml['description'] or '',
			app_publisher      = tiapp_xml['publisher'] or '',
			splash_screen      = splash_html,
			ti_generator       = 'Appcelerator Titanium Mobile ' + sdk_version,
			ti_statusbar_style = status_bar_style,
			ti_css             = ti_css,
			ti_js              = codecs.open(self.ti_js_file, 'r', 'utf-8').read()
		))
		index_html_file.close()
		*/
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
		if (/^\//.test(mid) || (parts.length == 1 && /\.js$/.test(mid))) return [this.buildDir, mid];
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
		/\.js$/.test(filename) || (filename += '.js');
		
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

module.exports = build;