'use strict';

var execSync = require('child_process').execSync;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var path = require('path');
var tmp = process.env.TMP || process.env.TMPDIR;
var boostDir = path.resolve('./deps/boost/include/boost');
var cwd = path.resolve(__dirname, '../..');
var files = [];
var deletedFiles = [];

(function walk(dir) {
	fs.readdirSync(dir).forEach(function (name) {
		var file = path.join(dir, name);
		if (name === '.DS_Store') {
			fs.unlinkSync(file);
			return;
		}
		if (fs.statSync(file).isDirectory()) {
			walk(file);
		} else {
			files.push(file);
		}
	});
}(boostDir));

process.on('SIGINT', function () {});

console.log('Do not stop this script!');
console.log('It moves files into the tmp dir, then back if they are needed\n');
console.log('Checking ' + files.length + ' Boost files:');

for (var i = 0, len = files.length; i < len; i++) {
	var file = files[i];
	process.stdout.write((i + 1) + '/' + len + ') Testing ' + file + '... ');

	var tmpFile = path.join(tmp, path.basename(file));
	fs.renameSync(file, tmpFile);

	var result = spawnSync('npm', ['install', '--build-from-source'], { cwd: cwd });
	if (result.status || result.error) {
		process.stdout.write('Keeping\n');
		fs.renameSync(tmpFile, file);
	} else {
		process.stdout.write('Deleting\n');
		fs.unlinkSync(tmpFile);
		deletedFiles.push(file);
	}
}

console.log('Deleting .DS_Store files');
execSync('find . -name ".DS_Store" -print0 | xargs -0 rm', { cwd: __dirname });

console.log('Deleting empty directories');
execSync('find . -type d -empty -delete', { cwd: __dirname });

console.log('Done!\nDeleted ' + deletedFiles.length + ' files:');
console.log(deletedFiles);
