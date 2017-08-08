/**
* Android module build command.
*
* @module cli/_buildModule
*
* @copyright
* Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
*
* @license
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

var AdmZip = require('adm-zip'),
	androidDetect = require('../lib/detect').detect,
	appc = require('node-appc'),
	archiver = require('archiver'),
	async = require('async'),
	Builder = require('../lib/base-builder'),
	crypto = require('crypto'),
	ejs = require('ejs'),
	fs = require('fs'),
	jsanalyze = require('node-titanium-sdk/lib/jsanalyze'),
	markdown = require('markdown').markdown,
	path = require('path'),
	temp = require('temp'),
	util = require('util'),
	wrench = require('wrench'),
	spawn = require('child_process').spawn,
	SymbolLoader = require('appc-aar-tools').SymbolLoader,
	SymbolWriter = require('appc-aar-tools').SymbolWriter,

	__ = appc.i18n(__dirname).__,
	version = appc.version;

function AndroidModuleBuilder() {
	Builder.apply(this, arguments);

	this.minSupportedApiLevel = parseInt(this.packageJson.minSDKVersion);
	this.minTargetApiLevel = parseInt(version.parseMin(this.packageJson.vendorDependencies['android sdk']));
	this.maxSupportedApiLevel = parseInt(version.parseMax(this.packageJson.vendorDependencies['android sdk']));
}

util.inherits(AndroidModuleBuilder, Builder);

AndroidModuleBuilder.prototype.validate = function validate(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);
	Builder.prototype.validate.apply(this, arguments);

	return function (finished) {
		this.projectDir = cli.argv['project-dir'];
		this.buildOnly = cli.argv['build-only'];

		this.cli = cli;
		this.logger = logger;

		this.manifest = this.cli.manifest;

		// detect android environment
		androidDetect(config, { packageJson: this.packageJson }, function (androidInfo) {
			this.androidInfo = androidInfo;

			if (!this.androidInfo.ndk) {
				logger.error(__('Unable to find a suitable installed Android NDK.') + '\n');
				process.exit(1);
			}

			var targetSDKMap = {};
			Object.keys(this.androidInfo.targets).forEach(function (id) {
				var t = this.androidInfo.targets[id];
				if (t.type == 'platform') {
					targetSDKMap[t.id.replace('android-', '')] = t;
				}
			}, this);

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
					logger.error(__('Unable to find a suitable installed Android SDK that is >=%s and <=%s', this.minSupportedApiLevel, this.maxSupportedApiLevel) + '\n');
					process.exit(1);
				}
			}

			// check that we have this target sdk installed
			this.androidTargetSDK = targetSDKMap[this.targetSDK];

			if (!this.androidTargetSDK) {
				logger.error(__('Target Android SDK %s is not installed', this.targetSDK) + '\n');

				var sdks = Object.keys(targetSDKMap).filter(function (ver) {
					return ver > this.minSupportedApiLevel;
				}.bind(this)).sort().filter(function (s) { return s >= this.minSDK; }, this);

				if (sdks.length) {
					logger.log(__('To target Android SDK %s, you first must install it using the Android SDK manager.', String(this.targetSDK).cyan) + '\n');
					logger.log(
						appc.string.wrap(
							__('Alternatively, you can set the %s in the %s section of the tiapp.xml to one of the following installed Android target SDKs: %s', '<uses-sdk>'.cyan, '<android> <manifest>'.cyan, sdks.join(', ').cyan),
							config.get('cli.width', 100)
						)
					);
					logger.log();
					logger.log('<ti:app xmlns:ti="http://ti.appcelerator.org">'.grey);
					logger.log('    <android>'.grey);
					logger.log('        <manifest>'.grey);
					logger.log(('            <uses-sdk '
						+ (this.minSDK ? 'android:minSdkVersion="' + this.minSDK + '" ' : '')
						+ 'android:targetSdkVersion="' + sdks[0] + '" '
						+ (this.maxSDK ? 'android:maxSdkVersion="' + this.maxSDK + '" ' : '')
						+ '/>').magenta);
					logger.log('        </manifest>'.grey);
					logger.log('    </android>'.grey);
					logger.log('</ti:app>'.grey);
					logger.log();
				} else {
					logger.log(__('To target Android SDK %s, you first must install it using the Android SDK manager', String(this.targetSDK).cyan) + '\n');
				}
				process.exit(1);
			}

			if (!this.androidTargetSDK.androidJar) {
				logger.error(__('Target Android SDK %s is missing "android.jar"', this.targetSDK) + '\n');
				process.exit(1);
			}

			if (this.targetSDK < this.minSDK) {
				logger.error(__('Target Android SDK version must be %s or newer', this.minSDK) + '\n');
				process.exit(1);
			}

			if (this.maxSDK && this.maxSDK < this.targetSDK) {
				logger.error(__('Maximum Android SDK version must be greater than or equal to the target SDK %s, but is currently set to %s', this.targetSDK, this.maxSDK) + '\n');
				process.exit(1);
			}

			if (this.maxSupportedApiLevel && this.targetSDK > this.maxSupportedApiLevel) {
				// print warning that version this.targetSDK is not tested
				logger.warn(__('Building with Android SDK %s which hasn\'t been tested against Titanium SDK %s', (''+this.targetSDK).cyan, this.titaniumSdkVersion));
			}

			// get the javac params
			this.javacMaxMemory = cli.timodule.properties['android.javac.maxmemory'] && cli.timodule.properties['android.javac.maxmemory'].value || config.get('android.javac.maxMemory', '256M');
			this.javacSource = cli.timodule.properties['android.javac.source'] && cli.timodule.properties['android.javac.source'].value || config.get('android.javac.source', '1.6');
			this.javacTarget = cli.timodule.properties['android.javac.target'] && cli.timodule.properties['android.javac.target'].value || config.get('android.javac.target', '1.6');
			this.dxMaxMemory = cli.timodule.properties['android.dx.maxmemory'] && cli.timodule.properties['android.dx.maxmemory'].value || config.get('android.dx.maxMemory', '1024M');

			// detect java development kit
			appc.jdk.detect(config, null, function (jdkInfo) {
				if (!jdkInfo.version) {
					logger.error(__('Unable to locate the Java Development Kit') + '\n');
					logger.log(__('You can specify the location by setting the %s environment variable.', 'JAVA_HOME'.cyan) + '\n');
					process.exit(1);
				}

				if (!version.satisfies(jdkInfo.version, this.packageJson.vendorDependencies.java)) {
					logger.error(__('JDK version %s detected, but only version %s is supported', jdkInfo.version, this.packageJson.vendorDependencies.java) + '\n');
					process.exit(1);
				}

				this.jdkInfo = jdkInfo;

				finished();
			}.bind(this));
		}.bind(this));
	}.bind(this);
};

AndroidModuleBuilder.prototype.run = function run(logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	appc.async.series(this, [
		function (next) {
			cli.emit('build.module.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',
		'loginfo',

		function (next) {
			cli.emit('build.module.pre.compile', this, next);
		},

		'processResources',
		'compileAidlFiles',
		'compileModuleJavaSrc',
		'generateRuntimeBindings',
		'generateV8Bindings',
		'compileJsClosure',
		'compileJS',
		'jsToC',
		'verifyBuildArch',
		'ndkBuild',
		'ndkLocalBuild',
		'compileAllFinal',
		'packageZip',
		'runModule',

		function (next) {
			cli.emit('build.module.post.compile', this, next);
		}
	], function (err) {
		cli.emit('build.module.finalize', this, function () {
			finished(err);
		});
	});

};

AndroidModuleBuilder.prototype.dirWalker = function dirWalker(currentPath, callback) {
	fs.readdirSync(currentPath).forEach(function (name, i, arr) {
		var currentFile = path.join(currentPath, name);
		if (fs.statSync(currentFile).isDirectory()) {
			this.dirWalker(currentFile, callback);
		} else {
			callback(currentFile, name, i, arr);
		}
	}, this);
};

AndroidModuleBuilder.prototype.doAnalytics = function doAnalytics(next) {
	var cli = this.cli,
		manifest = this.manifest,
		eventName = 'android.' + cli.argv.type;

	cli.addAnalyticsEvent(eventName, {
		dir: cli.argv['project-dir'],
		name: manifest.name,
		publisher: manifest.author,
		appid: manifest.moduleid,
		description: manifest.description,
		type: cli.argv.type,
		guid: manifest.guid,
		version: manifest.version,
		copyright: manifest.copyright,
		date: (new Date()).toDateString()
	});

	next();
};

AndroidModuleBuilder.prototype.initialize = function initialize(next) {
	this.tiSymbols = {};
	this.metaData = [];
	this.documentation = [];
	this.classPaths = {};
	this.classPaths[this.androidTargetSDK.androidJar] = 1;
	this.manifestFile = path.join(this.projectDir, 'manifest');

	['lib', 'modules', ''].forEach(function (folder) {
		var jarDir = path.join(this.platformPath, folder);

		fs.existsSync(jarDir) && fs.readdirSync(jarDir).forEach(function (name) {
			var file = path.join(jarDir, name);
			if (/\.jar$/.test(name) && fs.existsSync(file)) {
				this.classPaths[file] = 1;
			}
		}, this);
	}, this);

	this.dependencyJsonFile = path.join(this.platformPath, 'dependency.json');
	this.templatesDir = path.join(this.platformPath, 'templates', 'build');
	this.moduleIdSubDir = this.manifest.moduleid.split('.').join(path.sep);

	['assets', 'documentation', 'example', 'platform', 'Resources'].forEach(function (folder) {
		var dirName = folder.toLowerCase() + 'Dir';
		this[dirName] = path.join(this.projectDir, folder);
		if (!fs.existsSync(this[dirName])) {
			this[dirName] = path.join(this.projectDir, '..', folder);
		}
	}, this);

	this.hooksDir = path.join(this.projectDir, 'hooks');
	this.sharedHooksDir = path.resolve(this.projectDir, '..', 'hooks');

	this.timoduleXmlFile = path.join(this.projectDir, 'timodule.xml');
	this.licenseFile = path.join(this.projectDir, 'LICENSE');
	if (!fs.existsSync(this.licenseFile)) {
		this.licenseFile = path.join(this.projectDir, '..', 'LICENSE');
	}
	this.localJinDir = path.join(this.projectDir, 'jni');
	this.javaSrcDir = path.join(this.projectDir, 'src');
	this.distDir = path.join(this.projectDir, 'dist');
	this.buildDir = path.join(this.projectDir, 'build');
	this.libsDir = path.join(this.projectDir, 'libs');
	this.projLibDir = path.join(this.projectDir, 'lib');

	this.buildClassesDir = path.join(this.buildDir, 'classes');
	this.buildClassesGenDir = path.join(this.buildClassesDir, 'org', 'appcelerator', 'titanium', 'gen');
	this.buildGenDir = path.join(this.buildDir, 'generated');
	this.buildIntermediatesDir = path.join(this.buildDir, 'intermediates');

	this.buildGenJsDir = path.join(this.buildGenDir, 'js');
	this.buildGenJniDir = path.join(this.buildGenDir, 'jni');
	this.buildGenLibsDir = path.join(this.buildGenDir, 'libs');
	this.buildGenJniLocalDir = path.join(this.buildGenDir, 'jni-local');
	this.buildGenJavaDir = path.join(this.buildGenDir, 'java');
	this.buildGenJsonDir = path.join(this.buildGenDir, 'json');
	this.buildGenRDir = path.join(this.buildGenDir, 'r');

	this.buildGenAssetJavaFile = path.join(this.buildGenJavaDir, this.moduleIdSubDir, 'AssetCryptImpl.java');

	this.buildJsonSubDir = path.join('org', 'appcelerator', 'titanium' ,'bindings');
	this.buildGenJsonFile = path.join(this.buildGenJsonDir, this.buildJsonSubDir, this.manifest.name + '.json');
	this.metaDataFile = path.join(this.buildGenJsonDir, 'metadata.json');

	// Original templates under this.titaniumSdkPath/module/android/generated
	this.moduleGenTemplateDir = path.join(this.platformPath, 'templates', 'module', 'generated');
	this.jsTemplateFile = path.join(this.moduleGenTemplateDir, 'bootstrap.js.ejs');
	this.gperfTemplateFile = path.join(this.moduleGenTemplateDir, 'bootstrap.gperf.ejs');
	this.javaTemplateFile = path.join(this.moduleGenTemplateDir, '{{ModuleIdAsIdentifier}}Bootstrap.java.ejs');
	this.cppTemplateFile = path.join(this.moduleGenTemplateDir, '{{ModuleIdAsIdentifier}}Bootstrap.cpp.ejs');
	this.btJsToCppTemplateFile = path.join(this.moduleGenTemplateDir, 'BootstrapJS.cpp.ejs');
	this.androidMkTemplateFile = path.join(this.moduleGenTemplateDir, 'Android.mk.ejs');
	this.applicationMkTemplateFile = path.join(this.moduleGenTemplateDir, 'Application.mk.ejs');
	this.commonJsSourceTemplateFile = path.join(this.moduleGenTemplateDir,'CommonJsSourceProvider.java.ejs');
	this.assetCryptImplTemplateFile = path.join(this.moduleGenTemplateDir,'AssetCryptImpl.java.ejs');

	this.moduleJarName = this.manifest.name + '.jar';
	this.moduleJarFile = path.join(this.distDir, this.moduleJarName);

	// Add additional jar files in module lib folder to this.classPaths
	fs.existsSync(this.projLibDir) && fs.readdirSync(this.projLibDir).forEach(function (name) {
		var file = path.join(this.projLibDir, name);
		if (/\.jar$/.test(name) && fs.existsSync(file)) {
			this.classPaths[file] = 1;
		}
	}, this);

	next();
};

AndroidModuleBuilder.prototype.loginfo = function loginfo() {
	this.logger.info(__('javac Max Memory: %s', this.javacMaxMemory));
	this.logger.info(__('javac Source: %s', this.javacSource));
	this.logger.info(__('javac Target: %s', this.javacTarget));
	this.logger.info(__('dx Max Memory: %s', this.dxMaxMemory));

	this.logger.info(__('buildBinClassesDir: %s', this.buildClassesDir.cyan));
	this.logger.info(__('Assets Dir: %s', this.assetsDir.cyan));
	this.logger.info(__('Documentation Dir: %s', this.documentationDir.cyan));
	this.logger.info(__('Example Dir: %s', this.exampleDir.cyan));
	this.logger.info(__('Platform Dir: %s', this.platformDir.cyan));
	this.logger.info(__('Resources Dir: %s', this.resourcesDir.cyan));
};

/**
 * Processes resources for this module.
 *
 * This step will generate R classes for this module, our core modules and any
 * bundled AAR files.
 *
 * @param {Function} next Function to call once the resource processing is complete
 */
