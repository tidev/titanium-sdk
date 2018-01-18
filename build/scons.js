#!/usr/bin/env node
'use strict';

const commander = require('commander'),
	version = require('../package.json').version;

commander
	.version(version)
	.command('clean [platforms]', 'clean up build directories for one or more platforms')
	.command('cleanbuild [platforms]', 'clean, build, package and install locally')
	.command('install', 'install the built SDK')
	.command('package [platforms]', 'package one or more platforms')
	.command('build [platforms]', 'build one or more platforms')
	.command('test [platforms]', 'Runs our unit tests')
	.command('update-node-deps', 'deletes and reinstalls node dependencies')
	.parse(process.argv);
