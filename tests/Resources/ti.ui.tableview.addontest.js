/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.TableView', function () {
	var win;

	this.timeout(5000);

	afterEach(function (done) {
		if (win) {
			win.close();
		}
		win = null;

		// timeout to allow window to close
		setTimeout(() => {
			done();
		}, 500);
	});

	it.iosBroken('resize row with Ti.UI.SIZE on content height change', function (finish) {
		var heights = [ 100, 200, 50 ];
		var tableView = Ti.UI.createTableView({});
		var row = Ti.UI.createTableViewRow({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL
		});
		var view = Ti.UI.createView({
			height: heights.pop(),
			backgroundColor: 'red'
		});
		row.add(view);
		tableView.setData([ row ]);
		tableView.addEventListener('postlayout', function onPostLayout() {
			console.error('postlayout', row.rect.height, view.rect.height);
			should(row.rect.height).be.eql(view.rect.height);
			if (!heights.length) {
				tableView.removeEventListener('postlayout', onPostLayout);
				finish();
			}
			view.height = heights.pop();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		win.add(tableView);
		win.open();
	});
});
