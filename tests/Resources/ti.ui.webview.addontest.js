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

	// Test communications between app and HTML script.
	it.windowsBroken('html-interop', function (finish) {
		var webView;
		this.timeout(10000);
		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			html: ''
				+ '<html>'
				+ '  <body>'
				+ '    <p id="label">test</p>'
				+ '  </body>'
				+ '  <script>'
				+ '    document.addEventListener("DOMContentLoaded", function () {'
				+ '      Ti.App.fireEvent("app:DOMContentLoaded", {});'
				+ '    });'
				+ '  </script>'
				+ '</html>'
		});
		win.add(webView);
		win.open();
		Ti.App.addEventListener('app:DOMContentLoaded', function () {
			try {
				should(webView.evalJS('document.getElementById("label").innerHTML')).be.eql('test');
				finish();
			} catch (err) {
				finish(err);
			}
		});
	});
});
