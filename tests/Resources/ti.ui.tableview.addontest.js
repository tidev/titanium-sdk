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
	it('Add and remove headerView/footerView ', function (finish) {
		var win = Ti.UI.createWindow({ backgroundColor: 'gray' }),
			headerView = Ti.UI.createView({
				backgroundColor: 'red',
				height: 100,
				width: Ti.UI.FILL
			}),
			footerView = Ti.UI.createView({
				backgroundColor: 'green',
				height: 100,
				width: Ti.UI.FILL
			}),
			table = Ti.UI.createTableView({
				headerView: headerView,
				footerView: footerView,
				data: [
					{ title: 'ITEM' }
				]
			});

		win.addEventListener('open', function () {
			should(table.headerView).not.be.null;
			should(table.footerView).not.be.null;

			table.headerView = null;
			table.footerView = null;

			should(table.headerView).be.null;
			should(table.footerView).be.null;

			finish();
		});

		win.add(table);
		win.open();
	});
});
