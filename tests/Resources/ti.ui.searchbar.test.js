/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.SearchBar', function () {
	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.ios('.showBookmark', function () {
		var searchBar = Ti.UI.createSearchBar({
			showBookmark: true
		});
		should(searchBar.getShowBookmark).be.a.Function();
		should(searchBar.showBookmark).be.true();
		should(searchBar.getShowBookmark()).be.true();
		searchBar.showBookmark = false;
		should(searchBar.showBookmark).be.false();
		should(searchBar.getShowBookmark()).be.fasle;
	});

	it.ios('.keyboardType', function () {
		var searchBar = Ti.UI.createSearchBar({
			keyboardType: Ti.UI.KEYBOARD_TYPE_NUMBER_PAD
		});
		should(searchBar.getKeyboardType).be.a.Function();
		should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_NUMBER_PAD);
		should(searchBar.getKeyboardType()).eql(Ti.UI.KEYBOARD_TYPE_NUMBER_PAD);
		searchBar.keyboardType = Ti.UI.KEYBOARD_TYPE_EMAIL;
		should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_EMAIL);
		should(searchBar.getKeyboardType()).eql(Ti.UI.KEYBOARD_TYPE_EMAIL);
	});

	it.ios('.autocorrect', function () {
		var searchBar = Ti.UI.createSearchBar({
			autocorrect: true
		});
		should(searchBar.getAutocorrect).be.a.Function();
		should(searchBar.autocorrect).be.true();
		should(searchBar.getAutocorrect()).be.true();
		searchBar.autocorrect = false;
		should(searchBar.autocorrect).be.false();
		should(searchBar.getAutocorrect()).be.false();
	});

	it.ios('.autocapitalization', function () {
		var searchBar = Ti.UI.createSearchBar({
			autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_ALL
		});
		should(searchBar.getAutocapitalization).be.a.Function();
		should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);
		should(searchBar.getAutocapitalization()).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);
		searchBar.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES;
		should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
		should(searchBar.getAutocapitalization()).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
	});

	it.ios('.keyboardAppearance', function () {
		var searchBar = Ti.UI.createSearchBar({
			keyboardAppearance: Ti.UI.KEYBOARD_APPEARANCE_LIGHT
		});
		should(searchBar.getKeyboardAppearance).be.a.Function();
		should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_LIGHT);
		should(searchBar.getKeyboardAppearance()).eql(Ti.UI.KEYBOARD_APPEARANCE_LIGHT);
		searchBar.keyboardAppearance = Ti.UI.KEYBOARD_APPEARANCE_DARK;
		should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_DARK);
		should(searchBar.getKeyboardAppearance()).eql(Ti.UI.KEYBOARD_APPEARANCE_DARK);
	});

	it.ios('.style', function () {
		var searchBar = Ti.UI.createSearchBar({
			style: Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT
		});
		should(searchBar.getStyle).be.a.Function();
		should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT);
		should(searchBar.getStyle()).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT);
		searchBar.style = Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL;
		should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL);
		should(searchBar.getStyle()).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL);
	});

	it.ios('.prompt', function () {
		var searchBar = Ti.UI.createSearchBar({
			prompt: 'value'
		});
		should(searchBar.getStyle).be.a.Function();
		should(searchBar.prompt).eql('value');
		should(searchBar.getPrompt()).eql('value');
		searchBar.prompt = 'another value';
		should(searchBar.prompt).eql('another value');
		should(searchBar.getPrompt()).eql('another value');
	});

	// TODO: Expose Windows as well
	// We have in in Ti.UI.Android.SearchView for Android, but need more parity here
	it.windowsMissing('.hintTextColor', function () {
		var searchBar = Ti.UI.createSearchBar({
			hintText: 'Enter E-Mail ...',
			hintTextColor: 'red'
		});
		should(searchBar.getHintTextColor).be.a.Function();
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
		should(searchBar.getColor).be.a.Function();
		should(searchBar.color).eql('red');
		should(searchBar.getColor()).eql('red');
		searchBar.color = 'blue';
		should(searchBar.color).eql('blue');
		should(searchBar.getColor()).eql('blue');
	});

	it.ios('Should be able to set/get the background image of the textfield', function () {
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

	it('Should be able to get/set hintText', function () {
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
				should(sb.getShowCancel()).be.false();
				should(sb.getBarColor()).eql('blue');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
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

	it('.focused', done => {
		win = Ti.UI.createWindow({ backgroundColor: '#fff' });
		const searchbar = Ti.UI.createSearchBar({
			backgroundColor: '#fafafa',
			color: 'green',
			width: 250,
			height: 40
		});
		win.add(searchbar);
		try {
			searchbar.should.have.a.property('focused').which.is.a.Boolean();
			searchbar.focused.should.be.false(); // haven't opened it yet, so shouldn't be focused
			searchbar.addEventListener('focus', () => {
				try {
					searchbar.focused.should.be.true();
				} catch (e) {
					return done(e);
				}
				win.close();
			});
			win.addEventListener('open', () => {
				searchbar.focus(); // force focus!
			});
			win.addEventListener('close', () => {
				try {
					// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
					searchbar.focused.should.be.false();
				} catch (e) {
					return done(e);
				}
				done();
			});
			win.open();
		} catch (e) {
			return done(e);
		}
	});
});
