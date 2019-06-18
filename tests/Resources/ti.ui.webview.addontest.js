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

describe('Titanium.UI.WebView', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// Verifies local HTML file can access local JS file and invoke an HTML "onload" callback.
	it.windowsMissing('html-script-tag', function (finish) {
		this.slow(3000);
		this.timeout(5000);

		Ti.App.addEventListener('ti.ui.webview.script.tag:onPageLoaded', function () {
			finish();
		});

		win = Ti.UI.createWindow();
		win.add(Ti.UI.createWebView({
			url: 'ti.ui.webview.script.tag.html'
		}));
		win.open();
	});
});
