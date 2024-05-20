#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import { Builder } from './lib/builder.js';

const { version } = fs.readJsonSync('../package.json');

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('-a, --all', 'Build a ti.main.js file for every target OS')
	.parse(process.argv);

new Builder(program.opts(), program.args).build()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		return process.exit(1);
	});
