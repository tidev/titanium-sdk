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

describe('Ti.UI.WebView', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('should handle file URLs with spaces in path - TIMOB-18765', function (finish) {
		// Should handle paths with spaces!
		var URL = Ti.Filesystem.resourcesDirectory + '/folder with spaces/comingSoon.html',
			webView = Ti.UI.createWebView({
				top: 30
			});

		webView.addEventListener('error', function () {
			finish('Failed to load HTML file from URL with spaces in path');
		});

		webView.addEventListener('load', function (e) {
			if (utilities.isAndroid()) {
				should(e.url).eql('app:///folder with spaces/comingSoon.html');
			} else if (utilities.isIOS()) {
				should(e.url).eql('file://' + Ti.Filesystem.resourcesDirectory + 'folder%20with%20spaces/comingSoon.html');
			}
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(webView);
		win.open();

		webView.url = URL;
	});
});
