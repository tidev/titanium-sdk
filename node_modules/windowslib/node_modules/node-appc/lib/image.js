/**
 * Resizes images using the imgscalr library.
 *
 * @module image
 *
 * @copyright
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * Copyright (c) 2013 TJ Holowaychuk <tj@vision-media.ca>
 * {@link https://github.com/component/png-size}
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports.resize = resize;
module.exports.pngInfo = pngInfo;

var fs = require('./fs'),
	i18n = require('./i18n')(__dirname),
	__ = i18n.__;

/**
 * Takes a source image and resizes it to one or more images.
 *
 * @param {String} src - The path to the source image being resized.
 * @param {Array|Object} dest - One or more destination objects consisting of the dest `file`, `width`, and `height`.
 * @param {Function} callback - A function to call after the images have been resized.
 * @param {Object} [logger] - A logger object containing a `trace()` function.
 */
function resize(src, dest, callback, logger) {
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

/**
 * Reads in a PNG file and returns the height, width, and color depth.
 *
 * @param {Buffer} buf - A buffer containing the contents of a PNG file.
 *
 * @returns {Object} An object containing the image's height, width, and color depth.
 */
function pngInfo(buf) {
	function u32(o) {
		return buf[o] << 24 | buf[o + 1] << 16 | buf[o + 2] << 8 | buf[o + 3];
	}

	return {
		width: u32(16),
		height: u32(16 + 4),
		alpha: !!(buf[25] & 4)
	};
}
