/**
 * Loads, merges, edits, and saves "AndroidManifest.xml" files.
 *
 * You would normally want gradle to merge "AndroidManifest.xml" files between the app and its native libraries,
 * but Titanium needs the ability to merge together manifest information from the following sources as well:
 * - App's "tiapp.xml"
 * - App's "platform/android/AndroidManifest.xml"
 * - CommonJS module's "timodule.xml"
 *
 * @module lib/android-manifest
 *
 * @copyright
 * Copyright (c) 2009-2019 by Axway, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const DOMParser = require('xmldom').DOMParser;
const fs = require('fs-extra');
const os = require('os');

/**
 * Class used to load, merge, edit, and save "AndroidManifest.xml" files.
 *
 * You are expected to load XML files via the static fromFilePath() or fromXmlString() methods.
 */
class AndroidManifest {
	/**
	 * Creates a new AndroidManifest instance wrapping the given "xmldom.Document" object.
	 * @param {Object} xmlDomDocument
	 * XML "Document" object that is expected to have loaded the "AndroidManifest.xml" contents.
	 * Can be null or undefined.
	 */
	constructor(xmlDomDocument) {
		/** @private @type {Object} */
		this._xmlDomDocument = xmlDomDocument;
	}

	/**
	 * Determines if this object has loaded any XML or not.
	 * @returns {Boolean}
	 * Returns true if this object has loaded at least 1 XML element.
	 *
	 * Returns false if no XML content has been loaded.
	 * This object's "xmlDocDocument" property will return null/undefined in this case.
	 */
	isEmpty() {
		return (!this._xmlDomDocument || !this._xmlDomDocument.documentElement);
	}

	/**
	 * Gets a mutable "xmldom.Document" object of the loaded XML. Can be null/undefined.
	 * @type {xmldom.Document}
	 */
	get xmlDomDocument() {
		return this._xmlDomDocument;
	}

	/**
	 * Creates an XML string of the manifest contents.
	 * @returns {String} Returns an XML string of the Android manifest contents. Will never return null.
	 */
	toString() {
		let text = '<?xml version="1.0" encoding="utf-8"?>' + os.EOL;
		if (this._xmlDomDocument && this._xmlDomDocument.documentElement) {
			// Write XML content to string.
			text += this._xmlDomDocument.documentElement + os.EOL;

			// Remove all "xmlns:android=<url>"" namespace definitions from child elements.
			// Google only allows it in root <manifest/> element or else a build/validation error will occur.
			let startReplaceIndex = text.indexOf('<manifest');
			if (startReplaceIndex >= 0) {
				startReplaceIndex = text.indexOf('>', startReplaceIndex);
				text = text.replace(/\sxmlns:android=".*?"/g, (match, offset) => {
					return (offset <= startReplaceIndex) ? match : '';
				});
			}
		}
		return text;
	}

