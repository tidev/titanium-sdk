/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.TabbedBar', function () {
	let win;
	this.timeout(5000);

	beforeEach(() => {
		win = Ti.UI.createWindow();
	});

	afterEach(() => {
		if (win) {
			win.close();
		}
		win = null;
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
