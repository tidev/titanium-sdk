/**
 * Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to generate JSON-formmatted data for consumption by the SOLR indexer
 */
'use strict';

const common = require('./common.js'),
	assert = common.assertObjectKey,
	solr_category = 'platform';

/**
 * Replaces links with the label
 * @param {string} str HTML string
 * @return {string}
 */
function removeLinks (str) {
	let rv = str;
	rv = rv.replace(/<([^>]+?)>/g, '$1');
	rv = rv.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1'); // eslint-disable-line no-useless-escape
	rv = rv.replace(common.REGEXP_HREF_LINKS, '$2');
	return rv;
}

/**
 * Remove unwanted characters
 * @param {string} str raw string
 * @return {string} string stripped of newlines (converted to space)
 */
function cleanContent (str) {
	return str.replace(/\n/gm, ' ');
}

/**
 * Exports the deprecated field
 * @param {object} api api object
 * @return {string}
 */
function exportDeprecated (api) {
	let rv = '';
	if (assert(api, 'deprecated')) {
		if (assert(api.deprecated, 'since')) {
			rv += 'Deprecated since ' + api.deprecated.since + '. ';
		}
		if (assert(api.deprecated, 'removed')) {
			rv += 'Removed in ' + api.deprecated.removed + '. ';
		}
		if (assert(api.deprecated, 'notes')) {
			rv += api.deprecated.notes;
		}
	}
	return rv;
}

/**
 * Exports the summary field
 * @param {object} api api object
 * @return {string}
 */
function exportSummary (api) {
	let rv = '';
	if (assert(api, 'summary')) {
		rv = removeLinks(api.summary);
	}
	return rv;
}

/**
 * Exports the examples field
 * @param {object} api api object
 * @return {string}
 */
function exportExamples (api) {
	const rv = [];
	if (assert(api, 'examples')) {
		api.examples.forEach(function (example) {
			rv.push(example.title);
			rv.push(example.code);
		});
	}
	return rv.join(' ');
}

/**
 * Exports the type field
 * @param {object} api api object
 * @return {string}
 */
function exportType (api) {
	let rv = [];
	if (assert(api, 'type')) {
		if (!Array.isArray(api.type)) {
			api.type = [ api.type ];
		}
		api.type.forEach(function (t) {
			if (t.indexOf('Dictionary<') === 0) {
				rv = rv.concat(t.substring(t.indexOf('<'), t.lastIndexOf('>')).split(','));
			} else if (t.indexOf('Array<') === 0) {
				rv.push(t.substring(t.indexOf('<'), t.lastIndexOf('>')) + '[]');
			} else {
				rv.push(t);
			}
		});
	}
	return rv.join(' ');
}

/**
 * Exports the method parameters or event properties field
 * @param {object[]} apis api objects
 * @return {string}
 */
function exportParams (apis) {
	const rv = [];
	if (apis && apis.length > 0) {
		apis.forEach(function (member) {
			rv.push(member.name);
			rv.push(exportDeprecated(member));
			rv.push(exportSummary(member));
			rv.push(exportDescription(member));
			rv.push(exportType(member) || 'String');
		});
	}
	return rv.join(' ');
}

/**
 * Exports the description field
 * @param {object} api api object
 * @return {string}
 */
function exportDescription (api) {
	let rv = null;
	if (assert(api, 'description')) {
		rv = removeLinks(api.description);
	}
	return rv;
}

/**
 * Exports the returns field
 * @param {object} api api object
 * @return {string}
 */
function exportReturnType (api) {
	const rv = [];
	if (assert(api, 'returns')) {
		rv.push(exportType(api.returns));
		rv.push(exportSummary(api.returns));
	} else {
		rv.push('void');
	}
	return rv.join(' ');
}

/**
 * Removes the parent namespace and returns the member name
 * @param {string} name fully qualified type name
 * @return {string} base name of type
 */
function removeNamespace (name) {
	let rv = name;
	if (~name.indexOf('.')) {
		rv = name.slice(name.lastIndexOf('.') + 1);
	}
	return rv;
}

/**
 * Exports API members
 * @param {object} api api object
 * @param {string} type type name
 * @param {string} className class name
 * @return {object}
 */
function exportAPI(api, type, className) {
	const content = [];
	let url = api.name;

	if (className) {
		url = [ className, type, api.name ].join('-');
		content.push(className);
		api.name = className + '.' + api.name;
	} else {
		content.push(api.name);
	}

	content.push(removeNamespace(api.name));
	content.push(exportSummary(api));
	content.push(exportDeprecated(api));
	content.push(exportDescription(api));
	content.push(exportExamples(api));

	switch (type) {
		case 'method':
			content.push(exportReturnType(api));
			content.push(exportParams(api.parameters));
			break;
		case 'event':
			content.push(exportParams(api.properties));
	}

	const rv = {
		'id': url + '-' + solr_category,
		'url': url,
		'name': api.name,
		'type': solr_category,
		'content': cleanContent(content.join(' '))
	};
	return rv;
}

/**
 * Returns an array of JSON objects for the SOLR server
 * @param {object[]} apis api objects
 * @return {object[]}
 */
exports.exportData = function exportSOLR(apis) {
	const rv = [];

	common.log(common.LOG_INFO, 'Annotating SOLR-specific attributes...');

	for (const className in apis) {
		const cls = apis[className];
		rv.push(exportAPI(cls, 'class'));
		cls.properties.forEach(function (property) {
			if (property.__hide) {
				return;
			}
			rv.push(exportAPI(property, 'property', className));
		});
		cls.methods.forEach(function (method) {
			if (method.__hide) {
				return;
			}
			rv.push(exportAPI(method, 'method', className));
		});
		cls.events.forEach(function (event) {
			if (event.__hide) {
				return;
			}
			rv.push(exportAPI(event, 'event', className));
		});
	}
	return rv;
};
