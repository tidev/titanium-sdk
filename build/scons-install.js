#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import { Builder } from './lib/builder.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const { version } = fs.readJsonSync(path.join(__dirname, '../package.json'));

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --symlink', 'If possible, symlink the SDK folder to destination rather than copying')
	.option('--select', 'Select the installed SDK')
	.parse(process.argv);

async function main(program) {
	const builder = new Builder(program.opts(), program.args);
	return builder.install(program.args[0]);
}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
