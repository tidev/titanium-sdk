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
var should = require('./utilities/assertions');

describe('Titanium.UI.WebView', function () {
	var win;
	this.slow(2000);
	this.timeout(10000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.windowsMissing('.zoomLevel', function (finish) {
		var webView;

		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();

		webView = Ti.UI.createWebView({
			html: '<!DOCTYPE html><html><body><p>HELLO WORLD</p></body></html>'
		});

		webView.addEventListener('load', function () {
			should(webView.zoomLevel).be.a.Number;
			should(webView.getZoomLevel).be.a.Function;
			should(webView.setZoomLevel).be.a.Function;

			should(webView.zoomLevel).eql(1.0);
			should(webView.getZoomLevel()).eql(1.0);

			setTimeout(function () {
				webView.zoomLevel = 3.0;
				should(webView.zoomLevel).eql(3.0);
				should(webView.getZoomLevel()).eql(3.0);
				setTimeout(function () {
					webView.setZoomLevel(1.0);
					should(webView.zoomLevel).eql(1.0);
					finish();
				}, 500);
			}, 500);
		});

		win.add(webView);
		win.open();
	});
});
