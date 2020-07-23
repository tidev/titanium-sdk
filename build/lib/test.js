'use strict';

const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const LOCAL_TESTS = path.join(ROOT_DIR, 'tests');
const tests = require(path.join(LOCAL_TESTS, 'scripts/test')); // eslint-disable-line security/detect-non-literal-require

/**
 * Wipes and re-clones the mocha common test suite, then runs our unit testing script for the
 * SDK zipfile in dist against the supplied platforms.
 *
 * @param {string} zipfile path to SDK zipfile
 * @param {string[]} platforms array of platform names for which we should run tests
 * @param {object} program object holding options/switches from CLI
 * @returns {Promise<object>} returns an object whose keys are platform names
 */
async function runTests(zipfile, platforms, program) {
	// if we have a package.json in our test overrides, run npm install there first
	if (await fs.exists(path.join(LOCAL_TESTS, 'Resources/package.json'))) {
		await exec('npm ci --production', { cwd: path.join(LOCAL_TESTS, 'Resources') });
	}

	// Load up the main script
	const test = promisify(tests.test);

	// Run the tests
	const cleanup = undefined;
	const architecture = undefined;
	return test(zipfile, platforms, program.target, program.deviceId, program.skipSdkInstall, cleanup, architecture, program.deployType, program.deviceFamily, path.join(LOCAL_TESTS, 'Resources'));
}

async function outputResults(results) {
	const output = promisify(tests.outputResults);
	const platforms = Object.keys(results);
	for (const p of platforms) {
		console.log();
		console.log('=====================================');
		console.log(p.toUpperCase());
		console.log('-------------------------------------');
		await output(results[p].results);
	}
}

module.exports = { runTests, outputResults };
