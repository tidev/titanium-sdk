/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS */
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

	it('contentOffset', function (finish) {
		const win = Ti.UI.createWindow();
		const scrollView = Ti.UI.createScrollView({
			layout: 'vertical',
			backgroundColor: 'white',
			width: Ti.UI.FILL,
			height: Ti.UI.FILL
		});
		const view_a = Ti.UI.createView({
			backgroundColor: 'red',
			width: '100%',
			height: '100%'
		});
		const view_b = Ti.UI.createView({
			backgroundColor: 'green',
			width: '100%',
			height: '100%'
		});

		win.addEventListener('open', () => {

			should(scrollView.contentOffset).be.an.Object();
			should(scrollView.contentOffset.x).be.a.Number();
			should(scrollView.contentOffset.y).be.a.Number();

			should(scrollView.contentOffset.x).eql(0);
			should(scrollView.contentOffset.y).eql(0);

			const point = { x: 0, y: '10dp' };
			if (OS_IOS) {
				scrollView.setContentOffset(point, { animated: false });
			} else {
				scrollView.contentOffset = point;
			}

			setTimeout(() => {
				should(scrollView.contentOffset.x).eql(0);
				should(scrollView.contentOffset.y).equalOneOf([ 10, '10dp' ]);

				finish();
			}, 50);

		});

		scrollView.add([
			view_a,
			view_b
		]);

		win.add(scrollView);
		win.open();
	});

	it.ios('#setContentOffset', function (finish) {
		win = Ti.UI.createWindow();
		const bar = Ti.UI.createScrollView({});
		win.add(bar);
		win.addEventListener('postlayout', function listener(e) {
			win.removeEventListener(e.type, listener);
			try {
				bar.setContentOffset({ x: 0, y: 0 }, { animated: true });
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
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

	it.androidMissing('#setZoomScale', function (finish) {
		win = Ti.UI.createWindow();
		const bar = Ti.UI.createScrollView({});
		win.add(bar);
		win.addEventListener('postlayout', function listener(e) {
			win.removeEventListener(e.type, listener);
			try {
				bar.setZoomScale(2, { animated: true });
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
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

	// === Regression tests for the feat/android-scrollview-contentinset fixes ===

	// Regression: the scroll event payload dropped contentSize. It must be present
	// (an object with numeric width/height) on every scroll event.
	it.android('scroll event includes contentSize (vertical)', function (finish) {
		this.timeout(8000);
		win = Ti.UI.createWindow();
		const scrollView = Ti.UI.createScrollView({
			layout: 'vertical',
			width: 300,
			height: 300,
			contentHeight: 2000,
			showVerticalScrollIndicator: true
		});
		scrollView.add(Ti.UI.createView({ height: 2000, backgroundColor: 'red' }));
		let done = false;
		scrollView.addEventListener('scroll', function (e) {
			if (done) return;
			try {
				should(e.contentSize).be.an.Object();
				should(e.contentSize.width).be.a.Number();
				should(e.contentSize.height).be.a.Number();
				done = true;
				finish();
			} catch (err) {
				done = true;
				finish(err);
			}
		});
		win.addEventListener('open', function () {
			scrollView.scrollTo(0, 100);
		});
		win.add(scrollView);
		win.open();
		setTimeout(function () {
			if (!done) {
				done = true;
				finish(new Error('scroll event with contentSize never fired'));
			}
		}, 6000);
	});

	// Regression: the horizontal onScrollChanged used xDimension (the raw touch
	// coordinate, null until the first touch) instead of offsetX, so a programmatic
	// scrollTo before any touch NPE'd and the reported x was the touch position. The
	// event must fire with numeric x/y and contentSize after a programmatic scroll.
	it.android('horizontal scroll event reports numeric x and contentSize (no NPE before touch)', function (finish) {
		this.timeout(8000);
		win = Ti.UI.createWindow();
		const scrollView = Ti.UI.createScrollView({
			scrollType: 'horizontal',
			width: 300,
			height: 300,
			contentWidth: 2000,
			showHorizontalScrollIndicator: true
		});
		scrollView.add(Ti.UI.createView({ width: 2000, backgroundColor: 'blue' }));
		let done = false;
		scrollView.addEventListener('scroll', function (e) {
			if (done) return;
			try {
				should(e.x).be.a.Number();
				should(e.y).be.a.Number();
				should(e.contentSize).be.an.Object();
				should(e.contentSize.width).be.a.Number();
				should(e.contentSize.height).be.a.Number();
				done = true;
				finish();
			} catch (err) {
				done = true;
				finish(err);
			}
		});
		win.addEventListener('open', function () {
			// programmatic scroll BEFORE any touch — previously threw NPE
			scrollView.scrollTo(100, 0);
		});
		win.add(scrollView);
		win.open();
		setTimeout(function () {
			if (!done) {
				done = true;
				finish(new Error('horizontal scroll event never fired'));
			}
		}, 6000);
	});

	// Regression: scrollToBottom() was rewritten to a vertical-only scroll, so it did
	// nothing on a horizontal scroll view. It must move contentOffset.x past 0.
	it.android('scrollToBottom() reaches the right edge for horizontal scrollType', function (finish) {
		this.timeout(8000);
		win = Ti.UI.createWindow();
		const scrollView = Ti.UI.createScrollView({
			scrollType: 'horizontal',
			width: 300,
			height: 300,
			contentWidth: 2000,
			showHorizontalScrollIndicator: true
		});
		scrollView.add(Ti.UI.createView({ width: 2000, backgroundColor: 'green' }));
		win.addEventListener('open', function () {
			// give the layout a tick to settle, then scroll to the rightmost edge
			setTimeout(function () {
				scrollView.scrollToBottom();
				setTimeout(function () {
					try {
						should(scrollView.contentOffset).be.an.Object();
						should(scrollView.contentOffset.x).be.a.Number();
						should(scrollView.contentOffset.x).be.greaterThan(0);
						finish();
					} catch (err) {
						finish(err);
					}
				}, 300);
			}, 300);
		});
		win.add(scrollView);
		win.open();
	});

	// Regression: clearing contentInset with {} left the previously-applied padding
	// in place (the early-return skipped setPadding). The getter must report all zeros
	// after clearing.
	it.android('contentInsets round-trip and reset to zero when cleared', function () {
		const scrollView = Ti.UI.createScrollView({});
		scrollView.contentInsets = { top: 20, bottom: 20, left: 10, right: 10 };
		const insets = scrollView.contentInsets;
		should(insets).be.an.Object();
		should(insets.top).eql(20);
		should(insets.bottom).eql(20);
		should(insets.left).eql(10);
		should(insets.right).eql(10);
		// clearing with an empty dict must reset every inset to zero
		scrollView.contentInsets = {};
		const cleared = scrollView.contentInsets;
		should(cleared.top).eql(0);
		should(cleared.bottom).eql(0);
		should(cleared.left).eql(0);
		should(cleared.right).eql(0);
	});

	// Regression: the generic scrollIndicatorInsets property was a no-op (it never set
	// hasCustomScrollIndicatorProps and wrote fields the bars never read). At a minimum
	// setting it must not crash and the getters must round-trip the keys. (Axis-specific
	// and color/radius properties are exercised together as a smoke test.)
	it.android('scroll indicator properties round-trip without crashing', function () {
		const scrollView = Ti.UI.createScrollView({});

		// generic (applies to both axes); getter returns pixel ints, so just check > 0
		scrollView.scrollIndicatorInsets = { top: 5, bottom: 5, left: 5, right: 5 };
		const g = scrollView.scrollIndicatorInsets;
		should(g).be.an.Object();
		should(g.top).be.a.Number();
		should(g.top).be.greaterThan(0);

		// axis-specific (stored as the raw dict the caller set)
		scrollView.verticalScrollIndicatorInsets = { top: 8, bottom: 8, left: 8, right: 8 };
		const v = scrollView.verticalScrollIndicatorInsets;
		should(v).be.an.Object();
		should(v.top).be.a.Number();

		scrollView.horizontalScrollIndicatorInsets = { top: 8, bottom: 8, left: 8, right: 8 };
		const h = scrollView.horizontalScrollIndicatorInsets;
		should(h).be.an.Object();
		should(h.left).be.a.Number();

		// color + radius
		scrollView.scrollIndicatorColor = '#FF0000FF';
		should(scrollView.scrollIndicatorColor).be.a.String();
		scrollView.scrollIndicatorBackgroundColor = '#0000FFFF';
		should(scrollView.scrollIndicatorBackgroundColor).be.a.String();
		scrollView.scrollIndicatorRadius = 10;
		should(scrollView.scrollIndicatorRadius).eql(10);
	});

	// Regression: ensureContentWrapper reparented the inner scrollView out of the
	// SwipeRefreshLayout into a plain FrameLayout, severing the nested-scroll chain
	// and breaking pull-to-refresh when refreshControl and a custom scrollbar property
	// were both set. The scroll view must still emit scroll events in that combination
	// (i.e. the NestedScrollView is still the scrolling view).
	it.android('refreshControl + custom scroll indicator does not break scrolling', function (finish) {
		this.timeout(8000);
		win = Ti.UI.createWindow();
		const refreshControl = Ti.UI.createRefreshControl({});
		const scrollView = Ti.UI.createScrollView({
			layout: 'vertical',
			width: 300,
			height: 300,
			contentHeight: 2000,
			refreshControl: refreshControl,
			scrollIndicatorInsets: { top: 10, bottom: 10, left: 10, right: 10 },
			scrollIndicatorColor: '#FF0000FF',
			showVerticalScrollIndicator: true
		});
		scrollView.add(Ti.UI.createView({ height: 2000, backgroundColor: 'yellow' }));
		let done = false;
		scrollView.addEventListener('scroll', function (e) {
			if (done) return;
			try {
				should(e.contentSize).be.an.Object();
				should(e.contentSize.height).be.a.Number();
				done = true;
				finish();
			} catch (err) {
				done = true;
				finish(err);
			}
		});
		win.addEventListener('open', function () {
			scrollView.scrollTo(0, 100);
		});
		win.add(scrollView);
		win.open();
		setTimeout(function () {
			if (!done) {
				done = true;
				finish(new Error('scroll never fired with refreshControl + custom indicator'));
			}
		}, 6000);
	});

	// Regression: scrollIndicatorInsets used TiConvert.parseFloat which silently turned
	// unit-suffixed strings like '12dp' into 0 (contentInset accepted them). Setting a
	// dimension string must now yield a non-zero inset.
	it.android('scrollIndicatorInsets accepts dimension strings (e.g. 12dp)', function () {
		const scrollView = Ti.UI.createScrollView({});
		scrollView.scrollIndicatorInsets = { top: '12dp', bottom: '12dp', left: '12dp', right: '12dp' };
		const g = scrollView.scrollIndicatorInsets;
		should(g).be.an.Object();
		// 12dp resolves to 12*density px, which is > 0 on every density (previously 0).
		should(g.top).be.a.Number();
		should(g.top).be.greaterThan(0);
		should(g.left).be.greaterThan(0);
		should(g.right).be.greaterThan(0);
		should(g.bottom).be.greaterThan(0);
	});

	// Regression: contentSize() added only top/bottom insets to the height, omitting
	// left/right from the width — so a horizontal ScrollView with left/right contentInset
	// reported a contentSize.width that was too small. After adding left/right insets the
	// reported width must grow.
	it.android('contentSize width includes left/right contentInset (horizontal)', function (finish) {
		this.timeout(8000);
		win = Ti.UI.createWindow();
		const scrollView = Ti.UI.createScrollView({
			scrollType: 'horizontal',
			width: 300,
			height: 300,
			contentWidth: 2000,
			showHorizontalScrollIndicator: true
		});
		scrollView.add(Ti.UI.createView({ width: 2000, backgroundColor: 'purple' }));
		let widthWithout = null;
		let widthWith = null;
		let phase = 0;
		scrollView.addEventListener('scroll', function (e) {
			try {
				should(e.contentSize).be.an.Object();
				should(e.contentSize.width).be.a.Number();
				if (phase === 0) {
					widthWithout = e.contentSize.width;
					// now add left/right contentInset and scroll again
					scrollView.contentInsets = { left: 60, right: 60 };
					phase = 1;
					setTimeout(function () { scrollView.scrollTo(200, 0); }, 100);
				} else if (phase === 1 && widthWith === null) {
					widthWith = e.contentSize.width;
					should(widthWith).be.greaterThan(widthWithout);
					finish();
				}
			} catch (err) {
				finish(err);
			}
		});
		win.addEventListener('open', function () {
			scrollView.scrollTo(100, 0);
		});
		win.add(scrollView);
		win.open();
	});

	// Regression: getScrollIndicatorInsets() read only the generic cache and returned stale
	// values after a per-axis override (the axis-specific setters did not mirror back). After
	// setVerticalScrollIndicatorInsets, the generic getter must reflect the override.
	it.android('getScrollIndicatorInsets reflects per-axis override', function () {
		const scrollView = Ti.UI.createScrollView({});
		// generic zero first
		scrollView.scrollIndicatorInsets = { top: 0, bottom: 0, left: 0, right: 0 };
		should(scrollView.scrollIndicatorInsets.top).eql(0);
		// vertical override with a positive value must propagate to the generic getter
		scrollView.verticalScrollIndicatorInsets = { top: '10dp', bottom: '10dp', left: '10dp', right: '10dp' };
		const g = scrollView.scrollIndicatorInsets;
		should(g.top).be.a.Number();
		should(g.top).be.greaterThan(0); // previously stayed 0 (stale generic cache)
	});
});
