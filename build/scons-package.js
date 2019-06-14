#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;
program
	.option('-a, --all', 'Build a zipfile for every OS')
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --skip-zip', 'Do not zip up the package')
	.option('--no-docs', 'Do not produce docs')
	.parse(process.argv);

async function main(program) {
	const Builder = require('./lib/builder');
	const builder = new Builder(program);
	await builder.generateDocs();
	return builder.package();
}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
