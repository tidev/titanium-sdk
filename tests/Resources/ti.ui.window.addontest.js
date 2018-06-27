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

describe('Titanium.UI.Window', function () {
	var win;

	this.timeout(5000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('.hidesBackButton', function (finish) {
		var window1 = Ti.UI.createWindow({
			backgroundColor: 'red'
		});

		var window2 = Ti.UI.createWindow({
			hidesBackButton: true,
			backgroundColor: 'yellow'
		});

		window1.addEventListener('focus', function () {
			win.openWindow(window2, { animated: false });
		});
		window2.addEventListener('open', function () {
			try {
				should(window2.hidesBackButton).be.a.Boolean;

				should(window2.getHidesBackButton).be.a.Function;
				should(window2.setHidesBackButton).be.a.Function;

				should(window2.hidesBackButton).be.eql(true);
				should(window2.getHidesBackButton()).be.eql(true);

				window2.hidesBackButton = false;
				should(window2.hidesBackButton).be.eql(false);
				should(window2.getHidesBackButton()).be.eql(false);

				window2.setHidesBackButton(true);
				should(window2.hidesBackButton).be.eql(true);
				should(window2.getHidesBackButton()).be.eql(true);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win = Ti.UI.iOS.createNavigationWindow({
			window: window1
		});
		win.open({ modal: true, animated: false });
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
