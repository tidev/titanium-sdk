/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.View', function () {
	var rootWindow,
		win;

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

	it.ios('#Accessibility Details', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var label = Ti.UI.createLabel({
			text: 'Label for Test',
			accessibilityLabel: 'Text',
			accessibilityValue: 'Value',
			accessibilityHint: 'Hint',
			accessibilityHidden: true
		});
		win.add(label);
		win.addEventListener('focus', function () {
			try {
				should(label.accessibilityLabel).eql('Text');
				should(label.accessibilityValue).eql('Value');
				should(label.accessibilityHint).eql('Hint');
				should(label.accessibilityHidden).eql(true);

				label.setAccessibilityLabel('New Text');
				label.accessibilityValue = 'New Value';
				label.accessibilityHint = 'New Hint';
				label.accessibilityHidden = false;

				should(label.accessibilityLabel).eql('New Text');
				should(label.accessibilityValue).eql('New Value');
				should(label.accessibilityHint).eql('New Hint');
				should(label.accessibilityHidden).eql(false);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
