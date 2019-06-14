/**
 * Script to export JSON to JSDuck comments
 */
'use strict';

const common = require('./common.js');
let doc = {};

/**
 * Convert API name to JSDuck-style link
 * @param {string} apiName api name
 * @return {string|null} jsduck style link to api name
 */
function convertAPIToLink(apiName) {
	if (apiName in doc) {
		return apiName;
	}

	if ((apiName.match(/\./g) || []).length) {
		const member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));
		if (!(cls in doc) && !apiName.startsWith('Modules.')) {
			common.log(common.LOG_WARN, 'Cannot find class: %s', cls);
			return null;
		}

		if (common.findAPI(doc, cls, member, 'properties')) {
			return cls + '#property-' + member;
		}
		if (common.findAPI(doc, cls, member, 'methods')) {
			return cls + '#method-' + member;
		}
		if (common.findAPI(doc, cls, member, 'events')) {
			return cls + '#event-' + member;
		}
	}
	if (!apiName.startsWith('Modules.')) {
		common.log(common.LOG_WARN, 'Cannot find API: %s', apiName);
	}
	return null;
}

/**
 * Scans converted markdown-to-html text for internal links and converts them to JSDuck-style syntax
 * @param {string} text markdown text
 * @return {string} markdown text with jsduck style links
 */
function convertLinks(text) {
	var matches = text.match(common.REGEXP_HREF_LINKS),
		tokens,
		replace,
		link;
	if (matches && matches.length) {
		matches.forEach(function (match) {
			tokens = common.REGEXP_HREF_LINK.exec(match);
			if (tokens && tokens[1].indexOf('http') !== 0 && !~match.indexOf('#')) {
				if ((link = convertAPIToLink(tokens[1]))) {
					replace = '{@link ' + link + ' ' + tokens[2] + '}';
					text = text.replace(tokens[0], replace);
				}
			}
		});
	}
	matches = text.match(common.REGEXP_CHEVRON_LINKS);
	if (matches && matches.length) {
		matches.forEach(function (match) {
			if (!common.REGEXP_HTML_TAG.exec(match) && !~match.indexOf(' ') && !~match.indexOf('/') && !~match.indexOf('#')) {
				tokens = common.REGEXP_CHEVRON_LINK.exec(match);
				if ((link = convertAPIToLink(tokens[1]))) {
					replace = '{@link ' + link + '}';
					text = text.replace(match, replace);
				}
			}
		});
	}
	return text;
}

/**
 * Convert markdown text to HTML
 * @param {string} text markdown text
 * @return {string} converted HTML-ified text
 */
function markdownToHTML(text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Export example field
 * @param {object} api api object
 * @return {string}
 */
function exportExamples(api) {
	let rv = '';
	if ('examples' in api && api.examples.length > 0) {
		rv += '<h3>Examples</h3>\n';
		api.examples.forEach(function (example) {
			if (example.title) {
				rv += '<h4>' + example.title + '</h4>\n';
			}
			let code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p>/g, '').replace(/<\/p>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv += code;
		});
	}
	return rv.replace('/*', '&#47;&#42;').replace('*/', '&#42;&#47;');
}

/**
 * Export deprecated field
 * @param {Object} api api object
 * @return {string}
 */
function exportDeprecated(api) {
	let rv = '';
	if ('deprecated' in api && api.deprecated) {
		if ('removed' in api.deprecated) {
			rv += '@removed ' + api.deprecated.removed;
		} else {
			rv += '@deprecated ' + api.deprecated.since;
		}
		if ('notes' in api.deprecated) {
			rv += ' ' + api.deprecated.notes;
		}
	}
	return rv;
}

/**
 * Export osver field
 * @param {Object} api api object
 * @return {string}
 */
function exportOSVer(api) {
	let rv = '';
	if ('osver' in api) {
		rv += '<p> <b>Requires:</b> \n';
		for (const key in api.osver) {
			if (Array.isArray(api.osver[key])) {
				rv += '<li> ' + common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].join(', ') + ' \n';
			} else {
				if ('min' in api.osver[key]) {
					rv += common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].min + ' and later \n';
				}
				if ('max' in api.osver[key]) {
					rv += common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].max + ' and earlier \n';
				}
			}
		}
		rv += '</p>\n';
	}
	return rv;
}

