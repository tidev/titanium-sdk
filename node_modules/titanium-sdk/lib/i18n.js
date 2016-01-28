/**
 * Titanium SDK Library for Node.js
 * Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	xml = appc.xml,
	DOMParser = require('xmldom').DOMParser,
	launchScreensCache = {};

exports.load = load;
exports.findLaunchScreens = findLaunchScreens;

function load(projectDir, logger, opts) {
	if (process.argv.indexOf('--i18n-dir') !== -1) {
		// Enable developers to specify i18n directory location with build flag
		var customI18n = process.argv[process.argv.indexOf('--i18n-dir')+1];
		if (customI18n && fs.existsSync(path.join(path.resolve(projectDir), customI18n))) {
			projectDir = path.join(projectDir, customI18n);
		}
	}
	var i18nDir = path.join(projectDir, 'i18n'),
		data = {},
		ignoreDirs = opts && opts.ignoreDirs,
		ignoreFiles = opts && opts.ignoreFiles;

	if (fs.existsSync(i18nDir)) {
		logger.debug(__('Compiling localization files'));
		fs.readdirSync(i18nDir).forEach(function (lang) {
			var langDir = path.join(i18nDir, lang),
				isDir = fs.statSync(langDir).isDirectory();

			if (fs.existsSync(langDir) && isDir && (!ignoreDirs || !ignoreDirs.test(lang))) {
				var s = data[lang] = {};

				fs.readdirSync(langDir).forEach(function (name) {
					var file = path.join(langDir, name);
					if (/.+\.xml$/.test(name) && (!ignoreFiles || !ignoreFiles.test(name)) && fs.existsSync(file) && fs.statSync(file).isFile()) {
						logger.debug(__('Processing i18n file: %s', (lang + '/' + name).cyan));

						var dest = name == 'app.xml' ? 'app' : 'strings',
							obj = s[dest] = s[dest] || {},
							dom = new DOMParser().parseFromString(fs.readFileSync(file).toString(), 'text/xml');

						xml.forEachElement(dom.documentElement, function (elem) {
							if (elem.nodeType == 1 && elem.tagName == 'string') {
								var name = xml.getAttr(elem, 'name');
								name && (obj[name] = elem && elem.firstChild && elem.firstChild.data || '');
							}
						});
					}
				});
			}
		});
	}

	return data;
}

function findLaunchScreens(projectDir, logger, opts) {
	if (launchScreensCache[projectDir]) {
		return launchScreensCache[projectDir];
	}

	var i18nDir = path.join(projectDir, 'i18n'),
		data = [];

	opts || (opts = {});

	if (fs.existsSync(i18nDir)) {
		logger.debug(__('Checking for Splash Screen localization'));
		fs.readdirSync(i18nDir).forEach(function (lang) {
			var langDir = path.join(i18nDir, lang);
			if (fs.existsSync(langDir) && fs.statSync(langDir).isDirectory() && (!opts.ignoreDirs || !opts.ignoreDirs.test(lang))) {
				fs.readdirSync(langDir).forEach(function (name) {
					if(/^(Default(-(Landscape|Portrait))?(-[0-9]+h)?(@[2-9]x)?)\.png$/.test(name)) {
						data.push(path.join(langDir, name));
					}
				});
			}
		});
	}

	return launchScreensCache[projectDir] = data;
}
