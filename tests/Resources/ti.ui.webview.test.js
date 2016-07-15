/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false;

describe('Titanium.UI.WebView', function () {
	this.slow(2000);
	this.timeout(10000);

	var win;

	beforeEach(function() {
		didFocus = false;
	});

	afterEach(function() {
		if (win != null) {
			win.close();
		}
		win = null;
	});

	// Skip this on desktop Windows 10 apps because it crashes the app now.
	((utilities.isWindows10() && utilities.isWindowsDesktop()) ? it.skip : it)('url', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				webview.url = 'http://www.appcelerator.com/';

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	// FIXME Times out on Android build machine. No idea why... Must be we never get focus event?
	(utilities.isAndroid() ? it.skip : it)('url(local)', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				webview.url = 'ti.ui.webview.test.html';

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	// Skip this on desktop Windows apps because it crashes the app now.
	// FIXME Parity issue! Windows require second argument which is callback function. Other platforms return value sync!
	// FIXME Android returns null?
	// FIXME Sometimes times out on iOS. Not really sure why...
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('evalJS', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var webview = Ti.UI.createWebView(),
			hadError = false;

		webview.addEventListener('load', function () {
			if (hadError) return;

			if (utilities.isWindows()) { // Windows requires an async callback function
				webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";', function (result) {
					try {
						should(result).be.eql('WebView.evalJS.TEST');

						finish();
					} catch (err) {
						finish(err);
					}
				});
			} else { // other platforms return the result as result of function call!
				var result = webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";');
				try {
					should(result).be.eql('WebView.evalJS.TEST'); // Android reports null

					finish();
				} catch (err) {
					finish(err);
				}
			}
		});
		win.addEventListener('focus', function () {
			if (didFocus) return;
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
