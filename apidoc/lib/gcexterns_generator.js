var common = require('./common.js');
var prefix = ' *';
var formatPrefix = '\n * ';

/**
 * @param {...string} str
 * @return {string}
 */
var join = function (str) {
    return this.join.call(arguments, ' ');
}.bind(Array.prototype);

/**
 * @param {string} text
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
 * @param {Object<string, string>} since
 * @return {string}
 */
function formatSince(since) {
    if (!since) {
        return '';
    }
    var temp = [];
    for (var platform in since) {
        temp.push(since[platform] + ' (' + common.PRETTY_PLATFORM[platform] + ')');
    }
    return join(prefix, '@since', temp.join(', '));
}

/**
 * @param {string|Array<string>} type
 * @param {boolean=} optional
 * @param {boolean=} repeatable
 * @return {*}
 */
function formatType(type, optional, repeatable) {
    if (!type) {
        return '';
    }
    var returnType = type;
    if (typeof returnType.join === 'function') {
        returnType = returnType.join('|');
    }
    returnType = returnType.replace(/Dictionary<(.*)\.(.*)>/g, '$1._Dictionary_$2');
    return [
        (repeatable ? '...' : ''), returnType, (optional ? '=' : '')
    ].join('');
}

/**
 * @param {Object} cls
 * @return {string}
 */
function formatTypeDef(cls) {
    var temp = [];
    var className = cls.name;

    temp.push('/**');
    if (cls.summary) {
        temp.push(join(prefix, formatLinebreak(cls.summary)));
    }
    var parent;
    if (cls.extends) {
        parent = cls.extends;
    } else {
        parent = 'Object';
    }
    var prototypeDef = [];
    if (cls.properties) {
        for (var i = 0, l = cls['properties'].length; i < l; i++) {
            var property = cls['properties'][i];
            var propertyType = formatType(property.type);
            prototypeDef.push(join(
                prefix, ' ', property.name + ':',
                (propertyType.indexOf('|') !== -1 ? ('(' + propertyType + ')') : propertyType)
            ));
            temp.push(join(prefix, '-', property.name, formatLinebreak(property.summary)))
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
 * @param {Object} cls
 * @param {Array} prototypeDef
 * @return {string}
 */
function formatProperties(cls, prototypeDef) {
    var temp = [];
    var tt = [];
    var clsName;
    if (cls.name === 'Global') {
        clsName = 'var ';
    } else {
        clsName = cls.name + '.';
    }
    for (var i = 0, l = cls['properties'].length; i < l; i++) {
        var property = cls['properties'][i];
        temp.push('/**');
        temp.push(join(prefix, formatLinebreak(property.summary)));
        temp.push(formatSince(property['since']));
        var propertyType = formatType(property.type);
        var readOnly = false;
        if (property.permission && property.permission == 'read-only') {
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
        var parent;
        if (cls.extends) {
            var tempClass = cls.extends.split('.');
            tempClass[tempClass.length - 1] = '_Dictionary_' + tempClass[tempClass.length - 1];
            parent = tempClass.join('.');
        } else {
            parent = 'Object';
        }
        prototypeDef.push('/**');
        prototypeDef.push(join(prefix, '@typedef', '{{'));
        prototypeDef.push(tt.join(',\n'));
        prototypeDef.push(join(prefix, '}}'));
        prototypeDef.push(' */');
        tempClass = cls.name.split('.');
        tempClass[tempClass.length - 1] = '_Dictionary_' + tempClass[tempClass.length - 1];
        var name = tempClass.join('.');
        prototypeDef.push(name + ';');
        prototypeDef.push('');
    }
    return temp.join('\n');
}

/**
 * @param {Object} cls
 * @return {string}
 */
function formatMethods(cls) {
    var temp = [];
    var nsPrefix;
    if (cls.name.indexOf('Global') === 0) {
        nsPrefix = cls.name.substring(7);
        if (nsPrefix.length) {
            nsPrefix = nsPrefix + '.';
        } else {
            nsPrefix = 'var ';
        }
    } else {
        nsPrefix = cls.name + '.';
    }
    for (var i = 0, l = cls['methods'].length; i < l; i++) {
        var method = cls['methods'][i];
        temp.push('/**');
        temp.push(join(prefix, formatLinebreak(method.summary)));
        temp.push(formatSince(method['since']));
        var header = [];
        if (cls.__creatable) {
            header.push(nsPrefix + 'prototype.' + method.name);
        } else {
            header.push(nsPrefix + method.name);
        }
        var params = [];
        if (method.parameters) {
            method.parameters.forEach(function (parameter) {
                params.push(parameter.name);
                temp.push(join(
                    prefix,
                    '@param',
                    '{' + formatType(parameter.type, parameter.optional, parameter.repeatable) + '}',
                    parameter.name,
                    formatLinebreak(parameter.summary)
                ));
            });
        }
        if (method.returns && method.returns.length) {
            var returnType = method.returns[0].type;
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
 * @param {Object} apis
 * @return {string}
 */
exports.exportData = function exportGCEXTERNS(apis) {
    var className;
    var cls;
    var protoDict = [];
    var jsdoc = [
        '/**',
        ' * @fileoverview Generated externs.  DO NOT EDIT!',
        ' * @externs',
        ' */',
        ''
    ];

    common.log(common.LOG_INFO, 'Generating closure externs...');

    var names = Object.keys(apis).sort();

    for (var i = 0, l = names.length; i < l; i++) {
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
            var name = cls.name;
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
