#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const program = require('commander');
program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('-n, --android-ndk [path]', 'Explicitly set the path to the Android NDK used for building')
	.option('--no-docs', 'Do not produce docs')
	.option('-a, --all', 'Build a zipfile for every OS')
	// .option('-s, --skip-zip', 'Do not zip up the package') // does this option make sense?
	.parse(process.argv);

async function main(program) {
	const Builder = require('./lib/builder');
	const builder = new Builder(program);
	await builder.clean();
	await builder.build();
	await builder.generateDocs();
	await builder.package();
	await builder.install();
}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
