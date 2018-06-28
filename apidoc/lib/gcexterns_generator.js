/**
 * Script to export JSON to closure externs
 */
'use strict';

var common = require('./common.js');
var prefix = ' *';
var formatPrefix = '\n * ';

/**
 * @return {string}
 */
var join = function () {
	return this.join.call(arguments, ' ');
}.bind(Array.prototype);

/**
 * @param {string} text string to format
 * @return {string}
 */
function formatLinebreak(text) {
	if (text) {
		return text.split('\n').join(formatPrefix);
	} else {
		return '';
	}
}

/**
 * @param {Object<string, string>} since object define then this feature was added
 * @return {string}
 */
function formatSince(since) {
	var temp;
	var platform;

	if (!since) {
		return '';
	}
	temp = [];
	for (platform in since) {
		temp.push(since[platform] + ' (' + common.PRETTY_PLATFORM[platform] + ')');
	}
	return join(prefix, '@since', temp.join(', '));
}

/**
 * @param {string|Array<string>} type object type|types
 * @param {boolean=} optional define if object optional
 * @param {boolean=} repeatable define if object repeatable
 * @return {*}
 */
function formatType(type, optional, repeatable) {
	var returnType;
	if (!type) {
		return '';
	}
	returnType = type;
	if (typeof returnType.join === 'function') {
		returnType = returnType.join('|');
	}
	returnType = returnType.replace(/Dictionary<(.*)\.(.*)>/g, '$1._Dictionary_$2');
	return [
		(repeatable ? '...' : ''), returnType, (optional ? '=' : '')
	].join('');
}

/**
 * @param {Object} cls api object
 * @return {string}
 */
function formatTypeDef(cls) {
	var temp = [];
	var className = cls.name;
	var prototypeDef = [];
	var i, l;
	var property;
	var propertyType;

	temp.push('/**');
	if (cls.summary) {
		temp.push(join(prefix, formatLinebreak(cls.summary)));
	}
	if (cls.properties) {
		for (i = 0, l = cls['properties'].length; i < l; i++) {
			property = cls['properties'][i];
			propertyType = formatType(property.type);
			prototypeDef.push(join(
				prefix, ' ', property.name + ':',
				(propertyType.indexOf('|') !== -1 ? ('(' + propertyType + ')') : propertyType)
			));
			temp.push(join(prefix, '-', property.name, formatLinebreak(property.summary)));
		}
	}

	temp.push(join(prefix, '@typedef', '{{'));
	if (prototypeDef.length) {
		temp.push(prototypeDef.join(',\n'));
	}
	temp.push(join(prefix, '}}'));
	temp.push(' */');
	if (className.indexOf('.') === -1) {
		className = 'var ' + className;
	}
	temp.push(className + ';');
	temp.push('');
	return temp.join('\n');
}

/**
 * @param {Object} cls api object
 * @param {Array} prototypeDef parameters in prototype
 * @return {string}
 */
function formatProperties(cls, prototypeDef) {
	var readOnly = false;
	var temp = [];
	var tt = [];
	var clsName;
	var property;
	var tempClass;
	var propertyType;
	var i, l;

	if (cls.name === 'Global') {
		clsName = 'var ';
	} else {
		clsName = cls.name + '.';
	}
	for (i = 0, l = cls['properties'].length; i < l; i++) {
		property = cls['properties'][i];
		temp.push('/**');
		temp.push(join(prefix, formatLinebreak(property.summary)));
		temp.push(formatSince(property['since']));
		propertyType = formatType(property.type);
		readOnly = false;
		if (property.permission === 'read-only') {
			temp.push(join(prefix, '@readonly'));
			readOnly = true;
		}
		temp.push(join(
			prefix, '@type', '{' + propertyType + '}', property.name
		));
		temp.push(' */');
		if (property.name === property.name.toUpperCase()) {
			temp.push(clsName + property.name + ';');
		} else {
			temp.push(clsName + 'prototype.' + property.name + ';');
			if (!readOnly) {
				tt.push(join(
					prefix,
					' ',
					property.name + ':',
					(propertyType.indexOf('|') !== -1 ? ('(' + propertyType + ')') : propertyType)
				));
			}
		}
		temp.push('');
	}
	if (tt.length) {

		if (cls.extends) {
			tempClass = cls.extends.split('.');
			tempClass[tempClass.length - 1] = '_Dictionary_' + tempClass[tempClass.length - 1];
		}
		prototypeDef.push('/**');
		prototypeDef.push(join(prefix, '@typedef', '{{'));
		prototypeDef.push(tt.join(',\n'));
		prototypeDef.push(join(prefix, '}}'));
		prototypeDef.push(' */');
		tempClass = cls.name.split('.');
		tempClass[tempClass.length - 1] = '_Dictionary_' + tempClass[tempClass.length - 1];
		prototypeDef.push(tempClass.join('.') + ';');
		prototypeDef.push('');
	}
	return temp.join('\n');
}

