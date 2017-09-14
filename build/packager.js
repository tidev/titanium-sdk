'use strict';

const path = require('path'),
	os = require('os'),
	exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	async = require('async'),
	fs = require('fs-extra'),
	utils = require('./utils'),
	copyFile = utils.copyFile,
	copyFiles = utils.copyFiles,
	downloadURL = utils.downloadURL,
	ROOT_DIR = path.join(__dirname, '..'),
	SUPPORT_DIR = path.join(ROOT_DIR, 'support');

/**
 * Given a folder we'd like to zip up and the destination filename, this will zip up the directory contents.
 * Be aware that the top-level of the zip will not be the directory itself, but it's contents.
 *
 * @param  {String}   folder   The folder whose contents will become the zip contents
 * @param  {String}   filename The output zipfile
 * @param  {Function} next     [description]
 */
function zip(folder, filename, next) {
	const command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build', 'win32', 'zip') : 'zip';
	exec(command + ' -9 -q -r "' + path.join('..', path.basename(filename)) + '" *', { cwd: folder }, function (err) {
		if (err) {
			return next(err);
		}

		const outputFolder = path.resolve(folder, '..'),
			destFolder = path.dirname(filename),
			outputFile = path.join(outputFolder, path.basename(filename));

		if (outputFile == filename) { // eslint-disable-line eqeqeq
			return next();
		}
		copyFile(outputFolder, destFolder, path.basename(filename), next);
	});
}

function unzip(zipfile, dest, next) {
	console.log('Unzipping ' + zipfile + ' to ' + dest);
	const command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build', 'win32', 'unzip') : 'unzip';
	exec(command + ' -o "' + zipfile  + '" -d "' + dest + '"', function (err) {
		if (err) {
			return next(err);
		}
		next();
	});
}

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

/**
 * @param {String} outputDir path to place the temp files and zipfile
 * @param {String} targetOS  'win32', 'linux', or 'osx'
 * @param {string[]} platforms The list of SDK platforms to package
 * @param {string} version version string to use
 * @param {string} versionTag version tag
 * @param {string} moduleApiVersion module api version
 * @param {string} gitHash git commit SHA
 * @constructor
 */
