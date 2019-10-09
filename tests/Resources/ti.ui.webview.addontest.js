/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.WebView', function () {
	it('baseURL should be accessible via window.location', (done) => {
		const win = Ti.UI.createWindow();
		const baseURL = 'https://www.google.com/';
		const webView = Ti.UI.createWebView();
		webView.setHtml(
			'<html><body></body></html>',
			{
				baseURL
			}
		);
		webView.addEventListener('load', () => {
			webView.evalJS('window.location.href', result => {
				should(result).be.eql(baseURL);
				win.close();
				done();
			});
		});
		win.add(webView);
		win.open();
	});
});
