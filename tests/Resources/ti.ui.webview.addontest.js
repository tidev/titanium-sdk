/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

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
		var webView;
		var htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'folder with spaces', 'comingSoon.html');
		var resourecDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: htmlFile.nativePath,
			assetsDirectory: resourecDir.nativePath
		});
		should(webView.assetsDirectory).be.a.String;

		webView.addEventListener('load', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.ios('beforeload', (finish) => {
		let webView;
		const url = 'https://www.appcelerator.com/';
		var beforeLoaded = false;

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url
		});

		webView.addEventListener('beforeload', (e) => {
			if (beforeLoaded === true) {
				if (e.url !== url) {
					webView.stopLoading();
					finish();
				}
			}
			beforeLoaded = true;
		});

		win.add(webView);
		win.open();
	});
});
