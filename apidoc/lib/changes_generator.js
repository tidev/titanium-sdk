/**
 * Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 */
'use strict';

var common = require('./common.js'),
	assert = common.assertObjectKey,
	nodeappc = require('node-appc').version;
/**
 * Sort the array by API name
 * @param {object} a first array item to compare
 * @param {string} a.name name of the api in the first item
 * @param {object} b second array item to compare
 * @param {string} b.name name of the api in the second item
 * @return {number}
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
 * @param {string} str html string
 * @return {string} stripped value of the link
 */
function removeLinks (str) {
	var rv = str || '';
	rv = rv.replace(/<([^>]+?)>/g, '$1');
	rv = rv.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1'); // eslint-disable-line no-useless-escape
	rv = rv.replace(common.REGEXP_HREF_LINKS, '$2');
	return common.markdownToHTML(rv);
}

/**
 * Checks to see if the API is new, deprecated or removed within the versions.
 * @param {object} api api object
 * @param {string} startVersion start version
 * @param {string} endVersion end version
 * @param {string} className class name
 * @return {object}
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
		let pretty_platforms_string;
		const pretty_platforms = rv.platforms.map(function (item) {
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
			let versions = [];
			if (api.deprecated.removed instanceof Object) {
				for (let key in api.deprecated.removed) {
					versions.push(api.deprecated.removed[key]);
				}
			} else {
				versions.push(api.deprecated.removed);
			}
			for (let version of versions) {
				if (nodeappc.lte(startVersion, version)) {
					if (!endVersion || (endVersion && nodeappc.gt(endVersion, version))) {
						rv.removed = true;
						break;
					}
				}
			}
		}
		if (assert(api.deprecated, 'since')) {
			let versions = [];
			if (api.deprecated.since instanceof Object) {
				for (let key in api.deprecated.since) {
					versions.push(api.deprecated.since[key]);
				}
			} else {
				versions.push(api.deprecated.since);
			}
			for (let version of versions) {
				if (nodeappc.lte(startVersion, version)) {
					if (!endVersion || (endVersion && nodeappc.gt(endVersion, version))) {
						rv.deprecated = true;
						break;
					}
				}
			}
		}
		rv.name = className ? className + '.' + api.name : api.name;
		rv.summary = removeLinks(api.deprecated.notes);
	}

	return rv;
}

/**
 * Filters JSON data for APIs that were added, deprecated or removed.
 * @param {object} apis full api tree
 * @return {object}
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

	common.createMarkdown(apis);

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
			[ 'properties', 'methods', 'events' ].forEach(function (type) { // eslint-disable-line no-loop-func
				cls[type].forEach(function (member) { // eslint-disable-line no-loop-func
					if (member.__inherits !== className) {
						return;
					}
					const changed = checkVersions(member, startVersion, endVersion, className);
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
