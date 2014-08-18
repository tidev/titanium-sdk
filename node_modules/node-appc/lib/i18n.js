/**
 * Internationalization functions. Includes a function for internationalizing
 * a single string, a plural/singular string, or a file containing
 * internationalized text.
 *
 * @module i18n
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var path = require('path'),
	fs = require('fs'),
	vsprintf = require('sprintf').vsprintf,
	locale = process.env.locale || 'en-us',
	providers = {};

module.exports = function (dirname) {
	var localesDir,
		initialDir = dirname;
	while (dirname.split(path.sep)[1]) {
		if (fs.existsSync(path.join(dirname, 'locales'))) {
			localesDir = path.join(dirname, 'locales');
			break;
		}
		dirname = path.resolve(path.join(dirname, '..'));
	}
	if (!localesDir) {
		return new i18n();
	}
	if (!providers[localesDir]) {
		providers[localesDir] = new i18n(localesDir);
	}
	return providers[localesDir];
};

module.exports.getLocale = function getLocale() {
	return locale;
};

function i18n(localesDir) {
	if (localesDir) {
		var localeFilePath = path.join(localesDir, locale + '.js');
		try {
			if (fs.existsSync(localeFilePath)) {
				this.localeData = JSON.parse(fs.readFileSync(localeFilePath));
			} else {
				localeFilePath = path.join(localesDir, locale.split('-')[0] + '.js');
				this.localeData = JSON.parse(fs.readFileSync(localeFilePath));
			}
		} catch (ex) {
			this.localeData = {};
		}
	} else {
		this.localeData = {};
	}

	this.__ = function __(message) {
		if (this.localeData) {
			return vsprintf(this.localeData[message] || message, Array.prototype.slice.call(arguments, 1));
		} else {
			console.log('early ' + message);
			return vsprintf(message, Array.prototype.slice.call(arguments, 1));
		}
	}.bind(this);

	this.__n = function __n(singularMessage, pluralMessage, count) {
		if (this.localeData) {
			var message = this.localeData[singularMessage];
			if (parseInt(count, 10) != 1) {
				message = vsprintf(message ? message.other : pluralMessage, [count]);
			} else {
				message = vsprintf(message ? message.one : singularMessage, [count]);
			}
			return vsprintf(message, Array.prototype.slice.call(arguments, 3));
		} else {
			return vsprintf(parseInt(count, 10) != 1 ? pluralMessage : singularMessage, Array.prototype.slice.call(arguments, 3));
		}
	}.bind(this);

	/**
	 * Reads in an internationalized text file. If the file does not exist for the
	 * user's selected locale, it defaults to US.
	 *
	 * Files may contain tokens that are replaced by values in the supplied obj
	 * param. Tokens are wrapped in curly braces like {{example}}.
	 *
	 * Also supported is marking text as emphasised. This is done by wrapping text
	 * in two underscores __like this__. This text will show up using the specified
	 * emphasisColor or the default color 'cyan'.
	 *
	 * @param {String} _path - Path relative to the locale diretory
	 * @param {Object} [obj] - Key/value pairs used to replace {{tokens}}
	 * @param {String} [emphasisColor="cyan"] - The color to use for __emphasis text__
	 * @returns {String} The file contents
	 * @example
	 * var str = i18n.__f('commands/config', { configPath: config.getConfigPath() });
	 */
	this.__f = function __f(_path, obj, emphasisColor) {
		var files = [
				locale,
				locale.split('-').shift(),
				'en'
			],
			i, localeFile, contents;

		obj || (obj = {});
		emphasisColor || (emphasisColor = 'cyan');

		for (i = 0; i < files.length; i++) {
			localeFile = path.join(localesDir, _path, files[i] + '.txt');
			if (fs.existsSync(localeFile)) {
				try {
					return fs.readFileSync(localeFile)
						.toString()
						// trim all lines
						.split('\n\n').map(function (paragraph) {
							return paragraph.split('\n').map(function (line) { return line.trim(); }).join(' ');
						}).join('\n\n')
						.replace(/(__(.+?)__)/g, emphasisColor ? '$2'[emphasisColor] : '$2')
						.replace(/(\{\{(.+?)\}\})/g, function (s, m1, m2) {
							return obj && obj[m2] || s;
						});
				} catch (ex) {
					return;
				}
			}
		}
	};
}