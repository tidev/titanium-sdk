#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');

let topTiModule = path.join(__dirname, '..', 'iphone/TitaniumKit/TitaniumKit/Sources/API/TopTiModule.m');
if (process.argv.length >= 3) {
	topTiModule = process.argv[2];
}

fs.readFile(topTiModule, 'utf8')
	.then(contents => { // eslint-disable-line promise/always-return
		const placeholders = [ '__VERSION__', '__TIMESTAMP__', '__GITHASH__' ];
		placeholders.forEach(p => {
			if (!contents.includes(p)) {
				console.error(`Placeholder string '${p}' missing from TopTiModule.m`);
				process.exit(1);
			}
		});

		process.exit(0);
	})
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
