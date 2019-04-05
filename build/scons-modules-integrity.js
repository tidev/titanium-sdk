#!/usr/bin/env node
'use strict';

const utils = require('./lib/utils');
const fs = require('fs-extra');
const path = require('path');
const modulesPath = path.join(__dirname, '../support/module/packaged/modules.json');

/**
 * Re-generates a new integrity value for a given module's url property
 * @param {object} modObj the module object from modules.json
 * @param {string} modName the name of the module
 * @returns {Promise<object>}
 */
async function handleModule(modObj, modName) {
	const hash = await utils.generateSSRIHashFromURL(modObj.url);
	const obj = {};
	modObj.integrity = hash.toString();
	obj[modName] = modObj;
	return obj;
}

/**
 * @param {object} modules module.json as an object
 * @param {string} platform the platform whose modules we will re-calculate integraity hashes for
 * @returns {Promise<object>}
 */
async function handlePlatform(modules, platform) {
	const platformModuleNames = Object.keys(modules[platform]);
	// for each entry in platformModuleNames, handleModule
	const modifiedModules = await Promise.all(platformModuleNames.map(modName => {
		const modObj = modules[platform][modName];
		return handleModule(modObj, modName);
	}));

	// Merge the modules array into a single object
	const merged = Object.assign({}, ...modifiedModules);
	const platformObj = {};
	platformObj[platform] = merged;
	return platformObj;
}

async function main() {
	// Guard against user errors
	if (!await fs.exists(modulesPath)) {
		throw new Error('The modules.json does not exist, aborting ...');
	}

	const modules = require(modulesPath); // eslint-disable-line security/detect-non-literal-require

	const platforms = Object.keys(modules);
	const results = await Promise.all(platforms.map(p => handlePlatform(modules, p)));
	// Merge the platforms array into a single object
	const merged = Object.assign({}, ...results);
	const formattedJSON = JSON.stringify(merged, null, '\t');

	console.log('\nUpdating modules.json ...');

	// Write updated modules.json to filesystem
	await fs.writeFile(modulesPath, formattedJSON);
	console.log('Successfully updated modules.json!');
}

main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
