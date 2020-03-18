/**
 * Android module build command.
 *
 * @module cli/_buildModule
 *
 * @copyright
 * Copyright (c) 2014-2018 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const AdmZip = require('adm-zip'),
	androidDetect = require('../lib/detect').detect,
	AndroidManifest = require('../lib/android-manifest'),
	appc = require('node-appc'),
	archiver = require('archiver'),
	Builder = require('node-titanium-sdk/lib/builder'),
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs-extra'),
	GradleWrapper = require('../lib/gradle-wrapper'),
	markdown = require('markdown').markdown,
	path = require('path'),
	temp = require('temp'),
	tiappxml = require('node-titanium-sdk/lib/tiappxml'),
	util = require('util'),
	semver = require('semver'),
	spawn = require('child_process').spawn, // eslint-disable-line security/detect-child-process

	__ = appc.i18n(__dirname).__,
	version = appc.version;

function AndroidModuleBuilder() {
	Builder.apply(this, arguments);

	this.requiredArchitectures = this.packageJson.architectures;
	this.compileSdkVersion = this.packageJson.compileSDKVersion; // this should always be >= maxSupportedApiLevel
	this.minSupportedApiLevel = parseInt(this.packageJson.minSDKVersion);
	this.minTargetApiLevel = parseInt(version.parseMin(this.packageJson.vendorDependencies['android sdk']));
	this.maxSupportedApiLevel = parseInt(version.parseMax(this.packageJson.vendorDependencies['android sdk']));
}

util.inherits(AndroidModuleBuilder, Builder);

/**
 * Migrates an existing module with an outdated "apiversion" in the manifest to the latest one.
 * It takes care of migrating the "apiversion", "version", "minsdk" and "architecture" properties.
 *
 * @return {Promise<undefined>}
 */