AndroidModuleBuilder.prototype.processResources = function processResources(next) {
	var bundlesPath = path.join(this.buildIntermediatesDir, 'bundles');
	var mergedResPath = path.join(this.buildIntermediatesDir, 'res/merged');
	var extraPackages = [];
	var merge = function (src, dest) {
		fs.readdirSync(src).forEach(function (filename) {
			var from = path.join(src, filename),
				to = path.join(dest, filename);
			if (fs.existsSync(from)) {
				if (fs.statSync(from).isDirectory()) {
					merge(from, to);
				} else if (path.extname(filename) === '.xml') {
					this.writeXmlFile(from, to);
				} else {
					appc.fs.copyFileSync(from, to, { logger: this.logger.debug });
				}
			}
		}, this);
	}.bind(this);

	this.logger.info(__('Processing Android module resources and assets'));
	var tasks = [
		/**
		 * Merges all resources from custom module, its bundled AAR files and our core
		 * modules.
		 *
		 * @param {Function} cb Function to call once all resources were merged
		 */
		function mergeResources(cb) {
			this.logger.info(__('Merging resources'));

			if (fs.existsSync(mergedResPath)) {
				wrench.rmdirSyncRecursive(mergedResPath);
				wrench.mkdirSyncRecursive(mergedResPath);
			}

			appc.async.series(this, [
				/**
				 * Merges the resources from core modules into the build intermediates folder.
				 *
				 * Prior to supporting Android Archives we would manually extract .aar files
				 * and zip up their resources as a .res.zip and save their package name to a
				 * .respackage file to recreate the R class from that. Until we add support
				 * for Android Archives in core modules we need to do this special step to
				 * handle their resources.
				 *
				 * @param {Function} callback Function to call once the resources merging is complete
				 */
				function mergeCoreModuleResource(callback) {
					var resArchives = [];
					var modulesPath = path.join(this.platformPath, 'modules');
					var explodedModuleResPath = path.join(this.buildIntermediatesDir, 'res/timodules');
					fs.readdirSync(modulesPath).forEach(function (file) {
						if (path.extname(file) !== '.jar') {
							return;
						}
						var resArchivePathAndFilename = path.join(modulesPath, file.replace(/\.jar$/, '.res.zip'));
						var respackagePathAndFilename = path.join(modulesPath, file.replace(/\.jar$/, '.respackage'));
						if (fs.existsSync(resArchivePathAndFilename) && fs.existsSync(respackagePathAndFilename)) {
							extraPackages.push(fs.readFileSync(respackagePathAndFilename).toString().split('\n').shift().trim());
							resArchives.push(resArchivePathAndFilename);
						}
					}, this);

					if (resArchives.length === 0) {
						return callback();
					}

					if (!fs.existsSync(explodedModuleResPath)) {
						wrench.mkdirSyncRecursive(explodedModuleResPath);
					}
					async.eachSeries(resArchives, function(resArchivePathAndFilename, done) {
						this.logger.trace(__('Processing module resources: %s', resArchivePathAndFilename.cyan));
						var explodedPath = path.join(explodedModuleResPath, path.basename(resArchivePathAndFilename, '.res.zip'));
						var coreModuleResPath = path.join(explodedPath, 'res');
						// The core modules should hardly ever change, so a simple check for the
						// already exploded archive dir will suffice for subsequent builds.
						if (fs.existsSync(explodedPath)) {
							merge(coreModuleResPath, mergedResPath);
							return done();
						}

						this.logger.info(__('Extracting module resources: %s', resArchivePathAndFilename.cyan));
						appc.zip.unzip(resArchivePathAndFilename, explodedPath, {}, function (err) {
							if (err) {
								this.logger.error(__('Failed to extract module resource zip: %s', resArchivePathAndFilename.cyan) + '\n');
								return done(err);
							}

							merge(coreModuleResPath, mergedResPath);
							done();
						}.bind(this));
					}.bind(this), callback);
				},

				/**
				 * Merge all resource from Android Archives that are bundled with the module
				 * we are about to build.
				 *
				 * @param {Function} callback Function to call once the resource merging is complete
				 */
				function mergeAarResources(callback) {
					this.logger.trace(__('Processing Android Library resources'));

					if (this.androidLibraries.length === 0) {
						this.logger.trace(__('No exploded Android Archives found, skipping!'));
						return callback();
					}

					this.androidLibraries.forEach(function(libraryInfo) {
						this.logger.trace(__('Processing resources for package: %s', libraryInfo.packageName));
						var libraryResPath = path.join(libraryInfo.explodedPath, 'res');
						merge(libraryResPath, mergedResPath);
					}, this);
					callback();
				},

				/**
				 * Merges all resources that are placed under the platform/android/res
				 * folder.
				 *
				 * @param {Function} callback Function to call once the resource merging is complete
				 */
				function mergeModuleResources(callback) {
					this.logger.trace(__('Processing native module resources'));
					var moduleResPath = path.join(this.platformDir, 'android/res');
					if (!fs.existsSync(moduleResPath)) {
						this.logger.trace(__('No native module resources found, skipping!'));
						return callback();
					}
					merge(moduleResPath, mergedResPath);
					callback();
				}
			], cb);
		},

		/**
		 * Generates a basic Android Manifest for use with AAPT.
		 *
		 * We need this dummy manifest because our modules do not provide a manifest
		 * on their own and AAPT requires a manifest file.
		 *
		 * @param {Function} cb Function to call once the Android Manifest file was created
		 */
		function generateAaptFriendlyManifest(cb) {
			var manifestTemplatePathAndFilename = path.join(this.moduleGenTemplateDir, 'AndroidManifest.xml.ejs');
			var manifestOutputPathAndFilename = path.join(this.buildIntermediatesDir, 'manifests/aapt/AndroidManifest.xml');
			if (!fs.existsSync(path.dirname(manifestOutputPathAndFilename))) {
				wrench.mkdirSyncRecursive(path.dirname(manifestOutputPathAndFilename));
			}
			var manifestContent = ejs.render(fs.readFileSync(manifestTemplatePathAndFilename).toString(), {
				MODULE_ID: this.manifest.moduleid
			});
			fs.writeFile(manifestOutputPathAndFilename, manifestContent, cb);
		},

		/**
		 * Generates the R class for this module via the AAPT command line tool
		 *
		 * We use the --extra-packages options to also generate the R class for our
		 * core modules because they currently do not provide a R.txt from which we
		 * could regenerated the R class from. This results in duplicate symbols and
		 * can be removed once we add support for .aar files in core modules.
		 *
		 * @param {Function} cb Function to call once the R class was created
		 */
		function generateModuleRClassFile(cb) {
			this.logger.trace('Generating R.java for module: ' + this.manifest.moduleid);
			if (!fs.existsSync(this.buildGenRDir)) {
				wrench.mkdirSyncRecursive(this.buildGenRDir);
			}

			if (!fs.existsSync(bundlesPath)) {
				wrench.mkdirSyncRecursive(bundlesPath);
			}
			var aaptBin = this.androidInfo.sdk.executables.aapt;
			var aaptOptions = [
				'package',
				'-f',
				'-I', this.androidTargetSDK.androidJar,
				'-M', path.join(this.buildIntermediatesDir, 'manifests/aapt/AndroidManifest.xml'),
				'-S', mergedResPath,
				'-m',
				'-J', this.buildGenRDir,
				'--custom-package', this.manifest.moduleid,
				'--non-constant-id',
				'-0', 'apk',
				'--output-text-symbols', bundlesPath,
				'--no-version-vectors'
			];
			if (extraPackages.length > 0) {
				aaptOptions.push('--extra-packages', extraPackages.join(':'));
			}
			this.logger.debug('Running AAPT command: ' + aaptBin + ' ' + aaptOptions.join(' '));
			appc.subprocess.run(aaptBin, aaptOptions, {}, function (code, out, err) {
				if (code) {
					this.logger.debug(out);
					this.logger.error(err);
					this.logger.error(__('Failed to generate R class'));
					process.exit(1);
				}

				cb();
			}.bind(this));
		},

		/**
		 * Generates R classes for any bundled AAR files
		 *
		 * This uses the symbol info in a R.txt file that is mandatory in every
		 * Android Archive to regenerate the R.java for each Android Library.
		 *
		 * It does so by reading the generated R.txt from the previous AAPT command,
		 * which contains all symbols from our merged resources. It will then read
		 * the symbols from the Android Library, replace every symbol value with the
		 * value from the merged symbol table and then write the updated R.java to
		 * disk.
		 *
		 * @param {Function} cb Function to call once the R classes were generated
		 */
		function generateRForLibraries(cb) {
			var symbolOutputPathAndFilename = path.join(bundlesPath, 'R.txt');
			var fullSymbolValues = null;
			this.androidLibraries.forEach(function (libraryInfo) {
				var librarySymbolFile = path.join(libraryInfo.explodedPath, 'R.txt');
				if (!fs.existsSync(librarySymbolFile)) {
					return;
				}

				if (fullSymbolValues === null) {
					fullSymbolValues = new SymbolLoader(symbolOutputPathAndFilename);
					fullSymbolValues.load();
				}

				var librarySymbols = new SymbolLoader(librarySymbolFile);
				librarySymbols.load();

				this.logger.trace('Generating R.java for library: ' + libraryInfo.packageName);
				var symbolWriter = new SymbolWriter(this.buildGenRDir, libraryInfo.packageName, fullSymbolValues);
				symbolWriter.addSymbolsToWrite(librarySymbols);
				symbolWriter.write();
			}.bind(this));

			cb();
		}
	];

	appc.async.series(this, tasks, next);
};

