var appc = require('node-appc');
var Builder = require('node-titanium-sdk/lib/builder');
var DOMParser = require('xmldom').DOMParser;
var fs = require('fs');
var path = require('path');
var util = require('util');
var wrench = require('wrench');

var i18nLib = appc.i18n(__dirname);
var __ = i18nLib.__;
var xml = appc.xml;

function AndroidBaseBuilder() {
	Builder.apply(this, arguments);

	this.androidLibraries = [];
}

util.inherits(AndroidBaseBuilder, Builder);

AndroidBaseBuilder.prototype.writeXmlFile = function writeXmlFile(srcOrDoc, dest) {
	var filename = path.basename(dest),
		destExists = fs.existsSync(dest),
		destDir = path.dirname(dest),
		srcDoc = typeof srcOrDoc == 'string' ? (new DOMParser({ errorHandler: function(){} }).parseFromString(fs.readFileSync(srcOrDoc).toString(), 'text/xml')).documentElement : srcOrDoc,
		destDoc,
		dom = new DOMParser().parseFromString('<resources/>', 'text/xml'),
		root = dom.documentElement,
		nodes = {},
		_t = this,
		byTagAndName = function (node) {
			var n = xml.getAttr(node, 'name');
			if (n) {
				nodes[node.tagName] || (nodes[node.tagName] = {});
				if (nodes[node.tagName][n] && n !== 'app_name') {
					_t.logger.warn(__('Overwriting XML node %s in file %s', String(n).cyan, dest.cyan));
				}
				nodes[node.tagName][n] = node;
			}
		};

	// If we don't deal with a resource set just try to copy over the whole file
	if (srcDoc.tagName !== 'resources') {
		this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		if (destExists) {
			this.logger.warn(__('Overwriting %s => %s', srcOrDoc.cyan, dest.cyan));
			this.logger.warn(__('Please check for possible duplicate resources.'));
			fs.unlinkSync(dest);
		} else {
			if (!fs.existsSync(destDir)) {
				wrench.mkdirSyncRecursive(destDir);
			}
			this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		}
		fs.writeFileSync(dest, '<?xml version="1.0" encoding="UTF-8"?>\n' + srcDoc.toString());
		return;
	} else {
		// Resource sets under a qualifier all need to be merged into a single values
		// file so we adjust the destination path here if necessary
		var valueResourcesPattern = /res\/(values(?:-[^/]+)?)\/.*/i;
		var match = dest.match(valueResourcesPattern);
		if (match !== null) {
			var resourceQualifier = match[1];
			dest = path.join(destDir, resourceQualifier + '.xml');
			destExists = fs.existsSync(dest);
		}
	}

	if (destExists) {
		// we're merging
		destDoc = (new DOMParser({ errorHandler: function(){} }).parseFromString(fs.readFileSync(dest).toString(), 'text/xml')).documentElement;
		xml.forEachAttr(destDoc, function (attr) {
			root.setAttribute(attr.name, attr.value);
		});
		if (typeof srcOrDoc == 'string') {
			this.logger.debug(__('Merging %s => %s', srcOrDoc.cyan, dest.cyan));
		}
	} else {
		// copy the file, but make sure there are no dupes
		if (typeof srcOrDoc == 'string') {
			this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		}
	}

	xml.forEachAttr(srcDoc, function (attr) {
		root.setAttribute(attr.name, attr.value);
	});

	destDoc && xml.forEachElement(destDoc, byTagAndName);
	xml.forEachElement(srcDoc, byTagAndName);
	Object.keys(nodes).forEach(function (tag) {
		Object.keys(nodes[tag]).forEach(function (name) {
			root.appendChild(dom.createTextNode('\n\t'));
			root.appendChild(nodes[tag][name]);
		});
	});

	root.appendChild(dom.createTextNode('\n'));
	fs.existsSync(destDir) || wrench.mkdirSyncRecursive(destDir);
	destExists && fs.unlinkSync(dest);
	fs.writeFileSync(dest, '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString());
};

module.exports = AndroidBaseBuilder;
