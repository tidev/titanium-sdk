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

describe('Titanium.UI.TabbedBar', function () {
	var win;

	beforeEach(function () {
		win = Ti.UI.createWindow();
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('apiName', function () {
		var tabbedBar = Ti.UI.createTabbedBar();
		should(tabbedBar).have.readOnlyProperty('apiName').which.is.a.String;
		should(tabbedBar.apiName).be.eql('Ti.UI.TabbedBar');
	});

	it('Labels from Strings', function (finish) {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ]
		});
		tabbedBar.addEventListener('postlayout', function () {
			finish();
		});
		win.add(tabbedBar);
		win.open();
	});

	it('Labels from BarItemType', function (finish) {
		var item1 = { title: 'A' },
			item2 = { title: 'B' },
			item3 = { title: 'C' };
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ item1, item2, item3 ]
		});
		tabbedBar.addEventListener('postlayout', function () {
			finish();
		});
		win.add(tabbedBar);
		win.open();
	});

	it('Labels update', function () {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ]
		});
		tabbedBar.addEventListener('postlayout', function () {
			tabbedBar.labels = [ 'D', 'E', 'F' ];
			should(tabbedBar.label.get(1)).be.eql('E');
		});
		win.add(tabbedBar);
		win.open();
	});

	it('Index - direct change', function () {
		var win = Ti.UI.createWindow();
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		tabbedBar.addEventListener('postlayout', function () {
			tabbedBar.index = 2;
			should(tabbedBar.index).be.eql(2);
		});
		win.open();
	});

	it('Index - setter change', function () {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		tabbedBar.addEventListener('postlayout', function () {
			tabbedBar.setIndex(2);
			should(tabbedBar.index).be.eql(2);
		});
		win.open();
	});

	it('Index - getter read', function () {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		tabbedBar.addEventListener('postlayout', function () {
			tabbedBar.setIndex(2);
			should(tabbedBar.getIndex()).be.eql(2);
		});
		win.open();
	});
});
