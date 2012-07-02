/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// start customization here
var suites = [
	{name: "includes/includes"}
]
// end customization here


var harnessGlobal = new Object();

// load required modules
harnessGlobal.common = require("common");
harnessGlobal.common.init(harnessGlobal);

harnessGlobal.util = require("util");
harnessGlobal.util.init(harnessGlobal);

// load required properties
harnessGlobal.socketPort = Ti.App.Properties.getInt("driver.socketPort");
harnessGlobal.httpHost = Ti.App.Properties.getString("driver.httpHost");
harnessGlobal.httpPort = Ti.App.Properties.getInt("driver.httpPort");

// set the suites on the global for later use
harnessGlobal.suites = suites;

// start the test run
harnessGlobal.common.connectToDriver();
