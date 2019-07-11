/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

'use strict';

describe('Titanium.UI.WebView', function () {
	var win;
	this.slow(3000);
	this.timeout(30000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
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
