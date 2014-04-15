/**
 * Less restrictive semantic version comparision.
 *
 * @module version
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var semver = require('semver');

/**
 * Formats a version based on a minimum and maximum number of segments.
 * @param {String} ver - The version
 * @param {Number} [min] - The minimum number of segments
 * @param {Number} [max] - The maximum number of segments
 * @param {Boolean} [chopDash] - If true, chops off the dash and anything after it
 * @returns {String} The formatted version
 */
var format = exports.format = function format(ver, min, max, chopDash) {
	ver = ('' + (ver || 0));
	chopDash && (ver = ver.replace(/(\-.*)?$/, ''));
	ver = ver.split('.');
	if (min != void 0) {
		while (ver.length < min) {
			ver.push('0');
		}
	}
	if (max != void 0) {
		ver = ver.slice(0, max);
	}
	return ver.join('.');
};

/**
 * Converts two versions into 3 segment format, then checks if they are equal to each other.
 * @param {String} v1 - The first version to compare
 * @param {String} v2 - The second version to compare
 * @returns {Boolean} True if the versions are equal
 */
exports.eq = function eq(v1, v2) {
	return semver.eq(format(v1, 3, 3), format(v2, 3, 3));
};

/**
 * Converts two versions into 3 segment format, then checks if the first version is less than the
 * second version.
 * @param {String} v1 - The first version to compare
 * @param {String} v2 - The second version to compare
 * @returns {Boolean} True if the first version is less than the second version
 */
exports.lt = function lt(v1, v2) {
	return semver.lt(format(v1, 3, 3), format(v2, 3, 3));
};

/**
 * Converts two versions into 3 segment format, then checks if the first version is less than or
 * equal to the second version.
 * @param {String} v1 - The first version to compare
 * @param {String} v2 - The second version to compare
 * @returns {Boolean} True if the first version is less than or equal to the second version
 */
exports.lte = function lte(v1, v2) {
	return semver.lte(format(v1, 3, 3), format(v2, 3, 3));
};

/**
 * Converts two versions into 3 segment format, then checks if the first version is greater than the
 * second version.
 * @param {String} v1 - The first version to compare
 * @param {String} v2 - The second version to compare
 * @returns {Boolean} True if the first version is greater than the second version
 */
exports.gt = function gt(v1, v2) {
	return semver.gt(format(v1, 3, 3), format(v2, 3, 3));
};

/**
 * Converts two versions into 3 segment format, then checks if the first version is greater than or
 * equal to the second version.
 * @param {String} v1 - The first version to compare
 * @param {String} v2 - The second version to compare
 * @returns {Boolean} True if the first version is greater than or equal to the second version
 */
exports.gte = function gte(v1, v2) {
	return semver.gte(format(v1, 3, 3), format(v2, 3, 3));
};

/**
 * Determines the most minimum value of the supplied range.
 * @param {String} str - A string contain one or more versions or version ranges
 * @returns {String} The minimum version found or undefined
 */
exports.parseMin = function parseMin(str) {
	var min;

	str.split(/\s*\|\|\s*/).forEach(function (range) {
		var x = range.split(' ').shift().replace(/[^.\d]/g, '');
		if (!min || exports.lt(x, min)) {
			min = x;
		}
	});

	return min;
};

/**
 * Determines the most maximum value of the supplied range.
 * @param {String} str - A string contain one or more versions or version ranges
 * @returns {String} The maximum version found or undefined
 */
exports.parseMax = function parseMax(str) {
	var max, lt;

	str.split(/\s*\|\|\s*/).forEach(function (range) {
		var x = range.split(' ');
		x = (x.length == 1 ? x.shift() : x.slice(1).shift())
		var y = x.replace(/[^.\d]/g, '');
		if (!max || exports.gt(y, max)) {
			lt = /^\<[^=]\d/.test(x);
			max = y;
		}
	});

	return (lt ? '<' : '') + max;
};

/**
 * Checks if a version is in any of the supplied ranges.
 * @param {String} ver - The version to check
 * @param {String} str - The version ranges to validate against
 * @param {Boolean} [maybe] - If true and the version is greater than at least
 * one of the ranges, then it will return 'maybe'.
 * @returns {Boolean|String} True if the version matches one of the ranges
 */
exports.satisfies = function satisfies(ver, str, maybe) {
	ver = exports.format(ver, 3, 3, true);

	// if we get 1.x, we force it to 1.99999999 so that we should match
	str = str.replace(/(\<\=?\d+(\.\d+)*?)\.x/g, '$1.99999999').replace(/(\>\=?\d+(\.\d+)*?)\.x/g, '$1.0');

	try {
		if (str == '*' || exports.eq(ver, str)) return true;
	} catch (ex) {}

	var r = str.split(/\s*\|\|\s*/).some(function (range) {
		// semver is picky with the '-' in comparisons and it just so happens when it
		// parses versions in the range, it will add '-0' and cause '1.0.0' != '1.0.0-0',
		// so we test our version with and without the '-9'
		return range == '*' || semver.satisfies(ver, range) || (ver.indexOf('-') == -1 && semver.satisfies(ver + '-0', range));
	});

	// if true or we don't care if it maybe matches, then return now
	if (r || !maybe) return r;

	// need to determine if the version is greater than any range
	var range = new semver.Range(str);
	for (var i = 0; i < range.set.length; i++) {
		var set = range.set[i];
		for (var j = set.length - 1; j >= 0; j--) {
			if (set[j].semver instanceof semver.SemVer) {
				//console.log(ver, set[j].operator, set[j].semver, semver.cmp(ver, set[j].operator, set[j].semver, set[j].loose));
				if ((set[j].operator == '<' || set[j].operator == '<=') && !semver.cmp(ver, set[j].operator, set[j].semver, set[j].loose)) {
					return 'maybe';
				}
				break;
			}
		}
	}

	return false;
};

/**
 * Sorts an array of version numbers in ascending order.
 * @param {Array} arr - The array of version numbers to sort
 * @returns {Array} The sorted versions
 */
exports.sort = function sort(arr) {
	return arr.sort(function (a, b) {
		if (exports.eq(a, b)) {
			return 0;
		} else if (exports.gt(a, b)) {
			return 1;
		}
		return -1;
	});
};
