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

describe('Titanium.UI.TabGroup', function () {
	let tabGroup = null;

	this.slow(2000);
	this.timeout(5000);

	afterEach(() => {
		if (tabGroup) {
			tabGroup.close();
			tabGroup = null;
		}
	});

	it('icon-only tabs - default style', (finish) => {
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup({
			tabs: [
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 1' })
				}),
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 2' })
				}),
			]
		});
		tabGroup.addEventListener('open', () => {
			finish();
		});
		tabGroup.open();
	});

	it.android('icon-only tabs - android bottom style', (finish) => {
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup({
			style: Ti.UI.Android.TABS_STYLE_BOTTOM_NAVIGATION,
			tabs: [
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 1' })
				}),
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 2' })
				}),
			]
		});
		tabGroup.addEventListener('open', () => {
			finish();
		});
		tabGroup.open();
	});
});
