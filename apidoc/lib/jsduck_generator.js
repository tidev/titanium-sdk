/**
 * Script to export JSON to JSDuck comments
 */
var common = require('./common.js'),
	colors = require('colors');
	doc = null;

function findAPI (className, memberName, type) {
	var cls = doc[className];
	if (type in cls) {
		for (var x = 0; x < cls[type].length; x++) {
			if (cls[type][x].name == memberName) return true;
		}
	}
	return false;
}

// Convert API name to JSDuck-style link
function convertAPIToLink (apiName) {
	if (apiName in doc) {
		return apiName;
	}
	else if ((apiName.match(/\./g)||[]).length) {
		var member = apiName.split('.').pop(),
			cls = apiName.substring(0, apiName.lastIndexOf('.'));
		if (!cls in doc) {
			console.warn('Cannot find class: %s'.yellow, cls);
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
	console.warn('Cannot find API: %s'.yellow, apiName);
	return null;
}

// Scans converted markdown-to-html text for internal links and
// converts them to JSDuck-style sytnax
function convertLinks (text) {
	var matches = text.match(common.REGEXP_HREF_LINKS),
		tokens,
		replace,
		link;
	if (matches && matches.length) {
		matches.forEach(function (match) {
			tokens = common.REGEXP_HREF_LINK.exec(match);
			if (tokens && tokens[1].indexOf("http") != 0 && !~match.indexOf('#')) {
				if (link = convertAPIToLink(tokens[1])) {
					replace = '{@link ' + link + ' ' + tokens[2] + '}';
					text = text.replace(tokens[0], replace);
				}
			}
		})
	}
	matches = text.match(common.REGEXP_CHEVRON_LINKS);
	if (matches && matches.length) {
		matches.forEach(function (match) {
			if(!common.REGEXP_HTML_TAG.exec(match) && !~match.indexOf(' ') && !~match.indexOf('/') && !~match.indexOf('#')) {
				tokens = common.REGEXP_CHEVRON_LINK.exec(match);
				if (link = convertAPIToLink(tokens[1])) {
					replace = '{@link ' + link + '}';
					text = text.replace(tokens[0], replace);
				}
			}
		});
	}
    return text;
}

function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

function exportPlatforms (api) {
	var rv = '';
	for (var key in api.since) {
		rv += ' * @platform ' + key + ' ' + api.since[key] + '\n';
	}
	return rv;
}

function exportSummary (api) {
	if ('summary' in api) {
		return ' * ' + markdownToHTML(api.summary) + '\n';
	}
	return '';
}

function exportDescription (api) {
	if ('description' in api) {
		return ' * @description ' + markdownToHTML(api.description) + '\n';
	}
	return '';
}

function exportType (api) {
	var rv = [];
	if ('type' in api) {
		var types = api.type;
		if (!Array.isArray(api.type)) types = [api.type];
		types.forEach(function (type) {
			if (type.indexOf('Array') == 0) {
				rv.push(type.slice(type.indexOf('<') + 1, type.indexOf('>')) + '[]');
			} else {
				rv.push(type);
			}
		});
	}
	if (rv.length > 0) {
		return ' * @type ' + rv.join('/') + '\n';
	} else {
		return '';
	}
}

function exportParams (apis) {
	var rv = '';
	apis.forEach(function (member) {
		var platforms = '',
			optional = '';
		if (!'type' in member || !member.type) member.type = 'String';
		if (!Array.isArray(member.type)) member.type = [member.type];
		if ('platforms' in member) platforms = ' (' + member.platforms.join(' ') + ') ';
		if ('optional' in member && member.optional == true) optional += ' (optional)';
		rv += ' * @param {' +  member.type.join('/') + '} ' + platforms + member.name + optional + '\n';
		rv += exportSummary(member);
		rv += exportConstants(member);
	});
	return rv;
}

function exportReturns (api) {
	var returns = api.returns,
		types = [],
		summary = '',
		constants = [],
		rv = ' * @return void';

	if ('returns' in api && api.returns) {
		if (!Array.isArray(api.returns)) api.returns = [api.returns];
		api.returns.forEach(function (ret) {
			if (Array.isArray(ret.type)) ret.type = ret.type.join('/');
			types.push(ret.type || 'void');

			if ('summary' in ret) summary += ret.summary;
			if ('constants' in ret) constants = constants.concat(ret.constants);
		});
		if (constants.length) {
			summary += exportConstants({'constants': constants});
		}
		rv = ' * @returns {' + types.join('/') + '}' + summary + '\n';
	}
	return rv;

}


function exportExamples (api) {
	var rv = '';
	if ('examples' in api && api.examples.length > 0) {
		rv += ' * <h3>Examples</h3>\n'
		api.examples.forEach(function (example) {
			if (example.title) rv += ' * <h4>'+ example.title + '</h4>\n';
			rv += markdownToHTML(example.example) + '\n';
		});
	}
	return rv.replace('/*', '&#47;&#42;').replace('*/', '&#42;&#47;');
}

function exportOSVer (api) {
	var rv = '';
	if ('osver' in api) {
		rv += "<p> <b>Requires:</b> \n";
		for (var key in api.osver) {
			if (Array.isArray(api.osver[key])) {
				rv += '<li> ' + common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].join(', ') + ' \n';
			} else {
				if ('min' in api.osver[key]) rv += common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].min + ' and later \n';
				if ('max' in api.osver[key]) rv += common.PRETTY_PLATFORM[key] + ' ' + api.osver[key].max + ' and earlier \n';
			}
		}
		rv += "</p>\n";
	}
	return rv;
}

