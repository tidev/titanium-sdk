#!/usr/bin/env node

var exec = require('child_process').exec,
	os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	fs = require('fs-extra'),
	version = require('../package.json').version,
	platforms = [],
	osName = os.platform(),
	zipfile,
	ALL_PLATFORMS = ['ios', 'android'],
	MOCHA_TESTS_DIR = path.join(__dirname, '..', 'titanium-mobile-mocha-suite'),
	DIST_DIR = path.join(__dirname, '..', 'dist'),
	LOCAL_TESTS = path.join(__dirname, '..', 'tests');

program.parse(process.argv);

platforms = program.args;

if (!platforms.length) {
	// assume all!
	platforms = ['full'];
}

// expand 'full' to every platform
if (platforms.length === 1 && platforms[0] == 'full') {
	platforms = ['ios', 'android'];
}

// FIXME Assume the zipfile is just uisng the base SDK version and not a version tag
if (osName === 'darwin') {
	osName = 'osx';
}
zipfile = path.join(DIST_DIR, 'mobilesdk-' + version + '-' + osName + '.zip');
if (!fs.existsSync(zipfile)) {
	console.error("Could not find zipped SDK in dist dir: " + zipfile +". Please run node scons.js cleanbuild first.");
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
			var tests = require(path.join(MOCHA_TESTS_DIR, 'scripts'));
			// Run the tests
			tests.test(zipfile, platforms, function(err, results) {
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
