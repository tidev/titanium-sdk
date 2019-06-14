'use strict';

const appc = require('node-appc'),
	Builder = require('node-titanium-sdk/lib/builder'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs-extra'),
	path = require('path'),
	util = require('util'),
	i18nLib = appc.i18n(__dirname),
	__ = i18nLib.__,
	xml = appc.xml;

/**
 * The base Android builder that includes common functionality that is used
 * in both app and module builds.
 */
function AndroidBaseBuilder() {
	Builder.apply(this, arguments);

	this.androidLibraries = [];
	this.dependencyMap = JSON.parse(fs.readFileSync(path.join(this.platformPath, 'dependency.json')));
}

util.inherits(AndroidBaseBuilder, Builder);

/**
 * Utility function to merge the contents of XML files.
 *
 * If the destination file does not exists, the source file will simply
 * be copied over. If both source and destination already exists AND the source
 * document contains Android resources, the files will be merged. Otherwise the
 * destination file will be overwritten.
 *
 * @param {string|Document} srcOrDoc Path to source XML file or already parsed Document object
 * @param {string} dest Path of the destination XML file
 */
AndroidBaseBuilder.prototype.writeXmlFile = function writeXmlFile(srcOrDoc, dest) {
	let destExists = fs.existsSync(dest),
		destDoc;
	const destDir = path.dirname(dest),
		dom = new DOMParser().parseFromString('<resources/>', 'text/xml'),
		root = dom.documentElement,
		srcDoc = typeof srcOrDoc === 'string' ? (new DOMParser({ errorHandler: function () {} }).parseFromString(fs.readFileSync(srcOrDoc).toString(), 'text/xml')).documentElement : srcOrDoc,
		nodes = {},
		_t = this;
	function byTagAndName(node) {
		var n = xml.getAttr(node, 'name');
		if (n) {
			nodes[node.tagName] || (nodes[node.tagName] = {});
			if (nodes[node.tagName][n] && n !== 'app_name') {
				_t.logger.warn(__('Overwriting XML node %s in file %s', String(n).cyan, dest.cyan));
			}
			nodes[node.tagName][n] = node;
		}
	}

	// If we don't deal with a resource set just try to copy over the whole file
	if (srcDoc.tagName !== 'resources') {
		this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		if (destExists) {
			this.logger.warn(__('Overwriting %s => %s', srcOrDoc.cyan, dest.cyan));
			this.logger.warn(__('Please check for possible duplicate resources.'));
			fs.unlinkSync(dest);
		} else {
			fs.ensureDirSync(destDir);
			this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
		}
		fs.writeFileSync(dest, '<?xml version="1.0" encoding="UTF-8"?>\n' + srcDoc.toString());
		return;
	} else {
		// Resource sets under a qualifier all need to be merged into a single values
		// file so we adjust the destination path here if necessary
		const valueResourcesPattern = new RegExp('(values(?:-[^\\' + path.sep + ']+)?)\\' + path.sep + '[^\\' + path.sep + ']+$', 'i'); // eslint-disable-line security/detect-non-literal-regexp
		const match = dest.match(valueResourcesPattern);
		if (match !== null) {
			const resourceQualifier = match[1];
			dest = path.join(destDir, resourceQualifier + '.xml');
			destExists = fs.existsSync(dest);
		}
	}

	if (destExists) {
		// we're merging
		destDoc = (new DOMParser({ errorHandler: function () {} }).parseFromString(fs.readFileSync(dest).toString(), 'text/xml')).documentElement;
		xml.forEachAttr(destDoc, function (attr) {
			root.setAttribute(attr.name, attr.value);
		});
		if (typeof srcOrDoc === 'string') {
			this.logger.debug(__('Merging %s => %s', srcOrDoc.cyan, dest.cyan));
		}
	// copy the file, but make sure there are no dupes
	} else if (typeof srcOrDoc === 'string') {
		this.logger.debug(__('Copying %s => %s', srcOrDoc.cyan, dest.cyan));
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
	fs.ensureDirSync(destDir);
	destExists && fs.unlinkSync(dest);
	fs.writeFileSync(dest, '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString());
};

/**
 * Checks wether an Android Library with the given package name is available.
 *
 * @param {string} packageName Package name of the Android Library to search for
 * @return {Boolean} True if the Android Library is available, false if not
 */
AndroidBaseBuilder.prototype.hasAndroidLibrary = function hasAndroidLibrary(packageName) {
	return this.androidLibraries.some(function (libraryInfo) {
		return libraryInfo.packageName === packageName;
	});
};

/**
 * Checks if one of our bundled Android Support Libraries (.jar) is also available
 * as an Android Library (.aar) provided by the user.
 *
 * This is used during the build process to allow users to replace any of our
 * bundled Android Support Libraries with one of their own choosing. Currently
 * supported Android Support Library versions are 24.2.0 - 25.x.
 *
 * To find out which .jar library can be replaces by which Android Library,
 * we depend on a hardcoded list of Android Library package names and the bundled
 * library filenames they can replace. This list is manually taken from
 * android/dependency.json and needs to be maintained if anything changes there.
 *
 * @param {string} libraryPathAndFilename Path and filename to the .jar file to check
 * @return {Boolean} True if the given library is available as an Android Library, false if not
 */
AndroidBaseBuilder.prototype.isExternalAndroidLibraryAvailable = function isExternalAndroidLibraryAvailable(libraryPathAndFilename) {
	const replaceableAndroidLibraries = {
		'android.support.graphics.drawable': [ 'android-support-vector-drawable.jar' ],
		'android.support.graphics.drawable.animated': [ 'android-support-animated-vector-drawable.jar' ],
		'android.support.v4': [ 'android-support-v4.jar' ],
		'android.support.compat': [ 'android-support-compat.jar' ],
		'android.support.coreui': [ 'android-support-core-ui.jar' ],
		'android.support.coreutils': [ 'android-support-core-utils.jar' ],
		'android.support.design': [ 'android-support-design.jar' ],
		'android.support.fragment': [ 'android-support-fragment.jar' ],
		'android.support.mediacompat': [ 'android-support-media-compat.jar' ],
		'android.support.transition': [ 'android-support-transition.jar' ],
		'android.support.v7.appcompat': [ 'android-support-v7-appcompat.jar' ],
		'android.support.v7.cardview': [ 'android-support-v7-cardview.jar' ],
		'android.support.v7.recyclerview': [ 'android-support-v7-recyclerview.jar' ]
	};
	return this.androidLibraries.some(function (libraryInfo) {
		if (!replaceableAndroidLibraries[libraryInfo.packageName]) {
			return false;
		}

		const libraryFilename = path.basename(libraryPathAndFilename);
		const shouldExcludeLibrary = replaceableAndroidLibraries[libraryInfo.packageName].indexOf(libraryFilename) !== -1;
		if (shouldExcludeLibrary) {
			this.logger.trace(__('Android library %s (%s) available, marking %s to be excluded.', libraryInfo.task.aarPathAndFilename, libraryInfo.packageName.cyan, libraryPathAndFilename.cyan));
			return true;
		}

		return false;
	}, this);
};

module.exports = AndroidBaseBuilder;
