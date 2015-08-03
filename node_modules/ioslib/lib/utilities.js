/**
 * Utility functions used by ioslib.
 *
 * @module utilities
 *
 * @copyright
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
    appc = require('node-appc'),
	bplist = require('bplist-parser'),
    crypto = require('crypto'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    __ = appc.i18n(__dirname).__;

exports.magik = magik;
exports.hash = hash;
exports.readPlist = readPlist;

/**
 * Creates an event emitter, validates that the platform is OS X,
 * normalizes the 'options' and 'callback' arguments, and passes all
 * these goodies to the 'body' function. It's magik!
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Function} [callback(err, ...)] - A function to call with the task is complete. This is guaranteed to be called asynchronously.
 *
 * @returns {EventEmitter}
 */
function magik(options, callback, body) {
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

        if (process.platform !== 'darwin') {
            var err = new Error(__('Unsupported platform "%s"', process.platform));
            emitter.emit('error', err);
            return callback(err);
        }

        body(emitter, options, callback);
    });

    return emitter;
};

/**
 * MD5 hashes the specified string.
 *
 * @param {String|Buffer} str - The string to hash.
 *
 * @returns {String} The MD5 hash.
 */
function hash(str) {
	return crypto.createHash('md5').update(str || '').digest('hex');
};

/**
 * Parses both ascii and binary plist files and returns a JSON representation.
 *
 * @param {String} file - The path to the plist file.
 *
 * @returns {Object|null} - Returns a JSON representation of the plist file or null if the file does not exist or unable to parse.
 */
function readPlist(file) {
	try {
		if (fs.existsSync(file)) {
			var buffer = fs.readFileSync(file),
				header = buffer.slice(0, 'bplist'.length).toString('utf8');
			if (header === 'bplist') {
				return bplist.parseBuffer(buffer)[0];
			} else {
				return (new appc.plist()).parse(buffer.toString());
			}
		}
	} catch (ex) {}
	return null;
}