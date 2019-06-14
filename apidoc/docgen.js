/**
 * Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to preprocess the YAML docs in to a common JSON format,
 * then calls an generator script to format the API documentation.
 */
'use strict';

var common = require('./lib/common.js'),
	nodeappc = require('node-appc'),
	ejs = require('ejs'),
	fs = require('fs'),
	yaml = require('js-yaml'),
	exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	os = require('os'),
	pathMod = require('path'),
	assert = common.assertObjectKey,
	basePaths = [],
	processFirst = [ 'Titanium.Proxy', 'Titanium.Module', 'Titanium.UI.View' ],
	skipList = [ 'Titanium.Namespace.Name' ],
	validFormats = [],
	apidocPath = '.',
	libPath = './lib/',
	templatePath = './templates/',
	formats = [ 'html' ],
	outputPath = pathMod.join(__dirname, '..', 'dist'),
	output = outputPath,
	parseData = {},
	doc = {},
	errors = [],
	exportData = {},
	exporter = null,
	processedData = {},
	render = '',
	fsArray = [],
	tokens = [],
	originalPaths = [],
	modules = [],
	cssPath = '',
	cssFile = '',
	addOnDocs = [],
	searchPlatform = null,
	argc = 0,
	path = '',
	templateStr = '';

/**
 * Returns a list of inherited APIs.
 * @param {Object} api API object to extract inherited APIs
 * @returns {Object} Object containing all API members for the class
 */
function getInheritedAPIs (api) {
	var inheritedAPIs = { events: [], methods: [], properties: [] },
		removeAPIs = [],
		copyAPIs = [],
		matches = [],
		index = 0,
		x = 0;

	if (assert(api, 'extends') && api.extends in doc) {
		inheritedAPIs = getInheritedAPIs(doc[api.extends]);

		// Remove inherited accessors
		matches = inheritedAPIs.methods.filter(function (element) {
			return assert(element, '__accessor');
		});
		matches.forEach(function (element) {
			inheritedAPIs.methods.splice(inheritedAPIs.methods.indexOf(element), 1);

		});

		for (const key in inheritedAPIs) {
			removeAPIs = [];
			if (!(key in api) || !api[key]) {
				continue;
			}
			copyAPIs = nodeappc.util.mixObj([], api[key]);
			inheritedAPIs[key].forEach(function (inheritedAPI) { // eslint-disable-line no-loop-func

				// See if current API overwrites inherited API
				matches = copyAPIs.filter(function (element) {
					return (element.name === inheritedAPI.name);
				});

				matches.forEach(function (match) { // eslint-disable-line no-loop-func
					removeAPIs.push(match);
					// If the APIs came from the same class, do nothing
					if (match.__inherits === inheritedAPI.__inherits) {
						return;
					}

					// If the APIs are from different classes, override inherited API with current API
					index = inheritedAPIs[key].indexOf(inheritedAPI);
					for (const property in match) {
						if (assert(match, property)) {
							inheritedAPIs[key][index][property] = match[property];
						}
					}
					inheritedAPIs[key][index].__inherits = api.name;
				});
			});

			removeAPIs.forEach(function (element) { // eslint-disable-line no-loop-func
				copyAPIs.splice(copyAPIs.indexOf(element), 1);
			});
			for (x = 0; x < copyAPIs.length; x++) {
				copyAPIs[x].__inherits = api.name;
			}
			inheritedAPIs[key] = inheritedAPIs[key].concat(copyAPIs);
		}

	} else {
		for (const key2 in inheritedAPIs) {
			if (!(key2 in api) || !api[key2]) {
				continue;
			}
			inheritedAPIs[key2] = nodeappc.util.mixObj([], api[key2]);
			for (x = 0; x < inheritedAPIs[key2].length; x++) {
				inheritedAPIs[key2][x].__inherits = api.name;
			}
		}
	}
	return inheritedAPIs;
}

/**
 * Returns a list of constants
 * @param {Object} api API to evaluate
 * @returns {Array} List of constants the API supports
 */