	/**
	 * Adds <uses-permission/> entries to the manifest with the given permission names.
	 * Given permission will only be added if they don't already exist in manifest (ie: won't add duplicate entries).
	 * @param {String[]} permissionNames
	 * Array of Android permission names to be added.
	 * Can be an empty array or null/undefined, in which case, this method will do nothing.
	 */
	addUsesPermissions(permissionNames) {
		// Validate argument.
		if (!Array.isArray(permissionNames)) {
			return;
		}

		// Do not continue if we haven't loaded any XML content.
		if (this.isEmpty()) {
			return;
		}

		// Fetch the root <manifest/> element.
		const manifestElement = this._xmlDomDocument.documentElement;
		if (manifestElement.tagName !== 'manifest') {
			return;
		}

		// Fetch <application/> element (if it exists) so that we can insert <uses-permission/> elements above it.
		// Even better, try to fetch indentation TextNode above <application/> so that we duplicate it.
		let nodeToInsertAt = getFirstChildElementByTagName(manifestElement, 'application');
		if (nodeToInsertAt && isTextNode(nodeToInsertAt.previousSibling)) {
			nodeToInsertAt = nodeToInsertAt.previousSibling;
		}

		// Add given permissions to manifest.
		for (const name of permissionNames) {
			// Validate next array element.
			if ((typeof name !== 'string') || (name.length <= 0)) {
				continue;
			}

			// Skip given permission if it already exists in manifest.
			let permissionElement = getFirstChildElementByTagAndAndroidName(manifestElement, 'uses-permission', name);
			if (permissionElement) {
				continue;
			}

			// Add given permission to manifest.
			permissionElement = this._xmlDomDocument.createElement('uses-permission');
			if (permissionElement) {
				permissionElement.setAttribute('android:name', name);
				if (nodeToInsertAt) {
					// The <application/> element exists. Insert above it to avoid gradle linting warnings.
					// If we've acquired its indentation TextNode, then duplicate it so everything will line-up.
					if (isTextNode(nodeToInsertAt)) {
						manifestElement.insertBefore(nodeToInsertAt.cloneNode(false), nodeToInsertAt);
					}
					manifestElement.insertBefore(permissionElement, nodeToInsertAt);
				} else {
					// Add the element to the end.
					manifestElement.appendChild(permissionElement);
				}
			}
		}
	}

	/**
	 * Fetches given attribute's value from the manifest's <application/> element.
	 * @param {String} name
	 * The name of the attribute to fetch, such as "android:theme".
	 * @return {String}
	 * Returns the fetched attribute's string value.
	 *
	 * Return null if attribute was not found in the <application/> element, the <application/> element
	 * does not exist in manifest, or if given an invalid attribute "name" argument.
	 */
	getAppAttribute(name) {
		let value = null;
		if (!this.isEmpty() && (typeof name === 'string')) {
			const element = getFirstChildElementByTagName(this._xmlDomDocument.documentElement, 'application');
			if (element) {
				value = element.getAttribute(name);
			}
		}
		return value;
	}

	/**
	 * Adds or changes an <application/> attribute for the given name and value.
	 * If <application/> element does not exist in manifest, then it will be added.
	 * @param {String} name The name of the attribute to add/change, such as "android:theme". Cannot be null/undefined.
	 * @param {String} value The attribute value to set. Can be empty string. Cannot be null/undefined.
	 */
	setAppAttribute(name, value) {
		// Validate arguments.
		if ((typeof name !== 'string') || (typeof value !== 'string')) {
			return;
		}

		// If we don't have any XML, then generate a <manifest/> element.
		if (this.isEmpty()) {
			this._xmlDomDocument = createManifestXmlDomDocument();
		}

		// Fetch the <application/> element. Create an empty one if it doesn't exist.
		let appElement = getFirstChildElementByTagName(this._xmlDomDocument.documentElement, 'application');
		if (!appElement) {
			appElement = this._xmlDomDocument.createElement('application');
			this._xmlDomDocument.documentElement.appendChild(appElement);
		}

		// Assign the given attribute key/value pair to the element.
		appElement.setAttribute(name, value);
	}

	/**
	 * Sets the <manifest/> element's "package" attribute to the given Java package name.
	 * @param {String} name
	 * The Java package name to be assigned such as "com.appceleration.kitchensink". Cannot be null or undefined.
	 */
	setPackageName(name) {
		// Validate argument.
		if (typeof name !== 'string') {
			return;
		}

		// If we don't have any XML, then generate a <manifest/> element.
		if (this.isEmpty()) {
			this._xmlDomDocument = createManifestXmlDomDocument();
		}

		// Do not continue if root element is not <manifest/>. (This should never happen.)
		const manifestElement = this._xmlDomDocument.documentElement;
		if (manifestElement.tagName !== 'manifest') {
			return;
		}

		// Assign package name to <manifest/> element.
		manifestElement.setAttribute('package', name);
	}

