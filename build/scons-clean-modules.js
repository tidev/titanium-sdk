#!/usr/bin/env node
'use strict';

const program = require('commander');

program.parse(process.argv);

const { cleanupModules, sdkInstallDir } = require('./lib/utils');
const sdkRootDir = sdkInstallDir();
cleanupModules(sdkRootDir).then(() => process.exit(0))
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
