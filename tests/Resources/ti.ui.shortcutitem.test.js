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
	it('#createShortcutItem()', () => {
		should(Ti.UI.createShortcutItem).not.be.undefined();
		should(Ti.UI.createShortcutItem).be.a.Function();
	});
});

describe('Titanium.UI.ShortcutItem', () => {
	it.iosBroken('namespace exists', () => {
		should(Ti.UI.ShortcutItem).not.be.undefined();
	});

	if (androidCompatible) {

		it('.apiName', () => {
			const item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
			});
			should(item).have.readOnlyProperty('apiName').which.is.a.String();
			should(item.apiName).be.eql('Ti.UI.ShortcutItem');
		});

		it('.id', () => {
			const item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
			should(item.id).be.eql('test_shortcut');
		});

		it('.title', () => {
			const item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
			should(item.title).be.eql('Test Shortcut');
		});

		it('.description', () => {
			const item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
			should(item.description).be.eql('Test shortcut description');
		});

		it('.data', () => {
			const item = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				data: { test_data: 'data' }
			});
			should(item.data).be.a.Object();
		});

		// iOS returns the underlying icon object, not the numeric constant we passed in
		it.iosBroken('.icon', () => {
			const icon = OS_ANDROID ? Ti.Android.R.drawable.ic_menu_send : Titanium.UI.iOS.SHORTCUT_ICON_TYPE_SHARE;
			const shortcut = Ti.UI.createShortcutItem({
				id: 'test_shortcut',
				title: 'Test Shortcut',
				description: 'Test shortcut description',
				icon
			});
			should(shortcut.icon).eql(icon);
		});

		describe.android('#show()', () => {
			it('is a Function', () => {
				const shortcut = Ti.UI.createShortcutItem({
					id: 'test_shortcut',
					title: 'Test Shortcut',
					description: 'Test shortcut description'
				});
				should(shortcut.show).not.be.undefined();
				should(shortcut.show).be.a.Function();
			});
		});

		describe.android('#hide()', () => {
			// eslint-disable-next-line mocha/no-identical-title
			it('is a Function', () => {
				const shortcut = Ti.UI.createShortcutItem({
					id: 'test_shortcut',
					title: 'Test Shortcut',
					description: 'Test shortcut description'
				});
				should(shortcut.hide).not.be.undefined();
				should(shortcut.hide).be.a.Function();
			});
		});

		describe.android('#pin()', () => {
			// eslint-disable-next-line mocha/no-identical-title
			it('is a Function', () => {
				const shortcut = Ti.UI.createShortcutItem({
					id: 'test_shortcut',
					title: 'Test Shortcut',
					description: 'Test shortcut description'
				});
				should(shortcut.pin).not.be.undefined();
				should(shortcut.pin).be.a.Function();
			});
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
	}
});
