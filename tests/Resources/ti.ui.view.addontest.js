/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.View', function () {
	var rootWindow,
		win,
		didFocus = false,
		didPostLayout = false;

	this.slow(2000);
	this.timeout(10000);

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

	beforeEach(function () {
		didFocus = false;
		didPostLayout = false;
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// FIXME Get working on iOS
	it.android('backgroundDisabledColor', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				view.backgroundDisabledColor = '#88FFFFFF';
				should(view.getBackgroundDisabledColor()).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

});
