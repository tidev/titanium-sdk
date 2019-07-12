/**
 * Script to export JSON to HTML-annotated JSON for EJS templates
 */
'use strict';

const common = require('./common.js'),
	assert = common.assertObjectKey;
let doc = {},
	remoteURL = false;

/**
 * Sort the array by name
 * @param {Array} array original array
 * @return {Array} the sorted array
 */
function sortArray(array) {
	return array.sort(function (a, b) {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	});
}

/**
 * Replace unsafe HMTL characters with dashes
 * @param {string} api raw api name
 * @return {string} converted api name with ':' -> '-'
 */
function cleanAPIName(api) {
	return api.replace(/:/g, '-');
}

/**
 * Convert API name to an HTML link
 * @param {string} apiName original raw api name
 * @return {string} HTML-ified link to the api
 */
function convertAPIToLink(apiName) {
	let url = null;

	if (~common.DATA_TYPES.indexOf(apiName) || apiName === 'void') {
		return '<code>' + apiName + '</code>';
	} else if (apiName in doc) {
		if (remoteURL && !~doc.__modules.indexOf(apiName)) {
			url = 'https://docs.appcelerator.com/platform/latest/#!/api/' + apiName;
		} else {
			url = exportClassFilename(apiName) + '.html';
		}
	} else if ((apiName.match(/\./g) || []).length) {
		const member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));

		if (!(cls in doc) && !apiName.startsWith('Modules.')) {
			common.log(common.LOG_WARN, 'Cannot find class: %s, referenced by %s', cls, apiName);
			console.log(apiName);
			return apiName;
		} else {
			if (common.findAPI(doc, cls, member, 'properties')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'https://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-property-' + member;
					} else {
						url = exportClassFilename(cls) + '.html#' + cleanAPIName(member);
					}
				} else {
					url = cleanAPIName(apiName) + '-property.html';
				}
			}
			if (common.findAPI(doc, cls, member, 'methods')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'https://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-method-' + member;
					} else {
						url = exportClassFilename(cls) + '.html#' + cleanAPIName(member);
					}
				} else {
					url = cleanAPIName(apiName) + '-method.html';
				}
			}
			if (common.findAPI(doc, cls, member, 'events')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'https://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-event-' + member;
					} else {
						url = exportClassFilename(cls) + '.html#' + cleanAPIName(member);
					}
				} else {
					url = cleanAPIName(apiName) + '-event.html';
				}
			}
		}
	}

	if (url) {
		return '<code><a href="' + url + '">' + apiName + '</a></code>';
	}
	if (!apiName.startsWith('Modules.')) {
		common.log(common.LOG_WARN, 'Cannot find API: %s', apiName);
	}
	return apiName;
}

/**
 * Scans converted markdown-to-html text for internal links
 * @param {string} text  raw markdown/html
 * @return {string} converted links
 */
function convertLinks(text) {
	let matches = text.match(common.REGEXP_HREF_LINKS);
	if (matches && matches.length) {
		matches.forEach(function (match) {
			let tokens = common.REGEXP_HREF_LINK.exec(match);
			if (tokens && tokens[1].indexOf('http') !== 0 && !~match.indexOf('#')) {
				let link = convertAPIToLink(tokens[1]);
				if (link) {
					link = link.replace('>' + tokens[1] + '<', '>' + tokens[2] + '<');
					text = text.replace(match, link);
				}
			}
		});
	}
	matches = text.match(common.REGEXP_CHEVRON_LINKS);
	if (matches && matches.length) {
		matches.forEach(function (match) {
			if (!common.REGEXP_HTML_TAG.exec(match) && !~match.indexOf(' ') && !~match.indexOf('/') && !~match.indexOf('#')) {
				let tokens = common.REGEXP_CHEVRON_LINK.exec(match),
					link = convertAPIToLink(tokens[1]);
				if (link) {
					text = text.replace(match, link);
				}
			}
		});
	}
	return text;
}

/**
 * Convert markdown text to HTML
 * @param {string} text raw markdown text
 * @return {string} converted markdown to HTML
 */
