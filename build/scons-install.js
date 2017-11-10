#!/usr/bin/env node
'use strict';

const os = require('os'),
	path = require('path'),
	program = require('commander'),
	version = require('../package.json').version,
	appc = require('node-appc');

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.parse(process.argv);

const versionTag = program.versionTag || program.sdkVersion;

/**
 * @param  {String}   versionTag [description]
 * @param  {Function} next        [description]
 */
function install(versionTag, next) {
	let dest,
		osName = os.platform();

	if (osName === 'win32') {
		dest = path.join(process.env.ProgramData, 'Titanium');
	}

	if (osName === 'darwin') {
		osName = 'osx';
		dest = path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
	}

	if (osName === 'linux') {
		osName = 'linux';
		dest = path.join(process.env.HOME, '.titanium');
	}

	const zipfile = path.join(__dirname, '..', 'dist', 'mobilesdk-' + versionTag + '-' + osName + '.zip');
	console.log('Installing %s...', zipfile);

	appc.zip.unzip(zipfile, dest, {}, next);
}

install(versionTag, function (err) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	process.exit(0);
});
