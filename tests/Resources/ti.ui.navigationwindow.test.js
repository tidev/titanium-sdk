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
		if (nav !== null) {
			nav.close();
		}
		nav = null;
	});

	it('Ti.UI.NavigationWindow', function () {
		should(Ti.UI.NavigationWindow).not.be.undefined;
	});

	it('apiName', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view).have.readOnlyProperty('apiName').which.is.a.String;
		should(view.apiName).be.eql('Ti.UI.NavigationWindow');
	});

	it('#open', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.open).be.a.Function;
	});

	it('#openWindow', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.openWindow).be.a.Function;
	});

	it('#close', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.close).be.a.Function;
	});

	it('#closeWindow', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.closeWindow).be.a.Function;
	});

	it('open/close should open/close the window', function (finish) {
		var window = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window
			});
		this.timeout(5000);
		window.addEventListener('open', function () {
			setTimeout(function () {
				navigation.close();
			});
		});
		window.addEventListener('close', function () {
			finish();
		});
		navigation.open();
	});

	it('basic open/close navigation', function (finish) {
		var window1 = Ti.UI.createWindow(),
			window2 = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window1
			});
		this.timeout(5000);
		window1.addEventListener('open', function () {
			setTimeout(function () {
				navigation.openWindow(window2);
			});
		});
		window2.addEventListener('open', function () {
			setTimeout(function () {
				navigation.closeWindow(window2);
			});
		});
		window1.addEventListener('close', function () {
			finish();
		});
		window2.addEventListener('close', function () {
			setTimeout(function () {
				navigation.close();
			});
		});
		navigation.open();
	});

	it('#openWindow, #closeWindow', function (finish) {
		var win = Ti.UI.createWindow();
		var subWindow = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: win
		});

		win.addEventListener('open', function () {
			setTimeout(function () {
				nav.openWindow(subWindow);
				should(subWindow.navigationWindow).eql(nav);
			});
		});

		subWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.closeWindow(subWindow);
				should(subWindow.navigationWindow).not.be.ok; // null or undefined
			});
		});

		subWindow.addEventListener('close', function () {
			finish();
		});

		nav.open();
	});

	it('#popToRootWindow', function (finish) {
		var win = Ti.UI.createWindow();
		var subWindow = Ti.UI.createWindow();

		nav = Ti.UI.createNavigationWindow({
			window: win
		});
		should(nav.popToRootWindow).be.a.function;

		win.addEventListener('open', function () {
			setTimeout(function () {
				nav.openWindow(subWindow);
			});
		});

		subWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.popToRootWindow();
				finish();
			});
		});

		nav.open();
	});
});

describe('Titanium.UI.Window', function () {
	var nav;

	this.timeout(10000);

	afterEach(function () {
		if (nav !== null) {
			nav.close();
		}
		nav = null;
	});

	it.windowsMissing('.navigationWindow', function (finish) {
		var win = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: win
		});

		win.addEventListener('open', function () {
			try {
				should(nav).not.be.undefined;
				should(win.navigationWindow).not.be.undefined;

				should(win.navigationWindow).eql(nav);

				should(nav.openWindow).be.a.function;
				should(win.navigationWindow.openWindow).be.a.function;

				finish();
			} catch (err) {
				finish(err);
			}
		});

		nav.open();
	});
});