AndroidModuleBuilder.prototype.compileAidlFiles = function compileAidlFiles(next) {
	this.logger.log(__('Generating java files from the .aidl files'));

	if (!this.androidTargetSDK.aidl) {
		this.logger.info(__('Android SDK %s missing framework aidl, skipping', this.androidTargetSDK['api-level']));
		return next();
	}

	var aidlRegExp = /\.aidl$/,
		aidlFiles = (function scan(dir) {
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
	}(this.javaSrcDir));

	if (!aidlFiles.length) {
		this.logger.info(__('No aidl files to compile'));
		return next();
	}

	appc.async.series(this, aidlFiles.map(function (file) {
		return function (callback) {
			this.logger.info(__('Compiling aidl file: %s', file));

			var aidlHook = this.cli.createHook('build.android.aidl', this, function (exe, args, opts, done) {
					this.logger.info('Running aidl: %s', (exe + ' "' + args.join('" "') + '"').cyan);
					appc.subprocess.run(exe, args, opts, done);
				});

			aidlHook(
				this.androidInfo.sdk.executables.aidl,
				['-p' + this.androidTargetSDK.aidl, '-I' + this.javaSrcDir, file],
				{},
				callback
			);
		};
	}), next);
};

AndroidModuleBuilder.prototype.compileModuleJavaSrc = function (next) {
	this.logger.log(__('Compiling Module Java source files'));

	var classpath = this.classPaths,
		javaSourcesFile = path.join(this.projectDir, 'java-sources.txt'),
		javaFiles = [];

	this.dirWalker(this.javaSrcDir, function (file) {
		if (path.extname(file) === '.java') {
			javaFiles.push(file);
		}
	}.bind(this));

	this.dirWalker(this.buildGenRDir, function (file) {
		if (path.extname(file) === '.java') {
			javaFiles.push(file);
		}
	}.bind(this));

	fs.writeFileSync(javaSourcesFile, '"' + javaFiles.join('"\n"').replace(/\\/g, '/') + '"');

	// Remove these folders and re-create them
	// 	build/class
	// 	build/generated/json
	// 	build/generated/jni
	// 	dist/
	[this.buildClassesDir, this.buildGenJsonDir, this.buildGenJniDir, this.distDir].forEach(function (dir) {
		if (fs.existsSync(dir)) {
			wrench.rmdirSyncRecursive(dir);
		}
		wrench.mkdirSyncRecursive(dir);
	}, this);

	var javacHook = this.cli.createHook('build.android.javac', this, function (exe, args, opts, done) {
		this.logger.info(__('Building Java source files: %s', (exe + ' "' + args.join('" "') + '"').cyan));
		appc.subprocess.run(exe, args, opts, function (code, out, err) {
			if (code) {
				this.logger.error(__('Failed to compile Java source files:'));
				this.logger.error();
				err.trim().split('\n').forEach(this.logger.error);
				this.logger.log();
				process.exit(1);
			}
			done();
		}.bind(this));
	});

	javacHook(
		this.jdkInfo.executables.javac,
		[
			'-J-Xmx' + this.javacMaxMemory,
			'-encoding', 'utf8',
			'-classpath', Object.keys(classpath).join(process.platform == 'win32' ? ';' : ':'),
			'-d', this.buildClassesDir,
			'-target', this.javacTarget,
			'-g',
			'-source', this.javacSource,
			'@' + javaSourcesFile,

			'-processor', 'org.appcelerator.kroll.annotations.generator.KrollJSONGenerator',
			'-s', this.buildGenJsonDir,
			'-Akroll.jsonFile='+ this.manifest.name +'.json',
			'-Akroll.jsonPackage=org.appcelerator.titanium.bindings'
		],
		{},
		next
	);
};