	/**
	 * Fetches the "versionCode" and "versionName" attributes from the <manifest/> element.
	 * @return {{versionCode: {String}, versionName: {String}}}
	 * Returns a dictionary providing the "versionCode" and "versionName" attributes read from <manifest/> element.
	 *
	 * Returns null if no XML content has been loaded;
	 */
	getAppVersionInfo() {
		let versionInfo = null;
		if (!this.isEmpty()) {
			const element = this._xmlDomDocument.documentElement;
			if (element.tagName === 'manifest') {
				versionInfo = {
					versionCode: element.getAttribute('android:versionCode'),
					versionName: element.getAttribute('android:versionName')
				};
			}
		}
		return versionInfo;
	}

	/**
	 * Fetches the manifest's <uses-sdk/> element's information.
	 * @return {{minSdkVersion: {String}, maxSdkVersion: {String}, targetSdkVersion: {String}}}
	 * Returns the <uses-sdk/> element's information such as "minSdkVersion", "maxSdkVersion", and "targetSdkVersion".
	 *
	 * Returns null if manifest does not contain a <uses-sdk/> element.
	 */
	getUsesSdk() {
		let usesSdk = null;
		if (!this.isEmpty()) {
			const element = getFirstChildElementByTagName(this._xmlDomDocument.documentElement, 'uses-sdk');
			if (element) {
				usesSdk = {
					minSdkVersion: element.getAttribute('android:minSdkVersion'),
					maxSdkVersion: element.getAttribute('android:maxSdkVersion'),
					targetSdkVersion: element.getAttribute('android:targetSdkVersion')
				};
			}
		}
		return usesSdk;
	}

	/**
	 * Removes the given attribute from the <application/> element.
	 * @param {String} name Name of the attribute to be removed such as "android:theme". Can be null/undefined.
	 */
	removeAppAttribute(name) {
		if (!this.isEmpty() && (typeof name === 'string')) {
			const element = getFirstChildElementByTagName(this._xmlDomDocument.documentElement, 'application');
			if (element) {
				element.removeAttribute(name);
			}
		}
	}

	/**
	 * Removes the <uses-sdk/> element from the manifest.
	 * Intended to be used when loading a library's "AndroidManifest.xml" before merging it with the app's manifest.
	 */
	removeUsesSdk() {
		if (this.isEmpty()) {
			return;
		}

		const manifestElement = this._xmlDomDocument.documentElement;
		while (true) {
			const usesSdkElement = getFirstChildElementByTagName(manifestElement, 'uses-sdk');
			if (!usesSdkElement) {
				break;
			}
			manifestElement.removeChild(usesSdkElement);
		}
	}

	/**
	 * Removes the given attribute from the an <activity/> by its name in the manifest.
	 * @param {String} activityName Name of the <activity/>. Can null/undefined.
	 * @param {String} attributeName Name of attribute to be removed such as "android:label". Can be null/undefined.
	 */
	removeActivityAttribute(activityName, attributeName) {
		if (!this.isEmpty() && (typeof activityName === 'string') && (typeof attributeName === 'string')) {
			const appElement = getFirstChildElementByTagName(this._xmlDomDocument.documentElement, 'application');
			if (appElement) {
				const activityElement = getFirstChildElementByTagAndAndroidName(appElement, 'activity', activityName);
				if (activityElement) {
					activityElement.removeAttribute(attributeName);
				}
			}
		}
	}

