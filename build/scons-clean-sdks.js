#!/usr/bin/env node
'use strict';

const program = require('commander');

program.parse(process.argv);

const { cleanNonGaSDKs } = require('./lib/utils');
cleanNonGaSDKs().then(() => process.exit(0))
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
