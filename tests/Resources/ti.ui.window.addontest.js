/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Window', function () {
	var win;

	it.android('.barColor with disabled ActionBar', function (finish) {
		win = Ti.UI.createWindow({
			barColor: 'blue',
			title: 'My Title',
			theme: 'Theme.AppCompat.NoTitleBar',
		});
		win.add(Ti.UI.createLabel({ text: 'Window Title Test' }));
		win.open();
		win.addEventListener('open', function () {
			finish();
		});
	});

});
