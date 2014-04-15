/**
 * Parses plist files into a JSON object, then
 *
 * @module plist
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * Copyright (c) 2010 Charlie Robbins.
 * {@link https://github.com/indexzero/node-pkginfo}
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path'),
	root = path.resolve('/'),
	cache = {};

/**
 * Attempts to locate and load the current module's manifest.json.
 * @param {Object} pmodule - A module object (i.e. the 'module' variable)
 * @returns {Object} The manifest properties
 */
exports.manifest = function manifest(pmodule) {
	return runner(pmodule, 'manifest.json');
};

/**
 * Attempts to locate and load the current module's package.json.
 * @param {Object} pmodule - A module object (i.e. the 'module' variable)
 * @param {String} ... - A specific property you are interested, all others are ignored
 * @returns {Object} The package properties
 */
exports.package = function package(pmodule) {
	var keepers = Array.prototype.slice.call(arguments, 1),
		results = runner(pmodule, 'package.json');

	keepers.length && Object.keys(results).forEach(function (k) {
		if (keepers.indexOf(k) == -1) {
			delete results[k];
		}
	});

	return results;
};

/**
 * Scans all the way from a specific directory to the root for a given filename.
 * @param {Object} pmodule - A module object (i.e. the 'module' variable)
 * @param {String} [dir] - The directory to scan
 * @param {String} [filename] - The filename we are looking for
 * @returns {String} If found, the path to the file
 * @throws {Error} If the file could not be found
 * @private
 */
function find(pmodule, dir, filename) {
	dir = dir || pmodule.filename;
	dir = path.dirname(dir);

	var files = fs.readdirSync(dir);

	if (~files.indexOf(filename)) {
		return path.join(dir, filename);
	}

	if (dir == root) {
		throw new Error('Could not find "' + filename + '" up from: ' + dir);
	} else if (!dir || dir === '.') {
		throw new Error('Cannot find "' + filename + '" from unspecified directory');
	}

	return find(pmodule, dir, filename);
}

/**
 * Locates, loads, and parses the specified file as JSON.
 * @param {Object} pmodule - A module object (i.e. the 'module' variable)
 * @param {String} filename - The filename to scan for
 * @returns {Object} The file that was scanned for's contents
 * @private
 */
function runner(pmodule, filename) {
	try {
		var file = find(pmodule, null, filename);
		if (cache[file]) {
			return cache[file];
		}
		cache[file] = (file && JSON.parse(fs.readFileSync(file))) || {};
	} catch(ex) {
		cache[file] = {};
	}

	return cache[file];
};
