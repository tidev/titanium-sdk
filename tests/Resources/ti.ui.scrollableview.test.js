/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.ScrollableView', () => {

	let win;
	let scrollableView;
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

	describe('properties', () => {
		describe('.apiName', () => {
			beforeEach(() => {
				scrollableView = Ti.UI.createScrollableView();
			});

			it('is a read-only String', () => {
				should(scrollableView).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.UI.ScrollableView\'', () => {
				should(scrollableView.apiName).be.eql('Ti.UI.ScrollableView');
			});
		});

		describe.windowsMissing('.clipViews', () => {
			beforeEach(() => {
				scrollableView = Ti.UI.createScrollableView({
					clipViews: true
				});
			});

			it('is a Boolean', () => {
				should(scrollableView).have.property('clipViews').which.is.a.Boolean();
			});

			it('equal to the value passed in creation dictionary', () => {
				should(scrollableView.clipViews).be.true();
			});

			it('can be assigned a Boolean value', () => {
				scrollableView.clipViews = false;
				should(scrollableView.clipViews).be.false();
			});

			it('has no accessors', () => {
				should(scrollableView).not.have.accessors('clipViews');
			});

			it('lifecycle', function (finish) {
				this.timeout(5000);

				win = Ti.UI.createWindow();
				win.addEventListener('open', () => {
					try {
						should(scrollableView.clipViews).be.true();
					} catch (err) {
						return finish(err);
					}
					finish();
				});

				const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
				const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
				const view3 = Ti.UI.createView({ id: 'view3', backgroundColor: '#48b' });

				scrollableView.views = [ view1, view2, view3 ];

				win.add(scrollableView);
				win.open();
			});
		});

		describe('.currentPage', () => {
			beforeEach(() => {
				scrollableView = Ti.UI.createScrollableView({});
			});

			it('is a Number', () => {
				should(scrollableView).have.property('currentPage').which.is.a.Number();
			});

			it('defaults to 0', () => {
				should(scrollableView.currentPage).eql(0);
			});

			it('can be assigned an Integer value', () => {
				scrollableView.views = [ Ti.UI.createView(), Ti.UI.createView() ];
				scrollableView.currentPage = 1;
				should(scrollableView.currentPage).eql(1);
			});

			it('has no accessors', () => {
				should(scrollableView).not.have.accessors('currentPage');
			});
		});

		// TODO: Add parity?
		describe.android('.padding', () => {
			beforeEach(() => {
				scrollableView = Ti.UI.createScrollableView({
					padding: { left: 20, right: 20 }
				});
			});

			it('is an Object', () => {
				should(scrollableView).have.property('padding').which.is.an.Object();
			});

			it('equal to value passed in creation dictionary', () => {
				should(scrollableView.padding).eql({ left: 20, right: 20 });
			});

			it('can be assigned an Object value', () => {
				scrollableView.padding = { left: 10, right: 10 };
				should(scrollableView.padding).eql({ left: 10, right: 10 });
			});

			it('has no accessors', () => {
				should(scrollableView).not.have.accessors('padding');
			});

			it('lifecycle', function (finish) {
				this.timeout(5000);

				win = Ti.UI.createWindow();
				win.addEventListener('open', () => {
					try {
						should(scrollableView.padding).be.an.Object();
						should(scrollableView.padding.left).eql(20);
						should(scrollableView.padding.right).eql(20);
					} catch (err) {
						return finish(err);
					}
					finish();
				});

				const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
				const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
				const view3 = Ti.UI.createView({ id: 'view3', backgroundColor: '#48b' });

				scrollableView.views = [ view1, view2, view3 ];

				win.add(scrollableView);
				win.open();
			});
		});

		it.ios('.preferredIndicatorImage', function (finish) {
			if (OS_VERSION_MAJOR < 14) {
				return finish();
			}
			this.timeout(5000);

			const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
			const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
			const backwardImage = Ti.UI.iOS.systemImage('backward');
			const forwardImage = Ti.UI.iOS.systemImage('forward');
			scrollableView = Ti.UI.createScrollableView({
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

		describe('.views', () => {
			it('is an Array', () => {
				scrollableView = Ti.UI.createScrollableView();
				should(scrollableView).have.property('views').which.is.an.Array();
			});

			it('defaults to empty Array', () => {
				scrollableView = Ti.UI.createScrollableView();
				should(scrollableView.views).be.empty();
			});

			it('assigned during creation', () => {
				scrollableView = Ti.UI.createScrollableView({
					views: [ Ti.UI.createView(), Ti.UI.createView(), Ti.UI.createView() ]
				});
				should(scrollableView.views.length).eql(3);
			});

			it('assigned after creation', () => {
				scrollableView = Ti.UI.createScrollableView();
				scrollableView.views = [ Ti.UI.createView(), Ti.UI.createView() ];
				should(scrollableView.views.length).eql(2);
			});

			it('update after creation', () => {
				scrollableView = Ti.UI.createScrollableView({
					views: [ Ti.UI.createView(), Ti.UI.createView() ]
				});
				scrollableView.views = scrollableView.views.concat(Ti.UI.createView(), Ti.UI.createView());
				should(scrollableView.views.length).eql(4);
			});

			it('has no accessors', () => {
				scrollableView = Ti.UI.createScrollableView();
				should(scrollableView).not.have.accessors('views');
			});
		});
	});

	describe('methods', () => {
		it.androidAndWindowsBroken('#moveX()/#scrollToView()', function (finish) {
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

		it.ios('#setIndicatorImageForPage()', function (finish) {
			if (OS_VERSION_MAJOR < 14) {
				return finish();
			}
			this.timeout(5000);

			const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
			const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
			const image = Ti.UI.iOS.systemImage('backward');
			scrollableView = Ti.UI.createScrollableView({
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
});
