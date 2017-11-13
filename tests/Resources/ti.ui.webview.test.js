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

	// FIXME: According to Ewan, iOS errors on should(webView.loading).be.eql(true); in the beforeLoad
	// FIXME: I think we need to tweak the test here. Set URL property after adding the listeners!
	it.androidAndWindowsBroken('loading', function (finish) {
		var webView;
		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://google.com'
		});

		should(webView.loading).be.a.Boolean;
		should(webView.loading).be.eql(false); // Windows Desktop gives true here

		webView.addEventListener('beforeload', function () {
			should(webView.loading).be.a.Boolean;
			should(webView.loading).be.eql(true);
		});

		webView.addEventListener('load', function () {
			should(webView.loading).be.a.Boolean;
			should(webView.loading).be.eql(false);

			finish();
		});

		win.add(webView);
		win.open();
	});

	it('url', function (finish) {
		var webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
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

	it.ios('keyboardDisplayRequiresUserAction', function (finish) {
		var webView;
		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				webView.keyboardDisplayRequiresUserAction = true;

				should(webView.keyboardDisplayRequiresUserAction).be.a.Boolean;
				should(webView.getKeyboardDisplayRequiresUserAction()).be.a.Boolean;
				should(webView.keyboardDisplayRequiresUserAction).be.eql(true);
				should(webView.getKeyboardDisplayRequiresUserAction()).be.eql(true);

				webView.setKeyboardDisplayRequiresUserAction(false);

				should(webView.keyboardDisplayRequiresUserAction).be.a.Boolean;
				should(webView.getKeyboardDisplayRequiresUserAction()).be.a.Boolean;
				should(webView.keyboardDisplayRequiresUserAction).be.eql(false);
				should(webView.getKeyboardDisplayRequiresUserAction()).be.eql(false);

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webView);
		win.open();
	});

	// FIXME Times out on Android build machine. No idea why... Must be we never get focus event?
	it.androidBroken('url(local)', function (finish) {
		var webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
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

	// TIMOB-23542 webview data test
	// FIXME times out on Windows. Probably because we should set the data property *after* the load event listener is hooked!
	it.windowsBroken('data', function (finish) {
		var blob,
			webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		blob = Ti.Filesystem.getFile('app.js').read();
		webview = Ti.UI.createWebView({
			data: blob
		});

		webview.addEventListener('load', function () {
			should(webview.data).be.an.object;
			finish();
		});
		win.add(webview);
		win.open();
	});

	// Skip this on desktop Windows apps because it crashes the app now. - Works fine locally, to investigate EH
	// FIXME Parity issue! Windows require second argument which is callback function. Other platforms return value sync!
	// FIXME Android returns null?
	// FIXME Sometimes times out on iOS. Not really sure why...
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('evalJS', function (finish) {
		var webview,
			hadError = false,
			result;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		webview = Ti.UI.createWebView();

		webview.addEventListener('load', function () {
			if (hadError) {
				return;
			}

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
				result = webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";');
				try {
					should(result).be.eql('WebView.evalJS.TEST'); // Android reports null

					finish();
				} catch (err) {
					finish(err);
				}
			}
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

	it.windows('url (ms-appx)', function (finish) {
		var w,
			webview;

		this.timeout(10000);

		w = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		webview.addEventListener('load', function () {
			w.close();
			finish();
		});
		w.addEventListener('open', function () {
			should(function () {
				webview.url = 'ms-appx:///ti.ui.webview.test.html';
			}).not.throw();
		});

		w.add(webview);
		w.open();
	});

	it.windows('url (ms-appx-web)', function (finish) {
		var w,
			webview;

		this.timeout(10000);

		w = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		webview.addEventListener('load', function () {
			w.close();
			finish();
		});
		w.addEventListener('open', function () {
			should(function () {
				webview.url = 'ms-appx-web:///ti.ui.webview.test.html';
			}).not.throw();
		});

		w.add(webview);
		w.open();
	});

	it.windows('url (ms-appx-data)', function (finish) {
		var w,
			webview;

		this.timeout(10000);

		function prepare(files) {
			var webroot = Ti.Filesystem.applicationDataDirectory + 'webroot',
				webroot_file = Ti.Filesystem.getFile(webroot),
				i,
				file,
				from,
				to;

			if (!webroot_file.exists()) {
				webroot_file.createDirectory();
			}
			for (i = 0; i < files.length; i++) {
				file = files[i];
				from = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file);
				to = webroot + Ti.Filesystem.separator + file;
				from.copy(to);
			}
		}

		w = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();
		webview.addEventListener('load', function () {
			w.close();
			finish();
		});
		w.addEventListener('open', function () {
			prepare([ 'ti.ui.webview.test.html' ]);
			should(function () {
				webview.url = 'ms-appdata:///local/webroot/ti.ui.webview.test.html';
			}).not.throw();
		});

		w.add(webview);
		w.open();
	});

	it('userAgent', function (finish) {
		win = Ti.UI.createWindow({backgroundColor: 'gray'}),
		var webView = Ti.UI.createWebView({
				url: 'http://whatsmyuseragent.org',
				userAgent: 'TEST AGENT'
			});

		webView.addEventListener('load', function(e) {
			var exp = /user-agent.+\s+.+\>(.*)\</g.exec(e.source.html),
				userAgent = exp && exp.length > 1 ? exp[1] : undefined;

			if (userAgent && userAgent === webView.userAgent) {
				finish();
			} else {
				finish(new Error('invalid userAgent'));
			}
		});

		win.add(webView);
		win.open();
	});
});
