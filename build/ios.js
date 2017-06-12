var exec = require('child_process').exec,
	path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	appc = require('node-appc'), // TODO Can we remove this dependency? Brings in a lot of transitive dependencies
	request = require('request'), // TODO Can we remove this dependency? Brings in a lot of transitive dependencies
	temp = require('temp'),
	utils = require('./utils'),
	copyFiles = utils.copyFiles,
	copyAndModifyFile = utils.copyAndModifyFile,
	copyAndModifyFiles = utils.copyAndModifyFiles,
	globCopy = utils.globCopy,
	ROOT_DIR = path.join(__dirname, '..'),
	IOS_ROOT = path.join(ROOT_DIR, 'iphone'),
	SUPPORT_DIR = path.join(ROOT_DIR, 'support'),
	IOS_LIB = path.join(IOS_ROOT, 'lib'),
	TI_CORE_VERSION = 24;

function gunzip(gzFile, destFile, next) {
	console.log('Gunzipping ' + gzFile + ' to ' + destFile);
	exec('gunzip -dc "' + gzFile + '" > "' + destFile + '"' , function (err, stdout, stderr) {
		if (err) {
			return next(err);
		}
		next();
	});
}

function downloadURL(url, callback) {
	console.log('Downloading %s', url);

	var tempName = temp.path({ suffix: '.gz' }),
		tempDir = path.dirname(tempName);
	fs.existsSync(tempDir) || fs.mkdirsSync(tempDir);

	var tempStream = fs.createWriteStream(tempName),
		req = request({ url: url });

	req.pipe(tempStream);

	req.on('error', function (err) {
		fs.existsSync(tempName) && fs.unlinkSync(tempName);
		console.log();
		console.error('Failed to download: %s', err.toString());
		callback(err);
	});

	req.on('response', function (req) {
		if (req.statusCode >= 400) {
			// something went wrong, abort
			console.log();
			console.error('Request failed with HTTP status code %s %s', req.statusCode, req.statusMessage);
			return callback(err);
		} else if (req.headers['content-length']) {
			// we know how big the file is, display the progress bar
			var total = parseInt(req.headers['content-length']),
				bar = new appc.progress('  :paddedPercent [:bar] :etas', {
				complete: '='.cyan,
				incomplete: '.'.grey,
				width: 40,
				total: total
			});

			req.on('data', function (buffer) {
				bar.tick(buffer.length);
			});

			tempStream.on('close', function () {
				if (bar) {
					bar.tick(total);
					console.log('\n');
				}
				callback(null, tempName);
			});
		} else {
			// we don't know how big the file is, display a spinner
			var busy = new appc.busyindicator;
			busy.start();

			tempStream.on('close', function () {
				busy && busy.stop();
				console.log();
				callback(null, tempName);
			});
		}
	});
}

/**
 * @param {Object} options
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
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
	var url = 'http://timobile.appcelerator.com.s3.amazonaws.com/libTiCore-' + TI_CORE_VERSION + '.a.gz',
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
}

IOS.prototype.package = function (packager, next) {
	// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like mobileweb or Windows?
	console.log('Zipping iOS platform...');
	var DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

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
					copyFiles(IOS_ROOT, DEST_IOS, ['AppledocSettings.plist', 'Classes', 'cli', 'headers', 'iphone', 'templates'], cb);
				}.bind(this),
				// Copy and inject values for special source files
				function (cb) {
					var subs = {
						'__VERSION__': this.sdkVersion,
						'__TIMESTAMP__': this.timestamp,
						'__GITHASH__': this.gitHash
					};
					copyAndModifyFiles(path.join(IOS_ROOT, 'Classes'), path.join(DEST_IOS, 'Classes'), ['TopTiModule.m', 'TiApp.m'], subs, cb);
				}.bind(this),
				function (cb) {
					copyFiles(IOS_LIB, DEST_IOS, ['libtiverify.a', 'libti_ios_debugger.a', 'libti_ios_profiler.a'], cb);
				},
				// copy iphone/package.json, but replace __VERSION__ with our version!
				function (cb) {
					copyAndModifyFile(IOS_ROOT, DEST_IOS, 'package.json', {'__VERSION__': this.sdkVersion}, cb);
				}.bind(this),
				// Copy support/osx/* to zipSDKDir
				function (cb) {
					fs.copy(path.join(SUPPORT_DIR, 'osx'), packager.zipSDKDir, cb);
				}.bind(this),
				// Copy iphone/Resources/modules to iphone/
				function (cb) {
					fs.copy(path.join(IOS_ROOT, 'Resources', 'modules'), path.join(DEST_IOS, 'modules'), cb);
				}.bind(this)
			], callback);
		}.bind(this)
	], function (err) {
		if (err) {
			return next(err);
		}
		// Ensure we've fetched libTiCore before we copy it
		copyFiles(IOS_LIB, DEST_IOS, ['libTiCore.a'], next);
	});
};

module.exports = IOS;
