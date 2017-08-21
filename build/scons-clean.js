#!/usr/bin/env node
'use strict';

const async = require('async'),
	program = require('commander'),
	ALL_PLATFORMS = [ 'ios', 'android', 'windows' ];

program.parse(process.argv);

let platforms = program.args;
// if no platforms or single as 'full' use all platforms
if (!platforms.length || (platforms.length === 1 && platforms[0] === 'full')) {
	platforms = ALL_PLATFORMS;
}
// TODO Replace 'ipad' or 'iphone' with 'ios'

async.each(platforms, function (item, next) {
	const Platform = require('./' + item); // eslint-disable-line security/detect-non-literal-require
	new Platform(program).clean(next);
}, function (err) {
	if (err) {
		process.exit(1);
	}
	process.exit(0);
});
