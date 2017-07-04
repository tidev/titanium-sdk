#!/usr/bin/env node

if (typeof Promise === 'undefined') {
	console.log('This script requires Node.js 4 or newer!');
	process.exit(1);
}

/**
 * List of supported Node.js module API versions.
 */
const nodeModuleVersions = [
	11, // 0.10.4 - 0.10.48
	45, // 3.x
	46, // 4.x
	47, // 5.x
	48, // 6.x
	51, // 7.x
	57  // 8.x
];

const fs = require('fs');
const https = require('https');
const path = require('path');
const exec = require('child_process').exec;
const pkgJson = require(path.resolve(__dirname + '/../package.json'));
const moduleName = pkgJson.binary.module_name;
const version = pkgJson.version;
const bindingDir = path.dirname(path.resolve(__dirname + '/../' + pkgJson.binary.module_path));
const prefix = pkgJson.binary.host + '/' + pkgJson.binary.remote_path
	.replace(/^.\//, '')
	.replace(/{name}/, pkgJson.name)
	.replace(/{version}/, version) + '/';
let failed = false;

if (!fs.existsSync(bindingDir)) {
	fs.mkdirSync(bindingDir)
}

function download(abiVersion) {
	return new Promise((resolve, reject) => {
		var filename = `${moduleName}-v${version}-node-v${abiVersion}-${process.platform}-${process.arch}.tar.gz`;
		var url = prefix + filename;
		var dest = path.join(bindingDir, filename);

		console.log(`Downloading ${url}`);

		https
			.get(url, response => {
				if (response.statusCode !== 200) {
					console.log(`Failed to download ${url} (${response.statusCode})`);
					failed = true;
					resolve();
				} else {
					console.log(`Downloaded ${url} successfully (${response.statusCode})`);
					response.pipe(fs.createWriteStream(dest))
						.on('finish', function () {
							console.log(`Extracting ${filename}...`);
							exec(`tar xzf "${filename}"`, { cwd: bindingDir }, function (error) {
								if (error) {
									console.log(`Failed to extract ${filename}: ${error.message || error.toString()}`);
									failed = true;
									reject(error);
								} else {
									fs.unlinkSync(dest);
									resolve();
								}
							});
						});
				}
			})
			.on('error', reject);
	});
}

Promise
	.all(nodeModuleVersions.map(download))
	.then(() => {
		if (failed) {
			console.log('Done, but with errors');
			process.exit(1);
		}
		console.log('Done!');
	})
	.catch(err => {
		console.log(err);
		process.exit(1);
	});
