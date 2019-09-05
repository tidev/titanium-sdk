/**
 * Script to validate the syntax of the YAML files against the TDoc spec
 * https://wiki.appcelerator.org/display/guides2/TDoc+Specification
 *
 * Execute `node validate.js --help` for usage
 *
 * Dependencies: colors ~0.6.2 and node-appc ~0.2.14
 */
'use strict';

const fs = require('fs'),
	nodeappc = require('node-appc'),
	colors = require('colors'), // eslint-disable-line no-unused-vars
	common = require('./lib/common.js');

let doc = {},
	errorCount = 0,
	standaloneFlag = false;

// Constants that are valid, but are windows specific, so would fail validation
const WINDOWS_CONSTANTS = [
	'Titanium.UI.Windows.ListViewScrollPosition.*'
];

const Examples = [ {
	required: {
		title: 'String',
		example: 'Markdown'
	}
} ];

const Deprecated = {
	required: {
		since: 'Since'
	},
	optional: {
		removed: 'String',
		notes: 'String'
	}
};

const validSyntax = {
	required: {
		name: 'String',
		summary: 'String',
	},
	optional: {
		description: 'Markdown',
		createable: 'Boolean',
		platforms: [ common.VALID_PLATFORMS ],
		'exclude-platforms': [ common.VALID_PLATFORMS ],
		excludes: {
			optional: {
				events: 'Array<events.name>',
				methods: 'Array<methods.name>',
				properties: 'Array<properties.name>'
			}
		},
		examples: Examples,
		osver: 'OSVersions',
		extends: 'Class',
		deprecated: Deprecated,
		since: 'Since',
		events: [ {
			required: {
				name: 'String',
				summary: 'String',
			},
			optional: {
				description: 'String',
				platforms: [ common.VALID_PLATFORMS ],
				since: 'Since',
				deprecated: Deprecated,
				osver: 'OSVersions',
				properties: [ {
					required: {
						name: 'String',
						summary: 'String',
					},
					optional: {
						type: 'DataType',
						platforms: [ common.VALID_PLATFORMS ],
						deprecated: Deprecated,
						since: 'Since',
						'exclude-platforms': [ common.VALID_PLATFORMS ],
						constants: 'Constants'
					}
				} ],
				'exclude-platforms': [ common.VALID_PLATFORMS ],
				notes: 'Invalid'
			}
		} ],
		methods: [ {
			required: {
				name: 'String',
				summary: 'String'
			},
			optional: {
				description: 'String',
				returns: 'Returns', // FIXME Validate 'Returns' has a required 'type' String property
				platforms: [ common.VALID_PLATFORMS ],
				since: 'Since',
				deprecated: Deprecated,
				examples: Examples,
				osver: 'OSVersions',
				parameters: [ {
					required: {
						name: 'String',
						summary: 'String',
						type: 'DataType'
					},
					optional: {
						optional: 'Boolean',
						default: 'Default',
						repeatable: 'Boolean',
						constants: 'Constants',
						notes: 'Invalid'
					}
				} ],
				'exclude-platforms': [ common.VALID_PLATFORMS ],
				notes: 'Invalid'
			}
		} ],
		properties: [ {
			required: {
				name: 'String',
				summary: 'String',
				type: 'DataType'
			},
			optional: {
				description: 'String',
				platforms: [ common.VALID_PLATFORMS ],
				since: 'Since',
				deprecated: Deprecated,
				osver: 'OSVersions',
				examples: Examples,
				permission: [ 'read-only', 'write-only', 'read-write' ], // FIXME Enforce permission must be set to 'read-only' if name of property is all caps: [A-Z]+[A-Z_]*
				availability: [ 'always', 'creation', 'not-creation' ],
				accessors: 'Boolean',
				optional: 'Boolean',
				value: 'Primitive',
				default: 'Default',
				'exclude-platforms': [ common.VALID_PLATFORMS ],
				constants: 'Constants',
				notes: 'Invalid'
			}
		} ]
	}
};

