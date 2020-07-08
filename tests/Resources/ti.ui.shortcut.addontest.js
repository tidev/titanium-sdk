/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
'use strict';

const should = require('./utilities/assertions');

// ONLY compatible with Android 7.1+, end test early.
let androidCompatible = true;
if (OS_ANDROID) {
	const version = Ti.Platform.version.split('.');
	if (parseInt(`${version[0]}${version[1]}`) < 71) {
		androidCompatible = false;
	}
}

describe('Titanium.UI.Shortcut', () => {
	// Create basic shortcut item.
	let shortcutItem;
	before(() => {
		shortcutItem = Ti.UI.createShortcutItem({
			id: 'test_shortcut',
			title: 'Test Shortcut',
			description: 'Test shortcut description',
			data: { test_data: 'data' }
		});
	});

	it('createShortcut', () => {
    should(Ti.UI.createShortcutItem).not.be.undefined();
		should(Ti.UI.createShortcut).be.a.Function();

		// Create shortcut instance.
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).be.a.Object();

		// Verify `apiName`.
		should(shortcut).have.readOnlyProperty('apiName').which.is.a.String();
		should(shortcut.apiName).be.eql('Ti.UI.Shortcut');
	});

	it('removeAll', () => {

		if (!androidCompatible) {
			return;
		}

		// Create shortcut instance.
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).be.a.Object();

		// Verify `removeAll()`.
		should(shortcut.removeAll).not.be.undefined();
		should(shortcut.removeAll).be.a.Function();

		// Test `removeAll()`.
		shortcut.removeAll();
	});

	it('remove', () => {

		if (!androidCompatible) {
			return;
		}

		// Create shortcut instance.
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).be.a.Object();

		const secondItem = Ti.UI.createShortcutItem({
			id: 'test_second_shortcut',
			title: 'Test Second Shortcut',
			description: 'Test second shortcut description',
			data: { test_data: 'data' }
		});
		shortcut.add(secondItem);

		// Detect existing shortcuts.
		const existingShortcuts = shortcut.items;

		// Verify `remove()`.
		should(shortcut.remove).not.be.undefined();
		should(shortcut.remove).be.a.Function();

		// Test `remove()`.
		shortcut.remove(secondItem);

		// Check shortcut has been removed.
		should(shortcut.items).be.lessThan(existingShortcuts);
	});

	it('add', () => {

		if (!androidCompatible) {
			return;
		}

		// Create shortcut instance.
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).be.a.Object();

		// Detect existing shortcuts.
		const existingShortcuts = shortcut.items;

		// Verify `add()`.
		should(shortcut.add).not.be.undefined();
		should(shortcut.add).be.a.Function();

		// Test `add()`.
		// NOTE: Tests run backwards, this shortcut is added first.
		shortcut.add(shortcutItem);

		// Check shortcut has been added.
		should(shortcut.items).be.greaterThan(existingShortcuts);
	});
});
