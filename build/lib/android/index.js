'use strict';

const path = require('path');
const fs = require('fs-extra');
const AndroidSDK = require('./androidsdk');
const ant = require('./ant');
const git = require('../git');
const utils = require('../utils');
const copyFile = utils.copyFile;
const copyFiles = utils.copyFiles;
const copyAndModifyFile = utils.copyAndModifyFile;
const globCopy = utils.globCopy;

const ROOT_DIR = path.join(__dirname, '..', '..', '..');

const ANDROID_BUILD_XML = path.join(__dirname, '../../../android/build.xml');
const V8_STRING_VERSION_REGEXP = /(\d+)\.(\d+)\.\d+\.\d+/;

class Android {
	/**
	 * @param {Object} options options object
	 * @param {String} options.androidSdk path to the Android SDK to build with
	 * @param {String} options.androidNdk path to the Andorid NDK to build with
	 * @param {String|Number} options.apiLevel APILevel to build against
	 * @param {String} options.sdkVersion version of Titanium SDK
	 * @param {String} options.gitHash SHA of Titanium SDK HEAD
	 * @constructor
	 */
	constructor (options) {
		this.androidSDK = options.androidSdk;
		this.androidNDK = options.androidNdk;
		this.apiLevel = options.apiLevel;
		this.sdkVersion = options.sdkVersion;
		this.gitHash = options.gitHash;
		this.sdk = new AndroidSDK(this.androidSDK, this.apiLevel);
		this.antProperties = {
			'build.version': this.sdkVersion,
			'build.githash': this.gitHash,
			'android.sdk': this.sdk.getAndroidSDK(),
			'android.platform': this.sdk.getPlatformDir(),
			'google.apis': this.sdk.getGoogleApisDir(),
			'kroll.v8.build.x86': 1,
			'android.ndk': this.androidNDK
		};
	}

	babelOptions() {
		const v8Version = require(path.join(ROOT_DIR, 'android', 'package.json')).v8.version; // eslint-disable-line security/detect-non-literal-require
		const v8VersionGroup = v8Version.match(V8_STRING_VERSION_REGEXP);
		const version = parseInt(v8VersionGroup[1] + v8VersionGroup[2]);

		return {
			targets: {
				chrome: version
			}
		};
	}

	async clean() {
		return ant.build(ANDROID_BUILD_XML, [ 'clean' ], this.antProperties);
	}

	async build() {

		// Clean build and download V8
		await this.clean();

		// Generate snapshots
		const snapshot = require('./snapshot');
		await snapshot.build().catch(error => console.warn('Failed to generate snapshots: ' + error));

		// Build Titanium Android SDK
		return ant.build(ANDROID_BUILD_XML, [ 'build' ], this.antProperties);
	}

	async package(packager) {
		console.log('Zipping Android platform...');
		// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
		const DIST_ANDROID = path.join(packager.outputDir, 'android');
		const ANDROID_ROOT = path.join(packager.srcDir, 'android');
		const ANDROID_DEST = path.join(packager.zipSDKDir, 'android');
		const MODULE_ANDROID = path.join(packager.zipSDKDir, 'module', 'android');
		const ANDROID_MODULES = path.join(ANDROID_DEST, 'modules');

		// TODO parallelize some

		// Copy dist/android/*.jar, dist/android/modules.json
		await copyFiles(DIST_ANDROID, ANDROID_DEST, [ 'titanium.jar', 'kroll-apt.jar', 'kroll-common.jar', 'kroll-v8.jar', 'java_websocket.jar', 'modules.json' ]);

		// Copy android/dependency.json, android/cli/, and android/templates/
		await copyFiles(ANDROID_ROOT, ANDROID_DEST, [ 'cli', 'templates', 'dependency.json' ]);

		// copy android/package.json, but replace __VERSION__ with our version!
		await copyAndModifyFile(ANDROID_ROOT, ANDROID_DEST, 'package.json', { __VERSION__: this.sdkVersion });

		// include headers for v8 3rd party module building
		await fs.mkdirs(path.join(ANDROID_DEST, 'native', 'include'));
		await globCopy('**/*.h', path.join(ANDROID_ROOT, 'runtime/v8/src/native'), path.join(ANDROID_DEST, 'native/include'));
		await globCopy('**/*.h', path.join(ANDROID_ROOT, 'runtime/v8/generated'), path.join(ANDROID_DEST, 'native/include'));

		const v8Props = require(path.join(ANDROID_ROOT, 'package.json')).v8; // eslint-disable-line security/detect-non-literal-require
		const src = path.join(DIST_ANDROID, 'libv8', v8Props.version, v8Props.mode, 'include');
		await globCopy('**/*.h', src, path.join(ANDROID_DEST, 'native/include'));

		// add js2c.py for js -> C embedding
		await copyFiles(path.join(ANDROID_ROOT, 'runtime/v8/tools'), MODULE_ANDROID, [ 'js2c.py', 'jsmin.py' ]);

		// include all native shared libraries TODO Adjust to only copy *.so files, filter doesn't work well for that
		await fs.copy(path.join(DIST_ANDROID, 'libs'), path.join(ANDROID_DEST, 'native/libs'));

		await copyFile(DIST_ANDROID, MODULE_ANDROID, 'ant-tasks.jar');

		await copyFile(path.join(ANDROID_ROOT, 'build/lib'), MODULE_ANDROID, 'ant-contrib-1.0b3.jar');

		// Copy JARs from android/kroll-apt/lib
		await globCopy('**/*.jar', path.join(ANDROID_ROOT, 'kroll-apt/lib'), ANDROID_DEST);

		// Copy JARs from android/titanium/lib
		await fs.copy(path.join(ANDROID_ROOT, 'titanium/lib'), ANDROID_DEST, {
			// Don't copy commons-logging-1.1.1.jar
			filter: src => !src.includes('commons-logging-1.1.1')
		});

		// Copy android/modules/*/lib/*.jar
		await this.copyModuleLibraries(path.join(ANDROID_ROOT, 'modules'), ANDROID_DEST);

		// Discard local changes on the generated V8Snapshots.h
		await git.discardLocalChange(ANDROID_ROOT, 'runtime/v8/src/native/V8Snapshots.h');

		// Copy over module resources
		const filterRegExp = new RegExp('\\' + path.sep  + 'android(\\' + path.sep + 'titanium-(.+)?.(jar|res.zip|respackage))?$'); // eslint-disable-line security/detect-non-literal-regexp
		return fs.copy(DIST_ANDROID, ANDROID_MODULES, { filter: src => filterRegExp.test(src) });
	}

	/**
	 * Copies each module's jarfiles under the lib directory
	 * @param {string} modulesDir path to android/modules src dir
	 * @param {string} destination destination folder
	 */
	async copyModuleLibraries(modulesDir, destination) {
		const moduleDirs = await fs.readdir(modulesDir);
		for (const dir of moduleDirs) {
			// skip geolocation
			if (dir === 'geolocation') {
				continue;
			}

			const moduleLibDir = path.join(modulesDir, dir, 'lib');
			if (await fs.exists(moduleLibDir)) {
				await globCopy('*.jar', moduleLibDir, destination);
			}
		}
	}
}

module.exports = Android;