/*
	Uses the KrollBindingGenerator stand-alone java program to create
	the binding layer and bootstraps for the module.
	(see https://github.com/appcelerator/titanium_mobile/blob/master/android/kroll-apt/src/java/org/appcelerator/kroll/annotations/generator/KrollBindingGenerator.java.)

	It takes the JSON file created in compileModuleJavaSrc and, using the metadata therein,
	produces .cpp and .h files (for V8) down in build/generated/jni.
*/
AndroidModuleBuilder.prototype.generateRuntimeBindings = function (next) {
	this.logger.log(__('Generating runtime bindings'));

	var classpath = this.classPaths;

	var javaHook = this.cli.createHook('build.android.java', this, function (exe, args, opts, done) {
		this.logger.info(__('Generate v8 bindings: %s', (exe + ' "' + args.join('" "') + '"').cyan));
			appc.subprocess.run(exe, args, opts, function (code, out, err) {
				if (code) {
					this.logger.error(__('Failed to compile Java source files:'));
					this.logger.error();
					err.trim().split('\n').forEach(this.logger.error);
					this.logger.log();
					process.exit(1);
				}
				done();
			}.bind(this));
		});

	javaHook(
		this.jdkInfo.executables.java,
		[
			'-classpath', Object.keys(classpath).join(process.platform == 'win32' ? ';' : ':'),
			'org.appcelerator.kroll.annotations.generator.KrollBindingGenerator',

			// output directory
			this.buildGenJniDir,

			// isModule
			'true',

			// module id
			this.manifest.moduleid,

			// binding json
			this.buildGenJsonFile
		],
		{},
		next
	);
};

