/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.Filesystem.File', function () {
	describe('#getDirectoryListing()', function () {
		it('access resource directory files', function () {
			let rootDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory),
				rootPath,
				filesFound = {};
			should(rootDir.exists()).be.true;
			should(rootDir.getDirectoryListing).be.a.Function;
			should(rootDir.getDirectoryListing()).be.an.Array;

			// Traverse entire Resources directory tree looking for files/directories in "filesFound".
			rootPath = rootDir.nativePath;
			filesFound[rootPath + 'app.js'] = false;
			filesFound[rootPath + 'ti.ui.webview.test.html'] = false;
			filesFound[rootPath + 'fixtures/'] = false; // Subdirectory containing only JS files.
			filesFound[rootPath + 'fixtures/empty-double.js'] = false;
			filesFound[rootPath + 'txtFiles/'] = false; // Subdirectory containing only assets.
			filesFound[rootPath + 'txtFiles/text.txt'] = false;
			function searchFileTree(file) {
				if (file) {
					let fileList = file.getDirectoryListing();
					if (fileList) {
						for (let index = 0; index < fileList.length; index++) {
							let nextFile = Ti.Filesystem.getFile(file.nativePath, fileList[index]);
							if (nextFile) {
								let absolutePath = nextFile.nativePath;
								if (absolutePath in filesFound) {
									filesFound[absolutePath] = true;
								}
								searchFileTree(nextFile);
							}
						}
					}
				}
			}
			searchFileTree(rootDir);
			for (let key in filesFound) {
				Ti.API.info('Checking if found file: ' + key);
				should(filesFound[key]).be.true;
			}
		});
	});
});

