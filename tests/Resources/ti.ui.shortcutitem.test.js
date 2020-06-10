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

describe('Titanium.UI.ShortcutItem', () => {

	it('Ti.UI.ShortcutItem', () => {
		should(Ti.UI.ShortcutItem).not.be.undefined();
	});

	it('createShortcutItem', () => {
		should(Ti.UI.createShortcutItem).not.be.undefined();
		should(Ti.UI.createShortcutItem).be.a.Function();

		// ONLY compatible with Android 7.1+, end test early.
		if (Ti.Platform.osname === 'android') {
			const version = Ti.Platform.version.split('.');
			if (parseInt(`${version[0]}${version[1]}`) < 71) {
				return;
			}
		}

		// Create shortcut item.
		const item = Ti.UI.createShortcutItem({
			id: 'test_shortcut',
			title: 'Test Shortcut',
			description: 'Test shortcut description',
			data: { test_data: 'data' }
		});
		should(item).be.a.Object();

		// Verify `apiName`.
		should(item).have.readOnlyProperty('apiName').which.is.a.String();
		should(item.apiName).be.eql('Ti.UI.ShortcutItem');

		// Verify `id`.
		should(item.id).be.eql('test_shortcut');

		// Verify `title`.
		should(item.title).be.eql('Test Shortcut');

		// Verify `description`.
		should(item.description).be.eql('Test shortcut description');

		// Verify `data`.
		should(item.data).be.a.Object();
	});
});