/**
 * Validate if an API exists in a class and its ancestors
 * @param {Array<String>} obj Array of API names to verify
 * @param {string} type API type ('event', 'methods' or 'properties')
 * @param {string} className Name of class to check
 * @returns {string} Error with unverified API names or null if no errors
 */
function validateAPINames(obj, type, className) {
	const apis = doc[className][type];
	if (apis) {
		apis.forEach(function (api) {
			const index = obj.indexOf(api.name);
			if (~index) {
				obj.splice(index);
			}
		});
	}
	if (type === 'methods' && 'properties' in doc[className]) {
		// Evaluate setters and getters
		doc[className].properties.forEach(function (property) {
			const basename = property.name.charAt(0).toUpperCase() + property.name.slice(1),
				setter = 'set' + basename,
				getter = 'get' + basename;
			let index = obj.indexOf(setter);
			if (~index) {
				obj.splice(index);
			}
			index = obj.indexOf(getter);
			if (~index) {
				obj.splice(index);
			}
		});
	}
	if ('extends' in doc[className]) {
		// Evaluate parent class
		const parent = doc[className]['extends'];
		if (parent in doc) {
			return validateAPINames(obj, type, parent);
		}

		if (standaloneFlag) {
			console.warn('WARNING! Cannot validate parent class: %s'.yellow, parent);
			return;
		}

		return 'Invalid parent class: ' + parent;
	}
	if (obj.length > 0) {
		return 'Could not find: ' + obj;
	}
}

/**
 * Validate boolean type
 * @param {Object} bool possible boolean value
 * @return {string} error string if not a boolean
 */
function validateBoolean(bool) {
	if (typeof bool !== 'boolean') {
		return 'Not a boolean value: ' + bool;
	}
}

/**
 * Validate class is in docs
 * @param {string} cls class name
 * @returns {string} error string if not found in docs
 */
function validateClass(cls) {
	if (!(cls in doc)) {
		return 'Not a valid class: ' + cls;
	}
}

/**
 * Validate constant is in docs
 * @param {Array|string} constants arry or string of constant names
 * @returns {Array<string>} array of error strings if any given constants weren't found in the docs
 */
function validateConstants(constants) {
	let errors = [];
	if (Array.isArray(constants)) {
		constants.forEach(function (constant) {
			errors = errors.concat(validateConstants(constant));
		});
	} else {
		// skip windows constants that are OK, but would be marked invalid
		if (WINDOWS_CONSTANTS.includes(constants)) {
			return errors;
		}
		let prop = constants.split('.').pop();
		const cls = constants.substring(0, constants.lastIndexOf('.'));
		if (!(cls in doc) || !('properties' in doc[cls]) || doc[cls] === null) {
			errors.push('Invalid constant: ' + constants);
		} else {
			const properties = doc[cls].properties;
			if (prop.charAt(prop.length - 1) === '*') {
				prop = prop.substring(0, prop.length - 1);
			}
			for (let i = 0; i < properties.length; i++) {
				if (properties[i].name.indexOf(prop) === 0) {
					return errors;
				}
			}
			errors.push('Invalid constant: ' + constants);
		}
	}
	return errors;
}

/**
 * Validate type
 * @param {string|string[]} type array of strings, or single string with a type name
 * @returns {string[]} array of error strings
 */
