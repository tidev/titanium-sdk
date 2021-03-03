#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;
program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --symlink', 'If possible, symlink the SDK folder to destination rather than copying')
	.option('--select', 'Select the installed SDK')
	.parse(process.argv);

async function main(program) {
	const Builder = require('./lib/builder');
	const builder = new Builder(program);
	return builder.install(program.args[0]);
}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
