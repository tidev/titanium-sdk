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
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.UI.TableView', function () {

	it.android('SearchView persistence', function (finish) {
		var	tableData = [ { title: 'Apples' }, { title: 'Bananas' }, { title: 'Carrots' }, { title: 'Potatoes' } ],
			searchView = Ti.UI.Android.createSearchView(),
			table = Ti.UI.createTableView({
				height: '80%',
				search: searchView,
				data: tableData
			}),
			win = Ti.UI.createWindow();
		function removeAndAddTable() {
			try {
				table.removeEventListener('postlayout', removeAndAddTable);
				win.remove(table);
				win.add(table);
				finish();
			} catch (err) {
				finish(err);
			}
		}

		table.addEventListener('postlayout', removeAndAddTable);
		win.add(table);
		win.open();
	});
});
