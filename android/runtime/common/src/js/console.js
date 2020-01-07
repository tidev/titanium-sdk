/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2020 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

function join(args) {
	// Handle null / undefined args up front since we can't slice them
	if (typeof args === 'undefined') {
		return 'undefined';
	} else if (args === null) {
		return 'null';
	}

	return [].concat(Array.prototype.slice.call(args)).map(function (arg) {
		if (typeof arg === 'undefined') {
			return 'undefined';
		}

		return (arg === null)
			? 'null'
			: ((typeof arg === 'object')
				? (Object.prototype.hasOwnProperty.call(arg, 'toString') ? arg.toString() : JSON.stringify(arg))
				: arg);
	}).join(' ');
}

exports.log = function () {
	Titanium.API.info(join(arguments));
};

exports.info = function () {
	Titanium.API.info(join(arguments));
};

exports.warn = function () {
	Titanium.API.warn(join(arguments));
};

exports.error = function () {
	Titanium.API.error(join(arguments));
};

exports.debug = function () {
	Titanium.API.debug(join(arguments));
};

