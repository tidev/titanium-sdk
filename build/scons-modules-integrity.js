#!/usr/bin/env node
'use strict';

const async = require('async');
const utils = require('./utils');
const fs = require('fs-extra');
const path = require('path');
const modulesPath = path.join(__dirname, '../support/module/packaged/modules.json');
const modules = require(modulesPath); // eslint-disable-line security/detect-non-literal-require

const platforms = Object.keys(modules);
async.map(platforms, (platform, platformNext) => {
	const platformModuleNames = Object.keys(modules[platform]);
	async.map(platformModuleNames, (modName, modNext) => {
		const modObj = modules[platform][modName];
		utils.generateSSRIHashFromURL(modObj.url, function (e, hash) {
			if (e) {
				return modNext(e);
			}
			const obj = {};
			modObj.integrity = hash;
			obj[modName] = modObj;
			modNext(null, obj);
		});
	}, (e, mods) => {
		if (e) {
			return platformNext(e);
		}
		// Merge the modules array into a single object
		const merged = Object.assign({}, ...mods);
		const platformObj = {};
		platformObj[platform] = merged;
		return platformNext(null, platformObj);
	});
}, (e, results) => {
	if (e) {
		console.error(e);
		process.exit(1);
	}
	// Merge the platforms array into a single object
	const merged = Object.assign({}, ...results);
	const formattedJSON = JSON.stringify(merged, null, '\t');

	console.log('\nUpdating modules.json ...');

	// Guard against user errors
	if (!fs.existsSync(modulesPath)) {
		console.error('The modules.json does not exist, aborting ...');
		return;
	}

	// Write updated modules.json to filesystem
	fs.writeFile(modulesPath, formattedJSON, err => {
		if (err) {
			console.error(`Could not update modules.json. Error: ${err}`);
			return;
		}

		console.log('Successfully updated modules.json!');
	});
});
