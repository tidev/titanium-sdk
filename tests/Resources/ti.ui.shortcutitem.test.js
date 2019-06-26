/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.ShortcutItem', () => {

	it.android('Ti.UI.ShortcutItem', () => {
		should(Ti.UI.ShortcutItem).not.be.undefined;
	});

	it.android('createShortcutItem', () => {
		should(Ti.UI.createShortcutItem).not.be.undefined;
		should(Ti.UI.createShortcutItem).be.a.Function;

		// create shortcut
		const shortcut = Ti.UI.createShortcutItem({
			id: 'test_shortcut',
			title: 'Test Shortcut',
			description: 'Test shortcut description',
			icon: Ti.Android.R.drawable.ic_menu_send
		});
		should(shortcut).be.a.Object;

		// verify `apiName`
		should(shortcut).have.readOnlyProperty('apiName').which.is.a.String;
		should(shortcut.apiName).be.eql('Ti.UI.ShortcutItem');

		// verify `id`
		should(shortcut.id).be.eql('test_shortcut');

		// verify `title`
		should(shortcut.title).be.eql('Test Shortcut');

		// verify `description`
		should(shortcut.description).be.eql('Test shortcut description');

		// verify `icon`
		should(shortcut.icon).be.eql(Ti.Android.R.drawable.ic_menu_send);

		// verify `show()`
		should(shortcut.show).not.be.undefined;
		should(shortcut.show).be.a.Function;

		// verify `hide()`
		should(shortcut.hide).not.be.undefined;
		should(shortcut.hide).be.a.Function;

		// verify `pin`
		should(shortcut.pin).not.be.undefined;
		should(shortcut.pin).be.a.Function;
	});

	it.android('handle duplicate shortcuts', () => {
		for (let i = 0; i < 16; i++) {
			const shortcut = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				icon: Ti.Android.R.drawable.ic_menu_send
			});
			shortcut.show();
		}
	});
});
