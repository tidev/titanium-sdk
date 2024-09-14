/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.SearchBar', () => {
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

	describe('properties', () => {
		describe.ios('.autocapitalization', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_ALL
				});
			});

			it('is a Number', () => {
				should(searchBar.autocapitalization).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);
			});

			it('can be assigned a constant value', () => {
				searchBar.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES;
				should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('autocapitalization');
			});
		});

		describe.ios('.autocorrect', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					autocorrect: true
				});
			});

			it('is a Boolean', () => {
				should(searchBar.autocorrect).be.a.Boolean();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.autocorrect).be.true();
			});

			it('can be assigned a Boolean value', () => {
				searchBar.autocorrect = false;
				should(searchBar.autocorrect).be.false();
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('autocorrect');
			});
		});

		describe.windowsMissing('.color', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					color: 'red'
				});
			});

			it('is a String', () => {
				should(searchBar.color).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.color).eql('red');
			});

			it('can be assigned a String value', () => {
				searchBar.color = 'blue';
				should(searchBar.color).eql('blue');
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('color');
			});
		});

		it.ios('.fieldBackgroundImage and .fieldBackgroundDisabledImage', () => {
			const backgroundView = Ti.UI.createView({
				height: 36,
				width: Ti.Platform.displayCaps.platformWidth - 20,
				backgroundColor: '#268E8E93',
				borderRadius: 12
			});

			const searchBar = Ti.UI.createSearchBar({
				fieldBackgroundImage: backgroundView.toImage(),
				fieldBackgroundDisabledImage: backgroundView.toImage()
			});

			should(searchBar.fieldBackgroundImage.apiName).eql('Ti.Blob');
			should(searchBar.fieldBackgroundDisabledImage.apiName).eql('Ti.Blob');
		});

		it('.focused', function (done) {
			this.slow(1000);
			this.timeout(5000);

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

		describe('.hintText', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					hintText: 'Search'
				});
			});

			it('is a String', () => {
				should(searchBar.hintText).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.hintText).eql('Search');
			});

			it('can be assigned a String value', () => {
				searchBar.hintText = 'Updated search';
				should(searchBar.hintText).eql('Updated search');
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('hintText');
			});

			it('change dynamically', function (finish) {
				this.timeout(5000);

				const OLD_HINT_TEXT = 'Old Hint Text';
				const NEW_HINT_TEXT = 'New Hint Text';
				searchBar = Ti.UI.createSearchBar({
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
						return finish(err);
					}
					setTimeout(function () {
						try {
							should(searchBar.hintText).eql(NEW_HINT_TEXT);
						} catch (err) {
							return finish(err);
						}
						finish();
					}, 100);
				});
				win.open();
			});
		});

		// We have in in Ti.UI.Android.SearchView for Android, but need more parity here
		describe.windowsMissing('.hintTextColor', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					hintText: 'Enter E-Mail ...',
					hintTextColor: 'red'
				});
			});

			it('is a String', () => {
				should(searchBar.hintTextColor).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.hintTextColor).eql('red');
			});

			it('can be assigned a String value', () => {
				searchBar.hintTextColor = 'blue';
				should(searchBar.hintTextColor).eql('blue');
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('hintTextColor');
			});
		});

		describe.ios('.keyboardAppearance', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					keyboardAppearance: Ti.UI.KEYBOARD_APPEARANCE_LIGHT
				});
			});

			it('is a Number', () => {
				should(searchBar.keyboardAppearance).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_LIGHT);
			});

			it('can be assigned a constant value', () => {
				searchBar.keyboardAppearance = Ti.UI.KEYBOARD_APPEARANCE_DARK;
				should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_DARK);
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('keyboardAppearance');
			});
		});

		describe.ios('.keyboardType', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					keyboardType: Ti.UI.KEYBOARD_TYPE_NUMBER_PAD
				});
			});

			it('is a Number', () => {
				should(searchBar.keyboardType).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_NUMBER_PAD);
			});

			it('can be assigned a constant value', () => {
				searchBar.keyboardType = Ti.UI.KEYBOARD_TYPE_EMAIL;
				should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_EMAIL);
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('keyboardType');
			});
		});

		describe.ios('.prompt', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					prompt: 'value'
				});
			});

			it('is a String', () => {
				should(searchBar.prompt).be.a.String();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.prompt).eql('value');
			});

			it('can be assigned a String value', () => {
				searchBar.prompt = 'another value';
				should(searchBar.prompt).eql('another value');
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('prompt');
			});
		});

		describe.ios('.showBookmark', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					showBookmark: true
				});
			});

			it('is a Boolean', () => {
				should(searchBar.showBookmark).be.a.Boolean();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.showBookmark).be.true();
			});

			it('can be assigned a Boolean value', () => {
				searchBar.showBookmark = false;
				should(searchBar.showBookmark).be.false();
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('showBookmark');
			});
		});

		describe.ios('.style', () => {
			let searchBar;
			beforeEach(() => {
				searchBar = Ti.UI.createSearchBar({
					style: Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT
				});
			});

			it('is a Number', () => {
				should(searchBar.style).be.a.Number();
			});

			it('equals value passed to factory method', () => {
				should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT);
			});

			it('can be assigned a constant value', () => {
				searchBar.style = Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL;
				should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL);
			});

			it('has no accessors', () => {
				should(searchBar).not.have.accessors('style');
			});
		});
	});

	describe('methods', () => {});

	it.ios('Should work with absolute-positioned search-bars (ListView)', function (finish) {
		var data = [ { properties: { title: 'Bashful', hasDetail: true } } ],
			searchBar,
			listView;

		win = Ti.UI.createWindow({ backgroundColor: 'white' });
		win.addEventListener('open', function () {
			try {
				should(listView.top).eql(50);
				should(listView.bottom).eql(50);
				should(listView.left).eql(40);
				should(listView.right).eql(40);

				should(searchBar.width).eql(150);
			} catch (err) {
				return finish(err);
			}

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
			} catch (err) {
				return finish(err);
			}
			finish();
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
			} catch (err) {
				return finish(err);
			}
			finish();
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

				should(sb.height).eql(44);
				should(sb.showCancel).be.false();
				should(sb.barColor).eql('blue');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});
});
