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

// Attempt to load crash analytics module.
// NOTE: This should always be the first module that loads on startup.
import './ti.internal/aca';

// Log the app name, app version, and Titanium version on startup.
Ti.API.info(`${Ti.App.name} ${Ti.App.version} (Powered by Titanium ${Ti.version}.${Ti.buildHash})`);

// Load JS language polyfills
import 'core-js/es';
// Load polyfill for async/await usage
import 'regenerator-runtime/runtime';
// import all of our polyfills/extensions
import './ti.internal/extensions';

// Load and execute all "*.bootstrap.js" files.
// Note: This must be done after loading extensions since bootstraps might depend on them.
import loadAsync from './ti.internal/bootstrap.loader';
loadAsync(function () {
	// We've finished loading/executing all bootstrap scripts.
	// We can now proceed to run the main "app.js" script.
	require('./app');

	// This event is to be fired after "app.js" execution. Reasons:
	// - Allow system to queue startup related events until "app.js" has had a chance to add listeners.
	// - For Alloy apps, we now know that Alloy has been initialized and its globals were added.
	Ti.App.fireEvent('started');
});
