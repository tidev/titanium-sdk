/**
 * Script to export JSON to HTML-annotated JSON for EJS templates
 */
var common = require('./common.js'),
	assert = common.assertObjectKey,
	doc = {},
	remoteURL = false;

/**
 * Sort the array by name
 * @param {Array} array
 */
function sortArray (array) {
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
 * @param {string} api
 */
function cleanAPIName (api) {
	return api.replace(/:/g, '-');
}

/**
 * Find the API in the docs
 * @param {Object} className
 * @param {Object} memberName
 * @param {Object} type
 */
function findAPI (className, memberName, type) {
	var cls = doc[className],
		x = 0;

	if (cls && type in cls && cls[type]) {
		for (x = 0; x < cls[type].length; x++) {
			if (cls[type][x].name === memberName) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Convert API name to an HTML link
 * @param {string} apiName
 */
function convertAPIToLink (apiName) {
	var url = null;

	if (~common.DATA_TYPES.indexOf(apiName) || apiName === 'void') {
		return '<code>' + apiName + '</code>';
	} else if (apiName in doc) {
		if (remoteURL && !~doc.__modules.indexOf(apiName)) {
			url = 'http://docs.appcelerator.com/platform/latest/#!/api/' + apiName;
		} else {
			url = exportClassFilename(apiName) + '.html';
		}
	} else if ((apiName.match(/\./g) || []).length) {
		var member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));

		if (!(cls in doc)) {
			common.log(common.LOG_WARN, 'Cannot find class: %s', cls);
			return apiName;
		} else {
			if (findAPI(cls, member, 'properties')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'http://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-property-' + member;
					} else {
						url = exportClassFilename(cls) + '.html#' + cleanAPIName(member);
					}
				} else {
					url = cleanAPIName(apiName) + '-property.html';
				}
			}
			if (findAPI(cls, member, 'methods')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'http://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-method-' + member;
					} else {
						url = exportClassFilename(cls) + '.html#' + cleanAPIName(member);
					}
				} else {
					url = cleanAPIName(apiName) + '-method.html';
				}
			}
			if (findAPI(cls, member, 'events')) {
				if (remoteURL) {
					if (!~doc.__modules.indexOf(cls)) {
						url = 'http://docs.appcelerator.com/platform/latest/#!/api/' + cls + '-event-' + member;
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
	common.log(common.LOG_WARN, 'Cannot find API: %s', apiName);
	return apiName;
}

/**
 * Scans converted markdown-to-html text for internal links
 * @param {string} text
 */
function convertLinks (text) {
	var matches = text.match(common.REGEXP_HREF_LINKS),
		tokens,
		link;
	if (matches && matches.length) {
		matches.forEach(function (match) {
			tokens = common.REGEXP_HREF_LINK.exec(match);
			if (tokens && tokens[1].indexOf('http') !== 0 && !~match.indexOf('#')) {
				if ((link = convertAPIToLink(tokens[1]))) {
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
				tokens = common.REGEXP_CHEVRON_LINK.exec(match);
				if ((link = convertAPIToLink(tokens[1]))) {
					text = text.replace(match, link);
				}
			}
		});
	}
	return text;
}

/**
 * Convert markdown text to HTML
 * @param {string} text
 */
function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Convert class name to HTML filename
 * @param {Object} name
 */
function exportClassFilename (name) {
	if (assert(doc, name)) {
		if (remoteURL && !~doc.__modules.indexOf(name)) {
			return 'http://docs.appcelerator.com/platform/latest/#!/api/' + name;
		} else {
			return (doc[name].__subtype === 'module') ? name + '-module' : name + '-object';
		}
	}
	return null;
}

/**
 * Export the constants field
 * @param {Object} api
 */
function exportConstants (api) {
	var rv = '';
	rv = '\n<p>This API can be assigned the following constants:<ul>\n';
	api.constants.forEach(function (constant) {
		rv += ' <li>' + convertAPIToLink(constant) + '</li>\n';
	});
	rv += '</ul></p>\n';
	return rv;
}

/**
 * Export the deprecated field
 * @param {Object} api
 */
function exportDeprecated (api) {
	var rv = {};
	if (!('deprecated' in api && api.deprecated)) {
		return false;
	} else {
		Object.keys(api.deprecated).forEach(function (key) {
			if (key === 'notes') {
				rv.notes = markdownToHTML(api.deprecated.notes);
			} else {
				rv[key] = api.deprecated[key];
			}
		});
	}
	return rv;
}

/**
 * Export the fields for the API description
 * @param {Object} api
 */
function exportDescription (api) {
	var rv = '';
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
 * @param {Object} api
 */
function exportExamples (api) {
	var rv = [],
		code = null;
	if (assert(api, 'examples')) {
		api.examples.forEach(function (example) {
			code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p\>/g, '').replace(/<\/p\>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv.push({'title': example.title, 'code': code});
		});
	}
	return rv;
}

/**
 * Export the osver field
 * @param {Object} api
 */
function exportOSVer (api) {
	var rv = '';
	rv += '<p> <b>Requires:</b> \n';
	for (var key in api.osver) {
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
 * @param {Object} apis
 * @param {string} type
 */
function exportParams (apis, type) {
	var rv = [],
		annotatedMember = {};
	if (apis) {
		apis.forEach(function (member) {
			annotatedMember.name = member.name;
			annotatedMember.constants = member.constants || [];
			if (type === 'properties') {
				annotatedMember.deprecated = exportDeprecated(member);
			}
			annotatedMember.summary = exportSummary(member);
			annotatedMember.type = exportType(member);
			if (type === 'parameters') {
				if (assert(member, 'optional')) {
					annotatedMember.optional = true;
				}
				if (assert(member, 'repeatable')) {
					annotatedMember.repeatable = true;
				}
			}
			rv.push(annotatedMember);
			annotatedMember = {};
		});
	}
	return rv;
}

/**
 * Export the parent of the class
 * @param {Object} api
 */
function exportParent(api) {
	var rv = null,
		cls = api.name.substring(0, api.name.lastIndexOf('.'));
	if (cls !== '' && assert(doc, cls)) {
		rv = {
			'name': cls,
			'filename': exportClassFilename(doc[cls].name)
		};
	}
	return rv;
}

/**
 * Export the platforms field
 * @param {Object} api
 */
function exportPlatforms (api) {
	var rv = [],
		key = null;
	if (!assert(api, 'since')) {
		api.since = common.DEFAULT_VERSIONS;
	}
	for (key in api.since) {
		rv.push({
			name: key,
			'pretty_name': common.PRETTY_PLATFORM[key],
			since: api.since[key]
		});
	}
	return rv;
}

/**
 * Export the children of the class
 * @param {Object} api
 */
function exportProxies (api) {
	var rv = [];
	Object.keys(doc).forEach(function (name) {
		if ((name.indexOf(api.name) === 0) &&
			(name !== api.name) &&
			(name.split('.').length - 1 === api.name.split('.').length)) {
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
 * @param {Object} api
 */
function exportReturnTypes (api) {
	var rv = 'void',
		types = [],
		constants = [];
	if (assert(api, 'returns')) {
		if (!Array.isArray(api.returns)) {
			api.returns = [api.returns];
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
 * @param {Object} api
 */
function exportSummary (api) {
	var rv = '';
	if ('summary' in api && api.summary) {
		rv += api.summary;
	}
	return markdownToHTML(rv);
}

/**
 * Export the type field
 * @param {Object} api
 */
function exportType (api) {
	var rv = [];
	if (assert(api, 'type')) {
		if (!Array.isArray(api.type)) {
			api.type = [api.type];
		}
		api.type.forEach(function (t) {

			if (t.indexOf('Array<') === 0) {
				t = t.substring(t.indexOf('<') + 1, t.lastIndexOf('>'));
				if (t.indexOf('<')) {
					t = 'Array&lt;' + exportType({type: t}) + '&gt;';
				} else {
					t = 'Array&lt;' + convertAPIToLink(t) + '&gt;';
				}
			} else if (t.indexOf('Callback<') === 0) {
				t = 'Callback&lt;' + convertAPIToLink(t.substring(t.indexOf('<') + 1, t.lastIndexOf('>'))) + '&gt;';
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
 * @param {Object} api
 */
function exportUserAgents (api) {
	var rv = [],
		platform = null;
	for (platform in api.since) {
		rv.push({'platform': platform});
	}
	return rv;
}

/**
 * Export the API members
 * @param {Object} api
 * @param {string} type
 */
function exportAPIs (api, type) {
	var rv = [],
		x = 0,
		member = {},
		annotatedMember = {};

	if (type in api) {
		for (x = 0; x < api[type].length; x++) {
			member = api[type][x];
			if (member.__hide) {
				continue;
			}

			annotatedMember.name = member.name;
			annotatedMember.deprecated = exportDeprecated(member);
			annotatedMember.description = exportDescription(member);
			annotatedMember.examples = exportExamples(member);
			annotatedMember.filename = api.name + '.' + cleanAPIName(member.name) + '-' + member.__subtype;
			annotatedMember.parent = {
				name: api.name,
				filename: exportClassFilename(api.name)
			};
			annotatedMember.platforms = exportPlatforms(member);
			annotatedMember.summary = exportSummary(member);
			annotatedMember.typestr = member.__subtype;
			annotatedMember.inherits = (assert(member, '__inherits') && member.__inherits !== api.name) ? {
				name: member.__inherits,
				filename: exportClassFilename(member.__inherits)
			} : null;

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
			member = annotatedMember = {};
		}
	}

	return rv;
}

/**
 * Returns a JSON object formatted for HTML EJS templates
 * @param {Object} apis
 */
exports.exportData = function exportHTML (apis) {
	var className = null,
		cls = {},
		annotatedClass = {},
		rv = {
			'proxy': [],
			'event': [],
			'method': [],
			'property': []
		};
	doc = apis;

	common.log(common.LOG_INFO, 'Annotating HTML-specific attributes...');

	if (assert(doc, '__modules')) {
		remoteURL = true;
	}

	for (className in apis) {
		if (className.indexOf('__') === 0) {
			continue;
		}
		cls = apis[className];
		annotatedClass.name = cls.name;
		annotatedClass.summary = exportSummary(cls);
		annotatedClass.description = exportDescription(cls);
		annotatedClass.deprecated = exportDeprecated(cls);
		annotatedClass.events = sortArray(exportAPIs(cls, 'events'));
		annotatedClass.examples = exportExamples(cls);
		annotatedClass.filename = exportClassFilename(cls.name);
		annotatedClass.inherits = (assert(cls, 'extends')) ? {
			name: cls.extends,
			filename: exportClassFilename(cls.extends)
		} : null;
		annotatedClass.methods = sortArray(exportAPIs(cls, 'methods'));
		annotatedClass.parent = exportParent(cls);
		annotatedClass.platforms = exportPlatforms(cls);
		annotatedClass.properties = sortArray(exportAPIs(cls, 'properties'));
		annotatedClass.proxies = sortArray(exportProxies(cls));
		annotatedClass.typestr = cls.__subtype;
		annotatedClass.userAgents = exportUserAgents(cls);

		rv.proxy.push(annotatedClass);
		rv.event = rv.event.concat(annotatedClass.events);
		rv.method = rv.method.concat(annotatedClass.methods);
		rv.property = rv.property.concat(annotatedClass.properties);

		if (~['Global', 'Modules', 'Titanium'].indexOf(cls.name)) {
			rv['__' + cls.name] = [annotatedClass].concat(annotatedClass.proxies);
		}

		cls = annotatedClass = {};
	}
	return rv;
};
