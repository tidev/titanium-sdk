#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

/**
 *
 * @param {commander.CommanderStatic} program command program
 */
async function main(program) {
	const args = program.args;
	let filePath;
	if (args.length > 0) {
		filePath = path.resolve(process.cwd(), args.shift());
	} else {
		filePath = path.join(__dirname, '../apidoc');
	}
	const typeNames = await readDir(filePath);
	const TEST_DIR = path.join(__dirname, '../tests/Resources');

	// Simple check to see if there's a test whose filename matches expectations
	const errors = [];
	for (const typeName of typeNames) {
		const lowercase = typeName.toLowerCase().replace('titanium', 'ti');
		const basename = `${lowercase}.test.js`;
		const filename = path.join(TEST_DIR, basename);
		if (!(await fs.pathExists(filename))) {
			errors.push(`No tests for ${typeName}, expected ${filename} to exist`);
		}
	}
	if (errors.length > 0) {
		throw new Error(errors.join('\n'));
	}
}

/**
 *
 * @param {string} dirPath filepath to directory holding yml apidocs
 * @returns {Promise<Set<string>>}
 */
async function readDir(dirPath) {
	const listing = await fs.readdir(dirPath, { withFileTypes: true });
	const typeNames = new Set();
	for (const entry of listing) {
		const thePath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			// recurse
			const subset = await readDir(thePath);
			subset.forEach(typeNames.add, typeNames); // merge up
		} else if (entry.name.endsWith('.yml')) {
			const subset = await getTypeName(thePath);
			subset.forEach(typeNames.add, typeNames); // merge up
		}
	}
	return typeNames;
}

/**
 * @param {string} ymlPath filepath to apidoc yml file
 * @returns {Promise<Set<string>>}
 */
async function getTypeName(ymlPath) {
	const typeNames = [];
	const docs = yaml.safeLoadAll(await fs.readFile(ymlPath, 'utf8'));
	for (const doc of docs) {
		if (!doc.extends || !doc.extends.startsWith('Titanium.')) {
			continue; // skip basic object types
		}
		typeNames.push(doc.name);
	}
	return typeNames;
}

const program = require('commander');
const version = require('../package.json').version;
program.version(version).parse(process.argv);
main(program)
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
