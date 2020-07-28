'use strict';

const util = require('util');
const promisify = util.promisify;
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const titanium = require.resolve('titanium');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process

const glob = promisify(require('glob'));
const appc = require('node-appc');
const request = require('request');
const ssri = require('ssri');

const tempDir = os.tmpdir();
const Utils = {};
const ROOT_DIR = path.join(__dirname, '../..');

function leftpad(str, len, ch) {
	str = String(str);
	let i = -1;
	if (!ch && ch !== 0) {
		ch = ' ';
	}
	len -= str.length;
	while (++i < len) {
		str = ch + str;
	}
	return str;
}

Utils.timestamp = function () {
	const date = new Date();
	return '' + (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + (date.getUTCFullYear()) + ' ' + leftpad(date.getUTCHours(), 2, '0') + ':' + leftpad(date.getUTCMinutes(), 2, '0');
};

Utils.copyFile = async function (srcFolder, destFolder, filename) {
	return fs.copy(path.join(srcFolder, filename), path.join(destFolder, filename));
};

Utils.copyFiles = async function (srcFolder, destFolder, files) {
	return Promise.all(files.map(f => Utils.copyFile(srcFolder, destFolder, f)));
};

Utils.globCopy = async function (pattern, srcFolder, destFolder) {
	const files = await glob(pattern, { cwd: srcFolder });
	return Utils.copyFiles(srcFolder, destFolder, files);
};

/**
 * @param {string} srcFolder source directory to copy from
 * @param {string} destFolder destination directory to copy to
 * @param {string} filename base filename to copy from `srcFolder` to `destFolder`
 * @param {object} substitutions a mapping of substitutions to make in the contents while copying
 * @returns {Promise<void>}
 */
Utils.copyAndModifyFile = async function (srcFolder, destFolder, filename, substitutions) {
	// FIXME If this is a directory, we need to recurse into directory!

	// read in src file, modify contents, write to dest folder
	let str = await fs.readFile(path.join(srcFolder, filename), 'utf8');

	// Go through each substitution and replace!
	for (const key in substitutions) {
		if (Object.prototype.hasOwnProperty.call(substitutions, key)) {
			str = str.split(key).join(substitutions[key]);
		}
	}
	return fs.writeFile(path.join(destFolder, filename), str);
};

/**
 * @param {string} srcFolder source directory to copy from
 * @param {string} destFolder destination directory to copy to
 * @param {string[]} files list of base filenames to copy from `srcFolder` to `destFolder`
 * @param {object} substitutions a mapping of substitutions to make in the contents while copying
 * @returns {Promise<void>}
 */
Utils.copyAndModifyFiles = async function (srcFolder, destFolder, files, substitutions) {
	return Promise.all(files.map(f => Utils.copyAndModifyFile(srcFolder, destFolder, f, substitutions)));
};

/**
 * @param {string} url the URL of a file to download
 * @param {string} destination where to save the file
 * @param {object} [options] options
 * @param {boolean} [options.progress=true] show progress bar/spinner
 * @returns {Promise<string>}
 */
function download(url, destination, options = { progress: true }) {
	return new Promise((resolve, reject) => {
		console.log('Downloading %s', url);

		const tempStream = fs.createWriteStream(destination);
		const req = request({ url: url });

		req.pipe(tempStream);

		req.on('error', function (err) {
			fs.existsSync(destination) && fs.unlinkSync(destination);
			console.log();
			console.error('Failed to download: %s', err.toString());
			reject(err);
		});

		req.on('response', function (req) {
			if (req.statusCode >= 400) {
				// something went wrong, abort
				console.log();
				const err = util.format('Request for %s failed with HTTP status code %s %s', url, req.statusCode, req.statusMessage);
				console.error(new Error(err));
				return reject(err);
			} else if (req.headers['content-length']) {
				// we know how big the file is, display the progress bar
				let bar;
				let total;
				if (options.progress) {
					total = parseInt(req.headers['content-length']);
					bar = new appc.progress('  :paddedPercent [:bar] :etas', {
						complete: '='.cyan,
						incomplete: '.'.grey,
						width: 40,
						total: total
					});

					req.on('data', buffer => bar.tick(buffer.length)); // increase progress bar
				}

				tempStream.on('close', () => { // all done
					if (bar) {
						bar.tick(total);
						console.log('\n');
					}
					resolve(destination);
				});
			} else {
				// we don't know how big the file is, display a spinner
				let spinner;
				if (options.progress) {
					spinner = new appc.busyindicator();
					spinner.start();
				}

				tempStream.on('close', () => { // all done
					if (spinner) {
						spinner.stop();
						console.log();
					}
					resolve(destination);
				});
			}
		});
	});
}

/**
 * Downloads a file and verifies the integrity hash matches (or throws)
 * @param {string} url URL to download
 * @param {string} downloadPath path to save the file
 * @param {string} integrity ssri integrity hash value to confirm contents
 * @param {object} [options] options
 * @param {boolean} [options.progress=true] show progress bar/spinner for download
 * @return {Promise<string>} the path to the downloaded (and verified) file
 */
async function downloadWithIntegrity(url, downloadPath, integrity, options) {
	const file = await download(url, downloadPath, options);

	// Verify integrity!
	await ssri.checkStream(fs.createReadStream(file), integrity);
	return file;
}

/**
 * @param {string} url url of file we're caching
 * @returns {string} cache filepath (basicaly dir under tmp with the url file's basename appended)
 */
function cachedDownloadPath(url) {
	// Use some consistent name so we can cache files!
	const cacheDir = path.join(process.env.SDK_BUILD_CACHE_DIR || tempDir, 'timob-build');
	fs.ensureDirSync(cacheDir);

	const filename = url.slice(url.lastIndexOf('/') + 1);
	// Place to download file
	return path.join(cacheDir, filename);
}
Utils.cachedDownloadPath = cachedDownloadPath;

Utils.generateSSRIHashFromURL = async function (url) {
	if (url.startsWith('file://')) {
		// Generate integrity hash!
		return ssri.fromStream(fs.createReadStream(url.slice(7)));
	}

	const downloadPath = cachedDownloadPath(url);
	await fs.remove(downloadPath);
	const file = await download(url, downloadPath);
	return ssri.fromStream(fs.createReadStream(file));
};

/**
 * @param {string} url URL to module zipfile
 * @param {string} integrity ssri integrity hash
 * @param {object} [options] options
 * @param {boolean} [options.progress=true] show progress bar/spinner for download
 * @returns {Promise<string>} path to file
 */
Utils.downloadURL = async function downloadURL(url, integrity, options) {
	if (!integrity) {
		throw new Error('No "integrity" value given for %s, may need to run "node scons.js modules-integrity" to generate new module listing with updated integrity hashes.', url);
	}

	if (url.startsWith('file://')) {
		const filePath = url.slice(7);
		if (!await fs.exists(filePath)) {
			throw new Error('File URL does not exist on disk: %s', url);
		}

		// if it passes integrity check, we're all good, return path to file
		await ssri.checkStream(fs.createReadStream(filePath), integrity);
		return filePath;
	}

	const downloadPath = cachedDownloadPath(url);
	// Check if file already exists and passes integrity check!
	if (await fs.exists(downloadPath)) {
		try {
			// if it passes integrity check, we're all good, return path to file
			await ssri.checkStream(fs.createReadStream(downloadPath), integrity);
			// cached copy is still valid, integrity hash matches
			return downloadPath;
		} catch (e) {
			// hash doesn't match. Wipe the cached version and re-download
			await fs.remove(downloadPath);
			return downloadWithIntegrity(url, downloadPath, integrity, options);
		}
	}

	// download and verify integrity
	return downloadWithIntegrity(url, downloadPath, integrity, options);
};

/**
 * @param {string} zipFile the downloaded file to extract
 * @param {string} integrity SSRI generated integrity hash for the zip
 * @param {string} outDir filepath of directory to extract zip to
 */
Utils.cacheUnzip = async function (zipFile, integrity, outDir) {
	return Utils.cacheExtract(zipFile, integrity, outDir, Utils.unzip);
};

/**
 * @callback AsyncExtractFunction
 * @param {string} inFile filepath of input file
 * @param {string} outDir filepath of output directory to place extracted/mnipulated contents of input file
 * @return {Promise<void>}
 */

/**
 * @param {string} inFile filepath to input file we're extracting
 * @param {string} integrity SSRI generated integrity hash for the input file
 * @param {string} outDir filepath of directory to extract the input file to
 * @param {AsyncExtractFunction} extractFunc function to call to extract/manipulate the input file
 */
Utils.cacheExtract = async function (inFile, integrity, outDir, extractFunc) {
	const { hashElement } = require('folder-hash');
	const exists = await fs.pathExists(outDir);
	// The integrity hash may contain characters like '/' which we need to convert
	// see https://en.wikipedia.org/wiki/Base64#Filenames
	const cacheFile = cachedDownloadPath(`${integrity.replace(/\//g, '-')}.json`);
	// if the extracted directory already exists...
	if (exists) {
		// we need to hash and verify it matches expectations
		const hash = await hashElement(outDir);
		// Read the cache file and compare hashes!
		try {
			const cachedHash = await fs.readJson(cacheFile);
			// eslint-disable-next-line security/detect-possible-timing-attacks
			if (hash.hash === cachedHash.hash) { // we're only checking top-level dir hash
				// we got a match, so we do nothing!
				return;
			}
		} catch (err) {
			// ignore, assume cache file didn't exist
		}
	}

	// ok the output dir doesn't exist, or it's hash doesn't match expectations
	// we need to extract and then record the new hash for caching
	await extractFunc(inFile, outDir);
	const hash = await hashElement(outDir);
	return fs.writeJson(cacheFile, hash);
};

/**
* @param {string} zipfile zip file to unzip
* @param {string} dest destination folder to unzip to
* @returns {Promise<void>}
*/
Utils.unzip = function unzip(zipfile, dest) {
	return new Promise((resolve, reject) => {
		console.log(`Unzipping ${zipfile} to ${dest}`);
		const command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build/win32/unzip') : 'unzip';
		const child = spawn(command, [ '-o', zipfile, '-d', dest ], { stdio: [ 'ignore', 'ignore', 'pipe' ] });
		let err = '';
		child.stderr.on('data', buffer => {
			err += buffer.toString();
		});
		child.on('error', err => reject(err));
		child.on('close', code => {
			if (code !== 0) {
				return reject(new Error(`Unzipping of ${zipfile} exited with non-zero exit code ${code}. ${err}`));
			}
			resolve();
		});
	});
};

/**
 * @returns {string} absolute path to SDK install root
 */
Utils.sdkInstallDir = function () {
	// TODO: try ti cli first as below?
	// TODO: Cache value
	switch (os.platform()) {
		case 'win32':
			return path.join(process.env.ProgramData, 'Titanium');

		case 'darwin':
			return path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');

		case 'linux':
		default:
			return path.join(process.env.HOME, '.titanium');
	}
};

// /**
//  * @return {Promise<string>} path to Titanium SDK root dir
//  */
// async function sdkDir() {
// 	try {
// 		const { stdout, _stderr } = await exec(`node "${titanium}" config sdk.defaultInstallLocation -o json`);
// 		return JSON.parse(stdout.trim());
// 	} catch (error) {
// 		const osName = require('os').platform();
// 		if (osName === 'win32') {
// 			return path.join(process.env.ProgramData, 'Titanium');
// 		} else if (osName === 'darwin') {
// 			return path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
// 		} else if (osName === 'linux') {
// 			return path.join(process.env.HOME, '.titanium');
// 		}
// 	}
// }

/**
 * @param  {String}   versionTag [description]
 * @param  {boolean}   [symlinkIfPossible=false] [description]
 * @returns {Promise<void>}
 */
Utils.installSDK = async function (versionTag, symlinkIfPossible = false) {
	const dest = Utils.sdkInstallDir();

	let osName = os.platform();
	if (osName === 'darwin') {
		osName = 'osx';
	}

	const destDir = await wipeInstalledSDK(dest, osName, versionTag);

	// Check for locally built unzipped directory
	// if there, symlink or copy that first
	const distDir = path.join(__dirname, '../../dist');
	const zipDir = path.join(distDir, `mobilesdk-${versionTag}-${osName}`);
	const dirExists = await fs.pathExists(zipDir);
	if (dirExists) {
		console.log('Installing %s...', zipDir);
		if (symlinkIfPossible) {
			console.log('Symlinking built SDK to install!');
			// FIXME: What about modules? Can we symlink those in?
			return fs.ensureSymlink(path.join(zipDir, 'mobilesdk', osName, versionTag), destDir);
		}
		await fs.copy(path.join(zipDir, 'mobilesdk'), path.join(dest, 'mobilesdk'), { dereference: true });
		return fs.copy(path.join(zipDir, 'modules'), path.join(dest, 'modules'));
	}

	// try the zip
	const zipfile = path.join(distDir, `mobilesdk-${versionTag}-${osName}.zip`);
	return Utils.unzip(zipfile, dest);
};

/**
 * @param {string} zipfile path to zipfile to install
 * @param {boolean} [select=false] select the sdk in ti cli after install?
 * @returns {Promise<void>}
 */
Utils.installSDKFromZipFile = async function (zipfile, select = false) {
	const regexp = /mobilesdk-([^-]+)-(osx|win32|linux)\.zip$/;
	const matches = zipfile.match(regexp);
	const osName = matches[2];
	const versionTag = matches[1];

	// wipe existing
	const dest = Utils.sdkInstallDir();
	await wipeInstalledSDK(dest, osName, versionTag);

	await Utils.unzip(zipfile, dest);
	if (select) {
		return exec(`node "${titanium}" sdk select ${versionTag}`);
	}
};

/**
 * @param {string} dest base dir of SDK installs
 * @param {string} osName 'osx' || 'linux' || 'win32'
 * @param {string} versionTag i.e. '9.2.0'
 * @returns {Promise<string>}
 */
async function wipeInstalledSDK(dest, osName, versionTag) {
	const destDir = path.join(dest, 'mobilesdk', osName, versionTag);
	try {
		const destStats = fs.lstatSync(destDir);
		if (destStats.isDirectory()) {
			console.log('Destination exists, deleting %s...', destDir);
			await fs.remove(destDir);
		} else if (destStats.isSymbolicLink()) {
			console.log('Destination exists as symlink, unlinking %s...', destDir);
			fs.unlinkSync(destDir);
		}
	} catch (error) {
		// Do nothing
	}
	return destDir;
}

/**
 * Remove all CI SDKs installed. Skip GA releases.
 * @returns {Promise<void>}
 */
Utils.cleanNonGaSDKs = async function cleanNonGaSDKs() {
	const { stdout } = await exec(`node "${titanium}" sdk list -o json`);
	const out = JSON.parse(stdout);
	const installedSDKs = out.installed;
	let sdkToSelect;
	// Loop over the SDKs and remove any where the key doesn't end in GA, or the value isn't sdkPath
	await Promise.all(Object.keys(installedSDKs).map(async item => {
		const thisSDKPath = installedSDKs[item];
		if (item.slice(-2) === 'GA') { // skip GA releases
			if (!sdkToSelect) {
				sdkToSelect = item;
			}
			return;
		}
		console.log(`Removing ${thisSDKPath}`);
		return fs.remove(thisSDKPath);
	}));
	if (sdkToSelect) {
		console.log(`Setting ${sdkToSelect} as the selected SDK`);
		await exec(`node "${titanium}" sdk select ${sdkToSelect}`);
	} else {
		console.log('No GA SDK installed, you might find that your next ti command execution will error');
	}
};

/**
 * Removes the global modules and plugins dirs
 * @param {string} sdkDir filepath to sdk root install directory
 * @returns {Promise<void>}
 */
Utils.cleanupModules = async function cleanupModules(sdkDir) {
	const moduleDir = path.join(sdkDir, 'modules');
	const pluginDir = path.join(sdkDir, 'plugins');

	return Promise.all([ moduleDir, pluginDir ].map(dir => fs.remove(dir)));
};

module.exports = Utils;
