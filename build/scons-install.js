#!/usr/bin/env node
'use strict';

const program = require('commander');
const version = require('../package.json').version;
const utils = require('./utils');

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-s, --symlink', 'If possible, symlink the SDK folder to destination rather than copying')
	.parse(process.argv);

const versionTag = program.versionTag || program.sdkVersion;
utils.installSDK(versionTag, program.symlink)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
