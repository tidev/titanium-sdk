/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const AndroidBuilder = require('../../build/lib/android');
const Builder = require('../../build/lib/builder');
const BuildUtils = require('../../build/lib/utils');
const util = require('util');
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');
const request = require('request-promise-native');

// Determine if we're running on a Windows machine.
const isWindows = (process.platform === 'win32');

/**
 * Double quotes given path and escapes double quote characters in file/directory names.
 * @param {String} filePath The path to be double quoted. Can be null/undefined.
 * @return {String} Returns the double quoted path. Will be null/undefined if given argument is null/undefined.
 */
function quotePath(filePath) {
	if (!filePath) {
		return '""';
	}
	if (!isWindows) {
		filePath = filePath.replace(/"/g, '\\"');
	}
	return `"${filePath}"`;
}

/**
 * Async loads the "titanium_mobile/android/package.json" file and returns it as a dictionary.
 * @returns {Promise<Object>} Dictionary of the parsed JSON file if loaded successfully.
 */
async function loadPackageJson() {
	return fs.readJson('../package.json');
}

/**
 * Does a transpile/polyfill/rollup of our "titanium_mobile/common/Resources" JS files.
 * Will then generate a C++ header file providing a V8 snapshot of the rolled-up JS for fast startup times.
 */
async function createSnapshot() {
	// Perform a transpile/polyfill/rollup of our common JS files.
	// This contains our "ti.main.js" which the app executes on startup before executing the "app.js" file.
	const rollupOutputDirPath = path.join(__dirname, 'build', 'outputs', 'ti-assets', 'Resources');
	const rollupOutputFilePath = path.join(rollupOutputDirPath, 'ti.main.js');
	await fs.ensureDir(rollupOutputDirPath);
	const mainBuilder = new Builder({ args: [ 'android' ] });
	const androidBuilder = new AndroidBuilder({});
	await mainBuilder.transpile('android', androidBuilder.babelOptions, rollupOutputFilePath);
	const rollupFileContent = (await fs.readFile(rollupOutputFilePath)).toString();

	// Create the C++ directory we'll be generating the snapshot header file to.
	const cppOutputDirPath = path.join(__dirname, '..', 'runtime', 'v8', 'generated');
	const v8SnapshotHeaderFilePath = path.join(cppOutputDirPath, 'V8Snapshots.h');
	await fs.ensureDir(cppOutputDirPath);

	// Requests our server to create snapshot of rolled-up "ti.main" in a C++ header file.
	let wasSuccessful = false;
	try {
		// Post rolled-up "ti.main" script to server and obtain a snapshot ID as a response.
		// We will send an HTTP request for the snapshot code later.
		console.log('Attempting to request snapshot...');
		const snapshotUrl = 'http://v8-snapshot.appcelerator.com';
		const packageJsonData = await loadPackageJson();
		const requestOptions = {
			body: {
				v8: packageJsonData.v8.version,
				script: rollupFileContent
			},
			json: true
		};
		const snapshotId = await request.post(snapshotUrl, requestOptions);

		// Request generated snapshot from server using `snapshotId` obtained from server above.
		const MAX_ATTEMPTS = 20; // Time-out after two minutes.
		let attempts;
		for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
			const response = await request.get(`${snapshotUrl}/snapshot/${snapshotId}`, {
				simple: false,
				resolveWithFullResponse: true
			});
			if (response.statusCode === 200) {
				// Server has finished creating a C++ header file containing all V8 snapshots.
				// Write it to file and flag that we're done.
				console.log('Writing snapshot...');
				await fs.writeFile(v8SnapshotHeaderFilePath, response.body);
				wasSuccessful = true;
				break;
			} else if (response.statusCode === 202) {
				// Snapshot server is still building. We need to retry later.
				console.log('Waiting for snapshot generation...');
				await new Promise(resolve => setTimeout(resolve, 6000));
			} else {
				// Give up if received an unexpected response.
				console.error('Could not generate snapshot, skipping...');
				break;
			}
		}
		if (attempts > MAX_ATTEMPTS) {
			console.error('Max retries exceeded fetching snapshot from server, skipping...');
		}
	} catch (err) {
		console.error(`Failed to request snapshot: ${err}`);
	}

	// Do the following if we've failed to generate snapshot header file above.
	// Note: The C++ build will fail if file is missing. This is because it is #included in our code.
	if (!wasSuccessful) {
		// Trigger a build failure if snapshots are required. The "titanium_mobile/build" SDK build scripts set this.
		if (process.env.TI_SDK_BUILD_REQUIRES_V8_SNAPSHOTS === '1') {
			process.exit(1);
		}

		// Generaet an empty C++ header. Allows build to succeed and app will load "ti.main.js" normally instead.
		await fs.writeFile(v8SnapshotHeaderFilePath, '// Failed to build V8 snapshots. See build log.');
	}
}

/**
 * Checks if the V8 library referenced by the "titanium_mobile/android/package.json" file is installed.
 * If not, then this function will automatically download/install it. Function will do nothing if already installed.
 */
