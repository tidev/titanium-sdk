'use strict';
var filter = require('../mocha-filter'),
	filters = {},
	Utility = {};

Utility.isIPhone = function () {
	return Ti.Platform.osname === 'iphone';
};

Utility.isIPad = function () {
	return Ti.Platform.osname === 'ipad';
};

Utility.isIOS = function () {
	return this.isIPhone() || this.isIPad();
};

Utility.isAndroid = function () {
	return (Ti.Platform.osname === 'android');
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

// Use custom mocha filters for platform-specific tests
filters = {
	android: function () {
		return Utility.isAndroid();
	},
	ios: function () {
		return Utility.isIOS();
	},
	windows: function () {
		return Utility.isWindows();
	},
	// To mark APIs meant to be cross-platform but missing from a given platform
	androidMissing: function () {
		if (Utility.isAndroid()) {
			return 'skip';
		}
		return true;
	},
	iosMissing: function () {
		if (Utility.isIOS()) {
			return 'skip';
		}
		return true;
	},
	windowsMissing: function () {
		if (Utility.isWindows()) {
			return 'skip';
		}
		return true;
	},
	// to mark when there's a bug in both iOS and Android impl
	androidAndIosBroken: function () {
		if (Utility.isAndroid() || Utility.isIOS()) {
			return 'skip';
		}
		return true;
	},
	// to mark when there's a bug in both iOS and Windows impl
	iosAndWindowsBroken: function () {
		if (Utility.isWindows() || Utility.isIOS()) {
			return 'skip';
		}
		return true;
	},
	// mark bugs specific to Windows 8.1 Desktop/Store
	windowsDesktop81Broken: function () {
		if (Utility.isWindows8_1() || Utility.isWindowsDesktop()) {
			return 'skip';
		}
		return true;
	},
	// mark bugs specific to Windows 8.1 Phone
	windowsPhone81Broken: function () {
		if (Utility.isWindows8_1() || Utility.isWindowsPhone()) {
			return 'skip';
		}
		return true;
	},
	// mark bugs specific to Windows Emulator
	windowsEmulatorBroken: function () {
		if (Utility.isWindowsEmulator()) {
			return 'skip';
		}
		return true;
	},
	// mark bugs specific to Windows 8.1
	windows81Broken: function () {
		if (Utility.isWindows8_1()) {
			return 'skip';
		}
		return true;
	},
	allBroken: function () {
		return 'skip';
	}
};
// Alias broken tests on a given platform to "missing" filter for that platform.
// This is just handy to try and label where we have gaps in our APIs versus where we have bugs in our impl for a given platform
filters.androidBroken = filters.androidMissing;
filters.iosBroken = filters.iosMissing;
filters.windowsBroken = filters.windowsMissing;
// Add our custom filters
filter.addFilters(filters);

module.exports = Utility;
