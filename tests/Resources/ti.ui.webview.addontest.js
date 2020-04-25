/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.WebView', function () {
	let win;
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

	it('progress event', function (finish) {
		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		const webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});
		const isIOS = utilities.isIOS();
		webView.addEventListener('progress', function (e) {
			try {
				should(e).have.a.property('value').which.is.a.Number();
				should(e.value).be.within(0, 1);

				// webview.progress may have updated before we got this event fired, so can't compare

				should(e).have.a.property('url').which.is.a.String();
				// depending on os and version it may have a trailing slash
				should(e.url).be.equalOneOf([ 'https://www.google.com/', 'https://www.google.com' ]);
			} catch (err) {
				return finish(err);
			}
			if (e.value === 1) {
				finish();
			}
		});

		win.add(webView);
		win.open();
	});

	it('.progress', () => {
		const webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});
		should(webView).have.a.property('progress').which.is.a.Number(); // should default to 0 until we start loading the page.
	});
});