function markdownToHTML(text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Convert class name to HTML filename
 * @param {Object} name raw class/api name
 * @return {string} URL of the target class name on our doc site
 */
function exportClassFilename(name) {
	if (assert(doc, name)) {
		if (remoteURL && !~doc.__modules.indexOf(name)) {
			return 'https://docs.appcelerator.com/platform/latest/#!/api/' + name;
		} else {
			return (doc[name].__subtype === 'module') ? name + '-module' : name + '-object';
		}
	}
	return null;
}

/**
 * Export the constants field
 * @param {Object} api api object
 * @return {string}
 */
function exportConstants(api) {
	let rv = '\n<p>This API can be assigned the following constants:<ul>\n';
	api.constants.forEach(function (constant) {
		rv += ' <li>' + convertAPIToLink(constant) + '</li>\n';
	});
	rv += '</ul></p>\n';
	return rv;
}

/**
 * Export the deprecated field
 * @param {Object} api api object
 * @return {object|boolean}
 */
function exportDeprecated(api) {
	if (!('deprecated' in api && api.deprecated)) {
		return false;
	}

	const rv = {};
	Object.keys(api.deprecated).forEach(function (key) {
		if (key === 'notes') {
			rv.notes = markdownToHTML(api.deprecated.notes);
		} else {
			rv[key] = api.deprecated[key];
		}
	});

	return rv;
}

/**
 * Export the fields for the API description
 * @param {Object} api api object
 * @return {string}
 */
function exportDescription(api) {
	let rv = '';
	if (assert(api, 'osver')) {
		rv += exportOSVer(api);
	}
	if (assert(api, 'description')) {
		rv += markdownToHTML(api.description);
	}
	if (assert(api, 'constants')) {
		rv += exportConstants(api);
	}
	return rv;
}

/**
 * Export the example field
 * @param {Object} api api object
 * @return {object[]}
 */
function exportExamples(api) {
	const rv = [];
	if (assert(api, 'examples')) {
		api.examples.forEach(function (example) {
			let code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p>/g, '').replace(/<\/p>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv.push({ title: example.title, code: code });
		});
	}
	return rv;
}

/**
 * Export the osver field
 * @param {Object} api api object
 * @return {string} HTML
 */
function exportOSVer(api) {
	let rv = '<p> <b>Requires:</b> \n';
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
		rv += '</p>\n';
	}
	return rv;
}

/**
 * Export the method parameters or event properties field
 * @param {object[]} apis list of api objects
 * @param {string} type member type
 * @return {object[]}
 */
function exportParams(apis, type) {
	const rv = [];

	if (apis) {
		apis.forEach(function (member) {
			const annotatedMember = {
				name: member.name,
				constants: member.constants || [],
				summary: exportSummary(member),
				type: exportType(member)
			};
			if (type === 'properties') {
				annotatedMember.deprecated = exportDeprecated(member);
			} else if (type === 'parameters') {
				if (assert(member, 'optional')) {
					annotatedMember.optional = true;
				}
				if (assert(member, 'repeatable')) {
					annotatedMember.repeatable = true;
				}
			}
			rv.push(annotatedMember);
		});
	}
	return rv;
}

/**
 * Export the parent of the class
 * @param {Object} api api object
 * @return {object}
 */
function exportParent(api) {
	const cls = api.name.substring(0, api.name.lastIndexOf('.'));
	if (cls !== '' && assert(doc, cls)) {
		return {
			name: cls,
			filename: exportClassFilename(doc[cls].name)
		};
	}
	return null;
}

/**
 * Export the platforms field
 * @param {Object} api api object
 * @return {object[]}
 */
function exportPlatforms(api) {
	const rv = [];
	if (!assert(api, 'since')) {
		api.since = common.DEFAULT_VERSIONS;
	}
	for (const key in api.since) {
		rv.push({
			name: key,
			pretty_name: common.PRETTY_PLATFORM[key],
			since: api.since[key]
		});
	}
	return rv;
}

/**
 * Export the children of the class
 * @param {Object} api api object
 * @return {object[]}
 */
function exportProxies(api) {
	const rv = [];
	Object.keys(doc).forEach(function (name) {
		if ((name.indexOf(api.name) === 0)
			&& (name !== api.name)
			&& (name.split('.').length - 1 === api.name.split('.').length)) {
			rv.push({
				name: doc[name].name,
				summary: exportSummary(doc[name]),
				deprecated: exportDeprecated(doc[name]),
				filename: exportClassFilename(name)
			});
		}
	});
	return rv;
}

/**
 * Export the returns field
 * @param {Object} api api Object
 * @return {string} HTML
 */
function exportReturnTypes(api) {
	let rv = 'void',
		constants = [];
	const types = [];
	if (assert(api, 'returns')) {
		if (!Array.isArray(api.returns)) {
			api.returns = [ api.returns ];
		}
		api.returns.forEach(function (ret) {
			types.push(exportType(ret));
			constants = constants.concat(ret.constants || []);
		});
		rv = types.join(' or ');
		if (constants.length > 0) {
			rv += '<ul>\n';
			constants.forEach(function (c) {
				rv += '<li>' + convertAPIToLink(c) + '</li>\n';
			});
			rv += '</ul>\n';
		}
	}
	return rv;
}

/**
 * Export the summary field
 * @param {Object} api api object
 * @return {string} HTML
 */
function exportSummary(api) {
	let rv = '';
	if ('summary' in api && api.summary) {
		rv += api.summary;
	}
	return markdownToHTML(rv);
}

/**
 * Export the type field
 * @param {Object} api api Object
 * @return {string[]}
 */