function exportConstants (api) {
	var rv = '';
	if ('constants' in api && api.constants && api.constants.length) {
		rv = "\n<p>This API can be assigned the following constants:<ul>\n"
		api.constants.forEach(function (constant) {
			rv += ' <li> {@link ' + convertAPIToLink(constant) + '}\n';
		});
		rv += '</ul></p>\n';
	}
	return rv;
}

function exportValue (api) {
	if ('value' in api) {
		return '<p><b>Constant value:</b>' + api.value + '</p>\n';
	}
	return '';
}

function exportDeprecated (api) {
	var rv = '';
	if ('deprecated' in api && api.deprecated) {
		if ('removed' in api.deprecated) {
			rv += ' * @removed ' + api.deprecated.removed;
		} else {
			rv += ' * @deprecated ' + api.deprecated.since;
		}
		if ('notes' in api.deprecated) rv+= ' ' + api.deprecated.notes;
		rv += '\n'
	}
	return rv;
}

function exportAPIs (apis, type, versions) {
	var rv = '',
		singular = {'events': 'event', 'methods': 'method', 'properties': 'property'};
	if (type in apis) {

		apis[type].forEach(function (api) {

			if ('__hide' in api && api.__hide) {
				rv += '/**\n';
				rv += ' * @' + singular[type] + ' ' + api.name + '\n';
				rv += ' * @hide\n'
				rv += ' */\n';
				return;
			}

			if ('__inherits' in api && api.__inherits != apis.name) return;

			rv += '/**\n';
			if ('default' in api) {
				rv += ' * @' + singular[type] + ' [' + api.name + '=' + api.default +']\n';
			} else {
				rv += ' * @' + singular[type] + ' ' + api.name + '\n';
			}

			rv += exportType(api);
			if ('permission' in api) {
				if (api.permission === 'read-only') rv += ' * @readonly\n';
				if (api.permission === 'write-only') rv += ' * @writeonly\n';
			}
			if ('availability' in api) {
				if (api.availability === 'creation-only') rv += ' * @creationOnly\n';
			}
			rv += exportSummary(api);
			rv += exportDeprecated(api);
			rv += exportOSVer(api);
			rv += exportValue(api);
			rv += exportDescription(api);
			rv += exportConstants(api);
			rv += exportExamples(api);

			if ('properties' in api) {
				rv += exportParams(api.properties);
			}

			if ('parameters' in api) {
				rv += exportParams(api.parameters);
			}

			if ('returns' in api) {
				rv += exportReturns(api);
			}

			if (JSON.stringify(versions) != JSON.stringify(api.since)) {
				rv += exportPlatforms(api);
			}
			rv += ' */\n\n';
		});
	}
	return rv;
}

exports.exportData = function exportJsDuck (apis) {
	var exportData = '';
	doc = apis;
	for (var key in apis) {
		var api = apis[key];

		exportData += '/**\n';
		exportData += ' * @class ' + api.name + '\n';
		exportData += exportPlatforms(api);
		if (api.subtype === 'pseudo') exportData += ' * @pseudo\n';
		if ('extends' in api) exportData += ' * @extends ' + api.extends + '\n';
		exportData += exportSummary(api);
		exportData += exportDeprecated(api);
		exportData += exportOSVer(api);
		exportData += exportDescription(api);
		exportData += exportExamples(api);
		exportData += ' */\n\n';

		exportData += exportAPIs(api, "properties", api.since);
		exportData += exportAPIs(api, "methods", api.since);
		exportData += exportAPIs(api, "events", api.since);
	}
	return exportData;
}