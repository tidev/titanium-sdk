/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.TableView', function () {
	this.timeout(5000);

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

	it.ios('row with vertical layout', function (finish) {
		var	tableData = [];
		for (var index = 1; index <= 20; index++) {
			var row = Ti.UI.createTableViewRow({
		//		layout: "composite",  // <- This is okay
		//		layout: "horizontal", // <- Crashes
				layout: "vertical",   // <- Crashes
			});
			row.add(Ti.UI.createLabel({ text: "Row1 " + index.toString() }));
			row.add(Ti.UI.createLabel({ top: 10, text: "Row2 " + index.toString() }));
			row.add(Ti.UI.createLabel({ top: 20, text: "Row3 " + index.toString() }));
			row.add(Ti.UI.createLabel({ top: 30, text: "Row4 " + index.toString() }));
			row.add(Ti.UI.createLabel({ top: 40, text: "Row5 " + index.toString() }));

			tableData.push(row);
		}
		var	table = Ti.UI.createTableView({
				data: tableData
			});
		win = Ti.UI.createWindow();
		function addTableView() {
			try {
				win.add(table);
				finish();
			} catch (err) {
				finish(err);
			}
		}

		win.addEventListener('postlayout', addTableView);
		win.add(table);
		win.open();
	});

});
