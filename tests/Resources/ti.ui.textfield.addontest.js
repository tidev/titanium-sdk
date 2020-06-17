/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.TextField', function () {
	var win;

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	// TextField should not receive change event after setting value.
	it.ios('change event should not fire after setting textField value', function (finish) {
		var textField;
		this.timeout(5000);

		win = Ti.UI.createWindow();
		textField = Ti.UI.createTextField({
			value: 123
		});
		textField.addEventListener('change', function () {
			// This should never happen.
			finish(new Error('TextField wrongly received change on setting value.'));
		});
		win.add(textField);
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			// If we made it this far, assume TextField did not receive change.
			finish();
		});
		win.open();
	});
});