/*
	Produce :
		[ModuleName]Bootstrap.java,
		[ModuleName]Bootstrap.cpp,
		bootstrap.js,
		KrollGeneratedBindings.gperf.

*/
AndroidModuleBuilder.prototype.generateV8Bindings = function (next) {
	this.logger.info(__('Producing [ModuleName]Bootstrap files using %s', this.buildGenJsonFile));

	var bindingJson = JSON.parse(fs.readFileSync(this.buildGenJsonFile)),
		moduleClassName = Object.keys(bindingJson.modules)[0];
		moduleName = bindingJson.modules[moduleClassName]['apiName'],
		moduleNamespace = this.manifest.moduleid.toLowerCase(),
		modulesWithCreate = [],
		apiTree = {},
		initTable = [],
		headers = '',
		globalsJS = '',
		invocationJS = '',
		fileNamePrefix = moduleName.charAt(0).toUpperCase() + moduleName.substring(1);

	var Kroll_DEFAULT = 'org.appcelerator.kroll.annotations.Kroll.DEFAULT',
		JS_DEPENDENCY = '// Ensure <%- name %> is initialized\n var dep<%- index %> = module.<%- name %>;\n',
		JS_LAZY_GET = '<%- decl %> lazyGet(this, \"<%- className %>\", \"<%- api %>\", \"<%- namespace %>\");\n',
		JS_GETTER = '\"<%- child %>\": {\nget: function() {\n',
		JS_CLOSE_GETTER = '},\nconfigurable: true\n},\n',
		JS_DEFINE_PROPERTIES = 'Object.defineProperties(<%- varname %>, {\n<%- properties %>\n});\n',
		JS_CREATE = '<%- name %>.constructor.prototype.create<%- type %> = function() {\nreturn new <%- name %><%- accessor %>(arguments);\n}\n',
		JS_DEFINE_TOP_LEVEL = 'global.<%- name %> = function() {\nreturn <%- namespace %>.<%- mapping %>.apply(<%- namespace %>, arguments);\n}\n',
		JS_INVOCATION_API = 'addInvocationAPI(module, \"<%- moduleNamespace %>\", \"<%- namespace %>\", \"<%- api %>\");';

	function getParentModuleClass(proxyMap) {
		var name,
			proxyAttrs = proxyMap['proxyAttrs'];

		if (proxyAttrs['creatableInModule'] && (proxyAttrs['creatableInModule'] != Kroll_DEFAULT)) {
			name = proxyAttrs['creatableInModule'];
		} else if (proxyAttrs['parentModule'] && (proxyAttrs['parentModule'] != Kroll_DEFAULT)) {
			name = proxyAttrs['parentModule'];
		}

		return name;
	}

	function getFullApiName(proxyMap) {
		var fullApiName = proxyMap['proxyAttrs']['name'],
			parentModuleClass = getParentModuleClass(proxyMap);

		while (parentModuleClass) {
			var parent = bindingJson.proxies[parentModuleClass],
				parentName = parent['proxyAttrs']['name'];

			fullApiName = parentName + "." + fullApiName;
			parentModuleClass = getParentModuleClass(parent);
		}

		return fullApiName;
	}

	function processNode(node, namespace, indent) {
		var js = '',
			childJS = '',
			apiName = namespace.split("."),
			varName,
			prototypeName,
			decl,
			childAPIs = Object.keys(node),
			className = node['_className'],
			proxyMap = bindingJson['proxies'][className],
			isModule = proxyMap['isModule'],
			invocationAPIs = [],
			hasInvocationAPIs,
			needsReturn;

		// ignore _dependencies and _className in the childAPIs count
		var hasChildren = childAPIs.filter(function (api) {
				return (['_className', '_dependencies'].indexOf(api) === -1);
			}).length > 0;

		var hasCreateProxies = (isModule && ('createProxies' in bindingJson['modules'][className]));

		if (('_dependencies' in node) && (node['_dependencies'].length) > 0) {
			node['_dependencies'].forEach(function(dependency, index) {
				js += ejs.render(JS_DEPENDENCY, { "name": dependency, "index": index });
			});
		}

		if (apiName == '') {
			varName = 'module';
			namespace = moduleName;
			apiName = moduleName;
			decl = '';
		} else {
			apiName = apiName[apiName.length-1];
			varName = apiName
		}

		if (hasCreateProxies) {
			if (!(apiName in modulesWithCreate)) {
				modulesWithCreate.push(namespace);
			}
		}

		if ('methods' in proxyMap) {
			Object.keys(proxyMap.methods).forEach(function (method) {
				var methodMap = proxyMap.methods[method];
				if (methodMap.hasInvocation) {
					invocationAPIs.push(methodMap);
				}
			});
		}

		if ('dynamicProperties' in proxyMap) {
			Object.keys(proxyMap.dynamicProperties).forEach(function (dp) {
				var dpMap = proxyMap.dynamicProperties[dp];
				if (dpMap.getHasInvocation) {
					invocationAPIs.push({ 'apiName': dpMap.getMethodName });
				}

				if (dpMap.setHasInvocation) {
					invocationAPIs.push({ 'apiName': dpMap.setHasInvocation });
				}
			});
		}

		hasInvocationAPIs = invocationAPIs.length > 0;
		needsReturn = hasChildren || hasCreateProxies || hasInvocationAPIs || true;

		if (namespace != moduleName) {
			decl = 'var ' + varName + ' = ';
			if (!needsReturn) {
				decl = 'return';
			}

			js += ejs.render(JS_LAZY_GET, { 'decl': decl, 'className': className, 'api': apiName, 'namespace': namespace });
		}

		childAPIs.forEach(function (childAPI) {
			if (['_className', '_dependencies'].indexOf(childAPI) === -1) {
				var childNamespace = namespace + '.' + childAPI;
				if (namespace === moduleName) {
					childNamespace = childAPI;
				}

				childJS += ejs.render(JS_GETTER , { 'varname': varName, 'child': childAPI });
				childJS += processNode(node[childAPI], childNamespace, indent + 1);
				childJS += JS_CLOSE_GETTER;
			}
		});

		if (hasChildren) {
			js += '\tif (!(\"__propertiesDefined__\" in '+ varName +')) {';
			js += ejs.render(JS_DEFINE_PROPERTIES, { 'varname': varName, 'properties': childJS });
		}

		if (isModule) {
			prototypeName = varName;
		} else {
			prototypeName = varName + '.prototype';
		}

		if (hasCreateProxies) {
			var createProxies = bindingJson.modules[className].createProxies;
			createProxies.forEach(function (create) {
				accessor = '[\"'+create.name+'\"]';
				invocationAPIs.push({ 'apiName': 'create'+create.name })
				js += ejs.render(JS_CREATE, {'name': varName, 'type': create.name, 'accessor': accessor });
			});
		}

		if (hasChildren) {
			js += '}\n';
			js += varName+'.__propertiesDefined__ = true;\n';
		}

		if ('topLevelMethods' in proxyMap) {
			Object.keys(proxyMap.topLevelMethods).forEach(function (method) {
				var ns = namespace.indexOf('Titanium') != 0 ? 'Ti.'+namespace : namespace,
					topLevelNames = proxyMap.topLevelMethods[method];

					topLevelNames.forEach(function (name) {
						globalsJS += ejs.render(JS_DEFINE_TOP_LEVEL, {'name': name, 'mapping': method, 'namespace': ns});
					});

			});
		}

		invocationAPIs.forEach(function (api) {
			invocationJS += ejs.render(JS_INVOCATION_API, { 'moduleNamespace': moduleName, 'namespace': namespace, 'api': api['apiName'] });
		});

		if (needsReturn) {
			js += 'return ' + varName + ';\n';
		}

		return js;
	} // end processNode

	var tasks = [
		function (cb) {
			Object.keys(bindingJson.proxies).forEach(function (proxy) {
				var fullApi = getFullApiName(bindingJson.proxies[proxy]),
					tree = apiTree,
					apiNames = fullApi.split(".");

				// apiTree
				apiNames.forEach(function (api) {

					if (api != moduleName && !(api in tree)) {
						tree[api] = {
							'_dependencies': []
						};
						tree = tree[api];
					}
				});
				tree['_className'] = proxy;

				// initTable
				var namespaces = fullApi.split('.').slice(0, -1).map(function (s) {
					return s.toLowerCase();
				});

				if (namespaces.indexOf(moduleNamespace) == -1) {
					namespaces.unshift(moduleNamespace.split('.').join('::'));
				}

				var namespace = namespaces.join('::');
				var className = bindingJson.proxies[proxy]['proxyClassName'];
				// If the class name doesn't have the module namespace, prepend it
				if (className.indexOf(namespace) !== 0) {
					className = namespace + '::' + className;
				}
				headers += '#include \"'+ proxy +'.h\"\n';
				var initFunction = '::' + className + '::bindProxy';
				var disposeFunction = '::' + className + '::dispose';

				initTable.unshift([proxy, initFunction, disposeFunction].join(',').toString());

			}, this);

			cb();
		},

		function (cb) {
			var bootstrapJS = processNode(apiTree, '', 0);

			var bootstrapContext = {
				'globalsJS': globalsJS,
				'invocationJS': invocationJS,
				'bootstrapJS': bootstrapJS,
				'modulesWithCreate': modulesWithCreate,
				'moduleClass': apiTree['_className'],
				'moduleName': moduleName
			};

			var gperfContext = {
				'headers': headers,
				'bindings': initTable.join('\n'),
				'moduleName': fileNamePrefix
			}

			fs.writeFileSync(
				path.join(this.buildGenDir, 'bootstrap.js'),
				ejs.render(fs.readFileSync(this.jsTemplateFile).toString(), bootstrapContext)
			);

			fs.writeFileSync(
				path.join(this.buildGenDir, 'KrollGeneratedBindings.gperf'),
				ejs.render(fs.readFileSync(this.gperfTemplateFile).toString(), gperfContext)
			);

			// clean any old 'KrollGeneratedBindings.cpp'
			var krollGeneratedBindingsCpp = path.join(this.buildGenDir, 'KrollGeneratedBindings.cpp');
			fs.existsSync(krollGeneratedBindingsCpp) && fs.unlinkSync(krollGeneratedBindingsCpp);

			cb();
		},

		function (cb) {

			var nativeContext = {
				'moduleId': this.manifest.moduleid,
				'className': fileNamePrefix,
				'jniPackage': this.manifest.moduleid.replace(/\./g, '_')
			}

			var boostrapPathJava = path.join(this.buildGenJavaDir, this.moduleIdSubDir);
			fs.existsSync(boostrapPathJava) || wrench.mkdirSyncRecursive(boostrapPathJava);

			fs.writeFileSync(
				path.join(boostrapPathJava, fileNamePrefix + 'Bootstrap.java'),
				ejs.render(fs.readFileSync(this.javaTemplateFile).toString(), nativeContext)
			);


			fs.writeFileSync(
				path.join(this.buildGenDir, fileNamePrefix + 'Bootstrap.cpp'),
				ejs.render(fs.readFileSync(this.cppTemplateFile).toString(), nativeContext)
			);

			cb();
		}
	];

	appc.async.series(this, tasks, next);
};

