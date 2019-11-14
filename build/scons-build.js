#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('-n, --android-ndk [path]', 'Explicitly set the path to the Android NDK used for building')
	.option('-a, --all', 'Build a ti.main.js file for every target OS')
	.parse(process.argv);

const Builder = require('./lib/builder');
new Builder(program).build()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		return process.exit(1);
	});
