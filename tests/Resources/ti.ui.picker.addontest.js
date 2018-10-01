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

describe('Ti.UI.Picker', function () {

	it.android('Selected index persistance', function (finish) {
		var window = Ti.UI.createWindow();
		// workaround iOS triggering of 'postlayout' event
		var containerView = Ti.UI.createView();
		var picker = Ti.UI.createPicker({});
		var rows = [];
		var indexToTest = 2;

		for (var index = 0; index < 5; index++) {
			rows.push(Ti.UI.createPickerRow({ title: 'Item ' + (index + 1).toString() }));
		}

		picker.add(rows);
		window.add(picker);

		picker.addEventListener('change', function () {
			window.remove(picker);
			containerView.addEventListener('postlayout', finishTest);
			containerView.add(picker);
			window.add(containerView);
		});

		picker.addEventListener('postlayout', changeItem);

		window.open();

		function changeItem() {
			picker.removeEventListener('postlayout', changeItem);
			picker.setSelectedRow(0, indexToTest);
		}

		function finishTest() {
			if (rows.indexOf(picker.getSelectedRow(0)) === indexToTest) {
				finish();
			}
		}
	});

});
