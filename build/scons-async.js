#!/usr/bin/env node

import path from 'node:path';
import { glob } from 'glob';
import yaml from 'js-yaml';
import fs from 'fs-extra';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';

/**
 * @param {object} m method definition from yml apidocs
 * @param {string} methodOwner namespace of method parent
 * @returns {Promise<null|object>}
 */
async function checkMethod(m, methodOwner) {
	if (m.deprecated && m.deprecated.removed) { // skip removed methods
		return null;
	}
	const args = m.parameters;
	if (!args) {
		return null;
	}
	const lastArg = args[args.length - 1];
	if (lastArg && typeof lastArg.type === 'string' && lastArg.type.startsWith('Callback')) {
		// last arg is a callback, assuem it's async!
		const methodName = `${methodOwner}#${m.name}()`;
		if (m.returns && m.returns.type && m.returns.type.startsWith('Promise')) {
			// already returns a promise
			console.log(`${chalk.cyan(methodName)} already returns a Promise!`);
		} else {
			console.warn(`${chalk.red(methodName)} should be modified to return a Promise!`);
		}
	}
	return null;
}

/**
 * @param {Object} t type definition from YAML
 * @return {Promise<object[]>} unremoved apis that are deprecated
 */
async function checkType(t) {
	const unremovedDeprecations = [];
	if (t.deprecated && t.deprecated.removed) { // skip removed types
		return unremovedDeprecations;
	}
	// gives us object[]
	const methods = await Promise.all((t.methods || []).map(m => checkMethod(m, t.name)));
	unremovedDeprecations.push(...methods.filter(m => m));
	return unremovedDeprecations.filter(e => e && e.length !== 0);
}

/**
 * @param {string} file filepath of a yml doc file to check
 * @returns {Promise<object[]>}
 */
async function checkFile(file) {
	const contents = await fs.readFile(file, 'utf8');
	// remove comments
	contents.replace(/\w*#.*/, '');
	const doc = await yaml.safeLoadAll(contents);
	const types = Array.isArray(doc) ? doc : [ doc ];
	// go through the types in the document, for each one, check top-level for deprecated
	// then check each property, event, method
	const arr = await Promise.all(types.map(t => checkType(t)));
	const flattened = [].concat(...arr);
	return flattened;
}

/**
 * @returns {object[]}
 */
async function main() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const apidocs = path.join(__dirname, '../apidoc');
	const files = await glob(`${apidocs}/**/*.yml`);
	const arr = await Promise.all(files.map(f => checkFile(f)));
	const flattened = [].concat(...arr);
	return flattened;
}

main().then(results => {
	if (results && results.length !== 0) {
		return process.exit(1);
	}
	return process.exit(0);
}).catch(err => {
	console.error(err);
	process.exit(1);
});
