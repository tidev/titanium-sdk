/**
 * Common Library for Doctools
 */

var yaml = require('js-yaml'),
	fs = require('fs'),
	nodeappc = require('node-appc'),
	colors = require('colors'),
	pagedown = require('pagedown'),
	converter = new pagedown.Converter(),
	ignoreList = ['node_modules', '.travis.yml'],
	logLevel = 0;

exports.VALID_PLATFORMS = ['android', 'blackberry', 'iphone', 'ipad', 'mobileweb', 'windowsphone'];
exports.VALID_OSES = ['android', 'blackberry', 'ios', 'mobileweb', 'windowsphone'];
exports.DEFAULT_VERSIONS = {
	'android' : '0.8',
	'blackberry' : '3.1.2',
	'iphone' : '0.8',
	'ipad' : '0.8',
	'mobileweb' : '1.8'
};
exports.ADDON_VERSIONS = {
	'windowsphone' : '4.0.0'
};
exports.DATA_TYPES = ['Array', 'Boolean', 'Callback', 'Date', 'Dictionary', 'Number', 'Object', 'String'];
exports.PRETTY_PLATFORM = {
	'android': 'Android',
	'blackberry': 'BlackBerry',
	'ios': 'iOS',
	'iphone': 'iPhone',
	'ipad': 'iPad',
	'mobileweb': 'Mobile Web',
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

exports.markdownToHTML = function markdownToHTML(text) {
	return converter.makeHtml(text);
}

exports.LOG_INFO = LOG_INFO = 0;
exports.LOG_WARN = LOG_WARN = LOG_INFO + 1;
exports.LOG_ERROR = LOG_ERROR = LOG_WARN + 1;
logLevel = LOG_INFO;

exports.log = function log (level, message) {
	var args = [];

	if (level < logLevel) return;

	if (arguments.length >= 3) {
		for (key in arguments) {
			args.push(arguments[key]);
		}
		args.splice(0, 2);
	}

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

exports.setLogLevel = function setLogLevel (level) {
	logLevel = level;
}

// Determines if the key exists in the object and is defined
// Also if it's array, make sure the array is not empty
exports.assertObjectKey = function assertObjectKey(obj, key) {
	if (key in obj && obj[key]) {
		if (Array.isArray(obj[key])) {
			if (obj[key].length > 0) return true;
		} else {
			return true;
		}
	}
	return false;
}

/**
 * Recursively find, load and parse YAML files
 * @param {String} path Root path to start search
 * @returns {Object} Dictionary containing the parsed data and any YAML errors
 */
exports.parseYAML = function parseYAML(path) {
	var rv = {data : {}, errors : []},
		currentFile = path;
	try {
		var fsArray = fs.readdirSync(path),
			i = 0,
			len = fsArray.length;
		fsArray.forEach(function (fsElement) {
			var elem = path + '/' + fsElement,
				stat = fs.statSync(elem);
			currentFile = elem;

			if (~ignoreList.indexOf(fsElement)) return;

			if (stat.isDirectory()) {
				nodeappc.util.mixObj(rv, parseYAML(elem));
			}
			else if (stat.isFile()) {
				if (elem.split('.').pop() == 'yml') {
					try {
						var fileBuffer = fs.readFileSync(elem, 'utf8');
						// remove comments
						fileBuffer.replace(/\w*\#.*/, '');
						yaml.safeLoadAll(fileBuffer, function (doc) {
							if (!doc.name) {
								rv.errors.push({toString: function() {return "ERROR: Missing name for doc in file";}, __file: currentFile});
								return;
							}
							// data does not exist in doc
							if (rv.data[doc.name] == null) {
								rv.data[doc.name] = doc;
								rv.data[doc.name]["__file"]= currentFile;
							} else {
								console.warn("WARNING: Duplicate key: %s", doc.name + "." + key);
							}
						});
					}
					catch (e) {
						e.__file = currentFile;
						rv.errors.push(e);
					}
				}
			}
		});
		return rv;
	}
	catch (e) {
		e.__file = currentFile;
		rv.errors.push(e);
	}
}
