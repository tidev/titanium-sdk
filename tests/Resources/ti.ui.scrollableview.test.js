/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.ScrollableView', function () {
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

	it('apiName', () => {
		const scrollableView = Ti.UI.createScrollableView();
		should(scrollableView).have.readOnlyProperty('apiName').which.is.a.String();
		should(scrollableView.apiName).be.eql('Ti.UI.ScrollableView');
	});

	it('views', () => {
		const bar = Ti.UI.createScrollableView();
		should(bar.views).be.an.Array(); // iOS returns undefined
		should(bar.getViews).be.a.Function();
		should(bar.views).be.empty;
		should(bar.getViews()).be.empty;
		bar.views = [ Ti.UI.createView(), Ti.UI.createView() ];
		should(bar.views.length).eql(2);
		should(bar.getViews().length).eql(2);
	});

	it.windowsMissing('clipViews', function (finish) {
		this.slow(5000);
		this.timeout(5000);

		const scrollableView = Ti.UI.createScrollableView({
			clipViews: true
		});

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			should(scrollableView.clipViews).be.true();
			finish();
		});

		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const view3 = Ti.UI.createView({ id: 'view3', backgroundColor: '#48b' });

		scrollableView.setViews([ view1, view2, view3 ]);

		win.add(scrollableView);
		win.open();
	});

	// TODO: Add parity?
	it.android('padding', function (finish) {
		this.slow(5000);
		this.timeout(5000);

		const scrollableView = Ti.UI.createScrollableView({
			padding: { left: 20, right: 20 }
		});

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			should(scrollableView.padding).be.an.Object();
			should(scrollableView.padding.left).eql(20);
			should(scrollableView.padding.right).eql(20);
			finish();
		});

		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const view3 = Ti.UI.createView({ id: 'view3', backgroundColor: '#48b' });

		scrollableView.setViews([ view1, view2, view3 ]);

		win.add(scrollableView);
		win.open();
	});

	// FIXME explicitly setting currentPage doesn't seem to update value on Android
	it.androidBroken('currentPage', function () {
		const bar = Ti.UI.createScrollableView({});
		should(bar.currentPage).be.a.Number();
		should(bar.getCurrentPage).be.a.Function();
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
					should(bar.moveNext).be.a.Function();
					bar.moveNext();
				} else if (testName === 'moveNext') {
					testName = 'movePrevious';
					Ti.API.info('Testing ScrollableView.movePrevious()');
					nextPageIndex = bar.currentPage - 1;
					should(bar.movePrevious).be.a.Function();
					bar.movePrevious();
				} else if (testName === 'movePrevious') {
					testName = 'scrollToView';
					Ti.API.info('Testing ScrollableView.scrollToView()');
					nextPageIndex = 2;
					should(bar.scrollToView).be.a.Function();
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

	it.ios('preferredIndicatorImage', function (finish) {
		if (OS_VERSION_MAJOR < 14) {
			return finish();
		}

		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const backwardImage = Ti.UI.iOS.systemImage('backward');
		const forwardImage = Ti.UI.iOS.systemImage('forward');
		const scrollableView = Ti.UI.createScrollableView({
			preferredIndicatorImage: backwardImage,
			views: [ view1, view2 ],
			showPagingControl: true
		});

		// must set a bg color so don't have full alpha, or else image compare doesn't work as intended
		win = Ti.UI.createWindow({ extendSafeArea: false, backgroundColor: 'orange' });
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			try {
				const preferredBackwardImage = win.toImage();
				scrollableView.preferredIndicatorImage = forwardImage;
				should(win).not.matchImage(preferredBackwardImage, { threshold: 0 });

				scrollableView.preferredIndicatorImage = backwardImage;
				should(win).matchImage(preferredBackwardImage, { threshold: 0 });
			} catch (error) {
				return finish(error);
			}

			finish();
		});

		win.add(scrollableView);
		win.open();
	});

	it.ios('setIndicatorImageForPage', function (finish) {
		if (OS_VERSION_MAJOR < 14) {
			return finish();
		}
		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const image = Ti.UI.iOS.systemImage('backward');
		const scrollableView = Ti.UI.createScrollableView({
			views: [ view1, view2 ],
			showPagingControl: true,
		});

		// must set a bg color so don't have full alpha, or else image compare doesn't work as intended
		win = Ti.UI.createWindow({ extendSafeArea: false, backgroundColor: 'orange' });
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			try {
				const defaultImage = win.toImage();
				scrollableView.setIndicatorImageForPage(image, 1);
				should(win).not.matchImage(defaultImage, { threshold: 0 });

				scrollableView.setIndicatorImageForPage(null, 1); // null will change to default
				should(win).matchImage(defaultImage, { threshold: 0 });
			} catch (error) {
				return finish(error);
			}
			finish();
		});

		win.add(scrollableView);
		win.open();
	});
});
