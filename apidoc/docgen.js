/**
 * Script to preprocess the YAML docs in to a common JSON format,
 * then calls an generator script to format the API documentation.
 * Dependencies: node-appc ~0.2.14
 */

var common = require('./lib/common.js')
	nodeappc = require('node-appc'),
	fs = require('fs'),
	processedData = {},
	basePath = '.',
	format = 'html',
	output = '../dist/',
	doc = {},
	errors = [],
	exporter = '',
	processFirst = ['Titanium.Proxy', 'Titanium.Module', 'Titanium.UI.View'],
	formats = [],
	str = '',
	libPath = './lib',
	fsArray = [],
	tokens = [];

/**
 * Returns a list of inherited APIs.
 * @params api {Object} API object to extract inherited APIs
 * @returns {Object} Object containing all APIs for the API object
 */
function getInheritedAPIs (api) {

	var inheritedAPIs = { 'events': [], 'methods': [], 'properties': [] },
		key = null,
		removeAPIs = [],
		copyAPIs = [],
		match = [],
		index = 0,
		x = 0;

	if ('extends' in api && api.extends in doc) {
		inheritedAPIs = getInheritedAPIs(doc[api.extends]);
		for (key in inheritedAPIs) {
			removeAPIs = [];
			if (!key in api || !api[key]) continue;
			copyAPIs = nodeappc.util.mixObj([], api[key]);
			inheritedAPIs[key].forEach(function (inheritedAPI) {

				// See if current API overwrites inherited API
				match = copyAPIs.filter(function (element) {
					return element.name == inheritedAPI.name;
				});

				if (match.length) {
					removeAPIs.push(match[0]);
					// If the APIs came from the same class, do nothing
					if (match[0].__inherits == inheritedAPI.__inherits) return;

					// If the APIs are from different classes, override inherited API with current API
					index = inheritedAPIs[key].indexOf(inheritedAPI);
					for (property in match[0]) {
						inheritedAPIs[key][index][property] = match[0][property];
					}
					inheritedAPIs[key][index].__inherits = api.name;
				}

			});
			removeAPIs.forEach(function (element) {
				copyAPIs.splice(copyAPIs.indexOf(element), 1);
			});
			for (x = 0; x < copyAPIs.length; x++) {
				copyAPIs[x].__inherits = api.name;
			}
			inheritedAPIs[key] = inheritedAPIs[key].concat(copyAPIs);
		}

	} else {
		for (key in inheritedAPIs) {
			if (!key in api || !api[key]) continue;
			inheritedAPIs[key] = nodeappc.util.mixObj([], api[key]);
			for (x = 0; x < inheritedAPIs[key].length; x++) {
				inheritedAPIs[key][x].__inherits = api.name;
			}
		}
	}
	return inheritedAPIs;
}

/**
 * Returns a list of constants
 * @params api {Object} API to evaluate
 * @returns {Array<String>} List of constants the API supports
 */
