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
	var win;
	this.slow(2000);
	this.timeout(10000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('startListeningToProperties', function (finish) {
		var webView;

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

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://httpbin.org/basic-auth/user/password',
			basicAuthentication: { username: 'user', password: 'password' }
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('sslerror', function (e) {
			finish(e);
		});

		win.add(webView);
		win.open();
	});

	it.ios('ignoreSslError', function (finish) {
		var webView;

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://httpbin.org/basic-auth/user/password',
			ignoreSslError: true
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('sslerror', function (e) {
			finish(e);
		});

		win.add(webView);
		win.open();
	});

	it('should handle file URLs with spaces in path - TIMOB-18765', function (finish) {
		// Should handle paths with spaces!
		var URL = Ti.Filesystem.resourcesDirectory + '/folder with spaces/comingSoon.html',
			webView = Ti.UI.createWebView({
				top: 30
			});

		webView.addEventListener('error', function (e) {
			Ti.API.info(JSON.stringify(e));
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
