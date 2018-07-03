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

exports.load = function () {
	var DIRECTORY_PATH = 'ti.internal/extensions/',
		directory = Ti.Filesystem.getFile(Ti.Filesystem.getResourcesDirectory(), DIRECTORY_PATH),
		fileNames = directory.getDirectoryListing(),
		fileIndex,
		regexResults;

	if (fileNames) {
		fileNames.sort();
		for (fileIndex = 0; fileIndex < fileNames.length; fileIndex++) {
			// If the next file has a "*.js" extension, extract the file name and require it in.
			regexResults = fileNames[fileIndex].match(/^(.*)\.js$/);
			if (regexResults) {
				require(DIRECTORY_PATH + regexResults[1]);
			}
		}
	}
};