AndroidModuleBuilder.prototype.compileJsClosure = function (next) {
	var jsFilesToEncrypt = this.jsFilesToEncrypt = [];

	this.dirWalker(this.assetsDir, function (file) {
		if (path.extname(file) === '.js') {
			jsFilesToEncrypt.push(path.relative(this.assetsDir, file));
		}
	}.bind(this));

	if (!jsFilesToEncrypt.length) {
		// nothing to encrypt, continue
		return next();
	}

	// Set commonjs: true in manifest!
	if (!this.manifest.commonjs) {
		var manifestContents = fs.readFileSync(this.manifestFile).toString(),
			found = false,
			replaceCommonjsValue = function(match, offset, string) {
				found = true;
				return 'commonjs: true';
			};
		manifestContents = manifestContents.replace(/^commonjs:\s*.+$/mg, replaceCommonjsValue);
		if (!found) {
			manifestContents = manifestContents.trim() + '\ncommonjs: true\n';
		}
		fs.writeFileSync(this.manifestFile, manifestContents);
		this.manifest.commonjs = true;
		this.logger.info(__('Manifest re-written to set commonjs value'));
	}

	this.logger.info(__('Generating v8 bindings'));

	var dependsMap =  JSON.parse(fs.readFileSync(this.dependencyJsonFile));
	Array.prototype.push.apply(this.metaData,dependsMap.required);

	Object.keys(dependsMap.dependencies).forEach(function (key) {
		dependsMap.dependencies[key].forEach(function (item) {
			if (this.metaData.indexOf(item) == -1) {
				this.metaData.push(item);
			}
		}, this);
	}, this);

	// Compiling JS
	var closureCompileHook = this.cli.createHook('build.android.java', this, function (exe, args, opts, done) {
			this.logger.info(__('Generate v8 bindings: %s', (exe + ' "' + args.join('" "') + '"').cyan));
			appc.subprocess.run(exe, args, opts, function (code, out, err) {
				if (code) {
					this.logger.error(__('Failed to compile Java source files:'));
					this.logger.error();
					err.trim().split('\n').forEach(this.logger.error);
					this.logger.log();
					process.exit(1);
				}

				fs.existsSync(this.metaDataFile) && fs.unlinkSync(this.metaDataFile);
				fs.writeFileSync(this.metaDataFile, JSON.stringify({ "exports": this.metaData }));

				done();
			}.bind(this));
		}),
		closureJarFile = path.join(this.platformPath, 'lib', 'closure-compiler.jar');

	// Limit to 5 instances of Java in parallel at max, to be careful/conservative
	async.eachLimit(jsFilesToEncrypt, 5, function(file, callback) {

		var outputDir = path.dirname(path.join(this.buildGenJsDir, file)),
			filePath = path.join(this.assetsDir, file);

		fs.existsSync(outputDir) || wrench.mkdirSyncRecursive(outputDir);

		var r = jsanalyze.analyzeJsFile(filePath, { minify: true });
		this.tiSymbols[file] = r.symbols;

		r.symbols.forEach(function (item) {
			if (this.metaData.indexOf(item) == -1) {
				this.metaData.push(item);
			}
		}, this);

		closureCompileHook(
			this.jdkInfo.executables.java,
			[
				'-jar', closureJarFile,
				'--js', filePath,
				'--js_output_file', path.join(this.buildGenJsDir, file),
				'--jscomp_off=internetExplorerChecks'
			],
			{},
			callback
		);
	}.bind(this), next);
};

/*
	If JavaScript files are found in the assets/ directory,
	then they get encrypted and placed into a Java class file just like we do for
	JS files in production mode when compiling a normal Titanium Android project.
	In this way, module developers can use these native module projects as a
	means of creating CommonJS modules which are distributed in an encrypted form.

*/
AndroidModuleBuilder.prototype.compileJS = function (next) {

	if (!this.jsFilesToEncrypt.length) {
		// nothing to encrypt, continue
		return next();
	}

	this.logger.log(__('Encrypting JS files in assets/ dir'));

	var titaniumPrep = 'titanium_prep';
	if (process.platform == 'darwin') {
		titaniumPrep += '.macos';
	} else if (process.platform == 'win32') {
		titaniumPrep += '.win32.exe';
	} else if (process.platform == 'linux') {
		titaniumPrep += '.linux' + (process.arch == 'x64' ? '64' : '32');
	}

	// Packing compiled JavaScript files
	var titaniumPrepHook = this.cli.createHook('build.android.titaniumprep', this, function (exe, args, opts, done) {
			this.logger.info(__('Encrypting JavaScript files: %s', (exe + ' "' + args.slice(1).join('" "') + '"').cyan));
			appc.subprocess.run(exe, args, opts, function (code, out, err) {

				if (code) {
					return done({
						code: code,
						msg: err.trim()
					});
				}

				fs.existsSync(this.buildGenAssetJavaFile) && fs.unlinkSync(this.buildGenAssetJavaFile);

				// write the encrypted JS bytes to the generated Java file
				fs.writeFileSync(
					this.buildGenAssetJavaFile,
					ejs.render(fs.readFileSync(this.assetCryptImplTemplateFile).toString(), {
						appid: this.manifest.moduleid,
						encryptedAssets: out
					})
				);

				fs.writeFileSync(
					path.join(this.buildGenJavaDir, 'CommonJsSourceProvider.java'),
					ejs.render(fs.readFileSync(this.commonJsSourceTemplateFile).toString(), { moduleid: this.manifest.moduleid })
				);

				done();
			}.bind(this));
		}.bind(this)),
		args = [ this.manifest.guid, this.manifest.moduleid, this.buildGenJsDir ].concat(this.jsFilesToEncrypt),
		opts = {
			env: appc.util.mix({}, process.env, {
				// we force the JAVA_HOME so that titaniumprep doesn't complain
				'JAVA_HOME': this.jdkInfo.home
			})
		},
		fatal = function fatal(err) {
			this.logger.error(__('Failed to encrypt JavaScript files'));
			err.msg.split('\n').forEach(this.logger.error);
			this.logger.log();
			process.exit(1);
		}.bind(this);

	titaniumPrepHook(
		path.join(this.platformPath, titaniumPrep),
		args.slice(0),
		opts,
		function (err) {
			if (!err) {
				return next();
			}

			if (process.platform != 'win32') {
				fatal(err);
			}

			// windows 64-bit failed, try again using 32-bit
			this.logger.debug(__('32-bit titanium prep failed, trying again using 64-bit'));
			titaniumPrep = 'titanium_prep.win64.exe';
			titaniumPrepHook(
				path.join(this.platformPath, titaniumPrep),
				args,
				opts,
				function (err) {
					if (err) {
						fatal(err);
					}
					next();
				}
			);
		}.bind(this)
	);
};

/*
	Convert JavaScript source code into C-style char arrays.
	It is used for embedded JavaScript code in the V8 library.
*/
AndroidModuleBuilder.prototype.jsToC = function (next) {
	this.logger.log(__('Generating BootstrapJS.cpp from bootstrap.js'));

	var fileName = 'bootstrap.js',
		jsBootstrapFile = path.join(this.buildGenDir, fileName),
		result = [];

	if (fs.existsSync(jsBootstrapFile)) {

		var str = new Buffer(fs.readFileSync(jsBootstrapFile));

		[].forEach.call(str, function (char) {
			result.push(char);
		});

		result.push('0');
	}

	fs.writeFileSync(
		path.join(this.buildGenDir, 'BootstrapJS.cpp'),
		ejs.render(fs.readFileSync(this.btJsToCppTemplateFile).toString(), {
			id: 'bootstrap',
			data: result.join(', ')
		})
	);

	next();
};

/*
	Runs the stock Android NDK ndk-build command after setting up the
	appropriate environment for it.
	It copies the template Application.mk to build/generated,
	the template Android.mk to build/generated/jni and
	replaces the tokens therein with correct values
*/
AndroidModuleBuilder.prototype.ndkBuild = function (next) {
	this.logger.info(__('Running the Android NDK ndk-build'));

	var tasks = [
		function (cb) {
			fs.writeFileSync(
				path.join(this.buildGenJniDir, 'Android.mk'),
				ejs.render(fs.readFileSync(this.androidMkTemplateFile).toString(), {
					MODULE_ID: this.manifest.moduleid
				})
			);

			fs.writeFileSync(
				path.join(this.buildGenDir, 'Application.mk'),
				ejs.render(fs.readFileSync(this.applicationMkTemplateFile).toString(), {
					MODULE_ID: this.manifest.moduleid,
					ARCHITECTURES: this.manifest.architectures
				})
			);

			cb();
		},

		function (cb) {
			var args = [
				'TI_MOBILE_SDK='+this.titaniumSdkPath,
				'NDK_PROJECT_PATH='+this.buildGenDir,
				'NDK_APPLICATION_MK='+path.join(this.buildGenDir, 'Application.mk'),
				'PYTHON=python',
				'V=0'
			];

			this.logger.debug(__('Running: %s', (this.androidInfo.ndk.executables.ndkbuild + ' ' + args.join(' ')).cyan));

			appc.subprocess.run(
				this.androidInfo.ndk.executables.ndkbuild,
				args,
				{ cwd: this.buildGenDir },
				function (code, out, err) {
					if (code) {
						this.logger.error(__('Failed to run ndk-build'));
						this.logger.error();
						err.trim().split('\n').forEach(this.logger.error);
						this.logger.log();
						process.exit(1);
					}

					this.dirWalker(this.buildGenLibsDir, function (file) {
						if (path.extname(file) == '.so' && file.indexOf('libstlport_shared.so') == -1 && file.indexOf('libc++_shared.so') == -1) {

							var relativeName = path.relative(this.buildGenLibsDir, file),
								targetDir = path.join(this.libsDir, path.dirname(relativeName));

							fs.existsSync(targetDir) || wrench.mkdirSyncRecursive(targetDir);

							fs.writeFileSync(
								path.join(targetDir, path.basename(file)),
								fs.readFileSync(file)
							);
						}

					}.bind(this));

					cb();
				}.bind(this)
			);
		}
	];

	appc.async.series(this, tasks, next);
};

