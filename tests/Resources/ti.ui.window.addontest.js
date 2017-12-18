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

describe('Titanium.UI.Window', function () {
	it.ios('#ExtendSafeArea (safeAreaView exists)', function (finish) {
		// TO DO: Add more unit tests related to top, bottom, left, right margins of win.safeAreaView.
		var win = Ti.UI.createWindow({
			backgroundColor: 'gray',
			extendSafeArea: false
		});

		win.addEventListener('focus', function () {
			try {
				var error;
				should(win.safeAreaView).be.a.Object;
			} catch (err) {
				error = err;
			}

			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});

		win.open();
	});
});
