/**
 * Copyright (c) 2015 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 */
var common = require('./common.js'),
	assert = common.assertObjectKey,
	nodeappc = require('node-appc').version;
/**
 * Sort the array by API name
 */
function arraySort (a, b) {
	if (a.name < b.name) {
		return -1;
	} else if (a.name > b.name) {
		return 1;
	}
	return 0;
}

/**
 * Replace links with the label
 */
function removeLinks (str) {
	var rv = str || '';
	rv = rv.replace(/<([^>]+?)>/g, '$1');
	rv = rv.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
	rv = rv.replace(common.REGEXP_HREF_LINKS, '$2');
	return common.markdownToHTML(rv);
}

/**
 * Checks to see if the API is new, deprecated or removed within the versions.
 */
function checkVersions(api, startVersion, endVersion, className) {
	var rv = {},
		platform;
	rv.platforms = [];
	for (platform in api.since) {
		if (nodeappc.lte(startVersion, api.since[platform])) {
			if (!endVersion || (endVersion && nodeappc.gt(endVersion, api.since[platform]))) {
				rv.platforms.push(platform);
			}
		}
	}
	if (rv.platforms.length > 0) {
		var pretty_platforms_string,
			pretty_platforms = rv.platforms.map(function (item) {
			return common.PRETTY_PLATFORM[item];
		});
		if (pretty_platforms.length > 1) {
			pretty_platforms_string = pretty_platforms.slice(0, -1).join(', ') + ' and ' + pretty_platforms.pop();
		} else {
			pretty_platforms_string = pretty_platforms[0];
		}
		if (rv.platforms.length === api.platforms.length) {
			api.summary += ' (New API, supported on ' + pretty_platforms_string + '.)';
		} else {
			api.summary += ' (Added support for ' + pretty_platforms_string + '.)';
		}
		rv.summary = removeLinks(api.summary);
		rv.name = className ? className + '.' + api.name : api.name;
	}

	if (assert(api, 'deprecated')) {
		if (assert(api.deprecated, 'removed')) {
			if (nodeappc.lte(startVersion, api.deprecated.removed)) {
				if (!endVersion || (endVersion && nodeappc.gt(endVersion, api.deprecated.removed))) {
					rv.removed = true;
				}
			}
		}
		if (nodeappc.lte(startVersion, api.deprecated.since)) {
			if (!endVersion || (endVersion && nodeappc.gt(endVersion, api.deprecated.since))) {
				rv.deprecated = true;
			}
		}
		rv.name = className ? className + '.' + api.name : api.name;
		rv.summary = removeLinks(api.deprecated.notes);
	}

	return rv;
}

/**
 * Filters JSON data for APIs that were added, deprecated or removed.
 */
exports.exportData = function exportChanges (apis) {
	var className = null,
		cls = {},
		rv = {
			new: [],
			deprecated: [],
			removed: [],
			noResults: true
		},
		startVersion = apis.__startVersion,
		endVersion = apis.__endVersion || null,
		changed = null;

	common.log(common.LOG_INFO, 'Checking API versions...');

	for (className in apis) {
		cls = apis[className];
		if (className.indexOf('__') === 0 || cls.__subtype === 'pseudo') {
			continue;
		}
		changed = checkVersions(cls, startVersion, endVersion);
		changed.type = 'object';

		if (changed.removed) {
			rv.removed.push(changed);
		} else if (changed.deprecated) {
			rv.deprecated.push(changed);
		} else if (changed.platforms.length > 0) {
			rv.new.push(changed);
		} else {
			['properties', 'methods', 'events'].forEach(function (type) {
				cls[type].forEach(function (member) {
					var changed;
					if (member.__inherits !== className) {
						return;
					}
					changed = checkVersions(member, startVersion, endVersion, className);
					changed.type = member.__subtype;
					if (changed.removed) {
						rv.removed.push(changed);
					} else if (changed.deprecated) {
						rv.deprecated.push(changed);
					} else if (changed.platforms.length > 0) {
						rv.new.push(changed);
					}
				});
			});
		}
		cls = {};
	}
	if (rv.new.length || rv.deprecated.length || rv.removed.length) {
		rv.noResults = false;
	}
	rv.new.sort(arraySort);
	rv.deprecated.sort(arraySort);
	rv.removed.sort(arraySort);
	rv.startVersion = startVersion;
	rv.endVersion = endVersion;
	return rv;
};
