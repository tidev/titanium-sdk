/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This script is loaded on app startup on all platforms. It is used to do the following:
 * - Provide consistent startup behavior between platforms, such as logging Titanium version.
 * - Load Titanium's core JavaScript extensions shared by all platforms.
 * - Provide "*.bootstrap.js" script support. (Similar to native module onAppCreate()/load() support.)
 * - Load the app developer's main "app.js" script after doing all of the above.
 */

'use strict';

// Log the app name, app version, and Titanium version on startup.
Ti.API.info(Ti.App.name + ' ' + Ti.App.version + ' (Powered by Titanium ' + Ti.version + '.' + Ti.buildHash + ')');

// Load all JavaScript extensions.
require('./ti.internal/extensions/Error');

// Load and execute all "*.bootstrap.js" files.
// Note: This must be done after loading extensions since bootstraps might depend on them.
require('./ti.internal/bootstrap.loader').loadAsync(function () {
	// We've finished loading/executing all bootstrap scripts.
	// We can now proceed to run the main "app.js" script.
	if (Ti.Android) {
		// On Android, Titanium 7.5.x can launch another UI stack for the same JS runtime via an intent.
		// The require() function has already cached "app.js" in this case. We must re-execute it explicitly.
		// Note: Below is not needed as of 8.0.0 since intents in that version will resume existing UI instead.
		if (global.Module.cache['/app.js']) {
			var scriptText = Ti.Filesystem.getFile('app.js').read().text;
			global.kroll.binding('evals').Script.runInThisContext(scriptText, '/app.js', true);
			return;
		}
	}
	require('./app');
});
