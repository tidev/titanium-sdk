/**
 * Time formatting functions.
 *
 * @module time
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * Formats the time difference between two date objects to easier human readable
 * format.
 * @param {Date} from - The first date
 * @param {Date} to - The second date
 * @param {Object} [opts] - Pretty diff options
 * @param {Boolean} [opts.colorize] - Formats the numeric value in color
 * @param {Boolean} [opts.hideMS] - When true, does not print the milliseconds
 * @param {Boolean} [opts.showFullName] - When true, uses long name, otherwise uses the abbreviation
 * @returns {String} The formatted time difference
 */
exports.prettyDiff = function prettyDiff(from, to, opts) {
	var __n = require('./i18n')(__dirname).__n,
		delta = Math.abs(to - from),
		x,
		s = [];

	opts = opts || {};

	x = Math.floor(delta / (24 * 60 * 60 * 1000)),
	x && s.push((opts.colorize ? ('' + x).cyan : x) + (opts.showFullName ? ' ' + __n('day', 'days', x) : 'd'));
	delta = delta % (24 * 60 * 60 * 1000);

	x = Math.floor(delta / (60 * 60 * 1000)),
	x && s.push((opts.colorize ? ('' + x).cyan : x) + (opts.showFullName ? ' ' + __n('hour', 'hours', x) : 'h'));
	delta = delta % (60 * 60 * 1000);

	x = Math.floor(delta / (60 * 1000));
	x && s.push((opts.colorize ? ('' + x).cyan : x) + (opts.showFullName ? ' ' + __n('minute', 'minutes', x) : 'm'));
	delta = delta % (60 * 1000);

	x = Math.floor(delta / 1000);
	x && s.push((opts.colorize ? ('' + x).cyan : x) + (opts.showFullName ? ' ' + __n('second', 'seconds', x) : 's'));
	delta = delta % 1000;

	if (!opts.hideMS && (s.length == 0 || delta)) {
		 s.push((opts.colorize ? ('' + delta).cyan : delta) + 'ms');
	}

	return s.join(' ');
};

/**
 * Creates a ISO-like timestamp.
 * @returns {String} The timestamp
 */
exports.timestamp = function timestamp() {
	return (new Date).toISOString().replace('Z', "+0000");
};
