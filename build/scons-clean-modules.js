#!/usr/bin/env node

import { program } from 'commander';
import { cleanupModules, sdkInstallDir } from './lib/utils.js';

program.parse(process.argv);

const sdkRootDir = sdkInstallDir();
cleanupModules(sdkRootDir).then(() => process.exit(0))
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