AndroidModuleBuilder.prototype.migrate = async function migrate() {
	const cliModuleAPIVersion = this.cli.sdk && this.cli.sdk.manifest && this.cli.sdk.manifest.moduleAPIVersion && this.cli.sdk.manifest.moduleAPIVersion.android;
	const cliSDKVersion = this.cli.sdk.manifest.version;
	const manifestSDKVersion = this.manifest.minsdk;
	const manifestModuleAPIVersion = this.manifest.apiversion;
	const manifestTemplateFile = path.join(this.platformPath, 'templates', 'module', 'default', 'template', 'android', 'manifest.ejs');
	let newVersion = semver.inc(this.manifest.version, 'major');

	// Determine if the "manifest" file's "apiversion" needs updating.
	let isApiVersionUpdateRequired = false;
	if (cliModuleAPIVersion) {
		isApiVersionUpdateRequired = (this.manifest.apiversion !== cliModuleAPIVersion);
	}

	// Determin if the "manifest" file's "minsdk" needs updating.
	// As of Titanium 9.0.0, modules are built as AARs to an "m2repository". Not supported on older Titanium versions.
	let isMinSdkUpdateRequired = false;
	const minSupportedSdkVersionMajorNumber = 9;
	const minSupportedSdkVersionString = '9.0.0';
	if (!this.manifest.minsdk || (parseInt(this.manifest.minsdk.split('.')[0]) < minSupportedSdkVersionMajorNumber)) {
		isMinSdkUpdateRequired = true;
	}

	// Do not continue if manifest doesn't need updating. (Everything is okay.)
	if (!isApiVersionUpdateRequired && !isMinSdkUpdateRequired) {
		return;
	}

	const logger = this.logger;
	if (!this.cli.argv.prompt) {
		if (isApiVersionUpdateRequired) {
			logger.error(__('The module manifest apiversion is currently set to %s', manifestModuleAPIVersion));
			logger.error(__('Titanium SDK %s Android module apiversion is at %s', cliSDKVersion, cliModuleAPIVersion));
			logger.error(__('Please update module manifest apiversion to match Titanium SDK module apiversion'));
			logger.error(__('and the minsdk to at least %s', minSupportedSdkVersionString));
		} else {
			logger.error(__('The module "manifest" file\'s minsdk is currently set to %s', this.manifest.minsdk));
			logger.error(__('Please update the file\'s minsdk to at least version %s', minSupportedSdkVersionString));
		}
		process.exit(1);
	}

	await new Promise((resolve, reject) => {
		let titleMessage;
		if (isApiVersionUpdateRequired) {
			titleMessage = __(
				'Detected Titanium %s that requires API-level %s, but the module currently only supports %s and API-level %s.',
				cliSDKVersion, cliModuleAPIVersion, manifestSDKVersion, manifestModuleAPIVersion);
		} else {
			titleMessage = __(
				'Modules built with Titanium %s cannot support Titanium versions older than %s. The "manifest" file\'s minsdk must be updated.',
				cliSDKVersion, minSupportedSdkVersionString);
		}
		fields.select({
			title: titleMessage,
			promptLabel: __('Do you want to migrate your module now?'),
			default: 'yes',
			display: 'prompt',
			relistOnError: true,
			complete: true,
			suggest: true,
			options: [ '__y__es', '__n__o' ]
		}).prompt((err, value) => {
			if (err) {
				reject(err);
				return;
			}

			if (value !== 'yes') {
				logger.error(__('Please update the module\'s "manifest" file in order to build it.'));
				process.exit(1);
			}

			resolve();
		});
	});

	this.logger.info(__('Migrating module manifest ...'));

	// If a version is "1.0" instead of "1.0.0", semver currently fails. Work around it for now!
	if (!newVersion) {
		this.logger.warn(__('Detected non-semantic version (%s), will try to repair it!', this.manifest.version));
		try {
			const semanticVersion = appc.version.format(this.manifest.version, 3, 3, true);
			newVersion = semver.inc(semanticVersion, 'major');
		} catch (err) {
			this.logger.error(__('Unable to migrate version for you. Please update it manually by using a semantic version like "1.0.0" and try the migration again.'));
			process.exit(1);
		}
	}

	// Update the "apiversion" to the CLI API-version
	this.logger.info(__('Setting %s to %s', 'apiversion'.cyan, cliModuleAPIVersion.cyan));
	this.manifest.apiversion = cliModuleAPIVersion;

	// Update the "minsdk" to the required CLI SDK-version
	this.logger.info(__('Setting %s to %s', 'minsdk'.cyan, minSupportedSdkVersionString.cyan));
	this.manifest.minsdk = minSupportedSdkVersionString;

	// Update the "apiversion" to the next major
	this.logger.info(__('Bumping version from %s to %s', this.manifest.version.cyan, newVersion.cyan));
	this.manifest.version = newVersion;

	// Add our new architecture(s)
	this.manifest.architectures = this.requiredArchitectures.join(' ');

	// Pre-fill placeholders
	let manifestContent = await fs.readFile(manifestTemplateFile);
	manifestContent = ejs.render(manifestContent.toString(), {
		moduleName: this.manifest.name,
		moduleId: this.manifest.moduleid,
		platform: this.manifest.platform,
		tisdkVersion: this.manifest.minsdk,
		guid: this.manifest.guid,
		author: this.manifest.author,
		publisher: this.manifest.author // The publisher does not have an own key in the manifest but can be different. Will override below
	});

	// Migrate missing keys which don't have a placeholder (version, license, copyright & publisher)
	manifestContent = manifestContent.replace(/version.*/, 'version: ' + this.manifest.version);
	manifestContent = manifestContent.replace(/license.*/, 'license: ' + this.manifest.license);
	manifestContent = manifestContent.replace(/copyright.*/, 'copyright: ' + this.manifest.copyright);
	manifestContent = manifestContent.replace(/description.*/, 'description: ' + this.manifest.description);

	// Make a backup of the old file in case something goes wrong
	this.logger.info(__('Backing up old manifest to %s', 'manifest.bak'.cyan));
	await fs.rename(path.join(this.projectDir, 'manifest'), path.join(this.projectDir, 'manifest.bak'));

	// Write the new manifest file
	this.logger.info(__('Writing new manifest'));
	await fs.writeFile(path.join(this.projectDir, 'manifest'), manifestContent);

	this.logger.info(__(''));
	this.logger.info(__('Migration completed! Building module ...'));
};

