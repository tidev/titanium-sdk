/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Label', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// Tests if "maxLines" correctly truncates strings with '\n' characters.
	it('maxLines-newline', function (finish) {
		this.slow(1000);
		this.timeout(5000);

		win = Ti.UI.createWindow({
			layout: 'vertical',
		});
		const label1 = Ti.UI.createLabel({
			// This label is 1 line tall.
			text: 'Line 1',
		});
		win.add(label1);
		const label2 = Ti.UI.createLabel({
			// The label should be 1 line tall since 'maxLines' is set to 1.
			text: 'Line 1\nLine2',
			maxLines: 1,
		});
		win.add(label2);
		win.addEventListener('postlayout', function () {
			// Both labels are expected to be 1 line tall.
			should(label1.size.height).eql(label2.size.height);
			finish();
		});
		win.open();
	});
});
