#!/usr/bin/env node
'use strict';

const program = require('commander');
const utils = require('./lib/utils');

program.parse(process.argv);

const urls = program.args;
if (urls.length <= 0) {
	console.log('Please provide one or more URLs as arguments to this command to generate SSRI "integrity" values for.');
	process.exit(1);
}

async function main(urls) {
	console.log(urls);
	for (const url of urls) {
		const hash = await utils.generateSSRIHashFromURL(url);
		console.log(JSON.stringify({
			url: url,
			integrity: hash.toString()
		}));
	}
}

main(urls)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
