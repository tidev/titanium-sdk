/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, Titanium */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.TextField', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// TextField must not receive focus by default upon opening a window.
	it('focus-win-open', function (finish) {
		var textField;
		this.timeout(5000);

		win = Ti.UI.createWindow();
		textField = Ti.UI.createTextField();
		textField.addEventListener('focus', function () {
			// This should never happen.
			finish(new Error('TextField wrongly received focus on open.'));
		});
		win.add(textField);
		win.addEventListener('postlayout', function () {
			// If we made it this far, assume TextField did not receive focus.
			finish();
		});
		win.open();
	});

	// The "focus" and "blur" events are not supposed to bubble up the view hierarchy.
	it('focus-blur-bubbles', function (finish) {
		var textField;
		this.timeout(5000);

		win = Ti.UI.createWindow();
		textField = Ti.UI.createTextField();
		textField.addEventListener('focus', function (e) {
			should(e.bubbles).be.eql(false);
			textField.blur();
		});
		textField.addEventListener('blur', function (e) {
			should(e.bubbles).be.eql(false);
			finish();
		});
		win.add(textField);
		win.addEventListener('open', function () {
			textField.focus();
		});
		win.open();
	});
});