function processConstants (api) {
	var rv = [];
	if ('constants' in api) {
		if (!Array.isArray(api.constants)) {
			api.constants = [ api.constants ];
		}
		api.constants.forEach(function (constant) {
			if (constant.charAt(constant.length - 1) === '*') {
				let prop = constant.split('.').pop();
				prop = prop.substring(0, prop.length - 1);
				const cls = constant.substring(0, constant.lastIndexOf('.'));
				if (cls in doc && 'properties' in doc[cls]) {
					doc[cls].properties.forEach(function (property) {
						if (property.name.indexOf(prop) === 0 && property.name.match(common.REGEXP_CONSTANTS)) {
							rv.push(cls + '.' + property.name);
						}
					});
				}
			} else {
				rv.push(constant);
			}
		});
	}
	return rv;
}

/**
 * Returns a list of platforms and since versions the API supports
 * @param {Object} api API to evaluate
 * @param {Object} versions Possible platforms and versions the API supports (usually from the class)
 * @param {Boolean} matchVersion For members, only match platforms from the versions param
 * @param {Boolean} addon Indicates if the class came from an add-on file
 * @returns {Object} Object containing platforms and versions the API supports
 */
function processVersions (api, versions, matchVersion, addon) {
	var defaultVersions = nodeappc.util.mixObj({}, versions),
		platform = null,
		key = null;

	if (assert(api, 'platforms')) {
		for (platform in defaultVersions) {
			if (!~api.platforms.indexOf(platform)) {
				delete defaultVersions[platform];
			}
		}
		for (platform in common.ADDON_VERSIONS) {
			if (((matchVersion && ~Object.keys(versions).indexOf(platform)) || !matchVersion)
				&& ~api.platforms.indexOf(platform)) {
				defaultVersions[platform] = common.ADDON_VERSIONS[platform];
			}
		}
	} else if (assert(api, 'exclude-platforms')) {
		api['exclude-platforms'].forEach(function (platform) {
			if (platform in defaultVersions) {
				delete defaultVersions[platform];
			}
		});
		// Remove add-on platforms from defaults if exclude-platforms tag is used
		Object.keys(common.ADDON_VERSIONS).forEach(function (platform) {
			if (platform in defaultVersions) {
				delete defaultVersions[platform];
			}
		});
	} else if (addon) {
		// Verify add-on platforms if there is not platforms tags and the class came from an add
		for (platform in common.ADDON_VERSIONS) {
			if (~Object.keys(versions).indexOf(platform)) {
				defaultVersions[platform] = common.ADDON_VERSIONS[platform];
			}
		}
	} else {
		// Remove add-on platforms from defaults if platforms tag is not specified
		Object.keys(common.ADDON_VERSIONS).forEach(function (platform) {
			if (platform in defaultVersions) {
				delete defaultVersions[platform];
			}
		});
	}
	if (assert(api, 'since')) {
		if (typeof api.since === 'string') {
			for (key in defaultVersions) {
				if (nodeappc.version.gt(api.since, defaultVersions[key])) {
					defaultVersions[key] = api.since;
				}
			}
		} else {
			for (key in defaultVersions) {
				if (nodeappc.version.gt(api.since[key], defaultVersions[key])) {
					defaultVersions[key] = api.since[key];
				}
			}
		}
	}
	return defaultVersions;
}

/**
 * Processes APIs based on the given list of platforms and versions
 * @param {Array<Object>} apis List of APIs to evaluate
 * @param {String} type Type of API
 * @param {Object} defaultVersions List of platforms and versions the APIs support
 * @param {Boolean} addon Indicates if the class came from an add-on file
 * @returns {Array<Object>} List of processed APIs
 */