	/**
	 * Replaces all "${name}" placeholders in manifest's XML matching the given dictionary
	 * of placeholder name/value pairs.
	 * @param {{name: {String}, value: {String}}} placeholders
	 * Dictionary of placeholder name/value string pairs to do the replacement with.
	 */
	replacePlaceholdersUsing(placeholders) {
		// Argument must be a dictionary of name/value pairs.
		if (typeof placeholders !== 'object') {
			return;
		}

		// Do not continue if there is no XML to parse.
		if (this.isEmpty()) {
			return;
		}

		// Replace all ${placeholder} strings using given dictionary.
		let wasChanged = false;
		let xmlString = this._xmlDomDocument.documentElement.toString();
		for (const placeholderName in placeholders) {
			// Fetch the placeholder name/value pair.
			if (typeof placeholderName !== 'string') {
				continue;
			}
			let placeholderValue = placeholders[placeholderName];
			if ((placeholderValue === null) || (typeof placeholderValue === 'undefined')) {
				placeholderValue = '';
			}

			// Replace all placeholders having given name.
			// eslint-disable-next-line security/detect-non-literal-regexp
			const regexObject = new RegExp('\\$\\{' + placeholderName + '\\}', 'g');
			const newXmlString = xmlString.replace(regexObject, placeholderValue.toString());

			// If the string reference has changed, then we know the string has changed.
			// eslint-disable-next-line eqeqeq
			if (newXmlString != xmlString) {
				wasChanged = true;
				xmlString = newXmlString;
			}
		}

		// Reload the XML if the string contents have changed.
		if (wasChanged) {
			this._xmlDomDocument = (new DOMParser()).parseFromString(xmlString, 'text/xml');
		}
	}

	/**
	 * Replaces all Titanium "${tiapp.properties['key']}" placeholders in manifest with the properties defined
	 * by the given "tiapp" object.
	 *
	 * The "${tiapp.properties['id']}" placeholders will be replaced by given "appid" argument, which is expected
	 * to be a Java friendly package name. This is the most common Titanium placeholder. Note that modules are
	 * expected to use Google's "${applicationId}" placeholder instead, but we keep this feature for legacy purposes.
	 * @param {Object} tiapp An "appc.tiapp" object providing the properties.
	 * @param {String} appid A Java friendly package name to be used instead of "tiapp.id".
	 */
	replaceTiPlaceholdersUsing(tiapp, appid) {
		// Do not continue if neither argument was provided. Nothing to replace with.
		if (!tiapp && !appid) {
			return;
		}

		// Do not continue if there is no XML to parse.
		if (this.isEmpty()) {
			return;
		}

		// Replace the ${tiapp.properties['key']} placeholders in the XML with given arguments.
		let wasChanged = false;
		const regexString = /(\$\{tiapp\.properties\[['"]([^'"]+)['"]\]\})/g;
		const newXmlString = this._xmlDomDocument.documentElement.toString().replace(regexString, (s, m1, m2) => {
			if (appid && (m2 === 'id')) {
				// For "${tiapp.properties['id']}", use our Java friendly "appid" instead of "tiapp.id".
				wasChanged = true;
				return appid;
			}
			if (tiapp) {
				// All other properties should come from our "tiapp" object.
				wasChanged = true;
				return tiapp[m2];
			}
			return m2;
		});

		// Reload the XML if the string contents have changed.
		if (wasChanged) {
			this._xmlDomDocument = (new DOMParser()).parseFromString(newXmlString, 'text/xml');
		}
	}