AndroidModuleBuilder.prototype.ndkLocalBuild = function (next) {
	if (!fs.existsSync(this.localJinDir)) {
		return next();
	}

	this.logger.info(__('Running the stock Android NDK ndk-build on local ndk build...'));

	var localJniGenDir = path.join(this.buildGenJniLocalDir, 'jni'),
		localJniGenLibs = path.join(this.buildGenJniLocalDir, 'libs');

	wrench.mkdirSyncRecursive(this.buildGenJniLocalDir);
	fs.writeFileSync(
		path.join(this.buildGenJniLocalDir, 'Application.mk'),
		fs.readFileSync(path.join(this.buildGenDir, 'Application.mk'))
	);

	wrench.mkdirSyncRecursive(localJniGenDir);

	this.dirWalker(this.localJinDir, function (file) {
		fs.writeFileSync(
			path.join(localJniGenDir, path.relative(this.localJinDir, file)),
			fs.readFileSync(file)
		)
	}.bind(this));

	// Start NDK build process
	var args = [
		'TI_MOBILE_SDK='+this.titaniumSdkPath,
		'NDK_PROJECT_PATH='+this.buildGenJniLocalDir,
		'NDK_APPLICATION_MK='+path.join(this.buildGenJniLocalDir, 'Application.mk'),
		'V=0'
	];

	this.logger.debug(__('Running: %s', (this.androidInfo.ndk.executables.ndkbuild + ' ' + args.join(' ')).cyan));

	appc.subprocess.run(
		this.androidInfo.ndk.executables.ndkbuild,
		args,
		{ cwd: this.buildGenJniLocalDir },
		function (code, out, err) {
			if (code) {
				this.logger.error(__('Failed to run ndk-build'));
				this.logger.error();
				err.trim().split('\n').forEach(this.logger.error);
				this.logger.log();
				process.exit(1);
			}

			this.dirWalker(localJniGenLibs, function (file) {
				if (path.extname(file) == '.so') {
					var relativeName = path.relative(localJniGenLibs, file),
						targetDir = path.join(this.libsDir, path.dirname(relativeName));

					fs.existsSync(targetDir) || wrench.mkdirSyncRecursive(targetDir);

					fs.writeFileSync(
						path.join(targetDir, path.basename(file)),
						fs.readFileSync(file)
					);

				}
			}.bind(this));

			next();
		}.bind(this)
	);
};

AndroidModuleBuilder.prototype.compileAllFinal = function (next) {
	this.logger.log(__('Compiling all java source files generated'));

	var javaSourcesFile = path.join(this.projectDir, 'java-sources.txt'),
		javaFiles = [],
		javacHook = this.cli.createHook('build.android.javac', this, function (exe, args, opts, done) {
		this.logger.info(__('Building Java source files: %s', (exe + ' "' + args.join('" "') + '"').cyan));
		appc.subprocess.run(exe, args, opts, function (code, out, err) {
			if (code) {
				this.logger.error(__('Failed to compile Java source files:'));
				this.logger.error();
				err.trim().split('\n').forEach(this.logger.error);
				this.logger.log();
				process.exit(1);
			}

			done();
		}.bind(this));
	});

	this.dirWalker(this.javaSrcDir, function (file) {
		if (path.extname(file) === '.java') {
			javaFiles.push(file);
		}
	}.bind(this));

	this.dirWalker(this.buildGenDir, function (file) {
		if (path.extname(file) === '.java') {
			javaFiles.push(file);
		}
	}.bind(this));

	fs.existsSync(javaSourcesFile) && fs.unlinkSync(javaSourcesFile);
	fs.writeFileSync(javaSourcesFile, '"' + javaFiles.join('"\n"').replace(/\\/g, '/') + '"');

	wrench.copyDirSyncRecursive(this.buildGenJsonDir, this.buildClassesDir, { forceDelete: true });

	javacHook(
		this.jdkInfo.executables.javac,
		[
			'-J-Xmx' + this.javacMaxMemory,
			'-encoding', 'utf8',
			'-d', this.buildClassesDir,
			'-classpath', Object.keys(this.classPaths).join(process.platform == 'win32' ? ';' : ':'),
			'-target', this.javacTarget,
			'-g',
			'-source', this.javacSource,
			'@' + javaSourcesFile
		],
		{},
		function () {
			// remove gen, prevent duplicate entry error
			if (fs.existsSync(this.buildClassesGenDir)) {
				wrench.rmdirSyncRecursive(this.buildClassesGenDir);
			}
			next();
		}.bind(this)
	);

};

AndroidModuleBuilder.prototype.verifyBuildArch = function (next) {
	this.logger.info(__('Verifying build architectures'));

	var buildArchs = [],
		manifestArchs = this.manifest['architectures'].split(' '),
		buildDiff = [];

	if (!fs.existsSync(this.libsDir)) {
		this.logger.info('No native compiled libraries found, assume architectures are sane');
		return next();
	}

	buildArchs = fs.readdirSync(this.libsDir);
	buildDiff = manifestArchs.filter(function (i) { return buildArchs.indexOf(i) < 0; });

	if (manifestArchs.indexOf('armeabi') > -1) {
		this.logger.error(__('Architecture \'armeabi\' is not supported by Titanium SDK %s', this.titaniumSdkVersion));
		this.logger.error(__('Please remove this architecture from the manifest.'));
		process.exit(1);
	}
	if (buildArchs.length < manifestArchs.length || buildDiff.length > 0) {
		this.logger.error(__('There is discrepancy between the architectures specified in module manifest and compiled binary.'));
		this.logger.error(__('Architectures in manifest: %s', manifestArchs));
		this.logger.error(__('Compiled binary architectures: %s', buildArchs));
		this.logger.error(__('Please update manifest to match module binary architectures.'));

		process.exit(1);
	}

	this.logger.info('Build architectures are sane');
	next();
};