AndroidModuleBuilder.prototype.validate = function validate(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);
	Builder.prototype.validate.apply(this, arguments);

	return function (finished) {
		this.projectDir = cli.argv['project-dir'];
		this.buildOnly = cli.argv['build-only'];

		this.cli = cli;
		this.logger = logger;
		fields.setup({ colors: cli.argv.colors });

		this.manifest = this.cli.manifest;

		// detect android environment
		androidDetect(config, { packageJson: this.packageJson }, function (androidInfo) {
			this.androidInfo = androidInfo;

			if (!this.androidInfo.ndk) {
				logger.error(__('Unable to find a suitable installed Android NDK.') + '\n');
				process.exit(1);
			}

			const targetSDKMap = {

				// placeholder for gradle to use
				[this.compileSdkVersion]: {
					sdk: this.compileSdkVersion
				}
			};
			Object.keys(this.androidInfo.targets).forEach(function (id) {
				var t = this.androidInfo.targets[id];
				if (t.type === 'platform') {
					targetSDKMap[t.id.replace('android-', '')] = t;
				}
			}, this);

			// check the Android SDK we require to build exists
			this.androidCompileSDK = targetSDKMap[this.compileSdkVersion];

			// if no target sdk, then default to most recent supported/installed
			if (!this.targetSDK) {
				this.targetSDK = this.maxSupportedApiLevel;
			}
			this.androidTargetSDK = targetSDKMap[this.targetSDK];

			if (!this.androidTargetSDK) {
				this.androidTargetSDK = {
					sdk: this.targetSDK
				};
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
				logger.warn(__('Building with Android SDK %s which hasn\'t been tested against Titanium SDK %s', ('' + this.targetSDK).cyan, this.titaniumSdkVersion));
			}

			// get javac params
			this.javacMaxMemory = cli.timodule.properties['android.javac.maxmemory'] && cli.timodule.properties['android.javac.maxmemory'].value || config.get('android.javac.maxMemory', '3072M');

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

AndroidModuleBuilder.prototype.run = async function run(logger, config, cli, finished) {
	try {
		// Call the base builder's run() method.
		Builder.prototype.run.apply(this, arguments);

		// Notify plugins that we're about to begin.
		await new Promise((resolve) => {
			cli.emit('build.module.pre.construct', this, resolve);
		});

		// Update module's config files, if necessary.
		await this.migrate();

		// Post build anlytics.
		await this.doAnalytics();

		// Initialize build variables and directory.
		await this.initialize();
		await this.loginfo();
		await this.cleanup();

		// Notify plugins that we're prepping to compile.
		await new Promise((resolve) => {
			cli.emit('build.module.pre.compile', this, resolve);
		});

		// Update module files such as "manifest" if needed.
		await this.updateModuleFiles();

		// Generate all gradle project files.
		await this.generateRootProjectFiles();
		await this.generateModuleProject();

		// Build the library and output it to "dist" directory.
		await this.buildModuleProject();
		await this.packageZip();

		// Run the built module via "example" project.
		await this.runModule();

		// Notify plugins that the build is done.
		await new Promise((resolve) => {
			cli.emit('build.module.post.compile', this, resolve);
		});
		await new Promise((resolve) => {
			cli.emit('build.module.finalize', this, resolve);
		});
	} catch (err) {
		// Failed to build module. Print the error message and stack trace (if possible).
		// Note: "err" can be whatever type (including undefined) that was passed into Promise.reject().
		if (err instanceof Error) {
			this.logger.error(err.stack || err.message);
		} else if ((typeof err === 'string') && (err.length > 0)) {
			this.logger.error(err);
		} else {
			this.logger.error('Build failed. Reason: Unknown');
		}

		// Exit out with an error.
		if (finished) {
			finished(err);
		} else {
			process.exit(1);
		}
	}

	// We're done. Invoke optional callback if provided.
	if (finished) {
		finished();
	}
};

AndroidModuleBuilder.prototype.dirWalker = async function dirWalker(directoryPath, callback) {
	const fileNameArray = await fs.readdir(directoryPath);
	for (const fileName of fileNameArray) {
		const filePath = path.join(directoryPath, fileName);
		if ((await fs.stat(filePath)).isDirectory()) {
			await this.dirWalker(filePath, callback);
		} else {
			callback(filePath, fileName);
		}
	}
};

AndroidModuleBuilder.prototype.doAnalytics = async function doAnalytics() {
	var cli = this.cli,
		manifest = this.manifest,
		eventName = 'android.' + cli.argv.type;

	cli.addAnalyticsEvent(eventName, {
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
};

AndroidModuleBuilder.prototype.initialize = async function initialize() {
	// Create a "tiSymbols" dictionary. It's needed by our "process-js-task" node module.
	this.tiSymbols = {};

	// Fetch the module's "manifest" property file.
	this.manifestFile = path.join(this.projectDir, 'manifest');

	// Get the paths to the module's main directories.
	// Folders under the "android" subdirectory take precedence over the ones in the root directory.
	const getPathForProjectDirName = async (directoryName) => {
		let directoryPath = path.join(this.projectDir, directoryName);
		if (!await fs.exists(directoryPath)) {
			directoryPath = path.join(this.projectDir, '..', directoryName);
		}
		return directoryPath;
	};
	this.assetsDir = await getPathForProjectDirName('assets');
	this.documentationDir = await getPathForProjectDirName('documentation');
	this.exampleDir = await getPathForProjectDirName('example');
	this.platformDir = await getPathForProjectDirName('platform');
	this.resourcesDir = await getPathForProjectDirName('Resources');

	// Fetch the "timodule.xml" file and load it.
	// Provides Android specific info such as "AndroidManfiest.xml" elements and module dependencies.
	this.timoduleXmlFile = path.join(this.projectDir, 'timodule.xml');
	if (await fs.exists(this.timoduleXmlFile)) {
		this.timodule = new tiappxml(this.timoduleXmlFile);
	}

	// Legacy "<module>/android/libs" directory used before Titanium 9.0.0.
	// - Module devs used to put their C/C++ "*.so" dependencies here. (Now goes to "/platform/android/jniLibs".)
	// - Old build system used to output module's built "*.so" libraries here. (Now packaged in built AAR file.)
	this.libsDir = path.join(this.projectDir, 'libs');

	// Set up build directory paths.
	this.buildDir = path.join(this.projectDir, 'build');
	this.buildModuleDir = path.join(this.buildDir, 'module');

	// The output directory where a zip of the built module will go.
	this.distDir = path.join(this.projectDir, 'dist');

	// The SDK's module template directory path.
	this.moduleTemplateDir = path.join(this.platformPath, 'templates', 'module', 'generated');
};

AndroidModuleBuilder.prototype.loginfo = async function loginfo() {
	this.logger.info(__('Assets Dir: %s', this.assetsDir.cyan));
	this.logger.info(__('Documentation Dir: %s', this.documentationDir.cyan));
	this.logger.info(__('Example Dir: %s', this.exampleDir.cyan));
	this.logger.info(__('Platform Dir: %s', this.platformDir.cyan));
	this.logger.info(__('Resources Dir: %s', this.resourcesDir.cyan));
};

AndroidModuleBuilder.prototype.cleanup = async function cleanup() {
	// Clean last packaged build in "dist" directory in case this build fails.
	await fs.emptyDir(this.distDir);

	// Delete entire "build" directory tree if we can't find a gradle "module" project directory under it.
	// This assumes last built module was using older version of Titanium that did not support gradle.
	// Otherwise, keep gradle project files so that we can do an incremental build.
	const hasGradleModuleDir = await fs.exists(path.join(this.buildDir, 'module'));
	if (!hasGradleModuleDir) {
		await fs.emptyDir(this.buildDir);
	}

	// Delete this module's last built "*.so" libraries from "libs" directory.
	// Do not delete all files from "libs". Some modules put 3rd party "*.so" library dependencies there.
	if (await fs.exists(this.libsDir)) {
		const MODULE_LIB_FILE_NAME = `lib${this.manifest.moduleid}.so`;
		await this.dirWalker(this.libsDir, (filePath, fileName) => {
			if (fileName === MODULE_LIB_FILE_NAME) {
				this.logger.debug(__('Removing %s', filePath.cyan));
				fs.removeSync(filePath);
			}
		});
	}
};

AndroidModuleBuilder.prototype.updateModuleFiles = async function updateModuleFiles() {
	// Add empty "build.gradle" template file to project folder if missing. Used to define library dependencies.
	// Note: Appcelerator Studio looks for this file to determine if this is an Android module project.
	const buildGradleFileName = 'build.gradle';
	const buildGradleFilePath = path.join(this.projectDir, buildGradleFileName);
	if (!await fs.exists(buildGradleFilePath)) {
		await fs.copyFile(
			path.join(this.platformPath, 'templates', 'module', 'default', 'template', 'android', buildGradleFileName),
			buildGradleFilePath);
	}

	// Determine if "assets" directory contains at least 1 JavaScript file.
	let hasJSFile = false;
	if (await fs.exists(this.assetsDir)) {
		await this.dirWalker(this.assetsDir, (filePath) => {
			if (path.extname(filePath).toLowerCase() === '.js') {
				hasJSFile = true;
			}
		});
	}

	// If JS file was found, then change module's "manifest" file setting "commonjs" to true.
	if (hasJSFile && !this.manifest.commonjs) {
		let wasFound = false;
		let manifestContents = await fs.readFile(this.manifestFile);
		manifestContents = manifestContents.toString().replace(/^commonjs:\s*.+$/mg, () => {
			wasFound = true;
			return 'commonjs: true';
		});
		if (!wasFound) {
			manifestContents = manifestContents.trim() + '\ncommonjs: true\n';
		}
		await fs.writeFile(this.manifestFile, manifestContents);
		this.manifest.commonjs = true;
		this.logger.info(__('Manifest re-written to set commonjs value'));
	}
};

AndroidModuleBuilder.prototype.generateRootProjectFiles = async function generateRootProjectFiles() {
	this.logger.info(__('Generating root project files'));

	// Copy our SDK's gradle files to the build directory. (Includes "gradlew" scripts and "gradle" directory tree.)
	const gradlew = new GradleWrapper(this.buildDir);
	gradlew.logger = this.logger;
	await gradlew.installTemplate(path.join(this.platformPath, 'templates', 'gradle'));

	// Create a "gradle.properties" file. Will add network proxy settings if needed.
	const gradleProperties = await gradlew.fetchDefaultGradleProperties();
	gradleProperties.push({
		key: 'org.gradle.jvmargs',
		value: `-Xmx${this.javacMaxMemory} -Dkotlin.daemon.jvm.options="-Xmx${this.javacMaxMemory}"`
	});
	await gradlew.writeGradlePropertiesFile(gradleProperties);

	// Create a "local.properties" file providing a path to the Android SDK/NDK directories.
	await gradlew.writeLocalPropertiesFile(this.androidInfo.sdk.path, this.androidInfo.ndk.path);

	// Copy our root "build.gradle" template script to the root build directory.
	const templatesDir = path.join(this.platformPath, 'templates', 'build');
	await fs.copyFile(
		path.join(templatesDir, 'root.build.gradle'),
		path.join(this.buildDir, 'build.gradle'));

	// Copy our Titanium template's gradle constants file.
	// This provides the Google library versions we use and defines our custom "AndroidManifest.xml" placeholders.
	const tiConstantsGradleFileName = 'ti.constants.gradle';
	await fs.copyFile(
		path.join(templatesDir, tiConstantsGradleFileName),
		path.join(this.buildDir, tiConstantsGradleFileName));

	// Create a "settings.gradle" file providing a reference to the module's gradle subproject.
	// By default, a subproject's name must match its subdirectory name.
	const fileLines = [
		`rootProject.name = '${this.manifest.moduleid}'`,
		"include ':module'" // eslint-disable-line quotes
	];
	await fs.writeFile(path.join(this.buildDir, 'settings.gradle'), fileLines.join('\n') + '\n');
};

AndroidModuleBuilder.prototype.generateModuleProject = async function generateModuleProject() {
	this.logger.info(__('Generating gradle project: %s', 'module'.cyan));

	// Create the "module" project directory tree.
	// Delete all files under its "./src/main" subdirectory if it already exists.
	// Note: Do not delete the "./build" subdirectory. It contains incremental build info.
	const moduleMainDir = path.join(this.buildModuleDir, 'src', 'main');
	const moduleJavaPackageDir = path.join(moduleMainDir, 'java', ...this.manifest.moduleid.split('.'));
	const moduleJniDir = path.join(moduleMainDir, 'jni');
	await fs.emptyDir(moduleMainDir);
	await fs.ensureDir(moduleJavaPackageDir);
	await fs.ensureDir(moduleJniDir);

	// Create a maven "<GroupId>:<ArtifactId>" from "moduleid".
	// For example, "ti.map" becomes maven repository name "ti:map".
	const moduleId = this.manifest.moduleid;
	let mavenGroupId = moduleId;
	let mavenArtifactId = moduleId;
	let index = moduleId.lastIndexOf('.');
	if ((index > 0) && ((index + 1) < moduleId.length)) {
		mavenGroupId = moduleId.substring(0, index);
		mavenArtifactId = moduleId.substring(index + 1);
	}

	// Generate a "build.gradle" file for this project from the SDK's EJS module template.
	let buildGradleContent = await fs.readFile(path.join(this.moduleTemplateDir, 'build.gradle'));
	buildGradleContent = ejs.render(buildGradleContent.toString(), {
		compileSdkVersion: this.compileSdkVersion,
		krollAptJarPath: path.join(this.platformPath, 'kroll-apt.jar'),
		minSdkVersion: this.minSupportedApiLevel,
		moduleAuthor: this.manifest.author,
		moduleCopyright: this.manifest.copyright,
		moduleDescription: this.manifest.description,
		moduleId: moduleId,
		moduleLicense: this.manifest.license,
		moduleMavenGroupId: mavenGroupId,
		moduleMavenArtifactId: mavenArtifactId,
		moduleName: this.manifest.name,
		moduleVersion: this.manifest.version,
		moduleArchitectures: this.manifest.architectures.split(' '),
		tiBindingsJsonPath: path.join(this.platformPath, 'titanium.bindings.json'),
		tiMavenUrl: encodeURI('file://' + path.join(this.platformPath, 'm2repository').replace(/\\/g, '/')),
		tiSdkModuleTemplateDir: this.moduleTemplateDir,
		tiSdkVersion: this.titaniumSdkVersion
	});
	await fs.writeFile(path.join(this.buildModuleDir, 'build.gradle'), buildGradleContent);

	// Copy module template's C++ code generation script to gradle project.
	// Project's "build.gradle" will invoke this script after "kroll-apt" Java annotation processor has finished.
	await fs.copyFile(
		path.join(this.moduleTemplateDir, 'generate-cpp-files.js'),
		path.join(this.buildModuleDir, 'generate-cpp-files.js'));

	// If module has "AndroidManifest.xml" file under its "./platform/android" directory,
	// then copy it to this gradle project's "debug" and "release" subdirectories.
	// This makes them extend main "AndroidManifest.xml" under "./src/main" which is taken from "timodule.xml".
	const externalManifestFilePath = path.join(this.projectDir, 'platform', 'android', 'AndroidManifest.xml');
	if (await fs.exists(externalManifestFilePath)) {
		const debugDirPath = path.join(this.buildModuleDir, 'src', 'debug');
		const releaseDirPath = path.join(this.buildModuleDir, 'src', 'release');
		await fs.ensureDir(debugDirPath);
		await fs.ensureDir(releaseDirPath);
		await fs.copyFile(externalManifestFilePath, path.join(debugDirPath, 'AndroidManifest.xml'));
		await fs.copyFile(externalManifestFilePath, path.join(releaseDirPath, 'AndroidManifest.xml'));
	}

	// Create main "AndroidManifest.xml" file under gradle project's "./src/main".
	// If manifest settings exist in "timodule.xml", then merge it into main manifest.
	const mainManifest = AndroidManifest.fromXmlString('<manifest/>');
	try {
		if (this.timodule && this.timodule.android && this.timodule.android.manifest) {
			const tiModuleManifest = AndroidManifest.fromXmlString(this.timodule.android.manifest);
			mainManifest.copyFromAndroidManifest(tiModuleManifest);
		}
	} catch (err) {
		this.logger.error('Unable to load Android <manifest/> content from "timodule.xml" file.');
		throw err;
	}
	let packageName = moduleId;
	if (packageName.indexOf('.') < 0) {
		packageName = `ti.${packageName}`;
	}
	mainManifest.setPackageName(packageName);
	await mainManifest.writeToFilePath(path.join(moduleMainDir, 'AndroidManifest.xml'));

	// Generate Java file used to provide this module's JS source code to Titanium's JS runtime.
	let fileContent = await fs.readFile(path.join(this.moduleTemplateDir, 'CommonJsSourceProvider.java'));
	fileContent = ejs.render(fileContent.toString(), { moduleId: moduleId });
	const javaFilePath = path.join(moduleJavaPackageDir, 'CommonJsSourceProvider.java');
	await fs.writeFile(javaFilePath, fileContent);

	// Generate Java file used to load below C++ bootstrap.
	fileContent = await fs.readFile(path.join(this.moduleTemplateDir, 'TiModuleBootstrap.java'));
	fileContent = ejs.render(fileContent.toString(), { moduleId: moduleId });
	await fs.writeFile(path.join(moduleJavaPackageDir, 'TiModuleBootstrap.java'), fileContent);

	// Generate the C/C++ makefile.
	fileContent = await fs.readFile(path.join(this.moduleTemplateDir, 'Android.mk'));
	fileContent = ejs.render(fileContent.toString(), {
		moduleId: this.manifest.moduleid,
		tiSdkDirPath: this.platformPath
	});
	await fs.writeFile(path.join(moduleJniDir, 'Android.mk'), fileContent);
};

AndroidModuleBuilder.prototype.buildModuleProject = async function buildModuleProject() {
	this.logger.info(__('Building module'));

	// Emit a "javac" hook event for plugins.
	await new Promise((resolve) => {
		const javacHook = this.cli.createHook('build.android.javac', this, (exe, args, opts, done) => {
			done();
		});
		javacHook('', [], {}, resolve);
	});

	// Build the module library project as an AAR.
	const gradlew = new GradleWrapper(this.buildDir);
	gradlew.logger = this.logger;
	await gradlew.assembleRelease('module');

	// Create a local maven repository directory tree containing above AAR and "*.pom" file listing its dependencies.
	// This is what the Titanium app will reference in its "build.gradle" file under its "dependencies" section.
	await gradlew.publish('module');
};

AndroidModuleBuilder.prototype.packageZip = async function () {
	this.logger.info(__('Packaging the module'));

	// Create/Clean the "dist" directory that we'll be writing the zipped-up module to.
	await fs.emptyDir(this.distDir);

	// Define relative folder path to files will be stored as in zip file.
	// When installing this module, it'll be unzipped to main Titanium SDK directory or app project's directory.
	const moduleFolder = path.join('modules', 'android', this.manifest.moduleid, this.manifest.version);

	// Define the zip file name and path.
	// Store the zip path to "this.moduleZipPath" to be accessed by build script's runModule() method.
	const zipFileName = `${this.manifest.moduleid}-android-${this.manifest.version}.zip`;
	const moduleZipPath = path.join(this.distDir, zipFileName);
	this.moduleZipPath = moduleZipPath;

	// Create the zip archive buffer.
	const dest = archiver('zip', { forceUTC: true });
	dest.catchEarlyExitAttached = true; // silence exceptions
	dest.pipe(fs.createWriteStream(moduleZipPath));
	this.logger.info(__('Creating module zip'));

	// Add the module's built AAR maven repository directory tree to the archive.
	// This is the library dependency an app project's "build.gradle" will reference.
	const mavenDirPath = path.join(this.buildModuleDir, 'build', 'outputs', 'm2repository');
	await this.dirWalker(mavenDirPath, (filePath) => {
		const zipEntryName = path.join(moduleFolder, 'm2repository', path.relative(mavenDirPath, filePath));
		dest.append(fs.createReadStream(filePath), { name: zipEntryName });
	});

	// Add module's proxy binding JSON file to archive.
	// Needed by the app build system when generating the "TiApplication" derived class to inject
	// this module's classes into the KrollRuntime and to invoke module's onAppCreate() if defined.
	const bindingsFileName = this.manifest.name + '.json';
	const bindingsFilePath = path.join(this.buildModuleDir, 'build', 'ti-generated', 'json', bindingsFileName);
	if (await fs.exists(bindingsFilePath)) {
		dest.append(fs.createReadStream(bindingsFilePath), { name: path.join(moduleFolder, bindingsFileName) });
	}

	// Add the "documentation" files to the archive.
	const archiveDocFilesInDirectory = async (directoryPath, zipEntryName) => {
		for (const fileName of await fs.readdir(directoryPath)) {
			const filePath = path.join(directoryPath, fileName);
			if ((await fs.stat(filePath)).isDirectory()) {
				await archiveDocFilesInDirectory(filePath, path.join(zipEntryName, fileName));
			} else {
				let newFileName = fileName;
				let fileContent = await fs.readFile(filePath);
				if (fileName.toLowerCase().endsWith('.md')) {
					fileContent = markdown.toHTML(fileContent.toString());
					newFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.html';
				}
				dest.append(fileContent, { name: path.join(zipEntryName, newFileName) });
			}
		}
	};
	if (await fs.exists(this.documentationDir)) {
		await archiveDocFilesInDirectory(this.documentationDir, path.join(moduleFolder, 'documentation'));
	}

	// Add the "example" app project files to the archive.
	if (await fs.exists(this.exampleDir)) {
		await this.dirWalker(this.exampleDir, (filePath) => {
			const zipEntryName = path.join(moduleFolder, 'example', path.relative(this.exampleDir, filePath));
			dest.append(fs.createReadStream(filePath), { name: zipEntryName });
		});
	}

	// Add the event hook plugin scripts to the archive.
	const hookFiles = {};
	const archiveHookFilesInDirectory = async (directoryPath) => {
		if (await fs.exists(directoryPath)) {
			await this.dirWalker(directoryPath, (filePath) => {
				const relativeFilePath = path.relative(directoryPath, filePath);
				if (!hookFiles[relativeFilePath]) {
					hookFiles[relativeFilePath] = true;
					const zipEntryName = path.join(moduleFolder, 'hooks', relativeFilePath);
					dest.append(fs.createReadStream(filePath), { name: zipEntryName });
				}
			});
		}
	};
	await archiveHookFilesInDirectory(path.join(this.projectDir, 'hooks'));
	await archiveHookFilesInDirectory(path.join(this.projectDir, '..', 'hooks'));

	// Add module's "Resources" directory to the archive.
	// These files will be copied to the app project's root "Resources" directory.
	if (await fs.exists(this.resourcesDir)) {
		await this.dirWalker(this.resourcesDir, (filePath, fileName) => {
			if (fileName !== 'README.md') {
				const zipEntryName = path.join(moduleFolder, 'Resources', path.relative(this.resourcesDir, filePath));
				dest.append(fs.createReadStream(filePath), { name: zipEntryName });
			}
		});
	}

	// Add "assets" directory files to the archive.
	// TODO: We already include "assets" files as JAR resources (via gradle), which is what we officially document.
	//       We should not add these files to APK "assets" as well. This doubles storage space taken.
	if (await fs.exists(this.assetsDir)) {
		await this.dirWalker(this.assetsDir, (filePath, fileName) => {
			if (fileName !== 'README') {
				let zipEntryName;
				const relativeFilePath = path.relative(this.assetsDir, filePath);
				if (path.extname(filePath).toLowerCase() !== '.js') {
					// All files (except JavaScript) will be added to APK "assets/Resources" directory.
					zipEntryName = path.join(moduleFolder, 'assets', relativeFilePath);
				} else {
					// JavaScript files are added to APK "assets/Resources/<ModuleId>" to be loaded like CommonJS.
					zipEntryName = path.join(moduleFolder, 'Resources', this.manifest.moduleid, relativeFilePath);
				}
				dest.append(fs.createReadStream(filePath), { name: zipEntryName });
			}
		});
	}

	// Add the license file to the archive.
	let hasLicenseFile = false;
	let licenseFilePath = path.join(this.projectDir, 'LICENSE');
	hasLicenseFile = await fs.exists(licenseFilePath);
	if (!hasLicenseFile) {
		licenseFilePath = path.join(this.projectDir, '..', 'LICENSE');
		hasLicenseFile = await fs.exists(licenseFilePath);
	}
	if (hasLicenseFile) {
		dest.append(fs.createReadStream(licenseFilePath), { name: path.join(moduleFolder, 'LICENSE') });
	}

	// Add "manifest" file to the archive.
	dest.append(fs.createReadStream(this.manifestFile), { name: path.join(moduleFolder, 'manifest') });

	// Add "timanifest.xml" file to the archive.
	dest.append(fs.createReadStream(this.timoduleXmlFile), { name: path.join(moduleFolder, 'timodule.xml') });

	// Create the zip file containing the above archived/buffered files.
	this.logger.info(__('Writing module zip: %s', moduleZipPath));
	dest.finalize();
};

AndroidModuleBuilder.prototype.runModule = async function () {
	// Do not run built module in an app if given command line argument "--build-only".
	if (this.buildOnly) {
		return;
	}

	const tmpDir = temp.path('ti-android-module-build-');
	let tmpProjectDir;

	function checkLine(line, logger) {
		const re = new RegExp( // eslint-disable-line security/detect-non-literal-regexp
			'(?:\u001b\\[\\d+m)?\\[?('
			+ logger.getLevels().join('|')
			+ ')\\]?\\s*(?:\u001b\\[\\d+m)?(.*)', 'i'
		);

		if (line) {
			const m = line.match(re);
			if (m) {
				logger[m[1].toLowerCase()](m[2].trim());
			} else {
				logger.debug(line);
			}
		}
	}

	async function runTiCommand(cmd, args, logger) {
		return new Promise((resolve) => {
			// when calling on Windows, we need to escape ampersands in the command
			if (process.platform === 'win32') {
				cmd.replace(/&/g, '^&');
			}

			const child = spawn(cmd, args);
			child.stdout.on('data', function (data) {
				for (const line of data.toString().split('\n')) {
					checkLine(line, logger);
				}
			});
			child.stderr.on('data', function (data) {
				for (const line of data.toString().split('\n')) {
					checkLine(line, logger);
				}
			});
			child.on('close', function (code) {
				if (code) {
					logger.error(__('Failed to run ti %s', args[0]));
					logger.log();
					process.exit(1);
				}
				resolve();
			});
		});
	}

	// Create a temp directory to build the example app project to.
	await fs.mkdirs(tmpDir);

	// Generate a new Titanium app in the temp directory which we'll later copy the "example" files to.
	// Note: App must have a diffentent id/package-name. Avoids class name collision with module generating Java code.
	this.logger.debug(__('Staging module project at %s', tmpDir.cyan));
	await runTiCommand(
		process.execPath,
		[
			process.argv[1],
			'create',
			'--id', this.manifest.moduleid + '.app',
			'-n', this.manifest.name,
			'-t', 'app',
			'-u', 'localhost',
			'-d', tmpDir,
			'-p', 'android',
			'--force'
		],
		this.logger
	);

	// Inject this module's reference into the temp app project's "tiapp.xml" file.
	// TODO: It would be more reliable to do this via "DOMParser" instead.
	tmpProjectDir = path.join(tmpDir, this.manifest.name);
	this.logger.debug(__('Created example project %s', tmpProjectDir.cyan));
	let fileContent = await fs.readFile(path.join(tmpProjectDir, 'tiapp.xml'));
	fileContent = fileContent.toString().replace(
		/<modules>/g, `<modules>\n\t\t<module platform="android" version="${this.manifest.version}">${this.manifest.moduleid}</module>`);
	await fs.writeFile(path.join(tmpProjectDir, 'tiapp.xml'), fileContent);

	// Copy files from module's "example" directory to temp app's "Resources" directory.
	appc.fs.copyDirSyncRecursive(
		this.exampleDir,
		path.join(tmpProjectDir, 'Resources'),
		{
			preserve: true,
			logger: this.logger.debug
		}
	);

	// Unzip module into temp app's "modules" directory.
	const zip = new AdmZip(this.moduleZipPath);
	zip.extractAllTo(tmpProjectDir, true);

	// Run the temp app.
	this.logger.debug(__('Running example project...', tmpDir.cyan));
	const buildArgs = [ process.argv[1], 'build', '-p', 'android', '-d', tmpProjectDir ];
	await runTiCommand(process.execPath, buildArgs, this.logger);
};

// create the builder instance and expose the public api
(function (androidModuleBuilder) {
	exports.config   = androidModuleBuilder.config.bind(androidModuleBuilder);
	exports.validate = androidModuleBuilder.validate.bind(androidModuleBuilder);
	exports.run      = androidModuleBuilder.run.bind(androidModuleBuilder);
}(new AndroidModuleBuilder(module)));
