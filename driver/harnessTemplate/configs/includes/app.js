var harnessGlobal = new Object();

harnessGlobal.common = require("common");
harnessGlobal.common.init(harnessGlobal);

harnessGlobal.util = require("util");
harnessGlobal.util.init(harnessGlobal);

harnessGlobal.suites = [
	{name: "includes/includes"}
]

harnessGlobal.socketPort = 40404;
harnessGlobal.common.connectToDriver();
