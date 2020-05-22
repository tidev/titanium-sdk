/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Description:
 * This script loads all JavaScript files ending with the name "*.bootstrap.js" and then executes them.
 * The main intention of this feature is to allow JavaScript files to kick-off functionality or
 * display UI to the end-user before the "app.js" gets loaded. This feature is the CommonJS
 * equivalent to Titanium's Android module onAppCreate() or iOS module load() features.
 *
 * Use-Cases:
 * - Automatically kick-off analytics functionality on app startup.
 * - Ensure "Google Play Services" is installed/updated on app startup on Android.
 */

/** Set true if this bootstrap loader has already added its own event listener to Ti.UI module. */
let hasAddedUIEventListener = false;

/**
 * Attempts to load all bootstraps from a "bootstrap.json" file created by the app build system.
 * This is an optional feature and is the fastest method of acquiring boostraps configured for the app.
 * This JSON file, if provided, must be in the same directory as this script.
 * @returns {string[]}
 * Returns an array of require() compatible strings if bootstraps were successfully loaded from JSON.
 * Returns an empty array if JSON file was found, but no bootstraps were configured for the app.
 * Returns null if JSON file was not found.
 */
function fetchScriptsFromJson() {
	const JSON_FILE_NAME = 'bootstrap.json';

	try {
		const jsonFile = Ti.Filesystem.getFile(
			Ti.Filesystem.resourcesDirectory, `ti.internal/${JSON_FILE_NAME}`);
		if (jsonFile.exists()) {
			const settings = JSON.parse(jsonFile.read().text);
			if (Array.isArray(settings.scripts)) {
				return settings.scripts;
			}
			return [];
		}
	} catch (error) {
		Ti.API.error(`Failed to read "${JSON_FILE_NAME}". Reason: ${error.message}`);
	}
	return null;
}

/**
 * Recursively searches the "Resources" directory for all "*.bootstrap.js" files.
 * @returns {Array.<string>}
 * Returns an array of require() compatible strings for each bootstrap found in the search.
 * Returns an empty array if no bootstrap files were found.
 */
function fetchScriptsFromResourcesDirectory() {
	const resourceDirectory = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
	const resourceDirectoryPathLength = resourceDirectory.nativePath.length;
	const bootstrapScripts = [];

	function loadFrom(file) {
		if (file) {
			if (file.isDirectory()) {
				// This is a directory. Recursively look for bootstrap files under it.
				const fileNameArray = file.getDirectoryListing();
				if (fileNameArray) {
					for (let index = 0; index < fileNameArray.length; index++) {
						loadFrom(Ti.Filesystem.getFile(file.nativePath, fileNameArray[index]));
					}
				}
			} else if (file.name.search(/.bootstrap.js$/) >= 0) {
				// This is a bootstrap file.
				// Convert its path to something loadable via require() and add it to the array.
				let bootstrapPath = file.nativePath;
				bootstrapPath = bootstrapPath.substr(
					resourceDirectoryPathLength,
					(bootstrapPath.length - resourceDirectoryPathLength) - '.js'.length);
				bootstrapScripts.push(bootstrapPath);
			}
		}
	}
	loadFrom(resourceDirectory);
	return bootstrapScripts;
}

/**
 * Invokes a bootstrap's async execute() or showUI() function.
 * @param {Function} callback Reference to the bootstrap's execute() or showUI() function.
 */
async function invokeAsyncCallback(callback) {
	return new Promise((resolve, reject) => {
		const promise = callback(resolve);
		if (promise) {
			promise.then(resolve).catch(reject);
		}
	});
}

/** Non-blocking function which loads and executes all bootstrap scripts configured for the app. */
async function loadAsync() {
	// Acquire an array of all bootstrap scripts included with the app.
	// - For best performance, attempt to fetch scripts via an optional JSON file created by the build system.
	// - If JSON file not found (will return null), then search "Resources" directory for bootstrap files.
	let bootstrapScripts = fetchScriptsFromJson();
	if (!bootstrapScripts) {
		bootstrapScripts = fetchScriptsFromResourcesDirectory();
		if (!bootstrapScripts) {
			bootstrapScripts = [];
		}
	}

	// Sort the bootstraps so that they'll be loaded in a consistent order between platforms.
	bootstrapScripts.sort();

	// Determine if the app can currently host UI or not.
	const canAppShowUI = Ti.UI.hasSession;

	// Load all bootstraps.
	const bootstrapShowUIFunctions = [];
	for (const nextScript of bootstrapScripts) {
		// Load the next bootstrap.
		const bootstrap = require(nextScript); // eslint-disable-line security/detect-non-literal-require

		// Invoke the bootstrap's async execute() method, if it exists.
		if (bootstrap.execute) {
			await invokeAsyncCallback(bootstrap.execute);
		}

		// Handle the bootstrap's showUI() method, if it exists.
		if (bootstrap.showUI) {
			// Add method to collection to be invoked the next time the UI is re-created by the system.
			// Note: This only applies to apps that can be ran in the background.
			bootstrapShowUIFunctions.push(bootstrap.showUI);

			// If app can currently host UI (ie: not backgrounded), then show bootstrap's UI.
			if (canAppShowUI) {
				await invokeAsyncCallback(bootstrap.showUI);
				await new Promise((resolve) => setTimeout(resolve, 1)); // Give UI time to close.
			}
		}
	}

	// Set up listener to show all bootstrap UI when a new app UI session has started.
	if (!hasAddedUIEventListener) {
		hasAddedUIEventListener = true;
		Ti.UI.addEventListener('bootstrapsessionbegin', async () => {
			// Show all bootstrap UI.
			for (const nextFunction of bootstrapShowUIFunctions) {
				await invokeAsyncCallback(nextFunction);
				await new Promise((resolve) => setTimeout(resolve, 1)); // Give UI time to close.
			}

			// Fire an event signaling the app to create its root window for the new UI session.
			Ti.UI.fireEvent('sessionbegin');
		});
	}
}

export default loadAsync;
