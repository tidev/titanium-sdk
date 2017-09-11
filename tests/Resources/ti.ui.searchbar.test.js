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
	// FIXME Intermittently fails on Android?
	it.androidBroken('TableView', function (finish) {
		var win = Ti.UI.createWindow(),
			sb = Ti.UI.createSearchBar({
				barColor: 'blue',
				height: 44
			}),
			table = Ti.UI.createTableView({
				height: 600,
				width: '100%',
				top: 75,
				left: 0
			});

		win.addEventListener('open', function () {
			var error;

			try {
				table.search = sb;
			} catch (err) {
				error = err;
			}

			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});
		win.add(table);
		win.open();
	});

	// FIXME this seems to hard-crash Android. No stacktrace, no errors from logcat. File a JIRA?
	it.androidBroken('ListView', function (finish) {
		var win = Ti.UI.createWindow(),
			sb = Ti.UI.createSearchBar({
				barColor: 'blue',
				height: 44
			}),
			listview = Ti.UI.createListView({
				height: 600,
				width: '100%',
				top: 75,
				left: 0
			}),
			fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits ' });

		listview.sections = [ fruitSection ];

		win.addEventListener('open', function () {
			var error;

			try {
				listview.searchView = sb;
			} catch (err) {
				error = err;
			}

			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});
		win.add(listview);
		win.open();
	});

	// FIXME this seems to hard-crash Android. No stacktrace, no errors from logcat. File a JIRA?
	it.androidBroken('TIMOB-9745,TIMOB-7020', function (finish) {
		var win = Ti.UI.createWindow(),
			data = [{
				title: 'Row 1',
				color: 'red'
			}, {
				title: 'Row 2',
				color: 'green'
			}],
			sb = Ti.UI.createSearchBar({
				barColor: 'blue',
				showCancel: false,
				height: 44
			}),
			table = Ti.UI.createTableView({
				height: 600,
				width: '100%',
				search: sb,
				top: 75,
				left: 0,
				data: data
			});

		win.addEventListener('open', function () {
			var error;

			try {
				win.add(table);
				win.remove(table);
				win.add(table);

				should(sb.getHeight()).eql(44);
				should(sb.getShowCancel()).be.false;
				should(sb.getBarColor()).eql('blue');
			} catch (err) {
				error = err;
			}

			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});
		win.open();
	});

	it('Should be able to set/set hintText', function (finish) {
		var search = Ti.UI.createSearchBar({
			hintText: 'Search'
		});
		should(search.hintText).eql('Search');
		should(search.getHintText()).eql('Search');
		should(function () {
			search.setHintText('Updated search');
		}).not.throw();
		should(search.hintText).eql('Updated search');
		should(search.getHintText()).eql('Updated search');
		finish();
	});
});
