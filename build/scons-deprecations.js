#!/usr/bin/env node
'use strict';

const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const fs = require('fs-extra');
const promisify = require('util').promisify;
const semver = require('semver');
const chalk = require('chalk');

/**
 * @param {object} thing type, property or method from docs
 * @param {string} thingPath full API path of the object we're checking
 */
async function checkDeprecatedButNotRemoved(thing, thingPath) {
	if (Object.prototype.hasOwnProperty.call(thing, 'deprecated')) {
		// Do stuff!
		if (!Object.prototype.hasOwnProperty.call(thing.deprecated, 'removed')) {
			return { path: thingPath, deprecated: thing.deprecated };
		}
	}
	return null;
}

async function checkMethod(m, methodOwner) {
	return checkDeprecatedButNotRemoved(m, `${methodOwner}#${m.name}()`);
}

async function checkProperty(p, propertyOwner) {
	return checkDeprecatedButNotRemoved(p, `${propertyOwner}.${p.name}`);
}

/**
 * @param {Object} t type definition from YAML
 * @return {Promise<object[]>} unremoved apis that are deprecated
 */
async function checkType(t) {
	const unremovedDeprecations = [];
	const typePossible = await checkDeprecatedButNotRemoved(t, t.name);
	if (typePossible) {
		unremovedDeprecations.push(typePossible);
	}
	const methods = await Promise.all((t.methods || []).map(m => checkMethod(m, t.name)));
	unremovedDeprecations.push(...methods.filter(m => m));
	const properties = await Promise.all((t.properties || []).map(p => checkProperty(p, t.name)));
	unremovedDeprecations.push(...properties.filter(p => p));
	// console.info(unremovedDeprecations);
	return unremovedDeprecations;
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
 * @param {string|object} deprecatedSince string or object holding deprecated since value from yml docs
 * @return {string}
 */
function pickFirstVersion(deprecatedSince) {
	if (typeof deprecatedSince !== 'string') {
		// deprecated.since may be an object with platform keys, version values!
		// Hack to just pick first value we can
		return Object.values(deprecatedSince)[0];
	}
	return deprecatedSince;
}

/**
 * @param {string} a first version strign to comparse
 * @param {string} b second version string to compare
 * @returns {1|0|-1}
 */
function compareVersions(a, b) {
	return semver.compare(a, b);
}

/**
 * @param {object} a first type/method/property doc definition to compare
 * @param {object} b second type/method/property doc definition to compare
 * @returns {1|0|-1}
 */
function compareUnremoved(a, b) {
	return compareVersions(pickFirstVersion(a.deprecated.since), pickFirstVersion(b.deprecated.since));
}

/**
 * @returns {object[]}
 */
async function main() {
	const apidocs = path.join(__dirname, '../apidoc');
	const files = await promisify(glob)(`${apidocs}/**/*.yml`);
	const arr = await Promise.all(files.map(f => checkFile(f)));
	const flattened = [].concat(...arr);
	// Sort by deprecated.since oldest to newest
	flattened.sort(compareUnremoved);
	return flattened;
}

main().then(results => {
	if (results && results.length !== 0) {
		results.forEach(f => {
			console.error(`${chalk.cyan(f.path)} has been deprecated since ${chalk.red(pickFirstVersion(f.deprecated.since))}, but is not yet removed!`);
		});
		return process.exit(1);
	}
	return process.exit(0);
}).catch(err => {
	console.error(err);
	process.exit(1);
});
