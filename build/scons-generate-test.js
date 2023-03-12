#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;
program.version(version).parse(process.argv);

const main = require('./lib/test/generator');
main(program.args)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
