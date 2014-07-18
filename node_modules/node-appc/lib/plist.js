/**
 * Parses plist files into a JSON object, then
 *
 * @module plist
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	xml = require('./xml'),
	DOMParser = require('xmldom').DOMParser;

module.exports = plist;

/**
 * Creates a JavaScript type-friendly plist value.
 * @class
 * @classdesc An object to represent JavaScript type-friendly plist value.
 * @constructor
 * @param {String} type - The custom data type
 * @param {*} value - The value
 */
function PlistType(type, value) {
	this.className = 'PlistType';
	this.type = type;
	this.value = type == 'real' && ~~value === value ? value.toFixed(1) : value;
}

/**
 * JSON stringify formatter that properly translates PlistType objects.
 * @param {String} key - The object key
 * @param {*} value - The value being stringify
 */
function plistTypeFormatter(key, value) {
	if (value && typeof value == 'object' && value.className == 'PlistType') {
		return value.value;
	}
	return value;
}

/**
 * Recursively converts a JSON object to XML.
 * @param {Object} dom - The destination XML DOM
 * @param {Object} parent - The parent object XML DOM node
 * @param {*} it - The variable to add to the XML DOM
 * @param {Number} [indent=0] - The depth in which to indent
 */
function toXml(dom, parent, it, indent) {
	var i = indent || 0,
		p,
		q = parent,
		type = Object.prototype.toString.call(it);

	while (q.parentNode) {
		i++;
		q = q.parentNode;
	}

	switch (type) {
		case '[object Object]':
			if (it.className == 'PlistType') {
				dom.create(it.type, it.value, parent);
			} else {
				p = dom.create('dict', null, parent);
				Object.keys(it).forEach(function (name) {
					dom.create('key', name, p);
					toXml(dom, p, it[name], indent);
				});
				p.appendChild(dom.createTextNode('\r\n' + new Array(i).join('\t')));
			}
			break;

		case '[object Array]':
			p = dom.create('array', null, parent);
			it.forEach(function (val) {
				toXml(dom, p, val, indent);
			});
			p.appendChild(dom.createTextNode('\r\n' + new Array(i).join('\t')));
			break;

		case '[object Date]':
			// note: plists do not support milliseconds
			dom.create('date', it.toISOString().replace(/\.\d+Z$/, 'Z'), parent);
			break;

		case '[object Boolean]':
			p = dom.create(!!it ? 'true' : 'false', null, parent);
			break;

		case '[object Null]':
			break;

		case '[object String]':
			dom.create('string', it, parent);
			break;

		case '[object Number]':
			dom.create(~~it === it ? 'integer' : 'real', it, parent);
			break;
	}
}

/**
 * Recursively walks a XML node that represents a plist <dict> tag.
 * @param {Object} obj - The destination JSON object
 * @param {Object} ndoe - The DOM node to walk
 */
function walkDict(obj, node) {
	var key, next;

	while (node) {
		if (node.nodeType == xml.ELEMENT_NODE && node.tagName == 'key') {
			key = (node.firstChild && node.firstChild.data || '').trim();

			next = node.nextSibling;
			while (next && next.nodeType != xml.ELEMENT_NODE) {
				next = next.nextSibling;
			}

			if (next.tagName == 'key') {
				obj[key] = null;
				node = next;
				continue;
			}

			if (next) {
				if (next.tagName == 'true') {
					obj[key] = true;
					node = next;
				} else if (next.tagName == 'false') {
					obj[key] = false;
					node = next;
				} else if (next.tagName == 'string') {
					obj[key] = '' + (next.firstChild && next.firstChild.data || '').trim(); // cast all values as strings
					node = next;
				} else if (next.tagName == 'integer') {
					obj[key] = parseInt(next.firstChild && next.firstChild.data) || 0;
					node = next;
				} else if (next.tagName == 'real') {
					obj[key] = parseFloat(next.firstChild && next.firstChild.data) || 0;
					node = next;
				} else if (next.tagName == 'date') {
					// note: plists do not support milliseconds
					var d = (next.firstChild && next.firstChild.data || '').trim();
					obj[key] = d ? new Date(d) : null; // note: toXml() can't convert a null date back to a <date> tag
					node = next;
				} else if (next.tagName == 'array') {
					walkArray(obj[key] = [], next.firstChild);
					node = next;
				} else if (next.tagName == 'dict') {
					walkDict(obj[key] = {}, next.firstChild);
				} else if (next.tagName == 'data') {
					obj[key] = new PlistType('data', (next.firstChild && next.firstChild.data || '').replace(/\s*/g, ''));
					node = next;
				}
			}
		}
		node = node.nextSibling;
	}
}

/**
 * Recursively walks a XML node that represents a plist <array> tag.
 * @param {Array} arr - The destination JavaScript array
 * @param {Object} node - The DOM node to walk
 */
