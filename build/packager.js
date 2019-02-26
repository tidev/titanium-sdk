'use strict';

const path = require('path');
const os = require('os');
const exec = require('child_process').exec; // eslint-disable-line security/detect-child-process
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const async = require('async');
const fs = require('fs-extra');
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const appc = require('node-appc');
const version = appc.version;
const utils = require('./utils');
const copyFile = utils.copyFile;
const copyFiles = utils.copyFiles;
const downloadURL = utils.downloadURL;
const ROOT_DIR = path.join(__dirname, '..');
const SUPPORT_DIR = path.join(ROOT_DIR, 'support');
const V8_STRING_VERSION_REGEXP = /(\d+)\.(\d+)\.\d+\.\d+/;

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
	const child = spawn(command, [ '-o', zipfile, '-d', dest ], { stdio: [ 'ignore', 'ignore', 'pipe' ] });
	let err = '';
	child.stderr.on('data', function (buffer) {
		err += buffer.toString();
	});
	child.on('error', function (err) {
		return next(err);
	});
	child.on('close', function (code) {
		if (code !== 0) {
			return next(`Unzipping of ${zipfile} exited with non-zero exit code ${code}. ${err}`);
		}
		next();
	});
}

/**
 * @param {String} outputDir path to place the temp files and zipfile
 * @param {String} targetOS  'win32', 'linux', or 'osx'
 * @param {string[]} platforms The list of SDK platforms to package
 * @param {string} version version string to use
 * @param {string} versionTag version tag
 * @param {string} moduleApiVersion module api version
 * @param {string} gitHash git commit SHA
 * @param {string} timestamp build date/timestamp
 * @param {boolean} [skipZip] Optionally skip zipping up the result
 * @constructor
 */
