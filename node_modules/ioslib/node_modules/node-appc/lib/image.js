/**
 * Resizes images using the imgscalr library.
 *
 * @module image
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('./fs'),
	i18n = require('./i18n')(__dirname),
	__ = i18n.__;

exports.resize = function (src, dest, callback, logger) {
	try {
		if (!src) throw new Error('Missing source');
		if (!fs.exists(src)) throw new Error('Source "' + src + '" does not exist');
		if (!dest) throw new Error('Missing dest');

		Array.isArray(dest) || (dest = [dest]);

		var cmd = [
			'java -jar "' + require('path').resolve(module.filename, '..', '..', 'tools', 'resizer', 'resizer.jar') + '"',
			'"' + src + '"'
		];

		dest.forEach(function (d) {
			if (Object.prototype.toString.call(d) != '[object Object]') throw new Error('Invalid destination');
			if (!d.file) throw new Error('Missing destination file');

			var w = d.width | 0,
				h = d.height | 0;

			if (!w && !h) {
				throw new Error('Missing destination width and height');
			} else if (w && !h) {
				h = w;
			} else if (!w && h) {
				w = h;
			}

			cmd.push('"' + d.file + '"');
			cmd.push(w);
			cmd.push(h);
		});

		cmd = cmd.join(' ');
		logger && logger.trace(__('Resizing images: %s', cmd.cyan));

		require('child_process').exec(cmd, function (error, stdout, stderr) {
			callback && callback.apply(null, arguments);
		});
	} catch (ex) {
		callback && callback.call && callback(ex);
	}
};
