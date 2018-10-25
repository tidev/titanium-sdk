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
	var win;

	this.timeout(5000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.android('.safeAreaPadding with extendSafeArea false', function (finish) {
		win = Ti.UI.createWindow({
			extendSafeArea: false,
		});
		win.addEventListener('postlayout', function () {
			try {
				var padding = win.safeAreaPadding;
				should(padding).be.a.Object;
				should(padding.left).be.eql(0);
				should(padding.top).be.eql(0);
				should(padding.right).be.eql(0);
				should(padding.bottom).be.eql(0);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// This test will only pass on Android 4.4 and higher since older versions do not support translucent bars.
	it.android('.safeAreaPadding with extendSafeArea true', function (finish) {
		win = Ti.UI.createWindow({
			extendSafeArea: true,
			theme: 'Theme.AppCompat.NoTitleBar',
			orientationModes: [ Ti.UI.PORTRAIT ],
			windowFlags: Ti.UI.Android.FLAG_TRANSLUCENT_STATUS | Ti.UI.Android.FLAG_TRANSLUCENT_NAVIGATION
		});
		win.addEventListener('postlayout', function () {
			try {
				var padding = win.safeAreaPadding;
				should(padding).be.a.Object;
				should(padding.top).be.greaterThan(0);
				should(padding.bottom).be.greaterThan(0);
				should(padding.left >= 0).be.true;
				should(padding.right >= 0).be.true;
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
