var path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	glob = require('glob'),
	appc = require('node-appc'),
	request = require('request'),
	temp = require('temp'),
	Utils = {};

Utils.copyFile = function (srcFolder, destFolder, filename, next) {
	fs.copy(path.join(srcFolder, filename), path.join(destFolder, filename), next);
}

Utils.copyFiles = function (srcFolder, destFolder, files, next) {
	async.each(files, function (file, cb) {
		Utils.copyFile(srcFolder, destFolder, file, cb);
	}, next);
}

Utils.globCopy = function (pattern, srcFolder, destFolder, next) {
	glob(pattern, {cwd: srcFolder}, function (err, files) {
		if (err) {
			return next(err);
		}
		Utils.copyFiles(srcFolder, destFolder, files, next);
	});
}

Utils.copyAndModifyFile = function (srcFolder, destFolder, filename, substitutions, next) {
	// FIXME If this is a directory, we need to recurse into directory!

	// read in src file, modify contents, write to dest folder
	fs.readFile(path.join(srcFolder, filename), function (err, data) {
		var str;
		if (err) {
			return next(err);
		}
		// Go through each substitution and replace!
		str = data.toString();
		for (var key in substitutions) {
			if (substitutions.hasOwnProperty(key) ) {
				str = str.split(key).join(substitutions[key]);
			}
		}
		fs.writeFile(path.join(destFolder, filename), str, next);
	});
}

Utils.copyAndModifyFiles = function (srcFolder, destFolder, files, substitutions, next) {
	async.each(files, function (file, cb) {
		Utils.copyAndModifyFile(srcFolder, destFolder, file, substitutions, cb);
	}, next);
}

Utils.downloadURL = function (url, callback) {
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


module.exports = Utils;
