/**
 * Script to export JSON to Alloy comments
 */
var common = require('./common.js'),
	assert = common.assertObjectKey,
	doc = {},
	metadata = {},
	proxyProperties = [];

/**
 * Find API in documentation set
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
 * Scans converted markdown-to-html text for internal links and
 * converts them to JSDuck-style sytnax
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
 * Convert Markdown to HTML
 */
function markdownToHTML (text) {
	return convertLinks(common.markdownToHTML(text));
}

/**
 * Export summary field
 */
function exportSummary (api) {
	if ('summary' in api && api.summary) {
		return markdownToHTML(api.summary);
	}
	return '';
}

/**
 * Export default field
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
 * List elements
 */
function listElements (elems) {
	var elements = [];
	elems.forEach(function (elem) {
		if (elem in metadata.categories) {
			elements = elements.concat(listElements(metadata.categories[elem]));
		} else {
			elements.push('&lt;{@link ' + renameAlloy(elem) + ' ' + elem.split('.').pop() + '}&gt;');
		}
	});
	return elements.sort();
}

/**
 * Export deprecated field
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
 * Export description field
 */
function exportDescription (api) {

	var result = '',
		children = [],
		ns = '',
		obj_data = metadata[api.name];

	if (assert(obj_data, 'children')) {
		children = children.concat(obj_data.children);
	}

	if (assert(obj_data, 'proxyProperties')) {
		for (var prop in obj_data.proxyProperties) {
			children.push(prop.charAt(0).toUpperCase() + prop.slice(1));
		}
	}

	result = '<table>\n';
	if (assert(obj_data, 'since')) {
		result += ' <tr><td> Required Alloy Version: </td><td> ' + obj_data.since + ' </td></tr> \n';
	} else {
		result += ' <tr><td> Required Alloy Version: </td><td> 1.0.0 </td></tr> \n';
	}

	if (assert(obj_data, 'ns')) {
		result += ' <tr><td> Default Namespace: </td><td> ' + obj_data.ns + ' </td></tr> \n';
	} else {
		ns = api.name.slice(0, api.name.lastIndexOf('.')).replace('Titanium', 'Ti');
		result += ' <tr><td> Default Namespace: </td><td> ' + ns + ' </td></tr> \n';
	}

	if (assert(obj_data, 'parents')) {
		result += ' <tr><td> Permitted parent elements: </td><td> ' + listElements(obj_data.parents).join(', ') + ' </td></tr> \n';
	}

	if (children.length > 0) {
		result += ' <tr><td> Permitted children elements: </td><td> ' + listElements(children).join(', ') + ' </td></tr> \n';
	}
	result += '</table>\n';

	return markdownToHTML(result);
}

/**
 * Export examples field
 */
function exportExamples (api) {
	var rv = '',
		code = '';
	if ('examples' in api && api.examples.length > 0) {
		api.examples.forEach(function (example) {
			if (!~example.title.indexOf('Alloy') && !~example.title.indexOf('XML')) {
				return;
			}
			if (example.title) {
				rv += '<h4>' + example.title + '</h4>\n';
			}
			code = example.example;
			code = code.replace(/Previous .+\./, '');
			code = code.replace('Below is an Alloy version of the previous example.', '');
			code = code.replace('Alloy version of previous example.', '');
			code = markdownToHTML(code);
			// If we don't find a <code> tag, assume entire example should be code formatted
			if (!~code.indexOf('<code>')) {
				code = code.replace(/<p\>/g, '').replace(/<\/p\>/g, '');
				code = '<pre><code>' + code + '</code></pre>';
			}
			rv += code;
		});
	}

	if (rv.length > 0) {
		return '<h3>Examples</h3>\n' + rv.replace('/*', '&#47;&#42;').replace('*/', '&#42;&#47;');
	} else {
		return rv;
	}
}

/**
 * Export type field
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
				return;
			} else if (type === 'String' || type === 'Boolean' || type === 'Number' || type === 'Function') {
				rv.push(type);
			}
		});
	}
	if (rv.length > 0) {
		return rv.join('/');
	} else {
		return null;
	}
}

/**
 * Export APIs
 */
function exportAPIs (api, type) {
	var x = 0,
		member = {},
		annotatedMember = {},
		proxies = [],
		rv = [];

	if (assert(metadata[api.name], 'proxyProperties')) {
		proxies = Object.keys(metadata[api.name].proxyProperties);
	}

	['events', 'properties'].forEach(function (type) {
		if (type in api) {
			for (x = 0; x < api[type].length; x++) {
				member = api[type][x];

				if (assert(member, 'deprecated')) {
					continue;
				}

				annotatedMember.name = member.name;
				annotatedMember.since = (JSON.stringify(member.since) === JSON.stringify(api.since)) ? {} : member.since;

				switch (type) {
					case 'events':
						annotatedMember.name = 'on' + annotatedMember.name.charAt(0).toUpperCase() + annotatedMember.name.slice(1);
						annotatedMember.summary = ' Function to call when the {@link ' + convertAPIToLink(api.name + '.' + member.name) + '} event fires.';
						annotatedMember.type = 'Function';
						break;
					case 'properties':
						if (member.permission === 'read-only') {
							continue;
						}
						annotatedMember.type = exportType(member);
						if (annotatedMember.type === null) {
							// If we have a proxy property...
							if (~proxies.indexOf(member.name)) {
								var dict = {};
								dict.name = renameAlloy(member.name.charAt(0).toUpperCase() + member.name.slice(1));
								dict.summary = exportSummary(member);
								dict.subtype = 'pseudo';
								dict.since = (JSON.stringify(member.since) === JSON.stringify(api.since)) ? {} : member.since;
								dict.properties = dict.methods = dict.events = [];
								proxyProperties.push(dict);
							}
							continue;
						}
						annotatedMember.summary = exportSummary(member);
						annotatedMember.summary += ' For more information, see {@link ' + convertAPIToLink(api.name + '.' + member.name) + '}.';
						annotatedMember.defaultValue = exportDefault(member);
						break;
				}

				rv.push(annotatedMember);
				annotatedMember = member = {};
			}

		}
	});

	return rv;
}

/**
 * Rename class namespace
 */
function renameAlloy (name) {
	return 'Alloy.View.' + name.split('.').pop();
}

/**
 * Returns a JSON object that can be applied to the JSDuck EJS template
 */
exports.exportData = function exportJsDuck (apis) {
	var className = null,
		rv = [],
		annotatedClass = {},
		cls = {};
	doc = apis;
	metadata = apis.__alloyMetadata;

	common.log(common.LOG_INFO, 'Annotating Alloy-specific attributes...');

	for (className in apis) {
		cls = apis[className];
		cls.name = className;
		if (assert(cls, 'deprecated') || (className.indexOf('__') === 0) || !assert(metadata, className)) {
			continue;
		}
		annotatedClass.name = renameAlloy(className);
		annotatedClass.extends = assert(metadata[className], 'collectionBinding') ? 'AlloyViewCollectionAttributes' : 'AlloyViewGlobalAttributes';
		annotatedClass.since = cls.since;
		annotatedClass.summary = exportSummary(cls);
		annotatedClass.summary += ' For more information, see {@link ' + convertAPIToLink(className) + '}.';
		annotatedClass.description = exportDescription(cls);
		annotatedClass.examples = exportExamples(cls);
		annotatedClass.properties = exportAPIs(cls) || [];
		annotatedClass.methods = [];
		annotatedClass.events = [];
		rv.push(annotatedClass);
		cls = annotatedClass = {};
	}
	return rv.concat(proxyProperties);
};
