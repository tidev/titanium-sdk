/**
 * Xcode xcconfig parser.
 *
 * @module xcconfig
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs');

module.exports = xcconfig;

/**
 * Loads and parses a xcconfig file.
 * @class
 * @classdesc Loads a xcconfig file into a JSON object.
 * @constructor
 * @param {String} [file] - The path to the xcconfig file
 */
function xcconfig(file) {

	/**
	 * Loads the xcconfig file if it exists.
	 * @param {String} file - The path to the xcconfig file
	 * @returns {Object} The xcconfig object instance
	 * @throws {Error} If xcconfig file does not exist
	 */
	Object.defineProperty(this, 'load', {
		value: function (file) {
			if (!fs.existsSync(file)) {
				throw new Error('xcconfig file does not exist');
			}
			return this.parse(fs.readFileSync(file).toString());
		}
	});

	/**
	 * Parses the xcconfig file.
	 * @param {String} str - The contents of the xcconfig file
	 * @returns {Object} The xcconfig object instance
	 */
	Object.defineProperty(this, 'parse', {
		value: function (str) {
			var re = /(([^\[=]+)(\[[^\]]+\])?) *=? *(.+)/;
			str.split('\n').forEach(function (line) {
				var p = line.indexOf('//');
				if (p != -1) {
					line = line.substring(0, p);
				}
				var parts = line.split(re);
				if (parts.length >= 5) {
					this[parts[1].trim()] = parts[4].trim();
				}
			}, this);
			return this;
		}
	});

	file && this.load(file);
}
