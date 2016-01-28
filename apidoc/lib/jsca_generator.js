/**
 * Script to export JSON to JSCA
 */
var common = require('./common.js'),
	doc = {};

/**
 * Change chevron-enclosed links (<Titanium.XX.xxx>) to HTML links (<a href="Titanium.XX.xxx">xxx</a>)
 * so the information is not lost when Studio renders it.
 * @param {Object} text
 */
function convertLinks (text) {
	var matches = [],
		tokens = [],
		link = '';
	matches = text.match(common.REGEXP_CHEVRON_LINKS);
	if (matches && matches.length) {
		matches.forEach(function (match) {
			if (!common.REGEXP_HTML_TAG.exec(match) && !~match.indexOf(' ') && !~match.indexOf('/') && !~match.indexOf('#')) {
				tokens = common.REGEXP_CHEVRON_LINK.exec(match);
				link = '<a href="' + tokens[1] + '">' + tokens[1].substring(tokens[1].lastIndexOf('.') + 1) + '</a>';
				text = text.replace(match, link);
			}
		});
	}
	return text;
}

/**
 * Converts markdown text to HTML
 * @param {string} text
 */
function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Fixes illegal names like "2DMatrix" (not a valid JavaScript name)
 * @param {string} ns
 */
function cleanNamespace (ns) {
	if (~ns.indexOf('.')) {
		ns = ns.split('.');
		for (var x = 0; x < ns.length; x++) {
			ns[x] = cleanNamespace(ns[x]);
		}
		return ns.join('.');
	} else {
		if (/[0-9]/.test(ns[0])) {
			return '_' + ns;
		}
	}
	return ns;
}

/**
 * Do not prepend 'Global' to class names (TIDOC-860)
 * @param {string} name
 */
function cleanClassName (name) {
	if (name.indexOf('Global.') === 0) {
		name = name.substring(7, name.length);
	}
	return name;
}

/**
 * Export deprecated field
 * @param {Object} api
 */
function exportDeprecated (api) {
	if ('deprecated' in api && api.deprecated) {
		return true;
	}
	return false;
}

/**
 * Export summary field
 * @param {Object} api
 */
function exportDescription (api) {
	var rv = '';
	if ('summary' in api && api.summary) {
		rv += api.summary;
	}
	if ('deprecated' in api && api.deprecated) {
		if ('removed' in api.deprecated) {
			rv += ' **Removed in ' + api.deprecated.removed + '.';
		} else {
			rv += ' **Deprecated since ' + api.deprecated.since + '.';
		}
		if ('notes' in api.deprecated) {
			rv += ' ' + api.deprecated.notes;
		}
		rv = rv.replace(/[\n\t ]+$/g, '');
		rv += '**';
	}
	return markdownToHTML(rv);
}

/**
 * Export examples field
 * @param {Object} api
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
			rv.push({'title': example.title, 'code': code});
		});
	}
	return rv;
}

/**
 * Export method parameters or event properties field
 * @param {Object} api
 * @param {string} type
 */
function exportParams (apis, type) {
	var rv = [],
		annotatedMember = {};
	if (apis) {
		apis.forEach(function (member) {
			annotatedMember.name = cleanNamespace(member.name);
			annotatedMember.constants = member.constants || [];
			if (type === 'properties') {
				annotatedMember.deprecated = exportDeprecated(member);
			}
			annotatedMember.description = exportDescription(member);
			annotatedMember.type = exportType(member);
			if (type === 'parameters') {
				annotatedMember.usage = 'required';
				if ('optional' in member && member.optional) {
					annotatedMember.usage = 'optional';
				} else if ('repeatable' in member && member.repeatable) {
					annotatedMember.usage = 'one-or-more';
				}
			}
			rv.push(annotatedMember);
			annotatedMember = {};
		});
	}
	return rv;
}

/**
 * Export description field
 * @param {Object} api
 */
function exportRemarks (api) {
	var rv = [];
	if ('description' in api && api.description) {
		rv.push(markdownToHTML(api.description));
	}
	return rv;
}

/**
 * Export returns field
 * @param {Object} api
 */
function exportReturnTypes (api) {
	var rv = [];
	if ('returns' in api && api.returns) {
		if (!Array.isArray(api.returns)) {
			api.returns = [api.returns];
		}
		api.returns.forEach(function (ret) {
			rv.push({
				'type': exportType(ret) || 'void',
				'description': exportDescription(ret) || '',
				'constants': ret.constants || []
			});
		});
	} else {
		rv.push({'type': 'void', 'description': '', 'constants': []});
	}
	return rv;
}

/**
 * Export since field
 * @param {Object} api
 */
function exportSince (api) {
	var rv = [], platform = null;
	for (platform in api.since) {
		rv.push({
			'name': 'Titanium Mobile SDK - ' + common.PRETTY_PLATFORM[platform],
			'version': api.since[platform]
		});
	}
	return rv;
}

