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
var should = require('./utilities/assertions');

describe('Titanium.UI.TableView', function () {

	it.ios('Delete row (Search Active)', function (finish) {
		var win = Ti.UI.createWindow({
				backgroundColor: 'blue'
			}),
			section_0,
			searchBar,
			tableView,
			isFocused;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		searchBar = Titanium.UI.createSearchBar({showCancel:true});
		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			search: searchBar
		});
		
		isFocused = false;

		win.addEventListener('focus', function () {
			var error;

			if (isFocused) {
				return;
			}
			isFocused = true;

			try {
				searchBar.setValue('e');
  				searchBar.focus();
				should(tableView.sections[0].rowCount).be.eql(3);
				tableView.deleteRow(0);
				should(tableView.sections[0].rowCount).be.eql(2);
			} catch (err) {
				error = err;
			}				
			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});

		win.add(tableView);
		win.open();
	});
});
