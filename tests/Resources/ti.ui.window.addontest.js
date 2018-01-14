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

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('.extendSafeArea exists', function (finish) {
		this.timeout(5000);
		// TODO: Add more unit tests related to top, bottom, left, right margins of win.safeAreaView.
		win = Ti.UI.createWindow({
			backgroundColor: 'gray',
			extendSafeArea: false
		});

		win.addEventListener('open', function () {
			try {
				should(win.safeAreaView).be.a.Object;
				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.open();
	});
});
