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

describe('Titanium.UI.ListSection', function () {
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

	it('.apiName', function () {
		const section = Ti.UI.createListSection();
		should(section).have.readOnlyProperty('apiName').which.is.a.String();
		should(section.apiName).be.eql('Ti.UI.ListSection');
	});

	it.android('.filteredItemCount', function (finished) {
		win = Ti.UI.createWindow({
			fullscreen: true
		});
		function genData() {
			const data = [];
			for (let i = 1; i <= 10; i++) {
				data.push({
					properties: {
						title: `ROW ${i}`,
						searchableText: (i % 2) ? 'a' : 'b'
					}
				});
			}
			return data;
		}
		const section = Ti.UI.createListSection();
		section.items = genData();

		const listView = Ti.UI.createListView({
			sections: [ section ],
			height: Ti.UI.FILL,
			width: Ti.UI.FILL
		});
		win.add(listView);
		win.addEventListener('open', function open() {
			win.removeEventListener('open', open);
			try {
				should(section.getFilteredItemCount()).eql(10);
				setTimeout(() => {
					try {
						listView.searchText = 'a';
						// search narrows the count
						should(section.filteredItemCount).eql(5);
					} catch (err2) {
						return finished(err2);
					}
					finished();
				}, 1);
			} catch (err) {
				return finished(err);
			}
		});
		win.open();
	});

	it.ios('.itemCount', function (finished) {
		win = Ti.UI.createWindow({
			fullscreen: true
		});
		function genData() {
			const data = [];
			for (let i = 1; i <= 10; i++) {
				data.push({
					properties: {
						title: `ROW ${i}`,
						searchableText: (i % 2) ? 'a' : 'b'
					}
				});
			}
			return data;
		}
		const section = Ti.UI.createListSection();
		section.items = genData();

		const listView = Ti.UI.createListView({
			sections: [ section ],
			height: Ti.UI.FILL,
			width: Ti.UI.FILL
		});
		win.add(listView);
		win.addEventListener('open', function open() {
			win.removeEventListener('open', open);
			try {
				should(section.getItemCount()).eql(10);
				setTimeout(() => {
					try {
						listView.searchText = 'a';
						// Seraching doesn't alter the value
						should(section.itemCount).eql(10);
					} catch (err2) {
						return finished(err2);
					}
					finished();
				}, 1);
			} catch (err) {
				return finished(err);
			}
		});
		win.open();
	});
});
