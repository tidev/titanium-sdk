/**
 * Common Library for Doctools
 * Dependencies: js-yaml ~3.2.2 and node-appc ~0.2.14
 */

var yaml = require('js-yaml'),
	fs = require('fs'),
	nodeappc = require('node-appc');

exports.VALID_PLATFORMS = ['android', 'blackberry', 'iphone', 'ipad', 'mobileweb', 'tizen'];
exports.VALID_OSES = ['android', 'blackberry', 'ios', 'mobileweb', 'tizen'];
exports.DEFAULT_VERSIONS = {
	'android' : '0.8',
	'blackberry' : '3.1.2',
	'iphone' : '0.8',
	'ipad' : '0.8',
	'mobileweb' : '1.8',
	'tizen' : '3.1'
}
exports.DATA_TYPES = ['Array', 'Boolean', 'Callback', 'Date', 'Dictionary', 'Number', 'Object', 'String'];

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
								rv.error.push("ERROR: Missing name for doc in file: " + currentFile);
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