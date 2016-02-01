/**
 * Script to export JSON to JSDuck comments
 */
var common = require('./common.js'),
	doc = {};

/**
 * Locate API in docs
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
 * Convert API name to JSDuck-style link
 */
function convertAPIToLink (apiName) {
	if (apiName in doc) {
		return apiName;
	} else if ((apiName.match(/\./g) || []).length) {
		var member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));
		if (!(cls in doc)) {
			common.log(common.LOG_WARN, 'Cannot find class: %s', cls);
			return null;
		} else {
			if (findAPI(cls, member, 'properties')) {
				return cls + '#property-' + member;
			}
			if (findAPI(cls, member, 'methods')) {
				return cls + '#method-' + member;
			}
			if (findAPI(cls, member, 'events')) {
				return cls + '#event-' + member;
			}
		}
	}
	common.log(common.LOG_WARN, 'Cannot find API: %s', apiName);
	return null;
}

/**
 * Scans converted markdown-to-html text for internal links and converts them to JSDuck-style syntax
 */
function convertLinks (text) {
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
 */
function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Export example field
 */
function exportExamples (api) {
	var rv = '',
		code = '';
	if ('examples' in api && api.examples.length > 0) {
		rv += '<h3>Examples</h3>\n';
		api.examples.forEach(function (example) {
			if (example.title) {
				rv += '<h4>' + example.title + '</h4>\n';
			}
			code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p\>/g, '').replace(/<\/p\>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv += code;
		});
	}
	return rv.replace('/*', '&#47;&#42;').replace('*/', '&#42;&#47;');
}

/**
 * Export deprecated field
 * @param {Object} api
 */
function exportDeprecated (api) {
	var rv = '';
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
 * @param {Object} api
 */
function exportOSVer (api) {
	var rv = '';
	if ('osver' in api) {
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
		}
		rv += '</p>\n';
	}
	return rv;
}

/**
 * Export constants field
 * @param {Object} api
 */
function exportConstants (api) {
	var rv = '';
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
 * @param {Object} api
 */
function exportValue (api) {
	if ('value' in api && api.value) {
		return '<p><b>Constant value:</b>' + api.value + '</p>\n';
	}
	return '';
}

/**
 * Export summary field
 * @param {Object} api
 */
function exportSummary (api) {
	if ('summary' in api && api.summary) {
		return markdownToHTML(api.summary);
	}
	return '';
}

/**
 * Export description field
 * @param {Object} api
 */
function exportDescription (api) {
	if ('description' in api && api.description) {
		return markdownToHTML(api.description);
	}
	return '';
}

/**
 * Export type field
 * @param {Object} api
 */
function exportType (api) {
	var rv = [];
	if ('type' in api && api.type) {
		var types = api.type;
		if (!Array.isArray(api.type)) {
			types = [api.type];
		}
		types.forEach(function (type) {
			if (type.indexOf('Array') === 0) {
				rv.push(exportType({'type': type.slice(type.indexOf('<') + 1, type.lastIndexOf('>'))}) + '[]');
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
 * @param {Object} apis
 */
function exportParams (apis) {
	var rv = [],
		str = '';
	apis.forEach(function (member) {
		var platforms = '',
			optional = '';
		str = '';
		if (!('type' in member) || !member.type) {
			member.type = 'String';
		}
		if (!Array.isArray(member.type)) {
			member.type = [member.type];
		}
		if ('platforms' in member) {
			platforms = ' (' + member.platforms.join(' ') + ') ';
		}
		if ('optional' in member && member.optional === true) {
			optional += ' (optional)';
		}
		str += '{' +  member.type.join('/') + '} ' + platforms + member.name + optional + '\n';
		str += exportSummary(member);
		str += exportConstants(member);
		rv.push(str);
	});
	return rv;
}

/**
 * Export method returns field
 * @param {Object} api
 */
function exportReturns (api) {
	var types = [],
		summary = '',
		constants = [],
		rv = 'void';

	if ('returns' in api && api.returns) {
		if (!Array.isArray(api.returns)) {
			api.returns = [api.returns];
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
			summary += exportConstants({'constants': constants});
		}
		rv = '{' + exportType({'type': types}) + '}' + summary;
	}
	return rv;

}

/**
 * Export default field
 * @param {Object} api
 */
function exportDefault (api) {
	if ('default' in api && api['default'] !== 'undefined') {
		if (typeof api['default'] === 'string') {
			return convertLinks(api['default']);
		} else {
			return api['default'];
		}
	}
	return '';
}

/**
 * Returns GitHub edit URL for current API file.
 * @param {Object} api
 */
function exportEditUrl (api) {
	var file = api.__file;
	var rv = '';
	var blackList = ['appcelerator.https', 'ti.geofence']; // Don't include Edit button for these modules
	var modulename, modulepath;
	var basePath = 'https://github.com/appcelerator/titanium_mobile/edit/master/';
	var index = 0;

	// Determine edit URL by file's folder location
	if (file.indexOf('titanium_mobile/apidoc') !== -1) {
		var startIndex = file.indexOf('apidoc/'),
			path = file.substr(startIndex);
		rv = basePath + path;
	} else if (file.indexOf('titanium_modules') !== -1 || file.indexOf('appc_modules') !== -1) {
		// URL template with placeholders for module name and path.
		var urlTemplate = 'https://github.com/appcelerator-modules/%MODULE_NAME%/edit/master/%MODULE_PATH%';
		var re = /titanium_modules|appc_modules\/(.+)\/apidoc/;
		var match = file.match(re);
		if (match) {
			modulename = match[1];
			if (blackList.indexOf(modulename) !== -1) {
				return rv;
			}
		} else {
			common.log(common.LOG_ERROR, 'Error creating edit URL for: ', file, '. Couldn\'t find apidoc/ folder.');
			return rv;
		}

		var urlReplacements = {
			'%MODULE_NAME%': modulename,
			'%MODULE_PATH%': file.substr(file.indexOf('apidoc/') || 0)
		};
		rv = urlTemplate.replace(/%\w+%/g, function (all) {
			return urlReplacements[all] || all;
		});
	} else if (file.indexOf('titanium_mobile_tizen/modules/tizen/apidoc') !== -1) {
		index = file.indexOf('modules/tizen/apidoc/');
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
 * @param {Object} api
 * @param {Object} type
 */
function exportAPIs (api, type) {
	var x = 0,
		member = {},
		annotatedMember = {},
		rv = [];

	if (type in api) {
		for (x = 0; x < api[type].length; x++) {
			member = api[type][x];

			if ('__inherits' in member && member.__inherits !== api.name) {
				continue;
			}

			annotatedMember.name = member.name;
			annotatedMember.summary = exportSummary(member);
			annotatedMember.deprecated = exportDeprecated(member);
			annotatedMember.osver = exportOSVer(member);
			annotatedMember.description = exportDescription(member);
			annotatedMember.examples = exportExamples(member);
			annotatedMember.hide = member.__hide || false;
			annotatedMember.since = (JSON.stringify(member.since) === JSON.stringify(api.since)) ? {} : member.since;

			switch (type) {
				case 'events':
					if ('Titanium.Event' in doc) {
						if (!('properties' in member) || !member.properties) {
							member.properties = [];
						}
						member.properties = member.properties.concat(doc['Titanium.Event'].properties);
					}
					annotatedMember.properties = exportParams(member.properties, 'properties');
					break;
				case 'methods':
					if ('parameters' in member) {
						annotatedMember.parameters = exportParams(member.parameters, 'parameters');
					}
					if ('returns' in member) {
						annotatedMember.returns = exportReturns(member);
					}
					break;
				case 'properties':
					annotatedMember.availability = member.availability || null;
					annotatedMember.constants = exportConstants(member);
					annotatedMember.defaultValue = exportDefault(member);
					annotatedMember.permission = member.permission || 'read-write';
					annotatedMember.type = exportType(member);
					annotatedMember.value = exportValue(member);
					break;
			}

			rv.push(annotatedMember);
			annotatedMember = member = {};
		}

	}

	return rv;
}

/**
 * Returns a JSON object that can be applied to the JSDuck EJS template
 * @param {Object} apis
 */
exports.exportData = function exportJsDuck (apis) {
	var className = null,
		rv = [],
		annotatedClass = {},
		cls = {};
	doc = apis;

	common.log(common.LOG_INFO, 'Annotating JSDuck-specific attributes...');

	for (className in apis) {
		cls = apis[className];
		annotatedClass.name = cls.name;
		annotatedClass.extends = cls.extends || null;
		annotatedClass.subtype = cls.__subtype;
		annotatedClass.since = cls.since;
		annotatedClass.summary = exportSummary(cls);
		annotatedClass.deprecated = exportDeprecated(cls);
		annotatedClass.osver = exportOSVer(cls);
		annotatedClass.description = exportDescription(cls);
		annotatedClass.examples = exportExamples(cls);

		annotatedClass.events = exportAPIs(cls, 'events') || [];
		annotatedClass.methods = exportAPIs(cls, 'methods') || [];
		annotatedClass.properties = exportAPIs(cls, 'properties') || [];
		annotatedClass.editurl = exportEditUrl(cls);
		rv.push(annotatedClass);
		cls = annotatedClass = {};
	}
	return rv;
};
