#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;
program
	.option('-C, --device-id [id]', 'Titanium device id to run the unit tests on. Only valid when there is a target provided')
	.option('-T, --target [target]', 'Titanium platform target to run the unit tests on. Only valid when there is a single platform provided')
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-D, --deploy-type <type>', 'Override the deploy type used to build the project', /^(development|test)$/)
	.option('-F, --device-family <value>', 'Override the device family used to build the project', /^(iphone|ipad)$/)
	.parse(process.argv);

async function main(program) {
	const Builder = require('./lib/builder');
	return new Builder(program).test();
}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