	/**
	 * Applies a 'tools:replace="attributeName"' attribute to all <manifest/>, <application/>, and <activity/> elements.
	 * Will flag every attribute in these elements to be replaced by the gradle manifest merging tool.
	 *
	 * Note that a gradle build failure will occur if the app's "AndroidManifest.xml" defines an activity attribute
	 * which conflicts with a library's same activity attribute. Google expects the developer to resolve it by
	 * defining a "tools:replace" attribute which explicitly defines each attribute that should be replaced/overriden.
	 * Since "most" Titanium app developers override existing <application/> and <activity/> attributes, we'll
	 * do this for them to avoid the massive tech-support issues.
	 */
	applyToolsReplace() {
		// Do not continue if we haven't loaded any XML content.
		if (this.isEmpty()) {
			return;
		}

		// Make sure that <manifest/> is the root element.
		const manifestElement = this._xmlDomDocument.documentElement;
		if (manifestElement.tagName !== 'manifest') {
			return;
		}

		// Add XML tools namespace to root <manifest/> element.
		manifestElement.setAttribute('xmlns:tools', 'http://schemas.android.com/tools');

		// Apply "tools:replace" attribute to <manifest/> element. (Must be done after setting namespace above.)
		applyToolsReplaceToElement(manifestElement);

		// Apply 'tools:node="replace"' to WRITE_EXTERNAL_STORAGE permission if no other tools attribute is set.
		// Titanium adds "maxSdkVersion" attribute to this permission by default. This removes that attribute.
		const permissionElement = getFirstChildElementByTagAndAndroidName(
			manifestElement, 'uses-permission', 'android.permission.WRITE_EXTERNAL_STORAGE');
		if (permissionElement) {
			let hasToolsAttribute = false;
			for (let index = 0; index < permissionElement.attributes.length; index++) {
				if (permissionElement.attributes.item(index).name.startsWith('tools:')) {
					hasToolsAttribute = true;
					break;
				}
			}
			if (!hasToolsAttribute) {
				permissionElement.setAttribute('tools:node', 'replace');
			}
		}

		// Fetch the <application/> element.
		const appElement = getFirstChildElementByTagName(manifestElement, 'application');
		if (!appElement) {
			return;
		}

		// Apply "tools:replace" attribute to <application/> and <activity/> elements.
		applyToolsReplaceToElement(appElement);
		if (appElement.hasChildNodes()) {
			for (let index = 0; index < appElement.childNodes.length; index++) {
				const nextNode = appElement.childNodes.item(index);
				if (isElementNode(nextNode) && (nextNode.tagName === 'activity')) {
					applyToolsReplaceToElement(nextNode);
				}
			}
		}
	}

	/**
	 * Copies the given manifest settings to this object's manifest.
	 * This will add/overwrite attributes for XML elements of the same name.
	 * @param {AndroidManifest} manifest
	 * The "AndroidManifest" object whose manifest settings are to be merged into this object's manifest.
	 * Must be of type "AndroidManifest" or else an exception will be thrown.
	 */
	copyFromAndroidManifest(manifest) {
		// Validate argument.
		if (!(manifest instanceof AndroidManifest)) {
			throw new Error('1st argument must be of type AndroidManifest.');
		}

		// Do not continue if given object has no XML to copy.
		const sourceXmlDomDocument = manifest.xmlDomDocument;
		if (!sourceXmlDomDocument || !sourceXmlDomDocument.documentElement) {
			return;
		}

		// If this object contains no XML, then clone given manifest's XML and stop here.
		if (this.isEmpty()) {
			this._xmlDomDocument = sourceXmlDomDocument.cloneNode(true);
			return;
		}

		// Do not continue if root node names don't match between manifests. (This should never happen.)
		if (this._xmlDomDocument.documentElement.tagName !== sourceXmlDomDocument.documentElement.tagName) {
			return;
		}

		// Recursive function used to merge XML attributes and children from source to destination.
		function mergeElements(sourceElement, destinationElement) {
			// Validate arguments.
			if (!sourceElement || !destinationElement) {
				return;
			}

			// Copy source node's attributes to destination node. Overwrites attributes if already exist.
			if (sourceElement.hasAttributes()) {
				for (let index = 0; index < sourceElement.attributes.length; index++) {
					const sourceAttribute = sourceElement.attributes.item(index);
					destinationElement.setAttribute(sourceAttribute.name, sourceAttribute.value);
				}
			}

			// Do not continue if source node does not have any child nodes.
			if (!sourceElement.hasChildNodes()) {
				return;
			}

			// We only support merging child nodes immediately under <manifest/>, <queries/>, or <application/>.
			// For all other XML elements, we simply replace the child nodes, but only if children were provided.
			const isManifestElement = (sourceElement.tagName === 'manifest');
			const canMergeChildren
				=  isManifestElement
				|| (sourceElement.tagName === 'application')
				|| (sourceElement.tagName === 'queries');
			if (!canMergeChildren) {
				while (destinationElement.hasChildNodes()) {
					destinationElement.removeChild(destinationElement.firstChild);
				}
			}

			// If we're merging <manifest/> elements, then fetch the destination's child <application/> if it exists.
			// We'll want to add the source's child nodes above <application/> if we can.
			let destinationAppChildElement = null;
			if (isManifestElement) {
				destinationAppChildElement = getFirstChildElementByTagName(destinationElement, 'application');
			}

			// Merge/Copy the source element's children to destination element. (This is recursive.)
			for (let index = 0; index < sourceElement.childNodes.length; index++) {
				// Fetch info from next child node under source.
				const sourceChildNode = sourceElement.childNodes.item(index);
				let tagName = null;
				let androidName = null;
				if (isElementNode(sourceChildNode)) {
					tagName = sourceChildNode.tagName;
					androidName = sourceChildNode.getAttribute('android:name');
				}

				// Attempt to find a matching child element under destination.
				// Note: Never merge <intent/> block. Only append them. (Duplicate intent blocks are okay.)
				let destinationChildElement = null;
				if (tagName && (tagName !== 'intent')) {
					if (androidName) {
						destinationChildElement = getFirstChildElementByTagAndAndroidName(destinationElement, tagName, androidName);
					} else {
						destinationChildElement = getFirstChildElementByTagName(destinationElement, tagName);
					}
				}

				// Handle the merge/copy.
				if (destinationChildElement) {
					// Do a merge since a matching child node was found. (This is recursive.)
					mergeElements(sourceChildNode, destinationChildElement);
				} else if (destinationAppChildElement) {
					// Matching child not found at destination. Insert above destination's <application/> node.
					// Note: Gradle linting tool logs warnings if you put nodes below <application/> node.
					destinationElement.insertBefore(sourceChildNode.cloneNode(true), destinationAppChildElement);
				} else {
					// Matching child not found at destination. Add to end of children.
					destinationElement.appendChild(sourceChildNode.cloneNode(true));
				}
			}
		}

		// Perform the merge starting from <manifest/> elements.
		mergeElements(sourceXmlDomDocument.documentElement, this._xmlDomDocument.documentElement);
	}

