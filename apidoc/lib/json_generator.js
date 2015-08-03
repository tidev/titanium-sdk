/**
 * Copyright (c) 2015 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to convert data to JSON format for third-party extensions
 */
var common = require('./common.js'),
	assert = common.assertObjectKey,
	doc = {};

/**
 * Locates an API in the docs
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
 */
function convertAPIToLink (apiName) {
	var url = null;

	if (~common.DATA_TYPES.indexOf(apiName) || apiName === 'void') {
		return '<code>' + apiName + '</code>';
	} else if (apiName in doc) {
		url = exportClassFilename(apiName) + '.html';
	} else if ((apiName.match(/\./g) || []).length) {
		var member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));

		if (!(cls in doc)) {
			common.log(common.LOG_WARN, 'Cannot find class: %s', cls);
			return apiName;
		} else {
			if (findAPI(cls, member, 'properties')) {
				url = cleanAPIName(apiName) + '-property.html';
			} else if (findAPI(cls, member, 'methods')) {
				url = cleanAPIName(apiName) + '-method.html';
			} else if (findAPI(cls, member, 'events')) {
				url = cleanAPIName(apiName) + '-event.html';
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
 * Convert markdown to HTML
 */
function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Replace unsafe HMTL characters with dashes
 */
function cleanAPIName (api) {
	return api.replace(/:/g, '-');
}

/**
 * Convert classname to filename
 */
function exportClassFilename (name) {
	if (assert(doc, name)) {
		return (doc[name].__subtype === 'module') ? name + '-module' : name + '-object';
	}
	return null;
}

/**
 * Export deprecated field
 */
function exportDeprecated (api) {
	if ('deprecated' in api && api.deprecated) {
		return {
			notes_html: markdownToHTML(api.deprecated.notes || ''),
			notes: api.deprecated.notes || '',
			since: api.deprecated.since
		};
	}
	return null;
}

/**
 * Export summary field
 */
function exportSummary (api) {
	var rv = '';
	if ('summary' in api && api.summary) {
		rv = api.summary;
	}
	return markdownToHTML(rv);
}

/**
 * Export examples field
 */
function exportExamples (api) {
	var rv = [],
		code = null;
	if ('examples' in api && api.examples.length > 0) {
		api.examples.forEach(function (example) {
			code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p\>/g, '').replace(/<\/p\>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv.push({'description': example.title, 'code': code});
		});
	}
	return rv;
}

/**
 * Export method parameters or event properties field
 */
function exportParams (apis, type, filename) {
	var rv = [],
		annotatedMember = {};
	if (apis) {
		apis.forEach(function (member) {
			annotatedMember.name = member.name;
			annotatedMember.deprecated = exportDeprecated(member);
			annotatedMember.summary = exportSummary(member);
			annotatedMember.description = exportDescription(member);
			annotatedMember.type = member.type || 'String';
			if (type === 'properties') {
				annotatedMember.filename = filename.slice(0, filename.indexOf('-event')) + '.' + member.name + '-callback-property';
			}
			if (type === 'parameters') {
				annotatedMember.optional = member.optional || false;
				annotatedMember.filename = filename + '.' + member.name + '-param';
			}
			rv.push(annotatedMember);
			annotatedMember = {};
		});
	}
	return rv;
}

/**
 * Export description field
 */
function exportDescription (api) {
	var rv = null;
	if ('description' in api && api.description) {
		rv = markdownToHTML(api.description);
	}
	return rv;
}

/**
 * Export returns field
 */
function exportReturnTypes (api) {
	var rv = [];
	if (assert(api, 'returns')) {
		if (!Array.isArray(api.returns)) {
			api.returns = [api.returns];
		}
		api.returns.forEach(function (ret) {
			var x = {};
			if (assert(ret, 'summary')) {
				x.summary = ret.summary;
			}
			x.type = ret.type;
			rv.push(x);
		});
	} else {
		rv.push({'type': 'void'});
	}
	if (rv.length === 1) {
		return rv[0];
	}
	return rv;
}

/**
 * Export since field
 */
function exportPlatforms (api) {
	var rv = [], platform = null;
	for (platform in api.since) {
		rv.push({
			'pretty_name': common.PRETTY_PLATFORM[platform],
			'since': api.since[platform],
			'name': platform
		});
	}
	return rv;
}

/**
 * Export members API
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
			annotatedMember.summary = exportSummary(member);
			annotatedMember.description = exportDescription(member);
			annotatedMember.filename = api.name + '.' + cleanAPIName(member.name) + '-' + member.__subtype;
			annotatedMember.platforms = exportPlatforms(member);

			switch (type) {
				case 'events':
					if (member.properties) {
						if ('Titanium.Event' in doc) {
							member.properties = member.properties.concat(doc['Titanium.Event'].properties);
						}
						annotatedMember.properties = exportParams(member.properties, 'properties', annotatedMember.filename);
					}
					break;
				case 'methods':
					annotatedMember.examples = exportExamples(member);
					annotatedMember.parameters = exportParams(member.parameters, 'parameters', annotatedMember.filename);
					annotatedMember.returns = exportReturnTypes(member);
					break;
				case 'properties':
					annotatedMember.examples = exportExamples(member);
					annotatedMember.type = member.type || 'String';
					if (assert(member, 'availability')) {
						annotatedMember.availability = member.availability;
					}
					if (assert(member, 'default')) {
						annotatedMember['default'] = member['default'];
					}
					if (assert(member, 'optional')) {
						annotatedMember.optional = member.optional;
					}
					if (assert(member, 'permission')) {
						annotatedMember.permission = member.permission;
					}
					if (assert(member, 'value')) {
						annotatedMember.value = member.value;
					}
			}

			rv.push(annotatedMember);
			member = annotatedMember = {};
		}
	}

	return rv;
}

/**
 * Annotate JSON data for consumption by third-party tools
 */
exports.exportData = function exportJSON (apis) {
	var className = null,
		cls = {},
		annotatedClass = {},
		rv = {};
	doc = apis;

	common.log(common.LOG_INFO, 'Annotating JSON-specific attributes...');

	for (className in apis) {
		cls = apis[className];
		annotatedClass.name = cls.name;
		annotatedClass.summary = exportSummary(cls);
		annotatedClass.deprecated = exportDeprecated(cls);
		annotatedClass.events = exportAPIs(cls, 'events');
		annotatedClass.examples = exportExamples(cls);
		annotatedClass.methods = exportAPIs(cls, 'methods');
		annotatedClass['extends'] = cls['extends'] || 'Object';
		annotatedClass.properties = exportAPIs(cls, 'properties');
		annotatedClass.description = exportDescription(cls);
		annotatedClass.platforms = exportPlatforms(cls);
		annotatedClass.filename = exportClassFilename(cls);
		annotatedClass.type = cls.__subtype || 'object';
		annotatedClass.subtype = null;
		if (~['proxy', 'view'].indexOf(annotatedClass.type)) {
			annotatedClass.subtype = annotatedClass.type;
			annotatedClass.type = 'object';
		}

		rv[className] = annotatedClass;
		cls = annotatedClass = {};
	}
	return rv;
};
