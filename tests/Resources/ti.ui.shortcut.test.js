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

describe('Titanium.UI', () => {
	it('#createShortcut()', () => {
		should(Ti.UI.createShortcut).not.be.undefined();
		should(Ti.UI.createShortcut).be.a.Function();

		// Create shortcut instance.
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).be.an.Object();
	});
});

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

	after(() => {
		const shortcut = Ti.UI.createShortcut();
		shortcut.removeAll();
	});

	it('.apiName', () => {
		const shortcut = Ti.UI.createShortcut();
		should(shortcut).have.readOnlyProperty('apiName').which.is.a.String();
		should(shortcut.apiName).be.eql('Ti.UI.Shortcut');
	});

	describe('.items', () => {
		it('is an Array', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.items).be.an.Array();
		});
	});

	describe('#removeAll()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.removeAll).not.be.undefined();
			should(shortcut.removeAll).be.a.Function();
		});

		it('removes shortcut items', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.items.length).be.aboveOrEqual(0);
			const length = shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			shortcut.add(shortcutItem);
			should(shortcut.items.length).eql(expectedLength);

			shortcut.removeAll();
			should(shortcut.items.length).eql(0);
		});
		// TODO: Test adding multiple items
		// TODO: Test removing all multiple times in a row
	});

	describe('#remove()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.remove).not.be.undefined();
			should(shortcut.remove).be.a.Function();
		});

		it('removes single shortcut item', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.items.length).be.aboveOrEqual(0);
			const length = shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			shortcut.add(shortcutItem);
			should(shortcut.items.length).eql(expectedLength);

			shortcut.remove(shortcutItem);
			should(shortcut.items.length).eql(expectedLength - 1);
		});
		// TODO: Test removing multiple items
		// TODO: Test removing item never added in first place
		// TODO: Test passing in null/undefined/non-ShortcutItem
	});

	describe('#add()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.add).not.be.undefined();
			should(shortcut.add).be.a.Function();
		});

		it('add a single shortcut item', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.items.length).be.aboveOrEqual(0);
			const length = shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			shortcut.add(shortcutItem);
			should(shortcut.items.length).eql(expectedLength);
		});

		// TODO: Test adding multiple items
		// TODO: Test adding same item twice
		// TODO: Test passing in null/undefined/non-ShortcutItem
	});

	describe('#getById()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			const shortcut = Ti.UI.createShortcut();
			should(shortcut.getById).not.be.undefined();
			should(shortcut.getById).be.a.Function();
		});
		// TODO: Test with non-existent id
		// TODO: Test with id of added shortcut
		// TODO: Test passing in null/undefined/number
	});
});
