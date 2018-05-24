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
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.UI.TabGroup', function () {
	var tabGroup,
		tab,
		win;

	afterEach(function () {
		if (tab && tabGroup) {
			tabGroup.removeTab(tab);
		}
		tab = null;
		try {
			if (win) {
				win.close();
			}
		} catch (e) {
			// ignore
		} finally {
			win = null;
		}
	});

	it.ios('tabs', function () {
		win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup();
		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.tabs.length).eql(1);
		tabGroup.removeTab(tab);
		should(tabGroup.tabs.length).eql(0);
	});

	it.ios('allowUserCustomization', function () {
		win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup({
			allowUserCustomization: true
		});
		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.allowUserCustomization).eql(true);
		tabGroup.setAllowUserCustomization(false);
		should(tabGroup.allowUserCustomization).eql(false);
	});

	it.ios('tabsTranslucent', function () {
		win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup({
			tabsTranslucent: true
		});
		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.tabsTranslucent).eql(true);
		tabGroup.setTabsTranslucent(false);
		should(tabGroup.tabsTranslucent).eql(false);
	});

	it('close event', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup();

		tabGroup.addEventListener('open', function () {
			tabGroup.close();
		});

		tabGroup.addEventListener('close', function () {
			finish();
		});

		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});
		tabGroup.addTab(tab);

		tabGroup.open();
	});
});
