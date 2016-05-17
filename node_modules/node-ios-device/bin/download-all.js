#!/usr/bin/env node

try {
	require.resolve('async');
} catch (e) {
	console.log('This tool requires the async library which needs to be explicitly installed.');
	console.log('Please run "npm install async" to install it, then run this script again.');
	process.exit(1);
}

var async = require('async');
var fs = require('fs');
var https = require('https');
var path = require('path');
var exec = require('child_process').exec;
var pkgJson = require(path.resolve(__dirname + '/../package.json'));
var moduleName = pkgJson.binary.module_name;
var version = pkgJson.version;
var bindingDir = path.dirname(path.resolve(__dirname + '/../' + pkgJson.binary.module_path));
var prefix = pkgJson.binary.host + '/' + pkgJson.binary.remote_path
	.replace(/^.\//, '')
	.replace(/{name}/, pkgJson.name)
	.replace(/{version}/, version) + '/';

if (!fs.existsSync(bindingDir)) {
	fs.mkdirSync(bindingDir)
}

function download(abiVersion, cb) {
	var filename = moduleName + '-v' + version + '-node-v' + abiVersion + '-' + process.platform + '-' + process.arch + '.tar.gz';
	var url = prefix + filename;
	var dest = path.join(bindingDir, filename);

	console.log('Downloading ' + url);

	https.get(url, function (response) {
		if (response.statusCode !== 200) {
			cb(response.statusCode);
		} else {
			console.log(response.statusCode);
			response.pipe(fs.createWriteStream(dest))
				.on('finish', function () {
					exec('tar xzf "' + filename + '"', { cwd: bindingDir }, function (error) {
						if (error) {
							console.log(err);
							cb(error);
						} else {
							fs.unlinkSync(dest);
							cb();
						}
					});
				});
		}
	}).on('error', function (err) {
		cb(err);
	});
}

async.series([
	function (cb) { download(11, cb); },
	function (cb) { download(14, cb); },
	function (cb) {
		var done = false;
		var ver = 42;
		async.whilst(
			function () { return !done; },
			function (cb) {
				download(ver++, function (err) {
					done = !!err;
					cb();
				});
			},
			cb
		);
	}
], function () {
	console.log('Done!');
});
