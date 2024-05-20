#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import { Builder } from './lib/builder.js';

const { version } = fs.readJsonSync('../package.json');

program.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('-a, --all', 'Clean every OS/platform')
	.parse(process.argv);

new Builder(program.opts(), program.args).clean()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		return process.exit(1);
	});