function Packager(outputDir, targetOS, platforms, version, versionTag, moduleApiVersion, gitHash, timestamp, skipZip) {
	this.srcDir = ROOT_DIR;
	this.outputDir = outputDir; // root folder where output is placed
	this.targetOS = targetOS;
	this.platforms = platforms;
	this.version = version;
	this.versionTag = versionTag;
	this.moduleApiVersion = moduleApiVersion;
	this.gitHash = gitHash;
	this.timestamp = timestamp;
	this.zipFile = path.join(this.outputDir, `mobilesdk-${this.versionTag}-${this.targetOS}.zip`);
	this.packagers = {
		android: this.zipAndroid.bind(this),
		ios: this.zipIOS.bind(this),
		windows: this.zipWindows.bind(this)
	};
	// Location where we build up the zip file contents
	this.zipDir = path.join(this.outputDir, `mobilesdk-${this.versionTag}-${this.targetOS}`);
	this.zipSDKDir = path.join(this.zipDir, 'mobilesdk', this.targetOS, this.versionTag);
	this.skipZip = skipZip;
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
	new IOS({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

Packager.prototype.zipWindows = function (next) {
	const Windows = require('./windows');
	new Windows({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

/**
 * Zips up the Android SDK portion
 * @param  {Function} next callback function
 */
Packager.prototype.zipAndroid = function (next) {
	const Android = require('./android');
	new Android({ sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp }).package(this, next);
};

/**
 * Removes existing zip file and tmp dir used to build it
 * @param  {Function} next callback function
 */
Packager.prototype.cleanZipDir = function (next) {
	console.log('Cleaning previous zipfile and tmp dir');
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
	console.log('Zipping packaged modules');
	// Unzip all the zipfiles in support/module/packaged
	let supportedPlatforms = this.platforms.concat([ 'commonjs' ]);
	// Include aliases for ios/iphone/ipad
	if (supportedPlatforms.indexOf('ios') !== -1
		|| supportedPlatforms.indexOf('iphone') !== -1
		|| supportedPlatforms.indexOf('ipad') !== -1) {
		supportedPlatforms = supportedPlatforms.concat([ 'ios', 'iphone', 'ipad' ]);
	}

	// Hyperloop has no single platform downloads yet, so we use a fake platform
	// that will download the all-in-one distribution.
	supportedPlatforms = supportedPlatforms.concat([ 'hyperloop' ]);

	let modules = []; // module objects holding url/integrity
	// Read modules.json, grab the object for each supportedPlatform
	const contents = fs.readFileSync(path.join(SUPPORT_DIR, 'module', 'packaged', 'modules.json')).toString(),
		modulesJSON = JSON.parse(contents);
	for (let x = 0; x < supportedPlatforms.length; x++) {
		const modulesForPlatform = modulesJSON[supportedPlatforms[x]];
		if (modulesForPlatform) {
			modules = modules.concat(Object.values(modulesForPlatform));
		}
	}
	// remove duplicates
	modules = Array.from(new Set(modules));

	// Fetch the listed modules from URLs...
	const outDir = this.zipDir,
		zipFiles = [];
	async.each(modules, function (moduleObject, cb) {
		// FIXME Don't show progress bars, because they clobber each other
		downloadURL(moduleObject.url, moduleObject.integrity, function (err, file) {
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
 * @returns {void}
 */
Packager.prototype.zip = function (next) {
	if (this.skipZip) {
		return next();
	}
	console.log(`Zipping up packaged SDK to ${this.zipFile}`);
	zip(this.zipDir, this.zipFile, function (err) {
		if (err) {
			return next(err);
		}
		// delete the zipdir!
		fs.remove(this.zipDir, next);
	}.bind(this));
};

function determineBabelOptions() {
	// Pull out android's V8 target (and transform into equivalent chrome version)
	const v8Version = require('../android/package.json').v8.version;
	const found = v8Version.match(V8_STRING_VERSION_REGEXP);
	const chromeVersion = parseInt(found[1] + found[2]); // concat the first two numbers as string, then turn to int
	// Now pull out min IOS target
	const minSupportedIosSdk = version.parseMin(require('../iphone/package.json').vendorDependencies['ios sdk']);
	// TODO: filter to only targets relevant for platforms we're building?
	const options = {
		targets: {
			chrome: chromeVersion,
			ios: minSupportedIosSdk
		},
		useBuiltIns: 'entry',
		// DO NOT include web polyfills!
		exclude: [ 'web.dom.iterable', 'web.immediate', 'web.timers' ]
	};
	// pull out windows target (if it exists)
	if (fs.pathExistsSync('../windows/package.json')) {
		const windowsSafariVersion = require('../windows/package.json').safari;
		options.targets.safari = windowsSafariVersion;
	}
	return {
		presets: [ [ '@babel/env', options ] ],
		exclude: 'node_modules/**'
	};
}

Packager.prototype.transpile = async function () {
	// Copy over common dir, @babel/polyfill, etc into some temp dir
	// Then run rollup/babel on it, then just copy the resulting bundle to our real destination!
	// The temporary location we'll assembled the transpiled bundle
	const tmpBundleDir = path.join(this.zipSDKDir, 'common_temp');

	console.log('Copying common SDK JS over');
	fs.copySync(path.join(this.srcDir, 'common'), tmpBundleDir);

	// copy over polyfill and its dependencies
	console.log('Copying JS polyfills over');
	const modulesDir = path.join(tmpBundleDir, 'Resources/node_modules');
	// make sure our 'node_modules' directory exists
	fs.ensureDirSync(modulesDir);
	copyPackageAndDependencies('@babel/polyfill', modulesDir);

	console.log('Transpiling and bundling common SDK JS');
	// the ultimate destinatio for our common SDK JS
	const destDir = path.join(this.zipSDKDir, 'common');
	// create a bundle
	console.log('running rollup');
	const babelOptions = determineBabelOptions();
	const bundle = await rollup({
		input: `${tmpBundleDir}/Resources/ti.main.js`,
		plugins: [
			resolve(),
			commonjs(),
			babel(babelOptions)
		],
		external: [ './app', 'com.appcelerator.aca' ]
	});

	// write the bundle to disk
	console.log('Writing common SDK JS bundle to disk');
	await bundle.write({ format: 'cjs', file: `${destDir}/Resources/ti.main.js` });

	// Copy over the files we can't bundle/inline: common/Resources/ti.internal
	await fs.copy(path.join(this.srcDir, 'common/Resources/ti.internal'), path.join(destDir, 'Resources/ti.internal'));

	// Remove the temp dir we assembled the parts inside!
	console.log('Removing temporary common SDK JS bundle directory');
	await fs.remove(tmpBundleDir);
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

/**
 * [package description]
 * @param {Function} next callback function
 */
Packager.prototype.package = function (next) {
	console.log('Packaging Mobile SDK...');
	async.series([
		this.cleanZipDir.bind(this),
		this.generateManifestJSON.bind(this),
		function (cb) {
			console.log('Writing JSCA');
			fs.copy(path.join(this.outputDir, 'api.jsca'), path.join(this.zipSDKDir, 'api.jsca'), cb);
		}.bind(this),
		function (cb) {
			console.log('Copying SDK files');
			// Copy some root files, cli/, templates/, node_modules
			this.copy([ 'CREDITS', 'README.md', 'package.json', 'cli', 'node_modules', 'templates' ], cb);
		}.bind(this),
		function (cb) {
			this.transpile()
				.then(() => cb()) // eslint-disable-line promise/no-callback-in-promise
				.catch(err => cb(err)); // eslint-disable-line promise/no-callback-in-promise
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
