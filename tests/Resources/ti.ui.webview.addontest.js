/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.WebView', function () {
	var win;
	this.slow(3000);
	this.timeout(30000);

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.ios('#assetsDirectory', function (finish) {
		win = Ti.UI.createWindow();
		var loadCount = 0;
		function createDirectory(f) {
			if (f && !f.exists()) {
				f.createDirectory();
			}
			return f;
		}

		// Copy from Resources to cache folder
		var cacheDir = createDirectory(Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory));
		var htmlDir = createDirectory(Ti.Filesystem.getFile(cacheDir.nativePath, 'html'));
		var cssDir = createDirectory(Ti.Filesystem.getFile(cacheDir.nativePath, 'folder with spaces'));
		var resourceDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);

		var htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'html', 'example.html');
		var cssFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'folder with spaces', 'comingSoon.html');

		var htmlInCache = Ti.Filesystem.getFile(cacheDir.nativePath, 'html', 'example.html');
		var cssInCache = Ti.Filesystem.getFile(cacheDir.nativePath, 'folder with spaces', 'comingSoon.html');

		htmlFile.copy(htmlInCache.nativePath);
		cssFile.copy(cssInCache.nativePath);

		var webView = Ti.UI.createWebView({
			width: Ti.UI.FILL,
			height: Ti.UI.FILL,
			url: htmlInCache.nativePath,
			assetsDirectory: cacheDir.nativePath
		});

		webView.addEventListener('load', function () {
			loadCount++;
			if (loadCount > 1) {
				finish();
			}
		});
		win.add(webView);
		win.open();
	});

});
