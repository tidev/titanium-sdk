/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var suites = [];

if (Ti.Platform.osname === 'android') {
	suites = suites.concat([
		{name: "ui/ui"},
		{name: "ui_controls"},
		{name: "android/android_ui/android_ui"},
		{name: "includes/includes"},
		{name: "ui_layout"},
		{name: "ui_layout_horizontal_vertical"}
	]);

}


/*
these lines must be present and should not be modified.  "suites" argument to setSuites is 
expected to be an array (should be an empty array at the very least in cases where population of 
the suites argument is based on platform type and may result in no valid suites being added to the 
argument)
*/
var init = require("init");
init.setSuites(suites);
init.start();