function processConstants (api) {
	var rv = [];
	if ('constants' in api) {
		if (!Array.isArray(api.constants)) api.constants = [api.constants];
		api.constants.forEach(function (constant) {
			if (constant.charAt(constant.length - 1) == '*') {
				var prop = constant.split('.').pop(),
					prop = prop.substring(0, prop.length - 1),
					cls = constant.substring(0, constant.lastIndexOf('.'));
				if (cls in doc && 'properties' in doc[cls]) {
					doc[cls].properties.forEach(function (property) {
						if (property.name.indexOf(prop) == 0 && property.name.match(common.REGEXP_CONSTANTS)) rv.push(cls + '.' + property.name);
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
 * @params api {Object} API to evaluate
 * @params verions {Object} Possible plaforms and versions the API supports (usually from the class)
 * @returns {Object} Object containing plaforms and versions the API supports
 */
function processVersions (api, versions) {
	var defaultVersions = nodeappc.util.mixObj({}, versions),
		platform = null,
		key = null;
	if ('platforms' in api) {
		for (platform in defaultVersions) {
			if (!~api.platforms.indexOf(platform)) delete defaultVersions[platform];
		}
	} else if ('exclude-platforms' in api) {
		api['exclude-platforms'].forEach(function (platform) {
			if (platform in defaultVersions) delete defaultVersions[platform];
		});
	}
	if ('since' in api) {
		if (typeof api.since == 'string') {
			for (key in defaultVersions) {
				if (nodeappc.version.gt(api.since, defaultVersions[key])) defaultVersions[key] = api.since;
			}
		} else {
			for (key in defaultVersions) {
				if (nodeappc.version.gt(api.since[key], defaultVersions[key])) defaultVersions[key] = api.since[key];
			}
		}
	}
	return defaultVersions;
}

/**
 * Processes APIs based on the given list of platforms and versions
 * @params apis {Array<Object>} List of APIs to evaluate
 * @param type {String} Type of API
 * @params defaultVersions {Object} List of plaforms and versions the APIs support
 * @returns {Array<Object>} List of processed APIs
 */
function processAPIMembers (apis, type, defaultVersions) {
	var rv = [], x = 0;
	apis.forEach(function (api) {
		api.since = processVersions(api, defaultVersions);
		api.platforms = Object.keys(api.since);
		if (type == 'properties' && api.constants) api.constants = processConstants(api);
		if (type == 'events' && 'properties' in api) {
			for (x = 0; x < api.properties.length; x++) {
				if ('constants' in api.properties[x]) {
					api.properties[x].constants = processConstants(api.properties[x]);
				}
			}
		}
		if (type == 'methods') {
			if ('parameters' in api) {
				for (x = 0; x < api.parameters.length; x++) {
					if ('constants' in api.parameters[x]) {
						api.parameters[x].constants = processConstants(api.parameters[x]);
					}
				}
			}
			if ('returns' in api) {
				if (Array.isArray(api.returns)) api.returns = [api.returns];
				for (x = 0; x < api.returns.length; x++) {
					if ('constants' in api.returns[x]) {
						api.returns[x].constants = processConstants(api.returns[x]);
					}
				}
			}
		}
		if (api.platforms.length > 0) rv.push(api);
	});
	return rv;
}

/**
 * Hides APIs based on the excludes list
 * @params apis {Object} APIs to evaluate
 * @params type {String} Type of API, one of 'events', 'methods' or 'properties'
 * @returns {Array<Object>} Processed APIs
 */
function hideAPIMembers (apis, type) {
	if ('excludes' in apis && type in apis.excludes && type in apis) {
		apis[type].forEach(function (api) {
			apis[type][apis[type].indexOf(api)].__hide = (~apis.excludes[type].indexOf(api.name)) ? true : false;
		});
	}
	return apis;
}

/**
 * Generates accessors from the given list of properties
 * @param apis {Array<Object>} Array of property objects
 * @param className {String} Name of the class
 * @returns {Array<Object>} Array of methods
 */
function generateAccessors(apis, className) {
	var rv = [];
	apis.forEach(function (api) {

		if ('accessors' in api && api.accessors === false) return;

		// Generate getter
		if (!('permission' in api && api.permission == 'write-only') && !api.name.match(common.REGEXP_CONSTANTS)) {
			rv.push({
				'name': 'get' + api.name.charAt(0).toUpperCase() + api.name.slice(1),
				'summary': 'Gets the value of the <' + className + '.' + api.name + '> property.',
				'returns': { 'type': api.type },
				'__accessor': true,
				'__inherits': api.__inherits || null
			});
		}

		// Generate setter
		if (!('permission' in api && api.permission == 'read-only')) {
			rv.push({
				'name': 'set' + api.name.charAt(0).toUpperCase() + api.name.slice(1),
				'summary': 'Sets the value of the <' + className + '.' + api.name + '> property.',
				'parameters': [{
					'name': api.name,
					'summary': 'New value for the property.',
					'type': api.type
				}],
				'__accessor': true,
				'__inherits': api.__inherits || null
			});
		}
	});
	return rv;
}

/**
 * Returns a subtype based on the parent class
 * @param api {Object} Class object
 * @returns {String} Class's subtype
 */
function getSubtype (api) {
	switch (api.extends) {
		case 'Titanium.UI.View' :
			return 'view';
		case 'Titanium.Module' :
			return 'module';
		case 'Titanium.Proxy' :
			return 'proxy';
		default:
			if ('extends' in api) {
				return getSubtype(doc[api.extends]);
			} else {
				return 'pseudo';
			}
	}
}

function processAPIs (api) {
	var defaultVersions = nodeappc.util.mix({}, common.DEFAULT_VERSIONS),
		inheritedAPIs = {};

	// Generate list of supported platforms and versions
	api.since = processVersions(api, defaultVersions);
	api.platforms = Object.keys(api.since);

	// Get inherited APIs
	inheritedAPIs = getInheritedAPIs(api);
	for (var key in inheritedAPIs) {
		api[key] = inheritedAPIs[key];
	}

	api.subtype = (api.name.indexOf('Global') == 0) ? null : (api.name == 'Titanium.Module') ? 'module' : getSubtype(api);

	// Generate create method
	if ((api.subtype === 'view' || api.subtype === 'proxy') &&
		(('createable' in api && api.createable === true) ||
		!('createable' in api))) {

		var name = api.name,
			prop = name.split('.').pop(),
			cls = name.substring(0, name.lastIndexOf('.')),
			methodName = 'create' + prop;

		if (cls in doc) {
			var matches = [];
			if ('methods' in doc[cls]) {
				var matches = doc[cls].methods.filter(function (member) {
					return member.name == methodName;
				});
			}
			if (matches.length == 0) {
				var createMethod = {
					'name': methodName,
					'summary': 'Creates and returns an instance of <' + name + '>.\n',
					'deprecated': api.deprecated || null,
					'since': api.since,
					'platforms': api.platforms,
					'returns': { 'type': name },
					'parameters': [{
						'name': 'parameters',
						'summary': 'Properties to set on a new object, including any defined by <' + name + '> except those marked not-creation or read-only.\n',
						'type': 'Dictionary<' + name + '>',
						'optional': true
					}],
					'__creator': true
				};
				'methods' in doc[cls] ? doc[cls].methods.push(createMethod) : doc[cls].methods = [createMethod];
			}
		}
	}

	if ('events' in api) {
		api = hideAPIMembers(api, 'events');
		api.events = processAPIMembers(api.events, 'events', api.since);
	}

	if ('properties' in api ) {
		var accessors;
		api = hideAPIMembers(api, 'properties');
		api.properties = processAPIMembers(api.properties, 'properties', api.since);
		if (accessors = generateAccessors(api.properties, api.name)) {
			api.methods = ('methods' in api) ? api.methods.concat(accessors) : accessors;
		}
	}

	if ('methods' in api) {
		api = hideAPIMembers(api, 'methods');
		api.methods = processAPIMembers(api.methods, 'methods', api.since);
	}

	return api;
}

function cliUsage () {
	console.log('Usage: node docgen.js [--format <EXPORT_FORMAT>] [--output <OUTPUT_DIRECTORY>] [<PATH_TO_YAML_FILES>]'.white);
	console.log('\nOptions:'.white);
	console.log('\t--format, -f\tExport format: %s. Default is %s'.white, formats, format);
	console.log('\t--output, -o\tDirectory to output the files. Default is %s.'.white, output);
}

// Start of Main Flow
// Get a list of valid formats
libPath = process.argv[1].substring(0, process.argv[1].lastIndexOf('/'))  + '/lib';
fsArray = fs.readdirSync(libPath);
fsArray.forEach(function (file) {
	tokens = file.split('_');
	if (tokens[1] == 'generator.js') formats.push(tokens[0]);
});

// Check command arguments
if ((argc = process.argv.length) > 2) {
	for (var x = 2; x < argc; x++) {
		switch (process.argv[x]) {
			case '--help' :
				cliUsage();
				process.exit(0);
				break;
			case '--format' :
			case '-f' :
				if (++x > argc) {
					console.warn('Did not specify an export format. Valid formats are: %s'.yellow, formats);
					cliUsage();
					process.exit(1)
				}
				format = process.argv[x];
				if (!~formats.indexOf(format)) {
					console.warn('Not a valid export format: %s. Valid formats are: %s'.yellow, format, formats);
					cliUsage();
					process.exit(1)
				}
				break;
			case '--output' :
			case '-o' :
				if (++x > argc) {
					console.warn('Specify an output path.'.yellow);
					cliUsage();
					process.exit(1)
				}
				output = process.argv[x];
				break;
			default :
				if (x == argc - 1) {
					basePath = process.argv[x];
				} else {
					console.warn('Unknown option: %s'.yellow, process.argv[x]);
					cliUsage();
					process.exit(1);
				}
		}
	}
}

rv = common.parseYAML(basePath);
doc = rv.data;
errors = rv.errors;

processFirst.forEach(function (cls) {
	processedData[cls] = processAPIs(doc[cls]);
});
for (key in doc) {
	if (~processFirst.indexOf(key)) continue;
	processedData[key] = processAPIs(doc[key]);
}

exporter = require('./lib/' + format + '_generator.js');
str = exporter.exportData(processedData);

switch (format) {
	case 'jsduck' :
		output = output + 'titanium.js';
		break;
	default:
		;
}

fs.writeFile(output, str, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Generated output at %s".green, output);
    }
});

