#!/usr/bin/env node
/**
 * generates an _index_.json file for use when running Titanium under xcode
 */
'use strict';

const fs = require('fs-extra');
const path = require('path');

const dirToTraverse = process.argv[2];
// gather all the js/json files under this dir and generate an index.json file in it

const index = {};
const destFile = path.join(dirToTraverse, '_index_.json');

(function walk(dir) {
	fs.readdirSync(dir).forEach(function (filename) {
		var file = path.join(dir, filename);
		if (fs.existsSync(file)) {
			if (fs.statSync(file).isDirectory()) {
				walk(file);
			} else if (/\.js(on)?$/.test(filename)) {
				index[file.replace(/\\/g, '/').replace(dirToTraverse + '/', 'Resources/')] = 1;
			}
		}
	});
}(dirToTraverse));

fs.existsSync(destFile) && fs.unlinkSync(destFile);
fs.writeFileSync(destFile, JSON.stringify(index));
