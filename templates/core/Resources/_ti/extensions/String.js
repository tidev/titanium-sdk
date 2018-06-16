/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

// Determines if given object is not of type function.
function isNotFunction(object) {
	return (typeof object) !== 'function';
}

// Add ES6 String.startsWith() method if not found. (Missing on iOS 8.)
if (isNotFunction(String.prototype.startsWith)) {
	String.prototype.startsWith = function (searchString, position) {
		if ((typeof searchString) !== 'string') {
			return false;
		}
		if (searchString.length > this.length) {
			return false;
		}
		if (((typeof position) !== 'number') || (position < 0)) {
			position = 0;
		}
		if (position > this.length) {
			return false;
		}
		return (this.indexOf(searchString, position) >= 0);
	};
}

// Add ES6 String.endsWith() method if not found. (Missing on iOS 8.)
if (isNotFunction(String.prototype.endsWith)) {
	String.prototype.endsWith = function (searchString, length) {
		if ((typeof searchString) !== 'string') {
			return false;
		}
		if (searchString.length > this.length) {
			return false;
		}
		if (((typeof length) !== 'number') || (length > this.length)) {
			length = this.length;
		}
		if ((length - searchString.length) < 0) {
			return false;
		}
		return (this.substr(length - searchString.length, searchString.length) === searchString);
	};
}

// Add ES6 String.includes() method if not found. (Missing on iOS 8.)
if (isNotFunction(String.prototype.includes)) {
	String.prototype.includes = function (searchString, position) {
		return (this.indexOf(searchString, position) >= 0);
	};
}

// Add ES6 String.repeat() method if not found. (Missing on iOS 8.)
if (isNotFunction(String.prototype.repeat)) {
	String.prototype.repeat = function (count) {
		var result;

		// Validate argument.
		if ((typeof count) !== 'number') {
			count = 0;
		}
		if ((count < 0) || (count === Infinity)) {
			throw new RangeError('Invalid count value');
		}

		// Generate a new string, repeating "this" string by given count.
		result = '';
		for (count = Math.floor(count); count > 0; count--) {
			result += this;
		}
		return result;
	};
}
