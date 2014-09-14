/**
 * @overview
 * Analyzes Titanium JavaScript files for symbols and optionally minifies the code.
 *
 * @module lib/jsanalyze
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	DOMParser = require('xmldom').DOMParser,
	UglifyJS = require('uglify-js'),
	__ = appc.i18n(__dirname).__,
	apiUsage = {};

// silence uglify's default warn mechanism
UglifyJS.AST_Node.warn_function = function () {};

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
		ast = UglifyJS.parse(contents, { filename: opts.filename });
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
	var walker = new UglifyJS.TreeWalker(function (node, descend) {
			if (node instanceof UglifyJS.AST_SymbolRef && tiNodeRegExp.test(node.name)) {
				var p = walker.stack,
					buffer = [],
					symbol,
					i = p.length - 1; // we already know the top of the stack is Ti

				// loop until 2nd from bottom of stack since the bottom is the toplevel node which we don't care about
				while (--i) {
					if (p[i] instanceof UglifyJS.AST_Dot) {
						buffer.push(p[i].property);
					} else if (p[i] instanceof UglifyJS.AST_Symbol || p[i] instanceof UglifyJS.AST_SymbolRef) {
						buffer.push(p[i].name);
					} else {
						break;
					}
				}

				if (buffer.length) {
					// the build is only interested in finding Titanium.* symbols
					symbols[buffer.join('.')] = 1;

					if (!opts.skipStats) {
						// analytics wants all symbols
						if (node.name == 'Ti') {
							buffer.unshift('Titanium');
						} else {
							buffer.unshift(node.name);
						}

						var api = buffer.join('.');
						if (apiUsage[api] === void 0) {
							apiUsage[api] = 1;
						} else {
							apiUsage[api]++;
						}
					}
				}

			}
		}.bind(this));

	ast.walk(walker);

	// convert the object of symbol names to an array of symbol names
	results.symbols = Object.keys(symbols);

	// minify
	if (opts.minify) {
		ast.figure_out_scope();
		ast = ast.transform(UglifyJS.Compressor());
		ast.figure_out_scope();
		ast.compute_char_frequency();
		ast.mangle_names();
		var stream = UglifyJS.OutputStream();
		ast.print(stream);
		results.contents = stream.toString();
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
