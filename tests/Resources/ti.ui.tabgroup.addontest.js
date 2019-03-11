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

	it.windowsBroken('#setActiveTab()_before_open', finish => {
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
		tabGroup.setActiveTab(1);
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
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

	it.windowsBroken('#change_activeTab_property', finish => {
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
				tabGroup.activeTab = tabB;
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

	it.windowsBroken('#change_activeTab_property_before_open', finish => {
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
		tabGroup.activeTab = 1;
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
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

	it.windowsBroken('#set_activeTab_in_creation_dictionary', finish => {
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
		tabGroup = Ti.UI.createTabGroup({
			activeTab: 1
		});
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
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

});