/**
 * Export constants field
 * @param {Object} api api object
 * @return {string}
 */
function exportConstants(api) {
	let rv = '';
	if ('constants' in api && api.constants && api.constants.length) {
		rv = '\n<p>This API can be assigned the following constants:<ul>\n';
		api.constants.forEach(function (constant) {
			rv += ' <li> {@link ' + convertAPIToLink(constant) + '}\n';
		});
		rv += '</ul></p>\n';
	}
	return rv;
}

/**
 * Export value field
 * @param {Object} api api object
 * @return {string}
 */
function exportValue(api) {
	if ('value' in api && api.value) {
		return '<p><b>Constant value:</b>' + api.value + '</p>\n';
	}
	return '';
}

/**
 * Export summary field
 * @param {Object} api api object
 * @return {string}
 */
function exportSummary(api) {
	if ('summary' in api && api.summary) {
		return markdownToHTML(api.summary);
	}
	return '';
}

/**
 * Export description field
 * @param {Object} api api object
 * @return {string}
 */
function exportDescription(api) {
	if ('description' in api && api.description) {
		return markdownToHTML(api.description);
	}
	return '';
}

/**
 * Export type field
 * @param {Object} api api object
 * @return {string}
 */
function exportType(api) {
	const rv = [];
	if ('type' in api && api.type) {
		let types = api.type;
		if (!Array.isArray(api.type)) {
			types = [ api.type ];
		}
		types.forEach(function (type) {
			if (type.indexOf('Array') === 0) {
				rv.push(exportType({ type: type.slice(type.indexOf('<') + 1, type.lastIndexOf('>')) }) + '[]');
			} else {
				rv.push(type);
			}
		});
	}
	if (rv.length > 0) {
		return rv.join('/');
	} else {
		return 'String';
	}
}

/**
 * Export method parameters or event properties field
 * This really just:
 * - tweaks the summary property to format the markdown and concatenate constants listing.
 * - normalizes the type property to be an Array of types
 * @param {Object[]} apis original parameters/properties
 * @return {object[]}
 */
function exportParams(apis) {
	const parameters = [];
	apis.forEach(function (member) {
	// 	let platforms = '';
		if (!('type' in member) || !member.type) {
			member.type = 'String';
		}
		if (!Array.isArray(member.type)) {
			member.type = [ member.type ];
		}
		// 	if ('platforms' in member) {
		// 		platforms = ' (' + member.platforms.join(' ') + ') ';
		// 	}
		// TODO Append the platform list to the summary!
		let summary = exportSummary(member);
		summary += exportConstants(member);
		member.summary = summary;
		parameters.push(member);
	});
	return parameters;
}

/**
 * Export method returns field
 * @param {Object} api api object
 * @return {string}
 */
function exportReturns(api) {
	let types = [],
		summary = '',
		constants = [],
		rv = 'void';

	if ('returns' in api && api.returns) {
		if (!Array.isArray(api.returns)) {
			api.returns = [ api.returns ];
		}
		api.returns.forEach(function (ret) {
			if (Array.isArray(ret.type)) {
				types = types.concat(ret.type);
			} else {
				types.push(ret.type || 'void');
			}

			if ('summary' in ret) {
				summary += ret.summary;
			}
			if ('constants' in ret) {
				constants = constants.concat(ret.constants);
			}
		});
		if (constants.length) {
			summary += exportConstants({ constants: constants });
		}
		rv = '{' + exportType({ type: types }) + '}' + summary;
	}
	return rv;

}

/**
 * Returns GitHub edit URL for current API file.
 * @param {Object} api api object
 * @return {string}
 */
