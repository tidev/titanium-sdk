#!/usr/bin/env node
'use strict';

const clean = require('./lib/clean');

const program = require('commander');
const ALL_PLATFORMS = [ 'ios', 'android', 'windows' ];

program.parse(process.argv);

let platforms = program.args;
// if no platforms or single as 'full' use all platforms
if (!platforms.length || (platforms.length === 1 && platforms[0] === 'full')) {
	platforms = ALL_PLATFORMS;
}
// TODO Replace 'ipad' or 'iphone' with 'ios'

clean(platforms)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		return process.exit(1);
	});
