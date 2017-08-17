#!/usr/bin/env node
'use strict';

const exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	fs = require('fs-extra'),
	version = require('../package.json').version,
	ALL_PLATFORMS = [ 'ios', 'android' ],
	MOCHA_TESTS_DIR = path.join(__dirname, '..', 'titanium-mobile-mocha-suite'),
	DIST_DIR = path.join(__dirname, '..', 'dist'),
	LOCAL_TESTS = path.join(__dirname, '..', 'tests');

program.parse(process.argv);

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
const zipfile = path.join(DIST_DIR, 'mobilesdk-' + version + '-' + osName + '.zip');
if (!fs.existsSync(zipfile)) {
	console.error('Could not find zipped SDK in dist dir: ' + zipfile + '. Please run node scons.js cleanbuild first.');
	process.exit(1);
}

/**
 * Wipes and re-clones the mocha common test suite, then runs our unit testing script for the
 * SDK zipfile in dist against the supplied platforms.
 *
 * @param  {String[]}   platforms [description]
 * @param  {Function} next      [description]
 */
function runTests(platforms, next) {
	async.series([
		function (cb) {
			// If we have a clone of the tests locally, wipe it...
			if (fs.existsSync(MOCHA_TESTS_DIR)) {
				// TODO Can we instead just do a git clean -fdx in it and then a git pull master?
				fs.removeSync(MOCHA_TESTS_DIR);
			}
			// clone the common test suite shallow
			// FIXME Determine the correct branch of the suite to clone like we do in the Jenkinsfile
			exec('git clone --depth 1 https://github.com/appcelerator/titanium-mobile-mocha-suite.git', { cwd: path.join(__dirname, '..') }, cb);
		},
		function (cb) {
			// Make sure it's dependencies are installed
			exec('npm install .', { cwd: path.join(MOCHA_TESTS_DIR, 'scripts') }, cb);
		},
		function (cb) {
			// Copy over the local overrides from tests folder
			fs.copy(LOCAL_TESTS, MOCHA_TESTS_DIR, cb);
		},
		function (cb) {
			// Load up the main script
			const tests = require(path.join(MOCHA_TESTS_DIR, 'scripts')); // eslint-disable-line security/detect-non-literal-require
			// Run the tests
			tests.test(zipfile, platforms, function (err, results) {
				if (err) {
					return cb(err);
				}

				// Spit out the results to the console
				async.eachSeries(platforms, function (platform, cb1) {
					console.log();
					console.log('=====================================');
					console.log(platform.toUpperCase());
					console.log('-------------------------------------');
					tests.outputResults(results[platform].results, cb1);
				}, cb);
			});
		}
	], next);
}

runTests(platforms, function (err) {
	if (err) {
		console.error(err.toString());
		process.exit(1);
		return;
	}

	process.exit(0);
});
