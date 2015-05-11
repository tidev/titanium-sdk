/**
 * Copyright (c) 2015 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Script to convert JSON data for add-on YAML files.
 */

var common = require('./common.js'),
	doc = {};
/**
 * Scans description for special occurrences of the platform name.
 * @param {Object} api
 * @param {Object} className
 */
function scanDescription (api, className) {
	var regex = new RegExp('[\\#+|\\*+|On] ' + common.PRETTY_PLATFORM[doc.__platform], 'gm'),
		matches = [],
		name = null;
	if (common.assertObjectKey(api, 'description')) {
		matches = api.description.match(regex);
		if (matches && matches.length > 0) {
			name = (className) ? className + '.' + api.name : api.name;
			common.log(common.LOG_INFO, 'Possible platform-specific note in ' + name);
			// TODO: Create some fancy regex statements to extract platform-specific note sections
		}
	}
}

/**
 * Export API members
 * @param {Object} api
 * @param {Object} type
 */
function exportAPIs (api, type) {
	var rv = [],
		x = 0,
		member = {},
		annotatedMember = {};

	if (type in api) {
		for (x = 0; x < api[type].length; x++) {
			member = api[type][x];
			if (('__inherits' in member && member.__inherits !== api.name) ||
				(!~member.platforms.indexOf(doc.__platform)) ||
				member.__accessor || member.__creator) {
				continue;
			}
			if (member.platforms.length === 1) {
				for (var key in member) {
					if (key.indexOf('__') === 0) {
						continue;
					}
					annotatedMember[key] = member[key];
				}
				rv.push(annotatedMember);
			} else {
				annotatedMember.name = member.name;
				annotatedMember.platforms = [doc.__platform];
				if (member.since[doc.__platform] !== api.since[doc.__platform]) {
					annotatedMember.since = {};
					annotatedMember.since[doc.__platform] = member.since[doc.__platform];
				}
				scanDescription(member, api.name);
				rv.push(annotatedMember);
			}
			member = annotatedMember = {};
		}
	}

	return rv;
}

 /**
  * Returns a JSON object with annotated members for add-on YAML files
  * @param {Object} apis
  */
exports.exportData = function exportJSON (apis) {
	var className = null,
		cls = {},
		annotatedClass = {},
		rv = {'__copyList': []},
		copyList = [];
	doc = apis;

	common.log(common.LOG_INFO, 'Annotating YAML-specific attributes...');

	for (className in apis) {
		cls = apis[className];
		if (className.indexOf('__') === 0 || !~cls.platforms.indexOf(doc.__platform)) {
			continue;
		}
		if (cls.platforms.length > 1) {
			annotatedClass.name = cls.name;
			annotatedClass.platforms = [doc.__platform];
			if (cls.since[doc.__platform] !== common.DEFAULT_VERSIONS[doc.__platform]) {
				annotatedClass.since = {};
				annotatedClass.since[doc.__platform] = cls.since[doc.__platform];
			}
			scanDescription(cls);
			annotatedClass.events = exportAPIs(cls, 'events');
			annotatedClass.methods = exportAPIs(cls, 'methods');
			annotatedClass.properties = exportAPIs(cls, 'properties');
		} else {
			rv.__copyList.push(cls.__file);
		}

		rv[cls.name] = annotatedClass;
		cls = annotatedClass = {};
	}
	return rv;
};
