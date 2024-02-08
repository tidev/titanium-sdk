/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
 * Non-blocking function which loads and executes all bootstrap scripts configured for the app.
 * @param {function} finished Callback to be invoked once all bootstraps have finished executing. Cannot be null.
 */
function loadAsync(finished) {
	// Acquire an array of all bootstrap scripts included with the app.
	// - For best performance, attempt to fetch scripts via an optional JSON file created by the build system.
	// - If JSON file not found (will return null), then search "Resources" directory for bootstrap files.
	let bootstrapScripts = fetchScriptsFromJson();
	if (!bootstrapScripts) {
		bootstrapScripts = fetchScriptsFromResourcesDirectory();
	}

	// Do not continue if no bootstraps were found.
	if (!bootstrapScripts || (bootstrapScripts.length <= 0)) {
		finished();
		return;
	}

	// Sort the bootstraps so that they'll be loaded in a consistent order between platforms.
	bootstrapScripts.sort();

	// Loads all bootstrap scripts found.
	function loadBootstrapScripts(finished) {
		let bootstrapIndex = 0;
		function doLoad() {
			// Attempt to load all bootstrap scripts.
			while (bootstrapIndex < bootstrapScripts.length) {
				// Load the next bootstrap.
				const fileName = bootstrapScripts[bootstrapIndex];
				const bootstrap = require(fileName); // eslint-disable-line security/detect-non-literal-require

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

			// Invoke given callback to inform caller that all loading is done.
			finished();
		}
		function onBootstrapExecutionFinished() {
			// Last bootstrap has finished execution. Time to load the next one.
			// Note: Add a tiny delay so whatever UI the last bootstrap loaded has time to close.
			bootstrapIndex++;
			setTimeout(() => doLoad(), 1);
		}
		doLoad();
	}

	// We've finished loading/executing all bootstrap scripts.
	// Inform caller by invoking the callback given to loadAsync().
	loadBootstrapScripts(finished);
}

export default loadAsync;