function validateDataType(type) {
	if (Array.isArray(type)) {
		const errors = [];
		type.forEach(elem => {
			errors.push(...validateDataType(elem));
		});
		return errors;
	}

	const lessThanIndex = type.indexOf('<');
	const greaterThanIndex = type.lastIndexOf('>');
	if (lessThanIndex !== -1 && greaterThanIndex !== -1) {
		if (type === 'Callback<void>') {
			return [];
		}
		// Compound data type
		const baseType = type.slice(0, lessThanIndex);
		const subType = type.slice(lessThanIndex + 1, greaterThanIndex);
		if (baseType === 'Callback' || baseType === 'Function') {
			const errors = [];
			subType.split(',').forEach(sub => {
				errors.push(...validateDataType(sub.trim()));
			});
			return errors;
		}
		if (baseType !== 'Array' && baseType !== 'Dictionary') {
			return [ `Base type for complex types must be one of Array, Callback, Dictionary, Function, but received ${baseType}` ];
		}
		return validateDataType(subType);
	}

	// This is awkward and backwards, but if the class is valid OR it's a common type, there's no error, so return empty array
	if (!validateClass(type) || ~common.DATA_TYPES.indexOf(type)) {
		return [];
	}

	if (standaloneFlag) {
		// For standalone mode, log warning but not an error
		// Data type can exist in a parent class not in the data set
		console.warn('WARNING! Could not validate data type: %s'.yellow, type);
		return [];
	}
	return [ type ];
}

/**
 * Validate default value
 * @param {object} val possible primitive or object
 * @returns {string} error string if not a primitive or object
 */
function validateDefault(val) {
	if (validatePrimitive(val) && (typeof val !== 'object')) {
		return 'Not a valid data type or string: ' + val;
	}
}

/**
 * Validate number
 * @param {object} number possible number
 * @returns {string} error string if not a number
 */
function validateNumber(number) {
	if (typeof number !== 'number') {
		return 'Not a number value: ' + number;
	}
}

/**
 * Validate OS version
 * @param {object} oses map of os names to versions
 * @returns {string[]} array of error strings
 */
function validateOSVersions(oses) {
	let errors = [];
	for (const key in oses) {
		if (~common.VALID_OSES.indexOf(key)) {
			for (const x in oses[key]) {
				let err;
				switch (x) {
					case 'max' :
					case 'min' :
						if ((err = validateVersion(oses[key][x]))) {
							errors.push(err);
						}
						break;
					case 'versions':
						oses[key][x].forEach(function (elem) {
							if ((err = validateVersion(elem))) {
								errors.push(err);
							}
						});
						break;
					default:
						errors.push('Unknown key: ' + x);
				}
			}

		} else {
			errors.push('Invalid OS: ' + key + '; valid OSes are: ' + common.VALID_OSES);
		}
	}
	return errors;
}

/**
 * Validate primitive
 * @param {object|number|boolean|string} x possible primitive value
 * @return {string} error string if not a primitive
 */
function validatePrimitive(x) {
	if (validateBoolean(x) && validateNumber(x) && validateString(x)) {
		return 'Not a primitive value (Boolean, Number, String): ' + x;
	}
}

/**
 * Validate return value
 * @param {object|object[]} ret An array of objects, or object
 * @param {object} [ret.type] return type
 * @param {object} [ret.summary] summary of value
 * @param {object} [ret.constants] possible constant values
 * @returns {string[]} error strings
 */
function validateReturns(ret) {
	var errors = [];
	if (Array.isArray(ret)) {
		ret.forEach(function (elem) {
			errors = errors.concat(validateReturns(elem));
		});
	} else {
		let err;
		for (const key in ret) {
			switch (key) {
				case 'type' :
					if ((err = validateDataType(ret[key])) && ret[key] !== 'void') {
						errors.push(err);
					}
					break;
				case 'summary' :
					if ((err = validateString(ret[key]))) {
						errors.push(err);
					}
					break;
				case 'constants' :
					if ((err = validateConstants(ret[key]))) {
						errors.push(err);
					}
					break;
				default :
					errors.push('Invalid key: ' + key);
			}
		}
	}
	return errors;
}

/**
 * Validate since version
 * @param {object|string} version object holding platform/os to version string; or a normal version string
 * @returns {string[]} array of error strings
 */