/**
 * Format api methods
 * @param {Object} cls api object
 * @return {string}
 */
function formatMethods(cls) {
	var temp = [];
	var nsPrefix;
	var method;
	var header;
	var returnType;
	var params;
	var parameter;
	var i, k, l;

	if (cls.name.indexOf('Global') === 0) {
		nsPrefix = cls.name.substring(7);
		if (nsPrefix.length) {
			nsPrefix += '.';
		} else {
			nsPrefix = 'var ';
		}
	} else {
		nsPrefix = cls.name + '.';
	}
	for (i = 0, l = cls['methods'].length; i < l; i++) {
		method = cls['methods'][i];
		temp.push('/**');
		temp.push(join(prefix, formatLinebreak(method.summary)));
		temp.push(formatSince(method['since']));
		header = [];
		if (cls.__creatable) {
			header.push(nsPrefix + 'prototype.' + method.name);
		} else {
			header.push(nsPrefix + method.name);
		}
		params = [];
		if (method.parameters) {
			for (k = 0; k < method.parameters.length; k++) {
				parameter = method.parameters[k];
				params.push(parameter.name);
				temp.push(join(
					prefix, '@param',
					'{' + formatType(
						parameter.type,
						parameter.optional,
						parameter.repeatable
					) + '}',
					parameter.name,
					formatLinebreak(parameter.summary)
				));
			}
		}
		if (method.returns && method.returns.length) {
			returnType = method.returns[0].type;
			if (typeof returnType.join === 'function') {
				returnType = returnType.join('|');
			}
			temp.push([
				prefix,
				'@return',
				'{' + formatType(method.returns[0].type) + '}'
			].join(' '));
		}
		header.push('= function(' + params.join(', ') + ') {};');
		temp.push(' */');
		temp.push(header.join(' '));
		temp.push('');
	}
	return temp.join('\n');
}

/**
 * Returns a string with js API description
 * @param {Object} apis full api tree
 * @return {string}
 */
exports.exportData = function exportGCEXTERNS(apis) {
	var className;
	var cls;
	var protoDict = [];
	var name;
	var names;
	var i, l;
	var jsdoc = [
		'/**',
		' * @fileoverview Generated externs.  DO NOT EDIT!',
		' * @externs',
		' */',
		''
	];

	common.log(common.LOG_INFO, 'Generating closure externs...');

	names = Object.keys(apis).sort();

	for (i = 0, l = names.length; i < l; i++) {
		className = names[i];
		cls = apis[className];

		if (cls.__subtype === 'pseudo') {
			jsdoc.push(formatTypeDef(cls));
		} else {
			jsdoc.push('/**');
			if (cls.summary) {
				jsdoc.push(join(prefix, formatLinebreak(cls.summary)));
			}
			if (cls.__creatable) {
				jsdoc.push(join(prefix, '@constructor'));
			}
			if (cls.extends) {
				jsdoc.push(join(prefix, '@extends', '{' + cls.extends + '}'));
			}
			if (cls.description) {
				jsdoc.push(join(prefix, '@description', formatLinebreak(cls.description)));
			}
			if (cls.since) {
				jsdoc.push(formatSince(cls['since']));
			}
			jsdoc.push(' */');
			name = cls.name;
			if (name.indexOf('Global') === 0) {
				if (name[6] === '.') {
					name = name.substring(7);
				} else {
					name = '';
				}
			}
			if (name) {
				if (name.indexOf('.') === -1) {
					name = 'var ' + name;
				}
				jsdoc.push(join(name, '= function() {};'));
			}
			if (cls.properties) {
				jsdoc.push('');
				jsdoc.push(formatProperties(cls, protoDict));
			}
			if (cls.methods) {
				jsdoc.push('');
				jsdoc.push(formatMethods(cls));
			}
		}
		jsdoc.push('');
		if (protoDict.length) {
			jsdoc = jsdoc.concat(protoDict);
		}
		cls = {};
		protoDict = [];
	}
	jsdoc.push('var Ti = Titanium;');
	return jsdoc.join('\n');
};