	/**
	 * Async writes to file this object's XML manifest settings.
	 * @param {String} filePath
	 * Path of the file to be written. File name would normally be set to "AndroidManifest.xml".
	 * Must be of type string or else an exception will be thrown.
	 */
	async writeToFilePath(filePath) {
		await fs.writeFile(filePath, this.toString());
	}

	/**
	 * Blocking writes to file this object's XML manifest settings.
	 * @param {String} filePath
	 * Path of the file to be written. File name would normally be set to "AndroidManifest.xml".
	 * Must be of type string or else an exception will be thrown.
	 */
	writeToFilePathSync(filePath) {
		fs.writeFileSync(filePath, this.toString());
	}

	/**
	 * Static method which async reads an "AndroidManifest.xml" file and returns a new AndroidManifest
	 * instance providing the loaded contents.
	 * @param {String} filePath Path of the file to be read. Must be of type string or else an exception will be thrown.
	 * @return {Promise<AndroidManifest>}
	 * Returns a Promise object providing a new AndroidManifest instance of the successfully loaded XML contents.
	 */
	static async fromFilePath(filePath) {
		if (typeof filePath !== 'string') {
			throw new Error('1st argument must be of type string.');
		}

		let fileContent = await fs.readFile(filePath);
		if (!fileContent) {
			fileContent = '';
		}
		return AndroidManifest.fromXmlString(fileContent.toString());
	}

	/**
	 * Static method which does a blocking read of an "AndroidManifest.xml" file and returns a new AndroidManifest
	 * instance providing the loaded contents.
	 * @param {String} filePath Path of the file to be read. Must be of type string or else an exception will be thrown.
	 * @return {AndroidManifest}
	 * Returns a new AndroidManifest instance of the successfully loaded XML.
	 */
	static fromFilePathSync(filePath) {
		if (typeof filePath !== 'string') {
			throw new Error('1st argument must be of type string.');
		}

		let fileContent = fs.readFileSync(filePath);
		if (!fileContent) {
			fileContent = '';
		}
		return AndroidManifest.fromXmlString(fileContent.toString());
	}

