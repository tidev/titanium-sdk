/**
 * Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to convert data to JSON format for third-party extensions
 */
'use strict';

const common = require('./common.js'),
	assert = common.assertObjectKey;
let doc = {};

/**
 * Convert API name to an HTML link
 * @param {string} apiName api name
 * @return {string} HTML-ified name. May be wrapped in code block, or in code block with link
 */
function convertAPIToLink(apiName) {
	if (~common.DATA_TYPES.indexOf(apiName) || apiName === 'void') {
		return '<code>' + apiName + '</code>';
	}

	let url = null;
	if (apiName in doc) {
		url = exportClassFilename(apiName) + '.html';
	} else if ((apiName.match(/\./g) || []).length) {
		const member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));

		if (!(cls in doc) && !apiName.startsWith('Modules.')) {
			common.log(common.LOG_WARN, 'Cannot find class: %s', cls);
			return apiName;
		} else if (common.findAPI(doc, cls, member, 'properties')) {
			url = cleanAPIName(apiName) + '-property.html';
		} else if (common.findAPI(doc, cls, member, 'methods')) {
			url = cleanAPIName(apiName) + '-method.html';
		} else if (common.findAPI(doc, cls, member, 'events')) {
			url = cleanAPIName(apiName) + '-event.html';
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
 * @param {string} text markdown text
 * @return {string}
 */
function convertLinks(text) {
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
 * @param {string} text markdown text
 * @return {string} HTML-ified text
 */
function markdownToHTML(text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Replace unsafe HMTL characters with dashes
 * @param {string} api api name
 * @return {string} replaced ':' with '-'
 */
function cleanAPIName(api) {
	return api.replace(/:/g, '-');
}

/**
 * Convert classname to filename
 * @param {string} name class name
 * @return {string|null} file basename for the class
 */
function exportClassFilename(name) {
	if (assert(doc, name)) {
		return (doc[name].__subtype === 'module') ? name + '-module' : name + '-object';
	}
	return null;
}

/**
 * Export deprecated field
 * @param {object} api api object
 * @return {object|null}
 */
function exportDeprecated(api) {
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
 * @param {object} api api object
 * @return {string} HTML-ified summary text
 */
function exportSummary(api) {
	let rv = '';
	if ('summary' in api && api.summary) {
		rv = api.summary;
	}
	return markdownToHTML(rv);
}

/**
 * Export examples field
 * @param {object} api api object
 * @return {object[]}
 */
function exportExamples(api) {
	const rv = [];
	if ('examples' in api && api.examples.length > 0) {
		api.examples.forEach(function (example) {
			let code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p>/g, '').replace(/<\/p>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv.push({ description: example.title, code: code });
		});
	}
	return rv;
}

/**
 * Export method parameters or event properties field
 * @param {object[]} apis api tree
 * @param {string} type type name
 * @param {string} filename file name
 * @return {object[]}
 */
function exportParams(apis, type, filename) {
	const rv = [];
	if (apis) {
		apis.forEach(function (member) {
			const annotatedMember = {};
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
		});
	}
	return rv;
}

/**
 * Export description field
 * @param {object} api api object
 * @return {string|null} HTML-ified description
 */
function exportDescription(api) {
	if ('description' in api && api.description) {
		return markdownToHTML(api.description);
	}
	return null;
}

/**
 * Export returns field
 * @param {object} api api object
 * @return {object|object[]}
 */
function exportReturnTypes(api) {
	const rv = [];
	if (assert(api, 'returns')) {
		if (!Array.isArray(api.returns)) {
			api.returns = [ api.returns ];
		}
		api.returns.forEach(function (ret) {
			const x = {};
			if (assert(ret, 'summary')) {
				x.summary = ret.summary;
			}
			x.type = ret.type;
			rv.push(x);
		});
	} else {
		rv.push({ type: 'void' });
	}
	if (rv.length === 1) {
		return rv[0];
	}
	return rv;
}

/**
 * Export since field
 * @param {object} api api object
 * @return {object[]}
 */
function exportPlatforms(api) {
	const rv = [];
	for (const platform in api.since) {
		rv.push({
			pretty_name: common.PRETTY_PLATFORM[platform],
			since: api.since[platform],
			name: platform
		});
	}
	return rv;
}

/**
 * Export members API
 * @param {object} api api object
 * @param {string} type type name
 * @return {object[]}
 */
function exportAPIs(api, type) {
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
 * @param {object[]} apis api tree
 * @return {object[]}
 */
exports.exportData = function exportJSON(apis) {
	const rv = {};
	doc = apis; // TODO make doc a field on a type, rather than this weird file-global!
	common.createMarkdown(doc);

	common.log(common.LOG_INFO, 'Annotating JSON-specific attributes...');

	for (const className in apis) {
		const cls = apis[className];
		const annotatedClass = {
			name: cls.name,
			summary: exportSummary(cls),
			deprecated: exportDeprecated(cls),
			events: exportAPIs(cls, 'events'),
			examples: exportExamples(cls),
			methods: exportAPIs(cls, 'methods'),
			extends: cls['extends'] || 'Object',
			properties: exportAPIs(cls, 'properties'),
			description: exportDescription(cls),
			platforms: exportPlatforms(cls),
			filename: exportClassFilename(cls),
			type: cls.__subtype || 'object',
			subtype: null
		};
		if (~[ 'proxy', 'view' ].indexOf(annotatedClass.type)) {
			annotatedClass.subtype = annotatedClass.type;
			annotatedClass.type = 'object';
		}

		rv[className] = annotatedClass;
	}
	return rv;
};
