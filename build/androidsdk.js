'use strict';

var os = require('os'),
	fs = require('fs-extra'),
	path = require('path'),
	DEFAULT_API_LEVEL = 25;

/**
 * Given a hinted at location of Android SDK, find one.
 *
 * @param  {String} supplied path to an Android SDK install.
 * @return {String} detected SDK directory
 */
function resolve(supplied) {
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
};

AndroidSDK.prototype.getGoogleApisDir = function () {
	const possible = path.join(this.dir, 'add-ons', 'addon-google_apis-google-' + this.apiLevel);
	if (fs.existsSync(possible)) {
		return possible;
	}
};

module.exports = AndroidSDK;
