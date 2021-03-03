#!/usr/bin/env node
'use strict';

const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');
const fs = require('fs-extra');
const promisify = require('util').promisify;
const semver = require('semver');
const chalk = require('chalk');

// TODO: Extract common code for parsing and visiting all yml apidocs
// The code between this and removals is nearly identical

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

/**
 * @param {object} m method definition from yml apidocs
 * @param {string} methodOwner namespace of method parent
 * @returns {Promise<null|object>}
 */
async function checkMethod(m, methodOwner) {
	return checkDeprecatedButNotRemoved(m, `${methodOwner}#${m.name}()`);
}

/**
 * @param {object} p property definition from yml apidocs
 * @param {string} propertyOwner namespace of property parent
 * @returns {Promise<null|object>}
 */
async function checkProperty(p, propertyOwner) {
	return checkDeprecatedButNotRemoved(p, `${propertyOwner}.${p.name}`);
}

/**
 * @param {object} e event definition from yml apidocs
 * @param {string} eventOwner namespace of event parent
 * @returns {Promise<object[]>}
 */
async function checkEvent(e, eventOwner) {
	const results = [];
	const namespace = `${eventOwner}.${e.name}`; // TODO: Use lightning bolt to denote events?
	const typePossible = await checkDeprecatedButNotRemoved(e, namespace);
	if (typePossible) {
		results.push(typePossible);
	}
	const properties = await Promise.all((e.properties || []).map(p => checkProperty(p, namespace)));
	results.push(...properties.filter(p => p));
	return results;
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
	// gives us object[]
	const methods = await Promise.all((t.methods || []).map(m => checkMethod(m, t.name)));
	unremovedDeprecations.push(...methods.filter(m => m));
	// gives us object[]
	const properties = await Promise.all((t.properties || []).map(p => checkProperty(p, t.name)));
	unremovedDeprecations.push(...properties.filter(p => p));
	// gives us an array of arrays
	const events = await Promise.all((t.events || []).map(e => checkEvent(e, t.name)));
	// flatten to single object[]
	const flattenedEvents = [].concat(...events);
	unremovedDeprecations.push(...flattenedEvents);
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
