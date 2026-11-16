#!/usr/bin/env node

import { generateSSRIHashFromURL } from './lib/utils.js';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesPath = path.join(__dirname, '../support/module/packaged/modules.json');

/**
 * Re-generates a new integrity value for a given module's url property
 * @param {object} moduleObject the module object from modules.json
 * @param {string} moduleName the name of the module
 * @returns {Promise<object>}
 */
async function handleModule(moduleObject, moduleName) {
	const hash = await generateSSRIHashFromURL(moduleObject.url);
	// eslint-disable-next-line require-atomic-updates
	moduleObject.integrity = hash.toString();
	return {
		[moduleName]: moduleObject
	};
}

/**
 * @param {object} modules module.json as an object
 * @param {string} platform the platform whose modules we will re-calculate integraity hashes for
 * @returns {Promise<object>}
 */
async function handlePlatform(modules, platform) {
	const moduleNames = Object.keys(modules[platform]);

	let updatedModules = await Promise.all(moduleNames.map(name => handleModule(modules[platform][name], name)));

	// Merge the modules array into a single object
	return {
		[platform]: Object.assign({}, ...updatedModules)
	};
}

async function main() {
	// Guard against user errors
	if (!await fs.exists(modulesPath)) {
		throw new Error('The modules.json does not exist, aborting ...');
	}

	const modules = fs.readJsonSync(modulesPath);
	const platforms = Object.keys(modules);

	console.log('Attempting to download...');

	let results = await Promise.all(platforms.map(platform => handlePlatform(modules, platform)));

	console.log('\nUpdating modules.json ...');

	// Write updated modules.json to filesystem
	await fs.writeJson(modulesPath, Object.assign({}, ...results), { spaces: '\t' });
	console.log('Successfully updated modules.json!');
}

main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
