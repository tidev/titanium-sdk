/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', () => {
	it('#createTabbedBar() is a Function', () => {
		should(Ti.UI.iOS.createTabbedBar).not.be.undefined();
		should(Ti.UI.iOS.createTabbedBar).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.TabbedBar', () => {
	describe('.labels', () => {
		let tabbedBar;
		beforeEach(() => {
			tabbedBar = Ti.UI.iOS.createTabbedBar({
				labels: [ 'One', 'Two', 'Three' ],
			});
		});

		it('is an Array', () => {
			should(tabbedBar.labels).be.an.Array();
			should(tabbedBar.labels.length).be.eql(3);
		});

		it('can be assigned an Array', () => {
			tabbedBar.labels = [ 'Four', 'Five' ];
			should(tabbedBar.labels.length).be.eql(2);
		});
	});

	it('.index', () => {
		let tabbedBar;
		beforeEach(() => {
			tabbedBar = Ti.UI.iOS.createTabbedBar({
				labels: [ 'One', 'Two', 'Three' ],
				index: 1
			});
		});

		it('is a Number', () => {
			should(tabbedBar.index).be.a.Number();
		});

		it('can be assigned a Number', () => {
			tabbedBar.index = 2;
			should(tabbedBar.index).be.eql(2);
		});
	});
});
