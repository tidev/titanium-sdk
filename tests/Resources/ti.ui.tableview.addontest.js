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
	let win;

	this.timeout(5000);

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.ios('row#rect', function (finish) {
		win = Ti.UI.createWindow();
		const tableView = Ti.UI.createTableView();
		const row = Ti.UI.createTableViewRow({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL
		});
		const view = Ti.UI.createView({
			height: 150,
			backgroundColor: 'yellow'
		});
		row.add(view);
		tableView.setData([ row ]);
		win.add(tableView);

		row.addEventListener('postlayout', function () {
			should(row.rect.height).be.eql(150);
			finish();
		});
		win.open();
	});
});
