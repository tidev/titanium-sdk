/**
 * Script to export JSON to JSDuck comments
 */
var common = require('./common.js'),
	colors = require('colors');
	nodeappc = require('node-appc'),
	doc = {},
	exportData = {};

function findAPI (className, memberName, type) {
	var cls = doc[className],
		x = 0;

	if (cls && type in cls && cls[type]) {
		for (x = 0; x < cls[type].length; x++) {
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
					text = text.replace(match, replace);
				}
			}
		});
	}
    return text;
}

function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

function exportExamples (api) {
	var rv = '',
		code = '';
	if ('examples' in api && api.examples.length > 0) {
		rv += '<h3>Examples</h3>\n'
		api.examples.forEach(function (example) {
			if (example.title) rv += '<h4>'+ example.title + '</h4>\n';
			code = markdownToHTML(example.example);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/\<p\>/g, '').replace(/\<\/p\>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv += code;
		});
	}
	return rv.replace('/*', '&#47;&#42;').replace('*/', '&#42;&#47;');
}

function exportDeprecated (api) {
	var rv = '';
	if ('deprecated' in api && api.deprecated) {
		if ('removed' in api.deprecated) {
			rv += '@removed ' + api.deprecated.removed;
		} else {
			rv += '@deprecated ' + api.deprecated.since;
		}
		if ('notes' in api.deprecated) rv+= ' ' + api.deprecated.notes;
	}
	return rv;
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
	if ('value' in api && api.value) {
		return '<p><b>Constant value:</b>' + api.value + '</p>\n';
	}
	return '';
}

function exportSummary (api) {
	if ('summary' in api && api.summary) {
		return markdownToHTML(api.summary);
	}
	return '';
}

function exportDescription (api) {
	if ('description' in api && api.description) {
		return markdownToHTML(api.description);
	}
	return '';
}

function exportType (api) {
	var rv = [];
	if ('type' in api && api.type) {
		var types = api.type;
		if (!Array.isArray(api.type)) types = [api.type];
		types.forEach(function (type) {
			if (type.indexOf('Array') == 0) {
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

function exportParams (apis) {
	var rv = '',
		str = '';
	apis.forEach(function (member) {
		var platforms = '',
			optional = '';
		str = '';
		if (!'type' in member || !member.type) member.type = 'String';
		if (!Array.isArray(member.type)) member.type = [member.type];
		if ('platforms' in member) platforms = ' (' + member.platforms.join(' ') + ') ';
		if ('optional' in member && member.optional == true) optional += ' (optional)';
		str += '{' +  member.type.join('/') + '} ' + platforms + member.name + optional + '\n';
		str += exportSummary(member);
		str += exportConstants(member);
	});
	return rv;
}

function exportReturns (api) {
	var types = [],
		summary = '',
		constants = [],
		rv = 'void';

	if ('returns' in api && api.returns) {
		if (!Array.isArray(api.returns)) api.returns = [api.returns];
		api.returns.forEach(function (ret) {
			if (Array.isArray(ret.type)) {
				types = types.concat(ret.type);
			} else {
				types.push(ret.type || 'void');
			}

			if ('summary' in ret) summary += ret.summary;
			if ('constants' in ret) constants = constants.concat(ret.constants);
		});
		if (constants.length) {
			summary += exportConstants({'constants': constants});
		}
		rv = '{' + exportType({'type': types}) + '}' + summary;
	}
	return rv;

}

function exportAPIs (api, type) {
	var x = 0,
		member = null,
		removeAPI = [];

	if (type in api) {
		for (x = 0; x < api[type].length; x++) {
			member = api[type][x];

			if ('__inherits' in member && member.__inherits != api.name) {
				removeAPI.push(member);
				continue;
			}

			member.summary = exportSummary(member);
			member.deprecated = exportDeprecated(member);
			member.osver = exportOSVer(member);
			member.description = exportDescription(member);
			member.examples = exportExamples(member);
			member.type = exportType(member);
			member.constants = exportConstants(member);
			member.value = exportValue(member);

			if (JSON.stringify(member.since) == JSON.stringify(api.since)) member.since = {};

			if ('parameters' in member) member.parameters = exportParams(member.parameters);
			if ('returns' in member) member.returns = exportReturns(member);
			if ('properties' in member) member.properties = exportParams(member.properties);
		}

		removeAPI.forEach(function (rm) {
			api[type].splice(api[type].indexOf(rm), 1);
		});

	}

	return api[type];
}

// Returns a JSON object that can be applied to the JSDuck EJS template
exports.exportData = function exportJsDuck (apis) {
	var className = null, rv =[];
	doc = JSON.parse(JSON.stringify(apis));

	console.log('Annotating JSDuck-specific attributes...'.white);

	for (className in apis) {
		cls = apis[className];
		cls.summary = exportSummary(cls);
		cls.deprecated = exportDeprecated(cls);
		cls.osver = exportOSVer(cls);
		cls.description = exportDescription(cls);
		cls.examples = exportExamples(cls);

		cls.events = exportAPIs(cls, 'events') || [];
		cls.methods = exportAPIs(cls, 'methods') || [];
		cls.properties = exportAPIs(cls, 'properties') || [];
		rv.push(cls);
	}
	return rv;
}
