/**
 * Script to validate the syntax of the YAML files against the TDoc spec
 * https://wiki.appcelerator.org/display/guides2/TDoc+Specification
 *
 * Execute `node validate.js --help` for usage
 *
 * Dependencies: colors ~0.6.2 and node-appc ~0.2.14
 */

var fs = require('fs'),
	colors = require('colors'),
	nodeappc = require('node-appc'),
	common = require('./lib/common.js'),
	basePath = '.',
	rv = {},
	doc = {},
	parseErrors = [],
	errorCount = 0,
	standaloneFlag = false,
	argc = 0;

var validSyntax = {
	'name' : 'String',
	'summary' : 'String',
	'description' : 'String',
	'createable' : 'Boolean',
	'platforms' : [common.VALID_PLATFORMS],
	'exclude-platforms' : [common.VALID_PLATFORMS],
	'excludes' : {
		'events' : 'Array<events.name>',
		'methods' : 'Array<methods.name>',
		'properties' : 'Array<properties.name>'
	},
	'examples' : [{
		'title' : 'String',
		'example' : 'String'
	}],
	'osver' : 'OSVersions',
	'extends' : 'Class',
	'deprecated' : {
		'since' : 'Since',
		'removed' : 'String',
		'notes' : 'String'
	},
	'since' : 'Since',
	'events' : [{
		'name' : 'String',
		'summary' : 'String',
		'description' : 'String',
		'platforms' : [common.VALID_PLATFORMS],
		'since' : 'Since',
		'deprecated' : {
			'since' : 'Since',
			'removed' : 'String',
			'notes' : 'String'
		},
		'osver' : 'OSVersions',
		'properties' : [{
			'name' : 'String',
			'summary' : 'String',
			'type' : 'DataType',
			'platforms' : [common.VALID_PLATFORMS],
			'deprecated' : {
				'since' : 'Since',
				'removed' : 'String',
				'notes' : 'String'
			},
			'exclude-platforms' : [common.VALID_PLATFORMS],
			'constants' : 'Constants'
		}],
		'exclude-platforms' : [common.VALID_PLATFORMS]
	}],
	'methods' : [{
		'name' : 'String',
		'summary' : 'String',
		'description' : 'String',
		'returns' : 'Returns',
		'platforms' : [common.VALID_PLATFORMS],
		'since' : 'Since',
		'deprecated' : {
			'since' : 'Since',
			'removed' : 'String',
			'notes' : 'String'
		},
		'examples' : [{
			'title' : 'String',
			'example' : 'String'
		}],
		'osver' : 'OSVersions',
		'parameters' : [{
			'name' : 'String',
			'summary' : 'String',
			'type' : 'DataType',
			'optional' : 'Boolean',
			'default' : 'Default',
			'repeatable' : 'Boolean',
			'constants' : 'Constants'
		}],
		'exclude-platforms' : [common.VALID_PLATFORMS]
	}],
	'properties' : [{
		'name' : 'String',
		'summary' : 'String',
		'description' : 'String',
		'platforms' : [common.VALID_PLATFORMS],
		'since' : 'Since',
		'type' : 'DataType',
		'deprecated' : {
			'since' : 'Since',
			'removed' : 'String',
			'notes' : 'String'
		},
		'osver' : 'OSVersions',
		'examples' : [{
			'title' : 'String',
			'example' : 'String'
		}],
		'permission' : ['read-only', 'write-only', 'read-write'],
		'availability' : ['always', 'creation', 'not-creation'],
		'accessors' : 'Boolean',
		'optional' : 'Boolean',
		'value' : 'Primitive',
		'default' : 'Default',
		'exclude-platforms' : [common.VALID_PLATFORMS],
		'constants' : 'Constants'
	}]
};

/**
 * Validate if an API exists in a class and its ancestors
 * @param obj {Array<String>} Array of API names to verify
 * @param type {string} API type ('event', 'methods' or 'properties')
 * @param className {string} Name of class to check
 * @returns {string} Error with unverified API names or null if no errors
 */
