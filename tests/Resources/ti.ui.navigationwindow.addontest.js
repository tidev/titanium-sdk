/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.NavigationWindow', function () {
	var nav;

	this.timeout(10000);

	afterEach(function () {
		if (nav) {
			nav.close();
		}
		nav = null;
	});

	it('open window from open event of window (TIMOB-26838)', function (finish) {
		var window = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: window
		});

		var nextWindow = Ti.UI.createWindow();

		nextWindow.addEventListener('open', function () {
			finish();
		});
		window.addEventListener('open', function () {
			nav.openWindow(nextWindow, { animated: true });
		});
		nav.open();
	});
});

