/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

const times = new Map();
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

function logTime(label, logData) {
	label = `${label}`;
	const startTime = times.get(label);
	if (!startTime) {
		exports.warn(`Label "${label}" does not exist`);
		return true;
	}
	const duration = Date.now() - startTime;
	if (logData) {
		exports.log(`${label}: ${duration}ms`, ...logData);
	} else {
		exports.log(`${label}: ${duration}ms`);
	}
	return false;
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

exports.time = function (label = 'default') {
	label = `${label}`;
	if (times.has(label)) {
		exports.warn(`Label ${label}" already exists`);
		return;
	}
	times.set(label, Date.now());
};

exports.timeEnd = function (label = 'default') {
	const warned = logTime(label);
	if (!warned) {
		times.delete(label);
	}
};

exports.timeLog = function (label = 'default', ...logData) {
	logTime(label, logData);
};
