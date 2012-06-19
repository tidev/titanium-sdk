var harnessGlobal = new Object();

harnessGlobal.common = require("common");
harnessGlobal.common.init(harnessGlobal);

harnessGlobal.util = require("util");
harnessGlobal.util.init(harnessGlobal);

harnessGlobal.suites = [];

if (Ti.Platform.osname === 'android') {
	harnessGlobal.suites = harnessGlobal.suites.concat([
		{name: "android/android/android"}
	]);
}

harnessGlobal.socketPort = 40404;
harnessGlobal.common.connectToDriver();