async function updateLibrary() {
	// Fetch info about the V8 library we should be building with.
	// This info is stored in our "package.json" under "titanium_mobile/android" folder.
	const packageJsonData = await loadPackageJson();
	const v8TargetVersion = packageJsonData.v8.version;
	const v8TargetMode = packageJsonData.v8.mode;
	const integrity = packageJsonData.v8.integrity;
	const v8ArchiveFileName = `libv8-${v8TargetVersion}-${v8TargetMode}.tar.bz2`;
	const installedLibV8DirPath = path.join(
		__dirname, '../../dist/android/libv8', v8TargetVersion, v8TargetMode);
	const installedLibV8ArchiveFilePath = path.join(installedLibV8DirPath, v8ArchiveFileName);

	// Check if already installed
	// Do not continue if targeted V8 library is already downloaded/installed. We're good to go.
	// FIXME: This assumes if the archive matches our integrity hash then the directory contents are ok
	// But does not actually check any sort of hash for the extracted contents
	if (await isV8Installed(installedLibV8DirPath, v8TargetVersion, v8ArchiveFileName, integrity)) {
		return;
	}

	// Download V8 archive (downloads to temp dir, which helps CI server avoid re-downloading between builds generally)
	const downloadUrl = `http://timobile.appcelerator.com.s3.amazonaws.com/libv8/${v8ArchiveFileName}`;
	const downloadedTarball = await BuildUtils.downloadURL(downloadUrl, integrity, { progress: false });

	// For now, copy the downloaded tarball to the eventual destination filepath!
	// Otherwise our check if already installed fails above
	await fs.ensureDir(installedLibV8DirPath);
	await fs.copy(downloadedTarball, installedLibV8ArchiveFilePath);

	// TODO: Use same sort of caching logic for extracted copy as we do for pre-packaged modules!
	// Utils.cacheUnzip - but instead of unzipping, we need to do the untar here!

	// Extract the downloaded V8 archive's files.
	console.log(`Decompressing downloaded V8 file: ${downloadedTarball}`);
	const untarCommandLine
		= quotePath(path.join(__dirname, '..', isWindows ? 'gradlew.bat' : 'gradlew'))
		+ ' -b ' + quotePath(path.join(__dirname, '..', 'untar.gradle'))
		+ ' -Pcompression=bzip2'
		+ ' -Psrc=' + quotePath(downloadedTarball)
		+ ' -Pdest=' + quotePath(installedLibV8DirPath);
	return exec(untarCommandLine);
}

/**
 * Attempts to determine if we've already downloaded V8 and extracted it to our dist/android folder
 * @param {string} installedLibV8DirPath directory where extracted v8 will live
 * @param {string} v8TargetVersion the version of v8 we expect to be there
 * @param {string} installedLibV8ArchiveFilePath filepath to the tarball (under dist folder)
 * @param {string} integrity ssri generated integrity hash
 */
async function isV8Installed(installedLibV8DirPath, v8TargetVersion, installedLibV8ArchiveFilePath, integrity) {
	const installedLibV8JsonFilePath = path.join(installedLibV8DirPath, 'libv8.json');
	if (!await fs.exists(installedLibV8JsonFilePath)) {
		return false;
	}

	// Check if targeted V8 version folder exists.
	const v8InstalledVersion = (await fs.readJson(installedLibV8JsonFilePath, 'utf8')).version;
	if (v8InstalledVersion === v8TargetVersion) {
		// Check if a tarball of the V8 library exists. (NOTE: we explicitly copy file here to make this work!)
		if (!await fs.exists(installedLibV8ArchiveFilePath)) {
			return false;
		}
		// Check if the V8 tarball file's hash matches what is in our package JSON.
		const installedHash = await BuildUtils.generateSSRIHashFromURL(`file://${installedLibV8ArchiveFilePath}`);
		if (installedHash.toString() === integrity) {
			// Yes, the targeted V8 library version is installed and it's checksum/hash is correct.
			return true;
		}
	}
	return false;
}

/**
 * Does a transpile/polyfill/rollup of our "titanium_mobile/common/Resources" JS files.
 * Will then generate a C++ header file providing a V8 snapshot of the rolled-up JS for fast startup times.
 *
 * Will exit the process when the async operation ends. Intended to be called from the command line.
 */
function createSnapshotThenExit() {
	exitWhenDone(createSnapshot());
}

/**
 * Checks if the V8 library referenced by the "titanium_mobile/android/package.json" file is installed.
 * If not, then this function will automatically download/install it. Function will do nothing if alredy installed.
 *
 * Will exit the process when the async operation ends. Intended to be called from the command line.
 */
function updateLibraryThenExit() {
	exitWhenDone(updateLibrary());
}

/**
 * Exits the process when the given promise's operation ends.
 * @param {Promise} promise The promise to be monitored. Cannot be null/undefined.
 */
function exitWhenDone(promise) {
	promise
		.then(() => process.exit(0))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}

module.exports = {
	createSnapshot,
	createSnapshotThenExit,
	updateLibrary,
	updateLibraryThenExit
};