function exportEditUrl(api) {
	const file = api.__file,
		blackList = [ 'appcelerator.https', 'ti.geofence' ]; // Don't include Edit button for these modules
	let rv = '',
		basePath = 'https://github.com/appcelerator/titanium_mobile/edit/master/';

	// Determine edit URL by file's folder location
	if (file.indexOf('titanium_mobile/apidoc') !== -1) {
		const startIndex = file.indexOf('apidoc/'),
			path = file.substr(startIndex);
		rv = basePath + path;
	} else if (file.indexOf('titanium_modules') !== -1 || file.indexOf('appc_modules') !== -1) {
		// URL template with placeholders for module name and path.
		const urlTemplate = 'https://github.com/appcelerator-modules/%MODULE_NAME%/edit/master/%MODULE_PATH%',
			re = /titanium_modules|appc_modules\/(.+)\/apidoc/,
			match = file.match(re);
		let modulename;
		if (match) {
			modulename = match[1];
			if (blackList.indexOf(modulename) !== -1) {
				return rv;
			}
		} else {
			common.log(common.LOG_ERROR, 'Error creating edit URL for: ', file, '. Couldn\'t find apidoc/ folder.');
			return rv;
		}

		const urlReplacements = {
			'%MODULE_NAME%': modulename,
			'%MODULE_PATH%': file.substr(file.indexOf('apidoc/') || 0)
		};
		rv = urlTemplate.replace(/%\w+%/g, function (all) {
			return urlReplacements[all] || all;
		});
	} else if (file.indexOf('titanium_mobile_tizen/modules/tizen/apidoc') !== -1) {
		let index = file.indexOf('modules/tizen/apidoc/');
		basePath = 'https://github.com/appcelerator/titanium_mobile_tizen/edit/master/';
		if (index !== -1) {
			rv = basePath + file.substr(index);
		} else {
			common.log(common.LOG_WARN, 'Error creating edit URL for:', file, '. Couldn\'t find apidoc/ folder.');
			return rv;
		}
	}

	return rv;
}

/**
 * Export member APIs
 * @param {Object} api api object
 * @param {Object} type type name
 * @return {object[]}
 */
function exportAPIs(api, type) {
	const rv = [];

	if (type in api) {
		for (let x = 0; x < api[type].length; x++) {
			const member = api[type][x];

			if ('__inherits' in member && member.__inherits !== api.name) {
				continue;
			}

			const annotatedMember = {
				name: member.name,
				summary: exportSummary(member),
				deprecated: exportDeprecated(member),
				osver: exportOSVer(member),
				description: exportDescription(member),
				examples: exportExamples(member),
				hide: member.__hide || false,
				since: (JSON.stringify(member.since) === JSON.stringify(api.since)) ? {} : member.since
			};

			switch (type) {
				case 'events':
					if ('Titanium.Event' in doc) {
						if (!('properties' in member) || !member.properties) {
							member.properties = [];
						}
						member.properties = member.properties.concat(doc['Titanium.Event'].properties);
					}
					annotatedMember.properties = exportParams(member.properties);
					break;
				case 'methods':
					if ('parameters' in member) {
						annotatedMember.parameters = exportParams(member.parameters);
					}
					if ('returns' in member) {
						annotatedMember.returns = exportReturns(member);
					}
					break;
				case 'properties':
					annotatedMember.availability = member.availability || null;
					annotatedMember.constants = exportConstants(member);
					// FIXME How can we handle setting empty string, false, or undefined as default values?
					if ('default' in member) {
						annotatedMember['default'] = member['default'];
					}
					annotatedMember.permission = member.permission || 'read-write';
					annotatedMember.type = exportType(member);
					annotatedMember.value = exportValue(member);
					break;
			}

			rv.push(annotatedMember);
		}

	}

	return rv;
}

/**
 * Returns a JSON object that can be applied to the JSDuck EJS template
 * @param {Object} apis full api tree
 * @return {object[]}
 */
exports.exportData = function exportJsDuck(apis) {
	const rv = [];
	doc = apis; // TODO make doc a field on a type, rather than this weird file-global!
	common.createMarkdown(doc);

	common.log(common.LOG_INFO, 'Annotating JSDuck-specific attributes...');

	for (const className in apis) {
		const cls = apis[className];
		const annotatedClass = {
			name: cls.name,
			extends: cls.extends || null,
			subtype: cls.__subtype,
			since: cls.since,
			summary: exportSummary(cls),
			deprecated: exportDeprecated(cls),
			osver: exportOSVer(cls),
			description: exportDescription(cls),
			examples: exportExamples(cls),
			events: exportAPIs(cls, 'events') || [],
			methods: exportAPIs(cls, 'methods') || [],
			properties: exportAPIs(cls, 'properties') || [],
			editurl: exportEditUrl(cls)
		};

		rv.push(annotatedClass);
	}
	return rv;
};
