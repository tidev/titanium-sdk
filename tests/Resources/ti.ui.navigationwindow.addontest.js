/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.NavigationWindow', function () {

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
		var navigationWindow = Ti.UI.createNavigationWindow({
			window: tabGroup,
		});
		navigationWindow.open();
	});

	it('have a TabGroup child in stack', function () {
		var rootWin = Ti.UI.createWindow(),
			navigationWindow = Ti.UI.createNavigationWindow({
				window: rootWin
			}),
			tabGroup = Ti.UI.createTabGroup({ title: 'TabGroup',
				tabs: [ createTab('Tab 1'),
					createTab('Tab 2'),
					createTab('Tab 3') ]
			});
		navigationWindow.open();
		navigationWindow.openWindow(tabGroup);
	});

});
