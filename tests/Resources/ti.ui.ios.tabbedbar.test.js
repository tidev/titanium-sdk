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

describe.ios('Titanium.UI.iOS', function () {
	it('#createTabbedBar()', function () {
		should(Ti.UI.iOS.createTabbedBar).not.be.undefined();
		should(Ti.UI.iOS.createTabbedBar).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.TabbedBar', function () {

	it('#labels', function () {
		const tabbedBar = Ti.UI.iOS.createTabbedBar({
			labels: [ 'One', 'Two', 'Three' ],
		});
		should(tabbedBar.labels).be.an.Array();
		should(tabbedBar.getLabels).be.a.Function();
		should(tabbedBar.labels.length).be.eql(3);
		should(tabbedBar.getLabels().length).eql(3);
		tabbedBar.labels = [ 'Four', 'Five' ];
		should(tabbedBar.labels.length).be.eql(2);
	});

	it('#index', function () {
		const tabbedBar = Ti.UI.iOS.createTabbedBar({
			labels: [ 'One', 'Two', 'Three' ],
			index: 1
		});
		should(tabbedBar.index).be.a.Number();
		should(tabbedBar.getIndex).be.a.Function();
		should(tabbedBar.getIndex()).be.eql(1);
		should(tabbedBar.index).eql(1);
		tabbedBar.index = 2;
		should(tabbedBar.index).be.eql(2);
	});
});
