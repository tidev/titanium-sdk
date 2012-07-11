/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: common init file for each harness
 *
 * Description: contains common initialization logic that should run in every app.js file used 
 * within a test harness
 */

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

module.exports = new function() {
	// set the suites on the global for later use
	this.setSuites = function(suites) {
		harnessGlobal.suites = suites;
	};

	// start the test run
	this.start = function() {
		harnessGlobal.common.connectToDriver();
	};
};
