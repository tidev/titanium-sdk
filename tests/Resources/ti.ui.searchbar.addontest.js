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

	// FIXME Intermittently fails on Android?
	it.androidBroken('TableView', function (finish) {
		var sb = Ti.UI.createSearchBar({
				barColor: 'blue',
				height: 44
			}),
			table = Ti.UI.createTableView({
				height: 600,
				width: '100%',
				top: 75,
				left: 0
			});

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			try {
				table.search = sb;
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(table);
		win.open();
	});

	// FIXME this seems to hard-crash Android. No stacktrace, no errors from logcat. File a JIRA?
	it.androidBroken('ListView', function (finish) {
		var sb = Ti.UI.createSearchBar({
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

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			try {
				listview.searchView = sb;
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(listview);
		win.open();
	});

	// FIXME this seems to hard-crash Android. No stacktrace, no errors from logcat. File a JIRA?
	it.androidBroken('TIMOB-9745,TIMOB-7020', function (finish) {
		var data = [ {
				title: 'Row 1',
				color: 'red'
			}, {
				title: 'Row 2',
				color: 'green'
			} ],
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

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			try {
				win.add(table);
				win.remove(table);
				win.add(table);

				should(sb.getHeight()).eql(44);
				should(sb.getShowCancel()).be.false;
				should(sb.getBarColor()).eql('blue');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('Should be able to set/set hintText', function () {
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
	});

	it.ios('Should work with absolute-positioned search-bars (ListView)', function (finish) {
		var data = [ { properties: { title: 'Bashful', hasDetail: true } } ],
			searchBar,
			listView;

		win = Ti.UI.createWindow({ backgroundColor: 'white' });
		win.addEventListener('open', function () {
			should(listView.top).eql(50);
			should(listView.bottom).eql(50);
			should(listView.left).eql(40);
			should(listView.right).eql(40);

			should(searchBar.getWidth()).eql(150);

			finish();
		});

		searchBar = Ti.UI.createSearchBar({
			width: 150
		});

		listView = Ti.UI.createListView({
			backgroundColor: '#999',
			searchView: searchBar,
			sections: [ Ti.UI.createListSection({ items: data }) ],
			top: 50,
			bottom: 50,
			left: 40,
			right: 40
		});
		win.add(listView);
		win.open();
	});

	it.ios('Should be able to set/get the background image of the textfield', function () {
		var backgroundColor = 'red';
		var backgroundView = Ti.UI.createView({
			height: 36,
			width: Ti.Platform.displayCaps.platformWidth - 20,
			backgroundColor: '#268E8E93',
			borderRadius: 12
		});
		
		var searchBar = Ti.UI.createSearchBar({
			fieldBackgroundImage: backgroundView.toImage(),
			fieldBackgroundDisabledImage: backgroundView.toImage()
		});

		should(searchBar.fieldBackgroundImage.apiName).eql('Ti.Blob');
		should(searchBar.fieldBackgroundDisabledImage.apiName).eql('Ti.Blob');
	});

	// TODO: Expose Windows as well
	// We have in in Ti.UI.Android.SearchView for Android, but need more parity here
	it.windowsMissing('.hintTextColor', function () {
		var searchBar = Ti.UI.createSearchBar({
			hintText: 'Enter E-Mail ...',
			hintTextColor: 'red'
		});
		should(searchBar.getHintTextColor).be.a.Function;
		should(searchBar.hintTextColor).eql('red');
		should(searchBar.getHintTextColor()).eql('red');
		searchBar.hintTextColor = 'blue';
		should(searchBar.hintTextColor).eql('blue');
		should(searchBar.getHintTextColor()).eql('blue');
	});

	// TODO: Expose Windows as well
	it.windowsMissing('.color', function () {
		var searchBar = Ti.UI.createSearchBar({
			color: 'red'
		});
		should(searchBar.getColor).be.a.Function;
		should(searchBar.color).eql('red');
		should(searchBar.getColor()).eql('red');
		searchBar.color = 'blue';
		should(searchBar.color).eql('blue');
		should(searchBar.getColor()).eql('blue');
	});
});
