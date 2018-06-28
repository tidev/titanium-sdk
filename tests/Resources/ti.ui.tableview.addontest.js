/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.TableView', function () {
	var win,
		didFocus = false;

	this.timeout(5000);

	beforeEach(function () {
		didFocus = false;
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.ios('TIMOB-26164 : updateRow + insertRowAfter causing crash on main thread', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				tableView.updateRow(0, { title: 'Green' });
				tableView.insertRowAfter(0, { title: 'White' });

				finish();
			} catch (err) {
				return finish(err);
			}
		});

		win.add(tableView);
		win.open();
	});
});
