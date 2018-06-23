/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Description:
 * This script recursively searches the "Resources" directory for all JavaScript files
 * named "bootstrap.js" or ending with the name "*.bootstrap.js" and then executes them.
 * The main intention of this feature is to all JavaScript to kick-off functionality or
 * display UI to the end-user before the "app.js" gets loaded. This feature is the CommonJS
 * equivalent to Titanium's Android module onAppCreate() or iOS module load() features.
 * 
 * Use-Cases:
 * - Automatically kick-off analytics functionality on app startup.
 * - Ensure "Google Play Services" is installed/updated on app startup on Android.
 */

'use strict';

var JS_EXTENSION = '.js',
	BOOTSTRAP_FILE_NAME = 'bootstrap' + JS_EXTENSION,
	BOOTSTRAP_SUFFIX = '.' + BOOTSTRAP_FILE_NAME;

exports.loadAsync = function (finished) {
	var resourceDirectory = Ti.Filesystem.getFile(Ti.Filesystem.getResourcesDirectory()),
		resourceDirectoryPath = resourceDirectory.nativePath,
		bootstrapScripts = [];

	// Fetches all "*.bootstrap.js" files under given directory and adds them to the "bootstrapScripts" array.
	// The names stored in the array can be loaded via require() method.
	function fetchBootstrapScriptsFrom(file) {
		var index,
			fileNameArray,
			bootstrapPath;

		if (file) {
			if (file.isDirectory()) {
				// This is a directory. Recursively look for bootstrap files under it.
				fileNameArray = file.getDirectoryListing();
				if (fileNameArray) {
					for (index = 0; index < fileNameArray.length; index++) {
						fetchBootstrapScriptsFrom(Ti.Filesystem.getFile(file.nativePath, fileNameArray[index]));
					}
				}
			} else if ((file.name === BOOTSTRAP_FILE_NAME) || file.name.endsWith(BOOTSTRAP_SUFFIX)) {
				// This is a bootstrap file.
				// Convert its path to something loadable via require() and add it to the array.
				bootstrapPath = file.nativePath;
				bootstrapPath = bootstrapPath.substr(
					resourceDirectoryPath.length,
					(bootstrapPath.length - resourceDirectoryPath.length) - JS_EXTENSION.length);
				bootstrapScripts.push(bootstrapPath);
			}
		}
	}
	fetchBootstrapScriptsFrom(resourceDirectory);

	// Sort the bootstrap scripts so that they'll be loaded in a consistent order between platforms.
	bootstrapScripts.sort();

	// Loads all bootstrap scripts found before loading the "app.js" script.
	function loadBootstrapScripts(finished) {
		var bootstrapIndex = 0;
		function doLoad() {
			// Attempt to load all bootstrap scripts.
			var fileName, bootstrap;
			while (bootstrapIndex < bootstrapScripts.length) {
				// Load the next bootstrap.
				fileName = bootstrapScripts[bootstrapIndex];
				bootstrap = require(fileName);

				// Invoke the bootstrap's execute() method if it has one. (This is optional.)
				// We must wait for the given callback to be invoked before loading the next script.
				// Note: This is expected to be used to display UI to the end-user.
				if (bootstrap.execute) {
					bootstrap.execute(onBootstrapExecutionFinished);
					return;
				}

				// We're done with the current bootstrap. Time to load the next one.
				bootstrapIndex++;
			}

			// We're done. Invoke given callback so that the "app.js" can be loaded.
			finished();
		}
		function onBootstrapExecutionFinished() {
			// Last bootstrap has finished execution. Time to load the next one.
			// Note: Add a tiny delay so whatever UI the last bootstrap loaded has time to close.
			bootstrapIndex++;
			setTimeout(function () {
				doLoad();
			}, 1);
		}
		doLoad();
	}
	loadBootstrapScripts(function () {
		// We've finished loading/executing all bootstrap scripts.
		// We can now proceed to run the main "app.js" script.
		finished();
	});
};
