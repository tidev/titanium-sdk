/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS.NavigationWindow', function () {
	this.timeout(10000);

	let nav;
	afterEach(function () {
		if (nav) {
			nav.close();
		}
		nav = null;
	});

	it('#openWindow, #closeWindow', function (finish) {
		var win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		var subWindow = Ti.UI.createWindow();

		win.addEventListener('open', function () {
			should(nav.openWindow).be.a.function;
			setTimeout(function () {
				nav.openWindow(subWindow);
			}, 500);
		});

		subWindow.addEventListener('open', function () {
			should(nav.openWindow).be.a.function;
			setTimeout(function () {
				nav.closeWindow(subWindow);
			}, 500);
		});

		subWindow.addEventListener('open', function () {
			finish();
		});

		nav.open();
	});

	it('#popToRootWindow', function (finish) {
		var win = Ti.UI.createWindow();
		var subWindow = Ti.UI.createWindow();

		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		win.addEventListener('open', function () {
			setTimeout(function () {
				nav.openWindow(subWindow);
			}, 500);
		});

		subWindow.addEventListener('open', function () {
			should(nav.popToRootWindow).be.a.function;
			setTimeout(function () {
				nav.popToRootWindow();
				finish();
			}, 500);
		});

		nav.open();
	});

	it('.navigationWindow', function (finish) {
		var win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		win.addEventListener('open', function () {
			should(nav).not.be.undefined();
			should(win.navigationWindow).not.be.undefined();

			should(win.navigationWindow).eql(nav);

			should(nav.openWindow).be.a.function;
			should(win.navigationWindow.openWindow).be.a.function;

			finish();
		});

		nav.open();
	});
});