function validateAPINames(obj, type, className) {
	var apis = doc[className][type],
		index;
	if (apis) {
		apis.forEach(function (api) {
			if (~(index = obj.indexOf(api.name))) {
				obj.splice(index);
			}
		});
	}
	if (type === 'methods' && 'properties' in doc[className]) {
		// Evaluate setters and getters
		doc[className].properties.forEach(function (property) {
			var setter = 'set' + property.name.charAt(0).toUpperCase() + property.name.slice(1),
				getter = 'get' + property.name.charAt(0).toUpperCase() + property.name.slice(1);
			if (~(index = obj.indexOf(setter))) {
				obj.splice(index);
			}
			if (~(index = obj.indexOf(getter))) {
				obj.splice(index);
			}
		});
	}
	if ('extends' in doc[className]) {
		// Evaluate parent class
		var parent = doc[className]['extends'];
		if (parent in doc) {
			return validateAPINames(obj, type, parent);
		} else {
			if (standaloneFlag) {
				console.warn('WARNING! Cannot validate parent class: %s'.yellow, parent);
				return;
			} else {
				return 'Invalid parent class: ' + parent;
			}
		}
	}
	if (obj.length > 0) {
		return 'Could not find: ' + obj;
	}
}

/**
 * Validate boolean type
 */
function validateBoolean (bool) {
	if (typeof bool !== 'boolean') {
		return 'Not a boolean value: ' + bool;
	}
}

/**
 * Validate class is in docs
 */
function validateClass (cls) {
	if (!(cls in doc)) {
		return 'Not a valid class: ' + cls;
	}
}

/**
 * Validate constant is in docs
 */
