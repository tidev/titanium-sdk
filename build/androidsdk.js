var os = require('os'),
	fs = require('fs-extra'),
	path = require('path'),
	DEFAULT_API_LEVEL = 23,
	ANDROID_API_LEVELS = {
		3: 'android-1.5',
		4: 'android-1.6',
		5: 'android-2.0',
		6: 'android-2.0.1',
		7: 'android-2.1',
		8: 'android-2.2',
		9: 'android-2.3',
		10: 'android-2.3.3',
		11: 'android-3.0'
	};

/**
 * Given a hinted at location of Android SDK, find one.
 *
 * @param  {String} supplied path to an Android SDK install.
 * @return {String} detected SDK directory
 */
function resolve(supplied) {
	var defaultDirs = ['/opt/android', '/opt/android-sdk', '/usr/android', '/usr/android-sdk'];
	if (os.platform() == 'win32') {
		defaultDirs = ['C:\\android-sdk', 'C:\\android', 'C:\\Program Files\\android-sdk', 'C:\\Program Files\\android']
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

	for (var i = 0; i < defaultDirs.length; i++) {
		if (fs.existsSync(defaultDirs[i])) {
			return defaultDirs[i];
		}
	}

	// TODO Search PATH
	var path = process.env.PATH;
	// for dir in os.path.split(os.pathsep):
	// 	if os.path.exists(os.path.join(dir, 'android')) \
	// 		or os.path.exists(os.path.join(dir, 'android.exe')):
	// 			return dir
	return null;
}

function AndroidSDK(dir, apiLevel) {
	this.dir = resolve(dir);
	this.apiLevel = apiLevel || DEFAULT_API_LEVEL;
}

AndroidSDK.prototype.getAndroidSDK = function() {
	return this.dir;
};
AndroidSDK.prototype.getPlatformDir = function() {
	// TODO Check for "old style" dirs using ANDROID_API_LEVELS? Do we even support any of those old ones?
	var possible = path.join(this.dir, 'platforms', 'android-' + this.apiLevel);
	if (fs.existsSync(possible)) {
		return possible;
	}
};
AndroidSDK.prototype.getGoogleApisDir = function() {
	var possible = path.join(this.dir, 'add-ons', 'addon-google_apis-google-' + this.apiLevel);
	if (fs.existsSync(possible)) {
		return possible;
	}
};
module.exports = AndroidSDK;
