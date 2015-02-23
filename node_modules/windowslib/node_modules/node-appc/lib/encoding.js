/**
 * String encoding/decoding functions.
 *
 * @module encoding
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * Decodes an string with octals to a utf-8 string.
 * @param {String} input - The string to decode
 * @returns {String} The decoded string
 */
exports.decodeOctalUTF8 = function decodeOctalUTF8(input) {
	var result = '',
		i = 0,
		l = input.length,
		c, octByte;

	for (; i < l; i++) {
		c = input.charAt(i);
		if (c == '\\') {
			octByte = input.substring(i + 1, i + 4);
			try {
				result += String.fromCharCode(parseInt(octByte, 8));
				i += 3;
			} catch (e) {
				result += '\\';
				input = octByte + input;
			}
		} else {
			result += c;
		}
	}

	return decodeURIComponent(escape(result));
};