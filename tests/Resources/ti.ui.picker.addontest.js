/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Picker', function () {

	var win;

	it('DatePicker chose date earlier than minDate', function (finish) {
		var date = new Date(2018, 1, 1),
			minDate = new Date(2017, 1, 1),
			dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				value: date,
				minDate: minDate
			});
		win = Ti.UI.createWindow();
		win.add(dp);
		win.addEventListener('open', function () {
			try {
				should(dp.value.getFullYear()).eql(date.getFullYear());
				var dateEarlierThanMin = new Date(2016, 1, 1);
				dp.setValue(dateEarlierThanMin);
				should(dp.value.getFullYear()).eql(minDate.getFullYear());
				dp.minDate = dateEarlierThanMin;
				dp.setValue(dateEarlierThanMin);
				should(dp.value.getFullYear()).eql(dateEarlierThanMin.getFullYear());
				finish();
			} catch (error) {
				finish(error);
			} finally {
				dp.hide();
			}
		});
		win.open();
	});

	it('DatePicker chose date later than maxDate', function (finish) {
		var date = new Date(2018, 1, 1),
			maxDate = new Date(2019, 1, 1),
			dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				value: date,
				maxDate: maxDate
			});
		win = Ti.UI.createWindow();
		win.add(dp);
		win.addEventListener('open', function () {
			try {
				should(dp.value.getFullYear()).eql(date.getFullYear());
				var dateLaterThanMax = new Date(2020, 1, 1);
				dp.setValue(dateLaterThanMax);
				should(dp.value.getFullYear()).eql(maxDate.getFullYear());
				dp.maxDate = dateLaterThanMax;
				dp.setValue(dateLaterThanMax);
				should(dp.value.getFullYear()).eql(dateLaterThanMax.getFullYear());
				finish();
			} catch (error) {
				finish(error);
			} finally {
				dp.hide();
			}
		});
		win.open();
	});

});
