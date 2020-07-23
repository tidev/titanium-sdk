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

describe.windowsMissing('Titanium.UI.TabbedBar', function () {
	let win;
	this.timeout(5000);

	beforeEach(() => {
		win = Ti.UI.createWindow();
	});

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

	it('apiName', () => {
		const tabbedBar = Ti.UI.createTabbedBar();
		should(tabbedBar).have.readOnlyProperty('apiName').which.is.a.String();
		should(tabbedBar.apiName).be.eql('Ti.UI.TabbedBar');
	});

	it('Labels from Strings', finish => {
		const tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ]
		});
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			finish();
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.add(tabbedBar);
		win.open();
	});

	it('Labels from BarItemType', finish => {
		const tabbedBar = Ti.UI.createTabbedBar({
			labels: [
				{ title: 'A' },
				{ title: 'B' },
				{ title: 'C' }
			]
		});
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			finish();
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.add(tabbedBar);
		win.open();
	});

	it('Labels update', finish => {
		const tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ]
		});
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			try {
				tabbedBar.labels = [ 'D', 'E', 'F' ];
				should(tabbedBar.labels[1]).be.eql('E');
				finish();
			} catch (err) {
				finish(err);
			}
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.add(tabbedBar);
		win.open();
	});

	it('Index - direct change', finish => {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			try {
				tabbedBar.index = 2;
				should(tabbedBar.index).be.eql(2);
				finish();
			} catch (err) {
				finish(err);
			}
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.open();
	});

	it('Index - setter change', finish => {
		const tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			try {
				tabbedBar.setIndex(2);
				should(tabbedBar.index).be.eql(2);
				finish();
			} catch (err) {
				finish(err);
			}
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.open();
	});

	it('Index - getter read', finish => {
		const tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ],
			index: 1
		});
		win.add(tabbedBar);
		function postlayout() {
			tabbedBar.removeEventListener('postlayout', postlayout);
			try {
				tabbedBar.setIndex(2);
				should(tabbedBar.getIndex()).be.eql(2);
				finish();
			} catch (err) {
				finish(err);
			}
		}
		tabbedBar.addEventListener('postlayout', postlayout);
		win.open();
	});

	it('Labels update - before window.open()', finish => {
		const tabbedBar = Ti.UI.createTabbedBar();
		tabbedBar.labels = [ 'A', 'B', 'C' ];
		win.add(tabbedBar);
		win.addEventListener('open', () => {
			try {
				should(tabbedBar.labels[1]).be.eql('B');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('Index update - before window.open()', finish => {
		var tabbedBar = Ti.UI.createTabbedBar({
			labels: [ 'A', 'B', 'C' ]
		});
		tabbedBar.index = 2;
		win.add(tabbedBar);
		win.addEventListener('open', () => {
			try {
				should(tabbedBar.index).be.eql(2);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
