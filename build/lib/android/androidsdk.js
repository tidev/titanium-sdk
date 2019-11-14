'use strict';

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const DEFAULT_API_LEVEL = require(path.join(__dirname, '../../../android/package.json')).compileSDKVersion; // eslint-disable-line security/detect-non-literal-require

/**
 * Given a hinted at location of Android SDK, find one.
 *
 * @param  {String} supplied path to an Android SDK install.
 * @return {String} detected SDK directory
 */
function resolve(supplied) {
	// TODO: Re-use same code as node-titanium-sdk's android detection!
	let defaultDirs = [ '/opt/android', '/opt/android-sdk', '/usr/android', '/usr/android-sdk' ];
	if (os.platform() === 'win32') {
		defaultDirs = [ 'C:\\android-sdk', 'C:\\android', 'C:\\Program Files\\android-sdk', 'C:\\Program Files\\android' ];
	}

	if (supplied) {
		// TODO Check dir they gave us
		if (fs.existsSync(supplied)) {
			return supplied;
		}
	}

	if (process.env.ANDROID_SDK) {
		if (fs.existsSync(process.env.ANDROID_SDK)) {
			return process.env.ANDROID_SDK;
		}
	}

	for (let i = 0; i < defaultDirs.length; i++) {
		if (fs.existsSync(defaultDirs[i])) {
			return defaultDirs[i];
		}
	}

	// TODO Search PATH
	// var path = process.env.PATH;
	// for dir in os.path.split(os.pathsep):
	// 	if os.path.exists(os.path.join(dir, 'android')) \
	// 		or os.path.exists(os.path.join(dir, 'android.exe')):
	// 			return dir
	return null;
}

/**
 * Represents an installed Android SDK
 * @param       {string} dir install root of Android SDK
 * @param       {number} apiLevel integer api level to use to build
 * @constructor
 */
function AndroidSDK(dir, apiLevel) {
	this.dir = resolve(dir);
	this.apiLevel = apiLevel || DEFAULT_API_LEVEL;
}

AndroidSDK.prototype.getAndroidSDK = function () {
	return this.dir;
};

AndroidSDK.prototype.getPlatformDir = function () {
	const possible = path.join(this.dir, 'platforms', 'android-' + this.apiLevel);
	if (fs.existsSync(possible)) {
		return possible;
	}
	console.error('Android build is set to use API Level %d, but was unable to find expected SDK component at %s', this.apiLevel, possible);
	console.error('Please install platforms;android-%d or Specify a different api level to build against with the -a option', this.apiLevel);
	process.exit(1);
};

AndroidSDK.prototype.getGoogleApisDir = function () {
	// FIXME This no longer lives as a separate addon like this.
	// Do we really need this? I think we don't anymore since Ti.map got broken out to it's own native module!
	// Also, if we do want to reference maps.jar, it's now inside extras/google/m2repository/com/google/android/gms/play-services-maps/11.0.4/play-services-maps-11.0.4.aar
	const possible = path.join(this.dir, 'add-ons', 'addon-google_apis-google-' + this.apiLevel);
	if (fs.existsSync(possible)) {
		return possible;
	}
	// console.warn('Android build is set to use API Level %d, but was unable to find expected Google APIs SDK component at %s', this.apiLevel, possible);
};

module.exports = AndroidSDK;
