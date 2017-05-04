/**
 * @overview
 * Analyzes Titanium JavaScript files for symbols and optionally minifies the code.
 *
 * @module lib/jsanalyze
 *
 * @copyright
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	DOMParser = require('xmldom').DOMParser,
	babel = require('babel-core'),
	babylon = require('babylon'),
	types = require('babel-types'),
	traverse = require('babel-traverse').default,
	__ = appc.i18n(__dirname).__,
	apiUsage = {};

/**
 * Returns an object with the Titanium API usage statistics.
 *
 * @returns {Object} The API usage stats
 */
exports.getAPIUsage = function getAPIUsage() {
	return apiUsage;
};

/**
 * Analyzes a Titanium JavaScript file for all Titanium API symbols.
 *
 * @param {String} file - The full path to the JavaScript file
 * @param {Object} [opts] - Analyze options
 * @param {String} [opts.filename] - The filename of the original JavaScript source
 * @param {Boolean} [opts.minify=false] - If true, minifies the JavaScript and returns it
 * @returns {Object} An object containing symbols and minified JavaScript
 * @throws {Error} An error if unable to parse the JavaScript
 */
exports.analyzeJsFile = function analyzeJsFile(file, opts) {
	opts || (opts = {});
	opts.filename = file;
	return exports.analyzeJs(fs.readFileSync(file).toString(), opts);
};

// Need to look for MemberExpressions, expand them out to full name

function getMemberValue(node) {
	if (types.isIdentifier(node)) {
		return node.name;
	} else if (types.isStringLiteral(node)) {
		return node.value;
	} else if (types.isMemberExpression(node)) {
		if (node.computed && !types.isStringLiteral(node.property)) {
			return null;
		}
		var objVal = getMemberValue(node.object);
		if (objVal == null) {
			return null;
		}
		var propVal = getMemberValue(node.property);
		if (propVal == null) {
			return null;
		}
		return objVal + '.' + propVal;
	}
	return null;
}

function getTitaniumExpression(member) {
	var value = getMemberValue(member),
		tiNodeRegExp = /^Ti(tanium)?/;
	if (value == null) return null;
	if (tiNodeRegExp.test(value)) {
		// if value.startsWith('Ti.'), replace with 'Titanium.'
		if (value.indexOf('Ti.') === 0) {
			return 'Titanium.' + value.substring(3);
		}
		return value;
	}
	return null;
}

/**
 * Analyzes a string containing JavaScript for all Titanium API symbols.
 *
 * @param {String} contents - A string of JavaScript
 * @param {Object} [opts] - Analyze options
 * @param {String} [opts.filename] - The filename of the original JavaScript source
 * @param {Boolean} [opts.minify=false] - If true, minifies the JavaScript and returns it
 * @returns {Object} An object containing symbols and minified JavaScript
 * @throws {Error} An error if unable to parse the JavaScript
 */
exports.analyzeJs = function analyzeJs(contents, opts) {
	var ast,
		symbols = {},
		results = {
			original: contents,
			contents: contents,
			symbols: []
		},
		tiNodeRegExp = /^(?:Ti|Titanium)$/;

	opts || (opts = {});

	// parse the js file
	try {
		ast = babylon.parse(contents, { sourceFilename: opts.filename });
	} catch (ex) {
		var errmsg = [ __('Failed to parse %s', opts.filename) ];
		if (ex.line) {
			errmsg.push(__('%s [line %s, column %s]', ex.message, ex.line, ex.col));
		} else {
			errmsg.push(ex.message);
		}
		try {
			contents = contents.split('\n');
			if (ex.line && ex.line <= contents.length) {
				errmsg.push('');
				errmsg.push('    ' + contents[ex.line-1].replace(/\t/g, ' '));
				if (ex.col) {
					var i = 0,
						len = ex.col,
						buffer = '    ';
					for (; i < len; i++) {
						buffer += '-';
					}
					errmsg.push(buffer + '^');
				}
				errmsg.push('');
			}
		} catch (ex2) {}
		throw new Error(errmsg.join('\n'));
	}

	// find all of the titanium symbols
	traverse(ast, {
		MemberExpression: {
			enter: function(path) {
				var memberExpr = getTitaniumExpression(path.node);
				if (memberExpr) {
					symbols[memberExpr.substring(9)] = 1; // Drop leading 'Titanium.'
					if (!opts.skipStats) {
						if (apiUsage[memberExpr] === void 0) {
							apiUsage[memberExpr] = 1;
						} else {
							apiUsage[memberExpr]++;
						}
					}
				}
			}
		}
	});

	// convert the object of symbol names to an array of symbol names
	results.symbols = Object.keys(symbols);

	// minify
	if (opts.minify) {
		var minified = babel.transformFromAst(ast, contents, {minified: true, compact: true, comments: false, presets: ['babili']});
		results.contents = minified.code;
	}

	return results;
};

/**
 * Analyzes an HTML file for all app:// JavaScript files
 *
 * @param {String} file - The full path to the HTML file
 * @param {String} [relPath] - A relative path to the HTML file with respect to the Resources directory
 * @returns {Array} An array of app:// JavaScript files
 */
exports.analyzeHtmlFile = function analyzeHtmlFile(file, relPath) {
	return exports.analyzeHtml(fs.readFileSync(file).toString(), relPath);
};

/**
 * Analyzes a string containing JavaScript for all Titanium API symbols.
 *
 * @param {String} contents - A string of JavaScript
 * @param {String} [relPath] - A relative path to the HTML file with respect to the Resources directory
 * @returns {Array} An array of app:// JavaScript files
 */
exports.analyzeHtml = function analyzeHtml(contents, relPath) {
	var files = [];

	function addFile(src) {
		var m = src && src.match(/^(?:(.*)\:\/\/)?(.+)/),
			res = m && m[2];
		if (res) {
			if (!m[1]) {
				if (relPath && res.indexOf('/') != 0) {
					res = relPath.replace(/\/$/, '') + '/' + res;
				}

				// compact the path
				p = res.split(/\/|\\/);
				r = [];
				while (q = p.shift()) {
					if (q == '..') {
						r.pop();
					} else {
						r.push(q);
					}
				}

				files.push(r.join('/'));
			} else if (m[1] == 'app') {
				files.push(res);
			}
		}
	}

	try {
		var dom = new DOMParser({ errorHandler: function(){} }).parseFromString('<temp>\n' + contents + '\n</temp>', 'text/html'),
			doc = dom && dom.documentElement,
			scripts = doc && doc.getElementsByTagName('script'),
			i, len, src, m, p, q, r;

		if (scripts) {
			for (i = 0, len = scripts.length; i < len; i++) {
				src = scripts[i].getAttribute('src');
				src && addFile(src);
			}
		}
	} catch (e) {
		// bad html file, try to manually parse out the script tags
		contents.split('<script').slice(1).forEach(function (chunk) {
			var p = chunk.indexOf('>');
			if (p != -1) {
				var m = chunk.substring(0, p).match(/src\s*=\s*['"]([^'"]+)/);
				if (!m) {
					// try again without the quotes
					m = chunk.substring(0, p).match(/src\s*=\s*([^>\s]+)/);
				}
				m && addFile(m[1]);
			}
		});
	}

	return files;
};