function processAPIMembers (apis, type, defaultVersions, addon) {
	var rv = [],
		x = 0;
	apis.forEach(function (api) {
		api.since = processVersions(api, defaultVersions, true, addon);
		api.platforms = Object.keys(api.since);
		if (type === 'properties') {
			if (api.constants) {
				api.constants = processConstants(api);
			}
			api.__subtype = 'property';
		}
		if (type === 'events') {
			api.__subtype = 'event';
			if (assert(api, 'properties')) {
				for (x = 0; x < api.properties.length; x++) {
					api.properties[x].__subtype = 'eventProperty';
					if ('constants' in api.properties[x]) {
						api.properties[x].constants = processConstants(api.properties[x]);
					}
				}
			}
		}
		if (type === 'methods') {
			api.__subtype = 'method';
			if (assert(api, 'parameters')) {
				for (x = 0; x < api.parameters.length; x++) {
					api.parameters[x].__subtype = 'parameter';
					if ('constants' in api.parameters[x]) {
						api.parameters[x].constants = processConstants(api.parameters[x]);
					}
				}
			}
			if (assert(api, 'returns')) {
				if (!Array.isArray(api.returns)) {
					api.returns = [ api.returns ];
				}
				for (x = 0; x < api.returns.length; x++) {
					api.returns[x].__subtype = 'return';
					if (assert(api.returns[x], 'constants')) {
						api.returns[x].constants = processConstants(api.returns[x]);
					}
				}
			}
		}
		if (api.platforms.length > 0) {
			rv.push(api);
		}
	});
	return rv;
}

/**
 * Hides APIs based on the excludes list
 * @param {Object} apis APIs to evaluate
 * @param {String} type Type of API, one of 'events', 'methods' or 'properties'
 * @returns {object[]} Processed APIs
 */
function hideAPIMembers(apis, type) {
	var index;
	if (assert(apis, 'excludes') && assert(apis.excludes, type) && assert(apis, type)) {
		apis[type].forEach(function (api) {
			index = apis[type].indexOf(api);
			if (apis[type][index].__hide) {
				return;
			}
			apis[type][index].__hide = !!(~apis.excludes[type].indexOf(api.name));
			if (apis[type][index].__hide) {
				apis[type][apis[type].indexOf(api)].__inherits = apis.name;
			}
		});
	}
	return apis;
}

/**
 * Generates accessors from the given list of properties
 * @param {Array<Object>} apis Array of property objects
 * @param {String} className Name of the class
 * @param {String} methods Array of defined methods on the API
 * @returns {Array<Object>} Array of methods
 */
function generateAccessors(apis, className, methods) {
	const rv = [];
	apis.forEach(function (api) {

		if ('accessors' in api && api.accessors === false) {
			return;
		}

		const getterName = 'get' + api.name.charAt(0).toUpperCase() + api.name.slice(1);
		const setterName = 'set' + api.name.charAt(0).toUpperCase() + api.name.slice(1);
		// Generate getter
		if (!('permission' in api && api.permission === 'write-only') && !api.name.match(common.REGEXP_CONSTANTS) && !methods.includes(getterName)) {
			rv.push({
				name: getterName,
				summary: 'Gets the value of the <' + className + '.' + api.name + '> property.',
				deprecated: api.deprecated || { since: '8.0.0', notes: 'Access <' + className + '.' + api.name + '> instead.' },
				platforms: api.platforms,
				since: api.since,
				returns: { type: api.type, __subtype: 'return' },
				__accessor: true,
				__hide: api.__hide || false,
				__inherits: api.__inherits || null,
				__subtype: 'method'
			});
		}

		// Generate setter
		if (!('permission' in api && api.permission === 'read-only') && !methods.includes(setterName)) {
			rv.push({
				name: setterName,
				summary: 'Sets the value of the <' + className + '.' + api.name + '> property.',
				deprecated: api.deprecated || { since: '8.0.0', notes: 'Set the value using <' + className + '.' + api.name + '> instead.'  },
				platforms: api.platforms,
				since: api.since,
				parameters: [ {
					name: api.name,
					summary: 'New value for the property.',
					type: api.type,
					__subtype: 'parameter'
				} ],
				__accessor: true,
				__hide: api.__hide || false,
				__inherits: api.__inherits || null,
				__subtype: 'method'
			});
		}
	});
	return rv;
}

/**
 * Returns a subtype based on the parent class
 * @param {Object} api Class object
 * @returns {string} Class's subtype
 */
