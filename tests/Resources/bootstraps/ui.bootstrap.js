/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

// Note: This script's file name must end with "*.bootstrap.js" to be auto-loaded by Titainum.

// Log that this bootstrap was automatically loaded on startup.
Ti.API.info('"ui.bootstrap.js" has been required-in.');

// Flag this bootstrap as loaded. To be read by "ti.bootstrap.test.js" script.
global.wasUIBootstrapLoaded = true;

// To be called by Titanium's bootstrap loader on startup, but before the "app.js" gets executed.
exports.execute = function (finished) {
	//
	// FIXME Windows: TIMOB-26457 - Window.exitOnClose doesn't work when only one Window is opened
	//
	if (Ti.Platform.osname === 'windowsphone' || Ti.Platform.osname === 'windowsstore') {
		global.wasUIBootstrapExecuted = true;
		return finished();
	}
	// Display a window. (This is the intended use-case for the bootstrap execute() method.)
	var window = Ti.UI.createWindow({ exitOnClose: false });
	window.add(Ti.UI.createLabel({ text: 'Bootstrapped UI' }));
	window.open();

	// Close the window 1 second later.
	setTimeout(function () {
		// Flag this bootstrap as executed. To be read by "ti.bootstrap.test.js" script.
		global.wasUIBootstrapExecuted = true;

		// Close the window.
		window.close();

		// Notify Titanium that this bootstrap is done and it's time to proceed.
		finished();
	}, 1000);
};
