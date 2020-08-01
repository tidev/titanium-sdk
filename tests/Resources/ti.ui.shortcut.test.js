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
	androidCompatible = false;
//	TODO: Re-enable Android unit tests once it implements 'Ti.UI.Shortcut" as a module.
//	androidCompatible = (Ti.Platform.Android.API_LEVEL >= 25);
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

	after(() => {
		Ti.UI.Shortcut.removeAll();
	});

	it('.apiName', () => {
		should(Ti.UI.Shortcut).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.UI.Shortcut.apiName).be.eql('Ti.UI.Shortcut');
	});

	describe('.items', () => {
		it('is an Array', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.items).be.an.Array();
		});
	});

	describe('.staticItems', () => {
		it('is an Array', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.staticItems).be.an.Array();
		});

		it('fetch item id', () => {
			if (!androidCompatible) {
				return;
			}
			const staticItems = Ti.UI.Shortcut.staticItems;
			should(staticItems.length).be.eql(1);
			should(staticItems[0].id).be.eql('static_shortcut1');
		});
	});

	describe('#removeAll()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.removeAll).not.be.undefined();
			should(Ti.UI.Shortcut.removeAll).be.a.Function();
		});

		it('removes shortcut items', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.items.length).be.aboveOrEqual(0);
			const length = Ti.UI.Shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (Ti.UI.Shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			Ti.UI.Shortcut.add(shortcutItem);
			should(Ti.UI.Shortcut.items.length).eql(expectedLength);

			Ti.UI.Shortcut.removeAll();
			should(Ti.UI.Shortcut.items.length).eql(0);
		});
		// TODO: Test adding multiple items
		// TODO: Test removing all multiple times in a row
	});

	describe('#remove()', () => {
		it('is a function', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.remove).not.be.undefined();
			should(Ti.UI.Shortcut.remove).be.a.Function();
		});

		it('removes single shortcut item', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.items.length).be.aboveOrEqual(0);
			const length = Ti.UI.Shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (Ti.UI.Shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			Ti.UI.Shortcut.add(shortcutItem);
			should(Ti.UI.Shortcut.items.length).eql(expectedLength);

			Ti.UI.Shortcut.remove(shortcutItem);
			should(Ti.UI.Shortcut.items.length).eql(expectedLength - 1);
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
			should(Ti.UI.Shortcut.add).not.be.undefined();
			should(Ti.UI.Shortcut.add).be.a.Function();
		});

		it('add a single shortcut item', () => {
			if (!androidCompatible) {
				return;
			}
			should(Ti.UI.Shortcut.items.length).be.aboveOrEqual(0);
			const length = Ti.UI.Shortcut.items.length;
			let expectedLength = length + 1;
			// If shortcut already exists, it will update data of shortcut.
			// Length will increase only if shortcut do not exists.
			if (Ti.UI.Shortcut.getById('test_shortcut')) {
				expectedLength = length;
			}
			Ti.UI.Shortcut.add(shortcutItem);
			should(Ti.UI.Shortcut.items.length).eql(expectedLength);
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
			should(Ti.UI.Shortcut.getById).not.be.undefined();
			should(Ti.UI.Shortcut.getById).be.a.Function();
		});
		// TODO: Test with non-existent id
		// TODO: Test with id of added shortcut
		// TODO: Test passing in null/undefined/number
	});
});
