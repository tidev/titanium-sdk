'use strict';

const util = require('util');
const promisify = util.promisify;
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const glob = promisify(require('glob'));
const appc = require('node-appc');
const request = require('request');
const ssri = require('ssri');

const tempDir = os.tmpdir();
const Utils = {};

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

function cachedDownloadPath(url) {
	// Use some consistent name so we can cache files!
	const cacheDir = path.join(process.env.SDK_BUILD_CACHE_DIR || tempDir, 'timob-build');
	fs.ensureDirSync(cacheDir);

	const filename = url.slice(url.lastIndexOf('/') + 1);
	// Place to download file
	return path.join(cacheDir, filename);
}

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
 * @returns {string} absolute path to SDK install root
 */
Utils.sdkInstallDir = function () {
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
	console.log('Installing %s...', zipfile);
	return new Promise((resolve, reject) => {
		appc.zip.unzip(zipfile, dest, {}, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});
};

/**
* Given an npm module id, this will copy it and it's dependencies to a
* destination "node_modules" folder.
* Note that all of the packages are copied to the top-level of "node_modules",
* not nested!
* Also, to shortcut the logic, if the original package has been copied to the
* destination we will *not* attempt to read it's dependencies and ensure those
* are copied as well! So if the modules version changes or something goes
* haywire and the copies aren't full finished due to a failure, the only way to
* get right is to clean the destination "node_modules" dir before rebuilding.
*
* @param  {String} moduleId           The npm package/module to copy (along with it's dependencies)
* @param  {String} destNodeModulesDir path to the destination "node_modules" folder
* @param  {Array}  [paths=[]]         Array of additional paths to pass to require.resolve() (in addition to those from require.resolve.paths(moduleId))
*/
function copyPackageAndDependencies(moduleId, destNodeModulesDir, paths = []) {
	const destPackage = path.join(destNodeModulesDir, moduleId);
	if (fs.existsSync(path.join(destPackage, 'package.json'))) {
		return; // if the module seems to exist in the destination, just skip it.
	}

	// copy the dependency's folder over
	let pkgJSONPath;
	if (require.resolve.paths) {
		const thePaths = require.resolve.paths(moduleId);
		pkgJSONPath = require.resolve(path.join(moduleId, 'package.json'), { paths: thePaths.concat(paths) });
	} else {
		pkgJSONPath = require.resolve(path.join(moduleId, 'package.json'));
	}
	const srcPackage = path.dirname(pkgJSONPath);
	const srcPackageNodeModulesDir = path.join(srcPackage, 'node_modules');
	for (let i = 0; i < 3; i++) {
		fs.copySync(srcPackage, destPackage, {
			preserveTimestamps: true,
			filter: src => !src.startsWith(srcPackageNodeModulesDir)
		});

		// Quickly verify package copied, I've experienced occurences where it does not.
		// Retry up to three times if it did not copy correctly.
		if (fs.existsSync(path.join(destPackage, 'package.json'))) {
			break;
		}
	}

	// Now read it's dependencies and recurse on them
	const packageJSON = fs.readJSONSync(pkgJSONPath);
	for (const dependency in packageJSON.dependencies) {
		copyPackageAndDependencies(dependency, destNodeModulesDir, [ srcPackageNodeModulesDir ]);
	}
}
Utils.copyPackageAndDependencies = copyPackageAndDependencies;

module.exports = Utils;
