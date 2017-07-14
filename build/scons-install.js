#!/usr/bin/env node

var exec = require('child_process').exec,
	os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	version = require('../package.json').version,
	appc = require('node-appc');

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.parse(process.argv);

var versionTag = program.versionTag || program.sdkVersion;

/**
 * @param  {String}   versionTag [description]
 * @param  {Function} next        [description]
 */
function install(versionTag, next) {
	var zipfile,
		dest,
		osName = os.platform();

	if (osName === 'win32') {
		dest = path.join(process.env.ProgramData, 'Titanium');
	}

	if (osName === 'darwin') {
		osName = 'osx';
		dest = path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
	}
	// TODO Where should we install on Windows?

	zipfile = path.join(__dirname, '..', 'dist', 'mobilesdk-' + versionTag + '-' + osName + '.zip');
	console.log('Installing %s...', zipfile);

	appc.zip.unzip(zipfile, dest, { overwrite:true }, next);
}

install(versionTag, function (err) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	process.exit(0);
});
