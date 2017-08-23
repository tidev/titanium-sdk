'use strict';

const path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	ant = require('./ant'),
	utils = require('./utils'),
	copyFile = utils.copyFile,
	copyFiles = utils.copyFiles,
	copyAndModifyFile = utils.copyAndModifyFile,
	globCopy = utils.globCopy;

function readProperties(filepath) {
	var contents = fs.readFileSync(filepath).toString().replace(/\r\n/g, '\n'),
		regexp = /^([^=]+)\s*=\s*(.+)$/gm,
		matches,
		result = {};
	while ((matches = regexp.exec(contents))) {
		result[matches[1]] = matches[2];
	}
	return result;
}

/**
 * @param {Object} options options object
 * @param {String} options.androidSdk path to the Android SDK to build with
 * @param {String} options.androidNdk path to the Andorid NDK to build with
 * @param {String|Number} options.apiLevel APILevel to build against
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
 * @constructor
 */
function Android(options) {
	this.androidSDK = options.androidSdk;
	this.androidNDK = options.androidNdk;
	this.apiLevel = options.apiLevel;
	this.sdkVersion = options.sdkVersion;
	this.gitHash = options.gitHash;
}

Android.prototype.clean = function (next) {
	ant.build(path.join(__dirname, '..', 'android', 'build.xml'), [ 'clean' ], {}, next);
};

Android.prototype.build = function (next) {
	var AndroidSDK = require('./androidsdk'),
		sdk = new AndroidSDK(this.androidSDK, this.apiLevel),
		properties = {
			'build.version': this.sdkVersion,
			'build.githash': this.gitHash,
			'android.sdk': sdk.getAndroidSDK(),
			'android.platform': sdk.getPlatformDir(),
			'google.apis': sdk.getGoogleApisDir(),
			'kroll.v8.build.x86': 1,
			'android.ndk': this.androidNDK
		};
	ant.build(path.join(__dirname, '..', 'android', 'build.xml'), [ 'full.build' ], properties, next);
};

Android.prototype.package = function (packager, next) {
	console.log('Zipping Android platform...');
	// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
	const DIST_ANDROID = path.join(packager.outputDir, 'android'),
		ANDROID_ROOT = path.join(packager.srcDir, 'android'),
		ANDROID_DEST = path.join(packager.zipSDKDir, 'android'),
		MODULE_ANDROID = path.join(packager.zipSDKDir, 'module', 'android'),
		ANDROID_MODULES = path.join(ANDROID_DEST, 'modules');

	// TODO parallelize some
	async.series([
		// Copy dist/android/*.jar, dist/android/modules.json
		function (cb) {
			copyFiles(DIST_ANDROID, ANDROID_DEST, [ 'titanium.jar', 'kroll-apt.jar', 'kroll-common.jar', 'kroll-v8.jar', 'modules.json' ], cb);
		},
		// Copy android/dependency.json, android/cli/, and android/templates/
		function (cb) {
			copyFiles(ANDROID_ROOT, ANDROID_DEST, [ 'cli', 'templates', 'dependency.json' ], cb);
		},
		// copy android/package.json, but replace __VERSION__ with our version!
		function (cb) {
			copyAndModifyFile(ANDROID_ROOT, ANDROID_DEST, 'package.json', { '__VERSION__': this.sdkVersion }, cb);
		}.bind(this),
		// include headers for v8 3rd party module building
		function (cb) {
			fs.mkdirsSync(path.join(ANDROID_DEST, 'native', 'include'));
			globCopy('**/*.h', path.join(ANDROID_ROOT, 'runtime', 'v8', 'src', 'native'), path.join(ANDROID_DEST, 'native', 'include'), cb);
		},
		function (cb) {
			globCopy('**/*.h', path.join(ANDROID_ROOT, 'runtime', 'v8', 'generated'), path.join(ANDROID_DEST, 'native', 'include'), cb);
		},
		function (cb) {
			const v8Props = readProperties(path.join(ANDROID_ROOT, 'build', 'libv8.properties')),
				src = path.join(DIST_ANDROID, 'libv8', v8Props['libv8.version'], v8Props['libv8.mode'], 'include');
			globCopy('**/*.h', src, path.join(ANDROID_DEST, 'native', 'include'), cb);
		},
		// add js2c.py for js -> C embedding
		function (cb) {
			copyFiles(path.join(ANDROID_ROOT, 'runtime', 'v8', 'tools'), MODULE_ANDROID, [ 'js2c.py', 'jsmin.py' ], cb);
		},
		// include all native shared libraries TODO Adjust to only copy *.so files, filter doesn't work well for that
		function (cb) {
			fs.copy(path.join(DIST_ANDROID, 'libs'), path.join(ANDROID_DEST, 'native', 'libs'), cb);
		},
		function (cb) {
			copyFile(DIST_ANDROID, MODULE_ANDROID, 'ant-tasks.jar', cb);
		},
		function (cb) {
			copyFile(path.join(ANDROID_ROOT, 'build', 'lib'), MODULE_ANDROID, 'ant-contrib-1.0b3.jar', cb);
		},
		// Copy JARs from android/kroll-apt/lib
		function (cb) {
			globCopy('**/*.jar', path.join(ANDROID_ROOT, 'kroll-apt', 'lib'), ANDROID_DEST, cb);
		},
		// Copy JARs from android/titanium/lib
		function (cb) {
			fs.copy(path.join(ANDROID_ROOT, 'titanium', 'lib'), ANDROID_DEST, { filter: function (src) {
				// Don't copy commons-logging-1.1.1.jar
				return src.indexOf('commons-logging-1.1.1') === -1;
			} }, cb);
		},
		// Copy android/modules/*/lib/*.jar
		function (cb) {
			const moduleDirs = fs.readdirSync(path.join(ANDROID_ROOT, 'modules'));
			async.each(moduleDirs, function (dir, callback) {
				const moduleLibDir = path.join(ANDROID_ROOT, 'modules', dir, 'lib');
				if (fs.existsSync(moduleLibDir)) {
					globCopy('*.jar', moduleLibDir, ANDROID_DEST, callback);
				} else {
					callback();
				}
			}, cb);
		},
		// Copy over module resources
		function (cb) {
			const filterRegExp = new RegExp('\\' + path.sep  + 'android(\\' + path.sep + 'titanium-(.+)?.(jar|res.zip|respackage))?$'); // eslint-disable-line security/detect-non-literal-regexp
			fs.copy(DIST_ANDROID, ANDROID_MODULES, { filter: filterRegExp }, cb);
		}
	], next);
};

module.exports = Android;
