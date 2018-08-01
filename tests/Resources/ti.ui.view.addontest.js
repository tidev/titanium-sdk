/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.View', function () {
	var win = null;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('backgroundImage (URL-redirect)', function (finish) {
		this.slow(8000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		win.add(Ti.UI.createView({
			backgroundImage: 'http://raw.githubusercontent.com/recurser/exif-orientation-examples/master/Portrait_1.jpg'
		}));
		win.addEventListener('open', function () {
			finish();
		});
		win.open();
	});
});
