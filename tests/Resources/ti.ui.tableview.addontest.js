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
	var win;

	this.timeout(5000);

	afterEach(function (done) {
		if (win) {
			win.addEventListener('close', function () {
				done();
			});
			win.close();
		} else {
			done();
		}
		win = null;
	});

	it('row#color row#backgroundColor', function (finish) {
		// Set up a TableView with colored rows.
		win = Ti.UI.createWindow();
		const section = Ti.UI.createTableViewSection({ headerTitle: 'Section' });
		const row1 = Ti.UI.createTableViewRow({
			title: 'Row 1',
			color: 'white',
			backgroundColor: 'blue'
		});
		const row2 = Ti.UI.createTableViewRow({
			title: 'Row 2',
			color: 'black',
			backgroundColor: 'yellow'
		});
		section.add(row1);
		section.add(row2);
		const tableView = Ti.UI.createTableView({ data: [ section ] });
		win.add(tableView);

		// Verify row objects return same color values assigned above.
		should(row1.color).be.eql('white');
		should(row1.backgroundColor).be.eql('blue');
		should(row2.color).be.eql('black');
		should(row2.backgroundColor).be.eql('yellow');

		// Open window to test dynamic color changes.
		win.addEventListener('open', function () {
			row1.color = 'red';
			row1.backgroundColor = 'white';
			row2.color = 'white';
			row2.backgroundColor = 'purple';
			setTimeout(function () {
				should(row1.color).be.eql('red');
				should(row1.backgroundColor).be.eql('white');
				should(row2.color).be.eql('white');
				should(row2.backgroundColor).be.eql('purple');
				finish();
			}, 1);
		});
		win.open();
	});

	it('row - read unassigned color properties', function (finish) {
		win = Ti.UI.createWindow();
		const section = Ti.UI.createTableViewSection({ headerTitle: 'Section' });
		const row1 = Ti.UI.createTableViewRow({ title: 'Row 1' });
		section.add(row1);
		const tableView = Ti.UI.createTableView({ data: [ section ] });
		win.add(tableView);

		function validateRow() {
			// Verify we can read row color properties without crashing. (Used to crash on Android.)
			// We don't care about the returned value.
			// eslint-disable-next-line no-unused-vars
			let value;
			value = row1.color;
			value = row1.backgroundColor;
			if (Ti.Android) {
				value = row1.backgroundDisabledColor;
				value = row1.backgroundFocusedColor;
				value = row1.backgroundSelectedColor;
			}
		}
		validateRow();

		win.addEventListener('open', function () {
			validateRow();
			finish();
		});
		win.open();
	});
});