function getSubtype (api) {
	switch (api.name) {
		case 'Global':
		case 'Titanium.Module':
			return 'module';
		case 'Titanium.Proxy':
			return 'proxy';
	}

	if (api.name.indexOf('Global.') === 0) {
		return 'module';
	}

	switch (api.extends) {
		case 'Titanium.UI.View' :
			return 'view';
		case 'Titanium.Module' :
			return 'module';
		case 'Titanium.Proxy' :
			return 'proxy';
		default:
			if (assert(api, 'extends') && assert(doc, api.extends)) {
				return getSubtype(doc[api.extends]);
			} else {
				return 'pseudo';
			}
	}
}

/**
 * Process API class
 * @param {Object} api API object to build (and use as base)
 * @return {Object} api
 */
function processAPIs (api) {
	var defaultVersions = nodeappc.util.mix({}, common.DEFAULT_VERSIONS),
		inheritedAPIs = {},
		matches = [];

	// Generate list of supported platforms and versions
	api.since = processVersions(api, defaultVersions, false);
	api.platforms = Object.keys(api.since);

	// Get inherited APIs
	inheritedAPIs = getInheritedAPIs(api);
	for (const key in inheritedAPIs) {
		api[key] = inheritedAPIs[key];
	}

	api.__subtype = getSubtype(api);

	// Generate create method
	api.__creatable = false;
	if ((api.__subtype === 'view' || api.__subtype === 'proxy')
		&& (assert(api, 'createable') || !('createable' in api))) {

		const name = api.name,
			prop = name.split('.').pop(),
			cls = name.substring(0, name.lastIndexOf('.')),
			methodName = 'create' + prop;

		if (cls in doc) {
			matches = [];
			if (assert(doc[cls], 'methods')) {
				matches = doc[cls].methods.filter(function (member) {
					return member.name === methodName;
				});
			}
			if (matches.length === 0) {
				const createMethod = {
					name: methodName,
					summary: 'Creates and returns an instance of <' + name + '>.\n',
					deprecated: api.deprecated || null,
					since: api.since,
					platforms: api.platforms,
					returns: { type: name, __subtype: 'return' },
					parameters: [ {
						name: 'parameters',
						summary: 'Properties to set on a new object, including any defined by <' + name + '> except those marked not-creation or read-only.\n',
						type: 'Dictionary<' + name + '>',
						optional: true,
						__subtype: 'parameter'
					} ],
					__creator: true,
					__subtype: 'method'
				};
				api.__creatable = true;
				if ('methods' in doc[cls]) {
					if (!doc[cls].methods) {
						common.log(common.LOG_WARN, 'Empty \'methods\' listing for class: %s', cls);
						doc[cls].methods = [ createMethod ];
					} else {
						doc[cls].methods.push(createMethod);
					}
				} else {
					doc[cls].methods = [ createMethod ];
				}
			}
		}
	}

	if (assert(api, 'events')) {
		api = hideAPIMembers(api, 'events');
		api.events = processAPIMembers(api.events, 'events', api.since, api.__addon);
	}

	if (assert(api, 'properties')) {
		let accessors;
		api = hideAPIMembers(api, 'properties');
		api.properties = processAPIMembers(api.properties, 'properties', api.since, api.__addon);
		const methods = api.methods.map(method => method.name);
		if (api.__subtype !== 'pseudo' && (accessors = generateAccessors(api.properties, api.name, methods))) {
			if (assert(api, 'methods')) {
				matches = [];
				accessors.forEach(function (accessor) {
					matches = api.methods.filter(function (element) {
						return accessor.name === element.name;
					});
				});
				matches.forEach(function (element) {
					accessors.splice(accessors.indexOf(element), 1);
				});
				api.methods = api.methods.concat(accessors);
			} else {
				api.methods = accessors;
			}
		}
	}

	if (assert(api, 'methods')) {
		api = hideAPIMembers(api, 'methods');
		api.methods = processAPIMembers(api.methods, 'methods', api.since, api.__addon);
	}

	return api;
}

/**
 * Output CLI usage
 */
