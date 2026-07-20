#!/usr/bin/env node

import { program } from 'commander';
import { cleanNonGaSDKs } from './lib/utils.js';

program.parse(process.argv);

cleanNonGaSDKs().then(() => process.exit(0))
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
