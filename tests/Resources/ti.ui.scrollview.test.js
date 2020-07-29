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

describe('Titanium.UI.ScrollView', function () {
	let win;
	this.timeout(5000);

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

	it('apiName', function () {
		const scrollView = Ti.UI.createScrollView({});
		should(scrollView).have.readOnlyProperty('apiName').which.is.a.String();
		should(scrollView.apiName).be.eql('Ti.UI.ScrollView');
	});

	// FIXME Fails on Android, should default to true, but is undefined
	it.androidBroken('canCancelEvents', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.canCancelEvents).be.a.Boolean(); // TODO should default to true
	});

	it.androidAndIosBroken('contentHeight', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.contentHeight).be.a.String(); // defaults to undefined on Android and iOS
	});

	// Windows gives: expected '' to be a number
	it.windowsBroken('contentOffset', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.contentOffset).be.an.Object();
		should(bar.contentOffset.x).be.a.Number(); // expected '' to be a number on Windows
		should(bar.contentOffset.y).be.a.Number();
	});

	it.androidAndIosBroken('contentWidth', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.contentWidth).be.a.String(); // defaults to undefined on Android and iOS
	});

	// Intentionally skip on Android, not supported
	// FIXME Get working on iOS. Defaults to undefined. Is that OK?
	it.androidMissingAndIosBroken('decelerationRate', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.decelerationRate).be.a.Number(); // defaults to undefined on iOS
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('disableBounce', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.disableBounce).be.a.Boolean(); // iOS returns undefined, default should be false
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('horizontalBounce', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.horizontalBounce).be.a.Boolean(); // iOS returns undefined, default should be false
	});

	// iOS-only property
	it.ios('maxZoomScale', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.maxZoomScale).be.a.Number();
	});

	// iOS-only property
	it.ios('minZoomScale', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.minZoomScale).be.a.Number();
	});

	// Android-only property
	it.android('overScrollMode', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.overScrollMode).be.a.Number();
	});

	// Android and iOS only
	it.windowsMissing('refreshControl', function () {
		const refreshControl = Ti.UI.createRefreshControl({
			title: Ti.UI.createAttributedString({ text: 'Refreshing' }),
			tintColor: 'red'
		});
		const bar = Ti.UI.createScrollView({
			refreshControl: refreshControl
		});
		should(bar.refreshControl).be.eql(refreshControl);
	});

	// Intentionally skip on Android, not supported
	// FIXME Get working on iOS. Defaults to undefined, is that OK?
	it.androidMissingAndIosBroken('scrollIndicatorStyle', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.scrollIndicatorStyle).be.a.Number(); // defaults to undefined on iOS
	});

	it('scrollingEnabled', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.scrollingEnabled).be.a.Boolean();
		bar.scrollingEnabled = false;
		should(bar.scrollingEnabled).be.false();
	});

	// Android-only property
	it.android('scrollType', function () {
		const bar = Ti.UI.createScrollView({});
		should.not.exist(bar.scrollType); // undefined by default
	});

	// FIXME Fix on Android and iOS
	it.androidAndIosBroken('showHorizontalScrollIndicator', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.showHorizontalScrollIndicator).be.a.Boolean(); // defaults to undefined on Android, docs say default to false
	});

	// FIXME Fix on Android and iOS
	it.androidAndIosBroken('showVerticalScrollIndicator', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.showVerticalScrollIndicator).be.a.Boolean(); // defaults to undefined on Android, docs say default to false
	});

	// FIXME Get working on IOS
	// Intentionally skip on Android, property not supported
	it.androidMissingAndIosBroken('verticalBounce', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.verticalBounce).be.a.Boolean(); // iOS returns undefined, default should be false
	});

	// Intentionally skip on Android, not supported
	it.androidMissing('zoomScale', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.zoomScale).be.a.Number();
	});

	it('#scrollTo()', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.scrollTo).be.a.Function();
	});

	it('#scrollToBottom()', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.scrollToBottom).be.a.Function();
	});

	it('#scrollToTop()', function () {
		const bar = Ti.UI.createScrollView({});
		should(bar.scrollToTop).be.a.Function();
	});

	it('add-insert-remove', function () {
		const scrollView = Ti.UI.createScrollView({ layout: 'vertical' });
		const view1 = Ti.UI.createView();
		const view2 = Ti.UI.createView();
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
		const scrollView = Ti.UI.createScrollView({
			layout: 'vertical',
			showHorizontalScrollIndicator: false,
			shorVerticalScrollIndicator: true,
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE
		});
		scrollView.add(Ti.UI.createLabel({ text: 'Test' }));
		function postlayout() {
			scrollView.removeEventListener('postlayout', postlayout);
			try {
				should(scrollView.size.width < (win.size.width / 2)).be.be.true();
				should(scrollView.size.height < (win.size.height / 2)).be.be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		}
		scrollView.addEventListener('postlayout', postlayout);
		win.add(scrollView);
		win.open();
	});
});
