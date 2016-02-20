/**
 * Utility functions used by windowslib.
 *
 * @module utilities
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	EventEmitter = require('events').EventEmitter,
	fs = require('fs'),
	__ = appc.i18n(__dirname).__;

/**
 * Creates an event emitter, validates that the platform is Windows,
 * normalizes the 'options' and 'callback' arguments, and passes all
 * these goodies to the 'body' function. It's magik!
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [callback(err, ...)] - A function to call with the task is complete. This is guaranteed to be called asynchronously.
 *
 * @returns {EventEmitter}
 */
exports.magik = function magik(options, callback, body) {
	var emitter = new EventEmitter;
	emitter.on('error', function () {});

	process.nextTick(function () {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		} else if (!options) {
			options = {};
		}
		typeof callback === 'function' || (callback = function () {});

		if (process.platform !== 'win32') {
			var err = new Error(__('Unsupported platform "%s"', process.platform));
			emitter.emit('error', err);
			return callback(err);
		}

		body(emitter, options, callback);
	});

	return emitter;
};

exports.mix = function mix(src, dest) {
	Object.keys(src).forEach(function (name) {
		if (Array.isArray(src[name])) {
			if (Array.isArray(dest[name])) {
				dest[name] = dest[name].concat(src[name]);
			} else {
				dest[name] = src[name];
			}
		} else if (src[name] !== null && typeof src[name] === 'object') {
			dest[name] || (dest[name] = {});
			Object.keys(src[name]).forEach(function (key) {
				dest[name][key] = src[name][key];
			});
		} else {
			dest[name] = src[name];
		}
	});
};

/**
 * Determine if an executable needs to be rebuilt, based on whether the destination
 * file exists or has an older modified timestamp than the source file used to
 * generate it.
 *
 * @param {String} srcFile - Path to the source file used to generate the exe
 * @param {String} destFile - Path to the destination exe file
 * @param {Function} [callback(err, outdated)] - A function to call after checking
 **/
exports.checkOutdated = function checkOutdated(srcFile, destFile, callback) {
	// Be smart about rebuilding wstool if source is newer
	fs.stat(destFile, function (err, stats) {
		if (err) {
			// file does not exist, build the tool and then run
			if (err.code === 'ENOENT') {
				return callback(null, true); // rebuild
			}
			// some other error
			return callback(err);
		}

		// Compare src and dest modified times
		var sourceStats = fs.statSync(srcFile);
		if (sourceStats.mtime > stats.mtime) {
			// delete generated file and and rebuild
			return fs.unlink(destFile, function (err) {
				if (err) {
					return callback(err);
				}
				return callback(null, true); // rebuild
			});
		}
		return callback(null, false); // run
	});
};
