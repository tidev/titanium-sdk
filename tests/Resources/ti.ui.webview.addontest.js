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
		webView.addEventListener('title', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.ios('sslerror', function (finish) {
		var webView;
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://httpbin.org/basic-auth/user/password'
		});

		webView.addEventListener('sslerror', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.ios('blacklisturl', function (finish) {
		var webView;
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://google.com',
			blacklistedURLs: [ 'https://google.com' ]
		});

		webView.addEventListener('blacklisturl', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.ios('basicAuthentication', function (finish) {
		var webView;
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://httpbin.org/basic-auth/user/password',
			basicAuthentication: { username: 'user', password: 'password' }
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('sslerror', function () {
			finish(e);
		});

		win.add(webView);
		win.open();
	});

	it.ios('ignoreSslError', function (finish) {
		var webView;
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://httpbin.org/basic-auth/user/password',
			ignoreSslError: true
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('sslerror', function () {
			finish(e);
		});

		win.add(webView);
		win.open();
	});

});
