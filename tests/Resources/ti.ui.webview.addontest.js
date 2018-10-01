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

	it('#evalJS(string, function) - async variant', function (finish) {
		var webview,
			hadError = false;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		webview = Ti.UI.createWebView();

		webview.addEventListener('load', function () {
			if (hadError) {
				return;
			}

			// FIXME: Android is dumb and assumes no trailing semicolon!
			webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST"', function (result) {
				try {
					if (utilities.isAndroid()) {
						should(result).be.eql('"WebView.evalJS.TEST"'); // FIXME: Why the double-quoting?
					} else {
						should(result).be.eql('WebView.evalJS.TEST');
					}

					finish();
				} catch (err) {
					finish(err);
				}
			});
		});
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				webview.url = 'ti.ui.webview.test.html';
			} catch (err) {
				hadError = true;
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});
});