function validateConstants (constants) {
	var errors = [];
	if (Array.isArray(constants)) {
		constants.forEach(function (constant) {
			errors = errors.concat(validateConstants(constant));
		});
	} else {
		var prop = constants.split('.').pop(),
			cls = constants.substring(0, constants.lastIndexOf('.'));
		if (!(cls in doc) || !('properties' in doc[cls]) || doc[cls] == null) {
			errors.push('Invalid constant: ' + constants);
		} else {
			var properties = doc[cls].properties;
			if (prop.charAt(prop.length - 1) === '*') {
				prop = prop.substring(0, prop.length - 1);
			}
			for (var i = 0; i < properties.length; i++) {
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
 */
function validateDataType (type) {
	var errors = [];
	if (Array.isArray(type)) {
		type.forEach(function (elem) {
			errors = errors.concat(validateDataType(elem));
		});
	} else if ((~type.indexOf('<') && ~type.indexOf('>')) &&
		(type.indexOf('Array') === 0 || type.indexOf('Callback') === 0 ||  type.indexOf('Dictionary') === 0)) {
		if (type === 'Callback<void>') {
			return errors;
		}
		// Compound data type
		errors = errors.concat(validateDataType(type.slice(type.indexOf('<') + 1, type.lastIndexOf('>'))));
	} else if (validateClass(type) == null || ~common.DATA_TYPES.indexOf(type)) {
		return errors;
	} else if (standaloneFlag) {
		// For standalone mode, log warning but not an error
		// Data type can exist in a parent class not in the data set
		console.warn('WARNING! Could not validate data type: %s'.yellow, type);
	} else {
		errors.push(type);
	}
	return errors;
}

/**
 * Validate default value
 */
function validateDefault (val) {
	if (validatePrimitive(val) != null && (typeof val !== 'object')) {
		return 'Not a valid data type or string: ' + val;
	}
}

/**
 * Validate number
 */
function validateNumber (number) {
	if (typeof number !== 'number') {
		return 'Not a number value: ' + number;
	}
}

/**
 * Validate OS version
 */
function validateOSVersions (oses) {
	var errors = [];
	for (var key in oses) {
		if (~common.VALID_OSES.indexOf(key)) {
			for (var x in oses[key]) {
				var err;
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
 */
function validatePrimitive (x) {
	if (validateBoolean(x) != null) {
		if (validateNumber(x) != null) {
			if (validateString(x) != null) {
				return 'Not a primitive value (Boolean, Number, String): ' + x;
			}
		}
	}
}

/**
 * Validate return value
 */
function validateReturns (ret) {
	var errors = [];
	if (Array.isArray(ret)) {
		ret.forEach (function (elem) {
			errors = errors.concat(validateReturns(elem));
		});
	} else {
		var err;
		for (var key in ret) {
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
 */
function validateSince (version) {
	if (typeof version === 'object') {
		var errors = [];
		for (var platform in version) {
			if (platform in common.DEFAULT_VERSIONS) {
				try {
					if (nodeappc.version.lt(version[platform], common.DEFAULT_VERSIONS[platform])) {
						errors.push('Minimum version for ' + platform + ' is ' + common.DEFAULT_VERSIONS[platform]);
					}
				}
				catch (e) {
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
 */
function validateString (str) {
	if (typeof str !== 'string') {
		return 'Not a string value: ' + str;
	}
	if (!/^[\x00-\x7F]*$/.test(str)) {
		return 'String contains non-ASCII characters.';
	}
}

/**
 * Validate version
 */
function validateVersion (version) {
	try {
		nodeappc.version.lt('0.0.1', version);
	}
	catch (e) {
		return 'Invalid version: ' + version;
	}
}

/**
 * Validates an object against a syntax dictionary
 * @param obj {Object} Object to validate
 * @param syntax {Object} Dictionary defining the syntax
 * @param currentKey {String} Current key being validated
 * @param className {String} Name of class being validated
 * @returns {Object} Syntax errors
 */
function validateKey (obj, syntax, currentKey, className) {
	var errors = {}, err = '';

	if (Array.isArray(syntax)) {
		if (syntax.length === 1) {
			if (Array.isArray(syntax[0])) {
				// Validate array elements against syntax array
				var errs = [];
				obj.forEach(function (elem) {
					if (!~syntax[0].indexOf(elem)) {
						errs.push('Invalid array element: ' + elem + '; possible values: ' + syntax[0]);
					}
				});
				if (errs.length > 0) {
					errors = errs;
				}
			} else {
				// Validate object keys against syntax dictionary
				obj.forEach(function (elem) {
					var errs = {};
					for (var key in elem) {
						if (key in syntax[0]) {
							if ((err = validateKey(elem[key], syntax[0][key], key, className))) {
								errs[key] = err;
							}
						} else {
							errs[key] = ('Invalid key: ' + key);
						}
					}
					errors[elem.name || '__noname'] = errs;
				});
			}
		} else {
			// Validate object value against syntax array
			if (!~syntax.indexOf(obj)) {
				errors = 'Invalid array element: ' + obj + '; possible values: ' + syntax;
			}
		}
	} else if (typeof syntax === 'object') {
		// If syntax is a dictionary, validate object against syntax dictionary
		for (var key in obj) {
			if (key in syntax) {
				if ((err = validateKey(obj[key], syntax[key], key, className))) {
					errors[key] = err;
				}
			} else if (!~key.indexOf('__'))	{
				errors[key] = 'Invalid key: ' + key;
			}
		}
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
			case 'Default' :
				if ((err = validateDefault(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Number' :
				if ((err = validateNumber(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'OSVersions' :
				if ((err = validateOSVersions(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Primitive' :
				if ((err = validatePrimitive(obj))) {
					errors[currentKey] = err;
				}
				break;
			case 'Returns' :
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
 */
function addPadding (level) {
	var padding = '';
	for (var i = 0; i < level; i++) {
		padding += '	';
	}
	return padding;
}

/**
 * Format and output errors
 */
function outputErrors (errors, level) {
	var errorOutput = '';
	for (var key in errors) {
		var error = errors[key];
		if (error.length > 0 || error != null) {
			if (Array.isArray(error)) {
				error.forEach(function (err) {
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
if ((argc = process.argv.length) > 2) {
	for (var x = 2; x < argc; x++) {
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
			default :
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
rv = common.parseYAML(basePath);
doc = rv.data;
parseErrors = rv.errors;
if (Object.keys(doc).length === 0) {
	common.log(common.LOG_ERROR, 'Could not find YAML files in %s', basePath);
	process.exit(1);
}

// Validate YAML
for (var key in doc) {
	var cls = doc[key],
		currentErrors = errorCount,
		errors = '',
		diff = 0,
		currentFile = cls.__file;
	try {
		errors = outputErrors(validateKey(cls, validSyntax, null, key), 1);
	} catch (e) {
		common.log(common.LOG_ERROR, 'PARSING ERROR:\n%s\n%s', currentFile, e);
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
