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
var should = require('./utilities/assertions');

describe('Titanium.UI.SearchBar', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('Change hintText dynamically', function (finish) {
		this.timeout(5000);

		const OLD_HINT_TEXT = 'Old Hint Text';
		const NEW_HINT_TEXT = 'New Hint Text';
		const searchBar = Ti.UI.createSearchBar({
			hintText: OLD_HINT_TEXT,
		});
		should(searchBar.hintText).eql(OLD_HINT_TEXT);
		win = Ti.UI.createWindow();
		win.add(searchBar);
		win.addEventListener('open', function () {
			try {
				should(searchBar.hintText).eql(OLD_HINT_TEXT);
				searchBar.hintText = NEW_HINT_TEXT;
				should(searchBar.hintText).eql(NEW_HINT_TEXT);
			} catch (err) {
				finish(err);
				return;
			}
			setTimeout(function () {
				try {
					should(searchBar.hintText).eql(NEW_HINT_TEXT);
					finish();
				} catch (err) {
					finish(err);
				}
			}, 100);
		});
		win.open();
	});
});