function cliUsage () {
	common.log('Usage: node docgen.js [--addon-docs <PATH_TO_YAML_FILES] [--css <CSS_FILE>] [--format <EXPORT_FORMAT>] [--output <OUTPUT_DIRECTORY>] [<PATH_TO_YAML_FILES>]');
	common.log('\nOptions:');
	common.log('\t--addon-docs, -a\tDocs to add to the base Titanium Docs');
	common.log('\t--css           \tCSS style file to use for HTML exports.');
	common.log('\t--format, -f    \tExport format: %s. Default is html.', validFormats);
	common.log('\t--output, -o    \tDirectory to output the files.');
	common.log('\t--platform, -p  \tPlatform to extract for addon format.');
	common.log('\t--stdout        \tOutput processed YAML to stdout.');
	common.log('\t--start         \tStart version for changes format (will use the version in the package.json if not defined).');
	common.log('\t--end           \tEnd version for changes format (optional).');

}

/**
 * Merge values from add-on object to base object
 * @param {object} baseObj base object
 * @param {object} addObj add on object
 * @return {object} merged object
 */
function addOnMerge(baseObj, addObj) {
	for (const key in addObj) {
		const base = baseObj[key],
			add = addObj[key];

		if (Array.isArray(base)) {
			// Array of objects
			if (typeof base[0] === 'object') {

				const tempArray = base;
				add.forEach(function (api) { // eslint-disable-line no-loop-func
					if ('name' in base[0]) {
						const match = base.filter(function (item) {
							return api.name === item.name;
						});
						if (match.length > 0) {
							// Replace item if we have a match
							tempArray.splice(tempArray.indexOf(match[0]), 1);
							tempArray.push(addOnMerge(match[0], api));
						} else if (~[ 'properties', 'methods', 'events' ].indexOf(key)
								&& !(api.name.indexOf('set') === 0 || api.name.indexOf('get') === 0 || api.name.indexOf('create') === 0)
									&& api.summary) {
							common.log(common.LOG_INFO, 'Adding new API to %s array: %s', key, api.name);
							tempArray.push(api);
						} else {
							common.log(common.LOG_WARN, 'Could not locate object in %s array with name: %s', key, api.name);
						}
					} else {
						common.log(common.LOG_WARN, 'Element in %s array does not have a name key.', key);
					}
				});
				baseObj[key] = tempArray;
			// Array of primitives
			} else if (Array.isArray(add)) {
				baseObj[key] = base.concat(add);
			} else {
				baseObj[key] = base.push(add);
			}
		} else {
			switch (typeof base) {
				case 'object':
					for (const k in add) {
						if (!base[k]) {
							base[k] = add[k];
							delete add[k];
						}
					}
					baseObj[key] = addOnMerge(base, add);
					break;
				case 'string':
					if (key === 'since') {
						const platforms = baseObj.platforms || Object.keys(common.DEFAULT_VERSIONS);
						const since = {};

						platforms.forEach(function (p) {
							since[p] = baseObj[key];
						});

						if (typeof add === 'object') {
							Object.keys(add).forEach(function (k) {
								since[k] = add[k];
							});
						} else if (assert(addObj, 'platforms')) {
							addObj.platforms.forEach(function (p) {
								since[p] = add;
							});
						} else {
							common.log(common.LOG_WARN, 'Cannot set since version.  Set since as a dictionary or add the platforms property.');
							break;
						}
						baseObj[key] = since;
					}
					break;
				case 'undefined':
					if (~[ 'description' ].indexOf(key)) {
						baseObj[key] = add;
					} else if (key === 'exclude-platforms' && !assert(baseObj, 'platforms')) {
						baseObj[key] = add;
					} else if (key === 'platforms') {
						baseObj[key] = Object.keys(common.DEFAULT_VERSIONS).concat(add);
					} else if (key === 'since') {
						const since = {};
						if (typeof add === 'object') {
							Object.keys(add).forEach(function (k) {
								since[k] = add[k];
							});
						} else if (assert(addObj, 'platforms')) {
							addObj.platforms.forEach(function (p) {
								since[p] = add;
							});
						} else {
							common.log(common.LOG_WARN, 'Cannot set since version.  Set since as a dictionary or add the platforms property.');
						}
						baseObj[key] = since;
					} else {
						common.log(common.LOG_WARN, 'Base object does not have a value for %s', key);
					}
					break;
				default:
					common.log(common.LOG_WARN, 'Could not merge %s key: %s to %s', key, base, add);
			}
		}
	}
	return baseObj;
}

