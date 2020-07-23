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
	this.slow(3000);
	this.timeout(30000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	// FIXME: I think we need to tweak the test here. Set URL property after adding the listeners!
	// iOS works most of the time, but also has some odd failures sometimes. SDK 8+ is reworking this.
	it.ios('#findString', function (finish) {
		win = Ti.UI.createWindow();
		const webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});

		webView.addEventListener('load', function () {
			webView.findString('google', function(e) {
				if (e.success) {
					finish();
				} else {
					finish(error);
				}
			});
		});

		win.add(webView);
		win.open();
	});

	it.ios('#createPdf', function (finish) {
		win = Ti.UI.createWindow();
		const webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});

		webView.addEventListener('load', function () {
			webView.createPdf(function(e) {
				if (e.success) {
					should(e.data).be.an.object;
					finish();
				} else {
					finish(error);
				}
			});
		});

		win.add(webView);
		win.open();
	});

	it.ios('#createWebArchive', function (finish) {
		win = Ti.UI.createWindow();
		const webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});

		webView.addEventListener('load', function () {
			webView.createWebArchive(function (e) {
				if (e.success) {
					should(e.data).be.an.object;
					finish();
				} else {
					finish(e.error);
				}
			});
		});

		win.add(webView);
		win.open();
	});
});
