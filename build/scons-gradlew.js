#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const program = require('commander');

const argsIndex = process.argv.indexOf('--args');
const mainArgs = (argsIndex >= 0) ? process.argv.slice(0, argsIndex) : process.argv;
const gradlewArgs = (argsIndex >= 0) ? process.argv.slice(argsIndex + 1) : null;

program
	.arguments('<task>')
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('--args [arguments...]', 'Arguments to be passed to gradlew tool (Must be set last)')
	.action((task, options, _command) => {
		const AndroidBuilder = require('./lib/android');
		new AndroidBuilder(options).runGradleTask(task, gradlewArgs)
			.then(() => process.exit(0))
			.catch(err => {
				console.error(err);
				return process.exit(1);
			});
	})
	.parse(mainArgs);