/**
 * Create path if it does not exist
 * @param {string} path directory path to make
 */
function mkdirDashP(path) {
	var p = path.replace(/\\/g, '/');
	p = p.substring(0, path.lastIndexOf('/'));
	if (p.length) {
		if (!fs.existsSync(p)) {
			mkdirDashP(p);
		}
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
	}
}

// Start of Main Flow
// Get a list of valid formats
apidocPath = process.argv[1].replace(/\\/g, '/');
apidocPath = apidocPath.substring(0, apidocPath.lastIndexOf('/'));
libPath = apidocPath + '/lib/';
fsArray = fs.readdirSync(libPath);
fsArray.forEach(function (file) {
	tokens = file.split('_');
	if (tokens[1] === 'generator.js') {
		validFormats.push(tokens[0]);
	}
});

// Check command arguments
if ((argc = process.argv.length) > 2) {
	for (let x = 2; x < argc; x++) {
		switch (process.argv[x]) {
			case '--help' :
				cliUsage();
				process.exit(0);
				break;
			case '--addon-docs' :
			case '-a':
				path = process.argv[++x];
				if (fs.existsSync(path)) {
					addOnDocs.push(path);
				} else {
					common.log(common.LOG_WARN, 'Path does not exist: %s', path);
				}
				path = null;
				break;
			case '--css':
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Did not specify a CSS file.');
					cliUsage();
					process.exit(1);
				}
				cssPath = process.argv[x];
				if (!fs.existsSync(cssPath)) {
					common.log(common.LOG_WARN, 'CSS file does not exist: %s', cssPath);
					process.exit(1);
				}
				cssFile = cssPath.substring(cssPath.lastIndexOf('/') + 1);
				break;
			case '--format' :
			case '-f' :
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Did not specify an export format. Valid formats are: %s', JSON.stringify(validFormats));
					cliUsage();
					process.exit(1);
				}

				if (~process.argv[x].indexOf(',')) {
					formats = process.argv[x].split(',');
				} else {
					formats = [ process.argv[x] ];
				}

				formats.forEach(function (format) {
					if (!~validFormats.indexOf(format)) {
						common.log(common.LOG_WARN, 'Not a valid export format: %s. Valid formats are: %s', format, validFormats);
						cliUsage();
						process.exit(1);
					}
				});
				break;
			case '--output' :
			case '-o' :
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Specify an output path.');
					cliUsage();
					process.exit(1);
				}
				outputPath = process.argv[x];
				break;
			case '--platform':
			case '-p':
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Specify a platform.');
					cliUsage();
					process.exit(1);
				}
				searchPlatform = process.argv[x];
				if (!~common.VALID_PLATFORMS.indexOf(searchPlatform)) {
					common.log(common.LOG_WARN, 'Not a valid platform. Specify one of the following: %s', common.VALID_PLATFORMS);
					process.exit(1);
				}
				break;
			case '--start':
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Specify a version.');
					cliUsage();
					process.exit(1);
				}
				processedData.__startVersion = process.argv[x];
				try {
					nodeappc.version.gt(0.0, processedData.__startVersion);
				} catch (e) {
					common.log(common.LOG_ERROR, 'Not a valid version: %s', processedData.__startVersion);
					process.exit(1);
				}
				break;
			case '--end':
				if (++x > argc) {
					common.log(common.LOG_WARN, 'Specify a version.');
					cliUsage();
					process.exit(1);
				}
				processedData.__endVersion = process.argv[x];
				try {
					nodeappc.version.gt(0.0, processedData.__endVersion);
				} catch (e) {
					common.log(common.LOG_ERROR, 'Not a valid version: %s', processedData.__endVersion);
					process.exit(1);
				}
				break;
			case '--colorize':
			case '--exclude-external':
			case '-e':
			case '--stdout':
			case '--verbose':
			case '--version':
			case '-v' :
			case '--warn-inherited':
				common.log(common.LOG_WARN, 'This command-line flag or argument has been deprecated or has not been implemented: %s', process.argv[x]);
				if (~[ '-v', '--version' ].indexOf(process.argv[x])) {
					x++;
				}
				break;
			default:
				path = process.argv[x];
				if (fs.existsSync(path)) {
					basePaths.push(path);
				} else {
					common.log(common.LOG_WARN, 'Path does not exist: %s', path);
				}
				path = null;
		}
	}
}

