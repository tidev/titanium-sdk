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

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe.ios('Titanium.UI.iOS.NavigationWindow', function () {
	var win, rootWindow;

	this.timeout(5000);

	// Create and open a root window for the rest of the below child window tests to use as a parent.
	// We're not going to close this window until the end of this test suite.
	// Note: Android needs this so that closing the last window won't back us out of the app.
	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', function () {
			finish();
		});
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', function () {
			finish();
		});
		rootWindow.close();
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});
	
	it('#openWindow', function () {
		var nav;
		
		win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		var subWindow = Ti.UI.createWindow();
		
		win.addEventListener('open', function () {
			should(nav.openWindow).be.a.function;
			nav.openWindow(subWindow);
		});
		
		subWindow.addEventListener('open', function () {
			nav.close();
			finish();
		});
		
		nav.open();
	});
	
	it('#closeWindow', function () {
		var nav;
		var subWindow = Ti.UI.createWindow();
		
		win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});
		
		win.addEventListener('open', function () {
			nav.openWindow(subWindow);
		});
		
		subWindow.addEventListener('open', function () {
			should(nav.closeWindow).be.a.function;
			nav.closeWindow(subWindow);
		});
		
		subWindow.addEventListener('close', function () {
			finish();
		});
		
		nav.open();
	});

	it('#popToRootWindow', function () {
		var nav;
		var subWindow = Ti.UI.createWindow();
		
		win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});
		
		win.addEventListener('open', function () {
			nav.openWindow(subWindow);
		});
		
		subWindow.addEventListener('open', function () {
			should(nav.popToRootWindow).be.a.function;
			nav.popToRootWindow();
			finish();
		});
		
		nav.open();
	});

	it('.navigationWindow', function () {
		var nav;
		
		win = Ti.UI.createWindow();
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});
		
		win.addEventListener('open', function () {
			should(nav).not.be.undefined;
			should(win.navigationWindow).not.be.undefined;

			should(win.navigationWindow).eql(nav);

			should(nav.openWindow).be.a.function;
			should(win.navigationWindow.openWindow).be.a.function;
			nav.close();
			finish();
		});
		
		nav.open();
	});
});
