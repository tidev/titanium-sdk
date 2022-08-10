/**
 * Generate unit test suite for a type from apidoc yml
 */
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const ejs = require('ejs');

const ROOT_DIR = path.join(__dirname, '../../..');
const APIDOC_DIR = path.join(ROOT_DIR, 'apidoc');
const TEST_TEMPLATE = path.join(__dirname, 'test.js.ejs');

/**
 * Given a parsed apidoc yml object for a type, generate a unit test suite
 * @param {object} apidoc parsed apidoc for a type
 * @returns {Promise<string>} filepath of the generated file
 */
async function generateTest(apidoc) {
	const lowercase = apidoc.name.toLowerCase().replace('titanium', 'ti');
	// FIXME: until we merge with type hierarchy, forcibly add apiName
	apidoc.properties = apidoc.properties || [];
	apidoc.properties.push({
		name: 'apiName',
		type: 'String',
		permission: 'read-only',
	});

	// Sort properties/constants by name alphabetically
	apidoc.properties.sort((a, b) => a.name.localeCompare(b.name));

	// divide normal properties from constants!
	const constants = [];
	const properties = [];
	for (const prop of apidoc.properties) {
		// expand out wildcard constant references to proper array!
		if (prop.constants && !Array.isArray(prop.constants) && prop.constants.endsWith('*')) {
			prop.constants = await expandWildcard(prop.constants);
		}
		const isReadOnly = prop.permission && prop.permission === 'read-only';
		const isConstant = isReadOnly && prop.name.toUpperCase() === prop.name;
		if (isConstant) {
			constants.push(prop);
		} else {
			properties.push(prop);
		}
	}
	apidoc.constants = constants;
	apidoc.properties = properties;

	if (apidoc.methods) {
		// Sort methods by name alphabetically
		apidoc.methods.sort((a, b) => a.name.localeCompare(b.name));
		// expand out wildcard constant references to proper array!
		for (const method of apidoc.methods) {
			if (method.returns && method.returns.constants && !Array.isArray(method.returns.constants) && method.returns.constants.endsWith('*')) {
				method.returns.constants = await expandWildcard(method.returns.constants);
			}
		}
	}
	const filename = path.join(ROOT_DIR, `tests/Resources/${lowercase}.test.js`);
	const template = await fs.readFile(TEST_TEMPLATE, 'utf8');
	const r = ejs.render(template, { apidoc }, { filename: TEST_TEMPLATE });
	await fs.writeFile(filename, r);
	return filename;
}

/**
 * Fetches an array of fully qualified constant names based on the given wildcard string.
 * @param {string} constants Wildcard string. Example: 'Ti.UI.ANIMATION_CURVE_*'
 * @returns {Promise<string[]>} Returns array of fully qualified constant names.
 */
async function expandWildcard(constants) {
	// split by '.', find owning type, gather constants
	const parts = constants.split('.');
	const wildcard = parts.pop().slice(0, -1); // drop '*'
	const owningType = parts.join('.');
	const expectedFileBasename = path.join(APIDOC_DIR, ...parts);
	let expectedFilePath = `${expectedFileBasename}.yml`;
	if (!(await fs.pathExists(expectedFilePath))) {
		expectedFilePath = `${expectedFileBasename}/${parts[parts.length - 1]}.yml`;
		if (!(await fs.pathExists(expectedFilePath))) {
			console.error(`Couldn't find yml file for owning type: ${owningType}`);
		}
	}
	const contents = await fs.readFile(expectedFilePath, 'utf8');
	const types = yaml.safeLoadAll(contents);
	for (const type of types) {
		if (type.name === owningType) {
			return type.properties.filter(prop => prop.name.startsWith(wildcard)).map(p => `${owningType}.${p.name}`);
		}
	}
	return [ constants ];
}

/**
 * Generate a unit test given an input apidoc yml file
 * @param {string[]} args program args
 */
async function main(args) {
	const fileName = args.shift();

	const filePath = path.resolve(process.cwd(), fileName);
	const contents = await fs.readFile(filePath, 'utf-8');

	// TODO: We need to check up the type hierarchy for properties/methods too!
	const docs = yaml.safeLoadAll(contents);

	const created = [];
	for (const doc of docs) {
		if (!doc.extends) {
			continue; // skip basic object types
		}
		created.push(await generateTest(doc));
	}
	console.log(`Created tests at: ${created}`);
}

module.exports = main;
