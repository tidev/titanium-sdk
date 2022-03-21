#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const program = require('commander');
program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building')
	.option('--no-docs', 'Do not produce docs')
	.option('--symlink', 'If possible, symlink the SDK folder to destination rather than copying')
	.option('-a, --all', 'Build a zipfile for every OS')
	.option('-z, --skip-zip', 'Do not zip up the package, leaving folder contents under dist (typically used for local development)')
	.parse(process.argv);

async function main(program) {
	const Builder = require('./lib/builder');
	const builder = new Builder(program.opts(), program.args);
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