function walkArray(arr, node) {
	while (node) {
		if (node.nodeType == xml.ELEMENT_NODE) {
			switch (node.tagName) {
				case 'string':
					arr.push('' + (node.firstChild && node.firstChild.data || '').trim());
					break;

				case 'integer':
					arr.push(parseInt(node.firstChild && node.firstChild.data) || 0);
					break;

				case 'real':
					arr.push(parseFloat(node.firstChild && node.firstChild.data) || 0.0);
					break;

				case 'true':
					arr.push(true);
					break;

				case 'false':
					arr.push(false);
					break;

				case 'array':
					var a = [];
					walkArray(a, node.firstChild);
					arr.push(a);
					break;

				case 'date':
					// note: plists do not support milliseconds
					var d = (node.firstChild && node.firstChild.data || '').trim();
					arr.push(d ? new Date(d) : null);
					break;

				case 'dict':
					var obj = {};
					walkDict(obj, node.firstChild);
					arr.push(obj);
					break;

				case 'data':
					arr.push(new PlistType('data', (node.firstChild && node.firstChild.data || '').replace(/\s*/g, '')));
			}
		}
		node = node.nextSibling;
	}
}

/**
 * Converts an XML DOM to a JSON object.
 * @param {Object} obj - The destination JSON object
 * @param {Object} doc - The DOM node to walk
 */
function toJS(obj, doc) {
	var node = doc.firstChild;

	// the first child should be a <dict> element
	while (node) {
		if (node.nodeType == xml.ELEMENT_NODE && node.tagName == 'dict') {
			node = node.firstChild;
			break;
		}
		node = node.nextSibling;
	}

	node && walkDict(obj, node);
}

/**
 * Creates an empty plist object or loads and parses a plist file.
 * @class
 * @classdesc An object that represents a plist as a JavaScript object.
 * @constructor
 * @param {String} [filename] - A plist file to load
 */
function plist(filename) {

	/**
	 * Loads and parses a plist file.
	 * @param {String} file - A plist file to load
	 * @returns {plist} The plist instance
	 * @throws {Error} If plist file does not exist
	 */
	Object.defineProperty(this, 'load', {
		value: function (file) {
			if (!fs.existsSync(file)) {
				throw new Error('plist file does not exist');
			}
			return this.parse(fs.readFileSync(file).toString());
		}
	});

	/**
	 * Parses a plist from a string.
	 * @param {String} str - The plist string
	 * @returns {plist} The plist instance
	 * @throws {Error} If plist is malformed XML
	 */
	Object.defineProperty(this, 'parse', {
		value: function (str) {
			// need to backup the original console.error since parse errors
			// will print to stderr and throw, but we only want it to throw
			var origConsoleError = console.error;
			console.error = function () {};
			try {
				var dom = new DOMParser().parseFromString(str, 'text/xml');
				console.error = origConsoleError;
				toJS(this, dom.documentElement);
			} catch (ex) {
				console.error = origConsoleError;
				throw ex;
			}
			return this;
		}
	});

	/**
	 * Serializes a plist instance to an XML document.
	 * @param {Number} [indent=0] - The depth in which to indent
	 * @returns {Object} A XML document object
	 */
	Object.defineProperty(this, 'toXml', {
		value: function (indent) {
			var dom = new DOMParser().parseFromString('<plist version="1.0"/>');

			dom.create = function (tag, nodeValue, parent) {
				var node = dom.createElement(tag),
					i = indent || 0,
					p = parent;

				nodeValue && node.appendChild(dom.createTextNode(''+nodeValue));

				if (p) {
					while (p.parentNode) {
						i++;
						p = p.parentNode;
					}
					parent.appendChild(dom.createTextNode('\r\n' + new Array(i).join('\t')));
				}

				parent && parent.appendChild(node);

				return node;
			};

			toXml(dom, dom.documentElement, this, indent);

			dom.documentElement.appendChild(dom.createTextNode('\r\n'));

			return dom.documentElement;
		}
	});

	/**
	 * Creates a custom plist data type.
	 * @param {String} type - The custom data type
	 * @param {*} value - The value
	 * @returns {PlistType} The plist data value
	 */
	Object.defineProperty(this, 'type', {
		value: function (type, value) {
			return new PlistType(type, value);
		}
	});

	/**
	 * Serializes a plist instance to a string.
	 * @param {String} [fmt] - The format: undefined, 'xml', 'pretty-json', or 'json'
	 * @returns {String} The serialized plist
	 */
	Object.defineProperty(this, 'toString', {
		value: function (fmt) {
			if (fmt == 'xml') {
				return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
					+ this.toXml().toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			} else if (fmt == 'pretty-json') {
				return JSON.stringify(this, plistTypeFormatter, '\t');
			} else if (fmt == 'json') {
				return JSON.stringify(this, plistTypeFormatter);
			}
			return Object.prototype.toString.call(this);
		}
	});

	/**
	 * Serializes a plist instance to XML, then writes it to the specified file.
	 * @param {String} file - The plist file to be written
	 * @returns {plist} The plist instance
	 */
	Object.defineProperty(this, 'save', {
		value: function (file) {
			if (file) {
				wrench.mkdirSyncRecursive(path.dirname(file));
				fs.writeFileSync(file, this.toString('xml'));
			}
			return this;
		}
	});

	filename && this.load(filename);
}
