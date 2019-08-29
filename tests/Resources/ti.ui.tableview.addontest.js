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

describe('Titanium.UI.TableView', function () {

	it('get TableViewRow rect with height set to Ti.UI.SIZE', function (finish) {
		var win = Ti.UI.createWindow(),
			table = Ti.UI.createTableView({ width: Ti.UI.FILL, height: Ti.UI.FILL }),
			row = Ti.UI.createTableViewRow({ width: Ti.UI.FILL, height: Ti.UI.SIZE }),
			view = Ti.UI.createView({ height: 150 });
		row.add(view);
		table.setData([row]);
		win.add(table);
		win.open();
		table.addEventListener('postlayout', function () {
			should(row.rect.height).be.eql(150);
			finish();
		});
	});

	it('change TableViewRow rect height when child is modified', function (finish) {
		var win = Ti.UI.createWindow(),
			table = Ti.UI.createTableView({ width: Ti.UI.FILL, height: Ti.UI.FILL }),
			row = Ti.UI.createTableViewRow({ width: Ti.UI.FILL, height: Ti.UI.SIZE }),
			view = Ti.UI.createView({ height: 150 });
		row.add(view);
		table.setData([row]);
		win.add(table);
		win.open();
		function postLayoutListener() {
			table.removeEventListener('postlayout', postLayoutListener);
			should(row.rect.height).be.eql(150);
			table.addEventListener('postlayout', secondPostLayoutListener);
			view.height += 50;
		}
		function secondPostLayoutListener() {
			should(row.rect.height).be.eql(200);
			finish();
		}
		table.addEventListener('postlayout', postLayoutListener);
	});
});
