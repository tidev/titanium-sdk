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

	it('DatePicker postlayout event in layout', function (finish) {
		var win = Ti.UI.createWindow(),
			dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE
			});

		dp.addEventListener('postlayout', function () {
			finish();
		});
		win.add(dp);
		win.open();
	});

});
