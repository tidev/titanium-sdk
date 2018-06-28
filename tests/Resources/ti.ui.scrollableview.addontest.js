/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.ScrollableView', function () {
	var win;
	this.timeout(5000);

	afterEach(function (finish) {
		if (win) {
			win.addEventListener('close', function () {
				finish();
			});
			win.close();
			win = null;
		} else {
			finish();
		}
	});

	it('apiName', function () {
		var scrollableView = Ti.UI.createScrollableView({});
		should(scrollableView).have.readOnlyProperty('apiName').which.is.a.String;
		should(scrollableView.apiName).be.eql('Ti.UI.ScrollableView');
	});

	it.iosBroken('views', function () {
		var bar = Ti.UI.createScrollableView({});
		should(bar.views).be.an.Array; // iOS returns undefined
		should(bar.getViews).be.a.Function;
		should(bar.views).be.empty;
		should(bar.getViews()).be.empty;
		bar.views = [ Ti.UI.createView(), Ti.UI.createView() ];
		should(bar.views.length).eql(2);
		should(bar.getViews().length).eql(2);
	});

	// FIXME explicitly setting currentPage doesn't seem to update value on Android
	it.androidBroken('currentPage', function () {
		var bar = Ti.UI.createScrollableView({});
		should(bar.currentPage).be.a.Number;
		should(bar.getCurrentPage).be.a.Function;
		should(bar.currentPage).eql(0);
		should(bar.getCurrentPage()).eql(0);
		bar.views = [ Ti.UI.createView(), Ti.UI.createView() ];
		bar.currentPage = 1;
		should(bar.currentPage).eql(1); // Android gives 0
		should(bar.getCurrentPage()).eql(1);
	});

	it.androidAndWindowsBroken('moveX-scrollTo', function (finish) {
		var testName = null,
			nextPageIndex = 0,
			bar = null;
		this.slow(5000);
		this.timeout(20000);
		function doNextTest() {
			try {
				if (!testName) {
					testName = 'moveNext';
					Ti.API.info('Testing ScrollableView.moveNext()');
					nextPageIndex = bar.currentPage + 1;
					should(bar.moveNext).be.a.Function;
					bar.moveNext();
				} else if (testName === 'moveNext') {
					testName = 'movePrevious';
					Ti.API.info('Testing ScrollableView.movePrevious()');
					nextPageIndex = bar.currentPage - 1;
					should(bar.movePrevious).be.a.Function;
					bar.movePrevious();
				} else if (testName === 'movePrevious') {
					testName = 'scrollToView';
					Ti.API.info('Testing ScrollableView.scrollToView()');
					nextPageIndex = 2;
					should(bar.scrollToView).be.a.Function;
					bar.scrollToView(nextPageIndex);
				} else if (testName === 'scrollToView') {
					finish();
				}
			} catch (err) {
				finish(err);
			}
		}
		win = Ti.UI.createWindow();
		bar = Ti.UI.createScrollableView();
		bar.views = [ Ti.UI.createView(), Ti.UI.createView(), Ti.UI.createView() ];
		bar.addEventListener('scrollend', function (e) {
			try {
				should(e.currentPage).eql(nextPageIndex);
				should(bar.currentPage).eql(nextPageIndex);
				should(bar.getCurrentPage()).eql(nextPageIndex);
				doNextTest();
			} catch (err) {
				finish(err);
			}
		});
		win.add(bar);
		win.addEventListener('postlayout', function () {
			if (!testName) {
				doNextTest();
			}
		});
		win.open();
	});
});
