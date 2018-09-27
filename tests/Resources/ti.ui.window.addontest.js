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

describe('Titanium.UI.Window', function () {
	var win,
		rootWindow;

	this.timeout(5000);

	// Create and open a root window for the rest of the below child window tests to use as a parent.
	// We're not going to close this window until the end of this test suite.
	// Note: Android needs this so that closing the last window won't back us out of the app.
	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', function () {
			finish();
		});
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', function () {
			finish();
		});
		rootWindow.close();
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('.statusBarStyle', function (finish) {
		win = Ti.UI.createWindow({
			title: 'This is status bar style test',
			statusBarStyle: Ti.UI.iOS.StatusBar.LIGHT_CONTENT
		});

		win.addEventListener('open', function () {
			try {
				should(win.statusBarStyle).be.a.Number;
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.LIGHT_CONTENT);
				win.setStatusBarStyle(Ti.UI.iOS.StatusBar.GRAY);
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.GRAY);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
