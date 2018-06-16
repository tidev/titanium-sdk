/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * Description:
 * Loads all of Titanium's core JavaScript files under the "extensions" directory.
 * Does not load JS files recursively. Does a simple flat directory search instead.
 * 
 * This loader is expected to be ran before executing the "app.js" file. Intended to
 * share Titanium's core JavaScript code/extensions on all platforms.
 */

'use strict';

var JS_EXTENSION = '.js',
	DIRECTORY_PATH = '_ti/extensions/';

exports.load = function () {
	var directory = Ti.Filesystem.getFile(Ti.Filesystem.getResourcesDirectory(), DIRECTORY_PATH),
		fileNames = directory.getDirectoryListing(),
		fileName,
		fileIndex,
		stringIndex;

	if (fileNames) {
		fileNames.sort();
		for (fileIndex = 0; fileIndex < fileNames.length; fileIndex++) {
			fileName = fileNames[fileIndex];
			if (fileName) {
				stringIndex = fileName.lastIndexOf(JS_EXTENSION);
				if ((stringIndex >= 0) && ((fileName.length - stringIndex) === JS_EXTENSION.length)) {
					require(DIRECTORY_PATH + fileName.substr(0, fileName.length - JS_EXTENSION.length));
				}
			}
		}
	}
};