function Packager(outputDir, targetOS, platforms, version, versionTag, moduleApiVersion, gitHash) {
	this.srcDir = ROOT_DIR;
	this.outputDir = outputDir; // root folder where output is placed
	this.targetOS = targetOS;
	this.platforms = platforms;
	this.version = version;
	this.versionTag = versionTag;
	this.moduleApiVersion = moduleApiVersion;
	this.gitHash = gitHash;
	const date = new Date();
	this.timestamp = '' + (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + (date.getUTCFullYear()) + ' ' + leftpad(date.getUTCHours(), 2, '0') + ':' + leftpad(date.getUTCMinutes(), 2, '0');
	this.zipFile = path.join(this.outputDir, 'mobilesdk-' + this.versionTag + '-' + this.targetOS + '.zip');
	this.packagers = {
		'android': this.zipAndroid.bind(this),
		'ios': this.zipIOS.bind(this),
		'windows': this.zipWindows.bind(this)
	};
	// Location where we build up the zip file contents
	this.zipDir = path.join(this.outputDir, 'ziptmp');
	this.zipSDKDir = path.join(this.zipDir, 'mobilesdk', this.targetOS, this.versionTag);
}

/**
 * generates the manifest.json we ship with the SDK
 * @param  {Function} next callback function
 */
Packager.prototype.generateManifestJSON = function (next) {
	console.log('Writing manifest.json');
	const modifiedPlatforms = this.platforms.slice(0), // need to work on a copy!
		json = {
			name: this.versionTag,
			version: this.version,
			moduleAPIVersion: this.moduleApiVersion,
			timestamp: this.timestamp,
			githash: this.gitHash
		};

	// Replace ios with iphone
	const index = modifiedPlatforms.indexOf('ios');
	if (index !== -1) {
		modifiedPlatforms.splice(index, 1, 'iphone');
	}
	json.platforms = modifiedPlatforms;
	fs.writeJSON(path.join(this.zipSDKDir, 'manifest.json'), json, next);
};

/**
 * Zips up the iOS SDK portion
 * @param  {Function} next callback function
 */
Packager.prototype.zipIOS = function (next) {
	const IOS = require('./ios');
	// FIXME Pass along the version/gitHash/options!
	new IOS({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

Packager.prototype.zipWindows = function (next) {
	const Windows = require('./windows');
	// FIXME Pass along the version/gitHash/options!
	new Windows({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

/**
 * Zips up the Android SDK portion
 * @param  {Function} next callback function
 */
Packager.prototype.zipAndroid = function (next) {
	const Android = require('./android');
	// FIXME Pass along the ndk/sdk/version/apiLevel/options!
	new Android({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

/**
 * Removes existing zip file and tmp dir used to build it
 * @param  {Function} next callback function
 */
Packager.prototype.cleanZipDir = function (next) {
	console.log('Cleaning previous zipfile and tmp dir...');
	// IF zipDir exists, wipe it
	if (fs.existsSync(this.zipDir)) {
		fs.removeSync(this.zipDir);
	}
	// make sure zipSDKDir exists
	fs.mkdirsSync(this.zipSDKDir);

	// Remove existing zip
	fs.remove(this.zipFile, next);
};

/**
 * Includes the pre-packaged pre-built native modules. We now gather them from a JSON file listing URLs to download.
 * @param  {Function} next callback function
 */
Packager.prototype.includePackagedModules = function (next) {
	console.log('Zipping packaged modules...');
	// Unzip all the zipfiles in support/module/packaged
	let supportedPlatforms = this.platforms.concat([ 'commonjs' ]);
	// Include aliases for ios/iphone/ipad
	if (supportedPlatforms.indexOf('ios') !== -1
		|| supportedPlatforms.indexOf('iphone') !== -1
		|| supportedPlatforms.indexOf('ipad') !== -1) {
		supportedPlatforms = supportedPlatforms.concat([ 'ios', 'iphone', 'ipad' ]);
	}
	let urls = []; // urls of module zips to grab
	// Read modules.json, grab the object for each supportedPlatform
	const contents = fs.readFileSync(path.join(SUPPORT_DIR, 'module', 'packaged', 'modules.json')).toString(),
		modulesJSON = JSON.parse(contents);
	for (let x = 0; x < supportedPlatforms.length; x++) {
		const newModuleURLS = modulesJSON[supportedPlatforms[x]];
		urls = urls.concat(newModuleURLS || []);
	}

	// Fetch the listed modules from URLs...
	const outDir = this.zipDir,
		zipFiles = [];
	async.each(urls, function (url, cb) {
		// FIXME Don't show progress bars, because they clobber each other
		downloadURL(url, function (err, file) {
			if (err) {
				return cb(err);
			}
			zipFiles.push(file);
			cb();
		});
	},
	// ...then unzip them
	function (err) {
		if (err) {
			return next(err);
		}

		// MUST RUN IN SERIES or they will clobber each other and unzip will fail mysteriously
		async.eachSeries(zipFiles, function (zipFile, cb) {
			unzip(zipFile, outDir, function (err) {
				if (err) {
					return cb(err);
				}
				cb();
			});
		}, next);
	});
};

/**
 * Copy files from ROOT_DIR to zipDir.
 * @param {string[]} files List of files/folders to copy
 * @param {Function} next callback function
 */
Packager.prototype.copy = function (files, next) {
	copyFiles(this.srcDir, this.zipSDKDir, files, next);
};

/**
 * Zip it all up and wipe the zip dir
 * @param {Function} next callback function
 */
Packager.prototype.zip = function (next) {
	zip(this.zipDir, this.zipFile, function (err) {
		if (err) {
			return next(err);
		}
		// delete the zipdir!
		fs.remove(this.zipDir, next);
	}.bind(this));
};

/**
 * [package description]
 * @param {Function} next callback function
 */
Packager.prototype.package = function (next) {
	console.log('Zipping Mobile SDK...');
	async.series([
		this.cleanZipDir.bind(this),
		this.generateManifestJSON.bind(this),
		function (cb) {
			fs.copy(path.join(this.outputDir, 'api.jsca'), path.join(this.zipSDKDir, 'api.jsca'), cb);
		}.bind(this),
		function (cb) {
			// Copy some root files, cli/, templates/, node_modules minus .bin sub-dir
			this.copy([ 'CREDITS', 'README.md', 'package.json', 'cli', 'node_modules', 'templates' ], cb);
		}.bind(this),
		// Now run 'npm prune --production' on the zipSDKDir, so we retain only production dependencies
		function (cb) {
			console.log('Pruning to production npm dependencies');
			exec('npm prune --production', { cwd: this.zipSDKDir }, function (err, stdout, stderr) {
				if (err) {
					console.log(stdout);
					console.error(stderr);
					return cb(err);
				}
				cb();
			});
		}.bind(this),
		// Remove any remaining binary scripts from node_modules
		function (cb) {
			fs.remove(path.join(this.zipSDKDir, 'node_modules', '.bin'), cb);
		}.bind(this),
		// Now include all the pre-built node-ios-device bindings/binaries
		function (cb) {
			if (this.targetOS === 'osx') {
				let dir = path.join(this.zipSDKDir, 'node_modules', 'node-ios-device');

				if (!fs.existsSync(dir)) {
					dir = path.join(this.zipSDKDir, 'node_modules', 'ioslib', 'node_modules', 'node-ios-device');
				}

				if (!fs.existsSync(dir)) {
					return cb(new Error('Unable to find node-ios-device module'));
				}

				exec('node bin/download-all.js', { cwd: dir, stdio: 'inherit' }, cb);

			} else {
				cb();
			}
		}.bind(this),
		// FIXME Remove these hacks for titanium-sdk when titanium-cli has been released and the tisdk3fixes.js hook is gone!
		// Now copy over hacked titanium-sdk fake node_module
		function (cb) {
			console.log('Copying titanium-sdk node_module stub for backwards compatibility with titanium-cli');
			fs.copy(path.join(__dirname, 'titanium-sdk'), path.join(this.zipSDKDir, 'node_modules', 'titanium-sdk'), cb);
		}.bind(this),
		// Hack the package.json to include "titanium-sdk": "*" in dependencies
		function (cb) {
			console.log('Inserting titanium-sdk as production dependency');
			const contents = fs.readFileSync(path.join(this.zipSDKDir, 'package.json')).toString(),
				packageJSON = JSON.parse(contents);
			packageJSON.dependencies['titanium-sdk'] = '*';
			fs.writeJSON(path.join(this.zipSDKDir, 'package.json'), packageJSON, cb);
		}.bind(this),
		this.includePackagedModules.bind(this),
		function (cb) {
			var ignoreDirs = [ 'packaged', '.pyc' ];
			ignoreDirs.push(path.join(SUPPORT_DIR, 'dev'));
			// Copy support/ into root, but filter out folders based on OS
			if (this.targetOS === 'win32') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'iphone'));
				ignoreDirs.push(path.join(SUPPORT_DIR, 'osx'));
			} else if (this.targetOS === 'linux') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'iphone'));
				ignoreDirs.push(path.join(SUPPORT_DIR, 'osx'));
				ignoreDirs.push(path.join(SUPPORT_DIR, 'win32'));
			} else if (this.targetOS === 'osx') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'win32'));
			}
			fs.copy(SUPPORT_DIR, this.zipSDKDir, { filter: function (src) {
				for (let x = 0; x < ignoreDirs.length; x++) {
					if (src.indexOf(ignoreDirs[x]) !== -1) {
						return false;
					}
				}
				return true;
			} }, cb);
		}.bind(this),
		function (cb) {
			const tasks = [];
			// Zip up all the platforms!
			for (let i = 0; i < this.platforms.length; i++) {
				tasks.push(this.packagers[this.platforms[i]]);
			}
			async.series(tasks, cb); // TODO Do parallel?
		}.bind(this),
		this.zip.bind(this)
	], next);
};

module.exports = Packager;
