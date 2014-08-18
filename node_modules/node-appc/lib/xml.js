/**
 * Functions to help with walking and parsing XML documents. It assumes you are
 * using the 'xmldom' Node module.
 *
 * @module xml
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * @constant {Number} Node type constant for an element node.
 */
var ELEMENT_NODE = exports.ELEMENT_NODE = 1;

/**
 * Loops through all child element nodes for a given XML node skipping all
 * non-element nodes (i.e. text, comment, etc) and calls the specified function
 * for each element node found.
 * @param {Object} node - An XML node
 * @param {Function} fn - The function to call for each element node found
 */
exports.forEachElement = function forEachElement(node, fn) {
	var child = node.firstChild;
	while (child) {
		if (child.nodeType == ELEMENT_NODE) {
			fn(child);
		}
		child = child.nextSibling;
	}
};

/**
 * Loops through all attributes for a given DOM node and calls a function for
 * each attribute.
 * @param {Object} node - An XML node
 * @param {Function} fn - The function to call for each attribute
 */
exports.forEachAttr = function forEachAttr(node, fn) {
	for (var i = 0, len = node.attributes.length; i < len; i++) {
		fn(node.attributes.item(i));
	}
};

/**
 * Parses a XML value and converts the value to a JS value if it detects it as a
 * boolean, null, or a number.
 * @param {String} value - The value of the XML node
 * @returns {String|Number|Boolean|Null} The parsed value
 */
exports.parse = function parse(value) {
	var num = value && String(value).indexOf('0x') == 0 ? value : Number(value);
	if (value === '' || typeof value !== 'string' || isNaN(num)) {
		value = value == void 0 ? '' : value.toString().trim();
		value === 'null' && (value = null);
		value === 'true' && (value = true);
		value === 'false' && (value = false);
		return value;
	}
	return num;
};

/**
 * Gets and parses an attribute of an XML node. If attribute does not exist, it
 * returns an empty string.
 * @param {Object} node - An XML node
 * @param {String} attr - The name of the attribute to get
 * @returns {String|Number|Boolean|Null} The value of the attribute or empty
 *          string if attribute does not exist
 */
exports.getAttr = function getAttr(node, attr) {
	return node && exports.parse(node.getAttribute(attr));
};

/**
 * Determines if the specified XML node has a child data node and returns it.
 * @param {Object} node - An XML node
 * @returns {String} The value of the XML node
 */
exports.getValue = function getValue(node) {
	return node && node.firstChild ? exports.parse(node.firstChild.data) : '';
};