if (~formats.indexOf('addon') && !searchPlatform) {
	common.log(common.LOG_ERROR, 'Specify a platform to extract with the -p option.');
	process.exit(1);
}

// Parse YAML files
originalPaths = originalPaths.concat(basePaths);
basePaths.push(apidocPath);
basePaths.forEach(function (basePath) {
	var key;
	common.log(common.LOG_INFO, 'Parsing YAML files in %s...', basePath);
	parseData = common.parseYAML(basePath);
	for (key in parseData.data) {
		errors.push(parseData.errors);
		if (assert(doc, key)) {
			common.log(common.LOG_WARN, 'Duplicate class found: %s', key);
			continue;
		}
		doc[key] = parseData.data[key];
		if (~originalPaths.indexOf(basePath)) {
			modules.push(key);
		}
	}
});

// Parse add-on docs and merge them with the base set
addOnDocs.forEach(function (basePath) {
	var key;
	parseData = null;
	common.log(common.LOG_INFO, 'Parsing YAML files in %s...', basePath);
	parseData = common.parseYAML(basePath);
	for (key in parseData.data) {
		errors.push(parseData.errors);
		if (assert(doc, key)) {
			common.log(common.LOG_INFO, 'Adding on to %s...', key);
			doc[key] = addOnMerge(doc[key], parseData.data[key]);
		} else {
			common.log(common.LOG_INFO, 'New class found in add-on docs: %s...', key);
			parseData.data[key].__addon = true;
			doc[key] = parseData.data[key];
		}
	}
});

// Process YAML files
common.log(common.LOG_INFO, 'Processing YAML data...');
processFirst.forEach(function (cls) {
	if (!assert(doc, cls)) {
		return;
	}
	processedData[cls] = processAPIs(doc[cls]);
});
skipList = skipList.concat(processFirst);
for (const key in doc) {
	if (~skipList.indexOf(key)) {
		continue;
	}
	processedData[key] = processAPIs(doc[key]);
}

