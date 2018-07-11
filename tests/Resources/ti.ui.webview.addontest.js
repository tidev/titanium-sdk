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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.WebView', function () {
	var win,
		didFocus = false;
	this.slow(2000);
	this.timeout(10000);

	beforeEach(function () {
		didFocus = false;
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('startListeningToProperties', function (finish) {
		var webView;
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://google.com'
		});

		webView.startListeningToProperties([ 'title' ]);
		webView.addEventListener('title', function (e) {
			finish();
		});
		win.add(webView);
		win.open();
	});

});
