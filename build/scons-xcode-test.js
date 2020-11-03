#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const promisify = require('util').promisify;
// eslint-disable-next-line security/detect-child-process
const execFile = promisify(require('child_process').execFile);

const TEST_SUITE_DIR = path.join(__dirname, '..', 'tests');
const JS_DIR = path.join(TEST_SUITE_DIR, 'Resources');
const DEST = path.join(__dirname, '..', 'iphone', 'Resources');
const DEST_APP_JS = path.join(DEST, 'app.js');
const APP_PROPS_JSON = path.join(TEST_SUITE_DIR, 'scripts', 'mocha', 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', 'mocha.app', '_app_props_.json');

// Test files to skip
const TO_SKIP = [ 'es6.class.test', 'es6.import.test', 'ti.map.test', 'es6.async.await.test' ];

async function main() {
	await fs.copy(JS_DIR, DEST); // copy Resources from test suite to xcode project

	// remove some of the lines in app.js there to avoid requiring some test files (see TO_SKIP)
	const data = await fs.readFile(DEST_APP_JS);
	const content = data.toString().split(/\r?\n/).filter(line => {
		return !TO_SKIP.some(blah => line.includes(blah));
	});
	await fs.writeFile(DEST_APP_JS, content.join('\n'));

	// If we already have an _app_props_.json in the test suite generated project, copy that over
	if (await fs.pathExists(APP_PROPS_JSON)) {
		await fs.copy(APP_PROPS_JSON, path.join(DEST, '_app_props_.json'));
	}

	// TODO: We need to run npm install --production in DEST
	await execFile('npm', [ 'ci', '--production' ], { cwd: DEST });
}

main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
