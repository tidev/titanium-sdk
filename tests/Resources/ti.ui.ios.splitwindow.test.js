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
	it('#createSplitWindow()', function () {
		var splitWindow;
		should(Ti.UI.iOS.createSplitWindow).not.be.undefined();
		should(Ti.UI.iOS.createSplitWindow).be.a.Function();
		splitWindow = Ti.UI.iOS.createSplitWindow({
			masterView: Ti.UI.createWindow({
				backgroundColor: 'red'
			}),
			detailView: Ti.UI.createWindow({
				backgroundColor: 'yellow'
			})
		});
		should(splitWindow.masterView).be.an.Object();
		should(splitWindow.detailView).be.an.Object();
	});
});

// describe.ios('Titanium.UI.iOS.SplitWindow', function () {
// TODO Add tests for SplitWindow type!
// });