formats.forEach(function (format) {

	// For changes format, make sure we have a start version and it's less than the end version if defined
	if (format === 'changes') {
		if (!processedData.__startVersion) {
			processedData.__startVersion = JSON.parse(fs.readFileSync(pathMod.join(apidocPath, '..', 'package.json'), 'utf8')).version;
		}
		if (processedData.__endVersion) {
			if (nodeappc.version.gt(processedData.__startVersion, processedData.__endVersion)) {
				common.log(common.LOG_ERROR, 'Skipping changes format.  Start version (%s) is greater than end version (%s).',
					processedData.__startVersion, processedData.__endVersion);
				return;
			}
		}
	}

	// Export data
	exporter = require('./lib/' + format + '_generator.js'); // eslint-disable-line security/detect-non-literal-require
	if (format === 'modulehtml') {
		processedData.__modules = modules;
	}
	if (searchPlatform) {
		processedData.__platform = searchPlatform;
	}
	exportData = exporter.exportData(processedData);
	templatePath = apidocPath + '/templates/';
	output = outputPath;
	mkdirDashP(output);

	common.log(common.LOG_INFO, 'Generating %s output...', format.toUpperCase());

	switch (format) {
		case 'addon':

			output = pathMod.join(outputPath, 'addon');
			if (!fs.existsSync(output)) {
				fs.mkdirSync(output);
			}
			templateStr = fs.readFileSync(templatePath + 'addon.ejs', 'utf8');
			for (const cls in exportData) {
				if (cls.indexOf('__') === 0) {
					continue;
				}
				render = yaml.safeDump(exportData[cls]);
				if (fs.writeFileSync(output + cls + '.yml', render) <= 0) {
					common.log(common.LOG_ERROR, 'Failed to write to file: %s', output + cls + '.yml');
				}
			}
			exportData.__copyList.forEach(function (file) {
				copyCommand = 'cp ' + file + ' ' + output;
				exec(copyCommand, function (error) {
					if (error !== null) {
						common.log(common.LOG_ERROR, 'Error copying file: %s (%s)', file, error);
					}
				});
			});
			common.log('Generated output at %s', output);
			break;
		case 'changes' :
			if (exportData.noResults) {
				common.log('No API changes found.');
				return;
			}
			output = pathMod.join(output, 'changes_' + exportData.startVersion.replace(/\./g, '_') + '.html');
			templateStr = fs.readFileSync(pathMod.join(templatePath, 'changes.ejs'), 'utf8');
			render = ejs.render(templateStr, { data: exportData, filename: 'changes.ejs', assert: common.assertObjectKey });
			break;
		case 'html' :
		case 'modulehtml' :

			let copyCommand;

			output = pathMod.join(outputPath, 'apidoc');

			if (!fs.existsSync(output)) {
				fs.mkdirSync(output);
			}

			if (cssFile) {
				fs.createReadStream(cssPath).pipe(fs.createWriteStream(pathMod.join(output, cssFile)));
			}
			const imgPath = pathMod.join(apidocPath, '/images');
			if (os.type() === 'Windows_NT') {
				copyCommand = `xcopy ${imgPath} ${output}`;
				copyCommand = copyCommand.replace(/\//g, '\\') + ' /s';
			} else {
				copyCommand = `cp -r ${imgPath} ${output}`;
			}

			exec(copyCommand, function (error) {
				if (error !== null) {
					common.log(common.LOG_ERROR, 'Error copying file: %s', error);
				}
			});

			for (const type in exportData) {
				if (type.indexOf('__') === 0) {
					continue;
				}
				templateStr = fs.readFileSync(templatePath + 'htmlejs/' + type + '.html', 'utf8');
				exportData[type].forEach(function (member) { // eslint-disable-line no-loop-func
					render = ejs.render(templateStr, { data: member, filename: templatePath + 'htmlejs/' + type + '.html', assert: common.assertObjectKey, css: cssFile });
					const filename = pathMod.join(output, `${member.filename}.html`);
					if (fs.writeFileSync(filename, render) <= 0) {
						common.log(common.LOG_ERROR, 'Failed to write to file: %s', filename);
					}
				});
			}

			if (format === 'modulehtml') {
				templateStr = fs.readFileSync(templatePath + 'htmlejs/moduleindex.html', 'utf8');
				render = ejs.render(templateStr, { filename: exportData.proxy[0].filename + '.html' });
			} else {
				templateStr = fs.readFileSync(templatePath + 'htmlejs/index.html', 'utf8');
				render = ejs.render(templateStr, { data: exportData, assert: common.assertObjectKey, css: cssFile });
			}
			output  = pathMod.join(output, 'index.html');
			break;
		case 'jsca' :
			render = JSON.stringify(exportData, null, '    ');
			output  = pathMod.join(outputPath, 'api.jsca');
			break;
		case 'json' :
			render = JSON.stringify(exportData, null, '    ');
			output = pathMod.join(outputPath, 'api.json');
			break;
		case 'jsduck' :
			templateStr = fs.readFileSync(templatePath + 'jsduck.ejs', 'utf8');
			render = ejs.render(templateStr, { doc: exportData }, { filename: templatePath + 'jsduck.ejs' });
			output = pathMod.join(outputPath, 'titanium.js');
			break;
		case 'parity' :
			templateStr = fs.readFileSync(templatePath + 'parity.ejs', 'utf8');
			render = ejs.render(templateStr, { apis: exportData }, { filename: templatePath + 'parity.ejs' });
			output = pathMod.join(outputPath, 'parity.html');
			break;
		case 'solr' :
			render = JSON.stringify(exportData, null, '    ');
			output = pathMod.join(outputPath, 'api_solr.json');
			break;
		case 'typescript':
			render = exportData;
			output = pathMod.join(outputPath, 'index.d.ts');
	}

	if (!~[ 'addon' ].indexOf(format)) {
		fs.writeFile(output, render, function (err) {
			if (err) {
				common.log(common.LOG_ERROR, 'Failed to write to file: %s with error: %s', output, err);
				process.exit(1);
			}
			common.log('Generated output at %s', output);
		});
	}
	exporter = exportData = null;

});
