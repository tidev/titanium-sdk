#!/usr/bin/env node
'use strict';

const os = require('os');
const path = require('path');
const async = require('async');
const program = require('commander');
const packageJSON = require('../package.json');
const version = packageJSON.version;
const Documentation = require('./docs');
const git = require('./git');
const Packager = require('./packager');
const utils = require('./utils');
// TODO Move common constants somewhere?
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ALL_OSES = [ 'win32', 'linux', 'osx' ];
const ALL_PLATFORMS = [ 'ios', 'android', 'windows' ];
const OS_TO_PLATFORMS = {
	win32: [ 'android', 'windows' ],
	osx: [ 'android', 'ios' ],
	linux: [ 'android' ]
};

program
	.option('-a, --all', 'Build a zipfile for every OS')
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --skip-zip', 'Do not zip up the package')
	.parse(process.argv);

console.log(process.argv);
console.log(program.skipZip);
let platforms = program.args;
let oses = [];

// Are we building every platform for every OS?
if (program.all) {
	oses = ALL_OSES;
	// Assume _ALL_ platforms, we'll filter them out later...
	platforms = ALL_PLATFORMS;
} else {
	// We're building for the host OS
	let thisOS = os.platform();
	if (thisOS === 'darwin') {
		thisOS = 'osx';
	}
	oses.push(thisOS);
	// If user doesn't specify platforms, assume default list by OS
	if (!platforms.length) {
		platforms = OS_TO_PLATFORMS[thisOS];
	}
}

const versionTag = program.versionTag || program.sdkVersion;

git.getHash(path.join(__dirname, '..'), function (err, hash) {
	const outputDir = DIST_DIR;
	program.gitHash = hash;
	program.timestamp = utils.timestamp();
	console.log('Packaging MobileSDK (%s)...', versionTag);

	new Documentation(outputDir).generate(function (err) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		// Now package for each OS.
		// MUST RUN IN SERIES - this all runs in same directory, so running in
		// parallel for each OS would cause all sorts of collisions right now.
		// TODO Separate out working directories per-OS so we can do in parallel!
		async.eachSeries(oses, function (targetOS, next) {
			// Match our master platform list against OS_TO_PLATFORMS[item] listing.
			// Only package the platform if its in both arrays
			const filteredPlatforms = [];
			for (let i = 0; i < platforms.length; i++) {
				if (OS_TO_PLATFORMS[targetOS].indexOf(platforms[i]) !== -1) {
					filteredPlatforms.push(platforms[i]);
				}
			}

			new Packager(outputDir, targetOS, filteredPlatforms, program.sdkVersion, versionTag, packageJSON.moduleApiVersion, hash, program.timestamp, program.skipZip).package(next);
		}, function (err) {
			if (err) {
				console.error(err);
				process.exit(1);
			}
			console.log('Packaging version (%s) complete', versionTag);
			process.exit(0);
		});
	});
});
