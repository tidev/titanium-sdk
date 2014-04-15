/**
 * Misc utilities.
 *
 * @module util
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * Mixes multiple objects into a single object.
 * @param {Object} dest - The object where the values are merged
 * @param {Object} ... - The objects to mix in
 * @returns {Object} The mixed object, which is also the original destination
 */
exports.mix = function mix(dest) {
	var i, l, src, p;
	dest || (dest = {});
	for (i = 1, l = arguments.length; i < l; i++) {
		src = arguments[i];
		for (p in src) {
			(!src.hasOwnProperty || src.hasOwnProperty(p)) && (dest[p] = src[p]);
		}
	}
	return dest;
};

/**
 * Deep mixes multiple objects into a single object.
 * @param {Object} dest - The object where the values are merged
 * @param {Object} ... - The objects to mix in
 * @returns {Object} The mixed object, which is also the original destination
 */
exports.mixObj = function mixObj(dest) {
	dest || (dest = {});
	for (var i = 1, l = arguments.length; i < l; i++) {
		mixer(dest, arguments[i]);
	}
	return dest;
};

/**
 * Mixes one object into another.
 * @param {Object} dest - The destination
 * @param {*} src - The source
 * @private
 */
function mixer(dest, src) {
	Object.keys(src).forEach(function (prop) {
		if (!/^\+/.test(prop)) {
			if (Object.prototype.toString.call(src[prop]) == '[object Object]') {
				dest.hasOwnProperty(prop) || (dest[prop] = {});
				mixer(dest[prop], src[prop]);
			} else if (Array.isArray(dest[prop])) {
				dest[prop] = dest[prop].concat(src[prop]);
			} else {
				dest[prop] = src[prop];
			}
		}
	});
}
