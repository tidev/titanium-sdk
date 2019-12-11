/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2019 by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const AndroidBuilder = require('../../build/lib/android');
const Builder = require('../../build/lib/builder');
const util = require('util');
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const execFile = util.promisify(require('child_process').execFile); // eslint-disable-line security/detect-child-process
const crypto = require('crypto');
const ejsRenderFile = util.promisify(require('ejs').renderFile);
const fs = require('fs-extra');
const path = require('path');
const request = require('request');

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
 * Reads all of the bytes of the given file and returns a hash using the given algorithm.
 * @param {String} filePath Path to the file to read the bytes of and calculate a hash. Cannot be null.
 * @param {String} hashingAlgorithm Hashing algorithm to use such as 'md5', 'sha256', etc. Cannot be null.
 * @param {String} [hashEncoding]
 * Optional argument indicating how to encode the returned hash result.
 * Can be set to 'hex', 'base64, or 'ascii', 'utf8'. Defaults to 'hex' if argument is null or undefined.
 */
async function fetchFileHash(filePath, hashingAlgorithm, hashEncoding) {
	return await new Promise((resolve, reject) => {
		const hash = crypto.createHash(hashingAlgorithm);
		const readStream = fs.createReadStream(filePath);
		readStream.on('data', (data) => {
			hash.update(data);
		});
		readStream.on('end', () => {
			if (!hashEncoding) {
				hashEncoding = 'hex';
			}
			resolve(hash.digest(hashEncoding));
		});
		readStream.on('error', reject);
	});
}

/**
 * Async loads the "titanium_mobile/android/package.json" file and returns it as a dictionary.
 * @returns {Promise<Object>} Dictionary of the parsed JSON file if loaded successfully.
 */
