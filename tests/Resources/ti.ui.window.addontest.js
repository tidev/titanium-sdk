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

describe('Titanium.UI.Window', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// As of Android 8.0, the OS will throw an exception if you apply a fixed orientation to a translucent window.
	// Verify that Titanium handles the issue and avoids a crash.
	it.android('TIMOB-26157', function (finish) {
		this.slow(1000);
		this.timeout(5000);

		win = Ti.UI.createWindow({
			backgroundColor: 'rgba(0,0,255,128)',
			opacity: 0.5,
			orientationModes: [ Ti.UI.PORTRAIT ]
		});
		win.addEventListener('open', function () {
			finish();
		});
		win.open();
	});
});