AndroidModuleBuilder.prototype.packageZip = function (next) {
	this.logger.info(__('Packaging the module'));

	fs.existsSync(this.distDir) || wrench.rmdirSyncRecursive(this.distDir);
	wrench.mkdirSyncRecursive(this.distDir);

	var tasks = [
		function (cb) {
			// Generate documentation
			if (fs.existsSync(this.documentationDir)) {
				var files = fs.readdirSync(this.documentationDir);
				for (var i in files) {
					var file = files[i],
						currentFile = path.join(this.documentationDir, file);
					if (fs.statSync(currentFile).isFile()) {
						var obj = {},
							contents = fs.readFileSync(currentFile).toString();

						obj[file] = markdown.toHTML(contents);
						this.documentation.push(obj);
					}
				}
			}

			cb();
		},

		/**
		 * Generates the module jar file.
		 *
		 * To be able to filter what's being added to the jar we create the archive
		 * manually instead of using jar command line.
		 *
		 * Currently we only filter R.class files, those will be regenerated in the
		 * final App build.
		 *
		 * @param {Function} cb Function to call once the .jar file was generated
		 */
		function generateModuleJar(cb) {
			var moduleJarStream = fs.createWriteStream(this.moduleJarFile);
			var moduleJarArchive = archiver('zip', {
			    store: true
			});
			moduleJarStream.on('close', cb);
			moduleJarArchive.on('error', cb);
			moduleJarArchive.pipe(moduleJarStream);

			var excludeRegex = /.*\/R\.class$|.*\/R\$(.*)\.class$/i;

			var assetsParentDir = path.join(this.assetsDir, '..');
			this.dirWalker(this.assetsDir, function (file) {
				if (path.extname(file) != '.js' && path.basename(file) != 'README') {
					moduleJarArchive.append(fs.createReadStream(file), {name: path.relative(assetsParentDir, file)});
				}
			}.bind(this));

			this.dirWalker(this.buildClassesDir, function (file) {
				if (!excludeRegex.test(file)) {
					moduleJarArchive.append(fs.createReadStream(file), {name: path.relative(this.buildClassesDir, file)});
				}
			}.bind(this));

			moduleJarArchive.finalize();
		},

		function (cb) {
			// Package zip
			var dest = archiver('zip', {
					forceUTC: true
				}),
				zipStream,
				origConsoleError = console.error,
				id = this.manifest.moduleid.toLowerCase(),
				zipName = [this.manifest.moduleid, '-android-', this.manifest.version, '.zip'].join(''),
				moduleZipPath = path.join(this.distDir, zipName),
				moduleFolder = path.join('modules', 'android', this.manifest.moduleid, this.manifest.version),
				manifestArchs = this.manifest['architectures'].split(' ');

			this.moduleZipPath = moduleZipPath;

			// since the archiver library didn't set max listeners, we squelch all error output
			console.error = function () {};

			try {
				// if the zip file is there, remove it
				fs.existsSync(moduleZipPath) && fs.unlinkSync(moduleZipPath);
				zipStream = fs.createWriteStream(moduleZipPath);
				zipStream.on('close', function() {
					console.error = origConsoleError;
					cb();
				});
				dest.catchEarlyExitAttached = true; // silence exceptions
				dest.pipe(zipStream);

				this.logger.info(__('Creating module zip'));

				// 1. documentation folder
				var mdRegExp = /\.md$/;
				(function walk(dir, parent) {
					if (!fs.existsSync(dir)) return;

					fs.readdirSync(dir).forEach(function (name) {
						var file = path.join(dir, name);
						if (!fs.existsSync(file)) return;
						if (fs.statSync(file).isDirectory()) {
							return walk(file, path.join(parent, name));
						}

						var contents = fs.readFileSync(file).toString();

						if (mdRegExp.test(name)) {
							contents = markdown.toHTML(contents);
							name = name.replace(/\.md$/, '.html');
						}

						dest.append(contents, { name: path.join(parent, name) });
					});
				}(this.documentationDir, path.join(moduleFolder, 'documentation')));

				// 2. example folder
				this.dirWalker(this.exampleDir, function (file) {
					dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'example', path.relative(this.exampleDir, file)) });
				}.bind(this));

				// 3. platform folder
				if (fs.existsSync(this.platformDir)) {
					this.dirWalker(this.platformDir, function (file) {
						dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'platform', path.relative(this.platformDir, file)) });
					}.bind(this));
				}

				// 4. hooks folder
				var hookFiles = {};
				if (fs.existsSync(this.hooksDir)) {
					this.dirWalker(this.hooksDir, function (file) {
						var relFile = path.relative(this.hooksDir, file);
						hookFiles[relFile] = 1;
						dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'hooks', relFile) });
					}.bind(this));
				}
				if (fs.existsSync(this.sharedHooksDir)) {
					this.dirWalker(this.sharedHooksDir, function (file) {
						var relFile = path.relative(this.sharedHooksDir, file);
						if (!hookFiles[relFile]) {
							dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'hooks', relFile) });
						}
					}.bind(this));
				}

				// 5. Resources folder
				if (fs.existsSync(this.resourcesDir)) {
					this.dirWalker(this.resourcesDir, function (file, name) {
						if (name !== 'README.md') {
							dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'Resources', path.relative(this.resourcesDir, file)) });
						}
					}.bind(this));
				}

				// 6. assets folder, not including js files
				this.dirWalker(this.assetsDir, function (file) {
					if (path.extname(file) !== '.js' && path.basename(file) !== 'README') {
						dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'assets', path.relative(this.assetsDir, file)) });
					}
				}.bind(this));

				// 7. libs folder, only architectures defined in manifest
				if (fs.existsSync(this.libsDir)) {
					this.dirWalker(this.libsDir, function (file) {
						var archLib = path.relative(this.libsDir, file).split(path.sep),
							arch = archLib.length ? archLib[0] : undefined;
						if (arch && manifestArchs.indexOf(arch) > -1) {
							dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'libs', path.relative(this.libsDir, file)) });
						}
					}.bind(this));
				}

				if (fs.existsSync(this.projLibDir)) {
					this.dirWalker(this.projLibDir, function (file) {
						var libraryExtension = path.extname(file);
						if (libraryExtension === '.jar' || libraryExtension === '.aar') {
							dest.append(fs.createReadStream(file), { name: path.join(moduleFolder, 'lib', path.relative(this.projLibDir, file)) });
						}
					}.bind(this));
				}

				// respackageinfo file
				if (this.manifest.respackage) {
					dest.append(this.manifest.respackage, { name: path.join(moduleFolder,'respackageinfo') });
				}

				dest.append(fs.createReadStream(this.licenseFile), { name: path.join(moduleFolder,'LICENSE') });
				dest.append(fs.createReadStream(this.manifestFile), { name: path.join(moduleFolder,'manifest') });
				dest.append(fs.createReadStream(this.moduleJarFile), { name: path.join(moduleFolder, this.moduleJarName) });
				dest.append(fs.createReadStream(this.timoduleXmlFile), { name: path.join(moduleFolder,'timodule.xml') });
				if (fs.existsSync(this.metaDataFile)) {
					dest.append(fs.createReadStream(this.metaDataFile), { name: path.join(moduleFolder,'metadata.json') });
				}

				var symbolOutputPathAndFilename = path.join(this.buildIntermediatesDir, 'bundles/R.txt');
				if (fs.existsSync(symbolOutputPathAndFilename)) {
					dest.append(fs.createReadStream(symbolOutputPathAndFilename), {name: path.join(moduleFolder, 'R.txt')});
				}

				this.logger.info(__('Writing module zip: %s', moduleZipPath));
				dest.finalize();
			} catch (ex) {
				console.error = origConsoleError;
				throw ex;
			}
		}

	];

	appc.async.series(this, tasks, next);

};

AndroidModuleBuilder.prototype.runModule = function (next) {
	if (this.buildOnly) {
		return next();
	}

	var tmpName,
		tmpDir = temp.path('ti-android-module-build-'),
		tmpProjectDir;

	function checkLine(line, logger) {
		var re = new RegExp(
			'(?:\u001b\\[\\d+m)?\\[?(' +
			logger.getLevels().join('|') +
			')\\]?\s*(?:\u001b\\[\\d+m)?(.*)', 'i'
		);

		if (line) {
			var m = line.match(re);
			if (m) {
				logger[m[1].toLowerCase()](m[2].trim());
			} else {
				logger.debug(line);
			}
		}
	}

	function runTiCommand(cmd, args, logger, callback) {

		// when calling on Windows, we need to escape ampersands in the command
		if (process.platform == 'win32') {
			cmd.replace(/\&/g, '^&');
		}

		var child = spawn(cmd, args);

		child.stdout.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				checkLine(line, logger);
			});
		});

		child.stderr.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				checkLine(line, logger);
			});
		});

		child.on('close', function (code) {
			if (code) {
				logger.error(__('Failed to run ti %s', args[0]));
				logger.log();
				process.exit(1);
			}

			callback();
		});
	}

	var tasks = [

		function (cb) {
			// 1. create temp dir
			wrench.mkdirSyncRecursive(tmpDir);

			// 2. create temp proj
			this.logger.debug(__('Staging module project at %s', tmpDir.cyan));

			runTiCommand(
				process.execPath,
				[
					process.argv[1],
					'create',
					'--id', this.manifest.moduleid,
					'-n', this.manifest.name,
					'-t', 'app',
					'-u', 'localhost',
					'-d', tmpDir,
					'-p', 'android',
					'--force'
				],
				this.logger,
				cb
			);
		},

		function (cb) {

			tmpProjectDir = path.join(tmpDir, this.manifest.name);
			this.logger.debug(__('Created example project %s', tmpProjectDir.cyan));

			// 3. patch tiapp.xml with module id
			var data = fs.readFileSync(path.join(tmpProjectDir, 'tiapp.xml')).toString();
			var result = data.replace(/<modules>/g, '<modules>\n\t\t<module platform="android">' + this.manifest.moduleid + '</module>');
			fs.writeFileSync(path.join(tmpProjectDir, 'tiapp.xml'), result);

			// 4. copy files in example to Resource
			appc.fs.copyDirSyncRecursive(
				this.exampleDir,
				path.join(tmpProjectDir, 'Resources'),
				{
					preserve: true,
					logger: this.logger.debug
				}
			);

			// 5. unzip module to the tmp dir
			var zip = new AdmZip(this.moduleZipPath);
			zip.extractAllTo(tmpProjectDir, true);

			cb();
		},

		function (cb) {
			// 6. run the app
			this.logger.debug(__('Running example project...', tmpDir.cyan));

			runTiCommand(
				process.execPath,
				[
					process.argv[1],
					'build',
					'-p', 'android',
					'-d', tmpProjectDir
				],
				this.logger,
				cb
			);
		}
	];

	appc.async.series(this, tasks, next);
};

// create the builder instance and expose the public api
(function (androidModuleBuilder) {
	exports.config   = androidModuleBuilder.config.bind(androidModuleBuilder);
	exports.validate = androidModuleBuilder.validate.bind(androidModuleBuilder);
	exports.run      = androidModuleBuilder.run.bind(androidModuleBuilder);
}(new AndroidModuleBuilder(module)));
