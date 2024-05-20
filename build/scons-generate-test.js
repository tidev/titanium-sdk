#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import { main } from './lib/test/generator.js';

const { version } = fs.readJsonSync('../package.json');

program.version(version).parse(process.argv);

main(program.args)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
