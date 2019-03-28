#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');

const TEST_SUITE_DIR = path.join(__dirname, '..', 'titanium-mobile-mocha-suite');
const JS_DIR = path.join(TEST_SUITE_DIR, 'Resources');
const DEST = path.join(__dirname, '..', 'iphone', 'Resources');
const DEST_APP_JS = path.join(DEST, 'app.js');
const APP_PROPS_JSON = path.join(TEST_SUITE_DIR, 'scripts', 'mocha', 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', 'mocha.app', '_app_props_.json');

// Test files to skip
const TO_SKIP = [ 'es6.class.test', 'es6.import.test', 'ti.map.test' ];

async function main() {
	await fs.copy(JS_DIR, DEST);
	const data = await fs.readFile(DEST_APP_JS);

	const content = data.toString().split(/\r?\n/).filter(line => {
		return !TO_SKIP.some(blah => line.includes(blah));
	});
	await fs.writeFile(DEST_APP_JS, content.join('\n'));
	if (await fs.pathExists(APP_PROPS_JSON)) {
		await fs.copy(APP_PROPS_JSON, path.join(DEST, '_app_props_.json'));
	}
}

main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
