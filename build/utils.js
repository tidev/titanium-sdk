var path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	glob = require('glob'),
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

module.exports = Utils;
