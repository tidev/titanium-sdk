/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2019 by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const crypto = require('crypto');
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
	return new Promise((resolve, reject) => {
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
 * Checks if the V8 library referenced by the "titanium_mobile/android/package.json" file is installed.
 * If not, then this function will automatically download/install it. Function will do nothing if alredy installed.
 */
async function updateLibrary() {
	// Fetch info about the V8 library we should be building with.
	// This info is stored in our "package.json" under "titanium_mobile/android" folder.
	const packageJsonFilePath = path.join(__dirname, '..', 'package.json');
	const packageJsonData = JSON.parse(await fs.readFile(packageJsonFilePath, 'utf8'));
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
	return exec(untarCommandLine);
}

module.exports = {
	updateLibrary
};
