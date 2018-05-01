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

describe('Titanium.UI.Picker', function () {

	it('DatePicker minDate', function (finish) {
		var win = Ti.UI.createWindow({
				title: 'Form' }),
			dp = Ti.UI.createPicker({
				titleype: Ti.UI.PICKER_TYPE_DATE
			}),
			date = new Date(2018, 1, 1);

		dp.setMinDate(date);
		win.addEventListener('open', function () {
			should(dp.minDate).be.eql(date);
			finish();
		});
		win.add(dp);
		win.open();
	});

	it('DatePicker maxDate', function (finish) {
		var win = Ti.UI.createWindow({
				title: 'Form' }),
			dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE
			}),
			date = new Date(2020, 1, 20);

		dp.setMaxDate(date);
		win.addEventListener('open', function () {
			should(dp.maxDate).be.eql(date);
			finish();
		});
		win.add(dp);
		win.open();
	});

});
