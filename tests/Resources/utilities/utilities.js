'use strict';

const Utility = {};
Utility.isIPhone = function () {
	return Ti.Platform.osname === 'iphone';
};

Utility.isIPad = function () {
	return Ti.Platform.osname === 'ipad';
};

Utility.isIOS = function () {
	return this.isIPhone() || this.isIPad();
};

Utility.isMacOS = function () {
	return Ti.Platform.name === 'Mac OS X';
};

Utility.isAndroid = function () {
	return (Ti.Platform.osname === 'android');
};

Utility.isAndroidARM64Emulator = function () {
	return this.isAndroid() && Ti.Platform.model === 'Android SDK built for arm64';
};

Utility.isWindowsPhone = function () {
	return Ti.Platform.osname === 'windowsphone';
};

Utility.isWindowsDesktop = function () {
	return Ti.Platform.osname === 'windowsstore';
};

Utility.isWindows = function () {
	return this.isWindowsPhone() || this.isWindowsDesktop();
};

Utility.isWindows10 = function () {
	return this.isWindows() && Ti.Platform.version.indexOf('10.0') === 0;
};

Utility.isWindowsEmulator = function () {
	return Ti.Platform.model === 'Microsoft Virtual';
};

Utility.isWindows8_1 = function () {
	// We've seen 6.3.9600 and 6.3.9651.0 - so assume 6.3.x is Windows 8.1.x
	return this.isWindows() && Ti.Platform.version.indexOf('6.3.') === 0;
};

module.exports = Utility;
