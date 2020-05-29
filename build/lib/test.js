'use strict';

const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const MOCHA_TESTS_DIR = path.join(ROOT_DIR, 'titanium-mobile-mocha-suite');
const LOCAL_TESTS = path.join(ROOT_DIR, 'tests');

/**
 * Wipes and re-clones the mocha common test suite, then runs our unit testing script for the
 * SDK zipfile in dist against the supplied platforms.
 *
 * @param {string} zipfile path to SDK zipfile
 * @param {string[]} platforms array of platform names for which we should run tests
 * @param {object} program object holding options/switches from CLI
 * @param {string} program.branch i.e. 'master'
 * @returns {Promise<object>} returns an object whose keys are platform names
 */
async function runTests(zipfile, platforms, program) {
	if (await fs.exists(MOCHA_TESTS_DIR)) {
		// If we have a clone of the tests locally, delete it
		await fs.remove(MOCHA_TESTS_DIR);
	}
	// clone the common test suite shallow
	// FIXME Determine the correct branch of the suite to clone like we do in the Jenkinsfile
	await exec('git clone --depth 1 https://github.com/appcelerator/titanium-mobile-mocha-suite.git -b ' + program.branch, { cwd: ROOT_DIR });

	// install dependencies of suite scripts
	await exec('npm ci', { cwd: MOCHA_TESTS_DIR });

	// if we have a package.json in our test overrides, run npm install there first
	if (await fs.exists(path.join(LOCAL_TESTS, 'Resources/package.json'))) {
		await exec('npm install --production', { cwd: path.join(LOCAL_TESTS, 'Resources') });
	}

	// Copy over the local overrides from tests folder
	await fs.copy(LOCAL_TESTS, MOCHA_TESTS_DIR);

	// Load up the main script
	const tests = require(MOCHA_TESTS_DIR); // eslint-disable-line security/detect-non-literal-require
	const test = promisify(tests.test);

	// Run the tests
	const cleanup = undefined;
	const architecture = undefined;
	return test(zipfile, platforms, program.target, program.deviceId, program.skipSdkInstall, cleanup, architecture, program.deployType, program.deviceFamily, path.join(LOCAL_TESTS, 'Resources'));
}

async function outputResults(results) {
	const tests = require(MOCHA_TESTS_DIR); // eslint-disable-line security/detect-non-literal-require
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
