/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: 'off' */
'use strict';

describe('Titanium.UI.TableView', function () {
	var win;

	this.timeout(5000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('appendSection and appendRow (TIMOB-25936)', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: '#f00' });
		var table = Ti.UI.createTableView();

		for (var i = 0; i < 2; ++i) {
			table.appendSection(Ti.UI.createTableViewSection({ headerTitle: 'Header ' + i, className: 'Header' }));
			for (var j = 0; j < 3; j++) {
				table.appendRow(Ti.UI.createTableViewRow({ title: 'Row ' + j, className: 'Row' }));
			}
		}

		win.addEventListener('open', function () {
			finish();
		});

		win.add(table);
		win.open();
	});
});
