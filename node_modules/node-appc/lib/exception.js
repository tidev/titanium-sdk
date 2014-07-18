/**
 * Improved exception class that allows for additional error details.
 *
 * @module exception
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var sprintf = require('sprintf').sprintf;

module.exports = AppcException;

/**
 * Creates the throwable AppcException.
 * @class
 * @classdesc An exception class that allows for additional details
 * @constructor
 * @param {String} message - The primary error message
 * @param {Array<String>} [details] - An array of additional error details
 * @extends {Error}
 */
function AppcException(message, details) {
	this.type = 'AppcException';
	this.message = message || '';
	this.details = details ? (Array.isArray(details) ? details : [details]) : [];
}

AppcException.prototype = new Error;

/**
 * Logs any additional errors.
 * @param {String} ... - Additional error messages
 */
AppcException.prototype.log = function () {
	this.details.push(sprintf.apply(null, Array.prototype.slice.call(arguments)));
};

/**
 * Prints the exception and its details to the specified logger.
 * @param {Function|Object} logger - A log function or object containing 'log()' and 'error()' methods
 */
AppcException.prototype.dump = function (logger) {
	var type = Object.prototype.toString.call(logger);
	if (type == '[object Object]' && (logger.error || logger.log)) {
		(logger.error || logger.log)(this.message);
		this.details.forEach(logger.log || logger.error);
	} else if (type == '[object Function]') {
		logger(this.message);
		this.details.forEach(logger);
	} else {
		throw this;
	}
};

/**
 * Renders the exception and its details to a string.
 * @returns {String} The complete error message
 */
AppcException.prototype.toString = function () {
	return [ this.message ].concat(this.details).join('\n');
};