async function loadPackageJson() {
	const filePath = path.join(__dirname, '..', 'package.json');
	const fileContent = await fs.readFile(filePath, 'utf8');
	return JSON.parse(fileContent);
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

	// Create the C++ directory we'll be generating snapshot header file to.
	const cppOutputDirPath = path.join(__dirname, '..', 'runtime', 'v8', 'generated');
	const v8SnapshotHeaderFilePath = path.join(cppOutputDirPath, 'V8Snapshots.h');
	await fs.ensureDir(cppOutputDirPath);

	// We can only create a V8 snapshot on Mac. For all other platforms, generate an empty snapshot file.
	// Note: This is because we've only built the "mksnapshot" command line tool for Mac.
	if (process.platform !== 'darwin') {
		console.info('V8 snapshot generation is only supported on macOS, skipping...');
		await fs.writeFile(v8SnapshotHeaderFilePath, '// V8 snapshots only supported on macOS.');
		return;
	}

	// Make sure Titanium's V8 library has been downloaded/installed.
	// We need its "mksnapshot" command line tool.
	await updateLibrary();

	// Fetch info about the V8 library we're using.
	const packageJsonData = await loadPackageJson();
	const v8LibsDirPath = path.join(
		__dirname, '..', '..', 'dist', 'android', 'libv8', packageJsonData.v8.version, packageJsonData.v8.mode, 'libs');

	// Obtain CPU architectures we need to generate snapshots for.
	const targetArchitectures = [];
	for (const nextArchitecture of packageJsonData.architectures) {
		if (nextArchitecture === 'arm64-v8a') {
			targetArchitectures.push('arm64');
		} else if (nextArchitecture === 'armeabi-v7a') {
			targetArchitectures.push('arm');
		} else {
			targetArchitectures.push(nextArchitecture);
		}
	}

	// Generate a "startup.js" file wrapping the rolled-up "ti.main" script within a JS function.
	const rollupFileContent = await fs.readFile(rollupOutputFilePath);
	const startupEjsFilePath = path.join(__dirname, '..', 'runtime', 'v8', 'tools', 'startup.js.ejs');
	const outputContent = await ejsRenderFile(startupEjsFilePath, { script: rollupFileContent }, {});
	const jsOutputDirPath = path.join(__dirname, 'build', 'ti-intermediates', 'js');
	const startupOutputFilePath = path.join(jsOutputDirPath, 'startup.js');
	await fs.ensureDir(jsOutputDirPath);
	await fs.writeFile(startupOutputFilePath, outputContent);

	// Generates a "blob.bin" snapshot binary file of our "ti.main.js" for the given "target" architecture.
	// Note: Google's "mksnapshot" command line tool does not support double quoted paths for arguments.
	//       This means spaces are not supported in paths. So, use relative paths to avoid this limitation.
	async function generateSnapshotBlob(target) {
		console.log(`Generating snapshot blob for ${target}...`);
		const targetDirPath = path.resolve(v8LibsDirPath, target);
		const makeSnapshotFilePath = path.join(targetDirPath, 'mksnapshot');
		const argsArray = [
			'--startup_blob=blob.bin',
			path.relative(targetDirPath, startupOutputFilePath),
			'--print-all-exceptions'
		];
		await fs.chmod(makeSnapshotFilePath, 0o755);
		await execFile(makeSnapshotFilePath, argsArray, { cwd: targetDirPath });
	}

	// Generate a C++ header file containing byte arrays of V8 snapshots for the above "startup.js".
	let wasSuccessful = false;
	try {
		// Generate a snapshot for each architecture and fetch its binary/blob.
		const blobs = {};
		await Promise.all(targetArchitectures.map(target => generateSnapshotBlob(target)));
		await Promise.all(targetArchitectures.map(async target => {
			const blobFilePath = path.join(path.resolve(v8LibsDirPath, target), 'blob.bin');
			if (!await fs.exists(blobFilePath)) {
				return Promise.reject(`Failed to generate ${target} snapshot at location: ${blobFilePath}`);
			}
			const blobBuffer = Buffer.from(await fs.readFile(blobFilePath, 'binary'), 'binary');
			if (!blobBuffer || (blobBuffer.length <= 0)) {
				return Promise.reject(`The generated ${target} snapshot file is empty: ${blobFilePath}`);
			}
			blobs[target] = blobBuffer;
		}));

		// Generate a C++ header file containing byte arrays of all snapshots made above.
		console.log(`Generating V8Snapshots.h for ${Object.keys(blobs).join(', ')}...`);
		const snapshotEjsFilePath = path.join(__dirname, '..', 'runtime', 'v8', 'tools', 'V8Snapshots.h.ejs');
		const fileContent = await ejsRenderFile(snapshotEjsFilePath, blobs, {});
		await fs.writeFile(v8SnapshotHeaderFilePath, fileContent);
		wasSuccessful = true;
	} catch (err) {
		console.error(err);
	}

	// Handle snapshot result.
	if (wasSuccessful) {
		// Delete rolled-up "ti.main.js" from our output directory since we've successfully created all snapshots.
		// Prevents Titanium SDK's "app" test project from using it, which forces it to use snapshot instead.
		await fs.unlink(rollupOutputFilePath);
	} else {
		// Failed to generate at least 1 snapshot. Fall-back to loading "ti.main.js" instead.
		// Note: Can happen on macOS Catalina which doesn't support running x86 "mksnapshot" command line tool.
		// TODO: Allow partial architecture support for snapshots. Should not be all or nothing.
		console.error('Unable to generate all V8 snapshots. Dropping snapshot support.');
		await fs.writeFile(v8SnapshotHeaderFilePath, '// Failed to build V8 snapshots. See build log.');
	}
}

/**
 * Checks if the V8 library referenced by the "titanium_mobile/android/package.json" file is installed.
 * If not, then this function will automatically download/install it. Function will do nothing if alredy installed.
 */