function validateSince(version) {
	if (typeof version === 'object') {
		let errors = [];
		for (const platform in version) {
			if (platform in common.DEFAULT_VERSIONS) {
				try {
					if (nodeappc.version.lt(version[platform], common.DEFAULT_VERSIONS[platform])) {
						errors.push('Minimum version for ' + platform + ' is ' + common.DEFAULT_VERSIONS[platform]);
					}
				} catch (e) {
					errors.push('Invalid version string:' + version[platform]);
				}
			} else {
				errors.push('Invalid platform: ' + platform);
			}
		}
		return errors;
	}
	return validateVersion(version);
}

/**
 * Validate string
 * @param {string|object|number} str possible string value
 * @returns {string} error string if value isn't a string
 */
function validateString(str) {
	if (typeof str !== 'string') {
		return 'Not a string value: ' + str;
	}
	if (!/^[\x00-\x7F]*$/.test(str)) { // eslint-disable-line no-control-regex
		return 'String contains non-ASCII characters.';
	}
}

/**
 * Validate markdown
 * @param {string} str possible markdown string
 * @returns {string} error string if not valid markdown
 */
function validateMarkdown(str) {
	const stringResult = validateString(str);
	if (stringResult) {
		return stringResult;
	}

	try {
		common.markdownToHTML(str);
	} catch (e) {
		return 'Error parsing markdown block "' + str + '": ' + e;
	}
	return null;
}

/**
 * Validate version
 * @param {string} version possible version string
 * @return {string} error string if not a value version string
 */
function validateVersion(version) {
	try {
		nodeappc.version.lt('0.0.1', version);
	} catch (e) {
		return 'Invalid version: ' + version;
	}
}

/**
 * Validates an object against a syntax dictionary
 * @param {Object} obj Object to validate
 * @param {Object} syntax Dictionary defining the syntax
 * @param {string} type type name?
 * @param {string} currentKey current key
 * @param {string} className Name of class being validated
 * @returns {Object} Syntax errors
 */
function validateObjectAgainstSyntax(obj, syntax, type, currentKey, className) {
	// If syntax is a dictionary, validate object against syntax dictionary
	let errors = {},
		err = '';
	const requiredKeys = syntax.required,
		optionalKeys = syntax.optional;
	// Ensure required keys exist and then validate them
	for (const requiredKey in requiredKeys) {
		if (requiredKey in obj) {
			if ((err = validateKey(obj[requiredKey], requiredKeys[requiredKey], requiredKey, className))) {
				errors[requiredKey] = err;
			}
		} else {
			// We're missing a required field. Check the parent to see if it's filled in there.
			// Only do this check when we're overriding an event, property or method, not top-level fields like 'summary'
			const parentClassName = doc[className]['extends'];
			let parent = doc[parentClassName],
				parentValue = null;
			if (type && parent) {
				const array = parent[type];
				if (array) {
					// find matching name in array
					for (let i = 0; i < array.length; i++) {
						if (array[i] && array[i].name === currentKey) { // eslint-disable-line max-depth
							parent = array[i];
							break;
						}
					}
					if (parent) {
						parentValue = parent[requiredKey];
					}
				}
			}

			if (!parentValue) {
				errors[requiredKey] = 'Required property "' + requiredKey + '" not found';
			}
		}
	}
	// Validate optional keys if they're on the object
	for (const optionalKey in optionalKeys) {
		if (optionalKey in obj) {
			if ((err = validateKey(obj[optionalKey], optionalKeys[optionalKey], optionalKey, className))) {
				errors[optionalKey] = err;
			}
		}
	}
	// Find keys on obj that aren't required or optional!
	for (const possiblyInvalidKey in obj) {
		// If doesn't start with underscores, and isn't required or optional...
		const isRequired = requiredKeys ? (possiblyInvalidKey in requiredKeys) : false;
		const isOptional = optionalKeys ? (possiblyInvalidKey in optionalKeys) : false;
		if (possiblyInvalidKey.indexOf('__') !== 0 && !isRequired && !isOptional) {
			errors[possiblyInvalidKey] = 'Invalid key(s) in ' + className + ': ' + possiblyInvalidKey;
		}
	}
	return errors;
}