function exportType(api) {
	const rv = [];
	if (assert(api, 'type')) {
		if (!Array.isArray(api.type)) {
			api.type = [ api.type ];
		}
		api.type.forEach(function (t) {

			if (t.indexOf('Array<') === 0) {
				t = t.substring(t.indexOf('<') + 1, t.lastIndexOf('>'));
				if (t.indexOf('<')) {
					t = 'Array&lt;' + exportType({ type: t }) + '&gt;';
				} else {
					t = 'Array&lt;' + convertAPIToLink(t) + '&gt;';
				}
			} else if (t.indexOf('Callback<') === 0) {
				// Parse out the multiple types of args!
				const subTypes = t.substring(t.indexOf('<') + 1, t.lastIndexOf('>'));
				// split by ', ' then convert to link for each and join by ', '
				const linkified = subTypes.split(',').map(t => convertAPIToLink(t.trim())).join(', ');
				t = `Callback&lt;${linkified}&gt;`;
			} else if (t.indexOf('Dictionary<') === 0) {
				t = 'Dictionary&lt;' + convertAPIToLink(t.substring(t.indexOf('<') + 1, t.lastIndexOf('>'))) + '&gt;';
			} else {
				t = convertAPIToLink(t);
			}
			rv.push(t);
		});
	}

	if (rv.length <= 0) {
		rv.push('String');
	}
	return rv;
}

/**
 * Export the platform field
 * @param {Object} api api object
 * @return {object[]}
 */
function exportUserAgents(api) {
	const rv = [];
	for (const platform in api.since) {
		rv.push({ platform: platform });
	}
	return rv;
}

/**
 * Export the API members
 * @param {Object} api api object
 * @param {string} type member type
 * @return {object[]}
 */
function exportAPIs(api, type) {
	const rv = [];

	if (type in api) {
		for (let x = 0; x < api[type].length; x++) {
			const member = api[type][x];
			if (member.__hide) {
				continue;
			}

			const annotatedMember = {
				name: member.name,
				deprecated: exportDeprecated(member),
				description: exportDescription(member),
				examples: exportExamples(member),
				filename: api.name + '.' + cleanAPIName(member.name) + '-' + member.__subtype,
				parent: {
					name: api.name,
					filename: exportClassFilename(api.name)
				},
				platforms: exportPlatforms(member),
				summary: exportSummary(member),
				typestr: member.__subtype,
				inherits: (assert(member, '__inherits') && member.__inherits !== api.name) ? {
					name: member.__inherits,
					filename: exportClassFilename(member.__inherits)
				} : null
			};

			switch (type) {
				case 'events':
					if (assert(doc, 'Titanium.Event') && assert(member, 'properties')) {
						member.properties = member.properties.concat(doc['Titanium.Event'].properties);
					}
					annotatedMember.properties = exportParams(member.properties, 'properties');
					break;
				case 'methods':
					annotatedMember.parameters = exportParams(member.parameters, 'parameters');
					annotatedMember.returnType = exportReturnTypes(member);
					annotatedMember.accessor = member.__accessor || false;
					break;
				case 'properties':
					annotatedMember.availability = member.availability || null;
					annotatedMember.permission = member.permission || null;
					annotatedMember.type = exportType(member);
					break;
			}

			rv.push(annotatedMember);
		}
	}

	return rv;
}

/**
 * Returns a JSON object formatted for HTML EJS templates
 * @param {Object} apis full api tree
 * @return {object}
 */
exports.exportData = function exportHTML(apis) {
	const rv = {
		proxy: [],
		event: [],
		method: [],
		property: []
	};
	doc = apis;
	common.createMarkdown(doc);

	common.log(common.LOG_INFO, 'Annotating HTML-specific attributes...');

	if (assert(doc, '__modules')) {
		remoteURL = true;
	}

	for (const className in apis) {
		if (className.indexOf('__') === 0) {
			continue;
		}
		const cls = apis[className];
		const annotatedClass = {
			name: cls.name,
			summary: exportSummary(cls),
			description: exportDescription(cls),
			deprecated: exportDeprecated(cls),
			events: sortArray(exportAPIs(cls, 'events')),
			examples: exportExamples(cls),
			filename: exportClassFilename(cls.name),
			inherits: (assert(cls, 'extends')) ? {
				name: cls.extends,
				filename: exportClassFilename(cls.extends)
			} : null,
			methods: sortArray(exportAPIs(cls, 'methods')),
			parent: exportParent(cls),
			platforms: exportPlatforms(cls),
			properties: sortArray(exportAPIs(cls, 'properties')),
			proxies: sortArray(exportProxies(cls)),
			typestr: cls.__subtype,
			userAgents: exportUserAgents(cls)
		};

		rv.proxy.push(annotatedClass);
		rv.event = rv.event.concat(annotatedClass.events);
		rv.method = rv.method.concat(annotatedClass.methods);
		rv.property = rv.property.concat(annotatedClass.properties);

		if (~[ 'Global', 'Modules', 'Titanium' ].indexOf(cls.name)) {
			rv['__' + cls.name] = [ annotatedClass ].concat(annotatedClass.proxies);
		}
	}
	return rv;
};
