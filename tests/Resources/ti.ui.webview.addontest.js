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

	it('requestHeaders with redirecting url should work properly', function (finish) {
		let webView;
		const url = 'https://jira.appcelerator.org/';

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url,
			requestHeaders: { 'Custom-field1': 'value1' }
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('error', function (e) {
			finish(e);
		});

		win.add(webView);
		win.open();
	});
});