// Currently the JSCA spec allows for just one type per parameter/property/returnType.
// We have to choose one.
// We'll take "Object" if it's one of the possible types, else we'll just take the first one.
/**
 * Export type field
 * @param {Object} api
 */
function exportType (api) {
	var rv = '',
		res = [];
	if ('type' in api && api.type) {
		if (Array.isArray(api.type)) {
			res = api.type.filter(function (t) {
				return (t.toLowerCase() === 'object');
			});
			rv = (res.length > 0) ? 'Object' : api.type[0];
		} else {
			rv = api.type;
		}

		if (rv.indexOf('Array') === 0) {
			rv = 'Array';
		} else if (rv.indexOf('Callback') === 0) {
			rv = 'Function';
		} else if (rv.indexOf('Dictionary<') === 0) {
			rv = rv.substring(rv.indexOf('<') + 1, rv.lastIndexOf('>'));
		} else if (rv === 'Dictionary') {
			rv = 'Object';
		}
	}
	return cleanNamespace(rv);
}

/**
 * Export platforms field
 * @param {Object} api
 */
function exportUserAgents (api) {
	var rv = [],
		platform = null;
	for (platform in api.since) {
		rv.push({'platform': platform});
	}
	return rv;
}

/**
 * Export API members
 * @param {Object} api
 * @param {string} type
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
			annotatedMember.description = exportDescription(member);

			switch (type) {
				case 'events':
					if (member.properties) {
						if ('Titanium.Event' in doc) {
							member.properties = member.properties.concat(doc['Titanium.Event'].properties);
						}
						annotatedMember.properties = exportParams(member.properties, 'properties');
					}
					break;
				case 'methods':
					annotatedMember.examples = exportExamples(member);
					annotatedMember.exceptions = [];
					annotatedMember.isClassProperty = !api.__creatable;
					annotatedMember.isConstructor = false;
					annotatedMember.isInstanceProperty = api.__creatable;
					annotatedMember.isInternal = false;
					annotatedMember.isMethod = true;
					annotatedMember.parameters = exportParams(member.parameters, 'parameters');
					annotatedMember.references = [];
					annotatedMember.returnTypes = exportReturnTypes(member);
					annotatedMember.since = exportSince(member);
					annotatedMember.userAgents = exportUserAgents(member);
					break;
				case 'properties':
					annotatedMember.availability = member.availability || 'always';
					annotatedMember.constants = member.constants || [];
					annotatedMember.examples = exportExamples(member);
					annotatedMember.isClassProperty = (member.name === member.name.toUpperCase()) ? true : !api.__creatable;
					annotatedMember.isInstanceProperty = (member.name === member.name.toUpperCase()) ? false : api.__creatable;
					annotatedMember.isInternal = false;
					annotatedMember.permission = member.permission || 'read-write';
					annotatedMember.since = exportSince(member);
					annotatedMember.type = exportType(member) || 'String';
					annotatedMember.userAgents = exportUserAgents(member);
					break;
			}

			rv.push(annotatedMember);
			member = annotatedMember = {};
		}
	}

	return rv;
}

/**
 * Returns a JSON object formatted according to the JSCA specification
 * @param {Object} apis
 */
exports.exportData = function exportJSCA (apis) {
	var className = null,
		cls = {},
		annotatedClass = {},
		rv = {
			'types': [],
			'aliases': [{'type': 'Titanium', 'name': 'Ti'}]
		};

	common.log(common.LOG_INFO, 'Annotating JSCA-specific attributes...');

	for (className in apis) {
		cls = apis[className];

		annotatedClass.name = cleanNamespace(cleanClassName(cls.name));
		annotatedClass.description = exportDescription(cls);
		annotatedClass.deprecated = exportDeprecated(cls);
		annotatedClass.events = exportAPIs(cls, 'events');
		annotatedClass.examples = exportExamples(cls);
		annotatedClass.functions = exportAPIs(cls, 'methods');
		annotatedClass.inherits = cls.extends || 'Object';
		annotatedClass.isInternal = false;
		annotatedClass.properties = exportAPIs(cls, 'properties');
		annotatedClass.remarks = exportRemarks(cls);
		annotatedClass.since = exportSince(cls);
		annotatedClass.userAgents = exportUserAgents(cls);

		// TIMOB-7169. If it's a proxy (non-module) and it has no "class properties",
		// mark it as internal.  This avoids it being displayed in Code Assist.
		// TIDOC-860. Do not mark Global types as internal.
		if (cls.__subtype === 'proxy' && (cls.name.indexOf('Global.') !== 0)) {
			annotatedClass.isInternal = true;
			for (var x = 0; x < annotatedClass.properties.length; x++) {
				if (annotatedClass.properties[x].isClassProperty) {
					annotatedClass.isInternal = false;
					break;
				}
			}
		}

		if (~['Titanium.Event', 'Titanium.Proxy', 'Titanium.Module'].indexOf(className)) {
			annotatedClass.isInternal = true;
		}

		rv.types.push(annotatedClass);
		cls = annotatedClass = {};
	}
	return rv;
};
