#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import { main } from './lib/test/generator.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const { version } = fs.readJsonSync(path.join(__dirname, '../package.json'));

program.version(version).parse(process.argv);

main(program.args)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
