/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.ScrollView', function () {
	var win;
	this.timeout(5000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('apiName', function () {
		var scrollView = Ti.UI.createScrollView({});
		should(scrollView).have.readOnlyProperty('apiName').which.is.a.String;
		should(scrollView.apiName).be.eql('Ti.UI.ScrollView');
	});

	// FIXME Fails on Android, should default to true, but is undefined
	it.androidBroken('canCancelEvents', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.canCancelEvents).be.a.Boolean; // TODO should default to true
	});

	it.androidAndIosBroken('contentHeight', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.contentHeight).be.a.String; // defaults to undefined on Android and iOS
	});

	// Windows gives: expected '' to be a number
	it.windowsBroken('contentOffset', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.contentOffset).be.an.Object;
		should(bar.contentOffset.x).be.a.Number; // expected '' to be a number on Windows
		should(bar.contentOffset.y).be.a.Number;
	});

	it.androidAndIosBroken('contentWidth', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.contentWidth).be.a.String; // defaults to undefined on Android and iOS
	});

	// Intentionally skip on Android, not supported
	// FIXME Get working on iOS. Defaults to undefined. Is that OK?
	it.androidMissingAndIosBroken('decelerationRate', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.decelerationRate).be.a.Number; // defaults to undefined on iOS
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('disableBounce', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.disableBounce).be.a.Boolean; // iOS returns undefined, default should be false
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('horizontalBounce', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.horizontalBounce).be.a.Boolean; // iOS returns undefined, default should be false
	});

	// iOS-only property
	it.ios('maxZoomScale', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.maxZoomScale).be.a.Number;
	});

	// iOS-only property
	it.ios('minZoomScale', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.minZoomScale).be.a.Number;
	});

	// Android-only property
	it.android('overScrollMode', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.overScrollMode).be.a.Number;
	});

	// Android and iOS only
	it.windowsMissing('refreshControl', function () {
		var refreshControl = Ti.UI.createRefreshControl({
			title: Ti.UI.createAttributedString({ text: 'Refreshing' }),
			tintColor: 'red'
		});
		var bar = Ti.UI.createScrollView({
			refreshControl: refreshControl
		});
		should(bar.refreshControl).be.eql(refreshControl);
	});

	// Intentionally skip on Android, not supported
	// FIXME Get working on iOS. Defaults to undefined, is that OK?
	it.androidMissingAndIosBroken('scrollIndicatorStyle', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollIndicatorStyle).be.a.Number; // defaults to undefined on iOS
	});

	it('scrollingEnabled', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollingEnabled).be.a.Boolean;
		bar.scrollingEnabled = false;
		should(bar.scrollingEnabled).be.eql(false);
	});

	// Android-only property
	it.android('scrollType', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollType).not.exist; // undefined by default
	});

	// FIXME Fix on Android and iOS
	it.androidAndIosBroken('showHorizontalScrollIndicator', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.showHorizontalScrollIndicator).be.a.Boolean; // defaults to undefined on Android, docs say default to false
	});

	// FIXME Fix on Android and iOS
	it.androidAndIosBroken('showVerticalScrollIndicator', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.showVerticalScrollIndicator).be.a.Boolean; // defaults to undefined on Android, docs say default to false
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('verticalBounce', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.verticalBounce).be.a.Boolean; // iOS returns undefined, default should be false
	});

	// Intentionally skip on Android, not supported
	it.androidMissing('zoomScale', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.zoomScale).be.a.Number;
	});

	it('#scrollTo()', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollTo).be.a.Function;
	});

	it('#scrollToBottom()', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollToBottom).be.a.Function;
	});

	it('#scrollToTop()', function () {
		var bar = Ti.UI.createScrollView({});
		should(bar.scrollToTop).be.a.Function;
	});

	it('add-insert-remove', function () {
		var scrollView = Ti.UI.createScrollView({ layout: 'vertical' });
		var view1 = Ti.UI.createView();
		var view2 = Ti.UI.createView();
		scrollView.add(view1);
		should(scrollView.children.length).be.eql(1);
		scrollView.insertAt({ position: 0, view: view2 });
		should(scrollView.children.length).be.eql(2);
		should(scrollView.children[0]).be.eql(view2);
		should(scrollView.children[1]).be.eql(view1);
		scrollView.remove(view1);
		should(scrollView.children.length).be.eql(1);
		should(scrollView.children[0]).be.eql(view2);
		scrollView.removeAllChildren();
		should(scrollView.children.length).be.eql(0);
	});

	// Verify ScrollView shrinks width/height-wise to just fit its contents.
	it('Ti.UI.SIZE', function (finish) {
		this.slow(5000);
		this.timeout(20000);
		win = Ti.UI.createWindow();
		var scrollView = Ti.UI.createScrollView({
			layout: 'vertical',
			showHorizontalScrollIndicator: false,
			shorVerticalScrollIndicator: true,
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE
		});
		scrollView.add(Ti.UI.createLabel({ text: 'Test' }));
		scrollView.addEventListener('postlayout', function () {
			try {
				should(scrollView.size.width < (win.size.width / 2)).be.eql(true);
				should(scrollView.size.height < (win.size.height / 2)).be.eql(true);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(scrollView);
		win.open();
	});
});
