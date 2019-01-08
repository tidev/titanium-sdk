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
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

// skipping many test on Windows due to lack of event firing, see https://jira.appcelerator.org/browse/TIMOB-26690
describe('Titanium.UI.TabGroup', () => {
	let tabGroup;
	let tab;

	afterEach(() => {
		if (tabGroup) {
			if (tab) {
				tabGroup.removeTab(tab);
			}
			tabGroup.close();
			tabGroup = null;
		}
		tab = null;
	});

	it.windowsBroken('add Map.View to TabGroup', function (finish) {
		this.timeout(10000);

		const map = require('ti.map');
		const mapView = map.createView({ top: 0, height: '80%' });
		mapView.addEventListener('complete', () => finish());

		const win = Ti.UI.createWindow();
		win.add(mapView);

		tabGroup = Ti.UI.createTabGroup();
		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		tabGroup.open();
	});

	it.ios('.tabs', () => {
		var win = Ti.UI.createWindow();
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

	it.ios('.allowUserCustomization', () => {
		var win = Ti.UI.createWindow();
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

	it.ios('.tabsTranslucent', () => {
		var win = Ti.UI.createWindow();
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

	it('#setTabs()', () => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		tabGroup.setTabs([ tabA, tabB ]);
		should(tabGroup.getTabs()).eql([ tabA, tabB ]);
	});

	it.windowsBroken('#setActiveTab()', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String;
				should(tabGroup.getActiveTab().title).eql('Tab B');
				finish();
			} catch (err) {
				finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.android('#disableTabNavigation()', function (finish) {
		var winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup();

		// does windows fire this event?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.disableTabNavigation(true);
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String;
				should(tabGroup.getActiveTab().title).eql('Tab A');
				tabGroup.disableTabNavigation(false);
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String;
				should(tabGroup.getActiveTab().title).eql('Tab B');
				finish();
			} catch (err) {
				finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it('.title', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'My title'
		});

		should(tabGroup.getTitle()).be.a.String;
		should(tabGroup.getTitle()).eql('My title');
	});

	describe('events', function () {
		this.timeout(5000);

		// FIXME Windows doesn't fire open/close events
		it.windowsMissing('close', finish => {
			var win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			tab = Ti.UI.createTab({
				title: 'Tab',
				window: win
			});

			tabGroup.addEventListener('open', () => {
				setTimeout(() => tabGroup.close(), 1);
			});
			tabGroup.addEventListener('close', () => finish());

			tabGroup.addTab(tab);
			tabGroup.open();
		});

		// times out, presumably doesn't fire event?
		// intermittently times out on Android
		it.windowsBroken('focus', finish => {
			var win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			tab = Ti.UI.createTab({
				window: win,
				title: 'Tab'
			});

			tabGroup.addEventListener('focus', () => finish());

			tabGroup.addTab(tab);
			tabGroup.open();
		});

		// times out, presumably doesn't fire event?
		it.windowsBroken('blur', finish => {
			var win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			tab = Ti.UI.createTab({
				title: 'Tab',
				window: win
			});

			tabGroup.addEventListener('blur', () => finish());
			tab.addEventListener('open', () => {
				setTimeout(() => tabGroup.close(), 1);
			});

			tabGroup.addTab(tab);
			tabGroup.open();
		});
	});
});