/**
 * Validates an object against a syntax dictionary
 * @param {Object} obj Object to validate
 * @param {Object} syntax Dictionary defining the syntax
 * @param {String} currentKey Current key being validated
 * @param {String} className Name of class being validated
 * @returns {Object} Syntax errors, string key to error string as value
 */
function validateKey(obj, syntax, currentKey, className) {
	var errors = {},
		err = '';

	if (Array.isArray(syntax)) {
		if (syntax.length === 1) {
			if (Array.isArray(syntax[0])) {
				// Validate array elements against syntax array
				const errs = [];
				// If key is 'platforms', validate not an empty array!
				if (currentKey === 'platforms' && obj.length === 0) {
					errs.push('platforms array must not be empty. Remove to fall back to "default" platforms based on "since" value; or remove doc entry if this applies to no platforms.');
				} else {
					obj.forEach(function (elem) {
						if (!~syntax[0].indexOf(elem)) {
							errs.push('Invalid array element: ' + elem + '; possible values: ' + syntax[0]);
						}
					});
				}
				if (errs.length > 0) {
					errors = errs;
				}
			} else {
				// Validate each object against the syntax
				obj.forEach(function (elem) {
					const name = elem.name || '__noname',
						errs = validateObjectAgainstSyntax(elem, syntax[0], currentKey, name, className);
					errors[name] = errs;
				});
			}
		// Validate object value against syntax array
		} else if (!~syntax.indexOf(obj)) {
			errors = 'Invalid array element: ' + obj + '; possible values: ' + syntax;
		}
	} else if (typeof syntax === 'object') {
		errors = validateObjectAgainstSyntax(obj, syntax, null, currentKey, className);
	} else {
		// Else we have a specific syntax element to validate against
		switch (syntax) {
			case 'Boolean' :
				if ((err = validateBoolean(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Class' :
				if ((err = validateClass(obj))) {
					if (standaloneFlag) {
						console.warn('WARNING! Cannot validate class: %s'.yellow, obj);
					} else {
						errors[currentKey] = err;
					}
				}
				break;
			case 'Constants' :
				if ((err = validateConstants(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'DataType' :
				if ((err = validateDataType(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Default':
				if ((err = validateDefault(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Number':
				if ((err = validateNumber(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'OSVersions':
				if ((err = validateOSVersions(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Primitive':
				if ((err = validatePrimitive(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Returns':
				if ((err = validateReturns(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Since' :
				if ((err = validateSince(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'String' :
				if ((err = validateString(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Markdown' :
				if ((err = validateMarkdown(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Invalid' :
				errors[currentKey] = 'Invalid field "' + currentKey + '"';
				break;
			default:
				if (syntax.indexOf('Array') === 0) {
					switch (syntax.slice(syntax.indexOf('<') + 1, syntax.indexOf('>'))) {
						case 'events.name' :
							if ((err = validateAPINames(obj, 'events', className))) {
								errors[currentKey] = err;
							}
							break;
						case 'methods.name' :
							if ((err = validateAPINames(obj, 'methods', className))) {
								errors[currentKey] = err;
							}
							break;
						case 'properties.name' :
							if ((err = validateAPINames(obj, 'properties', className))) {
								errors[currentKey] = err;
							}
							break;
						default :
							console.warn('WARNING! Did not validate: %s = %s'.yellow, currentKey, obj);
					}
				} else {
					console.warn('WARNING! Did not validate: %s = %s'.yellow, currentKey, obj);
				}
				break;
		}
	}
	return errors;
}

/**
 * Add padding for log output
 * @param {number} level log indent level
 * @returns {string} padding string given indent level
 */
function addPadding(level) {
	let padding = '';
	for (let i = 0; i < level; i++) {
		padding += '	';
	}
	return padding;
}

/**
 * Format and output errors
 * @param {Array} errors array of error stringResult
 * @param {number} level logi indent level?
 * @return {string} error output
 */
function outputErrors(errors, level) {
	let errorOutput = '';
	for (const key in errors) {
		let error = errors[key];
		if (error.length > 0 || error !== null) {
			if (Array.isArray(error)) {
				error.forEach(function (err) { // eslint-disable-line no-loop-func
					if (err.length === 0) {
						return;
					}
					if (typeof err === 'object') {
						err = outputErrors(err, level + 1);
					}
					errorOutput += addPadding(level) + err + '\n';
					errorCount++;
				});
			} else if (typeof error === 'object') {
				if ((error = outputErrors(error, level + 1))) {
					errorOutput += addPadding(level) + key + '\n' + error;
				}
			} else {
				errorOutput += addPadding(level) + error + '\n';
				errorCount++;
			}
		}
	}
	return errorOutput;
}

/**
 * Output CLI usage
 */
function cliUsage () {
	common.log('Usage: node validate.js [--standalone] [--quiet] [<PATH_TO_YAML_FILES>]');
	common.log('\nOptions:');
	common.log('\t--quiet, -q\tSuppress non-error messages');
	common.log('\t--standalone, -s\tdisable error checking for inherited APIs');
}

// Start of Main Flow
// Check command arguments
const argc = process.argv.length;
let basePath = '.';
if (argc > 2) {
	for (let x = 2; x < argc; x++) {
		switch (process.argv[x]) {
			case '--help' :
				cliUsage();
				process.exit(0);
				break;
			case '--standalone' :
			case '-s' :
				standaloneFlag = true;
				common.log('Standalone mode enabled. Errors will not be logged against inherited APIs.');
				break;
			case '--quiet':
			case '-q':
				common.setLogLevel(common.LOG_WARN);
				break;
			default:
				if (x === argc - 1) {
					basePath = process.argv[process.argv.length - 1];
				} else {
					common.log(common.LOG_WARN, 'Unknown option: %s', process.argv[x]);
					cliUsage();
					process.exit(1);
				}
		}
	}
}

if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
	common.log(common.LOG_ERROR, 'Invalid path: %s', basePath);
	process.exit(1);
}

// Load YAML files
const rv = common.parseYAML(basePath);
doc = rv.data;
const parseErrors = rv.errors;
if (Object.keys(doc).length === 0) {
	common.log(common.LOG_ERROR, 'Could not find YAML files in %s', basePath);
	process.exit(1);
}

common.createMarkdown(doc);

// FIXME This needs to handle type hierarchy. If a method/property/event overrides a parent, then the parent may have "filled out" a required field/value!

// Validate YAML
for (const key in doc) {
	const cls = doc[key],
		currentFile = cls.__file;
	let currentErrors = errorCount,
		errors = '',
		diff = 0;

	try {
		errors = outputErrors(validateKey(cls, validSyntax, null, key), 1);
	} catch (e) {
		common.log(common.LOG_ERROR, 'PARSING ERROR:\n%s\n%s', currentFile, e);
		console.error(e.stack);
		errorCount++;
	}

	if ((diff = errorCount - currentErrors) > 0) {
		common.log(common.LOG_ERROR, '%s\n%s: found %s error(s)!\n%s', currentFile, cls.name, diff, errors);
		currentErrors = errorCount;
	} else {
		common.log(common.LOG_INFO, '%s: OK!', cls.name);
	}
}

// Exit with error if we found errors or handled exceptions
if (parseErrors.length + errorCount > 0) {
	if (errorCount > 0) {
		common.log(common.LOG_ERROR, 'Found %s error(s)!', errorCount);
	}
	// Output exceptions while parsing YAML files
	if (parseErrors.length > 0) {
		common.log(common.LOG_ERROR, 'The following files have YAML syntax errors: ');
		parseErrors.forEach(function (error) {
			common.log(common.LOG_ERROR, '%s\n%s', error.__file, error);
		});
	}
	process.exit(1);
} else {
	common.log('No errors found!');
}
