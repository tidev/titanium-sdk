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

	it.ios('hasText', function () {
		win = Ti.UI.createWindow();
		var textFieldA = Ti.UI.createTextField({
			top: '60dip',
			value: 0
		});

		win.add(textFieldA);

		var textFieldB = Ti.UI.createTextField({
			top: '120dip',
			value: 0
		});

		win.add(textFieldB);

		should(textFieldA.hasText()).be.true;
		should(textFieldB.hasText()).be.true;

		win.open();
	});

});