	/**
	 * Static method which loads the given string as "AndroidManifest.xml" content and returns a new AndroidManifest
	 * instance providing that loaded content.
	 * @param {String} text The XML string to be loaded.
	 * @returns {AndroidManifest}
	 * Returns a new AndroidManifest instance of the successfully loaded XML.
	 */
	static fromXmlString(text) {
		// Validate argument.
		if (typeof text !== 'string') {
			throw new Error('1st argument must be of type string.');
		}

		// Process the XML string before parsing it.
		const MANIFEST_ELEMENT_PREFIX = '<manifest';
		const manifestIndex = text.indexOf(MANIFEST_ELEMENT_PREFIX);
		if (manifestIndex >= 0) {
			// Inject commonly used Android XML namespaces into the <manifest/> element if missing.
			// Needed for backward compatibility since older versions of Titanium would inject them too.
			const insertIndex = manifestIndex + MANIFEST_ELEMENT_PREFIX.length;
			let attributeIndex = text.indexOf('xmlns:tools', manifestIndex);
			if ((attributeIndex < 0) || (attributeIndex > text.indexOf('>', manifestIndex))) {
				const attributeString = ' xmlns:tools="http://schemas.android.com/tools"';
				text = text.substring(0, insertIndex) + attributeString + text.substring(insertIndex);
			}
			attributeIndex = text.indexOf('xmlns:android', manifestIndex);
			if ((attributeIndex < 0) || (attributeIndex > text.indexOf('>', manifestIndex))) {
				const attributeString = ' xmlns:android="http://schemas.android.com/apk/res/android"';
				text = text.substring(0, insertIndex) + attributeString + text.substring(insertIndex);
			}

			// Remove "xmlns:android" namespace attributes from all child elements. Only supported in <manifest/>.
			// Note: CLI used to wrongly inject these after updating "tiapp.xml" if missing from root element.
			const manifestEndIndex = text.indexOf('>', manifestIndex);
			text = text.replace(/\sxmlns:android=".*?"/g, (match, offset) => {
				return (offset <= manifestEndIndex) ? match : '';
			});
		}

		// Parse given XML string and wrap it in a new AndroidManifest instance.
		const xmlDomDocument = (new DOMParser()).parseFromString(text, 'text/xml');
		return new AndroidManifest(xmlDomDocument);
	}
}

/**
 * Creates a simple <manifest/> element without any children and returns it as an "xmldom.Document" object.
 * @returns {Object} Returns an "xmldom.Document" object of the <manifest/> content.
 * @private
 */
function createManifestXmlDomDocument() {
	const xmlDomDocument = (new DOMParser()).parseFromString('<manifest/>');
	xmlDomDocument.documentElement.setAttribute('xmlns:android', 'http://schemas.android.com/apk/res/android');
	xmlDomDocument.documentElement.setAttribute('xmlns:tools', 'http://schemas.android.com/tools');
	return xmlDomDocument;
}

/**
 * Determines if given "xmldom.Node" object is an XML element, such as <manifest/> or <activity/>.
 * @param {Object} node The XML node object to check. Can be null/undefined.
 * @returns {Boolean} Returns true if given node is an XML element. Returns false if not or given an invalid argument.
 * @private
 */
function isElementNode(node) {
	const ELEMENT_NODE = 1;
	return node && (node.nodeType === ELEMENT_NODE);
}

/**
 * Determines if given "xmldom.Node" object is text between XML elements or attributes.
 * @param {Object} node The XML node object to check. Can be null/undefined.
 * @returns {Boolean}
 * Returns true if given node is text between XLM elements or attributes.
 * Returns false if not or given an invalild argument.
 * @private
 */
