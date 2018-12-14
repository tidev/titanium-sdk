#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');

// TODO Copy files from titanium-mobile-mocha-suite/Resources?
const TEST_SUITE_DIR = path.join(__dirname, '..', 'titanium-mobile-mocha-suite');
const JS_DIR = path.join(TEST_SUITE_DIR, 'Resources');
const DEST = path.join(__dirname, '..', 'iphone', 'Resources');
const DEST_APP_JS = path.join(DEST, 'app.js');
const APP_PROPS_JSON = path.join(TEST_SUITE_DIR, 'scripts', 'mocha', 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', 'mocha.app', '_app_props_.json');

// Test files to skip
const TO_SKIP = [ 'es6.class.test', 'es6.import.test', 'ti.map.test' ];

fs.copy(JS_DIR, DEST)
	.then(() => fs.readFile(DEST_APP_JS))
	.then(data => {
		const content = data.toString().split(/\r?\n/).filter(line => {
			return !TO_SKIP.some(blah => line.includes(blah));
		});
		return fs.writeFile(DEST_APP_JS, content.join('\n'));
	})
	.then(() => fs.pathExists(APP_PROPS_JSON))
	.then(exists => {
		if (exists) {
			fs.copySync(APP_PROPS_JSON, path.join(DEST, '_app_props_.json'));
		}
	})
	.catch(err => {
		console.error(err);
	});