async function updateLibrary() {
	// Fetch info about the V8 library we should be building with.
	// This info is stored in our "package.json" under "titanium_mobile/android" folder.
	const packageJsonData = await loadPackageJson();
	const v8TargetVersion = packageJsonData.v8.version;
	const v8TargetMode = packageJsonData.v8.mode;
	const v8TargetChecksum = packageJsonData.v8.checksum;

	// Check if the targeted V8 version is already installed.
	let isV8Installed = false;
	const v8ArchiveFileName = `libv8-${v8TargetVersion}-${v8TargetMode}.tar.bz2`;
	const installedLibV8DirPath = path.join(
		__dirname, '..', '..', 'dist', 'android', 'libv8', v8TargetVersion, v8TargetMode);
	const installedLibV8ArchiveFilePath = path.join(installedLibV8DirPath, v8ArchiveFileName);
	const installedLibV8JsonFilePath = path.join(installedLibV8DirPath, 'libv8.json');
	if (await fs.exists(installedLibV8JsonFilePath)) {
		// Check if targetd V8 version folder exists.
		const v8InstalledVersion = JSON.parse(await fs.readFile(installedLibV8JsonFilePath, 'utf8')).version;
		if (v8InstalledVersion === v8TargetVersion) {
			// Check if a tarball of the V8 library exists.
			if (await fs.exists(installedLibV8ArchiveFilePath)) {
				// Check if the V8 tarball file's hash matches what is in our package JSON.
				const v8InstalledChecksum = await fetchFileHash(installedLibV8ArchiveFilePath, 'sha512', 'hex');
				if (v8InstalledChecksum === v8TargetChecksum) {
					// Yes, the targeted V8 library version is installed and it's checksum/hash is correct.
					isV8Installed = true;
				}
			}
		}
	}

	// Do not continue if targeted V8 library is already downloaded/installed. We're good to go.
	if (isV8Installed) {
		return;
	}

	// Download a tarball of the targeted V8 library version.
	console.log(`Downloading V8 library: ${v8ArchiveFileName}`);
	await fs.mkdirs(installedLibV8DirPath);
	await new Promise((resolve, reject) => {
		const writeStream = fs.createWriteStream(installedLibV8ArchiveFilePath);
		writeStream.on('error', reject);
		writeStream.on('finish', resolve);
		const downloadUrl = `http://timobile.appcelerator.com.s3.amazonaws.com/libv8/${v8ArchiveFileName}`;
		const requestHandler = request({ url: downloadUrl });
		requestHandler.on('error', reject);
		requestHandler.on('response', (response) => {
			const statusCode = response.statusCode;
			if (statusCode === 200) {
				requestHandler.pipe(writeStream);
			} else {
				reject(`Failed to download V8 library. Received status code ${statusCode} from: ${downloadUrl}`);
			}
		});
	});

	// Verify that the hash of the download V8 tarball matches what is in our package JSON.
	const v8DownloadedChecksum = await fetchFileHash(installedLibV8ArchiveFilePath, 'sha512', 'hex');
	if (v8DownloadedChecksum !== v8TargetChecksum) {
		const errorMessage
			= 'Checksum for downloaded libv8 does not match what is defined in "package.json". '
			+ 'Expected: ' + v8TargetChecksum + ', Received: ' + v8DownloadedChecksum;
		throw new Error(errorMessage);
	}

	// Extract the downloaded V8 archive's files.
	console.log(`Decompressing downloaded V8 file: ${installedLibV8ArchiveFilePath}`);
	const untarCommandLine
		= quotePath(path.join(__dirname, '..', isWindows ? 'gradlew.bat' : 'gradlew'))
		+ ' -b ' + quotePath(path.join(__dirname, '..', 'untar.gradle'))
		+ ' -Pcompression=bzip2'
		+ ' -Psrc=' + quotePath(installedLibV8ArchiveFilePath)
		+ ' -Pdest=' + quotePath(installedLibV8DirPath);
	await exec(untarCommandLine);
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
