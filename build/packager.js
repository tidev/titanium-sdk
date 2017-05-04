var path = require('path'),
	os = require('os'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	async = require('async'),
	fs = require('fs-extra'),
	utils = require('./utils'),
	copyFile = utils.copyFile,
	copyFiles = utils.copyFiles,
	ROOT_DIR = path.join(__dirname, '..'),
	SUPPORT_DIR = path.join(ROOT_DIR, 'support'),
	DOC_DIR = path.join(ROOT_DIR, 'apidoc');

/**
 * Given a folder we'd like to zip up and the destination filename, this will zip up the directory contents.
 * Be aware that the top-level of the zip will not be the directory itself, but it's contents.
 *
 * @param  {String}   folder   The folder whose contents will become the zip contents
 * @param  {String}   filename The output zipfile
 * @param  {Function} next     [description]
 */
function zip(folder, filename, next) {
	var command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build', 'win32', 'zip') : 'zip';
	exec(command + ' -9 -q -r "' + path.join('..', path.basename(filename)) + '" *', {cwd: folder}, function(err, stdout, stderr) {
		if (err) {
			return next(err);
		}

		var outputFolder = path.resolve(folder, '..'),
			destFolder = path.dirname(filename),
			outputFile = path.join(outputFolder, path.basename(filename));

		if (outputFile == filename) {
			return next();
		}
		copyFile(outputFolder, destFolder, path.basename(filename), next);
	});
}

function unzip(zipfile, dest, next) {
	console.log('Unzipping ' + zipfile + ' to ' + dest);
	var command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build', 'win32', 'unzip') : 'unzip';
	exec(command + ' -o "' + zipfile  + '" -d "' + dest + '"', function (err, stdout, stderr) {
		if (err) {
			return next(err);
		}
		next();
	});
}

function leftpad (str, len, ch) {
	str = String(str);
	var i = -1;
	if (!ch && ch !== 0) ch = ' ';
	len = len - str.length;
	while (++i < len) {
		str = ch + str;
	}
	return str;
}

/**
 * [Packager description]
 * @param {String} outputDir path to place the temp files and zipfile
 * @param {String} targetOS  'win32', 'linux', or 'osx'
 * @param {Array[String]} platforms The list of SDK platforms to package
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
	var date = new Date();
	this.timestamp = '' + (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + (date.getUTCFullYear()) + ' ' + leftpad(date.getUTCHours(), 2, '0') + ':' + leftpad(date.getUTCMinutes(), 2, '0');
	this.zipFile = path.join(this.outputDir, 'mobilesdk-' + this.versionTag + '-' + this.targetOS + '.zip');
	this.packagers = {
		'android': this.zipAndroid.bind(this),
		'ios': this.zipIOS.bind(this),
		'windows': this.zipWindows.bind(this),
		'mobileweb': this.zipMobileWeb.bind(this)
	};
	// Location where we build up the zip file contents
	this.zipDir = path.join(this.outputDir, 'ziptmp');
	this.zipSDKDir = path.join(this.zipDir, 'mobilesdk', this.targetOS, this.versionTag);
}

Packager.prototype.generateManifestJSON = function (next) {
	console.log('Writing manifest.json');
	var modifiedPlatforms = this.platforms.slice(0), // need to work on a copy!
		json = {
			name: this.versionTag,
			version: this.version,
			moduleAPIVersion: this.moduleApiVersion,
			timestamp: this.timestamp,
			githash: this.gitHash
		},
		index;

	// Replace ios with iphone
	index = modifiedPlatforms.indexOf('ios');
	if (index != -1) {
		modifiedPlatforms.splice(index, 1, 'iphone');
	}
	json.platforms = modifiedPlatforms;
	fs.writeJSON(path.join(this.zipSDKDir, 'manifest.json'), json, next);
};

Packager.prototype.zipIOS = function(next) {
	var IOS = require('./ios');
	// FIXME Pass along the version/gitHash/options!
	new IOS({sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp}).package(this, next);
};

Packager.prototype.zipMobileWeb = function(next) {
	var MobileWeb = require('./mobileweb');
	// FIXME Pass along the version/gitHash/options!
	new MobileWeb({sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp}).package(this, next);
};

Packager.prototype.zipWindows = function(next) {
	var Windows = require('./windows');
	// FIXME Pass along the version/gitHash/options!
	new Windows({sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp}).package(this, next);
};

Packager.prototype.zipAndroid = function(next) {
	var Android = require('./android');
	// FIXME Pass along the ndk/sdk/version/apiLevel/options!
	new Android({sdkVersion: this.version, gitHash: this.gitHash, timestamp: this.timestamp}).package(this, next);
};

Packager.prototype.cleanZipDir = function(next) {
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

Packager.prototype.includePackagedModules = function (next) {
	console.log('Zipping packaged modules...');
	// Unzip all the zipfiles in support/module/packaged
	var outDir = this.zipDir,
		supportedPlatforms = this.platforms.concat(['commonjs']),
		items = [];
	// Include aliases for ios/iphone/ipad
	if (supportedPlatforms.indexOf('ios') != -1 ||
		supportedPlatforms.indexOf('iphone') != -1 ||
		supportedPlatforms.indexOf('ipad') != -1) {
		supportedPlatforms = supportedPlatforms.concat(['ios', 'iphone', 'ipad']);
	}
	fs.walk(path.join(SUPPORT_DIR, 'module', 'packaged'))
		.on('data', function (item) {
			var m,
				r = /([\w\.]+)?-(\w+)?-([\d\.]+)\.zip$/;
			// Skip modules for platforms we're not bundling!
			if (m = item.path.match(r)) {
				if (supportedPlatforms.indexOf(m[2]) != -1) {
					items.push(item);
				}
			}
		})
		.on('end', function () {
			// MUST RUN IN SERIES or they will clobber each other and unzip will fail mysteriously
			async.eachSeries(items, function (item, cb) {
				unzip(item.path, outDir, function (err) {
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
 * @param  {Array[String]} files List of files/folders to copy
 */
Packager.prototype.copy = function (files, next) {
	copyFiles(this.srcDir, this.zipSDKDir, files, next);
};

/**
 * Zip it all up and wipe the zip dir
 * @param  {Function} next [description]
 */
Packager.prototype.zip = function (next) {
	zip(this.zipDir, this.zipFile, function (err) {
		if (err) {
			return next(err);
		}
		// delete the zipdir!
		fs.remove(this.zipDir, next);
	}.bind(this));
}

/**
 * [package description]
 * @return {[type]}         [description]
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
			this.copy(['CREDITS', 'README.md', 'package.json', 'cli', 'node_modules', 'templates'], cb);
		}.bind(this),
		function (cb) {
			fs.remove(path.join(this.zipSDKDir, 'node_modules', '.bin'), cb);
		}.bind(this),
		// Now run 'npm prune --production' on the zipSDKDir, so we retain only production dependencies
		function (cb) {
			exec('npm prune --production', {cwd: this.zipSDKDir}, function (err, stdout, stderr) {
				if (err) {
					console.log(stdout);
					console.error(stderr);
					return cb(err);
				}
				cb();
			});
		}.bind(this),
		this.includePackagedModules.bind(this),
		function (cb) {
			var ignoreDirs = ['packaged', '.pyc'];
			// Copy support/ into root, but filter out folders based on OS
			if (this.targetOS == 'win32') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'iphone'))
				ignoreDirs.push(path.join(SUPPORT_DIR, 'osx'))
			} else if (this.targetOS == 'linux') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'iphone'))
				ignoreDirs.push(path.join(SUPPORT_DIR, 'osx'))
				ignoreDirs.push(path.join(SUPPORT_DIR, 'win32'))
			} else if (this.targetOS == 'osx') {
				ignoreDirs.push(path.join(SUPPORT_DIR, 'win32'))
			}
			fs.copy(SUPPORT_DIR, this.zipSDKDir, { filter: function (src) {
				for (var x = 0; x < ignoreDirs.length; x++) {
					if (src.indexOf(ignoreDirs[x]) != -1) {
						return false;
					}
				}
				return true;
			}}, cb);
		}.bind(this),
		function (cb) {
			var tasks = [];
			// Zip up all the platforms!
			for (var i = 0; i < this.platforms.length; i++) {
				tasks.push(this.packagers[this.platforms[i]]);
			}
			async.series(tasks, cb); // TODO Do parallel?
		}.bind(this),
		this.zip.bind(this)
	], next);
};

module.exports = Packager;
