/**
 * Copyright (c) 2015 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to generate JSON-formmatted data for consumption by the SOLR indexer
 */
var common = require('./common.js'),
	assert = common.assertObjectKey,
	solr_category = 'platform';

/**
 * Replaces links with the label
 */
function removeLinks (str) {
	var rv = str;
	rv = rv.replace(/<([^>]+?)>/g, '$1');
	rv = rv.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
	rv = rv.replace(common.REGEXP_HREF_LINKS, '$2');
	return rv;
}

/**
 * Remove unwanted characters
 */
function cleanContent (str) {
	var rv = str;
	rv = rv.replace(/\n/gm, ' ');
	return rv;
}

/**
 * Exports the deprecated field
 */
function exportDeprecated (api) {
	var rv = '';
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
 */
function exportSummary (api) {
	var rv = '';
	if (assert(api, 'summary')) {
		rv = removeLinks(api.summary);
	}
	return rv;
}

/**
 * Exports the examples field
 */
function exportExamples (api) {
	var rv = [];
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
 */
function exportType (api) {
	var rv = [];
	if (assert(api, 'type')) {
		if (!Array.isArray(api.type)) {
			api.type = [api.type];
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
 */
function exportParams (apis) {
	var rv = [];
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
 */
function exportDescription (api) {
	var rv = null;
	if (assert(api, 'description')) {
		rv = removeLinks(api.description);
	}
	return rv;
}

/**
 * Exports the returns field
 */
function exportReturnType (api) {
	var rv = [];
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
 */
function removeNamespace (name) {
	var rv = name;
	if (~name.indexOf('.')) {
		rv = name.slice(name.lastIndexOf('.') + 1);
	}
	return rv;
}

/**
 * Removes the member name and returns the parent namespace
 */
function removeMemberName (name) {
	var rv = name;
	if (~name.indexOf('.')) {
		rv = name.slice(0, name.IndexOf('.'));
	}
	return rv;
}

/**
 * Exports API members
 */
function exportAPI (api, type, className) {
	var rv = {},
		content = [],
		url = api.name;

	if (className) {
		url = [className, type, api.name].join('-');
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

	rv = {
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
 */
exports.exportData = function exportSOLR (apis) {
	var className = null,
		cls = {},
		rv = [];

	common.log(common.LOG_INFO, 'Annotating SOLR-specific attributes...');

	for (className in apis) {
		cls = apis[className];
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
		cls = {};
	}
	return rv;
};
