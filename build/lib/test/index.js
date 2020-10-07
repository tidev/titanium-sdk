'use strict';

const path = require('path');

const ROOT_DIR = path.join(__dirname, '../../..');
const LOCAL_TESTS = path.join(ROOT_DIR, 'tests');
const { test, outputResults } = require('./test');

/**
 * Runs our unit testing script against the supplied platforms for the currently select SDK in `ti` cli.
 *
 * @param {string[]} platforms array of platform names for which we should run tests
 * @param {object} program object holding options/switches from CLI
 * @param {string} [program.target] 'emulator' || 'simulator' || 'device'
 * @param {string} [program.deviceId] Titanium device id target to run the tests on
 * @param {string} [program.deployType] 'development' || 'test'
 * @param {string} [program.deviceFamily] 'ipad' || 'iphone'
 * @returns {Promise<object>} returns an object whose keys are platform names
 */
async function runTests(platforms, program) {
	return test(platforms, program.target, program.deviceId, program.deployType, program.deviceFamily, path.join(LOCAL_TESTS, 'Resources'));
}

/**
 * @param {object} results
 * @returns {Promise<void>}
 */
async function outputMultipleResults(results) {
	const platforms = Object.keys(results);
	for (const p of platforms) {
		console.log();
		console.log('=====================================');
		console.log(p.toUpperCase());
		console.log('-------------------------------------');
		await outputResults(results[p].results);
	}
}

module.exports = { runTests, outputMultipleResults };
