#!/usr/bin/env node
'use strict';

const os = require('os');
const path = require('path');
const program = require('commander');
const fs = require('fs-extra');
const version = require('../package.json').version;
const ALL_PLATFORMS = [ 'ios', 'android' ];
const DIST_DIR = path.join(__dirname, '../dist');
const test = require('./lib/test');

const runTests = test.runTests;
const outputResults = test.outputResults;

program
	.option('-C, --device-id [id]', 'Titanium device id to run the unit tests on. Only valid when there is a target provided')
	.option('-T, --target [target]', 'Titanium platform target to run the unit tests on. Only valid when there is a single platform provided')
	.option('-s, --skip-sdk-install', 'Skip the SDK installation step')
	.option('-b, --branch [branch]', 'Which branch of the test suite to use', 'master')
	.parse(process.argv);

let platforms = program.args;

// if no platforms, or set to 'full', use all platforms
if (!platforms.length || (platforms.length === 1 && platforms[0] === 'full')) {
	platforms = ALL_PLATFORMS;
}

// FIXME Assume the zipfile is just using the base SDK version and not a version tag
let osName = os.platform();
if (osName === 'darwin') {
	osName = 'osx';
}

const zipfile = path.join(DIST_DIR, `mobilesdk-${version}-${osName}.zip`);
// Only enforce zipfile exists if we're going to install it
if (!program.skipSdkInstall && !fs.existsSync(zipfile)) {
	console.error(`Could not find zipped SDK in dist dir: ${zipfile}. Please run node scons.js cleanbuild first.`);
	process.exit(1);
}

runTests(zipfile, platforms, program)
	.then(results => outputResults(results))
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
