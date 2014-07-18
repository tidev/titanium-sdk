/**
 * String formatting functions.
 *
 * @module string
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var __ = require('./i18n')(__dirname).__;

/**
 * Pads the left side of a string so that the total length equals the specified
 * length. If the string is longer than the length, the string is not padded.
 * @param {String} s - The string to pad
 * @param {Number} len - The total length of the string including padding
 * @param {String} [ch] - The character to use for the padding
 * @returns {String} The padded string
 */
exports.lpad = function lpad(s, len, ch) {
	var pre = '',
		ns = String(s).replace(/\u001b\[\d+m/g, ''),
		i = ns.length;
	ch = ch || ' ';
	while (i++ < len) {
		pre += ch;
	}
	return pre + ns;
};

/**
 * Pads the right side of a string so that the total length equals the specified
 * length. If the string is longer than the length, the string is not padded.
 * @param {String} s - The string to pad
 * @param {Number} len - The total length of the string including padding
 * @param {String} [ch] - The character to use for the padding
 * @returns {String} The padded string
 */
exports.rpad = function rpad(s, len, ch) {
	var ns = String(s).replace(/\u001b\[\d+m/g, ''),
		i = ns.length;
	ch = ch || ' ';
	while (i++ < len) {
		ns += ch;
	}
	return ns;
};

/**
 * Capitalizes the specified string. Only the first character is uppercased.
 * @param {String} s - The string to capitalize
 * @returns {String} The capitalized string
 */
exports.capitalize = function capitalize(s) {
	return s.substring(0, 1).toUpperCase() + s.substring(1);
};

/**
 * Measures the distance between two strings.
 * @param {String} s - The first string
 * @param {String} c - The second string
 * @returns {Number} The distance
 */
exports.levenshtein = function levenshtein(s, c) {
	var len1 = (s = s.split('')).length,
		len2 = (c = c.split('')).length,
		a = [],
		i = len1 + 1,
		j;

	if (!(len1 || len2)) {
		return Math.max(len1, len2);
	}
	for (; i; a[--i] = [i]);
	for (i = len2 + 1; a[0][--i] = i;);
	for (i = -1; ++i < len1;) {
		for (j = -1; ++j < len2;) {
			a[i + 1][j + 1] = Math.min(a[i][j + 1] + 1, a[i + 1][j] + 1, a[i][j] + (s[i] != c[j]));
		}
	}
	return a[len1][len2];
};

/**
 * Compares a string to an array of options and suggests close matches based on a given threshold.
 * @param {String} value - The string to compare
 * @param {Array<String>} options - An array of options to compare
 * @param {Function} logger - A function that prints output
 * @param {Number} [threshold=3] - The match threshold
 */
exports.suggest = function suggest(value, options, logger, threshold) {
	value = '' + value;
	threshold = threshold || 3;

	var suggestions = options.filter(function (opt) {
		return opt.indexOf(value) == 0 || exports.levenshtein(value, opt) <= threshold;
	});

	if (suggestions.length) {
		logger(__('Did you mean this?'));
		suggestions.forEach(function (s) {
			logger('    ' + s.cyan);
		});
		logger();
	}
};

/**
 * Inserts line breaks into a string so that the text does not exceed the
 * specified width.
 * @param {String} str - The string to line wrap
 * @param {Number} [width] - The width to break the lines; defaults to the terminal width
 * @returns {String} The wrapped text
 */
exports.wrap = function wrap(str, width) {
	width = width | 0;

	if (width <= 0) {
		return str;
	}

	return str.split('\n').map(function (line) {
		var i = 0,
			j = 0,
			k,
			next;

		while (i < line.length) {
			if (line.charAt(i) == '\u001b') {
				// fast forward!
				i += 5;
			} else {
				i++;
				if (++j >= width) {
					// backpedal
					for (k = i; k >= 0; k--) {
						if (/[ ,;!?]/.test(line[k]) || (/[.:]/.test(line[k]) && (k + 1 >= line.length || /[ \t\r\n]/.test(line[k + 1])))) {
							if (k + 1 < line.length) {
								line = line.substring(0, k) + '\n' + line.substring(k + 1);
								i = k + 1;
								j = 0;
							}
							break;
						}
					}
				}
			}
		}
		return line;
	}).join('\n');
};

/**
 * Helper function to renders an array of items into columns.
 * @param {Array} items - The items to render
 * @param {String} margin - The left margin
 * @param {Number} maxwidth - The the maximum width before wrapping
 * @returns {String} The rendered columns
 */
exports.renderColumns = function renderColumns(items, margin, maxwidth) {
	var margin = (margin || ''),
		longest = items.reduce(function (a, b) { return Math.max(a, b.stripColors.length);}, 0) + 6,
		width = maxwidth ? Math.min(maxwidth, process.stdout.columns || 80): (process.stdout.columns || 80),
		i, j, spaces,
		len = items.length,
		cols = Math.floor((width - margin.length) / longest),
		rows = Math.ceil(len / cols),
		buffer = '';

	for (i = 0; i < rows; i++) {
		buffer += margin;
		for (j = 0; j < len; j += rows) {
			if (j + i < len) {
				buffer += items[i + j];
				spaces = longest - items[i + j].stripColors.length;
				if (spaces > 0 && j + i + rows < len) {
					buffer += (new Array(spaces)).join(' ');
				}
			}
		}
		if (i + 1 < rows) {
			buffer += '\n';
		}
	}

	return buffer;
};
