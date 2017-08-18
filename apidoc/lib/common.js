/**
 * Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 *
 * Common Library for Doctools
 */
'use strict';

const yaml = require('js-yaml'),
	fs = require('fs'),
	colors = require('colors'), // eslint-disable-line no-unused-vars
	nodeappc = require('node-appc'),
	pagedown = require('pagedown'),
	converter = new pagedown.Converter(),
	ignoreList = [ 'node_modules', '.travis.yml' ],
	LOG_INFO = 0,
	LOG_WARN = LOG_INFO + 1,
	LOG_ERROR = LOG_WARN + 1;

let logLevel = LOG_INFO;

exports.VALID_PLATFORMS = [ 'android', 'blackberry', 'iphone', 'ipad', 'windowsphone' ];
exports.VALID_OSES = [ 'android', 'blackberry', 'ios', 'windowsphone' ];
exports.DEFAULT_VERSIONS = {
	'android' : '0.8',
	'iphone' : '0.8',
	'ipad' : '0.8'
};
exports.ADDON_VERSIONS = {
	'blackberry' : '3.1.2',
	'windowsphone' : '4.1.0'
};
exports.DATA_TYPES = [ 'Array', 'Boolean', 'Callback', 'Date', 'Dictionary', 'Number', 'Object', 'String' ];
exports.PRETTY_PLATFORM = {
	'android': 'Android',
	'blackberry': 'BlackBerry',
	'ios': 'iOS',
	'iphone': 'iPhone',
	'ipad': 'iPad',
	'tizen': 'Tizen',
	'windowsphone' : 'Windows Phone'
};

// Matches FOO_CONSTANT
exports.REGEXP_CONSTANTS = /^[A-Z_0-9]*$/;

// Matches <a href="...">Foo</a>
exports.REGEXP_HREF_LINK = /<a href="(.+?)">(.+?)<\/a>/;
exports.REGEXP_HREF_LINKS = /<a href="(.+?)">(.+?)<\/a>/g;

// Matches <code>, </code>, etc.
exports.REGEXP_HTML_TAG = /<\/?[a-z]+[^>]*>/;

// Matches <Titanium.UI.Window>, <ItemTemplate>, etc. (and HTML tags)
exports.REGEXP_CHEVRON_LINK = /<([^>]+?)>/;
exports.REGEXP_CHEVRON_LINKS = /(?!`)<[^>]+?>(?!`)/g;

/**
 * Converts a Markdown string to HTML
 * @param {string} text markdown to convert to html
 * @return {string} HTML
 */
exports.markdownToHTML = function markdownToHTML(text) {
	return converter.makeHtml(text);
};

exports.LOG_INFO = LOG_INFO;
exports.LOG_WARN = LOG_WARN;
exports.LOG_ERROR = LOG_ERROR;

/**
 * Logs output
 * @param {number} level log level
 * @param {string} message log message
 */
exports.log = function log(level, message) {
	const args = [];

	if (level < logLevel) {
		return;
	}

	if (arguments.length >= 3) {
		for (const key in arguments) {
			args.push(arguments[key]);
		}
		args.splice(0, 2);
	}

	if (typeof level === 'string') {
		console.info.apply(this, arguments);
	} else {
		switch (level) {
			case LOG_INFO:
				message = '[INFO] ' + message;
				args.unshift(message.white);
				console.info.apply(this, args);
				break;
			case LOG_WARN:
				message = '[WARN] ' + message;
				args.unshift(message.yellow);
				console.warn.apply(this, args);
				break;
			case LOG_ERROR:
				message = '[ERROR] ' + message;
				args.unshift(message.red);
				console.error.apply(this, args);
				break;
		}
	}
};

/**
 * Sets the log level for output
 * @param {number} level target log level for filtering
 */
exports.setLogLevel = function setLogLevel(level) {
	logLevel = level;
};

/**
 * Determines if the key exists in the object and is defined
 * Also if it's array, make sure the array is not empty
 * @param {object} obj an object
 * @param {object} key an expected key on the object
 * @return {boolean} true if the object has a value for the key (and if it's an array, it has to have at least one element)
 */
exports.assertObjectKey = function assertObjectKey(obj, key) {
	if (key in obj && obj[key]) {
		if (Array.isArray(obj[key])) {
			if (obj[key].length > 0) {
				return true;
			}
		} else {
			return true;
		}
	}
	return false;
};

/**
 * Error message
 * @return {string} error message
 */
function errorMessage() {
	return 'ERROR: Missing name for doc in file';
}

/**
 * Recursively find, load and parse YAML files
 * @param {Object} path Root path to start search
 * @returns {Object} Dictionary containing the parsed data and any YAML errors
 */
exports.parseYAML = function parseYAML(path) {
	const rv = {
		data: {},
		errors: []
	};
	let currentFile = path;
	try {
		const fsArray = fs.readdirSync(path);
		fsArray.forEach(function (fsElement) {
			const elem = path + '/' + fsElement,
				stat = fs.statSync(elem);
			currentFile = elem;

			if (~ignoreList.indexOf(fsElement)) {
				return;
			}

			if (stat.isDirectory()) {
				nodeappc.util.mixObj(rv, parseYAML(elem));
			} else if (stat.isFile()) {
				if (elem.split('.').pop() === 'yml') {
					try {
						const fileBuffer = fs.readFileSync(elem, 'utf8');
						// remove comments
						fileBuffer.replace(/\w*#.*/, '');
						yaml.safeLoadAll(fileBuffer, function (doc) {
							if (!doc.name) {
								rv.errors.push({ toString: errorMessage(), __file: currentFile });
								return;
							}
							// data does not exist in doc
							if (!rv.data[doc.name]) {
								rv.data[doc.name] = doc;
								rv.data[doc.name].__file = currentFile;
							} else {
								console.warn('WARNING: Duplicate key: %s, attempting to merge', doc.name);
								nodeappc.util.mixObj(rv.data[doc.name], doc);
							}
						});
					} catch (e) {
						e.__file = currentFile;
						rv.errors.push(e);
					}
				}
			}
		});
	} catch (e) {
		e.__file = currentFile;
		rv.errors.push(e);
	}
	return rv;
};

/**
 * Find the API in the docs
 * @param {Object} doc full api tree
 * @param {Object} className class name
 * @param {Object} memberName member name
 * @param {Object} type sub-type of class?
 * @return {boolean} true if found, false otherwise
 */
exports.findAPI = function (doc, className, memberName, type) {
	var cls = doc[className],
		x = 0;

	if (cls && type in cls && cls[type]) {
		for (x = 0; x < cls[type].length; x++) {
			if (cls[type][x].name === memberName) {
				return true;
			}
		}
	}
	return false;
};
