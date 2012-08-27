/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	fs = require('fs'),
	path = require('path'),
	semver = require('semver'),
	wrench = require('wrench');

function badInstall(msg) {
	logger.error(msg + '\n');
	logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
	process.exit(1);
}

function build(logger, config, cli, sdkVersion, lib) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	this.logger = logger;
	this.sdkVersion = sdkVersion;
	this.lib = lib;
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
	
	var pkgJson = this.readTiPackageJson();
	this.packages = [{
		name: pkgJson.name,
		location: './titanium',
		main: pkgJson.main
	}];
	
	this.tiapp = this.readTiappXml();
	
	this.validateTheme();
	this.copyFiles();
	this.findProjectDependencies();
	this.findModulesToCache();
	this.findPrecacheModules();
	this.findDistinctCachedModules();
	this.findPrecacheImages();
	this.locateTiModules();
	this.detectCircularDependencies();
	this.findI18N();
	
	this.logger.info(
		__n('Found %s dependency', 'Found %s dependencies', this.projectDependencies.length) + ', ' +
		__n('%s package', '%s packages', this.packages.length) + ', ' +
		__n('%s module', '%s modules', this.modulesToCache.length)
	);
	
	// TODO: break up the dependencies into layers
	
	// TODO: minify the project's code first
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
		this.theme = (this.tiapp.mobileweb && this.tiapp.mobileweb.theme) || 'default';
		if (!afs.exists(this.mwThemeDir + '/' + this.theme)) {
			logger.error(__('Unable to find the "%s" theme. Please verify the theme setting in the tiapp.xml.', this.theme) + '\n');
			process.exit(1);
		}
		this.logger.debug(__('Using %s theme', this.theme.cyan));
	},
	
	copyFiles: function () {
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
	},
	
	findProjectDependencies: function () {
		// TODO: have the code processor begin scan of project for dependencies
		this.logger.info(__('Finding all Titanium API dependencies'));
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
	},
	
	findModulesToCache: function () {
		this.logger.info(__('Finding all required modules to be cached'));
		this.projectDependencies.forEach(function (mid) {
			this.parseModule(mid);
		}, this);
		this.modulesToCache = this.modulesToCache.concat(Object.keys(this.requireCache));
	},
	
	findPrecacheModules: function () {
		this.logger.info(__('Finding all precached modules'));
		var mwTiapp = this.tiapp.mobileweb || {};
		if (mwTiapp.precache) {
			mwTiapp.precache.require && mwTiapp.precache.require.forEach(function (x) {
				this.modulesToCache.push('commonjs:' + x);
			}, this);
			mwTiapp.precache.includes && mwTiapp.precache.includes.forEach(function (x) {
				this.modulesToCache.push('url:' + x);
			}, this);
		}
	},
	
	findDistinctCachedModules: function () {
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
	},
	
	findPrecacheImages: function () {
		this.logger.info(__('Finding all precached images'));
		this.moduleMap['Ti/UI/TableViewRow'] && this.precacheImages.push('/themes/' + this.theme + '/UI/TableViewRow/child.png');
		var images = (this.tiapp.mobileweb && this.tiapp.mobileweb.precache && this.tiapp.mobileweb.precache.images) || [];
		images && (this.precacheImages = this.precacheImages.concat(images));
	},
	
	locateTiModules: function () {
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
	},
	
	detectCircularDependencies: function () {
		this.modulesToCache.forEach(function (m) {
			var deps = this.moduleMap[m];
			deps && deps.forEach(function (d) {
				if (this.moduleMap[d] && this.moduleMap[d].indexOf(m) != -1) {
					this.logger.warn(__('Circular dependency detected: %s dependent on %s'), m, d);
				}
			}, this);
		}, this);
	},
	
	findI18N: function () {
		var appNames = {},
			locales = [],
			i18nDir = this.projectDir + '/i18n';
		
		if (afs.exists(i18nDir)) {
			this.logger.info(__('Processing i18n strings'));
			this.logger.debug(__('Reading i18n directory: %s', i18nDir.cyan));
			fs.readdirSync(i18nDir).forEach(function (dir) {
				/*
				var appXmlFile = this.loadI18N(i18nDir + '/' + dir + '/' + app.xml);
				appXml = self.load_i18n(os.path.join(self.i18n_path, dir, 'app.xml'))
				if appXml is not None and 'appname' in appXml:
					app_names[dir] = appXml['appname']
				strings = self.load_i18n(os.path.join(self.i18n_path, dir, 'strings.xml'))
				if strings is not None:
					locales.append(dir)
					locale_path = os.path.join(self.build_path, 'titanium', 'Ti', 'Locale', dir)
					try:
						os.makedirs(locale_path)
					except:
						pass
					i18n_file = codecs.open(os.path.join(locale_path, 'i18n.js'), 'w', 'utf-8')
					i18n_file.write('define(%s);' % simplejson.dumps(strings))
					i18n_file.close()
					if dir in tiapp_xml['precache']['locales']:
						self.modules_to_cache.append('Ti/Locale/%s/i18n' % dir)
				*/
			});
		}
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

module.exports = build;