function isTextNode(node) {
	const TEXT_NODE = 3;
	return node && (node.nodeType === TEXT_NODE);
}

/**
 * Fetches the first child XML element having the given tag name under the given node.
 * @param {Object} node The XML element to search under. Can be null/undefined.
 * @param {String} tagName The name of child element to search for.
 * @returns {Object}
 * Returns an Element object matching the given tag name if found.
 * Returns null if element was not found or if given invalid arguments.
 * @private
 */
function getFirstChildElementByTagName(node, tagName) {
	if (node && node.hasChildNodes()) {
		for (let index = 0; index < node.childNodes.length; index++) {
			const nextNode = node.childNodes.item(index);
			if (isElementNode(nextNode) && (nextNode.tagName === tagName)) {
				return nextNode;
			}
		}
	}
	return null;
}

/**
 * Fetches the first child XML element having the given tag name and "android:name" under the given node.
 * @param {Object} node The XML element to search under. Can be null/undefined.
 * @param {String} tagName The name of child element to search for.
 * @param {String} androidName The name assigned to the "android:name" attribute.
 * @returns {Object}
 * Returns an Element object matching the given tag name and "android:name" if found.
 * Returns null if element was not found or if given invalid arguments.
 * @private
 */
function getFirstChildElementByTagAndAndroidName(node, tagName, androidName) {
	if (node && node.hasChildNodes()) {
		for (let index = 0; index < node.childNodes.length; index++) {
			const nextNode = node.childNodes.item(index);
			if (isElementNode(nextNode) && (nextNode.tagName === tagName)) {
				if (nextNode.getAttribute('android:name') === androidName) {
					return nextNode;
				}
			}
		}
	}
	return null;
}

/**
 * If given XML element contains an attribute, then this method will add a "tools:replace" attribute
 * referencing every attribute in that XML element.
 *
 * This method is not recursive. It will not apply "tools:replace" to given element's children.
 * @param {Object} element An XML element such as <application/> or <activity/>. Can be null/undefined.
 * @private
 */
function applyToolsReplaceToElement(element) {
	// Do not continue if argument is invalid or has no attributes.
	if (!isElementNode(element) || !element.hasAttributes()) {
		return;
	}

	// Traverse all attributes in given XML element.
	const attributeNamesToReplace = {};
	const toolsAttributes = {};
	for (let index = 0; index < element.attributes.length; index++) {
		const attribute = element.attributes.item(index);
		if (attribute.name.startsWith('tools:')) {
			// This is a special "tool:*" attribute which tells build system how to merge manifest info.
			const stringValueArray = attribute.value.split(',');
			if (attribute.name === 'tools:replace') {
				// There is already a "tools:replace" attribute defined.
				// Add its attributes to our collection. We'll overwrite "tools:replace" with it later.
				for (const nextValue of stringValueArray) {
					attributeNamesToReplace[nextValue] = true;
				}
			} else {
				// Store "tools:*" attribute info.
				toolsAttributes[attribute.name] = stringValueArray;
			}
		} else if ((attribute.name !== 'android:name')
				&& (attribute.name !== 'package')
				&& !attribute.name.startsWith('xmlns:')) {
			// Add attribute to the "tools:replace" collection.
			attributeNamesToReplace[attribute.name] = true;
		}
	}

	// Remove attributes from our "tools:replace" collection if already referenced in another "tools:*" item.
	// Note: This avoids a build failure. An attribute can only be referenced by 1 "tools:*" attribute at a time.
	for (const valueArray in toolsAttributes) {
		for (const nextValue of valueArray) {
			delete attributeNamesToReplace[nextValue];
		}
	}

	// Apply a "tools:replace" attribute to given XML element. (Remove it if attribute array is empty.)
	const nameArray = Object.keys(attributeNamesToReplace);
	if (nameArray && (nameArray.length > 0)) {
		element.setAttribute('tools:replace', nameArray.join(','));
	} else {
		element.removeAttribute('tools:replace');
	}
}

module.exports = AndroidManifest;
