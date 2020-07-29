/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.NavigationWindow', function () {
	this.timeout(10000);

	let nav;
	afterEach(function () {
		if (nav) {
			nav.close();
		}
		nav = null;
	});

	it.iosBroken('Ti.UI.NavigationWindow', () => { // should this be defined?
		should(Ti.UI.NavigationWindow).not.be.undefined();
	});

	it('.apiName', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view).have.readOnlyProperty('apiName').which.is.a.String();
		should(view.apiName).be.eql('Ti.UI.NavigationWindow');
	});

	it('#open()', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.open).be.a.Function();
	});

	it('#openWindow()', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.openWindow).be.a.Function();
	});

	it('#close()', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.close).be.a.Function();
	});

	it('#closeWindow()', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.closeWindow).be.a.Function();
	});

	it('open/close should open/close the window', function (finish) {
		var window = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window
			});

		window.addEventListener('open', function () {
			setTimeout(function () {
				navigation.close();
			}, 1);
		});
		window.addEventListener('close', function () {
			finish();
		});
		navigation.open();
	});

	it('open/close events', finish => {
		const window = Ti.UI.createWindow();

		nav = Ti.UI.createNavigationWindow({ window });

		nav.addEventListener('open', () => nav.close());
		nav.addEventListener('close', () => finish());

		nav.open();
	});

	it('basic open/close navigation', function (finish) {
		var rootWindow = Ti.UI.createWindow(),
			window2 = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: rootWindow
			});

		rootWindow.addEventListener('open', function () {
			setTimeout(function () {
				navigation.openWindow(window2);
			}, 1);
		});
		window2.addEventListener('open', function () {
			setTimeout(function () {
				navigation.closeWindow(window2);
			}, 1);
		});
		rootWindow.addEventListener('close', function () {
			finish();
		});
		window2.addEventListener('close', function () {
			setTimeout(function () {
				navigation.close();
			}, 1);
		});
		navigation.open();
	});

	it('#openWindow, #closeWindow', function (finish) {
		var rootWindow = Ti.UI.createWindow();
		var subWindow = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: rootWindow
		});

		rootWindow.addEventListener('open', function () {
			setTimeout(function () {
				try {
					nav.openWindow(subWindow);
					should(subWindow.navigationWindow).eql(nav);
				} catch (err) {
					finish(err);
				}
			}, 1);
		});

		subWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.closeWindow(subWindow);
			}, 1);
		});

		subWindow.addEventListener('close', function () {
			try {
				should(subWindow.navigationWindow).not.be.ok(); // null or undefined
				finish();
			} catch (err) {
				finish(err);
			}
		});

		nav.open();
	});

	it('#popToRootWindow()', function (finish) {
		var rootWindow = Ti.UI.createWindow();
		var subWindow = Ti.UI.createWindow();

		nav = Ti.UI.createNavigationWindow({
			window: rootWindow
		});
		should(nav.popToRootWindow).be.a.function;

		rootWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.openWindow(subWindow);
			}, 1);
		});

		subWindow.addEventListener('close', function () {
			try {
				should(subWindow.navigationWindow).not.be.ok(); // null or undefined
				// how else can we tell it got closed? I don't think a visible check is right...
				// win should not be closed!
				should(rootWindow.navigationWindow).eql(nav);
				finish();
			} catch (err) {
				finish(err);
			}
		});

		subWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.popToRootWindow();
			}, 1);
		});

		nav.open();
	});

	function createTab(title) {
		var windowForTab = Ti.UI.createWindow({ title: title });
		var tab = Ti.UI.createTab({
			title: title,
			window: windowForTab
		});
		return tab;
	}

	it('have TabGroup as a root window', function () {
		var tabGroup = Ti.UI.createTabGroup({ title: 'TabGroup',
			tabs: [ createTab('Tab 1'),
				createTab('Tab 2'),
				createTab('Tab 3') ]
		});
		nav = Ti.UI.createNavigationWindow({
			window: tabGroup,
		});
		nav.open();
	});

	it('have a TabGroup child in stack', function () {
		var rootWin = Ti.UI.createWindow(),
			tabGroup = Ti.UI.createTabGroup({ title: 'TabGroup',
				tabs: [ createTab('Tab 1'),
					createTab('Tab 2'),
					createTab('Tab 3') ]
			});
		nav = Ti.UI.createNavigationWindow({
			window: rootWin
		});
		nav.open();
		nav.openWindow(tabGroup);
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
		var rootWindow = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: rootWindow
		});

		rootWindow.addEventListener('open', function () {
			try {
				should(nav).not.be.undefined();
				should(rootWindow.navigationWindow).eql(nav);
				should(rootWindow.navigationWindow.apiName).eql('Ti.UI.NavigationWindow');

				finish();
			} catch (err) {
				finish(err);
			}
		});

		nav.open();
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
