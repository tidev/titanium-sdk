/**
 * Defines the main namespace for all node-appc libraries.
 *
 * @module appc
 *
 * @copyright
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

if (!global.dump) {
	var util = require('util');

	/**
	 * Prints an object, including deeply nested objects, to stderr.
	 * @param {*} ... - Thing to dump
	 */
	global.dump = function dump() {
		for (var i = 0; i < arguments.length; i++) {
			console.error(util.inspect(arguments[i], false, null, true));
		}
	};
}

[
	'analytics',
	'android',
	'ast',
	'async',
	'auth',
	'busyindicator',
	'clitools',
	'encoding',
	'environ',
	'exception',
	'fs',
	'haxm',
	'image',
	'i18n',
	'ios',
	'jdk',
	'messaging',
	'net',
	'pkginfo',
	'plist',
	'progress',
	'string',
	'subprocess',
	'time',
	'timodule',
	'tiplugin',
	'util',
	'version',
	'xcconfig',
	'xml',
	'zip'
].forEach(function (m) {
	Object.defineProperty(exports, m, {
		get: function () {
			return require('./' + m);
		}
	});
});
