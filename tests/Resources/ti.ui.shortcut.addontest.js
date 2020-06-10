/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.Shortcut', () => {

	let shortcut = null;
	let item = null;

	it('Ti.UI.Shortcut', () => {
		should(Ti.UI.Shortcut).not.be.undefined();
	});

	it('createShortcut', () => {
		should(Ti.UI.createShortcutItem).not.be.undefined();
		should(Ti.UI.createShortcut).be.a.Function();

		// ONLY compatible with Android 7.1+, end test early.
		if (Ti.Platform.osname === 'android') {
			const version = Ti.Platform.version.split('.');
			if (parseInt(`${version[0]}${version[1]}`) < 71) {
				return;
			}
		}

		// Create shortcut.
		shortcut = Ti.UI.createShortcut();
		should(shortcut).be.a.Object();

		// Verify `apiName`.
		should(shortcut).have.readOnlyProperty('apiName').which.is.a.String();
		should(shortcut.apiName).be.eql('Ti.UI.Shortcut');

		// Verify `add()`.
		should(shortcut.add).not.be.undefined();
		should(shortcut.add).be.a.Function();

		// Verify `remove()`.
		should(shortcut.remove).not.be.undefined();
		should(shortcut.remove).be.a.Function();

		// Verify `removeAll()`.
		should(shortcut.removeAll).not.be.undefined();
		should(shortcut.removeAll).be.a.Function();
	});

	it('add', () => {

		// ONLY compatible with Android 7.1+, end test early.
		if (Ti.Platform.osname === 'android') {
			const version = Ti.Platform.version.split('.');
			if (parseInt(`${version[0]}${version[1]}`) < 71) {
				return;
			}
		}

		// Create shortcut.
		if (!shortcut) {
			shortcut = Ti.UI.createShortcut();
		}
		should(shortcut).be.a.Object();

		// Create shortcut item.
		if (!item) {
			item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
		}
		should(item).be.a.Object();

		// Add shortcut.
		shortcut.add(item);
	});

	it('remove', () => {

		// ONLY compatible with Android 7.1+, end test early.
		if (Ti.Platform.osname === 'android') {
			const version = Ti.Platform.version.split('.');
			if (parseInt(`${version[0]}${version[1]}`) < 71) {
				return;
			}
		}

		// Create shortcut.
		if (!shortcut) {
			shortcut = Ti.UI.createShortcut();
		}
		should(shortcut).be.a.Object();

		// Create shortcut item.
		if (!item) {
			item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
		}
		should(item).be.a.Object();

		// Remove shortcut.
		shortcut.remove(item);
	});
});
