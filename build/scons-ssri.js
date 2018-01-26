#!/usr/bin/env node
'use strict';

const async = require('async'),
	program = require('commander'),
	utils = require('./utils');

program.parse(process.argv);

let urls = program.args;
if (urls.length <= 0) {
	console.log('Please provide one or more URLs as arguments to this command to generate SSRI "integrity" values for.');
	process.exit(1);
}
console.log(urls);
async.each(urls, function (url, next) {
	utils.generateSSRIHashFromURL(url, function (e, hash) {
		if (e) {
			return next(e);
		}
		const obj = {
			url: url,
			integrity: hash
		};
		console.log(JSON.stringify(obj));
		return next(null, hash);
	});
}, function (err) {
	if (err) {
		process.exit(1);
	}
	process.exit(0);
});
