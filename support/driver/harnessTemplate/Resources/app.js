var harnessGlobal = new Object();
harnessGlobal.required = new Object();

harnessGlobal.required.common = require("common");
harnessGlobal.required.common.init(harnessGlobal);

harnessGlobal.required.util = require("util");
harnessGlobal.required.util.init(harnessGlobal);

harnessGlobal.suites = [
	{
		name: "s1",
		file: "s1.js",
		version: 2
	},
	{
		name: "s2",
		file: "s2.js",
		version: 1.1
	}
]

harnessGlobal.currentSuite = {};

harnessGlobal.socketPort = 40402;
harnessGlobal.required.common.connectToDriver();
