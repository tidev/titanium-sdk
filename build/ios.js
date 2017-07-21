'use strict';

const exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	utils = require('./utils'),
	copyFiles = utils.copyFiles,
	copyAndModifyFile = utils.copyAndModifyFile,
	copyAndModifyFiles = utils.copyAndModifyFiles,
	globCopy = utils.globCopy,
	downloadURL = utils.downloadURL,
	ROOT_DIR = path.join(__dirname, '..'),
	IOS_ROOT = path.join(ROOT_DIR, 'iphone'),
	IOS_LIB = path.join(IOS_ROOT, 'lib'),
	TI_CORE_VERSION = 24;

function gunzip(gzFile, destFile, next) {
	console.log('Gunzipping ' + gzFile + ' to ' + destFile);
	exec('gunzip -dc "' + gzFile + '" > "' + destFile + '"', function (err) {
		if (err) {
			return next(err);
		}
		next();
	});
}

/**
 * @param {Object} options options object
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
 * @constructor
 */
function IOS(options) {
	this.sdkVersion = options.sdkVersion;
	this.gitHash = options.gitHash;
	this.timestamp = options.timestamp;
}

IOS.prototype.clean = function (next) {
	// no-op
	next();
};

IOS.prototype.fetchLibTiCore = function (next) {
	const url = 'http://timobile.appcelerator.com.s3.amazonaws.com/libTiCore-' + TI_CORE_VERSION + '.a.gz',
		dest = path.join(IOS_LIB, 'libTiCore.a'),
		markerFile = path.join(IOS_LIB, TI_CORE_VERSION.toString() + '.txt');

	// Do we have the latest libTiCore?
	if (fs.existsSync(dest) && fs.existsSync(markerFile)) {
		return next();
	}

	console.log('You don\'t seem to have the appropriate thirdparty files. I\'ll fetch them.');
	console.log('This could take awhile.. Might want to grab a cup of Joe or make fun of Nolan.');

	downloadURL(url, function (err, file) {
		if (err) {
			return next(err);
		}
		gunzip(file, dest, function (err) {
			if (err) {
				return next(err);
			}
			// Place "marker" file
			fs.writeFile(markerFile, 'DO NOT DELETE THIS FILE', next);
		});
	});
};

IOS.prototype.build = function (next) {
	this.fetchLibTiCore(next);
};

IOS.prototype.package = function (packager, next) {
	// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
	console.log('Zipping iOS platform...');
	const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

	async.parallel([
		this.fetchLibTiCore.bind(this),
		function (callback) {
			async.series([
				function (cb) {
					globCopy('**/*.h', path.join(IOS_ROOT, 'Classes'), path.join(DEST_IOS, 'include'), cb);
				},
				function (cb) {
					globCopy('**/*.h', path.join(IOS_ROOT, 'headers', 'JavaScriptCore'), path.join(DEST_IOS, 'include', 'JavaScriptCore'), cb);
				},
				function (cb) {
					copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'headers', 'iphone', 'templates' ], cb);
				},
				// Copy and inject values for special source files
				function (cb) {
					const subs = {
						'__VERSION__': this.sdkVersion,
						'__TIMESTAMP__': this.timestamp,
						'__GITHASH__': this.gitHash
					};
					copyAndModifyFiles(path.join(IOS_ROOT, 'Classes'), path.join(DEST_IOS, 'Classes'), [ 'TopTiModule.m', 'TiApp.m' ], subs, cb);
				}.bind(this),
				function (cb) {
					copyFiles(IOS_LIB, DEST_IOS, [ 'libtiverify.a', 'libti_ios_debugger.a', 'libti_ios_profiler.a' ], cb);
				},
				// copy iphone/package.json, but replace __VERSION__ with our version!
				function (cb) {
					copyAndModifyFile(IOS_ROOT, DEST_IOS, 'package.json', { '__VERSION__': this.sdkVersion }, cb);
				}.bind(this),
				// Copy iphone/Resources/modules/<name>/* to this.zipSDKDir/iphone/modules/<name>/images
				function (cb) {
					fs.copy(path.join(IOS_ROOT, 'Resources', 'modules'), path.join(DEST_IOS, 'modules'), cb);
				}
			], callback);
		}.bind(this)
	], function (err) {
		if (err) {
			return next(err);
		}
		// Ensure we've fetched libTiCore before we copy it
		copyFiles(IOS_LIB, DEST_IOS, [ 'libTiCore.a' ], next);
	});
};

module.exports = IOS;
